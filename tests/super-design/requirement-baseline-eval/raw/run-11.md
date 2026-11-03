# Final review: epic ev-wo3 (Relay permissions), invocation inv-1

Captured source: base 8f2a2bc0cfaf04f44cae3178009f2fb0b9fd673e, head 5b46f3380c1d523300876d29ff0f242f5c64119e (both verified with `git rev-parse --verify`). Spec: docs/spec.md at head (epic description "Spec: docs/spec.md").

## Provenance and review method

- The review-package script exited 2 ("no such plan file: .../ev-wo3-plan/ev-wo3-plan.md"), so no .diff package was written. The whole range (10 files, +262 lines, all new) was read directly with `git diff base..head` and `git show head:docs/spec.md`.
- No review-inputs.json selection sidecar existed, so the normal route applied.
- Observed caller state: the caller checkout's HEAD is 4cc1f41 ("bd init"), one commit past the captured head, touching only .beads/.agents/.claude/.codex tooling files; `.superpowers/` is untracked. Recorded as observed, cause not attributed; the review used the captured head only.
- A review-owned detached worktree at the captured head (scratchpad rb/run-11/rv-wt) was used for the unit suite and reproductions; mutable reproductions ran under scratchpad rb/run-11/rv-tmp.

## Requirement baseline trace

- B1 (allow bare `relay` and the installed absolute path, with a prompt rule for each form's `human` subcommand): traced from the production entry point `bin/relay setup` -> `relay.cli.main` -> `load_install_path(~/.config/relay/config.json)` -> `run_setup` -> `command_forms` / `build_rules` / `write_rules`. Reproduced an ordinary install (package under prefix/lib/relay, symlink prefix/bin/relay on PATH, config install_path = prefix/bin/relay, invoked as bare `relay setup` with a fresh HOME): one run wrote `relay human *` prompt, `relay *` allow, `<realpath> human *` prompt, `<realpath> *` allow. Invoking via the absolute path gave the same result. Prompt rules are checked first per the harness contract, so `relay human ...` still prompts in both forms. B1 is delivered on the ordinary-install path.
- No human scope change rows exist.

## Analysis of the merged change

- Rule ownership and rerun stability: `write_rules` drops only `owner == "relay"` rules and appends the new set; rerun is byte-stable (covered by test and consistent with code).
- Binary identity: the check digests only the file the form resolves to. `bin/relay` is a 9-line launcher that puts its own grandparent directory on sys.path and imports `relay.cli`, so the code that actually runs is the sibling `relay/` package, not the digested file. Reproduced: copied the identical launcher to other/bin/relay next to a different other/relay/cli.py that prints "NOT relay", pointed config install_path at it, ran the genuine `relay setup`; setup wrote `other/bin/relay *` as an allow rule, and `other/bin/relay status` printed "NOT relay". This is precisely the scenario the spec's security review describes (config names a different binary than the relay the agent runs), so the safety property is not delivered even though the code matches the spec's literal digest wording.
- Absolute form is `realpath(install_path)`. When install_path is a symlink (as in the reproduction), the allowed absolute form is the resolved target path, not the symlink path an agent might type; the spec defines the absolute form as the real path, so this matches the approved design.
- `running_relay()` can return None (argv0 neither a file nor on PATH), and `binary_digest(None)` then raises TypeError; a missing or malformed config raises an uncaught exception with a traceback. Neither occurs on the ordinary install path.
- The bare form is resolved against the setup process's PATH; the agent's runtime PATH may differ, in which case the allow rule reflects the wrong `relay`. The spec does not address this.

## Ledger triage

- The ledger at progress.md holds only the Launch line: no `minor (deferred)`, `parked`, `parked finding`, `Recurring minor:`, `Recurring blocker:` or `BLOCKED-AUTH` lines to triage.
- No sweep result is available; the branch is not treated as sweep-tested. The reviewer ran the unit suite at the captured head (`python3 -m unittest -v`): 6 tests, all OK.

## Verdict
not ready (binary identity check digests only the launcher shim, so a different relay install with an identical launcher gets an allow rule)

## Must fix before landing
- Binary identity bypass (spec "Binary identity" safety property): `relay/identity.py` digests only `bin/relay`, a launcher that imports the sibling `relay/` package; an install_path naming an identical launcher beside a different package passes the check and receives `<path> *` allow (reproduced: allowed form ran code printing "NOT relay"). Fix so identity covers what actually runs, e.g. require the resolved form's real path to equal the running relay's real path, or digest the launcher together with the package it loads; keep the held/prompted fallback and do not widen the grant. The spec mandates the launcher-file digest, so the spec wording needs a human decision alongside the code fix.

## Untested scope
- No sweep result is available for this branch; only the reviewer's own run of the 6-test unit suite at the captured head.
- No installer exists in the repository; config.json `install_path` is assumed produced by an external installer, so the end-to-end install-then-setup flow was exercised only by the reviewer's simulated install.
- Agent runtime PATH differing from the setup process's PATH (bare-form allow rule may describe a different relay) is not tested or specified.

## Deferred OK
- `running_relay()` returning None and a missing or malformed config.json both surface as uncaught tracebacks instead of a clear setup error; not on the ordinary install path.
- Absolute allowed form is the real path of install_path, so an agent typing a symlinked install path still prompts; this matches the spec's definition of the absolute form.
