# super-code Coordinator Fixes Implementation Plan

> Note: the skill named super-plan here was renamed super-design on 2026-07-31. Bead ids like `super-plan-2c1` below are historical tracker identifiers, unaffected by the rename.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Make `skills/super-code/coordinator-workflow.md`'s script able to complete a real `bd` epic, fixing the six Critical and three Important defects the whole-branch review confirmed.

**Architecture:** All work is in one file — `skills/super-code/coordinator-workflow.md` — except Task 2, which also touches `skills/super-code/planner-prompt.md`. The script is the canonical executable artifact; the surrounding prose must stay true to it.

**Tech Stack:** Markdown skill docs; a JavaScript Workflow-tool script embedded in a fenced block; `bd` CLI; upstream SDD's `scripts/`.

## Global Constraints

- `skills/subagent-driven-development/` MUST stay byte-identical to `upstream/main`. Verify with `git diff --quiet upstream/main -- skills/subagent-driven-development/`.
- The governing rule holds: fixes must be **coordinator plumbing**, never reimplementations of SDD's per-task mechanics. A round counter and a recorded base commit are plumbing; a re-review rubric is not.
- Every task ends with `node --check` passing on the extracted script block. Parsing is necessary, not sufficient — it cannot catch undefined references.
- Do not renumber the ordinal↔bead-id mapping scheme or patch `scripts/task-brief`.
- Prose and script must agree. This branch has been bitten three times by a document contradicting its own machinery; a fix that leaves stale prose behind is not done.

---

### Task 1: Scope epic closure to this run's tree (C1)

**Files:** Modify `skills/super-code/coordinator-workflow.md` (`closeEpicsPrompt` ~:516, the Close step prose ~:141-143)

- [ ] **Step 1: Replace the unscoped close loop.** `bd epic close-eligible` is repo-global — verified: `--help` exposes only `--dry-run` and `-h`, with no `--label`, `--parent`, or `--mol`. As written the coordinator will close epics belonging to unrelated work (this repo already holds a second live epic, `super-plan-2c1`). Rewrite `closeEpicsPrompt` so the dispatched agent: runs `bd epic close-eligible --dry-run --json` (verified to emit a JSON array, `[]` when nothing is eligible); filters the previewed ids to this run's tree; closes **only** those, explicitly, via `bd close <id>`; and returns `{rootClosed, closedThisRun}` where `closedThisRun` lists only ids it actually closed. Never call the mutating form unfiltered.

- [ ] **Step 2: State the tree-membership test explicitly.** The filter must be a stated rule the agent can apply, not left to inference — the id-prefix convention (`<epicId>` / `<epicId>.<n>`) plus `bd show <id> --json` parentage. Say which is authoritative when they disagree.

- [ ] **Step 3: Update the Close-step prose** (~:141-143) to match, and note in one line why the mutating form is never called unfiltered, so a future editor does not "simplify" it back.

- [ ] **Step 4: Commit** — `fix(super-code): scope epic closure to this run's tree`

---

### Task 2: Fix the mapping contract and dead prompt references (C5, I2)

**Files:** Modify `skills/super-code/coordinator-workflow.md` (`planPrompt` ~:535, `triagePrompt` ~:583), `skills/super-code/planner-prompt.md`

- [ ] **Step 1: Resolve the contradiction.** `planPrompt` ends "Return planPath and the full mapping array"; `planner-prompt.md:84-87` says "one entry per bead planned this round". On round 2 the newly-unblocked beads already have rows, so a round-scoped return is empty, `ordinalFor` returns `undefined` for every id, and `task-brief` is dispatched with ordinal `undefined` — failing the whole round. Make **`mapping` the cumulative full table, every round**, in both files. Anything else breaks refill.

