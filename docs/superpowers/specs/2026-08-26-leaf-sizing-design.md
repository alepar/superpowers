# Leaf sizing: minimal cohesive chunks first, dependencies second, bottlenecks smallest

**Date:** 2026-08-26
**Status:** approved (design), pending implementation
**Scope:** `skills/super-design/SKILL.md` (§Decomposition, §Promotion Review),
`skills/super-design/promotion-reviewer-prompt.md`. No new review passes, no engine changes.

## Problem

Nothing in the pipeline says what a right-*sized* leaf bead is. The edge machinery
(NARRATIVE-EDGE audit, seam contracts) refines the graph's edges after the fact, but a fat bead
sitting at a bottleneck delays every dependent by its own excess — the measured live graphs'
thin tails and gated clusters are partly a sizing problem, not only an edge problem. The
constraint: no new review passes — sizing enforcement must be write-time guidance plus, at most,
a criterion riding a pass that already reads every child.

## Decisions (gated with the user)

1. **Two-step decomposition, formalized:** split into minimal logically-cohesive chunks first;
   add blocking deps as an explicit *first approximation* second — sparse by standing policy,
   refined by the passes that now exist (promotion review, then coverage's NARRATIVE-EDGE audit
   and UNOWNED-SEAM check).
2. **Sizing bar** with three composable rules: cohesion (one merge-worthy deliverable), a floor
   (execution ceremony ≈ 5–6 dispatches per bead; "minimal" ≠ "tiny"), and the fan-out-aware
   bottleneck rule (size inversely to dependent count; gating beads land only the unblocking
   artifact).
3. **Enforcement:** decomposer guidance + ONE added criterion in the existing promotion review —
   a third per-task verdict `SPLIT`, flagged only for oversized leaves gating ≥2 dependents.
   Explicitly not a per-leaf size police.

## Design

### 1. §Decomposition: two explicit steps

Restructure the section's opening into:

- **Step A — split.** Decompose the spec into minimal logically-cohesive chunks per the sizing
  bar (below), ignoring ordering while splitting.
- **Step B — connect, as a first approximation.** Add blocking deps per the existing edge rules,
  sparse by the standing "when in doubt, leave it out" policy. Named refinement chain: the
  promotion review next, then coverage's edge audit (`NARRATIVE-EDGE`) and seam check
  (`UNOWNED-SEAM`). The decomposer does not agonize over edges — a dedicated audit owns edge
  quality; its job is not to miss *work*.

The existing content (four fields, boundary declarations, edge rules, graph-shape check) slots
under these two steps unchanged.

### 2. The sizing bar (new §Decomposition text)

- **Cohesion:** a leaf is one merge-worthy deliverable a reviewer accepts or rejects as a unit.
  A description that needs "and then" is two beads.
- **Floor:** execution spends ~5–6 dispatches of ceremony per bead (brief → implement → review →
  merge → ledger), so never split below one coherent reviewable change — a bead whose
  implementation is smaller than its own ceremony merges into a sibling. Minimal ≠ tiny.
- **Bottleneck rule (fan-out-aware):** size a bead inversely to its dependent count. A bead that
  gates others lands **only the unblocking artifact** — polish, additional tests beyond the
  artifact's own acceptance, and remaining call-site migration move into dependents or a
  non-gating sibling that depends on it. Seam-contract beads are the exemplar (compilable stubs,
  inert-by-default). Stated payoff, once: width is parallelism — every line moved off a
  bottleneck bead moves work off the critical path.

### 3. Promotion review: the `SPLIT` verdict

- `promotion-reviewer-prompt.md`: per-task verdicts become `LEAF` / `PROMOTE` / `SPLIT`. `SPLIT`
  fires only when a leaf is oversized **and** gates ≥2 dependents (per the child list's deps);
  the verdict names the minimal unblocking artifact and the deferrable remainder. The reviewer
  does not size-police leaves with fewer than 2 dependents.
- SKILL.md §Promotion Review: a `SPLIT` verdict is handled like a decomposition `ISSUES` — apply
  it (create the minimal gating bead; move the remainder into a dependent or non-gating sibling)
  or overrule it with the reason recorded on the task, mirroring the existing
  `sp:demoted-by-session` recording discipline (a comment on the bead; no new flag).

## Verification

- Haiku probes of the amended promotion-reviewer prompt: a fixture where one leaf bundles an
  interface definition plus its polish/docs/migration and gates three siblings — expect `SPLIT`
  naming the interface as the unblocking artifact; a right-sized control (interface-only bead
  gating the same three) — expect `LEAF`, no `SPLIT`.
- No frontmatter description changes → no trigger micro-tests owed.
- No engine changes → replay harness run once as regression.

## Out of scope

- Any new review pass or per-leaf size policing.
- Execution-side (super-code) sizing checks — sizing is a design-time property.
- Re-sizing existing epics.

## Files to touch

| File | Change |
|---|---|
| `skills/super-design/SKILL.md` | §Decomposition: Step A/Step B framing + sizing bar. §Promotion Review: one sentence handling `SPLIT`. |
| `skills/super-design/promotion-reviewer-prompt.md` | `SPLIT` verdict: trigger condition (oversized + gates ≥2), required content (artifact vs remainder), output contract. |
| `docs/superpowers/specs/INDEX.md` | row for this spec. |
