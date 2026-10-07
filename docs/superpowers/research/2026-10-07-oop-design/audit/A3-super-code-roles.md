# A3 — super-code roles: design guidance, review gating, fix loop, scheduler

Auditor A3 · repo `research/oop-design-scouts` @ eb0462b (6.4.2-alepar4.16) · read-only · no tests run.

## Scope and files read

Read in full:

| File | Lines |
|---|---|
| `skills/super-code/SKILL.md` | 308 |
| `skills/super-code/planner-prompt.md` | 146 |
| `skills/super-code/implementer-prompt.md` | 168 |
| `skills/super-code/task-reviewer-prompt.md` | 114 |
| `skills/super-code/triage-prompt.md` | 89 |
| `skills/super-code/coordinator-subagents.md` | 221 |
| `skills/super-code/scripts/review-bead` | 75 |
| `skills/super-code/scripts/ledger-digest` | 57 |
| `skills/subagent-driven-development/implementer-prompt.md` | 154 |
| `skills/subagent-driven-development/task-reviewer-prompt.md` | 207 |
| `skills/subagent-driven-development/re-review-prompt.md` | 115 |
| `skills/subagent-driven-development/scripts/review-package` | 61 |
| `skills/subagent-driven-development/scripts/task-brief` | 43 |
| `skills/requesting-code-review/code-reviewer.md` | 181 |
| `skills/requesting-code-review/SKILL.md` | 95 |

Read in part:

| File | Lines | What was read |
|---|---|---|
| `skills/super-code/coordinator-workflow.md` | 1999 | 1–190, 284–355, 390–1357 (contract, loop, ledger, pipeline, review/fix, merge-back, blockers, Finish, limitations, positions), 1355–1754 (dryRun policy, stub table, assertions), 1865–1964 (fix-pass-blocked and parked baselines). Skipped: 190–283 (no-I/O, null-policy prose, authoring pitfalls; null-table rows checked by grep), 355–389 (quiesce), 1754–1864 (superseded baseline narrative). |
| `skills/super-code/coordinator.js` | 2086 | 1–150, 556–1162 (Plan, merge queue, integrateOne, scheduler use, runTask), 1476–1640 and 1702–2086 (prompt builders, makeScheduler, reviewAndFix, handleBlocker). The rest was mapped by grep (schemas 239–286, recurrence 335–380). |
| `skills/super-code/MAINTENANCE.md` | 1007 | headings and keyword greps only. It holds no design-quality or review-policy rationale. |
| `skills/subagent-driven-development/SKILL.md` | 568 | 184–473 (model selection, task loop, fix loop, final review) |
| `skills/test-driven-development/SKILL.md` | 320 | 155–194, 295–320, plus grep |
| `skills/test-driven-development/writing-good-tests.md` | 198 | grep only |
| `skills/verification-before-completion/SKILL.md` | 120 | grep only |

super-code references none of the TDD, verification or code-reviewer files: a grep of `skills/super-code/` for their names has 0 hits.

Cross-reference reads, kept minimal:

- `skills/writing-plans/SKILL.md` 20–145
- `skills/super-design/SKILL.md:500` (grep)
- `skills/super-design/scripts/graph-shape` 1–30
- `skills/super-design/graph-pass-prompt.md` (grep)
- `tests/super-code/replay-harness.mjs` (grep for template assertions)
- `tests/super-code/test-coordinator-replay.sh`
- `tests/super-auto/test-contract-lint.sh` 1–110
- `docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/upstream-feedback-draft.md` (grep)
- `docs/superpowers/reviews/2026-09-29-prompting-guide-audit.md` (grep)
- `git show 16f8c3e` and `git show dc5246a`

In total, 31 files.

## Mechanism map

**Pipeline and roles.** Each bead runs the same chain:

```
implementer (workspace setup + task-brief, then task-relevant tests, once) → [split, when it has open dependents]
  → review-package → task review (one, light) → [Critical/Important: one fix pass]
  → [wait for stack parents' merges] → serial merge (build-only mergeCheck, no tests) → ledger
```

