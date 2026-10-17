owners:
- [Blocking] src/a.sh:10 → owner: ./docs/spec.md §Retry policy
- [Should-fix] src/b.sh:5; src/c.sh:7 → local
- [Should-fix] src/d.sh:3 → local
- [Must-fix] reviewer item, with comma → local
- [Nit] a | b → disputed: not a real issue
amended:
- docs/spec.md §Retry policy
work:
- Fix d and review | o | f | covers: [Should-fix] src/d.sh:3, [Should-fix] src/b.sh:5; src/c.sh:7, [Must-fix] reviewer item, with comma
unchanged:
- Existing CLI stays the same
