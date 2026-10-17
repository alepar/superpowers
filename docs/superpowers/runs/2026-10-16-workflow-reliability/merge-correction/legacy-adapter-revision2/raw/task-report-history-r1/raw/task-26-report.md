# Task 26 — immutable invocation source binding

Implemented `super-plan-ufz.29` on `task-super-plan-ufz.29` in the existing task worktree. Reused the interrupted worktree without discarding its original regression or RED log. Base: 1d0ab308f09598c8c2826cfbca2af119a631d37a. Head: 7db21aaec321ce133ad792f9ffc0e05879e4cf40. Integration was unchanged; the required rebase was a no-op. The task worktree is clean.

## Implementation

The prior real-builder fixture reproduced the root cause: a persisted invocation ID owned fixed assembly/review paths, but Finish captured a newer integration head on resume and neither Launch nor compact Recovery facts bound the ID to its reviewed source.

The existing `dispatch-text.mjs` now provides `bind-review-source`: it persists a compact existing Recovery deferred record carrying `data.reviewSource` with invocationId/base/head, or reads/verifies the existing binding. It accepts captured Launch facts too. Same-ID source mismatch, invalid/conflicting facts, an existing unbound bundle, and attempts to write existing outputs or direct `.diff` packages are refused without replacing partial bytes. `--read` retrieves an existing binding without capturing a new tip. Rendering dispatch text alone is not represented as persistence.

Workflow Finish reads the original compact binding from its existing Resume/Finish digest observations before selecting review inputs. Every existing final assembly, single, cluster, seam and stub producer runs the shared binding guard before writing artifacts. No dispatch was added. A source-guard refusal keeps final review unavailable with `reviewPath: null`, preserving the partial bundle rather than bypassing its findings through direct review. Ordinary assembler unavailability retains the existing direct-input fallback. New invocation IDs can capture newer source independently. Both coordinator instruction paths explain this contract. Existing finding lifecycle and identity/cause handling were not changed. The omitted-ID startup repair owned by task .23 was not touched.

## Acceptance coverage

- Finding-bearing cluster, assembly digest and direct package bytes survive a same-ID resume after head advances from bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb to cccccccccccccccccccccccccccccccccccccccc. The compact fact and resumed prompt retain the original base/head.
- The fixture executes the real binding CLI emitted by the real prompt builders before simulated destructive writer steps, then inspects the authoritative ledger. Binding exists before each write; mismatched source is refused without ledger or bundle replacement.
- Workflow single, split/seam, split/stub and direct fallback paths exercise the guard, source facts, actual fixture artifacts and confirmed/nonconfirmed reviewPath semantics. Ordinary and Workflow Launch forms produce bound source/path arguments across all review modes. Missing Launch persistence produces no review artifact writes.
- Fresh IDs, source retrieval, same-source output refusal and an unbound finding-bearing partial bundle have explicit assertions.
- Unchanged coordinator replay and unchanged ordinary-dispatch caller tests pass. No existing test was edited or loosened.

## Tests and TDD evidence

All commands ran from the absolute task worktree above with this exact environment prefix:

```sh
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29
```

RED command: `node tests/super-code/invocation-source-binding-r1.mjs` on source tree `9e544a4b64d593c254cef710d0fb55ff862cff38`. It exited 1 at the intended first invariant:

```text
AssertionError [ERR_ASSERTION]: captured source must be durable before each artifact writer
actual: false
expected: true
```

The recovered original log is retained unchanged at `evidence/super-plan-ufz.29/red.log`; its original fixture is preserved as `red-fixture.mjs`. This RED observes the missing durable fact, not the assertions after that failure. Later coverage was strengthened to model destructive writes rather than conditionally preserving files inside the fixture.

Final GREEN commands on source tree `b92dfaf4bbf2e897fe1b190a435e0a872564916e`:

```text
node tests/super-code/invocation-source-binding-r1.mjs
11 invocation source-binding scenarios passed
exit 0

node tests/super-code/replay-harness.mjs
2277 passed, 0 failed
exit 0

bash tests/super-code/test-dispatch-text.sh
dispatch-text: all tests passed
exit 0
```

Full outputs are retained at the evidence locations below. `git diff --check` passed. The three documented dryRun scenarios are covered by the unchanged replay. No full suite was run. The final code, instruction and test source was unchanged after source capture and these final checks; the commit additionally includes the retained evidence files generated after capture.

## Evidence and capture commands

These are live executions of local test commands, with injected/canned Workflow agent replies where explicitly identified in configuration. They do not constitute fresh live-agent Workflow or instruction-behavior evaluations. The temporary-index snapshots include all tracked baseline inputs plus the changed source/docs and relevant untracked regression, while preserving the real index.

