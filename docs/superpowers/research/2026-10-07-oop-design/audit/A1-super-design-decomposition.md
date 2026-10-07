# A1 — super-design decomposition and interface/abstraction modeling

Auditor A1 · repo at `research/oop-design-scouts` (base `main` eb0462b, 6.4.2-alepar4.16) · 2026-10-07 · read-only.

## Scope and files read

**In scope, read in full (28 files):**

| File | Lines |
|---|---|
| `skills/super-design/SKILL.md` | 811 |
| `skills/super-design/promotion-reviewer-prompt.md` | 81 |
| `skills/super-design/coverage-reviewer-prompt.md` | 97 |
| `skills/super-design/graph-pass-prompt.md` | 70 |
| `skills/super-design/step-back-prompt.md` | 102 |
| `skills/super-design/scripts/coverage-inputs` | 128 |
| `skills/super-design/scripts/coverage-precheck` | 117 |
| `skills/super-design/scripts/graph-shape` | 136 |
| `skills/super-design/scripts/requirements-tally` | 82 |
| `skills/super-design/scripts/coverage-divergence` | 36 |
| `docs/superpowers/specs/2026-07-27-super-plan-recursive-decomposition-design.md` | 309 |
| `docs/superpowers/specs/2026-08-26-leaf-sizing-design.md` | 94 |
| `skills/brainstorming/SKILL.md` (all of it; the parts about architecture and spec structure are cited) | 316 |
| `skills/writing-plans/SKILL.md` | 159 |
| `tests/super-design/test-scripts.sh` + 13 fixtures (`graph.json` read in part) | 169 + small |

**Cross-reference, read in part (10):** `skills/super-code/planner-prompt.md` (lines 25–146),
`tests/super-auto/test-contract-lint.sh` (243), `tests/skill-scripts/test-bash-invocation.sh` (29),
`skills/super-roast/scout-prompts-design.md` (143–222), the two recorded runs under `docs/superpowers/runs/`
(the spec headings, `run.md` flags, `settled-tree.md` 1–24), plus grep-located single lines in
`skills/super-code/coordinator.js`, `tests/super-code/replay-harness.mjs`,
`skills/super-auto/{SKILL,run-state}.md` and `skills/super-roast/scout-prompts-pr.md`. Read with
`git show`: 3370ba1, a77db24, 8e1262a, 205b77d, 8eca311.

**Skipped:** `docs/superpowers/specs/2026-08-25-integration-seams-design.md`, which belongs to A2's
deep dive on seams and contract beads, and super-roast and super-code internals beyond the lines
cited, which belong to other auditors.

**Test run:** `tests/super-design/test-scripts.sh` ran with `TMPDIR` set to the session scratchpad.
It has no side effects (it writes only `mktemp` files and cleans them up), and `git status` was
unchanged afterwards. Result: 32/32 PASS.

## Mechanism map

**Pipeline** (`SKILL.md:85-95`): brainstorming writes the root spec. Decomposition then runs in
two steps, Step A (split) and Step B (connect) (`:171-183`). Next come the promotion review
(`:302-313`), the promotions, and the top-split gate (`:89`). Each promoted child then gets a
nested brainstorm, depth-first. That brainstorm reads the parent spec, the ancestor goals and the
specs of siblings already designed (`:90`, `:343`), and its spec recurses into super-design. Steps
that run at the root only: the coverage loop (≤2 rounds × 2 opus reviewers, `:425-449`), the
optional super-roast design loop (cap 3 plus 1 extension, with a step-back pass each round,
`:551-606`), the parallelism pass (`:629-666`), and the hand-off. The hand-off goes to super-code
in beads mode, or to writing-plans + SDD in no-beads mode (`:673-683`).

**Where design is modeled, by artifact:**

