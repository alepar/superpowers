---
name: super-roast
description: Use when adversarially reviewing a design doc, spec, or RFC before implementation, or a PR, branch, or diff before merge. Not for reviewing prose style, and not for answering questions about what code does.
---

# super-roast

Adversarially review either a **design** (spec/RFC, before implementation) or a **PR/branch/diff**
(before merge) to surface what it fails to address: gaps, unverified load-bearing assumptions,
and — in PR mode — actual defects. It is not generic QA — it hunts unknown-unknowns and defects,
verifies each candidate against evidence, and reports severity calibrated to the project's blast
radius (a prototype and a payments service do not get the same bar).

**Core principle:** adversarial, evidence-grounded, **find → dedupe → verify → report**. Scouts
actively try to break the artifact; a seat-differentiated judge panel verifies each finding.
Scouts and judges are **fresh, isolated agents that never wrote the artifact** — a model
reviewing its own work shares its blind spots.

**Honest limit:** on a single-vendor harness the panel is same-family, seat-differentiated
(three seats verify by different *method* — reproduce / refute / ground — not by different
model), so agreement is **panel agreement, not independent verification** (real jury debiasing
needs disjoint model families). Use a second-family seat where the harness offers one, and for
high-stakes reviews pair super-roast with a human or cross-family review. The report's
`independence:` line states which case this run was, derived from the seats actually dispatched
— never a fixed string (a manual run on a non-Claude panel once shipped a `Claude` label; see
`./super-roast-workflow.md`'s capability ladder).

## When to Use

- **Design mode:** before implementing a brainstormed spec / design doc / RFC, when getting it
  wrong is expensive.
- **PR mode:** before merging a branch/diff, to catch defects, regressions, and unverified
  claims the author's own review missed.

**When NOT to use:**
- Reviewing prose style, or answering questions about what code does — this is adversarial
  review, not explanation or copyediting.
- Trivial specs or one-line diffs where a quick read suffices.

**Mode selection:** caller-stated mode wins; otherwise infer from what's obviously being
reviewed (a spec file path vs. a diff/branch); if genuinely ambiguous, **ask — never guess.**
When the caller states the run is autonomous, there is no one to ask: take the mode best
supported by the artifact's form, proceed, and mark the assumption on the report's `mode:`
line when writing the report file (e.g. `mode: PR (assumed — input is a branch diff)`).

## Inputs (from a caller)

| Input | Meaning |
|---|---|
| mode | `design` or `PR` — see When to Use |
| the artifact | design mode: a spec file or settled tree; PR mode: `branch@sha` vs `base@sha` — the caller supplies the base to diff against |
| report-location override | directory the report is written to instead of the default below |
| iteration `N` | printed in the report header (`iteration: N of 3`); this skill is stateless, so the caller carries the count. A caller running a whole-branch roast *after* its fix loop's cap has tripped passes the literal `post-cap audit` instead of a number — the header accepts it, and the run is never counted as a fourth round |
| prior report path (rounds ≥ 2) | lets the run skip re-litigating what `## Rejected (with reason)` already settled — and switches the run into its late-round shape: scouts get the iterations-≥2 materiality bar ("no material findings" is a valid, expected outcome; manufacturing marginal findings is the failure mode) in place of round 1's high-recall section, and a `regression` lens/lane joins the roster to review what the fixes themselves touched (see the scout prompt files' "Iteration stance" sections) |
| autonomous (optional) | see Mode selection above and the Handoff exception in The Process step 7 |

Only mode and the artifact are required; a bare invocation gets defaults for the rest.

## The Process

Run via the `Workflow` tool when available (subagent fan-out otherwise; inline as last resort —
see the capability ladder in `./super-roast-workflow.md`). Full procedure, schemas, and the
engine script: **`./super-roast-workflow.md`**. Assemble the engine's `args` with
`bash <this skill's dir>/scripts/assemble-args` rather than by hand — it applies the round's
stance, recall policy and `regression` lane from the prompt files below.

1. **Pre-flight** — resolve mode, inputs, and the project's environment profile (blast radius:
   prototype / internal / production / regulated). PR inputs are the branch diff + working
   tree, or a PR number resolved via `gh` when `gh` is available and a number was supplied.
   Profile is auto-detected and stated in the report header — never asked.
2. **Triage (sonnet, 1)** — design mode: name 1–3 domains for domain-expert scouts. PR mode:
   activate conditional lanes on top of the always-on core lanes. It runs alongside the core
   scouts, which need nothing from it. See `./triage-prompt.md`.
