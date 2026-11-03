# Final review: epic ev-yku (Relay permissions), inv-1

Source: base d4b381395ecab09283eace9369a649bfd89ca44a, head c308d895554e80114daae430cf94fe625e927f4c (both verified as commits). Spec: docs/spec.md at head (epic description "Spec: docs/spec.md").

## Review method and provenance

- The review-package script exited 2: the plan file .superpowers/sdd/ev-yku-plan/ev-yku-plan.md does not exist. The diff (10 files, +201) was read whole via `git diff base..head` and `git show head:<path>` instead; no .diff package was written.
- Observed caller state: the caller checkout HEAD is dd4f3b6 ("bd init: initialize beads issue tracking"), one commit past the reviewed head, touching only .beads/, .agents/, .claude/, .codex/ tooling; `.superpowers/` is untracked. Recorded as observed, not attributed.
- Reproduction ran in a review-owned `git archive` extract of the head (scratchpad run-06-review-src): `python3 -m unittest discover` passed 4/4; `relay setup` with a scratch HOME and a config pointing at the extracted bin/relay printed both "awaiting qualification" notices and wrote `{"rules": []}`.
- No sweep result is available; the 4-test unit run above is the only executed evidence.

## Requirement baseline trace

- B1 (allow every relay command form, bare and installed absolute path, with a prompt rule for `human`) is affected by S1 ("allows can wait until a qualification exists; publish no allow or prompt rule before then").
- Production entry point: bin/relay -> relay.cli.main -> `setup` -> install.run_setup. run_setup unconditionally builds `Qualification.pending(form)` for every form, so build_rules always returns no rules. The current output (no rules, a notice per form) conforms to S1 for the period before a qualification exists.
- S1 sequences B1; it does not waive it. B1 must become true once a qualification exists. At head nothing can ever produce one: `Qualification.qualified(...)` is called only from tests/test_rules.py; there is no qualify command, no persisted record store, and run_setup would recreate pending records on every run even if one existed. The qualified-record path that emits `F human *` / `F *` is reachable only from tests, so B1 is not deliverable in production under any condition.
- The qualified record's digest is never compared with the SHA-256 of the binary at the form's path; build_rules trusts `state` alone. When a producer is added, the digest check is what makes the security review's concern (install_path naming a different binary) actually closed.

## Integration observations

- write_rules removes only owner=="relay" rules and keeps others; rerun is idempotent (verified by test and by the scratch run). Unchanged-behavior bullets hold.
- `relay setup` crashes with an uncaught FileNotFoundError/KeyError when ~/.config/relay/config.json or its install_path key is missing (reproduced: traceback on a fresh HOME).
- The bare `relay` form resolves via PATH, which can name a different binary just as install_path can; the qualification model covers it only if a qualifier hashes the PATH-resolved binary.
- write_rules writes the harness permissions file in place (no temp file + rename); an interrupted write can truncate other tools' rules.

## Ledger triage

- The ledger at progress.md holds only the Launch line: no minor (deferred), parked, Recurring, or BLOCKED-AUTH lines to triage.

## Verdict
not ready (B1 has no production path: no qualification producer exists, so allow/prompt rules can never be written outside tests)

## Must fix before landing
- B1 not delivered: run_setup always creates pending records and `Qualification.qualified` is reachable only from tests/test_rules.py, so no production path ever writes `F human *` / `F *`; S1 only defers B1 until a qualification exists and does not waive it. Add a supported qualification producer (verify the binary's SHA-256 for each form, persist the record) and have setup read persisted records and emit rules only when the recorded digest matches the current binary; or obtain a human scope change row that removes B1 from this epic.

## Untested scope
- No sweep result is available; only the 4 unit tests at head were run.
- The rule-emitting path from a production entry point is untestable at head because no qualified record can be produced.
- Harness-side matching of the emitted patterns (prompt-before-allow, trailing `*` with zero args, absolute paths containing spaces) is not exercised by any test.

## Deferred OK
- relay setup raises an uncaught traceback when the config file or its install_path key is missing; a clear error message would be better.
- write_rules is not atomic (in-place write of the shared permissions file); switch to temp file + rename.
- Digest comparison against the current binary (including the PATH-resolved bare `relay`) belongs with the qualification producer required above.
