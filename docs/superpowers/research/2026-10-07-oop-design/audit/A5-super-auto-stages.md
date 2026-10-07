# A5: super-auto stages, step-backs, caps, loops, run state and reporting

Auditor A5 · 2026-10-07 · worktree `research/oop-design-scouts` at eb0462b (6.4.2-alepar4.16) · read-only.

The question this audit serves: would an intermediary "interface/contract model" stage between `super-design` and `super-code` fit as a new super-auto stage? Or would it be better to extend an existing stage, either inside super-design's loop or as beads in the tree?

## Scope and files read

| Path | Lines | How read |
|---|---|---|
| `skills/super-auto/SKILL.md` | 485 | full |
| `skills/super-auto/run-state.md` | 235 | full |
| `skills/super-auto/resume.md` | 41 | full |
| `skills/super-auto/report-prompt.md` | 60 | full |
| `skills/super-auto/scope-filter-prompt.md` | 64 | full |
| `skills/super-auto/MAINTENANCE.md` | 101 | full |
| `skills/super-auto/scripts/step-back-check` | 64 | full |
| `skills/super-auto/scripts/scope-dispositions` | 77 | full |
| `skills/super-auto/scripts/report-status` | 186 | full |
| `skills/super-design/step-back-prompt.md` | 102 | full |
| `skills/super-design/SKILL.md` | 811 | full (focus: §Gates by Mode, §Unattended Runs, §Decomposition boundary rules, §Coverage, §Adversarial Review Loop, §Parallelism Pass, §Hand-off, §Run-State File) |
| `tests/super-auto/test-scripts.sh` | 213 | full |
| `tests/super-auto/test-contract-lint.sh` | 243 | full |
| `tests/super-auto/fixtures/contract-lint/*` (3 files) | 7 / 44 / 11 | full |
| `tests/super-auto/fixtures/report-status/*` (23) and `step-back-check/*` (6) | 321 total | 7 opened (`clean`, `bad-phase`, `design-capped-stopped`, `design-capped-proceeded`, `degraded-verdict`, `valid-redesign`, `keys.txt`); the rest through the assertions that pin them (`test-scripts.sh:89-201`) |
| `docs/superpowers/specs/2026-07-31-super-auto-design.md` | 303 | full |
| `docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/2026-10-01-prompting-guide-roast-fixes-design.md` | 136 | full |
| `docs/superpowers/feedback/2026-10-06-in-round-step-backs/upstream-feedback-draft.md` (+ `friction.md`, 3) | 57 | full |
| Recorded run artifacts: `runs/2026-10-01-…/run.md` (58, full), `report.md` (head), `coverage-ledger.md` and `settled-tree-r*.md` (grep); `runs/2026-09-04-audit-plan-instrumentation/run.md` (42) and its coverage ledger (grep) | | as noted |
| Cross-skill greps: `skills/super-code/coordinator-workflow.md:1315`, `coordinator-subagents.md:201`, `skills/upstream-feedback/*`, `AGENTS.md`/`CLAUDE.md` checklist | | grep |
| Git: `git log`/`git show` on 6b62f17, da9f562, f568a9f, 50661d2, 6214eab, 0cdaa12, 84f6717, 01983d6, 7836b58 | | read-only |

Skipped, and why. super-code coordinator internals are another auditor's scope; I touched them only where super-auto text points into them. There is no `evals/` directory in this worktree (`ls evals` fails). The user's memory file behind "autonomous runs degrade, don't stop" lives outside the worktree, so I cite the same rule from the repo (`SKILL.md:99`).

Tests run: both have no side effects. Each writes only under `mktemp -d` with an EXIT-trap cleanup, and test-scripts.sh's `git init` also runs inside that temp dir.
- `bash tests/super-auto/test-contract-lint.sh` gave 7 PASS: the live tree plus 6 mutation checks.
- `bash tests/super-auto/test-scripts.sh` gave 65 PASS.

## Mechanism map

### Phases and the transition contract

The phases are `SKILL.md:159-167`. Each `run.md` token is from `run-state.md:20`. super-auto "owns every transition explicitly — it never lets a phase chain into the next on its own" (`SKILL.md:155-157`).

