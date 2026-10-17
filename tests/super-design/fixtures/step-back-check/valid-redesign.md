decision: redesign
summary: one refresh middleware instead of a refresh in each handler
pattern: r1 [Should-fix] Decision points › Scope fences recurs as r2 [Should-fix] auth/session.ts:12, 14
clusters:
- refresh: r2 [Blocking] auth/token-refresh.ts:88, r2 [Should-fix] auth/session.ts:12, 14 | rule: refresh tokens in one middleware
changes: token refresh in each handler (spec §4.3)
to: one refresh middleware ahead of every handler
dissolves: r1 [Should-fix] Decision points › Scope fences: "named tests pass unmodified, and only named spec sections change", r2 [Should-fix] auth/session.ts:12, 14
remains: r2 [Blocking] auth/token-refresh.ts:88
scope: inside — "Goal: tokens refresh transparently" stands unchanged
recommendation: one middleware closes both findings and the next instance.
