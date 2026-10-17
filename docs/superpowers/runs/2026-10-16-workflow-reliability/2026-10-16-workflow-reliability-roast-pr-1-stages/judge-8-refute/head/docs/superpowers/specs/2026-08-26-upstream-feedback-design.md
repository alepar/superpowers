# upstream-feedback: proactive diagnostics → user-gated GitHub issues on the owning repo

**Date:** 2026-08-26
**Status:** approved (design), pending implementation
**Scope:** one new skill (`skills/upstream-feedback/`), one-line finish hooks in
`skills/super-auto/`, `skills/super-code/`, `skills/super-design/`, a friction-log-append
instruction in `skills/super-roast/`. No engine changes.

## Problem

Live super-* runs are the best defect detector the skills have — every substantive improvement
of the last two weeks (null-dispatch policy, round-barrier removal, roast round-noise, seam
machinery, edge audit, top-up corrections) originated in a real run's friction. Today that
feedback pipeline is manual: the operator notices, writes a report file by hand, and carries it
between machines. Runs that hit the same friction without an attentive operator lose the signal
entirely, and mid-run "workaround moments" evaporate from context before anyone writes them
down.

## Decisions (each gated with the user)

1. **Placement:** a new standalone skill owns the mechanics; the super-* skills get one-line
   finish hooks. Any project session with the plugin gets the whole pipeline.
2. **Trigger:** mid-run friction log (cheap, append-only, written the moment something happens)
   plus a finish-time analysis pass. No mid-run proposals — never interrupt an autonomous run.
3. **Analyzer:** a dispatched fresh-context subagent, opus tier — judgment work, graded
   independently of the session's own narrative.
4. **Issue shape:** one rollup issue per run, ordered items, in the report shape that proved
   consumable across three real feedback rounds. Filed via `gh` after user approval; local-file
   fallback.

## Design

### 1. The skill: `superpowers:upstream-feedback`

Frontmatter description (triggers only): use when a super-* run finishes and its finish hook
invokes it, or when the user asks to file feedback/improvement reports about skill behavior with
the upstream skill repository. Not for filing issues about the *project under development*.

Process: locate the friction log and run artifacts → dispatch the analyst → triage its candidate
findings against the worthiness bar → if none survive, say so and stop (a clean run files
nothing) → propose to the user → optional scrub → present the final body → file → record the
issue URL.

### 2. Friction log (mid-run capture)

- **Location:** super-auto runs: `<run-dir>/friction.md` (committed with the run branch,
  survives resume and machine moves). Standalone super-code runs: `<workspace>/friction.md`
  beside the ledger. Standalone super-design runs: `<artifact-directory>/friction.md`
  (§Artifact Location). Nested skills append to the enclosing run's log; a standalone
  super-roast has no run and skips appending — its report is itself the feedback channel.
- **Format:** one line per event: `- [<date> <phase/round>] <what happened> — <why it might be
  upstream-worthy>`. No analysis at write time.
- **Capture rule:** write the line the moment it happens, for: a defect hit in skill machinery
  or guidance, a workaround applied, guidance that was wrong or ambiguous when followed
  literally, a visible stall or waste, an adaptation forced to diverge from the skill's shape.
  Bar: "this surprised me or cost me something." The finish pass discards noise; it cannot
  recover unrecorded moments.
- **Ownership/dedupe:** inner super-* invocations append to the OUTERMOST run's log; only the
  outermost invocation runs the finish analysis. A standalone run is its own outermost.

### 3. Finish analysis (dispatched analyst, opus)

Inputs, assembled by the invoking session: the friction log; the run ledger; `parallelism:`
detector lines; roast verdict/delta lines; `run.md`; a graph-shape summary (bead count, rounds,
width, critical path) when a bead tree exists; the plugin version.

