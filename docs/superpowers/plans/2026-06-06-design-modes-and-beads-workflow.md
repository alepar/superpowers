# Design Modes & Beads-Driven Execution Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two brainstorming design modes, a beads-driven post-spec execution flow, and an always-subagent/parallel execution default to the local Superpowers skills.

**Architecture:** Pure edits to skill markdown (behavior-shaping content). Four skill files plus one prompt file are modified independently; a final pass checks cross-references and commits. There are no code unit tests — verification is grep/read content checks and a consistency review, since the repo's only automated tests for these skills are heavy end-to-end session tests not suitable for per-task runs.

**Tech Stack:** Markdown skill files under `skills/`; the `bd` (beads) CLI is referenced from the skills but not vendored.

**Spec:** `docs/superpowers/specs/2026-06-06-design-modes-and-beads-workflow-design.md`

**Execution notes for the controller:**
- Tasks 1–5 edit disjoint files and are **parallel-safe** — dispatch them concurrently (disjoint-file rule).
- Task 6 depends on Tasks 1–5 (it reviews all files and commits) — run it last.
- This is markdown content, not code. The implementer subagents should NOT invent or assert exact `bd` subcommand flags; where the plan references a `bd` command whose exact flags are uncertain, the text must instruct confirming via `bd <cmd> --help`. Keep that wording verbatim.

---

### Task 1: Brainstorming — two design modes, complexity-scaled questions, review-gate inversion, beads branch

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

- [ ] **Step 1: Add the Design Modes section and rewrite the Checklist**

Edit `skills/brainstorming/SKILL.md`. Replace this exact block:

```
## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Explore project context** — check files, docs, recent commits
2. **Offer visual companion** (if topic will involve visual questions) — this is its own message, not combined with a clarifying question. See the Visual Companion section below.
3. **Ask clarifying questions** — one at a time, understand purpose/constraints/success criteria
4. **Propose 2-3 approaches** — with trade-offs and your recommendation
5. **Present design** — in sections scaled to their complexity, get user approval after each section
6. **Write design doc** — save to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and commit
7. **Spec self-review** — quick inline check for placeholders, contradictions, ambiguity, scope (see below)
8. **User reviews written spec** — ask user to review the spec file before proceeding
9. **Transition to implementation** — invoke writing-plans skill to create implementation plan
```

with:

```
## Design Modes

Brainstorming runs in one of two modes. Choose the mode at the start, before asking anything.

**Mode A — Collaborative (default).** Iterate through the design with the user, one question at a time. Scale the number of questions to the design's complexity: small designs need few questions; large or ambiguous designs warrant more. Explicitly cover every ambiguous or contentious part before presenting the design. Get per-section approval as you present. Once you have iterated through the whole design together, do **not** ask the user to review the written spec — proceed directly to the next step.

**Mode B — One-shot (no questions).** Do not ask the user anything. Reason alone: identify every decision point, propose options for each, pick one, and write the entire spec in a single pass using the Mode B spec structure (see "After the Design"). After writing the spec, ask the user to review it before proceeding.

**Mode selection.** Default to Mode A. Use Mode B when the design complexity is small, or the user explicitly asks for a "one shot design".

The review gate is inverted between modes: Mode A has no final-spec review (you reviewed together as you went); Mode B requires one (the user saw nothing until the spec was written).

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Explore project context** — check files, docs, recent commits
2. **Select design mode** — Mode A (collaborative, default) or Mode B (one-shot); see Design Modes above
3. **Offer visual companion** (if topic will involve visual questions) — this is its own message, not combined with a clarifying question. See the Visual Companion section below.
4. **Ask clarifying questions** *(Mode A only)* — one at a time, scaled to complexity, covering every ambiguous/contentious part
5. **Propose 2-3 approaches** — with trade-offs and your recommendation *(Mode A presents these to the user; Mode B decides alone)*
6. **Present design** *(Mode A only)* — in sections scaled to their complexity, get user approval after each section
7. **Write design doc** — save to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and commit (Mode B uses the one-shot spec structure)
8. **Spec self-review** — quick inline check for placeholders, contradictions, ambiguity, scope (see below)
9. **User reviews written spec** *(Mode B only)* — ask the user to review the spec file before proceeding
10. **Transition to implementation** — beads available → create epic + rough tasks, then subagent-driven-development (beads mode); otherwise → writing-plans
```

- [ ] **Step 2: Replace the Process Flow diagram**

Replace this exact block (the entire ```dot ... ``` graph):

