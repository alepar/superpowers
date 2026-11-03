# Final review: epic ev-c1c (Relay permissions), invocation inv-1

Source: base 28edaaf973b6cd137fba2614b3c59e2af91ad2b4, head 0e38f6fb0b663e734d751576541645ceaf1a6226 (both verified with `git rev-parse --verify`). Review source bound in the ledger via `bind-review-source` (exit 0).

## Review inputs and provenance

- No selection sidecar existed at `assembled/final-review-inv-1-final/review-inputs.json`, so the normal route applied.
- The review-package script exited 2: `no such plan file: .../ev-c1c-plan/ev-c1c-plan.md`. No `.diff` package was produced. The whole range is small (10 files, 262 added lines), so the complete diff was read directly from captured Git (`git diff base..head`), every path and hunk.
- Spec: `bd show ev-c1c` points at `docs/spec.md`, read at the reviewed head. It has a `## Requirement baseline` section with one row (B1) and no human scope change rows.
- Observed caller state: caller HEAD is d8048bb ("bd init: initialize beads issue tracking"), one commit after the reviewed head; working tree shows only untracked `.superpowers/`. Recorded as observed; not attributed.
- Probes ran in a review-owned detached worktree at the reviewed head (`scratchpad/rb/run-12-review-wt`), with their own temp directories.

## Requirement baseline trace

B1 ("allow every relay command form the agent uses, bare `relay` and the installed absolute path, with a prompt rule for their `human` subcommand").

Production entry point: `bin/relay setup` -> `relay/cli.py:main` -> `load_install_path(config)` -> `run_setup(settings, install_path, running_relay())` -> `command_forms` -> `build_rules` -> `write_rules`.

Probe at head: with `bin/relay` on PATH and a config whose `install_path` is that launcher, running bare `relay setup --settings ... --config ...` wrote exactly `relay human *` (prompt), `relay *` (allow), `<real path> human *` (prompt), `<real path> *` (allow) in one run. `running_relay()` resolves `sys.argv[0]` to the launcher's real path; bare `relay` resolves through PATH to the same file; digests match. Prompt rules precede allow rules in harness evaluation, so `human` prompts in both forms. B1 is delivered on an ordinary install, given a config file.

The config file `~/.config/relay/config.json` is described by the spec as written by "the installer", but no installer exists anywhere in the reviewed tree (base contains only `docs/spec.md`). Without that file `relay setup` raises an uncaught `FileNotFoundError` and writes no rules for either form (reproduced). Whether a supported producer exists outside this repository could not be verified from captured source.

## Cross-task analysis

The binary-identity check compares SHA-256 digests of the file a form runs. The shipped relay executable is `bin/relay`, a 9-line launcher that inserts its own parent directory on `sys.path` and imports `relay.cli` from there. The launcher's bytes are identical for every copy of relay, so the digest does not identify the code that runs. Reproduced: copied the unmodified launcher to `.probe/evil/bin/relay` beside a substitute `relay/cli.py` printing `NOT RELAY`, pointed `install_path` at it, and ran the genuine relay's `setup`. It wrote an allow rule `<evil>/bin/relay *`, and running that path printed `NOT RELAY`. This is the exact scenario the spec's security review describes (config names a different relay than the one the agent runs), and the check passes it. Every unit test exercises a single self-contained shell file as "the binary", so none covers the real launcher-plus-package layout; `test_installed_relay_setup_command` only checks the positive case.

Other seams checked and found consistent: `write_rules` drops only `owner == "relay"` rules and preserves others; reruns are byte-stable (test and logic agree); held forms still get their `human` prompt rule; the held-form message text matches the spec.

## Ledger triage

The ledger contains only the launch line and the review-source recovery record. There are no `minor (deferred)`, `parked`, `parked finding`, `Recurring minor:`, `Recurring blocker:` or `BLOCKED-AUTH` lines to triage.

## Test evidence

No sweep result is available, so the branch is not treated as tested by a sweep. The reviewer ran `python3 -m unittest discover -s tests -t .` at the reviewed head in the review worktree: 6 tests, OK.

## Verdict
not ready (binary-identity check is defeated by the shipped launcher layout: a copied launcher beside different package code gets an allow rule)

## Must fix before landing
- Binary identity does not hold for the shipped launcher: `relay/identity.py:binary_digest` hashes only `bin/relay`, whose bytes are identical across copies, while the code it runs is the `relay/` package next to it; a config `install_path` naming a copied launcher beside different package code gets an allow rule (reproduced, setup wrote `<evil>/bin/relay *` and that path ran substitute code). The identity must cover what the form actually executes (for example, the launcher together with the package tree it loads), keeping B1's ordinary-install single-run allow of both forms; the spec defines identity as the file's bytes, so the definition change needs the human's decision.
- Add a test using the real launcher layout with a copied launcher beside a different package, asserting the absolute form is held and prompted.

## Untested scope
- No sweep result was available for the branch; only the reviewer's local unittest run (6 tests, OK) exists.
- The producer of `~/.config/relay/config.json` (the "installer" named in the spec) is not in the reviewed tree; B1 delivery depends on it, and without the file `relay setup` crashes with `FileNotFoundError` and writes no rules for either form.
- The review-package script refused (no plan file `ev-c1c-plan.md`); the diff was reviewed directly from captured Git instead, and no plan task criteria were available to check against.
- Harness pattern-matching semantics (prompt-first, trailing `*`) were taken from the spec, not exercised against a real harness.

## Deferred OK
- `relay setup` without a config file fails with a raw traceback rather than a clear message; cosmetic once a supported installer writes the config.
