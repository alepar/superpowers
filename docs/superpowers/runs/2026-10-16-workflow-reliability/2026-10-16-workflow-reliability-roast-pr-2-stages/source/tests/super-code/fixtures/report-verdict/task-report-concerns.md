# Task 5 report

**Status:** DONE_WITH_CONCERNS

## What I implemented
- Reworked the digest trimming order.

**Concerns:**
- The budget trim drops the tail section first, which may hide the newest merge line.
- test-run-digest.sh takes 4 minutes on this machine.

## Files changed
- skills/super-code/scripts/run-digest
