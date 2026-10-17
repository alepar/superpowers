
FILE skills/upstream-feedback/SKILL.md
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

Locations: super-auto run → `<run-dir>/friction.md` (while its super-code Workflow runs, a git-ignored
`friction-pending.md` in super-code's workspace, folded into `friction.md` when it returns); standalone super-code run →
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

1. **Gather** (no dispatch): the friction log (a missing file is `not recorded`; a file holding
   only its header line is `none recorded` — never conflate the two); the run ledger (when available — a standalone
   super-design run has none); the parallelism detector lines — the ledger's `Detector: round N — …`
   lines, with its `Slowness:`, `Edge audit:` and `Edge cut:` lines (a round with `complete` lines
   but no `Detector:` line is unmeasured); roast verdict/`delta vs prior`
   lines; `run.md`; a graph-shape summary when a bead tree exists (open count, rounds ≈ longest
   chain, width per round); the installed plugin version (`plugin.json` in the plugin cache).
   Also gather, for `## Run metrics`:
   - every roast report's `seat-agreement:` line, together with that report's mode, iteration,
     and its `independence:` line (the main confounder when comparing agreement across runs);
   - the ledger's `Merge:` lines (the success path and the `→ blocker` / `→ auth-refused` failure paths) and
     the four-line `Metrics:` block;
   - the ledger's `Profile:` lines, one block per coordinator invocation (`super-code`'s run
     profile: critical path, bottleneck bead, wait causes, merge lane, what-ifs);
   - task landing identities from `already-merged --landed <branch>` against the ledger's
     success-path `Merge:`/re-entry IDs and reconciled completed IDs. Report concrete
     ledger-only/Git-only/completed-only IDs before proposing a cause. `baseAbsorbed` merges
     contribute zero task landings; duplicate appearances of one task add no landing;
   - `scope-dispositions --project <run.md>` JSON metrics/gaps when a run record exists.
     Exit 3 retains supported partial counts. Separate raw occurrences from actionable groups,
     latest outcomes from durable Recovery fix history, and supported repaired findings from
     deferred/rejected groups. State missing source populations, including task reviews absent
     from a roast/final-review-only projection;
   - each coverage round's `requirements:` line and each fix round's `scope-filter:` line from
     `run.md`;
   - a bead-graph dump: `bd list --label sp:<root> --json --status all --limit 0` —
     **`--limit 0` is required**, since `bd list` defaults to 50 rows and would silently
     truncate a larger tree. Edges for the graph's dependent/blocker table come from the dump's
     `dependencies` array (type `blocks`); the reason for each edge comes from the dependent's
     `blocked-by <id>:` description line, or `unstated` when that line is absent.

   Count friction from recorded defects, workarounds and waste. A normal Workflow/ordinary
   execution-mechanism selection contributes zero friction events. Preserve source scope and
   transport status before interpretation: an unreadable ledger can leave “known invocation:
   completed bd-17; run total unavailable,” rather than zero merges or a clean run. Profiles
   retain their producer's invocation/residual scope, task/all-agent labels and generation owner.

   Gather what exists; name what was unavailable in the report's `## Not established` section
   rather than silently omitting it. A missing ledger, missing detector lines or missing `Metrics:`
   lines while merges exist on the branch is itself a candidate finding (the run took a path that
   skipped them), handed to the analyst as evidence, not rendered as a bare `none`. A subsection of `## Run metrics` with no source renders
   `none`, with the absent source named in `## Not established` — a missing source never blocks
   filing. A standalone super-design run (no ledger) renders Fix loop and Merge-back as `none`.
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
   and error messages (paths inside them scrubbed). This applies to the `## Run metrics` bead-graph
   tables the same as any other content: titles and descriptions are project nouns to scrub, ids
   are bead ids to scrub. If scrubbing a detail would make a finding unactionable, flag that
   finding to the user instead of silently weakening it.
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


FILE skills/upstream-feedback/report-template.md
# Report template (the rollup issue body)

One issue per run. This shape is load-bearing — it is the form three rounds of real
cross-machine feedback converged on, and every section exists because its absence cost a
consumer time. Fill every section; write `none` under a heading rather than dropping it.

```markdown
# <run-slug>: <one-line summary of the top finding>

Plugin: <version>. Run: <scale — bead count / rounds / duration if known>, <date>.

## Defects
<!-- ordered by impact; each: -->
### <n>. <claim>
- **Evidence:** <quoted lines / numbers from this run>
- **Premise to verify:** <what the fix relies on — upstream must check this before building>
- **Suggested fix shape:** <one advisory line, not a prescription>

## Run metrics
<!-- always filled: `none` under any subsection whose source was absent, and the absent source
     named in `## Not established`. A missing source never blocks filing. A standalone
     super-design run (no ledger) renders Fix loop and Merge-back as `none`. -->
### Judge panel
<!-- one line per roast report: mode, iteration, independence, seat-agreement line -->
### Fix loop
<!-- the `Metrics: completions` line (review clean / after fix pass / parked / re-entry closes)
     and the `Metrics: fix-pass` line (entered / FIXED / BLOCKED) -->
### Merge-back
<!-- the `Metrics: merges` line (including check-fails and how many were fixed) and the
     `ledger-check` line; count of `Merge:` lines with conflict / seam-review fired /
     check fail→fixed / check fail / → blocker. Reconcile distinct task IDs from
     `already-merged --landed <branch>`, success-path `Merge:`/re-entry records, and
     reconciled completed IDs. List ledger-only, Git-only and completed-only IDs before
     proposing a cause. `baseAbsorbed` merges contribute zero task landings; duplicate
     appearances of one task add no landing. Report verification-only completions separately
     from task landings. Name unavailable sources separately in `Not established`; a raw
     first-parent merge count does not establish a ledger gap. -->
