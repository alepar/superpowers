super-roast verdict: Should-fix (1 confirmed)
mode: PR        iteration: 1 of 3
inputs: feature/example@abc1234 vs main@def5678

One refute-seat pass checked each nit; that is not panel-strength verification.

## Confirmed findings
- [Should-fix] src/a.sh:10 — the retry loop has no upper bound
  verdict: confirmed (reproduce ✓)
  evidence: src/a.sh:10 "while true"
  fix-shape hint: cap the loop at five attempts

## Not verified (beyond panel cap)
- [suggested Blocking] src/c.sh:20 — the lock is released before the write

## Not verified (dedupe failed or judge lost)
- [unrated] src/d.sh:5 — the parser accepts an empty key (judge lost)

## Beyond remainder cap (count only)
- 3 candidates dropped by the remainder cap — raise config.remainderCap and re-run to see them

## Rejected (with reason)
- [Should-fix] src/e.sh:8 — the trap fires twice
  verdict: refuted
  evidence: src/e.sh:8 shows a single registration

## Unverified nits (spot-checked)
- [Nit] src/a.sh:3 — the comment names a removed flag

## Escalations (need human)
- src/f.sh:1 — external API behaviour is UNVERIFIED; the ground seat died
