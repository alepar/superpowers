# super-auto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `skills/super-auto/` — a sequencing skill that drives a feature from a raw idea to finished code by invoking `brainstorming` → `super-plan` → `super-roast` (design) → `super-code` → `super-roast` (PR) behind four flags.

**Architecture:** A thin sequencer. `SKILL.md` owns the phase order, the four flags, and the autonomy boundary; `run-state.md` specifies the committed state file that makes a resume correct; `report-prompt.md` specifies the final report. Each phase skill keeps its own durable state — super-auto holds pointers, never copies. One amendment to `super-roast` adds the report-location override its two siblings already document.

**Tech Stack:** Markdown skill documents. No code, no dependencies. Validation is greps, trigger micro-tests (dispatched probe agents), and one cheap end-to-end run.

## Global Constraints

Copied from `docs/superpowers/specs/2026-07-31-super-auto-design.md`. Every task's requirements implicitly include these.

- **Governing rule:** if a change would improve how a *phase* works, it belongs in that phase's skill, not here. `super-auto` may only grow in the sequencing dimension.
- Never re-implement `super-plan`'s adversarial review loop — it exists, is opt-in, caps at 3; `super-auto` answers its offer.
- Never decide a finding's severity, and never auto-adjudicate a `super-roast` escalation.
- Never copy an artifact another skill owns; hold pointers.
- Autonomy begins **the moment the first roast report exists**. Spec approval and tree settlement stay interactive.
- `run.md` is **committed**, not git-ignored.
- Roast iteration counts must be **durable** — a cap that lives in session memory is not a cap.
- The final report is sourced from durable artifacts, never recollection, and leads with a status line — never a bare "done."
- The `runs/` directory is scoped to `super-auto` runs only. Standalone `brainstorming` and `writing-plans` keep writing flat to `specs/` and `plans/`. Nothing existing moves.
- Do NOT modify `skills/subagent-driven-development/` — it must stay byte-identical to `upstream/main`.

---

### Task 1: Add the report-location override to super-roast

**Files:**
- Modify: `skills/super-roast/SKILL.md` (the report-path line, currently ~`:153`)

**Interfaces:**
- Produces: a documented override hook `super-auto` supplies in Task 4.

This is the design's one amendment to another skill. It is isolated deliberately so a reviewer can accept or reject it on its own merits.

- [ ] **Step 1: Confirm the hook is absent (the failing check)**

```bash
grep -n 'report is written to' skills/super-roast/SKILL.md
grep -c 'override this default' skills/super-roast/SKILL.md
```
Expected: the path line exists; the override count is `0`.

- [ ] **Step 2: Confirm the wording the siblings use**

```bash
grep -A1 'Write the validated design' skills/brainstorming/SKILL.md
grep -A2 'Save plans to' skills/writing-plans/SKILL.md
```
Expected: both show `(User preferences for spec|plan location override this default)`. Match this phrasing — do not invent a new one.

- [ ] **Step 3: Add the override line**

Directly beneath the existing report-path sentence, add a sub-bullet in the siblings' voice:

```markdown
- (User preferences for report location override this default — `super-auto` supplies its run directory.)
```

- [ ] **Step 4: Verify**

```bash
grep -c 'override this default' skills/super-roast/SKILL.md   # expect 1
git diff --stat skills/super-roast/SKILL.md                    # expect 1 file, +1 line
```

- [ ] **Step 5: Commit**

```bash
git add skills/super-roast/SKILL.md
git commit -m "feat(super-roast): accept a report-location override"
```

---

### Task 2: run-state.md — the state file contract

**Files:**
- Create: `skills/super-auto/run-state.md`

**Interfaces:**
- Produces: the `run.md` format and resume rules that `SKILL.md` (Task 4) points at by name.

- [ ] **Step 1: State the five required contents**

Write the file with a section specifying exactly what `run.md` holds, and *why each one is load-bearing*:

