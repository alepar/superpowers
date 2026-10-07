# A7 — Evaluation infrastructure and tests

Auditor A7 · 2026-10-07 · branch `research/oop-design-scouts` @ `eb0462b` · read-only. The only
files written are this report and `A7-evidence.jsonl`.

## Scope and files read

| Path | Lines | How read |
|---|---|---|
| `tests/super-code/replay-harness.mjs` | 3059 | 1–719, 1180–1419, 1488–1517, 1600–1809, 2200–3059 in full; 720–1179, 1420–1487 and 1810–2199 through their `scenario(` titles only |
| `tests/super-code/test-coordinator-replay.sh` | 15 | full |
| `tests/super-roast/test-assemble-args.sh`, `engine-mock.mjs` | 86, 103 | full |
| `tests/super-design/test-scripts.sh` + `fixtures/` (13 files) | 169 + 371 | full (`graph.json` summarized with a python one-liner) |
| `tests/super-auto/test-scripts.sh`, `test-contract-lint.sh` | 213, 243 | full |
| `tests/super-auto/fixtures/contract-lint/*` (3), `report-status/clean.md`, `step-back-check/{valid-redesign.md,keys.txt}` | 62, 19, 15 | full; the other 22 report-status/step-back fixtures are format fixtures and were only listed |
| `tests/skill-scripts/test-bash-invocation.sh` | 29 | full |
| `tests/claude-code/analyze-token-usage.py` | 168 | 1–40 |
| `docs/testing.md` | 35 | full |
| `docs/superpowers/plans/eval/` (judge-seats record + fixture, roast eval, SDD autonomous eval, fallback eval + live transcript) | 49, 44, 78, 54, 36, 31 | full |
| `skills/writing-skills/SKILL.md`, `testing-skills-with-subagents.md` | 679, 384 | headings, then 370–629 and 1–170 |
| `skills/super-code/coordinator-workflow.md` | 1999 | 1340–1469, 1640–1999, plus greps |
| `skills/super-roast/super-roast-workflow.md` | 1002 | 1–240, 276–330, 650–1002 |
| `skills/super-code/coordinator.js` | 2086 | grep, 245, 1290–1310 |
| `skills/super-code/task-reviewer-prompt.md`, `skills/super-roast/triage-prompt.md` | 114, 55 | full |
| `skills/super-roast/judge-seat-prompts.md`, `scripts/assemble-args.mjs` | 164, 308 | 1–48; 140–229 |
| `skills/super-design/SKILL.md`, `scripts/{graph-shape,coverage-inputs,coverage-precheck}`, `skills/super-code/scripts/tree-shape` | — | targeted greps (seam contract, exempt edges) |
| `AGENTS.md`, `README.md` | 147, 406 | 90–147; greps (lines 56, 392) |
| `docs/superpowers/reviews/2026-07-30-planted-defect-branch-roast-1.md` | 64 | full |
| `docs/superpowers/plans/2026-07-29-super-roast.md` | — | 326–380, grep |
| `docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/` (4 roast headers, `run.md`, `report.md`, `behavioral-probe-2026-10-02.md`) | 58, 67, 7 | header lines 1–9 of each roast; the rest full |
| `docs/superpowers/runs/2026-09-04-audit-plan-instrumentation/` (`run.md`, `report.md`, `friction.md`) | 42, 64, 13 | 20–42; greps |
| `docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md`, `2026-05-06-lift-drill-into-evals-design.md` | 543, 247 | greps |
| `skills/super-auto/MAINTENANCE.md` | 101 | 88–101 |
| commits `3cb9099`, `ccf473d`, `8e1262a`, `944da17` | — | `git show -s` |

**Test runs (side-effect free).** Each suite writes only to `mktemp`/`os.tmpdir()` directories it
deletes. The replay harness also spawns and kills its own short-lived processes; `ps` afterwards
showed none left. Results today: replay harness **1501 passed / 0 failed, 130 scenarios, 30 s**;
super-design 32 PASS (<1 s); super-roast assemble-args + engine mock 58 PASS (3 s); super-auto
scripts 65 PASS (1 s); super-auto contract lint 7 PASS (12 s); bash-invocation lint pass (99 s).
All exit 0. That is about 145 s of wall clock and no model spend.

