#!/usr/bin/env node
/**
 * Updates the node.js line of one item in a YouTrack task checklist written by ravendb-client-migration.
 * Reads the description right before writing and changes exactly one line.
 *
 * Usage:
 *   node checklist.mjs <link|done|na> --issue <ID|link> --item <C# PR or commit URL>
 *     [--pr <Node.js PR URL>] [--reason "<text>"] [--dry-run]
 *
 * Environment: YOUTRACK_TOKEN (required), YOUTRACK_URL (default https://issues.hibernatingrhinos.com).
 */

const DEFAULT_URL = "https://issues.hibernatingrhinos.com";
const USAGE = "Usage: node checklist.mjs <link|done|na> --issue <ID|link> --item <C# PR or commit URL> [--pr <Node.js PR URL>] [--reason \"<text>\"] [--dry-run]";
const ISSUE_ID = /^[A-Za-z]+-\d+$/;
const ISSUE_URL = /\/issue\/([A-Za-z]+-\d+)(?:[/?#]|$)/;
const ITEM_URL = /^https:\/\/github\.com\/ravendb\/ravendb\/(?:pull\/\d+|commit\/[0-9a-f]{7,40})$/;
const NODE_PR_URL = /^https:\/\/github\.com\/ravendb\/ravendb-nodejs-client\/pull\/(\d+)$/;
const REASON = /^[^\r\n`[\]]{1,200}$/;
const ITEM_LINE = /^- \[(?:PR #\d+|commit [0-9a-f]{10})\]\(/;
const CLIENT_LINE = /^  - /;
const NODE_LINE = /^  - \[[ x]\] node\.js(?::|$)/;
const TODO = /^  - \[ \] node\.js$/;
const IN_PROGRESS = /^  - \[ \] node\.js: \[PR #(\d+)\]\((https:\/\/github\.com\/ravendb\/ravendb-nodejs-client\/pull\/\1)\)$/;

const TRANSITIONS = {
    link: {
        from: TODO,
        expected: "  - [ ] node.js",
        to: (cfg) => `  - [ ] node.js: [PR #${cfg.prNumber}](${cfg.pr})`,
    },
    done: {
        from: IN_PROGRESS,
        expected: "  - [ ] node.js: [PR #<n>](https://github.com/ravendb/ravendb-nodejs-client/pull/<n>)",
        to: (cfg, match) => `  - [x] node.js: [PR #${match[1]}](${match[2]})`,
    },
    na: {
        from: TODO,
        expected: "  - [ ] node.js",
        to: (cfg) => `  - [x] node.js: n/a (${cfg.reason})`,
    },
};

function fail(msg) {
    console.error(`Error: ${msg}`);
    process.exit(1);
}

function parseIssueRef(input) {
    const value = (input ?? "").trim();
    if (ISSUE_ID.test(value)) return value;
    return value.match(ISSUE_URL)?.[1] ?? null;
}

function parseArgs(argv) {
    const [action, ...rest] = argv;
    if (action === "--help" || action === "-h") {
        console.log(USAGE);
        process.exit(0);
    }
    if (!Object.hasOwn(TRANSITIONS, action ?? "")) fail(`first argument must be link, done or na. ${USAGE}`);
    const args = { action, dryRun: false };
    for (let i = 0; i < rest.length; i++) {
        const a = rest[i];
        const next = () => {
            const v = rest[++i];
            if (v === undefined) fail(`Missing value for ${a}`);
            return v;
        };
        switch (a) {
            case "--issue": args.issue = next(); break;
            case "--item": args.item = next(); break;
            case "--pr": args.pr = next(); break;
            case "--reason": args.reason = next(); break;
            case "--dry-run": args.dryRun = true; break;
            default: fail(`Unknown argument: ${a}`);
        }
    }
    if (!args.issue || !args.item) fail("Required: --issue <ID|link> and --item <C# PR or commit URL>");
    args.issueId = parseIssueRef(args.issue);
    if (!args.issueId) fail(`Invalid --issue "${args.issue}": give an issue ID (e.g. RDBC-1128) or a link to the issue`);
    if (!ITEM_URL.test(args.item)) fail(`Invalid --item "${args.item}": give the C# PR or commit URL from the item line`);
    if (action === "link") {
        const match = (args.pr ?? "").match(NODE_PR_URL);
        if (!match) fail("link needs --pr https://github.com/ravendb/ravendb-nodejs-client/pull/<n>");
        args.prNumber = match[1];
    } else if (args.pr !== undefined) {
        fail("--pr is only valid with link");
    }
    if (action === "na") {
        if (!REASON.test(args.reason ?? "")) fail("na needs --reason of 1-200 characters without new lines, backticks or square brackets");
    } else if (args.reason !== undefined) {
        fail("--reason is only valid with na");
    }
    args.token = process.env.YOUTRACK_TOKEN || "";
    if (!args.token) fail("YOUTRACK_TOKEN is not set");
    args.url = (process.env.YOUTRACK_URL || DEFAULT_URL).replace(/\/+$/, "");
    return args;
}

async function youtrack(cfg, path, init = {}) {
    const res = await fetch(`${cfg.url}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${cfg.token}`, Accept: "application/json", ...init.headers },
    });
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        if (res.status === 404) throw new Error(`issue ${cfg.issueId} not found`);
        if (res.status === 401 || res.status === 403) throw new Error(`YouTrack token rejected (HTTP ${res.status}): ${body}`);
        throw new Error(`YouTrack ${res.status} ${path.split("?")[0]}: ${body}`);
    }
    return res.json();
}

function updateNodeLine(description, cfg) {
    const lines = (description ?? "").split("\n");
    const bare = (line) => line.replace(/\r$/, "");
    const needle = `](${cfg.item})`;
    const itemIndexes = lines.flatMap((line, i) => (ITEM_LINE.test(bare(line)) && bare(line).includes(needle) ? [i] : []));
    if (itemIndexes.length === 0) throw new Error(`item ${cfg.item} not found in ${cfg.issueId}`);
    if (itemIndexes.length > 1) throw new Error(`item ${cfg.item} appears ${itemIndexes.length} times in ${cfg.issueId}`);

    let nodeIndex = -1;
    for (let i = itemIndexes[0] + 1; i < lines.length && CLIENT_LINE.test(bare(lines[i])); i++) {
        if (NODE_LINE.test(bare(lines[i]))) {
            nodeIndex = i;
            break;
        }
    }
    if (nodeIndex < 0) throw new Error(`item ${cfg.item} has no node.js line`);

    const transition = TRANSITIONS[cfg.action];
    const before = bare(lines[nodeIndex]);
    const match = before.match(transition.from);
    if (!match) throw new Error(`cannot ${cfg.action} ${cfg.item}: node.js line is "${before}", expected "${transition.expected}"`);
    const after = transition.to(cfg, match);
    lines[nodeIndex] = lines[nodeIndex].endsWith("\r") ? `${after}\r` : after;
    return { description: lines.join("\n"), before, after };
}

async function main() {
    const cfg = parseArgs(process.argv.slice(2));
    const issuePath = `/api/issues/${encodeURIComponent(cfg.issueId)}`;
    const issue = await youtrack(cfg, `${issuePath}?fields=idReadable,description`);
    const change = updateNodeLine(issue.description, cfg);
    if (!cfg.dryRun) {
        await youtrack(cfg, `${issuePath}?fields=idReadable`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: change.description }),
        });
    }
    console.error(`${cfg.dryRun ? "[dry-run] " : ""}Task ${issue.idReadable}: ${change.before} -> ${change.after}`);
}

main().catch((err) => {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
});