The chain is described at coordinator-workflow.md:175–187 and SKILL.md:82, 90–94. The roles run on these tiers (SKILL.md:169–180; coordinator.js:30–37):

| Role | Model | Effort |
|---|---|---|
| planner | opus | high |
| triage | opus | high |
| finalReview | opus | high |
| implementer (also the fixer) | sonnet | inherits the session |
| reviewer (also the seam review and the merge agent) | sonnet | inherits the session |
| mechanical | sonnet | low |

**Planner → brief.** The planner runs once per epic and is append-only after that. Round 1 runs `plan` over the ready ids, then `plan-rest` maps the rest of the tree beside the running tasks (coordinator-workflow.md:776–784).

- **Inputs.** The planner treats bead text as the spec (planner-prompt.md:30–32). It runs `bd show` on each bead (coordinator.js:1551) and `tree-deps`.
- **The brief section.** For each bead it writes a `## Task <N>` section (planner-prompt.md:89–97) holding:
  - `filesTouched`, the writes only;
  - the acceptance criteria and the epic's Global Constraints, verbatim;
  - "Bite-sized, TDD-structured implementation steps with complete content — no placeholders";
  - an independently testable deliverable, with its tests named.
- **Extraction.** `task-brief` (SDD, byte-identical to upstream) extracts that section, and only that section, as the implementer's brief (task-brief:30–36; coordinator.js:1574).
- **Return.** The planner returns `mapping{n,id,files,deps,opaque}`, `unplanned`, and `missingEdges` (coordinator.js:245).

**Implementer.** The implementer works unattended. On an ambiguity it checks the brief, `bd comments` and the existing code, then picks the best-supported reading (implementer-prompt.md:16–19). Its instructions:

- Implement exactly the task (implementer-prompt.md:58).
- Scope fence: no unrequested refactors, follow the established patterns, record tangles as Concerns (70–74).
- Self-review against the brief (101–105).
- Commit last (107–112).

It also receives up to 10 deferred minors from already-merged tasks in the files it touches (coordinator.js:1583–1584).

**Task reviewer and the merge gate.** The review is "light": spec compliance plus "correctness later tasks depend on" (task-reviewer-prompt.md:10–12, 65–79).

- **Inputs.** The reviewer reads the brief, the report and the `-U10` diff package once. It reads code outside the diff only for a named risk (38–47; review-package:47–58).
- **Severity.** Critical, Important and Minor are defined at task-reviewer-prompt.md:81–91. Polish, naming and style are Minor.
- **Verdicts.**
  - `CLEAN`: no ❌ and no Critical or Important finding (106–107).
  - `NEEDS_FIX`: exactly one fix pass, then a merge with no re-review (coordinator.js:1942–2002).
  - Any unrecognized verdict also gets the fix pass (SKILL.md:268).
  - `INVALID`: one re-dispatch. A second `INVALID` is treated as `BLOCKED` (coordinator.js:1951–1962).
- **Minors.** Each Minor is a `[class]`-tagged line in the ledger at the merge gate (coordinator.js:810–815). Minors are clustered run-wide: five occurrences, or occurrences on three distinct tasks, raise a cluster (coordinator-workflow.md:1105–1118). They are forwarded to later implementers and triaged by the opus final review (coordinator.js:1849–1861).

**Fix pass.** A fresh implementer-tier agent makes the "smallest change", touching nothing a finding does not require. It may decline a finding that is wrong or plan-mandated; the task then merges **parked** (implementer-prompt.md:142–162; coordinator-workflow.md:865–875). Nothing re-checks the fix. A fixer that reports `BLOCKED` goes to triage (coordinator.js:2000).

**Seam and merge-check review.** These happen at merge time, inside the single-flight queue (coordinator-workflow.md:888–929; coordinator.js:669–783).

- **When it fires.** A seam review runs for:
  - files changed on both sides of the rebase;
  - a `consumes <id>` producer that landed after this task branched;
  - a merge-check failure.
- **Bounds.** Each gets one scoped review and at most one fix. The same-file seam fix and the merge-check fix share that one allowance.

**Triage.** An opus agent decides RESOLVE or ESCALATE from the blocker bead, the task's plan section and the spec excerpt. It reads the design doc (triage-prompt.md:49–62; coordinator.js:1779).

