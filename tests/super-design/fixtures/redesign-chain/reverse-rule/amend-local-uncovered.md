owners:
- [Blocking] src/retry.sh:10 → owner: docs/spec.md §Retry policy
- [Blocking] src/auth.sh:42 → local
- [Must-fix] reviewer item → local
amended:
- docs/spec.md §Retry policy
work:
- Fix retry and review item | owns: retry loop; consumes: spec | scripts/retry.sh | covers: [Blocking] src/retry.sh:10, [Must-fix] reviewer item
unchanged:
- Existing CLI stays the same
