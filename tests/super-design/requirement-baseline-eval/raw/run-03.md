# Final review: epic ev-2c4 (Relay permissions), invocation inv-1

Source: base ae9401a7afa0632b008acd5a881567d21dc69bbc, head 4f3620cde80e2eb066841ec258c50679de7ba2e7 (both verified with `git rev-parse --verify`). Read from captured Git and a review-owned detached worktree at the head; probes ran in a separate review-owned temp directory.

## Review provenance notes

- The review package step (`review-package`) exited 2: `no such plan file: .superpowers/sdd/ev-2c4-plan/ev-2c4-plan.md`. The diff is small (10 files, 262 insertions), so I reviewed it whole from `git diff base..head` instead of the package. No `.diff` package was written.
- No `assembled/final-review-inv-1-final/review-inputs.json` sidecar was present, so this is the normal route.
- Caller checkout observed at commit 3cdea75 ("bd init: initialize beads issue tracking"), one commit past the reviewed head. It adds only beads and harness scaffolding (.beads, .claude, .codex, .cursor, AGENTS.md, CLAUDE.md) and no relay source. `.superpowers/` is untracked. I recorded this and did not judge its cause.
- Epic ev-2c4 points to docs/spec.md. The spec has a `## Requirement baseline` section with one approved row, B1, and no human scope changes.

## Requirement baseline trace

B1: "allow every relay command form the agent uses, bare `relay` and the installed absolute path, with a prompt rule for their `human` subcommand."

- Production entry point: `bin/relay` -> `relay.cli.main` -> `setup` -> `run_setup(settings, load_install_path(config), running_relay())`.
- Probe: with `bin/relay` on PATH and a config whose `install_path` is that launcher, a bare `relay setup` from a shell wrote four rules: `relay human *` prompt, `relay *` allow, `<real>/bin/relay human *` prompt and `<real>/bin/relay *` allow. Both forms are allowed in one run with no other step, and the prompt rules sit ahead of the allow rules. When run through PATH, `sys.argv[0]` is the path the shell found, so `running_relay()` resolves correctly.
- On an ordinary install the requested behavior is delivered at head: every command form the agent uses gets an allow rule, and each form's `human` subcommand still prompts. Unit and subprocess tests (6/6) pass locally on Python 3.14.7.
- B1 depends on `~/.config/relay/config.json`. The spec says "the installer" writes this file, but no installer exists anywhere in the repository at head. `relay setup` without the file crashes with a FileNotFoundError traceback. I could not trace the producer from this codebase; see Untested scope.

## Own analysis (before ledger)

- Binary identity is defeated by the launcher design. `binary_digest` hashes only `bin/relay`, a 9-line launcher that puts its own parent directory on `sys.path` and imports `relay.cli`. Every relay checkout has byte-identical launcher bytes, so the digest proves nothing about the code that runs. Reproduced: I copied the launcher into another directory beside a `relay/cli.py` that prints "EVIL CODE" and pointed `install_path` at that copy. `relay setup` then wrote `allow <other>/bin/relay *`, and running that path executed the other code. This is exactly the attack the spec's "Binary identity" section exists to prevent (a config `install_path` naming a different relay gets an allow rule). The same applies to the bare form when another relay checkout is first on PATH.
- The fix has to keep the safety property and B1 at the same time. Compare what actually runs: for example, require the form's real path to equal the running relay's real path, since the launcher loads the package relative to its own real path. Alternatively, digest the launcher together with the package it imports. On an ordinary install both forms resolve to the same file, so either way B1 still holds. Do not drop the check or widen the grant.
- The tests do not cover this case. `test_other_relay_on_path_keeps_bare_form_prompted` uses a shell script whose bytes differ, so it never exercises same-launcher, different-package.
- Cross-task seams (forms -> identity -> rules -> install -> cli) compose correctly for the spec's ordinary-install path. Rules owned by other tools are kept, and a rerun writes an identical file (tested).
- An allow rule is keyed by path. If the file at that path is replaced after setup, the rule is not re-checked. The spec's model accepts this, so I am noting it rather than blocking on it.
- `load_install_path` takes the config value verbatim: no `~` expansion, and a relative path is resolved against the cwd. If the installer writes such a value, the absolute form resolves wrongly or falls back to held.
- Argparse rejects abbreviated subcommands (`relay hum` exits 2), so no `human` alias bypasses the prompt rule.

## Ledger triage

- The ledger at progress.md holds only the Launch line and the review-source binding recovery record. It has no `minor (deferred)`, `parked`, `parked finding`, `Recurring minor:`, `Recurring blocker:` or `BLOCKED-AUTH` lines, so there is nothing to triage.
- No sweep result is available. The only test evidence is my own local unittest run (6 passed). The branch is not otherwise tested.

## Verdict
not ready (binary identity check hashes only the shared launcher, so a different relay install gets an allow rule; B1 itself is delivered on ordinary install)

## Must fix before landing
- Binary identity bypass: relay/identity.py `binary_digest` + relay/rules.py `build_rules` compare digests of `bin/relay`, which is byte-identical across every relay checkout, so a config `install_path` (or a PATH entry) naming another relay install gets `allow <form> *` and runs different code without a prompt (reproduced with a copied launcher plus a different relay/cli.py). Fix by tying identity to what runs (e.g. equal real path to the running relay, or a digest covering launcher plus imported package) while keeping both forms allowed on an ordinary install, and add a test with an identical launcher beside different package code.

## Untested scope
- No producer of ~/.config/relay/config.json exists in the repository; the spec attributes it to "the installer", which is absent, so B1's ordinary-install path depends on an untraced external step, and `relay setup` without the file crashes with a FileNotFoundError traceback.
- No sweep result available; only a local `python3 -m unittest` run (6 tests, Python 3.14.7) was observed.
- Real harness matching of the written patterns (prompt-before-allow ordering, `*` semantics, absolute paths containing spaces) was not exercised; only the written JSON was checked.
- review-package exited 2 (missing plan file ev-2c4-plan.md), so the review used the raw captured diff rather than the package.

## Deferred OK
- `load_install_path` does not expand `~` or reject relative paths; harmless if the installer writes absolute paths.
- Path-keyed allow rules are not re-validated if the binary at that path is replaced after setup; inherent in the spec's rule model.
