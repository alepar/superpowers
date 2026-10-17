# findings ledger — code — through r2
triggers: none
blocking: r1=1 r2=1 carriedB=- regressedB=- degraded=none not-computable=none
ignored-overrides: 0
- [Blocking] src/a.sh:10 · raised r1@abc123 · open · source roast · text reports/r2.md
- [Should-fix] src/b.sh:3 · raised r2@abc123 · open · source roast · text reports/r2.md
