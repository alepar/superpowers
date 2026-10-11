# AGY run feedback implementation plan

> **For agentic workers:** Use subagent-driven-development task reviews and a whole-branch review. Work only in this isolated checkout.

**Goal:** Correct the five concrete defects triaged from the 2026-10-09-agy-harness-adapter run.

**Architecture:** Preserve existing command interfaces and frozen plan identities. Correct literal text insertion and coverage extraction at their source; make dispatch requirements current and reconcile merge closure mechanically.

**Tech Stack:** Dependency-free JavaScript, Bash, jq; Workflow replay harness and fresh-session skill pressure tests.

**Spec:** The user's supplied upstream-feedback draft and this session's accepted triage; no new product subsystem.

## Global constraints

- Preserve permission refusals and human gates. Audit caching and permission routing are out of scope.
- No release, main merge, external issue or PR is authorized by this repair request.
- Keep separate fixes reviewable. Do not modify unrelated voice or behavior-shaping content.
- Each task requires an observed failing regression, minimal implementation, passing covering checks, and independent spec/quality review.

### Task 1: Literal roast input insertion

Files: `skills/super-roast/scripts/assemble-args.mjs`, `tests/super-roast/test-assemble-args.sh`.

- [x] Add a regression with replacement metacharacters in prior report and caller-derived prompt text. Parse and execute the generated script with existing mocks; verify literal preservation.
- [x] Run the regression against unchanged implementation; retain the failure output.
- [x] Replace dynamic replacement strings with callbacks, without changing static substitutions or CLI interfaces.
- [x] Run `bash tests/super-roast/test-assemble-args.sh`; inspect the diff and obtain independent review.

### Task 2: Coverage ownership and declarations

Files: `skills/super-design/scripts/coverage-inputs`, `tests/super-design/test-scripts.sh`, task-specific fixtures.

- [x] Add fixtures whose headers name siblings before explicit `Bead:` owners, including prefix-related IDs and ambiguity; add inline/formatted `owns:` and `consumes:` declarations.
- [x] Run `bash tests/super-design/test-scripts.sh` and observe the new assertions fail.
- [x] Prefer an exact explicit owner; preserve compatible fallback for unmarked specs while reporting ambiguity. Extract documented declaration forms without dropping boundary-contract pointers.
- [x] Re-run covering checks, including malformed inputs and existing no-jq behavior; obtain independent review.

### Task 3: Current dispatch requirements and confirmed bead closure

Files: `skills/super-code/coordinator.js`, `skills/super-code/coordinator-workflow.md`, `skills/super-code/implementer-prompt.md`, `skills/super-code/SKILL.md`, `skills/super-code/scripts/ledger-digest`, `skills/super-code/scripts/run-profile.mjs`, `tests/super-code/replay-harness.mjs`, profile fixtures/tests; committed behavior evaluation artifacts.

- [x] Reproduce stale brief consumption in fresh sessions before changing guidance, covering initial dispatch and blocker-triage/retry.
- [x] Add replay regressions for a successful merge report with open task/review beads, null closure observation, and previously completed but ready IDs on resume; observe failures.
- [x] Preserve ordinals and in-flight sections; supply current bead descriptions to dispatch consumers with clear source precedence. Do not blindly overwrite an in-flight task.
- [x] Verify and reconcile closure using the existing close-check/close-only paths. Bound retries, preserve auth failures, and never re-implement or re-merge already landed work.
- [x] Preserve merge tips and pending closure through the real ledger digest; classify closure observations in profiling without treating an observation as a merge.
- [x] Re-run `node tests/super-code/replay-harness.mjs`, documented dryRun scenarios, and after-change fresh-session pressure tests. Record before/after evidence; obtain independent review.

## Integration validation

- [x] Run all three covering suites against the composed changes.
- [x] Run contract lint and script invocation checks affected by changed skill instructions.
- [x] Independent whole-branch review; fix confirmed findings and review the fix diff.
- [x] Present final diff summary, evidence and remaining limits to the human; retain the isolated branch for review.


## Verified result

All five concrete issues from the AGY report are addressed on `fix/feedback-agy`:

- Dynamic roast input preserves JavaScript replacement metacharacters literally.
- Coverage inputs honor exact explicit spec owners and retain inline owns/consumes declarations.
- Dispatch consumers read current task descriptions and explicit amendments before frozen context.
- Confirmed integration is distinct from confirmed tracker closure. Recovery checks task/review/resolved-blocker state, persists merge evidence through the real digest, and avoids repeated implementation or integration.
- Closure recovery retains permission refusals, deferred minors and declined findings, including historical parked completions. Unknown status lookups forbid writes; recovery is bounded. Required closure still gates stacked dependent merges.

The roast and coverage regressions failed against unchanged implementations before passing. Coordinator regressions similarly reproduced incomplete/null closure, lost digest state, ready-empty/root-closed recovery, refusal durability and lost parked findings. Independent task reviews and whole-branch review are clean after scoped fixes. These checks establish the repaired behavior; they do not establish why the original run's bead close failed.

| Verification command | Result |
|---|---|
| `node tests/super-code/replay-harness.mjs` | 1,577 passed, 0 failed; run outside the sandbox for Git/process fixtures |
| `bash tests/super-code/test-run-profile.sh` | passed |
| `bash tests/super-design/test-scripts.sh` | passed |
| `bash tests/super-roast/test-assemble-args.sh` | passed |
| `bash tests/super-auto/test-scripts.sh` | passed |
| `bash tests/super-auto/test-contract-lint.sh` | passed |
| `bash tests/skill-scripts/test-bash-invocation.sh` | passed |
| `bash tests/codex/test-marketplace-manifest.sh` | passed |

Workflow dryRuns exercised by the replay harness match the updated documented counts: canonical 47, fix-pass-blocked 19, parked 22. `git diff --check` is clean.

Twenty fresh-context requirements-selection samples are preserved in [the evaluation record](../evals/2026-10-10-agy-task3/README.md). Initial dispatch improved from 1/5 to 5/5; triage remained 5/5. These are controlled source-read/decision checks, not live end-to-end implementation or retry runs.

Ruling: confirmed landed code remains in Finish sweep/final review when tracker closure is unconfirmed. Cost if wrong: validation of an unverified landing; gate on confirmed merge evidence rather than ledger history alone.

The edge-audit and BLOCKED-AUTH routing design questions remain separate. Main, release manifests, tags and published releases were not changed by this repair.
