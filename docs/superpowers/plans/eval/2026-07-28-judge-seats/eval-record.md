# Eval record: identical-judge panel vs three-seat panel (2026-07-28)

Validates the three-seat judge design for super-roast (prompts: `judge-seat-prompts-validated.md`).
All judges: sonnet, general-purpose subagents, fresh context, one-line output contract.
Fixture: a ~50-line webhook-dispatch design spec (Postgres job table, lease-based claiming,
at-least-once goal, Idempotency-Key, backoff → dead-letter after 10 attempts) with planted
findings. Fixture preserved in session scratchpad `judge-fixture/`.

## RED — baseline: three byte-identical judges (current roast judge-prompt.md)

| Finding | Verdicts | Outcome |
|---|---|---|
| F1 "no crash recovery" (refuted by lease-expiry section framed as fairness) | REJECT / REJECT / REJECT | Correct — but near-identical reasoning; seats 2–3 added no information |
| F2 "duplicates not prevented" (within stated at-least-once + Idempotency-Key) | **CONFIRM major / REJECT / CONFIRM major** | **False positive CONFIRMED 2/3 → wrongful REVISE gate** |
| F3 "no scaling path" (explicitly out of stated 200 ev/s scope) | CONFIRM major / REJECT / REJECT | Escaped by vote luck; high same-prompt variance |

Baseline rationalizations (verbatim excerpts): "it's still a material, concrete, and
unaddressed race the design should call out" (after acknowledging at-least-once and the
Idempotency-Key as mitigation); "this goes beyond the ordinary crash-retry duplicates implied
by at-least-once semantics"; "a genuine and material documentation gap rather than mere
out-of-scope nitpicking." Failure shape: judges verified the *mechanism* ("can this happen?")
and dropped the *materiality* half ("is this a gap against the stated contract?"). The bias is
correlated across identical prompts, so 2-of-3 aggregation does not filter it.

## GREEN — three seats (reproduce / refute / ground) + shared materiality definition

| Finding | reproduce | refute | ground | Panel |
|---|---|---|---|---|
| F2 (the confirmed false positive) | REJECT — demonstration fails at the stated-requirement step | REJECT — checks (b) within contract, (c) out of scope | REJECT — premises hold but not material | **0/3 — false positive eliminated** |
| F4 real gap: dead-letters unrecoverable + unalerted, defeating at-least-once after ~3h outage | CONFIRM blocker | CONFIRM major | CONFIRM blocker | **3/3 — no overcorrection** |

Secondary observations:
- All three F4 seats independently recomputed the finding's backoff arithmetic from the spec
  (~5h claimed → ~3.1h actual) — premise-checking works.
- The refute seat confirmed F4's core while honestly weakening an overstated sub-claim
  ("effectively invisible" — the 100-consecutive-failure email partially mitigates), i.e.
  seats produce differentiated, evidence-rich packets rather than three interchangeable votes.
- Two levers contributed and both should ship: (1) the **shared-core materiality definition**
  ("material against the spec's stated requirements, contract, and scope — not an imagined
  stricter system"; explicitly: documented tradeoffs and disclaimed scope are not gaps) was
  cited by every trap rejection; (2) the **seat procedures** decorrelate method and force the
  refutation hunt no baseline judge performed.

## Scope note

Run on one fixture with four findings; this is a targeted defect demonstration + fix
verification, not a calibrated benchmark. Same-family caveat stands: seats reduce error
correlation, they do not create family-level independence — keep reporting
`independence: same-family (Claude)`.