| # | Token | run.md writer | Consumes (passed in) | Produces (recorded) |
|---|---|---|---|---|
| 1 | `design` | super-design | idea (the recorded `idea:` on resume), artifact-dir override, `run.md` path + run-state.md contract, `roast-design` token, design mode, `autonomous`, `skipPlanRoast`, starting round (`SKILL.md:161`) | `spec`, `epic`, `approvals` (top-split, coverage-round-N), `parked`, `graph-pass` |
| 2 | `roast-design` | super-design (same invocation) | super-roast design mode via super-design's own offer (`SKILL.md:162`) | `roast-design` paths, `roastDesignRound`, `stepBackDesign-round-N`, `roastDesignCapped`. Five-item hand-back (`super-design/SKILL.md:676-683`) |
| — | `capped-blocking` | super-auto | design extension round still Blocking, run not autonomous (`SKILL.md:406`) | terminal stop state (`run-state.md:71`) |
| 3 | `code` | super-auto | `integrationBranch`/`integrationWorktree`, autonomy, `edgeCuts: 'apply-safe'`, "super-auto owns the finish", friction-pending path, `processRoots`, `deferSweep: true` (`SKILL.md:163`) | `codeBuckets` (`run-state.md:40-50`, `103-105`); per-invocation final review (`SKILL.md:283`) |
| 4 | `roast-code` | super-auto | diff vs `base`, run dir, iteration = `roastCodeRound`, `autonomous`, prior report, punch-list file (`SKILL.md:164`) | `roast-code` paths, `roastCodeRound` |
| 5 | `fix-loop` | super-auto | the round's report | `stepBackCode-round-N`, `scopeFilter-round-N`, fix beads, `roastCodeExit`, `roastCodeCapped`, `regressionPass-round-N` (`SKILL.md:219-301`) |
| 6 | `report` | super-auto | the tip | `codeBuckets.sweep`, `sweepFix`, post-cap audit, `friction`, `report.md`, `feedback` (`SKILL.md:305-315`) |
| 7 | `finish`→`done` | super-auto | gate I2 (`SKILL.md:22`) | merge per the human's menu choice (I5, `SKILL.md:25`) |

Transition rules:
- A sibling's return is "a transition, not a stop" (`SKILL.md:46-47`).
- A phase that does not run is still written, with `(skipped)` (`run-state.md:71`).
- Field ownership is split and does not overlap (`SKILL.md:217`).
- A co-writer must be handed the contract (`SKILL.md:161`; `super-design/SKILL.md:727-729`).

Autonomy rules:
- The zone runs from launch to the phase-7 hand-back (`SKILL.md:40`, `350`).
- The stop list is closed (I1, `SKILL.md:21`, `62-67`).
- Sibling pauses are answered and parked (I4, `SKILL.md:24`, `377-394`).
- A protected resource or risky action is skipped, not stopped on (`SKILL.md:69-72`).
- "Nothing can move" ends the run with a `stalled` report (`SKILL.md:73-75`).

Parking:
- The parked kinds are `escalation | beyond-cap | degraded-verdict | graph-change` (`run-state.md:33`, `85-93`).
- A record may end ` · resolves-on: sweep` (`run-state.md:91`).
- Parking is mode-independent (`run-state.md:93`).
- `report-status` computes N as the `roastCodeCapped` keys plus the `roastDesignCapped` keys (unless `stopped`). M is the `escalation` records plus `codeBuckets.escalated`. A `degraded-verdict` record becomes a qualifier (`report-status:22-23`, `137-146`).

### Step-backs

