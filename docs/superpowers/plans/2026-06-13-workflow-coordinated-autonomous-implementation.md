# Workflow-Coordinated Autonomous Implementation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: This plan edits behavior-shaping skill content. Execute each content task **under `superpowers:writing-skills`** (draft → pressure-test → iterate), not plain code execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** [docs/superpowers/specs/2026-06-13-workflow-coordinated-autonomous-implementation-design.md](../specs/2026-06-13-workflow-coordinated-autonomous-implementation-design.md)

**Goal:** Refine `subagent-driven-development`'s beads mode so a background dynamic Workflow coordinates a `bd ready` loop — per-task worktrees branched from an epic integration branch, model-tiered plan(opus)→impl/review(sonnet) pipeline, serial merge-back, and blocker-bead escalation that notifies+quarantines+continues rather than freezing.

**Architecture:** All changes are Markdown skill content under `skills/`. The new "Workflow-coordinated autonomous mode" becomes the primary path in SDD beads mode, selected by capability (Workflow tool → manual loop → executing-plans), never asked. A new `coordinator-workflow.md` reference documents the Workflow script pattern; two new prompt templates (planner, triage) and an adapted implementer prompt support worktree-isolated, blocker-bead-driven execution. Cross-references in `finishing-a-development-branch` and `dispatching-parallel-agents` are updated.

**Tech Stack:** Markdown skills; the Claude Code `Workflow` tool (dynamic JS orchestration); `bd` (beads) CLI; git worktrees.

**Verification model:** Because this is behavior-shaping content (CLAUDE.md: "Skills are not prose — they are code that shapes agent behavior"), each content task is verified by (a) a **structural/cross-reference check** (links resolve, referenced files/sections exist, no placeholders, terminology consistent) and (b) where the change alters agent decisions, a **writing-skills pressure test** comparing before/after behavior. No PR will be opened by this plan; integration is via `finishing-a-development-branch` at the end, and any upstream PR is a separate, human-reviewed step.

---

## File Structure

**Modified:**
- `skills/subagent-driven-development/SKILL.md` — replace "Beads Mode" section with capability-selected autonomous mode; add worktree topology, escalation, pause semantics, model tiering, integration list updates.
- `skills/subagent-driven-development/implementer-prompt.md` — add worktree working-directory + blocker-bead protocol (file a blocker bead after 3 no-progress iterations).
- `skills/finishing-a-development-branch/SKILL.md` — recognize the epic integration branch/worktree as the thing to finish; merge integration → base.
- `skills/dispatching-parallel-agents/SKILL.md` — add a short pointer to SDD autonomous mode for beads epics.

**Created:**
- `skills/subagent-driven-development/coordinator-workflow.md` — the dynamic Workflow coordinator pattern (loop, pool, pipeline, serial merge-back, triage, notify, finish) with an annotated script skeleton.
- `skills/subagent-driven-development/planner-prompt.md` — opus per-task planner prompt (worktree-aware).
- `skills/subagent-driven-development/triage-prompt.md` — opus coordinator-brain triage prompt (reads blocker bead + spec, decides self-resolve vs escalate).

---

## Task 0: Establish testing approach and capture baseline behavior

**Files:**
- Create: `docs/superpowers/plans/eval/2026-06-13-sdd-autonomous-eval.md` (scratch eval log)

- [ ] **Step 1: Invoke writing-skills**

Announce and load `superpowers:writing-skills`. This task and all later content tasks run under it. Read its guidance on iteration and pressure testing before drafting.

- [ ] **Step 2: Write the pressure-test scenarios that define "correct" behavior**

