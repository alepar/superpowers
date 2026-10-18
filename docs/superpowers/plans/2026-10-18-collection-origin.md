# Collection origin implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Preserve forensic run metadata as ordinary captured review input while resolving its collection history to an authenticated canonical origin.

**Architecture:** A captured `run.md.collection-origin.json` binds the entire copied blob to a canonical ancestor blob and its complete ordered collection history. The selector parses copies normally, validates canonical historical and endpoint archives, and grants no archive authority to verified mirrors. Undeclared copies retain existing strict validation.

**Tech Stack:** Node.js, Git captured objects, existing zero-dependency collector and selector tests.

**Spec:** none — accepted incident records are in the coordinator checkout at `docs/superpowers/feedback/2026-10-18-forensic-run-discovery/`.

## Global constraints

- Base is `7b0b1dcfdacb0596238f04add8f7c624812aa907`; work only on `fix/forensic-run-discovery`.
- Preserve main, consumer runs, captured originals, failed generations, and installed caches. Main owns integration and release.
- No changes to collector, coordinator, acceptance, runtime, lineage, or debt contracts. Research ownership seam was explicitly confirmed compatible.
- No basename/path heuristic, unverified skip flag, fabricated successful bundle, required-input loss, or whole-range acceptance claim.
- Original 64 false copied archive gaps and the separate two scratch identity gaps remain distinguishable.

## Task 1: Authenticate collection history mirrors

**Files:** modify `skills/super-code/scripts/dispatch-text.mjs`; optionally add a focused helper in the same directory; create `tests/super-auto/collection-origin-selection.mjs`; create developer contract documentation under `docs/`.

**Interface:** captured sidecar `{version:1,kind:"collection-history-mirror",copySha256,origin:{commit,run,sha256}}`. All hashes cover full blob bytes. Full canonical source collection lines equal all copied collection lines; endpoint canonical history retains them as an exact prefix. Emit explicit origin provenance in selector JSON and generated provenance text.

- [ ] Write real Git/collector tests for supported proposal mirrors, copied byte preservation, origin resolution, and refusals.
- [ ] Run `node tests/super-auto/collection-origin-selection.mjs` against the original selector and retain failing output. Expected failure: missing mirror support creates nonexistent nested archive gaps.
- [ ] Authenticate captured declarations, paths, file modes, full hashes, ancestry, exact complete history, unique canonical authority and nonmirror origins. Reject sibling archive ownership while preserving symlink bytes without following them. Parse copied history even when authenticated.
- [ ] Apply a head declaration to a preexisting identical base copy only after independently checking every invariant at that base. Reject changed declarations and differing copied bytes. Validate historical origin saved claims against each endpoint.
- [ ] Keep real nested runs and canonical archives subject to all existing successful/failed-bounded archive, saved hash, required input and current pending-intent checks.
- [ ] Run the new test plus `node tests/super-auto/failed-assembly-archive.mjs`, `node tests/super-auto/current-review-selection.mjs`, `bash tests/super-auto/generated-review-inputs-r1.sh`, `node tests/super-auto/selection-recovery-correction.mjs`, and `bash tests/super-code/test-dispatch-text.sh`.
- [ ] Replay captured consumer source in an independent `git clone --no-hardlinks`; retain original 66-gap result. Add sidecars only in a fresh scratch commit and verify exact copied/archive bytes, 64 resolved false gaps, two retained scratch identity gaps, and no acceptance claim.
- [ ] Obtain independent task review for specification and code quality; correct findings and verify covering regressions. Commit the isolated source and tests.
- [ ] Obtain broad independent branch review and provide main exact base/head/tree, full patch, raw source-bound verification receipts, and recovery limits. Keep evidence and worktree intact.
