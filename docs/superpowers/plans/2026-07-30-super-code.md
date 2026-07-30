# super-code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `skills/super-code/` — the fork's autonomous beads-driven execution capability as its own skill, per `docs/superpowers/specs/2026-07-30-super-code-design.md` — then rewire its callers.

**Architecture:** super-code owns epic-level concerns only (Workflow coordinator, epic-scoped `bd ready` loop, disjoint-file batching, per-task worktrees off an epic integration branch, serial merge-back, blocker-bead escalation, autonomous tiering). It **calls** upstream `subagent-driven-development` for the per-task loop rather than copying it, so `skills/subagent-driven-development/` stays byte-identical to `upstream/main`.

**Tech Stack:** Markdown skill files; Workflow-tool JavaScript coordinator script (no I/O in the script); `bd` CLI (beads); git worktrees.

## Global Constraints

- `skills/subagent-driven-development/` must remain **byte-identical to `upstream/main`** at every commit. Verify with `git diff --quiet upstream/main -- skills/subagent-driven-development/`. If a task needs to change it, the task is wrong.
- Per-task mechanics are **referenced, never copied**. super-code names SDD's artifacts exactly: prompts `task-reviewer-prompt.md`, `re-review-prompt.md`, `implementer-prompt.md`; scripts `scripts/sdd-workspace`, `scripts/task-brief`, `scripts/review-package`. The deleted `spec-reviewer-prompt.md` and `code-quality-reviewer-prompt.md` must appear nowhere.
- **Governing rule, stated verbatim in SKILL.md:** *"If a change would improve per-task review quality, it belongs upstream in `subagent-driven-development`, not here. super-code may only grow in the epic-level dimension."*
- Fix rounds inside a task use SDD's **five-round breaker** and its adjudication rules (park with a ruling, or stop on a load-bearing finding). super-code adds no competing cap.
- Autonomous model tiering: **opus** for planning, blocker triage, and the final whole-epic review; **sonnet** for implementation and per-task reviews.
- Parallelism: dispatch concurrently only when file sets are disjoint; serialize same-file tasks; cap concurrency at **~4**.
- The coordinator script does **no I/O** — all file, shell, and `bd` access happens inside dispatched agents.
- Zero new dependencies.
- Source content: `pre-upstream-merge-backup:skills/subagent-driven-development/{coordinator-workflow.md,planner-prompt.md,triage-prompt.md}` plus that branch's SKILL.md beads sections. Read with `git show <branch>:<path>`.

---

### Task 1: Port `coordinator-workflow.md`, reconciled against current SDD

**Files:**
- Create: `skills/super-code/coordinator-workflow.md`

**Interfaces:**
- Produces: the coordinator contract every later task references — the `args` shape
  `{ epicId, integrationBranch, dryRun, config: { concurrency: 4, models: { planner:'opus', implementer:'sonnet', reviewer:'sonnet', triage:'opus', finalReview:'opus' } }, prompts: {...} }`, and the per-task pipeline sequence
  `task-brief → implementer → review-package → task-reviewer → (fix rounds ≤5 → re-review) → ledger`.

- [ ] **Step 1: Read the source.** `git show pre-upstream-merge-backup:skills/subagent-driven-development/coordinator-workflow.md` (198 lines). Note its existing sections: key constraint (script does no I/O), authoring pitfalls, pre-flight, coordinator loop, per-task pipeline, serial merge-back, blocker-bead path.

- [ ] **Step 2: Write the file**, preserving every section above, with these reconciliations applied:
  - **Per-task pipeline:** replace the two-stage `spec-reviewer-prompt.md` → `code-quality-reviewer-prompt.md` dispatch with SDD's sequence: run `scripts/task-brief` for the task brief, dispatch `implementer-prompt.md`, run `scripts/review-package BASE HEAD`, dispatch `task-reviewer-prompt.md`, and on findings run fix rounds that each end with a scoped `re-review-prompt.md` over the fix diff.
  - **Fix rounds:** adopt SDD's five-round breaker verbatim in behavior — rounds 1–3 resume the original implementer, rounds 4–5 dispatch a fresh implementer on a more capable model, and at the cap adjudicate (park with a ruling, or stop on a load-bearing finding). In autonomous mode, a load-bearing stop files a **blocker bead** rather than halting the whole run.
  - **Workspace and ledger:** use `scripts/sdd-workspace` for the artifact directory and write completion lines to SDD's durable ledger, so an interrupted epic resumes from the ledger rather than coordinator memory.
  - **Keep fork-specific:** per-task worktrees branched off the epic integration branch, serial merge-back in dependency order, and the blocker-bead escalation that notifies, quarantines the blocked task, and continues the rest.
  - **Keep the authoring-pitfalls section** — it documents `args`/ready-query/`--json` traps that crash a coordinator before real work starts.