| Mode | Where / when | Inputs | Outcome handling |
|---|---|---|---|
| `design` | super-design, every design-roast round with confirmed findings, before fix step 1 (`super-design/SKILL.md:551-561`) | every roast report so far, the settled tree, prior step-back records | `stepBackDesign-round-N`. A redesign with scope `inside` is applied: the spec is amended, tasks are restructured, and the design is re-roasted. Scope `outside` is parked. Interactive runs let the human choose |
| `code` | super-auto phase 5 Step 1, every round (`SKILL.md:237-251`); also at a thrash or cap exit with Blocking open, where a redesign is "recorded as `parked` … never applied" (`SKILL.md:255-256`) | the dispatch row (`SKILL.md:323`): root spec, branch/base SHAs, epic id, every roast-code report, prior step-back files, keys file | `step-back-check` validates the decision, the redesign scope, and the dissolves/remains keys (`step-back-check:10-17`). A rejected record makes the round run as `patch` (`SKILL.md:241`). Autonomous runs apply `inside` and park `outside` as `degraded-verdict` (`SKILL.md:244-248`) |

- Cadence is one per numbered round, keyed `stepBack<Design|Code>-round-<N>` (`step-back-prompt.md:15-23`).
- A resume replays the record and never re-dispatches it (`resume.md:27`; `run-state.md:149-150`).
- Neither the regression-only pass nor the sweep-fix pass gets a step-back (`SKILL.md:231`, `308`).
- The model is opus (fable where available). The step-back runs in a fresh context and is never the fixer (`step-back-prompt.md:6`).

### Caps and loops

| Loop | Cap | Exits | Persisted |
|---|---|---|---|
| Coverage (super-design) | fixed 2 rounds; round 2 only if round 1 changed the tree; "there is no round 3", even when round 2 widens (`super-design/SKILL.md:440-447`) | clean / round 2 applied | `approvals · coverage-round-N` |
| Design roast | 3 rounds plus exactly 1 extension (`run-state.md:95`; `super-design/SKILL.md:579-606`) | converged / thrash / clean (qualifiers gate the exits, `608-618`) / capped | `roastDesignRound`, `roastDesignCapped … stopped \| proceeded`; **no exit field** (F15) |
| Code roast fix loop | 3 rounds (`run-state.md:95`) | converged / thrash / capped / operator-skipped (`SKILL.md:225-227`) | `roastCodeRound`, `roastCodeExit`, `roastCodeCapped` |
| Regression-only pass | once, no step-back, no scope filter, no re-roast (`SKILL.md:231`) | — | `regressionPass-round-N` |
| Sweep-fix | one pass, plus one regression-only bead and one re-run (`SKILL.md:308`) | — | `sweepFix` |
| Post-cap audit | one scoped PR roast; starts no fix loop (`SKILL.md:200-209`) | — | appended to `roast-code` |
| Tripwire | depth 3 or more than 10 epics; unattended runs take continue, then stop (`super-design/SKILL.md:368-377`) | — | parked qualifier |

How a roast finding becomes a fix bead (`SKILL.md:237-279`):
1. The keys file feeds the step-back, and `step-back-check` validates its record.
2. The scope keys file (without dissolved keys) and the scope filter's JSON (a sonnet subagent) go to `scope-dispositions`. It routes Blocking and unrouted keys in-scope and keeps clusters whole, allowing a `clusterOverride` (`scope-dispositions:11-17`).
3. The result is recorded as `scopeFilter-round-N` plus an aggregate line. The punch-list file goes to the next roast.
4. The epic is reopened. In-scope findings, any applied redesign, and the routed final-review items are filed as fix beads, with the I3 flags (`SKILL.md:23`) and the Fix-bead template (`SKILL.md:327-342`).

## Findings

**A5-F01 · observed.**
- Claim: super-auto's own boundary rule puts phase-improving work in the phase's skill. "If a change would improve how a *phase* works, it belongs in that phase's skill, not here. `super-auto` may only grow in the sequencing dimension." (`SKILL.md:31-32`; the origin is `specs/2026-07-31-super-auto-design.md:28-30`). super-auto also never decides severity (`SKILL.md:35`).
- Implication (a): interface/contract modelling is design work, so the repo's rule homes it in super-design or brainstorming, and its review in super-roast. A super-auto phase is justified only for pure sequencing of a separate skill.

