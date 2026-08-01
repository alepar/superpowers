> Note: the skill named super-plan here was renamed super-design on 2026-07-31.

super-roast verdict: Blocking (34)
mode: design        iteration: 1 of 3
profile (assumed): This is `superpowers`, a personal/community Claude Code plugin repository of markdown skill files and small JS helpers. Blast radius: a defect degrades an individual developer's agent workflow or wastes their tokens; no end users, no user data, no payments/PII, no production deployment. Code lifetime: long — skills are reused across many sessions and evolve for months. Audience: the maintainer plus other agents reading the skills, so clarity and behavioral correctness of instructions matter more than runtime resilience. No network-exposed surface.
inputs: docs/superpowers/specs/2026-06-16-roast-depth-capped-verification-design.md (stated run input; 25 packets) — NOTE: 26 of 51 packets cite and were seat-verified against docs/superpowers/specs/2026-07-29-super-roast-design.md, the successor design, instead. Findings below are labeled by the artifact their evidence actually cites; none were dropped for the mismatch.
coverage: lanes ran: not provided to reporter (see finding B7 — this gap is live in this very run) · raw: not provided → 51 deduped → 38 panel / 13 spot-checked · judge completion 100% (127/127 votes)
independence: same-family (Claude) — seat-differentiated panel

Severity note (Step 2): no profile-driven demotions. The profile states behavioral correctness of long-lived instructions outweighs runtime resilience here, and every confirmed finding bears on the review pipeline's verdict correctness or a stated design goal. All seven Blocking findings are confirmed violations of the artifact's own stated core purpose (no-silent-drop / never-a-silent-clean), which is a profile-proof floor.

## Confirmed findings            ← consumed by super-plan, one task per finding

- [Blocking] [depth-cap spec] "Dedup-and-rank agent" + "Report changes" — No failure handling for the single dedup-and-rank agent: a null/malformed/empty return after successful critics empties the verified set and produces a clean PASS — the exact PASS-by-absence the coverage gate exists to forbid.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: roast-workflow.md:166,176 — `(await agent(dedupRankPrompt(raw),…))?.findings ?? []` then `lowCoverage = raw.length === 0 || judged.some(j => j.incomplete)`: raw non-empty + judged=[] ⇒ bare 'PASS'. Judges get "re-dispatch once"; dedupe gets nothing.
  fix-shape hint: retry the dedupe agent once, fall back to the still-viable code merge on failure, and wire dedupe failure into the low-coverage flag.

- [Blocking] [depth-cap spec] "Dedup-and-rank agent" step 1 + coverage line — The no-silent-drop guarantee depends on unenforced LLM compliance: no conservation check reconciles dedupe output against input, so omitted or over-merged findings vanish before both the cap and the below-cap list; 40→12 is indistinguishable between merge and drop.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: dedup-rank-prompt.md:16 "Do not add new findings or drop any distinct issue" is instruction-only — no input→output mapping, no count invariant; coverage line shows counts that cannot attribute the gap.
  fix-shape hint: add a conservation post-condition — every input finding maps to an output finding or a named merge target, checked by the engine.

- [Blocking] [depth-cap spec] "Verification" → "Blocker bypass (safety)" + "Cost effect" — The blocker bypass is unbounded and its sole justification ("blockers rarely add cost") is an unmeasured claim about a likelihood-independent grader; grade inflation defeats the cap entirely and a "quick roast" can cost as much as the unbounded baseline while the report still prints the requested depth.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: roast-workflow.md:168 `i < CAP || f.gradedSeverity === 'blocker'` — no ceiling; dedup-rank-prompt.md Step 2 grades "independent of how likely it is to be confirmed"; critics are primed adversarially toward blocker-shaped language; no calibration loop would ever detect it.
  fix-shape hint: bound the bypass (e.g. cap+N or top-ranked blockers only) and run the proposed spike measuring the grader's blocker-fraction on real pooled findings.

