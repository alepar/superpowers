# Leaf Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** §Decomposition formalized as split-first/connect-second with a three-rule sizing bar (cohesion, ceremony floor, fan-out-aware bottleneck rule), plus a `SPLIT` verdict riding the existing promotion review for oversized leaves gating ≥2 dependents.

**Architecture:** Prose-only edits to two super-design files plus the specs INDEX. Spec: `docs/superpowers/specs/2026-08-26-leaf-sizing-design.md`. No new passes, no engine changes.

**Tech Stack:** Markdown skill files; haiku probe subagents.

## Global Constraints

- Do not edit `skills/subagent-driven-development/` or the ```javascript fence in `skills/super-code/coordinator-workflow.md`.
- SKILL.md files carry execution content only (fork's standing context-pollution rule) — the measured evidence stays in commit messages.
- No frontmatter description changes anywhere.
- Work from the repo root; commit after each task.

---

### Task 1: §Decomposition — two-step frame + sizing bar

**Files:**
- Modify: `skills/super-design/SKILL.md` (§Decomposition, directly after its opening line)

**Interfaces:**
- Produces: the "Step A/Step B" framing and sizing-bar vocabulary ("unblocking artifact", "ceremony floor") Task 2's reviewer criterion references.

- [ ] **Step 1: Insert the frame and sizing bar.** Find:

```markdown
Same fields as brainstorming's old beads step: title, short description, files-touched hint, blocking deps per child.
```

Replace with:

```markdown
Same fields as brainstorming's old beads step: title, short description, files-touched hint, blocking deps per child.

**Decompose in two explicit steps.** **Step A — split:** carve the spec into minimal
logically-cohesive chunks per the sizing bar below, ignoring ordering entirely while splitting.
**Step B — connect, as a first approximation:** add blocking deps per the edge rules further
down, sparse by the standing "when in doubt, leave it out" policy. The deps you write are a
first approximation by design — the promotion review runs next, and coverage's edge audit
(`NARRATIVE-EDGE`) and seam check (`UNOWNED-SEAM`) refine edges after the tree settles — so do
not agonize over edges; a dedicated audit owns edge quality. Step A's job, which nothing
downstream can recover, is to not miss work and to not fuse work that could run apart.

**The sizing bar (Step A):**

- **Cohesion:** a leaf is one merge-worthy deliverable a reviewer accepts or rejects as a
  unit. A description that needs "and then" is two beads.
- **Floor:** execution spends roughly five dispatches of ceremony per bead (brief → implement →
  review → merge → ledger), so never split below one coherent reviewable change — a bead whose
  implementation is smaller than its own ceremony merges into a sibling. Minimal is not tiny.
- **Bottleneck rule (fan-out-aware):** size a bead inversely to how many others depend on it. A
  bead that gates others lands **only the unblocking artifact** — polish, tests beyond the
  artifact's own acceptance, and remaining call-site migration move into dependents or a
  non-gating sibling that depends on it. Seam-contract beads are the exemplar: compilable
  stubs, inert-by-default. Width is parallelism — every line moved off a bottleneck bead moves
  work off the critical path.
```

- [ ] **Step 2: Verify**

Run: `grep -c "Step A — split\|Bottleneck rule" skills/super-design/SKILL.md`
Expected: 2 or more.

- [ ] **Step 3: Commit**

```bash
git add skills/super-design/SKILL.md
git commit -m "feat(super-design): two-step decomposition + sizing bar (cohesion, ceremony floor, bottleneck rule)"
```

---

### Task 2: The `SPLIT` verdict in promotion review

**Files:**
- Modify: `skills/super-design/promotion-reviewer-prompt.md` (input list, per-task verdict section, output format, closing summary)
- Modify: `skills/super-design/SKILL.md` (§Promotion Review paragraph)

**Interfaces:**
- Consumes: Task 1's sizing-bar vocabulary.

- [ ] **Step 1: Reviewer input gains deps.** In `skills/super-design/promotion-reviewer-prompt.md`, find:

```
    ## Child task list
    [for each child task: id/title, short description, files-touched hint]
```

Replace with:

```
    ## Child task list
    [for each child task: id/title, short description, files-touched hint, and the ids it
    depends on — deps are required input: the SPLIT test below counts each task's dependents
    from them]
```

- [ ] **Step 2: Per-task verdict gains SPLIT.** Find:

```
    For each child task, return `LEAF` or `PROMOTE` with a one-line rationale. Either test
    triggers `PROMOTE`:

    - **Uncertainty test:** implementing this task would force design decisions the spec doesn't
      answer.
    - **Size test:** the task would decompose into ~5+ subtasks or spans multiple subsystems.