```sh
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.29
mkdir -p /tmp/sp-bce79baa/super-plan-ufz.29
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.29/red.index git read-tree HEAD
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.29/red.index git add tests/super-code/invocation-source-binding-r1.mjs
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.29/red.index git write-tree # 9e544a4b64d593c254cef710d0fb55ff862cff38
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.29/final.index git read-tree HEAD
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.29/final.index git add skills/super-code/coordinator.js skills/super-code/coordinator-workflow.md skills/super-code/coordinator-subagents.md skills/super-code/scripts/dispatch-text.mjs tests/super-code/invocation-source-binding-r1.mjs
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.29/final.index git write-tree # b92dfaf4bbf2e897fe1b190a435e0a872564916e
```

`evidence`:

```json
[
  {
    "sourceTree": "9e544a4b64d593c254cef710d0fb55ff862cff38",
    "command": "node tests/super-code/invocation-source-binding-r1.mjs",
    "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; real builders/helper; injected coordinator agent replies; original RED fixture",
    "outcome": "fail",
    "location": "evidence/super-plan-ufz.29/red.log",
    "kind": "live"
  },
  {
    "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
    "command": "node tests/super-code/invocation-source-binding-r1.mjs",
    "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; real builders/helper; injected coordinator agent replies",
    "outcome": "pass",
    "location": "evidence/super-plan-ufz.29/focused-final.log",
    "kind": "live"
  },
  {
    "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
    "command": "node tests/super-code/replay-harness.mjs",
    "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; unchanged replay; canned agent replies plus real helper fixtures",
    "outcome": "pass",
    "location": "evidence/super-plan-ufz.29/replay-final.log",
    "kind": "live"
  },
  {
    "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
    "command": "bash tests/super-code/test-dispatch-text.sh",
    "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; unchanged ordinary-dispatch callers; real CLI and prompt builders",
    "outcome": "pass",
    "location": "evidence/super-plan-ufz.29/dispatch-final.log",
    "kind": "live"
  }
]
```

`requiredLiveChecks`:

```json
[
  {
    "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
    "command": "node tests/super-code/invocation-source-binding-r1.mjs",
    "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; real builders/helper; injected coordinator agent replies"
  },
  {
    "sourceTree": "b92dfaf4bbf2e897fe1b190a435e0a872564916e",
    "command": "node tests/super-code/replay-harness.mjs",
    "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.29 HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.29 XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.29; unchanged replay; canned agent replies plus real helper fixtures"
  }
]
```

## Files changed

- `evidence/super-plan-ufz.29/checks.json`
- `evidence/super-plan-ufz.29/dispatch-final.log`
- `evidence/super-plan-ufz.29/focused-final.log`
- `evidence/super-plan-ufz.29/red-fixture.mjs`
- `evidence/super-plan-ufz.29/red.log`
- `evidence/super-plan-ufz.29/replay-final.log`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/dispatch-text.mjs`
- `tests/super-code/invocation-source-binding-r1.mjs`

## Test hygiene

All tests used `/tmp/sp-bce79baa/super-plan-ufz.29` for TMPDIR, HOME and XDG homes. After test runs, the existing integration-owned stop helper checked only this task worktree and temp root. One initial check was invoked from inside the task worktree and exited 2 with its deliberate self/ancestor-root protection; the corrected checks ran from the integration worktree, which was otherwise read-only. No `match:` lines were reported and no test leak was identified. Final `--check` and stop commands both exited 0 with empty output. No `survived:` lines, unknown cleanup results or background processes remain.

Exact final hygiene commands, from the integration worktree:

```sh
bash skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.29 /tmp/sp-bce79baa/super-plan-ufz.29
bash skills/super-code/scripts/stop-run-processes /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.29 /tmp/sp-bce79baa/super-plan-ufz.29
```

## Assumptions and amendments

Read current bead description/acceptance and comments before implementation: there were no comments or task amendments. Applied the frozen task 26 scope together with the current bead. Recovery ownership override explicitly authorized reuse of the existing dirty task worktree; original baseline evidence was inspected and preserved. Reused the existing brief without mutating integration source. Did not modify either authoritative spec or historical review/step-back evidence. The rejected measurement-classification and direct frozen-Git fallback materiality findings remain outside scope. No tracker, Herdr, main, remote, root-acceptance or integration-source mutation was performed.

## Concerns and pending caller work

The brief explicitly leaves bounded fresh-agent changed-instruction evaluation to the enclosing coordinator. That evaluation remains pending; this implementer did not spawn agents. Deterministic real-builder/helper fixtures and unchanged replay/caller checks establish the mechanical behavior, not compliance by a fresh live reviewer. Final sweep, independent review coverage, native-platform checks and root/human acceptance remain caller-owned and pending. Existing partial outputs are deliberately refused rather than reconstructed or overwritten; such an unsettled review remains unavailable with its original evidence preserved, and a newly captured source requires a fresh invocation identity.
