# Design Continuity & Worktree Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the design workflow memory — read adjacent prior designs on look-around (via an INDEX), fold post-implementation fixes back into specs, and run brainstorming inside an isolated worktree that is cleaned up once commits are preserved.

**Architecture:** Pure edits to skill markdown plus one new catalog file. Three skill files (`brainstorming`, `writing-plans`, `finishing-a-development-branch`) and one new file (`docs/superpowers/specs/INDEX.md`) are modified independently; a final pass checks cross-references and commits.

**Tech Stack:** Markdown skill files under `skills/`; design specs under `docs/superpowers/specs/`.

**Spec:** docs/superpowers/specs/2026-06-08-design-continuity-and-worktree-lifecycle-design.md

---

**Execution notes for the controller:**
- Tasks 1–4 edit disjoint files and are **parallel-safe** — dispatch concurrently. Task 5 (review + commit) depends on 1–4; run last.
- This is markdown content, not code. Subagents must NOT commit (5 parallel commits race on the git index) — they **edit + self-verify only**; the controller commits each file sequentially.
- `systematic-debugging` is intentionally NOT touched. Do not edit it.

---

### Task 1: brainstorming — worktree-at-start, look-around reads INDEX + adjacent specs, spec gets Post-Implementation Notes, write-doc adds INDEX row

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

- [ ] **Step 1: Rewrite the Checklist (add worktree-start step 1 + INDEX look-around, renumber)**

Replace this exact block:

```
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

with:

```
You MUST create a task for each of these items and complete them in order:

1. **Start an isolated worktree** — before writing the spec or any files, ensure an isolated worktree via `superpowers:using-git-worktrees`. The spec and all work live there.
2. **Explore project context** — check files, docs, recent commits; read `docs/superpowers/specs/INDEX.md` and open the adjacent prior designs it points to (see "Understanding the idea")
3. **Select design mode** — Mode A (collaborative, default) or Mode B (one-shot); see Design Modes above
4. **Offer visual companion** (if topic will involve visual questions) — this is its own message, not combined with a clarifying question. See the Visual Companion section below.
5. **Ask clarifying questions** *(Mode A only)* — one at a time, scaled to complexity, covering every ambiguous/contentious part
6. **Propose 2-3 approaches** — with trade-offs and your recommendation *(Mode A presents these to the user; Mode B decides alone)*
7. **Present design** *(Mode A only)* — in sections scaled to their complexity, get user approval after each section
8. **Write design doc** — save to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` (ending with a `## Post-Implementation Notes` section), add an INDEX.md row, and commit (Mode B uses the one-shot spec structure)
9. **Spec self-review** — quick inline check for placeholders, contradictions, ambiguity, scope (see below)
10. **User reviews written spec** *(Mode B only)* — ask the user to review the spec file before proceeding
11. **Transition to implementation** — beads available → create epic + rough tasks, then subagent-driven-development (beads mode); otherwise → writing-plans
```

- [ ] **Step 2: Add the worktree node to the Process Flow diagram (node declaration)**

Replace this exact line:

```
    "Explore project context" [shape=box];
```

with:

```
    "Start isolated worktree (using-git-worktrees)" [shape=box];
    "Explore project context" [shape=box];
```

- [ ] **Step 3: Add the worktree edge to the Process Flow diagram**

Replace this exact line:

```
    "Explore project context" -> "Select design mode";
```

with:

```
    "Start isolated worktree (using-git-worktrees)" -> "Explore project context";
    "Explore project context" -> "Select design mode";
```

- [ ] **Step 4: Augment "Understanding the idea" with the worktree start and the INDEX look-around**

Replace this exact block:

```
**Understanding the idea:**

- Check out the current project state first (files, docs, recent commits)
```

with:

```
**Understanding the idea:**