| Artifact | What it carries about units and interfaces | Citation |
|---|---|---|
| Spec, Mode A | the design is presented to the human covering "architecture, components, data flow, error handling, testing" | `brainstorming/SKILL.md:222-228` |
| Spec, Mode B (forced under `autonomous`) | four parts: problem, challenges, key decisions, decision points. No slot for components or interfaces | `brainstorming/SKILL.md:266-272`; `super-design/SKILL.md:28,42` |
| Spec, both modes | generic unit guidance: "one clear purpose … well-defined interfaces … understood and tested independently" | `brainstorming/SKILL.md:230-235` |
| Bead | 4 fields (title, short description, files-touched hint, blocking deps), plus `owns:`/`consumes:` boundary lines inside the description | `super-design/SKILL.md:86,145,208-221` |
| `Seam contract:` bead (reactive) | "compilable boundary code … interface/types/signatures, the schema fields, and the wiring" | `super-design/SKILL.md:500` |
| Plan, no-beads | File Structure responsibility map; per-task `Interfaces:` Consumes/Produces with exact signatures; type-consistency self-check | `writing-plans/SKILL.md:25-34,91-95,148` |
| Plan, beads (super-code planner) | filesTouched, acceptance criteria and Global Constraints verbatim, TDD steps, deliverable. No interfaces block | `super-code/planner-prompt.md:89-95` |

**Bead description template.** The template is assembled from `SKILL.md:145,155-169,208-221,268-289,495-516`.
A real instance is at `runs/2026-09-04-audit-plan-instrumentation/settled-tree.md:7-12`.

```
<title>   prefixes with fixed meaning: Seam contract: | Seam integration: | Integration sweep: | Configuration smoke:
<short description prose>              coverage sees only its first sentence (coverage-inputs:94-95)
owns: <boundary>  /  consumes: <boundary>   literal tokens; only when exchanging with a sibling; no "owns: none"
files: <files-touched hint>            the "files:" token appears in practice; SKILL.md names only a "hint"
acceptance: … (needs: <bead-id>)       or bd's acceptance_criteria field (precheck reads both: coverage-precheck:59)
blocked-by <id>: consumes <artifact>   one per blocking edge; fixed artifacts `boundary contract`, `all leaves (integration sweep)`
boundary contract: <contract-bead-id>  appended to seam participants (SKILL.md:502)
```

**Review passes:**

| Pass | When / count | Model | Inputs | Checks | Sees spec prose? |
|---|---|---|---|---|---|
| Promotion review | once per super-design invocation (root and each subepic) | not pinned, so it inherits the session model (`promotion-reviewer-prompt.md:11`; `SKILL.md:304`) | spec file, child list with deps, ancestor goals, sibling specs; may not explore the repo (`:17-33`) | LEAF/PROMOTE (uncertainty, size)/SPLIT (bottleneck + oversize); the decomposition verdict is complete/correct/non-duplicative (`:37-65`) | **yes, the full spec** |
| Coverage | root only; 2 reviewers per round, ≤2 rounds, plus ≤1 NEEDS-SPEC re-run per reviewer per round | opus (`coverage-reviewer-prompt.md:3,9`) | Goal sections, one line per bead, owns/consumes lines, precheck output, ledger; "call no tools, read no files" (`:18-21`) | requirement mapping, GAP, ORPHAN, UNOWNED-SEAM (`:52-69`) | no (only via NEEDS-SPEC) |
| Graph pass | once, root | opus (`graph-pass-prompt.md:6`) | graph-shape output, dump, the edge rules | edges only: "Change edges, not scope" (`:19`) | no |
| Step-back | once per roast round that has confirmed findings | opus (fable where available) (`step-back-prompt.md:5`) | every roast report, the tree, specs | recurrence, and clusters "around one decision, interface, data flow, or ownership choice" (`:71-77`) | yes |
| super-roast design (opt-in) | ≤3+1 rounds | roast panel | the settled tree and specs | completeness lens: "undefined interfaces … unhandled error/edge cases"; yagni lens: "speculative generality" (`scout-prompts-design.md:149-160`) | yes |

## Findings

