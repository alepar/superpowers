# Final review: epic ev-sd4 (Relay permissions), invocation inv-1

Source: base 82ad9c74dcd5c547099a2a00df1f6c4ae311f030, head 9c550d1c43f5324ad5d69bb972de23bd80e232be (both verified with `git rev-parse --verify`). Spec: `docs/spec.md` at head (epic description "Spec: docs/spec.md").

## Process notes

- The review package step could not run: `review-package` exited 2 with "No such plan file: .superpowers/sdd/ev-sd4-plan/ev-sd4-plan.md". The review was done directly from `git diff 82ad9c7..9c550d1` (10 files, 201 insertions; every changed file read in full).
- No `assembled/final-review-inv-1-final/review-inputs.json` existed, so the normal route applied.
- Observed caller state: branch `main` now points at 2790d8f ("bd init: initialize beads issue tracking"), one commit past the reviewed head; the working tree has untracked `.superpowers/`. Recorded as observed only; that commit is outside the reviewed range.
- The `bind-review-source` guard succeeded and appended the review-source binding to the ledger.
- No sweep result is available. I ran `python3 -m unittest` on an extracted copy of the head tree (git archive into a scratch directory, not the caller checkout): 4 tests, all passing. The passing suite does not show B1 delivered (see below).

## Requirement baseline trace

Row B1: "allow every relay command form the agent uses, bare `relay` and the installed absolute path, with a prompt rule for their `human` subcommand". Human request: the agent can run any `relay` command without prompting, except `relay human ...`.

Production entry point: `bin/relay setup` -> `relay.cli.main` -> `relay.install.run_setup(settings, install_path)`. `run_setup` builds `[Qualification.pending(form) for form in command_forms(install_path)]` unconditionally. `build_rules` emits rules only for `qualified` records. Nothing in production code ever builds a `qualified` record: `git grep` at head finds `Qualification.qualified(...)` only in `tests/test_rules.py`. No command, installer step or documented manual step exists that qualifies a form. So `relay setup` always writes zero relay rules for both forms.

Reproduced at head: with a config whose `install_path` points at `bin/relay`, `HOME=<scratch> python3 bin/relay setup` prints "relay awaiting qualification; no rules written" for both forms and "wrote 0 rules", and the permissions file is `{"rules": []}`. Under the harness semantics (no matching rule means prompt), the agent is prompted for every relay command, including `relay status`. The `human` prompt holds only because everything prompts.

The only test that shows the allow/prompt rule shape (`test_qualified_forms_allowed_and_human_prompted`) feeds hand-built qualified records with a fabricated digest (`"ab" * 32`) into `build_rules`. No production path reaches it. B1 is not delivered, and the spec lists no human scope change row that covers it.

The safety concern in the spec is legitimate: the absolute path comes from an editable config and may name a different binary. A fix has to keep that property. It should not grant rules to pending forms. It should add a real qualification producer that `relay setup` runs: compute the SHA-256 of the resolved binary for each form (the real path of `install_path`, and bare `relay` as resolved on `PATH`), confirm it matches the relay that is actually running setup (for example, the digest of the real path of the running `bin/relay`), and emit `Qualification.qualified(form, digest)` only when it matches. A form that fails stays pending and keeps its notice.

Bare `relay` is also held pending, even though the security finding concerned only the config-sourced absolute path. Nothing explains why the bare form gets no rules.

## Integration and spec conformance

- Spec sections "Setup" and "Unchanged behavior" (other tools' rules kept, idempotent rerun, relay-owned rules replaced) are met by `write_rules` and covered by `test_other_tools_rules_kept_and_rerun_stable`.
- Rule shape and order for a qualified form (prompt `F human *` before allow `F *`) match the spec. The harness checks prompt rules first, so order within the file is not load-bearing.
- The `digest` on a qualified record is never used. Rules are written per path pattern, and nothing re-checks the digest when a rule is used or when setup runs again. Once a qualification producer exists, swapping the binary at a qualified path after setup keeps the allow rule. Re-running setup re-qualifies against the current binary, so that is the natural point to drop stale rules.
- `load_install_path` raises an unhandled `FileNotFoundError`/`KeyError` traceback when the config is missing or lacks `install_path`. This is cosmetic, but it is the first-run path when the installer has not written the config.

## Ledger triage

- The ledger at `.superpowers/sdd/ev-sd4-plan/progress.md` contains only the Launch line, the review-source Recovery record and the binding appended by this review. It has no `minor (deferred)`, `parked`, `parked finding`, `Recurring minor:`, `Recurring blocker:` or `BLOCKED-AUTH` lines, so there is nothing to triage from it.

## Verdict
not ready (baseline row B1 not delivered: relay setup always writes zero rules because no production path ever qualifies a command form)

## Must fix before landing
- B1 not delivered: `relay/install.py` `run_setup` creates only `Qualification.pending` records and no production code produces `Qualification.qualified` (only `tests/test_rules.py` does, with a fabricated digest), so `bin/relay setup` writes `{"rules": []}` (reproduced at head) and the agent is prompted for every relay command; add a real qualification step in setup that confirms each form's binary digest against the running relay and qualifies matching forms, keeping unconfirmed forms pending; do not grant rules to pending forms.
- Add a test that drives `run_setup` (or `cli.main(["setup", ...])`) against a real binary and asserts the allow and human-prompt rules for both forms; the current suite passes while B1 is undelivered.

## Untested scope
- No sweep result was available; only the 4-test unittest suite at head was run locally, and it passed.
- The review package could not be built (plan file `.superpowers/sdd/ev-sd4-plan/ev-sd4-plan.md` is missing); the diff was reviewed directly from captured Git.
- Harness-side matching of the `F human *` / `F *` patterns was not exercised; the harness semantics were taken from the spec.

## Deferred OK
- The qualified record's `digest` is unused after qualification; once a producer exists, consider dropping or refusing rules for a path whose binary digest no longer matches when setup runs again.
- `relay.cli.load_install_path` crashes with a traceback when the config file or `install_path` key is missing; a clear error message would be better.
- The reason bare `relay` is held pending alongside the config-sourced absolute path is undocumented.
