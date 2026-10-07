# Independent adversarial critique 1 — recommendations.md draft v1 and report.md

Produced 2026-10-07 by a fresh-context critic agent that had not written the documents, working
read-only on the repository and the run's evidence ledger. Its instructions asked it to challenge
cargo-cult OOP, throughput assumptions, severity inflation, missed lifecycle paths, scope creep,
procedural pauses, evidence misuse, mechanical feasibility, and the evaluation plan. The text below
is the critic's return, recorded verbatim in content (formatting normalized). Citations of the form
`rec:N` / `report:N` refer to line numbers in draft v1 of those files. The lead's verification of
the critique and the resulting changes are in [refinement-log.md](refinement-log.md).

## Overall verdict

The plan's restraint is its best part. It rejects a new super-auto stage, a new design pass, an
always-on "OOP lane", severity floors and size thresholds, and it puts instrumentation first. All of
that is well grounded in the repo's constraints.

The positive package is much larger than the evidence behind it. It rests on three things: one
refuted finding, quoted selectively; a user-reported anecdote whose own remedy is a cadence change,
not new lanes; several preprints. On that base it would add two PR lanes, one design lens, a spec
section that is effectively mandatory, a promotion criterion, a precheck rule, three new routes that
create seam contracts, new planner/implementer/reviewer text, and edits to the judge and reporter
prompts.

Its central move is to treat LLM-written design sketches as "stated requirements" that judges
enforce. That creates a rigidity loop and a path to Blocking inflation, and the fix loop has no way
to update a stale contract.

The cost model counts scouts. It does not count the judge seats, which dominate cost by the plan's
own audit, or a digest copied into roughly 90 prompts per round.

The evaluation plan can pass without any real improvement: the planted defects mirror the hunt
lists; one test passes by construction; there is one run per arm; traps may be confirmed at 25%;
several changes ship with no gate at all.

**Recommendation:** keep the negative decisions and the measurement work. Cut the rest to a staged
minimum, and admit each lane only after it shows real-run precision in shadow mode.

## Objections

**1. Major — the digest goes into every prompt, and the cost model leaves out judge seats.**
Attacked: §5.1 inputs ("capped at its existing budget style"); §5.5 (digest into the PR scout
shared-core Inputs list and the judge PR-mode adjustments); §10 ("+digest per scout/judge"); §4/§5.4
("+1 opus scout"). Evidence: coverage-inputs targets ≤ 60000 bytes (`skills/super-design/scripts/coverage-inputs:16`,
`:127`), about 15k tokens; the shared preamble is part of every lane prompt
(`skills/super-roast/scripts/assemble-args.mjs:176-190`) and the PR-adjustment prose is appended to
every seat prompt (`:241-249`); a recorded PR round 1 had 11 scouts and ~81 seat calls (A4-F07), so
at the cap the digest adds up to ~1.4M input tokens per round, comparable to the whole 2.07M-token
PR roast (`3cb9099`); seat calls dominate (~7 per PR scout, ~16 per design scout), so the design
lens costs ~15–20 agents per round, not "+1 opus scout"; error-lifecycle fires on "most code PRs";
D8 itself says context injection is not free and should be targeted; [232] reports >20% added cost.
Fix: pass a pointer to a committed digest file built by a script; only the contract-conformance
scout must read it; judges get one line ("if the finding cites a design contract, read <path>");
recompute §10 from A4-F07 seat rates; add an agents/tokens pass bar (e.g. ≤ +10% agents per round).

