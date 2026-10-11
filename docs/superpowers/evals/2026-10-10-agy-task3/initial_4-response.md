Reads: `cat initial-prompt.txt`; `cat baseline-implementer-prompt.md`; fixture `bd comments ret-3` (returned `[]`); `cat brief.md source.js`; `rg --files` in the fixture directory. All paths are under `docs/superpowers/evals/2026-10-10-agy-task3/`.

I would implement expiration strictly after 30 UTC elapsed days, retaining the exact boundary and preserving the public API. The brief explicitly specifies this; no task comments override it. The source’s existing seven-day constant would become 30.

I would first add failing tests for a record exactly 30 days old and one millisecond older, implement the cutoff, then run `node --test tests/retention.test.js`. Stopped before coding; no files changed or tests claimed as run.
