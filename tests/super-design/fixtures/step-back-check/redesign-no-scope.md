decision: redesign
summary: one refresh middleware
pattern: none
clusters: none
changes: token refresh in each handler
to: one refresh middleware
dissolves: r2 [Blocking] auth/token-refresh.ts:88
remains: none
recommendation: apply it.
