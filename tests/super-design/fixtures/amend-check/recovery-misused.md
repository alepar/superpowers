owners:
- [Blocking] src/a.sh:10 → recovery: someone else will review it
- [Must-fix] untested: whole-epic review incomplete (bounded hunks only) → recovery: a cluster review is missing
- [Must-fix] untested: review-inputs provenance gap → recovery: closes with that collection
- [Should-fix] tests/review-inputs-range-scope.sh:40 → local
amended:
- docs/spec.md §Retry policy
work:
- Fix scope test | owns: the test | tests/ | covers: [Should-fix] tests/review-inputs-range-scope.sh:40
unchanged:
- Existing CLI stays the same
