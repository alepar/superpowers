# 2026-09-04-audit-plan-instrumentation: completion-detection prompts resolve task artifacts by the wrong address, filing false blocker beads against merged tasks

Plugin: 6.3.0-alepar3.3 (repo at run start; skills loaded from installed cache 6.3.0-alepar3.2). Run: 11-bead epic + 1 sweep, design roast 2 rounds (converged), coverage 2 rounds, coordinator 2 invocations (round 1: 9 merged, 121 agents, 74 min; resume for 2 beads: 107 agents, 7.8 h), 2026-09-04/05.

## Defects

### 1. Completion-detection prompts resolve task artifacts by the wrong address and file false-premise blocker beads against merged tasks
- **Evidence:** Six false-premise blocker beads across four completed tasks in the resume run (super-plan-m27 + 6ps on .3, 5ci on .7, 60e + 1yu on .11, u1l on .9), plus four in round 1 (.1, .2, .8, .9). Triage ledger line: "SDD task reports live under `.superpowers/sdd/<plan>/` and are named by PLAN ORDINAL (`task-3-report.md`), not by bead suffix"; "this is the FIFTH instance of this same lookup-error class in this run". Three tasks (.3, .9, .11) burned the one-retry bound to `BLOCKED — Second RESOLVE … (C-2)` while already implemented, reviewed, merged and closed. Resume cost for two remaining beads: 28,092 s, 107 agent dispatches. Final reviewer: "The coordinator script is not the defect: `artifacts()` already resolves `ordinalFor(id)` → `${plannedDir}/task-${n}-report.md` correctly. The defect is that prompts which check for completion don't route through that resolver."
- **Premise to verify:** the coordinator's `artifacts()` resolver and the bead→ordinal mapping table are available at every dispatch site that decides "is this task done?", and can be interpolated as absolute paths into those prompts.
- **Suggested fix shape:** hand every completion/report-lookup prompt the resolved absolute artifact paths (integration worktree, ordinal-named) instead of letting the agent derive a filename; require the same three checks triage runs (bead status, resolved report path, branch-vs-base) before any pipeline emits BLOCKED, and name the failed check in the blocker bead.

### 2. Task branch naming is inconsistent between `task-<epic>.<n>` and `task/<epic>.<n>`; probes that check one form conclude work is missing
- **Evidence:** Triage on .11: "bead .7's branch is `task/super-plan-qfy.7` (slash) while others use the dash form `task-super-plan-qfy.N` — a coordinator probing only the dash form will falsely conclude work is missing." Triage on .8: "There is no branch `task/super-plan-qfy.8` — only `task-super-plan-qfy.8`." Branch log shows merges from both `task-super-plan-qfy.3` and `task/super-plan-qfy.7`.
- **Premise to verify:** both forms are produced by current skill text (the brief prompt pins the worktree path but not the branch name), not by a one-off local rename.
- **Suggested fix shape:** pin one branch-name form in the brief prompt, and make any branch probe try both forms before reporting absence.

### 3. Implementers report IMPLEMENTED with edits uncommitted; the contract has no explicit commit step
- **Evidence:** .8 triage: "branch `task-super-plan-qfy.8` is still at the integration base `b77b572` with no task commit, while `git status --short` shows exactly the three expected files modified … The report's 'Commit' claim is therefore unbacked." .2: report says IMPLEMENTED with the full correct diff pasted; the working tree held it uncommitted; the invoking session committed it by hand.
- **Premise to verify:** the implementer report contract can require a commit SHA verified by `git log --oneline -1`, and the pipeline can cheaply assert the branch is ahead of the integration base before accepting IMPLEMENTED.
- **Suggested fix shape:** add a terminal "commit on the task branch, paste the verified SHA, `git status --short` must be empty" step to the brief; reject IMPLEMENTED when the branch tip equals the integration base.

### 4. Blocker beads stay open after a RESOLVE-and-retry succeeds
- **Evidence:** super-plan-lv3 (.1), kuy (.8), 0i1 (.9) remained open after their tasks completed on retry; eleven blocker beads were open at the end of a run with one real blocker; the invoking session closed them.
- **Premise to verify:** the close-on-successful-re-dispatch step exists in the coordinator and is not reached on this path, rather than being absent.
- **Suggested fix shape:** close the blocker bead on the success path of every re-dispatch; add a Finish-time assertion that no blocker bead is open against a closed task bead.

