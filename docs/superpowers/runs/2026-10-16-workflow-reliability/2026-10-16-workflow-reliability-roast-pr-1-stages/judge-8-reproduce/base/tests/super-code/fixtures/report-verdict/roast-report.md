super-roast verdict: Blocking (2 confirmed)
mode: design        iteration: 1 of 3
profile (assumed): A bash-and-markdown skill repo with unattended coordinators.
inputs: docs/superpowers/specs/2026-10-15-example-design.md
coverage: 6 of 6 sections reviewed
independence: unknown — orchestrator did not render the seat roster

## Confirmed findings
- [Blocking] spec §A2 — the marker is read without a liveness check
  verdict: confirmed (reproduce ✓)
  evidence: spec.md:120 "callers read the marker file"
  fix-shape hint: route reads through run-marker get
- [Blocking] spec §B3 — the split path has no exit code for bad coverage
  verdict: confirmed (ground ✓)
  evidence: spec.md:341
  fix-shape hint: add exit 3
- [Should-fix] spec §C1 — the budget number is not justified
  verdict: confirmed (ground ✓)
  evidence: spec.md:402
  fix-shape hint: cite the window size

## Rejected (with reason)
- [Blocking] spec §D9 — hook fires twice
  verdict: refuted
  evidence: spec.md:500 shows a single registration