```

Replace with:

```
    For each child task, return `LEAF`, `PROMOTE`, or `SPLIT` with a one-line rationale. Either
    test triggers `PROMOTE`:

    - **Uncertainty test:** implementing this task would force design decisions the spec doesn't
      answer.
    - **Size test:** the task would decompose into ~5+ subtasks or spans multiple subsystems.

    `SPLIT` is narrower and fires only when BOTH hold — do not size-police tasks that gate
    nothing:

    - **Bottleneck test:** two or more other children list this task in their deps.
    - **Oversize test:** the task bundles its unblocking artifact (the interface, schema, or
      mechanism its dependents actually consume) together with separable work — polish, tests
      beyond the artifact's own acceptance, migration of remaining call sites.

    A `SPLIT` verdict's rationale MUST name both halves: the minimal unblocking artifact, and
    the deferrable remainder. A task that gates ≥2 dependents but is already minimal is a
    `LEAF` — gating alone is not a finding.
```

- [ ] **Step 3: Output format.** Find:

```
    ### Per-task verdicts
    <task-id/title> — LEAF|PROMOTE — <one-line rationale>
    (one line per child task)
```

Replace with:

```
    ### Per-task verdicts
    <task-id/title> — LEAF|PROMOTE|SPLIT — <one-line rationale; for SPLIT: "artifact: <the
    minimal unblocking piece> / remainder: <what defers>">
    (one line per child task)
```

- [ ] **Step 4: Closing summary line.** Find:

```markdown
**Reviewer returns:** per-task `LEAF`/`PROMOTE` verdicts with rationale, plus a decomposition
verdict (`COMPLETE`/`ISSUES` with evidence) for the child set as a whole.
```

Replace with:

```markdown
**Reviewer returns:** per-task `LEAF`/`PROMOTE`/`SPLIT` verdicts with rationale (`SPLIT` names
the unblocking artifact and the deferrable remainder), plus a decomposition verdict
(`COMPLETE`/`ISSUES` with evidence) for the child set as a whole.
```

- [ ] **Step 5: SKILL.md handling sentence.** In `skills/super-design/SKILL.md` §Promotion Review, find:

```markdown
Sanity-check the verdicts; you may overrule them.
```

Replace with:

```markdown
Sanity-check the verdicts; you may overrule them. A `SPLIT` verdict is handled like a
decomposition `ISSUES`: apply it — shrink the flagged bead to its named unblocking artifact and
move the remainder into a dependent or a non-gating sibling that depends on it — or overrule it
with the reason recorded on the task (a comment on the bead; no new flag), the same recording
discipline as a demotion.
```

- [ ] **Step 6: Verify**

Run: `grep -c "SPLIT" skills/super-design/promotion-reviewer-prompt.md && grep -c "SPLIT" skills/super-design/SKILL.md`
Expected: 6+ and 2+ respectively.

- [ ] **Step 7: Commit**

```bash
git add skills/super-design/promotion-reviewer-prompt.md skills/super-design/SKILL.md
git commit -m "feat(super-design): SPLIT verdict — promotion review flags oversized bottleneck leaves"
```

---

### Task 3: Probe verification

**Files:**
- Create: none persisted (results recorded in Task 4's commit body)

**Interfaces:**
- Consumes: Task 2's amended reviewer prompt (assemble probes from the ACTUAL file content).

- [ ] **Step 1: Bottleneck fixture.** Dispatch a haiku subagent with the reviewer prompt assembled from the file, inputs filled: a two-line spec ("Sessions obtain opponents through a provider interface; three consumers integrate against it"); child list: `t-1 — Provider interface + docs + migrate all existing call sites + polish error messages. Description: define OpponentProvider, write its guide, migrate the 9 legacy call sites, improve provider error strings. deps: (none)`; `t-2/t-3/t-4 — three consumer integrations, each "deps: t-1"`. Expected: `t-1 — SPLIT` with rationale naming the interface as artifact and docs/migration/polish as remainder; t-2..t-4 LEAF.

- [ ] **Step 2: Right-sized control.** Same fixture but `t-1 — Provider interface. Description: define OpponentProvider (compilable interface + minimal acceptance test). deps: (none)`, with docs/migration/polish as a separate `t-5, deps: t-1`. Expected: all LEAF, zero SPLIT (t-1 gates three but is minimal — gating alone is not a finding).

- [ ] **Step 3:** If either probe fails, revise the SPLIT wording once and re-probe; second failure stops for the human partner.

---

### Task 4: Release

**Files:**
- Modify: the four fork-versioned manifests; `docs/superpowers/specs/INDEX.md`

- [ ] **Step 1: INDEX row.** Add a row for `2026-08-26-leaf-sizing-design.md` in the file's existing format, newest-first position.

- [ ] **Step 2: Bump + regression**

```bash
sed -i '' 's/6\.2\.0-alepar2\.14/6.2.0-alepar2.15/g' .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json
node tests/super-code/replay-harness.mjs | tail -1
```

Expected: four manifests at 2.15; `546 passed, 0 failed`.

- [ ] **Step 3: Commit, tag, push** (probe results in the commit body)

```bash
git add -A
git commit -m "chore: v6.2.0-alepar2.15 — bump manifests (leaf sizing)"
git tag -a v6.2.0-alepar2.15 -m "super-design: two-step decomposition, sizing bar, SPLIT verdict"
git push origin main && git push origin v6.2.0-alepar2.15
```