**2. Major — treating design sketches as "stated requirements" sets up a rigidity loop and Blocking
inflation, and stale contracts cannot be updated.** Attacked: the judge sentence; §5.6 (contract
violations land "Should-fix; Blocking only via existing floors"); §13.1; §5.1's "the fix may be
updating the contract". Evidence: the judges' Blocking definition ("if unaddressed, the change is
likely to be wrong… or fail its core purpose", `skills/super-roast/judge-seat-prompts.md:71-72`)
covers a break that hits a named consumer; the reporter floor ("violation of the artifact's own
stated core purpose → Blocking under any profile", `skills/super-roast/reporter-prompt.md:135-137`)
makes it worse, and Blocking findings drive fix rounds and the thrash exit
(`skills/super-auto/SKILL.md:225`); design-time contracts are LLM-written and go stale ([166]
"official specification documents are often outdated", "APIs do change"; [165] refinements "came
from the design work itself"); phase-5 fix beads change code, not bead descriptions (fix-bead
template, `skills/super-auto/SKILL.md:327-342`), while a redesign can amend spec sections mid-run
(`:245-247`) leaving `owns:`/`consumes:` unchanged; contract findings would clear the round ≥2 bar
("the change's stated purpose", `skills/super-roast/scout-prompts-pr.md:135-136`), reopening the noise
`b574e7b` tuned out. Fix: bind only compiled `Seam contract:` code and interface lines explicitly
marked stable, label spec sketches "intent, may evolve"; judge text: "a divergence whose consumers all
moved with it is not a defect; a contract line contradicted by merged code is stale context"; route
"contract stale" to FYI with a phase-6 spec-update suggestion; add an eval case for a legitimate
refactor with all consumers updated; defer §13.1 until real-run precision exists.

**3. Major — the evaluation plan can pass without real improvement, is underpowered, and leaves
several changes ungated.** E1's planted defects mirror the hunts; E3 passes by construction (the lane
is absent and returns empty without the digest); E8 is trivial (section conditional on ≥2 units);
"roughly 10 PR-roast runs" is one run per arm, contradicting "5+ reps per variant. Single samples
lie" (`skills/writing-skills/SKILL.md:581`; the plan cited `:459-474`, which is "Match the Form to
the Failure"); recorded seat agreement 0.36–0.71 (A8-F10) cannot separate 4/5 from 3/5 in one run;
E1 tolerates 25% trap confirmations while invoking ≤10% [201] and 5% [222]; ungated: the design lens,
§6.5 implementer lines, §6.6 reviewer tags, §6.2 promotion criterion, and the edit to the
eval-validated judges (`5cc7574`); E2's fallback ships with no requirement to beat RED; Phase 3 cannot
fail (E6 directional, E7 toy, E8 trivial); E6 and any design-lens eval are uncosted (≈10 super-code
builds; design roasts ≈7.8M tokens each). Fix: held-out defects planted by someone blind to the
briefs plus real post-merge fixes mined from OOP-language repos; ≥5 reps per arm with pre-registered
thresholds and confidence intervals; trap false-confirmation ≤10%; a non-degenerate ablation (digest
to judges only); E8 on a 2–3-unit change; gate every prompt change on its own eval; a shadow-mode
phase on N real super-auto runs with human-labelled precision before any lane enters a fix loop;
re-cost the evals (expect 5–10×).

**4. Major — proactive seam contracts widen a known hazard that the Phase 4 trigger cannot see, help
nothing in fallback mode, and "narrow" has three entry points.** A3-F12: when a contract bead's fix
pass changes its interface, stacked consumers in other files get no seam review — only `mergeCheck`,
which can be `'none'` (`skills/super-code/coordinator.js:667`, `:1758`); the failure is silent and
cancels nothing, so a cancellation metric is blind to it (the recorded run shows `dispatched early 7
· cancelled 0`, A2-F05); the ordinary-subagent procedure runs one chain at a time and must not claim
early-unblock (`skills/super-code/coordinator-subagents.md:8-10`), so there each contract is ~10
dispatches with no parallelism; SPLIT already requires ≥2 dependents
(`skills/super-design/promotion-reviewer-prompt.md:47`), so "≥2 consumers" filters nothing; three
creation routes exist (SPLIT routing, the §6.1 rule, the lens question); [165] says split only where
interfaces are "likely to be very stable". Fix: no new triggers until a consumes-seam review for stack
parents ships or contract beads unblock after review; meanwhile forbid signature changes in the
contract's own fix pass (a needed change returns BLOCKED, so consumers cancel visibly); restrict
proactive contracts to Workflow mode with a stability note; measure silent drift, not cancellations.

**5. Major — "Units and interfaces" (§6.1) is a mandatory design ceremony in disguise, with
OOP-centric fields that become binding downstream.** It fires on nearly every super-design spec
(children exchange boundaries, `skills/super-design/SKILL.md:208-221`); it swamps Mode B, meant for
small designs (`skills/brainstorming/SKILL.md:83`) with a four-paragraph structure (`:267-272`); the
per-unit fields assume classes and fit poorly with the repo's recorded workloads (Markdown skills,
bash/JS helpers; A8-F05, A2-F03); placed in super-design §Conventions it also binds Mode A, adding
questions for the human (`skills/brainstorming/SKILL.md:79`) while §10 lists human time as "—"; the
§6.2 → §6.4 → §5.1 chain makes the sketch binding, contrary to [262], [44] and [165]. Fix: trigger
only for cross-bead seams (an interface consumed by a child other than its owner); limit fields to
owner, consumers and the boundary failure contract; mark it non-binding below `Seam contract:` beads;
leave Mode A unchanged; test a 2–3-unit change measuring spec length, invented interfaces, and
questions asked.

