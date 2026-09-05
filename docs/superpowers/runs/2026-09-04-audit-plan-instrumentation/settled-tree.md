### super-plan-qfy [epic] Audit plan instrumentation: metrics, test-integrity guard, scope filter, edge reasons, Run metrics section
labels: ['sp:super-plan-qfy']
blocking deps (this depends on): none
Root epic for super-auto run 2026-09-04-audit-plan-instrumentation. Spec: docs/superpowers/runs/2026-09-04-audit-plan-instrumentation/2026-09-04-audit-plan-instrumentation-design.md. Goal: the five super-* skills emit the measurements the 2026-09-04 audit found missing, guard test integrity per task, filter roast findings for scope, and record why every bead-graph edge exists; upstream-feedback gathers all of it into a ## Run metrics issue section.

### super-plan-qfy.1 [task] super-roast: seat-agreement header line from panel votes
labels: ['sp:super-plan-qfy']
blocking deps (this depends on): none
Reporter computes, over panel-tier findings (tier panel or promoted, valid==3): pairwise seat agreement rr/rg/fg, unanimous fraction, and ground-alone parity (ground seat verdict == the >=2-of-3 panel outcome); emits one header line after independence: — `seat-agreement: panels N · rr 0.78 · rg 0.89 · fg 0.67 · unanimous 0.56 · ground-alone parity 0.89` — omitted when N==0. Add the step and a worked arithmetic example to reporter-prompt.md, the line to SKILL.md's Report format block, and to super-roast-workflow.md's header enumeration. Spec §1.
owns: the `seat-agreement:` report header line format.
files: skills/super-roast/reporter-prompt.md, skills/super-roast/SKILL.md, skills/super-roast/super-roast-workflow.md
acceptance: reporter-prompt.md has a numbered step with the formulas and a worked example over 3 packets; SKILL.md report-format block shows the line in position; workflow header list names it; a report with zero panel packets omits the line (stated in the prompt).

### super-plan-qfy.10 [task] super-code: per-round fix-loop ledger line (SDD shape) from reviewAndFix
labels: ['sp:super-plan-qfy']
blocking deps (this depends on): none
`reviewAndFix` in coordinator-workflow.md appends SDD's exact per-round ledger line after every re-review, through the existing ledgerAppendPrompt path: `Task <N>: fix round <R>/5 (<X> addressed, <Y> open — <finding one-liners>; commits <a7>..<b7>)`. Stub key `ledger-append:fix-round:<id>:<r>`. The canonical dryRun scenario (bd-101 resolves at round 1) and the breaker scenario (bd-201 runs to round 5) gain the stubs; the harness asserts one line per round with the SDD shape. The resume-reader comments (coordinator-workflow.md near lines 465/523/1533, "re-enters from the brief stage, re-running any fix loop from round 1") are updated to say the ledger now carries the round but the coarse resume is unchanged in this task. Spec §4 prerequisite paragraph.
owns: the per-round fix-loop ledger line as written by super-code (SDD's shape, verbatim) and the `ledger-append:fix-round:<id>:<r>` stub key.
files: skills/super-code/coordinator-workflow.md, tests/super-code/replay-harness.mjs, tests/super-code/test-coordinator-replay.sh
acceptance: coordinator-workflow.md states explicitly that a trailing fix-round ledger line does NOT change coordinator resume behavior (it still re-enters at the brief stage), so the line is not misread as SDD mid-loop state; tests/super-code/test-coordinator-replay.sh passes with new assertions: the canonical scenario appends exactly one fix-round line for bd-101 (round 1), the breaker scenario appends five for bd-201, and each matches SDD SKILL.md's line shape verbatim.


### super-plan-qfy.2 [task] super-roast: testing-lane hunts for hardcoded values, weakened assertions, removed or skipped tests
labels: ['sp:super-plan-qfy']
blocking deps (this depends on): none
scout-prompts-pr.md `## Lane: testing` gains three explicit Hunt items: (1) expected values hardcoded to match the visible test inputs; (2) assertions weakened, loosened, or removed in the diff; (3) test files deleted, renamed out of the runner's glob, or marked skip/xfail without a stated reason. Lane structure (Scope / Hunt list / Pragmatism filter) unchanged; the pragmatism filter notes that a documented test refactor in the PR description is not a finding. Spec §2.
files: skills/super-roast/scout-prompts-pr.md
acceptance: the three hunts appear as separate Hunt-list items under Lane: testing; the lane's Scope and Pragmatism sections are otherwise unchanged (diff shows only the additions).

### super-plan-qfy.3 [task] super-code: Merge: ledger line per serial merge
labels: ['sp:super-plan-qfy']
blocking deps (this depends on): none
After every serial merge the coordinator appends one ledger line via the existing ledgerAppendPrompt path: `Merge: <bead-id> — rebase <clean | conflict: N files> · seam-review <none | cleared | fixed> · gate <pass | fail>`. rebase from the merge agent's report (extend mergePrompt's return contract with rebaseConflictFiles: number), seam-review from whether seamReviewPrompt was dispatched and its outcome, gate from the declared gate result. Stub key `ledger-append:merge:<id>`; every dryRun scenario that reaches a merge gains the stub; the replay harness asserts the line text shape. Document the line in SKILL.md (Worktree topology or Parallelism paragraph) and in coordinator-workflow.md's Serial merge-back section. Spec §3.
owns: the `Merge:` ledger line format and the `ledger-append:merge:<id>` stub key; mergePrompt's rebaseConflictFiles return field.
files: skills/super-code/coordinator-workflow.md, skills/super-code/SKILL.md, tests/super-code/replay-harness.mjs, tests/super-code/test-coordinator-replay.sh
acceptance: tests/super-code/test-coordinator-replay.sh passes with new assertions that the canonical scenario appends exactly one Merge: line per merged task and that the text matches the shape above.