- [ ] **Step 2: Point the builders at their prompt files.** `planPrompt` and `triagePrompt` inline lossy paraphrases while `planner-prompt.md` and `triage-prompt.md` — two of the four files this skill ships — are never referenced from the execution path. Make both builders name their file the way `implementPrompt`/`taskReviewPrompt` name SDD's templates. The paraphrase currently drops `planner-prompt.md`'s requirement that `filesTouched` appear **in the `## Task <N>` body** (without which the implementer never sees it, since `task-brief` extracts only that section) and the over-declare-when-uncertain policy that makes disjoint-file batching fail-safe. Both must survive.

- [ ] **Step 3: Verify** `grep -n 'planner-prompt.md\|triage-prompt.md' skills/super-code/coordinator-workflow.md` shows them referenced from the builders, not only from prose.

- [ ] **Step 4: Commit** — `fix(super-code): make mapping cumulative, reference the shipped prompt files`

---

### Task 3: Carry branch and BASE through the pipeline (C2, C6)

**Files:** Modify `skills/super-code/coordinator-workflow.md` (`RESULT` ~:437, `taskReviewPrompt` ~:556, `reReviewPrompt` ~:571, `reviewAndFix` ~:627-635, `mergePrompt` ~:500/:577, stub table and args JSON)

- [ ] **Step 1: Stop losing `branch`.** `mergePrompt` interpolates `r.branch`, but neither review contract asks for it and `RESULT` requires only `['id','status']` — so every task reaches merge with `branch: undefined`. Prefer **carrying it forward in `reviewAndFix` from the implementer's result** over asking reviewers to echo it: data the coordinator already holds should not round-trip through a subagent that has no reason to preserve it. Apply the same reasoning to `n` and `files`.

- [ ] **Step 2: Record a per-task BASE.** `scripts/review-package` requires `PLAN_FILE BASE HEAD` and exits 2 with fewer than three arguments; `taskReviewPrompt` currently invokes it bare. Add a `base` field to `RESULT`, have the brief/implement stage capture the pre-implementer commit, and pass `PLAN_FILE BASE HEAD` explicitly. Upstream SDD warns at `subagent-driven-development/SKILL.md:238` that `HEAD~1` silently drops all but the last commit of a multi-commit task — do not fall back to it.

- [ ] **Step 3: Fix the documented signature** at ~:188, which omits `PLAN_FILE`.

- [ ] **Step 4: Update the stub table and args JSON** so stubs carry `branch` and `base`, exercising the real path.

- [ ] **Step 5: Commit** — `fix(super-code): carry branch and per-task BASE through the pipeline`

---

### Task 4: Implement the breaker and stop erasing BLOCKED (C3, C4, I6)

**Files:** Modify `skills/super-code/coordinator-workflow.md` (`reviewAndFix` ~:627-635, the Integrate loop ~:498-504, the pipeline stage ~:489, the outer `while(true)` ~:441)

- [ ] **Step 1: Implement the five-round breaker.** `reviewAndFix` runs exactly one fix round and returns unconditionally; a `NEEDS_FIX` re-review is merged with the finding unaddressed. Spec §3.2, `plan.md:16`, `SKILL.md:60`, and this file's own :270-295 all require the cap. Add a round counter, loop fix→re-review while `NEEDS_FIX` up to five rounds, and at the cap take the documented terminal action — file a blocker bead and quarantine, never merge.

- [ ] **Step 2: Stop erasing `BLOCKED`.** Pipeline stage 3 runs `reviewAndFix` unconditionally, so an implementer (or brief) returning `BLOCKED` is handed to a reviewer whose verdict overwrites it — making `if (r.status === 'BLOCKED')` at :499 unreachable and routing blocked work to *merge*. Guard the review stage on the incoming status and route `BLOCKED` straight to the blocker path.

- [ ] **Step 3: Guard the outer loop.** `while(true)` has no progress detection: a triage verdict of `RESOLVE` that never resolves loops forever on the most expensive model. Add a no-progress guard — if a round completes no tasks and closes no epics, stop and report rather than spin.

- [ ] **Step 4: Verify** no path reaches `mergePrompt` with a status other than a clean review result.

