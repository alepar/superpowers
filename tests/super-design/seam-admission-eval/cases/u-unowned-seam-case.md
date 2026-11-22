# Coverage round 1 — one verified finding to dispose (paper only, no repository)

Root spec requirement: R1. `stash export` writes a CSV of all snapshots; `stash report` reads
that CSV and prints totals per backend.

Task table (no-beads mode):

| id | deps | title | description |
|---|---|---|---|
| exp.1 | — | `stash export` | Writes `snapshots.csv` with columns name, backend, size. owns: `stash export` command |
| exp.2 | exp.1 | `stash report` | Reads `snapshots.csv` written by `exp.1` and prints totals per backend. blocked-by exp.1: consumes snapshots.csv. consumes: `stash export` command |
| exp.3 | exp.2 | Integration sweep: export and report | blocked-by exp.2: consumes all leaves (integration sweep) |

Verified finding: `UNOWNED-SEAM · snapshots.csv column layout · exp.1 writes it and exp.2 parses
it; no task's owns: line names the CSV layout.`