3. **Scouts (opus, parallel)** — design: core lenses (+ domain experts, + widened lenses if
   triage found no domain — see below). PR: core lanes + activated lanes. **Rounds ≥ 2** (a
   prior report was supplied): scouts run under the late-round stance and the `regression`
   lens/lane joins the roster — both assembled by the orchestrator, per the "Iteration stance"
   sections of the scout prompt files. Adversarial, may use
   WebSearch/WebFetch, return structured findings. See `./scout-prompts-design.md` /
   `./scout-prompts-pr.md`.
4. **Dedupe-and-rank (fable, 1; skipped when scouts found nothing)** — groups overlapping
   findings by id (same location + root claim), suggests a severity, and ranks; the engine
   assembles each merged finding from its members, so no evidence is lost in transcription. If
   dedupe fails twice, every raw finding reaches the report unjudged under "## Not verified
   (dedupe failed or judge lost)". See `./dedupe-prompt.md`. The engine then applies the
   remainder cap (`config.remainderCap`, default 50): all severe findings survive
   uncapped; the Nit/FYI tail beyond the cap survives as a count, never silently dropped.
   Severe findings are NOT capped at the next stage by default: every one gets a full judge
   panel, in both modes, because an unverified Blocking candidate is not a cleared one. An
   optional `config.panelCap` bounds that cost when a caller wants it — the rest are then
   listed under "## Not verified (beyond panel cap)" with their suggested severity, never
   dropped.
5. **Judges (sonnet, tiered)** — see "Tiered verification" below. See `./judge-seat-prompts.md`.
6. **Reporter (fable, 1)** — overrules the engine's default routes only with cited seat
   evidence, applies the environment-aware severity floors, and writes the report. See
   `./reporter-prompt.md` and Output below.
7. **Handoff** — report only; the caller (e.g. `super-design`) decides whether to loop a fix pass
   and re-roast. A re-roast reviews the full artifact each round — under the late-round stance,
   with the `regression` lens covering what the fixes themselves touched (step 3) — capped at 3
   iterations, and
   stops early on no progress **or on a `[converged]` verdict** (zero Blocking of any
   provenance on a non-degraded round ≥ 2 — see Report format below); both the cap-out and the clean exit **pause for the human** —
   super-roast never declares its own loop finished. **Exception when the caller states the run is
   autonomous:** return the same summary to the caller instead of pausing — the caller parks it and
   surfaces it in its own report. Still never declare the loop finished; report to a caller rather
   than a human.

### Design-mode lens widening

Both roast and `./triage-prompt.md` promise that a design triage returning **no domains** widens
the core lens set instead of shrinking the scout pool. The engine makes this explicit via two
config keys:

- **`config.coreLenses`** — lenses that always run in design mode:
  `['premortem', 'completeness', 'yagni', 'failure-mode', 'feasibility']`.
- **`config.widenLenses`** — added *only* when triage returns zero domains:
  `['security', 'maintainer']`.

Non-empty domains never trigger widening — the domain scouts themselves cover that ground.
PR mode has no equivalent: `config.coreLanes` always runs, and triage only ever adds lanes.

**Domain scouts come from a template, not from `prompts.scouts`.** Domains are open-ended free
text that triage produces *at runtime*, while `args.prompts` is assembled *before* the engine
runs — so a per-domain entry under `prompts.scouts` can never exist. The orchestrator instead
supplies one **`prompts.scoutDomainTemplate`** string (the `Lens: domain:<name>` assembly in
`./scout-prompts-design.md`) carrying a literal `{{DOMAIN}}` token, and the engine fills it once
per triaged domain. Skip this and naming domains is strictly worse than naming none: widening is
suppressed *and* the domain scouts are undispatchable. A scout name that resolves to no prompt
is counted as a dead scout (coverage loss, visible in the verdict), never a crashed run.

### Severity vocabulary (the only one)

**Blocking | Should-fix | Nit | FYI.** `blocker/major/minor` and `BLOCK/REVISE/PASS` do not
appear anywhere in this pipeline — those are `roast`'s vocabulary, not this skill's.

### Severity floors (verbatim — hold under any profile, prototype included)

- Confirmed injection / authZ bypass / secrets-in-code that is potentially exploitable to escalate
  privilege or reach data the invoker could not already reach. Any network-exposed surface
  qualifies; so does local tooling running with privileges its caller lacks. A flaw whose only
  "attacker" is the invoker feeding their own inputs, gaining nothing they did not already hold,
  is judged on its merits rather than floored.
- Data-loss or irreversible-migration risk on real data.
- Violation of the artifact's own stated core purpose.

Any of these → **Blocking**, regardless of what the environment profile would otherwise permit.
A profile may soften everything else; it may never soften a floor. Floors apply to what the
change introduces or worsens: in PR mode a defect already present on the base branch is
confirmed at **FYI** (flagged `preExisting`) — reported, never a fix-round driver.

### Tiered verification (replaces `roast`'s shallow/medium/deep depth levels)

There is no depth cap here — verification tier is decided by **suggested severity**, not by a
budget:

