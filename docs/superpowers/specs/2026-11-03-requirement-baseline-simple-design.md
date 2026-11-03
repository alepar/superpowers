# Requirement baseline through existing reviews

Intake: `super-plan-spb`. Supersedes the mechanism of `docs/superpowers/runs/2026-11-01-requirement-preservation-checks/` (branch `super-auto/requirement-preservation@4afaeeb3`, kept as historical evidence).

## Goal

A super-* run keeps the human's original requirements as the standard through redesign, coverage review and final review, using only existing inputs, records and reviewers.

## Requirement baseline

Source: the human user in the Superpowers coordinator session, relayed to this tab, 2026-11-01 and 2026-11-03.

### Human request

> ok lets do the three above
>
> > I recommend simplifying around the original three checks
> ok

### Requirements

- B1 · "Make each redesign account for affected original requirements." preserved, changed or unmet with reasons, in the existing amendment record; initial design revisions too · source: approved proposal item 1
- B2 · "Give the existing coverage reviewer a semantic preservation check." · source: approved proposal item 2
- B3 · "Use the existing final review to check delivery against that same original baseline." · source: approved proposal item 3

### Human scope changes

- S1 · 2026-11-03 · "I recommend simplifying around the original three checks" / "ok" · source: main coordinator session · affects: B1, B2, B3 — smallest implementation in existing inputs, prompts, callers and records; no reconcile helper, acceptance state machine, B/S registry, permanent phase or new finding taxonomy

## Design

**Why.** In the captured installer-permissions run a redesign made the human's Codex allow conditional on qualification that no production path could produce, while every gate compared the design to itself. Given the human's words, the old reviewers caught it; the missing input was the established cause. So the change is transport plus one accounting field, not new machinery.

1. **Baseline source.** `super-auto` hands `super-design` the literal request; `brainstorming` writes a `## Requirement baseline` section into the root spec (`super-design` §Root Brainstorm defines it). Later human scope changes are appended as attributed `S` rows by the orchestrator only. No section means behavior as before.
2. **Designer accounting.** `amend-prompt.md` gives the designer the baseline and adds a `requirements:` field: `- <id>: preserved|changed|unmet — <reason>`, or `none affected`. Spec-changing commits outside Amend Mode (design-roast fixes, coverage disposals) carry the same block in their commit message. `amend-check` verifies only that the baseline section is unchanged and the field's shape; it does not judge truth.
3. **Coverage.** `coverage-inputs` prints the baseline verbatim and every `- [ ]` acceptance line, removing the first-sentence-only view of tasks. The existing reviewer gets a baseline slot, the revision diff and accounting, and check 5; shortfalls are ordinary `GAP` findings on the row id. A baseline-row `GAP` is fixed only by a safe task; otherwise parked (unattended) or asked (interactive).
4. **Final review.** One `requirementBaselineRule()` string in the single, cluster and seam builders: judge production delivery against the baseline; an undelivered row is an ordinary Must fix, never Deferred OK alone. It reaches the hand-back through existing findings.

Promised non-default states stay in scope; a separate manual step with no supported producer, or a test-only path, is not a usable production path. A safety repair that keeps the behavior working is preservation.

## Non-goals

No reconcile helper, root-acceptance requirement per row, revision-record files, coverage revision round, REQUIREMENT finding type, or automatic clearing. `super-plan-3az` is separate.

## Unchanged behavior

- Specs without a baseline section behave as today in amend-check, coverage-inputs, coverage review and final review.
- The `## Goal` guard, coverage's two-round cap, final-review file format and verdict grammar are unchanged.

## Post-Implementation Notes

*As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