**6. Moderate — `error-lifecycle` duplicates existing hunts despite its own ownership note, and
contradicts itself.** correctness hunts dropped/swallowed errors and logged-but-continued
(`skills/super-roast/scout-prompts-pr.md:177-178`), premortem the pool not released on the error
path (`:240`), security stack traces to clients (`:212`), api-contract the inconsistent error
contract (`:471`), observability silent failure (`:488`); dedupe keeps different root claims apart
(`skills/super-roast/dedupe-prompt.md:35-37`), so one handler can produce two or three panels; the
brief says "always report empty, log-only or to-do handlers" and also "prefer cross-layer classes a
configured linter cannot see"; [126] studied five distributed data-intensive systems and its own
remedy was a static checker ("Over 30% of the catastrophic failures would have been prevented had
Aspirator been used"); the canon table gives Kotlin try-with-resources and checked exceptions, while
[141] says "Kotlin treats all exceptions as unchecked" with `use`; Go 1.20/1.26 facts are cited to
[104] (a Go 1.13 post) when the evidence is in [102]. Fix: keep only unowned classes (lost cause,
boundary translation, handled twice, cleanup masking, library code configuring logging); move
single-statement patterns to a linter recommendation; fix the table; pilot inside one existing lane
first.

**7. Moderate — the `simplicity-design` refinements duplicate existing items and lean against
abstraction.** §5.3.1 duplicates item 5 (`skills/super-roast/scout-prompts-pr.md:282-285`, the human
partner's own wording that replaced "Encapsulation breaks" in `9bb2f36`) and api-contract hunt 3
(`:466`); §5.3.3 duplicates item 7 (`:288-289`); §5.3.2 clashes with item 3's injected dependencies
for testability (`:276-278`) and misreads [265] ("does not apply to effort to make the software
easier to modify"); [209] names "Class Data Should Be Private" and "Inappropriate Intimacy" as not
perceived as problems, arguing against restoring the encapsulation hunt; the omitted half of [237]
(preprint) says default AI code shows "oversimplification… missing abstractions and weaker
responsibility separation"; §5.3.4 flags idiomatic Go type switches (Go has no sealed types). Fix: keep
§5.3.5; fold the mode-flag counterweight into item 7; drop §5.3.1; rephrase §5.3.2 as "name the
variation, or the modifiability or testability gain"; exempt Go type switches and DI test seams.

**8. Moderate — the headline evidence is misread.** The planted-defect refutation
(`docs/superpowers/reviews/2026-07-30-planted-defect-branch-roast-1.md:45`) led with the merits
("summarize, the pure logic worth isolating, is already exported and disk-free; runOnce is
orchestration wiring"), the "no stated contract" clause was secondary; that run's real losses were
dead judge seats (`:61-64`), and existing lanes surfaced the stack-less error log as a Nit (`:50`);
"highest-leverage" is unsupported (A8-F05: no in-repo incident); [271] is an arXiv preprint that
hand-coded 297 sampled reviews, and no evidence supports "largest in-the-wild study"; `8e1262a`
claims "fidelity and variance, not dollars" and credits the one fix wave to the Global Constraints
header, not the Interfaces block; report:69 calls [190] "the one encouraging recent result" while D7
registers [191] with up to 2.10× wall-clock speedup; [187] also reports +90.2% for multi-agent and
calls coding less parallelizable, and super-code is already multi-agent, so "15× chat" says nothing
about contract beads; [198] measured humans using AI tools, not interface-first throughput; the
feedback draft's `:18` families were found by the existing holistic step-back and its remedy is a
cadence change (`:8`), and its `:49` "keep separate" refers to the optional-skill-hook work, not this
plan; the parked graph-pass cuts (`docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/run.md:43-48`)
were Markdown "spec-fixed heading names" and a shared MAINTENANCE.md, not code interfaces. Fix:
correct each statement, demote "highest-leverage" to "the first hypothesis to test", label preprints.

**9. Moderate — the plan claims more verification than it has.** "Every repository statement above"
was verified, but the machine check covered the audit evidence rows, not recommendations.md; wrong
citations found: `tests/super-roast/test-assemble-args.sh:30` (should be `:44`),
`skills/writing-skills/SKILL.md:459-474` (should be `:575-585`), the misattributed feedback `:49`,
`[104]` for Go 1.20/1.26 facts; report:215 says validation is recorded in VALIDATION.md, which read
"Validation results (pending)"; report:4 and :123 cite an empty `critique/` folder "and the
refinements it triggered". Fix: run the citation checker over recommendations.md and report.md,
record validation, and remove claims about refinements until they exist.

**10. Moderate — conflicts with boundaries and recorded decisions are missing from §13.** Building the
digest in super-auto phase 4 breaks "super-auto may only grow in the sequencing dimension" and "hold
pointers… not copies" (`skills/super-auto/SKILL.md:31-36`); the §6.3 execution carry-through, new
task-reviewer checks and Phase 4 engine logic give super-code seam-specific behavior, conflicting with
"Execution (super-code) stays dumb" (`docs/superpowers/specs/2026-08-25-integration-seams-design.md:31`;
A8-F18) and the one-relaxed-review policy (`16f8c3e`; A8-F12); Phase 4 omits fallback parity in
`skills/super-code/coordinator-subagents.md`; §6.5(3) reverses tuned text ("If a file you create grows
beyond the plan's intent… note it under Concerns rather than restructuring it",
`skills/super-code/implementer-prompt.md:72-74`). Fix: a `contract-digest` script in
`super-design/scripts`, `--contracts @file` in assemble-args, super-auto passes pointers only; add
each conflict to §13.

**11. Moderate — two new super-code lines recreate the defect class the plan hunts, and the planner
cost is understated.** §6.5(1) "reuse or extend an abstraction named under `Builds on:`" nudges
generalizing shared producers — the "generic producers with legacy consumers left behind" family
(feedback `:18`) and the mode-flag anti-pattern [81] that §5.3.3 hunts; §6.4 asks for signatures of
producers still in flight (a second planner maps "the rest of the tree" while the first tasks run,
`skills/super-code/planner-prompt.md:50`; `skills/super-code/SKILL.md:217`; running tasks are never
re-planned, `:71`), i.e. [166]'s dummy-API drift; `Builds on:` adds opus time on the critical path.
Fix: "use an existing abstraction as-is; if it needs changing, list it under Concerns"; mark
Interfaces entries for unimplemented producers provisional, sourced from the producer bead's `owns:`
line; measure planner latency in E5.

**12. Moderate — contract-conformance hunt 5 misreads what `owns:` lines mean.** They are
decomposition-time work-allocation declarations ("not a fifth field", `skills/super-design/SKILL.md:208-214`);
nothing maps merged code back to beads; phase-5 fix beads legitimately edit across boundaries, so in
rounds ≥2 hunt 5 would flag every fix; its second clause duplicates simplicity item 7. Fix: drop it,
or narrow it to "a declared boundary now has two definitions in code".

**13. Moderate — changes are bundled, and the delivery path is wrong.** Phase 2 bundles five
separately evaluable changes; Phase 1 bundles the unrelated A3-F16 drift fix; CLAUDE.md closes PRs
with multiple unrelated changes; "PR to `dev`" is wrong — the super-* skills are fork-only, the fork
has no `dev` branch, and fork changes never go upstream. Fix: one branch per change into the fork's
`main`, each with its own eval; ship the drift fix separately.

**14. Minor — loose ends in the mechanics.** The design-lens swap is ambiguous (in `widenLenses` it
runs as rarely as `maintainer`; made core it adds a scout and removes the fallback lens; conditional
needs a new assemble-args mechanism; design scouts may cite only the spec, so "consumed by several
tasks" may be unanswerable); `--context` is overloaded — use a dedicated `--contracts` and print
"inactive (no contracts)" on the coverage line; the precheck rule misfires on the Integration sweep's
edges (`skills/super-design/SKILL.md:505-512`) — exempt the sweep; the `lanes:` sub-line disappears in
degraded rounds (the engine's fallback report renders only the entry line,
`skills/super-roast/super-roast-workflow.md:551-571`) — prefer an engine-appended tag like
`[fix-regression]` (`:597-603`) or derive lane counts from the run journal; cheaper alternatives were
not considered — name the spec path in `--artifact` (PR judges already count "the change's stated
intent" and can read the repo, `skills/super-roast/judge-seat-prompts.md:146-150`), and super-code's
final whole-epic review already reads the epic's spec and checks "cross-task integration seams"
(`skills/super-code/coordinator.js:1860`).

## What survives scrutiny and should be kept

- Decision 1 and the rejections: no new super-auto stage or design pass (R-a, D-a, D-b rejected),
  grounded in `report-status:74-75`, `test-contract-lint.sh:172-173`, and the gated "no new pass" decision.
- Decision 6 and §5.3.5: no new severity floors; size, depth and parameter counts are never findings by themselves.
- Decision 7 and Phase 0: lane attribution and bead timing before any precision or speed claim; make attribution deterministic.
- Seam-contract content additions: error variants in signatures, a stub inventory naming the replacing
  participant, and the `boundary contract` precheck rule (with the sweep exempted) — cheap,
  compile-checked, closing A2-F04, A2-F08, A6-F11.
- A per-language canon table with a "do not flag / follow the codebase" column, once corrected, as hunt material.
- Porting `Interfaces:` to the planner as a micro-tested change that claims fidelity only, with
  provisional semantics for producers still in flight.
- Minor-level `[class]` tags with no severity change, once micro-tested.
- The §13 framing (scope filter, graph-pass repoint, discard risk), extended with objection 10's decisions.
- Keeping the in-round step-back work separate.
- E2's wrong-canon metric and E6's change-based evolvability design, once properly powered.
