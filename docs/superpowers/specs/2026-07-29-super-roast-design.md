# super-roast — Dual-Mode Adversarial Review (design)

**Date:** 2026-07-29 · **Status:** approved design, pre-implementation
**Replaces:** `skills/roast/` (deleted on completion)
**Research base:** `~/Documents/Super-Roast_Design_Research_20260728/` — design-research report
(28 sources), validated three-seat judge prompts, and the RED/GREEN eval record demonstrating
the identical-judge defect this design corrects.

## Goal

One skill that adversarially reviews **either a design spec or a PR**, robustly and
cost-efficiently: scouts find, a deduper consolidates, a seat-differentiated judge panel
verifies, a frontier reporter issues final verdicts with environment-aware severity, and the
report feeds `super-plan`'s fix loop — pausing for the human after at most 3 iterations.

## Why (defects in roast this corrects)

- **Identical judges share confirm-bias.** Eval (2026-07-28): three byte-identical sonnet
  judges confirmed a not-material finding 2-of-3 (a documented at-least-once tradeoff judged
  as a "gap"), which would have gated REVISE. Three method-differentiated seats took the same
  finding to 0-of-3 while a real gap stayed confirmed 3-of-3. Same-family panels carry far
  fewer effective votes than members; procedure diversity is the available substitute for
  family diversity.
- **No PR mode.** Design review and code review share the find→dedupe→verify shape but need
  different scout rosters, grounding sources, and report vocabulary.
- **Severity is context-blind.** A home-lab project and production user-serving code get the
  same severity — noise for one, under-caution for the other.
- **Two severity vocabularies** (blocker/major/minor findings vs BLOCK/REVISE/PASS gate) where
  one suffices.

## Pipeline

| # | Stage | Model | Count | Role |
|---|---|---|---|---|
| 1 | Pre-flight | (inline, main session) | — | mode, inputs, environment profile |
| 2 | Triage | sonnet | 1 | design: domains; PR: conditional-lane activation |
| 3 | Scouts | opus | 5–8 design / 6–13 PR | high-recall finding, web + repo tools |
| 4 | Dedupe | fable | 1 | merge, suggest severity, apply caps |
| 5 | Judges | sonnet | 3×severe + 1×nit | seat-differentiated verification |
| 6 | Reporter | fable | 1 | final verdicts, env-aware severity, report file |
| 7 | Handoff | — | — | report → super-plan fix loop |

### 1. Pre-flight (inline — no dedicated agent)

- **Mode:** caller-supplied > obvious classification from the input (diff/PR ref → PR;
  standalone doc → design) > ask the user. Never silently guess on ambiguity. Non-interactive
  invocations (brainstorming/super-plan gates) carry the caller's mode.
- **Inputs.** Design: spec path(s) + optional caller requirements. PR: branch diff vs
  merge-base with main/dev **including working tree**, or a GitHub PR number fetched via `gh`
  (diff + PR description + review comments as scout context). Record exact refs
  (`branch@sha vs base@sha [+dirty]`) for the report header.
- **Environment profile:** auto-detected every run, never asked. Inferred from repo signals
  (deploy manifests/IaC, CI publish steps, README claims, published-package vs private,
  payment/PII-touching code) as **2–4 sentences of prose** on the blast-radius triad — what
  happens when it breaks, how long the code lives, who depends on it. Printed in the report
  header as `profile (assumed): …`; a wrong inference is corrected by re-running, not by a
  prompt.
- **Prior report:** re-roast iterations receive the previous report path (see §Loop).

### 2. Triage (sonnet)

Design mode: unchanged from roast — 1–3 domain labels for expert critics, recall-leaning.
PR mode: activates conditional scout lanes from the **shape** of the diff (files touched,
schema/migration files, API surface changes, new dependencies, frontend files, CI/deploy
files). **Recall-leaning: on doubt, activate.** A missed lane is a silent gap; an extra lane
is one wasted opus call.

### 3. Scouts (opus, parallel; WebSearch/WebFetch + repo read access)

High-recall mandate in both modes: report every defensible finding with location and
evidence; include uncertain ones; **no self-filtering by severity or confidence** —
downstream stages filter. Structured output (finding: claim, location, external flag,
category; design mode keeps GAP | UNVERIFIED-ASSUMPTION kinds + spike recommendations).