**A1-F01 · observed · Decomposition operates on tasks and boundaries, not on abstractions.**
The required per-child fields are "title, short description, files-touched hint, blocking deps"
(`SKILL.md:86,145`), and the children are "rough child tasks" (`:86`). The only structural design
content in a bead is the `owns:`/`consumes:` boundary declaration. It is defined as "any data or
interface this child exchanges with a sibling" and is "not a fifth field" (`:208-213`). It is
omitted when a child exchanges nothing (`:220-221`). No artifact names abstractions or types with
their responsibilities, collaborations or variation points. A grep of every in-scope file returned
zero hits for abstraction, encapsulation, polymorphism, domain model, idiom, exception and logging.
*Implication:* (a) no design-time slot exists for an abstraction model. (b) Reviewers have no
model to check against.

**A1-F02 · observed · The bead format is free text with literal line tokens, matched by scripts.**
The tokens and title prefixes are listed in the template above. The reviewers match them literally,
and a prose paraphrase produces a false-positive `UNOWNED-SEAM` (`SKILL.md:217-220`). Scripts parse
the tokens with fixed regexes: `coverage-inputs:94,104,106-107`, `coverage-precheck:56-60` and
`graph-shape:56`. Acceptance is not among the four named fields, but rules assume it
(`SKILL.md:147-161`). In practice beads carry `files:` and `acceptance:` lines
(`settled-tree.md:10-12`). *Implication:* a new line token costs regex, fixture and prompt edits.
Adding content inside the existing `owns:` costs none of these.

**A1-F03 · observed · Type and signature-level interface code appears only in reactive seam-contract beads.**
`Seam contract:` beads deliver "compilable boundary code" (`SKILL.md:500`). They are created only
after coverage verifies an `UNOWNED-SEAM` (`:495-499`). They are also cited as the exemplar for
bottleneck sizing (`:204-205`). Interfaces are therefore modeled up front only when a seam was
missed; a boundary that is owned correctly gets no contract artifact. This overlaps A2.

**A1-F04 · observed · Mode B specs, which are forced under `autonomous`, have no architecture or interface section.**
The Mode B structure is problem, challenges, key decisions, decision points
(`brainstorming/SKILL.md:266-272`). The list "architecture, components, data flow, error handling,
testing" sits under the design presentation, which runs in Mode A only (`:129,222-228`). super-design
forces Mode B for every brainstorm under `autonomous` (`super-design/SKILL.md:28,42`). The two
recorded runs were both `autonomous` (`runs/*/run.md:3`), and their outputs diverge. The 2026-10-01
spec uses exactly the four Mode B headings (`…roast-fixes-design.md:7,23,30,46`). The 2026-09-04
spec has Components, Data flow and Error handling sections (`…instrumentation-design.md:20,160,164`).
*Implication:* (a) this is the largest gap at design time, and the cheapest one to fix.

**A1-F05 · observed · The interfaces artifact with eval evidence exists only on the no-beads path.**
writing-plans has a File Structure map, an `Interfaces:` Consumes/Produces block with exact
signatures, and a type-consistency check (`writing-plans/SKILL.md:25-34,91-95,148`). Commit 8e1262a
records "Per-task Interfaces blocks: 0 -> 100% of tasks, exact signatures". super-design uses
writing-plans only in no-beads mode (`SKILL.md:674,683`). The beads-mode planner's task section has
no interfaces block (`super-code/planner-prompt.md:89-95`). A grep of super-code finds zero mentions
of writing-plans, Interfaces or File Structure. This overlaps the super-code auditor.

**A1-F06 · observed · No current pass checks abstraction-model coherence or interface quality.**
The closest hooks:
- the promotion reviewer's uncertainty test, "would force design decisions the spec doesn't answer" (`promotion-reviewer-prompt.md:40-41`);
- its "Correct: no child contradicts the spec" verdict (`:61`);
- the roast completeness lens (`scout-prompts-design.md:152`);
- the step-back clustering on an "interface … or ownership choice" (`step-back-prompt.md:73`), which only fires after roast findings.

The abstraction-level and observability lenses exist only in PR-mode roast
(`scout-prompts-pr.md:261-306,484-495`), not in design mode.