- [ ] **Step 3: Verify no stale references.**

```bash
grep -nE 'spec-reviewer|code-quality-reviewer' skills/super-code/coordinator-workflow.md   # expect: no output
grep -c 'task-reviewer-prompt.md\|re-review-prompt.md\|sdd-workspace\|task-brief\|review-package' skills/super-code/coordinator-workflow.md  # expect: >= 5
```

- [ ] **Step 4: Commit**

```bash
git add skills/super-code/coordinator-workflow.md
git commit -m "feat(super-code): coordinator workflow reconciled against upstream SDD loop"
```

### Task 2: Port the planner and triage prompts

**Files:**
- Create: `skills/super-code/planner-prompt.md`
- Create: `skills/super-code/triage-prompt.md`

**Interfaces:**
- Consumes: the pipeline sequence from Task 1.
- Produces: `prompts.planner` and `prompts.triage` — plain STRINGS, harness-neutral (dispatchable verbatim via the Task tool), no Workflow-specific syntax.

- [ ] **Step 1: Read both sources.**

```bash
git show pre-upstream-merge-backup:skills/subagent-driven-development/planner-prompt.md   # 42 lines
git show pre-upstream-merge-backup:skills/subagent-driven-development/triage-prompt.md    # 48 lines
```

- [ ] **Step 2: Write `planner-prompt.md`** — the per-task planner (opus). Preserve its existing job: given a beads issue, produce the task's implementation plan and store it on the issue. Reconcile only where it names review stages: a plan it writes is consumed by SDD's `task-brief`, so it must describe files-to-touch and an independently testable deliverable, not a two-stage review contract.

- [ ] **Step 3: Write `triage-prompt.md`** — blocker-bead triage (opus, the "coordinator-brain" role). Preserve its job: read a blocker bead, decide whether the blockage is a context problem (re-dispatch with more context), a capability problem (escalate the model tier), a decomposition problem (split the task), or a plan defect (escalate to the human). Add one line making the autonomous-mode contract explicit: triage never silently drops a blocked task — it either returns it to the ready queue with a changed approach, or leaves it quarantined with the reason recorded on the bead.

- [ ] **Step 4: Verify harness-neutrality.**

```bash
grep -nE 'agent\(|parallel\(|export const meta' skills/super-code/planner-prompt.md skills/super-code/triage-prompt.md  # expect: no output
```

- [ ] **Step 5: Commit**

```bash
git add skills/super-code/planner-prompt.md skills/super-code/triage-prompt.md
git commit -m "feat(super-code): planner and blocker-triage prompts"
```

### Task 3: `SKILL.md`

**Files:**
- Create: `skills/super-code/SKILL.md`

**Interfaces:**
- Consumes: Tasks 1–2 (references all three files by name).
- Produces: the entry point; its frontmatter description is the trigger surface tested in Step 3.

- [ ] **Step 1: Read the source sections.** From `git show pre-upstream-merge-backup:skills/subagent-driven-development/SKILL.md`, extract the fork-added sections: "Always Use Subagents; Parallelize Where Feasible" (including the disjoint-file paragraph and the ~4 concurrency cap), "Beads Mode", "Worktree topology (autonomous mode)", the autonomous tiering paragraph, and "Autonomous Coordinator" plus its "Autonomous mode — also never" red flags.

