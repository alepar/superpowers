<!-- upstream-feedback: FILED as https://github.com/alepar/superpowers/issues/11 (no scrub) -->
# 2026-10-01-prompting-guide-roast-fixes: an uncommitted friction-log append blocks every super-code merge, and the coordinator triages it per task

Plugin: superpowers 6.4.2-alepar4.6 (2bf1d53). Run: super-auto, autonomous, fixing skills/super-auto in this same repo. 13 work beads (plus 9 `review:` beads), 5 super-code launches, design roast 2 rounds (converged), code roast 2 rounds (converged, then one regression-only pass). Wall clock about 3.5 h.

## Defects

### 1. super-auto writes the friction log inside the integration worktree during phase 3, so one uncommitted append makes super-code refuse every merge in the round.
- **Evidence:**
  - friction.md: "All three round-1 merges were refused because the orchestrator (super-auto) appended to friction.md in the integration worktree without committing".
  - The ledger shows `Merge: super-plan-5pi.1 — rebase clean · seam-review none · check none → blocker` six times, then `Metrics: merges 0 · merge-failed 6`.
  - Recovering cost one relaunch and six blocker beads closed by hand.
  - super-auto SKILL.md says "append friction events … and commit it with the `run.md` writes". super-code points nested appends at the caller's path, which is inside the integration worktree.
- **Premise to verify:** "Commit each append immediately" is not a full fix. A commit landing on the integration branch while a merge agent is mid `git merge --no-ff --no-commit` can race it.
- **Suggested fix shape:** during phase 3, keep friction entries outside the integration worktree (for example beside the ledger workspace) and fold them into `<run-dir>/friction.md` after super-code returns. Alternatively, exempt the run directory from the merge clean check.

### 2. A dirty integration worktree is a run-wide condition, but the coordinator routes it through per-task blocker triage, whose RESOLVE asks for an action the merge prompt forbids.
- **Evidence:**
  - For every round-1 task the sequence was RESOLVE ("commit the pending friction-log append in the integration worktree"), then "Second RESOLVE … without resolving — escalating".
  - The mergePrompt clean step says "Delete nothing else … do NOT merge".
  - coordinator.js detects the dirty tree but writes the cause only to the log. The ledger `Merge:` line just says `check none → blocker`.
  - One shared cause cost 6 triage dispatches, 6 blocker beads and 6 failed merges.
- **Premise to verify:** `mm.dirty` is set reliably by the merge agent.
- **Suggested fix shape:** on `dirty` evidence, pause the merge queue and surface the condition once (or end the round) rather than filing a blocker per task, and record `dirty: <paths>` on the `Merge:` line.

### 3. When the permission layer refuses a merge-time conflict resolution, the coordinator writes no `Merge:` line, so `rebase-conflicts` undercounts.
- **Evidence:**
  - Ledger: `Task 2 (super-plan-5pi.2): BLOCKED-AUTH — … python3 heredoc script rewriting the two conflicted hunks in tests/super-auto/test-scripts.sh`.
  - Every launch's `Metrics:` reports `rebase-conflicts 0`.
  - In coordinator.js, `handleAuthRefusal` is called before any `noteLedger("Merge: …")` on that path.
- **Premise to verify:** the MERGE result still carries `rebaseConflictFiles` when `authRefused` is set.
- **Suggested fix shape:** write `Merge: <id> — rebase conflict: N files · … → auth-refused` before calling `handleAuthRefusal`.

### 4. `stepBack-round-<N>` is written by both the design roast loop and the code roast loop, so the keys collide in run.md.
- **Evidence:** this run's run.md has two `stepBack-round-1:` lines, one for the design roast and one for the code roast. A resume at `phase: fix-loop` that replays the recorded round could replay the design decision.
- **Premise to verify:** resume reads the record by key, not by position (run-state.md, resume).
- **Suggested fix shape:** use separate keys (`stepBackDesign-round-N` and `stepBackCode-round-N`), with a read-compat alias for the old key.

### 5. coordinator.js `tier()` crashes in a live run when `config.models` is omitted (already queued with #10).
- **Evidence:**
  - Error: "TypeError: undefined is not an object (evaluating config.models[role])".
  - The code is `{ model: config.models[role] }` with no default.
  - dryRun returns before that line, so no dry run or harness case reaches it.
  - Every later `Launch:` passes an explicit model map as a workaround.
- **Premise to verify:** the documented default map is the intended fallback.
- **Suggested fix shape:** add a default model map, plus a harness case that is not a dry run.

### 6. The Workflow tool refuses the plugin-cache `coordinator.js` as a `scriptPath` (already queued with #10).
- **Evidence:** the tool returned "must be a script path this tool returned, or a file you can already read". The run launched a byte-identical copy from the scratchpad instead.
- **Premise to verify:** the plugin cache sits outside the harness's readable roots by default.
- **Suggested fix shape:** have the launch step copy the script into the scratchpad or working directory first.

