# Audit of "Improving alepar/superpowers" against the actual super-* skills

Date: 2026-09-04 · Repo: alepar/superpowers @ 166cd9d (v6.3.0-alepar3.3) · Mode: standard
Evidence files: `sources.jsonl`, `claims.jsonl`, `run_manifest.json` (same directory)

## Executive summary

The external summary was written without access to the five skill files and says so. Read against the real skills, its picture is roughly half right. Its evidence base holds up well: every paper and lab report it cites exists and says what it is quoted as saying, with one version drift in the MAST percentages [S5] and one attribution the summary got right that my first abstract-only fetch missed (the Xu paper does define textual/build/semantic conflict layers [S2b]). Where the summary goes wrong is in what it assumes the skills do.

Four of its load-bearing descriptions of the system are stale or mistaken. The roast loops already have evidence-gated early exits (`[converged]` and thrash), so R1 is mostly implemented. The PR-mode loop already has a precision gate (dedupe, tiered three-seat panel with 2-of-3 confirm, reporter floors), so R3's premise is false. Dispatch is not gated on file disjointness at all; the seam-contract machinery in super-design is essentially the "interface freeze" R6 asks for, and the merge path already rebases, gates, and runs a seam review. And the system has been run live: the first end-to-end super-auto run happened in August 2026, super-code has been hardened against ~190-bead epics, and issues #2 through #4 came out of those runs [L7].

Two of the summary's concerns survive contact with the code and deserve action. First, nothing anywhere in the pipeline guards test integrity: no test-file-edit flag, no held-out tests, no explicit hunt for weakened or hardcoded tests [C8]. EvilGenie's own data says the cheap version of this (a test-file diff flag plus an LLM judge) is what works, and the held-out partition the summary leads with gave "only minimal improvement" [S6]. Second, the constants the summary questions (the per-task 5-round cap, the three-seat panel, hot-file cap 3) are unmeasured in the sense that matters: the artifacts to measure them already exist (per-seat votes in reporter packets, per-round fix-loop ledger lines, the parallelism detector line) but nothing aggregates them. Three July 2026 papers on repair-loop budgets [S13, S14, S15] make this the most valuable cheap change.

The judge-panel recommendation (R4: collapse to one ground seat) should not be adopted yet. Kohli's result [S1] is real and applies (same-family seats are not independent votes, which super-roast already states in its header). But the local eval [L6], though a single fixture, shows the refute seat doing the work on the false positive, and Kohli's judges differ by model and prompt wording, while super-roast's seats differ by procedure (one executes, one fetches web evidence). Measure per-seat agreement on a real run first.

## Introduction and method

The user asked three things: re-orient on what the super-* skills actually do, double-check the summary's claims, and formulate an improvement plan. I read all four SKILL.md files in full, plus the judge-seat prompts, reporter prompt, the roast workflow, the SDD fix-loop section, and the local judge-seat eval record, and grepped the 380 KB coordinator workflow for stopping, test-integrity, and merge-back rules. I then verified every external citation the summary relies on at abstract level, and at full-text level for Kohli and Xu via the `search` CLI, and ran two searches for 2026 work the summary did not have. Assumptions: the local skills are ground truth; the summary's "Part 2" description of the skills is superseded wherever they disagree.

## Finding 1: what the skills actually do (the re-orientation)

**super-auto** owns sequencing only: super-design → super-roast (design, inside super-design) → super-code → super-roast (PR) → fix loop → report → finishing-a-development-branch. Four flags. One human gate in autonomous mode: super-design's top-split. The code-roast fix loop caps at 3 and exits early on thrash (Blocking count did not shrink) or `[converged]`. Cap-exhausted-with-Blocking is recorded machine-readably (`roastCodeCapped:`). The run never merges to base unattended [L1].

**super-design** brainstorms a root spec, decomposes with explicit `owns:`/`consumes:` boundary declarations, runs a fresh-context promotion review, gates once at the top split, recurses, then runs a coverage loop of exactly two rounds with 3 fresh opus reviewers per pass, union-then-verify-then-apply, with a divergence observation. Finding types include GAP, ORPHAN, NARRATIVE-EDGE, UNOWNED-SEAM, UNSATISFIABLE-ACCEPTANCE, UNEXERCISED-CONFIGURATION. UNOWNED-SEAM produces a `Seam contract:` bead (compilable stubs, merged before participants) and a `Seam integration:` bead. An `Integration sweep:` bead depends on every leaf. The design roast loop caps at 3 with one extension and hard-stops as `capped-blocking` [L4].

**super-code** runs an epic-scoped `bd ready` loop with a sliding window (default concurrency 16), hot-file cap 3, single-flight merge queue with rebase, per-merge gate, a seam review when the rebase lands on siblings that touched the same files, and mid-round top-ups. The per-task brief/implement/review/fix pipeline is upstream SDD's, byte-identical: 5 fix rounds, rounds 4 and 5 on a more capable fresh implementer, an opus adjudicator at the cap that parks or blocks. The coordinator persists a parallelism detector line per round and can dispatch report-only edge audits [L3, L5].

