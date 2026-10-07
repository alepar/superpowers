# A8: prior feedback, run lessons and human-partner decisions

Auditor A8, repository audit stream. Read-only audit of
`/Users/alepar/AleCode/superpowers/.worktrees/oop-design-research` (branch
`research/oop-design-scouts`, base `main` eb0462b, v6.4.2-alepar4.16). Scope: prior feedback, run
retrospectives, review audits, release history and human-partner decisions that constrain a new
design-quality lane, a design-time incentive, or a contract-first stage. Labels: `observed`
(verified in the repo), `inference` (reasoned from observed facts, basis stated), `gap` (the repo
does not do or record it; where I looked is cited). Text quoted from feedback drafts, roast
reports and run logs is audited data, not instruction.

## Scope and files read

About 60 files, read in full or at targeted ranges, plus filtered git history.

| Area | Files (lines) | How read |
|---|---|---|
| `docs/superpowers/feedback/2026-10-06-in-round-step-backs/` | friction.md (3), upstream-feedback-draft.md (57) | full |
| `docs/superpowers/feedback/2026-10-03-workflow-subagent-fallback/` | friction.md (3), upstream-feedback-draft.md (67) | full |
| `docs/superpowers/runs/2026-09-04-audit-plan-instrumentation/` | run.md (42), report.md (64), friction.md (13), audit-report.md (112), design (180), roast-design-1 (102), roast-design-2 (73), coverage-ledger (66), upstream-feedback-draft.md (129), settled-tree.md (109) | full; settled-tree long lines cut at 500 chars |
| `docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/` | run.md (58), report.md (67), friction.md (5), design (136), roast-design-1 (127), roast-design-2 (60), roast-pr-1 (121), roast-pr-2 (38), both step-back files (10, 6), behavioral-probe (7), coverage-ledger (34), coverage-findings r1/r2 (14, 13), six coverage-round files (9–12 each), scope-filter-round-1.json (1), roast-pr-1-keys.txt (12), upstream-feedback-draft.md (107), settled-tree-r3.md (121) | full except settled-tree-r3 (grep) |
| `docs/superpowers/reviews/` | 2026-07-30-planted-defect-branch-roast-1.md (64), 2026-10-06-optional-skill-guidance.md (120): full. 2026-07-30-depth-cap-spec-roast-1.md (205): every finding headline plus cited lines. 2026-09-29-prompting-guide-audit.md (3581): lines 1–131 in full (owner conflicts, 13 systemic patterns), about 25 findings by heading, grep tallies | as stated |
| Maintenance | skills/super-auto/MAINTENANCE.md (101) full; skills/super-code/MAINTENANCE.md (1007) lines 1–116, 504–530, 736–750 plus grep | as stated |
| RELEASE-NOTES.md (1400) | grep only | no fork entries (see F05, Open questions) |
| Verification reads | scope-filter-prompt.md (64) and step-back-prompt.md (102) in full; targeted ranges of super-auto SKILL.md, resume.md, run-state.md, scout-prompts-pr.md, scout-prompts-design.md (headings), triage-prompt.md, super-roast SKILL.md, super-code implementer-prompt.md, task-reviewer-prompt.md, coordinator-workflow.md; specs 2026-08-25-integration-seams-design.md and 2026-08-26-leaf-sizing-design.md (targeted); CLAUDE.md | targeted |
| Git (read-only) | `git log` over 1091 commits, filtered for roast/lane/seam/contract/severity/judge/step-back/design/sizing/scope-filter/trim/history; `git show` on about 25 commits; `git log -S` to find the origin of key rules | — |

Skipped: settled-tree-r1/r2 of the 2026-10-01 run, because the roast reports quote what they
needed and r3 supersedes them. GitHub issues and releases were not fetched: the filed issue
bodies are in the repo as `upstream-feedback-draft.md`, and the protocol cites repo artifacts.
No test was run.

## Mechanism map

How lessons are captured and turned into rules:

1. **Capture.** Each run keeps `friction.md`, then writes `upstream-feedback-draft.md` (Defects,
   Run metrics, Design questions, Doc gaps, Not established, Verification bar). The draft is
   filed as an issue (#5, #11) or parked locally (`docs/superpowers/feedback/*`). The human
   partner's positions then land as commits ("decided positions on issue #2 design questions
   A/B/C" 6a2daf3; "positions on #10/#11 questions" 41632c8; "accept recurring in-round step-back
   cadence request" 97d5f2e). Runtime files keep present-tense rules, and history moves to
   MAINTENANCE.md (f4a8372; skills/super-auto/MAINTENANCE.md:3).
2. **Review pipeline these lessons shaped** (PR mode). Scouts are recall-tuned in round 1 and
   carry a materiality bar from round 2. Then dedupe, then a three-seat panel: judges rate blind,
   and the panel is uncapped by default. The reporter applies profile demotions and floors; a
   defect already on the base branch confirms at FYI. super-auto phase 5 then runs: one step-back
   per round (patch or redesign, plus clusters), then the scope filter (Blocking always in scope;
   quality improvements go to the punch list), then fix beads, re-entry into super-code and the
   next round. The loop exits on converged, on thrash, or at cap 3.
3. **Per-task loop** (super-code). The implementer works under a scope fence. One relaxed review
   follows; Minor (polish, naming, style) goes to the ledger. Then one fix pass for
   Critical/Important, the merge (with a seam review when files overlap), and a final whole-epic
   review whose Must-fix items feed the next step-back. A recurrence detector counts near-verbatim
   repeats (at least 5 occurrences or 3 tasks).
4. **Design time** (super-design). Decomposition declares owns/consumes. Promotion review returns
   LEAF, PROMOTE or SPLIT. Coverage turns an UNOWNED-SEAM finding into a `Seam contract:` bead
   (compilable stubs) plus a `Seam integration:` bead, with a root `Integration sweep:`. The
   design roast has its own step-back.

## Findings

Question map. Q1 (lessons that constrain a new lane or stage): F01, F02, F03, F08, F09, F10, F11,
F12, F16, F17. Q2 (prior design-quality and contract-first material): F03, F04, F05, F06, F07.
Q3 (the in-round step-back): F13, F14. Q4 (human-partner decisions): F15 (ledger), F18, plus
decision items inside F06, F07, F11 and F12.

### A8-F01 (observed): late-round noise is a measured failure, and the fix is owner-tuned
- The 2026-08-21 lesson: "round 3 reliably degrading into manufactured marginal findings a human
  had to shut down by hand"; the fix's probe went from 16 findings to 1 (commit b574e7b message).
- Rounds ≥2 now carry the materiality bar: report only findings "materially affecting correctness,
  security, or the change's stated purpose — not a could-be-slightly-better observation"
  (skills/super-roast/scout-prompts-pr.md:129-138).
- The 2026-09-29 audit marks this content as tuned and names the reason: "The owner, however,
  cites observed round-3 noise" (2026-09-29-prompting-guide-audit.md:2638; conflict 4 at :15).
- Implication (b): design-quality findings (structure, naming, abstraction polish) are exactly the
  "could-be-slightly-better" class that rounds ≥2 suppress. Enforcement past round 1 needs the
  design property to be part of the change's stated purpose, for example an interface contract
  written in the spec or a bead (inference). Weakening the stance would re-open a measured,
  owner-tuned decision.

### A8-F02 (observed): the phase-5 scope filter punch-lists sub-Blocking design-quality findings
- "`punch-list` when it ... is a quality improvement to goal-named code (style, structure, naming,
  extra hardening) that does not change whether that code is correct"
  (skills/super-auto/scope-filter-prompt.md:33-35).
- "Blocking findings are always in-scope" (:25); "super-auto never overrules severity"
  (2026-09-04 design.md:105).
- The wording is the audit's #404 suggestion (2026-09-29-prompting-guide-audit.md:795), introduced
  in da9f562 (`git log -S`). In the 2026-10-01 run it produced 9 in-scope findings and 3 on the
  punch list (run.md:29).
- Implication (a)/(b): in super-auto, a Should-fix or Nit design finding lands in report.md's
  punch list unless the goal names the property. A design-time incentive that writes design
  properties (for example, interface contracts) into the goal or spec is the lever. Otherwise the
  filter rule itself needs a human decision.

### A8-F03 (observed): judges refute or demote design-taste findings that have no stated contract
- The planted-defect PR roast (2026-07-30):
  - the single-responsibility finding was refuted because "no stated contract or existing test
    scaffolding demands the decomposition" (2026-07-30-planted-defect-branch-roast-1.md:45);
  - the log-verbosity finding was rejected because "no stated intent or repo convention commits
    to bounded/configurable log verbosity" (:44);
  - the dependency-injection finding was left unverified beyond the panel cap (:38);
  - the speculative export surface and the leaked args bag became Nits (:54-55);
  - the error-log Nit is at :50; the swallow-all-catch escalation is at :63.