**A5-F02 · observed.**
- Claim: the super-design → super-code seam is one transition (phase 2 → 3), and super-auto has no control before it. Phases 1–2 run inside one super-design invocation, which writes `run.md` itself; super-auto "holds no control between invoking it and its return" (`SKILL.md:162`, `213-217`).
- super-design hands back five items (`super-design/SKILL.md:676-683`), and phase 3 starts in the same message (`SKILL.md:46-47`).
- Phase 3 receives the branch, worktree and flags, and no design artifact beyond the epic (`SKILL.md:163`).
- Implication: the only "between" slot super-auto owns comes after super-design's parallelism pass. That is after the design roast and after the planOneShot review (F08).

**A5-F03 · inference** (from observed commits).
- Claim: the stage list has shrunk, not grown.
- The approved spec had 8 phases, with brainstorming as its own phase, and autonomy began after coverage (`spec:61-70`, `110`).
- 6b62f17 "collapse brainstorm+plan into a single design phase"; da9f562 moved autonomy to begin at launch (`SKILL.md:350`). The spec's token list `brainstorm | plan | …` (`spec:211-212`) is gone.
- `phase-sequence-2bf1d53.txt` has never changed since f568a9f created it.
- Implication: precedent favors folding work into an existing owner over adding a phase.

**A5-F04 · observed.**
- Claim: the contract lint freezes the phase tokens and gates new fields.
  - `check_baseline` diffs the §Phase sequence tokens against `phase-sequence-2bf1d53.txt` (`test-contract-lint.sh:171-173`).
  - It requires the `phase` token list from `run-state-formats-2bf1d53.txt:3` verbatim (`test-contract-lint.sh:165-170`).
  - Any new field fails with "adds a field not in the baseline" (`test-contract-lint.sh:164`).
- Field changes are routine. Five commits edited the fields and formats fixtures (6214eab, 0cdaa12, 84f6717, 01983d6, 7836b58).
- Four of the five also updated the header list (`test-contract-lint.sh:4-6`). 84f6717 did not, so the header omits `baseAbsorbed` and the `stepBackCode`/`stepBackDesign` split.
- Implication: a new `run.md` field costs one fixture line. A new phase token means editing all three fixtures, including the never-touched phase baseline.

**A5-F05 · observed.**
- Claim: `report-status` hard-codes the phase token set twice and exits 2 on any other token (`report-status:72-75`, `155`).
  - The report must paste the script's output and never hand-write it (`report-prompt.md:27`, `36`).
  - I2 needs `report.md`'s status line (`SKILL.md:22`).
  - The behavior is pinned by `fixtures/report-status/bad-phase.md:4` and `test-scripts.sh:194-195`.
- Implication: a new token that the script has not been taught makes the report unwritable. The run would stop just short of finishing.

**A5-F06 · observed.**
- Claim: only `escalation` and `degraded-verdict` parked kinds move the status line (`report-status:137-146`). "beyond-cap and graph-change do not count" (`test-scripts.sh:116`), and unknown fields are ignored.
- Implication: anything a new stage parks must be `degraded-verdict`, or the script must be extended. Otherwise a run can read `clean` over it, which is the outcome `report-prompt.md:3` exists to prevent.

**A5-F07 · observed.**
- Claim: autonomy runs on a closed list of four stops (`SKILL.md:21`, `62-67`):
  1. the pre-flight hard stops;
  2. the phase-7 hand-back;
  3. the planOneShot design-ready stop;
  4. the capped-blocking stop.
- Sibling pauses are answered and parked, and each has a listed default (`SKILL.md:24`, `377-394`).
- "Degrade-don't-stop governs the run from launch onward" (`SKILL.md:99`). super-design has its own two-stop list (`super-design/SKILL.md:64-81`).
- Implication: a new stage needs an unattended default plus a parked record for each pause it adds, and it cannot add a stop.

**A5-F08 · inference** (from `SKILL.md:66`, `356-360`; `super-design/SKILL.md:46-50`, `91-94`).
- Claim: the planOneShot review stop is "at the end of phase 2, before phase 3". It shows the settled tree, the roast exit summary and everything parked.
- A contract model added as a super-auto phase after phase 2 would be built after the design roast, so no roast reviews it. It would also be built after the human's one-shot review, so the human never sees it. Avoiding that means moving stop 3, or giving the new phase its own roast, with a new loop and cap.
- If it is built inside super-design, between §The Process steps 7 (coverage) and 8 (roast offer), the design roast reviews it and the existing stop shows it. No new gate is needed.

