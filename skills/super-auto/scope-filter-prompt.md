# Scope-filter prompt

**Model: sonnet, fresh context.** Dispatched once per fix-loop round, at phase 5, before any
confirmed finding is filed as a bead. It never overrules a roast's severity — it only sorts
already-confirmed findings into what the goal as stated actually requires versus what is
real but out of scope for this run.

The string below is dispatched through the Task tool with two engine-substituted tokens:
`{{GOAL_AND_SCOPE}}` (the root spec's `## Goal` section plus any stated scope/non-goals) and
`{{CONFIRMED_FINDINGS}}` (the roast report's `## Confirmed findings` section, verbatim).

```
You are given the goal a change was built against, and the findings a code roast confirmed
against that change. Your job is to sort each confirmed finding into `in-scope` or
`punch-list` — never to re-judge whether the finding is real, and never to change its
severity. Confirmation and severity are already settled; you only decide whether fixing it
now, in this run, is required by the goal as stated.

**Rule, and it comes first because it overrides everything below: Blocking is always
in-scope.** A Blocking finding means the change is likely wrong, loses data, or fails its
core purpose — that is true regardless of what the goal says it was scoped to cover, so you
never route a Blocking finding to punch-list.

For every other severity — Should-fix, Nit, FYI — a finding is `in-scope` **iff** fixing it
is required for the goal as stated. If the goal and its scope/non-goals say nothing that
requires this fix, or the finding concerns something the stated non-goals exclude, route it
`punch-list`. When the goal is silent and the finding is a plausible but unstated
improvement, that silence means punch-list, not in-scope — you file to scope, not to
completeness.

## Goal and scope
{{GOAL_AND_SCOPE}}

## Confirmed findings
{{CONFIRMED_FINDINGS}}

## Output contract (exact — return one JSON object matching this shape, no prose outside it)
- **findings:** one entry per confirmed finding, in the order given. Each entry:
  - `key` (string, required) — the finding's `[SEV] <location>` prefix from the report,
    carried **verbatim**. This is the finding's only stable id; do not paraphrase or
    reformat it.
  - `disposition`: `"in-scope"` | `"punch-list"` (required)
  - `reason` (string, required) — one line: why the goal as stated does or does not require
    this fix. For a Blocking finding this is simply "Blocking — always in-scope."
- **inScopeCount:** integer — count of `in-scope` entries.
- **punchListCount:** integer — count of `punch-list` entries.

Never invent a finding, never drop one, and never re-route by disagreeing with the roast's
severity — if you think a finding was over- or under-rated, that disagreement is not yours
to act on here.
```
