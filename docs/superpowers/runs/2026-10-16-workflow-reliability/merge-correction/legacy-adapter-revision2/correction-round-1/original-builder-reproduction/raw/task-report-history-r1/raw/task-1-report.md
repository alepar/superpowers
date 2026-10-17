# Task super-plan-ufz.1

Status: IMPLEMENTED

- Initial base: `444ae642f59a22886526b41538eafadd8ff9faca`
- Review base after rebase: `01ff39cc0b6fc0effdf559e9b1164273610c24e6`
- Head: `f2058a544790e4986f749228847d58b4519c4ec5`
- Branch: `task-super-plan-ufz.1`
- Worktree: `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.1`
- Stacked: false. No tracker closure or integration writes were performed.

## Implementation

PR assembly resolves `--base` and `--head` once with `git rev-parse --verify --end-of-options <ref>^{commit}`. Its returned `source` object, triage range, rendered diff commands, and source commands use those captured identities. Unresolved source inputs fail even when a caller supplies `--diff-stat`. Supplied patch/stat-only inputs retain their existing contract and require captured commits before repository source reads.

Task review carries the implementer's head as `[HEAD]`; packages, test diffs, source reads, and base recovery use captured commits. Seam review uses the merge report's head, and check-fix review uses the fixer's head. Task review retains its existing no-test-run policy.

The existing Finish ledger-read dispatch captures verified `reviewBase`/`reviewHead` fields alongside its text. Assembly, final single/cluster/seam reviews, and direct-input assembler fallbacks consume that same pair. Failed or missing capture leaves an explicit unavailable review with evidence; it never falls back to moving refs. There is no new dispatch or workflow engine. The documented dryRun call counts remain 48, 19, and 23.

The ordinary CLI carries explicit `--head` for task and check-fix review, and `--base`/`--head` for review assembly and final reviews; equivalent Launch `reviewBase`/`reviewHead` values are supported. Moving source refs are rejected at that boundary. History/assess callers retain their existing inputs.

Existing review prompt blocks permit unique review-owned detached worktrees when a filesystem view is needed and separate mutable output/temp directories for reproductions. They keep caller checkouts read-only and describe caller commit/status differences as evidence without assigning causality from differences alone or restoring an old snapshot.

Caller tracing found two necessary interfaces outside the original enumerated files. The super-auto roast row now captures its head once, passes the same pair into assembly and super-roast, and keeps it on assembly fallback. The report-verdict producer/parser fixture supplies explicit commit inputs. These changes only adapt the existing calls.

## Final verification

All commands ran from the absolute task worktree above. The exact environment prefix was:

```bash
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.1 HOME=/tmp/sp-bce79baa/super-plan-ufz.1/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.1/config XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.1/data XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.1/cache XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.1/state
```

Each final command had that prefix and exited 0:

```text
bash tests/super-roast/test-assemble-args.sh
  [PASS] captured PR inputs survive caller advancement; independent mutable reproductions preserve caller and sibling
All super-roast assemble-args tests passed

bash tests/super-code/test-dispatch-text.sh
  [PASS] task review receives captured implementation head
  [PASS] base check uses captured head
  [PASS] task review rejects a moving source ref
  [PASS] final review rejects a moving source ref
  [PASS] regenerated task/assembly/single/cluster/seam prompts preserve captured source across two caller advances
dispatch-text: all tests passed

node tests/super-code/replay-harness.mjs
  [PASS] task review pins implementation head
  [PASS] assembler receives captured final range
  [PASS] final reviewer uses same source identities
  [PASS] final-review:cluster:1 shares captured final source
  [PASS] final-review:seam shares captured final source
  [PASS] failed source capture remains unavailable with command evidence
  [PASS] 48 agent dispatches (got 48) — the doc's "Expected dispatch count" arithmetic
  [PASS] 19 agent dispatches (got 19)
  [PASS] 23 agent dispatches (got 23)
1779 passed, 0 failed

bash tests/super-code/test-report-verdict.sh
report-verdict: all tests passed

bash tests/super-auto/test-contract-lint.sh
All super-auto contract lint tests passed
```

The first three final checks ran after the clean rebase onto `01ff39cc`; subsequent changes were only the super-auto call arguments and report-verdict fixture, checked by the last two commands. `git diff --check` passed. The replay covers the three documented dryRun scenarios as well as live-sim prompt builders; it is simulated Workflow evidence, not a hosted Workflow execution.

Toolchain: this zero-dependency repository has no local environment/install step. `node` is the system interpreter at `/opt/homebrew/Cellar/node/26.9.0/bin/node`; test-runner scripts, package metadata, and package-under-test sources all resolve inside the isolated task worktree. No external package checkout or installed copy supplied the tested product.

## TDD evidence

Before producer edits, with `TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.1`:

