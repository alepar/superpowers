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
| design mode (A/B) | relayed to every `brainstorming` invocation, root and nested |
| autonomous | the loop-exit and qualifier exceptions (§Adversarial Review Loop) fire; gates still ask unless a recorded approval replays (§Run-State File) |
| roast preference (on/off) | §Adversarial Review Loop's offer is pre-decided either way — never re-asked |
| starting roast round | §Hand-off — resume the cap-3 loop from it rather than from 1 |
| hand-off ownership | §Hand-off's caller-owned branch, and half the precondition of both autonomous exceptions — "the caller owns the hand-off **and** stated the run is autonomous" |

## The Process

1. **Produce the spec** (root only) — invoke `superpowers:brainstorming` on the goal or idea to produce the root spec — §Root Brainstorm. On a re-entry, adopt a spec that already exists — §Re-entry. Nested invocations skip this: they already hold the spec their parent's nested-brainstorm step wrote.
2. **Decompose** the spec into rough child tasks (title, short description, files-touched hint, blocking deps) — §Decomposition.
3. **Promotion review** — dispatch a fresh-context reviewer, sanity-check its verdicts, fix any decomposition-verdict `ISSUES` — §Promotion Review.
4. **Apply promotions** — §Applying Promotions.
5. **Top-split gate** (root only, both modes) — before any descent, the user approves the top-level split (child list + promotion verdicts). One gate, at the most expensive level. If a caller supplied a run-state file and it already records a matching approval, replay it — §Run-State File.
6. For each promoted child, **in dependency order, depth-first** (a child's entire subtree completes before the next sibling starts, so later siblings can read earlier siblings' finished specs): check the tripwire (§Tripwire), then run its nested brainstorm — §Nested Brainstorms — then invoke `superpowers:super-design` on the spec it wrote; that is the recursion.
7. **Root only**, once the tree has settled (every subepic designed, every leaf decomposed, no pending promotions): run the coverage loop — §Coverage.
8. **Root only, optional:** offer `superpowers:super-roast` on the settled tree; on a confirmed-findings verdict, run the fix + auto-re-roast loop — §Adversarial Review Loop.
9. **Root only:** hand off to execution — §Hand-off. A standalone root invocation (when this invocation does not have a caller that owns the hand-off) then invokes `superpowers:upstream-feedback`; throughout the run, append friction events to `<artifact-directory>/friction.md` (or the enclosing run's log when nested) per that skill's format, the moment they happen.

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
| §The Process step 5 / §Coverage | a recorded gate answer — see §Run-State File |
| §Coverage, root integration sweep | an existing `Integration sweep:` bead for this root — adopt it; **never create a second** (two sweeps each fanning in on every leaf split the join) |

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

The rule has one checkable form: **the root must be an epic this run can legitimately close.** If it
genuinely is not — it holds unrelated work, or is a standing tracker meant to outlive this run —
that is a scoping problem to raise with the user before decomposing, not something to route around
by rooting lower on your own.

## Decomposition

Same fields as brainstorming's old beads step: title, short description, files-touched hint, blocking deps per child.

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

Four edge rules, each the generalization of a measured live failure (the coverage loop's
`NARRATIVE-EDGE` check audits the first three — §Coverage):

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

**Check the graph's shape before moving on.** Execution rounds ≈ the longest dependency chain. A
wide body with a long thin tail — a finishing layer written as wire-up → verify → polish — is a
decomposition smell: tails usually re-decompose into per-feature integration beads that run
abreast. And a tail whose beads all declare the same file serializes on execution's hot-file cap
regardless of what the graph permits — declared-file overlap inside an intended-parallel layer
means the file should be split or assigned to a single bead.

- **Beads:** for every child, `bd create ... --parent <id> --no-inherit-labels -l sp:<root-epic-id>` — both flags together, every time. `--no-inherit-labels` alone still strips the wanted root label; without it, parent labels (including `sp:needs-design`) smear onto every leaf. The root invocation creates the epic first, labeled `sp:<its-own-id>`.
- **No beads:** the same fields as a task-table row — see §No-Beads Mode for the columns it must carry.

## Promotion Review

Dispatch `./promotion-reviewer-prompt.md` fresh-context (it must not have authored the spec or task list — countering author bias is the point), giving it the spec, the child task list, the ancestor-goal chain, and the specs of already-designed siblings. It returns per-task `LEAF`/`PROMOTE` verdicts and a decomposition verdict (`COMPLETE`/`ISSUES`).

Sanity-check the verdicts; you may overrule them. **Overruling a `PROMOTE` back to `LEAF` must be recorded on the task** — flag `sp:demoted-by-session` plus the reason — so coverage and the human can see where session judgment overrode the fresh reviewer. Fix any `ISSUES` in the decomposition verdict before applying any promotion.

## Applying Promotions

- **Beads:** `bd update <id> -t epic` (in-place, same id — preserves existing deps), then `bd update <id> --set-metadata sp_depth=<N>` and `--set-metadata sp_order=<per-parent ordinal in dependency order>` (underscores — bd's metadata-key validator rejects hyphens), then label `sp:needs-design`.
- **No beads:** mark the row `sub-plan: <spec path>` (or `needs-design` until the spec is written).

Then run the nested brainstorm on the promoted child.

## Nested Brainstorms

Run in the main session (interactive Mode A can't run in a subagent). Context handed in: the parent spec, the ancestor-goal chain, and the specs of already-designed siblings.

- Inherits the session's design mode; the user can override per-subepic with an explicit request.
- Opens with its own local `## Goal`, seeded from the promotion rationale.
- Does not re-offer the visual companion or super-roast (super-roast is offered once, at the root, after coverage passes) and skips Mode B's per-spec review gate — a Mode B tree's checkpoints are the root spec review, the top-split gate, the tripwire, and coverage arbitration.
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

## Coverage / Gap Loop (root only)

Runs once the tree has settled (§The Process, step 7).

**Hierarchical:**
- **Per-subepic pass:** that subepic's spec + children + parent goal chain, checked against its local `## Goal`.
- **Root pass:** root spec + subepic specs + the full task tree, checked against the root `## Goal`. Beads: dump the tree with `bd list --label sp:<root-epic-id> --json --status all` (not `--parent` — one level only in JSON mode). Above ~15 specs in the tree, subepic spec prose may be summarized to goal/summary sections for scale; the task tree itself is never summarized.

**Each pass runs 3 independent reviewers** (`./coverage-reviewer-prompt.md`, fresh context, model opus) — **input-bounded**: the prompt carries a reviewer's entire window and forbids it tools, so assemble the inputs completely; an `INSUFFICIENT-INPUT` finding means the pass was mis-assembled, not that the reviewer should have roamed; findings are unioned and deduped before arbitration (union, not majority — a miss costs more than a false positive, and arbitration removes false positives anyway). A pass returning fewer than 3 valid reviews is marked **degraded** in the round summary, never silently accepted.

**Ledger:** every arbitrated finding — accepted, rejected, and flag-sweep — is appended (stable id + one-line description) to the arbitration ledger in the artifact directory (§Artifact Location) and committed. Pass its contents to every reviewer; the ledger takes precedence over the flag sweep (an already-arbitrated flagged task is not re-surfaced).

**Rounds are incremental:** round N+1 re-runs only the per-subepic passes whose subtrees changed since round N, plus the root pass (always). **A round's passes are mutually independent — dispatch every pass's reviewers concurrently** (all per-subepic passes and the root pass together, 3 reviewers each): each pass's inputs are assembled before dispatch and no pass reads another's findings — union, dedupe, and arbitration all happen after the fan-out returns. Serializing them buys nothing and multiplies the round's wall-clock by the pass count. The loop ends when a round yields zero accepted findings.

**Arbitration:** present deduped findings to the user — minus any this round already has a recorded disposition for (§Run-State File), which are replayed, not re-asked. Accepted `GAP`: small → leaf task added directly; big → task created → promoted → nested brainstorm → its own super-design subtree (tripwire stays armed). Accepted `ORPHAN`: the user picks delete (scope creep) or add the missing goal element it serves. Accepted `NARRATIVE-EDGE`: drop the edge (`bd dep remove <dependent> <blocker>`) or repoint it (`bd dep remove`, then `bd dep add <dependent> <actual-producer>`), per the finding's proposed fix — question-shaped edges never arrive as this kind (reviewers report those as `UNOWNED-SEAM`, whose contract path replaces the ordering). Accepted `UNOWNED-SEAM`: **before creating either bead, check whether a `Seam contract:` /
`Seam integration:` bead for this boundary already exists — including via a replayed disposition
from the run-state file — and adopt it instead of duplicating it and its edges.** Otherwise create
**two leaf tasks** with the standard flag triple, and wire the tree:

- **`Seam contract: <boundary>`** — delivers **compilable boundary code**, not prose: the interface/types/signatures, the schema fields, and the wiring itself plumbed end-to-end as stubs or defaults (the value must flow even if inert-by-default). Acceptance: compiles, suite green, wiring present. Add a dependency edge from **every participant onto the contract bead** (`bd dep add <participant> <contract>`) — a genuine blocking edge by §Decomposition's own rule (the interface must exist first), not narrative order. Its files-touched hint deliberately spans both sides of the seam; execution merges it before its dependents by construction, so the overlap is expected.
- **`Seam integration: <boundary>`** — depends on that seam's participants only (`bd dep add <integration> <participant>` for each). Delivers: verify the wiring end-to-end, write integration test(s) crossing the seam, see them pass. Small fixes inline; anything larger goes through execution's normal blocker path.
- Append one line to **each participant's** bead description: `boundary contract: <contract-bead-id>`. **`bd update --description` replaces the description wholesale — there is no `--append-description`.** First `bd show <participant>` to read the current description, then re-send the full existing text with the pointer line appended; sending only the pointer line destroys the `owns:`/`consumes:` declarations the coverage reviewers and execution briefs depend on. The pointer flows into execution briefs through the planner with zero execution-side changes.

**Recall floor & fallback net:** if a pass stays degraded or a round otherwise can't be trusted, downgrade coverage to **advisory** and make the gate a **mandatory human read-through of the goal against the full task tree** — disclose this in the round summary, never silently.

**Root integration sweep (after the loop ends):** once the coverage loop yields zero accepted
findings and the tree has ≥2 leaf tasks (seam beads count as leaf tasks too — a `Seam contract:`
bead's own edge onto the sweep would be transitively implied through its dependents anyway, so
counting it here is redundant but harmless), create one final leaf with the standard
flag triple — **`Integration sweep: <root goal, short>`** — depending on **every leaf task
and every `Seam integration:` bead** (its "tests no per-seam bead covers" scope is only
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
Opt-in; declining goes straight to hand-off — and a caller may pre-decide it **either way**
(§Inputs): pre-declined skips to hand-off, pre-accepted runs the roast, and in neither case is the
offerer's question asked — the caller's user already answered it once.

On accept, invoke `superpowers:super-roast` (design mode) on the settled tree, passing per its
Inputs table: the artifact-directory override as its report-location override (so the report lands
beside the specs it is about), **the iteration number from the round count** (without it a later
round's report overwrites an earlier one's file), **`autonomous` when this invocation was told the
run is** (without it super-roast pauses for a human at its loop exits), and on rounds ≥2 the prior
report. The report file is the only cross-iteration state. **Three of its sections drive this loop — reading only
`## Confirmed findings` silently discards the two that most need a human:**

| Report section | What this loop does with it |
|---|---|
| `## Confirmed findings` | One task per finding — the fix queue (steps 1–4 below). |
| `## Escalations (need human)` | **Surface every entry to the human before starting fix work.** These are findings with a dead panel seat, an unresolved external premise, or material dissent between seats — in the recorded PR run, findings with **zero** valid judge votes landed here. They need a human by definition: no verdict was reached, so there is nothing to auto-fix and nothing to auto-dismiss. Never fold them into the fix queue, and never let a `clean` verdict elsewhere in the report imply they were resolved. |
| `## Not verified (beyond panel cap)` | Severe candidates the panel cap left unjudged. Present them next to the escalations and ask whether to re-roast with a raised `config.panelCap` before fixing anything — an unverified Blocking candidate is not a cleared one. |

1. **Create one task per confirmed finding**, with §Decomposition's full `bd create` flag triple (`--parent <root-epic-id> --no-inherit-labels -l sp:<root-epic-id>`) — a fix task outside the epic's descendant tree lets `bd epic close-eligible` close the epic mid-fix. **When an `Integration sweep:` bead already exists for this root, also `bd dep add <sweep> <fix-task>` for each fix task created here** — so the sweep still runs last.
2. **Fix per the normal ladder** — inline for small fixes, interactive design work for large ones
   (may itself promote/nest), subagent-driven implementation for delegable work.
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
     human (or the exit summary, when autonomous) as a **punch list** — file the ones worth
     doing as ordinary tasks with the §Decomposition flag triple, or decline them explicitly;
     do not re-roast to chase them. This exit exists because, without it, a run that has
     genuinely converged still spends round 3 manufacturing marginal findings a human then has
     to shut down by hand.
   - **Thrash** — an iteration resolves nothing: the confirmed-Blocking count did not shrink
     from the prior report. That's thrash, not progress — stop and pause for the human as
     below. (A carried/still-open Blocking lands here, never in the converged exit.)

**Verdict qualifiers gate the exits** — the same rule `brainstorming` applies at its own gate:

- `clean` with **no qualifier** → the loop is done; proceed to hand-off.
- `clean [low coverage]` or `clean [panel-capped: N unverified]` → **not a clearance.** The
  qualifier says the run itself was degraded (dead triage, dead scout, dead dedupe, incomplete
  judging, or zero findings on a non-trivial artifact) or that N severe candidates were never
  judged. Do not auto-proceed: surface the qualifier verbatim and let the user choose to proceed
  anyway, re-roast, or dig in. **Exception when the caller owns the hand-off and stated the run is
  autonomous** (§Run-State File): proceed, record the qualifier, and hand it back verbatim — the
  caller already answered this.
- A confirmed-findings verdict carrying either qualifier → fix as normal, but carry the qualifier
  into the exit summary: a shrinking Blocking count under low coverage is weaker evidence of
  progress than it looks, and the early-stop test above can be fooled by it.

Every exit — cap-out, clean, converged, and thrash — **pauses and summarizes for the human**,
restating any open
escalations, any beyond-panel-cap candidates, the converged exit's punch list (when that exit
fired), and any qualifier still on the verdict; this loop
never declares itself finished, mirroring `super-roast`'s own handoff contract. **Exception when the
caller owns the hand-off and stated the run is autonomous** (§Run-State File): record that same
summary into the run-state file and return it in the hand-off instead of pausing — the caller
surfaces it. The loop still never declares itself finished; it just reports to a caller rather than
a human.

## Hand-off (root only)

What happens once the tree has settled is **conditional on who owns the hand-off**. By default:

- **Beads:** hand off the root epic to `superpowers:super-code`, which owns the epic-scoped `bd ready` loop and the `bd epic close-eligible` fixpoint. Run completion = the root epic is closed.
- **No beads:** run `superpowers:writing-plans` once per epic (a mixed epic still gets a plan for its own leaf tasks); invoke `superpowers:subagent-driven-development`'s plan-file mode once per plan, serially, in dependency order.

**When the caller owns the hand-off** (e.g. an outer sequencer such as `super-auto`, which needs to thread its own flags and hand-off decisions into the next phase), `super-design` still completes the coverage loop (§Coverage) and the adversarial-review offer (§Adversarial Review Loop), then reports the settled tree and stops. **The report back to a caller that owns the hand-off
carries four things beyond the tree**: the root epic id, the roast report paths in order, the number
of roast rounds run, and any verdict qualifier left unresolved. These were already written into the
run-state file as they happened (§Run-State File); hand them back as well so the caller need not
re-read the file to proceed. Symmetrically, **a caller may hand in a starting round number**; resume from it
rather than from 1, or the cap-3 loop silently restarts on every resumed run. The onward invocation
is the caller's to make: `super-code` in beads mode, or, in no-beads mode, `writing-plans` per epic **followed by** `subagent-driven-development`'s plan-file mode (the plan file is not optional — SDD extracts each task's brief from it).

## No-Beads Mode

Same decomposition/promotion/coverage, on paper. Each task-table row needs: a stable id (`<epic-slug>.<ordinal>`), a **depth column**, and a **deps column listing blocker row-ids** — as table data, not prose, or the cursor rule above is unreconstructable. Promoted rows are marked `sub-plan: <spec path>` (or `needs-design` until written). The cursor eligibility rule and tripwire counts run over these columns exactly as beads mode runs them over labels/metadata. Seam machinery included: an accepted `UNOWNED-SEAM` adds `Seam contract:` / `Seam integration:` rows to the task table with their own dependency columns, each participant row gains a `boundary contract: <row>` note, and the root sweep is a final row depending on every leaf row.

## Artifact Location

With no override, specs go to `docs/superpowers/specs/` and the arbitration ledger to
`docs/superpowers/reviews/`. **A caller may hand this invocation a single artifact-directory
override**; when it does, everything this skill produces or causes to be produced goes there
instead — root and nested specs, the arbitration ledger, and the `super-roast` report (relayed as
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
| a parked escalation, beyond-cap item, or verdict qualifier | the round that produced it |
| the caller's phase token, if it supplied one for this stage | entering that stage |
| **each human gate answer, with the shape it approved** | the moment it is given |

**A caller that hands in a run-state file hands in its format contract too** — follow that file's
field names, entry shapes, and relative-path rule exactly; the caller reads these fields back, and
a co-writer that invents its own shapes produces a state file the caller cannot parse.

**When the caller owns the hand-off and stated the run is autonomous**, this skill does not pause
for the human at its own loop exits. Both exits — cap-out and clean-with-a-qualifier — are satisfied
by **recording** what was open into the run-state file and returning it in the hand-off, not by
waiting. The caller surfaces it in its own report. Without this, a run its caller was told to drive
unattended stops inside this invocation, which is the one place the caller holds no control and
cannot rescue it.

**Gate answers are recorded, and replayed rather than re-asked.** Before presenting the top-split
gate (§The Process step 5) or a coverage arbitration round (§Coverage), check the run-state file for
an answer already given:

- **Top-split:** record the approved child ids with their `LEAF`/`PROMOTE` verdicts. On re-entry,
  replay only if the current set matches exactly; if a child was added, removed, or re-verdicted,
  the approval is stale — ask again and say what changed.
- **Coverage:** record each round's dispositions against that round. Replay them; findings a later
  round newly surfaces were never approved and still need an answer.

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
  and `## Not verified (beyond panel cap)` must reach the human too.
- Treat a `clean` verdict carrying `[low coverage]` or `[panel-capped: N unverified]` as a
  clearance — that's a degraded run, and the user decides whether to proceed. **Exception, when a
  caller owns the hand-off and told you it is running autonomously:** the caller already answered
  this — proceed, and hand the qualifier back verbatim for the caller to park. Never drop it, and
  never ask.
- Summarize the task tree for the root coverage pass — only spec prose may be summarized.
- Overrule a `PROMOTE` verdict without recording `sp:demoted-by-session` and the reason.

## Integration

- Entered at the root with a goal or idea — by a user directly, or by an outer caller (e.g. `super-auto`); recurses into itself, nested, once each promoted subepic's brainstorm returns a spec.
- Invokes `superpowers:brainstorming` — once at the root to produce the root spec (§Root Brainstorm), then once per promoted subepic (§Nested Brainstorms).
- Dispatches `./promotion-reviewer-prompt.md` and `./coverage-reviewer-prompt.md`.
- Offers `superpowers:super-roast` (root only, optional) once the coverage loop passes; consumes its report to drive the fix + auto-re-roast loop — §Adversarial Review Loop.
- Hands off to `superpowers:super-code` (beads mode) or `superpowers:subagent-driven-development` (plan-file mode once per epic in no-beads mode); no-beads mode also uses `superpowers:writing-plans`.
