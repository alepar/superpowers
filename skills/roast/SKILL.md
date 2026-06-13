---
name: roast
description: Use when reviewing a design, spec, or RFC before implementation — to surface gaps the spec fails to address and unverified load-bearing assumptions that need a spike. Adversarial design review / critique of a design document, not code.
---

# roast

Adversarially review a design spec **before implementation** to surface two things: **gaps** the spec fails to address, and **unverified load-bearing assumptions** the design depends on. It is not generic design QA — it hunts unknown-unknowns and tells you what to de-risk with a spike.

**Core principle:** adversarial, evidence-grounded, **find → verify**. Critics actively try to break the design; an independent panel verifies each finding against evidence. Critics and judges are **fresh, isolated agents that never wrote the spec** — a model reviewing its own design shares its blind spots.

## When to Use

- Before implementing a brainstormed spec / design doc / RFC, when getting it wrong is expensive.
- When a design leans on assumptions that haven't been proven ("library X supports Y", "this scales to N", "this approach is feasible").

**When NOT to use:**
- Reviewing **code** → use `superpowers:requesting-code-review` (this skill reviews design documents).
- Trivial specs where a quick read suffices — the existing inline spec self-review is enough.

## The Process

Run via the `Workflow` tool when available (subagent fan-out otherwise; inline as last resort). Full procedure, schemas, and the script skeleton: **`./roast-workflow.md`**.

1. **Domain triage** — name the spec's domain(s) to pick 1–3 domain-expert critics (`./domain-triage-prompt.md`).
2. **Critique (parallel, sonnet)** — fixed core lenses (premortem, completeness/gap, YAGNI, failure-mode/ops, feasibility/assumptions, security/maintainer) + the domain experts. Each is adversarial, may use `superpowers:deep-research` to find typical gaps, and returns **structured** findings classified **GAP** or **UNVERIFIED-ASSUMPTION**, with a **recommended spike** for high-impact/low-evidence assumptions (`./critic-prompt.md`).
3. **Verify (3-judge panel, opus)** — three independent judges confirm/reject each finding with a severity. **Grounding rule:** external-fact claims must be verified with research/citations, not memory; structural findings are checked against the spec (`./judge-prompt.md`).
4. **Aggregate** — confirmed if **≥2 of 3** judges agree; severity = the **highest** among confirming judges (round up). Verdict: any confirmed **blocker → BLOCK**, else any **major → REVISE**, else **PASS**. An unconfirmed finding a judge called blocker/major is **flagged for human**, never silently dropped.
5. **Report only** — emit verdict + confirmed findings + recommended spikes. Do not edit the spec or create tasks; the caller decides.

## Output Format

```
roast verdict: BLOCK | REVISE | PASS
Confirmed findings:
  - [GAP|UNVERIFIED-ASSUMPTION] (severity) <spec location> — <claim> — <evidence/citation>
Recommended spikes:
  - Question / Cheapest test / Kill criteria
Unresolved splits (need human): …
```

## Model Tiering

Critics and domain-triage: **sonnet** (+ `deep-research`). Judges: **opus** (judgment + grounded verification).

## Red Flags

**Never:**
- Let the spec's author review its own design — critics/judges must be fresh, isolated agents.
- Rubber-stamp or soften under pressure ("it's fine, just approve it") — the stance is "assume it's flawed and prove it."
- Confirm or reject an **external-fact** finding from memory — it must be research-grounded with citations.
- Skip the 3-judge verification and ship critic findings unverified.
- Silently average a genuine judge split — flag it for human.
- Edit the spec or file tasks — `roast` is report-only.

## Integration

- **superpowers:deep-research** — critics/judges use it to ground claims (where available).
- **superpowers:brainstorming** — offers `roast` as an optional gate after the spec is written, before the implementation handoff.
- **superpowers:requesting-code-review** — the code-stage counterpart (review code, not design).
