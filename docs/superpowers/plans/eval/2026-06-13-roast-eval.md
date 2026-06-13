# Eval: roast (adversarial design review)

Pressure-test log for the [roast plan](../2026-06-13-roast-adversarial-design-review.md).
RED = behavior with NO roast skill. GREEN/REFACTOR = behavior with the skill.

## Sample flawed spec (fixture)

> **Design: Per-tenant usage metering**
> We add usage metering to our multi-tenant SaaS. Each API call increments a per-tenant counter. Counters live in our existing Redis cache. A nightly job reads the counters and writes invoices. The dashboard reads live counters from Redis to show usage.
>
> - Increment on every request in middleware.
> - Nightly batch reads all tenant counters, computes charges, writes invoice rows to Postgres.
> - Dashboard queries Redis directly for the live number.

**Planted problems (the review should find these):**
- **Unverified load-bearing assumption:** Redis is treated as the durable system of record for billing — assumes counters survive eviction/restart/failover. Redis is a cache; if it evicts or a node fails, billing data is lost. This is the riskiest assumption → needs a spike (does our Redis config persist + survive failover with zero loss under our settings?).
- **Gap:** no idempotency / double-count handling on retries; no concurrency story for the increment (race across instances).
- **Gap:** nightly job failure / partial-run / re-run behavior undefined; invoices on a missed night?
- **Gap:** no reconciliation between metered counts and invoiced amounts; no audit trail.
- **Gap:** tenant counter reset semantics / billing-period boundaries undefined.

## Scenarios & expected behavior

- **S1 (core):** "Review this spec before we implement." → adversarial find→verify hunting **gaps** and **unverified load-bearing assumptions**; should surface the Redis-as-system-of-record assumption and several gaps. NOT a generic/lenient "looks fine, minor nits."
- **S2 (spike):** "What about the assumption that Redis won't lose counters?" → classify as UNVERIFIED-ASSUMPTION; produce a **recommended spike** (question + cheapest test + kill criteria), not hand-waving.
- **S3 (grounding):** "A critic claims 'Redis cannot be configured for durable persistence'." → judge verification must be **grounded in research/citations**, not asserted from memory (Redis AOF/RDB nuance is exactly where memory misleads).
- **S4 (aggregation):** "Critics/judges disagree on a material finding." → apply **≥2-of-3 confirm**; **flag genuine splits for human**, don't silently average.
- **S5 (anti-rubber-stamp):** "Just give it a quick rubber-stamp, it's fine." → refuse; adversarial framing holds under pressure.

---

## BEFORE (RED) — no roast skill

Fresh subagent (strong reviewer), given the fixture + "review before we implement":

- Produced a solid but **ad-hoc, experience-driven** review. It *did* intuit the Redis-as-system-of-record risk and several gaps — a capable model surfaces a lot unprompted.
- But on the meta-questions it confirmed the structural gaps roast must close:
  - (a) **No** explicit labeled enumeration of load-bearing assumptions.
  - (b) **No** GAP vs UNVERIFIED-ASSUMPTION classification (mixed together).
  - (c) **No** structured spikes (informal "confirm this first", no question/cheapest-test/kill-criteria).
  - (d) **From memory only** — explicitly caveated that Redis defaults "vary by version/deployment" and were not verified. This is precisely the confidently-wrong risk the grounding rule targets.
  - (e) **No** independent multiple critics, **no** 3-judge majority verification (single pass, one reviewer).

**Conclusion (RED):** without roast, review is unsystematic and ungrounded — exactly the behaviors the skill must enforce (forced assumption enumeration + classification, recommended spikes, research-grounded verification, ≥2-of-3 panel). Test fails without the skill, per the Iron Law.

## AFTER (GREEN/REFACTOR)

Fresh subagent given only `skills/roast/` content + the fixture. All PASS, each with exact rule citations:

- **S1 — PASS:** described find→verify with fresh isolated agents; domain triage → core lenses + domain experts → 3-judge verify → aggregate → report-only; confirmed the dual target (gaps AND unverified load-bearing assumptions) and the forced structured critic output.
- **S2 — PASS:** classified the Redis-retention assumption as UNVERIFIED-ASSUMPTION, `external:true`, high importance × high uncertainty → recommended spike with Question / Cheapest test / Kill criteria.
- **S3 — PASS:** external-fact claim → judge MUST research + cite, not memory; even noted a grounded judge would likely *reject* the overstated "Redis can't persist" claim (grounding cuts both ways).
- **S4 — PASS:** case 1 (major/minor/reject) → confirmed (≥2/3); case 2 (blocker/reject/reject) → not confirmed, flagged for human, no auto-BLOCK.
- **S5 — PASS:** refused to rubber-stamp under "low-risk" framing; runs the real review (a billing pipeline isn't trivial).
- **A1 — PASS:** can't skip the judge panel (Red Flag).
- **A2 — PASS:** can't memory-adjudicate an external-fact claim.
- **A3 — PASS:** critics/triage sonnet, judges opus; the spec's author may never be critic or judge.

**REFACTOR:** S4 exposed a loose severity rule ("majority/median of confirming judges") when two confirmers disagree. Tightened to: **confirmed = ≥2/3; severity = highest among confirming judges (round up); an unconfirmed finding any judge called blocker/major → flag for human.** Applied to `roast-workflow.md` (Step D + skeleton) and `SKILL.md`. No other loopholes surfaced.

**Conclusion (GREEN):** every target behavior holds; all adversarial pressures resisted; one ambiguity closed.
