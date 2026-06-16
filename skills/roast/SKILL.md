---
name: roast
description: Use when reviewing a design, spec, or RFC before implementation — to surface gaps the spec fails to address and unverified load-bearing assumptions that need a spike. Adversarial design review / critique of a design document, not code.
---

# roast

Adversarially review a design spec **before implementation** to surface two things: **gaps** the spec fails to address, and **unverified load-bearing assumptions** the design depends on. It is not generic design QA — it hunts unknown-unknowns and tells you what to de-risk with a spike.

**Core principle:** adversarial, evidence-grounded, **find → dedup → verify**. Critics actively try to break the design; a panel verifies each finding against evidence. Critics and judges are **fresh, isolated agents that never wrote the spec** — a model reviewing its own design shares its blind spots.

**Honest limit:** on Claude Code the panel is mostly the same model family, so "≥2/3 agree" is **panel agreement, not independent verification** (real jury debiasing needs disjoint model families). Use a non-Claude judge for one seat where the harness offers it, and for high-stakes designs pair roast with a human or cross-family review. roast mainly catches what Claude knows to look for.

## When to Use

- Before implementing a brainstormed spec / design doc / RFC, when getting it wrong is expensive.
- When a design leans on assumptions that haven't been proven ("library X supports Y", "this scales to N", "this approach is feasible").

**When NOT to use:**
- Reviewing **code** → use `superpowers:requesting-code-review` (this skill reviews design documents).
- Trivial specs where a quick read suffices — the existing inline spec self-review is enough.

## The Process

Run via the `Workflow` tool when available (subagent fan-out otherwise; inline as last resort). Full procedure, schemas, and the script skeleton: **`./roast-workflow.md`**.

1. **Domain triage** — name the spec's domain(s) to pick 1–3 domain-expert critics; lean toward recall, and if `none`, widen the core lenses (`./domain-triage-prompt.md`).
2. **Critique (parallel, opus)** — fixed core lenses (premortem, completeness/gap, YAGNI, failure-mode/ops, feasibility/assumptions, security/maintainer) + the domain experts. Each is adversarial, may use **web search (WebSearch/WebFetch)** to find typical gaps, and returns **structured** findings classified **GAP** or **UNVERIFIED-ASSUMPTION**, with a **recommended spike** for high-impact/low-evidence assumptions (`./critic-prompt.md`).
3. **Dedup-and-rank (agent)** — one sonnet agent merges overlapping findings (same location + root claim), grades each a **blast-radius severity** (triage only — not the gate severity), and ranks them so the **depth** cap can pick the top-X to verify (`./dedup-rank-prompt.md`).
4. **Verify (3-judge panel, sonnet)** — three independent judges return CONFIRM (with a required citation for external claims) / REJECT / **UNVERIFIED** per finding. **Grounding rule:** external-fact claims must be verified with **WebSearch/WebFetch**, not memory; if research is inconclusive → UNVERIFIED (routed to human). Structural findings are checked against the spec. Re-dispatch a failed judge once; never confirm on fewer than 3 valid verdicts. Judges also surface any material issue no critic raised (recall hedge) (`./judge-prompt.md`).
5. **Aggregate** — confirmed if **≥2 of 3** CONFIRM; verdict severity = the **median** of the confirming judges (not the max — one alarmist judge shouldn't drive the gate). Verdict: confirmed **blocker → BLOCK**, else confirmed **major → REVISE**, else **PASS**. **Coverage gate:** a PASS produced because critics/judges failed, or with no requirements baseline, is reported as **`PASS (low coverage)`**, not a clearance. UNVERIFIED findings, incomplete panels, and material dissent are **escalated to human**, never dropped.
6. **Report only** — emit verdict + confirmed findings + recommended spikes + escalations. Do not edit the spec or create tasks; the caller decides.

## Depth

`depth` caps how many distinct (post-dedup) findings reach the judges — the dominant cost.
Detected from the invocation's natural language; default **medium**. Below-cap findings are
**listed, not dropped**; a finding graded `blocker` is verified even past the cap.

| Level | Cap | Phrasing |
|---|---|---|
| shallow | 5 | "quick / shallow roast" |
| **medium** | **10** | plain "roast" (**default**, incl. the brainstorming gate) |
| deep | 20 | "deep / thorough roast" |
| unlimited | ∞ | "exhaustive / full roast" |

Full mechanics in `./roast-workflow.md`.

## Output Format

```
roast verdict: BLOCK | REVISE | PASS | PASS (low coverage)
depth: <shallow|medium|deep|unlimited> (cap <N>)
independence: cross-family | same-family (Claude) | none (inline)
coverage: <lenses>, <domains>, <before→after dedup → verified>, <judge completion %>
Confirmed findings:
  - [GAP|UNVERIFIED-ASSUMPTION] (median sev / max sev) <spec location> — <claim> — <evidence/citation>
Recommended spikes:
  - Question / Cheapest test / Kill criteria
Not verified (below depth cap): <count> — re-run deeper to verify
  - [GAP|UNVERIFIED-ASSUMPTION] (graded sev) <spec location> — <claim>
Escalations (need human): <UNVERIFIED externals, incomplete panels, material dissent>
```

**REVISE vs BLOCK:** BLOCK = don't implement until blockers are resolved or knowingly accepted; REVISE = fix the majors in the spec, then proceed. From `brainstorming`, both loop back to revision (re-roast capped at ~2 iterations to avoid thrash).

## Model Tiering

Critics: **opus** (+ WebSearch/WebFetch) — finding non-obvious gaps is the divergent, high-reasoning step, and the critic pool is a small fixed set, so the quality gain is cheap. Domain-triage and dedup-and-rank: **sonnet** — both are bounded labeling passes (triage names domains; dedup-and-rank merges + grades a blast-radius triage severity), run once, and do not set the gate; keeping them off opus is part of the cost win that the depth cap targets. Judges: **sonnet** (+ WebSearch/WebFetch) — verification is rubric-bound (CONFIRM/REJECT/UNVERIFIED against evidence) with 3-way majority, and judges are the dominant cost (3 per distinct finding); their safe failure mode is UNVERIFIED→human, not a false confirm. Use a non-Claude model for one judge seat if the harness offers it.

## Red Flags

**Never:**
- Let the spec's author review its own design — critics/judges must be fresh, isolated agents.
- Rubber-stamp or soften under pressure ("it's fine, just approve it") — the stance is "assume it's flawed and prove it."
- CONFIRM an **external-fact** finding without a resolved citation — if you can't ground it, return UNVERIFIED, don't guess from memory.
- Skip verification and ship critic findings unverified; confirm on fewer than 3 valid judge verdicts.
- Drop UNVERIFIED findings, incomplete panels, or material dissent — escalate to human.
- Report a clean PASS when critics/judges failed or there was no requirements baseline — it's `PASS (low coverage)`.
- Claim independent/cross-family verification when the panel is same-family Claude.
- Edit the spec or file tasks — `roast` is report-only.

## Limitations

Same-family panel ≠ independent verification; no calibration loop (verdicts are judgement, not measurement); recall is bounded by what critics surface; web-only grounding means internal/very-new tech often returns UNVERIFIED (the honest answer, not a pass). See `./roast-workflow.md`.

## Integration

- **superpowers:brainstorming** — offers `roast` as an optional gate after the spec is written, before the implementation handoff.
- **superpowers:requesting-code-review** — the code-stage counterpart (review code, not design).
