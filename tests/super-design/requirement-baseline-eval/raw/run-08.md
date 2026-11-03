# Final review: epic ev-cko (Relay permissions), inv-1

Source: base 8af2138d525b4043752ce3486fc9fa8d37462809, head e823a765142acaf78ef3fed7b4dc51abbb967393 (both verified with `git rev-parse --verify`). Spec: docs/spec.md at head (epic description "Spec: docs/spec.md").

## Review provenance

- Review-source binding for inv-1 recorded in the ledger before any artifact write (bind-review-source exit 0).
- No `assembled/final-review-inv-1-final/review-inputs.json` existed, so the normal route applied.
- The review-package script refused: `No such plan file: .superpowers/sdd/ev-cko-plan/ev-cko-plan.md` (exit 2); no `.diff` package was written. The whole range (10 files, 201 insertions) was read directly from `git diff base..head` and `git show head:<path>` instead; every changed path and hunk was inspected.
- Tests were run in a review-owned detached worktree at head (since removed): `python3 -m unittest -v` ran 4 tests, all OK. This is a reviewer reproduction, not a sweep result; no sweep result is available.
- Observed caller state: caller checkout HEAD is 23774344 ("bd init: initialize beads issue tracking", one commit above the reviewed head e823a765); `git status --short` shows only `?? .superpowers/`. Recorded as observed; cause not attributed.

## Requirement baseline trace

The spec carries a `## Requirement baseline`: human request "make sure the agent can run any `relay` command without prompting, except `relay human ...` commands, which must still prompt"; row B1 (allow both command forms, prompt rule for `human`); human scope change S1 ("allows can wait until a qualification exists; publish no allow or prompt rule before then", affects B1).

Production entry point: `bin/relay` -> `relay.cli.main` -> `setup` -> `run_setup(settings, load_install_path(config))` -> `command_forms` -> `Qualification.pending(form)` for every form -> `build_rules` -> zero rules written, two "awaiting qualification" notices.

`Qualification.qualified(...)` is called only from `tests/test_rules.py`. No production code creates, computes (no SHA-256 of any binary is ever taken), persists or loads a qualified record; `run_setup` unconditionally rebuilds every record as pending on each run. There is no `relay qualify` command or any other supported producer. Consequently, at head, no `relay ... ` command is ever allowed without a prompt, under any condition, for either form.

S1 lets allow and prompt rules wait *until a qualification exists*; it does not waive the request itself. With no reachable way for a qualification to come into existence, the wait never ends, and the requested behavior (prompt-free relay commands) is reachable only from test fixtures. That is not delivery under the baseline, and S1 does not cover permanent non-delivery. B1 is therefore undelivered.

## Cross-task integration observations

- Setup idempotence, preservation of other tools' rules, and the prompt-before-allow rule shape match the spec and compose correctly (verified in code and by test).
- `build_rules` ignores `digest` entirely; once a producer exists, nothing ties the written rule to the binary that was qualified, nor re-checks it when `install_path` changes. Bare `relay` resolves via `PATH` at run time, so a digest for it needs a defined meaning. These belong to the qualification producer's design, not a separate fix.
- `load_install_path` raises an uncaught `FileNotFoundError`/`KeyError` traceback when the config file or key is missing; cosmetic, but it is the only failure mode of `relay setup` a user will see before the installer runs.

## Ledger triage

- The ledger at progress.md holds only the Launch line and the inv-1 review-source recovery record: no `minor (deferred)`, `parked`, `parked finding`, `Recurring minor:`, `Recurring blocker:` or `BLOCKED-AUTH` lines to triage.

## Verdict
not ready (B1 undelivered: qualified records reachable only from tests, so setup never writes any allow rule)

## Must fix before landing
- B1 not delivered and not covered by S1: `Qualification.qualified` is called only in tests/test_rules.py; relay/install.py `run_setup` always builds pending records and no production path computes, persists or loads a qualification, so `relay setup` writes zero rules forever. Add a supported qualification producer (verify the binary's SHA-256 for each form, persist the record, have setup load qualified records and bind rules to the confirmed digest); do not resolve by allowing unqualified forms.

## Untested scope
- No sweep result is available; only the reviewer's local run of the 4 unit tests at head (all pass).
- The review-package script failed (missing plan file ev-cko-plan.md), so no packaged diff exists; review was done from raw captured Git.
- No test exercises `relay setup` through `bin/relay`/`relay.cli.main` with a real config file, nor any qualified-record path end to end.

## Deferred OK
- `load_install_path` in relay/cli.py surfaces a raw traceback when ~/.config/relay/config.json or its `install_path` key is missing; a friendly message would be better but nothing breaks.