1. **The four flags** — `planOneShot`, `skipPlanRoast`, `skipCodeRoast`, `autonomous`. So a resumed run never re-asks.
2. **Current phase** — one of `brainstorm | plan | roast-design | code | roast-code | report | done`.
3. **Pointers** — spec path, plan path, epic id, integration branch, roast report paths. Pointers only.
4. **Parked items** — escalations and beyond-panel-cap findings accumulated so far, each with its source report.
5. **Roast iteration counts, per loop** — `roastDesignRound`, `roastCodeRound`.

Include this sentence verbatim, because it is the reason item 5 exists:

> A cap that lives in session memory is not a cap: if a restart resets the counter, the cap-3 loop can run indefinitely.

- [ ] **Step 2: Specify the file format**

Give a complete worked example — a real `run.md` mid-run, not a template with blanks:

```markdown
# super-auto run — 2026-07-31-rate-limiter

flags: planOneShot=false skipPlanRoast=false skipCodeRoast=false autonomous=true
phase: roast-code

spec: docs/superpowers/runs/2026-07-31-rate-limiter/design.md
plan: docs/superpowers/runs/2026-07-31-rate-limiter/plan.md
epic: bd-412
branch: epic-bd-412-integration
roast-design: roast-design-1.md, roast-design-2.md
roast-code: roast-code-1.md

roastDesignRound: 2
roastCodeRound: 1

parked:
- roast-design-2.md · escalation · "cache invalidation premise unverified — no valid judge votes"
- roast-code-1.md · beyond-cap · "Blocking candidate left unjudged at panel cap"
```

- [ ] **Step 3: State the resume rule**

> On invocation, an existing `run.md` for the same spec means **resume from its recorded phase**, not restart. Re-entry reads the flags and iteration counts from the file and continues; it never re-asks the flags and never resets a counter.

Add the failure this prevents: a resumed run that restarts at phase 1 re-brainstorms an approved spec and re-executes merged work.

- [ ] **Step 4: Verify the contract is complete**

```bash
grep -c 'roastDesignRound\|roastCodeRound' skills/super-auto/run-state.md   # expect >=2
grep -c 'not a cap' skills/super-auto/run-state.md                          # expect 1
grep -c 'resume from its recorded phase' skills/super-auto/run-state.md     # expect 1
```

- [ ] **Step 5: Commit**

```bash
git add skills/super-auto/run-state.md
git commit -m "feat(super-auto): specify the committed run-state contract"
```

---

### Task 3: report-prompt.md — the final report contract

**Files:**
- Create: `skills/super-auto/report-prompt.md`

**Interfaces:**
- Consumes: `run.md`'s parked items and pointers (Task 2).
- Produces: the contract `SKILL.md` (Task 4) dispatches at phase `report`.

- [ ] **Step 1: Write the status line rule first**

The report opens with exactly one of:

```
status: clean
status: completed with <N> unresolved Blocking
status: stalled at phase <phase>
```

State the prohibition explicitly: **never a bare "done."** A run that parked Blocking findings and reports "done" is the exact failure this contract exists to prevent.

- [ ] **Step 2: Specify the five sections with their sources**

Each section names where its content comes from, so it cannot be narrated from memory:

| Section | Content | Sourced from |
|---|---|---|
| Implemented | What landed, task by task | beads closed under the epic; `super-code`'s `completed`; ledger completion lines with commit ranges |
| Remaining | What did not land, and why each didn't | `escalated`, `pendingRetry`, parked escalations, unresolved Blocking at cap-out |
| Gotchas & surprises | Where reality diverged from the design | roast findings that changed a design decision; triaged blocker beads; plan-defect findings; anything that forced a nested brainstorm |
| Entrypoints | Where to start reading, in order | the task tree's dependency order — root-most module, public interface, primary caller |
| Smells | Code the run is uneasy about, each with a one-line "the smell" | parked findings; `DONE_WITH_CONCERNS` reports; tasks needing 4–5 fix rounds; tasks that tripped the breaker |

- [ ] **Step 3: State the two properties of the Smells section**

Both are load-bearing and easy to lose:

> Smells are **derived, not guessed**: `super-code` already tracks every signal meaning "this was hard" — a parked ruling is by definition code merged over a live review finding, and a task that burned four fix rounds is one the implementer could not see its way through.