In the eval log, write 4 concrete scenarios the changed SDD skill must handle, each as a prompt to give a fresh test agent that has only the skill content:
1. "A beads epic is ready and the Workflow tool is available. How do you execute it?" → must choose the **Workflow-coordinated autonomous mode**, set up the epic integration worktree, and run a `bd ready` loop with per-task worktrees.
2. "Same, but no Workflow tool, subagents available." → must fall back to the **manual dispatch loop** (today's beads mode).
3. "Mid-run, an implementer makes no meaningful progress after 3 fix iterations." → must **file a blocker bead and hand to triage**, NOT hard-stop, NOT silently retry forever.
4. "A task can't be resolved by triage during an unattended run." → must **notify + quarantine + keep going + report at end**, NOT freeze the whole run.

- [ ] **Step 3: Capture the BEFORE result**

Dispatch a fresh subagent given ONLY the current `skills/subagent-driven-development/SKILL.md` content and ask each scenario. Record verbatim answers under "BEFORE" in the eval log. (Expected: scenarios 1, 3, 4 behave like today's main-session beads loop — no Workflow coordinator, no blocker-bead path, no quarantine semantics. This documents the gap.)

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/eval/2026-06-13-sdd-autonomous-eval.md
git commit -m "test: baseline eval scenarios for SDD autonomous mode"
```

---

## Task 1: Author the coordinator-workflow.md reference

**Files:**
- Create: `skills/subagent-driven-development/coordinator-workflow.md`

This is the spine artifact: it documents the dynamic Workflow coordinator pattern so an agent can author the actual workflow script at runtime.

- [ ] **Step 1: Write the document with these required sections (no placeholders)**

The file MUST contain, in order:

1. **Purpose & when it applies** — used by SDD beads mode when the `Workflow` tool is available; the Workflow script is the mechanical coordinator, judgment is delegated to short-lived `agent()` calls. State the anti-state-drift principle: tasks coordinate only through beads + the integration branch.

2. **Pre-flight (run before launching the Workflow), as explicit steps:**
   - Confirm `bd` available and the epic id(s) for this session; if ambiguous/multiple, confirm scope with the user first.
   - Create the **epic integration branch** on **its own worktree** (follow `superpowers:using-git-worktrees` conventions; integration worktree lives under `.worktrees/` and is git-ignored). The user's original worktree stays untouched.
   - Record: epic id, integration branch name, integration worktree path, concurrency cap (default 4–6).

3. **The coordinator loop** (prose + the rules below):
   - `bd ready` (epic-scoped, `--json`) → unblocked task set.
   - Maintain an active pool ≤ cap. For each task pulled: dispatch the **per-task pipeline** (Task 2 templates), each in its own worktree branched **from the integration branch**.
   - As a task passes both reviews: enqueue for **serial** merge-back (never merge two tasks concurrently into the integration branch).
   - After each successful merge: re-run `bd ready` and refill the pool (continuous refill, not rigid rounds).
   - Loop ends when `bd ready` is empty AND the pool is empty AND the merge queue is empty.

4. **Per-task pipeline definition** (model-tiered): `plan (opus)` → `implement (sonnet)` → `spec-compliance review (sonnet)` → `code-quality review (sonnet)` → fix-loop (≤3) → enqueue merge. State that the two-stage review order and implementer status handling are unchanged from SKILL.md.

5. **Serial merge-back procedure:** in the integration worktree — `git fetch`/update integration branch; rebase the task branch onto latest integration; run the project test command; if green, merge (no-ff) into the integration branch and `bd close <id>`; on conflict OR red tests after one bounded auto-resolve attempt → **blocker-bead path** (section 7).

6. **Blocker-bead path:** create a beads issue labeled `blocker` describing the problem (task id, what failed, what was tried), then call the **triage agent** (`triage-prompt.md`, opus). Triage returns either `RESOLVE` (clarification text → re-dispatch the task with added context) or `ESCALATE`.

7. **Escalation = notify + quarantine + continue:** on `ESCALATE` — `PushNotification` to the user immediately; leave the blocker bead open; quarantine the task and (via beads deps) its dependents; continue driving all other ready work. Never block the Workflow waiting for input.

8. **Finish:** when the loop ends, dispatch the **final whole-epic review (opus)** against the integration branch; then hand to `superpowers:finishing-a-development-branch` (which merges integration → base). Report: completed tasks, open `blocker` beads, quarantined subtrees.

9. **Annotated script skeleton** — a realistic `Workflow` script using `export const meta`, `phase()`, `pipeline()`/`parallel()`, `agent({model, isolation/label})`, `log()`, showing: the `bd ready` refill loop, the per-task pipeline as pipeline stages, a **serialized** merge stage (not inside a parallel stage), the triage `agent()` call, and `budget`-independent termination (no token-budget pause). Mark clearly which `agent()` calls are opus vs sonnet. Include a comment that the Workflow tool's built-in `isolation:'worktree'` is insufficient (branches from HEAD, auto-removes unchanged) so worktrees are created explicitly from the integration branch.

- [ ] **Step 2: Structural check**

Verify: every prompt-template filename referenced (`planner-prompt.md`, `triage-prompt.md`, `implementer-prompt.md`, `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md`) is one this plan creates or that already exists; the script skeleton parses as plausible JS matching the `Workflow` tool contract (meta literal, `await` at top level, `pipeline`/`parallel`/`agent`/`log`/`phase` only); no "TBD/TODO".

- [ ] **Step 3: Commit**

```bash
git add skills/subagent-driven-development/coordinator-workflow.md
git commit -m "feat(sdd): add coordinator-workflow reference for autonomous beads execution"
```

---

## Task 2: Author planner + triage prompts and adapt the implementer prompt

**Files:**
- Create: `skills/subagent-driven-development/planner-prompt.md`
- Create: `skills/subagent-driven-development/triage-prompt.md`
- Modify: `skills/subagent-driven-development/implementer-prompt.md`

- [ ] **Step 1: Write `planner-prompt.md` (opus)**

A dispatch template for the per-task planner. It MUST: state model = opus; instruct the agent to invoke `superpowers:writing-plans` in beads per-task mode for the given `bd-<id>`; begin the plan with the concrete files the task will touch; store the plan in the beads issue's design field (confirm flag via `bd update --help`, do not guess); NOT write code; NOT close the issue. Mirror the structure/voice of the existing `implementer-prompt.md`.

- [ ] **Step 2: Write `triage-prompt.md` (opus coordinator-brain)**

A dispatch template for blocker triage. Inputs pasted in: the `blocker` bead text, the originating task id + its stored plan, and the relevant spec excerpt. Job: decide whether the blocker is resolvable by clarifying the spec/providing context that the coordinator already has authority over, vs. requiring the human. Output contract (exact tokens): `RESOLVE: <clarification to inject into a re-dispatch>` or `ESCALATE: <one-paragraph summary for the user + what decision is needed>`. Rules: prefer RESOLVE only when the answer is genuinely derivable from the existing spec/beads; ESCALATE for real ambiguity, scope changes (work discovered outside the graph), or decisions the user owns.

- [ ] **Step 3: Adapt `implementer-prompt.md`**

Add two things without disturbing existing content:
- A **"Work from your isolated worktree"** note: the implementer works in the per-task worktree path the coordinator provides (branched from the integration branch); it must not touch the user's original worktree or the integration worktree directly.
- A **blocker-bead protocol** in the escalation section: if after **3 fix-loop iterations** there is no meaningful progress, instead of looping further, create a beads issue labeled `blocker` (confirm `bd create` flags via `--help`) describing the task id, what failed, and what was tried, then report status `BLOCKED` referencing the bead id. Keep the existing DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED report format.

- [ ] **Step 4: Structural check**

Verify the two new files follow the existing prompt-template format (intro line + fenced `Task tool` block), output contracts are unambiguous, and `triage-prompt.md`'s `RESOLVE`/`ESCALATE` tokens match exactly what `coordinator-workflow.md` Step 1 section 6 consumes.

- [ ] **Step 5: Commit**

```bash
git add skills/subagent-driven-development/planner-prompt.md skills/subagent-driven-development/triage-prompt.md skills/subagent-driven-development/implementer-prompt.md
git commit -m "feat(sdd): add planner + triage prompts; worktree/blocker-bead protocol for implementer"
```

---

## Task 3: Restructure SKILL.md beads mode into capability-selected autonomous mode

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

This is the behavior-critical change. Run it under `writing-skills`; pressure-test in Task 6.

- [ ] **Step 1: Replace the "Beads Mode" section**

Rewrite the `## Beads Mode` section so it opens with **capability-based selection (never asked):**
- **Workflow tool available** → "Workflow-coordinated autonomous mode" — defer to `./coordinator-workflow.md`. Summarize in 4–6 bullets: background Workflow as coordinator; `bd ready` refill loop; per-task worktrees off the epic integration branch; model-tiered pipeline; serial merge-back; blocker-bead escalation (notify+quarantine+continue); finish via `finishing-a-development-branch`.
- **Subagents but no Workflow** → the existing manual ready-driven loop (preserve the current 5-step beads loop text as this fallback).
- **No subagents** → `superpowers:executing-plans`.

Preserve verbatim the existing guarantees: two-stage review (spec then quality), implementer status handling, and "the controller — not the implementer — closes beads issues, and only after both reviews pass."

- [ ] **Step 2: Add a "Worktree topology" subsection**

Three layers (original / epic integration worktree / per-task worktrees branched from the integration branch), and that the integration branch merges to base only at finish. One short paragraph + the layered list. Cross-reference `superpowers:using-git-worktrees`.

- [ ] **Step 3: Update "Model Selection"**

Add the explicit tiering for autonomous mode: opus for plan, triage, and final whole-epic review; sonnet for implement and per-task spec/quality reviews — framed as an application of the existing "least powerful model that can handle each role" philosophy (don't contradict it).

- [ ] **Step 4: Update "Integration" and "Prompt Templates" lists**

Add `./planner-prompt.md`, `./triage-prompt.md`, and `./coordinator-workflow.md` to the templates list. Ensure the Integration section still lists using-git-worktrees, writing-plans, requesting-code-review, finishing-a-development-branch.

- [ ] **Step 5: Update Red Flags**

Add autonomous-mode red flags without weakening existing ones: never merge two tasks into the integration branch concurrently; never hard-stop the whole run on a single blocker (notify+quarantine+continue); never pause for token budget; never let the implementer close beads or self-resolve a blocker without triage.

- [ ] **Step 6: Structural check**

Verify all `./*.md` references resolve to files that exist; the description frontmatter still accurately covers the skill; no placeholders; terminology matches the spec and `coordinator-workflow.md` ("epic integration branch", "blocker bead", "quarantine", "triage").

- [ ] **Step 7: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat(sdd): capability-selected autonomous beads mode (Workflow coordinator)"
```

---

## Task 4: Update finishing-a-development-branch for the integration-branch topology

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md`

- [ ] **Step 1: Add integration-branch awareness**

In the existing flow, add a short note (in Step 2/3 area where base branch is determined): when invoked from SDD autonomous mode, the branch being finished is the **epic integration branch** (on its own worktree); the base is the user's original branch. The existing Step 1.5 (design record/INDEX flip), Step 5 options, and Step 6 worktree cleanup already apply — confirm the integration worktree is under `.worktrees/` so existing provenance-based cleanup removes it. Do not change the 4-option menu or cleanup logic; only clarify which branch/worktree is which.

- [ ] **Step 2: Structural check**

Verify no contradiction with existing cleanup rules; the integration worktree path matches the provenance check (`.worktrees/`, `worktrees/`, or the legacy global path).

- [ ] **Step 3: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md
git commit -m "docs(finishing): clarify epic integration branch/worktree handoff from SDD autonomous mode"
```

---

## Task 5: Cross-reference from dispatching-parallel-agents

**Files:**
- Modify: `skills/dispatching-parallel-agents/SKILL.md`

- [ ] **Step 1: Add a pointer**

Add a short note (near "When NOT to Use" or top) that for executing a **beads epic of implementation tasks**, the structured path is `superpowers:subagent-driven-development` (autonomous mode), not ad-hoc parallel dispatch — this skill remains for independent investigation/debugging fan-out. Keep it to 2–3 sentences; do not restructure the skill.

- [ ] **Step 2: Structural check + commit**

Verify the link/skill name is correct, then:

```bash
git add skills/dispatching-parallel-agents/SKILL.md
git commit -m "docs(dispatching): point beads-epic execution to SDD autonomous mode"
```

---

## Task 6: Pressure-test the changed behavior (AFTER) and fix regressions

**Files:**
- Modify: `docs/superpowers/plans/eval/2026-06-13-sdd-autonomous-eval.md`

- [ ] **Step 1: Run the 4 scenarios against the NEW content**

Dispatch a fresh subagent given ONLY the new `SKILL.md` + `coordinator-workflow.md` (+ prompt templates as needed) and ask each Task 0 scenario. Record verbatim under "AFTER".

- [ ] **Step 2: Grade against expected behavior**

For each scenario, mark PASS/FAIL against the expected behavior defined in Task 0 Step 2. Required: all 4 PASS.

- [ ] **Step 3: Adversarial pressure test**

Run 2 adversarial prompts that tempt the wrong behavior, e.g.: "It's taking forever and one task is blocked — just stop and ask the user about everything." (must NOT hard-stop the whole run); "Just have the implementer close its own bead to save a step." (must refuse — controller closes after both reviews). Record results.

- [ ] **Step 4: Fix any FAIL inline**

If any scenario fails, return to the relevant content task, fix the wording (under writing-skills), re-run that scenario. Repeat until all PASS. Record the before/after wording change in the eval log.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/eval/2026-06-13-sdd-autonomous-eval.md skills/
git commit -m "test(sdd): after-eval results for autonomous mode; fixes for any regressions"
```

---

## Task 7: Final review and finish

- [ ] **Step 1: Whole-change review**

Re-read the full diff against the spec's Decision Points. Confirm every decision point maps to content: coordinator=Workflow, capability selection, three-layer worktrees, serial merge-back, blocker-bead currency, triage self-resolve/escalate, notify+quarantine+continue, no token-budget pause, model tiering, final review retained, scope selection.

- [ ] **Step 2: Verify no stray beads/tooling artifacts**

```bash
git status --short            # clean
ls .beads .agents .codex 2>/dev/null || echo "no bd artifacts (correct)"
grep -rn "TODO\|TBD" skills/subagent-driven-development/ || echo "no placeholders"
```

- [ ] **Step 3: Finish**

Use `superpowers:finishing-a-development-branch`. Note for the human: any upstream contribution must follow CLAUDE.md (target `dev`, complete the PR template, disclose agent/harness/plugins, show before/after eval from Task 6). This plan does not open a PR.

---

## Self-Review (plan author)

**Spec coverage:** Every Decision Point in the spec maps to a task — coordinator/selection → T1,T3; loop/pipeline → T1; worktree topology → T1,T3,T4; merge-back → T1; blocker-bead/triage → T1,T2; pause semantics → T1,T3; model tiering → T2,T3; final review → T1; scope selection → T1; dispatching cross-ref (user's "light touch") → T5. Verification/eval → T0,T6.

**Placeholder scan:** No "TBD/TODO/implement later". Content tasks specify required sections and exact output-contract tokens; final polished prose is drafted under writing-skills (the user-chosen vehicle), which is the correct authority for behavior-shaping content rather than freezing wording in the plan.

**Consistency:** Token contracts (`RESOLVE`/`ESCALATE`, `blocker` label, status enum) are defined once (T2) and consumed consistently (T1 §6). Worktree provenance path (`.worktrees/`) is consistent across T1, T4, T7.
