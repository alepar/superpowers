# TODO: OOP design recommendations

This is the actionable list from the 2026-10-07 research on three questions: how super-design and super-code can encourage good OOP and software design, how super-roast can enforce it, and whether contract-first decomposition (interface beads before parallel work) pays off. It covers every recommendation in the research plan, with the plan's evidence, ordering, evaluations and each item's status. The plan is v2, revised after an independent critique whose 14 objections were all accepted.

Three Phase 0 measurement items have landed (0.1, 0.3 and 0.4). Nothing else in the plan has been implemented or evaluated. Every expected effect below is a hypothesis for the [evaluations](#evaluations).

## Where the research lives

The synthesized research is on `main` in [docs/superpowers/research/2026-10-07-oop-design/](docs/superpowers/research/2026-10-07-oop-design/README.md):

- [report.md](docs/superpowers/research/2026-10-07-oop-design/report.md): the synthesis, with anchored claims and the bibliography.
- [recommendations.md](docs/superpowers/research/2026-10-07-oop-design/recommendations.md): the plan, from §1 (decision summary) to §13 (decisions for the human partner) and §14 (verified facts vs recommendations). The verbatim draft lane brief and canon table are in §5.3 and §5.4.
- [critique/critique-1.md](docs/superpowers/research/2026-10-07-oop-design/critique/critique-1.md) and [critique/refinement-log.md](docs/superpowers/research/2026-10-07-oop-design/critique/refinement-log.md): the 14 objections and what each changed.
- [audit/](docs/superpowers/research/2026-10-07-oop-design/audit/README.md): the repository audit, reports A1–A8, with `audit/README.md` as the evidence map.
- [dossiers/](docs/superpowers/research/2026-10-07-oop-design/dossiers/): facet dossiers D1–D9.

The raw files are not on `main`: the ledgers (`*.jsonl`, `*.json`), `research-plan.md`, the worker logs, the tools, the audit protocol, evidence rows and citation-check output, and the superseded v1 drafts. They are on branch `research/oop-design-scouts` at commit `a4ee3d5`, which as of 2026-10-07 is also not on `origin`. Read one with `git show a4ee3d5:docs/superpowers/research/2026-10-07-oop-design/<path>`. The research ran against `main` at `eb0462b` (6.4.2-alepar4.16).

## How to read this file

- **Status:** done · in progress (with the herdr tab doing it) · open · decision (waits on a §13 decision) · deferred (the plan says wait).
- **References:** `§N` is a section of recommendations.md. `[N]` is a source in its [bibliography](docs/superpowers/research/2026-10-07-oop-design/recommendations.md#bibliography). `A4-F15` is a finding in audit report A4. "Critique #N" is objection N in the critique and the refinement log. `E1`–`E9` and `S` are the evaluations.
- **Repository citations** are `path:line` on `main` at `24c38a1`. Where the research cites the same place at `eb0462b` on a different line, its line is marked "(was :N)".
- **Terms.** A *lane* is a super-roast PR scout specialty; in design mode it is a *lens*. *Seats* are the judges on a finding's panel: three for each Blocking or Should-fix candidate, one for a Nit or FYI spot check. A *seam contract* is a `Seam contract:` bead that delivers compilable boundary code (interfaces, types, signatures and wiring, with inert stubs) and blocks every participant. *Early unblock* starts dependents at a blocker's implementation commit, stacked on its unmerged branch; those dependents are *stacked consumers*. *Shadow mode* runs and judges a lane but never files its findings as fix beads. In an eval, *RED* is the current behavior and *GREEN* the changed one. The *fallback* is super-code's ordinary-subagent procedure, for sessions with no Workflow tool.

## Status board

| ID | Item | Plan | Status |
|---|---|---|---|
| 0.1 | Per-lane attribution in roast reports | §5.1 | done (`e9bb069`) |
| 0.2 | Live roast-engine dryRun re-baseline | §8 Phase 0 | open |
| 0.3 | Per-bead timing, Workflow mode | §5.1 | done (`434effa`) |
| 0.4 | Per-bead timing on Codex and in the fallback | follow-up to 0.3 | done (`10fcd10`) |
| 0.5 | Evaluation set and RED baselines | §9 | open |
| 0.6 | Shadow-mode procedure | §5.1 | open |
| 1a | Seam-contract content hardening and an edge precheck | §6.1 | open |
| 1b | Planner `Interfaces:` block, provisional where needed | §6.4 | open |
| 1c | Design `[class]` tags at Minor in the task reviewer | §6.6 | open |
| 1d | Planner/reviewer wording drift fix | A3-F16 | open |
| 1e | Implementer error-contract line | §6.5 | open |
| 2 | Probe R-c0: the spec path as stated intent for PR roasts | §5.2 | open |
| 3a | Contract digest and a shadow `contract-conformance` lane (R-c1) | §5.3 | open, only if 2 fails |
| 3b | Error-propagation pilot inside `correctness` | §5.4 | open |
| 3c | Minimal `simplicity-design` edits | §5.5 | open |
| 4 | Cross-bead seam notes and a promotion-review criterion | §6.2, §6.3 | open |
| 4L | Design-mode `interfaces-and-ownership` lens | §5.6 | decision (§13.3) |
| 5a | Engine fix for stacked-consumer drift (C-b) | §8 Phase 5 | decision (§13.4), data-gated |
| 5b | Proactive seam-contract triggers, Workflow mode only (C-a) | §4, §8 Phase 5 | deferred until 5a |
| O1 | A second independent critique of the plan | refinement log | open, optional |
| O2 | Seam notes and `[class]` clusters as inputs to the in-round step-back | §12 | open, separate work |

Counts: 3 done, 15 open, 2 waiting on a decision, 1 deferred. Separately: six [open decisions](#open-decisions-for-the-human-partner-13), one of them largely overtaken; four [related items](#related-from-the-2026-10-07-run-profile-baseline), two done and two in progress in the small-fixes tab; and four [drift items outside the plan](#outside-the-plan-drift-the-audit-recorded).

## Rules that bound every item

These come from recorded human-partner decisions and skill-boundary rules (§1, §3, A8-F15, A8-F18).

- **Delivery.** One change per branch into the fork's `main`, each with its own before/after eval, following the fork release process in `AGENTS.md`. These skills are fork-only; nothing goes upstream (§1.10, critique #13).
- **No new stage, pass or gate** for structural properties. Seam contracts are "a finding kind, no new pass, no new gate" (docs/superpowers/specs/2026-08-25-integration-seams-design.md:35), and there are "no new review passes" (docs/superpowers/specs/2026-08-26-leaf-sizing-design.md:13-15).
- **Contracts are compilable code**, never prose, with no contract-owned failing tests (integration-seams-design.md:118-119).
- **Execution stays dumb** (integration-seams-design.md:31). super-code keeps one light task review; detailed review belongs to super-roast (`16f8c3e`).
- **super-auto only sequences**, and passes pointers, not copies (skills/super-auto/SKILL.md:31-36).
- **The tuned late-round stance stays.** It was tuned on measured round-3 noise (`b574e7b`). The scope filter keeps Blocking in scope and punch-lists quality improvements (skills/super-auto/scope-filter-prompt.md:33-35).
- **Concrete fields, not exhortations.** Generic "improve the code" prose licensed refactor scope creep and was removed (A8-F11). Prompt-only optimization of quality is unstable [272], and more specific OO guidance raised total size and coupling (preprint) [237].
- **No size rules and no new severity floors.** Size, depth and parameter counts are never findings by themselves (§1.6). A contract break can already reach Blocking under the existing scale (skills/super-roast/judge-seat-prompts.md:71-72), which is why 3a binds so little (§1.9).
- **Degrade, don't stop** in autonomous runs.

## Phase 0: measurement prerequisites

Nothing that claims precision or speed ships before these (§1.2). Phase 0 exits when the baselines are recorded (§8).

### 0.1 Per-lane attribution in roast reports (done)

- **Do:** have the engine append each finding's lanes deterministically, by the same mechanism as the `[fix-regression]` tag, so attribution survives the degraded fallback report, which renders only entry lines. A reporter-prompt sub-line is not enough for that reason (§5.1, critique #14).
- **Why:** report entries and the engine's return value never named a lane, so no lane's precision could be measured, `simplicity-design`'s included (A4-F15).
- **Status:** done. Merged to `main` at `e9bb069` (commit `8221799`) from the small-fixes tab, and released in 6.4.2-alepar4.17. The engine tags each `## Confirmed findings` entry `[lanes: …]` in both the live and the fallback report, inserts a `lane-yield (found/confirmed/unique/refuted):` header line, and returns the counts as `coverage.laneYield` (skills/super-roast/super-roast-workflow.md:124-130). It was checked in the mock harness and by replaying the canonical dryRun stub table under node (22 agents), not in a live Workflow dryRun (0.2) or a real roast.
- **Worked when:** every report, the fallback included, carries per-lane counts that E1–E3 and S can use.

### 0.2 Live roast-engine dryRun re-baseline (open)

- **Do:** run a fresh live Workflow dryRun of the roast engine against its documented assertions, and record it as the passing baseline.
- **Why:** the recorded baseline is superseded, and "a fresh run against the assertions above is owed" (skills/super-roast/super-roast-workflow.md:835, was :789). The plan made it Phase 0's test, and 0.1 landed without it.
- **Worked when:** the live dryRun matches the assertions: 22 agents for the canonical scenario, 23 for the dead-reporter variant and 22 for the unsettled-panel variant (super-roast-workflow.md:778, :790, :793).

### 0.3 Per-bead timing, Workflow mode (done)

- **Do (as planned):** check whether `bd` timestamps can time beads; if not, add per-bead dispatch, implemented and merged markers to ledger lines, which is an engine edit (§5.1).
- **Why:** ledger and detector lines had no timestamps and the engine has no clock, so speed-up could be measured only in rounds and counts (A2-F15, A7-F10). The plan allows no speed-up claim without timing data (§7, §11).
- **Status:** done, by a different route. `skills/super-code/scripts/run-profile`, merged at `434effa` and released in 6.4.2-alepar4.17, reads the Workflow runtime's own run files (journal and agent transcripts) after the run. It needed neither `bd` timestamps nor an engine edit; its merge left `coordinator.js` untouched. Its `Profile:` lines give the graph shape, the realized critical path and its bottleneck bead, wait causes, merge-lane load and conflict files, and modelled what-ifs. The baseline is in skills/super-code/MAINTENANCE.md, section "Run profile" (:173-276), summarized under [Related](#related-from-the-2026-10-07-run-profile-baseline).
- **Worked when:** validated on 2026-10-07 against 34 real invocations: on 30 of the 32 that landed work, the schedule model came within 10% of the measured task graph (MAINTENANCE.md:206-213).

### 0.4 Per-bead timing on Codex and in the fallback (done)

- **Do:** profile runs that keep no Workflow run files. Until this change the fallback appended `Profile: unavailable`, and other harnesses kept no such files either.
- **Why:** without it, per-bead timing, and so any measured speed claim, exists only for Workflow mode. Fallback parity is also part of decision §13.4.
- **Status:** done. Merged at `10fcd10` (commit `ce488fb`), from the run-profile-codex tab, and released in 6.4.2-alepar4.18. `run-profile` now also reads a Codex coordinator's rollout and its children's (`--codex <thread>`) and a Claude Code session's `subagents/` directory (`--subagents <dir>`), and the fallback procedure names its dispatches by the label grammar and runs the profile at Finish (skills/super-code/MAINTENANCE.md:240-270).
- **Worked when:** validated read-only against Codex 0.160.1 sessions. Codex runs whose dispatch names follow no rule, which is every Codex run before 2026-10-07, get run-level lines only, and no Claude Code fallback run existed to check against (MAINTENANCE.md:255-261, :272-275). A real Claude Code fallback run is still to be checked.

### 0.5 Evaluation set and RED baselines (open)

- **Do:** build the ground truth, and record RED baselines with pre-registered pass bars before any GREEN run. Use planted defects written by someone who has not read the lane briefs, plus real post-merge fixes mined from open-source repositories "in at least three languages (Python, Go, TypeScript or Java)" (§9).
- **Why:** nothing evaluates the design or maintainability of the code a run produces (A7-F09). The `[class]` minor corpus is git-ignored, so this repo cannot supply one (A6-F10). v1's planted defects mirrored its hunt lists, so its evals could pass without real improvement (critique #3). The recorded planted-defect PR roast is a ready RED baseline for design findings (A7-F08).
- **Needs:** decision §13.6 on budget and languages.
- **Worked when:** each change's eval has its RED baseline on record.

### 0.6 Shadow-mode procedure (open)

- **Do:** define shadow mode. A shadow lane is dispatched and judged; its confirmed findings are reported separately and never filed as fix beads; humans label its precision on real runs before it may enter a fix loop. Until the engine supports a shadow heading, run a shadow lane as a separate PR-mode roast whose report the scope filter does not consume (§5.1).
- **Why:** findings shown during code review may carry at most about 10% effective false positives [201], and while 90% of developers will accept a false-positive rate of up to 5%, only 24% can handle one as high as 20% [222]. In a 2026 preprint, 56.3% of agentic review comments were rejected, most often as false positives or as intentional design trade-offs [271].
- **Worked when:** a new lane can run this way on at least three real super-auto runs, and leaves shadow mode only at human-labelled precision of 90% or more (S).

## Phase 1: cheap, compile-checked or eval-precedented changes

Each is its own branch and adds no run-time agents. E6, a directional evolvability check, compares a baseline build with one that has the Phase 1 changes.

### 1a Seam-contract content hardening and an edge precheck (open)

- **Do:** extend the `Seam contract:` template (skills/super-design/SKILL.md:500). Keep its acceptance (compiles, suite green, wiring present, no contract-owned failing tests) and add (§6.1):
  - error types or variants in the boundary signatures, so the failure contract is code;
  - a stub inventory naming the participant bead that replaces each stub;
  - a stability marker, `stable` or `intent`, which 3a reads;
  - in "Done when": the boundary signatures do not change in this bead's own fix pass, and a needed change returns BLOCKED, so stacked consumers are cancelled visibly instead of drifting. This is bead-description text, not an engine change.

  Add a rule to `skills/super-design/scripts/coverage-precheck`: every dependent of a `Seam contract:` bead carries `blocked-by <id>: consumes boundary contract`, except the Integration sweep, whose edges use the sweep token (SKILL.md:505-512). Add fixtures under `tests/super-design/`.
- **Why:** seam contracts declare no error semantics (A6-F11). Nothing tells a stub that is the deliverable from a stub left in place (A2-F08), and agents overclaim completion (preprint) [192]. A stacked consumer gets no seam review when the contract's fix pass changes its interface in other files (A3-F12). The edge token is not enforced: the only recorded contract bead's four dependents used free text (A2-F04). Stand-in implementations stop working as real implementation proceeds [166].
- **Worked when:** `bash tests/super-design/test-scripts.sh` passes with the new fixtures, and E7's offline replay scenario is green: one contract, three stacked consumers, the contract BLOCKED, a fix pass that changes a signature returns BLOCKED, silent-drift count 0. No replay fixture yet has one parent with two or more stacked dependents (A7-F11), so E7 needs one.

### 1b Planner `Interfaces:` block, provisional where needed (open)

- **Do:** add Consumes/Produces entries with exact signatures to the super-code planner's `## Task <N>` section (skills/super-code/planner-prompt.md:89-97), mirroring writing-plans (skills/writing-plans/SKILL.md:91-95). For a producer not yet implemented, mark the entry **provisional** and source it from the producer bead's `owns:` line or its seam note, once 4 adds seam notes. Mirror the change in `skills/super-code/coordinator-subagents.md` if it restates the brief. Claim fidelity only, and leave out v1's `Builds on:` field (§6.4, critique #11).
- **Why:** the planner's brief has no `Interfaces:` block (A3-F06, A1-F05). The writing-plans block raised exact signatures from 0% to 100% of tasks in a prior eval (commit `8e1262a`), though that commit credits its one-fix-wave result to the combined guidance, chiefly the Global Constraints header, not to the block. Entries for in-flight producers must be provisional: the rest-of-tree planner runs beside running tasks (planner-prompt.md:50), and running tasks are never re-planned (skills/super-code/SKILL.md:71), so guessed signatures would drift the way stand-ins do [166].
- **Worked when:** E5 (control vs guidance, at least five reps, a 4-bead fixture with an in-flight producer): 90% or more of briefs carry exact or provisional signatures, provisional entries are marked, and planner latency is reported. The replay harness's literals must still pass, but it pins the planner prompt only by its path (A7-F02), so passing it says nothing about behavior.
- **Cost:** a longer planner output on the critical path, where planners already take 20% of critical-path time (MAINTENANCE.md:214).

### 1c Design `[class]` tags at Minor in the task reviewer (open)

- **Do:** add the tag examples `[contract-drift]`, `[leaky-boundary]`, `[duplicated-decision]`, `[lost-error-cause]`, `[handled-twice]` and `[cleanup-masking]` to skills/super-code/task-reviewer-prompt.md:110-114. Minor stays Minor (skills/super-code/coordinator-workflow.md:1338-1341, was :1320-1323) (§6.6).
- **Why:** Minors carry `[class]` tags and are clustered run-wide, and the clusters reach the final review at no extra dispatch (A3-F09). The detector fires at five occurrences or three tasks and does not cluster paraphrases (A8-F12), so the tags must be applied consistently.
- **Worked when:** a tag-consistency micro-test passes before anything relies on clusters, and the replay harness's reviewer literals still pass (tests/super-code/replay-harness.mjs:537-539, :1767, :2184).

### 1d Planner/reviewer wording drift fix (open)

- **Do:** reword the planner's "one task reviewer checks spec compliance and quality together" (skills/super-code/planner-prompt.md:96-97) to agree with the reviewer, which is told to keep the pass light and to grade polish, naming and style Minor (skills/super-code/task-reviewer-prompt.md:10-12, :90-91). Ship it on its own small branch (critique #13).
- **Why:** the two prompts disagree (A3-F16).
- **Worked when:** the replay harness passes.

### 1e Implementer error-contract line (open)

- **Do:** add one conditional line to skills/super-code/implementer-prompt.md: "If the brief states an error contract for a boundary you touch, follow it." Change nothing else; the scope fence (:70-74) stays verbatim (§6.5).
- **Why:** the implementer brief has no error or logging guidance at all (A6-F01). The line acts only on a stated contract, because generic design prose brings back the scope creep the fence was written against (A8-F11).
- **Needs:** briefs that can state an error contract, which 1a (error variants), 1b (signatures) or 4 (boundary failure contracts) supply.
- **Worked when:** not defined. §8 gives this line no phase and §9 no eval, although every change is meant to carry its own (critique #3). Define a micro-test before shipping it.

## Phase 2: zero-code probe

### 2 Probe R-c0: the spec path as stated intent for PR roasts (open)

- **Do:** have super-auto's phase-4 invocation (skills/super-auto/SKILL.md:164) pass the run's root spec path in the roast's `--artifact` text or PR description, as a pointer only (§5.2).
- **Why:** PR judges already count "the change's stated intent" and can read the repository (skills/super-roast/judge-seat-prompts.md:146-150), yet PR roasts receive no design-time contracts (A4-F19; skills/super-roast/scripts/assemble-args.mjs:19-20). In recorded roasts, interface findings were confirmed when a written contract existed, while other design findings mostly ended rejected, demoted or unverified (A4-F18). super-code's final whole-epic review already reads the spec and checks cross-task seams (skills/super-code/coordinator.js:1877, was :1860); it stays the code-time backstop.
- **Worked when:** E3: confirmations of contract-anchored findings rise and trap confirmations do not. The super-auto contract lint passes. If the probe works, 3a is unnecessary.
- **Cost:** no agents; judges read the spec on demand.

## Phase 3: review-side changes

Independent branches. E4 guards all three against late-round noise: after round-2 fixes, at most one new design finding per run on average, and none of the "could be slightly better" kind (`b574e7b`). §8 assigns E4 to no phase; §11 names it as the check for late-round noise.

### 3a Contract digest and a shadow `contract-conformance` lane, R-c1 (open, only if 2 fails)

- **Do (§5.3):**
  - Write a `contract-digest` script in `skills/super-design/scripts/` that produces a committed file: compiled `Seam contract:` signatures and stub inventories, plus seam notes marked `stable`, with everything else labelled "intent, may evolve". super-auto passes only the file's path.
  - Add a dedicated `--contracts @file` flag to `skills/super-roast/scripts/assemble-args.mjs` instead of reusing `--context`. Without it the coverage line prints "contract-conformance inactive (no contracts)".
  - Only the `contract-conformance` scout reads the digest in full. Judges get one line: "if the finding cites a design contract, read <path>".
  - Add the lane to `skills/super-roast/scout-prompts-pr.md`. Its hunts are shape drift, consumer left behind, stub presented as done, error-contract break at a stable boundary, duplicate boundary (a declared boundary now has two definitions in code), promised-behavior change, and substitutability break. A finding quotes the stable contract line and names the consumer or call path that breaks. A divergence whose consumers all moved with it is reported as "contract stale", not as a defect. Naming differences no consumer relies on, legacy paths the spec's migration plan keeps, and stubs inside the contract bead's own change are not findings. One finding per broken contract. The verbatim draft brief is in §5.3.
  - Add to the judges' PR-mode section (judge-seat-prompts.md:146-150), as data outside the eval-validated materiality sentence (:35-40): "A divergence whose consumers all moved with it is not a defect; a contract line contradicted by merged code is stale context." The reporter maps "contract stale" findings to FYI, with a phase-6 suggestion to update the spec.
  - Run the lane in shadow mode (0.6) first.
- **Why:** in recorded roasts, a written contract is what got interface findings confirmed (A4-F18). But design text here is LLM-written, specifications go stale [166], and a confirmed contract break can legitimately reach Blocking (judge-seat-prompts.md:71-72), so only compiled seam-contract code and lines marked `stable` bind (critique #2). Copying a digest of up to ~60 KB (skills/super-design/scripts/coverage-inputs:16) into every scout and seat prompt (assemble-args.mjs:176-190, :241-249) could add ~1.4M input tokens per round (critique #1).
- **Needs:** 2 has failed E3. 1a supplies stub inventories and stability markers. Stable seam notes arrive only with 4, which the plan orders later.
- **Worked when:** E1: GREEN confirms more planted items than RED, with the confidence interval excluding zero; taste traps are confirmed 10% of the time or less; the legitimate-refactor case is not confirmed, or lands as "contract stale" at FYI. Also E3, and S: human-labelled precision of 90% or more on at least three real runs before the lane enters a fix loop. Tests: tests/super-roast/test-assemble-args.sh:27-28 and :44 (the rosters), plus tests for the new script.
- **Cost:** one opus scout and about seven sonnet seats per PR round when contracts are supplied (a recorded PR round drew ~81 seat calls for 11 scouts, A4-F07), plus human time to label shadow findings.

### 3b Error-propagation pilot inside `correctness` (open)

- **Do (§5.4):** add a compact group to the `correctness` hunt list (skills/super-roast/scout-prompts-pr.md:173-190), applied per the target language's canon:
  - a. lost cause: an error re-raised, wrapped or returned without its cause where callers or a contract need it;
  - b. boundary translation: a lower layer's error types, messages or stack leak through a boundary that promises its own error contract, or translation erases a distinction callers need;
  - c. handled twice: the same failure logged at several layers before being rethrown or returned;
  - d. cleanup masking: cleanup can throw and replace the primary failure, or a resource acquired on the path is not released when it fails;
  - e. library code configuring global logging or handlers.

  Ship it with the corrected per-language canon table (verbatim in §5.4), and recommend configured linters and analyzers for single-statement patterns (empty catch, `throw ex;`, catch-all) instead of hunting them. The table's "do not flag" column is what E2's traps test: a Python bare `except:` that logs and re-raises; Go `%v` at a deliberate package boundary, and `==` with `io.EOF`; Rust `unwrap`/`expect` with a documented invariant; JS/TS reliance on non-standard `stack` text; Java checked vs unchecked per house style; Kotlin, where all exceptions are unchecked [141]; C# `throw;`, which is canonical, while `throw ex;` is the defect [133]; C++ where house style bans exceptions. After critique #6, Kotlin has its own row (`use`, no checked exceptions), and the Go 1.20 and 1.26 facts cite [103] and [102].
- **Why:** no lane owns these five classes (A6-F03). In five distributed data-intensive systems, 92% of catastrophic failures came from incorrect handling of explicitly signalled non-fatal errors, and a static checker built from three simple rules would have prevented over 30% of them [126]. Most individual anti-patterns show no defect link [155], and official sources disagree on "handle once" [110][116]. Dedupe keeps different root claims apart (skills/super-roast/dedupe-prompt.md:35-37), so spreading these classes over several lanes would multiply panels.
- **Worked when:** E2: GREEN-3b beats RED across at least three languages, with zero wrong-canon findings. A dedicated `error-lifecycle` lane is justified only if, in shadow mode, it beats GREEN-3b without more trap confirmations. The assemble-args test passes.
- **Cost:** no new agents; human time to label.

### 3c Minimal `simplicity-design` edits (open)

- **Do (§5.5):** keep the lane's structure and the human partner's wording (skills/super-roast/scout-prompts-pr.md:257-309), and make four data-only edits:
  1. Pragmatism filter: "Method or class length, inheritance depth and parameter counts are never findings by themselves; cite the change scenario or concrete comprehension cost."
  2. Item 7 (information leakage) gains a counterweight: "…and deduplication that grew boolean or mode parameters to serve unrelated callers."
  3. Item 9 (over-engineering): "Name the variation, or the modifiability or testability gain, the indirection buys; report it only if none is stated or evident."
  4. Exemptions: Go type switches and consumer-defined interfaces; dependency-injection seams that exist for tests; switches over sealed or enum types; Python ABC checks.
- **Why:** no size or depth threshold is validated. Maintenance effort tracked the number of methods to understand, not inheritance depth [34]; decomposition experiments are mixed or reversed [59][60]; the "24 SLOC" method size is a benchmark percentile [61]; class size confounds OO metrics [62]; and smells did not explain effort after controls [67]. Unintentionally inconsistent changes to clones often cause faults [77], but most clones rarely change [78], and deduplication can produce the wrong abstraction (practitioner) [81]. YAGNI does not cover effort that makes software easier to modify [265], and item 3 already counts injected dependencies for testability (scout-prompts-pr.md:276-278). The exemptions follow Go and Java guidance [44][52]. Unguided AI code may under-abstract (preprint) [237], so the edits must not lean against abstraction (critique #7).
- **Worked when:** E1's taste-only traps (a long cohesive method, a DI test seam, a deep hierarchy used for real substitution, duplicated lines with different change drivers, a Go type switch) are confirmed 10% of the time or less and never at Blocking; and in E9, under an internal-tool profile, taste findings land at Nit or are rejected. The assemble-args test passes.

## Phase 4: design-time seam notes

### 4 Cross-bead seam notes and a promotion-review criterion (open)

- **Do:**
  - **Seam note (§6.2).** Only where an interface is consumed by a child other than its owner, add one short entry per interface to the spec super-design produces (§Conventions, skills/super-design/SKILL.md:762-766): owner, consumers, the boundary failure contract (what callers may distinguish, in the target language's terms), and `stable` or `intent`. No per-unit design inventory, and Mode A brainstorming is unchanged. The promotion reviewer, 3a's digest (stable entries only) and 1b's planner read the notes.
  - **Promotion criterion (§6.3).** Add to the decomposition verdict (skills/super-design/promotion-reviewer-prompt.md:58-62): "Each seam note names exactly one owner child whose `owns:` line names it, and its consumers carry `consumes:` lines." Issues are fixed inline.
- **Why:** in Parnas's method, the modular structure describes every decision that affects more than one module before independent work begins [1], and in field studies incomplete specifications hid divergent assumptions until integration [165]. Autonomous runs force Mode B specs (skills/super-design/SKILL.md:42), which have no component, interface or error section (skills/brainstorming/SKILL.md:266-272). The criterion rides the pass that already reads the full spec, as SPLIT did (docs/superpowers/specs/2026-08-26-leaf-sizing-design.md:13-15). The narrow trigger answers critique #5: v1's "Units and interfaces" section was a design ceremony in disguise.
- **Worked when:** E8: on a 2–3-unit change against a control, no invented interfaces, and spec length and questions to the human stay within a pre-registered margin. The super-design tests and the super-auto contract-lint pointers pass.
- **Cost:** no agents; short spec entries.

### 4L Design-mode `interfaces-and-ownership` lens (decision §13.3)

- **Do, if adopted (§5.6):** a design-roast lens asking whether each cross-bead interface has one owner, a stated failure contract and a stability marker, and nothing about abstractions the spec gives no reason for. Either make it core, keeping `maintainer` as the zero-domain widen lens (skills/super-roast/SKILL.md:119-122), or skip it and rely on the criterion in 4.
- **Why:** design mode has no design-quality or abstraction lens (A8-F04), and `maintainer` widens only when triage names zero domains (A4-F05).
- **Cost:** roughly 15–20 agents per design round: one opus scout plus ~16 seats at the recorded design rate (~126 seats for 8 scouts, A4-F07).
- **Worked when:** the plan names no eval. Evaluating the lens takes design roasts (~7.8M tokens each, A7-F16), which the §9 budget does not include.

## Phase 5: engine, only if Phase 0–3 data warrant it

### 5a Engine fix for stacked-consumer drift, C-b (decision §13.4, data-gated)

- **Do:** in `skills/super-code/coordinator.js`, either run a consumes-seam review for stack parents whose fix pass changed files, or let contract beads unblock their consumers only after review. Keep the fallback in `skills/super-code/coordinator-subagents.md` at parity.
- **Why:** `composedWith` excludes stack parents (coordinator.js:684, was :667), and a stacked task's seam check intersects file lists only (coordinator.js:1775, was :1758). So when a contract's fix pass changes its interface, stacked consumers in other files see the change unreviewed; only the merge check would catch it, and that check can be `none` (skills/super-code/SKILL.md:120) (A3-F12). A parent that fails to merge discards every stacked consumer, so the risk concentrates on the bead with the widest fan-out (A2-F09).
- **Needs:** Phase 0–3 data that warrant an engine change, and decision §13.4.
- **Worked when:** E7 live (a toy fixture with and without hardening) shows a silent-drift count of 0; the coordinator dryRun baselines (now 44/19/21) and the template-literal baseline (now 399, tests/super-code/replay-harness.mjs:373) are re-recorded; and the fallback behaves the same.

### 5b Proactive seam-contract triggers, Workflow mode only, C-a (deferred until 5a)

- **Do, once 5a ships:** consider creating seam contracts proactively, for example through SPLIT routing (skills/super-design/promotion-reviewer-prompt.md:44-54), only in Workflow mode and only for interfaces with a stability note. Measure silent drift, not cancellations.
- **Why deferred:** stacked consumers drift silently today (A3-F12), and a cancellation count cannot see it: the recorded run shows `dispatched early 7 · cancelled 0` (A2-F05). The fallback runs one chain at a time and gains no parallelism (skills/super-code/coordinator-subagents.md:8-10); a Codex coordinator profiled during validation, with 518 dispatches over 87.5h, had at most one dispatch running 91.6% of the time (skills/super-code/MAINTENANCE.md:272-275). Field evidence says to split work only where interfaces are "likely to be very stable" [165]; coding has fewer truly parallelizable tasks than research [187]; multi-agent gains are often minimal [185]; and no study has measured an interface-first speed-up, the one preprint figure being from an abstract [191].
- **Worked when:** 0.3's profile measures a critical-path gain while E7's silent-drift count stays at 0. The profile already prints a modelled `split` what-if, in which a bead's dependents wait only for a contract slice of about 30% of its implement time (skills/super-code/scripts/run-profile.mjs:1297-1307); that is a model estimate, not the measured gain the plan asks for.

## Other recommended steps

### O1 A second independent critique of the plan (open, optional)

v2 was never sent back to the critic; the dispositions are the lead's. The refinement log names a second critique round as a cheap step before any implementation branch starts, if the human partner wants one.

### O2 Inputs for the in-round step-back (open, separate work)

The in-round step-back request (accepted 2026-10-06, implementation pending) asks for a holistic checkpoint inside a long code-roast round (docs/superpowers/feedback/2026-10-06-in-round-step-backs/upstream-feedback-draft.md:32-38). When it is implemented, stable seam notes (4) and recurring design `[class]` clusters (1c) are candidate inputs and trigger sources. Its reported late defect families were found by the existing holistic step-back, and its remedy is a cadence change rather than new lanes, so the two are implemented independently (§12).

## Open decisions for the human partner (§13)

| # | Decision | Affects | Status |
|---|---|---|---|
| 13.1 | Should a confirmed break of a stable contract be in scope, rather than a punch-listed quality improvement (skills/super-auto/scope-filter-prompt.md:33-35)? | 3a | open; the plan defers it until shadow-mode precision exists (S) |
| 13.2 | Graph-pass repoint (C-c): is moving an edge from an implementation bead to a `Seam contract:` bead compatible with "a wait on a name the spec fixes is not safe to cut" (skills/super-code/coordinator-workflow.md:1048-1050, was :1043-1045)? The recorded run parked four cuts that would have taken the depth from 7 to 5 (A2-F07), but their edges carried spec-fixed Markdown heading names and a shared MAINTENANCE.md, not code interfaces (docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/run.md:43-48). | the graph pass | open |
| 13.3 | Design-mode lens: adopt it at ~15–20 agents per design round, or rely on the promotion criterion? | 4L | open |
| 13.4 | Stacked-consumer drift: fund the engine fix, with fallback parity? It touches "execution stays dumb" (integration-seams-design.md:31). | 5a, 5b | open |
| 13.5 | Accept the Phase 0 engine edits and dryRun re-baselines? | 0.1–0.3 | largely overtaken: timing landed with no engine edit (`434effa`), and attribution landed as an engine edit (`e9bb069`); the live roast dryRun re-baseline is still owed (0.2) |
| 13.6 | Approve the re-estimated eval budget and choose the first three languages. | 0.5 and every eval | open |

## Deferred, rejected and dropped options

From §4 and the refinement log:

| Option | Verdict | Reason |
|---|---|---|
| R-a: a new always-on "OOP design" PR lane | rejected | duplicates `simplicity-design`, which already carries the human partner's OOP priorities (A8-F04); developers discount OO-practice smells [209], and judges rejected or demoted taste findings (A4-F18) |
| D-a: a new super-auto "interface model" phase | rejected | breaks `report-status`'s phase set (skills/super-auto/scripts/report-status:72-75) and the frozen phase baseline (tests/super-auto/test-contract-lint.sh:172-173); placed after phase 2, it would follow the design roast and the one-shot review stop, so neither would see it (A5-F08) |
| D-b: a new super-design interface-review pass | rejected | "no new review passes" (leaf-sizing-design.md:13-15) |
| D-e: implementer reuse and refactor lines (v1 §6.5) | dropped | "reuse or extend" nudges toward generalized producers that leave consumers behind, and the refactor line would reverse tuned scope text (skills/super-code/implementer-prompt.md:72-74) (critique #10, #11) |
| C-a: proactive seam contracts, through SPLIT routing and v1's two other creation routes | deferred, see 5b | silent stacked-consumer drift (A3-F12); no gain in the fallback; [165] |
| R-c1: contract digest and lane | conditional, see 3a | only if the zero-code probe (2) fails |
| R-d: a dedicated `error-lifecycle` lane | conditional | only if the 3b pilot shows, in shadow mode, defects the extended `correctness` lane misses |
| The `Builds on:` planner field (v1) | deferred | adds opus reading time on the critical path; test it separately if wanted (§6.4) |
| v1's "Units and interfaces" spec section | replaced by 4 | fired on nearly every spec, swamped Mode B, bound Mode A, and its OOP-centric fields became binding downstream (critique #5) |
| Restoring the "Encapsulation breaks" hunt (A4-F04) | not restored | item 5 carries the human partner's wording, which replaced it in `9bb2f36`, and developers do not perceive encapsulation smells as problems [209] (§5.5) |
| v1's duplicated-decision item for `simplicity-design` | dropped | duplicated item 7 (critique #7) |
| v1's super-code seam carry-through and new task-reviewer seam checks | withdrawn | "execution stays dumb" and the one-light-review policy (§6.7, critique #10) |
| Copying the digest into every prompt, building it in super-auto, or reusing `--context` | replaced, see 3a | token cost (critique #1); super-auto passes pointers only (critique #10); `--context` is design-mode caller context (critique #14) |
| A reporter-prompt `lanes:` sub-line | replaced by 0.1's engine tag | lost in degraded fallback reports (critique #14) |
| New severity floors; size, depth or parameter thresholds | not adopted | contract breaks can already reach Blocking, and no threshold is validated [61][62] (§1.9, §5.7) |
| v1's contract hunt 5, which read `owns:` lines as code ownership | narrowed, see 3a | `owns:` lines are decomposition-time declarations, and phase-5 fix beads legitimately edit across boundaries (critique #12) |
| "PR to `dev`" delivery; bundled phases | removed | these skills are fork-only and the fork has no `dev` branch; one change per branch (critique #13) |

Not carried into the plan: each dossier's "Implications" section holds finer-grained worker inferences that the plan did not adopt as items. Examples are D2's per-language flag and do-not-flag table for hierarchies, D3's guidance on mutable global state and Observer, D4's symmetric decomposition check and an eval arm that varies maintainer capability, D7's checklist for a contract artifact, and D8's tracking of whether authors act on findings and its rule that a scout list the files and hunks it inspected. They are named here so they are not lost; none is a recommendation of the plan.

## Evaluations

**Method (§9).** Use the writing-skills micro-test method (skills/writing-skills/SKILL.md:575-585: fresh samples, a no-guidance control, five or more reps per variant, every flagged item read by hand, variance treated as a metric), plus D4's change-based design: a fixed maintainer agent applies a follow-up requirement, tests are hidden or read-only, and size is a covariate. Pre-register the thresholds before any GREEN run.

**Bars for every eval.** At least five runs per arm, because recorded seat agreement of 0.36–0.71 makes single runs uninformative (A8-F10). Report confidence intervals. Trap false-confirmations at 10% or less [201][222]. Added agents per round at 10% or less, unless the lane is what is being bought. No trap confirmed at Blocking.

| ID | Scenario | Arms | Pass bar | Used by |
|---|---|---|---|---|
| E1 | held-out contract and design defects; taste-only traps (long cohesive method, DI test seam, deep hierarchy used for real substitution, duplicated lines with different change drivers, Go type switch); a legitimate refactor that departs from a seam note with every consumer updated | RED current roster; GREEN per change | GREEN confirms more planted items than RED, CI excluding zero; traps ≤ 10%; the refactor is not confirmed, or lands as "contract stale" at FYI | 3a, 3c |
| E2 | error-propagation defects in at least three languages; canon traps (deliberate Go `%v`, PEP 8 log-and-reraise, documented `expect`) | RED; GREEN-3b; optional dedicated lane | GREEN-3b beats RED with zero wrong-canon findings; a dedicated lane only if it beats GREEN-3b with no more trap confirmations | 3b |
| E3 | contract anchoring | no context; spec path as intent (2); digest to judges only (3a); same roster | contract-anchored confirmations rise, trap confirmations do not | 2, 3a |
| E4 | late-round stance | round 2 after fixes | ≤ 1 new design finding per run on average; none of the "could be slightly better" kind | 3a–3c |
| E5 | planner `Interfaces:` | control vs guidance, ≥ 5 reps, 4-bead fixture with an in-flight producer | ≥ 90% of briefs with exact or provisional signatures; provisional entries marked; planner latency reported | 1b |
| E6 | evolvability | baseline vs Phase 1 changes build the same epic; a fixed maintainer applies a mutated requirement under hidden tests | pass rate not worse, and files and lines touched lower in ≥ 4 of 5 reps; reported as directional | Phase 1 |
| E7 | contract-first fan-out | offline replay (one contract, three stacked consumers; contract BLOCKED; a fix pass that changes a signature); live toy fixture with and without hardening | offline green; a signature change in the contract's own fix pass returns BLOCKED; silent-drift count 0 | 1a offline, 5a live |
| E8 | seam-note ceremony | a 2–3-unit change vs control | no invented interfaces; spec length and questions to the human within a pre-registered margin | 4 |
| E9 | severity under a low-blast profile | E1's traps under an internal-tool profile | taste findings at Nit or rejected | 3c |
| S | shadow mode | ≥ 3 real super-auto runs per new lane | human-labelled precision ≥ 90% before the lane enters a fix loop | 3a; any dedicated error lane |

**Expected severities (§5.7), as guidance for judging the evals, not floors.** A stable-contract break that hits a named consumer: Should-fix, or Blocking, which fits "the change is likely to be wrong" (judge-seat-prompts.md:71-72). Contract stale, every consumer moved: FYI, with a phase-6 spec update. A stub presented as done: Should-fix, or Blocking if it defeats the artifact's stated core purpose. An empty or log-only handler on a non-fatal path: Should-fix, which a profile may demote; prefer a linter. A lost cause where callers distinguish errors: Should-fix. Handled twice: Nit. Taste-only design with no stated contract or change scenario: rejected or Nit. Size, depth and parameter counts: never a finding.

**Cost (§9).** A live PR roast costs about 2M tokens and a design roast about 7.8M (A7-F16). E1–E3 and E9 at five reps per arm need about 50–80 PR-roast runs, roughly 100–160M tokens. E6 needs about ten super-code builds plus maintainer runs, and a design-lens eval adds design roasts. That is 5–10 times v1's estimate. The offline suites cost nothing (A7-F01).

## Risks and mitigations (§11)

| Risk | Mitigation | Checked by |
|---|---|---|
| Rigidity loop: LLM-written design text becomes binding | only compiled seam-contract code and lines marked `stable` bind; "contract stale" goes to FYI | E1's legitimate-refactor case |
| Blocking inflation: contract breaks can reach Blocking under the existing scale | narrow binding scope; shadow mode | E1 (no trap at Blocking); S |
| Silent drift of stacked consumers | no signature change in the contract's own fix pass (1a); the engine fix (5a) before new triggers (5b) | E7's silent-drift count |
| Ceremony | seam notes only for cross-bead interfaces | E8 |
| Language bias | the canon table's "do not flag" column; the Go type-switch exemption | E2's wrong-canon count |
| Underestimated cost | seat-inclusive costs | the agents-per-round bar |
| Noise in later rounds | the tuned stance is unchanged | E4 |
| Throughput illusions | no speed-up claim without timing data | 0.3's profile |

## Related, from the 2026-10-07 run-profile baseline

The human partner picked these four items today from the run-profile baseline. They are not in the research plan, but each touches it. Merge-lane priority and slow-test guidance landed while this file was being written; the other two are in progress in the small-fixes tab.

| Item | Status | Touches |
|---|---|---|
| Merge-lane priority | done (`ed91f8b`, released in 6.4.2-alepar4.17) | 5a, whose consumes-seam review for stack parents would add work to the same lane. The next merge is now the queued task with the most live attempts waiting on its landing, and run-profile's schedule model still assumes a FIFO lane (commit `7483d90`) |
| Implementer rebase onto the integration tip before reporting | in progress (small-fixes tab) | the stacked-consumer path, where the silent-drift gap (A3-F12) and the discard risk (A2-F09) sit: 1a, 5a, 5b and E7 |
| Slow-test guidance | done (`24c38a1`, released in 6.4.2-alepar4.19) | the rule that a contract-first speed-up must be measured on the critical path (§7, 5b), most of which is implement time, much of it tests. Implementers now narrow slow test runs, and the profile names the costliest test commands in a `Profile: slow tests` line (commit `3548bfb`) |
| Splitting hot shared files up front at design time | in progress (small-fixes tab) | design-time decomposition (4); the graph-pass decision on cuts over a shared file (13.2); the UNOWNED-SEAM findings rejected as "shared file, not a dataflow boundary" (A2-F03); it is bound by the no-new-pass rule (D-b) |

The baseline facts behind them, from skills/super-code/MAINTENANCE.md, section "Run profile":

- **Across 34 real invocations** in nine epics and four projects, 2026-10-01 to 2026-10-03 (:206-219):
  - Implement is 65% of critical-path time and the planners 20%. (Slow-test guidance; also 1b's cost.)
  - Stack conflicts bounced 32 of the 112 landed beads that had in-run blockers. (Rebase before reporting; hot shared files.)
  - Seam work took 55% of the merge lane's busy time. The merge lane is `merge`, `seam-review` and suffixed `fix` (:192-193). (Merge-lane priority; hot shared files.)
  - Tests plus polling for background test runs took 65% of the bottleneck beads' implement time and 60% of all implementer and fixer time. Almost all of it was focused runs: 28 of about 2,600 test commands were unfiltered whole-suite runs, and 197 of 198 backgrounded runs were targeted. (Slow-test guidance.)
- **On the largest run** (76 planned beads, 455 agents, a 7h55m task graph), where the model reached 96% of actual once late edges were calibrated (:221-227):
  - Stack conflicts bounced 16 of the 29 dependents dispatched at an implementation, costing 7h43m of summed waiting. (Rebase before reporting.)
  - Seam reviews and seam fixes took 70% of the merge lane's busy time. (Merge-lane priority.)
  - "The modelled saving from taking every early unblock was −1h04m": the profile prints a what-if's saving with a minus sign, so the model says taking every early unblock would have cut about an hour (skills/super-code/scripts/run-profile.mjs:1289, :1423). (Rebase before reporting.)
- **Slow tests,** over the same profiles re-run on 2026-10-07 (35 invocations, six epics): the five costliest test commands were Rust `cargo test --lib` runs, some filtered, taking 3h07m of 24h08m of foreground test time. The time is spread over many focused commands rather than one slow suite, and 36 calls hit the 10-minute tool limit (:229-238). (Slow-test guidance.)
- **Limits:** the schedule model leaves out hot-file caps, the top-up query budget, runtime-slot queueing and attempts that never landed (:203-204), and it assumes one FIFO merge lane, which merge-lane priority has since replaced (:198-200). A seam review runs when a rebase lands on sibling commits that touched files the task also changed (skills/super-code/coordinator-workflow.md:893-899), which is how shared files turn into merge-lane work.

## Outside the plan: drift the audit recorded

The audit recorded these as incidental drift (audit/README.md, "Cross-auditor reconciliation"). The plan took up only A3-F16, as 1d. Each still holds on `main` at `24c38a1`. All are open.

- **A2-F13.** skills/super-code/SKILL.md:220-222 (was :219-221) says a seam contract's span "never contends", a claim older than early unblock: a chain holds its hot-file counts through its fix pass while its dependents dispatch at implementation.
- **A7-F15.** docs/testing.md:10-20 lists only upstream suites (the fork's release suites are in `AGENTS.md`), and README.md:56 still describes "a five-round fix breaker".
- **A5-F15.** The design-roast loop has no run-state exit field; skills/super-auto/run-state.md:35-39 has only `roastCodeExit`, and both recorded runs invented a field under different names.
- **A6-F06.** The roast engine turns a throwing judge dispatch into null and logs only a count (skills/super-roast/super-roast-workflow.md:442-445, was :430-433), and the coordinator's first-failure latches drop later errors in the same window (skills/super-code/coordinator.js:211, :1271, was :1254). Keeping the cause is an engine-code edit.

A4-F04, the removed "Encapsulation breaks" hunt, has a disposition in the plan (not restored; see the options table).

## Coverage check

Every section of recommendations.md and every critique objection maps to an entry above.

| recommendations.md | Here |
|---|---|
| §1 decision summary | items 1–10 → D-a and D-b rejected; Phase 0; 1a–1c; 2 and 3a; 3b; 3c; 4; 5a and 5b; the rules on severity; the delivery rule |
| §2 evidence base, §3 what exists | the "Why" lines; the rules |
| §4 options | the items and the options table |
| §5.1–§5.7 | 0.1–0.6; 2; 3a; 3b; 3c; 4L; expected severities |
| §6.1–§6.7 | 1a; 4 (§6.2–§6.3); 1b; 1e; 1c; the options table (withdrawn super-code seam logic) |
| §7 contract-first, by dimension | 1a, 4, 3a, 5a, 5b; fan-in (`Seam integration:` plus the sweep) stays unchanged |
| §8 phased plan; §9 evals; §10 costs; §11 risks | the phase sections; Evaluations; each item's cost; Risks |
| §12 in-round step-back; §13 decisions; §14 verified vs recommended | O2; Open decisions; the opening paragraph |

| Critique objection | Here |
|---|---|
| #1 digest in every prompt; seat costs left out | 3a (one scout reads it, judges get a pointer); the cost lines |
| #2 rigidity loop, Blocking inflation, stale contracts | 3a's binding scope and "contract stale"; 13.1; E1's refactor case |
| #3 evals that pass without improvement | 0.5; the eval bars; E3's three arms; E8 on a 2–3-unit change; S; 1e's missing eval |
| #4 proactive contracts widen drift | 1a's fix-pass rule; 5a; 5b |
| #5 "Units and interfaces" as ceremony | 4; the options table |
| #6 error-lifecycle duplication and table errors | 3b; R-d |
| #7 `simplicity-design` edits duplicate items, lean anti-abstraction | 3c; the options table |
| #8 misread headline evidence | the "Why" lines (the A4-F18 pattern; `8e1262a` claims fidelity only; preprints labelled) |
| #9 more verification claimed than done | fixed in the research itself (citation checker, VALIDATION.md); no item |
| #10 boundary conflicts missing from §13 | 3a's placement; the rules; 13.4; D-e |
| #11 super-code lines recreate the defect; guessed signatures; planner cost | 1b; 1e; D-e |
| #12 contract hunt 5 misreads `owns:` | 3a's hunt list; the options table |
| #13 bundling; wrong delivery branch | the delivery rule; 1d on its own branch |
| #14 loose mechanics; cheaper alternatives | 0.1; 3a (`--contracts`, the inactive line); 1a (the sweep exemption); 2; 4L |