**A5-F09 · observed.**
- Claim: contract-first beads already exist in the tree model.
  - Decomposition requires literal `owns:`/`consumes:` boundary lines (`super-design/SKILL.md:208-221`).
  - When coverage verifies an UNOWNED-SEAM finding, it creates a `Seam contract: <boundary>` bead that "delivers **compilable boundary code**, not prose". Every participant is blocked on it, and a `Seam integration:` bead accompanies it (`super-design/SKILL.md:495-502`).
  - Seam-contract beads are the bottleneck exemplar: "compilable stubs, inert-by-default" (`super-design/SKILL.md:204-205`).
  - The graph pass exempts their edges (`super-design/SKILL.md:642`, `787-788`).
  - The `boundary contract:` pointer reaches execution briefs "with zero execution-side changes" (`super-design/SKILL.md:502`).
- Creation is reactive: it needs a verified coverage finding, or a graph-pass `proposal:`, which is never safe and parks unattended (`super-design/SKILL.md:647-656`).
- Implication (a): proactive interface beads at decomposition attach here. They need no phase, no `run.md` field, and no lint or `report-status` change.

**A5-F10 · gap** (observed basis).
- Claim: recorded runs used this machinery on skill text, not on code.
  - The 2026-10-01 run had a decomposition-time `Seam contract: MAINTENANCE.md skeleton` bead (`runs/2026-10-01-…/settled-tree-r1.md:91`).
  - Its coverage ledger has 15 UNOWNED-SEAM lines, most resolved by naming an existing owner plus an edge (`coverage-ledger.md:9-27`).
  - The 2026-09-04 run rejected shared-file seams as "not a dataflow" (`audit-plan-instrumentation-coverage-ledger.md:8`).
- The gap: these two are the only run dirs, and neither covers OOP application code.

**A5-F11 · observed.**
- Claim: every loop has a fixed cap, a persisted per-round counter, and an exit vocabulary (table above).
  - "A cap that is only recorded after the loop finishes is not a cap" (`super-design/SKILL.md:755-757`).
  - The cap counts are fixed in `run-state.md:95`.
- Implication: a new looping stage needs roughly the four fields `roastCode*` uses: round, exit, capped, and the report list. Extending an existing loop adds none. An assessment can never reopen a spent cap (`feedback draft:44`).

**A5-F12 · observed.**
- Claim: the phase-5 scope filter punch-lists design-quality findings. The punch-list test covers "a quality improvement to goal-named code (style, structure, naming, extra hardening) that does not change whether that code is correct" (`scope-filter-prompt.md:33-35`).
  - Only Blocking and unrouted keys are forced in-scope (`scope-dispositions:11-13`, `60-61`).
  - Punch-listed findings "are never filed" (`SKILL.md:268-269`).
  - Live example: `[Should-fix] … punch-list — … not incorrect goal-named behavior` (`runs/2026-10-01-…/run.md:21`).
  - Fix beads are fenced to their named files (`SKILL.md:333`). The exception is cluster and redesign beads, which may change every instance of their rule (`SKILL.md:331`).
