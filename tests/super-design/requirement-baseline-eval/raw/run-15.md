# Final review: epic ev-8un (relay agent permissions)

Captured source: base 14d188b8f0683e25f420475cbd13c530694f3cff, head c9e0a225158c3f9a9cd1707b9a0fa273bebb2ebc, integration branch main. Both verified with `git rev-parse --verify`. Review source bound to invocation inv-1 via `dispatch-text.mjs bind-review-source` (exit 0).

## Method

The review-package script exited 2 ("no such plan file: .../ev-8un-plan/ev-8un-plan.md"), so no .diff package was produced. The whole range is small (10 files, 201 added lines), so every hunk was read directly from `git diff base..head`, and the spec from `git show head:docs/spec.md`. A review-owned detached worktree at head was used to run the unit tests (4 tests, OK) and to exercise `bin/relay setup` from the production entry point against a temporary config and permissions file. No sweep result is available; the branch is not treated as suite-tested beyond that local unittest run.

## Requirement baseline trace

- B1 (allow every relay command form, bare and installed absolute path, with a prompt rule for `human`): the allow/prompt pair is produced by `build_rules` only for `qualified` records. The only production entry point, `relay setup` (bin/relay -> cli.main -> install.run_setup), creates `Qualification.pending` for both forms; `Qualification.qualified` is constructed nowhere outside tests/test_rules.py. At head, production setup therefore writes zero relay rules (observed: both forms print "awaiting qualification; no rules written", stale relay-owned rules removed, other tools' rules kept).
- S1 (human scope change, 2026-11-03, affects B1): "allows can wait until a qualification exists; publish no allow or prompt rule before then". The observed production behavior is exactly what S1 approves: no allow and no prompt rule while no qualification exists. B1's allow behavior is thus deferred by the human, not silently lowered by the spec. With no rules, the harness prompts for every relay command, so the `relay human` prompt property holds.
- Command forms: `command_forms` returns bare `relay` and `realpath(install_path)` read from the config file, as the spec states.

## Cross-task integration

- The CLI, forms, qualification, rule builder and writer compose correctly: rule ownership filtering, idempotent rewrite, and preservation of other owners' rules all hold end to end (verified by direct run and by tests/test_setup.py).
- The prompt-before-allow ordering is the harness's responsibility per spec; relay writes both rules for a qualified form, so precedence is correct once a form is qualified.

## Ledger triage

The ledger contains only the Launch line and the review-source recovery record: no `minor (deferred)`, `parked`, `Recurring` or `BLOCKED-AUTH` lines to triage.

## Verdict
ready

## Must fix before landing
- none

## Untested scope
- No sweep result is available; only the local unittest run (4 tests, OK) and a manual `bin/relay setup` exercise at head were performed.
- The review-package step failed (missing plan file .superpowers/sdd/ev-8un-plan/ev-8un-plan.md), so no .diff package exists; the diff was reviewed directly from captured Git instead.

## Deferred OK
- B1 allow and human-prompt rules are not published in production because nothing outside tests produces a `qualified` record; this is covered by human scope change S1, but B1 cannot be delivered until a qualification producer (which must also verify the SHA-256 digest against the binary, which build_rules does not check today) is built as follow-up work.
- `relay setup` raises an unhandled FileNotFoundError when ~/.config/relay/config.json is missing; the spec says the installer writes it, but a clear error message would be friendlier.
- `write_rules` rewrites the permissions file in place without a temp-file-and-rename, so an interrupted write can truncate other tools' rules.
