# Ordinary-Subagent Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permit super-auto and super-code to complete a beads run with ordinary subagents when Workflow is absent, with durable artifacts and unchanged review/integration gates.

**Architecture:** Keep Workflow preferred. The calling session runs a documented serial fallback procedure using the existing task prompts, helper scripts, beads graph, plan workspace, ledger, and Finish contract. Super-auto records the selected mechanism and continues its existing design, roast, code, report, and human finish sequence.

**Tech Stack:** Markdown skill contracts, bash helper scripts, Node test harness, git, beads (`bd`); no third-party dependency.

**Spec:** [2026-10-03-ordinary-subagent-fallback-design.md](../specs/2026-10-03-ordinary-subagent-fallback-design.md)

## Global Constraints

- Keep Workflow supported and preferred when loaded.
- Preserve fresh reviewer identities, per-task worktrees, bounded fix/seam passes, serial merges and build checks, ledger/`Merge:`/detector/`Metrics:` artifacts, one full-suite owner, final-review intake, and human-owned finish.
- Keep the existing `subagent-driven-development` helper scripts unchanged and add no third-party dependency.
- Do not infer evidence from the unrelated separate-fork substitution.

---

### Task 1: Select the supported mechanism

**Files:** `skills/super-auto/SKILL.md`, `skills/super-auto/run-state.md`, `skills/super-auto/resume.md`, `skills/super-code/SKILL.md`, `skills/super-code/coordinator-workflow.md`, `tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt`.

**Interfaces:** `codeMechanism: Workflow | ordinary-subagents` in `run.md`; the super-code ledger's `Launch:` line records the actual execution mechanism.

- [x] Record the baseline no-Workflow behavior from `d9b12c4` in a fresh session.
- [x] Route a missing Workflow tool to ordinary subagents when spawn/wait/result capabilities exist.
- [x] Make `codeMechanism` part of the run-state field table and creation shape.
- [x] Run `bash tests/super-auto/test-contract-lint.sh` and update its deliberate field baseline.

### Task 2: Specify the execution and recovery gates

**Files:** `skills/super-code/coordinator-subagents.md`, `docs/superpowers/specs/2026-10-03-ordinary-subagent-fallback-design.md`.

**Interfaces:** Existing planner, implementer, task-reviewer, triage, SDD helper, and Workflow ledger formats. `Fallback:` lines are additive checkpoints ignored by Workflow.

- [x] Define absolute plan/workspace paths, planner outputs, ready/dependency handling, and per-task worktrees.
- [x] Define independent review, one task fix, shared seam/build-fix allowance, merge evidence, blocker triage, and permission refusal routes.
- [x] Define raw-ledger resume including `MERGE_HEAD`, pass counters, close-only reconciliation, detector, sweep, four Metrics lines, final review, and finish ownership.
- [x] Get independent contract review and revise confirmed findings.

### Task 3: Verify behavior and integrate

**Files:** `docs/superpowers/plans/eval/2026-10-03-ordinary-subagent-fallback-eval.md`, design spec Post-Implementation Notes.

**Interfaces:** Existing test commands in `AGENTS.md` and a disposable beads/git fixture under `/tmp`.

- [x] Run multiple fresh-session before/after and interruption/permission probes, recording observed choices and limitations.
- [x] Run the disposable end-to-end ordinary-subagent fixture and inspect its artifacts.
- [x] Run required script tests, replay harness, contract lint, and `git diff --check`; record any sandbox-only failure.
- [x] Review the complete diff, commit the feature, verify the main checkout's tracked tree is clean, then merge to main.
