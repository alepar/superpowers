---
name: super-design
description: Use when there's a goal or idea to design out, before execution starts.
---

# super-design

Drive a goal or raw idea through brainstorming into a spec, recursively decompose that spec into a fully-designed task tree, then check the finished tree against its goal before execution starts.

**Core principle:** all traversal state is derived from the tracker (or the spec's task tables in no-beads mode), never from session memory — the run survives context compaction and session restart.

## When to Use

Entered at the root with a goal or a raw idea to design out — no spec exists yet; this skill invokes `superpowers:brainstorming` itself to produce the root spec, then drives every iteration from there. Nested invocations are instead handed a freshly-written spec directly by the parent invocation's own nested-brainstorm step (§Nested Brainstorms) — they skip the root brainstorm and start at the Key abstractions step (§Key Abstractions), then decomposition.

Root vs. nested is **derived, not remembered**: nested iff this invocation was handed a spec directly rather than a goal/idea. Only the root invocation runs the coverage loop (§Coverage) and the final hand-off (§Hand-off). Base case for any invocation: no child qualifies for promotion → this subtree is done.

## Inputs (from a caller)

Beyond the goal or spec itself, a caller may pass any of these; each has exactly one effect, named
where it lands:

| Input | Effect |
|---|---|
| artifact-directory override | §Artifact Location — everything this skill produces goes there |
| run-state file path | §Run-State File — record each fact as it becomes true |
| phase token(s) | §Run-State File — written into the run-state file when the named stage begins |
| design mode (A/B) | relayed to every `brainstorming` invocation, root and nested (`autonomous` forces Mode B); with `autonomous`, it sets the design gates — §Gates by Mode |
| autonomous | no stops after launch — §Gates by Mode, §Unattended Runs |
| roast preference (on/off) | §Adversarial Review Loop's offer is pre-decided either way — never re-asked |
| starting roast round | §Hand-off — resume the roast loop from it rather than from 1 |
| redesign records (`findingsLedgerDesign`, `redesignCycles-design`, `redesign-design-<K>` lines) | §Re-entry — adopt them; the counter is never reset |
| hand-off ownership | §Hand-off's caller-owned branch |

## Gates by Mode

This is the one statement of the design gates; other sections point here.

| Run | Top-split gate (§The Process step 6) | Once the design is ready |
|---|---|---|
| Interactive: Mode A, not `autonomous` | **asks**: the human approves the child list and its `LEAF`/`PROMOTE` verdicts | hand-off (§Hand-off) |
| One-shot: Mode B, not `autonomous` | **applied**: the recommended child list and verdicts are taken as they stand | **stop** for the human's design review, then hand-off |
| `autonomous` (implies Mode B for every brainstorm, root and nested) | **applied**, as above | hand-off, no stop |

An applied top split is recorded like an approval, marked `auto` (§Run-State File), and named
in the next summary. §Parallelism Pass splits the same way: interactive asks, one-shot and
`autonomous` apply its safe changes and park the rest. The design is ready when the coverage
loop and the roast loop have both exited and the parallelism pass has run. At the one-shot stop, present the settled tree, the roast loop's exit summary, and
everything parked; hand-off waits for the human's go-ahead. When a caller owns the hand-off,
report the settled tree and return; the caller owns the stop (`super-auto`: end of phase 2,
before code).

## Unattended Runs

A run told `autonomous` has no one watching, and neither does a one-shot run before its
design-ready stop (§Gates by Mode); both are **unattended** below. A message with no tool call
ends your turn, and in an unattended run the work stops there. So none of these end a turn while
work is owed: a summary that closes by announcing the next step; the return of a skill you
invoked (`brainstorming`, `super-roast`, a nested `super-design`), which is your cue to take the
next step; a finished milestone (a subtree designed, a coverage round summarized, a roast round read); an offer to carry
on unless told otherwise; a list of decisions none of which blocks the rest. Put status notes and
recommendations in the same message as your next tool call. All state lives in the tracker and the
run-state file, so context compaction loses nothing.

The only stops, a closed list:

1. a handed-in root this run cannot legitimately close — a launch check, made before any design
   work (§The run's root epic);
2. a one-shot run's design-ready stop (§Gates by Mode), which ends the unattended stretch.

Every other ask in this skill is answered by its documented unattended default, **recorded** in
the run-state file (a parked escalation, beyond-cap item, qualifier, step-back redesign, or graph
change; with
no run-state file, in the round summaries), and surfaced in the final summary — never waited on:
the top split (§Gates by Mode), the Key abstractions section (§Key Abstractions: applied as the designer returned it), coverage's `ORPHAN` escalation (§Coverage), the tripwire
(§Tripwire), the recall-floor read-through (§Coverage), roast escalations, beyond-cap items,
verdict qualifiers, step-back redesigns, loop exits and Capped Blocking (§Adversarial Review
Loop), and the parallelism pass's unsafe changes (§Parallelism Pass). A protected resource you cannot reach, or a risky or destructive action that would need
confirmation, is not taken: skip that work, record it, and surface it. Large fix work runs as a
Mode B nested brainstorm. The run then proceeds to §Hand-off — to the caller when one owns it,
otherwise to execution, with everything still open restated in the final summary. That is
completion, not a stop.

## The Process

1. **Produce the spec** (root only) — invoke `superpowers:brainstorming` on the goal or idea to produce the root spec — §Root Brainstorm. On a re-entry, adopt a spec that already exists — §Re-entry. Nested invocations skip this: they already hold the spec their parent's nested-brainstorm step wrote.
2. **Key abstractions** (every invocation, root and nested) — dispatch a fresh designer on this level's committed spec, apply the `## Key abstractions` section it returns, and run the sync — §Key Abstractions. On a re-entry, adopt a section that already exists — §Re-entry.
3. **Decompose** the spec into rough child tasks (title, short description, files-touched hint, blocking deps) — §Decomposition.
4. **Promotion review** — dispatch a fresh-context reviewer, sanity-check its verdicts, fix any decomposition-verdict `ISSUES` — §Promotion Review.
5. **Apply promotions** — §Applying Promotions.
6. **Top-split gate** (root only) — before any descent, the top-level split (child list + promotion verdicts) is decided at one gate, at the most expensive level: asked or applied per §Gates by Mode, and replayed when the run-state file records a matching decision (§Run-State File).
7. For each promoted child, **in dependency order, depth-first** (a child's entire subtree completes before the next sibling starts, so later siblings can read earlier siblings' finished specs): check the tripwire (§Tripwire), then run its nested brainstorm — §Nested Brainstorms — then invoke `superpowers:super-design` on the spec it wrote; that is the recursion.
8. **Root only**, once the tree has settled (every subepic designed, every leaf decomposed, no pending promotions): run the coverage loop — §Coverage.
9. **Root only, optional:** offer `superpowers:super-roast` on the settled tree; on a confirmed-findings verdict, run the fix + auto-re-roast loop — §Adversarial Review Loop.
10. **Root only:** the parallelism pass — measure the settled graph and remove the edges that
    needlessly lengthen its longest chain — §Parallelism Pass.
11. **Root only:** hand off to execution — §Hand-off. A standalone root invocation (when this invocation does not have a caller that owns the hand-off) then invokes `superpowers:upstream-feedback`; throughout the run, append friction events to `<artifact-directory>/friction.md` (or the enclosing run's log when nested) per that skill's format, the moment they happen.

## Re-entry (this skill can be invoked twice on the same goal)

A caller whose session ended mid-run re-invokes this skill on the same goal. **Every step below
adopts what already exists rather than producing a second one.** Root vs. nested is derived, and so
is done-vs-not: check for the artifact a step would produce before producing it.

| Step | Adopt instead of re-producing |
|---|---|
| §Root Brainstorm | a committed root spec already in the artifact directory (or named by the run-state file's spec pointer) — read it and go to §Key Abstractions, then §Decomposition |
| §Key Abstractions | a committed spec that already has a `## Key abstractions` section — adopt it without re-dispatching the designer, and run the sync (§Decomposition); a committed spec without one (a crash between the brainstorm's commit and this step) runs the step before §Decomposition. A nested level's `sp:needs-design` is cleared only after its section is applied and the sync has run |
| §Decomposition, root | an epic already labelled `sp:<its-own-id>` for this goal (or named by the run-state file's epic pointer) — adopt it; **never `bd create` a second root epic** |
| §Decomposition, children | children already under that epic — decompose only what has none |
| §Promotion Review | verdicts already applied (`-t epic` + `sp:needs-design`, or `sp:demoted-by-session`) — re-review only undecided children |
| §The Process step 6 / §Coverage | a recorded top-split decision, and the coverage rounds already spent — see §Run-State File |
| §Coverage, root integration sweep | an existing `Integration sweep:` bead for this root — adopt it; **never create a second** (two sweeps each fanning in on every leaf split the join) |
| §Parallelism Pass | a recorded `graph-pass:` line (§Run-State File) — the pass has run; parked changes stay parked |
| §Adversarial Review Loop, ledger and amend files | `findings-ledger-design.md`, `findings-overrides-design.md` and any `amend-design-<K>.md` in the artifact directory — adopt them (rebuild the ledger from the reports and overrides rather than starting one), and never reset `redesignCycles-design`; an amend file is acted on only after `amend-check` passes it, on resume too |
| §Adversarial Review Loop, an interrupted redesign cycle | the `redesign-design-<K>` record's `state` (run-state file, or the round summaries when standalone) — see below |

**Resuming a redesign cycle** dispatches only from its record's `state`, never from what looks half-done:

- A round with a `redesign-design-<K>` record (not `aborted — …`) resumes only through that record: the fix list's items 1–2 are not re-run for it, and its findings are not re-filed as per-finding tasks. A `stepBackDesign-round-<N>: redesign — applied: …` line with no record replays in place (the recorded redesign is applied from that line if its spec change is not yet committed) only when the run-state file (standalone, the round summaries) holds no `redesign-design-<K>` record anywhere, meaning the run predates the records. Otherwise the line is not replayed as a patch: re-run the round's Step 1 from item 5 on its saved step-back file (re-check, never re-dispatch).
- `started`: with an amend file and a spec diff present, re-run `amend-check` on them; exit 0 continues from §Amend Mode's commit step; exit 3 restores the spec files to HEAD (`git checkout HEAD -- <spec paths>`) and re-runs §Amend Mode from its first step; exit 2 is a bad invocation or a git failure: fix it and re-run `amend-check`, never restoring. With no amend file, restore and re-run from the first step.
- `amend-checked`: re-run `amend-check` before committing anything; exit 0 → commit, exit 3 → restore the specs and rewrite the state to `aborted — amend rejected on resume`, exit 2 → fix and re-run, no restore.
- `specs-committed`: file the amend record's `work:` items missing from the beads labelled `sp:redesign-design-<K>`.
- `beads-filed`: write any missing dispute lines, run the coverage-amend round unless its approvals line exists, rewrite the state to `applied`, then run the post-amendment design roast (§Adversarial Review Loop, Redesign cycle).
- `applied`, `aborted — …`, `thrash — …`: nothing to replay; the loop continues from its other records.

**A partially-written artifact is not an adoptable one.** Adopt a spec only if it is committed, and
an epic only if it carries its own `sp:` label — the label flip and the commit are the "done"
markers §Durable State already relies on. Anything half-made gets finished, not adopted.

## Root Brainstorm

Root only. Invoke `superpowers:brainstorming` on the goal or raw idea handed to this invocation — no parent spec, no ancestor-goal chain, no sibling specs to hand in, since none exist yet. Brainstorming runs its full process (worktree, mode selection, questions or one-shot reasoning, design doc, self-review) and returns with a written, committed spec. It does **not** offer adversarial review to a caller-invoked run — that offer is this skill's, once, on the settled tree (§Adversarial Review Loop), so a run has exactly one design-mode roast. Take that spec forward into §Key Abstractions, then §Decomposition.

## The run's root epic

**One epic is the root, and there is exactly one way to get it:** a bead handed in as the starting
point *is* the root — adopt it; or, when nothing was handed in, create it (§Decomposition's root
step, labelled `sp:<its-own-id>`). Either way **decompose into it and never insert a layer beneath
it.** Its direct children are the top split, they carry `--parent <root>` with the flag triple, and
`epic:` in the run-state file is that bead — the same id execution drains and completion is measured
on.

**Do not create an "implementation" epic under it.** A root written as *consider / investigate /
evaluate*, or carrying a note that it does not by itself authorize implementation, is describing the
approval that produced this run — not asking for a sub-epic to hold the work. Inserting one is quiet
and expensive: the tree builds correctly, execution runs correctly, and completion is then measured
on the inserted layer while the real root stays open forever. The tell is a top split whose ids are
two levels down (`<root>.2.1`, `<root>.2.2`) instead of one (`<root>.1`, `<root>.2`).

The rule has one checkable form: **the root must be an epic this run can legitimately close.**
Check a handed-in root at launch, before any design work. If it genuinely is not closable — it
holds unrelated work, or is a standing tracker meant to outlive this run — that is a scoping
problem to raise with the user before starting, not something to route around by rooting lower
on your own.

## Key Abstractions

Every invocation, root and nested, runs this step on its own spec once the spec is committed,
before §Decomposition: at the root after §Root Brainstorm, nested after the parent's nested
brainstorm (§Nested Brainstorms). Agent-written code tends to miss abstractions and blur
responsibilities; this step names them while the design is still text, so decomposition can
give each one an owner.

**Dispatch** `./key-abstractions-prompt.md` (fresh context, model opus, read-only), filling its
placeholders:

- `[SPEC_FILE_PATH — read it]`: this level's spec;
- `[DISTILLATE_PATH — read it]`: `./design-distillate.md` (absolute path);
- `[REPO_ROOT]`: the repository the spec changes;
- `[KEY_ABSTRACTIONS_SO_FAR]`: every `## Key abstractions` section already committed anywhere
  in the tree, in tree order (root first, then depth-first by `sp_order`), each headed by its
  spec's path, with this level's ancestors marked as the frame it builds within; at the root,
  `none — this is the root spec`.

It returns the section as text: one entry per new or extended abstraction, then a `Digest:`
block with one line per abstraction it adds. A change that needs nothing new comes back as
`No new abstractions; extends <types>.` with no `Digest:` block.

**Apply.** Insert the section into the spec immediately before `## Post-Implementation Notes`
(at the end, when the spec has no such heading) and commit the spec. Then run the sync
(§Decomposition, "Key abstractions sync"); at the root the epic does not exist yet, so the
first sync runs when §Decomposition creates it.

- Interactive (Mode A): show the section to the human before the commit; they may edit it.
  It is part of the design dialog, like the top-split question. The committed section is the
  one they settle on.
- Unattended (§Unattended Runs): apply it as returned, without asking. The design roast
  reviews it with the rest of the spec; there is no new stop.

**Precedence.** The spec's explicit decisions win; the section fills gaps only. Where an
explicit decision forces something that looks like a misstep, such as a deliberate per-caller
branch, the section says so in one line and cites the spec section, and the code roast then
reads it as intended rather than as leakage. A returned section that contradicts an explicit
decision is corrected to the decision before the commit (interactive: point it out to the
human).

**Cost.** One opus dispatch per spec.

## Decomposition

Same fields as brainstorming's old beads step: title, short description, files-touched hint, blocking deps per child.

Every leaf's acceptance criteria are a checkable list, one `- [ ]` item per criterion;
super-code's planner carries the list verbatim into the task, and each item is what the task
reviewer checks.

**A deletion bead's acceptance must sweep the whole repo, not just imports.** "grep shows zero
importers" passes while the deleted path still appears in build/lock/digest/manifest artifacts —
a codegen manifest, a lockfile, a checksum or approved-source list (measured live: a deleted
module was a hashed identity input in one manifest and four digest lists, and no bead in the tree
named the manifest at all). State the acceptance as: search the repo for the path AND its
basename, source and non-source artifacts alike; every manifest-class hit must be owned by a
named bead.

**An acceptance criterion that depends on another bead's deliverable cites that bead by id.**
Write it as `… (needs: <bead-id>)` — "the contract validator accepts the output (needs:
proj-42)". The citation makes the criterion checkable by graph rather than by reading:
coverage's precheck script resolves every cited id against the blocking edges and flags a cited
bead that is a transitive *dependent* (unsatisfiable at completion time) or that no edge
connects (unwired). Prose review is the net for uncited references only, because prose reads
reliably miss this class.

**A spec that enumerates runtime configurations gets a bead that exercises each one, early.**
Modes, player counts, platforms, feature-flag combinations, a test matrix: if the spec lists
them, some leaf — titled **`Configuration smoke: <the enumerated configurations>`** — must *run*
each (one decision, one request, one invocation per configuration, its description stating the
command or entry point for each), and that leaf must not be only the terminal readiness gate:
release-only defects in unexercised modes otherwise survive every per-bead gate. When one
existing bead can absorb the exercise without becoming a bottleneck, extend it instead.

**Decompose in two explicit steps.** **Step A — split:** carve the spec into minimal
logically-cohesive chunks per the sizing bar below, ignoring narrative/build order while splitting.
**Step B — connect, as a first approximation:** add blocking deps per the edge rules further
down, sparse by the standing "when in doubt, leave it out" policy. Every `bd dep add` you run
here is paired with a `blocked-by <blocker-id>: consumes <artifact>` line in the dependent's
description (below, "Every blocking edge is paired with a reason line"). When connecting reveals a bead
that gates two or more others, re-apply the bottleneck rule to it before moving on — dependent
counts only exist once edges do. The deps you write are a
first approximation by design — the promotion review runs next, coverage's seam check
(`UNOWNED-SEAM`) and the parallelism pass refine edges after the tree settles — so do not
agonize over edges; a dedicated audit owns edge quality. Missed work is recoverable — coverage's
`GAP` exists for it. Fused work is what nothing downstream un-fuses: the promotion review's `SPLIT`
catches only the bottleneck case, so Step A's job is to not fuse work that could run apart.

**The sizing bar (Step A):**

- **Cohesion:** a leaf is one merge-worthy deliverable a reviewer accepts or rejects as a
  unit. A description that needs "and then" is two beads.
- **One feature, one subsystem:** a leaf delivers one feature in one subsystem. Tightly coupled
  files (heavy mutual calls or imports) stay in one leaf; splitting them only moves the coupling
  into a seam two implementers must agree on. Siblings that share an interface name it as a
  contract through the owns:/consumes: lines below, or a `Seam contract:` bead when the interface
  must exist first.
- **Executable by one implementer:** super-code's implementer works alone and spawns no
  subagents, so work that needs fresh agents — behavioral probes, skill evals, scenario runs
  against a model — is not a leaf. Route it to the orchestrator's own phase (`super-auto`'s
  report phase, or a step the caller runs after execution) and leave the leaf the code it tests.
  A spike leaf whose answer needs a privileged or live run (a live harness capture, credentials)
  declares in its description a read-only fallback it runs when that access is refused, or is
  gated off the critical chain (`super-auto` §Gates, final-SHA evidence and base drift), so no
  other bead waits on access the run may never get.
- **Floor:** execution spends roughly five dispatches of ceremony per bead (brief → implement →
  review → merge, plus ledger writes), so never split below one coherent
  reviewable change — a bead whose implementation is smaller than its own ceremony merges into a
  sibling. Minimal is not tiny.
- **Bottleneck rule (fan-out-aware):** size a bead inversely to how many others depend on it. A
  bead that gates others lands **only the unblocking artifact** — polish, tests beyond the
  artifact's own acceptance, and remaining call-site migration move into dependents or a
  non-gating sibling that depends on it. Seam-contract beads are the exemplar: compilable
  stubs, inert-by-default. Width is parallelism — every line moved off a bottleneck bead moves
  work off the critical path.

**Every child's description names the boundaries it owns and the boundaries it consumes** —
e.g. "owns: `TrainingConfig` schema field; consumes: regime entry-point signature". A boundary
is any data or interface this child exchanges with a sibling: a config value one child defines
and another reads, a function one exposes and another calls, a file format one writes and
another parses. This is not a fifth field — it lives inside the short description — and it is
load-bearing: the recurring seam-bug class (a config parameter implemented in the schema child
and honored in the regime child, with the wiring between them owned by neither, shipping inert)
is an *ownership ambiguity* created here, at decomposition. The coverage loop's `UNOWNED-SEAM`
check (§Coverage) reads these declarations; a child description with no owns/consumes line for
a boundary it plainly touches is what that check exists to catch. **The literal tokens `owns:`
and `consumes:` are required** — the coverage reviewers match them literally, and a prose
paraphrase ("this child is responsible for…") reads as unowned and produces a false-positive
`UNOWNED-SEAM`. The mandate is scoped, not unconditional: a child that exchanges nothing with
any sibling omits the declaration entirely — there is no `owns: none` filler to write.

**Each abstraction the spec's `## Key abstractions` section adds gets one owner bead** — the
bead that creates it in code. Until this level's children exist, this rule is the only creator
of owner beads, and it adopts a bead that already says `owns: <Abstraction>` rather than
creating a second. It builds the type (trait, interface or class), the place where
kinds are chosen if there is one (a registry or factory), and the type's responsibility
comment. Its description says `owns: <Abstraction>` and carries the section's full entry for
it, kept current by the sync below. Its acceptance includes the comment on the type: what it
owns, what it doesn't, where new behavior goes, and the pattern or role it plays. By the
bottleneck rule it stays small and lands first, which is the shape of a `Seam contract:` bead;
when several beads need it before it exists, the seam-contract machinery applies (§Coverage).
Beads that use the abstraction say `consumes: <Abstraction>`. Owning doesn't lock the type: a
bead that needs new per-kind behavior adds a method to the interface, which is where the
comment says new behavior goes. An existing abstraction the section only extends has no owner
bead; whichever bead changes its responsibilities updates its comment.

**Key abstractions sync.** Each spec's `## Key abstractions` section, with its `Digest:` block,
is the only source; every other copy is regenerated from the committed sections, replacing
what is there, never appended to. Run the sync whenever any section is applied or changed:
§Key Abstractions' apply, a human's interactive edit, a design-roast fix or step-back redesign
that touches a section (§Adversarial Review Loop), a redesign `super-auto`'s phase-5 code fix
loop applies to a section (before it files that round's fix beads), an amend (§Amend Mode) that
touches a `## Key abstractions` section, and re-entry (§Re-entry).
It rewrites:

- **The digest.** Collect the `Digest:` lines of every committed spec in tree order (root
  first, then depth-first by `sp_order`; a section with no `Digest:` block contributes none).
  In the root epic's description they sit under `## Global Constraints`, between two marker
  lines:

  ```
  <!-- key-abstractions digest: begin -->
  - <Abstraction>: <its digest line>
  <!-- key-abstractions digest: end -->
  ```

  Replace only what lies between the markers and leave the rest of `## Global Constraints`
  untouched. When the block is absent, whether decomposition just created the epic or the run
  adopted a handed-in one, create it: under the existing `## Global Constraints` heading when
  there is one, never a second heading, else under a new one. `bd update --description`
  replaces the description wholesale: `bd show` the epic first and re-send its full text with
  only the block changed.
- **Owner beads.** Rewrite the entry text of each owner bead whose abstraction changed,
  through the same wholesale `bd update --description` rule. The sync creates owner beads only
  once the children of the level whose section adds the abstraction exist; before that (a
  nested level's first sync, or the root's at epic creation) it creates none, and
  §Decomposition's owner-bead rule above is the only creator. After that, an abstraction in
  the digest that no bead owns, as after one is added or renamed, gets an owner on the spot:
  an `owns:` line plus the comment acceptance on an existing bead that already builds it, or
  a new owner bead made like an §Adversarial Review Loop step-1 fix task — §Decomposition's
  flag triple (`--parent <that level's epic> --no-inherit-labels -l sp:<root-epic-id>`) and,
  before hand-off, when an `Integration sweep:` bead already exists for this root,
  `bd dep add <sweep> <owner>` paired with
  `blocked-by <owner-id>: consumes all leaves (integration sweep)` in the sweep's
  description. On a rename, re-key the beads'
  `consumes:` lines to the new name. An owner bead whose abstraction is gone is restructured
  like any other task under the roast loop's existing rule.
- **No-beads plans** carry the same tree-wide set (§No-Beads Mode).

super-code's planner already copies the epic's Global Constraints verbatim into every task
brief, and its task reviewer checks the brief against them, so the digest reaches every
implementer without a super-code change.

**The tree stops at merge-ready.** Decompose only work that is finished when the code is written,
reviewed, and merged. Operational follow-on — activating something in production, running a live
campaign, monitoring a rollout, operating a system through a target — is **not** part of this tree,
even when the goal implies it: an execution run ends at the merge, so a tree containing such tasks
can never drain, and its epic can never close. When the goal reaches past the merge, say so in the
spec's own follow-on section and leave those tasks out of the tree, or file them as a sibling epic
this run does not own.

**Blocking deps encode genuine blocking, not narrative order.** Add an edge only when the dependent
task literally cannot start until the other finishes — its interface, schema, or file must exist
first. Do not encode the order you happened to describe things in: a decomposer narrating a build
order writes a linear chain by reflex, and a chain of N tasks is N sequential execution rounds no
matter how disjoint their files are. Execution dispatches every ready task at once, so each
unnecessary edge is a round of parallelism deleted at design time, invisibly — `super-code` cannot
tell a decorative edge from a real one. When in doubt, leave it out: execution's serial merge gate
and post-rebase test run catch a genuine conflict at the cost of one rework cycle, while a
decorative edge costs a full round on every run.

Five edge rules, each the generalization of a measured live failure (the parallelism pass
audits them — §Parallelism Pass):

- **Name the consumed artifact or drop the edge.** Every edge is justified by a specific artifact
  — an interface, schema, file, or recorded decision — that the dependent consumes and the blocker
  lands. "Depends on that area being done" is narrative. If you cannot name the artifact AND the
  bead that produces it, there is no edge.
- **Point the edge at the artifact's earliest producer** — never at the other sub-epic's most
  prominent bead. A cross-sub-epic edge aimed at the headline bead when the needed artifact lands
  three beads earlier gates everything behind work the dependent never consumes.
- **One sibling owns each cross-sub-epic integration** (the same ownership principle as seam
  contracts). If a sibling already carries the edge into that sub-epic and owns integrating with
  it, a second edge from another sibling is usually duplicated scaffolding — consume the owning
  sibling's artifact instead.
- **An edge you justify with a question instead of an artifact is a seam, not a dependency.**
  Chaining two tasks because nobody has decided which of them owns a piece of data does not answer
  the question — it hands the decision, implicitly, to whichever implementer runs first. Decide it
  in the spec, or extract it as a seam contract (§Coverage's `UNOWNED-SEAM` machinery) and let
  both tasks run in parallel against the decided boundary.
- **Prefer leaf-level edges over epic-level edges.** An epic→epic edge claims every leaf under
  the dependent needs ALL of the blocking epic — and it is invisible to `bd ready` readers of the
  leaf graph, so nothing downstream re-audits it (measured live: one such edge idled a leaf whose
  own deps were satisfied for 11.4 days, in an epic holding two leaves with no deps at all).
  Write the specific leaf→leaf edges the artifacts justify; reserve an epic-level edge for the
  rare case where every leaf genuinely consumes the whole predecessor epic, and say why in the
  dependent epic's description.

**Every blocking edge is paired with a reason line in the dependent's description.** Whenever you
`bd dep add <dependent> <blocker>` — here, in a split re-point, in a coverage repoint or wiring, or
in a sweep — write (or amend, via the existing wholesale `bd update --description` rule)
`blocked-by <blocker-id>: consumes <artifact>` into the **dependent's** description, naming the
same artifact the edge rules above required you to name to justify the edge in the first place.
Remove or re-point the edge and the line goes with it — the same wholesale-description-replace
step that adds the line also updates or deletes it. Four worked examples, one per edge kind:

| Edge kind | `bd dep add` | Dependent's description gains |
|---|---|---|
| Decomposition | `bd dep add proj-42 proj-40` | `blocked-by proj-40: consumes TrainingConfig schema field` |
| Split re-point | `bd dep add proj-51 proj-49` | `blocked-by proj-49: consumes regime entry-point signature` |
| Parallelism-pass repoint | `bd dep add proj-51 proj-45` | `blocked-by proj-45: consumes parser output schema` |
| Sweep | `bd dep add proj-99 proj-52` | `blocked-by proj-52: consumes all leaves (integration sweep)` |

A seam-contract edge (§Coverage's `UNOWNED-SEAM` wiring) uses the fixed artifact token
`boundary contract`: `blocked-by proj-60: consumes boundary contract`. A hot-file split edge (below)
uses `file split`: `blocked-by proj-61: consumes file split`. A sweep edge — the root
integration sweep depending on every leaf, or a post-round fix task wired under an
already-existing sweep — always uses the fixed token `all leaves (integration sweep)`, as above,
regardless of which specific leaf produced the edge. Every other edge kind names the actual
artifact the dependent consumes, the same one the edge rules above require you to be able to
name before writing the edge at all.

**Check the graph's shape before moving on.** Execution rounds ≈ the longest dependency chain. A
wide body with a long thin tail — a finishing layer written as wire-up → verify → polish — is a
decomposition smell: tails usually re-decompose into per-feature integration beads that run
abreast. And a tail whose beads all declare the same file serializes on execution's hot-file cap
regardless of what the graph permits — declared-file overlap inside an intended-parallel layer
means the file should be split or assigned to a single bead. Decide which here, because
§Parallelism Pass only proposes splits and never applies them:

- **Split it** when 3 or more leaves meant to run in parallel declare the same file and each edits
  a separate concern in it (its own functions, section or sub-module). Module roots and wiring
  files are the usual case: `mod.rs`, `ports.rs`, `app.rs`, a CLI dispatch. Create one leaf
  **`Split file: <path>`** with the standard flag triple. It is a move-only, behavior-preserving
  split along those concerns: code moves to new files, re-exports keep every caller compiling,
  and no logic changes. Acceptance: it compiles, the suite is green, and behavior is unchanged.
  Add an edge from each of those leaves onto it (`bd dep add <leaf> <split>`, with
  `blocked-by <split-id>: consumes file split`), and point their files-touched hints at the new
  files.
- **Don't split** when the leaves change the same logic in the file. That is a semantic conflict
  a split cannot remove: give the logic to one owner bead the others depend on, or extract a
  `Seam contract:` bead. Don't split an append-only registry either (a module list, a route
  table, a variant enum): give its lines to one owner bead, or to the seam contract, which can
  declare every entry up front.

§Parallelism Pass measures what remains on the settled tree and removes what it safely can; at
decomposition, aim to need it little.

- **Beads:** for every child, `bd create ... --parent <id> --no-inherit-labels -l sp:<root-epic-id>` — both flags together, every time. `--no-inherit-labels` alone still strips the wanted root label; without it, parent labels (including `sp:needs-design`) smear onto every leaf. The root invocation creates the epic first, labeled `sp:<its-own-id>`, then runs the first Key abstractions sync on it (§Key Abstractions) before it creates any child.
- **No beads:** the same fields as a task-table row — see §No-Beads Mode for the columns it must carry.

## Promotion Review

Dispatch `./promotion-reviewer-prompt.md` fresh-context (it must not have authored the spec or task list — countering author bias is the point), giving it the spec, the child task list (with each child's deps — the SPLIT test counts dependents from them), the ancestor-goal chain, and the specs of already-designed siblings. It returns per-task `LEAF`/`PROMOTE`/`SPLIT` verdicts and a decomposition verdict (`COMPLETE`/`ISSUES`).

Sanity-check the verdicts; you may overrule them. A `SPLIT` verdict is handled like a
decomposition `ISSUES`: apply it — shrink the flagged bead to its named unblocking artifact and
move the remainder into a dependent or a non-gating sibling that depends on it, then re-point the
bead's dependents (§Splitting a Bead below — the checklist, not optional) — or overrule it by
flagging the task `sp:demoted-by-session` with the reason — the flag marks any session override of
the fresh reviewer, a SPLIT overrule included (the name predates `SPLIT`); this is what makes the
override visible to coverage's flag sweep and prevents a resumed run from re-applying a split the
session rejected. **Overruling a `PROMOTE` back to `LEAF` must be recorded on the task** — flag `sp:demoted-by-session` plus the reason — so coverage and the human can see where session judgment overrode the fresh reviewer. Fix any `ISSUES` in the decomposition verdict before applying any promotion.

## Splitting a Bead

Every split — a `SPLIT` verdict, a coverage-accepted restructuring, a session judgment — moves
scope out of one bead into another, and the graph hides the damage: the tree stays acyclic and
every bead still *looks* correctly blocked, so a dependent left pointing at the wrong fragment
surfaces nowhere (measured live: three dependents stayed blocked on a split bead's residual
two-paragraph scope; re-pointing one moved the critical path 15 → 11 rounds). A split is not done
until its dependents are re-pointed:

1. **Enumerate the original bead's dependents** — every bead whose blocking deps list its id,
   read from the bulk dump (`bd list --json`), not per-bead `bd show`.
2. **For each dependent, name which fragment it now depends on** — the artifact it consumes
   (the edge rules above) decides; "unchanged" is an explicit answer you record, never the
   default you fall into.
3. **Apply the re-points** (`bd dep remove <dependent> <original>`, `bd dep add <dependent>
   <fragment>`) for every dependent whose answer wasn't "unchanged", updating that dependent's
   `blocked-by <blocker-id>: consumes <artifact>` line (§Decomposition) to name the fragment
   through the existing wholesale `bd update --description` rule.

## Applying Promotions

- **Beads:** `bd update <id> -t epic` (in-place, same id — preserves existing deps), then `bd update <id> --set-metadata sp_depth=<N>` and `--set-metadata sp_order=<per-parent ordinal in dependency order>` (underscores — bd's metadata-key validator rejects hyphens), then label `sp:needs-design`.
- **No beads:** mark the row `sub-plan: <spec path>` (or `needs-design` until the spec is written and its Key abstractions section is applied and synced).

Then run the nested brainstorm on the promoted child.

## Nested Brainstorms

Run in the main session (interactive Mode A can't run in a subagent). Context handed in: the parent spec, the ancestor-goal chain, and the specs of already-designed siblings.

- Inherits the session's design mode (always Mode B under `autonomous`); in an interactive run the user can override per-subepic with an explicit request.
- Opens with its own local `## Goal`, seeded from the promotion rationale.
- Builds within the ancestors' `## Key abstractions` sections: they are the frame the nested design extends and never redefines. An explicit decision of the nested spec that goes against one wins at that level, and that level's own section notes it (§Key Abstractions).
- Does not re-offer the visual companion or super-roast (super-roast is offered once, at the root, after coverage passes) and skips Mode B's per-spec review gate — a Mode B tree's human checkpoint is the design-ready stop (§Gates by Mode). Coverage disposes automatically in every mode, and in Mode B even its `ORPHAN` escalation applies without asking (§Coverage).
- Does not create a new worktree; `using-git-worktrees` idempotently verifies the existing one.
- Once it returns with a written, committed spec, invoke `superpowers:super-design` on that spec — §The Process, step 7; that is the recursion. The nested invocation runs step 2 on that spec itself.

## Durable State

| Fact | Carried as (beads) |
|---|---|
| Tree membership | label `sp:<root-epic-id>` on every issue in the tree, **including the root epic** (root detection: an epic whose own id equals its label's suffix) |
| Depth / sibling order | metadata `sp_depth` (root's direct subepics = 1) and `sp_order` (per-parent ordinal, dependency order) on every promoted epic |
| Design pending | label `sp:needs-design` until the nested brainstorm's spec is committed and its Key abstractions section is applied and synced (§Key Abstractions) |
| Spec location | recorded on the issue once written |

**Cursor is a query, not a memory:** an epic is eligible for design iff it carries `sp:needs-design` AND every lower-`sp_order` sibling's subtree is fully designed (no `sp:needs-design` anywhere under it). Next work item = the eligible epic, depth-first.

**Write ordering:** commit the nested spec (+ INDEX row), then apply its Key abstractions section and run the sync, *before* clearing `sp:needs-design` — the label flip is the single "done" marker. No explicit commit step is needed after each `bd` write beyond that (default `--dolt-auto-commit=off` is durable per completed call; never switch to `batch` mode).

No beads: the same facts live as columns on the task-table rows — see §No-Beads Mode.

## Tripwire

Before starting any nested brainstorm, compute this tree's state from its labels/metadata: **depth** = the epic's `sp_depth`; **count** = total epics carrying `sp:<root-epic-id>` (scoped to this label — never a repo-global count). Fires before brainstorming any subepic at **depth 3**, or when count would exceed **10**. Coverage-spawned subtrees count toward the same counters, and the tripwire stays armed during coverage fix rounds.

On fire, show the epic tree — beads: `bd list --parent <root> --pretty --status all` (transitive); no beads: the task tables — marked designed / wants-promotion / unexplored, and offer:

- **continue** — set the next checkpoint (default: thresholds double).
- **stop** — remaining would-be promotions freeze into leaf tasks flagged `sp:frozen-promotion` (coverage auto-surfaces every one).
- **prune** — drop branches, or demote an epic back to a task. Demotion requires the demotion guard: `bd children <id> --json` must return empty before `bd update <id> -t task` — bd allows demoting an epic that still has children, silently corrupting the tree.

Unattended (§Unattended Runs): take **continue** on the first fire and **stop** on the next, parking
each choice with the tree snapshot as a qualifier.

## Coverage / Gap Loop (root only)

Runs once the tree has settled (§The Process, step 8).

**One root pass per round, two reviewers.** Coverage asks a high-level question — did the tree
miss anything the goal needs, and does anything in it serve no goal — so it reads goals and a
compact tree, not spec prose. Detail-level defects are covered elsewhere: an unsatisfiable
criterion by the precheck's `(needs: <id>)` resolution, an unexercised configuration by
§Decomposition's `Configuration smoke:` rule, both by `super-roast`'s design review, and edge
quality by the parallelism pass (§Parallelism Pass).

**Assemble the inputs with the script.** Dump the tree to a file with `bd list --label
sp:<root-epic-id> --all --json --limit 0` (not `--parent` — one level only in JSON mode; without
`--limit 0` bd stops at 50), then run `bash <base>/scripts/coverage-inputs --from <dump>
<root-epic-id> <root spec> <every subepic spec>` (`<base>` is this skill's base directory). It
prints the `## Goals` section (root goal; each epic's Goal section and one-sentence summary) and
the `## Task tree` section (one line per bead with its blocking deps, plus its `owns:` /
`consumes:` / `boundary contract:` lines), and reports its byte count on stderr against a 60 KB
target. Paste both sections verbatim. An `unmatched-spec:` line means a spec header does not name
its bead id — fix the header (§Conventions). If the script prints a line starting
`JQ_UNAVAILABLE:`, follow its instruction and produce the same output format; this holds for
every script below.

**Canonical requirement list.** Before dispatch, the orchestrator — not any reviewer — derives
the canonical requirement list: decompose the root `## Goal` and root spec into one observable
outcome per requirement, numbered R1…Rn, and pass the same list to both reviewers. **R-ids are
stable across rounds and resumes:** round 1 writes them into the run-state file's
`coverage-round-1` record (no run-state file: the coverage ledger's round-1 header); round 2 (or
a resume) **reads that list back** rather than re-deriving it, appending any `R-new: <text>` a
round-1 reviewer proposed as the next free id. An existing id is never renumbered or reused.
After the reviewers return, save the canonical list (one `R<n> <text>` per line) and each
review to the artifact directory (`coverage-round-<N>-requirements.md`,
`coverage-round-<N>-review-<k>.md`) and run `bash <base>/scripts/requirements-tally <canonical>
<review-1> <review-2>`. Its first line (`requirements: N · mapped: M · unmapped: K (R3, R7)`)
goes into the round summary and the `coverage-round-<N>` record; its `r-new:` lines are the
proposals to append; a `no-block:` line means that review is not valid.

**Mechanical checks run before dispatch, once per round.** Run `bash
<base>/scripts/coverage-precheck --from <dump> <root-epic-id> <coverage ledger>`. Every line it
prints other than `citation: … blocker` and the summary is a finding you file yourself, already
verified, with the line's kind as its type: `flag-sweep` (a flagged task the ledger has not
disposed — promote and design it, keep it as a leaf with a rationale, or split it), `unstated`
(write the missing `blocked-by` line naming the artifact, or drop the edge), and `citation`
`dependent|unwired|unknown` (fixed below; `unknown` means the cited id is not in the tree —
correct the citation). Pass the output to both reviewers as `## Precomputed graph checks`.

**Dispatch.** Two reviewers (`./coverage-reviewer-prompt.md`, fresh context, model opus,
dispatched concurrently), each given the same assembled inputs. Findings are unioned and
deduped before disposition — union, not majority: a miss costs more than a false positive, and
the verify step below removes false positives. A round with fewer than two valid reviews is
marked **degraded** in the round summary, never silently accepted.

**Full spec on request.** A review may end with up to two `NEEDS-SPEC: <subepic id> — <reason>`
lines. Re-dispatch that one reviewer once, inside the same round, with each named subepic's full
spec appended under `## Full spec: <id>`; the re-run's output replaces the original review. A
`NEEDS-SPEC` in the re-run is noted in the round summary and not honored again.

**Ledger:** every disposed finding — applied, rejected, escalated, and flag-sweep — is appended to the coverage ledger in the artifact directory (§Artifact Location) and committed, one line each: `<ledger-id> · r<N> · <TYPE> · <subject> · <disposition> — <one line>` (the precheck skips a flagged task that has an entry with TYPE `flag-sweep` and the task id as its subject). Pass its contents to both reviewers.

**Findings file.** After a round's union and dedupe (precheck findings included), write `coverage-findings-round-<N>.md` to the artifact directory, one deduped finding per line: `<TYPE> · <subject> · <one line>`. The subject is the finding's identity: the task id; `<dependent><-<blocker>` for an edge; the boundary name for a seam; the R-id for a `GAP` that has one, else the goal element in a few words. Choosing the subject is the judgment; the comparison below is mechanical.

**Two rounds, fixed.** Round 1 always runs. Round 2 runs iff round 1 applied at least one fix
that changed the tree — a round 1 with nothing to apply is the loop's clean exit. Round 2
re-runs the root pass on the updated tree with the changed ids. Once round 2's fixes are applied
the loop ends: **there is no round 3, and round 2's own fixes are never re-reviewed.** That is
the priced cost of a fixed cap, and the root integration sweep below absorbs it. **Declined: a
round 3 when round 2 widens** (divergence observation below). The cap stays at two rounds: the
design roast that follows (§Adversarial Review Loop (root only)) reviews the settled tree, round
2's fixes included, so it covers that ground. **Round 2
dispatches only once every round-1 fix is fully applied** — a new-subepic `GAP`'s nested subtree
included, which means waiting for that subtree to finish designing. An amend's
`coverage-amend-<loop>-<K>` round (§Amend Mode) runs outside this two-round cap.

**The changed-since input.** Round 1's fixes are applied with no human in the path, and round 2
is the only thing that will ever see them. Assemble round 2's `## Changes since the previous
round` section (empty on round 1) naming every task round 1's applied fixes created or amended,
each with the finding it answers.

**Divergence observation.** On round 2, before disposition, run `bash
<base>/scripts/coverage-divergence <round-1 findings file> <round-2 findings file>` and put its
three lines (count trajectory, novel fraction, `widening: yes|no`) in the round summary either
way. A widening round 2 is the strongest evidence the tree needs a look the cap will not give it.

**Disposition is automatic — there is no arbitration prompt.** Every deduped finding is verified,
then applied; a finding this round already has a recorded disposition for (§Run-State File) is
replayed, not re-applied.

**Verify, then apply.** Check each finding's evidence against the inputs the reviewers were
given: the ids it cites resolve in the task tree, the text it quotes is really there, no ledger
entry already covers it (a `ledger:`-tagged finding with no new evidence is a duplicate: drop it
without a new entry). A finding whose evidence does not hold is **rejected to the ledger with
the one-line reason**, never applied and never escalated. This is a check against the assembled
inputs, not a re-review: do not go read the repo to adjudicate one, and never reject a finding
for being expensive to fix.

**Splits and promotions apply without confirmation, in every mode.** A verified finding whose fix
splits a bead or promotes work into a new subepic is applied as the reviewer recommended — no
human confirmation, interactive runs included — recorded in the coverage ledger and the round's
run-state record, and named in the round summary. A new subepic is created → promoted → nested
brainstorm in the run's design mode (Mode B when unattended) → its own super-design subtree
(tripwire stays armed). If the recommendation is ambiguous, take the reviewer's stated preference;
if it states none, keep the tree as-is and record that.

**One escalation, and only in an interactive run.** A run is interactive iff its design mode is A
**and** it was not told the run is autonomous (§Inputs). The escalation is an `ORPHAN`:
delete-as-scope-creep vs. add the missing goal element it serves is a question about the goal, not
the tree. Non-interactive: apply the reviewer's proposed fix, deletion included, and name it in
the round summary. Every other type applies silently, in every mode.

**The fixes, by type.** Verified `GAP`: small → leaf task added directly; big → a new subepic, as
above. Any verified finding whose fix splits or shrinks an existing bead — moving scope out of it
— follows §Splitting a Bead, dependents re-pointed included. Precheck `citation` `dependent` or
`unwired`: restate the criterion in terms of an artifact that exists when the task completes
(`bd update <id> --description` with the full amended text, keeping or adding the `(needs: <id>)`
citation so the next round's precheck resolves it), or re-point the edge so the cited producer
genuinely precedes the task; for `unwired`, add the missing edge (`bd dep add <task> <cited>`)
and, in the same `bd update --description`, the `blocked-by <cited>: consumes <artifact>` line.
Verified `UNOWNED-SEAM`: **before creating either bead, check whether a `Seam contract:` /
`Seam integration:` bead for this boundary already exists — including via a replayed disposition
from the run-state file — and adopt it instead of duplicating it and its edges.** Otherwise create
**two leaf tasks** with the standard flag triple, and wire the tree:

- **`Seam contract: <boundary>`** — delivers **compilable boundary code**, not prose: the interface/types/signatures, the schema fields, and the wiring itself plumbed end-to-end as stubs or defaults (the value must flow even if inert-by-default). Acceptance: compiles, suite green, wiring present. Add a dependency edge from **every participant onto the contract bead** (`bd dep add <participant> <contract>`) — a genuine blocking edge by §Decomposition's own rule (the interface must exist first), not narrative order — and write `blocked-by <contract-id>: consumes boundary contract` into each participant's description (the fixed artifact token for this edge kind; see "Every blocking edge is paired with a reason line" above). Its files-touched hint deliberately spans both sides of the seam; execution merges it before its dependents by construction, so the overlap is expected.
- **`Seam integration: <boundary>`** — depends on that seam's participants only (`bd dep add <integration> <participant>` for each), with `blocked-by <participant-id>: consumes <that participant's owned boundary>` written into the integration bead's own description for each one. Delivers: verify the wiring end-to-end, write integration test(s) crossing the seam, see them pass. Small fixes inline; anything larger goes through execution's normal blocker path.
- Append one line to **each participant's** bead description: `boundary contract: <contract-bead-id>`. **`bd update --description` replaces the description wholesale — there is no `--append-description`.** First `bd show <participant>` to read the current description, then re-send the full existing text with the pointer line appended; sending only the pointer line destroys the `owns:`/`consumes:` declarations the coverage reviewers and execution briefs depend on. The pointer flows into execution briefs through the planner with zero execution-side changes.

**Recall floor & fallback net:** if a round stays degraded or otherwise can't be trusted, downgrade coverage to **advisory** and make the gate a **mandatory human read-through of the goal against the full task tree** — disclose this in the round summary, never silently. In a non-interactive run (above) there is no one to read it through: record the downgrade as a parked qualifier and hand it back verbatim, the way a degraded roast verdict is parked.

**Root integration sweep (after the loop ends):** once the coverage loop has ended — round 1
clean, or round 2's fixes applied (§Two rounds, fixed) — and the tree has ≥2 leaf tasks (seam beads count as leaf tasks too — a `Seam contract:`
bead's own edge onto the sweep would be transitively implied through its dependents anyway, so
counting it here is redundant but harmless), create one final leaf with the standard
flag triple — **`Integration sweep: <root goal, short>`** — depending on **every leaf task
and every `Seam integration:` bead** (each such `bd dep add <sweep> <leaf>` paired with a
`blocked-by <leaf-id>: consumes all leaves (integration sweep)` line in the sweep's own
description — the fixed artifact token for every sweep edge, per-leaf id aside) (its "tests no per-seam bead covers" scope is only
decidable once those exist). Scope-bounded deliverable: verify the goal's main flow(s) end to
end, add integration tests no per-seam bead covers, and sweep for unwired config values,
parameters, and interfaces; fix small gaps inline, file blockers for big ones. Unlike the
execution Finish-phase review (report-only), this bead *implements* what it finds — it is the
unknown-unknowns net for seams the reviewers missed, and it occupies the terminal join position
that serializes anyway. The join cost is inherent, not a defect: a quarantined leaf leaves the
sweep unready, and that surfaces through execution's normal blocker reporting, by design. **The
exclusion below is for post-hand-off fix beads only** — e.g. `super-auto`'s phase-5 fix loop,
filed after this tree has already handed off to execution — those do not get edges onto it; the
roast covers that ground. Design-time fix tasks that §Adversarial Review Loop creates *after* the
sweep bead already exists are the opposite case: they **are** wired under it (§Adversarial Review
Loop step 1), so the sweep still runs last.

## Adversarial Review Loop (root only)

Runs once the coverage loop passes (§Coverage), before hand-off. Offered once, at the root, the
same offer brainstorming makes on a single un-decomposed spec — a decomposed tree gets it here
instead, after the tree has settled, since that's the first point a full design exists to review.
Opt-in; declining goes straight to §Parallelism Pass — and a caller may pre-decide it **either way**
(§Inputs): pre-declined skips to it, pre-accepted runs the roast, and in neither case is the
offerer's question asked — the caller's user already answered it once.

On accept, invoke `superpowers:super-roast` (design mode) on the settled tree, passing per its
Inputs table: the artifact-directory override as its report-location override (so the report lands
beside the specs it is about), **the iteration number from the round count** (without it a later
round's report overwrites an earlier one's file), **`autonomous` when the run is unattended**
(§Unattended Runs; without it super-roast pauses for a human at its loop exits), and on rounds ≥2 the prior
report. The report file is the only cross-iteration state. **Three of its sections drive this loop — reading only
`## Confirmed findings` silently discards the two that most need a human:**

| Report section | What this loop does with it |
|---|---|
| `## Confirmed findings` | One task per finding — the fix queue (steps 1–4 below). |
| `## Escalations (need human)` | **Surface every entry to the human before starting fix work**; unattended, park each entry and go on with the fix queue (§Unattended Runs). These are findings with a dead panel seat, an unresolved external premise, or material dissent between seats. They need a human by definition: no verdict was reached, so there is nothing to auto-fix and nothing to auto-dismiss. Never fold them into the fix queue, and never let a `clean` verdict elsewhere in the report imply they were resolved. |
| `## Not verified (beyond panel cap)` | Severe candidates the panel cap left unjudged. Present them next to the escalations and ask whether to re-roast with a raised `config.panelCap` before fixing anything — an unverified Blocking candidate is not a cleared one. Unattended, the answer is no: park them and fix the confirmed queue. |
| `## Not verified (dedupe failed or judge lost)` | Findings the engine could not get judged (dedupe died, or a judge was lost). Treat them like the beyond-cap section: surface next to the escalations and offer a re-roast; unattended, park them and fix the confirmed queue. |

**Round order.** A round's report is handled in this order: the converged test (the fix list's item 4),
Step 1, the thrash and cap tests (item 4), then the branch Step 1 chose. "The fix list" is the
numbered items 1–4 below; Step 1 is not its item 1.

**Step 1 — before fixing.** Every round whose report has confirmed findings runs this ordered
procedure; each outcome has its branch. Paths live in the artifact directory (§Artifact Location):
the ledger `findings-ledger-design.md`, the overrides file `findings-overrides-design.md` (create
it empty when absent), and the amend record `amend-design-<K>.md`.

1. **Keys file.** Write `…-roast-design-<N>-step-back-keys.txt` beside the round's report: for each
   `roast-design` round `<M>`'s report, `bash <base>/../super-code/scripts/report-verdict --keys
   <that report> | sed 's/^/r<M> /'`, one `rM [SEV] <location>` line per confirmed key, every round
   so far, every severity. Its consumer is `scripts/step-back-check`.
2. **Ledger.** Run `bash <base>/scripts/findings-ledger --loop design --out
   <artifact-dir>/findings-ledger-design.md --report 1=<roast-design-1 report> … --overrides
   <artifact-dir>/findings-overrides-design.md`, one `--report <M>=<path>` per round, and record
   `findingsLedgerDesign: <path>`. Every later rebuild this round uses the same input set. On exit
   2, from this call or any later rebuild, drop the bad input it names from this and every later
   invocation (a round whose previous round is missing computes no triggers). If it still exits 2,
   the gate is not computable: record `stepBackDesign-round-<N>: local — gate not computable:
   <reason>`, park a `degraded-verdict` `redesign gate not computable — <reason>`, skip the
   step-back, and run the fix list with every finding its own task and no clusters.
3. **Last-known-good breach.** When this round is the first after redesign cycle K, that cycle's
   `redesign-design-<K>` state is `applied`, and this round's effective open Blocking count (the
   ledger's `r<N>=`) is higher than the previous round's, rewrite that record's state to `thrash —
   lastGood breach` and take the thrash exit. Nothing else in Step 1 runs.
4. **Step-back.** Dispatch `./step-back-prompt.md` (mode `design`, model opus, fresh context, never
   an agent that does the fixes) with the ledger path (`[LEDGER_PATH]`), the keys file
   (`[KEYS_FILE]`), every roast report of this loop so far, the settled tree, and every prior
   step-back record. Save its output beside the report, with no record yet: item 7 writes the
   round's `stepBackDesign-round-<N>` line.
5. **Check.** Run `bash <base>/scripts/step-back-check --step-back <file> --keys <keys file>
   --ledger <ledger>`. Exit 0: continue. Exit 3: re-dispatch the step-back once with the reject
   lines and check again. A second exit 3 never falls back to `local` when the ledger names a
   mechanical trigger: it is a forced redesign (scope `inside`, triggers from the ledger; item 7
   writes `redesign — forced: step-back record rejected: <reject lines>`) while
   `redesignCycles-design` < 2, else the thrash exit. With no mechanical trigger, run `local` with every finding its own
   task and no clusters, recorded `local — step-back record rejected: <reject lines>`. Exit 2: a
   bad invocation; fix it and run again.
6. **Interactive runs** (§Gates by Mode). A `redesign`, mandated or not, is presented with the
   step-back's recommendation and the human chooses. A decline is recorded `stepBackDesign-round-<N>:
   local — redesign declined by human`, parked as a `degraded-verdict` `redesign declined by human
   — <triggers>`, and the round runs `local`. The check is not re-run on the human's choice.
7. **Branch.** Choose the branch from the record's decision, and write the round's
   `stepBackDesign-round-<N>` line as part of that branch's own run-state write (the round
   summaries when standalone), unless items 2, 5 or 6 already wrote a `local` line.
   - `local`: write the `local — <why>` line; the fix list, items 1–4.
   - `redesign`, scope `inside`, `redesignCycles-design` < 2: commit any uncommitted spec changes
     (so HEAD is the pre-amendment spec state every Amend Mode restore returns to); record
     `lastGood` as that HEAD commit SHA (reported, never reverted: nothing has executed);
     in one run-state write, increment `redesignCycles-design` to K, write `redesign-design-<K>`
     with state `started` and the `redesign — applied` (or forced) line; then append each `dissolves:` key of the record that passed the check to the overrides file as
     `<key> · dissolved@r<N>` and rebuild the ledger (item 2); a forced redesign has no validated
     record and writes none, and no other branch writes a `dissolved` line;
     then run the exit tests below. This round does not take the cap exit; the redesign cycle
     runs.
   - `redesign`, scope `outside`: unattended, write `redesign — parked: …`, park a `degraded-verdict`
     `redesign proposed, not applied`, run `local`, and surface it at the loop exit. Interactive,
     offer it to the human with the recommendation; the round runs `local`.
   - `redesign` with the budget spent (`redesignCycles-design` = 2): under a mechanical trigger,
     write `redesign — parked: …` (naming the budget), then the thrash exit; otherwise park a
     `degraded-verdict` `redesign budget spent` and run `local`.

**Redesign cycle.** After the exit tests pass, run §Amend Mode inline: `--loop design`, K, the
ledger and overrides paths, this loop's `findings-ledger` invocation (item 2's input set, dropped
inputs excluded), the step-back record, the task-tree dump, the run-state file, and the bead
context (§Decomposition's flag triple and the `Integration sweep:` wiring). After each of its
steps, rewrite the `redesign-design-<K>` record's `state` in place (`amend-checked`,
`specs-committed`, `beads-filed`, `applied`); fill its `amended` field from the amend record.
- `aborted — <reason>`: rewrite the state, park a `degraded-verdict` `redesign aborted —
  <reason>`, remove the `dissolved@r<N>` lines Step 1 wrote for this round's record from the
  overrides file, rebuild the ledger (item 2), and run the round `local`. The spent cycle is not
  refunded.
- `applied`: the loop's own next numbered round is the design roast after the amendment, always
  when `amended:` is non-empty (re-invoke `superpowers:super-roast`, fix item 3, with its prior
  report the latest report), with the ledger path in its stated intent as reference-only input:
  the previously open findings and their statuses, to re-check. The round that ran the redesign
  skips the fix list's items 1–2; Amend Mode files and supersedes the beads. With `amended: none`,
  item 3's scope rule decides.
- Design roast rounds the code loop runs after an amendment also increment `roastDesignRound` and
  rebuild `findingsLedgerDesign`, so they spend this loop's cap.

Standalone (no caller run-state file), the ledger, overrides and amend files stay in the artifact
directory and the redesign records go to the round summaries (§Re-entry adopts them).

**Declined: offering a split when findings concentrate in one subsystem.** A step-back redesign
can already target that one decision, and a split is a new design the human starts. **Declined:
counting recurring classes in the roast delta.** The step-back's `pattern:` and `clusters:` carry
recurrence; the delta stays an instance count.

1. **Create one task per confirmed finding that needs code or other build work** (a fix that only amends spec or bead text is applied inline under step 2 and recorded in the run-state file — a task for it would enter the execution tree as already-done work) — or one per step-back cluster (the step-back file's `clusters:` lines), covering every member and carrying the cluster's `rule:` for all its instances, cited or not — with §Decomposition's full `bd create` flag triple (`--parent <root-epic-id> --no-inherit-labels -l sp:<root-epic-id>`) — a fix task outside the epic's descendant tree lets `bd epic close-eligible` close the epic mid-fix. **When an `Integration sweep:` bead already exists for this root, also `bd dep add <sweep> <fix-task>` for each fix task created here** — so the sweep still runs last — pairing each with `blocked-by <fix-task-id>: consumes all leaves (integration sweep)` in the sweep's description, the same fixed artifact token every sweep edge uses.
2. **Fix per the normal ladder** — inline for small fixes; design work in the run's mode for large
   ones (a Mode B nested brainstorm when unattended; may itself promote/nest); a dispatched fixer
   (Sonnet-class is fine) for delegable work. Whoever fixes gets every round's report path and
   every applied redesign, not just this round's, so a patch does not reopen what an earlier round
   closed or undo a chosen redesign. A fix that touches a `## Key abstractions` section is applied
   and synced: commit the amended spec, then run the sync (§Decomposition, "Key abstractions sync").
3. **Auto-decide re-roast by fix scope:**
   - Mechanical, single-file fixes with no design change → done, no re-roast.
   - Fixes that changed a design decision, changed data handling, or resolved multiple Blocking
     findings → re-invoke `superpowers:super-roast`, passing the prior report so it can skip
     re-litigating what it already cleared.
4. **Loop exits.** Tested in the round order above: converged first, then Step 1, then these. The
   effective cap is `3 + redesignCycles-design`, using the counter as Step 1 left it, so a cycle
   Step 1 starts raises the cap before the cap test. Pass super-roast the computed number as
   `config.iterationCap`: `3 + redesignCycles-design`, plus 1 in the extension round or in the
   post-amendment roast that replaced it (below).
   - **Converged** — the report's verdict carries `[converged]` (a non-degraded round ≥ 2
     confirming zero Blocking of any provenance: no new, no carried, no regressed — see
     super-roast's Report format / `reporter-prompt.md` Steps 3–4). The roast has nothing
     Blocking left to find; another fix + re-roast round is diminishing returns by
     construction. Exit the loop, and hand the remaining sub-Blocking confirmations to the
     human (or the exit summary, when unattended) as a **punch list** — file the ones worth
     doing as ordinary tasks with the §Decomposition flag triple, or decline them explicitly;
     do not re-roast to chase them. This exit exists because, without it, a run that has
     genuinely converged still spends the last round manufacturing marginal findings a human then
     has to shut down by hand. Checked first.
   - **Thrash** — Step 1 reached the thrash exit: the redesign budget is spent while a
     mechanical trigger (no-progress or recurrence) still fires, or a last-known-good breach
     (item 3 of Step 1). That is thrash, not progress — stop and pause for the human as below. (A
     carried/still-open Blocking lands here only through those two paths, never in the converged
     exit.) The breach means the amendment left more open Blocking than the state before it; the
     pre-amendment spec commit is `lastGood`, reported, never reverted.
   - **Cap** — `roastDesignRound` ≥ `3 + redesignCycles-design` after Step 1. A round in which
     Step 1 started a cycle never takes the cap exit: its redesign branch runs, so a trigger first
     firing on the cap round starts a redesign instead of exiting capped.

   **Capped Blocking — the cap is a cost control, not a clearance.** When the effective cap
   round still ends with a confirmed-Blocking verdict (and Step 1 started no cycle), extend the
   cap by exactly ONE round — one more fix + re-roast — and require that extension to come back
   clean or `[converged]`. A redesign started in the extension round (budget left) replaces the
   extension: the post-amendment roast is the loop's last round, and if it still ends Blocking,
   record `capped-blocking` exactly as after the extension. If the extension (or that roast)
   still ends Blocking, independent rounds called the same kernel defective and the latest fixes
   are unverified. Record `capped-blocking` in the run-state file with the unresolved Blocking
   finding ids and the extension round's report path, then:
   - Interactive or one-shot: the design does not proceed to execution. The exit pause (in a
     one-shot run, the design-ready stop) is where it stops, and the human owns what happens
     next. A later, human-relaunched run that executes the tree anyway first acknowledges the
     recorded `capped-blocking` in its own ledger.
   - `autonomous`: record it as proceeded, park each unresolved Blocking finding, and hand
     off. The final summary opens with it.

**Verdict qualifiers gate the exits** — the same rule `brainstorming` applies at its own gate:

- `clean` with **no qualifier** → the loop is done; proceed to §Parallelism Pass.
- `clean [low coverage]` or `clean [panel-capped: N unverified]` → **not a clearance.** The
  qualifier says the run itself was degraded (dead triage, dead scout, dead dedupe, incomplete
  judging, or zero findings on a non-trivial artifact) or that N severe candidates were never
  judged. Do not auto-proceed: surface the qualifier verbatim and let the user choose to proceed
  anyway, re-roast, or dig in. Unattended (§Unattended Runs): proceed, record the qualifier, and hand it back verbatim — the caller already answered this.
- A confirmed-findings verdict carrying either qualifier → fix as normal, but carry the qualifier
  into the exit summary: a shrinking Blocking count under low coverage is weaker evidence of
  progress than it looks, and the early-stop test above can be fooled by it.

Every exit — cap-out, clean, converged, and thrash — **summarizes for the human**, restating any
open escalations, any beyond-panel-cap candidates, any parked or aborted redesign and any `redesign-design-<K>` record that ended `thrash — lastGood breach`, the converged exit's punch
list (when that exit fired), and any qualifier still on the verdict. An unqualified `clean`
proceeds to §Parallelism Pass after its summary; every other exit **pauses** there. This loop never
declares itself finished, mirroring `super-roast`'s own handoff contract. Unattended (§Unattended
Runs): no exit pauses — record the summary into the run-state file (or the final summary, when
there is none) and proceed to the design-ready point (§Gates by Mode); Capped Blocking follows
its own rule above.

## Amend Mode

The single redesign entry point both roast fix loops call: super-auto's phase-5 code loop and
§Adversarial Review Loop's design loop. It is a Facade over spec amendment, the Key Abstractions
sync (§Decomposition), bead filing (§Decomposition) and §Coverage. It owns the sequence below,
restoring the specs to HEAD on every reject and abort, and being the single filer of the
amendment's beads. It never counts or checks the redesign budget, never writes `redesignCycles-*`
or any `redesign-*` field but `state`, never runs a roast, super-code or the next round, never
routes on raw reports (the ledger is its input; read finding text by key through the ledger's
`text` pointers), and never has the orchestrator edit specs: only the amend designer does. The
calling loop's orchestrator runs Amend Mode inline; only the amend designer is dispatched. Per-loop
differences live only in the loop table below. After each step the orchestrator rewrites the
`redesign-<loop>-<K>` record's `state` with the state that step names; nothing else writes it.

**Inputs:** the root epic id; the root and nested spec paths; the ledger and overrides paths; the
calling loop's findings-ledger invocation (its Step 1 input set, dropped inputs excluded); the
step-back record; the task-tree dump (`bd list --label sp:<root-epic-id> --all --json --limit 0`);
the roast report paths; the run-state file; the mode flags; the loop (`code|design`); K; and the
caller's bead context.

**Steps**

1. **Dispatch the amend designer.** Precondition: the `--specs` paths are clean at HEAD (the caller
   committed them before writing `started`), so every restore below discards only the designer's
   edits. Dispatch `./amend-prompt.md` (fresh context, model opus), filling `[LOOP]`, `[K]`,
   `[ROOT_SPEC_PATH]`, `[SPEC_PATHS]`, `[LEDGER_PATH]`, `[STEP_BACK_PATH]`, `[TASK_TREE_DUMP_PATH]`,
   `[REPORT_PATHS]`, `[AMEND_RECORD_PATH]` and `[REJECTS]` (empty on the first dispatch). The record
   goes beside the loop's ledger: code `<run-dir>/amend-code-<K>.md`, design
   `<artifact-dir>/amend-design-<K>.md`. The designer writes only spec files and that record, and
   never `## Goal`.
2. **Validate.** `bash <base>/scripts/amend-check --loop <loop> --amend <record> --ledger <ledger>
   --specs <root spec> <nested specs…>`: `ok` (exit 0), `reject:` lines (exit 3), or bad input
   (exit 2: fix the invocation; a git failure is exit 2, never a reject). On `ok`, state
   `amend-checked`. On each reject, restore the `--specs` files (`git checkout HEAD -- <paths>`) so
   the retry starts clean, then re-dispatch once with the reject lines as `[REJECTS]`. A second
   reject restores again and returns `aborted — amend rejected`.
3. **Commit** the specs; state `specs-committed`. An abort is possible only before this commit
   lands, and every abort restores the specs first. Then run the Key Abstractions sync
   (§Decomposition, "Key abstractions sync") when a `## Key abstractions` section changed.
4. **File the `work:` items** with the filing sequence below. It does for a redesign round what
   super-auto §Step 3 does for a local round: reopen the epic (and the owning subepic) first, since
   a closed parent stays closed when a child is filed and super-code then stops at `root-closed`;
   file under spec §4's parent (`$PARENT`: the root epic, or the subepic that owns the amended
   spec) with the caller's bead context (`$CONTEXT`, appended to each description) and the
   §Decomposition flag triple, labelled `$LABEL` = `sp:redesign-<loop>-<K>`, deduped by title
   against that label; then, design loop, supersede the open beads the amendment obsoletes (the
   record's `supersedes:` lines; a bead already closed is skipped). Every bead filing in a
   redesign round, the calling loop's amend-roast tasks included, uses this sequence. The
   orchestrator fills `$ROOT` (root epic id), `$PARENT`, `$LABEL`, `$LOOP` (`code|design`),
   `$AMEND` (the record path) and `$CONTEXT`. State `beads-filed`.

   ```bash
   set -euo pipefail
   bd update "$ROOT" --status open
   [ "$PARENT" = "$ROOT" ] || bd update "$PARENT" --status open
   field() { awk -v want="$1" '/^[A-Za-z][A-Za-z_-]*:/ { f = $0; sub(/:.*/, "", f); next }
     f == want && /^[ \t]*- / { sub(/^[ \t]*- /, ""); sub(/[ \t\r]+$/, ""); print }' "$AMEND"; }
   id_of() { bd list --label "$LABEL" --all --json | awk -v t="$1" '
     /^    "id":/ { id = $2; gsub(/[",]/, "", id) }
     $0 == "    \"title\": \"" t "\"," || $0 == "    \"title\": \"" t "\"" { print id; exit }'; }
   field work | while IFS= read -r item; do
     title=${item%% | *}
     [ -z "$(id_of "$title")" ] || continue
     bd create "$title" --parent "$PARENT" --no-inherit-labels -l "sp:$ROOT,$LABEL" \
       -d "${item#"$title" | }${CONTEXT:+ — $CONTEXT}" --silent
   done
   if [ "$LOOP" = design ]; then
     field supersedes | sed 's/ -> / → /' | while IFS= read -r item; do
       old=${item%% → *}; title=${item#* → }
       bd show "$old" --json | grep -q '"status": *"closed"' && continue
       bd supersede "$old" --with "$(id_of "$title")"
     done
   fi
   ```

5. **Disputes.** Append each `disputed` owner to the overrides file as
   `<key> · disputed@r<N> (<reason>)` (canonical key `[SEV] <location>`; N is the round whose
   ledger the amend read), skipping a line already present. Then rebuild the ledger with the
   calling loop's findings-ledger invocation (an input); exit 2 is handled as that loop's Step 1
   item 2. A disputed Blocking finding stays unresolved and is listed in Remaining.
6. **Coverage.** One extra round, recorded as `approvals · coverage-amend-<loop>-<K>` in the
   `coverage-round-<N>` line format, outside the two-round cap (§Coverage). It reuses
   `./coverage-reviewer-prompt.md` and `scripts/coverage-inputs` unchanged; its
   `## Changes since the previous round` lists the amend's beads and the `amended:` sections. No new
   coverage prompt.
7. **Return** `applied` with the amend record path, the filed bead ids and `amended:`. The orchestrator writes state `applied` here.

**After the commit nothing aborts.** A step from step 3's sync through step 6 that fails is retried
once through its state's resume action; a second failure parks a `degraded-verdict`
`redesign incomplete — <step>: <cause>` and Amend Mode returns `applied` with what it produced, so
the next roast re-validates the open items.

**Loop table** (closed, keyed by `code|design`)

| | `code` | `design` |
|---|---|---|
| Bead wiring | post-hand-off beads, no sweep edges | wired under the existing `Integration sweep:` |
| Supersede | none (no `supersedes:` lines) | the record's `supersedes:` lines, run in step 4 |
| amend-check reverse rule | a `work:` line for every non-disputed open item | a `work:` line, or an amended owning section |
| Bead context source | I3 flags + §Fix-bead template context lines | §Decomposition flag triple + `Integration sweep:` wiring |

**Outcomes**

- `applied`: with the record path, bead ids and `amended:`.
- `aborted — amend rejected`: two rejects.
- `aborted — <cause>`: any other failure before the commit.

The orchestrator writes state `applied` on Step 7 and `aborted` on both abort outcomes (the terminal states).

Both aborts happen before the spec commit and leave the specs at HEAD; the caller runs the round
`local`. A step-back with `scope: outside` never reaches Amend Mode: the caller parks or presents
it. Amend Mode runs no roast, so there is no nested redesign and no double roast: any design roast
after an amendment belongs to the calling loop. `## Goal` is never edited (amend-check enforces
it).

## Parallelism Pass (root only)

Runs once, after the roast loop exits or is declined, and before the design-ready point (§Gates
by Mode). Coverage's precheck only checks that each edge states a reason; this pass looks at the whole graph:
execution spends one round per bead along the longest chain, so an edge on that chain that
carries no real artifact costs a round on every run. Low-hanging fruit only: it changes edges,
never scope, and creates no beads.

1. **Measure.** Dump the tree (`bd list --label sp:<root-epic-id> --all --json --limit 0`) and
   run `bash <base>/scripts/graph-shape --from <dump> <root-epic-id>` (if it prints a line
   starting `JQ_UNAVAILABLE:`, follow its instruction and produce the same output format). It
   prints the `shape:` line (leaves, depth, width = leaves/depth, the critical path), one
   `edge:` line per candidate with the depth if only that edge were removed, and a summary.
   Seam-contract, file-split and integration-sweep edges are exempt by construction. With zero candidates,
   record the result (step 4) and stop here.
2. **Judge.** Dispatch `./graph-pass-prompt.md` (model opus, fresh context) with the script
   output, the dump path, and this skill's "Blocking deps encode genuine blocking" paragraph and
   five edge rules (§Decomposition) pasted verbatim. It returns one `change:` line per candidate
   (`drop`, `narrow`, `repoint`, or `keep`, each marked `safe yes|no`) plus any `proposal:` lines
   (split a shared file, extract a seam contract), which are never safe.
3. **Verify, then apply.** Check each change against the dump: the edge exists, the ids resolve,
   and for `safe yes` the two beads' files-touched hints and boundary lines really share
   nothing. A change that fails the check is dropped. Then, by mode:
   - Interactive: present the changes and proposals with the reviewer's recommendation; apply
     what the human picks.
   - One-shot and `autonomous`: apply every verified `safe yes` change; record each `safe no`
     change and each proposal as a parked graph change, surfaced at the design-ready stop or in
     the final summary.

   Applying follows the edge rules' bookkeeping: `bd dep remove <dependent> <blocker>`, and for
   `narrow` / `repoint` a `bd dep add` per new edge, each with its `blocked-by <id>: consumes
   <artifact>` line written into the dependent's description through the wholesale
   `bd update --description` rule (a removed edge's line goes in the same update). A proposal the
   human accepts goes through §Splitting a Bead or §Coverage's `UNOWNED-SEAM` machinery.
4. **Record.** Re-run the script and write one line to the run-state file (§Run-State File; with
   none, to the final summary): `graph-pass: depth <D>→<D'> · width <W>→<W'> · applied <n> ·
   parked <m>`. Append each disposed change to the coverage ledger as `<ledger-id> · graph ·
   GRAPH-EDGE · <dependent> <- <blocker> · applied|parked|declined|kept — <one line>`.

## Hand-off (root only)

What happens once the tree has settled is **conditional on who owns the hand-off**; in a one-shot
run the design-ready stop (§Gates by Mode) comes first. By default:

- **Beads:** hand off the root epic to `superpowers:super-code`, which owns the epic-scoped `bd ready` loop and the `bd epic close-eligible` fixpoint. Run completion = the root epic is closed.
- **No beads:** run `superpowers:writing-plans` once per epic (a mixed epic still gets a plan for its own leaf tasks); invoke `superpowers:subagent-driven-development` on each plan, serially, in dependency order.

**When the caller owns the hand-off** (e.g. an outer sequencer such as `super-auto`, which needs to thread its own flags and hand-off decisions into the next phase), `super-design` still completes the coverage loop (§Coverage), the adversarial-review offer (§Adversarial Review Loop), and the parallelism pass (§Parallelism Pass), then reports the settled tree and stops. **The report back to a caller that owns the hand-off
carries five things beyond the tree**: the root epic id, the roast report paths in order, the number
of roast rounds run, any verdict qualifier left unresolved, and the `graph-pass:` line with any
parked graph changes. These were already written into the
run-state file as they happened (§Run-State File); hand them back as well so the caller need not
re-read the file to proceed. Symmetrically, **a caller may hand in a starting round number**; resume from it
rather than from 1, or the cap-3 loop silently restarts on every resumed run. The onward invocation
is the caller's to make: `super-code` in beads mode, or, in no-beads mode, `writing-plans` per epic **followed by** `subagent-driven-development` on each plan (the plan file is not optional — SDD extracts each task's brief from it).

## No-Beads Mode

Same decomposition/promotion/coverage, on paper. Each task-table row needs: a stable id (`<epic-slug>.<ordinal>`), a **depth column**, and a **deps column listing blocker row-ids** — as table data, not prose, or the cursor rule above is unreconstructable. Promoted rows are marked `sub-plan: <spec path>` (or `needs-design` until the spec is written and its Key abstractions section is applied and synced). The cursor eligibility rule and tripwire counts run over these columns exactly as beads mode runs them over labels/metadata. Seam machinery included: an accepted `UNOWNED-SEAM` adds `Seam contract:` / `Seam integration:` rows to the task table with their own dependency columns, each participant row gains a `boundary contract: <row>` note, and the root sweep is a final row depending on every leaf row. Key abstractions travel the same way: when §Hand-off runs `writing-plans`, tell it to copy the tree-wide digest (the `Digest:` lines of every committed spec, in tree order, as the sync collects them in §Decomposition) into each plan's `## Global Constraints`; `writing-plans` itself does not change.

## Artifact Location

With no override, specs go to `docs/superpowers/specs/` and the coverage ledger to
`docs/superpowers/reviews/`. **A caller may hand this invocation a single artifact-directory
override**; when it does, everything this skill produces or causes to be produced goes there
instead — root and nested specs, the coverage ledger, and the `super-roast` report (relayed as
that skill's own report-location override, §Adversarial Review Loop). Relay it to `brainstorming`
the same way, as its documented spec-location preference. One override in, one directory out: a
caller that redirects the specs but not the roast report ends up with a run directory that does not
contain its own review, which is the failure this exists to prevent. `specs/INDEX.md` stays at its
canonical path regardless — it is a repo-wide catalogue, not a run artifact — and its row links to
the overridden location.

## Run-State File (when a caller supplies one)

A caller that tracks a longer run may hand this invocation a **run-state file path** alongside the
artifact-directory override. When it does, **record each fact into that file at the moment it
becomes true — not on return.** A caller has no control while this skill runs, so anything left
until the hand-off is lost if the session ends mid-run, and this skill's own work (root brainstorm,
decomposition, the whole coverage loop, the roast fix loop) is the longest stretch of any run it
takes part in.

Write these, each as it happens:

| Fact | Written when |
|---|---|
| the root spec's path | `brainstorming` commits it |
| the root epic id | §Decomposition creates it |
| each roast report path | `super-roast` returns it |
| the roast round count | incremented **per round**, before the next round starts |
| a parked escalation, beyond-cap item, verdict qualifier, or graph change | the round or pass that produced it |
| `findingsLedgerDesign: <path>` (`<artifact-dir>/findings-ledger-design.md`; single-valued, replaced) | Step 1 first builds the ledger |
| `stepBackDesign-round-<N>: local \| redesign — <one line>` (format: `./step-back-prompt.md`; a `patch` line reads as `local`), one line per round, appended | the round's Step 1 branch item, in the same write as `redesignCycles-design` and the `redesign-design-<K>` record on a taken redesign; the `local` forms are written where items 2, 5 and 6 decide them |
| `redesignCycles-design: <K>` (single-valued, replaced, never reset) | Step 1's branch starts a redesign cycle |
| `redesign-design-<K>: round <N> · triggers <list> · amended <§s\|none> · lastGood <sha\|-> · designRoast - · state <started\|amend-checked\|specs-committed\|beads-filed\|applied\|aborted — <reason>\|thrash — lastGood breach>` (one line per K, rewritten in place, never appended; `designRoast` stays `-`: that field is the code loop's) | `started` before the exit tests, then at each transition of §Amend Mode's steps and of the loop's exits |
| the caller's phase token, if it supplied one for this stage | entering that stage |
| **each top-split decision, asked or applied, with the shape it covers** | the moment it is made |
| `capped-blocking`, with the unresolved Blocking ids, the extension report, and stopped or proceeded | the extension round ends Blocking |
| **each coverage round's dispositions, under that round's number** | that round's fixes are applied |
| `graph-pass: depth <D>→<D'> · width <W>→<W'> · applied <n> · parked <m>` | §Parallelism Pass step 4 |

**A caller that hands in a run-state file hands in its format contract too** — follow that file's
field names, entry shapes, and relative-path rule exactly; the caller reads these fields back, and
a co-writer that invents its own shapes produces a state file the caller cannot parse.

**Gate decisions are recorded, and replayed rather than re-made.** Before deciding the top split
(§The Process step 6) or running a coverage round (§Coverage), check the run-state file for what
is already recorded:

- **Top-split:** record the child ids with their `LEAF`/`PROMOTE` verdicts, marked `human` or
  `auto`. On re-entry, replay only if the current set matches exactly; if a child was added,
  removed, or re-verdicted, the record is stale — decide again per §Gates by Mode and say what
  changed.
- **Coverage:** record each round's dispositions against that round, each marked auto or human —
  disposition is automatic now (§Coverage), and the record is what stops a resume re-applying a fix
  the tree already carries. **The highest recorded round number is how many of the two rounds are
  already spent**: a resume runs only what is left, never a fresh pair. Findings a later round newly
  surfaces have no disposition yet and get one.

Without this, every resumed run re-asks for approval of a design the human already approved — and a
caller running unattended stalls on a question it has an answer to. **Never widen a replay into
"this run was approved":** a recorded answer covers the shape it names and nothing else.

Two rules on top:

- **Update in place only the fields listed above; never touch a field you were not handed.** The
  caller owns the rest, and clobbering them turns its resume into a restart. Single-valued fields
  (the round count, the phase token) are *replaced*, not appended — two `roastDesignRound` lines in
  one file means a resume can read the stale one and spend the cap twice.
- **The round count is the one that must be written per round, not per loop.** A cap that is only
  recorded after the loop finishes is not a cap: a session that ends mid-loop resumes at round 1 and
  runs the full allowance again. Accept a starting round on entry (§Hand-off) and resume from it.

This costs one small write per event and is what lets a caller resume into the middle of this
skill's work instead of re-running all of it.

## Conventions

- Every spec (root and nested) opens with `## Goal` — one or two sentences, an observable outcome. Coverage consumes it verbatim.
- Subepic spec naming: `<artifact directory>/YYYY-MM-DD-<root-slug>--<sub-slug>-design.md` (§Artifact Location; the default artifact directory is `docs/superpowers/specs/`) (deeper levels extend the double-dash chain). Each nested spec's header links its parent spec and its bead id.
- Every nested spec gets its own INDEX.md row, tagged with the root slug.

## Red Flags

**Never:**
- Run the coverage loop or hand-off from a nested (non-root) invocation.
- Produce a second root spec or a second root epic on a re-entry — adopt what exists (§Re-entry).
  Two root epics for one goal split the tree with no way to tell which half is real.
- Create a child without both `--no-inherit-labels` and an explicit `-l sp:<root-epic-id>` on the same `bd create` call.
- Demote an epic to a task without first confirming `bd children <id> --json` is empty.
- Read only `## Confirmed findings` out of a super-roast report — `## Escalations (need human)`
  and both `## Not verified` sections must reach the human too (unattended: parked and handed
  back, §Unattended Runs).
- Treat a `clean` verdict carrying `[low coverage]` or `[panel-capped: N unverified]` as a
  clearance — that's a degraded run, and the user decides whether to proceed (unattended: proceed
  and hand the qualifier back verbatim; never drop it).
- Start a roast round's fix work before its Step 1 has decided `local` or `redesign`, or
  hand a fixer only the latest round's report.
- Hand-assemble the coverage inputs, paste full spec prose into a coverage review, or drop beads
  to fit the byte target — `scripts/coverage-inputs` builds the compact inputs, and full specs
  reach a reviewer only through a `NEEDS-SPEC` re-run.
- Apply a parallelism-pass change marked `safe no`, or any proposal, in an unattended run — park
  it; or touch a seam-contract or integration-sweep edge in that pass.
- Run a third coverage round, or spend a fresh pair of rounds on a resume — the cap is two per run
  and the run-state file says how many are left (§Coverage, §Run-State File).
- Ask the user to dispose of a coverage finding, or to confirm a recommended split or promotion.
  Exactly one escalation exists — an `ORPHAN` — and only in an interactive run; every other type
  applies without asking.
- Apply a coverage finding without checking its evidence against the reviewers' inputs. The reviewers are
  instructed to over-report; the verify step is the only thing standing in for the human who used
  to arbitrate.
- Overrule a `PROMOTE` verdict without recording `sp:demoted-by-session` and the reason.
- Ask the human to approve the top split in a one-shot or `autonomous` run, or stop an
  `autonomous` run anywhere after launch — §Gates by Mode.
- Add a blocking edge (`bd dep add`, any site) without pairing it with a `blocked-by <blocker-id>:
  consumes <artifact>` line in the dependent's description — the precheck and the parallelism
  pass cannot audit an edge whose reason isn't written down.
- Act on an amend record `scripts/amend-check` has not passed, including on resume.
- Edit a spec as the orchestrator during Amend Mode — only the amend designer
  (`./amend-prompt.md`) edits specs; the orchestrator restores and commits.
- File an amend's beads from the calling loop — Amend Mode is the single filer, and the caller
  only supplies bead context.
- Run a roast inside Amend Mode — any design roast after an amendment belongs to the calling loop.
- Re-dispatch the amend designer, or return `aborted`, without first restoring the `--specs` files
  to HEAD (`git checkout HEAD -- <paths>`).

## Integration

- Entered at the root with a goal or idea — by a user directly, or by an outer caller (e.g. `super-auto`); recurses into itself, nested, once each promoted subepic's brainstorm returns a spec.
- Invokes `superpowers:brainstorming` — once at the root to produce the root spec (§Root Brainstorm), then once per promoted subepic (§Nested Brainstorms).
- Dispatches `./key-abstractions-prompt.md` (handing it `./design-distillate.md`), `./promotion-reviewer-prompt.md`, `./coverage-reviewer-prompt.md`, `./step-back-prompt.md` (which `super-auto`'s phase-5 fix loop also dispatches, in code mode), and `./graph-pass-prompt.md`, and, in Amend Mode, `./amend-prompt.md` (the only dispatch Amend Mode makes besides the coverage-amend round's `./coverage-reviewer-prompt.md`).
- Runs `./scripts/amend-check` and `./scripts/findings-ledger` (the rebuild after disputes) in Amend Mode (§Amend Mode); `./scripts/coverage-inputs`, `./scripts/coverage-precheck`, `./scripts/requirements-tally`, and `./scripts/coverage-divergence` in the coverage loop (§Coverage), and `./scripts/graph-shape` in §Parallelism Pass; runs `./scripts/findings-ledger` and `./scripts/step-back-check` in §Adversarial Review Loop.
- Offers `superpowers:super-roast` (root only, optional) once the coverage loop passes; consumes its report to drive the fix + auto-re-roast loop — §Adversarial Review Loop.
- Hands off to `superpowers:super-code` (beads mode) or `superpowers:subagent-driven-development` (once per epic's plan in no-beads mode); no-beads mode also uses `superpowers:writing-plans`.