**super-roast** is find → dedupe → verify → report. Scouts (opus, fresh context) across lanes; dedupe with a remainder cap; a panel cap of 12; Blocking/Should-fix candidates get three seats (reproduce / refute / ground, sonnet, 2-of-3), nits get a refute spot check with promotion. Rounds ≥ 2 run a late-round stance and a regression lane. The report carries a `delta vs prior` line and `[converged]`, and an `independence:` line derived from the seats actually dispatched [L2].

## Finding 2: claim-by-claim verdict on the summary

| Summary claim | Verdict | Evidence |
|---|---|---|
| Fixed 3/5/3 caps with no evidence-gated stopping | **Half wrong.** Both 3-caps already stop on `[converged]` or thrash. The 5-cap is SDD's and exits only on CLEAN; SDD forbids early adjudication by design. | C1, C2 |
| Coverage check is under-instrumented, no measured gate | **Partly right.** Two fixed rounds with a divergence count; no requirement→task traceability count. Top-split gate already is the decomposition-time human gate R7 asks for. | C3, L4 |
| PR-mode loop has no precision gate | **Wrong.** Dedupe → tiered panel → reporter floors; only Confirmed findings become beads. | C4 |
| Judge panel likely ~2 effective votes | **Applies, already acknowledged.** Kohli verified (n_eff 2.18, CoT 1.94). super-roast's header states same-family ≠ independence. Local eval shows seat-split beat identical panel on one fixture. | C9, C10 |
| Disjoint-file dispatch is unsound | **Mischaracterized.** Dispatch is not gated on overlap. Hot-file cap, rebase, gate, seam review exist. Xu's 41.7% verified and the three-layer model is in the paper. | C5, C15 |
| Contract-freeze step needed (R6) | **Mostly exists** as seam contracts + owns/consumes. Not measured. | C6 |
| System has never run end-to-end | **Stale.** Live since 2026-08. | C7 |
| Reward hacking under TDD is unguarded | **Right.** No test-edit flag, no held-out tests. EvilGenie favors judge + edit flag over held-out partition. | C8, C14 |
| Beads hygiene / 25k-token JSONL limit | **Stale premise.** bd here is Dolt-backed. Tripwire bounds tree size. | C20 |
| Clean-context review, single-writer, human owns merge: keep | **Right, verified.** | C17, C18, C19 |
| Don't adopt topology search / more seats / parallel writers | **Right.** No change. | S9, S1 |

Version note: the summary quotes MAST as 41.77 / 36.94 / 21.30; the current HTML reads 43.9 / 31.35 / 23.5 [C16]. The ordering and the conclusion hold. Kohli is a single author, not "et al."

## Finding 3: what the 2026 literature adds

Three papers the summary did not have sharpen R1. "Is Three the Magic Number?" [S13] finds across code generation, test generation, and translation that the first three to four repair iterations capture most gains and that orchestration and feedback design matter more than the model. That is consistent with SDD's shape (resume for 3, fresh capable model for 4 and 5), and suggests the 5-cap is not far off. VRR-Stop [S14] shows that with a noisy verifier, fixed-round repair damages already-correct outputs and a marginal-gain stopping rule beat fixed 5 rounds by 60 points on a math stress set. The domain is not code, but the mechanism (reviewer noise plus repairer damage) is exactly the per-task loop's risk. Semantic early-stopping [S15] is a third data point that `max_iterations` alone is the wrong control.

Kamoi and Huang [S3, S4] are more favorable to the current design than the summary suggests: both say self-correction fails without external feedback and works with reliable external feedback. Every loop here is fed by an external signal (tests run by the implementer, a fresh reviewer, judge seats that execute or fetch evidence). The risk is not that the loops are intrinsic; it is that the reviewer is noisy, which is S14's point.

## Finding 4: what is genuinely missing

1. **Test integrity.** Nothing flags an implementer editing, deleting, or skipping tests, or hardcoding expected values. SDD's reviewer asks whether tests "verify real behavior", and super-roast has a `testing` lane, but neither is told to diff the test tree against the brief. EvilGenie observed Claude Code doing exactly this [S6].
2. **Measurement of the constants.** Per-seat votes exist in reporter packets but no agreement statistic is emitted. SDD writes `fix round R/5 (X addressed, Y open)` per round but nothing aggregates yield-per-round across an epic. Merge-back outcomes (rebase conflict, seam review fired, gate failed) are not persisted as a per-task line the way the detector line is.
3. **Scope filter at fix-bead filing.** super-auto phase 5 files every Confirmed finding. Judges are told "material against the spec's stated requirements", so scope is partly judged, but nothing with the run's own goal and codebase context filters findings the way Cognition's coder-filters-reviewer bridge does [S9].
4. **Requirement traceability count.** Coverage reports GAP findings and a divergence trajectory, not "goal requirements with zero mapped tasks".

## Recommendations