## Run metrics
### Judge panel
- design · 1 · same-family (Claude) seat-differentiated · Should-fix (10) · panels 31 · rr 0.77 · rg 0.81 · fg 0.65 · unanimous 0.61 · ground-loo 0.79 (n=24)
- design · 2 · same · Should-fix (5) [converged] · panels 11 · fg 0.36 · unanimous 0.36 · ground-loo 0.44 (n=9)
- pr · 1 · same · Should-fix (12) · panels 17 · unanimous 0.71 · ground-loo 0.92 (n=13)
- pr · 2 · same · Should-fix (2) [converged] · panels 3 · all 1.00 (n=3)
### Fix loop
`Metrics: completions — review clean 13 · after fix pass 0 · parked 0 · re-entry closes 1 · dispatched early 7 · cancelled 0` · `fix-pass — entered 0 · FIXED 0 · BLOCKED 0`
### Merge-back
`Metrics: merges 13 · merge-failed 6 · rebase-conflicts 0 · seam-reviews 1 (fixed 0) · check-fails 0 (fixed 0)` · `ledger-check ok`.
- `rebase-conflicts` should be at least 1 (defect 3).
- All 6 merge failures had one cause (defects 1 and 2).
### Coverage
- Round 1: `requirements: 7 · mapped: 6 · unmapped: 1 (R7)`.
- Round 2: `requirements: 9 · mapped: 9 · unmapped: 0`.
- `scope-filter: 9 in-scope · 3 punch-listed`.
### Bead graph
- **Size:** 13 work beads, a critical path of depth 7 at design time, and width 1.4 (`graph-pass: depth 7→7 · width 1.4→1.4 · applied 0 · parked 4`).
- **Concurrency:** cap 8 (min(16, runtimeSlots 10 − 2)). Peak in-flight by round was 4, 3, 2, 2, 2, 1.

## Design questions

### A. Should super-code avoid hunk-level conflict resolution in test files under an auto-mode classifier?
- **Evidence:** .2 and .10 both appended a section to `tests/super-auto/test-scripts.sh`. The conflict resolution was refused as "[Security Test Removal]", a false positive, since the resolution kept both sections. .2 was quarantined, its downstream chain (.5 .6 .7 .8 .9) stalled until a human resolved the conflict, and the logged remedy ("grant the operation class") does not fit a classifier content judgment.
- **For re-implementing on the new base:** when an auth refusal hits conflict resolution, re-run the implementer on the new base, so it re-applies its additions instead of editing markers. This keeps unattended runs moving at the cost of one re-implement.
- **For serializing at plan time:** have the planner serialize beads that append to one shared test runner (or recommend one test file per script). This gives up parallelism the hot-file cap deliberately allows.

### B. Should the edge audit remember earlier verdicts, and is a pointer to a spec-fixed name safe to cut?
- **Evidence:** edge `.7 <- .5` was judged "drop … safe no" four times (once at design-time graph-pass, then three times across launches). Each audit called the seam "decided", yet 0 cuts were applied under `edgeCuts: apply-safe`. `edgeAuditsRun` resets on every relaunch. The parked cuts would have taken depth from 7 to 5.
- **For deduplicating:** pass earlier `Edge audit:` verdicts and parked graph changes into the audit, and skip edges already judged unsafe unless their beads changed.
- **For a "spec-fixed name" safe class:** treat it as safe when a lint or sweep downstream checks that the pointer resolves. The risk is a heading renamed during implementation, which the lint catches only at the end.

If upstream decides otherwise, please state the position explicitly so downstream can reconcile against words rather than silence.

## Doc gaps
- **super-design §Adversarial Review Loop, step 1:** create one fix task bead per finding or cluster even when every fix is an inline spec or tree amendment. Such beads enter the execution tree as already-done work. This run applied 15 such fixes inline and recorded them in run.md instead.
- **Coverage review and decomposition can assign a leaf bead work that needs subagent dispatch (behavioral probes), which implementer-prompt forbids ("Don't spawn subagents"):**
  - coverage-ledger `c24 · … .9 runs 3 fresh-sonnet scenario probes`;
  - ledger "Behavioral probe … not run: no subagent tool in implementer session".
  
  Route fresh-agent work, such as probes and evals, to the orchestrator's own phase.

## Already fixed — do not re-litigate
- none

## Not established
- Why .1 needed a close-only re-entry after its merge and `complete` line in the same launch.
- **Default caveat:** the coordinator's ledger appends are fire-and-forget, so every ledger-derived count is a lower bound.
- Analyst: Opus, fresh context.

## Verification bar
- **Defects 1 and 2:** make one uncommitted change in the integration worktree mid-round, then confirm no per-task blocker beads are filed and the condition surfaces once, with `dirty:` on the `Merge:` line.
- **Defect 3:** force an auth refusal on conflict resolution, then confirm a `Merge: … rebase conflict: N files … → auth-refused` line and a non-zero `rebase-conflicts`.
- **Defect 4:** resume a run at `phase: fix-loop` whose run.md also has a design-roast step-back record for round 1, then confirm the code-round record is the one replayed.
- **Defects 5 and 6:** launch the coordinator without `config.models`, from the plugin-cache path.
