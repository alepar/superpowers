# Lead spot-check log for the repository audit stream

Each auditor return is spot-checked by the lead against the cited files before its findings are
used in the synthesis. "Confirmed" means the cited lines say what the finding claims.

## A1 — super-design decomposition (returned 2026-10-07)

| Finding | Citation checked | Result |
|---|---|---|
| A1-F01 four bead fields; owns/consumes inside description, "not a fifth field" | `skills/super-design/SKILL.md:86`, `:208-221` | Confirmed |
| A1-F04 autonomous implies Mode B for every brainstorm | `skills/super-design/SKILL.md:42` | Confirmed |
| A1-F04 Mode A covers "architecture, components, data flow, error handling, testing"; Mode B structure has no component/interface/error section | `skills/brainstorming/SKILL.md:227`, `:266-272` | Confirmed |
| A1-F05 per-task Interfaces blocks: eval evidence 0→100% exact signatures | commit `8e1262a` message (cites superpowers-evals experiment log 2026-06-11 L1) | Confirmed (evidence is the commit's own summary of an external eval log, not re-run here) |
| A1-F05 super-code planner task section has no Interfaces block | `skills/super-code/planner-prompt.md:89-96` | Confirmed |

## A3 — super-code roles and scheduler (returned 2026-10-07)

| Finding | Citation checked | Result |
|---|---|---|
| A3-F01 task review is deliberately light; polish deferred to whole-branch review | `skills/super-code/task-reviewer-prompt.md:10-12` | Confirmed |
| A3-F01 naming/style are Minor, ledgered not fixed | `skills/super-code/task-reviewer-prompt.md:90-91` | Confirmed |
| A3-F01 detailed review is super-roast's job; one fix pass, no re-review | `skills/super-code/SKILL.md:90-92`, `:267-268` | Confirmed |
| A3-F02 SDD reviewer has a "Code Quality"/"Structure" part absent from super-code's copy | `skills/subagent-driven-development/task-reviewer-prompt.md:115-134` | Confirmed |
| A3-F04 only error-related rubric item is "swallowed errors" | `skills/super-code/task-reviewer-prompt.md:71-72` | Confirmed |
| A3-F05 seam review checks "error and ordering behaviour" for `consumes` entries | `skills/super-code/coordinator.js:1618` | Confirmed |
| A3-F07 fixer declines plan-mandated findings; Minor deferred | `skills/super-code/implementer-prompt.md:150-155` | Confirmed |
| SDD byte-identical constraint | `skills/super-code/SKILL.md:259` | Confirmed |

## A8 — prior feedback and lessons (returned 2026-10-07)

| Finding | Citation checked | Result |
|---|---|---|
| A8-F04 core `simplicity-design` PR lane sourced from the human partner's priorities ("clean OOP design … right abstraction level"); 10-item hunt list incl. SRP, testability, wrong abstraction level, shallow modules, information leakage, pass-through, over-engineering | `skills/super-roast/scout-prompts-pr.md:257-300` | Confirmed |
| core lanes always run: correctness, security, premortem, simplicity-design, hot-path-perf, concurrency-async | `skills/super-roast/triage-prompt.md:31-33` | Confirmed |
| A8-F02 scope filter punch-lists sub-Blocking "quality improvement to goal-named code (style, structure, naming, extra hardening)" | `skills/super-auto/scope-filter-prompt.md:33-35` | Confirmed |
| A8-F01 round≥2 materiality bar ("materially affecting correctness, security, or the change's stated purpose") | `skills/super-roast/scout-prompts-pr.md:130-138`; commit `b574e7b` | Confirmed |
| A8-F03 judges refuted an SRP finding: "no stated contract or existing test scaffolding demands the decomposition" | `docs/superpowers/reviews/2026-07-30-planted-defect-branch-roast-1.md:45` | Confirmed |
| A8-F06 seams decisions gated with the user: compilable boundary code; new finding kind in existing coverage loop, "no new pass, no new gate"; super-code stays dumb | `docs/superpowers/specs/2026-08-25-integration-seams-design.md:27-35` | Confirmed |
| A8-F07 prior audit: contract-freeze step "Mostly exists as seam contracts + owns/consumes. Not measured." | `docs/superpowers/runs/2026-09-04-audit-plan-instrumentation/audit-report.md:39` | Confirmed |
| A8 human partner declined counting added/removed mechanisms per fix pass | `skills/super-auto/SKILL.md:253` | Confirmed |

## A5 — super-auto stages and caps (returned 2026-10-07)

| Finding | Citation checked | Result |
|---|---|---|
| A5-F01 boundary: phase improvements belong in the phase's skill; super-auto grows only in sequencing | `skills/super-auto/SKILL.md:31-32` | Confirmed |
| A5-F02 super-auto holds no control during phases 1–2 (inside super-design) | `skills/super-auto/SKILL.md:215-217` | Confirmed |
| A5-F09 Seam contract beads: compilable boundary code, stubs inert-by-default, every participant blocked on the contract; bottleneck rule lands only the unblocking artifact | `skills/super-design/SKILL.md:200-206`, `:500-502` | Confirmed |
| graph pass exempts seam-contract and integration-sweep edges | `skills/super-design/SKILL.md:642` | Confirmed |
| A5-F04/F05 phase allow-list hard-coded in report-status (exit 2 on unknown phase); contract lint diffs phase tokens against the 2bf1d53 baseline | `skills/super-auto/scripts/report-status:72-75`; `tests/super-auto/test-contract-lint.sh:172-173` | Confirmed |

## A6 — error, logging, evidence lifecycle (returned 2026-10-07)

| Finding | Citation checked | Result |
|---|---|---|
| A6-F03 correctness lane hunts dropped/swallowed errors, logged-but-continued, partial failure | `skills/super-roast/scout-prompts-pr.md:173-178` | Confirmed |
| A6-F03 premortem lane hunts resource leaks incl. missing defer/try-with-resources/context manager on the error path | `skills/super-roast/scout-prompts-pr.md:240-241` | Confirmed |
| A6-F03 api-contract lane hunts leaky abstraction (internal type returned) and inconsistent error contract | `skills/super-roast/scout-prompts-pr.md:467-472` | Confirmed |
| A6-F03 observability lane (silent failure, PII in logs, log-level misuse, unstructured logs) is conditional | `skills/super-roast/scout-prompts-pr.md:486-500`; `skills/super-roast/triage-prompt.md:40` | Confirmed |
| A6-F04 reporter down-weights resilience/observability findings for low-blast-radius profiles | `skills/super-roast/reporter-prompt.md:126-128` | Confirmed |
| A6-F04 taxonomy carries severities (PII-in-logs = Blocking, silent failure = Should-fix) that lane briefs do not | `docs/superpowers/specs/references/pr-review-taxonomy.md:143` vs `skills/super-roast/scout-prompts-pr.md:498-500` | Confirmed |
| A6-F03 gap: no lane hunts lost cause chains, boundary translation, log-and-rethrow, wrong-layer catch-alls, stack-trace loss | grep of lane briefs in `skills/super-roast/scout-prompts-pr.md` | Confirmed by lead reading of the lane briefs above (absence) |

## A4 — super-roast lanes, judges, severity (returned 2026-10-07)

| Finding | Citation checked | Result |
|---|---|---|
| A4-F02 `simplicity-design` is the only always-on PR lane covering OOP design | `skills/super-roast/scout-prompts-pr.md:257-300`; `skills/super-roast/triage-prompt.md:31-33` | Confirmed |
| A4-F04 "Encapsulation breaks" hunt item removed in `9bb2f36` | `git show 9bb2f36` (old item 5: "internal state or an implementation type (e.g. an ORM entity) exposed instead of a narrow domain interface") | Confirmed. Lead note: removed while folding the human partner's wording into the lane, not as a recorded rejection; partially survives as new item 5 and api-contract item 3 (conditional lane) |
| A4-F04 taxonomy: readability is linter territory, no scout budget | `docs/superpowers/specs/references/pr-review-taxonomy.md:292` | Confirmed |
| A4-F05 design-mode `maintainer` lens only widens when triage returns no domains | `skills/super-roast/scout-prompts-design.md:174-179`; `skills/super-roast/SKILL.md:121-124` | Confirmed |
| A4-F12 judges measure materiality against stated requirements/contract/scope; reproduce must end at a stated requirement; PR mode: stated requirements include repo conventions and stated intent | `skills/super-roast/judge-seat-prompts.md:35-40`, `:96-103`, `:146-150` | Confirmed |
| A4-F19 `--context` is design-mode only; PR roasts receive no design-time contracts | `skills/super-roast/scripts/assemble-args.mjs:19-20`, `:199` | Confirmed |
| A4 lane blocks are picked up automatically from `## Lane:` headings | `skills/super-roast/scripts/assemble-args.mjs:183-190` | Confirmed |
| A4 canonical dryRun assertions 22 agents (23 dead-reporter, 22 unsettled-panel); recorded baseline superseded, fresh run owed | `skills/super-roast/super-roast-workflow.md:728-755`, `:787-789` | Confirmed |

## A2 — seams, contract beads, early unblock (returned 2026-10-07)

| Finding | Citation checked | Result |
|---|---|---|
| A2-F01 `Seam contract:` (compilable boundary code, participants blocked on it), `Seam integration:`, root sweep already ship | `skills/super-design/SKILL.md:495-525` | Confirmed |
| A2-F02 SPLIT fires on bottleneck (≥2 dependents) + oversize; names minimal unblocking artifact and deferrable remainder; gating alone is not a finding | `skills/super-design/promotion-reviewer-prompt.md:44-54` | Confirmed |
| A2-F03 2026-10-01 run: UNOWNED-SEAM findings resolved by assigning owners/edges, no contract+integration bead pairs | `docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/coverage-ledger.md:9-25` | Confirmed (e.g. c7 "applied — .1 owns the pointer-syntax convention") |
| A2-F05 `earlyUnblock` (default true) dispatches dependents at the implementer's commit, stacked on the unmerged parent | `skills/super-code/coordinator-workflow.md:73-80` | Confirmed |
| A2-F09 a stack parent that fails to merge cancels and discards stacked dependents | `skills/super-code/coordinator-workflow.md:468-482`, `:1300-1304` | Confirmed |
| A2-F06 scheduler reads generic `blocks` deps; no edge kinds | `skills/super-code/scripts/tree-deps:1-12` | Confirmed |
| A2-F07 graph pass "safe" rule blocks interface-mediated cuts; 2026-10-01 parked 4 cuts, depth stayed 7 | `skills/super-design/graph-pass-prompt.md:49-53`; `docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/run.md:43-48` | Confirmed |
| A2-F15 metrics are counts (dispatched early E, cancelled K), no per-bead timestamps | `skills/super-code/coordinator-workflow.md:1143-1147` | Confirmed |

## A7 — evaluation and tests (returned 2026-10-07)

| Finding | Citation checked | Result |
|---|---|---|
| A7-F06 judge-seat eval: identical judges confirmed false positive 2/3; seat-split panel 0/3; real gap kept 3/3; single fixture | `docs/superpowers/plans/eval/2026-07-28-judge-seats/eval-record.md:12-30` | Confirmed |
| A7-F07 planted-defect PR run: SQL injection 3/3 but Should-fix; cost 2.07M tokens vs design run 7.78M | commit `3cb9099` message | Confirmed |
| A7-F10 wall clock only in hand notes (121 agents / 74 min) | `docs/superpowers/runs/2026-09-04-audit-plan-instrumentation/run.md:32` | Confirmed |
| A7 data edits (lane rosters, prompt wording, caps, model tiers) skip the roast dryRun | `skills/super-roast/super-roast-workflow.md:669-673` | Confirmed |
| A7-F01 planner prompt pinned only by its path in the replay harness | `tests/super-code/replay-harness.mjs:474` | Confirmed |
| A7-F05 lane/lens rosters hard-coded in assemble-args test (6 core, 13 prompts) | `tests/super-roast/test-assemble-args.sh:27-28`, `:44` | Confirmed. Correction (after critique 1): the design-lens roster assertion is at `:44`; an earlier version of this row wrongly said `:30`, the auditors' `:44` was right |

## Machine check of all audit citations

`tools/check_audit_citations.py` checked every citation in `audit/A*-evidence.jsonl` (617):
file/commit exists, cited lines within the file, excerpt fragments present within ±3 lines.
Result (full output in [citation-check.txt](citation-check.txt)): 596 located at the cited
lines, 1 found elsewhere in the same file (line drift), 20 not matched verbatim. The lead
reviewed the 20: they are summary-style excerpts (e.g. "c7..c25: 14 UNOWNED-SEAM lines, 12
applied, 2 rejected" — recounted by the lead from the ledger and correct), grep descriptions,
or formatting artifacts (escaped `\|` in Markdown tables, `${}` interpolations, wrapped lines).
Hand-checked residuals with substantive content: `skills/super-code/MAINTENANCE.md:508-509`
(1,335 deferrals hid one line recurring ~40 times), `:804` (rethrow under dryRun,
swallow-and-log live), `skills/super-code/coordinator.js:154-158` (script failure logged as a
null dispatch with label and phase), `:336` (recurrence threshold), `skills/super-auto/run-state.md:33`
(parked kinds) — all confirmed. No fabricated citation was found.
