# Final review of the integration branch

## Verdict
not ready (two defects in the session layer)

## Analysis

### 1. Reconnect drops the pending queue
The reconnect path discards queued input before the new session is attached.

### 2. Keepalive interval is never reset
The timer survives a detach and fires against a closed handle.

## Must fix before landing
- Reconnect drops the pending queue
  The queue is cleared in detach() before attach() runs.
- Keepalive interval is never reset

## Untested scope
- Behavior under packet loss
- Reconnect during a resize

## Deferred OK
- none
