# Ordinary-subagent fallback evaluation — 2026-10-03

## Scope and provenance

Source branch: `feat/workflow-subagent-fallback`, based on `d9b12c4`. The unrelated one-off substitution in another fork supplied no transcript or result and is not evidence here. These probes were fresh-context Codex subagent sessions without Workflow, reading either `git show d9b12c4:<path>` (before) or the current working-tree skill files (after). They were read-only simulations except for the separate disposable fixture noted below. No evaluator ran the full super-auto raw-idea sequence.

## Before and after pressure probes

| Scenario | Baseline d9b12c4 | Revised instructions, observed response |
|---|---|---|
| Existing beads epic, ordinary spawn/wait tools, no Workflow, user urges autonomous completion | Fresh baseline agent stopped at pre-flight, citing `super-auto` and `super-code` Workflow hard stops. It did not start a task or record a ledger. | Fresh revised agent selected direct `super-code` and `coordinator-subagents.md`, identified pre-flight, planner, checkpoint, implementer, reviewer, merge, sweep and final review. It did not treat Workflow absence as a stop. |
| User urges skipping reviews | Baseline never reached execution. | Fresh revised agent kept the task, conditional seam, check-fix, and whole-epic review gates. It correctly distinguished an existing epic from super-auto's optional roast flags. This was a read-only decision probe, not a completed run. |
| Interrupted merge, unknown check result, ready sibling | No supported fallback path. | First revised probe found missing durable seam-fix counters and an ambiguous `MERGE_HEAD` recovery. After revision, a second fresh probe required abort/audit before the next merge, treated an unknown check as unmeasured, preserved spent fix allowances, and held a dependency missing a verified edge. Its remaining findings (fixer stage, seam/check verdict, close-only order, missing-edge artifact) were folded into the procedure. |

The independent contract reviewer initially found six blockers: wrong plan path, missing consumed-producer seam trigger, lost fix allowance on resume, unhandled planner `unplanned`/`missingEdges`, pre-flight refusal routed as mid-run refusal, and unbounded INVALID review retries. After revisions, it found two more: relative `sdd-workspace` argument and a close-only/Merge exit-check contradiction. Its final re-review reported all eight resolved and no new contradiction in those edits. This is a contract review verdict, not proof that every failure branch has run live.

## Disposable live fixture

Fixture: `/tmp/sp-fallback-eval.pHQqQK`, a new git/beads project with one root epic and one leaf task to add `multiply(a,b)` to a Node module. The current skill source was passed by absolute path. The caller had ordinary subagent tools and no Workflow. The fixture started with `npm test` and `npm run build` passing. The [complete live transcript](2026-10-03-ordinary-subagent-fallback-live-transcript.md) records commands, artifacts, deviations, and unexercised branches.

Observed result: fresh planner, implementer, task reviewer, and final reviewer ran; the task branch was reviewed at `fe8d513`, merged as the second parent of `53a5351`, and the task/root beads closed. The build-only check and one full-suite sweep passed. The ledger contains `Launch`, `Fallback`, `Merge`, `Task`, `Detector`, `Sweep`, and four `Metrics` lines. Final reviewer returned `ready`; toy main stayed clean and unmerged. The run began while the checkpoint schema was being revised, so its `Fallback:` lines lack the later `seamOutcome`, `check`, and `invalidReviews` fields. It exercises the clean path, not those recovery counters.

## Test results

- Baseline sandbox replay failed before changes at `tests/super-code/replay-harness.mjs:2893` because this sandbox forbids `ps`; `spawnSync('ps').stdout` was undefined. This is an environment failure in the existing process-cleanup test, not a regression finding.
- Replay rerun with process inspection permitted: `1501 passed, 0 failed` (exit 0); no Workflow engine files changed.
- `bash tests/super-design/test-scripts.sh`: exit 0.
- `bash tests/super-roast/test-assemble-args.sh`: exit 0.
- `bash tests/super-auto/test-scripts.sh`: exit 0.
- `bash tests/super-auto/test-contract-lint.sh`: exit 0 after adding `codeMechanism` to the field baseline.
- `bash tests/codex/test-marketplace-manifest.sh`: exit 0.
- `bash tests/skill-scripts/test-bash-invocation.sh`: exit 0.

## Limits of this evidence

The pressure probes tested instruction choices, not all live branches. The one-task live fixture cannot exercise sibling seam conflicts, an interrupted real subagent, permission refusal, multi-bead early unblock, or super-auto's full raw-idea orchestration. The fallback intentionally schedules one task at a time, so Workflow's sliding-window throughput and early unblock are not claimed. The separate-fork run remains unmeasured.
