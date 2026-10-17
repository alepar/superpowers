owners:
- [Blocking] src/a.sh:10 → owner: docs/spec.md §Retry policy
- [Should-fix] src/b.sh:5; src/c.sh:7 → local
- [Must-fix] reviewer item, with comma → local
- [Nit] a | b → disputed: not a real issue
amended:
- docs/spec.md §Retry policy
work:
- Fix retry | owns: retry loop; consumes: spec | scripts/retry.sh | covers: [Blocking] src/a.sh:10, [Should-fix] src/b.sh:5; src/c.sh:7
- Fix review | o | f | covers: [Must-fix] reviewer item, with comma
unchanged:
- Existing CLI stays the same