```
digraph brainstorming {
    "Explore project context" [shape=box];
    "Visual questions ahead?" [shape=diamond];
    "Offer Visual Companion\n(own message, no other content)" [shape=box];
    "Ask clarifying questions" [shape=box];
    "Propose 2-3 approaches" [shape=box];
    "Present design sections" [shape=box];
    "User approves design?" [shape=diamond];
    "Write design doc" [shape=box];
    "Spec self-review\n(fix inline)" [shape=box];
    "User reviews spec?" [shape=diamond];
    "Invoke writing-plans skill" [shape=doublecircle];

    "Explore project context" -> "Visual questions ahead?";
    "Visual questions ahead?" -> "Offer Visual Companion\n(own message, no other content)" [label="yes"];
    "Visual questions ahead?" -> "Ask clarifying questions" [label="no"];
    "Offer Visual Companion\n(own message, no other content)" -> "Ask clarifying questions";
    "Ask clarifying questions" -> "Propose 2-3 approaches";
    "Propose 2-3 approaches" -> "Present design sections";
    "Present design sections" -> "User approves design?";
    "User approves design?" -> "Present design sections" [label="no, revise"];
    "User approves design?" -> "Write design doc" [label="yes"];
    "Write design doc" -> "Spec self-review\n(fix inline)";
    "Spec self-review\n(fix inline)" -> "User reviews spec?";
    "User reviews spec?" -> "Write design doc" [label="changes requested"];
    "User reviews spec?" -> "Invoke writing-plans skill" [label="approved"];
}
```

with:

```
digraph brainstorming {
    "Explore project context" [shape=box];
    "Select design mode" [shape=diamond];
    "Mode A: iterate (questions scaled to complexity)" [shape=box];
    "Mode B: reason alone, decide all points" [shape=box];
    "Present design sections" [shape=box];
    "User approves section?" [shape=diamond];
    "Write design doc" [shape=box];
    "Spec self-review (fix inline)" [shape=box];
    "Mode B: user reviews spec?" [shape=diamond];
    "beads available?" [shape=diamond];
    "Create epic + rough tasks, then subagent-driven-development (beads mode)" [shape=doublecircle];
    "Invoke writing-plans skill" [shape=doublecircle];

    "Explore project context" -> "Select design mode";
    "Select design mode" -> "Mode A: iterate (questions scaled to complexity)" [label="Mode A (default)"];
    "Select design mode" -> "Mode B: reason alone, decide all points" [label="Mode B (small / one-shot)"];
    "Mode A: iterate (questions scaled to complexity)" -> "Present design sections";
    "Present design sections" -> "User approves section?";
    "User approves section?" -> "Present design sections" [label="no, revise"];
    "User approves section?" -> "Write design doc" [label="yes, all sections done"];
    "Mode B: reason alone, decide all points" -> "Write design doc";
    "Write design doc" -> "Spec self-review (fix inline)";
    "Spec self-review (fix inline)" -> "Mode B: user reviews spec?" [label="Mode B"];
    "Spec self-review (fix inline)" -> "beads available?" [label="Mode A (no review gate)"];
    "Mode B: user reviews spec?" -> "Write design doc" [label="changes requested"];
    "Mode B: user reviews spec?" -> "beads available?" [label="approved"];
    "beads available?" -> "Create epic + rough tasks, then subagent-driven-development (beads mode)" [label="yes"];
    "beads available?" -> "Invoke writing-plans skill" [label="no"];
}
```

- [ ] **Step 3: Update the terminal-state sentence after the diagram**

Replace this exact line:

```
**The terminal state is invoking writing-plans.** Do NOT invoke frontend-design, mcp-builder, or any other implementation skill. The ONLY skill you invoke after brainstorming is writing-plans.
```

with:

```
**The terminal state is either the beads execution flow or writing-plans** (depending on whether the `bd` CLI is available). Do NOT invoke frontend-design, mcp-builder, or any other implementation skill — only the two terminal states above.
```

- [ ] **Step 4: Rewrite the User Review Gate and Implementation sections (and add Mode B spec structure)**

Replace this exact block:

```
**User Review Gate:**
After the spec review loop passes, ask the user to review the written spec before proceeding:

> "Spec written and committed to `<path>`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan."

Wait for the user's response. If they request changes, make them and re-run the spec review loop. Only proceed once the user approves.

**Implementation:**

- Invoke the writing-plans skill to create a detailed implementation plan
- Do NOT invoke any other skill. writing-plans is the next step.
```

with:

```
**Mode B Spec Structure:**
When writing the spec in Mode B, use this structure:

1. **Problem description** — one paragraph.
2. **Main challenges** — one paragraph.
3. **Key decisions made** — one paragraph.
4. **Decision points, by section** — one paragraph per decision point, each stating the recommended approach (and why it was chosen) and the considered approaches (and why they were discarded).

Mode A specs follow the normal section-by-section structure that emerged during the collaborative design.

**User Review Gate (Mode B only):**
In Mode B the user has not seen the design until now, so ask them to review the written spec before proceeding:

> "Spec written and committed to `<path>`. Please review it and let me know if you want to make any changes before we start implementation."

Wait for the user's response. If they request changes, make them and re-run the spec review loop. Only proceed once the user approves.

In Mode A, skip this gate — you already reviewed the design with the user section by section. Proceed directly to implementation.

**Implementation:**

Branch on beads availability (the `bd` CLI on PATH):

- **beads available:** Do NOT write a monolithic implementation plan.
  1. Ensure a beads database exists: if the repo has no `.beads` directory, run `bd init`.
  2. Create one epic issue for the whole spec. Capture its id. (Confirm the right issue type/flags for an epic with `bd create --help`.)
  3. Split the spec into rough child tasks — title + short description + a files-touched hint each — and create them under the epic with blocking dependencies so `bd ready` reflects real ordering. Prefer building the whole graph atomically with `bd create --graph <plan.json>`; otherwise create each task nested under the epic (`--parent <epic-id>`) and wire dependencies with `bd dep`. Confirm exact flags with `bd create --help` and `bd dep --help`.
  4. Invoke `superpowers:subagent-driven-development` in beads mode to execute the epic.
- **beads unavailable:** Invoke the `writing-plans` skill to create a detailed implementation plan.

Do NOT invoke any other skill.
```

- [ ] **Step 5: Verify the edits landed and are self-consistent**

Run:
```bash
grep -n "## Design Modes" skills/brainstorming/SKILL.md
grep -n "Mode A — Collaborative" skills/brainstorming/SKILL.md
grep -n "Mode B — One-shot" skills/brainstorming/SKILL.md
grep -n "Mode B Spec Structure" skills/brainstorming/SKILL.md
grep -n "beads available" skills/brainstorming/SKILL.md
grep -nc "User reviews written spec" skills/brainstorming/SKILL.md
grep -n "The terminal state is invoking writing-plans" skills/brainstorming/SKILL.md || echo "OLD TERMINAL SENTENCE GONE (good)"
```
Expected: the first five greps return matches; `User reviews written spec` count is 1 (only in the checklist, marked Mode B only); the old terminal sentence is gone.

- [ ] **Step 6: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "brainstorming: add design modes + beads/writing-plans branch"
```

---

### Task 2: writing-plans — beads per-task mode + always-subagent handoff

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

- [ ] **Step 1: Add the Beads Per-Task Mode section**

Edit `skills/writing-plans/SKILL.md`. Replace this exact block:

```
- (User preferences for plan location override this default)

## Scope Check
```

with:

```
- (User preferences for plan location override this default)

## Beads Per-Task Mode

When invoked by `superpowers:subagent-driven-development` in beads mode, you are planning a **single beads task**, not a whole spec:

- Write the plan for just that one task, scoped to the files that task touches.
- Begin the plan with the concrete list of files the task will create or modify — the controller uses this file list to decide which tasks can run in parallel.
- Store the plan **in the beads issue** (its design/notes field) rather than in `docs/superpowers/plans/`. Confirm the exact command for writing the design field with `bd update --help` (or `bd edit` / `bd note`) — do not guess the flag.
- All other rules below (bite-sized steps, no placeholders, complete content, TDD) still apply.

Otherwise (no beads), write a single plan file as described below.

## Scope Check
```

- [ ] **Step 2: Replace the Execution Handoff section (no more asking)**

Replace this exact block:

```
## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Fresh subagent per task + two-stage review

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
- Batch execution with checkpoints for review
```

with:

```
## Execution Handoff

Do not ask the user how to execute. Always hand off to subagent execution:

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Executing with subagent-driven-development."**