Rubric (the prompt's three lenses):
- **Completeness** — what did the machinery or guidance not cover that this run needed?
- **Correctness** — defects, docs that were wrong when followed, failures that were swallowed
  where they should have been visible.
- **Speed** — serialization, dead time, wasted dispatches, caps that bound the wrong thing.

Worthiness bar (stated verbatim in the prompt): a finding must (a) generalize beyond this
project, (b) be actionable upstream, and (c) carry evidence from this run. Explicitly unworthy:
project-specific configuration choices, single unreproduced flukes, style preferences.

Output: candidate findings, each with kind (defect / design question / doc gap), evidence,
the premise a fix would rely on, and a suggested fix shape.

### 4. Report template (the shape that worked)

Header: plugin version, run scale (bead count / rounds / duration if known), date.
Then, in order:
1. **Defects** — each with measured evidence, the premise to verify before relying on the fix,
   and a suggested fix shape.
2. **Design questions** — offered for adjudication, both sides argued, "if upstream disagrees,
   say so explicitly" framing.
3. **Doc gaps.**
Then: **What is already fixed — do not re-litigate** (versions/commits when known);
**What is NOT established** (honest caveats — unmeasured claims named as unmeasured);
**Verification bar** for whoever implements; and the standing rule: *if a premise is wrong, stop
and say so rather than improvising a larger change.*

### 5. Proposal + anonymization gate

Always user-gated — filing is outward-facing. The proposal presents the findings summary and
asks: file it? scrub it? In autonomous runs the draft parks in the run directory and surfaces at
the finish menu — never a mid-run interrupt.

Scrub rules (applied only if the user opts in):
- **Replace** with role-generic equivalents: project/repo names, domain nouns, file paths, bead
  ids, human names, anything identifying what was being built ("`population_campaign_adapter.py`"
  → "a shared adapter file four tail beads touch").
- **Keep:** counts, timings, graph shapes, percentages, skill/mechanism/config names, error
  messages (paths inside them scrubbed).
- The scrubbed draft must still let upstream act on every finding — if scrubbing a detail would
  make a finding unactionable, flag that finding to the user instead of silently weakening it.

Scrubbed or not, the final issue body is shown to the user before anything is filed.

### 6. Filing

- **Target repo:** the providing plugin's `plugin.json` `repository` field (typically
  `alepar/superpowers`), stated in the proposal and user-overridable there.
- **Mechanics:** `gh issue create -R <owner/repo> --title "<run-slug>: <top finding>"
  --body-file <report>` — one rollup issue per run. Apply an `upstream-feedback` label when the
  repo has one; tolerate its absence.
- **Record:** on success, the issue URL goes into `run.md` / the run report.
- **Fallback:** `gh` missing or unauthenticated → write the report to the run directory and give
  the user the exact command to file it manually. Never silently dropped.

### 7. Hooks (one line each)

| Skill | Hook |
|---|---|
| super-auto | phase 6, after `report.md` is written: invoke `superpowers:upstream-feedback` |
| super-code | Finish, after the final review — **skipped when a caller owns the finish** (the caller's hook covers it) |
| super-design | end of the root invocation, after hand-off |
| super-roast | no finish hook (always either inside a caller, or a one-shot review whose report is itself the feedback); gains only the friction-log-append instruction |

All four skills also gain the friction-log-append instruction (location per §2, one sentence
each, pointing at this skill for the format).

## Verification

- Haiku probes of the analyst prompt: a fixture friction log + artifacts containing one
  generalizable defect (with numbers) and one project-specific configuration complaint — expect
  the defect surfaced and the complaint rejected by the worthiness bar; a clean-run fixture —
  expect zero findings ("a clean run files nothing").
- Scrub check: a fixture report through the scrub rules — domain nouns replaced, counts and
  mechanism names intact, and the flag-when-unactionable rule exercised by one finding whose
  substance IS the domain detail.
- Trigger micro-test for the new skill's description (3 haiku probes: finish-hook scenario yes;
  "file a bug about my app" no; "report this skill defect upstream" yes).
- No engine changes → replay harness untouched (run once as regression).

## Out of scope

- Automatic filing without user approval (never).
- Cross-run aggregation or dedup against existing upstream issues (the user is the dedup).
- Feedback about the project under development (that is the project's own tracker's job).
- PRs to the upstream `obra/superpowers` repo (this files issues on the fork's repo only).

## Files to touch

| File | Change |
|---|---|
| `skills/upstream-feedback/SKILL.md` | new — process, worthiness bar, scrub rules, filing mechanics, autonomous parking |
| `skills/upstream-feedback/analyst-prompt.md` | new — the dispatched analyst's prompt: inputs, rubric, worthiness bar, output contract |
| `skills/upstream-feedback/report-template.md` | new — the §4 template with section semantics |
| `skills/super-auto/SKILL.md` | phase-6 hook line + friction-log instruction |
| `skills/super-code/SKILL.md` | Finish hook line (caller-owned-finish skip) + friction-log instruction |
| `skills/super-design/SKILL.md` | root-finish hook line + friction-log instruction |
| `skills/super-roast/SKILL.md` | friction-log instruction only |
