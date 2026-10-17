## Task 17: Integration sweep: workflow reliability

**filesTouched:**
- `tests/super-code/replay-harness.mjs`
- `tests/super-auto/test-scripts.sh`
- `tests/super-auto/test-contract-lint.sh`
- `tests/super-code/test-dispatch-text.sh`
- `tests/super-code/test-report-verdict.sh`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/verification.md`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-code/scripts/stop-run-processes`
- `skills/super-code/scripts/remove-task-worktree`
- `skills/super-code/scripts/ledger-digest`
- `skills/super-code/scripts/close-in-tree-epics`
- `skills/super-code/scripts/run-profile.mjs`
- `skills/super-auto/SKILL.md`
- `skills/super-auto/run-state.md`
- `skills/super-auto/resume.md`
- `skills/super-auto/report-prompt.md`
- `skills/super-auto/scripts/report-status`
- `skills/super-auto/scripts/scope-dispositions`
- `skills/super-roast/scripts/assemble-args.mjs`
- `skills/upstream-feedback/SKILL.md`
- `AGENTS.md`

**Bead:** super-plan-ufz.14. **Surface:** 286107 tokens at integration base `560a05eb83cdc44013ea528e99854151c2f17d12`.

**Scope:** Verify cross-boundary integrated behavior and record evidence. Do not implement roast-redesign policy, mint stronger live claims, or relaunch parent-owned behavior evaluations.

**Interfaces:** All implementation leaves are prerequisites. Use their landed producer/consumer contracts and the coordinator-provided evaluation artifacts. Named tests plus verification.md are the write surface; inspect the source producers listed below. Repair fixture/doc gaps within this surface; a source fix outside it requires the coordinator to route the small correction to its owner or update the declared surface before editing. Larger behavior failures become blockers with concrete reproduction/evidence.

### Acceptance (verbatim)

- [ ] Main flow preserves work/evidence through denial, interruption and retry with truthful remaining obligations.
- [ ] Both execution paths and standalone/super-auto acceptance ownership are checked with named evidence.
- [ ] Fresh-agent changed-instruction before/after evidence is recorded by coordinator; gaps are explicit.
- [ ] Cross-boundary regression checks and required repository suites pass against the integrated tree; no unsupported live claims.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Read all landed leaf contract summaries and coordinator-owned behavior-evaluation artifacts before selecting gaps. Build a concise acceptance-to-evidence table in verification.md covering root spec sections 1-5, both execution paths, caller/standalone ownership and every fresh-agent scenario. Record source tree, exact command/configuration, outcome, artifact and live/simulated/fallback kind; absent before/after or live evidence is an explicit gap rather than a fabricated pass.
2. Add failing integration fixtures for the actual producer/consumer seams: denied process inspection -> retained resources -> reported unknown cleanup; landed-but-unclosed recovery -> fresh admission -> no duplicate implementation; verification-only reviewed evidence -> completion without artificial landing; deferred measurement plus unresolved finding -> ready retry -> collected projection -> open caller root/status; and supported elsewhere-fixed disposition -> key-only punch-list removal -> reconciled repaired metrics. Include ordinary generated dispatch/record inputs and Workflow replay traces using the same concrete values.
3. Run the affected focused suites before correcting any seam fixture or doc gap. Exercise the actual landed scripts via temporary files/fake tracker commands; avoid duplicate model-owned semantic tests or static string checks as the sole evidence of a cross-boundary effect. Check baseline record compatibility, invocation null/path semantics and repeat resume/collection idempotence along the integrated flow.
4. Resolve small fixture/contract-documentation gaps within this task's declared files and rerun affected checks. For a source implementation defect provide the smallest failing case and exact producer/consumer discrepancy to the coordinator; update write ownership before any out-of-surface source edit. File larger blockers through the task's normal reporting route with command, source SHA and artifact. No implementation of external roast-redesign triggers/amend policy is authorized.
5. Run all required repository suites listed below against the integrated source tree, with quiet host timing-sensitive sweeps coordinated by the parent. Since coordinator.js changes, replay its documented canonical dryRun scenarios and compare actual agent counts to the current coordinator-workflow.md expectations. Record exact completed results and source identity; timeout, denied operation or unrun fresh-agent evaluation stays unavailable. Run broadened verification once the integrated changes justify it; do not relabel the historical 1770 baseline as current evidence.
6. Finalize verification.md with acceptance coverage, focused and required-suite results, coordinator-provided changed-instruction before/after evaluation links, remaining obligations and limitations. If an actual gap remains, report it precisely rather than claiming root acceptance. Commit integration fixtures/evidence only; super-auto still owns final acceptance and finish.



Run:

```bash
node tests/super-code/replay-harness.mjs
bash tests/super-code/test-run-profile.sh
bash tests/super-code/test-dispatch-text.sh
bash tests/super-design/test-scripts.sh
bash tests/super-roast/test-assemble-args.sh
bash tests/super-auto/test-scripts.sh
bash tests/super-auto/test-contract-lint.sh
bash tests/skill-scripts/test-bash-invocation.sh
bash tests/codex/test-marketplace-manifest.sh
bash tests/super-code/test-run-marker.sh
bash tests/super-code/test-run-profile-in-flight.sh
bash tests/super-code/test-report-verdict.sh
bash tests/super-code/test-run-digest.sh
bash tests/super-code/test-task-surface.sh
bash tests/super-code/test-split-oversized.sh
bash tests/super-code/test-context-preflight.sh
bash tests/super-code/test-assembled-size.sh
bash tests/hooks/test-session-start.sh
bash tests/hooks/test-run-block.sh
bash tests/hooks/test-reinject-smoke.sh
bash tests/codex/test-package-codex-plugin.sh
bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh
bash tests/skill-scripts/test-prompt-text-fresh-rounds.sh
```

Expected final result: task-relevant deterministic checks pass; unavailable checks and coordinator-owned live evaluations remain identified separately. **Independently testable deliverable:** Named integrated mechanics/dispatch fixtures and source-bound verification evidence establish the approved invariants, with parent-owned evaluation gaps visible.