**Skipped:** `evals/`, which is not cloned here: `ls evals` fails and `.gitignore:10-13` excludes
it. Sibling worktrees. The content of the scout, lane and planner prompts, which other auditors
cover.

## Mechanism map

### What each suite verifies

| Suite | What it executes | What it asserts | What it never verifies |
|---|---|---|---|
| Replay harness (`replay-harness.mjs`, run by `test-coordinator-replay.sh`) | `coordinator.js` as an AsyncFunction, with the `agent/log/phase/pipeline/parallel` stubs at 66–161. **dryrun** mode replays the doc's three `args` blocks (386–448). **live-sim** mode runs the real prompt builders with canned answers per label, including `null` (11–18). | Scenario groups: template-literal span count (369–383); file and path plumbing into real dispatch text (451–528); literal checks on the implementer and reviewer templates (530–540); routing, buckets and the blocker path; the null-dispatch policy (878–1116); resume; parallelism invariants: no round barrier, sliding window, hot-file cap, detector, off-queue triage, cap (1186–1329); top-up (1417–1504); review package, minors, auth refusals, edges, sweep (1601–1868); merge evidence and seams; Metrics arithmetic (2205–2250); early unblock and graph readiness (2271–2599); shipped scripts against a fake `bd` (2601–3052). Invariants: `assertBucketsDisjoint` (192–212); single-flight merge `maxOpen.merge === 1` (415, 1196). | What a real agent produces. The content of `planner-prompt.md` (only its path, 474). `coordinator-subagents.md` (no test names it). Any clock. |
| `test-assemble-args.sh` + `engine-mock.mjs` | `assemble-args` for PR rounds 1–2 and design round 1, then the `--script` output under a mock `agent()` in 4 scenarios | Rosters and prompt counts (27–28, 44); validation exits (49–69); the no-node path (71–77); no unfilled markers, the lanes enum, seat prompts without `lanes`, the recall-vs-materiality policy, the regression lane, the `[fix-regression]` tag, punch-listed keys, convergence, the domain template (engine-mock 44–101) | Routing (2-of-3), caps, dead dedupe or judges, `seatAgreement`, reporter enforcement: `grep dedupeDead\|routeCounts\|seatAgreement\|panelCap\|judgeLost tests/` finds nothing. Any agent count. Lane wording. |
| `tests/super-design/test-scripts.sh` | 5 helper scripts over fixtures | coverage-precheck (25–70); requirements-tally (72–85); coverage-divergence (87–97); graph-shape: depth, width, critical path, and the **exempt sweep and boundary-contract edges** (99–123); coverage-inputs passing `owns:`/`consumes:`/`boundary contract:` through (125–166) | Whether a decomposition is any good; the coverage reviewer's prompts |
| `tests/super-auto/test-scripts.sh` | scope-dispositions, step-back-check, report-status | Record grammar and the status-line derivation (45–201) | Whether a step-back or redesign decision is right |
| `tests/super-auto/test-contract-lint.sh` | Static lint of `skills/super-auto` plus 6 mutation self-tests | Worked example vs field table; § pointers; no numeric count pointing at a list; field table and phase sequence vs the `2bf1d53` baseline (2–7, 139–234) | Behavior |
| `tests/skill-scripts/test-bash-invocation.sh` | Static lint over `skills/*/scripts/*` | Helper-to-helper calls go through an interpreter (1–29) | — |

### Where dryRun counts and baselines live

- **Coordinator.** The current baseline is replay 44 / 19 / 21
  (`coordinator-workflow.md:1395`). The dispatch-count arithmetic is at 1727–1734. "No
  Workflow-hosted run has been recorded against this revision yet" (1743–1744). Standing rule: a
  baseline is evidence only for the revision it ran against (1364–1368). Re-run the harness
  "after any edit to the script block — structural or prompt-text alike" (1453–1454).
