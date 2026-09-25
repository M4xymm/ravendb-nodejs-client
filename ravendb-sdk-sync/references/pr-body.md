# PR description

The PR description follows `.github/pull_request_template.md` of the Node.js repo. Keep every heading and every checkbox of the template; tick the boxes that apply. Write the Description as short bullet points, like the maintainer's recent PRs (for example #596). Write the body to `%TEMP%\rdbc-sync\<branch>\pr-body.md` (never inside a worktree or the main checkout) and pass it with `gh pr create --body-file`.

## How to fill it

- **Issue link**: the task URL, e.g. `https://issues.hibernatingrhinos.com/issue/RDBC-1128`.
- **Description** bullets, in this order:
  - `Port of [PR #<n>](<C# PR URL>) <C# title>` (for commit items: `Port of [commit <sha10>](<URL>) <title>`)
  - what the port changes in the Node.js client, one or two bullets
  - `Carrier PR: only its own commits are ported` when the item is marked `(carrier)`
  - tests ported (`RavenDB_<n>.<Test>` -> file) and tests not ported with the reason
  - skipped hunks (server-side files)
  - `Depends on` notes, if any
  - local checks: prepare, lint, check-exports, ported tests, check-imports (from the port result)
  - fork CI: links to the `tests/node` and `tests/bun` runs
  - a final `#### Release notes draft` subsection with the draft from the port result
- **Type of change**: tick `Sync with the C# client` and replace `(version \`x.y.z\` -> \`x.y.z\`)` with `(no version bump, versions are bumped at release)`.
- **Target branch and backports**: tick `This PR targets the correct release branch` and `No other release branch is affected`.
- **How risky is the change?**: judge from the diff; one-sentence reason in the Description when it is not Low.
- **Backward compatibility**: `Non breaking change` unless the port result lists breaking changes; then `Breaking change` with the migration path.
- **Server compatibility**: `Works with all RavenDB server versions covered by CI` when fork CI is green on the 6.2, 7.1 and 7.2 matrix; otherwise say which version is required.
- **Affected runtimes**: `Not runtime specific` unless the port touches runtime-specific code.
- **Public API**: `New or changed public API` when exports changed (and check-exports passed), otherwise `No public API changes`. Never tick `Version bump`.
- **Documentation update**: `README.md has been updated` or `No documentation update is needed`, from the port result.
- **Testing by Contributor**: tick only what actually happened: ported tests added, `npm run lint`, `npm run build` (run as `npm run prepare`), `npm run check-exports` and `npm run check-imports` pass locally, tests run locally against the RavenDB server.
- **Dependencies**: `No dependency changes` unless `package.json` dependencies changed.
- **Existing behavior change**: `No`, or `Yes` with the affected features.