- **RESOLVE**: one re-attempt, with the clarification recorded on the bead (coordinator-workflow.md:1014–1024).
- **ESCALATE**: notify, quarantine and continue (1047–1056).

**Scheduler.** The ready set comes from `scripts/ready-in-tree`.

- **Window.** A sliding window of `min(concurrency, runtimeSlots−2)` chains (coordinator-workflow.md:432–443), strict FIFO in `bd ready` order (coordinator.js:1898–1940).
- **Hot-file cap.** `hotFileCap` (default 3) counts declared `filesTouched`. Dispatch is not gated on disjoint files: that bucketing "was removed on live measurement" (coordinator-workflow.md:441–443).
- **Worktrees.** Each task gets its own worktree, cut from the integration branch.
- **Merges.** A single-flight merge queue runs in completion order (coordinator.js:638–646).
- **Readiness and early unblock.** Readiness is computed from the planner's `deps` rows (922–938). Early unblock splits a task at implementation-done when it has open dependents; those dependents dispatch stacked on its unmerged branch and rebase `--onto` at merge (956–974; coordinator-workflow.md:464–481).
- **Ordinary-subagent mode.** This mode runs one chain at a time, with no early unblock and no edge audit (coordinator-subagents.md:7–13, 75–76).

**Design guidance by role.** A dash means the topic is absent.

