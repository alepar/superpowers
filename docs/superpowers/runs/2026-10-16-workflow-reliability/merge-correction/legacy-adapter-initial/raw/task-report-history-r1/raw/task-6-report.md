# super-plan-ufz.10 — implementation evidence

Status: IMPLEMENTED

- Task branch: `task-super-plan-ufz.10`
- Initial base: `4744895d50b9350ee5296a372d412af1e01b8533`
- Final base after rebase: `c70245ce4e73d3895062cdc42515c05a50a38844`
- Head: `0a58cc008fab96f16105d43688df18f069102249`
- Stacked: false
- Worktree: `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.10`
- Commit: `fix(super-code): bound profiler waits by observed availability`

## Implementation

The existing profiler now loads optional tracker creation evidence for Workflow as well as ordinary runs, and retains optional creation evidence supplied in planner mapping rows. Per-bead JSON has distinct `createdAt`, `mappingReadyAt`, and `dependencyReadyAt`. Missing timestamps remain null. Timed mappings can establish availability even when creation itself is unknown; neither mapping completion nor invocation start replaces unknown dependency timing.

Final-attempt waits and carried time require supported readiness and include the creation bound. External or unobserved dependency releases leave readiness and wait/carried durations unknown. The observed critical path splits pre-availability time from measured task wait and labels an unsupported readiness gap `unmeasured-gap`. Baseline aggregation excludes unknown waits from measured totals and preserves their count as unmeasured.

Schedule estimates retain creation, mapping and invocation boundaries. Unknown readiness uses observed dispatch as a conservative modeled release. Dependencies represented inside the model release dynamically in each scenario; known releases outside the model remain fixed. This preserves historical dependency-chain estimates and the benefit of faster parents without releasing work before its existence or invocation.

Ordinary tracker topology is explicitly an observed residual snapshot. An absent timed planner stays unknown; the initial planner cannot supply a mapping timestamp for a task evidenced as created later. Planner rows cached without a transcript do not acquire a guessed mapping time. Untimed edge cuts keep unknown timestamps as well. Historical topology is not reconstructed.

The diagnosis retains critical-path planning time and reports `planning-bound` when planning exceeds half the observed task-graph window. Counterfactual stdout/JSON and Markdown identify estimates and their actual window (first dispatch to last landing, or last task step when nothing landed). Graph scope is labeled `observed invocation/residual graph`. All-agent concurrency and task-slot concurrency have independent JSON scopes and measured peaks; the existing chain fixture measures 3 agents versus 2 task slots.

The invoking session owns one profile generation and one complete stdout append after each settled Workflow or ordinary invocation. Finish and collection do not generate it again. Super-auto copies that invocation's existing md/json pair after collection. `--out` also writes a qualified unavailable pair on exit 3, with no invented timing window, so unavailable output can follow the same collection path.

## Verification

No package install/setup is defined for these native Node/Bash tests. The interpreter is `/opt/homebrew/bin/node`; the runner scripts and package under test are the files in the assigned worktree. `node -e 'console.log(import.meta.resolve("./skills/super-code/scripts/run-profile.mjs"))'` resolved the profiler inside that worktree. No other checkout's profiler or runner was used.

Final checks ran after the clean rebase, at the final head above. The exact final profiler command was:

```bash
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.10 && set -o pipefail && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.10 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.10/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.10/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.10/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.10/state bash tests/super-code/test-run-profile.sh | rg '\[FAIL\]|expected:|got:|failure\(s\)|all tests passed|creation bounds|model cannot release|unknown.*tim|planning-dominated|scope|measured independently|baseline keeps|critical path cannot|ordinary initial planner|ordinary external|unavailable artifacts'
```

Exit 0; relevant output:

