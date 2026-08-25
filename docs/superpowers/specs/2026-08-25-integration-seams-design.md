# Integration seams: contract beads, per-seam integration beads, and the root sweep

**Date:** 2026-08-25
**Status:** approved (design), pending implementation
**Scope:** `skills/super-design/` (decomposition guidance, coverage loop, arbitration), one
cross-note in `skills/super-code/`. Zero execution-engine changes.

## Problem

Live epics repeatedly ship correctness bugs at **integration seams** — the boundaries where two
beads exchange data or interfaces. Canonical incident: a configuration parameter was implemented
in the config-schema bead and honored in the training-regime bead, but the wiring that passes the
value from one to the other belonged to neither, so the parameter shipped inert. Both beads
passed review, because each bead's *local* spec was satisfied.

Diagnosed failure locus (from incidents observed): the wiring work is **present but
unowned/ambiguous** — some bead's description arguably implies it, but each implementer can
plausibly treat the boundary as the other bead's job. It is an ownership-explicitness failure at
decomposition time, not an execution-quality failure. Consistent supporting signal: on the
measured 197-bead epic, all 12 BLOCKED outcomes were plan/spec ordering defects.

Today nothing systematically owns a seam: super-design's decomposition emits children with
title/description/files-touched/deps only; the coverage loop checks the tree against the *goal*
(GAP/ORPHAN), not against cross-child dataflows; SDD briefs carry "interfaces from earlier
tasks" but no boundary contract exists to carry.

## Decisions (each gated with the user)

1. **Failure model:** seams are present-but-unowned, so the fix targets explicit ownership before
   dispatch, plus a backstop that checks the assembled whole.
2. **Pipeline home:** super-design, at design time. Execution (super-code) stays dumb — it
   dispatches whatever tree it is handed and gains no seam logic.
3. **Contract form:** a seam contract delivers **compilable boundary code**, not prose — the
   inert-config class must become mechanically impossible for covered seams.
4. **Detection:** a new finding kind in the existing coverage loop — no new pass, no new gate.
5. **Join shape:** per-seam integration beads (narrow, parallelism-preserving) **plus** one root
   integration-sweep bead (the unknown-unknowns net; also the user's original "one bead that
   depends on all the others").

## Design

### 1. Decomposition declares boundaries

`skills/super-design/SKILL.md` §Decomposition: each child's short description must name the
boundaries it **owns** and the boundaries it **consumes** (e.g. "owns: `TrainingConfig` schema
field; consumes: regime entry-point signature"). Folded into the existing description guidance —
not a fifth field. This attacks ambiguity at its source and gives coverage reviewers something
checkable instead of inferred dataflow.

### 2. Detection: `UNOWNED-SEAM` finding kind in the coverage loop

`skills/super-design/coverage-reviewer-prompt.md` gains a third finding kind alongside
GAP/ORPHAN:

> children A and B exchange a named piece of data or interface, and no child's description owns
> the boundary between them.

A finding carries: the participant child ids, the exchanged data/interface (named concretely),
and evidence quoted from the descriptions. Emitted from both per-subepic and root passes. The
union/dedupe/arbitration/ledger machinery is unchanged; findings reach the user through the same
arbitration gate as GAP/ORPHAN.

### 3. Accepted seam → two beads, wired at arbitration

Each accepted `UNOWNED-SEAM` creates, with the standard `bd create` flag triple
(`--parent <root> --no-inherit-labels -l sp:<root-epic-id>`):

- **Contract bead** — `Seam contract: <boundary>`. Delivers compilable boundary code: the
  interfaces/types/signatures, schema fields, and **the wiring itself plumbed as stubs or
  defaults** (value passed end-to-end even if inert-by-default). Acceptance: compiles, suite
  green, wiring present. Every participant gets a dependency edge on it — a genuine blocking
  edge by §Decomposition's own rule (the interface must exist first), not narrative order. Its
  files-touched hint **deliberately spans both sides of the seam**; it merges before its
  dependents by construction, so the overlap is expected.
- **Per-seam integration bead** — `Seam integration: <boundary>`. Depends on that seam's
  participants only. Delivers: verify the wiring end-to-end, write integration test(s) crossing
  the seam, see them pass. Small fixes inline; anything larger goes through the normal blocker
  path at execution.
- Arbitration also **appends one line to each participant's bead description**:
  `boundary contract: <contract-bead-id>`. The pointer then flows into SDD briefs through the
  execution planner with zero execution-side changes.

### 4. Root integration-sweep bead

Created once per root epic, at the end of the coverage loop (tree settled), when the tree has
≥2 implementation leaves; depends on all of them **and on every per-seam integration bead** (its
"tests no per-seam bead covers" scope is only decidable once those exist and their tests are
in). Scope-bounded deliverable: verify the goal's
main flow(s) end to end, add integration tests no per-seam bead covers, sweep for unwired
config/params/interfaces. Fixes small gaps inline; files blockers for big ones. Unlike the
Finish-phase whole-epic review (report-only), this bead *implements* what it finds. It is the
one join that always serialized anyway (terminal position).

Fix-loop beads created after the sweep ran (e.g. super-auto phase 5) do not get edges onto it;
the roast covers that ground.

### 5. Execution interplay: zero engine changes

super-code dispatches this shape today: contract beads become ready first (dependency order),
participants follow via `bd ready`, per-seam integration beads next, the sweep last. One
sentence added to super-code's docs: a `Seam contract:` bead legitimately spanning many files is
an expected case the hot-file cap accommodates, not a smell.

## Verification

- Haiku probe of the amended coverage-reviewer prompt against a fixture decomposition containing
  the exact inert-config shape (schema child + regime child, disjoint files, no owner):
  expect an `UNOWNED-SEAM` finding naming both children and the parameter. Control fixture where
  a child's description explicitly owns the wiring: expect none.
- Confirm GAP/ORPHAN behavior unchanged on the same fixtures (no finding-kind bleed).
- Trigger micro-tests: not needed (no frontmatter description changes).

## Out of scope

- Execution-time seam detection or bead creation in super-code (rejected: scope-of-authority
  change; hand-made epics get no seam machinery this round).
- Retroactive seam analysis of existing epics.
- Prose-only contracts or contract-owned failing tests (rejected in favor of compilable
  boundary code).

## Files to touch

| File | Change |
|---|---|
| `skills/super-design/SKILL.md` | §Decomposition: owned/consumed boundary guidance. §Coverage: `UNOWNED-SEAM` in the finding-kind list; arbitration: accepted-seam → contract bead + per-seam integration bead + participant-description pointers. New root-sweep step at coverage-loop end. |
| `skills/super-design/coverage-reviewer-prompt.md` | `UNOWNED-SEAM` finding kind: definition, required fields, evidence discipline, the inert-config worked example. |
| `skills/super-code/SKILL.md` (or coordinator doc) | One sentence: seam-contract beads spanning files are expected under the hot-file cap. |
