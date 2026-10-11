# super-design: Key abstractions step

Run: [2026-10-10-key-abstractions-design-step](run.md). Research: [2026-10-07-oop-design](../../research/2026-10-07-oop-design/README.md). Tracker: [TODO-OOP-RECOMMENDATIONS.md](../../../../TODO-OOP-RECOMMENDATIONS.md).

## Goal

Every spec super-design handles gains a short `## Key abstractions` section, written before decomposition by a fresh designer that builds on the abstractions designed above it. This covers the root spec and each promoted subepic's spec. The section reaches the beads, every task brief and the code roast. On the eval fixtures, the step names the missing abstraction when a CLI adds a third integration, and answers "no new abstractions" for a one-flag change.

## Problem

Agent-written code tends to miss abstractions and blur responsibilities ([dossier D9](../../research/2026-10-07-oop-design/dossiers/D9-design-guidance-llm.md)). A motivating case, kept generic because this fork is public:

- A CLI tool added a second, then a third agent-harness integration. Its callers branched on harness-name strings in about 15 places across 7 core files.
- A later run designed a proper adapter trait and registry. Such branches still grew to 18 across 11 files, most of them written during and after that run.
- When a bead needed per-harness behavior the trait didn't cover, its implementer added a branch in the caller it was working on. No review stopped it, because no written rule said where that behavior belonged.

Nothing in the pipeline asks the abstraction questions today:

- brainstorming sketches components and data flow, but not which abstraction owns which decision;
- decomposition splits by deliverable;
- the research plan's seam notes (TODO item 4) cover only interfaces between beads, and a missing abstraction is nobody's boundary;
- a PR roast reviews a diff, and its design findings hold up mainly when a written contract exists (audit finding A4-F18).

The research rejected a separate super-auto "interface model" phase (option D-a). Placed after the design roast, nothing would review it, and it broke super-auto's phase set. This design puts the step inside super-design, before decomposition, so the design roast reviews it and the phase set is unchanged.

## Design

### 1. Where it runs

- **Every level.** super-design runs the step on the root spec, after the root brainstorm, and on each promoted subepic's spec, after its nested brainstorm. Each runs before that level's decomposition.
- **New process step.** It becomes step 2 of super-design's §The Process ("Key abstractions"). The later steps are renumbered, and the step-number cross-references inside `skills/super-design/SKILL.md` are updated: §Gates by Mode, §Re-entry, §Nested Brainstorms, §Coverage and §Run-State File.
- **Dispatch.** A fresh-context designer, model opus, read-only. Its inputs:
  - this level's spec;
  - the distillate (§3);
  - read access to the repository;
  - every `## Key abstractions` section already committed anywhere in the tree, in tree order (root first, then depth-first by `sp_order`), with this level's ancestors marked as the frame it builds within.
- **Output.** The section, plus one digest line per abstraction it adds (§2).
- **Applying.** super-design inserts the section before `## Post-Implementation Notes` and commits the spec.
  - Interactive (Mode A): the human sees the section before the commit and may edit it. This is part of the design dialog, like the top-split question.
  - Unattended (one-shot or `autonomous`): applied without asking. It joins §Unattended Runs' list of asks answered by default. The design roast reviews it with the rest of the spec. No new stop.
- **Precedence.** The spec's explicit decisions win, and the section fills gaps only. Where an explicit decision forces something that looks like a misstep, such as a deliberate per-caller branch, the section says so in one line and cites the spec section. The code roast then reads it as intended rather than as leakage.
- **Re-entry.** A committed spec that already has the section is adopted, not re-dispatched, and the sync runs (§4). A committed spec without the section, as after a crash between the brainstorm's commit and this step, runs the step before decomposition. A nested level's `sp:needs-design` label is cleared only after its section is applied and the sync has run. One new row in §Re-entry.
- **Cost.** One opus dispatch per spec.

### 2. The designer's brief

`skills/super-design/key-abstractions-prompt.md` is a dispatch template, like the promotion reviewer's. Its input placeholders are fixed here, so the template and the SKILL.md dispatch that fills it agree:

- `[SPEC_FILE_PATH — read it]`: this level's spec;
- `[DISTILLATE_PATH — read it]`: the distillate;
- `[REPO_ROOT]`: the repository to read;
- `[KEY_ABSTRACTIONS_SO_FAR]`: every section already committed in the tree, in tree order, with this level's ancestors marked as the frame; at the root, `none — this is the root spec`.

The designer answers these questions briefly and skips what doesn't apply:

