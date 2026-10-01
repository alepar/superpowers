---
name: super-design
description: Use when there's a goal or idea to design out, before execution starts.
---

# super-design

Drive a goal or raw idea through brainstorming into a spec, recursively decompose that spec into a fully-designed task tree, then check the finished tree against its goal before execution starts.

**Core principle:** all traversal state is derived from the tracker (or the spec's task tables in no-beads mode), never from session memory — the run survives context compaction and session restart.

## When to Use

Entered at the root with a goal or a raw idea to design out — no spec exists yet; this skill invokes `superpowers:brainstorming` itself to produce the root spec, then drives every iteration from there. Nested invocations are instead handed a freshly-written spec directly by the parent invocation's own nested-brainstorm step (§Nested Brainstorms) — they skip straight to decomposition.

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
| starting roast round | §Hand-off — resume the cap-3 loop from it rather than from 1 |
| hand-off ownership | §Hand-off's caller-owned branch |

## Gates by Mode

This is the one statement of the design gates; other sections point here.

| Run | Top-split gate (§The Process step 5) | Once the design is ready |
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
the top split (§Gates by Mode), coverage's `ORPHAN` escalation (§Coverage), the tripwire
(§Tripwire), the recall-floor read-through (§Coverage), roast escalations, beyond-cap items,
verdict qualifiers, step-back redesigns, loop exits and Capped Blocking (§Adversarial Review
Loop), and the parallelism pass's unsafe changes (§Parallelism Pass). A protected resource you cannot reach, or a risky or destructive action that would need
confirmation, is not taken: skip that work, record it, and surface it. Large fix work runs as a
Mode B nested brainstorm. The run then proceeds to §Hand-off — to the caller when one owns it,
otherwise to execution, with everything still open restated in the final summary. That is
completion, not a stop.

## The Process

1. **Produce the spec** (root only) — invoke `superpowers:brainstorming` on the goal or idea to produce the root spec — §Root Brainstorm. On a re-entry, adopt a spec that already exists — §Re-entry. Nested invocations skip this: they already hold the spec their parent's nested-brainstorm step wrote.
2. **Decompose** the spec into rough child tasks (title, short description, files-touched hint, blocking deps) — §Decomposition.
3. **Promotion review** — dispatch a fresh-context reviewer, sanity-check its verdicts, fix any decomposition-verdict `ISSUES` — §Promotion Review.
4. **Apply promotions** — §Applying Promotions.
5. **Top-split gate** (root only) — before any descent, the top-level split (child list + promotion verdicts) is decided at one gate, at the most expensive level: asked or applied per §Gates by Mode, and replayed when the run-state file records a matching decision (§Run-State File).
6. For each promoted child, **in dependency order, depth-first** (a child's entire subtree completes before the next sibling starts, so later siblings can read earlier siblings' finished specs): check the tripwire (§Tripwire), then run its nested brainstorm — §Nested Brainstorms — then invoke `superpowers:super-design` on the spec it wrote; that is the recursion.
7. **Root only**, once the tree has settled (every subepic designed, every leaf decomposed, no pending promotions): run the coverage loop — §Coverage.
8. **Root only, optional:** offer `superpowers:super-roast` on the settled tree; on a confirmed-findings verdict, run the fix + auto-re-roast loop — §Adversarial Review Loop.
9. **Root only:** the parallelism pass — measure the settled graph and remove the edges that
   needlessly lengthen its longest chain — §Parallelism Pass.
10. **Root only:** hand off to execution — §Hand-off. A standalone root invocation (when this invocation does not have a caller that owns the hand-off) then invokes `superpowers:upstream-feedback`; throughout the run, append friction events to `<artifact-directory>/friction.md` (or the enclosing run's log when nested) per that skill's format, the moment they happen.

## Re-entry (this skill can be invoked twice on the same goal)

A caller whose session ended mid-run re-invokes this skill on the same goal. **Every step below
adopts what already exists rather than producing a second one.** Root vs. nested is derived, and so
is done-vs-not: check for the artifact a step would produce before producing it.

| Step | Adopt instead of re-producing |
|---|---|
| §Root Brainstorm | a committed root spec already in the artifact directory (or named by the run-state file's spec pointer) — read it and go to §Decomposition |
| §Decomposition, root | an epic already labelled `sp:<its-own-id>` for this goal (or named by the run-state file's epic pointer) — adopt it; **never `bd create` a second root epic** |
| §Decomposition, children | children already under that epic — decompose only what has none |
| §Promotion Review | verdicts already applied (`-t epic` + `sp:needs-design`, or `sp:demoted-by-session`) — re-review only undecided children |
| §The Process step 5 / §Coverage | a recorded top-split decision, and the coverage rounds already spent — see §Run-State File |
| §Coverage, root integration sweep | an existing `Integration sweep:` bead for this root — adopt it; **never create a second** (two sweeps each fanning in on every leaf split the join) |
| §Parallelism Pass | a recorded `graph-pass:` line (§Run-State File) — the pass has run; parked changes stay parked |

**A partially-written artifact is not an adoptable one.** Adopt a spec only if it is committed, and
an epic only if it carries its own `sp:` label — the label flip and the commit are the "done"
markers §Durable State already relies on. Anything half-made gets finished, not adopted.

## Root Brainstorm

Root only. Invoke `superpowers:brainstorming` on the goal or raw idea handed to this invocation — no parent spec, no ancestor-goal chain, no sibling specs to hand in, since none exist yet. Brainstorming runs its full process (worktree, mode selection, questions or one-shot reasoning, design doc, self-review) and returns with a written, committed spec. It does **not** offer adversarial review to a caller-invoked run — that offer is this skill's, once, on the settled tree (§Adversarial Review Loop), so a run has exactly one design-mode roast. Take that spec forward into §Decomposition.

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

## Decomposition

Same fields as brainstorming's old beads step: title, short description, files-touched hint, blocking deps per child.

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

**A spec that enumerates runtime configurations gets a bead that exercises each one, early**
(decided policy — issue #3 design question D). Modes, player counts, platforms, feature-flag
combinations, a test matrix: if the spec lists them, some leaf must *run* each — one decision,
one request, one invocation per configuration — and that leaf must not be only the terminal
readiness gate. Measured: two release-only defects broke 8 of 12 enumerated modes, survived the
suite, code review and every per-bead gate, and were found by the terminal gate running the
modes at the very end. The skill does not know what "a mode" is in a given project — the bead's
description says how to exercise one — but coverage flags an enumeration with no exercising
bead (`UNEXERCISED-CONFIGURATION`).

**Decompose in two explicit steps.** **Step A — split:** carve the spec into minimal
logically-cohesive chunks per the sizing bar below, ignoring narrative/build order while splitting.
**Step B — connect, as a first approximation:** add blocking deps per the edge rules further
down, sparse by the standing "when in doubt, leave it out" policy. Every `bd dep add` you run
here is paired with a `blocked-by <blocker-id>: consumes <artifact>` line in the dependent's
description (below, "Every blocking edge is paired with a reason line"). When connecting reveals a bead
that gates two or more others, re-apply the bottleneck rule to it before moving on — dependent
counts only exist once edges do. The deps you write are a
first approximation by design — the promotion review runs next, and coverage's edge audit
(`NARRATIVE-EDGE`) and seam check (`UNOWNED-SEAM`) refine edges after the tree settles — so do
not agonize over edges; a dedicated audit owns edge quality. Missed work is recoverable — coverage's
`GAP` exists for it. Fused work is what nothing downstream un-fuses: the promotion review's `SPLIT`
catches only the bottleneck case, so Step A's job is to not fuse work that could run apart.

**The sizing bar (Step A):**

- **Cohesion:** a leaf is one merge-worthy deliverable a reviewer accepts or rejects as a
  unit. A description that needs "and then" is two beads.
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

Five edge rules, each the generalization of a measured live failure (the coverage loop's
`NARRATIVE-EDGE` check audits the first three and the fifth — §Coverage):

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
| Coverage repoint (`NARRATIVE-EDGE`) | `bd dep add proj-51 proj-45` | `blocked-by proj-45: consumes parser output schema` |
| Sweep | `bd dep add proj-99 proj-52` | `blocked-by proj-52: consumes all leaves (integration sweep)` |

A seam-contract edge (§Coverage's `UNOWNED-SEAM` wiring) uses the fixed artifact token
`boundary contract`: `blocked-by proj-60: consumes boundary contract`. A sweep edge — the root
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
means the file should be split or assigned to a single bead. §Parallelism Pass measures this on
the settled tree and removes what it safely can; at decomposition, aim to need it little.

- **Beads:** for every child, `bd create ... --parent <id> --no-inherit-labels -l sp:<root-epic-id>` — both flags together, every time. `--no-inherit-labels` alone still strips the wanted root label; without it, parent labels (including `sp:needs-design`) smear onto every leaf. The root invocation creates the epic first, labeled `sp:<its-own-id>`.
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
- **No beads:** mark the row `sub-plan: <spec path>` (or `needs-design` until the spec is written).

Then run the nested brainstorm on the promoted child.

## Nested Brainstorms

Run in the main session (interactive Mode A can't run in a subagent). Context handed in: the parent spec, the ancestor-goal chain, and the specs of already-designed siblings.

- Inherits the session's design mode (always Mode B under `autonomous`); in an interactive run the user can override per-subepic with an explicit request.
- Opens with its own local `## Goal`, seeded from the promotion rationale.
- Does not re-offer the visual companion or super-roast (super-roast is offered once, at the root, after coverage passes) and skips Mode B's per-spec review gate — a Mode B tree's human checkpoint is the design-ready stop (§Gates by Mode). Coverage disposes automatically in every mode, and in Mode B even its `ORPHAN` escalation applies without asking (§Coverage).
- Does not create a new worktree; `using-git-worktrees` idempotently verifies the existing one.
- Once it returns with a written, committed spec, invoke `superpowers:super-design` on that spec — §The Process, step 6; that is the recursion.

## Durable State

| Fact | Carried as (beads) |
|---|---|
| Tree membership | label `sp:<root-epic-id>` on every issue in the tree, **including the root epic** (root detection: an epic whose own id equals its label's suffix) |
| Depth / sibling order | metadata `sp_depth` (root's direct subepics = 1) and `sp_order` (per-parent ordinal, dependency order) on every promoted epic |
| Design pending | label `sp:needs-design` until the nested brainstorm's spec is committed |
| Spec location | recorded on the issue once written |

**Cursor is a query, not a memory:** an epic is eligible for design iff it carries `sp:needs-design` AND every lower-`sp_order` sibling's subtree is fully designed (no `sp:needs-design` anywhere under it). Next work item = the eligible epic, depth-first.

**Write ordering:** commit the nested spec (+ INDEX row) *before* clearing `sp:needs-design` — the label flip is the single "done" marker. No explicit commit step is needed after each `bd` write beyond that (default `--dolt-auto-commit=off` is durable per completed call; never switch to `batch` mode).

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

Runs once the tree has settled (§The Process, step 7).

**Hierarchical:**
- **Per-subepic pass:** that subepic's spec + children + parent goal chain, checked against its local `## Goal`.
- **Root pass:** root spec + subepic specs + the full task tree, checked against the root `## Goal`. Beads: dump the tree to a file with `bd list --label sp:<root-epic-id> --all --json --limit 0` (not `--parent` — one level only in JSON mode; without `--limit 0` bd stops at 50). Above ~15 specs in the tree, subepic spec prose may be summarized to goal/summary sections for scale; the task tree itself is never summarized.

**Canonical requirement list (root pass only).** Before dispatch, the orchestrator — not
any reviewer — derives the canonical requirement list once per round: decompose the root
`## Goal` and root spec into one observable outcome per requirement, numbered R1…Rn. Pass
this same list to all three root-pass reviewers as the `## Requirements (canonical)` input
(§`coverage-reviewer-prompt.md`); per-subepic passes do not enumerate and get this section
empty. **R-ids are stable across rounds and resumes:** round 1 derives R1…Rn and writes them
into the run-state file's `coverage-round-1` record (no run-state file: into the coverage ledger's
round-1 header); round 2 (or a resume) **reads that list back** rather than re-deriving it, appending any `R-new: <text>` a round-1 reviewer proposed as the
next free id — an existing id is never renumbered or reused. After the three reviewers
return, save the canonical list (one `R<n> <text>` per line) and each root-pass reviewer's
output to files in the artifact directory (`coverage-round-<N>-requirements.md`,
`coverage-round-<N>-root-<k>.md`) and run `bash <base>/scripts/requirements-tally
<canonical> <review-1> <review-2> <review-3>`. Its first line (`requirements: N · mapped: M ·
unmapped: K (R3, R7)`) goes into the round summary and the `coverage-round-<N>` record; its
`r-new:` lines are the proposals to append; a `no-block:` line means that review is not valid
for this pass. The line summarizes: each unmapped requirement was already reported as a `GAP`
(§`coverage-reviewer-prompt.md` check 0).

**Mechanical checks run before dispatch, once per round.** Run `bash <base>/scripts/coverage-precheck
--from <the tree dump> <root-epic-id> <coverage ledger>` (`<base>` is this skill's base
directory; if it prints a line starting `JQ_UNAVAILABLE:`, follow its instruction and produce
the same output format). Every line it prints
other than `citation: … blocker` and the summary is a finding you file yourself, already
verified: `flag-sweep:` (a flagged task the ledger has not disposed — the fix is yours to
choose: promote and design it, keep it as a leaf with a rationale, or split it), `unstated:`
(a `NARRATIVE-EDGE` — write the missing `blocked-by` line naming the artifact, or drop the
edge), and `citation: … dependent|unwired|unknown` (an `UNSATISFIABLE-ACCEPTANCE`; `unknown`
means the cited id is not in the tree — correct the citation). Pass the output to every
reviewer as its `## Precomputed graph checks` input.

**Each pass runs 3 independent reviewers** (`./coverage-reviewer-prompt.md`, fresh context, model opus) — **input-bounded**: the prompt carries a reviewer's entire window and forbids it tools, so assemble the inputs completely; an `INSUFFICIENT-INPUT` finding means the pass was mis-assembled, not that the reviewer should have roamed; findings are unioned and deduped before disposition (union, not majority — a miss costs more than a false positive, and the verify step below removes false positives anyway). A pass returning fewer than 3 valid reviews is marked **degraded** in the round summary, never silently accepted.

**Ledger:** every disposed finding — applied, rejected, escalated, and flag-sweep — is appended to the coverage ledger in the artifact directory (§Artifact Location) and committed, one line each: `<ledger-id> · r<N> · <TYPE> · <subject> · <disposition> — <one line>` (the precheck skips a flagged task that has an entry with TYPE `flag-sweep` and the task id as its subject). Pass its contents to every reviewer.

**Findings file.** After a round's union and dedupe (precheck findings included), write `coverage-findings-round-<N>.md` to the artifact directory, one deduped finding per line: `<TYPE> · <subject> · <one line>`. The subject is the finding's identity: the task id; `<dependent><-<blocker>` for an edge; the boundary name for a seam; the R-id for a `GAP` that has one, else the goal element in a few words. Choosing the subject is the judgment; the comparison below is mechanical.

**Rounds are incremental:** round N+1 re-runs only the per-subepic passes whose subtrees changed since round N, plus the root pass (always). **A round's passes are mutually independent — dispatch every pass's reviewers concurrently** (all per-subepic passes and the root pass together, 3 reviewers each): each pass's inputs are assembled before dispatch and no pass reads another's findings — union, dedupe, and disposition all happen after the fan-out returns. Serializing them buys nothing and multiplies the round's wall-clock by the pass count. The loop runs **at most two rounds** — see below.

**Two rounds, fixed.** Round 1 always runs. Round 2 runs iff round 1 applied at least one fix
that changed the tree — a round 1 with nothing to apply is the loop's clean exit. Once round
2's fixes are applied the loop ends: **there is no round 3, and round 2's own fixes are never
re-reviewed.** That is the priced cost of a fixed cap, and it is what the changed-since input
below and the root integration sweep exist to absorb — the sweep implements what the reviewers
missed, and it runs regardless. **Round 2 dispatches only once every round-1 fix is fully
applied** — a new-subepic `GAP`'s nested subtree included, which means waiting for that subtree to
finish designing; dispatching earlier reviews a tree with a known hole in it and spends the run's
last round on findings that describe the hole.

**The changed-since input.** Round 1's fixes are applied with no human in the path, and round 2
is the only thing that will ever see them. Assemble round 2's `## Changes since the previous
round` section (empty on round 1) naming every task round 1's applied fixes created or amended,
each with the finding it answers. The reviewers check those as they check any task, plus the two
questions only this section can ask: does the fix close the finding it claims to, and did it
introduce a seam, edge, or acceptance criterion of its own?

**Divergence observation.** A loop can refine instead of converge; the two-round cap is the
brake, so this is a report rather than a question. On round 2, before disposition, run `bash
<base>/scripts/coverage-divergence <round-1 findings file> <round-2 findings file>` and put its
three lines (count trajectory, novel fraction, `widening: yes|no`) in the round summary either
way. A widening round 2 is the strongest evidence the tree needs a look the cap will not give
it, and nothing else in the loop will say so.

**Disposition is automatic — there is no arbitration prompt.** Every deduped finding is verified,
then applied; a finding this round already has a recorded disposition for (§Run-State File) is
replayed, not re-applied.

**Verify, then apply.** The reviewer prompt tells reviewers to surface anything plausible; the
false-positive filter runs here: check each finding's evidence against the very inputs its pass
was assembled from — the ids it cites resolve in the task tree, the description text it quotes is
really there, the dependency path it claims exists, no ledger entry already covers it (a
`ledger:`-tagged finding with no new evidence is a duplicate: drop it without a new entry). A
finding whose evidence does not hold is **rejected to the ledger with the one-line reason**, never
applied and never escalated. This is a check against
the assembled inputs, not a re-review: do not go read the repo to adjudicate one, and never reject
a finding for being expensive to fix.

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
the round summary.

Every other type applies silently, in every mode. `INSUFFICIENT-INPUT` is neither applied nor
escalated — it says the pass was mis-assembled: fix the assembly and re-dispatch that one pass
inside the same round; a second `INSUFFICIENT-INPUT` from the re-dispatched pass marks the round
**degraded** (the recall floor below) rather than spending a third dispatch on it.

**The fixes, by type.** Verified `GAP`: small → leaf task added directly; big → a new subepic,
as above. Verified `NARRATIVE-EDGE`: drop the edge (`bd dep remove <dependent> <blocker>`) or repoint it (`bd dep remove`, then `bd dep add <dependent> <actual-producer>`), per the finding's proposed fix — question-shaped edges never arrive as this kind (reviewers report those as `UNOWNED-SEAM`, whose contract path replaces the ordering); a repoint updates the dependent's `blocked-by <blocker-id>: consumes <artifact>` line to name the new producer and artifact, through the existing wholesale `bd update --description` rule (dropping the edge drops the line the same way). Any verified finding whose fix splits or shrinks an existing bead — moving scope out of it — follows §Splitting a Bead, dependents re-pointed included. Verified `UNSATISFIABLE-ACCEPTANCE`: apply the finding's proposed fix — restate the criterion in terms of an artifact that exists when the task completes (`bd update <id> --description` with the full amended text, keeping or adding the `(needs: <id>)` citation so the next round can check it by graph), or re-point the edge so the referenced validator genuinely precedes the task; an `unwired` variant (a cited bead no edge connects) adds the missing edge (`bd dep add <task> <cited>`) and, in the same `bd update --description`, the `blocked-by <cited>: consumes <artifact>` line naming what the citation resolves to. Verified `UNEXERCISED-CONFIGURATION`: add one leaf with the standard flag triple — **`Configuration smoke: <the enumerated configurations>`** — whose deliverable is a runnable one-step exercise of *each* configuration (the description states the command or entry point per configuration), depending on the beads that make those configurations runnable and wired under the integration sweep like any leaf, so it runs as soon as the configurations exist rather than at the terminal gate; or, when one existing bead can absorb it without becoming a bottleneck, extend that bead's description and acceptance instead. Verified `UNOWNED-SEAM`: **before creating either bead, check whether a `Seam contract:` /
`Seam integration:` bead for this boundary already exists — including via a replayed disposition
from the run-state file — and adopt it instead of duplicating it and its edges.** Otherwise create
**two leaf tasks** with the standard flag triple, and wire the tree:

- **`Seam contract: <boundary>`** — delivers **compilable boundary code**, not prose: the interface/types/signatures, the schema fields, and the wiring itself plumbed end-to-end as stubs or defaults (the value must flow even if inert-by-default). Acceptance: compiles, suite green, wiring present. Add a dependency edge from **every participant onto the contract bead** (`bd dep add <participant> <contract>`) — a genuine blocking edge by §Decomposition's own rule (the interface must exist first), not narrative order — and write `blocked-by <contract-id>: consumes boundary contract` into each participant's description (the fixed artifact token for this edge kind; see "Every blocking edge is paired with a reason line" above). Its files-touched hint deliberately spans both sides of the seam; execution merges it before its dependents by construction, so the overlap is expected.
- **`Seam integration: <boundary>`** — depends on that seam's participants only (`bd dep add <integration> <participant>` for each), with `blocked-by <participant-id>: consumes <that participant's owned boundary>` written into the integration bead's own description for each one. Delivers: verify the wiring end-to-end, write integration test(s) crossing the seam, see them pass. Small fixes inline; anything larger goes through execution's normal blocker path.
- Append one line to **each participant's** bead description: `boundary contract: <contract-bead-id>`. **`bd update --description` replaces the description wholesale — there is no `--append-description`.** First `bd show <participant>` to read the current description, then re-send the full existing text with the pointer line appended; sending only the pointer line destroys the `owns:`/`consumes:` declarations the coverage reviewers and execution briefs depend on. The pointer flows into execution briefs through the planner with zero execution-side changes.

**Recall floor & fallback net:** if a pass stays degraded or a round otherwise can't be trusted, downgrade coverage to **advisory** and make the gate a **mandatory human read-through of the goal against the full task tree** — disclose this in the round summary, never silently. In a non-interactive run (above) there is no one to read it through: record the downgrade as a parked qualifier and hand it back verbatim, the way a degraded roast verdict is parked.

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

**Step back before fixing.** Every round whose report has confirmed findings, before step 1,
dispatch `./step-back-prompt.md` (mode `design`, model opus, fresh context, never an agent that
does the fixes) with every roast report of this loop so far, the settled tree, and every prior
step-back record. Save its output beside the report and record `stepBack-round-<N>` in the
run-state file, both as the template specifies. On `patch`, continue with step 1. On `redesign`:
interactive (§Gates by Mode), present it with its recommendation and let the human choose;
unattended, apply it when its `scope` is `inside`, and when it is `outside` record it as `parked`,
patch this round's findings, and surface it at the loop exit. Applying a redesign means amending
the spec(s) where the changed decision is stated and restructuring the affected tasks through
step 2; its `dissolves` findings get no fix task (the step-back file records why), its `remains`
findings go through step 1, and step 3 re-roasts, since a design decision changed.

1. **Create one task per confirmed finding**, with §Decomposition's full `bd create` flag triple (`--parent <root-epic-id> --no-inherit-labels -l sp:<root-epic-id>`) — a fix task outside the epic's descendant tree lets `bd epic close-eligible` close the epic mid-fix. **When an `Integration sweep:` bead already exists for this root, also `bd dep add <sweep> <fix-task>` for each fix task created here** — so the sweep still runs last — pairing each with `blocked-by <fix-task-id>: consumes all leaves (integration sweep)` in the sweep's description, the same fixed artifact token every sweep edge uses.
2. **Fix per the normal ladder** — inline for small fixes; design work in the run's mode for large
   ones (a Mode B nested brainstorm when unattended; may itself promote/nest); a dispatched fixer
   (Sonnet-class is fine) for delegable work. Whoever fixes gets every round's report path and
   every applied redesign, not just this round's, so a patch does not reopen what an earlier round
   closed or undo a chosen redesign.
3. **Auto-decide re-roast by fix scope:**
   - Mechanical, single-file fixes with no design change → done, no re-roast.
   - Fixes that changed a design decision, changed data handling, or resolved multiple Blocking
     findings → re-invoke `superpowers:super-roast`, passing the prior report so it can skip
     re-litigating what it already cleared.
4. **Cap at 3 iterations.** Two early exits, opposite in meaning — check the convergence one
   first:
   - **Converged** — the report's verdict carries `[converged]` (a non-degraded round ≥ 2
     confirming zero Blocking of any provenance: no new, no carried, no regressed — see
     super-roast's Report format / `reporter-prompt.md` Steps 3–4). The roast has nothing
     Blocking left to find; another fix + re-roast round is diminishing returns by
     construction. Exit the loop, and hand the remaining sub-Blocking confirmations to the
     human (or the exit summary, when unattended) as a **punch list** — file the ones worth
     doing as ordinary tasks with the §Decomposition flag triple, or decline them explicitly;
     do not re-roast to chase them. This exit exists because, without it, a run that has
     genuinely converged still spends round 3 manufacturing marginal findings a human then has
     to shut down by hand.
   - **Thrash** — an iteration resolves nothing: the confirmed-Blocking count did not shrink
     from the prior report. That's thrash, not progress — stop and pause for the human as
     below. (A carried/still-open Blocking lands here, never in the converged exit.)

   **Capped Blocking — the cap is a cost control, not a clearance.** When round 3 (the cap)
   still ends with a confirmed-Blocking verdict, extend the cap by exactly ONE round — one more
   fix + re-roast — and require that extension to come back clean or `[converged]`. If the
   extension still ends Blocking, three-plus independent rounds called the same kernel
   defective and the latest fixes are unverified. Record `capped-blocking` in the run-state
   file with the unresolved Blocking finding ids and the extension round's report path, then:
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
open escalations, any beyond-panel-cap candidates, any parked redesign, the converged exit's punch
list (when that exit fired), and any qualifier still on the verdict. An unqualified `clean`
proceeds to §Parallelism Pass after its summary; every other exit **pauses** there. This loop never
declares itself finished, mirroring `super-roast`'s own handoff contract. Unattended (§Unattended
Runs): no exit pauses — record the summary into the run-state file (or the final summary, when
there is none) and proceed to the design-ready point (§Gates by Mode); Capped Blocking follows
its own rule above.

## Parallelism Pass (root only)

Runs once, after the roast loop exits or is declined, and before the design-ready point (§Gates
by Mode). The coverage loop audited each edge on its own; this pass looks at the whole graph:
execution spends one round per bead along the longest chain, so an edge on that chain that
carries no real artifact costs a round on every run. Low-hanging fruit only: it changes edges,
never scope, and creates no beads.

1. **Measure.** Dump the tree (`bd list --label sp:<root-epic-id> --all --json --limit 0`) and
   run `bash <base>/scripts/graph-shape --from <dump> <root-epic-id>` (if it prints a line
   starting `JQ_UNAVAILABLE:`, follow its instruction and produce the same output format). It
   prints the `shape:` line (leaves, depth, width = leaves/depth, the critical path), one
   `edge:` line per candidate with the depth if only that edge were removed, and a summary.
   Seam-contract and integration-sweep edges are exempt by construction. With zero candidates,
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

Same decomposition/promotion/coverage, on paper. Each task-table row needs: a stable id (`<epic-slug>.<ordinal>`), a **depth column**, and a **deps column listing blocker row-ids** — as table data, not prose, or the cursor rule above is unreconstructable. Promoted rows are marked `sub-plan: <spec path>` (or `needs-design` until written). The cursor eligibility rule and tripwire counts run over these columns exactly as beads mode runs them over labels/metadata. Seam machinery included: an accepted `UNOWNED-SEAM` adds `Seam contract:` / `Seam integration:` rows to the task table with their own dependency columns, each participant row gains a `boundary contract: <row>` note, and the root sweep is a final row depending on every leaf row.

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
| `stepBack-round-<N>: patch \| redesign — <one line>` (format: `./step-back-prompt.md`), one line per round, appended | that round's step-back decision is made |
| the caller's phase token, if it supplied one for this stage | entering that stage |
| **each top-split decision, asked or applied, with the shape it covers** | the moment it is made |
| `capped-blocking`, with the unresolved Blocking ids, the extension report, and stopped or proceeded | the extension round ends Blocking |
| **each coverage round's dispositions, under that round's number** | that round's fixes are applied |
| `graph-pass: depth <D>→<D'> · width <W>→<W'> · applied <n> · parked <m>` | §Parallelism Pass step 4 |

**A caller that hands in a run-state file hands in its format contract too** — follow that file's
field names, entry shapes, and relative-path rule exactly; the caller reads these fields back, and
a co-writer that invents its own shapes produces a state file the caller cannot parse.

**Gate decisions are recorded, and replayed rather than re-made.** Before deciding the top split
(§The Process step 5) or running a coverage round (§Coverage), check the run-state file for what
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
- Start a roast round's fix work before its step-back pass has decided `patch` or `redesign`, or
  hand a fixer only the latest round's report.
- Summarize the task tree for the root coverage pass — only spec prose may be summarized.
- Apply a parallelism-pass change marked `safe no`, or any proposal, in an unattended run — park
  it; or touch a seam-contract or integration-sweep edge in that pass.
- Run a third coverage round, or spend a fresh pair of rounds on a resume — the cap is two per run
  and the run-state file says how many are left (§Coverage, §Run-State File).
- Ask the user to dispose of a coverage finding, or to confirm a recommended split or promotion.
  Exactly one escalation exists — an `ORPHAN` — and only in an interactive run; every other type
  applies without asking.
- Apply a coverage finding without checking its evidence against the pass inputs. The reviewers are
  instructed to over-report; the verify step is the only thing standing in for the human who used
  to arbitrate.
- Overrule a `PROMOTE` verdict without recording `sp:demoted-by-session` and the reason.
- Ask the human to approve the top split in a one-shot or `autonomous` run, or stop an
  `autonomous` run anywhere after launch — §Gates by Mode.
- Add a blocking edge (`bd dep add`, any site) without pairing it with a `blocked-by <blocker-id>:
  consumes <artifact>` line in the dependent's description — coverage's `NARRATIVE-EDGE` check
  cannot audit an edge whose reason isn't written down.

## Integration

- Entered at the root with a goal or idea — by a user directly, or by an outer caller (e.g. `super-auto`); recurses into itself, nested, once each promoted subepic's brainstorm returns a spec.
- Invokes `superpowers:brainstorming` — once at the root to produce the root spec (§Root Brainstorm), then once per promoted subepic (§Nested Brainstorms).
- Dispatches `./promotion-reviewer-prompt.md`, `./coverage-reviewer-prompt.md`, `./step-back-prompt.md` (which `super-auto`'s phase-5 fix loop also dispatches, in code mode), and `./graph-pass-prompt.md`.
- Runs `./scripts/coverage-precheck`, `./scripts/requirements-tally`, and `./scripts/coverage-divergence` in the coverage loop (§Coverage), and `./scripts/graph-shape` in §Parallelism Pass.
- Offers `superpowers:super-roast` (root only, optional) once the coverage loop passes; consumes its report to drive the fix + auto-re-roast loop — §Adversarial Review Loop.
- Hands off to `superpowers:super-code` (beads mode) or `superpowers:subagent-driven-development` (once per epic's plan in no-beads mode); no-beads mode also uses `superpowers:writing-plans`.