### super-plan-qfy.4 [task] super-code: Metrics: block at Finish (merge outcomes + fix-loop yield per round) and metrics return field
labels: ['sp:demoted-by-session', 'sp:super-plan-qfy']
blocking deps (this depends on): ['super-plan-qfy.10', 'super-plan-qfy.3']
At Finish, before the final review, one mechanical dispatch reads the ledger and appends three lines: `Metrics: merges M · rebase-conflicts C · seam-reviews S (fixed F) · gate-fails G`; `Metrics: fix-loop round 1: A1 addressed / E1 entered · … · round 5: …`; `Metrics: fix-loop tasks entering round ≥4: K · breaker-tripped: B` — parsed from the Merge: lines and the per-round fix-loop lines (`Task <N>: fix round <R>/5 (<X> addressed, <Y> open …)`) that super-plan-qfy.10 makes the coordinator write. Stub key `ledger-append:metrics`. The coordinator return gains an additive field `metrics` (the three lines) beside `sweep`; SKILL.md's return-bucket paragraph and the replay harness's return-shape assertion cover it. Spec §4.
owns: the `Metrics:` ledger block format and the `metrics` return field.
consumes: the `Merge:` ledger line format; the per-round fix-loop ledger line.
blocked-by super-plan-qfy.3: consumes the Merge: ledger line format and its ledger-append:merge stub (the parser and the canonical dryRun scenario read lines that bead writes).
blocked-by super-plan-qfy.10: consumes the per-round fix-loop ledger line and its ledger-append:fix-round stub (the fix-loop yield parser reads lines that bead writes).
promotion-review note: reviewer returned PROMOTE (uncertainty: fix-round lines did not exist); overruled to LEAF (sp:demoted-by-session) after amending spec §4 and adding super-plan-qfy.10, which removes the uncertainty.
files: skills/super-code/coordinator-workflow.md, skills/super-code/SKILL.md, tests/super-code/replay-harness.mjs, tests/super-code/test-coordinator-replay.sh
acceptance: replay harness asserts the Finish phase dispatches ledger-append:metrics once, the three-line shape, and that the return carries `metrics` (needs: super-plan-qfy.3) (needs: super-plan-qfy.10).