1. **Abstractions.** Which new abstractions does this design need, and which existing ones should it extend? Read the code first. Callers that branch on a kind, type or name signal a missing abstraction. Reuse or extend the abstractions handed in; never redefine one, whichever branch of the tree defined it.
2. **Responsibilities.** For each one: what it owns, the decision it hides, and what it must not do.
3. **Relationships.** Composition, delegation, a shared interface, or inheritance, which is only for true substitution: a subtype that can stand in anywhere its parent is used. Which way do dependencies point?
4. **Variation.** What varies, now or in the spec's plans?
   - New kinds keep coming: an interface with one implementation per kind, chosen in one place. Name that place.
   - Fixed kinds with growing operations: a closed enum with `match`.
5. **Lifecycle and ownership.** Who creates and owns each object? How long does it live (process, session, request)? Is it shared across threads? What releases its resources?
6. **State.** Which objects hold mutable state? Is any of it global?
7. **Errors.** What failures cross each boundary, and which ones must callers tell apart?
8. **Walk-throughs.** Walk the main use case through the abstractions. Then walk one likely future change. It should touch one new type and one registration, not every caller. If it touches many callers, revise.
9. **Restraint.** Every pattern or layer names the variation it absorbs: a second implementation that exists now, one the spec commits to, or duplication already in the code. No pass-through layers, and no single-implementation interface unless the spec names the next implementation.

Rules:

- **The spec wins.** Its explicit decisions stand. The designer fills gaps and notes any forced misstep with a citation (§1).
- **No method signatures.** Those belong to seam contracts and the task briefs.
- **The target language's own constructs:** traits, interfaces, enums, modules, closures.
- **Proportional.** A change that needs nothing new gets one line: `No new abstractions; extends <types>.`
- **Read-only.** The designer returns the section and the digest lines as text and edits no files.

The section's shape, shown with generic names:

```
## Key abstractions

**IntegrationAdapter** — new interface, one implementation per integration
- Owns: everything that differs per integration (install check, event decoding, health probe).
- Hides: which integration is in use.
- Must not: decide session state; the daemon owns that.
- Relationships: the registry holds one adapter per integration; commands ask the registry.
- Lifecycle: registered at startup, lives for the process, shared read-only across threads.
- Errors: its own error type; callers can tell "not installed" from "version unsupported".

Variation: new integrations keep coming → one adapter each, chosen only in the registry.
Walk-through: adding a fourth integration touches one new adapter module and one registry line.

Digest:
- IntegrationAdapter: owns all per-integration behavior; new per-integration behavior is added
  here as a method; callers never branch on the integration name.
```

### 3. The distillate

`skills/super-design/design-distillate.md` is about one page in our own words. Only the designer is given it.

- **Start from what varies.** The Gang of Four authors' own caveat: a pattern buys flexibility at the cost of indirection, so apply one only when that flexibility is needed. First ask "what should be able to vary?"
- **Two principles.** Program to an interface, not an implementation. Prefer composition to inheritance, keeping inheritance for true substitution.
- **Problem → pattern table:**

  | Problem | Pattern |
  |---|---|
  | Behavior varies by kind, and new kinds keep coming | an interface per kind, chosen in one registry or factory |
  | An outside tool or API with its own shape | Adapter |
  | A complex subsystem used through a few operations | Facade |
  | Behavior added around an object without changing it | Decorator |
  | An action to queue, log or undo | Command, often just a closure |
  | Behavior driven by a state machine | State, or typestate in Rust |
  | Trees of parts handled uniformly | Composite |
  | Many listeners to an event | Observer, only when the listeners are genuinely open-ended, with the update order documented |

- **Language notes:**
  - a closure instead of a Strategy or Command class;
  - an enum with `match` instead of Visitor when the set of kinds is fixed;
  - small consumer-defined interfaces in Go;
  - protocols in Python;
  - check the target language's version.
- **When not to:**
  - an interface with one implementation, unless the spec names the next one;
  - layers that only pass calls through;
  - deep hierarchies without real substitution;
  - deduplication that adds mode flags;
  - pattern names as a quality signal.
- **Both failure modes.** Agent code without guidance tends to miss abstractions and blur responsibilities. Heavy guidance adds classes and coupling. Questions 8 and 9 balance the two.
- **Name what you use.** A responsibility comment names the pattern or role its type plays. In controlled maintenance experiments, documenting pattern use was one of the more consistent positive results.
- **Sources:** links to dossiers [D2](../../research/2026-10-07-oop-design/dossiers/D2-hierarchies-polymorphism.md), [D3](../../research/2026-10-07-oop-design/dossiers/D3-design-patterns.md) and [D9](../../research/2026-10-07-oop-design/dossiers/D9-design-guidance-llm.md).