> This is the one section that deliberately surfaces work that **passed** review. A parked finding cleared the gate, but a human reading the diff should know a judge argued against it and was overruled.

- [ ] **Step 4: State the sourcing prohibition**

> Every section is sourced from a durable artifact, never from the writing agent's recollection. If a fact cannot be traced to a bead, a ledger line, or a roast report, it does not go in the report.

- [ ] **Step 5: Verify**

```bash
grep -c 'never a bare' skills/super-auto/report-prompt.md          # expect 1
grep -c 'derived, not guessed' skills/super-auto/report-prompt.md  # expect 1
grep -ci 'entrypoint' skills/super-auto/report-prompt.md           # expect >=1
grep -c 'recollection' skills/super-auto/report-prompt.md          # expect >=1
```

- [ ] **Step 6: Commit**

```bash
git add skills/super-auto/report-prompt.md
git commit -m "feat(super-auto): specify the final report contract"
```

---

### Task 4: SKILL.md — the sequencer

**Files:**
- Create: `skills/super-auto/SKILL.md`

**Interfaces:**
- Consumes: `run-state.md` (Task 2), `report-prompt.md` (Task 3), the override from Task 1.

- [ ] **Step 1: Write frontmatter — triggers only, never workflow**

```yaml
---
name: super-auto
description: Use when taking a feature from a raw idea all the way to finished code in one invocation, optionally unattended. Not for reviewing an existing PR or design (that is super-roast) and not for executing an epic that already has a task tree (that is super-code).
---
```

The description states **triggers only**. Do not summarise the phase sequence in it — a description that summarises workflow causes agents to follow the description instead of reading the skill.

- [ ] **Step 2: Write the boundary and governing rule**

State verbatim:

> If a change would improve how a *phase* works, it belongs in that phase's skill, not here. `super-auto` may only grow in the sequencing dimension.

Then the three concrete prohibitions: never re-implement `super-plan`'s roast loop (answer its offer), never decide severity or adjudicate an escalation, never copy an artifact another skill owns.

- [ ] **Step 3: Write the inputs section**

The four flags in a table with their effects, and the rule: collected once before any phase runs, in **one batched question**, and only asked if not already supplied in the invocation.

- [ ] **Step 4: Write the phase table**