- **Roast.** The canonical PR dryRun asserts 22 agents, 23 with a dead reporter, and 22 with an
  unsettled panel (736, 745, 748). The design-mode dryRun asserts 6 or 7 scouts (807–812). Every
  recorded Workflow baseline is marked superseded (789, 819, 881), and "a fresh topology dryRun is
  still owed" (941–943). "Data edits skip it — lane rosters, prompt wording, caps, model tiers"
  (671–673).
- **Release.** The release checklist runs the six suites, plus the dryRuns only when an engine
  file changed (`AGENTS.md:121-130`).

### Outcome instrumentation that exists today

- **Coordinator `Detector:` line, one per round** (`coordinator.js:1293-1307`): ready ·
  topped-up · cap · peak in-flight · top-up queries · stacked/cancelled · merge-queue peak · idle
  slots · waiting on deps · hot-file.
- **Four `Metrics:` lines** (harness 2240–2243): merges, completion kinds including
  "dispatched early", fix-pass outcomes, ledger-check.
- **Roast report header:** the `coverage:` line (raw → deduped → panel/spot) and the
  `seat-agreement:` line.
- **super-design scripts:** `graph-shape` (depth and width), `requirements-tally`, and
  `coverage-divergence`.
- **Recurring minors:** minors carrying a `[class]` tag cluster across tasks (harness 1632–1649,
  1756–1768).
- **Token usage:** `analyze-token-usage.py` breaks token usage down per subagent from session
  transcripts (1–5).
- **What does not exist:** the coordinator records no timestamps. A grep of `coordinator.js` for
  `Date.now`, `new Date` or `timestamp` finds nothing.

## Findings

**A7-F01 · observed — the replay harness is the only executable check on the coordinator, and it is cheap.**
It reports 1501 assertions over 130 scenarios, runs in 30 s with no model spend, and passed
today. It covers topology, routing, the null-dispatch policy, invariants and script behavior. It
also checks prompt text as dispatched (live-sim). The same count was recorded on 2026-10-03
(`2026-10-03-ordinary-subagent-fallback-eval.md:26`); the 2026-10-01 run recorded 1385
(`runs/2026-10-01-…/report.md:24`).
*Implication (a)/(b):* scheduling changes such as contract-first beads, or planner schema
changes, can be regression-tested offline for free. Nothing here measures what the agents
produce.

**A7-F02 · observed — the content of prompt templates is pinned only by literal regexes.**
The implementer template is pinned at 8 check sites, about 17 regexes in all
(`replay-harness.mjs:516, 532-536, 1549, 2183`).
The reviewer template has 7: "You are read-only", "Don't run tests", "CLEAN when there is no ❌
item and no Critical or Important issue", Issues before Strengths, INVALID / `cd [WORKTREE]`
first, the write fence, and the `[class]` tag (537–539, 1612, 1767, 2184). The planner template
is checked only for its path (474). `coordinator-subagents.md`, the fallback procedure, has no
test at all.
*Implication (a):* a reviewer-rubric or planner-brief change passes the suite as long as those
literals survive. The suite cannot show that the change alters behavior. A change to the
fallback procedure is untested.

**A7-F03 · observed — changing `coordinator.js` couples three recorded artifacts.**
The first is the template-literal baseline, currently **398**, which must move with any
deliberate add or remove of a literal (`replay-harness.mjs:369-383`). The second is the dryRun
counts with their stub table and count arithmetic (`coordinator-workflow.md:1673-1734`). The
third is the revision table (1370–1395).
*Implication:* a contract-first dispatch key, or a new `mapping` field in the `PLANNED` schema
(`coordinator.js:245`), means updating all three together. Prompt-only `.md` edits change none
of them.