### 4. Downstream wiring

- **Decomposition: one owner bead per new abstraction.** This is the bead that creates the abstraction in code.
  - It builds the type (trait, interface or class), the place where kinds are chosen if there is one (a registry or factory), and the responsibility comment.
  - Its description says `owns: <Abstraction>` and carries the section's full entry, kept current by the sync (below).
  - Its acceptance includes the comment on the type: what it owns, what it doesn't, where new behavior goes, and the pattern or role it plays.
  - By the bottleneck rule it stays small and lands first, which is the shape of a `Seam contract:` bead. When several beads need it before it exists, the existing seam-contract machinery applies.
  - Beads that use the abstraction say `consumes: <Abstraction>`. In the generic example, each integration's adapter is its own parallel bead, and one more bead moves the existing callers behind the registry.
  - Owning doesn't lock the type. A bead that needs new per-kind behavior adds a method to the interface, which is where the comment says new behavior goes.
  - An existing abstraction that the design only extends has no owner bead. Whichever bead changes its responsibilities updates its comment.
- **Single source, one sync.** Each spec's `## Key abstractions` section, with its `Digest:` block, is the only source. Every other copy is regenerated from the committed sections, never appended to. One sync rule runs whenever any section is applied or changed: this step's apply, an interactive edit, a design-roast fix or step-back redesign that touches a section, and re-entry. It rewrites:
  - **The digest:** the `Digest:` lines of every committed spec in tree order, replacing the digest block under `## Global Constraints` in the root epic's description. The block is created when absent, whether decomposition just created the epic or the run adopted a handed-in one, and merged under an existing `## Global Constraints` heading rather than adding a second one. At the root the step runs before the epic exists, so the first sync runs when §Decomposition creates the epic. `bd update --description` replaces the description wholesale, so read the epic first and re-send its full text.
  - **Owner beads:** the entry text of each owner bead whose abstraction changed. An owner bead whose abstraction is gone is restructured like any other task under the roast loop's existing rule.
  - super-code's planner already copies an epic's Global Constraints verbatim into every task brief (`skills/super-code/planner-prompt.md:93`). The task reviewer checks the brief against them. super-code doesn't change.
  - **No-beads plans:** in no-beads mode, each plan's `## Global Constraints` (writing-plans) carries the same tree-wide set: one line in §No-Beads Mode.
- **Promotion review.** One criterion is added to the decomposition verdict in `skills/super-design/promotion-reviewer-prompt.md`: every abstraction this spec's section adds (each one has a digest line) is created by exactly one child whose `owns:` line names it. Abstractions the section only extends need no owner child. An `ISSUES` verdict is fixed inline, as today. The reviewer already reads the whole spec, so this adds no pass.
- **Nested brainstorms.** They already receive the parent spec and earlier siblings' specs. One line in §Nested Brainstorms makes the ancestors' Key abstractions the frame the nested design builds within. An explicit decision that goes against one wins at that level, and that level's section notes it.
- **Code roast.**
  - super-auto's phase 4 passes the run's spec paths, root and nested, to the PR roast as the change's stated intent, as a pointer only.
  - super-roast gains an optional PR-mode input, `stated intent`, which it appends to `scripts/assemble-args`' `--artifact` text. Scouts and judges already read that text (`skills/super-roast/scripts/assemble-args.mjs:182`, `:240`). `--artifact` already exists, so only super-roast's `SKILL.md` changes: no script, and not the engine file `super-roast-workflow.md`.
  - Judges in PR mode already weigh stated intent (`skills/super-roast/judge-seat-prompts.md:146-148`). `simplicity-design` items 5 and 7 already look for logic living outside its concept's abstraction and for one decision baked into several modules.
  - This is TODO item 2 (probe R-c0).
- **Unchanged:** super-code's prompts, the roast lanes and super-auto's phase set. No new review pass, gate or stop.

### 5. Records, eval and tests

- **`TODO-OOP-RECOMMENDATIONS.md`:**
  - a new item for this step, linking this spec;
  - option D-a marked "revisited" in the options table. Its objections came from a separate super-auto phase placed after the design roast, and this step runs inside super-design before decomposition;
  - item 2 marked done, with its evaluation (E3) still open;
  - the two stale "in progress" rows under "Related" (implementer rebase, hot-file split) corrected to shipped in 6.4.2-alepar4.20.