- [Blocking] [depth-cap spec] "Blocker bypass (safety)" — The guarantee "never leaves a potential blocker un-verified" is circular: it protects only findings the single sonnet grader already labelled blocker, so a true blocker under-graded to major exits unverified with the wrong severity and is undetectable downstream.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: bypass predicate is the grader's own output (`f.gradedSeverity === 'blocker'`), which the spec itself de-rates as "triage only" / non-binding; arXiv 2606.19544 (verified real) documents single-rater LLM grading instability; judges never see excluded findings.
  fix-shape hint: run the proposed blocker-recall spike; until measured, bias the rubric toward blocker on uncertainty or soften "guarantees" to a bounded best-effort claim.

- [Blocking] [depth-cap spec] "Report changes" — A cap-truncated run still emits a bare PASS: verifying 10 of 35 distinct findings (possibly all REJECTed) is textually indistinguishable from a fully-verified clean pass, and the automated brainstorming gate branches on the bare verdict token.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: `lowCoverage` (roast-workflow.md:176) has no cap-truncation term; skills/brainstorming/SKILL.md:187 proceeds to implementation on PASS without reading the below-cap section.
  fix-shape hint: extend the verdict qualifier to cap-induced partial coverage (e.g. `PASS (capped — N unverified)`), or wire belowCap into lowCoverage.

- [Blocking] [super-roast spec] §4 (Dedupe) + §Execution — A dead or truncated dedupe agent yields zero judged packets and the pipeline reports `clean (0 nits)`: coverage counts dead scouts only, no stage detects a dead stage-4, contradicting the engine's own "dead agents ⇒ low coverage, never a silent clean" guarantee — for the one stage the spec calls "silent and unrecoverable downstream."
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: super-roast-workflow.md:151 `const deduped = dd?.findings ?? []` (no retry, unlike judge seats at :162); coverage object (:185-192) has `scoutsDead` but no dedupe liveness field; reporter receives only empty packets.
  fix-shape hint: retry dedupe once, add a dedupeDead/rawVsDeduped check to coverage gating, and abort-to-low-coverage when raw > 0 but deduped == 0.

- [Blocking] [super-roast spec] §6 + §Report format — The reporter must emit the coverage line and the [low coverage] qualifier from facts it is never given: lane roster, raw finding count, and dead-scout count exist only in the engine's returned coverage object, which is never merged into reportMarkdown — so "never a silent clean" has no input path into the one artifact humans and super-plan read.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: super-roast-workflow.md:179 fills exactly three tokens (PACKETS/PROFILE/PRIOR_REPORT); coverage is built at :185-192 after the reporter has already run; the orchestrator writes reportMarkdown verbatim (:196-198). Corroborated live: this report's own coverage line could not state lanes ran or raw counts.
  fix-shape hint: pass a COVERAGE_JSON token into the reporter prompt, or have the engine stamp the header's coverage/verdict-qualifier lines after the script returns.

- [Should-fix] [depth-cap spec] "Dedup-and-rank agent" + SKILL.md Model Tiering — The decision of what gets verified at all is handed to a single un-reviewed sonnet agent, contradicting the skill's plurality principle for consequential judgements; "triage only" understates its power since the grade determines gate eligibility.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: every other consequential judgement is pluralized (3 judges, ≥2/3, median, re-dispatch); SKILL.md:69's rationale ("does not set the gate") is true for gate severity, false for coverage; a mis-grade is unrecoverable since judges never see excluded findings.
  fix-shape hint: add a cheap second-opinion pass (or a deterministic floor / below-cap sample) for the coverage-gating decision, or explicitly accept and document the single-rater risk.

