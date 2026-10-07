# Refinement log — response to critique 1

Inputs: [critique-1.md](critique-1.md) (independent critic), `critique/recommendations-v1.md`
and `critique/report-v1.md` (the drafts it reviewed; both on branch `research/oop-design-scouts` at commit `a4ee3d5`, which is not on `main`). Outputs: [../recommendations.md](../recommendations.md)
(v2) and [../report.md](../report.md) (revised). Before accepting any objection the lead re-checked
its evidence: every repository citation the critic used was read at the cited lines, and every
literature claim was looked up in the evidence ledger (`tools/claim_tool.py find`). No objection
rested on a misread source.

## Verification of the critique's evidence (lead)

| Critic's evidence | Checked | Result |
|---|---|---|
| Digest budget `coverage-inputs` ≤ 60000 bytes | `skills/super-design/scripts/coverage-inputs:16`, `:126-128` | Confirmed |
| Shared preamble in every lane prompt; PR adjustments appended to every seat | `skills/super-roast/scripts/assemble-args.mjs:176-190`, `:241-249` | Confirmed |
| Blocking definition; core-purpose floor | `skills/super-roast/judge-seat-prompts.md:71-72`; `skills/super-roast/reporter-prompt.md:132-142` | Confirmed |
| Fix beads change code, not bead text; redesign amends spec sections | `skills/super-auto/SKILL.md:327-342`, `:243-248` | Confirmed |
| "hold pointers… not copies"; sequencing-only boundary | `skills/super-auto/SKILL.md:31-36` | Confirmed |
| Micro-test method at `:575-585` ("5+ reps per variant. Single samples lie."); `:459` is "Match the Form to the Failure" | `skills/writing-skills/SKILL.md` | Confirmed — v1 cited the wrong range |
| Fallback mode runs one chain at a time, no early-unblock claims | `skills/super-code/coordinator-subagents.md:7-11` | Confirmed |
| Mode B for small designs; Mode A per-section approval | `skills/brainstorming/SKILL.md:77-84` | Confirmed |
| Tuned implementer scope text | `skills/super-code/implementer-prompt.md:70-74` | Confirmed — v1 §6.5(3) would have reversed it |
| Integration-sweep edges use the sweep token | `skills/super-design/SKILL.md:504-513` | Confirmed |
| Fallback report renders entry lines only; `[fix-regression]` tag mechanism | `skills/super-roast/super-roast-workflow.md:549-556`, `:595-604` | Confirmed |
| Fork has no `dev` branch | `git branch -a`; remotes `origin` (alepar) and `upstream` (obra) | Confirmed |
| [165] split only where interfaces are "likely to be very stable"; [166] specs "often outdated" | evidence ledger | Confirmed |
| [141] Kotlin treats all exceptions as unchecked | evidence ledger | Confirmed — v1 table was wrong |
| [265] YAGNI "does not apply to effort to make the software easier to modify" | evidence ledger | Confirmed |
| [237] default AI code "consistent with oversimplification… missing abstractions" (preprint) | evidence ledger | Confirmed |
| [187] +90.2% multi-agent on research eval; coding has fewer parallelizable tasks | evidence ledger | Confirmed |
| [191] up to 2.10× wall-clock speedup (abstract) | evidence ledger | Confirmed |
| [126] Aspirator would have prevented over 30% of catastrophic failures | evidence ledger | Confirmed |
| Planted-defect refutation argued on the merits; dead seats; stack-less log as Nit | `docs/superpowers/reviews/2026-07-30-planted-defect-branch-roast-1.md:45`, `:50`, `:61-64` | Confirmed |
| `8e1262a` claims fidelity; one fix wave credited to the Global Constraints header | `git show 8e1262a` | Confirmed |
| Feedback draft `:8` remedy is cadence; `:49` "keep separate" is about other ongoing work | `docs/superpowers/feedback/2026-10-06-in-round-step-backs/upstream-feedback-draft.md` | Confirmed — v1 §12 misattributed `:49` |
| Parked graph-pass cuts were Markdown heading names and a shared file | `docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/run.md:43-48` | Confirmed |
| v1 cited `tests/super-roast/test-assemble-args.sh:30` for the design rosters | file re-read | Critic correct: the roster assertion is `:44`; the lead's own `audit/VERIFICATION.md` note was also wrong and is corrected |

## Dispositions

