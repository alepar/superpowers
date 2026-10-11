## Task 3: Retention cutoff

Files: src/retention.js, tests/retention.test.js

Acceptance criteria: records older than 30 days are expired. A record exactly 30 days old is retained. Use UTC elapsed milliseconds. No public API changes.

Steps: write focused failing tests for older-than and exact-boundary records, implement the cutoff, run node --test tests/retention.test.js, commit.
