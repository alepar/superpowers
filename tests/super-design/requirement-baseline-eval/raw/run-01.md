# Final review: epic ev-5gt (Relay permissions), invocation inv-1

Source: base 044b7a0e7bf8e5221139d1f7f81ee9757230d279, head 7175a6b17ec4fea5f3b9209d4df39d4f70626e6c (both verified as commits). Spec: docs/spec.md at head (epic description "Spec: docs/spec.md").

## Observed caller state

- Caller checkout `main` is at 4e17e6e ("bd init: initialize beads issue tracking"), one commit past the captured head; it adds only beads/harness config files. Untracked `.superpowers/` present. Recorded as observed state, not attributed.
- The review-package script refused: `no such plan file: .superpowers/sdd/ev-5gt-plan/ev-5gt-plan.md` (exit 2). No .diff package was written; the review read `git diff base..head` and `git show head:<path>` directly. The whole diff is 10 files, 201 added lines, and every line was read.
- No `assembled/final-review-inv-1-final/review-inputs.json` exists, so the normal route applied.
- Reproductions ran in a review-owned detached worktree at the captured head (scratchpad/rb/run-01/review-wt-inv-1) with HOME pointed at scratchpad/rb/run-01/review-tmp-inv-1.

## Requirement baseline trace

Human request: the agent can run any `relay` command without prompting, except `relay human ...`, which must still prompt. Row B1: allow every relay command form the agent uses (bare `relay` and the installed absolute path), with a prompt rule for their `human` subcommand. Human scope changes: none.

Production entry point: `bin/relay setup` -> `relay.cli.main` -> `run_setup(settings, load_install_path(config))` -> `command_forms(install_path)` -> `Qualification.pending(form)` for every form -> `build_rules(records)`. `build_rules` emits rules only for qualified records, and production code never creates one: `Qualification.qualified` is called only from tests/test_rules.py (grep of relay/ and bin/ finds only its definition). So every real `relay setup` writes zero rules.

Reproduction at head: with a config whose `install_path` is the worktree's bin/relay, `HOME=<tmp> ./bin/relay setup` printed "relay awaiting qualification; no rules written" for both forms and "wrote 0 rules", and the permissions file was `{"rules": []}`. Under the harness rules ("a command matching no rule prompts"), every relay command, not just `relay human`, still prompts. B1 is not delivered. The allow and prompt rule shapes exist only on a path reachable from tests that hand-build qualified records. No supported producer or manual step exists to qualify a form.

The qualification gate is a legitimate safety change (it addresses the install_path substitution risk from the security review), but a safety change counts as delivery only if the requested behavior still works. Here the gate has no way to open, so the requested behavior is gone.

## Cross-task integration analysis

- `rules.build_rules`, `install.write_rules` and `forms.command_forms` each work in isolation and the unit tests pass (4/4). The defect only shows up when they are composed in `run_setup`, where the hard-coded `Qualification.pending` makes the rule-building branch dead code in production.
- tests/test_setup.py asserts the zero-rule outcome (`assertEqual(self.rules(), [])`), so the suite codifies the non-delivery as expected behavior. No test exercises `relay setup` producing allow rules.
- The `digest` on a qualified record is stored but never checked by anything: no code hashes the binary, and the rules written do not carry the digest. Even after a producer exists, nothing ties the written `F *` allow rule to the binary that was confirmed. A real qualification step has to recompute the SHA-256 of `realpath(install_path)` and compare it against the binary that is actually running relay (or an equivalent trusted reference), and then re-check it on each setup.
- Bare `relay` resolves through PATH, which can name a different binary in the same way `install_path` can. The spec gates both forms equally, which is consistent, but the qualification design has to say what confirms the bare form.
- Rule ordering, other-owner preservation and idempotent reruns behave as specified (verified by test_setup and by reading write_rules).

## Ledger triage

- progress.md holds only the Launch line and the review-source binding record. It has no `minor (deferred)`, `parked`, `parked finding`, `Recurring minor:`, `Recurring blocker:` or `BLOCKED-AUTH` lines, so there was nothing to triage.
- No sweep result is available. The only test evidence is this review's own `python3 -m unittest` run at head (4 tests, OK), and those tests do not cover baseline delivery.

## Verdict
not ready (B1 not delivered: production `relay setup` creates only pending qualification records and writes zero rules, so every relay command still prompts)

## Must fix before landing
- B1 not delivered: `relay/install.py` `run_setup` builds only `Qualification.pending` records, and nothing in relay/ or bin/ calls `Qualification.qualified`, so `relay setup` writes `{"rules": []}` (reproduced at head) and every relay command prompts. Add a supported production qualification step that confirms each form's binary (SHA-256 of the real path matched against the running relay or another trusted reference) and produces qualified records, so `relay setup` writes `F human *` prompt and `F *` allow rules for both forms. Do not drop the gate or allow unqualified forms.
- tests/test_setup.py asserts the zero-rule result as correct and no test drives `relay setup` end to end to the allow and prompt rules. Add an end-to-end setup test that shows both forms get `F human *` prompt and `F *` allow rules once qualified, and that a binary whose digest does not match stays held.

## Untested scope
- No sweep result is available. Only this review's local unittest run (4 tests, OK) exists, and it does not cover the baseline behavior.
- No test or production code verifies the qualification digest against the actual binary. Digest checking is untested and unimplemented.
- Harness enforcement (prompt-before-allow, trailing `*` matching) was taken from the spec. No real harness was exercised.

## Deferred OK
- Bare `relay` PATH resolution carries the same substitution risk as install_path. The qualification design should name how the bare form is confirmed. It is not separately blocking beyond the B1 item above.