- **Eval.** super-auto's phase 6 runs it as an orchestrator step, because a leaf's implementer cannot dispatch model runs. One leaf builds the fixtures.
  - **Fixtures**, in `tests/super-design/key-abstractions-eval/`: one tiny synthetic CLI with two integrations whose callers branch on the integration name, and three specs:
    - (a) add a third integration; its brainstorm input states one explicit design decision as fixed, which the designer must respect;
    - (b) add a flag to one command;
    - (c) a nested subepic spec that is handed a pre-written root section.
  - **Rubric**, written before any run:
    - (a) names the missing abstraction, what varies and the single place kinds are chosen, and doesn't contradict the planted decision;
    - (b) answers "no new abstractions" and invents nothing;
    - (c) extends the given abstraction without redefining it;
    - all three give no method signatures.
  - **Arms.** "Before" is a fresh one-shot (Mode B) brainstorm spec for the fixture in each rep, which is what decomposition reads today. "After" runs the designer on that same spec. The rubric is applied to both arms. Three reps each; (c) runs after-only. 15 runs in all.
  - **Isolation.** Each run's `[REPO_ROOT]` is a scratch copy of the fixture CLI alone, without the rubric, the specs' expected answers or the run docs.
  - **The planted decision must survive.** If a "before" spec for (a) drops it, that brainstorm rep is re-run, so both arms share a spec that carries it.
  - **Pass rule.** The after arm passes a case when at least 2 of its 3 reps pass the rubric. On a failed case, the orchestrator files one fix bead against the template or distillate and re-runs that case once, then reports what still fails.
  - **Grading.** By hand against the rubric, recording each run's token cost. Results and token cost go to `docs/superpowers/runs/2026-10-10-key-abstractions-design-step/key-abstractions-eval.md`, summarized in a new `skills/super-design/MAINTENANCE.md` and in the TODO item.
- **Tests.** No scripts change, so the release suites in `AGENTS.md` must stay green. If the super-auto phase-4 wording trips `tests/super-auto/test-contract-lint.sh`, the same bead updates the lint.
- **Not exercised by this run.** The eval grades only what the designer writes. These skill-text rules run only in real super-design runs:
  - the mode flows (Mode A showing the section for edits, unattended runs applying it);
  - re-entry adoption;
  - digest placement in the root epic, and in no-beads plans;
  - the owner-bead and promotion-review rules.

  The design and code roasts review their text, and the next real super-auto runs are the first to exercise them.
- **Release.** Nothing is pushed or tagged from the run. After the merge, the feedback tab cuts the release.

## Decisions made with the human partner

1. Responsibility comments on types, not tests or lints. Mechanical checks were judged too strict: they invite awkward workarounds for false positives.
2. Generic, question-driven prompting with a Gang-of-Four-based distillate, not a narrow "second variant" trigger.
3. The step runs at every level, top-down. Promotion signals that more design remains, and each designer builds out from the abstractions already designed.
4. The spec's explicit decisions take priority. The section fills the remaining gaps.
5. Implementers see an epic-wide digest in every brief, not only the entries their bead declares.
6. The eval stays small: three scenarios, three reps, 15 runs.
7. No new review pass or gate, and super-auto's phase set is unchanged.

## Files touched

- new `skills/super-design/key-abstractions-prompt.md` (§2)
- new `skills/super-design/design-distillate.md` (§3)
- `skills/super-design/SKILL.md`. It is one hot file, so these edits belong in one bead:
  - the process step and renumbering;
  - a new §Key Abstractions section;
  - §Decomposition's owner-bead and digest rules;
  - the §Nested Brainstorms line;
  - the §Re-entry row;
  - the §Unattended Runs entry;
  - the §No-Beads Mode line;
  - §Integration.
- `skills/super-design/promotion-reviewer-prompt.md` (one criterion)
- `skills/super-roast/SKILL.md` (the `stated intent` input, relayed into `--artifact`)
- `skills/super-auto/SKILL.md` (phase 4 row)
- new `skills/super-design/MAINTENANCE.md` (eval results and provenance)
- `TODO-OOP-RECOMMENDATIONS.md`
- new `tests/super-design/key-abstractions-eval/` (the fixture CLI, three specs, the rubric)

## Out of scope

- A replay eval on a real project, such as replaying the motivating case. That is a follow-up.
- A design-roast lens on interfaces and ownership (TODO decision 13.3).
- Planner `Interfaces:` blocks with exact signatures (TODO item 1b).
- Cross-bead seam notes (TODO item 4). This step's owner beads and digest overlap with them; the TODO reconciles the two.
- Mechanical checks of responsibilities in code (declined, decision 1).

## Post-Implementation Notes

> *As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
