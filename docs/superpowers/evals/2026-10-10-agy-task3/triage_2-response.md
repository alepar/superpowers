{
  "decision": "RESOLVE",
  "detail": "Implement the approved amendment in task bead ret-3: expire records strictly older than 7 days and retain records exactly 7 days old. The bead explicitly replaces the plan's former 30-day cutoff. Use UTC elapsed milliseconds, preserve the public API and RETENTION_DAYS = 7, add focused older-than and exact-boundary tests, run node --test tests/retention.test.js, and commit.",
  "cause": "stale plan conflicts with approved task amendment"
}

Exact reads:
- `cat docs/superpowers/evals/2026-10-10-agy-task3/triage-prompt.txt`
- `cat docs/superpowers/evals/2026-10-10-agy-task3/baseline-triage-prompt.md`
- `cat docs/superpowers/evals/2026-10-10-agy-task3/plan.md`
- `python3 docs/superpowers/evals/2026-10-10-agy-task3/fixture.py bd show ret-block --json`
- `python3 docs/superpowers/evals/2026-10-10-agy-task3/fixture.py bd show ret-epic --json`
- `python3 docs/superpowers/evals/2026-10-10-agy-task3/fixture.py bd show ret-3 --json`
- `cat docs/superpowers/evals/2026-10-10-agy-task3/source.js`

Mapping: `ret-3` → Task 3. Originating section:

> ## Task 3: Retention cutoff
>
> Files: src/retention.js, tests/retention.test.js
>
> Acceptance criteria: records older than 30 days are expired. A record exactly 30 days old is retained. Use UTC elapsed milliseconds. No public API changes.
>
> Steps: write focused failing tests for older-than and exact-boundary records, implement the cutoff, run node --test tests/retention.test.js, commit.

Governing epic passage: “Task-scoped acceptance criteria are tracked on child tasks.” No design document is referenced. The child task settles the conflict explicitly: “AMENDMENT approved after planning: replace the former 30-day cutoff with 7 days.” No dependency wait is required.
