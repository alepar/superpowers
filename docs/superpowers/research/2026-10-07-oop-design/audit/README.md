# Repository audit — coverage and evidence map

Stream 2 of the 2026-10-07 OOP-design research: eight fresh-context auditors (A1–A8) reviewed
the CURRENT Superpowers repository (worktree `research/oop-design-scouts`, base `main` eb0462b,
6.4.2-alepar4.16) read-only, under the [audit protocol](PROTOCOL.md). Every finding cites a
`path:line`, commit, or recorded run artifact and is labelled observed / inference / gap. The
lead spot-checked the load-bearing citations of every auditor ([VERIFICATION.md](VERIFICATION.md))
and machine-checked all 617 citations ([citation-check.txt](citation-check.txt): 596 located at
the cited lines, 1 line drift, 20 non-verbatim summary excerpts reviewed by hand; no fabricated
citation found). This map cites repository artifacts only; external literature lives in the
research ledgers one directory up.

## Coverage

| Auditor | Scope | Files read | Tests run (side-effect free) | Report | Evidence rows |
|---|---|---|---|---|---|
| A1 | super-design decomposition, interface/abstraction modeling, brainstorming/writing-plans feed | 28 full + 10 partial, 5 commits | super-design scripts 32/32 | [A1](A1-super-design-decomposition.md) | 14 |
| A2 | seam contract / seam integration / sweep, leaf sizing, early unblock, dependency scheduling | ~51 files, 9 commits | replay harness 1501/0; super-design scripts pass | [A2](A2-seams-contract-beads.md) | 18 |
| A3 | super-code planner, implementer, task reviewer, triage, fix loop, scheduler | 31 files | none | [A3](A3-super-code-roles.md) | 19 |
| A4 | super-roast lanes, triage, dedupe, judges, reporter/severity, add-a-lane contract | 31 full + 8 excerpts, 3 commits | assemble-args test pass | [A4](A4-super-roast-lanes.md) | 20 |
| A5 | super-auto phases, step-backs, caps, scope filter, run state, report | 26 full + 8 partial, 9 commits | contract lint 7/7; scripts 65/65 | [A5](A5-super-auto-stages.md) | 18 |
| A6 | error/exception/logging/cleanup guidance for produced code; engine failure handling; evidence lifecycle | ~50 files + 28 scripts surveyed | none | [A6](A6-error-logging-evidence.md) | 13 |
| A7 | test suites, dryRun baselines, eval records, eval methodology, costs | ~45 files, 4 commits | all six release suites pass (~145 s, $0) | [A7](A7-evaluation-tests.md) | 16 |
| A8 | feedback drafts, run retrospectives, review audits, release history, human-partner decisions | ~60 files, ~25 commits | none | [A8](A8-prior-feedback-lessons.md) | 18 |

Not covered, by design: the external eval harness (`evals/`, not cloned in this worktree,
`.gitignore:10-13`), sibling worktrees, session-local Workflow journals, and GitHub issues
(their bodies exist in the repo as feedback drafts).

## Evidence map by research topic

### T1 — Abstraction / interface model at design time

| Current mechanism | Evidence | Gap |
|---|---|---|
| Beads carry four fields; boundaries live as literal `owns:` / `consumes:` lines inside the description | `skills/super-design/SKILL.md:86`, `:208-221` (A1-F01, A1-F02) | No artifact names abstractions, responsibilities, collaborations, or variation points (A1-F01) |
| Mode A design presentation covers "architecture, components, data flow, error handling, testing" | `skills/brainstorming/SKILL.md:227` | Autonomous runs force Mode B (`skills/super-design/SKILL.md:42`), whose structure has no component/interface/error section (`skills/brainstorming/SKILL.md:266-272`); the two recorded autonomous specs diverge (A1-F04) |
| writing-plans per-task `Interfaces:` Consumes/Produces with exact signatures; eval-backed (0→100% exact signatures, 1 fix wave vs 2–4) | `skills/writing-plans/SKILL.md:91-95`; commit `8e1262a` (A1-F05, A7-F14) | Only on the no-beads path; the super-code planner's task section has none (`skills/super-code/planner-prompt.md:89-96`) (A1-F05, A3-F06) |
| Promotion review reads the full spec and every child; SPLIT precedent for adding a criterion | `skills/super-design/promotion-reviewer-prompt.md:40-41`, `:44-54` (A1-F06, A1-F10) | No pass checks abstraction-model coherence; coverage deliberately sees Goal sections only (`205b77d`) (A1-F06, A1-F07) |
| Design-roast lenses: completeness ("undefined interfaces"), yagni ("speculative generality") | `skills/super-roast/scout-prompts-design.md:149-160` | No design/abstraction lens; `maintainer` widens only when triage names zero domains (`skills/super-roast/SKILL.md:121-124`) and did not run in the recorded rounds (A4-F05) |

