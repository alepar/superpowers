# Cluster 25 review

Reviewed the twelve files assigned to `docs-superpowers-runs-2026-10-16-workflow-reliability-live-review-isolation-10`, using the captured diff and source at `612ea0a7e4d64480bdd01e0ac842b539115342ee` against `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5`. Both commit identities were verified before source reads. Read the epic and its referenced workflow-reliability design. The relevant requirements are stable review inputs, isolated mutable reproductions, and evidence that identifies its source, outcome, and retained location.

The report appropriately qualifies the live exercise: it distinguishes the controlled assembler failure from a real coordinator transition, identifies its historical product revision, and discloses unavailable global process inspection and limited behavioral coverage. The controller, recorder, and verifier support a representative observation without claiming causal attribution from caller checkout differences alone.

A read-only integrity check loaded the committed artifact manifest, retrieved each of its 81 paths using `git show` at the captured head, and compared SHA-256 hashes. Seventy-six paths resolve and match. Five paths do not exist in the committed tree. The report advertises those paths as retained raw evidence, including the actual final-review package and fixture ledger. The archived Seat B response duplicates the missing final review by hash, but it does not repair the absent package or ledger entries. This is a concrete archive-integrity failure rather than evidence that the live exercise failed.

Caller observation: HEAD was `68c8a0623ba78a75cb5b8b8e40c17236cf81f92e` with empty `git status --short` at both observations. Review inputs remained the captured source. No checkout changes, reproductions, process cleanup, tracker mutations, or source edits were performed. Only this declared report was written.

## Verdict
not ready (the evidence archive omits five files declared by its manifest and report)
## Must fix before landing
- [P2] Restore the five missing archived files or replace their manifest/report locations with retained, hash-verified equivalents: `artifact-manifest.json:76-80` declares `caller/build/caller-output.txt` and four files under `caller/.superpowers/sdd/ufz-live-review-plan/` (`final-review-seat-b-live.md`, `progress.md`, `final-review-seat-b-live.md.diff`, `ufz-live-review-plan.md`), but all five `git show 612ea0a7:<archive-prefix>/<path>` reads fail. The report at lines 26 and 45 claims the direct-input package, final artifact, fixture plan, and ledger are retained; its manifest separately declares the missing caller output sentinel. Archive these ignored fixture files explicitly and verify every manifest entry against the committed tree; keep the captured historical evidence unchanged.
## Untested scope
- No fresh multi-agent behavioral exercise was run; this review inspected the archived scripts and evidence integrity.
- The real coordinator assembler-failure transition, task-review no-test policy, hosted Workflow execution, repeated-run reliability, and arbitrary background descendants remain outside this exercise, as its report explicitly states.
## Deferred OK
- The historical single-run behavioral observation remains useful with its stated source revision and coverage limits; it does not establish behavior for later source changes.
- Global process inspection was unavailable in the exercise; the report preserves that uncertainty rather than claiming global verified termination.