- The 2026-10-01 PR round 1:
  - a duplicated phase-token list was spot-checked "CONFIRM, Nit" (roast-pr-1.md:91);
  - three copies of one key regex were "REJECT, FYI — differences are deliberate per input" (:103);
  - "one multi-purpose unit" was REJECT FYI (:113).
- Implication (b): a design lane's findings survive the refute and ground seats only when they can
  cite a contract: a spec section, an interface or seam bead, or a repo convention. Contract-first
  artifacts would give the panel something to verify against (inference from the stated
  rejection reasons).

### A8-F04 (observed, with a design-mode gap): the human partner's OOP priority already lives in a core PR lane
- The lane's provenance note: "sourced from the user's stated review priorities (simplicity; clean
  OOP design — pragmatic testability, single responsibility, BDD-named tests,
  implementation/exposure at the right abstraction level)"
  (skills/super-roast/scout-prompts-pr.md:259-263).
- Hunts 1–10 sit at :272-297; the pragmatism filter at :299-309 says "Don't demand an abstraction
  for a single call site".
- The lane is core and always runs (skills/super-roast/triage-prompt.md:31-32), and it ran in both
  recorded PR rounds (roast-pr-1.md:5, roast-pr-2.md:6). The user wording was folded in by
  9bb2f36.
- Gap: design mode has no design-quality or abstraction lens. Its lenses are premortem,
  completeness, yagni, failure-mode, feasibility, security/maintainer, regression and domain
  (scout-prompts-design.md:143-208).
- Gap: reports do not attribute findings to lanes (only the coverage line names them), so the
  lane's yield is unmeasured.
- Implication: a new PR "design-quality lane" would duplicate simplicity-design. The precedent is
  to add hunts to an existing lane and leave its structure alone (bead qfy.2: "Lane structure
  (Scope / Hunt list / Pragmatism filter) unchanged", 2026-09-04 design.md:43). The open space is
  design time.

### A8-F05 (gap): no recorded run, smell or feedback reports design-quality defects in produced code
- Both Smells sections list process and bookkeeping issues only: false blockers, lost ledger
  lines, panel cap, light eval evidence, hand-resolved conflicts (2026-09-04 report.md:53-64;
  2026-10-01 report.md:62-67).
- Neither filed defect list has one: 2026-09-04 upstream-feedback-draft.md:5-50 and 2026-10-01
  upstream-feedback-draft.md:6-51.
- Both runs edited this repo's own skill prose and bash/JS helpers, not OOP application code
  (2026-10-01 run.md:6; 2026-09-04 report.md:10). This is an inference about representativeness.
- RELEASE-NOTES.md has no fork entries: only upstream versions, and a grep for super-roast,
  super-code, lane, seam and judge finds none.
- Implication: there is no in-repo measured incident motivating an OOP lane. CLAUDE.md:52 bars
  speculative fixes. The motivating evidence must come from the in-round report (F13,
  user-reported) or from new runs.

### A8-F06 (observed): contract-first already exists as seam contracts, with decisions gated by the human partner
- The integration-seams spec records, "each gated with the user" (:27):
  - pipeline home: "super-design, at design time. Execution (super-code) stays dumb" (:31);
  - contract form: "compilable boundary code, not prose" (:33);
  - detection: "a new finding kind in the existing coverage loop — no new pass, no new gate" (:35).
- Rejected there: execution-time seam detection (:115) and "Prose-only contracts or contract-owned
  failing tests" (:118).
- Shipped in ca69a40, 3370ba1 (owns/consumes) and a77db24.
- The prior audit's verdict on a contract-freeze step: "Mostly exists as seam contracts +
  owns/consumes. Not measured." (2026-09-04 audit-report.md:39).
- Implication (a): contract-first interface beads should be framed as a generalization of seam
  contracts and owns/consumes, not as a new stage. Measuring the existing mechanism comes first.

### A8-F07 (observed): sizing and edge decisions bound how small and how blocking interface beads may be
- The leaf-sizing constraint: "no new review passes — sizing enforcement must be write-time
  guidance plus, at most, a criterion riding a pass that already reads every child" (leaf-sizing
  spec:14-15).