```text
bash tests/super-roast/test-assemble-args.sh
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal
actual: undefined
expected: { repo: <temporary caller>, base: <captured SHA>, head: <captured SHA> }
exit 1

bash tests/super-code/test-dispatch-text.sh
  [FAIL] task review receives captured implementation head
  [FAIL] base check uses captured head
dispatch-text: 8 failure(s)
exit 1

node tests/super-code/replay-harness.mjs
  [FAIL] task review pins implementation head
  [FAIL] assembler receives captured final range
  [FAIL] final reviewer uses same source identities
1771 passed, 3 failed
exit 1
```

An initial dispatch fixture run also encountered Bash 3's unset empty-array expansion; that fixture was corrected before the recorded full eight-failure RED run. Later moving-ref rejection assertions were added before implementing boundary validation and both failed with exit 0 instead of expected exit 2. Caller tracing reproduced five report-verdict producer/parser failures before supplying that fixture's newly required commit inputs. The final commands above are the GREEN evidence.

The new assertions can fail on concrete regressions: a missing/incorrect `source` object, a diff/source command naming the advanced caller commit, accepting a branch name as a captured commit, a changed caller or sibling sentinel, a final reviewer receiving a different pair than assembly, or a capture failure dispatching an unpinned review. The real Git fixture regenerates all relevant ordinary prompts after two caller commits and executes their rendered final diff/source identities. The roast fixture creates two detached worktrees, mutates one, and compares caller and sibling source/output bytes.

## Files changed

- `skills/super-roast/SKILL.md`
- `skills/super-roast/scout-prompts-pr.md`
- `skills/super-roast/judge-seat-prompts.md`
- `skills/super-roast/scripts/assemble-args.mjs`
- `skills/super-code/coordinator.js`
- `skills/super-code/task-reviewer-prompt.md`
- `skills/super-code/scripts/dispatch-text.mjs`
- `skills/super-code/assembler-prompt.md`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-auto/SKILL.md` — direct caller arguments only
- `tests/super-roast/test-assemble-args.sh`
- `tests/super-code/test-dispatch-text.sh`
- `tests/super-code/replay-harness.mjs`
- `tests/super-code/test-report-verdict.sh` — direct caller fixture arguments only

## Test hygiene

None. After completed runs the installed `stop-run-processes --check <task worktree> /tmp/sp-bce79baa/super-plan-ufz.1` returned exit 0 with no `match:` lines. The final stop sweep returned no `survived:` lines. No background services were started by the implementation agent. A check attempted from the task cwd was correctly refused because its root contained the checker; subsequent checks ran from the read-only original checkout. Matches observed while replay was still executing were its active test processes, not post-run leaks.

## Assumptions

- The current bead had no comments or amendments; its requirements and frozen Task 1 brief are compatible.
- Parent-directed existing safety controls and baseline evaluation are retained. Installed writing-skills was read and applied to the concrete source/resource interface instructions; the parent owns fresh-agent before/after evaluation.
- Review-owned resource naming consumes caller artifact destinations; invocation/runTag lifecycle changes remain Task 8's scope.
- The source-pair interface requires callers to identify the review snapshot. Patch/stat-only roast input remains valid for supplied patch data, while repository access requires captured identities.

## Parent-owned behavioral acceptance scenario

Use a temporary repository with a base commit, reviewed head, tracked caller sentinel, and two concurrent review seats. Give the agents the actual changed task/final or PR prompts and the captured pair. Advance the caller integration branch twice after capture; one advance should be a legitimate concurrent integration change. Seat A needs a reproduction that writes source/build outputs. Seat B owns an existing output sentinel.

Expected observations: diffs and `git show` reads still identify the captured head; necessary filesystem access uses a unique detached worktree at that head; Seat A's mutable outputs are separate from caller and Seat B; both sentinels remain byte-identical; caller commit/status changes are reported with evidence without automatic attribution to reviewer damage and without checkout/reset/restore. Task review should still decline to rerun tests. Repeat with an unavailable assembler so direct-input final review retains the same pair.

Evidence pointers for this scenario are the committed advancing-caller fixture in `tests/super-code/test-dispatch-text.sh`, the independent-worktree fixture in `tests/super-roast/test-assemble-args.sh`, and the captured final single/cluster/seam/failure scenarios near the beginning of `tests/super-code/replay-harness.mjs`. The parent received the scenario and owns recording fresh-agent results; this report does not claim that evaluation has run.

## Concerns

- Fresh-agent instruction evaluation remains parent-owned and required for the behavioral acceptance item. Deterministic fixtures establish mechanical source stability and resource isolation, not autonomous agent adherence.
- No hosted Workflow/live model execution was performed by this implementer. The ordinary shell/Node fixtures and in-process Workflow replay passed.