- **REQUIRED SUB-SKILL:** Use `superpowers:subagent-driven-development` — fresh subagent per task, two-stage review, parallel where feasible (disjoint-file tasks).
- Only if subagents are unavailable on this platform, fall back to `superpowers:executing-plans`. This is an automatic platform-capability decision, not a question for the user.
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -n "## Beads Per-Task Mode" skills/writing-plans/SKILL.md
grep -n "Do not ask the user how to execute" skills/writing-plans/SKILL.md
grep -n "Which approach?" skills/writing-plans/SKILL.md || echo "OLD CHOICE PROMPT GONE (good)"
grep -n "Inline Execution" skills/writing-plans/SKILL.md || echo "INLINE CHOICE GONE (good)"
```
Expected: first two greps match; the old "Which approach?" prompt and the "Inline Execution" choice option are gone.

- [ ] **Step 4: Commit**

```bash
git add skills/writing-plans/SKILL.md
git commit -m "writing-plans: add beads per-task mode + always-subagent handoff"
```

---

### Task 3: subagent-driven-development — always-subagent default, disjoint-file parallelism, beads mode

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

- [ ] **Step 1: Add the always-subagent + parallelism section**

Edit `skills/subagent-driven-development/SKILL.md`. Replace this exact block:

```
## When to Use

```dot
digraph when_to_use {
```

with:

```
## Always Use Subagents; Parallelize Where Feasible

This is the default execution path for every plan — do not ask the user whether to use subagents or run inline. (`superpowers:executing-plans` exists only as an automatic fallback for platforms without subagent support; the choice is made on capability, never asked.)

**Parallel execution by disjoint files.** Run task implementers in parallel when their file sets do not overlap; serialize tasks that touch the same files. Before dispatching a batch, determine each ready task's files (from the plan, or in beads mode from each task's stored plan) and group them so no two concurrent implementers write the same file. Cap concurrency at ~4. Each task's two-stage review runs after that task's implementer completes.

## When to Use

```dot
digraph when_to_use {
```

(Note: the ```` ```dot ```` fence and `digraph when_to_use {` line are preserved at the end so the existing diagram stays intact.)

- [ ] **Step 2: Add the Beads Mode section before Model Selection**

Replace this exact line:

```
## Model Selection
```

with:

```
## Beads Mode

When the controller was handed a beads epic instead of a plan file (the `bd` CLI is available), execute the epic as a ready-driven loop instead of iterating a fixed task list:

1. **Query ready work.** Run `bd ready` for the epic to get the blocker-aware set of currently-available tasks. Confirm scoping/flags with `bd ready --help`; `--json` gives machine-readable output.
2. **Plan phase (parallel).** For each ready task, dispatch a planner subagent that invokes `superpowers:writing-plans` in beads per-task mode — it writes a focused plan into the task's beads issue, beginning with the files the task will touch. Planners only write to beads, so dispatch them all in parallel.
3. **Implement phase (parallel where feasible).** Read each ready task's stored plan to get its file list. Group tasks by disjoint files and dispatch implementer subagents accordingly (parallel for non-overlapping, serial for overlapping). For each task: implementer (against its beads-issue plan) → spec-compliance review → code-quality review → fix loops until both pass → close the task with `bd close <id>` (confirm with `bd close --help`).
4. **Refill.** Closing tasks unblocks dependents. Re-query `bd ready` and repeat from step 1.
5. **Finish.** When the epic has no open tasks, proceed to `superpowers:finishing-a-development-branch`.

The two-stage review (spec compliance, then code quality) and the implementer status handling (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED) are unchanged per task. The controller — not the implementer — closes beads issues, and only after both reviews pass.

## Model Selection
```

- [ ] **Step 3: Replace the no-parallel red flag with the disjoint-file rule**

Replace this exact line:

```
- Dispatch multiple implementation subagents in parallel (conflicts)
```

with:

```
- Dispatch parallel implementers whose file sets overlap (conflicts) — parallelize only disjoint-file tasks
```

- [ ] **Step 4: Verify**

Run:
```bash
grep -n "## Always Use Subagents; Parallelize Where Feasible" skills/subagent-driven-development/SKILL.md
grep -n "## Beads Mode" skills/subagent-driven-development/SKILL.md
grep -n "disjoint-file tasks" skills/subagent-driven-development/SKILL.md
grep -n "Dispatch multiple implementation subagents in parallel (conflicts)" skills/subagent-driven-development/SKILL.md || echo "OLD NO-PARALLEL RED FLAG GONE (good)"
grep -c "digraph when_to_use" skills/subagent-driven-development/SKILL.md
```
Expected: first three greps match; the old absolute no-parallel red flag is gone; `digraph when_to_use` count is 1 (diagram preserved).

- [ ] **Step 5: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "subagent-driven-development: always-subagent default, disjoint-file parallelism, beads mode"
```

---

### Task 4: implementer-prompt — beads-issue plan source + don't-close note

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md`

- [ ] **Step 1: Add a beads-mode note after the Task Description block**