- [ ] **Step 5: Commit** — `fix(super-code): implement the five-round breaker, preserve BLOCKED, guard the loop`

---

### Task 5: Ledger, concurrency, and workspace identity (I1, I3, I7)

**Files:** Modify `skills/super-code/coordinator-workflow.md`

- [ ] **Step 1: Make the ledger real.** `SKILL.md:10` states resume-from-ledger as the skill's **Core principle** and :152-179 specifies the line formats — but the script never writes or reads it (`grep` for "ledger"/"progress.md" across the script region returns nothing). Add the mechanical dispatch that appends a completion line per task, and open the run by reading `<workspace>/progress.md` and skipping tasks already recorded complete.

- [ ] **Step 2: Honour `config.concurrency`.** It is read from args, documented in the contract, `SKILL.md:50`, spec §1, and a comment claiming it bounds fan-out — but no code reads it, so a bucket of 12 disjoint tasks dispatches 12 concurrent implementers and 12 worktrees. Bound the per-bucket fan-out.

- [ ] **Step 3: Give each epic its own workspace.** `sdd-workspace` derives its directory from the plan basename; super-code names every epic's plan `plan.md`, so all epics collide on `.superpowers/sdd/plan/progress.md` — defeating the plan-scoping that script exists to provide, and making Step 1's resume rule skip a *different* epic's tasks. Name the plan per-epic and pin the workspace to the integration worktree; state which worktree owns the ledger, since task agents run in their own.

- [ ] **Step 4: Commit** — `fix(super-code): real ledger, honoured concurrency, per-epic workspace`

---

### Task 6: Reconcile prose with the script, then re-validate (meta-finding, M1, I4, I5, I8)

**Files:** Modify `skills/super-code/coordinator-workflow.md`

- [ ] **Step 1: Resolve illustrative-vs-canonical.** :369 calls the script "Illustrative — adapt names/prompts to the epic" while :791 and :874-876 call it canonical and the artifact you re-run. Pick canonical — it is the only executable artifact and carries the baseline — and remove the contradicting line.

- [ ] **Step 2: Fix the inverted parallelism prose** at ~:133: dispatch is concurrent *within* a bucket and serial *across* buckets. Getting this backwards is a write-collision bug for anyone reimplementing the loop.

- [ ] **Step 3: State the epic-scoping precondition** (I4): `--label sp:<epicId>` only matches trees `super-plan` labelled. A hand-made epic, or a sub-epic whose members carry the *root's* label, yields an empty round 1 and a run that exits in seconds looking like clean completion. Say so where the query is defined.

- [ ] **Step 4: Reconcile the blocker-bead re-entry claim** (I5): :229 says the planner re-runs to append rows for newly-created beads "blocker beads included", but blocker beads carry only a `blocker` label — no `sp:<epicId>`, no parent — so both the label filter and the id-extraction grep exclude them. Either label them into the tree or drop the claim; do not leave both.

- [ ] **Step 5: Fix the baseline args id scheme** (I8): ids are extracted with `grep -oE '${epicId}[.0-9]*'`, which needs hierarchical ids (`super-plan-2c1` → `super-plan-2c1.8`), but the recorded args use epic `bd-100` with children `bd-101/102/103`, which that grep would not match. Correct the args to a hierarchical scheme so the canonical scenario teaches the right mental model.

- [ ] **Step 6: Re-run the dryRun and record a fresh baseline.** Hand the updated args back to the controller — **you cannot run the Workflow tool.** The new scenario MUST include a **non-empty round 2** and at least one stub returning **`BLOCKED`** at the implement stage; the previous baseline was structurally incapable of catching five of the six Criticals because round 2 was empty by construction and no stub ever returned `BLOCKED`. Mark the baseline stale until the controller supplies real figures; never predict them.

- [ ] **Step 7: Commit** — `fix(super-code): reconcile prose with script, harden the dryRun scenario`