- **Design roster:** the 5 core lenses (premortem, completeness, YAGNI, failure-mode,
  feasibility; + security/maintainer when triage says `none`) + domain experts. Ported
  from roast unchanged.
- **PR roster:** 6 always-on lanes — Correctness & edge cases; Security; Premortem /
  incident blast radius; Simplicity + clean design (OOP/testability/abstraction placement);
  Hot-path performance (GC churn + I/O, N+1, caching); Concurrency & async — plus 7
  conditional lanes activated by triage: Data & migrations; Deploy/rollout safety;
  API contract; Observability; Testing strategy; Dependency/supply-chain; Hygiene+Docs
  (+cost/privacy). Lane content sourced from the super-review taxonomy (each lane carries
  its heuristics + pragmatism filter).

### 4. Dedupe (fable)

Merges near-duplicates (same location + root claim; keep strongest evidence, union of
locations). Suggests a severity per merged finding. **Keeps every Blocking/Should-fix
candidate; caps the remainder at the 50 most important, correctness and risk first.**
Records before/after counts. Suggested severity is triage input for stage 5 routing and the
reporter — it never gates by itself. Fable because dedupe errors (bad merges, dropped
findings) are silent and unrecoverable downstream.

### 5. Judges (sonnet, adaptive thinking)

- **Blocking/Should-fix candidates → full three-seat panel**: reproduce / refute / ground —
  the validated prompts (`judge-seat-prompts-validated.md` in the research folder), shared
  core + per-seat procedure. ≥2-of-3 CONFIRM to confirm; re-dispatch a failed seat once;
  UNVERIFIED routes to human, never dropped.
- **Nit/FYI candidates → one refute-seat judge** (spot check): kills wrong nits cheaply;
  survivors are reported as `unverified nits`. A spot-check judge may flag a nit as
  under-graded, promoting it to the full panel.
- **PR-mode additions** (already sketched in the validated prompts): "spec" reads as the PR
  (diff + repo + stated intent); refute seat also checks pre-existing-vs-introduced and
  linter-territory; ground seat greps the repo for context claims (hot path, existing
  dependency) in addition to web grounding.
- Shared-core **materiality definition** (tested, load-bearing): material against the
  artifact's stated requirements, contract, and scope — documented tradeoffs and disclaimed
  scope are not gaps.

### 6. Reporter (fable)

Reasons over the seat evidence packets and issues per finding: **confirmed | rejected**
(may overrule the panel arithmetic with cited reasoning) and **final severity**,
environment-conditioned. Only the reporter sees the profile — scouts and judges stay
profile-blind so recall and verification are never silently narrowed. Severity floors are
profile-proof: confirmed injection/authZ-bypass/secrets on a network-exposed surface,
data-loss or irreversible-migration risk on real data, and violations of the artifact's own
stated core purpose are Blocking under any profile. The profile moves the Should-fix↔Nit
boundary and down-weights resilience/observability/cost lanes for low-blast-radius projects.

**Severity vocabulary (the only one, all stages): Blocking / Should-fix / Nit / FYI.**
Overall verdict = highest confirmed severity + coverage qualifier. blocker/major/minor and
BLOCK/REVISE/PASS are retired, including in docs that reference them.

### Report format

Written to `docs/superpowers/reviews/YYYY-MM-DD-<topic>-roast-N.md` (N = iteration):

```
super-roast verdict: <Blocking (n) | Should-fix (n) | clean (n nits)> [low coverage]
mode: design | PR        iteration: N of 3
profile (assumed): <2–4 sentence inferred profile>
inputs: <spec paths | branch@sha vs base@sha [+dirty] | PR#>
coverage: <lanes ran> · <raw → deduped → panel/spot-checked counts> · <judge completion %>
independence: same-family (Claude) — seat-differentiated panel

## Confirmed findings            ← consumed by super-plan, one task per finding
- [SEV] <location> — <claim>
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: <strongest seat evidence, file:line / URL+quote>
  fix-shape hint: <one advisory line>

## Rejected (with reason)        ← so re-roasts don't re-litigate
## Unverified nits (spot-checked)
## Escalations (need human)      ← UNVERIFIED externals, incomplete panels, material dissent
```