```text
  [PASS] creation bounds wait while mapping and dependency evidence retain their times
  [PASS] model cannot release the late task before creation
  [PASS] critical path cannot call pre-creation time a task wait
  [PASS] unknown external dependency timing cannot become measured readiness
  [PASS] baseline keeps unknown waits unmeasured
  [PASS] planning-dominated diagnosis and model window
  [PASS] graph scope is explicit
  [PASS] JSON graph scope
  [PASS] separate JSON concurrency scopes
  [PASS] all-agent and task-slot peaks are measured independently
  [PASS] ordinary initial planner cannot establish mapping for a task created later
  [PASS] ordinary external dependency timing stays unknown
  [PASS] unavailable artifacts are qualified without invented timings
run-profile: all tests passed
```

The whole suite ran; output filtering retained failures and selected regression evidence. Its existing historical timing and schedule expectations were not changed. Other new assertions cover exact timestamp meanings, null unknown creation/readiness/carried fields, planning diagnosis in Markdown/stdout, estimate labels, and the qualified exit-3 pair.

The exact final in-flight command was:

```bash
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.10 && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.10 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.10/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.10/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.10/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.10/state bash tests/super-code/test-run-profile-in-flight.sh
```

Exit 0; relevant output:

```text
run-profile --in-flight: Claude Code
  [PASS] exits 0
  [PASS] unfinished dispatches only, oldest first, unknown ages last; other epic's run and finished agents skipped
run-profile --in-flight: Codex
  [PASS] exits 0
  [PASS] only the child whose last task event is task_started
run-profile --in-flight: scans only the named session (3000 unrelated sessions and rollouts present)
  [PASS] both harnesses in 216 ms (< 2000)
  [PASS] run-profile.mjs parses
run-profile-in-flight: all tests passed
```

The missing-transcript in-flight fixture now also supplies a task-creation timestamp; its dispatch age remains `unknown`. Neither suite was slow (each completed in under one minute). `git diff --check` exited 0, and `git status --short` was empty after commit/rebase. A caller search found `test-run-digest.sh` covers mocked `--in-flight` transport, whose interface is unchanged; the actual in-flight callers are covered by the second suite.

## TDD evidence

Used test-driven-development for deterministic mechanics and writing-skills for the protocol/source changes. Before changing production calculations, added synthetic scenarios to the existing shell suite and ran:

```bash
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.10 && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.10 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.10/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.10/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.10/cache bash tests/super-code/test-run-profile.sh
```

RED exited 1 with `run-profile: 14 failure(s)`. Existing checks passed; representative new failures:

```text
[FAIL] creation bounds wait while mapping and dependency evidence retain their times
  expected: 2026-10-01T00:10:00.000Z 2026-10-01T00:01:00.000Z 2026-10-01T00:01:00.000Z 2026-10-01T00:10:00.000Z 60000 0
  got:         2026-10-01T00:01:00.000Z 600000 0
[FAIL] model cannot release the late task before creation
  expected: 640000
  got:      100000
[FAIL] unknown external dependency timing cannot become measured readiness
  expected: [null,"2026-10-01T00:01:00.000Z",null,null,null,null,"unknown"]
  got:      [null,null,null,"2026-10-01T00:01:00.000Z",600000,0,"unexplained"]
[FAIL] ordinary residual snapshot without a planner does not invent historical readiness
  expected: ["2026-10-01T00:10:00.000Z",null,null,null,null,null]
  got:      [null,null,null,"2026-10-01T00:11:00.000Z",0,0]
```

These demonstrate the original incorrect pre-creation wait/model release and fabricated known readiness. The absent diagnosis and task-slot objects also produced assertion-evaluation errors during this initial RED run; those missing objects were not counted as measured green assertions.

Two additional critical-path assertions were then run before implementing their gap split. RED exited 1 with exactly these failures:

```text
[FAIL] critical path cannot call pre-creation time a task wait
  expected: 540000 60000
  got:       600000
[FAIL] unknown readiness gap remains unmeasured on the critical path
  expected: 600000
  got:      undefined
run-profile: 2 failure(s)
```

