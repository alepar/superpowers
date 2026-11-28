owners:
- [Blocking] src/a.sh:10 → owner: docs/spec.md §Retry policy
- [Must-fix] untested: whole-epic review incomplete (bounded hunks only) → local
- [Must-fix] untested: review-inputs provenance gap → local
- [Should-fix] tests/review-inputs-range-scope.sh:40 → local
amended:
- docs/spec.md §Retry policy
work:
- Fix retry | owns: retry loop; consumes: spec | scripts/retry.sh | covers: [Blocking] src/a.sh:10, [Should-fix] tests/review-inputs-range-scope.sh:40
- Unbounded whole-epic review with complete provenance | one review pass over the full diff with review-inputs provenance complete | docs/ | covers: [Must-fix] untested: whole-epic review incomplete (bounded hunks only), [Must-fix] untested: review-inputs provenance gap
unchanged:
- Existing CLI stays the same
