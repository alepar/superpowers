# Task 19 qualifier correction

The earlier statement that canonical and retained Task 19 report/review bytes differ was incorrect and is withdrawn. The mechanical `coverage.json` comparison already recorded `sameAsCanonicalBytes:true` for both. No other canonical source was compared.

Frozen revision: `86ce3567e365fed967d50f3f4eeca77783fccf8b`. Both frozen Git blobs and current raw files establish these exact pairs:

| Canonical raw path | Handoff copy | SHA-256 | Bytes |
|---|---|---|---:|
| `task-report-history-r1/raw/task-19-report.md` | `fix-r1-handoff/source/task-19-report.md` | `f87cb8fbc6ae1145de527bfe6214f2c55e8430d0d7a1f4d51463a3d00cbcc44e` | 47192 |
| `task-report-history-r1/raw/task-19-review.md` | `fix-r1-handoff/source/task-19-review.md` | `caa0325029349cd0cf07f973ad92b84ffee8025964dc55d73ab02f40e3e4eb43` | 20313 |

No differing revision is established. Exact archive-copy equality does not apply a semantic finding link, register a canonical record or resolve an obligation.

## Corrected temporary artifacts

- `HANDOFF.md`
- `adapt_history.py`
- `coverage.json`
- `coverage.md`
- `finalize.py`
- `occurrence-projection.md`
- `project_occurrences.py`
- `task19-variant-projection.json`
- `variants/variant-1-task-19-report.md.sidecar.json`
- `variants/variant-2-task-19-review.md.sidecar.json`
- `variants/variant-3-task-19-review-initial.diff.sidecar.json`

This correction also adds `task19-qualifier-correction.json` and this report. The original durable intake copy was read only; the parent will preserve it and store explicitly versioned corrections. All 79 main source sidecars, the five original strict JSON copies, source populations and occurrence counts are unchanged.
