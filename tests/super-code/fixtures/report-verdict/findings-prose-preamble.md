# Final review of the integration branch

## Verdict
not ready (one defect in the session layer)

## Findings
One pass each over the session files; not a full audit of every call site.
- Reconnect drops the pending queue

## Must fix before landing
- Reconnect drops the pending queue

## Untested scope
- Behavior under packet loss

## Deferred OK
- none
