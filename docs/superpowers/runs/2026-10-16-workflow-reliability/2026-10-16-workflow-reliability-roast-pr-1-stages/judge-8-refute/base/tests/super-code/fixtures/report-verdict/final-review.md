# Final review: coordinator-subagent-compaction

I reviewed the whole branch against the epic's goal and the spec.

## Verdict

not ready (2 must-fix)

## Must fix before landing
- skills/super-code/scripts/run-digest: the budget trim never reaches the tail section.
- hooks/session-start-runblock: no watchdog around run-digest, a slow bd call hangs the hook.

## Untested scope
- The Codex entry script was not exercised.

## Deferred OK
- Wording of the card header.