Edit `skills/subagent-driven-development/implementer-prompt.md`. Replace this exact block:

```
    ## Context

    [Scene-setting: where this fits, dependencies, architectural context]
```

with:

```
    ## Context

    [Scene-setting: where this fits, dependencies, architectural context]

    [Beads mode only: include the beads task id (e.g. bd-123). The full plan for
    this task lives in that beads issue's design field — it is also pasted above.
    Do NOT close the beads issue yourself; the controller closes it after the
    spec-compliance and code-quality reviews both pass.]
```

- [ ] **Step 2: Verify**

Run:
```bash
grep -n "Beads mode only" skills/subagent-driven-development/implementer-prompt.md
grep -n "Do NOT close the beads issue yourself" skills/subagent-driven-development/implementer-prompt.md
```
Expected: both match.

- [ ] **Step 3: Commit**

```bash
git add skills/subagent-driven-development/implementer-prompt.md
git commit -m "implementer-prompt: beads-issue plan source + don't-close note"
```

---

### Task 5: executing-plans — strengthen the silent-fallback note

**Files:**
- Modify: `skills/executing-plans/SKILL.md`

- [ ] **Step 1: Replace the Note paragraph**

Edit `skills/executing-plans/SKILL.md`. Replace this exact line:

```
**Note:** Tell your human partner that Superpowers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (such as Claude Code or Codex). If subagents are available, use superpowers:subagent-driven-development instead of this skill.
```

with:

```
**Note:** This skill is the automatic fallback for platforms **without** subagent support. When subagents are available — as on Claude Code or Codex — always use `superpowers:subagent-driven-development` instead. Choose based on subagent availability; do not ask the user which to use.
```

- [ ] **Step 2: Verify**

Run:
```bash
grep -n "automatic fallback for platforms" skills/executing-plans/SKILL.md
grep -n "do not ask the user which to use" skills/executing-plans/SKILL.md
```
Expected: both match.

- [ ] **Step 3: Commit**

```bash
git add skills/executing-plans/SKILL.md
git commit -m "executing-plans: clarify it is the silent fallback (no asking)"
```

---

### Task 6: Cross-reference consistency pass

**Depends on Tasks 1–5. Run last.**

**Files:**
- Read-only review of all five files above; no new file edits unless a defect is found.

- [ ] **Step 1: Confirm cross-references resolve and no asking-for-execution language remains**

Run:
```bash
# Brainstorming hands off to the two real terminal states by exact skill name
grep -rn "subagent-driven-development" skills/brainstorming/SKILL.md
grep -rn "writing-plans" skills/brainstorming/SKILL.md

# writing-plans references SDD beads per-task mode and the fallback
grep -rn "beads per-task mode" skills/writing-plans/SKILL.md

# SDD references writing-plans beads mode and finishing skill
grep -rn "writing-plans" skills/subagent-driven-development/SKILL.md
grep -rn "finishing-a-development-branch" skills/subagent-driven-development/SKILL.md

# No leftover "inline vs subagent" choice anywhere in the four execution skills
grep -rniE "two execution options|which approach|inline execution" skills/writing-plans/SKILL.md skills/executing-plans/SKILL.md skills/subagent-driven-development/SKILL.md || echo "NO LEFTOVER CHOICE LANGUAGE (good)"
```
Expected: all cross-reference greps return matches; the final grep prints the "NO LEFTOVER" message.

- [ ] **Step 2: Fresh-eyes read against the spec**

Read the spec `docs/superpowers/specs/2026-06-06-design-modes-and-beads-workflow-design.md` and each edited file. Confirm every spec requirement maps to landed text:
- Two design modes + selection rule + review-gate inversion → `brainstorming/SKILL.md`
- beads detection (bd on PATH + auto-init), epic + rough tasks + deps, ready-loop, parallel planners, disjoint-file implementers, plan-in-beads-issue, both per-task reviews → `brainstorming/SKILL.md` + `subagent-driven-development/SKILL.md` + `writing-plans/SKILL.md`
- always-subagent / never-ask / disjoint-file parallelism (general, not only beads) → `subagent-driven-development/SKILL.md` + `writing-plans/SKILL.md` + `executing-plans/SKILL.md`

If any gap is found, fix it inline in the relevant file and commit with a focused message. If no gaps, no commit is needed (Tasks 1–5 already committed their files).

- [ ] **Step 3: Confirm working tree is clean**

Run:
```bash
git status --porcelain
git log --oneline -6
```
Expected: clean working tree (or only intentional fix commits from Step 2); the recent commits include the five skill edits.
```