### T2 — Hierarchies, polymorphism, encapsulation, patterns, method-level design in review

| Current mechanism | Evidence | Gap |
|---|---|---|
| Core PR lane `simplicity-design`, sourced from the human partner's priorities (SRP, structural testability, right abstraction level, shallow modules, information leakage, pass-through, over-engineering, reimplemented primitives) with a pragmatism filter | `skills/super-roast/scout-prompts-pr.md:257-309`; `skills/super-roast/triage-prompt.md:31-33` (A4-F02, A8-F04) | Explicit "Encapsulation breaks" item dropped in `9bb2f36` (rewrite, not a recorded rejection); no hunt for duplicated production logic or substitutability/type-switch misuse; readability left to linters by design (`docs/superpowers/specs/references/pr-review-taxonomy.md:292`) (A4-F04) |
| Conditional `api-contract` lane: leaky abstraction, inconsistent error contract, over-broad surface | `skills/super-roast/scout-prompts-pr.md:455-479` | Activates only on public-surface/wire-format changes; triage sees file list + stat only, no hunks (A4-F06) |
| Judges confirm only against stated requirements/contract/scope; PR mode counts repo conventions and stated intent | `skills/super-roast/judge-seat-prompts.md:35-40`, `:96-103`, `:146-150` (A4-F12) | Recorded design findings were refuted when "no stated contract … demands the decomposition" (`docs/superpowers/reviews/2026-07-30-planted-defect-branch-roast-1.md:45`) or ended as Nit/FYI/unverified (A4-F18, A7-F08, A8-F03) |
| PR roasts take the diff, repo, PR text, prior report | `skills/super-roast/scout-prompts-pr.md:24-28` | `--context` is design-mode only (`skills/super-roast/scripts/assemble-args.mjs:19-20`, `:199`); design-time contracts never reach PR judges (A4-F19) |
| Round ≥2 materiality bar; phase-5 scope filter | `skills/super-roast/scout-prompts-pr.md:130-138`; `skills/super-auto/scope-filter-prompt.md:33-35` | Sub-Blocking structure/naming findings are suppressed in later rounds and punch-listed unless the goal names the property (A4-F10, A4-F11, A5-F12, A8-F01, A8-F02) |
| super-code task review is deliberately light; polish/naming/style are Minor with `[class]` tags clustered run-wide | `skills/super-code/task-reviewer-prompt.md:10-12`, `:90-91`; `skills/super-code/SKILL.md:90-92` (A3-F01, A3-F09) | SDD's Code Quality / Structure section absent from super-code's copy (`skills/subagent-driven-development/task-reviewer-prompt.md:115-134`) (A3-F02) |
| Lane attribution | packets carry `lanes` | Report entries and engine return never name the lane, so no lane's precision is measurable (A4-F15) |

### T3 — Error, exception, logging, cleanup practice