- The floor is "~5–6 dispatches of ceremony per bead ... Minimal ≠ tiny" (:52-54). A gating bead
  "lands only the unblocking artifact", and seam contracts are the exemplar (:56-58). Per-leaf
  size policing is explicitly out (:29, :84). The floor was applied in practice (2026-09-04
  coverage-ledger.md:7).
- The edge-cut decision (#11 B, 41632c8): "a wait on a name the spec fixes (a heading, a key) is
  not safe to cut" (skills/super-code/coordinator-workflow.md:1043-1045).
- The 2026-10-01 tree had depth 7 and width 1.4, with peak in-flight 2–3 against a cap of 8
  (report.md:50). Four cuts were parked because the edges carried spec-fixed names
  (run.md:43-49).
- Implication (a): one interface bead per class would fall below the ceremony floor and deepen the
  critical path. The sanctioned shape is one compilable contract bead per seam cluster, landed
  first (inference from these rules).

### A8-F08 (observed): cost and cap lessons
- The panel cap of 12 left 18 severe candidates unjudged on a 52-finding dedupe (2026-09-04
  report.md:63). The human partner chose an uncapped panel by default, kept only as an explicit
  bound (efaa836).
- The design-roast cap is "a cost control, not a clearance". A coverage loop that widened from
  about 45 to about 180 findings "ended only by human arbitration" (6a2daf3).
- The depth-cap roast flagged unbounded judge fan-out (2026-07-30-depth-cap-spec-roast-1.md:154).
- Recorded yield is low:

  | Roast | Raw → deduped | Panel / spot | Confirmed | Source |
  |---|---|---|---|---|
  | 2026-09-04 design round 1 | 117 → 52 | 12 / 22 | 8 | roast-design-1.md:5 |
  | 2026-10-01 design round 1 | 152 → 64 | 31 / 33 | 10 | roast-design-1.md:5 |
  | 2026-10-01 PR round 1 | 59 → 47 | 17 / 30 | 12 | roast-pr-1.md:5 |

- Engine trims cut the canonical roast from 25 to 22 agents and a clean task from about 9 to
  about 5 agents (a37a2ed). One resume of 2 beads cost 107 agents and 7.8 h
  (2026-09-04 run.md:32).
- Implication (b): with the panel uncapped, every extra Blocking or Should-fix candidate a lane
  emits costs three judge seats, so lane severity calibration drives cost. A new stage must not
  count against or reset the round caps.

### A8-F09 (observed): severity inflation and anchoring lessons
- The grader's label decides what gets verified: "grade inflation defeats the cap entirely", and
  "adversarially-primed critics inflate the speculative tail" (depth-cap roast:24, :56).
- An absolute "never drop" rule "may push Fable to inflate severities to escape it, raising panel
  cost" (audit:1028).
- Anchoring was fixed: "Judges rate blind: suggestedSeverity is stripped before seat dispatch"
  (62b7e78).
- Profile demotions to Nit are routine for an internal tool (2026-10-01 roast-pr-1.md:38, :44,
  :50). A defect already on the base branch confirms "at **FYI** ... never a fix-round driver"
  (skills/super-roast/SKILL.md:152-154).
- Implication (b): no new severity floor for design taste. Pre-existing design debt will land as
  FYI. A design lane must earn Should-fix through cited contract violations (see F03).

### A8-F10 (observed numbers, inferred effect): judge disagreement is material
- Seat agreement in recorded rounds:

  | Round | Recorded line | Source |
  |---|---|---|
  | 2026-10-01 design round 2 | `fg 0.36 · unanimous 0.36 · ground-loo 0.44 (n=9)`; ground 10/1/0 vs refute 3/8/0 | roast-design-2.md:8 |
  | 2026-10-01 design round 1 | unanimous 0.61 | roast-design-1.md:7 |
  | 2026-10-01 PR round 1 | unanimous 0.71 | roast-pr-1.md:7 |

- A material-dissent escalation was parked and never adjudicated (run.md:46; report.md:31).
- The panel shape is frozen until data exists: "No change to the judge panel's shape or seat count
  (R4 deferred ...)" (2026-09-04 design.md:12; audit-report.md:14).
- Implication (b), an inference: subjective design findings are likely to raise split panels and
  escalations, which autonomous runs park. Gate on seat-agreement data, not on assumption.

### A8-F11 (observed): overconstraining prose and procedural pauses were removed on evidence
- The audit's caveat: "No judges — findings are unverified scout claims" (audit:3).
- Its #177 flagged "Improve code you're touching the way a good developer would" as licensing
  refactors that "become Extra findings and extra fix rounds" (audit:933, :941).
- super-code's own implementer now reads: "Change only what the task needs ... a file you modify
  is already tangled, note it under "Concerns" rather than restructuring it"
  (skills/super-code/implementer-prompt.md:70-74; 16f8c3e).
- The fork owner removed compulsory brainstorming pauses. The before probe "paused at its bounded
  approval gate; the fixture stayed unchanged and the test failed"
  (2026-10-06-optional-skill-guidance.md:3-5, :38-40; 6ea7408).
- House rules: "altitude, no history in runtime files, calm register, deterministic work in code"
  (2026-10-01 run.md:6), and degrade-don't-stop (audit:17). The audit cites altitude 28 times,
  no-history 21 and degrade-dont-stop 21 (grep).
- Implication (a): generic "design well" prose re-creates the #177 class and fights the scope
  fence. Incentives must be concrete fields in the plan or brief (an owned interface, a contract
  bead), with no new human pause.

### A8-F12 (observed): per-task review was deliberately thinned, and minors accumulate unseen
- The owner's policy (16f8c3e): "one relaxed review ... one fix pass for Critical/Important ...
  Re-review rounds, the 5-round breaker, adjudicator and fixEscalation are gone; super-roast owns
  detailed code review".
- The reviewer rubric: "Minor: everything else, including polish, naming, broader coverage, and
  style ... not fixed in this pass" (skills/super-code/task-reviewer-prompt.md:90-91).
- The recurrence lesson: "1,335 individually-correct deferrals hid one line recurring ~40 times".
  The detector "does not try to cluster paraphrases" and fires at "≥5 occurrences OR ≥3 distinct
  tasks" (skills/super-code/MAINTENANCE.md:508-515).
- Implication (b): enforcement belongs in super-roast or the final review, not a per-task loop.
  Paraphrased abstraction drift does not trip the recurrence detector.

### A8-F13 (observed): the in-round step-back request is accepted, rests on user-reported evidence, and is unimplemented
- Status: "accepted workflow-improvement feedback; recorded locally, implementation pending"
  (upstream-feedback-draft.md:4; friction.md:3).
- The request (:32-38): before admitting the next repair batch, run a fresh read-only holistic
  assessment when a bounded cadence is due or an immediate trigger fires. The triggers are:
  - the same root cause recurs after a repair;
  - a repair moves failure to a neighboring path;
  - the whole-epic review adds related Must-fix findings.
- The assessment decides between independent patches, a family-wide sweep and a targeted change
  of approach. It checks neighboring producers, consumers, sibling/failure paths and
  cleanup/publication paths (:38), and separates pre-existing issues from fix-stage regressions
  (:40).
- Its constraints:
  - preserve round numbers, caps, gates and scope decisions; "An assessment cannot grant another
    repair allowance or reopen a spent cap" (:44);
  - run at a safe admission boundary (:45);
  - persist the checkpoint id, input revision and decision (:46);
  - recommend only (:47);
  - no full roast per leaf (:48);
  - "Every few" is not an approved number (:10).
- Its evidence is user-reported only: "generic producers with legacy consumers left behind;
  deadline/ownership guarantees missing sibling and failure paths; and local shape success
  separated from durable evidence lifecycle" (:18), and "no transcript, repair count, or
  independent classification ... was supplied" (:28).
- Unimplemented: `git log 97d5f2e..HEAD` touches no file under skills/super-auto, skills/super-code
  or step-back-prompt.md, and a grep for in-round or checkpoint terms finds nothing.

### A8-F14 (inference): how the in-round step-back connects to abstraction-drift detection
- Basis 1: the step-back already hunts drift signals: "Findings that cluster around one decision,
  interface, data flow, or ownership choice" and "Fixes that added machinery (special cases,
  flags, compensating checks) around a choice instead of changing it"
  (skills/super-design/step-back-prompt.md:73-75).
- Basis 2: the canonical redesign is a consolidation, "token refresh in each handler → one refresh
  middleware" (skills/super-auto/run-state.md:141).
- Basis 3: the user-reported family "generic producers with legacy consumers left behind" is an
  incomplete abstraction migration (F13).
- So drift detection fits as trigger sources and assessment criteria for that checkpoint:
  - recurrence keyed on triage `cause` (`noteRecurrence`, skills/super-code/MAINTENANCE.md:519-526);
  - neighbor-path failure;
  - producer/consumer migration completeness.
- It does not fit as a new pass, lint or gate. One boundary applies: the human partner
  "Declined: requiring every mechanism a fix adds to cite a verified premise, counting added and
  removed mechanisms per fix pass, or applying the step-back's class list as a checklist to the
  fix beads' own diffs" (skills/super-auto/SKILL.md:253; 01983d6). A mechanism-count drift metric
  would re-open that decision without new evidence.
- Seeing a mid-invocation boundary may need coordinator participation (upstream-feedback-draft.md:53).

### A8-F15 (observed): ledger of human-partner decisions
See the decision ledger under Constraints and costs. Each row cites a commit or a spec's
"gated with the user" line.

### A8-F16 (observed): ceremony lessons
- "a bead per finding would have been 8 beads created and closed in the same session, pure
  ceremony" (2026-09-04 friction.md:3). The 2026-10-01 run "applied 15 such fixes inline"
  (upstream-feedback-draft.md:88).
- Decision (41632c8): "design-text-only roast fixes are applied inline, not filed as tasks;
  fresh-agent work is not a leaf".
- Implication (a): design findings from a contract-first stage get fixed inline in the spec and
  beads. Behavior probes and evals run in the orchestrator's own phase, not as leaves.

### A8-F17 (observed): skill changes need behavioral evidence, which past runs lacked
- CLAUDE.md:93-100 requires before/after evals and forbids touching tuned content without
  evidence.
- The 2026-10-01 PR roast confirmed "no before/after eval evidence" (roast-pr-1.md:30). The scope
  filter punch-listed it as a "process/eval-evidence gap" (run.md:21).
- The report's own smell: "Skill behavior change on light evidence" (report.md:64). The probes
  were "not run, the implementing session had no subagent tool"
  (skills/super-auto/MAINTENANCE.md:99).
- Implication: any new lane, stage or incentive needs multi-session before/after probes, run by the
  orchestrator.

### A8-F18 (observed): skill-boundary rules
- "super-auto may only grow in sequencing ... per-task changes land in super-code's coordinator or
  in super-roast" (2026-09-04 audit-report.md:63).
- SDD stays byte-identical (2026-09-04 design.md:13). super-code now owns adapted
  implementer/reviewer prompts (16f8c3e). The seam spec keeps execution "dumb" (:31).
- Implication: design incentives belong in super-design (decomposition, promotion, coverage and
  bead fields) and super-code's own prompts. Enforcement belongs in super-roast. super-auto only
  sequences the checkpoint.

## Extension points

Places where a change could attach:

- **super-roast data tier.** The `## Lane: simplicity-design` hunt list and pragmatism filter
  (scout-prompts-pr.md:257-309). Precedent: add hunts and keep Scope / Hunt list / Pragmatism
  filter unchanged (2026-09-04 design.md:43). The design-mode lens roster is `config.coreLenses`
  (skills/super-roast/SKILL.md:119) with blocks in scout-prompts-design.md:143-208, and has no
  design lens. Lane blocks are data, so engine dryRun baselines stand (b574e7b: "All data-tier").
- **super-design.**
  - §Decomposition owns/consumes lines and `blocked-by <id>: consumes <artifact>` (64488f6);
  - coverage finding kinds (UNOWNED-SEAM sets the "new finding kind, no new pass" pattern);
  - Seam contract and Seam integration beads;
  - one promotion-review criterion (the SPLIT precedent).
- **super-auto.** Phase 5 Step 1 (skills/super-auto/SKILL.md:235-256), run-state.md item 7 records
  and resume.md:27 replay are the feedback's named homes for an in-round checkpoint
  (upstream-feedback-draft.md:53). Final-review intake is at SKILL.md:281-290. The scope-filter
  rule at scope-filter-prompt.md:29-38 changes only by human decision.
- **super-code.** `noteRecurrence` kinds and keys (MAINTENANCE.md:517-528) as a trigger source;
  implementer "Concerns" (implementer-prompt.md:70-74) as the channel for design debt the
  implementer sees.

Must stay untouched:

- Blocking always in scope; super-auto never overrules severity;
- round caps (3, plus one design extension) and the per-task single fix pass;
- independent task, seam, integration and final-review gates; the human-owned merge;
- the round-≥2 materiality stance (tuned); profile floors and preExisting=FYI;
- the judge panel shape (R4 deferred); SDD byte-identity.

## Constraints and costs

- **Tests and lints.** The CLAUDE.md:121-130 release list: replay harness, super-design scripts,
  super-roast args assembler, super-auto scripts and contract lint, bash-invocation guard, codex
  manifest. Engine dryRuns are required when coordinator.js or super-roast-workflow.md changes.
  Recorded figures: harness 1501/0 (2026-10-06-optional-skill-guidance.md:95); dryRuns 48/18/20
  (3d935e8).
- **Costs.** Panel: 3 seats for every Blocking or Should-fix candidate, uncapped. The canonical
  roast is about 22 agents and a clean task about 5 (a37a2ed). A bead carries about 5–6 dispatches
  of ceremony (leaf-sizing spec:52).
- **Philosophy.** Altitude, no history in runtime files, calm register, deterministic work in code
  (2026-10-01 run.md:6; f4a8372). Degrade, don't stop (audit:17). Coordinators act on slowness
  (3d935e8). No new review passes for structural properties (leaf-sizing spec:14-15; seam spec:35).
- **Decision ledger (F15).**

  | Decision | Status | Evidence |
  |---|---|---|
  | Seam contracts as compilable boundary code at design time; a finding kind, no new pass or gate | accepted | integration-seams spec:27-35 |
  | Prose-only contracts, contract-owned failing tests, execution-time seam detection | rejected | integration-seams spec:115-119 |
  | Sizing as write-time guidance plus one criterion; no per-leaf size police | accepted | leaf-sizing spec:14-15, 27-29 |
  | New review passes; execution-side sizing | rejected | leaf-sizing spec:84-86 |
  | Round-aware stance and [converged] exit | accepted, tuned | b574e7b; audit:15 |
  | Design cap as a cost control; capped-blocking stop; divergence guard | accepted | 6a2daf3 |
  | Uncapped panel, cap only as an explicit bound | accepted | efaa836 |
  | Single ground judge (R4); held-out tests or CapReward | deferred / rejected | audit-report.md:85; design.md:11-12 |
  | Scope filter: Blocking always in; quality improvements punch-listed | accepted | scope-filter-prompt.md:25-35; da9f562 |
  | One-review task loop; detailed review in super-roast | accepted | 16f8c3e |
  | Design-text fixes inline; fresh-agent work is not a leaf; shared test-file conflicts stay per-hunk; spec-fixed-name edges not safe to cut | accepted | 41632c8; coordinator-workflow.md:1043-1045 |
  | Mechanism counting, premise citation, class checklist on fix diffs | declined | super-auto SKILL.md:253 |
  | In-round step-back cadence | accepted, pending; no numeric default; no full roast per leaf; caps untouched | 97d5f2e; feedback draft :8-10, :44-48 |
  | Ordinary-subagent fallback with gate parity | accepted | d9b12c4, 7836b58 |
  | Compulsory skill-selection and brainstorming pauses | removed | 6ea7408 |

## Open questions

- Fork release history: RELEASE-NOTES.md holds no fork entries, and the GitHub release notes were
  not read. Version themes were reconstructed from commit messages.
- No in-repo incident shows OOP or design-quality defects escaping review. The only evidence is
  the user-reported harness-adapters run (feedback :14-18), with no transcript.
- The simplicity-design lane's per-lane yield, false-positive rate and seat agreement are
  unrecorded, because reports do not attribute findings to lanes.
- Seam contracts' effectiveness is "Not measured" (audit-report.md:39): how often UNOWNED-SEAM
  fires and whether contract beads reduced integration defects.
- The in-round cadence and the unit of a "completed repair/review cycle" are undecided
  (feedback :10). Whether coordinator participation is required is open (:53).
- Would the human partner exempt design properties named in an interface bead or the spec from the
  scope filter's quality-improvement punch-list rule?
- The 2026-09-29 audit's findings were never judged (audit:3). How many of its design-relevant
  suggestions shipped is known only for those traced here (#404 via da9f562; #177 via 16f8c3e).
