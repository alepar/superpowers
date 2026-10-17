decision: redesign
triggers: no-progress, shared-cause
summary: retry policy owns the repeated Blocking finding
pattern: r1 [Blocking] src/retry.sh:10 and r2 [Blocking] src/retry.sh:10
clusters: none
changes: the retry policy decision in docs/spec.md §Retry policy
to: bounded retries with a fixed backoff, stated in the spec
dissolves: [Blocking] src/retry.sh:10
remains: [Blocking] src/auth.sh:42
scope: inside — "Goal" stands and no non-goal is touched
recommendation: the retry policy generates the finding every round, so change it once instead of patching it again.