**A7-F04 · observed/gap — roast engine routing has no committed test and no current dryRun baseline.**
The engine mock covers 4 prompt-flow scenarios (`engine-mock.mjs:3`). The 11-case failure-path
table (`super-roast-workflow.md:768-781`) was checked ad hoc and never committed (944–955). The
grep above finds none of those fields in `tests/`. Every recorded Workflow baseline is superseded
(789, 819, 881, 941–943).
*Implication (b):* a new lane is a data edit, so no dryRun is required (671–673). Any engine
change made for that lane, such as a lane-specific severity or route, would land with no baseline
and no committed routing test.

**A7-F05 · observed — a new roast lane breaks hard-coded roster assertions.**
- **Test literals:** `test-assemble-args.sh:27` pins the PR core lanes
  `correctness,security,premortem,simplicity-design,hot-path-perf,concurrency-async`. Line 28
  pins "13" lane prompts in round 1. Line 44 pins the design lenses
  `premortem,completeness,yagni,failure-mode,feasibility | security,maintainer`.
- **Roster sources:** the rosters are parsed from `triage-prompt.md:32-33` and from the
  `config.coreLenses`/`widenLenses` lines in SKILL.md (`assemble-args.mjs:157-159`).
- **Lane block:** each lane needs a `## Lane: <name>` block, or assembly fails with a drift
  error (183–191).
- **Doc count:** the scout count "5–8 design / 6–13 PR" sits at `super-roast-workflow.md:15`.
- **Mock tolerance:** the engine mock accepts any new `scout:` label (`engine-mock.mjs:26`).
- **Content checks:** lane prompts are checked only for which policy section they carry
  (`test-assemble-args.sh:35`, `engine-mock.mjs:57-61`).

*Implication (b):* adding a lane means updating three test literals and one doc count. The
lane's wording stays untested offline. `simplicity-design` is already a core PR lane.

**A7-F06 · observed — roast-quality evals exist, each on a single fixture.**
1. **Judge seats** (`plans/eval/2026-07-28-judge-seats/eval-record.md`). One ~44-line planted
   spec with 4 findings. Three identical judges confirmed false positive F2 2/3 (13–15). The
   three-seat panel gave F2 0/3 and the real gap F4 3/3 (27–30). The record calls itself "a
   targeted defect demonstration … not a calibrated benchmark" (46–49). The planted finding texts
   are only summarized there; the fixture spec was vendored in `ccf473d`.
2. **Roast eval 2026-06-13.** One spec with 5 planted problems (15–20). Results are scenario
   PASS/FAIL for S1–S5 and A1–A3, with no per-defect recall (46–61). The self-roast confirmed
   16/19 findings, 3 rejected (65).
3. **Planted-defect PR branch.** Two planted defects: a concatenated SQL string and an
   unbounded cache (`plans/2026-07-29-super-roast.md:340`). Both surfaced. The injection was
   confirmed 3/3 but graded Should-fix rather than the planned Blocking. The cache came out as an
   escalation with a dead seat (`reviews/…planted-defect-branch-roast-1.md:22-25, 60`). Thirty
   judge seats died on the session limit, and the run cost 2.07M tokens (commit `3cb9099`).

No precision or recall figure exists over more than one fixture or more than one run.

**A7-F07 · observed — live seat agreement is recorded; it measures reliability, not accuracy.**
All four are from the 2026-10-01 run (`runs/2026-10-01-…/*-roast-*.md`, header lines 7–8):

| Roast | Panels | rr | rg | fg | Unanimous | ground-loo | Cited |
|---|---|---|---|---|---|---|---|
| design-1 | 31 | .77 | .81 | .65 | .61 | .79 (n=24) | :7 |
| PR-1 | 17 | .76 | .82 | .82 | .71 | .92 (n=13) | :7 |
| design-2 | 11 | .82 | .55 | .36 | .36 | .44 (n=9) | :8 |
| PR-2 | 3 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 (n=3) | :8 |

None of these findings carries a ground-truth label.
*Implication (b):* seat agreement is a cheap before/after signal for a design lane. It cannot
stand in for correctness.