- Implication (b): a sub-Blocking OOP or structure finding from the code roast never becomes a fix. It is enforced only if it is Blocking (super-roast's call), part of a cluster `rule:`, an applied redesign, or if the punch-list test changes.

**A5-F13 · observed.**
- Claim: the step-back is where interface reasoning happens at review time today.
  - It looks for clusters "around one decision, interface, data flow, or ownership choice" (`step-back-prompt.md:73`).
  - A cluster's `rule:` covers instances the roast did not cite (`step-back-prompt.md:92`).
  - Its `[ARTIFACT]` input differs only by mode (`step-back-prompt.md:10-13`).
  - The 2026-10-01 run found "two interface clusters (status inputs; step-handoff files)" (`run.md:16`).
- Implication: (a) a contract model can be one more `[ARTIFACT]` input. (b) A cluster rule is the only fix-loop route for a family-wide interface fix below Blocking.

**A5-F14 · observed.** The in-round step-back request (not to be implemented).
- Status: accepted and pending, and "does not implement a new runtime rule" (`feedback draft:4`, `8`).
- What it asks: during phase 5, "before admitting the next repair batch", dispatch a fresh read-only assessment (`feedback draft:32-36`). It fires on a bounded cadence or on an immediate trigger:
  - the same root cause recurs after a repair;
  - a repair moves the failure to a neighboring path;
  - the whole-epic review adds related Must-fix items.
- Constraints it sets:
  - preserve round numbers and caps (`feedback draft:44`);
  - run only at a safe admission boundary (`feedback draft:45`);
  - persist a distinct checkpoint id, input revision and decision (`feedback draft:46`);
  - coordinator participation "may be needed" (`feedback draft:53`), because fix batches run inside super-code, where super-auto only watches (`SKILL.md:56-60`).
- What it would touch: Phase 5 Step 1 and §Final-review items (`SKILL.md:235-290`), the one-record-per-round format (`step-back-prompt.md:15-23`), a new run-state field, the replay rule (`resume.md:27`), and the step-back-check fixtures.
- Its late defects are user-reported and unverified (`feedback draft:28`), and they are interface-shaped: "generic producers with legacy consumers left behind; deadline/ownership guarantees missing sibling and failure paths" (`feedback draft:18`).
- Relation: it changes the cadence of an existing stage; it adds no stage. It is the review-time counterpart of a contract model, and both would feed the step-back's inputs. Keep the two separate (`feedback draft:49`).

**A5-F15 · gap.**
- Claim: the design-roast loop has no exit field. The table has `roastCodeExit` and nothing equivalent for design (`run-state.md:35-39`).
- Both recorded runs invented one, under different names: `designRoastExit:` (`runs/2026-10-01-…/run.md:41`) and `roastDesignExit:` (`runs/2026-09-04-…/run.md:17`). The 2026-09-04 run also wrote `phaseHistory:` (line 5).
- Both runs predate the field table (50661d2). The lint checks only the worked example, not real `run.md` files (`test-contract-lint.sh:35-75`).
- Implication: when the contract is silent at a stage boundary, co-writers invent fields (`SKILL.md:161` warns of this).

**A5-F16 · inference** (from `SKILL.md:45-51`, `62-75`, `406-407`; `report-status:155`).
- Claim: a new phase adds four ways for an unattended run to pause:
  1. one more sibling-return transition. The listed failure here is a turn that "announces the next phase instead of starting it".
  2. any approval inside the stage, which needs an I4 default or it breaks I1;
  3. a cap trip, where it must choose between stopping (design-roast precedent) and parking (code-roast precedent);
  4. the `report-status` token gate (F05).
- Attaching the work inside super-design, or as beads, adds none of these.

**A5-F17 · observed.**
- Claim: phase numbers are load-bearing text. A grep counts 125 numeric phase references in the super-auto runtime files plus `report-status`: SKILL.md 74, run-state.md 36, resume.md 6, report-prompt.md 3, scope-filter-prompt.md 1, report-status 5.
- Other skills refer to them too: `super-design/SKILL.md:49`, `521`, `808`; `step-back-prompt.md:13`; `super-code/coordinator-workflow.md:1315`; `coordinator-subagents.md:201`.
- I2 is named "phase-7 gate" (`SKILL.md:22`).
- The lint checks § and item pointers, not phase numerals (`test-contract-lint.sh:90-137`).
- Implication: inserting a numbered phase renumbers silently across four skills.

**A5-F18 · gap.**
- Claim: there is little behavioral evidence for transitions.
  - The probes for fix-loop resume and a planOneShot capped design were "not run" (`MAINTENANCE.md:97-101`).
  - The spec says it has not validated a full roast-fix cycle or an autonomous run (`spec:295-297`).
  - There is no `evals/` directory, yet skill changes require eval evidence (`CLAUDE.md:93-99`).
- Implication: any new stage or loop change starts with no transition baseline to compare against.

## Extension points

1. **super-design §Decomposition** (`super-design/SKILL.md:201-221`), preferred. Add proactive `Seam contract:` interface beads, driven by the `owns:`/`consumes:` lines. This changes engine data (bead descriptions) and no engine code. Execution already honors it (`super-design/SKILL.md:502`).
2. **super-design §The Process, between steps 7 and 8** (`super-design/SKILL.md:91-92`). A contract-model step here is roasted by the design roast and shown at the one-shot stop. If it records anything, it needs:
   - a row in super-design's §Run-State File table (`super-design/SKILL.md:713-725`);
   - a row in the run-state.md field table;
   - a line in the fields fixture, plus the header list (F04).
3. **`step-back-prompt.md` `[ARTIFACT]` table** (lines 10-13). Add the model as an input to both modes. The output contract is unchanged, so `step-back-check` is unaffected.
4. **`report-prompt.md` §Allowed sources** (lines 9-19; "Use nothing else", line 19). Add the artifact here. Entrypoints already reads "root-most module first, then its public interface" (line 55).
5. **Only if a super-auto phase is insisted on.** It needs:
   - a §Phase sequence row;
   - `run-state.md:20` and item 2;
   - `report-status:73` and `155`, plus new fixtures (a stall at the phase, its parked qualifier);
   - a resume.md §Resuming at a phase rule;
   - all three lint fixtures plus the header;
   - an §Autonomous mode bullet per pause;
   - the ownership sentence (`SKILL.md:217`);
   - renumbering per F17.

Must stay untouched:
- I1, I2, I3 and I5 (`SKILL.md:21-25`);
- the cap counts (`run-state.md:95`; `super-design/SKILL.md:440-447`);
- the scope-dispositions Blocking and unrouted defaults;
- step-back-check validation;
- `deferSweep` and the single phase-6 sweep (`SKILL.md:163`, `305`);
- the field-ownership split;
- super-design's two-stop list.

## Constraints and costs

- **Tests:** contract lint 7/7 PASS; scripts 65 PASS. Both are on the release checklist (`CLAUDE.md:125-126`).
- **Lint checks:** check_example, check_pointers, check_counts, check_baseline, check_status_examples (`test-contract-lint.sh:195-201`). check_counts rejects prose like "eight phases" (noun list at `test-contract-lint.sh:146`).
- **dryRun:** super-auto has no Workflow engine. The coordinator.js dryRun counts are affected only if a change reaches super-code (`CLAUDE.md:130`).
- **Per-agent cost:**
  - step-back: opus, once per round (`step-back-prompt.md:6`);
  - scope filter: sonnet, once per round (`SKILL.md:324`);
  - report drafter: session model, once (`SKILL.md:325`);
  - coverage: 2 opus reviewers per round, 2 rounds (`super-design/SKILL.md:425`, `440`);
  - graph pass: opus, once (`super-design/SKILL.md:644`);
  - execution: about 5 dispatches of ceremony per bead (`super-design/SKILL.md:197-198`).
- **Philosophy:**
  - §Boundary (`SKILL.md:31-32`);
  - degrade-don't-stop (`SKILL.md:99`);
  - SKILL.md carries no history, which goes to MAINTENANCE.md (`MAINTENANCE.md:3`);
  - canonical homes and pointer syntax (`MAINTENANCE.md:5-11`);
  - deterministic bookkeeping lives in scripts (`MAINTENANCE.md:83-93`);
  - run-state is a contract other skills write against (`prompting-guide design:27`).

## Open questions

- Does super-roast's design mode review an interface or contract artifact specifically? That is outside A5's scope.
- Can super-code's coordinator expose a safe checkpoint inside one invocation (`feedback draft:53`)?
- How often does UNOWNED-SEAM fire on application code? Does a proactive contract bead earn back its roughly 5-dispatch ceremony? No recorded run covers this.
- Should the design-roast exit become a contract field (F15)? That is the owner's call.
- Should the model be a spec section, beads, or a file? There is no plan pointer by design (`run-state.md:75`).
