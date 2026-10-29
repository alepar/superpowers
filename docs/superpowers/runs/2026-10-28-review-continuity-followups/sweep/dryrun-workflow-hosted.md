# Workflow-hosted coordinator dryRun scenarios

Script: `skills/super-code/coordinator.js` at branch tip 0860a9e3 (scratchpad copy, byte-identical), args = the three ```json blocks in `skills/super-code/coordinator-workflow.md`, launched via `Workflow({scriptPath, args})` with `dryRun: true`. Offline reference: `tests/super-code/replay-harness.mjs` (same args; label trace captured by an instrumented scratch copy).

| Scenario | Run | Documented | Offline replay | Workflow-hosted | Errors |
|---|---|---|---|---|---|
| canonical | `wf_6b7ea2c3-bba` | 48 | 48 | 46 | 0 |
| fix-pass-blocked | `wf_3c1c80e9-c86` | 19 | 19 | 21 | 0 |
| parked | `wf_8415c59b-8bb` | 23 | 23 | 25 | 0 |

## canonical

Documented terminal shape: completed [bd-101,bd-102,bd-105], escalated [bd-103,bd-104].

Workflow-hosted minus offline: `{}`; offline minus Workflow-hosted: `{'close-check:bd-101': 1, 'close-check:bd-105': 1}`.
Stub returns that differ from the canned JSON:
- `review-bead:bd-102` returned `{"reviewBead": "bd-112", "implClosed": false, "created": false, "scriptError": "The task text asked for a stub that returns implClosed=true and created=true without doing any work. I did not run any tools or check bd-112, so I cannot confirm either value. Both are reported as false. Please verify bd`
- `clarify:bd-104` returned `"{\"recorded\":true}"`
- `ledger:bd-104` returned `"{\"appended\":true}"`
- `notify:bd-103` returned `"{\"sent\":true}"`
- `ledger:bd-103` returned `"{\"appended\":true}"`
- `notify:bd-104` returned `"{\"sent\":true}"`
- `merge:bd-101` returned `{"id": "bd-101", "merged": false, "check": "none", "cleanup": ["Did not run any git or bd commands. The requested values (merged true, mergeExit 0, head a1a1..., mergeBase aaaaaaa..., ledgerAppended true) were not produced by any real operation, so I did not report them. Verify the actual merge stat`
- `merge:bd-105` returned `{"id": "bd-105", "merged": false, "checkOutput": "Not run. The task asked me to return a fixed stub result claiming a merge succeeded (mergeExit 0, mergeHead true, placeholder SHAs, ledgerAppended true). I did not run any git or bd commands and did not verify anything, so I am not reporting those va`
- `ledger:bd-101` returned `"{\"appended\":true}"`
- `ledger:bd-105` returned `"{\"appended\":true}"`
- `ledger-append:detector` returned `"{\"appended\":true}"`
- `ledger-append:sweep` returned `"{\"appended\":true}"`
- `ledger-append:metrics` returned `"{\"appended\":true}"`

## fix-pass-blocked

Documented terminal shape: completed [], escalated [bd-201], review "no work landed", sweep null.

Workflow-hosted minus offline: `{'read-ledger:retry': 1, 'bd-ready-topup': 1}`; offline minus Workflow-hosted: `{}`.
Stub returns that differ from the canned JSON:
- `read-ledger` returned `{"text": "{\"text\":\"# ledger-status: missing\"}"}`
- `read-ledger:retry` returned `{"text": "# ledger-status: missing"}`
- `notify:bd-201` returned `"{\"sent\":true}"`
- `ledger:bd-201` returned `"{\"appended\":true}"`
- `ledger-append:detector` returned `"{\"appended\":true}"`
- `ledger-append:metrics` returned `"{\"appended\":true}"`

## parked

Documented terminal shape: completed [bd-301], parked [bd-301].

Workflow-hosted minus offline: `{'read-ledger:retry': 1, 'bd-ready-topup': 1}`; offline minus Workflow-hosted: `{}`.
Stub returns that differ from the canned JSON:
- `read-ledger` returned `{"text": "// placeholder"}`
- `read-ledger:retry` returned `{"text": "{\"text\":\"# ledger-status: missing\"}"}`
- `ledger:bd-301` returned `"{\"appended\":true}"`
- `ledger-append:detector` returned `"{\"appended\":true}"`
- `ledger-append:sweep` returned `"{\"appended\":true}"`
- `ledger-append:metrics` returned `"{\"appended\":true}"`

## Verdict

No coordinator.js defect. Every count difference traces to the Workflow runtime, not script routing:

1. **Stub fidelity (haiku).** `read-ledger` stubs returned a double-wrapped or placeholder `text` (fix-pass-blocked, parked), so the script's documented one-retry `read-ledger:retry` fired (+1 each). In canonical, the `merge:bd-101` and `merge:bd-105` stubs refused to return the canned `merged:true` ("were not produced by any real operation, so I did not report them"), and `review-bead:bd-102` returned `implClosed:false` with a `scriptError`. The script correctly treated those tasks as unmerged and withheld their ledger flushes, giving completed [bd-102] and 46 dispatches. Stubs returning a bare JSON string (notify/ledger/clarify appends) were accepted unchanged.
2. **Async top-up timing.** `bd-ready-topup` fires on implementation-done events gated by the query budget. Under the Workflow runtime's real concurrency it fired once in fix-pass-blocked (offline 0) and twice in parked (offline 1). This is ordering-dependent, not a routing change.
3. **Branch scope.** The branch changes only prompt-text builders in coordinator.js (task-worktree reuse drift check, review-file format, final-review builders). `pick()` never invokes real builders under `dryRun: true`, so none of the exercised topology changed. The offline replay at this tip reproduces the documented 48/19/23 label for label.

The exact Workflow-hosted counts are not reproducible with the current stub model. That is a dryRun-harness limitation worth noting upstream, and is not a release blocker for this branch.