| Topic | Planner | Implementer | Task reviewer | Seam / check-fix review | Triage | Final review |
|---|---|---|---|---|---|---|
| Abstraction, encapsulation, cohesion, interfaces | — (only `missingEdges` text: "a function, file, schema or interface one creates and the other uses", :116–117) | "Follow the codebase's established patterns and the file structure the plan defines" (:72–73) | — | "a changed signature, fixture, contract, export, schema or invariant" (coordinator.js:1618) | — | "cross-task integration seams" (coordinator.js:1860) |
| Duplication | — | — | — (SDD's "verbatim duplication of a logic block" was dropped) | "duplicated or contradictory edits to the same lines" (1618) | — | — |
| Method or file size | — (barrel files handled as a scheduling concern, :82–85) | file "grows beyond the plan's intent" → Concerns (:72–74) | — | — | — | — |
| Naming | — | — | Minor: "polish, naming, broader coverage, and style" (:90–91) | "names, signatures, schema, defaults" (consumes case, 1618) | — | — |
| Error handling | — | — | "swallowed errors" as correctness (:71–72) | "error and ordering behaviour the consumer assumes" (1618) | — | — |
| Exceptions, logging | — | — | — | — | — | — |
| Cleanup | — | process and temp hygiene only (coordinator.js:1520–1527) | leaked processes graded Minor or Important (:62–63) | — | — | — |

None of this guidance is language-adaptive (A3-F05).

## Findings

**A3-F01 — observed.** The task review is explicitly a light gate for spec compliance and correctness, with no design-quality rubric. "Keep it light … don't spend this pass on polish" (task-reviewer-prompt.md:10–12). "Minor: everything else, including polish, naming, broader coverage, and style" (90–91). The skill states the policy directly: "one deliberately light review; detailed code review is `super-roast`'s job" (SKILL.md:90–91; coordinator-workflow.md:856–858).
→ (b) Design enforcement at task review contradicts a stated owner policy. Without a policy change, the fit is Minor items with `[class]` tags.

**A3-F02 — observed.** super-code's reviewer omits SDD's whole "Part 2: Code Quality" section:

- separation of concerns, error handling, "DRY without premature abstraction";
- one responsibility per file with a well-defined interface;
- decomposition.

It also omits SDD's Important clause, "maintainability damage you would block a merge over — verbatim duplication of a logic block, swallowed errors, tests that assert nothing" (SDD task-reviewer-prompt.md:115–133, 147–151). super-code's Important lists requirements, behavior and test evidence only (task-reviewer-prompt.md:85–89). The omission dates from the prompt's creation in 16f8c3e ("one relaxed review … super-roast owns detailed code review"). SDD must stay byte-identical (SKILL.md:259).
→ (b) A tested rubric text exists to borrow. Any change goes into super-code's own copy, not SDD's.

**A3-F03 — observed.** The implementer's design guidance comes down to three instructions:

- follow the established patterns and the plan's file structure;
- note a tangled file under Concerns rather than restructuring it;
- "Don't add features, files, docs, refactors, or tests the task didn't ask for" (implementer-prompt.md:70–74).

Self-review checks the requirements, nothing extra, the patterns and the tests (101–105). SDD's versions are absent:

- "one clear responsibility with a well-defined interface" (SDD implementer-prompt.md:62–73);
- "Are names clear … Is the code clean and maintainable?" (101–104).

→ (a) Self-review is a zero-dispatch attach point, but it must be reconciled with the scope fence.

**A3-F04 — gap.** The role prompts carry nothing on logging, exception design or resource cleanup. A grep of the four prompts for `logging` and `exception` finds 0 design hits. The only error guidance is:

- the reviewer's "swallowed errors" (task-reviewer-prompt.md:71–72);
- the seam review's "error and ordering behaviour the consumer assumes" (coordinator.js:1618).

"Cleanup" means stopping processes and removing temp state (coordinator.js:1520–1527).
→ (a)(b) Error and logging conventions are absent at both design time and review time. The consumes-seam review is the one existing hook for error behavior at an interface.

**A3-F05 — gap.** No role guidance is language-adaptive. Adaptation comes only from "established patterns" (implementer-prompt.md:72) and from commands that pre-flight resolves (`mergeCheck`, `sweep`, `testPaths`). Pre-flight reads `AGENTS.md`, the README and CI only for the test and build commands and their envelope (coordinator-workflow.md:288–299, 100–104, 130–134).
→ (a) A language-adaptive incentive needs a new input: a planner-extracted conventions note, or a pre-flight digest.

**A3-F06 — gap.** The planner is never told to read existing code, the project's conventions, or the design doc. It reads bead text (planner-prompt.md:30–32; coordinator.js:1551). Triage and the final review are told to read the design doc (coordinator.js:1779, 1860). The brief section (planner-prompt.md:89–97) has no `Interfaces:` block, unlike writing-plans' "Consumes / Produces — exact function names, parameter and return types" (writing-plans/SKILL.md:91–95). It also has no file-structure or responsibility guidance (25–34).
→ (a) The highest-leverage attach point with no extra dispatch: brief fields plus a "read the touched files and their collaborators" step.

**A3-F07 — inference.** This follows from F03, F06 and the decline path. Design is effectively decided by the planner:

1. The plan carries "complete content" (planner-prompt.md:94).
2. The implementer must "Implement exactly what the task specifies" (implementer-prompt.md:58).
3. A reviewer finding against plan-mandated design is graded "Important … plan-mandated" (task-reviewer-prompt.md:87–89).
4. The fixer declines it (implementer-prompt.md:153–155).
5. The task merges parked, and the final review sees it (coordinator-workflow.md:865–872; coordinator.js:818–823, 1986, 2001).

→ (a) Review-time design findings against planner-authored design spend a fix dispatch and end parked. Incentives belong at the planner and in the bead text.

**A3-F08 — observed.** The reviewer's inputs are:

- the brief, "including the epic's global constraints carried into it";
- the report, read as claims to verify;
- the diff package, read once: commits, stat, and `git diff -U10`;
- the test-path diff.

It reads code outside the diff only "to check a concrete risk you can name, one focused check per risk" (task-reviewer-prompt.md:38–47; review-package:47–58). For a shared boundary it traces one caller to the new code (73–76). It does not read the design doc, the epic, other tasks' sections, or the surrounding abstractions.
→ (b) "Fits the existing abstraction" cannot be judged without new brief content or an explicit named-risk check.

**A3-F09 — observed.** The merge gate, the fix pass and the Minor channel work as follows.

- `CLEAN` means no ❌ and no Critical or Important finding (task-reviewer-prompt.md:106–107).
- `NEEDS_FIX` gets exactly one fix pass, then merges with no re-review (coordinator.js:1942–2002; SKILL.md:267). An unrecognized verdict gets the fix pass too (SKILL.md:268).
- Minors carry `[class]` tags (task-reviewer-prompt.md:110–113) and are clustered run-wide (coordinator-workflow.md:1105–1118). Up to 10 are forwarded to later implementers touching the same files, which "fix one only when your change rewrites those same lines anyway" (coordinator.js:1583–1584). The final review is told to triage clusters first (1860).

→ (b) The Minor channel is an existing design-smell feedback loop with no extra dispatch. This is consistent with "Deferred minors stay minors" (coordinator-workflow.md:1320–1323).

**A3-F10 — inference.** This follows from the fix loop's cap and the triage rules. A task cannot thrash: there are no rounds (coordinator-workflow.md:856–858), unlike SDD's five-round loop (SDD SKILL.md:373). The risks lie elsewhere:

1. A design finding graded Important costs one extra fix dispatch plus a ledger flush, and the fix merges unverified.
2. A finding that needs a design decision leads to a fixer `BLOCKED`, then opus triage, which leans to ESCALATE ("When uncertain, ESCALATE", triage-prompt.md:56–62). The task is then quarantined and its dependents stay unready (coordinator-workflow.md:1054–1055). The fix-pass-blocked baseline is exactly this case: "the caching strategy is a design decision the spec does not settle" (1918–1920).
3. A decline parks the finding.

→ (a)(b) In autonomous runs, grading design as Important risks quarantine cascades rather than thrash.

**A3-F11 — observed.** Interface conformance already has a review hook at merge.

- **Seam review.** It fires on files changed on both sides of the rebase, and on "a consumed producer", where it "checks the consumer against the interface that producer now presents" (coordinator-workflow.md:888–901). Its checklist covers signature, contract, schema, invariant and error behavior (coordinator.js:1618).
- **Merge-check fix.** A build-only check failure on the merged tree gets one scoped fix and a review of that fix (coordinator-workflow.md:912–929).

→ (b) Contract-first beads can lean on this hook. It is bounded to one fix.

**A3-F12 — inference** (medium confidence; based on coordinator.js:667 and 1758).

- `composedWith` excludes stack parents (coordinator.js:667).
- A stacked task's seam check intersects file lists only (1758; coordinator-workflow.md:473–474).

So a contract bead whose fix pass changes its interface inside its own files gets no seam review for a stacked consumer that calls it from other files. Only `mergeCheck` would catch the change, and `mergeCheck` can be `'none'` (SKILL.md:120).
→ (a)(b) Contract-first beads combined with early unblock need either a consumes-seam review for a parent whose fix pass changed files, or a rule that the contract's review lands before its consumers start.

**A3-F13 — observed.** The scheduler (described under Scheduler above):

- ready set from `ready-in-tree`;
- sliding-window cap, strict FIFO in `bd ready` order;
- hot-file cap on `filesTouched`, with no disjoint-file batching;
- per-task worktrees;
- single-flight completion-order merges;
- graph readiness from the planner's `deps` rows;
- early-unblock split.

Sources: coordinator-workflow.md:432–481; coordinator.js:922–974, 1898–1940. A bead with no blockers is planned and dispatched in round 1. Its split waits for `plan-rest` (coordinator.js:917–918, 957).
→ (a) A contract-first bead dispatches early without any change. Its consumers start at its implementation-done, not at its merge.

**A3-F14 — observed.** Contract-first machinery already exists in three places:

1. super-design's `Seam contract:` bead "delivers compilable boundary code", with an edge from every participant onto it (super-design/SKILL.md:500).
2. super-code accepts the contract bead's two-sided file span (planner-prompt.md:85–87; SKILL.md:219–221).
3. graph-shape exempts `consumes boundary contract` edges from the edge audit (graph-shape:10–12).

The cost is depth: "Depth, not width, is the usual ceiling" (SKILL.md:241–249).
→ (a) The hypothesis can reuse this bead type and its edge token. Expect one extra level of chain depth for each participant chain, partly offset by early unblock.

**A3-F15 — observed** (counts) **and inference** (generalization). The one recorded run in the repo has 13 work beads and 5 launches (upstream-feedback-draft.md:4).

- super-code's metrics: "review clean 13 · after fix pass 0 … fix-pass — entered 0" (upstream-feedback-draft.md:60), and "seam-reviews 1" (62).
- The PR roast that followed, round 1: "Should-fix (12)" (57).

The work was skill prose, not OOP code.
→ (b) The light task review passes nearly everything, and super-roast is where enforcement bites. One run is weak evidence.

**A3-F16 — observed.** Planner and reviewer disagree. The planner says "one task reviewer checks spec compliance and quality together" (planner-prompt.md:96–97). The reviewer is told to keep it light and grade polish, naming and style Minor (task-reviewer-prompt.md:10–12, 90–91).
→ Documentation drift, to fix alongside any rubric change.

**A3-F17 — observed** (references) **and inference** (reading). super-code loads none of the TDD, verification or code-reviewer skills: a grep of `skills/super-code/` returns 0 hits. TDD's "REFACTOR — Remove duplication / Improve names / Extract helpers" (TDD SKILL.md:185–192) reaches the implementer only through "TDD when the brief says so" (implementer-prompt.md:58). The scope fence's "Don't add … refactors" (70) can be read to forbid even refactoring code the agent wrote itself in this task.
→ (a) A one-line clarification is a cheap incentive.

**A3-F18 — observed.** Cost and update obligations.

- **Per bead.** A clean task costs 3 dispatches: implement, review, merge. It costs one more for a split, when it has open dependents. It costs one more for a ledger flush, when it has minors, a stacked line or a fix line (stub table, coordinator-workflow.md:1677–1696). SKILL.md:82 says "four agents for a clean task".
- **Prompt edits.** Prompt edits are "data edits" and skip the dryRun re-run (coordinator-workflow.md:1595–1599). The replay harness still asserts template phrases (replay-harness.mjs:516, 532–539, 1612, 1767, 2183–2184).
- **Structural edits.** These need a re-run of all three baselines: 44, 19 and 21 calls (coordinator-workflow.md:1395, 1732, 1886, 1954).
- **Schemas.** dryRun cannot validate a schema change (1553–1556).
- **Tokens.** No token cost is recorded for any role.

**A3-F19 — gap.** The light-review decision has no rationale in MAINTENANCE.md (its headings and greps have no hit). The rationale lives only in the commit message of 16f8c3e and in the policy text (SKILL.md:90–94).
→ A change should record its rationale in MAINTENANCE.md, not SKILL.md, since SKILL.md carries no history.

## Extension points

These are ordered cheapest first.

1. **Planner brief fields** (planner-prompt.md:89–97, plus a reading step in "Your Job" at 66–117).
   - **Change:** add `Interfaces: Consumes/Produces` with exact signatures (mirroring writing-plans:91–95), and `Builds on: <path:symbol>` naming the existing abstractions and patterns this task extends, with how errors and logs are handled there. Also add a step: read the `filesTouched` files, their direct collaborators, and the epic's design doc.
   - **Layer:** template text only; no engine change.
   - **Cost:** 0 extra dispatches. More opus input and output tokens per epic, and a larger brief that both the implementer and the reviewer read. The round-1 `plan` sits on the critical path (SKILL.md:283; coordinator-workflow.md:776–784).
   - **To update:** the replay harness (the planner check at :474 tests only the dispatch path), a MAINTENANCE note, and evals.
   - **If structured:** making the fields machine-readable means a PLANNED schema change (coordinator.js:245), which is a structural edit that dryRun cannot validate.
2. **Implementer self-review and scope** (implementer-prompt.md:70–74, 101–105).
   - **Change:** two or three checks: names match behavior; reuse an existing helper before copying logic; propagate or handle errors the way the codebase does; refactoring your own new code is in scope.
   - **Cost:** 0 dispatches.
   - **Constraint:** keep the harness regexes passing (replay-harness.mjs:532–536, 2183).
3. **Reviewer rubric item, graded Minor** (task-reviewer-prompt.md:65–79, 90–91, 110–113).
   - **Change:** design classes with stable `[class]` tags (`[duplicated-logic]`, `[leaky-abstraction]`, `[swallowed-error]`, `[inconsistent-error-handling]`).
   - **Cost:** 0 dispatches. Feeds the recurrence clusters, later implementers and the final review.
   - **If promoted to Important:** +1 `fix:<id>` and +1 `ledger:<id>` per task that hits it, plus the escalation risk in F10.
   - **Constraints:** keep `CLEAN when there is no ❌ item and no Critical or Important issue` (harness :538), keep Issues before Strengths (:539), and fix F16's drift.
4. **Final-review instruction** (coordinator.js:1849–1861).
   - **Change:** name design-class clusters and the parked design findings.
   - **Cost:** 0 extra dispatches; the opus final review runs once.
   - **Layer:** prompt text inside coordinator.js. The template-literal span check applies (coordinator-workflow.md:1579–1593).
5. **Consumes-seam review for stack parents** (coordinator.js:667, 1758).
   - **Change:** an engine code change, which is a structural edit.
   - **Cost:** at most 2 dispatches (`seam-review` plus `merge:…:seam-cleared`) per stacked consumer whose parent's fix changed files.
   - **To update:** re-run all three baselines, the revision table (coordinator-workflow.md:1370–1395), the expected counts, and the stub tables.
6. **Pre-flight conventions digest** (coordinator-workflow.md:284–299, recorded on the `Launch:` line).
   - **Change:** an additive contract field (23–48), with parity for ordinary-subagent mode (coordinator-subagents.md:19–36).

**Must stay untouched:**

- One review, at most one fix pass, no re-review (SKILL.md:267; coordinator-workflow.md:856–858).
- An unrecognized verdict gets the fix pass (SKILL.md:268).
- SDD stays byte-identical to upstream (SKILL.md:259).
- The single-flight merge queue (SKILL.md:275).
- `mergeCheck` is build-only, and no tests run at merge (SKILL.md:269, 272).
- "Deferred minors stay minors": no severity floor (coordinator-workflow.md:1320–1323).
- RESOLVE gets one retry (1018–1024).
- Blocker beads carry the `blocker` label only (SKILL.md:286).
- Brief headings stay ordinals (SKILL.md:284).

## Constraints and costs

**Tests.**

- The fork release runs the replay harness (CLAUDE.md). The harness reads both templates (replay-harness.mjs:32–33) and asserts their phrases (see F18).
- A structural coordinator edit triggers the dryRun rule: re-run and record the figures, never carry a stale baseline forward (coordinator-workflow.md:1595–1612). The current figures are 44, 19 and 21 calls.
- The super-auto contract lint resolves `super-code` § pointers to its SKILL.md (test-contract-lint.sh:84), so renaming a super-code heading that super-auto references breaks the lint.

**Per-agent cost.**

- A clean task costs 3 to 4 dispatches (F18).
- A Critical or Important finding adds one sonnet fixer and a ledger flush.
- A blocker adds an opus triage plus notify or clarify dispatches.
- The planner, triage and final review run on opus with high effort.
- No token metrics are recorded.

**Philosophy.**

- The owner's policy is that super-roast owns detailed review (SKILL.md:90–94; 16f8c3e).
- Minors stay minors (coordinator-workflow.md:1320).
- "Skills avoid overconstraining": keep additions to the chosen policy.
- "SKILL.md carries no history": rationale goes to MAINTENANCE.md.
- "Autonomous runs degrade, don't stop": design escalations should not cascade into quarantines (F10).
- A skill change needs eval evidence from the drill harness in `evals/` (CLAUDE.md "Skill Changes Require Evaluation").

## Open questions

1. Does the opus planner read code in practice? No planner transcripts are in the repo.
2. What CLEAN rate and fix-pass rate does the light review produce on OOP codebases? The only recorded run was prose-only (F15).
3. What does each role and dispatch cost in tokens? This is needed to price the planner and brief growth.
4. Do agents read "Don't add … refactors" as forbidding TDD's REFACTOR step on their own new code (F17)?
5. How often does a contract bead's fix pass change its interface under stacked consumers, and does the typical target project's `mergeCheck` catch it (F12)?
6. Would sonnet reviewers apply design `[class]` tags consistently enough to cluster?
