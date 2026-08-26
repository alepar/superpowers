# Upstream Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new `superpowers:upstream-feedback` skill that turns run friction into user-gated GitHub issues on the plugin's owning repo, plus friction-log capture and finish hooks in the four super-* skills.

**Architecture:** Three new prose files under `skills/upstream-feedback/` (SKILL.md kept execution-lean; the analyst rubric and the report template live in their own files, loaded only when used), one-line hooks in the super-* SKILL.mds. Spec: `docs/superpowers/specs/2026-08-26-upstream-feedback-design.md`. No engine changes.

**Tech Stack:** Markdown skill files; `gh` CLI at runtime; haiku probe subagents for verification.

## Global Constraints

- Do not edit `skills/subagent-driven-development/` (byte-identical to upstream).
- Do not edit the ```javascript fence in `skills/super-code/coordinator-workflow.md`.
- SKILL.md files carry execution content only — no history, no rationale-narratives beyond what shapes behavior (the fork's standing context-pollution rule).
- Filing is ALWAYS user-gated; nothing in any prompt or skill text may permit unattended `gh issue create`.
- New-skill frontmatter description states triggering conditions only.
- Work from the repo root; commit after each task.

---

### Task 1: `skills/upstream-feedback/SKILL.md`

**Files:**
- Create: `skills/upstream-feedback/SKILL.md`

**Interfaces:**
- Produces: the skill name `superpowers:upstream-feedback`, the friction-log format and locations, and the invocation contract the Task 4 hooks reference.

- [ ] **Step 1: Write the file** with exactly this content:

````markdown
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
log; a standalone super-roast skips it (its report is already the feedback channel). Log on: a
defect hit in skill machinery or guidance, a workaround applied, guidance that read wrong or
ambiguous when followed literally, a visible stall or waste, an adaptation forced to diverge.
Bar: "this surprised me or cost me something." No analysis at write time — the finish pass
discards noise; it cannot recover unrecorded moments.

**Only the OUTERMOST super-* invocation runs this skill's analysis** — inner invocations only
append. A standalone run is its own outermost.

## The Process

1. **Gather** (no dispatch): the friction log; the run ledger; `parallelism:` detector lines;
   roast verdict/`delta vs prior` lines; `run.md`; a graph-shape summary when a bead tree exists
   (open count, rounds ≈ longest chain, width per round); the installed plugin version
   (`plugin.json` in the plugin cache).
2. **Analyze** — dispatch ONE fresh-context subagent, **model: opus**, with `./analyst-prompt.md`
   and the gathered inputs. It returns candidate findings or none.
3. **Triage** — drop anything failing the worthiness bar (it is in the analyst prompt, but the
   analyst errs toward recall; you err toward precision): generalizes beyond this project,
   actionable upstream, evidence from this run. **Zero survivors → say "no upstream-worthy
   findings this run" and stop.** Do not manufacture findings to appear useful.
4. **Draft** the report per `./report-template.md` — one rollup document for the whole run.
5. **Propose** to the user: the findings summary, the target repo (the providing plugin's
   `plugin.json` `repository` field — typically `alepar/superpowers` — overridable here), and
   two questions: file it? scrub it? **In an autonomous run, do not interrupt:** park the draft
   in the run directory and present this proposal at the run's finish menu.
6. **Scrub** (only if the user opted in): replace project/repo names, domain nouns, file paths,
   bead ids, and human names with role-generic equivalents ("a shared adapter file four tail
   beads touch"). Keep counts, timings, graph shapes, percentages, skill/mechanism/config names,
   and error messages (paths inside them scrubbed). If scrubbing a detail would make a finding
   unactionable, flag that finding to the user instead of silently weakening it.
7. **Confirm** — show the user the final issue body verbatim (scrubbed or not). Only after
   their yes:
8. **File** — `gh issue create -R <owner/repo> --title "<run-slug>: <top finding, one line>"
   --body-file <report>`. Apply the `upstream-feedback` label if the repo has it; tolerate its
   absence. Record the issue URL in `run.md` / the run report. If `gh` is missing or
   unauthenticated, write the report into the run directory and give the user the exact command
   to file it manually — never silently drop it.

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
````

- [ ] **Step 2: Verify**

Run: `grep -c "outermost\|OUTERMOST" skills/upstream-feedback/SKILL.md`
Expected: 2 or more.

- [ ] **Step 3: Commit**

```bash
git add skills/upstream-feedback/SKILL.md
git commit -m "feat(upstream-feedback): new skill — friction log, dispatched analyst, user-gated filing"
```

---

### Task 2: `skills/upstream-feedback/analyst-prompt.md`

**Files:**
- Create: `skills/upstream-feedback/analyst-prompt.md`

**Interfaces:**
- Consumes: Task 1's gather list (§Process step 1) as the input sections.
- Produces: the finding shape (kind/evidence/premise/fix-shape) Task 3's template consumes.

- [ ] **Step 1: Write the file** with exactly this content:

````markdown
# Analyst prompt (dispatched by upstream-feedback, model: opus)

The dispatched agent works in isolated context and did not run the run it is analyzing. Fill
the bracketed sections; the prompt is the agent's entire window — it calls no tools.

```
You are analyzing a finished autonomous-development run to find feedback worth filing with the
UPSTREAM SKILL REPOSITORY — improvements to the skills' machinery and guidance, never to the
project the run was building. You did not run this run; judge only the evidence below.