**A1-F07 · observed · Coverage is deliberately compact and cannot see spec prose.** Coverage asks
a "high-level question … reads goals and a compact tree, not spec prose", and leaves detail defects
to other passes (`SKILL.md:383-388`). Commit 205b77d narrowed it from 7 finding types to 3, leaving
"edge and detail checks … to the graph pass and super-roast". The input budget is 60 KB
(`coverage-inputs:16,127-128`). Pasting spec prose into a coverage review is a Red Flag
(`SKILL.md:784-786`). *Implication:* (b) coverage is the wrong host for an abstraction check. It
does see `owns:` lines, though, so richer `owns:` content reaches it at no cost.

**A1-F08 · inference** (from `SKILL.md:90,343` and decomposition spec `:43`) **· Sibling interface
consistency relies on sequential reading of spec prose.** Siblings are designed depth-first "so
shared interfaces get designed once" (spec `:43`), but nothing registers or cross-checks them. The
promotion reviewer checks children only for duplication against sibling specs
(`promotion-reviewer-prompt.md:62`). Coverage sees only Goal sections (A1-F07).

**A1-F09 · observed · Guidance on error handling, logging and idioms is minimal and indirect.**
The full inventory:
- `brainstorming/SKILL.md:227`: Mode A presentation lists "error handling".
- `writing-plans/SKILL.md:134` forbids the placeholder "Add appropriate error handling" (no-beads path only).
- For idioms, "Follow existing patterns" (`brainstorming/SKILL.md:239`; `writing-plans/SKILL.md:32`).
- The design-mode roast mentions "unhandled error/edge cases" (`scout-prompts-design.md:152-153`).

super-design (SKILL, 4 prompts, 5 scripts, 2 specs) has no guidance on error handling, logging or
language idioms. **gap:** no canonical per-language error or logging practice anywhere in scope.

**A1-F10 · observed · Documented philosophy rules out generic OOP advice and new passes.** The
"Skill-Writing Altitude" section allows only tool quirks, chosen policies and thresholds, and
interface contracts; "everything derivable … is left unsaid" (decomposition spec `:142-150`). The
leaf-sizing precedent says "no new review passes — … write-time guidance plus, at most, a criterion
riding a pass that already reads every child" (leaf-sizing spec `:13-15`). It added `SPLIT` to the
promotion review, verified with Haiku probes (`:27-29,75-78`). *Implication:* an outline has to be
framed as a contract or policy, the way `owns:` is, and enforced by riding the promotion review.

**A1-F11 · observed · Any new check has to accept its default without asking when unattended.** There are exactly two stops
(`SKILL.md:64-68`). Every other ask has a recorded default and is "never waited on" (`:70-81`).
Gates by Mode is "the one statement of the design gates" (`:36`). *Implication:* there is no room
for a procedural pause. A new check must apply its fix automatically or park the item.

**A1-F12 · observed · Sizing limits interface beads.** The ceremony floor is about 5 dispatches
per bead (`SKILL.md:197-200`; the leaf-sizing spec says "~5–6", `:24,52`). The bottleneck rule
says a gating bead lands "only the unblocking artifact" (`:201-206`). *Implication:* one bead per
abstraction would fall below the floor unless it gates two or more beads, in the seam-contract
style. Outlines belong in the spec or the bead text, not in new beads by default.

**A1-F13 · observed · The test surface covers the scripts only.** `test-scripts.sh` makes 32
assertions over the 5 scripts. It pins `coverage-inputs` output exactly, declaration lines included
(`:128-149`). Nothing in the repo tests the prompts or SKILL text. `evals/` is not cloned in this
worktree, and CLAUDE.md requires before/after evals (`CLAUDE.md:93-100`). The super-auto contract
lint resolves the super-auto pointers into super-design headings (`test-contract-lint.sh:77-125`).
`graph-pass-prompt.md` is reused by super-code's audit (`replay-harness.mjs:1837`;
`coordinator.js:1697`). super-auto's fix beads reuse "super-design §Decomposition's fields"
(`super-auto/SKILL.md:275`).

**A1-F14 · gap · No recorded live evidence of OOP-quality defects traced to decomposition.** I
looked in `docs/superpowers/feedback/` (2 entries) and `docs/superpowers/runs/` (2 runs, both on
skill-text work). Neither has any hit for abstraction, encapsulation, polymorphism or procedural.
*Implication:* the problem statement has to be grounded outside this repo (see `CLAUDE.md:52`,
"Speculative or theoretical fixes").