| Current mechanism | Evidence | Gap |
|---|---|---|
| Checklist phrases only: "error handling" (Mode A), no "Add appropriate error handling" placeholder, "Proper error handling?", "swallowed errors" | `skills/brainstorming/SKILL.md:227`; `skills/writing-plans/SKILL.md:134`; `skills/subagent-driven-development/task-reviewer-prompt.md:119`; `skills/super-code/task-reviewer-prompt.md:71-72` (A6-F01) | Nothing on error representation, cause chaining, boundary translation, who logs, stack traces in logs, cleanup ownership; nothing language-adaptive; examples are TypeScript-only (A6-F01, A6-F02, A3-F04, A3-F05) |
| PR lanes split error defects four ways: correctness (dropped/swallowed), premortem (leaks on error path), api-contract (inconsistent error contract), observability (silent failure, PII, log level) | `skills/super-roast/scout-prompts-pr.md:173-178`, `:240-241`, `:467-472`, `:486-500` (A6-F03) | No lane hunts lost causes, missing translation, log-and-rethrow, wrong-layer catch-alls, cleanup ownership (A6-F03); observability is conditional and profile-demotable (`skills/super-roast/reporter-prompt.md:126-128`) (A6-F04) |
| Seam review checks "error and ordering behaviour the consumer assumes" | `skills/super-code/coordinator.js:1618` (A3-F11) | Only for a late-landing consumed producer; seam contracts declare no error semantics (`skills/super-design/SKILL.md:500`) (A6-F11) |
| Engine's own failure handling is a good model (nulls logged with label/phase, script errors with exit code and stderr, stack kept on chain rejections, explicit UNAVAILABLE states) | `skills/super-code/coordinator.js:154-158`; `skills/super-code/MAINTENANCE.md:804` (A6-F05) | Roast engine nulls a throwing judge and logs only a count; first-failure latches drop later errors (A6-F06) |

### T4 — Contract-first / interface-first beads