Six rows: `brainstorming` (Mode A/B) → `super-plan` → `super-roast` design (via super-plan's offer) → `super-code` → `super-roast` PR → fix loop (findings become beads under the epic; cap 3; stop early if the confirmed-Blocking count does not shrink).

State that `super-auto` owns every transition explicitly and tells `super-plan` the hand-off is `super-auto`'s to make — otherwise the flags strand and the sequence is lost.

- [ ] **Step 5: Write the autonomy section**

The boundary sentence, verbatim:

> Autonomy begins the moment the first roast report exists.

Then: fix designs applied without asking or waiting (the request to run autonomously *is* the approval); nested brainstorms run Mode B; escalations and beyond-cap items parked and surfaced, never auto-adjudicated; `super-code` runs in its own autonomous mode.

Then the accepted risk, stated plainly:

> If a roast fix loop caps out at 3 with Blocking findings unresolved, autonomous mode parks them rather than halting. A run can finish having merged code with known Blocking findings — which is why the report leads with status.

- [ ] **Step 6: Write the run-directory section**

The layout, and the redirection mechanism: `brainstorming` and `writing-plans` are given the run directory as their documented location preference; `super-roast` uses the override added in Task 1. Point at `./run-state.md` and `./report-prompt.md` by name rather than restating them.

- [ ] **Step 7: Write Red Flags**

At minimum:
- Re-implementing a phase's behaviour instead of invoking it
- Auto-adjudicating a roast escalation, or folding one into the fix queue
- Asking a question after the first roast report when `autonomous` is set
- Reporting "done" without a status line
- Keeping a roast iteration count in session memory instead of `run.md`
- Moving existing flat `specs/`/`plans/` documents into a run directory

- [ ] **Step 8: Run the trigger micro-test**

Dispatch three probe agents on a cheap model, each given only the frontmatter descriptions of `super-auto`, `super-roast`, and `super-code`, and asked which fires:

1. "take this idea and get it to finished code" → expect `super-auto`
2. "review this PR before I merge it" → expect `super-roast`
3. "execute this epic, the tasks are already planned" → expect `super-code`

Record the result (3/3 or the failures) in the file. If any probe misfires, adjust the description and re-run — **the description is the only thing under test here.**

- [ ] **Step 9: Verify**

```bash
grep -c 'may only grow in the sequencing dimension' skills/super-auto/SKILL.md  # expect 1
grep -c 'Autonomy begins the moment' skills/super-auto/SKILL.md                 # expect 1
grep -c 'run-state.md\|report-prompt.md' skills/super-auto/SKILL.md             # expect >=2
wc -w skills/super-auto/SKILL.md                                                # target <900
```

- [ ] **Step 10: Commit**

```bash
git add skills/super-auto/SKILL.md
git commit -m "feat(super-auto): add the sequencing skill entry point"
```

---

### Task 5: Wire-up and reference integrity

**Files:**
- Modify: `README.md` (the "New skills" list, ~`:9-13`)
- Modify: `docs/superpowers/specs/INDEX.md` (super-auto row status)

**Interfaces:**
- Consumes: the completed skill from Tasks 1–4.

- [ ] **Step 1: Add super-auto to the README fork-additions list**

Add a fourth bullet after `super-code`, matching the existing entries' voice and length. It must state what super-auto sequences and that autonomy starts at the first roast report. Follow the precedent set by `super-code`'s entry and include a validation-status note if the end-to-end run (Task 6) has not yet passed.

- [ ] **Step 2: Verify the README claim is backed**

```bash
grep -c 'super-auto' README.md                                   # expect >=1
grep -c 'Autonomy begins the moment' skills/super-auto/SKILL.md  # expect 1 — the claim's source
```

- [ ] **Step 3: Reference-integrity sweep**

```bash
# every file super-auto names must exist
grep -oE './(run-state|report-prompt)\.md' skills/super-auto/SKILL.md | sort -u
ls skills/super-auto/
# the three phase skills super-auto invokes must exist
for s in brainstorming super-plan super-roast super-code; do test -f skills/$s/SKILL.md && echo "$s ok"; done
# SDD untouched
git diff --quiet upstream/main -- skills/subagent-driven-development/ && echo "SDD byte-identical"
```
Expected: every referenced file resolves; all four phase skills present; SDD clean.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/superpowers/specs/INDEX.md
git commit -m "docs(super-auto): announce the skill and confirm references"
```

---

### Task 6: Validation

**Files:**
- Modify: `skills/super-auto/SKILL.md` (record results)

**Interfaces:**
- Consumes: everything from Tasks 1–5.

This task is what makes the skill's claims true rather than asserted. Do not mark it complete on inspection alone.

- [ ] **Step 1: Cheap end-to-end run**

Invoke `super-auto` on a trivial feature — one that needs a single task — with `skipPlanRoast=true`, `skipCodeRoast=true`, `autonomous=false`. This is the only test that proves the phases actually chain.

Confirm each of these happened, and record which did not:
- `brainstorming` wrote `design.md` **into the run directory**, not flat into `specs/`
- `super-plan` produced a task tree and did **not** chain into execution on its own
- `super-code` executed and merged
- `report.md` was written with a status line

- [ ] **Step 2: Resume test**

Interrupt a run after phase 2 (kill the session). Re-invoke `super-auto` on the same spec.

Confirm: it re-enters at phase 3, does **not** re-ask the four flags, and does **not** reset `roastDesignRound`. Record the observed `run.md` before and after.

- [ ] **Step 3: Record what the runs prove and do not prove**

Write the results into `SKILL.md`. State plainly what remains unvalidated: a full roast-fix cycle and an autonomous run. Do not claim either without evidence.

- [ ] **Step 4: Commit**

```bash
git add skills/super-auto/SKILL.md
git commit -m "test(super-auto): record end-to-end and resume validation"
```
