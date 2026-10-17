# findings ledger — code — through r4
triggers: none
blocking: r3=2 r4=2 carriedB=- regressedB=- degraded=none not-computable=none
ignored-overrides: 0
- [Blocking] src/a.sh:10 · raised r1@abc123 · open · source roast · text reports/r4.md
- [Should-fix] src/b.sh:5; src/c.sh:7 · raised r2@abc123 · open · source roast · text reports/r4.md
- [Should-fix] src/d.sh:3 · raised r1@abc123 · open (returned r3) · source roast · text reports/r4.md
- [Must-fix] reviewer item, with comma · raised r4@- · open · source final-review · text reports/final-review-4.md
- [Nit] old nit · raised r1@abc123 · resolved@r2 · source roast · text reports/r1.md
- [Blocking] src/e.sh:1 · raised r1@abc123 · disputed@r2 (x) · source roast · text reports/r2.md
- [Nit] a | b · raised r3@abc123 · open · source roast · text reports/r4.md