## Plugin version
[VERSION]

## Friction log (events the run recorded as they happened; may be empty)
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
   tails, hot-file deferrals, top-up query usage.

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
````

- [ ] **Step 2: Verify**

Run: `grep -c "worthiness bar\|Zero findings" skills/upstream-feedback/analyst-prompt.md`
Expected: 2 or more.

- [ ] **Step 3: Commit**

```bash
git add skills/upstream-feedback/analyst-prompt.md
git commit -m "feat(upstream-feedback): analyst prompt — three lenses, worthiness bar, empty-is-valid"
```

---

### Task 3: `skills/upstream-feedback/report-template.md`

**Files:**
- Create: `skills/upstream-feedback/report-template.md`

**Interfaces:**
- Consumes: Task 2's finding shape.

- [ ] **Step 1: Write the file** with exactly this content:

````markdown
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

## Verification bar
<!-- what upstream should run/check before trusting a fix: the harness, the probes, a live
     round — whatever this run's evidence says would have caught the defects listed above -->

---
If a premise above is wrong, stop and say so rather than improvising a larger change.
```
````

- [ ] **Step 2: Verify**

Run: `grep -c "do not re-litigate\|Not established" skills/upstream-feedback/report-template.md`
Expected: 2 or more.

- [ ] **Step 3: Commit**

```bash
git add skills/upstream-feedback/report-template.md
git commit -m "feat(upstream-feedback): rollup report template"
```

---

### Task 4: Hooks and friction-log instructions in the four super-* skills

**Files:**
- Modify: `skills/super-auto/SKILL.md` (phase-6 row, line ~175)
- Modify: `skills/super-code/SKILL.md` (§Reference intro, line ~141)
- Modify: `skills/super-design/SKILL.md` (§The Process step 9, line ~44)
- Modify: `skills/super-roast/SKILL.md` (§Integration, line ~249)

**Interfaces:**
- Consumes: Task 1's skill name and friction-log contract.

- [ ] **Step 1: super-auto** — find:

```markdown
| 6 | Report (`report`) | — | Write `report.md` per `./report-prompt.md`, before anything is torn down |
```

Replace with:

```markdown
| 6 | Report (`report`) | — | Write `report.md` per `./report-prompt.md`, before anything is torn down. Then invoke `superpowers:upstream-feedback` (this run is the outermost invocation — its analysis pass runs here, once; the proposal surfaces at the phase-7 menu, never mid-run). Throughout all phases: append friction events to `<run-dir>/friction.md` the moment they happen, per that skill's format |
```

- [ ] **Step 2: super-code** — find:

```markdown
## Reference
```

Replace with:

```markdown
## Friction log & upstream feedback

Throughout a run, append friction events (defects hit, workarounds, guidance that read wrong, visible stalls) to the enclosing run's friction log — `<workspace>/friction.md` beside the ledger when this skill is the outermost invocation — per `superpowers:upstream-feedback`'s format, the moment they happen. When this skill is the outermost invocation and owns its own Finish, invoke `superpowers:upstream-feedback` after the final review; when a caller owns the finish, only append — the caller's own hook runs the analysis.