**A7-F08 · observed — the planted-defect run produced design findings, and the materiality bar or the caps filtered them out.**
In `planted-defect-branch-roast-1.md`:
- "runOnce carries four responsibilities" was rejected, because "no stated contract or existing
  test scaffolding demands the decomposition" (45).
- "hard module-scope require rather than an injected dependency" was beyond the panel cap (38).
- The "whole CLI args bag" finding and the "speculative library surface" finding stayed
  unverified Nits (54–55).

The seats' shared core reads: "Material means material against the spec's stated requirements,
contract, and scope" (`judge-seat-prompts.md:35-40`).
*Implication (b), inference:* a design lane's findings will be rejected unless the design rule is
part of the stated contract. This run is a ready-made RED baseline.

**A7-F09 · gap — nothing evaluates the design or maintainability of the code a run produces.**
- **Task reviewer:** told to "Keep it light … don't spend this pass on polish". Polish, naming
  and style are Minor and "not fixed in this pass" (`task-reviewer-prompt.md:10-12, 90-91`).
- **Cross-task signal:** the only one is the `[class]`-tag recurrence (110–114; harness
  1632–1649).
- **Metrics:** cover merges, completions, fix passes and ledger-check only (2240–2243).
- **What is tested:** the plan-mandated design-defect path, declined and then parked, is tested
  (harness 558–575; dryRun scenario `coordinator-workflow.md:1944-1955`).
- **What is missing:** no fixture, coupling or duplication metric, or mutated-requirement
  (evolvability) check exists in `tests/` or any eval record. I searched the six suites, the
  `plans/eval/` records, and grepped `docs/`.

**A7-F10 · observed/gap — parallelism is measured as structure, not time.**
- **Structural measures:** the Detector and Metrics counts. The harness checks order through
  trace indices and `waitFor`, and concurrency through `maxOpen`, with no clock.
- **Wall clock exists only as hand-written notes:**
  - 121 agents in 74 min, then a resume of 107 agents in 7.8 h
    (`runs/2026-09-04-…/run.md:32`).
  - A design roast of 138 agents, 7.78M tokens, 56 min
    (`plans/2026-07-29-super-roast.md:341, 346`).
  - "peak in-flight of 2–3 against a cap of 8, bounded by the chain depth of 7. Early unblock
    dispatched 7 tasks early" (`runs/2026-10-01-…/report.md:50`).
  - A graph diagnosis counted in rounds (commit `944da17`).
- **Missing:** per-dispatch start and end timestamps, critical-path time against wall clock,
  tokens per role, and any controlled before/after throughput comparison.

**A7-F11 · observed — super-design already has contract-first beads, tested only at script level.**
- **What the bead is:** `Seam contract: <boundary>` delivers compilable boundary code. Every
  participant gets a `consumes boundary contract` edge onto it (`super-design/SKILL.md:500`).
- **Script tests:** graph-shape counts those edges as exempt (`test-scripts.sh:99-107`,
  `fixtures/graph.json:97, 163`). coverage-inputs passes the `boundary contract:` lines through
  (`test-scripts.sh:125-149`, `cov-tree.json:6`). super-code's `tree-shape` delegates to
  graph-shape (`tree-shape:19`; harness 3028–3050). The composed seam review checks a consumer
  against the producer's interface (harness 1785–1794).
- **Gap:** every graph-mode replay fixture is a 1→1 chain, a 3-link chain, or a 2→1 fan-in
  (2271–2600). None has one parent with two or more stacked dependents.

**A7-F12 · observed — the super-auto contract lint constrains both prose and schema.**
- `check_counts` rejects a numeric count that points at a list, such as "three design
  principles", in the super-auto runtime files (`test-contract-lint.sh:18, 139-157`).
- `check_baseline` freezes the field table and the phase sequence against the `2bf1d53` fixtures
  (159–174, `fixtures/contract-lint/*`).
- A new run-state field has to be added to the fixture. There is precedent: `codeMechanism`
  (`fallback-eval.md:30`).

