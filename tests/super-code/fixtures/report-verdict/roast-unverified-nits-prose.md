super-roast verdict: Should-fix (1 confirmed)
mode: PR        iteration: 1 of 3
inputs: feature/example@abc1234 vs main@def5678

## Confirmed findings
- [Should-fix] src/a.sh:10 — the retry loop has no upper bound
  verdict: confirmed (reproduce ✓)
  evidence: src/a.sh:10 "while true"
  fix-shape hint: cap the loop at five attempts

## Not verified (beyond panel cap)
- none

## Not verified (dedupe failed or judge lost)
- none

## Beyond remainder cap (count only)
- none

## Rejected (with reason)
- none

## Unverified nits (spot-checked)
One refute-seat pass each; not panel-strength verification.
- [Nit] src/a.sh:3 — the comment names a removed flag
- [Nit] src/b.sh:7 — the variable name shadows a builtin

## Escalations (need human)
- none
