# Design Continuity & Worktree Lifecycle — Design

**Status:** Approved
**Date:** 2026-06-08
**Scope:** Personal/local customization of the Superpowers skill files (not an upstream contribution).
**Tags:** brainstorming, worktrees, spec-lifecycle, INDEX, post-implementation-notes, design-memory

## Overview

Three related improvements to the design workflow, plus a worktree lifecycle change:

1. **Design memory on look-around** — at the start of brainstorming, read a catalog of past designs and the ones adjacent to the new work, so prior decisions resurface instead of being re-litigated or forgotten.
2. **An INDEX.md catalog** of specs, so that look-around has something good to match against.
3. **Post-implementation notes** — fixes and adjustments made while implementing a design get summarized back into the original spec, so future designs can see what had to be corrected.
4. **Worktree-from-the-start lifecycle** — brainstorming begins in an isolated worktree (the spec itself is written there), and the work isn't done until commits are preserved back to the original worktree, after which the worktree is cleaned up.

This builds directly on `2026-06-06-design-modes-and-beads-workflow-design.md`, which reshaped the brainstorming → planning → execution flow and the spec/plan/epic relationship.

## 1. Look-around reads adjacent designs

In brainstorming's "Explore project context" step — **before** design-mode selection, so it applies to both Mode A and Mode B — the agent reads `docs/superpowers/specs/INDEX.md`, matches the new topic against entry titles / summaries / tags, and reads the few specs that look adjacent (including their `Post-Implementation Notes`). Relevant prior decisions are surfaced to the user while framing the new work.

Adjacency is decided via **INDEX.md summaries + keyword/tag match** (cheap, and the index is kept good by change 2). Not a full-text grep of every spec, and not just filename scanning.

## 2. INDEX.md catalog

A new file `docs/superpowers/specs/INDEX.md`, co-located with the specs it catalogs. It is a markdown table, newest-first, one row per spec, with **rich** entries:

| Field | Purpose |
|-------|---------|
| Date | spec date (YYYY-MM-DD) |
| Title | human title |
| Link | relative link to the spec file |
| Summary | one-line description |
| Status | `draft` → `implemented` → `superseded-by: <file>` |
| Tags | a few topic keywords for adjacency matching |

A short header in the file documents the format and the status vocabulary. The index is **seeded** with the existing specs at implementation time (the 6 prior specs plus this one).

It is updated in two places:
- **brainstorming, write-design-doc step:** add a new row with status `draft`.
- **finishing-a-development-branch:** flip the row's status to `implemented` (or `superseded-by`).

## 3. Post-implementation notes

Every design doc gets a `## Post-Implementation Notes` section, seeded by brainstorming with a **standing, self-describing instruction**:

> *As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*

The convention is **authored in the brainstorming skill**, but the operative instruction lives **in the spec document itself**. That placement is deliberate: brainstorming hands off before implementation, so an instruction that only lived in the brainstorming skill would not be in context when fixes happen. The spec is read during planning, execution, and fixing (the plan header and beads epic both carry the `Spec:` path), so a standing instruction embedded in the spec is what actually makes note-taking fire later.

Two complementary touchpoints ("both"):
- **Continuous:** as work proceeds and fixes/adjustments are made, append a dated bullet to the spec's `Post-Implementation Notes` — for *any* change, regardless of whether `systematic-debugging` was used. (`systematic-debugging` itself is intentionally **not** modified: simple changes skip it, and it is frequently invoked with no preceding brainstorming and therefore no spec.)
- **Consolidated:** `finishing-a-development-branch`, at completion, prepends a brief "Changes vs. original design" summary at the top of the section (without deleting the running bullets) and flips the INDEX status.

## 4. Worktree-from-the-start lifecycle

Brainstorming **begins** by ensuring an isolated worktree via `superpowers:using-git-worktrees`, created **before** the spec is written — so the spec and all subsequent work live in the isolated worktree, not the original checkout. The skill is idempotent ("create one or verify existing"), so the later writing-plans / execution invocations simply verify the worktree already exists.

The work is **not done until commits are preserved back to the original worktree**, in any form that keeps them: a merge to main, a feature branch, or a pushed PR. `finishing-a-development-branch` owns this. **Once commits are preserved, the superpowers-created worktree is cleaned up in all of those cases** — including PR. (This overrides the prior behavior where a PR kept the worktree alive for review iteration; if PR feedback requires more work, a fresh workspace is re-created. Worktrees share the repo's object store, so branches/commits already exist in the original repo once created/pushed; the worktree directory is disposable scaffolding.)

## 5. Spec ↔ implementation linkage

For changes 2–3 to work, the implementation must be able to find its originating spec:
- **Non-beads:** the plan header records `Spec: <path>` (added to `writing-plans`).
- **Beads:** the epic links the spec (already part of the beads-workflow design).

`finishing` and any in-flight note-taking locate the spec via the plan/epic. If no spec exists (ad-hoc work with no brainstorming), note-taking is simply skipped.

## Files Touched

- **`skills/brainstorming/SKILL.md`** — (a) ensure an isolated worktree at the very start (before writing the spec); (b) look-around reads INDEX.md + adjacent specs before mode selection; (c) the written spec includes a `## Post-Implementation Notes` section with the standing instruction; (d) the write-design-doc step adds an INDEX.md row (status `draft`).
- **`skills/writing-plans/SKILL.md`** — the plan header records the `Spec:` path.
- **`skills/finishing-a-development-branch/SKILL.md`** — consolidate a "Changes vs. original design" summary into the spec; flip the INDEX.md status to `implemented`/`superseded-by`; clean up the superpowers-created worktree once commits are preserved (for merge, branch, *and* PR).
- **`docs/superpowers/specs/INDEX.md`** — new file, seeded with all existing specs.
- **`skills/systematic-debugging/SKILL.md`** — intentionally **not** modified.

## Key Decisions & Rationale

- **INDEX at `docs/superpowers/specs/INDEX.md`.** Co-located with specs; short relative links. Considered `docs/INDEX.md` (more discoverable but farther from specs) and `docs/superpowers/INDEX.md` (rejected: extra distance, no benefit).
- **Adjacency via INDEX summaries + tags.** Cheap and accurate once the index is maintained. Considered filename-only scanning (too coarse) and full-text grep (too noisy/expensive).
- **Rich INDEX entries (status + tags).** Tags drive adjacency matching; status tracks lifecycle. Considered minimal entries (rejected: weaker matching).
- **Notes convention owned by brainstorming, embedded in the spec.** Fires after handoff because it lives in the spec, not in a skill that's only active at design time. Considered putting it in `systematic-debugging` (rejected: skipped for simple changes, and often runs with no spec).
- **Both continuous and consolidated notes.** Continuous captures detail as it happens; consolidated gives future readers a quick "what changed" summary. Considered either alone (rejected: continuous-only buries the signal; consolidated-only loses detail).
- **Worktree from the very start.** Keeps the original checkout clean from the first spec write onward. Considered the prior "worktree after design approval" timing (rejected: the spec and design docs would land in the original checkout).
- **Always clean up the worktree after preservation, including PR.** Matches the "worktree is disposable scaffolding" model. Considered keeping it alive for PR iteration (rejected by preference: re-create if needed).

## Post-Implementation Notes

*As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*

_(none yet)_
