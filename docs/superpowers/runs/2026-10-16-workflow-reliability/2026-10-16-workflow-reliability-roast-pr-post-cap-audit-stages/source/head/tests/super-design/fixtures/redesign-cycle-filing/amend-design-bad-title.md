owners:
- [Blocking] src/a.sh:10 → owner: docs/spec.md §Retry policy
- [Should-fix] src/b.sh:3 → owner: docs/spec.md §Retry policy
amended:
- docs/spec.md §Retry policy
work:
- New retry wrapper | owns: retry loop; consumes: spec | scripts/retry.sh | covers: [Blocking] src/a.sh:10
- Drop per-call retries | owns: callers; consumes: wrapper | scripts/b.sh | covers: [Should-fix] src/b.sh:3
supersedes:
- bd-7 → New retry wrapper
- bd-9 → No such title
unchanged:
- Existing CLI stays the same