- **Start in an isolated worktree.** Before writing the spec or any files, ensure an isolated worktree exists via `superpowers:using-git-worktrees` — the spec and all subsequent work live there, keeping the original checkout clean. The skill is idempotent, so later skills just verify it.
- Check out the current project state first (files, docs, recent commits)
- Read `docs/superpowers/specs/INDEX.md`, then open the prior designs whose titles/summaries/tags look adjacent to this work — including their `## Post-Implementation Notes` — and surface relevant past decisions to the user. (If `INDEX.md` doesn't exist yet, scan `docs/superpowers/specs/` directly.)
```

- [ ] **Step 5: Update the "After the Design / Documentation" block (Post-Implementation Notes + INDEX row)**

Replace this exact block:

```
- Write the validated design (spec) to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
  - (User preferences for spec location override this default)
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git
```

with:

```
- Write the validated design (spec) to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
  - (User preferences for spec location override this default)
- End every spec with a `## Post-Implementation Notes` section containing this standing instruction verbatim, so note-taking fires later even though brainstorming has handed off:
  > *As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
- Add a row for the new spec to `docs/superpowers/specs/INDEX.md` with status `draft` (date · title · relative link · one-line summary · status · tags). If `INDEX.md` does not exist, create it from the format documented at the top of that file.
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document and `INDEX.md` to git
```

- [ ] **Step 6: Verify**

Run:
```bash
grep -n "Start an isolated worktree" skills/brainstorming/SKILL.md
grep -n "Start isolated worktree (using-git-worktrees)" skills/brainstorming/SKILL.md
grep -n "Read \`docs/superpowers/specs/INDEX.md\`" skills/brainstorming/SKILL.md
grep -n "## Post-Implementation Notes" skills/brainstorming/SKILL.md
grep -n "status \`draft\`" skills/brainstorming/SKILL.md
grep -c "11. \*\*Transition to implementation\*\*" skills/brainstorming/SKILL.md
```
Expected: the worktree node grep returns 2 matches (declaration + edge); the others return ≥1; the renumbered transition step (11) count is 1.

---

### Task 2: writing-plans — plan header records the Spec path

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

- [ ] **Step 1: Add a Spec line to the plan header template**

Replace this exact block:

```
**Tech Stack:** [Key technologies/libraries]

---
```

with:

```
**Tech Stack:** [Key technologies/libraries]

**Spec:** [path to the originating design spec under docs/superpowers/specs/, or "none" if ad-hoc] — finishing-a-development-branch uses this to append post-implementation notes back to the design.

---
```

- [ ] **Step 2: Verify**

Run:
```bash
grep -n "\*\*Spec:\*\*" skills/writing-plans/SKILL.md
```
Expected: one match inside the plan-header template.

---

### Task 3: finishing-a-development-branch — record design outcomes, clean up worktree after preservation

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md`

- [ ] **Step 1: Insert Step 1.5 (Update the Design Record) after Step 1**

Replace this exact block:

```
**If tests pass:** Continue to Step 2.

### Step 2: Detect Environment
```

with:

```
**If tests pass:** Continue to Step 1.5.

### Step 1.5: Update the Design Record

Locate the originating design spec via the plan header's `Spec:` line (or, in beads mode, the epic). If a spec exists:

- If implementation involved fixes or adjustments that diverged from the design's assumptions, prepend a short dated **"Changes vs. original design"** summary at the top of the spec's `## Post-Implementation Notes` section (leave any running bullets below it intact).
- Update the spec's row in `docs/superpowers/specs/INDEX.md`: set status to `implemented` (or `superseded-by: <file>` if this design replaced an earlier one).
- Commit these doc edits on the feature branch **now**, so they are included in whatever integration option runs next.

If no spec is found (ad-hoc work with no brainstorming), skip this step.

### Step 2: Detect Environment
```

- [ ] **Step 2: Clean up the worktree after creating a PR (Option 2)**

Replace this exact line:

```
**Do NOT clean up worktree** — user needs it alive to iterate on PR feedback.
```

with:

```
After the PR is created the commits are preserved (pushed to the remote and on a branch in the shared repo), so **clean up the worktree** (Step 6). If PR feedback later requires changes, re-establish a workspace then.
```

- [ ] **Step 3: Clean up the worktree for Keep As-Is (Option 3)**

Replace this exact block:

```
#### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**
```

with:

```
#### Option 3: Keep As-Is

The branch and its commits remain in the shared repo, so they are preserved. Report: "Keeping branch <name>." Then **clean up the worktree** (Step 6) — the branch persists without it; re-establish a workspace later if you resume work.
```

- [ ] **Step 4: Widen Step 6 to run for every option**

Replace this exact block:

```
### Step 6: Cleanup Workspace

**Only runs for Options 1 and 4.** Options 2 and 3 always preserve the worktree.
```

with:

```
### Step 6: Cleanup Workspace

**Runs for every option (1–4).** The worktree is disposable scaffolding, and by this point the commits are always preserved (merged, pushed via PR, or kept on a branch in the shared repo) or intentionally discarded. Clean up the superpowers-created worktree in all cases.
```

- [ ] **Step 5: Update the Quick Reference table**

Replace this exact block:

```
| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | yes | - | - | yes |
| 2. Create PR | - | yes | yes | - |
| 3. Keep as-is | - | - | yes | - |
| 4. Discard | - | - | - | yes (force) |
```

with:

```
| Option | Merge | Push | Cleanup Worktree | Cleanup Branch |
|--------|-------|------|------------------|----------------|
| 1. Merge locally | yes | - | yes | yes |
| 2. Create PR | - | yes | yes | - |
| 3. Keep as-is | - | - | yes | - |
| 4. Discard | - | - | yes | yes (force) |
```

- [ ] **Step 6: Fix the inverted "Common Mistakes" entry**

Replace this exact block:

```
**Cleaning up worktree for Option 2**
- **Problem:** Remove worktree user needs for PR iteration
- **Fix:** Only cleanup for Options 1 and 4
```

with:

```
**Preserving the worktree after the work is integrated**
- **Problem:** Leaving disposable worktrees around after commits are safely preserved clutters the workspace
- **Fix:** Clean up the superpowers-created worktree for every option once commits are preserved (or discarded)
```

- [ ] **Step 7: Update the Red Flags "Always" line**

Replace this exact line:

```
- Clean up worktree for Options 1 & 4 only
```

with:

```
- Clean up the superpowers-created worktree once commits are preserved (all options)
```

- [ ] **Step 8: Verify**

Run:
```bash
grep -n "### Step 1.5: Update the Design Record" skills/finishing-a-development-branch/SKILL.md
grep -n "Changes vs. original design" skills/finishing-a-development-branch/SKILL.md
grep -n "Runs for every option" skills/finishing-a-development-branch/SKILL.md
grep -n "Cleanup Worktree" skills/finishing-a-development-branch/SKILL.md
grep -n "Do NOT clean up worktree" skills/finishing-a-development-branch/SKILL.md || echo "OLD PR-PRESERVE GONE (good)"
grep -n "Only cleanup for Options 1 and 4" skills/finishing-a-development-branch/SKILL.md || echo "OLD MISTAKE TEXT GONE (good)"
```
Expected: the first four greps match; the last two old phrases are gone.

---

### Task 4: Create the INDEX.md catalog, seeded with all specs

**Files:**
- Create: `docs/superpowers/specs/INDEX.md`

- [ ] **Step 1: Create the file**

Create `docs/superpowers/specs/INDEX.md` with exactly this content:

```markdown
# Superpowers Design Specs — Index

Catalog of the design specs in this directory, newest first. The brainstorming look-around reads this to find adjacent prior designs and resurface past decisions, so keep summaries and tags meaningful.

**Status vocabulary:** `draft` (written, not yet implemented) · `implemented` (built and integrated) · `superseded-by: <file>` (replaced by a later design).

**Maintenance:** brainstorming adds a row with status `draft` when it writes a spec; finishing-a-development-branch flips the status to `implemented` (or `superseded-by`) when the work completes.

| Date | Title | Spec | Summary | Status | Tags |
|------|-------|------|---------|--------|------|
| 2026-06-08 | Design Continuity & Worktree Lifecycle | [link](2026-06-08-design-continuity-and-worktree-lifecycle-design.md) | INDEX + read adjacent designs on look-around; post-implementation notes folded back into specs; brainstorming starts in an isolated worktree, cleaned up once commits are preserved. | draft | brainstorming, worktrees, spec-lifecycle, INDEX, design-memory |
| 2026-06-06 | Design Modes & Beads-Driven Execution Workflow | [link](2026-06-06-design-modes-and-beads-workflow-design.md) | Two brainstorming design modes (collaborative/one-shot); beads epic execution when bd is available; always-subagent, disjoint-file parallel execution. | implemented | brainstorming, design-modes, beads, subagent, parallel |
| 2026-04-06 | Worktree Rototill: Detect-and-Defer | [link](2026-04-06-worktree-rototill-design.md) | Defer to harness-native worktree support instead of hardcoded superpowers paths/commands. | implemented | worktrees, harness, detect-and-defer |
| 2026-03-23 | Codex App Compatibility | [link](2026-03-23-codex-app-compatibility-design.md) | Make the worktree and finishing skills work in the Codex App's sandboxed worktree environment. | implemented | codex, worktrees, finishing, compatibility |
| 2026-03-11 | Zero-Dependency Brainstorm Server | [link](2026-03-11-zero-dep-brainstorm-server-design.md) | Replace the brainstorm companion server's vendored node_modules with a single zero-dependency server.js using Node built-ins. | implemented | brainstorm-server, zero-dependency, node |
| 2026-02-19 | Visual Brainstorming Refactor | [link](2026-02-19-visual-brainstorming-refactor-design.md) | Browser shows visuals while the terminal stays free for user input during visual brainstorming. | implemented | brainstorming, visual-companion, browser, tui |
| 2026-01-22 | Document Review System | [link](2026-01-22-document-review-system-design.md) | Add spec-review and code-review stages to the superpowers workflow. | implemented | review, workflow, spec-review, code-review |
```

(Note: the six pre-existing specs are seeded as `implemented` on a best-effort basis. The 2026-06-08 row is `draft` and will be flipped to `implemented` by finishing when this very change completes.)

- [ ] **Step 2: Verify**

Run:
```bash
test -f docs/superpowers/specs/INDEX.md && echo "EXISTS"
grep -c "^| 202" docs/superpowers/specs/INDEX.md
grep -n "design-continuity-and-worktree-lifecycle-design.md" docs/superpowers/specs/INDEX.md
```
Expected: `EXISTS`; row count is 7; the 2026-06-08 row is present.

---

### Task 5: Cross-reference consistency pass + commit

**Depends on Tasks 1–4. Run last (controller-side).**

- [ ] **Step 1: Confirm cross-references resolve**

Run:
```bash
# brainstorming references using-git-worktrees and INDEX
grep -n "using-git-worktrees" skills/brainstorming/SKILL.md
grep -n "INDEX.md" skills/brainstorming/SKILL.md
# writing-plans Spec line + finishing reads it
grep -n "Spec:" skills/writing-plans/SKILL.md
grep -n "plan header's \`Spec:\` line" skills/finishing-a-development-branch/SKILL.md
# every INDEX row links a spec file that actually exists
for f in $(grep -oE '\(20[0-9-]+[a-z0-9-]+\.md\)' docs/superpowers/specs/INDEX.md | tr -d '()'); do
  test -f "docs/superpowers/specs/$f" && echo "OK  $f" || echo "MISSING $f"
done
```
Expected: all greps match; every INDEX-linked spec file prints `OK` (no `MISSING`).

- [ ] **Step 2: Fresh-eyes read against the spec**

Read the spec `docs/superpowers/specs/2026-06-08-design-continuity-and-worktree-lifecycle-design.md` and confirm each requirement maps to a landed edit:
- look-around reads INDEX + adjacent specs (Task 1)
- INDEX.md exists, rich entries, seeded, maintenance documented (Task 4 + Task 1 write-doc + Task 3 status flip)
- Post-Implementation Notes convention in spec + continuous/consolidated flow (Task 1 + Task 3)
- worktree-from-start + cleanup-after-preserve for all options (Task 1 + Task 3)
- spec↔implementation linkage via plan `Spec:` line (Task 2 + Task 3)
- systematic-debugging NOT modified (confirm `git status` shows no change to it)

Fix any gap inline and commit with a focused message.

- [ ] **Step 3: Confirm clean tree**

Run:
```bash
git status --porcelain
git log --oneline -6 | cat
```
Expected: clean tree; recent commits include the brainstorming, writing-plans, finishing, and INDEX changes.
```
