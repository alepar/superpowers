**Final review: epic super-plan-fqb on branch super-auto/run-profile-context-pass (4fe6228..3525fa8)**

The review package was written to /Users/alepar/AleCode/superpowers/.worktrees/super-auto-run-profile-context-pass/.superpowers/sdd/super-plan-fqb-plan/review-4fe6228..3525fa8.diff. The spec is docs/superpowers/runs/2026-10-15-run-profile-context-pass/2026-10-15-run-profile-context-pass-design.md, together with the epic's `bd show` output.

## STEP 1: My own review against the spec

The diff covers the spec. Every point I checked is implemented in skills/super-code/scripts/context-pass.mjs and skills/super-code/scripts/run-profile.mjs:
- the Claude and Codex readers;
- the window table, the override and inference (inference raises each compaction's window too);
- the cause rules, and the order they are applied in;
- the `HARNESSES` registry;
- the run window `[start, end)` from the anchor T0, with agents scoped to the same windows;
- dedupe by real path;
- context lines on every exit path: full profile, partial profile, exit 3 and the missing-epic die;
- `--context-only` and `--session`;
- the Markdown section, the JSON key and the Baseline line, including the fqb.11 fix for counting the coordinator twice;
- documentation in the usage text, SKILL.md, MAINTENANCE.md and report-template.md;
- the validation table for the 13 real Codex runs and the 13 Claude sessions.

Existing assertions in tests/super-code/test-run-profile.sh are unchanged: the diff removes no lines. I ran `bash tests/super-code/test-run-profile.sh` and everything passed, including 66 `ok` checks from context-pass-unit.mjs. No downstream script parses `Profile:` lines, so the new line keys break no consumer.

Integration findings:

1. **Important: memory use regresses the existing timing profile.** In run-profile.mjs, `contextResult` parses every coordinator and agent transcript and keeps all the parsed rows until the end. Only then does it reduce them to records. The code roast measured this: on the `01a10505` Codex run, peak memory was 3.70GB on this branch against 2.01GB on main. That run fits Node's default heap, but under 1GB and 1.5GB heap caps the process dies with an out-of-memory error. This machine's default heap limit is 4.09GB (Node 26.9.0), so the largest run on disk is already close to the limit. The pass runs inside the full profile, after the timing is computed but before anything is printed. When it runs out of memory, the whole profile is lost: Finish runs this unattended, and the ledger gets none of the `Profile:` lines, including the timing lines main produces today. The roast scope filter graded this a Nit because "output is correct". I regrade it as a data-loss path.
   - Fix (a few lines): turn each agent transcript into its record right after `readJsonl`, since the scope check only needs `firstTs`. Keep coordinator rows only until their own record is read.

2. **Minor: a cached agent in a relaunched Workflow run becomes a phantom record.** `readRun` makes a context target for every agent in the journal. A resumed run lists a cached agent again under its original ID, but its transcript is not in the new directory. The context pass then records it a second time as `transcript missing or unreadable`.
   - Reproduced: I built a scratch fixture from ctx-wf-a and added a second directory whose journal lists one of its agents. The summary went from `agents 8` to `agents 9`, and the output listed both `read-ledger wf_a/agent-aca0000.jsonl` and `impl:cached wf_b/agent-aca0000.jsonl transcript missing or unreadable`. The timing pass already handles this case with its `agentById` dedupe.
   - Fix: dedupe context targets by agent ID across runs, preferring the copy whose transcript exists.

3. **Human decision: the Global Constraint was overridden.** The constraint says "no change to any skill's agent-facing behavior". fqb.8 changed the Finish wording in skills/super-code/coordinator-workflow.md and coordinator-subagents.md to "append its whole stdout on every exit path". The change is needed: without it, the `Profile: context` lines printed before `Profile: unavailable` on exit 3 never reach the ledger. The spec's premise that the coordinator "already copies every `Profile:` line" was wrong for exit 3. run.md parks this as a degraded verdict for the human to confirm or revert. My recommendation is to confirm it.

4. **Minor: noise on a resumed Codex rollout.** A resumed rollout with no invocation of its own adds the `coordinator rows counted from the session start (no invocation found)` reason. That is accurate for that rollout, but noisy. The resume test does not assert on the `Profile: unmeasured` line.

## STEP 2: Ledger triage

- **Recurring lines:** there are no `Recurring minor:`, `Recurring blocker:`, `parked`, `parked finding` or `BLOCKED-AUTH` lines. The Metrics lines are consistent (9 merges, 9 clean completions) and ledger-check is ok. A loose theme runs across four tasks with different signatures: tdd-red-skipped (fqb.1), thin-test-evidence (fqb.4), vacuous-pass-risk and indirect-assertion (fqb.5), and partial-e2e-coverage (fqb.9). The class is weak test-evidence discipline, not a pipeline defect. None of them names a skipped or ignored test.
- **The minor (deferred) lines:** none is misgraded.
  - window-stamp-lost (fqb.2) is resolved: fqb.9's spans replaced the row slicing.
  - duplicate-reasons is harmless, because `summarizeContext` dedupes the reasons.
  - spec-detail-drift matches the code: `codexCause` returns `unknown` when `pre` is null.
  - existing-test-edited is fine: context-pass-unit.mjs is new on this branch, and the constraint covers test-run-profile.sh assertions.
  - codex-first-from-compaction, wording-inconsistency and doc-length are cosmetic.
- **Ledger tail:** the third invocation (fqb.11) has no `Profile:` or `Process sweep:` lines yet, presumably because its Finish comes after this review.

## Verdict

Not ready. Two items block landing: the memory regression, and the human's decision on the constraint override. The full-suite sweep is also still outstanding: the caller runs it after this review, so no full-suite measurement of this branch exists yet. I ran only tests/super-code/test-run-profile.sh, and it passed.

## Must fix before landing

1. Reduce each transcript to its record right after reading it in `contextResult` (run-profile.mjs). Today all rows are held at once, so on large runs the process runs out of memory and loses every `Profile:` line, timing included, which works on main.
2. The human confirms or reverts the Finish-doc wording change in coordinator-workflow.md and coordinator-subagents.md. It overrides the "no agent-facing change" constraint; I recommend confirming it.
3. The caller's full-suite sweep, which has not run yet.

## Untested scope

- **Full suite:** never run on this branch. Only test-run-profile.sh was run, by me.
- **Parked design escalations, all unverified:**
  - whether resumed or forked Claude Code sessions replay the parent's `compact_boundary` rows;
  - whether `message.model` ever carries a `[1m]` suffix;
  - the format of a Claude subagent or Workflow-agent `compact_boundary`: no local subagent ever compacted, so subagent compaction and the `post` fallback are covered by fixtures only;
  - whether a resumed Codex thread's later rollout replays earlier `compacted` rows: no real thread has two rollouts.
- **Idle cause:** never checked against any outside record.
- **No end-to-end tests for:**
  - `coordinator:<k>` labelling for Claude Code;
  - a Workflow relaunch with cached agents (finding 2);
  - a Codex coordinator whose window comes after its first `turn_context` (unit test only).
- **Weak sweep check:** the agent-line consistency loop in the integration sweep passes trivially if a profile prints no agent lines.

## Deferred OK

- All ledger minors:
  - codex-first-from-compaction
  - tdd-red-skipped
  - spec-detail-drift
  - window-stamp-lost (resolved)
  - duplicate-reasons
  - thin-test-evidence
  - vacuous-pass-risk
  - indirect-assertion
  - wording-inconsistency
  - partial-e2e-coverage
  - existing-test-edited
  - doc-length
- Finding 2, the phantom record from a cached Workflow agent. It is cosmetic: it inflates the `agents N` count and adds an unmeasured reason, but no measured figure is wrong. It is worth a follow-up.
- Finding 4, the reason line on a resumed Codex rollout.
- From the roast's open punch list: the `Profile: context — unavailable` line always gives the generic `no usage rows in any transcript` and drops per-file reasons.
- The absolute `/Users/...` paths in the `file` field of committed `--out` JSON. These were already present before this branch.