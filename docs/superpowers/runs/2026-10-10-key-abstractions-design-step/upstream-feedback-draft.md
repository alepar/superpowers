# 2026-10-10-key-abstractions-design-step: super-code cannot complete a "verified, nothing to change" bead

Run: super-auto, skills 6.4.2-alepar4.21, Workflow mechanism. 10 beads (6 leaves, a root integration sweep, 3 fix beads), 2 code-roast rounds (converged), 2 design-roast rounds (converged). Findings concern the skill machinery that ran the run, not the content it built.

## Defects

### 1. super-code has no completion path for a bead whose correct result is "verified, nothing to change"

- **Evidence:** the mandatory root `Integration sweep:` bead found nothing to fix and reported IMPLEMENTED twice with no commit. The coordinator treats head == base as BLOCKED (coordinator.js ~1172-1182, "The task was NOT reviewed"), filed a blocker bead and returned `ready-drained`. The orchestrator closed both by hand. Profile: "rework — 19m of dispatch time in attempts that did not land … (IMPLEMENTED, IMPLEMENTED; never landed)". super-design makes this bead mandatory on every tree with ≥2 leaves, so every clean sweep hits it.
- **Premise to verify:** the head == base guard exists to catch implementers who forget to commit; a no-change outcome needs an explicit signal (implementer status plus a sweep/verification marker on the bead) so it doesn't reopen that hole.
- **Suggested fix shape:** a `VERIFIED_NO_CHANGE` implementer status, allowed for sweep/verification beads (or when the report carries the verification commands and output), reviewed and closed with no merge.

### 2. The run profile never names planning as the bound, even when planning is most of the critical path

- **Evidence:** invocation 1: "critical path — 26m = implement 7m · … · planning 15m" (58%), yet "bound — … graph-bound: the 2-bead dependency chain set the pace"; its what-ifs (edge cut, faster bead, split) never model planning. Invocation 2: "planning 7m" of 14m (50%), verdict "bead-bound", "none saves more than 1%".
- **Premise to verify:** planning is serial before a round's first implementer and can be shortened or overlapped (the plan / plan-rest split exists; why did ready-bead planning still take 15m for 6 beads?).
- **Suggested fix shape:** a "planning-bound" verdict when planning exceeds about a third of the critical path, and a planning what-if.

## Run metrics

### Judge panel
- design round 1: seat-agreement panels 33 · rr 0.82 · rg 0.79 · fg 0.73 · unanimous 0.67 (same-family, Workflow)
- design round 2: panels 5 · rr 0.60 · rg 0.80 · fg 0.40 · unanimous 0.40
- PR round 1: panels 12 · rr 0.58 · rg 0.83 · fg 0.58 · unanimous 0.50
- PR round 2: panels 4 · rr 0.75 · rg 0.50 · fg 0.25 · unanimous 0.25

### Fix loop
- PR round 1: Should-fix (10 confirmed) → step-back patch (3 clusters) → scope-filter 7 in-scope · 5 punch-listed → 3 cluster fix beads
- PR round 2: Nit (2 confirmed) [converged], 5 resolved, 0 regressed

### Merge-back
- 9 merges, 0 merge-failed, 0 rebase conflicts, 0 seam reviews, 0 check failures; completions review-clean 9, after fix pass 0

### Coverage
- round 1: requirements 12 · mapped 10 · unmapped 3; round 2: requirements 14 · mapped 14 · unmapped 1; round-2 divergence widening: yes (11 → 12 findings, 83% novel)

### Timing
- code phase: wall 55m, task graph 26m (planning 15m); fix round: wall 18m, task graph 14m (planning 7m)

### Bead graph
- 7 leaves at design time, depth 2, width 3.5; 1 planner-added edge (.4 ← .3); fix round 3 independent beads

## Design questions

- **Who closes a root epic whose acceptance is the caller's?** The fix-round re-entry returned `root-closed` (coordinator.js ~531, from close-epics alone) while the root's acceptance criteria (super-auto phase-6 eval, final-tip sweep, docs), which coverage deliberately put there, were still owed. A: super-code never closes a caller-handed root and returns a new stopReason (e.g. `leaves-done`); B: keep auto-close and have super-auto reopen or annotate it. The tracker is wrong between phases under B.

## Doc gaps

- **Decomposition and coverage don't ask which existing references a change makes stale.** Inserting a process step left the old "go to §Decomposition" hand-offs owned by no bead; two coverage rounds (all requirements mapped) missed it, and it took a code-roast Must-fix, a fix bead and a second super-code invocation. Suggested: one coverage-reviewer question, "which existing references, hand-offs or callers does this change invalidate, and which bead owns updating them?"

## Already fixed — do not re-litigate

none

## Not established

- Whether per-task reviewers passed implementer reports lacking test command output (the final review's summary says four did; the task reports were not checked), so that candidate was dropped.
- Analyst model: opus.

## Verification bar

Each fix should be checked against a replayed or fresh run: (1) a clean sweep bead closes without a blocker; (2) a planning-dominated profile names planning; (3) the root's tracker state matches its acceptance after a fix round; (4) coverage flags stale hand-offs on a step-insertion change.
