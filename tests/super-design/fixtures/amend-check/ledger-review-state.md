# findings ledger — code — through r2
triggers: none
blocking: r1=1 r2=1 carriedB=- regressedB=- degraded=none not-computable=none
ignored-overrides: 0
- [Blocking] src/a.sh:10 · raised r1@abc123 · open · source roast · text reports/r2.md
- [Must-fix] untested: whole-epic review incomplete (bounded hunks only) · raised r2@- · open · source final-review · text reports/final-review-2.md
- [Must-fix] untested: review-inputs provenance gap · raised r2@- · open · source final-review · text reports/final-review-2.md
- [Should-fix] tests/review-inputs-range-scope.sh:40 · raised r2@abc123 · open · source roast · text reports/r2.md