**A7-F13 · observed/gap — super-* behavior is evaluated by fresh-subagent probes and single live runs, never drill.**
- **SDD autonomous eval:** scenarios S1–S4 and A1–A2 PASS (`sdd-autonomous-eval.md:42-54`).
- **Fallback eval:** 3 probe scenarios plus a one-task live fixture. "The pressure probes tested
  instruction choices, not all live branches" (`fallback-eval.md:11-13, 34-36`).
- **super-auto probe:** 6 scenarios, branch matches or beats base on 5/6
  (`behavioral-probe-2026-10-02.md:1-7`).
- **Drill:** "No Drill eval was run" (`runs/2026-10-01-…/report.md:64`). Docs name only upstream
  drill scenarios, including `spec-reviewer-catches-planted-flaws.yaml` and
  `code-review-catches-planted-bugs.yaml` (`lift-drill-into-evals-design.md:95-96`).
- **Policy:** CLAUDE.md and `AGENTS.md:93-100` require before/after evals for skill changes.

**A7-F14 · observed — the method and precedent for an A/B eval already exist.**
- **Guidance in writing-skills** (`SKILL.md:459-474, 575-585`): micro-tests take one fresh sample
  per call, include a no-guidance control, run 5 or more reps per variant, read every flagged
  match by hand, and treat variance as a metric. Prohibitions backfire on shaping failures; a
  recipe or a required slot works.
- **Skill type:** "Pattern skills: reducing-complexity, information-hiding" are tested with
  recognition, application and counter-example scenarios (422–431).
- **Precedent:** the 2026-07-06 eval used a fixture-generator script, 4 cells × 5 reps, and
  `tool_uses` as a cost proxy (`2026-07-06-…-eval-results.md:145-152, 233-260`).
- **The closest earlier design-incentive eval** is commit `8e1262a` (writing-plans): Interfaces
  blocks went "0 → 100% of tasks, exact signatures", and the run needed "1 fix wave vs control's
  2-4". Its log lives in the external evals repo.

**A7-F15 · observed — two docs drift from the code.**
- `docs/testing.md:10-20` lists only upstream suites. The fork's release suites are listed in
  `AGENTS.md:121-128`.
- `README.md:56` still describes "a five-round fix breaker", but the current loop is the D4 loop
  with no round cap (`coordinator-workflow.md:1389`).

*Implication:* the research should cite AGENTS.md and the workflow docs, not these two.

**A7-F16 · observed/inference — what the evals cost.**

| Kind | Cost | Source |
|---|---|---|
| Offline suites | ~145 s, $0 | measured today |
| dryRun | one haiku stub call per agent: 22 for the roast canonical scenario; 44 / 19 / 21 for the coordinator scenarios | `super-roast-workflow.md:656-658` |
| Live roast, design mode | 138 agents, 7.78M tokens, 56 min | `plans/2026-07-29-super-roast.md:341, 346` |
| Live roast, PR mode | 2.07M tokens | commit `3cb9099` |
| Live coordinator | 121 agents in 74 min | `runs/2026-09-04-…/run.md:32` |
| Drill scenario | 3–30+ min each | `docs/testing.md:35` |

*Inference:* applying the engine's formula (`super-roast-workflow.md:17`) to the 2026-10-01
coverage lines gives 137, 47, 95 and 25 agents for its four roasts.

## Extension points

**New roast lane.**
- **Prompt and roster edits:** a `## Lane:` block in `scout-prompts-pr.md`; the core or
  conditional list at `triage-prompt.md:32-44`; for design mode, the `config.coreLenses` line in
  SKILL.md. All are data edits.
- **Test and doc updates:** the literals at `test-assemble-args.sh:27-28/44` and the count at
  `super-roast-workflow.md:15`.
- **Optional:** an engine-mock scenario that gives the lane a planted finding (pattern at
  `engine-mock.mjs:24-25`).

**Reviewer-rubric or planner-brief change.**
- **Text:** edit the `.md` templates, and keep the pinned literals (F02) or update them at the
  cited harness lines.
- **New test:** add a dispatch-text check modeled on the "templates" scenario (530–540), using
  `promptOf`.
