---
name: super-plan
description: Use when a brainstormed spec is approved and before execution starts — recursively decomposes it into a fully-designed task tree (promotion review → nested brainstorm), then goal-coverage-checks the finished tree before hand-off.
---

# super-plan

Recursively decompose an approved spec into a fully-designed task tree, then check the finished tree against its goal before execution starts.

**Core principle:** all traversal state is derived from the tracker (or the spec's task tables in no-beads mode), never from session memory — the run survives context compaction and session restart.

## When to Use

Entered at the end of every brainstormed spec — both design modes, with or without `bd`. `brainstorming`'s transition step invokes `superpowers:super-plan` on the spec it just wrote.

Root vs. nested is **derived, not remembered**: nested iff a parent spec was handed to this invocation. Only the root invocation runs the coverage loop (§Coverage) and the final hand-off (§Hand-off). Base case for any invocation: no child qualifies for promotion → this subtree is done.

## The Process

1. **Decompose** the spec into rough child tasks (title, short description, files-touched hint, blocking deps) — §Decomposition.
2. **Promotion review** — dispatch a fresh-context reviewer, sanity-check its verdicts, fix any decomposition-verdict `ISSUES` — §Promotion Review.
3. **Apply promotions** — §Applying Promotions.
4. **Top-split gate** (root only, both modes) — before any descent, the user approves the top-level split (child list + promotion verdicts). One gate, at the most expensive level.
5. For each promoted child, **in dependency order, depth-first** (a child's entire subtree completes before the next sibling starts, so later siblings can read earlier siblings' finished specs): check the tripwire (§Tripwire), then run its nested brainstorm — §Nested Brainstorms. The nested brainstorm ends by invoking `superpowers:super-plan` again on the spec it wrote; that is the recursion.
6. **Root only**, once the tree has settled (every subepic designed, every leaf decomposed, no pending promotions): run the coverage loop — §Coverage.
7. **Root only, optional:** offer `superpowers:super-roast` on the settled tree; on a confirmed-findings verdict, run the fix + auto-re-roast loop — §Adversarial Review Loop.
8. **Root only:** hand off to execution — §Hand-off.

## Decomposition

Same fields as brainstorming's old beads step: title, short description, files-touched hint, blocking deps per child.

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
- Ends, as always, by invoking `superpowers:super-plan` on the spec it wrote.

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

Runs once the tree has settled (§The Process, step 6).

**Hierarchical:**
- **Per-subepic pass:** that subepic's spec + children + parent goal chain, checked against its local `## Goal`.
- **Root pass:** root spec + subepic specs + the full task tree, checked against the root `## Goal`. Beads: dump the tree with `bd list --label sp:<root-epic-id> --json --status all` (not `--parent` — one level only in JSON mode). Above ~15 specs in the tree, subepic spec prose may be summarized to goal/summary sections for scale; the task tree itself is never summarized.

**Each pass runs 3 independent reviewers** (`./coverage-reviewer-prompt.md`, fresh context, model opus); findings are unioned and deduped before arbitration (union, not majority — a miss costs more than a false positive, and arbitration removes false positives anyway). A pass returning fewer than 3 valid reviews is marked **degraded** in the round summary, never silently accepted.

**Ledger:** every arbitrated finding — accepted, rejected, and flag-sweep — is appended (stable id + one-line description) to `docs/superpowers/specs/<root-slug>-coverage-ledger.md` and committed. Pass its contents to every reviewer; the ledger takes precedence over the flag sweep (an already-arbitrated flagged task is not re-surfaced).

**Rounds are incremental:** round N+1 re-runs only the per-subepic passes whose subtrees changed since round N, plus the root pass (always). The loop ends when a round yields zero accepted findings.

**Arbitration:** present deduped findings to the user. Accepted `GAP`: small → leaf task added directly; big → task created → promoted → nested brainstorm → its own super-plan subtree (tripwire stays armed). Accepted `ORPHAN`: the user picks delete (scope creep) or add the missing goal element it serves.

**Recall floor & fallback net:** if a pass stays degraded or a round otherwise can't be trusted, downgrade coverage to **advisory** and make the gate a **mandatory human read-through of the goal against the full task tree** — disclose this in the round summary, never silently.

## Adversarial Review Loop (root only)

Runs once the coverage loop passes (§Coverage), before hand-off. Offered once, at the root, the
same offer brainstorming makes on a single un-decomposed spec — a decomposed tree gets it here
instead, after the tree has settled, since that's the first point a full design exists to review.
Opt-in; declining goes straight to hand-off.

On accept, invoke `superpowers:super-roast` (design mode) on the settled tree. Its report's
`## Confirmed findings` section is the only cross-iteration state:

1. **Create one task per confirmed finding.**
2. **Fix per the normal ladder** — inline for small fixes, interactive design work for large ones
   (may itself promote/nest), subagent-driven implementation for delegable work.
3. **Auto-decide re-roast by fix scope:**
   - Mechanical, single-file fixes with no design change → done, no re-roast.
   - Fixes that changed a design decision, changed data handling, or resolved multiple Blocking
     findings → re-invoke `superpowers:super-roast`, passing the prior report so it can skip
     re-litigating what it already cleared.
4. **Cap at 3 iterations.** Also stop early if an iteration resolves nothing — the confirmed-Blocking
   count did not shrink from the prior report — that's thrash, not progress.

Both exits — cap-out and clean — **pause and summarize for the human**; this loop never declares
itself finished, mirroring `super-roast`'s own handoff contract.

## Hand-off (root only)

Always `superpowers:subagent-driven-development`.

- **Beads:** hand off the root epic. SDD scopes ready work to `bd ready --exclude-type=epic --label sp:<root-epic-id>` and loops `bd epic close-eligible` to fixpoint. Run completion = the root epic is closed.
- **No beads:** run `superpowers:writing-plans` once per epic (a mixed epic still gets a plan for its own leaf tasks); invoke SDD's plan-file mode once per plan, serially, in dependency order.

## No-Beads Mode

Same decomposition/promotion/coverage, on paper. Each task-table row needs: a stable id (`<epic-slug>.<ordinal>`), a **depth column**, and a **deps column listing blocker row-ids** — as table data, not prose, or the cursor rule above is unreconstructable. Promoted rows are marked `sub-plan: <spec path>` (or `needs-design` until written). The cursor eligibility rule and tripwire counts run over these columns exactly as beads mode runs them over labels/metadata.

## Conventions

- Every spec (root and nested) opens with `## Goal` — one or two sentences, an observable outcome. Coverage consumes it verbatim.
- Subepic spec naming: `docs/superpowers/specs/YYYY-MM-DD-<root-slug>--<sub-slug>-design.md` (deeper levels extend the double-dash chain). Each nested spec's header links its parent spec and its bead id.
- Every nested spec gets its own INDEX.md row, tagged with the root slug.

## Red Flags

**Never:**
- Run the coverage loop or hand-off from a nested (non-root) invocation.
- Create a child without both `--no-inherit-labels` and an explicit `-l sp:<root-epic-id>` on the same `bd create` call.
- Query `bd ready` without `--exclude-type=epic --label sp:<root-epic-id>` — bare `bd ready` is repo-global and epic-inclusive.
- Demote an epic to a task without first confirming `bd children <id> --json` is empty.
- Treat an empty ready set as run completion — completion is the root epic closed.
- Summarize the task tree for the root coverage pass — only spec prose may be summarized.
- Overrule a `PROMOTE` verdict without recording `sp:demoted-by-session` and the reason.

## Integration

- Invoked by `superpowers:brainstorming` at the end of every spec, root and nested.
- Dispatches `./promotion-reviewer-prompt.md` and `./coverage-reviewer-prompt.md`.
- Offers `superpowers:super-roast` (root only, optional) once the coverage loop passes; consumes its report to drive the fix + auto-re-roast loop — §Adversarial Review Loop.
- Hands off to `superpowers:subagent-driven-development` (beads mode, or plan-file mode once per epic in no-beads mode); no-beads mode also uses `superpowers:writing-plans`.