### 7. Handoff & loop

super-roast is **report-only** in both modes. It ends by invoking `superpowers:super-plan`
with the report path (or returning the path to a non-interactive caller). super-plan fixes
per its normal ladder (inline if small; interactive design work if large; subagent-driven
implementation), then **auto-decides re-roast by fix scope**: mechanical single-file fixes
with no design change → done; fixes that changed design decisions, data handling, or
resolved multiple Blocking findings → re-roast. Convergence guards: **hard cap 3
iterations**; **early-stop if an iteration resolves nothing** (confirmed-Blocking set did
not shrink — thrash); both exits pause with an escalation summary for the human. Re-roast
N+1 receives report N: scouts are told not to re-surface rejected findings; the reporter
marks resolved vs. regressed. The prior report file is the only cross-iteration state
(survives compaction; no separate store).

## Execution: engine vs data

The Workflow script is a **stable engine**; everything that changes often is **data**.

- **Engine (tested, changes rarely):** stage order, parallelism, tiered judge routing,
  ≥2-of-3 aggregation with re-dispatch, caps application, `.filter(Boolean)` + coverage
  gating (dead agents ⇒ `low coverage`, never a silent clean), required-field schemas
  (verdict/severity/evidence — a missing field cannot slide to clean), report assembly.
- **Data (flows through args + prompt files, trivially editable):** lane rosters and lane
  prompts, seat definitions, model tier per role, caps (50-remainder, iteration cap),
  severity floors list, profile-detection signal list.

**Validation policy:** `dryRun: true` swaps every agent for a canned-output stub (haiku,
low effort) covering normal + empty + malformed + null returns, asserting the full topology
for pennies. Required **once at implementation and after structural engine edits only**;
data edits (roster/prompt/cap changes) are trivial by construction and skip it. Goal: a
robust reusable script with minimal invocation-time validation.

**Capability ladder:** Workflow tool (preferred) → manual subagent fan-out with the same
prompt files (documented sequence in SKILL.md) → inline degraded, labeled
`independence: none (inline)`. Same-family caveat stays in SKILL.md and the report: seats
reduce error correlation; they are not family-level independence.

## File layout

```
skills/super-roast/
  SKILL.md                    # triggers (both modes), process, tiering, red flags
  super-roast-workflow.md     # pipeline reference + engine script skeleton + dryRun policy
  triage-prompt.md            # domain triage (design) + lane activation (PR)
  scout-prompts-design.md     # 5 core lenses + domain-expert template (ported from roast)
  scout-prompts-pr.md         # 6 core + 7 conditional lanes with heuristics
  dedupe-prompt.md            # merge + suggested severity + caps
  judge-seat-prompts.md       # shared core + 3 seats + PR-mode additions (validated)
  reporter-prompt.md          # verdicts, profile application, floors, report template
```

## Integration changes

- Delete `skills/roast/`; update `brainstorming` (gate) and `super-plan` references to
  `superpowers:super-roast`.
- super-plan gains the receive-report → fix → auto-re-roast-decision step (small edit,
  coordinated with its own docs).
- Existing roast spec/plan/eval docs under `docs/superpowers/` remain as history; INDEX
  updated.

## Testing plan

1. **dryRun topology test** of the engine (stub agents; cap logic, tiered routing,
   aggregation, coverage gating, report assembly).
2. **Judge-seat regression:** re-run the 2026-07-28 eval fixture (trap A must be 0/3;
   the real gap must confirm).
3. **Live runs before deleting roast:** one design-mode roast of an existing spec in this
   repo; one PR-mode roast of a real branch.
4. **writing-skills pressure test** of the new SKILL.md trigger description (fires on
   design docs AND PRs; does not fire on plain code questions).

## Out of scope

- Cross-family judge seats (no non-Claude models on this harness; the hook stays: use one
  where available).
- Calibration loop / measured false-positive rates (post-launch concern).
- super-plan's internal fix mechanics (owned by that skill's docs).
- Automated fixing inside super-roast (deliberately report-only).
