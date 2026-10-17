owners:
- [Blocking] src/retry.sh:10 → owner: docs/spec.md §Retry policy
- [Blocking] src/auth.sh:42 → local
- [Must-fix] reviewer item → local
amended:
- docs/spec.md §Retry policy
work:
- Fix retry | owns: retry loop; consumes: spec | scripts/retry.sh | covers: [Blocking] src/retry.sh:10
- Fix auth and review item | owns: auth; consumes: none | scripts/auth.sh | covers: [Blocking] src/auth.sh:42, [Must-fix] reviewer item
unchanged:
- Existing CLI stays the same
