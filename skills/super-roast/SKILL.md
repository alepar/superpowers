---
name: super-roast
description: Use when adversarially reviewing either a design doc/spec/RFC before implementation or a PR/branch/diff before merge — surfaces gaps, unverified assumptions, and defects, verifies them with a judge panel, and reports severity calibrated to the project's blast radius. Not for reviewing prose style or answering questions about code.
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

**Honest limit:** on Claude Code the panel is same-family Claude, seat-differentiated (three
seats verify by different *method* — reproduce / refute / ground — not by different model), so
agreement is **panel agreement, not independent verification** (real jury debiasing needs
disjoint model families). Use a non-Claude seat where the harness offers one, and for
high-stakes reviews pair super-roast with a human or cross-family review.

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

## The Process

Run via the `Workflow` tool when available (subagent fan-out otherwise; inline as last resort —
see the capability ladder in `./super-roast-workflow.md`). Full procedure, schemas, and the
engine script: **`./super-roast-workflow.md`**.

1. **Pre-flight** — resolve mode, inputs, and the project's environment profile (blast radius:
   prototype / internal / production / regulated). PR inputs are the branch diff + working
   tree, or a PR number resolved via `gh` when `gh` is available and a number was supplied.
   Profile is auto-detected and stated in the report header — never asked.
2. **Triage (sonnet, 1)** — design mode: name 1–3 domains for domain-expert scouts. PR mode:
   activate conditional lanes on top of the always-on core lanes. See `./triage-prompt.md`.
3. **Scouts (opus, parallel)** — design: core lenses (+ domain experts, + widened lenses if
   triage found no domain — see below). PR: core lanes + activated lanes. Adversarial, may use
   WebSearch/WebFetch, return structured findings. See `./scout-prompts-design.md` /
   `./scout-prompts-pr.md`.
4. **Dedupe-and-rank (fable, 1)** — merges overlapping findings (same location + root claim),
   suggests a severity, and applies the remainder cap (`config.remainderCap`): all severe
   findings survive uncapped; the rest are capped and the overflow count reported, never
   silently dropped. See `./dedupe-prompt.md`. A second cap, `config.panelCap` (default 12),
   applies at the next stage: it bounds how many of the surviving severe findings actually get
   a full judge panel — the rest are listed under "## Not verified (beyond panel cap)" with
   their suggested severity, never dropped.
5. **Judges (sonnet, tiered)** — see "Tiered verification" below. See `./judge-seat-prompts.md`.
6. **Reporter (fable, 1)** — issues final verdicts, applies the environment-aware severity
   floors, and writes the report. See `./reporter-prompt.md` and Output below.
7. **Handoff** — report only; the caller (e.g. `super-plan`) decides whether to loop a fix pass
   and re-roast. Auto re-roast is scoped to what the fix touched, capped at 3 iterations, and
   stops early on no progress; both the cap-out and the clean exit **pause for the human** —
   super-roast never declares its own loop finished.

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

### Severity vocabulary (the only one)

**Blocking | Should-fix | Nit | FYI.** `blocker/major/minor` and `BLOCK/REVISE/PASS` do not
appear anywhere in this pipeline — those are `roast`'s vocabulary, not this skill's.

### Severity floors (verbatim — hold under any profile, prototype included)

- Confirmed injection / authZ bypass / secrets-in-code on a network-exposed surface.
- Data-loss or irreversible-migration risk on real data.
- Violation of the artifact's own stated core purpose.

Any of these → **Blocking**, regardless of what the environment profile would otherwise permit.
A profile may soften everything else; it may never soften a floor.

### Tiered verification (replaces `roast`'s shallow/medium/deep depth levels)

There is no depth cap here — verification tier is decided by **suggested severity**, not by a
budget:

- **Blocking / Should-fix candidates** get the **full three-seat panel** — reproduce, refute,
  ground — run in parallel; a failed seat is re-dispatched once.
- **Nit / FYI candidates** get a **single refute-seat spot check.**
- A spot check that returns **CONFIRM at Blocking/Should-fix** is under-graded — it's
  **promoted** to the full three-seat panel.

If you're migrating from `roast` and looking for a depth/cap setting: it isn't here by design —
severity-driven tiering replaces it.

### Report format

```
super-roast verdict: <Blocking (N confirmed) | Should-fix (N confirmed) | clean | clean (low coverage)>
mode: design | pr
profile: <prototype | internal | production | regulated> (auto-detected)
independence: same-family (Claude) — seat-differentiated panel
coverage: <lenses/lanes>, <domains>, <raw → deduped → judged>, <judge completion %>
Confirmed findings:
  - [Blocking|Should-fix|Nit|FYI] <location> — <claim> — <evidence/citation>
Below cap / not promoted: <count>, listed not dropped
Escalations (need human): <UNVERIFIED externals, incomplete panels, material dissent>
```

Full template and field semantics: `./reporter-prompt.md`.

## Model Tiering

| Role | Model | Rationale |
|---|---|---|
| Triage | **sonnet** | A bounded labeling pass (name domains / activate lanes), run once, doesn't set the gate. |
| Scouts | **opus** | Finding non-obvious gaps/defects is the divergent, high-reasoning step; the scout pool is a small fixed set, so the quality gain is cheap. |
| Dedupe-and-rank | **fable** | Merging + grading is a bounded consolidation pass, not a reasoning-heavy one — keeping it off opus is part of the cost win the tiered verification targets. |
| Judges | **sonnet** | Verification is rubric-bound (CONFIRM/REJECT/UNVERIFIED against evidence); judges are the dominant cost (up to 3 seats per finding); their safe failure mode is UNVERIFIED/escalate, not a false confirm. |
| Reporter | **fable** | Aggregating already-judged packets into a verdict + markdown is a bounded synthesis pass, not a reasoning-heavy one. |

## Red Flags

**Never:**
- Dispatch three identical judge prompts — each panel seat (reproduce/refute/ground) is a
  **different method**, not three copies of the same judge.
- Let the environment profile demote a floors-class finding (injection/authZ/secrets on a
  network-exposed surface; data-loss/irreversible-migration on real data; violation of the
  artifact's stated core purpose) — floors are Blocking under any profile.
- Re-litigate a prior report's Rejected section — **except** under the narrow exception: the
  current iteration's evidence differs *materially* from what the prior report cited, and the
  reconsideration explicitly cites that specific new evidence. No new evidence, no reopening.
- Edit the artifact or create tasks — super-roast is **report-only**; the caller (human or
  `super-plan`) decides what happens next.
- Guess the mode on ambiguous input — ask.
- Report a clean verdict when scouts or judges failed to complete — that's
  `clean (low coverage)`, not a clearance.
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

## Integration

- **superpowers:brainstorming** — offers `super-roast` (design mode) as an optional gate after
  the spec is written, before the implementation handoff.
- **super-plan** — consumes the report to decide on a scoped fix + re-roast loop (capped,
  human-paused at both exits).
- **superpowers:requesting-code-review** — a lighter-weight, non-adversarial code review; use
  `super-roast` (PR mode) when you want adversarial defect-hunting with verified findings
  instead.