## Reference
```

- [ ] **Step 3: super-design** — find:

```markdown
9. **Root only:** hand off to execution — §Hand-off.
```

Replace with:

```markdown
9. **Root only:** hand off to execution — §Hand-off. A standalone root invocation (no super-auto above it) then invokes `superpowers:upstream-feedback`; throughout the run, append friction events to `<artifact-directory>/friction.md` (or the enclosing run's log when nested) per that skill's format, the moment they happen.
```

- [ ] **Step 4: super-roast** — find:

```markdown
## Integration
```

Replace with:

```markdown
## Friction log

When invoked inside a super-auto/super-design/super-code run, append friction events (skill-machinery defects, workarounds, guidance that read wrong) to the enclosing run's friction log per `superpowers:upstream-feedback`'s format, the moment they happen. A standalone roast skips this — its report is already the feedback channel — and never runs that skill's analysis itself.

## Integration
```

- [ ] **Step 5: Verify**

Run: `grep -c "upstream-feedback" skills/super-auto/SKILL.md skills/super-code/SKILL.md skills/super-design/SKILL.md skills/super-roast/SKILL.md`
Expected: each file reports at least 1.

- [ ] **Step 6: Commit**

```bash
git add skills/super-auto/SKILL.md skills/super-code/SKILL.md skills/super-design/SKILL.md skills/super-roast/SKILL.md
git commit -m "feat(super-*): friction-log capture + upstream-feedback finish hooks"
```

---

### Task 5: Probe verification

**Files:**
- Create: none persisted (probe results recorded in Task 6's commit body)

**Interfaces:**
- Consumes: Task 2's analyst prompt (assemble probes from the ACTUAL file content).

- [ ] **Step 1: Worthiness probe.** Dispatch a haiku subagent with the analyst prompt assembled from the file, inputs filled with a fixture: friction log containing (a) "merge queue idle 40 minutes while one triage ran — merges waited behind an opus dispatch that touches no git state" and a detector line `parallelism: 12 ready · topped-up 0 · cap 14 · peak in-flight 3`; (b) "we set hotFileCap to 5 because our adapter file is hot". Expected: (a) surfaced as a finding (speed lens, evidence quoted); (b) rejected (project-specific configuration).

- [ ] **Step 2: Clean-run probe.** Same prompt, friction log empty, unremarkable detector lines (`peak in-flight 14` at cap 14), clean ledger. Expected: zero findings.

- [ ] **Step 3: Scrub probe.** Dispatch a haiku subagent with the SKILL.md §Process step 6 scrub rules quoted verbatim and a three-sentence fixture finding mentioning `population_campaign_adapter.py`, project name "durak", and "4 of 5 tail beads". Expected: file and project names replaced with role-generic equivalents, "4 of 5 tail beads" preserved verbatim.

- [ ] **Step 4: Trigger micro-test.** Three haiku probes, each given ONLY the new skill's frontmatter description plus one scenario, asked "invoke? yes/no": (a) "the super-auto run just finished and its report is written — run the feedback pass" → yes; (b) "file a bug about my app's login flow" → no; (c) "report this skill defect upstream to the superpowers repo" → yes. Record results in `skills/upstream-feedback/trigger-micro-test.md` (same maintenance-file convention as super-code's — NOT in SKILL.md).

- [ ] **Step 5: If any probe fails,** revise the prompt/description wording once and re-probe; a second failure stops for the human partner.

---

### Task 6: Release

**Files:**
- Modify: the four fork-versioned manifests (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, `.cursor-plugin/plugin.json`)
- Create: `skills/upstream-feedback/trigger-micro-test.md` (Task 5's results)

- [ ] **Step 1: Bump**

```bash
sed -i '' 's/6\.2\.0-alepar2\.13/6.2.0-alepar2.14/g' .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json
```

- [ ] **Step 2: Regression** (no engine changes — one confirming run)

Run: `node tests/super-code/replay-harness.mjs | tail -1`
Expected: `546 passed, 0 failed`.

- [ ] **Step 3: Commit, tag, push** (probe results in the commit body)

```bash
git add -A
git commit -m "chore: v6.2.0-alepar2.14 — bump manifests (upstream-feedback skill)"
git tag -a v6.2.0-alepar2.14 -m "upstream-feedback: friction log, dispatched analyst, user-gated issue filing + super-* hooks"
git push origin main && git push origin v6.2.0-alepar2.14
```