### 5. Return buckets are derived from ledger BLOCKED lines, not tracker state; after a resume they report done work as quarantined
- **Evidence:** Resume return: `escalated: [.3, .9, .11]`, `pendingRetry: ["task-9"]` (a bare plan ordinal) — all four beads closed in `bd`, all merges ancestors of the tip. run.md records the reconciliation.
- **Premise to verify:** `bd show <id>` status is authoritative and cheap at return-assembly time.
- **Suggested fix shape:** reconcile every bucket against tracker status before returning; a closed bead is `completed` regardless of historical BLOCKED lines; never emit a bare ordinal as a bucket entry.

### 6. After a resume, already-closed beads are re-dispatched
- **Evidence:** .9 triage, second occurrence: "progress.md line 25 already records an identical RESOLVE for this same stale dispatch of super-plan-qfy.9 … the run's ready-queue state is still offering a closed bead." .3 and .11 likewise re-entered the pipeline after closure.
- **Premise to verify:** whether the resume path serves the ready set from restored state rather than a live `bd ready` query, or whether `bd ready --label` returned the closed ids (a tracker-side question).
- **Suggested fix shape:** on resume, rebuild the ready set from a live query and drop any id whose status is closed before dispatch.

### 7. The recurring-pattern detector counts review minors only and missed a six-instance blocker cluster
- **Evidence:** No `Recurring minor:` line in the ledger; six identical false-premise blockers across four tasks; triage wrote "the FIFTH instance of this same lookup-error class" and nothing aggregated it. Final reviewer: "the recurrence detector this branch instruments did not fire on a 6-instance/4-task cluster."
- **Premise to verify:** the detector's input is a defined set of ledger line kinds that can be widened without changing threshold semantics.
- **Suggested fix shape:** widen the input to blocker beads and triage dispositions, keyed on root cause, so a repeated bookkeeping failure surfaces once as a run-level finding.

### 8. Ledger appends are fire-and-forget; a refused or dead append leaves the ledger silently incomplete
- **Evidence:** `complete` lines for only 4 of 9 merged tasks after round 1 (3, 5, 6, 10); two `ledger-append` dispatches (.9, .2) returned "Blocked by classifier" and were logged as nulls; the final reviewer reconstructed completions from `git log`.
- **Premise to verify:** a null return is distinguishable from a successful append at the dispatch site (it is — `dispatch()` logs it), and a retry with a shorter prompt is cheap.
- **Suggested fix shape:** treat a null/refused append as a failure: retry once with the bead description elided, and on second failure write `ledger-append-failed: <id>` so the gap is visible. (This branch adds `Metrics: ledger-check`, which detects the loss after the fact; it does not prevent it.)

### 9. Mechanical dispatches that quote a bead's defensive-review wording are refused by the safety classifier
- **Evidence:** Two ledger appends and one implementer stage on beads .2/.9 (whose text describes hunting for hardcoded, weakened, or deleted tests) were "Blocked by classifier"; the same wording passed when the invoking session edited the file directly.
- **Premise to verify:** mechanical dispatches (ledger append, notify) do not need the bead description at all, only ids and outcome tokens.
- **Suggested fix shape:** carry ids and outcome tokens in mechanical prompts, never verbatim descriptions; on a classifier refusal, retry once with the description elided.