- [ ] **Step 2: Write SKILL.md.** Follow the house structure of a sibling skill (`skills/super-plan/SKILL.md` is the closest analogue — read it for register). Required content:
  - Frontmatter: `name: super-code`; description stating **triggering conditions only** — fires on executing a beads epic / `bd`-backed work queue; explicitly not for plan-file execution (that is `subagent-driven-development`) and not for ad-hoc parallel investigation (that is `dispatching-parallel-agents`). Do **not** summarize the workflow in the description — `skills/writing-skills/SKILL.md` documents that a workflow-summarizing description causes agents to follow the description instead of the skill body.
  - **Boundary section** carrying the governing rule verbatim from Global Constraints, plus the two-column split: what super-code owns (coordinator, epic-scoped `bd ready` loop, disjoint-file batching, worktrees + serial merge-back, blocker beads, tiering) versus what it delegates to SDD (`task-brief` → implementer → `review-package` → task-reviewer → scoped re-review → ledger, five-round breaker, helper scripts, plan-scoped workspace).
  - **Trigger rule:** any beads-backed execution — SDD handles plan-file execution; the moment there is a `bd` epic, super-code runs it, autonomous or interactive.
  - **Worktree topology:** per-task worktrees off the epic integration branch; serial merge-back in dependency order.
  - **Model tiering table:** opus for planner / triage / final whole-epic review; sonnet for implementer / per-task reviews.
  - **Parallelism rule:** concurrent only when file sets are disjoint; same-file tasks serialize; cap ~4.
  - **Red Flags:** never edit `skills/subagent-driven-development/` (it must stay byte-identical to upstream); never copy SDD's reviewer prompts into this skill; never silently drop a blocked task — file a blocker bead; never let a fix loop run past SDD's five-round breaker; never dispatch parallel implementers whose file sets overlap.
  - Pointers to `coordinator-workflow.md`, `planner-prompt.md`, `triage-prompt.md` for detail rather than restating them.

- [ ] **Step 3: Trigger micro-test.** Dispatch 3 fresh haiku subagents, each given ONLY the frontmatter description plus one scenario, asked "would you invoke this skill? yes/no":
  - (a) "run the epic in beads — build out all the ready tasks" → expect **yes**
  - (b) "execute this implementation plan task by task, review between tasks" → expect **no** (that is SDD)
  - (c) "spin up a few agents to investigate why these three tests are flaky" → expect **no** (that is dispatching-parallel-agents)

  Any miss → tighten the description wording and re-run all three. Record the probes, expected answers, and results in SKILL.md so a future editor knows what to re-check.

- [ ] **Step 4: Verify constraints.**

```bash
git diff --quiet upstream/main -- skills/subagent-driven-development/ && echo "SDD untouched OK"
grep -nE 'spec-reviewer|code-quality-reviewer' skills/super-code/*.md   # expect: no output
grep -c 'belongs upstream' skills/super-code/SKILL.md                   # expect: >= 1
```

- [ ] **Step 5: Commit**

```bash
git add skills/super-code/SKILL.md
git commit -m "feat(super-code): SKILL.md with SDD boundary rule and trigger micro-test"
```

### Task 4: Coordinator dryRun validation

**Files:**
- Modify: `skills/super-code/coordinator-workflow.md` (add a dryRun policy + stub table + recorded assertions section)

**Interfaces:**
- Consumes: the coordinator contract from Task 1.
- Produces: a recorded passing baseline that later structural edits must re-establish.

- [ ] **Step 1: Add a dryRun policy section** to `coordinator-workflow.md`, mirroring the pattern in `skills/super-roast/super-roast-workflow.md`: `dryRun: true` swaps every dispatched agent for a canned-output stub on haiku, validating coordinator topology cheaply. Required once at implementation and after **structural** coordinator edits only (loop order, batching, merge-back, blocker routing) — roster/prompt/tier edits are data and skip it.

- [ ] **Step 2: Add the stub table.** Every stub prompt must use this exact phrasing, which is load-bearing — a shortened form makes the model answer in prose instead of calling the structured-output tool, silently converting the run into an accidental dead-agent test:

```
You are a stub. Call no tools. Return exactly this JSON as your structured output: <json>
```

Stubs needed: `ready` (returns 3 tasks — two touching disjoint files, one sharing a file with the first), `planner`, `implementer`, `task-reviewer` (one clean, one with a finding), `re-review` (finding ADDRESSED), `triage`, `final-review`.

- [ ] **Step 3: Run the dryRun** via the Workflow tool with `dryRun: true`, `concurrency: 4`, and the stub set above.

- [ ] **Step 4: Assert and record.** Expected: `bd ready` query scoped to the epic tree (not the whole repo); the two disjoint-file tasks dispatched **concurrently** and the same-file task **serialized** after the first; each task running the full pipeline in order (brief → implementer → review-package → task-reviewer, plus one fix round + re-review for the task whose review returned a finding); merge-back occurring **serially** in dependency order; and the blocker path filing a bead and continuing rather than halting. Record the run ID, agent count, and these assertions in the doc's assertions section — figures are the durable record, journals are session-local.

- [ ] **Step 5: Commit**