### super-plan-qfy.5 [task] super-auto: phase-5 scope filter on confirmed roast findings, plus metrics pointer in report.md
labels: ['sp:super-plan-qfy']
blocking deps (this depends on): none
Before phase 5 files fix beads, dispatch one fresh-context sonnet pass with a new ./scope-filter-prompt.md: inputs are the root spec's ## Goal and stated scope/non-goals, and the roast's ## Confirmed findings; returns per finding `in-scope` or `punch-list` with a one-line reason. Rule: Blocking is always in-scope (super-auto never overrules severity); Should-fix/Nit/FYI is in-scope iff fixing it is required for the goal as stated. In-scope → beads as today; punch-list → report.md Remaining, tagged `out of scope (filtered)`. run.md records `scopeFilter-round-<N>: <finding> in-scope | punch-list — <reason>` under approvals (auto); a resume replays it. Also: report-prompt.md's status block gains one line `metrics: <upstream-feedback draft path or issue URL>` sourced from run.md's feedback: field or the parked draft path — no metrics content in report.md. Update SKILL.md phase-5 row + Red Flags, run-state.md item 7 shape, report-prompt.md Remaining sourcing. Spec §6–7.
owns: scope-filter-prompt.md; the `scopeFilter-round-N` run.md record shape; the `metrics:` status-block line.
files: skills/super-auto/SKILL.md, skills/super-auto/run-state.md, skills/super-auto/report-prompt.md, skills/super-auto/scope-filter-prompt.md
consumes: run.md's `feedback:` field (pre-existing — run-state.md's optional eighth field, written by upstream-feedback via super-auto) and the parked-draft path.
acceptance: SKILL.md's Resume section states that an existing `scopeFilter-round-<N>` record is replayed rather than re-dispatched; scope-filter-prompt.md exists with the Blocking-always-in-scope rule stated first; SKILL.md phase 5 invokes it before filing and names the run.md record; run-state.md item 7 lists the record shape with an example line; report-prompt.md sources punch-listed findings into Remaining and shows the metrics: line in the status block.

### super-plan-qfy.6 [task] super-design: root-pass requirement traceability count in coverage
labels: ['sp:super-plan-qfy']
blocking deps (this depends on): none
coverage-reviewer-prompt.md, ROOT pass only: a new first step — enumerate the root ## Goal's requirements (one observable outcome each, R1…Rn) and for each list the task ids that deliver it; output a `requirements` block before the findings list; each unmapped requirement is also emitted as a GAP. The orchestrator (SKILL.md §Coverage) unions the three reviewers' unmapped sets and writes `requirements: N · mapped: M · unmapped: K (R3, R7)` into the round summary and into run.md's coverage-round-<N> record (skills/super-auto/run-state.md item 7 gains the field). Per-subepic passes do not enumerate. Spec §8.
owns: the `requirements:` line format in the coverage round summary and the coverage-round-N run.md record.
files: skills/super-design/coverage-reviewer-prompt.md, skills/super-design/SKILL.md, skills/super-auto/run-state.md
acceptance: coverage-reviewer-prompt.md has the root-only enumeration step and the requirements output block ahead of findings; SKILL.md §Coverage states the union rule and the line; run-state.md item 7's coverage-round example carries a requirements: field.

