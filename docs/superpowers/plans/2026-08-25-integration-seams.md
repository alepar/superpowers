# Integration Seams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make cross-bead integration seams explicitly owned at design time — contract beads that deliver compilable boundary code, per-seam integration beads, and a root integration sweep — so the inert-config class of bug cannot survive decomposition unowned.

**Architecture:** All changes are prose in `skills/super-design/` (decomposition guidance, coverage-reviewer finding kind, arbitration bead-creation rules, root-sweep step) plus one sentence in `skills/super-code/SKILL.md`. Zero execution-engine changes — super-code dispatches the resulting tree shape today. Spec: `docs/superpowers/specs/2026-08-25-integration-seams-design.md`.

**Tech Stack:** Markdown skill files; verification via dispatched haiku probe subagents (no test framework).

## Global Constraints

- Do not edit `skills/subagent-driven-development/` (must stay byte-identical to upstream).
- Do not edit the super-code engine script (`coordinator-workflow.md`'s ```javascript fence) — this feature requires zero engine changes; if an edit seems to need one, stop and flag it.
- New beads always use the flag triple `--parent <root-epic-id> --no-inherit-labels -l sp:<root-epic-id>` — copy it verbatim wherever the plan quotes it.
- No frontmatter `description` changes in any SKILL.md (so no trigger micro-tests are owed).
- Work from the repo root of the superpowers fork; commit after each task.

---

### Task 1: Decomposition declares owned/consumed boundaries

**Files:**
- Modify: `skills/super-design/SKILL.md` (§Decomposition, first paragraph — currently line ~91)

**Interfaces:**
- Produces: the phrase "owns:"/"consumes:" boundary declaration convention that Task 2's reviewer check and Task 3's arbitration text reference by name.

- [ ] **Step 1: Edit §Decomposition**

In `skills/super-design/SKILL.md`, find the §Decomposition opening line:

```markdown
Same fields as brainstorming's old beads step: title, short description, files-touched hint, blocking deps per child.
```

Replace with:

```markdown
Same fields as brainstorming's old beads step: title, short description, files-touched hint, blocking deps per child.

**Every child's description names the boundaries it owns and the boundaries it consumes** —
e.g. "owns: `TrainingConfig` schema field; consumes: regime entry-point signature". A boundary
is any data or interface this child exchanges with a sibling: a config value one child defines
and another reads, a function one exposes and another calls, a file format one writes and
another parses. This is not a fifth field — it lives inside the short description — and it is
load-bearing: the recurring seam-bug class (a config parameter implemented in the schema child
and honored in the regime child, with the wiring between them owned by neither, shipping inert)
is an *ownership ambiguity* created here, at decomposition. The coverage loop's `UNOWNED-SEAM`
check (§Coverage) reads these declarations; a child description with no owns/consumes line for
a boundary it plainly touches is what that check exists to catch.
```

- [ ] **Step 2: Verify the edit landed**

Run: `grep -c "owns:.*consumes:" skills/super-design/SKILL.md`
Expected: at least 1.

- [ ] **Step 3: Commit**

```bash
git add skills/super-design/SKILL.md
git commit -m "feat(super-design): decomposition declares owned/consumed boundaries per child"
```

---

### Task 2: `UNOWNED-SEAM` finding kind in the coverage reviewer

**Files:**
- Modify: `skills/super-design/coverage-reviewer-prompt.md` (the `## Checks` list, currently checks 1–4, and the `## Required structured output` type list)

**Interfaces:**
- Consumes: Task 1's owns/consumes declaration convention.
- Produces: the `UNOWNED-SEAM` finding type (fields: type, description, evidence, proposed fix naming participants + boundary) that Task 3's arbitration handling consumes.

- [ ] **Step 1: Insert the seam check**

In `skills/super-design/coverage-reviewer-prompt.md`, find:

```
    4. **Flag sweep.** Every id in "Flagged tasks" is an automatic finding — known-
       underdesigned work must not sail through silently — *unless* it already has an
       entry in the rejected-findings ledger, which takes precedence over the sweep.
```

Replace with:

```
    4. **Seam trace → UNOWNED-SEAM.** For every pair of tasks that exchange a named piece
       of data or an interface — one defines a config value the other reads, one exposes a
       function the other calls, one writes a format the other parses — check that exactly
       one task's description **owns** the boundary (its "owns:" line names it; the
       counterpart "consumes:" it). If no task owns the wiring between them, that is an
       `UNOWNED-SEAM`: name both task ids and the exchanged thing concretely, and quote
       the description text that implies the exchange. The canonical miss this check
       exists for: a config parameter implemented in a schema task and honored in a
       consumer task, with the pass-through wiring owned by neither — both tasks satisfy
       their local descriptions and the parameter ships inert. Disjoint files are not
       evidence of independence; the exchange is dataflow, not file overlap. Do not
       report a seam whose boundary a task plainly owns, and do not invent exchanges the
       descriptions don't imply.
    5. **Flag sweep.** Every id in "Flagged tasks" is an automatic finding — known-
       underdesigned work must not sail through silently — *unless* it already has an
       entry in the rejected-findings ledger, which takes precedence over the sweep.
```

- [ ] **Step 2: Extend the output contract**

In the same file, find:

```
    - **type:** `GAP` | `ORPHAN` | flag-sweep
    - **description:** the problem, one sentence
    - **evidence:** the unmapped goal element, the orphaned task id, or the flag and its
      task id
    - **proposed fix:** a new leaf task under a named epic, or a new subepic needing
      design
```

Replace with:

```
    - **type:** `GAP` | `ORPHAN` | `UNOWNED-SEAM` | flag-sweep
    - **description:** the problem, one sentence
    - **evidence:** the unmapped goal element, the orphaned task id, the seam's two
      participant task ids + the exchanged data/interface + the quoted description text
      implying the exchange, or the flag and its task id
    - **proposed fix:** a new leaf task under a named epic, or a new subepic needing
      design; for `UNOWNED-SEAM`, name the boundary to be contracted (arbitration turns an
      accepted seam into a contract bead + integration bead — see SKILL.md §Coverage)
```

- [ ] **Step 3: Verify**

Run: `grep -c "UNOWNED-SEAM" skills/super-design/coverage-reviewer-prompt.md`
Expected: 3 or more.

- [ ] **Step 4: Commit**

```bash
git add skills/super-design/coverage-reviewer-prompt.md
git commit -m "feat(super-design): UNOWNED-SEAM finding kind in coverage reviewers"
```

---

### Task 3: Arbitration creates seam beads; root sweep at loop end

**Files:**
- Modify: `skills/super-design/SKILL.md` (§Coverage / Gap Loop — the **Arbitration:** paragraph, and a new paragraph after **Recall floor & fallback net:**)

**Interfaces:**
- Consumes: Task 2's `UNOWNED-SEAM` finding shape.
- Produces: the bead titles `Seam contract: <boundary>` / `Seam integration: <boundary>` / `Integration sweep: <root goal>` and the participant-description pointer line `boundary contract: <contract-bead-id>` that Task 4's cross-note and Task 5's probes reference.

- [ ] **Step 1: Extend the Arbitration paragraph**

In `skills/super-design/SKILL.md` §Coverage / Gap Loop, find:

```markdown
**Arbitration:** present deduped findings to the user — minus any this round already has a recorded disposition for (§Run-State File), which are replayed, not re-asked. Accepted `GAP`: small → leaf task added directly; big → task created → promoted → nested brainstorm → its own super-design subtree (tripwire stays armed). Accepted `ORPHAN`: the user picks delete (scope creep) or add the missing goal element it serves.
```

Replace with:

```markdown
**Arbitration:** present deduped findings to the user — minus any this round already has a recorded disposition for (§Run-State File), which are replayed, not re-asked. Accepted `GAP`: small → leaf task added directly; big → task created → promoted → nested brainstorm → its own super-design subtree (tripwire stays armed). Accepted `ORPHAN`: the user picks delete (scope creep) or add the missing goal element it serves. Accepted `UNOWNED-SEAM`: create **two leaf tasks** with the standard flag triple, and wire the tree:

- **`Seam contract: <boundary>`** — delivers **compilable boundary code**, not prose: the interface/types/signatures, the schema fields, and the wiring itself plumbed end-to-end as stubs or defaults (the value must flow even if inert-by-default). Acceptance: compiles, suite green, wiring present. Add a dependency edge from **every participant onto the contract bead** (`bd dep add <participant> <contract>`) — a genuine blocking edge by §Decomposition's own rule (the interface must exist first), not narrative order. Its files-touched hint deliberately spans both sides of the seam; execution merges it before its dependents by construction, so the overlap is expected.
- **`Seam integration: <boundary>`** — depends on that seam's participants only (`bd dep add <integration> <participant>` for each). Delivers: verify the wiring end-to-end, write integration test(s) crossing the seam, see them pass. Small fixes inline; anything larger goes through execution's normal blocker path.
- Append one line to **each participant's** bead description: `boundary contract: <contract-bead-id>` (`bd update <participant> --description` with the line appended) — the pointer flows into execution briefs through the planner with zero execution-side changes.
```

- [ ] **Step 2: Add the root-sweep step**

In the same section, immediately after the **Recall floor & fallback net:** paragraph, insert:

```markdown
**Root integration sweep (after the loop ends):** once the coverage loop yields zero accepted
findings and the tree has ≥2 implementation leaves, create one final leaf with the standard
flag triple — **`Integration sweep: <root goal, short>`** — depending on **every implementation
leaf and every `Seam integration:` bead** (its "tests no per-seam bead covers" scope is only
decidable once those exist). Scope-bounded deliverable: verify the goal's main flow(s) end to
end, add integration tests no per-seam bead covers, and sweep for unwired config values,
parameters, and interfaces; fix small gaps inline, file blockers for big ones. Unlike the
execution Finish-phase review (report-only), this bead *implements* what it finds — it is the
unknown-unknowns net for seams the reviewers missed, and it occupies the terminal join position
that serializes anyway. Fix-loop beads created after the sweep ran do not get edges onto it;
the roast covers that ground.
```

- [ ] **Step 3: Verify**

Run: `grep -c "Seam contract:\|Seam integration:\|Integration sweep:" skills/super-design/SKILL.md`
Expected: 5 or more.

- [ ] **Step 4: Commit**

```bash
git add skills/super-design/SKILL.md
git commit -m "feat(super-design): arbitration creates seam contract/integration beads; root integration sweep"
```

---

### Task 4: super-code cross-note (contract beads under the hot-file cap)

**Files:**
- Modify: `skills/super-code/SKILL.md` (§Parallelism, end of the "Dispatch is not gated on file overlap" paragraph)

**Interfaces:**
- Consumes: Task 3's `Seam contract:` bead title.

- [ ] **Step 1: Add the sentence**

In `skills/super-code/SKILL.md` §Parallelism, find the paragraph ending:

```markdown
with no declared files dispatches normally — isolation makes dispatch-time collision impossible.
```

Replace with:

```markdown
with no declared files dispatches normally — isolation makes dispatch-time collision impossible.
A `Seam contract:` bead (super-design's §Coverage) legitimately declares files on **both** sides
of its boundary — that is its job, not over-declaration; it merges before its dependents by
construction, so its span never contends with them.
```

- [ ] **Step 2: Verify**

Run: `grep -c "Seam contract" skills/super-code/SKILL.md`
Expected: 1.

- [ ] **Step 3: Commit**

```bash
git add skills/super-code/SKILL.md
git commit -m "docs(super-code): seam-contract beads legitimately span the seam's files"
```

---

### Task 5: Probe verification of the seam check

**Files:**
- Create: none persisted (probes are dispatched subagent prompts; record results in the commit message of Task 6)

**Interfaces:**
- Consumes: the amended `## Checks` list from Task 2 (assemble each probe prompt from the ACTUAL current file content, not from this plan).

- [ ] **Step 1: Build the seam fixture probe**

Dispatch a fresh haiku subagent whose prompt is the full coverage-reviewer template from `skills/super-design/coverage-reviewer-prompt.md` (the fenced block, checks 1–5 and output contract copied verbatim from the file as it now stands), with the input sections filled as:

- Goal: `Training runs are configurable: exploration temperature is set in config and honored by the training regime.`
- Parent goal chain: empty. Flagged tasks: none. Rejected-findings ledger: empty.
- Spec: `Add exploration temperature as a first-class config value, honored during training.`
- Task tree:
  - `t-1 — Add temperature to config schema. Description: add 'temperature: float' to TrainingConfig schema with default 1.0 and validation. owns: TrainingConfig schema field.`
  - `t-2 — Honor temperature in training regime. Description: scale exploration noise by the configured temperature inside the regime loop. consumes: a temperature value at regime runtime.`

- [ ] **Step 2: Check the seam fixture result**

Expected: the probe's findings include an `UNOWNED-SEAM` naming `t-1` and `t-2` and the temperature value — neither description owns the config→regime pass-through wiring (t-1 owns the schema field; t-2 consumes a runtime value; nobody plumbs one to the other). If no such finding: the check's wording failed the canonical case — revise Task 2's check text and re-probe before proceeding.

- [ ] **Step 3: Build the control probe**

Same prompt, same tree, except `t-1`'s description becomes: `add 'temperature: float' to TrainingConfig schema with default 1.0 and validation, and plumb it through to the regime entry point. owns: TrainingConfig schema field AND the config→regime wiring.`

Expected: **no** `UNOWNED-SEAM` finding (the boundary is owned). GAP/ORPHAN findings on either probe should be absent or clearly goal-level — if the seam check starts bleeding into GAP/ORPHAN verdicts, revise the check text.

- [ ] **Step 4: Record results**

Note both probe outcomes (finding emitted / not emitted, one line each) for inclusion in Task 6's commit message. If either probe failed after one revision cycle, stop and surface to the human partner rather than iterating silently.

---

### Task 6: Version bump and release

**Files:**
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, `.cursor-plugin/plugin.json` (the four fork-versioned manifests only — `package.json`/`.kimi-plugin`/`gemini-extension.json` stay at upstream `6.2.0` per fork convention)

- [ ] **Step 1: Bump the manifests**

```bash
sed -i '' 's/6\.2\.0-alepar2\.7/6.2.0-alepar2.8/g' .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json
bash scripts/bump-version.sh --check
```

Expected: the four files report `6.2.0-alepar2.8`; the drift warning against the three upstream-pinned files is the fork's known, expected state.

- [ ] **Step 2: Run the existing replay harness (regression only — no engine was touched)**

Run: `node tests/super-code/replay-harness.mjs | tail -1`
Expected: `350 passed, 0 failed`.

- [ ] **Step 3: Commit, tag, push**

```bash
git add -A
git commit -m "chore: v6.2.0-alepar2.8 — bump manifests (integration-seam beads)"  # include Task 5 probe results in the body
git tag -a v6.2.0-alepar2.8 -m "super-design: integration-seam contract/integration beads + root sweep"
git push origin main && git push origin v6.2.0-alepar2.8
```
