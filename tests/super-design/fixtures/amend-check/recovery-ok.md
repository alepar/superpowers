owners:
- [Blocking] src/a.sh:10 → owner: docs/spec.md §Retry policy
- [Must-fix] untested: whole-epic review incomplete (bounded hunks only) → recovery: a cluster review is missing; re-review it
- [Must-fix] untested: review-inputs provenance gap → recovery: closes with that collection
- [Should-fix] tests/review-inputs-range-scope.sh:40 → local
amended:
- docs/spec.md §Retry policy
work:
- Fix retry | owns: retry loop; consumes: spec | scripts/retry.sh | covers: [Blocking] src/a.sh:10, [Should-fix] tests/review-inputs-range-scope.sh:40
unchanged:
- Existing CLI stays the same