## Extension points (least machinery first)

1. **Spec section.** One of two options:
   - a super-design §Conventions rule (`SKILL.md:762-766`), next to the mandated `## Goal`. It is scoped to super-design and leaves brainstorming untouched.
   - a fifth Mode B structure item (`brainstorming/SKILL.md:266-272`). This affects every architectural brainstorm.

   Consumers that already exist: the promotion reviewer reads the full spec, nested brainstorms
   read parent and sibling specs, and the roast reviews specs. Coverage is unaffected because it
   extracts `## Goal` only (`coverage-inputs:50-53`). No scripts or tests change.
2. **A promotion-review criterion.** Add a fourth decomposition-verdict criterion
   (`promotion-reviewer-prompt.md:58-62`), for example that the children's `owns:` lines are
   consistent with the spec's unit outline, plus one sentence in `SKILL.md` §Promotion Review
   (`:302-313`). It follows the SPLIT precedent, runs at every level, and touches no
   scripts. Model: inherited.
3. **Richer `owns:` content** naming the owning unit or type: no token, script or fixture changes.
   A new token would touch `coverage-inputs:94,104,106`, `test-scripts.sh:128-149`,
   `coverage-reviewer-prompt.md:28-30`, and super-auto fix beads. It would also inherit the
   hazard of wholesale `bd update --description` rewrites (`SKILL.md:502`).
4. **Port the writing-plans `Interfaces:` block** to the super-code planner
   (`planner-prompt.md:89-95`). There is eval evidence for it (8e1262a), but this is super-code
   territory.

**Not recommended:** coverage (A1-F07), the graph pass (edges only, and shared with super-code),
and the step-back pass (reactive by design).

**Must stay untouched:**
- Gates by Mode (`:34-50`) and the two-stop list (`:64-68`);
- the coverage caps of 2 reviewers × 2 rounds (`:425-449`);
- the roast cap of 3+1 (`:579-606`);
- the tripwire at depth 3 or more than 10 epics (`:368`);
- the parallelism pass rule "edges, never scope" (`:634-635`);
- the literal and fixed tokens (`:217-221,283-289`);
- the graph-shape exemptions (`graph-shape:10-12,56`);
- the headings that super-auto points to: §Decomposition, §Gates by Mode, §Run-State File (when a caller supplies one), §Parallelism Pass (root only), §Adversarial Review Loop (root only), §Unattended Runs.

## Constraints and costs

- **Dispatches per run:**
  - promotion: 1 per invocation;
  - coverage: ≤4 opus calls, or ≤8 with NEEDS-SPEC re-runs;
  - graph pass: ≤1 opus call;
  - step-back: ≤4 opus calls;
  - roast: optional.
- **Tests:** `bash tests/super-design/test-scripts.sh` (32/32), the super-auto contract lint, and
  `tests/skill-scripts/test-bash-invocation.sh`, which checks that any new helper is invoked
  through an interpreter (`:2-4`). Skill text has no in-repo tests and needs evals.
- **Philosophy:** skill-writing altitude (A1-F10); "skills avoid overconstraining" (user memory);
  unattended runs degrade but do not stop (A1-F11); "When in doubt, leave it out" for edges
  (`SKILL.md:237-239`).

## Open questions

1. Can a promotion reviewer with an unpinned model, reading only the spec, judge abstraction
   coherence reliably? No probe exists.
2. What do specs and trees look like for object-oriented application code? Both recorded runs are
   skill-text work.
3. Do `owns:`/`consumes:` lines reach implementers? The planner receives the full bead text
   (`planner-prompt.md:46-50`) but carries only the acceptance criteria and Global Constraints
   verbatim (`:93`). `SKILL.md:502` claims the lines flow through, but I did not verify that here;
   the super-code auditor should.
4. Should the outline be required in every spec, or only where there are two or more
   collaborating units? Leaving it optional mirrors the "no `owns: none` filler" rule.