| Current mechanism | Evidence | Gap |
|---|---|---|
| `Seam contract:` (compilable boundary code, stubs inert-by-default, every participant blocked on it), `Seam integration:`, root `Integration sweep:` | `skills/super-design/SKILL.md:495-525`, `:200-206` (A2-F01, A5-F09, A3-F14) | Triggered by ownership ambiguity (UNOWNED-SEAM), not interface width; SPLIT's "unblocking artifact" path creates no seam beads (A2-F02) |
| Early unblock dispatches dependents at the blocker's implementation commit, stacked | `skills/super-code/coordinator-workflow.md:73-80` (A2-F05) | Consumers stack on an unreviewed contract; a failed parent discards them (`:468-482`, `:1300-1304`) (A2-F09); stacked consumers miss a consumes-seam review when the parent's fix pass changes its interface (A3-F12) |
| Edge reason lines with fixed tokens; graph pass exempts contract edges | `skills/super-design/SKILL.md:268-289`, `:642` (A2-F12) | Token not enforced (the only recorded contract bead's dependents used free text) (A2-F04); graph-pass "safe" rule parked 4 interface-mediated cuts, depth 7 where 5 was possible (A2-F07) |
| Leaf sizing: ~5-dispatch ceremony floor; bottleneck beads land only the unblocking artifact | `skills/super-design/SKILL.md:197-206` (A1-F12, A8-F07) | One bead per abstraction would fall below the floor; the sanctioned shape is one contract per seam cluster (A8-F07) |
| Recorded runs | 20 UNOWNED-SEAM findings over two runs, 15 applied, none became contract+integration pairs (A2-F03) | Both runs edited Markdown skills; no code-interface evidence; no `Seam integration:` bead ever created (A2-F03, A2-F14, A5-F10) |
| Measurement | Detector/Metrics counts (`dispatched early E · cancelled K`), graph depth/width (A2-F15, A7-F10) | No per-bead timestamps, no engine clock; speedup measurable only in rounds and counts |

### T5 — Stage placement, transitions, step-backs

| Current mechanism | Evidence | Gap / constraint |
|---|---|---|
| super-auto boundary: phase improvements belong in the phase's skill; super-auto grows only in sequencing | `skills/super-auto/SKILL.md:31-32` (A5-F01) | A new phase would break `report-status`'s hard-coded phase set (`skills/super-auto/scripts/report-status:72-75`), the frozen phase baseline (`tests/super-auto/test-contract-lint.sh:172-173`), ~125 numeric phase references, and add up to four unattended pause points (A5-F04, A5-F05, A5-F16, A5-F17) |
| A super-auto phase after phase 2 would come after the design roast and the planOneShot stop | `skills/super-auto/SKILL.md:66`, `:215-217` (A5-F02, A5-F08) | Placing a contract step inside super-design between coverage and the roast offer gets it roasted and shown at the existing stop, with no new gate (A5-F08) |
| Step-back clusters findings "around one decision, interface, data flow, or ownership choice" | `skills/super-design/step-back-prompt.md:71-77` (A5-F13, A8-F14) | Runs once per numbered round; the accepted in-round cadence request is unimplemented (A5-F14, A8-F13) |

### T6 — Evaluation infrastructure

| Exists | Evidence | Missing |
|---|---|---|
| Replay harness (1501 assertions, 130 scenarios, 30 s, $0); script tests; contract lint | A7-F01 | No test of prompt *behavior*; planner pinned only by path (`tests/super-code/replay-harness.mjs:474`) (A7-F02) |
| Judge-seat RED/GREEN eval; planted-defect PR branch (RED baseline for design findings) | `docs/superpowers/plans/eval/2026-07-28-judge-seats/eval-record.md:12-30`; commit `3cb9099` (A7-F06, A7-F08) | Single fixtures; no multi-fixture precision/recall; nothing scores produced-code design quality or evolvability (A7-F09) |
| A/B micro-test method; fixture-generator precedent | `skills/writing-skills/SKILL.md:459-474`; A7-F14 | No fan-out (one parent → ≥2 stacked) replay fixture (A7-F11); no timing (A7-F10) |
| Costs: PR roast ~2.07M tokens; design roast 7.78M tokens / 56 min; offline suites free | commit `3cb9099`; A7-F16 | Token cost per role/lane unrecorded |

### T7 — Human-partner decisions and lessons that bound any change

From A8's decision ledger (A8-F15) and related findings; each row is cited in A8:

- Accepted: seam contracts as compilable code at design time, as a finding kind with **no new pass and no new gate**; sizing as write-time guidance plus at most one criterion riding an existing pass; round-aware materiality stance (tuned on measured round-3 noise); uncapped judge panel; Blocking always in scope with quality improvements punch-listed; one-review task loop with detailed review in super-roast; design-text fixes inline; in-round step-back cadence (accepted, pending, no numeric default, caps untouched).
- Rejected or declined: prose-only contracts, contract-owned failing tests, execution-time seam detection, new review passes, mechanism counting per fix pass, compulsory brainstorming pauses.
- Lessons: generic "improve code the way a good developer would" prose licensed refactor scope creep (audit #177 → scope fence, A8-F11); severity inflation defeats caps and costs three judge seats per severe candidate (A8-F08, A8-F09); no in-repo incident shows OOP defects escaping review — the only motivating evidence is the user-reported harness-adapters run (A8-F05, A1-F14).

## Cross-auditor reconciliation

- **Interfaces block**: A1-F05 and A3-F06 independently find the eval-backed writing-plans
  `Interfaces:` block missing from the super-code planner. Consistent.
- **Contract-first already exists**: A2-F01, A3-F14, A5-F09, A8-F06 agree; A2 adds that it is
  reactive, unexercised on code, and that early unblock already starts consumers at the
  blocker's implementation commit. Consistent.
- **Why design findings die in review**: A4-F12/F18, A7-F08, A8-F03 cite the same refutation
  (`planted-defect-branch-roast-1.md:45`) and the materiality definition; A4-F19 identifies the
  missing PR-mode contract channel as the structural cause. Consistent.
- **Per-bead cost**: A3-F18 counts 3–4 dispatches for a clean task (implement, review, merge,
  ±split/ledger), `skills/super-code/SKILL.md:82` says four agents, the leaf-sizing floor says
  ~5–6 dispatches of ceremony including planning and coverage overhead (A8-F07). These are
  different counting bases, not a conflict; this research uses "≈4–6 dispatches per bead".
- **Incidental drift found** (outside the research question, recorded for maintainers):
  planner/reviewer wording disagreement (A3-F16); hot-file cross-note predates early unblock
  (A2-F13); `docs/testing.md` and README fix-loop description stale (A7-F15); design-roast exit
  has no run-state field and runs invented two names (A5-F15); "Encapsulation breaks" removal
  (A4-F04); roast engine loses judge-thunk error causes (A6-F06).