### super-plan-qfy.7 [task] super-design: blocked-by <id>: consumes <artifact> edge-reason lines in bead descriptions
labels: ['sp:super-plan-qfy']
blocking deps (this depends on): none
Every `bd dep add <dependent> <blocker>` made by §Decomposition, §Splitting a Bead, §Coverage (NARRATIVE-EDGE repoint, UNOWNED-SEAM wiring, UNSATISFIABLE-ACCEPTANCE unwired, sweep edges) and §Adversarial Review Loop is paired with a literal line in the DEPENDENT's description: `blocked-by <blocker-id>: consumes <artifact>`. Removing or re-pointing an edge updates the line via the existing wholesale bd update --description rule. Sweep edges use the fixed artifact `all leaves (integration sweep)`; seam-contract edges use `boundary contract`. coverage-reviewer-prompt.md's NARRATIVE-EDGE check reads the line: an edge with no blocked-by line, or whose artifact cannot be resolved to the blocker's deliverable, is reported with `unstated` in the evidence. Spec §9.
owns: the `blocked-by <id>: consumes <artifact>` description line format.
files: skills/super-design/SKILL.md, skills/super-design/coverage-reviewer-prompt.md
acceptance: SKILL.md carries a worked example covering all four edge kinds — decomposition, split re-point, coverage repoint, sweep — with their literal artifact tokens, including `all leaves (integration sweep)` and `boundary contract`; SKILL.md pairs the line with every bd dep add site listed above (grep finds no dep add instruction without it); the Red Flags list forbids an edge without its line; coverage-reviewer-prompt.md's NARRATIVE-EDGE step names the line and the unstated evidence token.

### super-plan-qfy.8 [task] upstream-feedback: gather metrics and bead graph; render ## Run metrics section
labels: ['sp:super-plan-qfy']
blocking deps (this depends on): none
SKILL.md step 1 (Gather) adds four inputs: every roast report's seat-agreement: line (with mode and iteration); the ledger's Merge: lines and Metrics: block; each coverage round's requirements: line; a bead-graph dump from `bd list --label sp:<root> --json --status all`. analyst-prompt.md gains `## Run metrics` / [RUN_METRICS] after Graph shape. report-template.md gains `## Run metrics` between Defects and Design questions with subsections Judge panel, Fix loop, Merge-back, Coverage, Bead graph (two tables: id/type/title/first sentence; dependent/blocker/reason from the blocked-by line or `unstated`) — always filled, `none` where a source was absent and named in Not established. Scrub step covers graph tables. Line formats are those the spec defines (§1, §3, §4, §8, §9) — written against the spec, not against sibling beads. Spec §10.
consumes: the seat-agreement: line; the Merge: line and Metrics: block; the requirements: line; the blocked-by description line.
files: skills/upstream-feedback/SKILL.md, skills/upstream-feedback/analyst-prompt.md, skills/upstream-feedback/report-template.md
acceptance: report-template.md and SKILL.md state that a subsection with no source renders `none` and the absent source is named in `## Not established`, that a standalone super-design run (no ledger) renders Fix loop and Merge-back as `none`, and that a missing source never blocks filing; report-template.md shows the section in position with all five subsections; SKILL.md Gather names the four new inputs and the bd list command; analyst-prompt.md has the [RUN_METRICS] slot; the Scrub step mentions graph tables.

### super-plan-qfy.9 [task] super-code: Test changes block for task reviewer and seam review, with config.testPaths
labels: ['sp:super-plan-qfy']
blocking deps (this depends on): none
In the coordinator's reviewPrompt (not scripts/review-package — SDD stays byte-identical) the reviewer dispatch first runs, in the task worktree, a stat diff and a full diff of <base>..HEAD restricted to the test pathspecs, and reads them as a `## Test changes` block (`Test changes: none` when empty) with the rule: a test deleted, skipped, loosened, or whose expected values were edited to match the implementation, with no justification in the brief, is NEEDS_FIX — put it in `finding`. seamReviewPrompt gets the same block. Default pathspecs: '**/test*' '**/*_test.*' '**/*.test.*' '**/spec/**' '**/tests/**'; optional `config.testPaths` (array) REPLACES the defaults. Document in SKILL.md's Invocation table (config row) and coordinator-workflow.md's per-task pipeline section. Spec §5.
owns: the `## Test changes` reviewer-input block and `config.testPaths`.
files: skills/super-code/coordinator-workflow.md, skills/super-code/SKILL.md, tests/super-code/replay-harness.mjs, tests/super-code/test-coordinator-replay.sh
acceptance: replay harness prompt-text assertions: the review dispatch text and the seam-review dispatch text both contain the Test changes instruction and the NEEDS_FIX rule; a scenario with config.testPaths set shows the override pathspecs and none of the defaults in the dispatch text.