| # | Objection (short) | Disposition | Change in v2 / report |
|---|---|---|---|
| 1 | Digest copied into every prompt; seat costs omitted | **Accepted** | Digest becomes a committed file read in full only by the contract scout; judges get a pointer line (rec §5.3). Costs recomputed with recorded seat rates (~7 seats per PR scout, ~16 per design scout) in §5.3, §5.6, §10; agents-per-round bar in §9 |
| 2 | Design sketches as binding requirements → rigidity loop, Blocking inflation, stale contracts | **Accepted** | Binding only for compiled seam-contract code and lines marked stable; "intent, may evolve" label; judge sentence on moved consumers and stale context; "contract stale" → FYI with a phase-6 suggestion; §5.7 now states Blocking is possible; E1 includes a legitimate-refactor case; scope-filter decision deferred (§13.1) |
| 3 | Eval can pass without improvement; underpowered; ungated changes | **Accepted** | Held-out defects by someone blind to briefs plus mined real fixes; ≥5 reps per arm, pre-registered bars, CIs; traps ≤10%; E3 is a non-degenerate three-arm ablation; E8 on a 2–3-unit change; every change on its own branch with its own gate; shadow mode (S) before any fix-loop lane; eval cost re-estimated at 5–10× |
| 4 | Proactive seam contracts widen silent drift; no gain in fallback; three entry points | **Accepted** | All new triggers deferred until the stacked-consumer gap is closed (C-b); Workflow-only when revisited; no-signature-change rule in the contract's own fix pass; silent-drift count in E7 |
| 5 | "Units and interfaces" is a disguised ceremony with OOP-centric binding fields | **Accepted** | Replaced by a cross-bead seam note (owner, consumers, boundary failure contract, stable/intent) only for interfaces consumed by a non-owner child; Mode A unchanged; E8 measures ceremony |
| 6 | error-lifecycle duplicates existing hunts; self-contradiction; table errors | **Accepted** | Pilot only the five unowned classes inside `correctness`; single-statement patterns → linters (Aspirator evidence); canon table fixed (Kotlin row split, Go facts cited to [102]/[103]); dedicated lane only on measured gain |
| 7 | simplicity refinements duplicate items and lean anti-abstraction | **Accepted** | Dropped the encapsulation restoration and the duplicated-decision item; kept the size/depth rule; counterweight folded into item 7; over-engineering rephrased to include modifiability/testability gains; Go type switch, DI test seam, sealed-switch and ABC exemptions |
| 8 | Headline evidence misread | **Accepted** | Report and plan corrected: planted refutation argued on merits; dead seats; "highest-leverage" → "first hypothesis to test"; [271] labelled preprint, "largest" removed; `8e1262a` claims fidelity only; [190] and [191] both cited as small preprints; [187] used for its parallelizability caveat; [198] removed from the contract-first table; feedback `:18`/`:8`/`:49` corrected; graph-pass cuts described as Markdown heading names |
| 9 | More verification claimed than done | **Accepted** | A `path:line` checker now runs over report.md and recommendations.md (`tools/check_doc_citations.py`, results in VALIDATION.md); wrong citations fixed; VALIDATION.md filled with real outputs; critique and refinement files exist before the report refers to them |
| 10 | Boundary conflicts missing from §13 | **Accepted** | Digest script lives in super-design; dedicated `--contracts` flag; super-auto passes pointers only; super-code seam carry-through and reviewer seam checks withdrawn; engine seam logic and fallback parity listed as human decisions (§13.4); v1 §6.5(3) dropped |
| 11 | New super-code lines recreate the hunted defect; guessed signatures; planner cost | **Accepted** | Implementer reduced to one conditional error-contract line; `Interfaces:` entries for in-flight producers are provisional and sourced from `owns:`/seam notes; `Builds on:` deferred; planner latency measured in E5 |
| 12 | contract hunt 5 misreads `owns:` | **Accepted** | Hunt 5 narrowed to "a declared boundary now has two definitions in code" |
| 13 | Bundling; wrong delivery branch | **Accepted** | One change per branch into the fork's `main` with its own eval; drift fix (A3-F16) separate; "PR to dev" removed |
| 14 | Mechanics loose ends; cheaper alternatives | **Accepted** | Design lens made an explicit decision with seat-inclusive cost; dedicated `--contracts`; "inactive" coverage line; precheck exempts the sweep; lane attribution moved to an engine-appended tag (Phase 0); cheaper probe R-c0 (spec path as stated intent) and the existing final whole-epic review added as first steps |

## Residual disagreements

None material. One nuance the lead keeps: the critique's verdict that the positive package rested on
"one refuted finding" understates the audit pattern A4-F18 (several recorded roasts: design findings
mostly ended rejected, demoted or unverified, while interface findings were confirmed when a written
contract existed). v2 cites that pattern rather than the single refutation, and still treats
contract anchoring as a hypothesis to test rather than an adopted design.

## Not re-reviewed

v2 was not sent back to the critic for a second round; the dispositions above are the lead's. A
second independent critique round is a cheap next step if the human partner wants one before any
implementation branch starts.