The unavailable-artifact probe also ran before its implementation: `run-profile --discover --epic unavailable --projects /tmp/sp-bce79baa/super-plan-ufz.10/empty --out /tmp/sp-bce79baa/super-plan-ufz.10/unavailable-red`, with isolated HOME/XDG paths. It printed `Profile: unavailable` and produced no JSON, so the subsequent file-existence check exited 1.

Finally, the baseline-unknown, late-created ordinary-planner and external-ordinary-dependency cases were added and run before their fixes. RED exited 1 with `run-profile: 3 failure(s)`:

```text
[FAIL] baseline keeps unknown waits unmeasured
[FAIL] ordinary initial planner cannot establish mapping for a task created later
  expected: [null,null,null]
  got:      ["2026-10-01T00:01:00.000Z","2026-10-01T00:10:00.000Z",60000]
[FAIL] ordinary external dependency timing stays unknown
  expected: [null,null,null]
  got:      ["2026-10-01T00:01:00.000Z","2026-10-01T00:01:00.000Z",600000]
```

Their filtered RED commands used the same environment, runner and `set -o pipefail` as final verification, retaining `[FAIL]`, expected/got and the failure summary. Final GREEN evidence above exercises all these checks. A value such as 600000 wait instead of 60000, a guessed nonnull timestamp, equal 3/3 concurrency peaks instead of 3/2, or task-only diagnosis instead of planning would fail the corresponding assertions.

## Files changed

- `skills/super-code/scripts/run-profile.mjs`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-auto/SKILL.md`
- `skills/super-auto/report-prompt.md`
- `tests/super-code/run-profile-fixture.mjs`
- `tests/super-code/run-profile-ordinary-fixture.mjs`
- `tests/super-code/test-run-profile.sh`
- `tests/super-code/test-run-profile-in-flight.sh`

## Test hygiene

All tests used `TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.10`; both suites set HOME to their fixture home beneath TMPDIR. XDG config/data/cache homes were isolated there, with XDG state also explicit in final verification. The ad-hoc product probe used the same isolated HOME/XDG roots.

No `match:` or `survived:` process lines were found. Checks after test runs exited 0 with empty output. The first attempted leak check ran from inside the task worktree and correctly refused an ancestor root (exit 2); it was immediately rerun from `/tmp` and returned 0. Final `stop-run-processes --check <task-worktree> <task-temp-root>` and `stop-run-processes <task-worktree> <task-temp-root>`, both from `/tmp`, exited 0 with empty output. No background services were started and no process required termination.

## Assumptions and amendments

The current bead description/acceptance and `bd comments super-plan-ufz.10` were read before implementation; there were no comments or conflicting amendments. The frozen task-6 brief and approved reliability spec were applied together.

The ordinary path retains its existing initial timed-planner boundary for tasks not evidenced as newer than that planner, preserving historical fixtures. That timestamp means mapping availability, never task creation; it does not supply missing dependency releases. A task created after that planner remains unknown without further per-bead mapping evidence.

In-model dependencies must release dynamically in counterfactuals rather than freezing every observed parent completion. An intermediate GREEN attempt that froze those completions failed existing chain/bound/counterfactual assertions; the corrected model passed the unchanged expectations.

The existing behavior baseline was read at `docs/superpowers/runs/2026-10-16-workflow-reliability/behavior-baseline/report.md` in the integration worktree. Claims C5–C7 passed 5/5 trials in both installed-guidance and control arms. Therefore instruction edits synchronize the generation owner, source fields and output labels; they add no generic stronger judgment policy. The inline deterministic planning-dominated and unknown-timestamp scenarios are in the existing profiler shell suite for the coordinator's interpretation evaluation. No subagents were spawned.

## Concerns and remaining evaluation

The coordinator owns the final fresh-agent interpretation check, live ordinary-subagent evaluation, integrated review and full sweep; they were not run or relabeled as passed here. These deterministic fixtures demonstrate profiler mechanics, not live instruction compliance. No historical topology or timestamp is reconstructed when evidence is absent. Metrics changes belonging to task .9 and invocation identity/collection contracts belonging to task .8 were left to their owners.