Ordered by payoff over cost. Each names the owning skill per the boundary rules (super-auto may only grow in sequencing; per-task review quality belongs upstream in SDD, which must stay byte-identical, so per-task changes land in super-code's coordinator or in super-roast).

**P1. Instrument before changing any constant** (cheap; all data already exists).
- super-roast reporter: add to the `coverage:` line the pairwise seat agreement over panel findings and the count where the ground seat alone would have produced the same verdict. Votes are already in `votes[]`.
- super-code coordinator: persist a `Merge: <task> — rebase <clean|conflict>, seam-review <n/a|fired|fix>, gate <pass|fail>` ledger line per merge, next to the detector line. Aggregate fix-loop yield per round at Finish from SDD's existing ledger lines.
- super-auto report-prompt: surface both aggregates.
- Falsification: if a real epic shows seat agreement > 0.95 and ground-alone parity, R4 becomes worth doing; if rounds 4 and 5 rarely flip a finding to ADDRESSED, that is evidence for a lower cap or an earlier adjudicator.

**P2. Test-integrity flag** (cheap; the highest-confidence gap).
- super-code: at review-package assembly, diff test files between base and head and attach a `Test changes:` block to the reviewer's inputs; a deleted, skipped, or loosened test with no brief justification is a Critical finding. This is coordinator-side, so SDD stays byte-identical.
- super-roast `testing` lane: add explicit hunts for hardcoded expected values, assertions weakened in the diff, and test files removed.
- Do not add a held-out partition or CapReward; both need randomized test construction that a skill cannot supply, and EvilGenie found held-out tests added little over a judge.

**P3. Scope filter on phase-5 fix beads** (cheap).
- super-auto: before filing, one dispatched pass with the run's spec and goal decides in-scope vs. punch list for each Confirmed finding; out-of-scope goes to `report.md`. This is sequencing, so it stays in super-auto's dimension.

**P4. Unmapped-requirement count in coverage** (moderate).
- super-design coverage-reviewer prompt: have the root pass enumerate the goal's requirements and emit `requirements: N, unmapped: M` in the round summary. Do not make it a new gate; the top-split gate already sits at decomposition time.

**P5. Evidence-gated per-task stopping** (deferred until P1 data exists).
- The per-task loop's only early exit is CLEAN, and SDD explicitly forbids adjudicating before the cap. S14 argues for a marginal-gain rule. This is an SDD change and needs eval evidence before proposing upstream; P1's yield-per-round data is that evidence.

**Do not do:** R4 as written (single ground judge) until P1 data exists; R8 beads hygiene (stale premise); R9 to R11 are already the design.

## Limitations

Papers were verified at abstract level except Kohli and Xu (full text via search). The local judge-seat eval is one fixture with four findings. I did not read the 380 KB coordinator workflow in full; grep may have missed a test-integrity rule phrased differently. Live-run measurements quoted in the skills were taken as stated, not re-derived.

## Bibliography

- [S1] Kohli, "Nine Judges, Two Effective Votes," arXiv:2605.29800; [S1b] full text v1, Table 4 and Appendix H.
- [S2] Xu, Subramanian, Karthik, "AI Agent Pull Requests on GitHub," arXiv:2607.04697; [S2b] v2 HTML.
- [S3] Kamoi et al., TACL 2024, arXiv:2406.01297.
- [S4] Huang et al., ICLR 2024, arXiv:2310.01798.
- [S5] Cemri et al., MAST, arXiv:2503.13657 (HTML).
- [S6] EvilGenie, arXiv:2511.21654 (v2 HTML).
- [S7] Lodkaew et al., CapCode/CapReward, arXiv:2606.07379.
- [S8] SpecBench, arXiv:2605.21384.
- [S9] Cognition, "Multi-Agents: What's Actually Working," cognition.com/blog/multi-agents-working.
- [S10] McAleese et al., CriticGPT, arXiv:2407.00215.
- [S11] Cursor, "Agent swarms and the new model economics," cursor.com/blog/agent-swarm-model-economics (figures via the-decoder.com and explainx.ai summaries).
- [S12] METR, "We are Changing our Developer Productivity Experiment Design," metr.org/blog/2026-02-24-uplift-update.
- [S13] "Is Three the Magic Number?", arXiv:2607.05197.
- [S14] VRR-Stop, arXiv:2607.17641.
- [S15] "Semantic Early-Stopping for Iterative LLM Agent Loops," arXiv:2606.27009.
- [L1–L7] local skill files, eval record, and git log as listed in `sources.jsonl`.

## Methodology appendix

Local reads: super-auto/SKILL.md, super-roast/SKILL.md, super-code/SKILL.md, super-design/SKILL.md (full); judge-seat-prompts.md, reporter-prompt.md, super-roast-workflow.md, scout-prompts-pr.md, SDD SKILL.md §4–5, task-reviewer-prompt.md (targeted); coordinator-workflow.md (grep only); eval-record.md (full); README.md and git log (grep). Web: WebFetch on 10 abstracts and the Cognition post; `search` CLI (academic and general modes) for Kohli full text, Xu full text, Cursor figures, and two 2026 literature sweeps. Claims ledger: 20 claims, 18 supported, 1 partially supported, 1 supported with a domain caveat.
