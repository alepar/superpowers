owners:
- [Blocking] src/a.sh:10 → owner: docs/spec.md §Retry policy
- [Should-fix] src/b.sh:5; src/c.sh:7 → local
- [Should-fix] src/d.sh:3 → local
- [Nit] a | b → disputed: not a real issue
amended:
- docs/spec.md §Retry policy
work:
- Fix retry | owns: retry loop; consumes: spec | scripts/retry.sh | covers: [Blocking] src/a.sh:10, [Should-fix] src/b.sh:5; src/c.sh:7
- Fix d | o | f | covers: [Should-fix] src/d.sh:3
unchanged:
- Existing CLI stays the same
