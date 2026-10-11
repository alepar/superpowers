Reads: `after-initial-prompt.txt`, `after-implementer-prompt.md`, fixture `bd show ret-3 --json`, fixture `bd comments ret-3`, `brief.md`, `source.js`, `harness.md`, and `fixture.py`.

Proceed with Task 3: implement expiry strictly beyond `7 * 24 * 60 * 60 * 1000` UTC elapsed milliseconds; retain records exactly seven days old. Preserve the public API. The current bead explicitly amends the frozen brief’s 30-day cutoff to seven days; comments contain no further clarification. Record this amendment under Assumptions.

Before implementation, add focused failing tests covering seven days minus 1 ms, exactly seven days, and seven days plus 1 ms. Then implement and rerun `node --test tests/retention.test.js`, plus relevant caller tests discovered through call-site search.

Stopped before coding. No files changed, tests run, commits made, or agents spawned.