## Run metrics
### Judge panel
none — both design-roast reports predate the seat-agreement line (this run's roast ran on the pre-change reporter). independence: same-family (Claude) — seat-differentiated panel, both rounds.
### Fix loop
none — the coordinator that ran this epic was the pre-change script; no per-round fix lines and no `Metrics:` block exist in the ledger.
### Merge-back
none — no `Merge:` lines (pre-change coordinator). From git: 11 task merges, 0 rebase conflicts reported, 1 seam-fix commit (30ba31c, run-state.md item 7 after rebase), 0 gate failures; 6 false-premise blocker beads on completed tasks (not merge failures).
### Coverage
none — coverage rounds predate the `requirements:` line (round 1: 12 findings, round 2: 4 — converging); no code roast ran, so no `scope-filter:` line.
### Bead graph
| id | type | title | what (first sentence of description) |
| --- | --- | --- | --- |
| super-plan-qfy | epic | Audit plan instrumentation: metrics, test-integrity guard, scope filter, edge reasons, Run | Root epic for super-auto run 2026-09-04-audit-plan-instrumentation. |
| super-plan-qfy.1 | task | super-roast: seat-agreement header line from panel votes | Reporter computes, over panel-tier findings (tier panel or promoted, valid==3): pairwise seat agreement rr/rg/fg, unanimous fraction, `ground-loo` (leave-one-ou |
| super-plan-qfy.10 | task | super-code: per-round fix-loop ledger line (coordinator shape, with bead id) from reviewAn | `reviewAndFix` in coordinator-workflow.md appends a per-round ledger line after every re-review, through the existing ledgerAppendPrompt path, in the COORDINATO |
| super-plan-qfy.11 | task | Integration sweep: audit-plan instrumentation — five emitted formats vs upstream-feedback  | Root integration sweep for epic super-plan-qfy, created after the coverage loop (round 1: 12 findings, round 2: 4 — converging). |
| super-plan-qfy.2 | task | super-roast: testing-lane hunts for hardcoded values, weakened assertions, removed or skip | scout-prompts-pr.md `## Lane: testing` gains three explicit Hunt items: (1) expected values hardcoded to match the visible test inputs; (2) assertions weakened, |
| super-plan-qfy.3 | task | super-code: Merge: ledger line per serial merge | After every serial merge attempt — the success path AND the blocker-bead failure path (roast round 1 Should-fix: without the failure-path line `gate fail` is un |
| super-plan-qfy.4 | task | super-code: Metrics: block at Finish (merge outcomes + fix-loop yield per round) and metri | At Finish, before the final review, one mechanical dispatch reads the ledger and appends FOUR separate ledger lines via four ledgerAppendPrompt calls (that path |
| super-plan-qfy.5 | task | super-auto: phase-5 scope filter on confirmed roast findings, plus metrics pointer in repo | Before phase 5 files fix beads, dispatch one fresh-context sonnet pass with a new ./scope-filter-prompt.md: inputs are the root spec's ## Goal and stated scope/ |
| super-plan-qfy.6 | task | super-design: root-pass requirement traceability count in coverage | ROOT pass only. |
| super-plan-qfy.7 | task | super-design: blocked-by <id>: consumes <artifact> edge-reason lines in bead descriptions | Every `bd dep add <dependent> <blocker>` made by §Decomposition, §Splitting a Bead, §Coverage (NARRATIVE-EDGE repoint, UNOWNED-SEAM wiring, UNSATISFIABLE-ACCEPT |
| super-plan-qfy.8 | task | upstream-feedback: gather metrics and bead graph; render ## Run metrics section | SKILL.md step 1 (Gather) adds four inputs: every roast report's seat-agreement: line (with mode, iteration and its independence: line); the ledger's Merge: line |
| super-plan-qfy.9 | task | super-code: Test changes block for task reviewer and seam review, with config.testPaths | In the coordinator's reviewPrompt (not scripts/review-package — SDD stays byte-identical) EVERY reviewing dispatch on the task — initial review, each fix-loop r |

| dependent | blocker | reason (from `blocked-by` line, or `unstated`) |
| --- | --- | --- |
| super-plan-qfy.11 | super-plan-qfy.4 | all leaves (integration sweep) |
| super-plan-qfy.11 | super-plan-qfy.3 | all leaves (integration sweep) |
| super-plan-qfy.11 | super-plan-qfy.1 | all leaves (integration sweep) |
| super-plan-qfy.11 | super-plan-qfy.7 | all leaves (integration sweep) |
| super-plan-qfy.11 | super-plan-qfy.8 | all leaves (integration sweep) |
| super-plan-qfy.11 | super-plan-qfy.10 | all leaves (integration sweep) |
| super-plan-qfy.11 | super-plan-qfy.6 | all leaves (integration sweep) |
| super-plan-qfy.11 | super-plan-qfy.2 | all leaves (integration sweep) |
| super-plan-qfy.11 | super-plan-qfy.9 | all leaves (integration sweep) |
| super-plan-qfy.11 | super-plan-qfy.5 | all leaves (integration sweep) |
| super-plan-qfy.4 | super-plan-qfy.10 | the per-round fix-loop ledger line and its ledger-append:fix-round stub (the fix-loop yield parser reads lines that bead |
| super-plan-qfy.4 | super-plan-qfy.3 | the Merge: ledger line format and its ledger-append:merge stub (the parser and the canonical dryRun scenario read lines  |

## Design questions

### Should the terminal integration sweep run against the landed subset when a leaf is escalated?
Today the sweep depends on every leaf, so one escalated leaf leaves it un-ready and the root open (this run: `.2` escalated → `.11` never ready → `ready-drained` with the root open, until the invoking session unblocked `.2`). For: the sweep's checks are per-format/per-seam and remain meaningful over what landed, with the escalated leaves named as explicit unswept scope; an autonomous run could then finish with a partial sweep rather than no sweep. Against: the sweep's job is the join; a partial join reads as complete unless the report is careful, and an escalated leaf may be exactly the seam the sweep exists to verify. If upstream decides otherwise, please state the position explicitly so downstream can reconcile against words rather than silence.

### Should `config.panelCap` default higher, or scale with the deduped-finding count, for design-artifact roasts?
Round 1 on a spec plus 11-bead tree: 117 raw → 52 deduped → 12 panels, leaving 18 severe candidates unjudged; the autonomous run parks the raise-cap question by policy, and several unjudged items were plainly true and cheap (the ledger regex mismatch, the single-line ledger append, the `bd list` default limit). Round 2 (33 raw → 11 deduped) hit no cap. For: a design artifact produces more severe candidates than a code PR and the verdict itself flags the coverage loss. Against: the cap bounds judge cost, an autonomous run cannot approve extra spend, and scaling with dedupe count is unbounded exactly where dedupe quality is weakest. If upstream decides otherwise, please state the position explicitly so downstream can reconcile against words rather than silence.

### Should super-auto's pre-flight compare the loaded skill-cache version against the repo manifest?
This run loaded super-auto and super-design from cache 6.3.0-alepar3.2 while the repo was at 3.3; the cached super-design still described the superseded coverage arbitration gate, and the session followed the repo text instead. For: silent divergence means a run executes superseded guidance while its artifacts claim the new version; the check is one comparison. Against: it only warns, and self-modifying-skill runs are a narrow case that may belong in contributor docs. If upstream decides otherwise, please state the position explicitly so downstream can reconcile against words rather than silence.

## Doc gaps

- `super-design/coverage-reviewer-prompt.md` forbids the reviewer any tool call and expects the caller to inline the whole input set: with a 27 KB assembled input and three reviewers per pass that is 80 KB of prompt through the orchestrator per round. The session gave each reviewer one permitted Read of a single assembled-inputs file (same bound, same content). Sanction that explicitly.
- `super-design` §Adversarial Review Loop step 1 ("Create one task per confirmed finding") reads as mandatory even when every confirmed finding is a spec/bead-description defect fixed inline in minutes (8 of 8 in round 1, 8 of 8 in round 2 here). Scope step 1 to findings whose fix is implementation work; direct design amendments to the inline rung with the disposition recorded in the coverage ledger.

## Already fixed — do not re-litigate

- The per-round fix-loop ledger line the coordinator never wrote, the `Merge:` line on both merge paths, and the Finish `Metrics:` block with `ledger-check` are all delivered on this branch (beads .3, .4, .10) — defect 8's *detection* half is covered there; its *prevention* half (retry/visible failure) is not.
- The `## Test changes` reviewer block, `config.testPaths`, seat-agreement line, canonical requirement list, `blocked-by` edge lines, scope filter, and `## Run metrics` section are delivered on this branch (beads .1, .5, .6, .7, .8, .9) and are not findings.

## Not established

- By default: the coordinator's ledger-append path is fire-and-forget and can lose a line without the coordinator noticing, so every ledger-derived count in `## Run metrics` (Fix loop, Merge-back) is a lower bound. The `Metrics: ledger-check` line is the one cross-check that exists.
- This run executed on the pre-change coordinator and reporter, so the Judge panel, Fix loop, Merge-back and Coverage subsections above are `none` by construction, not by loss; the first run *after* this branch lands is the first measurement.
- The 7.8-hour resume duration is wall-clock from the workflow record and includes runtime queueing; it is a single observation, not a rate.
- Defect 6's premise (resume-served ready set vs. tracker-returned closed ids) was not isolated; the evidence shows the symptom only.
- Both design roasts and the coverage passes ran with same-family (Claude) seats; agreement figures were not computed for this run.

## Verification bar

- `bash tests/super-code/test-coordinator-replay.sh` (860 passing on this branch) with a new scenario: a resumed run whose ledger holds BLOCKED lines for beads that `bd` reports closed — assert `completed` includes them, `escalated` excludes them, and no bare ordinal appears in any bucket (defects 5, 6).
- A prompt-text assertion that every completion-detection dispatch text contains the resolved `task-<ordinal>-report.md` absolute path and never the string `task-<bead-suffix>` (defect 1), and that branch probes name both `task-` and `task/` forms (defect 2).
- A live two-bead resume on a small epic, timed, after defects 1, 5 and 6 are fixed: the same shape here cost 107 dispatches and 7.8 hours.
- For defect 9: dispatch a mechanical ledger append whose prompt quotes a bead about detecting weakened tests, and confirm the elided-description retry path lands the line.

---
If a premise above is wrong, stop and say so rather than improvising a larger change.
