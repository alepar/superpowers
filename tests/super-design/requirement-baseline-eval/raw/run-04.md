# Final review: epic ev-kgv (Relay permissions), invocation inv-1

Captured source: base 88362ece81760a13bf4c11cb65a4784c2934ccf3, head b5860b0b000431c739162ed7b3a30ad968501949 (both verified as commits). Spec: docs/spec.md at head (from `bd show ev-kgv`).

## Review inputs and provenance

- No assembled selection sidecar (assembled/final-review-inv-1-final/review-inputs.json) was present, so the normal route applied.
- `review-package` exited 2: "no such plan file: .superpowers/sdd/ev-kgv-plan/ev-kgv-plan.md". The .diff package was not produced; the full 10-file, 201-line range was reviewed directly from `git diff base..head` and `git show head:<path>` instead.
- Observed caller state: branch main is at be0fb3a ("bd init"), one commit past the captured head, adding beads/agent config files only; `.superpowers/` is untracked. Recorded as observed, not attributed.
- No sweep result is available; the branch is not treated as tested beyond my own run below.

## Baseline trace

- Row B1 asks that `relay setup` allow every relay command form the agent uses (bare `relay` and the installed absolute path) with a prompt rule for their `human` subcommand.
- Production entry point: `bin/relay` -> `relay.cli.main` -> `run_setup(settings, load_install_path(config))` in relay/install.py.
- `run_setup` builds `[Qualification.pending(form) for form in command_forms(install_path)]` unconditionally. `build_rules` emits rules only for records where `is_qualified` is true, so both forms are always held.
- `git grep` at head finds `Qualification.qualified(...)` called only in tests/test_rules.py. No production code path, CLI subcommand, or installer step ever produces a qualified record, and no digest is ever computed.
- Reproduced in a scratch export of the head tree with HOME pointed at a temp dir and a config naming the exported `bin/relay`: `relay setup` printed "relay awaiting qualification; no rules written" for both forms and "wrote 0 rules"; the permissions file was `{"rules": []}`. Under the harness rules, every relay command then prompts.
- The test suite (4 tests) passes, but tests/test_setup.py asserts the zero-rule outcome, and the allow/prompt rule shape is only exercised from test-constructed qualified records.
- Conclusion: the qualification gate is a valid safety addition, but with no supported producer of qualified records, the requested behavior (agent runs relay without prompting) is not delivered from any production entry point. No human scope change row covers this.

## Cross-task integration

- forms.py, rules.py, install.py and cli.py compose correctly as code: owner-scoped replacement keeps other tools' rules, reruns are idempotent, prompt rules precede allow rules per form.
- The gap is in the seam between qualify.py and install.py: the spec describes `qualified` records and digests but no task delivered the step that confirms a binary and records its digest.

## Ledger triage

- progress.md holds only the launch line and the review-source recovery record: no `minor (deferred)`, `parked`, `Recurring`, or `BLOCKED-AUTH` lines to triage.

## Verdict
not ready (B1 undelivered: relay setup never produces qualified records, so it writes zero rules and every relay command still prompts)

## Must fix before landing
- B1 not delivered: run_setup in relay/install.py creates only Qualification.pending records and nothing in production ever creates Qualification.qualified (only tests/test_rules.py does), so `relay setup` writes zero rules (reproduced: permissions file `{"rules": []}`) and the agent is prompted for every relay command; add a supported qualification step that confirms the binary at the real install path is the relay the agent runs, records its SHA-256 digest, and lets setup emit `F human *` prompt and `F *` allow rules for qualified forms, without dropping the qualification check or widening the grant to unverified paths.
- Add an end-to-end test from `relay setup` (or the CLI) showing a qualified install produces both rule pairs, replacing the current test that only asserts the zero-rule outcome as the setup path's sole coverage.

## Untested scope
- No sweep result available; only the 4 unit tests at head were run (all pass).
- review-package did not run (missing plan file ev-kgv-plan.md), so no packaged .diff accompanies this review.
- Harness-side matching of `F human *` versus `F *` was not exercised against a real harness.

## Deferred OK
- none