- **Blocking / Should-fix candidates** get the **full three-seat panel** — reproduce, refute,
  ground — run in parallel; a failed seat is re-dispatched once.
- **Nit / FYI candidates** get a **single refute-seat spot check.**
- A spot check that returns **CONFIRM at Blocking/Should-fix** is under-graded — it's
  **promoted** to the full three-seat panel: the reproduce and ground seats run, and the spot
  check's verdict is its refute vote.
- Judges never see the suggested severity — they rate blind.
- The engine computes each packet's default route: a full panel with 2+ CONFIRM is confirmed,
  2+ REJECT rejected; a dead seat, an external claim with an UNVERIFIED vote, or a panel whose
  UNVERIFIED votes leave no 2-vote majority escalates to a human. The reporter may overrule
  confirmed/rejected only by citing seat evidence, and never un-escalates; the engine re-adds
  any escalation the reporter omits and keeps a pre-existing defect at FYI.

### Report format

```
super-roast verdict: <Blocking (n confirmed) | Should-fix (n confirmed) | clean (n nits)> [low coverage] [panel-capped: N unverified] [converged]
mode: design | PR        iteration: N of 3
profile (assumed): <2–4 sentence inferred profile>
inputs: <spec paths | branch@sha vs base@sha [+dirty] | PR#>
delta vs prior: <X> new confirmed (<xB> Blocking) · <Y> carried (<yB> Blocking) · <Z> resolved · <W> regressed (<wB> Blocking)   ← iterations ≥ 2 only
coverage: <lanes ran> · <raw → deduped → panel/spot-checked counts> · <judge completion %> · remainder-capped: N
independence: <derived from the seats as invoked: same-family (<family>) — seat-differentiated panel | cross-family (<families>) — seat-differentiated panel | none (inline)>
seat-agreement: panels N · rr 0.78 · rg 0.89 · fg 0.67 · unanimous 0.56 · ground-loo 0.83 (n=6) · reproduce 7/2/0 · refute 5/4/0 · ground 6/3/0   ← omitted entirely when N == 0

## Confirmed findings            ← consumed by super-design, one task per finding
- [SEV] <location> — <claim> [fix-regression]   ← tag only on findings a regression scout raised
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: <strongest seat evidence, file:line / URL+quote>
  fix-shape hint: <one advisory line>

## Not verified (beyond panel cap)   ← severe candidates the panel cap left unverified — listed, never dropped
- [suggested SEV] <location> — <claim>

## Not verified (dedupe failed or judge lost)   ← findings a pipeline failure left unjudged — listed, never dropped
- [suggested SEV | unrated] <location> — <claim> (dedupe failed | judge lost)

## Beyond remainder cap (count only)   ← low-severity candidates the dedupe remainder cap dropped; the count survives, the claims do not
- <N> candidates dropped by the remainder cap — raise config.remainderCap and re-run to see them

## Rejected (with reason)        ← so re-roasts don't re-litigate
## Unverified nits (spot-checked)
## Escalations (need human)      ← UNVERIFIED externals, incomplete panels, unsettled panels, material dissent
```

The report is written to `docs/superpowers/reviews/YYYY-MM-DD-<topic>-roast-<mode>-N.md`
(`<mode>` = `design` or `pr`, N = iteration) by the orchestrator, after the engine returns
`reportMarkdown` — the pipeline itself writes nothing to the repo.
- (User preferences for report location override this default — `super-auto` supplies its run directory.)
- **`<mode>` is in the filename, not just the header, because the same topic gets roasted twice:
  once as a design and once as a PR.** Without it both land on `…-roast-1.md` on the same day in
  the same directory, and the PR-mode report silently overwrites the design-mode one — taking with
  it the only record of which design decisions a roast changed. A caller that redirects the
  directory inherits this protection automatically; one that renames the file must keep the mode.

**`[fix-regression]`** ends a finding's entry line when a `regression` scout (rounds ≥ 2) raised
it: damage the previous round's fixes did. The engine adds the tag, not the reporter, and returns
the same findings as `fixRegressions`. A caller's fix loop uses it to tell self-inflicted defects
from the rest of a converged round's punch list.

**`delta vs prior` and `[converged]` are the loop's convergence signal** (iterations ≥ 2
only; both absent on iteration 1). The delta line counts confirmed findings as new / carried /
resolved / regressed against the prior report, with Blocking sub-counts. `[converged]` appears
on the verdict when a non-degraded round ≥ 2 confirms **zero Blocking of any provenance** —
no new, no regressed, no carried — and is never emitted alongside `[low coverage]` or
`[panel-capped]` (a degraded round finding nothing is absence of evidence, not convergence).
A round ≥ 2 whose scouts all returned and found nothing is the opposite case: the engine marks it
`emptyLateRound` and sets `[converged]` itself.
It tells the caller's fix loop to stop iterating and treat any remaining sub-Blocking
confirmations as a punch list instead of running another round into diminishing returns.
Full semantics: `./reporter-prompt.md` Steps 3–4.

