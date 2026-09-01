---
name: upstream-feedback
description: Use when a super-* run finishes (its finish hook invokes this), or when the user asks to file feedback, defect reports, or improvement reports about skill behavior with the upstream skill repository. Not for filing issues about the project under development — that belongs in the project's own tracker.
---

# upstream-feedback

Turn a run's friction into a user-gated GitHub issue on the skill plugin's owning repository:
gather diagnostics → dispatch an independent analyst → triage → propose to the user →
optionally scrub → file → record.

**Core principle:** the run is the best defect detector the skills have, but filing is
outward-facing — every issue is proposed, optionally anonymized, and shown in final form to the
user before anything leaves the machine. A clean run files nothing.

## The friction log (written by the enclosing run, read here)

One append-only file per run, one line per event, written **the moment something happens**:

```
- [<date> <phase/round>] <what happened> — <why it might be upstream-worthy>
```

Locations: super-auto run → `<run-dir>/friction.md`; standalone super-code run →
`<workspace>/friction.md` beside the ledger; standalone super-design run →
`<artifact-directory>/friction.md`. Nested super-* invocations append to the enclosing run's
log; a standalone super-roast skips it (its report is already the feedback channel). **Durability
differs by location:** the super-auto run dir and the super-design artifact directory are
COMMITTED directories — the log is committed together with that run's other writes, so it survives
worktree cleanup and machine moves. Standalone super-code's `<workspace>/friction.md` has no such
commit point: it is workspace-lifetime only. This analysis runs before Finish's worktree cleanup,
by hook order, so a normal run reads it intact — but a destroyed-worktree resume loses whatever
friction was recorded before the destruction. That is a stated limitation of standalone super-code,
not a surprise to debug. Log on: a
defect hit in skill machinery or guidance, a workaround applied, guidance that read wrong or
ambiguous when followed literally, a visible stall or waste, an adaptation forced to diverge.
Bar: "this surprised me or cost me something." No analysis at write time — the finish pass
discards noise; it cannot recover unrecorded moments.

**Only the OUTERMOST super-* invocation runs this skill's analysis** — inner invocations only
append. A standalone run is its own outermost.

## The Process

1. **Gather** (no dispatch): the friction log; the run ledger (when available — a standalone
   super-design run has none); `parallelism:` detector lines (when available — these are Workflow
   log output, recoverable only from the invoking session's own capture per
   `coordinator-workflow.md`'s Finish note, never from a file); roast verdict/`delta vs prior`
   lines; `run.md`; a graph-shape summary when a bead tree exists (open count, rounds ≈ longest
   chain, width per round); the installed plugin version (`plugin.json` in the plugin cache).
   Gather what exists; name what was unavailable in the report's `## Not established` section
   rather than silently omitting it.
2. **Analyze** — dispatch ONE fresh-context subagent, **model: opus, or the strongest
   analyst-class model the harness actually offers** (a non-Claude runtime names its own — the
   requirement is fresh context and the top tier available, not a vendor), with
   `./analyst-prompt.md` and the gathered inputs. It returns candidate findings or none. Name
   the model that ran in the report's `## Not established` section when it was not opus.
3. **Triage** — drop anything failing the worthiness bar (it is in the analyst prompt, but the
   analyst errs toward recall; you err toward precision): generalizes beyond this project,
   actionable upstream, evidence from this run. **Zero survivors → say "no upstream-worthy
   findings this run" and stop.** Do not manufacture findings to appear useful.
4. **Draft** the report per `./report-template.md` — one rollup document for the whole run.
5. **Propose** to the user: the findings summary, the target repo (the providing plugin's
   `plugin.json` `repository` field — typically `alepar/superpowers` — overridable here), and
   two questions: file it? scrub it? **In an autonomous run, do not interrupt:** park the draft
   in the run's friction-log directory (per the Locations above) and commit it with the run's
   other writes — worktree removal must not destroy it — then present this proposal at the run's
   finish menu.
6. **Scrub** (only if the user opted in): replace project/repo names, domain nouns, file paths,
   bead ids, and human names with role-generic equivalents ("a shared adapter file four tail
   beads touch"). Keep counts, timings, graph shapes, percentages, skill/mechanism/config names,
   and error messages (paths inside them scrubbed). If scrubbing a detail would make a finding
   unactionable, flag that finding to the user instead of silently weakening it.
7. **Confirm** — show the user the final issue body verbatim (scrubbed or not). Only after
   their yes:
8. **File** — check `gh label list -R <owner/repo>` for `upstream-feedback` first, and pass
   `--label upstream-feedback` to `gh issue create` only when it exists — `gh` hard-fails on a
   missing label and creates no issue, so passing it unconditionally can silently lose the whole
   filing. `gh issue create -R <owner/repo> --title "<run-slug>: <top finding, one line>"
   --body-file <report>`. Record the issue URL: super-auto runs record it as `run.md`'s
   `feedback:` field; standalone runs record it in their run report/summary output. If `gh` is
   missing or unauthenticated, write the report into the run's friction-log directory (per the
   Locations above) and give the user the exact command to file it manually — never silently drop
   it.

## Red Flags

**Never:**
- File, or run any `gh` write, without the user's explicit yes on the final body — approval of
  the *proposal* is not approval of the *body*.
- Interrupt an autonomous run mid-flight with the proposal — park and surface at the finish.
- Pad a thin run into an issue — a clean run files nothing, and one weak finding files nothing.
- Silently weaken a finding to satisfy scrubbing — flag it instead.
- File issues about the project under development here.
- Skip the analysis because the session "already knows" what went wrong — the dispatched
  analyst exists precisely because the session grades its own homework.

## Reference

- `./analyst-prompt.md` — the dispatched analyst: inputs, the three lenses, the worthiness bar,
  output contract.
- `./report-template.md` — the rollup issue body: section order and semantics.
- `./trigger-micro-test.md` — the frontmatter description's probe set; re-run it before changing
  the description. Maintenance-only, deliberately outside this file.