- **Fallback:** mirror the change in `coordinator-subagents.md`, which has no test.

**Contract-first beads.**
- **Harness:** add a fan-out scenario with `graphCanned` (2255–2267) and `waitFor`. Check that N
  participants are stacked before `merge:<contract>`, that `maxOpen.impl ≥ N`, that all N merge
  afterwards, and that all N are cancelled when the contract is BLOCKED (the pattern at
  2387–2412). Also check the `stacked N` Detector field and the "dispatched early" Metrics count.
- **Planner schema:** new mapping fields go into `PLANNED` (`coordinator.js:245`). Then update
  the stub-table JSON (`coordinator-workflow.md:1827`), the count arithmetic, and the span
  baseline.
- **super-design fixtures:** extend `graph.json` and `cov-tree.json`.

**Feasible before/after evals with existing tooling.**
1. **Planted design defects on a throwaway branch,** reusing the collect-metrics method: a
   hard-wired dependency, a god function, duplicated logic at two call sites, a leaky interface,
   plus a plan-mandated tradeoff as a control. Run RED (today's roster) against GREEN (new lane
   or rubric) and score each planted item: surfaced, confirmed, severity, false confirmations.
   The F08 report is the RED baseline.
2. **Judge-seat style materiality test:** contract-anchored design gaps against taste-only
   findings.
3. **Micro-tests of planner and implementer wording** on a fixture task: 5 or more reps, a
   control arm, manual scoring.
4. **Mutated requirement (evolvability):** give a follow-up task to the code each arm produced
   and compare `git diff --stat` file counts. This needs only git. No such script exists yet.
5. **Replay scenarios for early unblock under fan-out:** offline, $0.
6. **A toy git+beads live fixture,** like the 2026-10-03 one, run with `earlyUnblock` on and
   off. Record the Detector lines and wall clock by hand.

**Must stay untouched:**
- the single-flight merge invariant (asserted throughout);
- disjoint buckets;
- the D4 one-fix-pass loop: "no re-review, adjudicator, or breaker dispatch exists" (harness 402);
- the null-dispatch policy;
- the exact stub phrasing (`super-roast-workflow.md:688-696`);
- the materiality sentence, which is eval-validated (commit `5cc7574`) and should change only
  with a new eval.

## Constraints and costs

- **Release gate:** the six suites listed in `AGENTS.md:121-128`; dryRuns only when an engine
  file changed (130).
- **Coordinator baselines:** valid only for the exact revision they ran against
  (`coordinator-workflow.md:1364-1368`). The span baseline is 398. The replay counts are 44 / 19
  / 21.
- **Roast data edits:** lane rosters and prompt wording skip the dryRun
  (`super-roast-workflow.md:671-673`).
- **super-auto contract lint:** no numeric list counts in runtime prose; field and phase
  baselines are frozen (F12).
- **Philosophy:**
  - Skill changes require eval evidence; tuned content changes only with evidence
    (`AGENTS.md:93-100`).
  - "Skills avoid overconstraining", and "SKILL.md carries no history": eval records belong in
    `docs/superpowers/plans/eval/` or MAINTENANCE.md (MEMORY index).
  - "Autonomous runs degrade, don't stop."
- **Costs:** see F16. A RED/GREEN live roast pair on one PR fixture is roughly 2 × 2M tokens,
  inferred from the recorded PR run.

## Open questions

1. What counts as ground truth for "good design" in a scored eval? The repo has no rubric or
   labelled corpus.
2. Can drill (`evals/`, not cloned here) host multi-agent super-* runs inside its 3–30 min
   envelope? Does it already have super-* scenarios?
3. Do the Workflow journals hold per-dispatch timings? They are session-local and absent from the
   repo (`super-roast-workflow.md:866-871`).
4. Does seat agreement track correctness for design findings in particular?
5. In past roasts, how often were design-lane findings rejected compared with correctness
   findings? The reports do not tag findings by lane, so I sampled only the planted-defect report.
