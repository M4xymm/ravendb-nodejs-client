# Checklist format

The task description is written by `publish-youtrack.mjs` from ravendb-client-migration. Items are grouped under `### <name>` headers (a release like `7.2.6` or a range like `2026-09-25_51f60da018..4edfd04425`).

## Item line

```
- [PR #23581](https://github.com/ravendb/ravendb/pull/23581) RavenDB-22083 Report a proper IndexCompilationException `RavenDB-22083-PR23581.patch`
  - [ ] node.js
  - [ ] python
  - [ ] java
```

Regex (one line):

```
^- \[(?:PR #(\d+)|commit ([0-9a-f]{10}))\]\((https://github\.com/ravendb/ravendb/(?:pull/\d+|commit/[0-9a-f]{7,40}))\) (.+?)( \(carrier\))? `([^`]+)`$
```

Groups: C# PR number or commit sha10, item URL, C# title, carrier marker, attachment file name. The client lines are the following lines that start with two spaces and `- `. Lines may end with `\r`.

- `(carrier)`: a merge PR that also carried its own commits; the patch holds only those commits. Port it like any item and say so in the PR description.
- Commit items (`commit <sha10>`) are client changes pushed without a PR.

## node.js line states

| State | Line | What the skill does |
|---|---|---|
| todo | `  - [ ] node.js` | candidate for this run |
| in progress | `  - [ ] node.js: [PR #597](https://github.com/ravendb/ravendb-nodejs-client/pull/597)` | check the PR: merged -> `done` and cleanup; closed without merge -> report; open -> skip |
| done | `  - [x] node.js: [PR #597](https://github.com/ravendb/ravendb-nodejs-client/pull/597)` | skip |
| n/a | `  - [x] node.js: n/a (<reason>)` | skip |
| ticked by hand | `  - [x] node.js` | skip |
| unknown | any other `node.js` line, or no `node.js` line | skip and list under the report |

## Writing to the task

Only through `scripts/checklist.mjs`, run from the Node.js repo root:

```
node .claude/skills/ravendb-sdk-sync/scripts/checklist.mjs link --issue <ID|link> --item <item URL> --pr https://github.com/ravendb/ravendb-nodejs-client/pull/<n>
node .claude/skills/ravendb-sdk-sync/scripts/checklist.mjs done --issue <ID|link> --item <item URL>
node .claude/skills/ravendb-sdk-sync/scripts/checklist.mjs na   --issue <ID|link> --item <item URL> --reason "<one line, no backticks or square brackets>"
```

- `link`: todo -> in progress. `done`: in progress -> done. `na`: todo -> n/a.
- The script reads the description right before writing, changes only that item's `node.js` line and prints `Task <ID>: <before> -> <after>`.
- `--dry-run` reads and prints without writing. Use it when showing the user what a gated write will do.
- Any other state, a missing or duplicated item, or a missing `node.js` line: exit code 1 and nothing written.
- Needs `YOUTRACK_TOKEN` in the environment.