- [Should-fix] [depth-cap spec] "Dedup-and-rank agent" steps 2-3 — Ranking by severity-if-true while explicitly ignoring likelihood-of-confirmation spends the judge budget on the most speculative findings; the spike-tiebreak promotes thin-evidence items, so the cap can invert a correct REVISE into a PASS.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓) — final severity Should-fix (2 of 3 confirming seats; one seat argued Blocking)
  evidence: dedup-rank-prompt.md Step 2 "independent of how likely it is to be confirmed"; within-tier tiebreak ranks UNVERIFIED-ASSUMPTION-with-spike above plain findings; adversarially-primed critics inflate the speculative tail this key favors.
  fix-shape hint: run the proposed spike (grade a fully-judged past run blind; compare top-10 vs remainder confirm rates); if anti-selective, rank on likelihood × severity.

- [Should-fix] [depth-cap spec] "Verification" / absent — Judge-raised findings (the recall safeguard) have no defined interaction with the cap: they never pass through dedup-and-rank, carry no gradedSeverity and no rank, and the spec never says whether they are verified, capped, or merely listed.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: roast-workflow.md:89 routes new judge-raised issues to "the same verification," which is now gated by a ranked list built only from critic findings; nothing merges them into `ranked`; report line at :115 carries no fields.
  fix-shape hint: route judge-raised findings through dedup-and-rank on the next round or auto-verify them (workflow-logic change, not a prompt change — not foreclosed by Out-of-scope).

- [Should-fix] [depth-cap spec] "Verification" + "Report changes" — The only remedy for below-cap findings (re-run deeper) costs strictly more than having run deep initially and is not guaranteed to resurface the same findings; nothing carries the ranked list or verdicts across runs.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: entry point takes only `{specPath, context, depth}` (roast-workflow.md:139); a re-run repeats triage + full opus critic fan-out + dedupe; medium-then-deep > deep alone; fresh critics give no resurfacing guarantee.
  fix-shape hint: define a resume path (re-verify from a saved ranked list) or document the cost/non-determinism tradeoff explicitly in the nudge.

- [Should-fix] [depth-cap spec] "Approach" / "Dedup-and-rank agent" — Replacing the deterministic merge with a sampled LLM makes the merged set, grades, ordering, verified set, and potentially the verdict non-reproducible across runs of an unchanged spec, breaking the two remediation workflows (re-run deeper; capped re-roast loop) where verdict flapping is indistinguishable from progress.
  verdict: confirmed (reproduce ✗ — outvoted / refute ✗-survived / ground ✓)
  evidence: no stabilisation specified, no finding identity survives a re-run; boundary-straddling majors can flip REVISE↔PASS between identical invocations; refute seat confirmed no equivalent mechanism exists anywhere in the spec.
  fix-shape hint: give findings stable IDs through dedupe and document (or bound) run-to-run variance at the cap boundary.

- [Should-fix] [depth-cap spec] "Dedup-and-rank agent" step 3 — A three-value grade cannot produce the total order the cap needs: with dozens of findings the cut almost always falls inside a severity tier and the spec defines no tie-break, so selection at the cut point is arbitrary; "stable rank" is never defined.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: only recorded run (12 major / 4 minor / 0 blockers, 2026-06-13 eval) puts the medium cap squarely inside the major tier; the implemented prompt had to invent a tie-break the spec never made, and it still leaves large intra-tier groups unordered.
  fix-shape hint: specify the full ordering (secondary keys + deterministic final tie-break) in the spec, not ad hoc in the prompt.

- [Should-fix] [depth-cap spec] "Dedup-and-rank agent" output schema — Two independent sources of truth for order (array position and a required `rank` field) with no stated precedence, validation, or re-sort; the implementation slices by array index and never reads `rank`, so a schema-valid response in input order silently verifies an arbitrary set.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: roast-workflow.md:168-169 filters by index `i`; `f.rank` never read; RANKED schema constrains only type — duplicates/skips/non-monotonic ranks all pass.
  fix-shape hint: deterministic caller-side sort by gradedSeverity+rank before slicing, or drop the redundant field.