### Coverage
<!-- the `requirements:` line per coverage round and the `scope-filter:` line per fix round -->
### Timing
<!-- per coordinator invocation, the ledger's `Profile:` header, `bound`, `critical path`,
     `bottleneck`, `waits`, `merge lane` and `what-if` lines (an ordinary-subagent run adds
     `concurrency`), and its `Profile: context` line and every `Profile: context agent` line
     (`Profile: context — unavailable — …` when that is what it printed); `Profile: unavailable — …`
     when that is what the ledger has. What-if lines are a schedule model's estimates, not
     measurements: quote them with the `bound` line's model-vs-actual figure. Compaction causes
     (cap, early, idle, manual, unknown) are classified from sizes and gaps, not logged by the
     harness: quote them as classified. -->

### Bead graph
| id | type | title | what (first sentence of description) |
| --- | --- | --- | --- |

| dependent | blocker | reason (from `blocked-by` line, or `unstated`) |
| --- | --- | --- |

## Design questions
<!-- offered for adjudication, not as corrections; each argues both sides and ends with: -->
<!-- "If upstream decides otherwise, please state the position explicitly so downstream can
     reconcile against words rather than silence." -->

## Doc gaps

## Already fixed — do not re-litigate
<!-- anything this run worked around that is known-fixed in <version/commit>, so upstream
     doesn't re-fix it and the reader doesn't re-report it -->

## Not established
<!-- honest caveats: claims this report does NOT make — unmeasured speedups, untuned defaults,
     single-run observations — named as such so nobody cites them as findings -->
- By default: the coordinator's ledger-append path is fire-and-forget and can lose a line
  without the coordinator noticing, so every ledger-derived count in `## Run metrics` (Fix loop,
  Merge-back) is a lower bound. The `Metrics: ledger-check` line is the one cross-check that
  exists.

## Verification bar
<!-- what upstream should run/check before trusting a fix: the harness, the probes, a live
     round — whatever this run's evidence says would have caught the defects listed above -->

---
If a premise above is wrong, stop and say so rather than improvising a larger change.
```


FILE skills/upstream-feedback/analyst-prompt.md
# Analyst prompt (dispatched by upstream-feedback, model: opus or the harness's strongest analyst-class model)

The dispatched agent works in isolated context and did not run the run it is analyzing. Fill
the bracketed sections; the prompt is the agent's entire window — it calls no tools.

```
You are analyzing a finished autonomous-development run to find feedback worth filing with the
repository that owns these skills (the plugin's recorded repository) — improvements to the skills'
machinery and guidance, never to the project the run was building. You did not run this run; judge
only the evidence below. You analyze only: call no tools, file nothing, write nothing — your
entire output is the findings list below.

## Plugin version
[VERSION]

## Friction log (events the run recorded as they happened; `none recorded` means the log was kept and is empty, `not recorded` means it was never created)
[FRICTION_LOG]

## Run ledger (per-task terminal outcomes)
[LEDGER]

## Parallelism detector lines (one per round)
[DETECTOR_LINES]

## Roast verdict / delta lines (if any roast rounds ran)
[ROAST_LINES]

## Run state (run.md, if present)
[RUN_MD]

## Graph shape (if a bead tree exists)
[GRAPH_SUMMARY]

## Run metrics
[RUN_METRICS]

## Missing sources (a ledger, detector lines or Metrics lines absent while the branch has merges; `ledger incomplete` counts)
[MISSING_SOURCES]

## Your three lenses

1. **Completeness** — what did the skills' machinery or guidance not cover that this run
   plainly needed? (A workaround in the friction log is a completeness finding wearing a
   disguise.)
2. **Correctness** — defects: guidance that was wrong when followed literally, failures that
   were swallowed where they should have been visible, outcomes misclassified by the run's own
   bookkeeping.
3. **Speed** — serialization the evidence shows was unnecessary, dead time between phases,
   dispatches spent on results nothing consumed, caps that bound the wrong quantity. The
   detector lines and the graph shape are your instruments: peak-vs-cap gaps, thin multi-round
   tails, hot-file deferrals, top-up query usage. So are the `Profile:` lines in the run metrics
   (measured after the run): the realized critical path and the bead that held it, wait causes,
   merge-lane load, and modelled what-ifs, which are estimates to weigh against the `bound` line's
   model-vs-actual figure.

## The worthiness bar — apply to every candidate

A finding survives only if ALL three hold:
(a) it GENERALIZES beyond this project — a different project running the same skills would hit
    it;
(b) it is ACTIONABLE upstream — you can say what the skills should do differently, or state the
    single design question blocking that;
(c) it carries EVIDENCE from this run — a number, a log line, a ledger entry, a friction-log
    event. "It felt slow" is not evidence; "peak in-flight 8 against cap 14 for 3 rounds" is.

Explicitly unworthy: project-specific configuration choices, single unreproduced flukes,
style preferences. Err toward recall — the invoking session and the user filter after you —
but never toward invention: report only what the evidence supports.

## Required structured output (no prose essay)

Zero findings is a valid, expected outcome for a clean run — return an empty list rather than
manufacturing marginal findings. Otherwise, one entry per finding:
- **kind:** `defect` | `design-question` | `doc-gap`
- **claim:** one sentence, scoped to exactly what the evidence supports
- **evidence:** the specific lines/numbers from the inputs above, quoted
- **premise:** what a fix would rely on that upstream must verify before implementing
- **fix-shape:** one advisory line (or, for design-question: the question, both sides argued)
```