**The two caps lose findings differently, and the report says so differently.** `beyondPanelCap`
(severe candidates the judge panel never reached) are listed individually under "## Not verified
(beyond panel cap)". `beyondCap` (the Nit/FYI overflow past the remainder cap) survives only
as a count the engine keeps — so it gets the "## Beyond remainder cap" count line and the
`remainder-capped: N` term on the coverage line. Neither is ever silently
dropped; they are just recoverable to different depths.

Full template and field semantics: `./reporter-prompt.md`.

## Model Tiering

| Role | Model | Rationale |
|---|---|---|
| Triage | **sonnet** | A bounded labeling pass (name domains / activate lanes), run once, doesn't set the gate. |
| Scouts | **opus** | Finding non-obvious gaps/defects is the divergent, high-reasoning step; the scout pool is a small fixed set, so the quality gain is cheap. |
| Dedupe-and-rank | **fable** | Merging + grading is a bounded consolidation pass, not a reasoning-heavy one — keeping it off opus is part of the cost win the tiered verification targets. |
| Judges | **sonnet** | Verification is rubric-bound (CONFIRM/REJECT/UNVERIFIED against evidence); judges are the dominant cost (up to 3 seats per finding); their safe failure mode is UNVERIFIED/escalate, not a false confirm. |
| Reporter | **fable** | Aggregating already-judged packets into a verdict + markdown is a bounded synthesis pass, not a reasoning-heavy one. |

Reasoning effort is set per stage through `config.effort` (defaults: triage `low`, spot checks
`medium`, reporter `high`; the rest inherit the session) — see `./super-roast-workflow.md`.

## Red Flags

**Never:**
- Dispatch three identical judge prompts — each panel seat (reproduce/refute/ground) is a
  **different method**, not three copies of the same judge.
- Let the environment profile demote a floors-class finding (injection/authZ/secrets on a
  privilege-escalating or unauthorized-access reach (incl. any network-exposed surface);
  data-loss/irreversible-migration on real data; violation of the
  artifact's stated core purpose) — floors are Blocking under any profile.
- Re-litigate a prior report's Rejected section — **except** under the narrow exception: the
  current iteration's evidence differs *materially* from what the prior report cited, and the
  reconsideration explicitly cites that specific new evidence. No new evidence, no reopening.
- Edit the artifact or create tasks — super-roast is **report-only**; the caller (human or
  `super-design`) decides what happens next.
- Guess the mode on ambiguous input — ask (autonomous runs: assume and state it, per Mode selection).
- Report a clean verdict when scouts or judges failed to complete — that's
  `clean (n nits) [low coverage]`, not a clearance.
- Run a round ≥ 2 with round-1 scout framing — the late-round stance ("no material findings"
  is a valid, expected outcome) and the `regression` lens are what keep a re-roast from
  manufacturing marginal findings against an already-hardened artifact; skipping them is how
  round 3 turns into noise a human has to shut down.
- Emit `[converged]` on iteration 1, on a `[low coverage]`/`[panel-capped]` round, or while
  any Blocking (new, carried, or regressed) is confirmed — a wrong `[converged]` ends the
  caller's fix loop with real work still open.
- CONFIRM an external-fact claim without a resolved citation — if it can't be grounded via
  WebSearch/WebFetch, return UNVERIFIED, don't confirm from memory.
- Drop UNVERIFIED findings, incomplete panels, or material dissent — escalate to human, never
  silently drop.

## Limitations

Same-family panel ≠ independent verification (seat-differentiation reduces correlated error, it
doesn't buy family-level independence); recall is bounded by what scouts surface; web-only
grounding means internal/very-new claims often return UNVERIFIED (the honest answer, not a
pass); profile inference can be wrong — that's why the header states the detected profile
instead of silently applying it.

## Friction log

When invoked inside a super-auto/super-design/super-code run, append friction events (skill-machinery defects, workarounds, guidance that read wrong) to the enclosing run's friction log per `superpowers:upstream-feedback`'s format, the moment they happen. A standalone roast skips this — its report is already the feedback channel — and never runs that skill's analysis itself.

## Integration

- **superpowers:brainstorming** — offers `super-roast` (design mode) as an optional gate after
  the spec is written, before the implementation handoff.
- **super-design** — consumes the report to decide on a scoped fix + re-roast loop (capped,
  human-paused at both exits).
- **superpowers:requesting-code-review** — a lighter-weight, non-adversarial code review; use
  `super-roast` (PR mode) when you want adversarial defect-hunting with verified findings
  instead.