- [Should-fix] [depth-cap spec] "Dedup-and-rank agent" + "Problem" — The dedupe agent must ingest the entire pooled finding set and re-emit every distinct finding in one call with no input bound, chunking strategy, or truncation detection — so merge quality degrades precisely on the rich specs that motivate the feature.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: 5-10 opus critics' findings with evidence/spike text pooled into one sonnet call; the skill has a chunking pattern for oversized critic input (roast-workflow.md:27) with no dedupe analogue; the old code merge had no context limit.
  fix-shape hint: add a count-conservation check and a chunked/hierarchical merge fallback above a pool-size threshold.

- [Should-fix] [depth-cap spec] "Depth levels" Detection — Depth detection is specified only as "natural-language keywords" with no owner, no matching algorithm, no collision rule ("quick but thorough roast"), no override, and no confirmation before spend; the ambiguity fallback presumes ambiguity detection, which is what's unspecified.
  verdict: confirmed (reproduce ✓ / refute ✗ — killed, outvoted 2-1 / ground ✓)
  evidence: no step in the flow computes `depth`; the implementation assumes it arrives resolved (roast-workflow.md:139); the trigger-phrase table is a seed list with no precedence rule; level echoed only after the money is spent.
  fix-shape hint: name the owner, define collision precedence (multi-match ⇒ ambiguity ⇒ medium), and state the invalid-value resolution.

