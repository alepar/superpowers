Phase 1 evidence

Initial caller HEAD: 7ddd110053fb302c4f6a0bd645ddbf28c512c563; initial short status empty.
Created detached owned worktree seat-a/review-worktree at captured head before stage1.
After stage1, read immutable captured diff, README, formatter, reproduction, generated source, ignore file and callers via git diff/show/grep.
Ran reproduce.mjs only in owned worktree, with OUT_DIR and TMPDIR both pointing to seat-a/repro-output. It changed owned lib/generated.mjs and wrote owned output. Observed -50 formats as $0.50 despite explicit sign preservation requirement. Boundary checks also show -99 => $0.99 and -1 => $0.01; -100 and -101 preserve signs.
No caller source mutations or checkout switching performed. No cause inferred for external caller changes.