```bash
git add skills/super-code/coordinator-workflow.md
git commit -m "test(super-code): dryRun policy, stub table, and recorded coordinator baseline"
```

### Task 5: Rewire callers

**Files:**
- Modify: `skills/super-plan/SKILL.md` (the `## Hand-off (root only)` section ~line 146-150, and the integration bullet ~line 183)
- Modify: `skills/dispatching-parallel-agents/SKILL.md:135`

**Interfaces:**
- Consumes: the completed skill from Tasks 1–4.
- Produces: a tree with no references to SDD capabilities that no longer exist.

- [ ] **Step 1: Rewire super-plan's hand-off.** It currently reads "Always `superpowers:subagent-driven-development`." with a beads bullet claiming SDD scopes `bd ready --exclude-type=epic --label sp:<root-epic-id>` and loops `bd epic close-eligible`. Upstream SDD does none of that. Replace with a mode split: **beads mode** hands the root epic to `superpowers:super-code` (which owns the epic-scoped ready query and the close-eligible fixpoint; run completion = root epic closed); **no-beads mode** hands off to `superpowers:subagent-driven-development` in plan-file mode, once per epic. Update the integration bullet at ~line 183 to match.

- [ ] **Step 2: Delete the beads paragraph** at `skills/dispatching-parallel-agents/SKILL.md:135` entirely — the line beginning "**Executing a beads epic of implementation tasks:**". Do not repoint it; that skill is for ad-hoc investigation and debugging fan-out, and routing structured execution was outside its remit. Leave the surrounding "when NOT to use" bullets intact.

- [ ] **Step 3: Verify the tree is consistent.**

```bash
grep -rn 'autonomous mode' skills/dispatching-parallel-agents/SKILL.md   # expect: no output
grep -n 'super-code\|subagent-driven-development' skills/super-plan/SKILL.md  # expect: both, in the mode split
grep -rn 'bd ready --exclude-type=epic' skills/subagent-driven-development/  # expect: no output (SDD never claimed this)
git diff --quiet upstream/main -- skills/subagent-driven-development/ && echo "SDD still byte-identical to upstream"
```

- [ ] **Step 4: Commit**

```bash
git add skills/super-plan/SKILL.md skills/dispatching-parallel-agents/SKILL.md
git commit -m "feat(super-code): rewire super-plan beads hand-off; drop stale beads pointer"
```

### Task 6: Close out

**Files:**
- Modify: `docs/superpowers/specs/INDEX.md`

- [ ] **Step 1: Final reference-integrity sweep.**

```bash
grep -rn 'spec-reviewer-prompt\|code-quality-reviewer-prompt' skills/ docs/superpowers/specs/2026-07-30-super-code-design.md  # expect: no output
git diff --quiet upstream/main -- skills/subagent-driven-development/ && echo "SDD byte-identical to upstream: PASS"
ls skills/super-code/   # expect exactly: SKILL.md coordinator-workflow.md planner-prompt.md triage-prompt.md
```

- [ ] **Step 2: INDEX.** Leave the super-code row at `draft` — `finishing-a-development-branch` flips it to `implemented`. Confirm the row exists and its summary still matches what was built; correct it if the implementation diverged from the spec.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/INDEX.md
git commit -m "docs(super-code): confirm INDEX entry matches the built skill"
```

---

## Self-review notes (completed)

- **Spec coverage:** §1 boundary → Task 3 (SKILL.md boundary section + governing rule); §2 file layout → Tasks 1–3; §3 reconciliation items 1–4 → Task 1 Step 2 (reviewer prompts, five-round breaker, workspace/ledger, worktree topology stays fork-specific); §4 callers → Task 5; §5 validation → Task 4 (dryRun) + Task 3 Step 3 (trigger micro-test) + Task 6 Step 1 (reference integrity).
- **Placeholder scan:** no TBD/TODO; every verification step carries a runnable command with an expected result.
- **Type/name consistency:** SDD artifact names (`task-reviewer-prompt.md`, `re-review-prompt.md`, `implementer-prompt.md`, `scripts/sdd-workspace`, `scripts/task-brief`, `scripts/review-package`) are spelled identically in Global Constraints and Tasks 1, 3, 6, and verified against the on-disk upstream tree before writing.
- **Known judgment point for the executor:** Task 1's reconciliation is the only place where fork intent and upstream structure genuinely collide. Where they do, upstream structure wins and fork intent is re-expressed inside it — the same rule that resolved merge `ca62a0f`.