- [Should-fix] [depth-cap spec] "Depth levels" — Depth detection runs in the calling context, so on the brainstorming path the level can be chosen by the spec-authoring agent — the one context the skill deliberately excludes — and the report records the level but not its provenance.
  verdict: confirmed (reproduce ✓ / refute ✗ — killed, outvoted 2-1 / ground ✓)
  evidence: the carve-out pins only auto-invocations to medium; a manually-phrased "quick roast" from the authoring session is unconstrained; `depth: shallow (cap 5)` records nothing about who chose it. (Refute dissent — the auto-gate floor covers the named path — did not survive the majority's point that manual in-session invocations bypass it.)
  fix-shape hint: floor every roast invoked from within an active authoring session at medium+, and/or record invocation provenance in the report.

- [Should-fix] [depth-cap spec] "Depth levels" table — The caps 5/10/20 are absolute, unmeasured constants with no relationship to how many findings exist: coverage degrades exactly as spec richness rises (including on the pinned-to-medium auto-gate); on small specs the feature is a pure cost regression; on the only recorded run two of four levels select identical sets.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: 19 post-dedup findings on the recorded run ⇒ deep(20) ≡ unlimited; no measured distinct-finding distribution or rank-vs-confirmation relationship anywhere; "No calibration loop" means the constants are never validated.
  fix-shape hint: run the proposed spike (post-dedup count distribution + confirmed severity vs rank on archived specs); consider a relative cap or a verdict qualifier below a verified/afterDedup threshold.

- [Should-fix] [depth-cap spec] "Problem" + "Cost effect" — The founding premise "Judges are the dominant cost" is asserted without measurement; the accounting reasons in dispatch counts only, omitting judge retries, the unchanged unbounded opus critic spend, and the new dedupe call whose input scales with the very critic verbosity the Problem blames.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: critics run on opus with web research (verified pricing: tiers ~1.7-2.5x apart per token, not orders of magnitude), judges on sonnet scoped to one finding; no cost target or acceptance criterion exists; Out-of-scope forecloses the accounting that would reveal it.
  fix-shape hint: run the proposed spike — instrument one real run, log tokens per dispatch label weighted by tier price; if judges are under ~50% of spend, redirect the cost work at the critic pool.

- [Should-fix] [depth-cap spec] "Approach" + "Verification" — Under-merging now destroys verification coverage rather than merely costing extra judges: near-duplicate copies of one issue can consume the cap's slots and push genuinely distinct equal-severity findings below the cap; the spec treats merge quality purely as a cost concern.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: the workflow itself notes overlapping lenses restate the same issue (premortem ≈ failure-mode ≈ domain expert); pre-change a missed merge cost 3 redundant dispatches, post-change it silently starves coverage; no per-root-claim slot bound exists.
  fix-shape hint: add a per-root-claim slot bound (or state that dedup accuracy is now load-bearing for coverage and mitigate accordingly).

- [Should-fix] [depth-cap spec] "Dedup-and-rank agent" step 2 — Blast-radius grading, which now decides what gets verified, is performed without access to the design under review: the prompt passes only pooled findings JSON with no spec path, unlike every other role in the pipeline — rewarding rhetorical force over structural severity.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: dedup-rank-prompt.md:18-19 substitutes only [FINDINGS_JSON]; critic/triage/judge prompts all carry [SPEC_FILE_PATH]; "if this is true, how bad is it?" is a question about the design's architecture the grader cannot check.
  fix-shape hint: thread specPath into the dedup-and-rank prompt, matching the other role prompts' contract.

- [Should-fix] [depth-cap spec] "Verification (above vs below the cap)" — The bypass protects the BLOCK gate but not REVISE: a major graded at rank 11+ can never be confirmed and so can never trigger REVISE, and because ranking is severity-descending the cut systematically lands inside the major tier — with no stated rationale for the asymmetry.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: the bypass's own justification ("never leaves a potential blocker un-verified") applies identically to majors, since REVISE exists precisely to gate on confirmed majors; on a rich spec REVISE under-triggering is structural, not incidental.
  fix-shape hint: extend a bounded bypass to majors, or explicitly document why REVISE is accepted to be less protected than BLOCK.

- [Should-fix] [depth-cap spec] absent — validation/measurement — The change ships with no validation plan, no acceptance criteria, and no post-hoc detectability for the central failure it introduces: a real blocker cut by the cap leaves no distinguishable trace, and grading accuracy of the new lossy stage is never measured.
  verdict: confirmed (reproduce ✓ / refute ✗ — killed, outvoted 2-1 / ground ✓)
  evidence: no experiment compares unlimited-vs-medium confirmed sets; the surrounding skill already admits "roast's own false-positive/false-negative rate is unmeasured," and this adds a new lossy stage to that blind spot. (Refute's point that below-cap items are listed was absorbed: a listed item with a wrong severity label is still undetectably mis-triaged.)
  fix-shape hint: add an acceptance criterion (e.g. target blocker-grading recall) and one unlimited-vs-medium comparison run before shipping.

- [Should-fix] [depth-cap spec] "Verification" → below-cap + "Report changes" — Below-cap findings bypass the existing human-escalation channel: a below-cap major with `external: true` (unresolvable without research nobody will now do) gets strictly weaker handling than an identical finding that reached the panel and returned UNVERIFIED; the `external` flag survives into the schema but is never consulted.
  verdict: confirmed (reproduce ✓ / refute ✗ — killed, outvoted 2-1 / ground ✓)
  evidence: roast-workflow.md:96 escalates judge-level UNVERIFIED externals to human; below-cap items get a severity-only listing with a re-run nudge that, for a genuinely external claim, just re-spends judges to reach the same UNVERIFIED outcome. (The finding's "counts can disagree" aside is wrong — belowCap is a strict partition — and is discarded; the escalation asymmetry stands.)
  fix-shape hint: surface the `external` flag on below-cap lines, or fold below-cap externals into the Escalations channel with a reason tag.

- [Should-fix] [super-roast spec] §2 (Triage) — A dead triage agent silently drops every conditional PR lane (all 7) and every domain scout with no coverage signal, degrading to core lanes only — precisely the "silent gap" §2 says the recall-leaning design exists to prevent — while the report claims whatever lanes it lists ran.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: `triage?.lanes ?? []` (super-roast-workflow.md:137-140) collapses PR scoutNames to coreLanes; no `triageDead` in coverage; none of the reporter's three low-coverage triggers fires. (Ground seat notes design mode's widenLenses fallback blunts the domain-scout half; the PR-lane half stands in full.)
  fix-shape hint: add triageDead to coverage and to the low-coverage trigger list; treat a null triage as low coverage, not as "no lanes needed."

- [Should-fix] [super-roast spec] §6 severity floors — Floor 3 ("violation of the artifact's own stated core purpose → Blocking") cannot be applied by the only stage authorized to apply it: the reporter never receives the artifact or its stated purpose, so the floor is either skipped or applied from a guess.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: reporter inputs are exactly packets+profile+prior report (workflow.md:179); no packet field carries the artifact's purpose; unlike floors 1-2, floor 3 is relational and needs the reference point the architecture withholds. Judges' own Blocking rubric partially compensates, which is why this is Should-fix not Blocking.
  fix-shape hint: pass a one-line stated-purpose excerpt to the reporter, or define floor 3 as satisfied by any confirming seat vote already at Blocking-for-core-purpose.

- [Should-fix] [super-roast spec] §3 + §Report format — Design-mode spike recommendations are produced by scouts, preserved through dedupe and the engine schema, then dropped at the last stage: no report section, reporter instruction, or output field carries them to the human — while the surviving brainstorming integration promise is precisely that roast surfaces assumptions "that need a spike first."
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: `spike` threads through scout-prompts-design.md:67, dedupe-prompt.md:28, and both engine schemas, then appears exactly once in reporter-prompt.md (:31, as an unused field description); the template and output contract have no slot for it.
  fix-shape hint: add a spike line to Confirmed/Escalations entries for UNVERIFIED-ASSUMPTION findings (Question / Cheapest test / Kill criteria).

- [Should-fix] [super-roast spec] §4 + §Report format — Findings past the remainder cap are reduced to a bare integer (`beyondCapCount`) that never appears in the report markdown — a regression from the prior design's explicit "listed, never discarded" rule — while SKILL.md promises a "Below cap … listed not dropped" line the verbatim reporter template has no place for and no data path to fill.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: dedupe-prompt.md:45-46 drops the findings; the engine surfaces `beyondCap` only in the returned coverage object (workflow.md:187), which is never an input to reportMarkdown; SKILL.md:120 contradicts the authoritative template it points to.
  fix-shape hint: reconcile SKILL.md with the template, and pass beyondCapCount to the reporter so the report can at least state the overflow count.

- [Should-fix] [super-roast spec] §Goal + §4 + §5 — Judge fan-out is unbounded: every Blocking/Should-fix candidate gets 3 seats uncapped, plus 3 more per promoted nit, with an explicit "no depth cap here" — so verification cost again scales with scout verbosity, the exact failure the superseded design's depth cap was introduced to fix, removed with no replacement bound and no stated worst-case cost.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: dedupe-prompt.md:43 "Keep EVERY finding suggested Blocking or Should-fix — never capped"; worked case reaches 320 sonnet dispatches for one review; the spec states "cost-efficiently" as a goal but no expected or worst-case cost anywhere.
  fix-shape hint: state an expected/worst-case cost and add a soft ceiling or escalation when severe-candidate count exceeds a sanity bound.

- [Should-fix] [super-roast spec] §5 spot check — An under-graded severe finding is checked only by the refute seat — the seat whose procedure is to kill findings — and if refute rejects it, routing forbids ever confirming it: a real Blocking finding the dedupe graded Nit exits as an "Unverified nit" outside super-plan's fix loop, via exactly the single-method judging §Why warns about.
  verdict: confirmed (reproduce ✓ / refute ✗ — killed, outvoted 2-1 / ground ✓)
  evidence: promotion depends entirely on the same single seat; reporter routing is absolute ("never 'confirmed'"); requires a compound failure (dedupe mis-grade + refute miss), which is why Should-fix. (Refute dissent — documented cost tradeoff — did not survive the majority's point that the named mitigation is a single point of failure.)
  fix-shape hint: auto-promote any spot finding where the refute seat's own severity judgment exceeds dedupe's suggested severity, regardless of its verdict.

- [Should-fix] [super-roast spec] §7 + §Integration changes — The entire fix-and-re-roast loop rests on super-plan gaining capabilities it does not have today (report ingestion, fix ladder, re-roast decision), called a "small edit" while the mechanics are out of scope — so every claimed convergence property is owned by a skill this spec neither specifies nor tests, and the current integration direction is the reverse.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: super-plan/SKILL.md is a decomposition planner with no such steps and states "roast is offered once, at the root"; the state carriers the loop needs (iteration counter, confirmed-Blocking diff) don't exist in its durable-state model; nothing in the testing plan exercises the loop.
  fix-shape hint: run the proposed spike — draft the concrete super-plan diff including a cycle guard; if it touches super-plan's traversal/state model, the loop needs a real owner and spec.

- [Should-fix] [super-roast spec] §7 convergence guards — The 3-iteration hard cap and early-stop guard are unenforceable as specified: iteration state exists only if the caller remembers to hand back the prior report path, no stage discovers already-written `-roast-N.md` files, and an empty priorReport silently resets the counter — the session-memory dependence super-plan's own core principle rejects.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: engine takes `priorReport` as an already-resolved string (workflow.md:130); reporter-prompt.md:122-123 treats empty as "iteration 1"; a glob of the report directory would derive N from the spec's own filename scheme, but no stage is told to do it.
  fix-shape hint: derive iteration N by globbing the reviews directory for the topic's report files instead of trusting the handed-back path.

- [Should-fix] [super-roast spec] §1 + §Report format — In PR mode the report is written into the working tree while PR-mode inputs explicitly include the working tree, so a re-roast reviews its own previous report as part of the diff — self-amplifying across loop iterations — with no exclusion of the reviews path, commit-first rule, or out-of-tree write specified.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✗ — scope-only rejection)
  evidence: report path is in-repo; §7 requires the file to persist between iterations as the only cross-iteration state; the Hygiene+Docs lane activates on exactly such doc changes; synthetic meta-findings can defeat the early-stop guard. (Ground seat's REJECT was administrative — it was handed the wrong spec path and declined to evaluate — not a substantive refutation; arithmetic and the two substantive seats stand.)
  fix-shape hint: exclude docs/superpowers/reviews/ from the PR-mode diff (or require the report be committed/ignored before re-roast).

- [Should-fix] [super-roast spec] §1 + §6 — Pre-flight environment-profile inference — the lever that moves the Should-fix↔Nit boundary and down-weights whole lanes — runs inline in the main session, which on the brainstorming-gate path is the session that authored the spec: author bias re-enters through the one input the design says shifts severity, and the only remedy is re-running the same biased stage.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: pipeline table row 1 "(inline, main session)"; profile arrives pre-computed in args (workflow.md:130); severity floors stay profile-proof (which bounds this to Should-fix), but the Should-fix↔Nit boundary and lane weighting are exposed.
  fix-shape hint: compute the profile in a dispatched isolated agent (or at minimum flag in the header when the profile was inferred by the authoring session).

## Rejected (with reason)        ← so re-roasts don't re-litigate
- [depth-cap spec] "Depth levels" / brainstorming path — claim that the re-run-deeper remedy is structurally unreachable on the auto-gate path: rejected 2/3 — conflates the BLOCK/REVISE re-roast iteration cap with depth re-invocation, which is a separate, uncapped, human-triggerable call; the manual "deep roast" path plus below-cap listing is the design's documented tradeoff.
- [depth-cap spec] "Report changes" vs Red Flags — claim that below-cap findings ship with no marker distinguishing triage grades from panel-confirmed severity: rejected 3/3 — the mandated "Not verified (below cap)" heading, distinct line rendering, and (in the successor) disjoint severity vocabularies are exactly that marker.
- [depth-cap spec] "Dedup-and-rank agent" + "Files touched" — claim that the manual-fan-out and inline execution tiers are left without workable mechanics: rejected 3/3 — cap/bypass/passthrough are specified as tier-agnostic prose in Steps C/D/F; inline degradation is a pre-existing, generically-labeled tradeoff covering every stage.
- [super-roast spec] pipeline rows 4/6 — claim that `fable` is an unvalidated/invalid model tier that would fail mid-run: rejected 3/3 — `fable` (claude-fable-5) is a real, GA, harness-recognized model alias, and the design's own testing plan schedules live runs before cutover (in progress as Task 8).
- [depth-cap spec] "Report changes" below-cap field list — spot refute killed: the enumerated fields are an illustrative summary, not a schema (the spec's two descriptions of the section already differ), and the literal line format is explicitly delegated to the workflow doc, which includes the claim text.
- [depth-cap spec] "Depth levels" (YAGNI, four levels) — spot refute killed: most of the cited machinery is needed for any ≥2-level scheme, and one under-threshold sample (19 findings) cannot show deep≡unlimited in general; the Problem section anticipates the higher-volume case where they diverge.
- [depth-cap spec] "Dedup-and-rank agent" item 1 (YAGNI, merge into LLM) — spot refute killed: the added cost is explicitly stated and accepted in §Cost effect; merge determinism is not a promised property, and merge semantics are specified unchanged.
- [depth-cap spec] "Blocker bypass" (YAGNI, self-defeating justification) — spot refute killed: "rarely fires" is the cost half of a coherent insurance argument, not an admission of uselessness; the eval cited predates the mechanism and never exercised it.
- [depth-cap spec] "Problem"→"Approach" (no alternatives-considered section) — spot refute killed: the rejection rationale for both alternatives is derivable from the Problem section's no-silent-drop principle and the Out-of-scope list, and the alternatives-ledger convention is only mandated for Mode B specs, which this is not.
- [super-roast spec] §Execution vs §Report format (independence label) — spot refute killed: the capability ladder explicitly overrides the header label for the inline-degraded path, and the verbatim template is only ever dispatched on paths where a real panel ran; at most a robustness nit about a missing placeholder.
- [super-roast spec] §Report format `<topic>` derivation / reviews dir creation — spot seat rejected on scope only (it was handed the depth-cap spec and declined to evaluate a finding about the successor spec). Rejection is administrative, not substantive — re-examine when the 2026-07-29 spec is roasted directly.

## Unverified nits (spot-checked)
- [depth-cap spec] Dedupe grading re-derives a ranking key while discarding the free per-finding signals critics already emit (`importance`, `uncertainty`, duplicate-count consensus), with no comparison of code-side ranking against the paid LLM grade.
- [depth-cap spec] Grading inside an LLM whose input embeds verbatim quotes from the reviewed document creates a prompt-injection path (suppress grades to minor → push findings past the cap) absent from the code merge; no threat model stated. Relevant mainly when roasting RFCs the reviewer did not write.
- [depth-cap spec] Top-X selection by severity alone can concentrate the entire verified set in one lens/domain while the coverage line counts lenses that ran, overstating verification breadth.
- [super-roast spec] The derived files contradict each other on what `fable` is (SKILL.md: cost-saving bounded tier "off opus"; both prompt files: "frontier judgment"/"highest reasoning tier") with no tier ladder to arbitrate — mutually exclusive rationales a future re-tiering could cite.
- [super-roast spec] The environment-profile signal list is classified as editable "data" but has no prompt file or args slot to live in — it survives only as spec prose no runtime stage loads.
- [super-roast spec] Mode resolution has no defined outcome for an ambiguous non-interactive invocation: guessing is forbidden, asking is impossible, and the residual case has no defined error.

## Escalations (need human)      ← UNVERIFIED externals, incomplete panels, material dissent
- None. All 38 panels returned 3/3 valid votes, no vote anywhere was UNVERIFIED, and every mixed panel resolved cleanly by arithmetic with the dissent examined. (Run-level anomaly worth the human's attention, though not a finding escalation: the packet set spans two specs — the stated 2026-06-16 input and its 2026-07-29 successor — suggesting the run's scouting scope drifted to the superseding design; the report labels every finding by the artifact its evidence cites.)