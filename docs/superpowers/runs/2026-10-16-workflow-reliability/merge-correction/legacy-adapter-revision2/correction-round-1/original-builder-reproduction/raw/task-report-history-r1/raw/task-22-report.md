Status: IMPLEMENTED

## Implementation

Task super-plan-ufz.25 (ordinal 22). The task branch is task-super-plan-ufz.25. Base: 5bfbb92331652df67d9af367f0f81baa8267f020. Head: d36ef7baca1fef0fb0a77ea4fb8b0015138beb19. Completion kind: implementation. No stack or reopen.

Projection output now assigns process.exitCode and allows Node to drain stdout naturally. An explicit stdout error listener reports output failures on stderr and returns exit 1. Successful and gap-bearing projections preserve exits 0 and 3. The JSON schema, retained finding content and legacy round behavior are unchanged.

The focused regression uses the full retained judge-4 128-occurrence reproducer data, preserving all text. It compares real file output to a real stdout pipe, validates every occurrence value in order, verifies supported resolved/rejected dispositions, exercises the actual report-status --acceptance reader, covers valid-empty and gap-bearing inputs, and closes the consumer pipe to verify observable failure without mutation of the run record.

## Requirements and assumptions

Read current bd show super-plan-ufz.25 --json and bd comments super-plan-ufz.25 before implementation. There were no amendments or comments. The frozen brief and current bead agree. The provided base reproduction and acceptance consumer establish a real observed defect; no historical evidence was changed. Review, measurement and human decisions in the regression are local fixture data, and do not assert root acceptance of this run.

No project install step or declared runtime dependency is needed for this shell/Node helper and Python standard-library regression. The product path and regression runner resolve inside the isolated task worktree; Node (/opt/homebrew/bin/node), Bash (/bin/bash), and Python are environment interpreters. No integration or user-checkout source was changed.

## TDD and root cause

RED: forced process.exit ended the process with pending asynchronous stdout writes. The new regression failed five of seven cases: valid/gap output pipes lost bytes; both acceptance readers reported finding projection unavailable; closed output returned zero. Empty controls passed. Assertions after these failure points were unmeasured on RED.

The initial process.exitCode-only change restored full valid/gap data and acceptance consumption, but the closed-pipe check still failed because console suppresses stream write errors. Explicit stdout error handling addresses that same output boundary. GREEN passes all seven cases.

Capture commands (all in this task worktree; real index preserved):
- GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.25/red.index git read-tree HEAD
- GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.25/red.index git add tests/super-auto/projection-output-r1.sh
- GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.25/red.index git write-tree -> 7b5e745ec8195d3b48021a50ee4795147106b5bf
- GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.25/green.index git read-tree HEAD
- GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.25/green.index git add skills/super-auto/scripts/scope-dispositions tests/super-auto/projection-output-r1.sh
- GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.25/green.index git write-tree -> ce39090e06acac84ba4dff8457445206723abb2f (drain-only intermediate)
- GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.25/final.index git read-tree HEAD
- GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.25/final.index git add skills/super-auto/scripts/scope-dispositions tests/super-auto/projection-output-r1.sh
- GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.25/final.index git write-tree -> 802896a13812a8ee3ad52a656cb32445514a59f6
- After commit, git rev-parse HEAD^{tree} -> 802896a13812a8ee3ad52a656cb32445514a59f6 (identical tested and committed inputs).

## Exact final checks

Run in the task worktree with this environment:
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.25; HOME=/tmp/sp-bce79baa/super-plan-ufz.25/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/state

Command: bash tests/super-auto/projection-output-r1.sh

```text
test_gap_projection_acceptance_consumer (__main__.ProjectionOutput.test_gap_projection_acceptance_consumer) ... ok
test_gap_projection_pipe (__main__.ProjectionOutput.test_gap_projection_pipe) ... ok
test_incomplete_pipe_write_is_failure (__main__.ProjectionOutput.test_incomplete_pipe_write_is_failure) ... ok
test_large_projection_acceptance_consumer (__main__.ProjectionOutput.test_large_projection_acceptance_consumer) ... ok
test_large_projection_pipe (__main__.ProjectionOutput.test_large_projection_pipe) ... ok
test_valid_empty_acceptance_consumer (__main__.ProjectionOutput.test_valid_empty_acceptance_consumer) ... ok
test_valid_empty_projection_pipe (__main__.ProjectionOutput.test_valid_empty_projection_pipe) ... ok

----------------------------------------------------------------------
Ran 7 tests in 1.413s

OK
acceptance empty=False gap=True: 126 retained refs, exit 3
projection empty=False gap=True: 204542 bytes, exit 3
acceptance empty=False gap=False: 126 retained refs, exit 0
projection empty=False gap=False: 204381 bytes, exit 0
acceptance empty=True gap=False: 0 retained refs, exit 0
projection empty=True gap=False: 381 bytes, exit 0
```

Command: bash tests/super-auto/test-scripts.sh (existing file unchanged)

```text
scope-dispositions
  [PASS] exits 0
  [PASS] Blocking/unrouted defaults, cluster pull-in, override, all-punch cluster untouched and reported dropped
  [PASS] no step-back file: no cluster pull-in
  [PASS] cluster members of another round are ignored
  [PASS] a cluster with no member in this round is not reported dropped
  [PASS] every present member punch-listed: cluster dropped line, with its rule, before the summary
  [PASS] non-numeric round exits 2
  [PASS] missing findings file exits 2
  [PASS] missing jq exits 4
  [PASS] missing jq prints the manual-computation line
  [PASS] the manual-computation line includes the cluster dropped rule

step-back-check
  [PASS] valid patch record (no scope:) is ok
  [PASS] valid redesign with rN-prefixed, comma-bearing keys is ok
  [PASS] unknown key exits 3
  [PASS] unprefixed and unknown keys each get a reject line
  [PASS] missing decision: is rejected
  [PASS] redesign without scope: is rejected
  [PASS] missing step-back file exits 2
  [PASS] missing --keys exits 2
report-status
caller-owned root acceptance
  [PASS] source-bound required reviews, measurements, recovery and human gates control caller root acceptance
44 root acceptance assertions passed
  [PASS] clean run
  [PASS] clean run exits 0
  [PASS] clean run prints no qualifier lines
  [PASS] degraded-verdict qualifiers come from the part before ' — ' (a bracket in the tail is ignored); beyond-cap and graph-change do not count
  [PASS] parked escalation plus codeBuckets.escalated count as escalations; one qualifier line each
  [PASS] skipped roasts (t/f flag values) are qualifiers
  [PASS] roastCodeCapped keys (comma-bearing locations) count as unresolved Blocking
  [PASS] roastCodeCapped written at a thrash exit counts its keys
  [PASS] proceeded design cap counts its keys and leads the qualifiers
  [PASS] design cap with no stopped/proceeded slot counts as proceeded
  [PASS] phase capped-blocking is a stall; no codeBuckets before phase report adds no qualifier
  [PASS] codeBuckets.stalled true is a stall at code
  [PASS] pendingRetry forces completed form; non-CLEAN review is a qualifier
  [PASS] no codeBuckets block at phase report gives the none-recorded qualifiers
  [PASS] a bucket line missing from codeBuckets is a qualifier
  [PASS] deferred sweep is a qualifier
  [PASS] a non-zero failed count is a qualifier
  [PASS] MEASUREMENT INVALID is a qualifier
  [PASS] a passing sweep-fix re-run rewritten into codeBuckets.sweep keeps clean
  [PASS] a passing sweep with no @ <sha> stamp is a qualifier
  [PASS] a non-zero errors count is a qualifier
  [PASS] SWEEP UNAVAILABLE is a qualifier
  [PASS] a sweep outside the pinned grammar is a qualifier, never a pass
  [PASS] --tip matching the sweep SHA keeps clean
  [PASS] --tip that does not resolve against the sweep SHA is a qualifier
  [PASS] only run-directory commits between the sweep stamp and --tip keep clean
  [PASS] a commit outside this run's directory, even under docs/superpowers/runs, is a qualifier
  [PASS] a code commit between the sweep stamp and --tip is a qualifier
  [PASS] a resolves-on: sweep degraded verdict is skipped when the sweep passes at --tip; others stay
  [PASS] without --tip a resolves-on: sweep degraded verdict keeps its qualifier
  [PASS] a sweep not at the tip does not resolve it
  [PASS] a sweep that is not a pass does not resolve it
  [PASS] review: not ready (...) is a qualifier; review: ready is clean
  [PASS] review: ready (after the phase-6 sweep @ sha) is clean
  [PASS] --stalled before RUN_MD
  [PASS] --stalled wins; qualifier lines still printed
  [PASS] unknown --stalled phase exits 2
  [PASS] non-SHA --tip exits 2
  [PASS] missing run.md exits 2
  [PASS] run.md without phase: exits 2
  [PASS] a phase: value that is not a run-state.md token exits 2
  [PASS] run.md without flags: exits 2
  [PASS] a flags: line missing skipCodeRoast= exits 2
  [PASS] no arguments exits 2
  [PASS] step-back-check runs with only bash and awk on PATH (no jq)
  [PASS] report-status runs with only bash and awk on PATH (no jq)
run attribution: caller retention
  [PASS] caller run.md accepts durable regression and gap pointers in existing parked records
  [PASS] clean latest buckets preserve run owner and attribution gap qualifiers
  [PASS] SKILL.md carries regression and missing-baseline obligations
  [PASS] run-state.md carries regression and missing-baseline obligations
  [PASS] report-prompt.md carries regression and missing-baseline obligations

scope-dispositions: outstanding occurrence projection
  [PASS] projection accepts retained complete extraction and supported dispositions
  [PASS] ambiguous twins remain separate, archive dedupes and original text survives
  [PASS] deterministic metrics separate repaired rejected deferred and outstanding
  [PASS] raw rejected and unverified sections are separate from actionable finding counts
  raw section metrics fixture: {"scope":"retained sources","sources":3,"sourceKinds":["final-review","roast"],"occurrences":7,"occurrenceGroups":7,"findings":5,"otherSectionGroups":2,"sections":["Must fix","Deferred OK","Rejected","Not verified"],"repaired":1,"rejected":1,"outstanding":3,"deferred":1,"gaps":0}
  [PASS] linked occurrences count once as a finding but retain raw occurrence count
  [PASS] metric projection preserves gap exit
  [PASS] partial projection retains supported metrics with explicit scope
  [PASS] keys contain deferred A only; verified B, rejected C and active D excluded
  [PASS] explicit reference link accepted
  [PASS] only explicit references combine source appearances
  [PASS] unsupported produces an explicit evidence gap
  [PASS] unsupported cannot delete known open A
  [PASS] bad-ref produces an explicit evidence gap
  [PASS] bad-ref cannot delete known open A
  [PASS] no-basis produces an explicit evidence gap
  [PASS] no-basis cannot delete known open A
  [PASS] malformed produces an explicit evidence gap
  [PASS] malformed cannot delete known open A
  [PASS] bad-link produces an explicit evidence gap
  [PASS] bad-link cannot delete known open A
  [PASS] missing external input reports a gap
  [PASS] missing external input preserves local open evidence
  [PASS] external-malformed external input reports a gap
  [PASS] external-malformed external input preserves local open evidence
  [PASS] external external input reports a gap
  [PASS] external external input preserves local open evidence
  [PASS] supported external verification may resolve explicitly referenced A
  [PASS] verified fix supplied elsewhere leaves punch list
  [PASS] silent ready retry is a valid source without dispositions
  [PASS] assignment, closed fix and later silence retain deferred A
  [PASS] legacy key transport dedupes equal keys across distinct deferred occurrences
  [PASS] changed immutable source reports a gap
  [PASS] conflicting source preserves text variants and blocks resolution
  [PASS] no retained sources is an explicit gap rather than a clean review
  [PASS] projection works without jq
  [PASS] no-jq projection retains identical key output
  [PASS] missing Node gives unavailable status, never a clean empty result
  [PASS] manual fallback preserves continuity obligations
  [PASS] unavailable source artifacts are an explicit gap
  [PASS] retained occurrences survive unavailable source
review collection and caller continuity
  [PASS] malformed new collection cannot appear clean
  [PASS] collection resumes after interrupted copy
  [PASS] resume replays complete collections
  [PASS] second resume changes no records
  [PASS] producer direct package archived byte for byte after replay
  [PASS] completed collection inventories the producer direct package
  [PASS] conflicting direct package blocks collection completion
  [PASS] conflicting direct package is never overwritten
  [PASS] direct package source is preserved through archive conflict
  [PASS] repaired direct package restores verified completion
  [PASS] split assembled input archived
  [PASS] ready silent retry collected independently
  [PASS] collected producer records validate in predecessor projection
  [PASS] one occurrence per source identity and supported disposition survives ready retry
  [PASS] status exposes historical outstanding findings despite latest ready
  [PASS] settled intent history creates no false collection gaps
  [PASS] integrated ready retry retains measurement and findings until independently supported outcomes
integrated collection -> ordinary evidence -> caller gate -> disposition -> metrics passed
  [PASS] verified complete archive survives source workspace removal
  [PASS] null review with no work landed preserves null semantics
  [PASS] null no-work with only the producer direct package remains a gap
  [PASS] null result still archives the recoverable direct package
  [PASS] direct-only null bundle records reconciliation and missing review gaps
  [PASS] direct-only null gap persists on replay
  [PASS] direct-only null replay changes no records
  [PASS] null no-work with a partial bundle remains a gap
  [PASS] unexpected null bundle still retains complete extraction
  [PASS] null result never erases discoverable findings
  [PASS] missing declared direct input blocks collection completion
  [PASS] null required review is a durable evidence gap
  [PASS] status exposes collection gaps
  [PASS] missing required bundle remains pending
  [PASS] conflicting archive is not overwritten on replay
  [PASS] conflicting archive bytes retained for recovery
  [PASS] known inline sources remain valid through collection gap
  [PASS] supported rejected item stays off punch list while active defects stay open
  [PASS] unrelated missing collections remain gaps after local archive repair
  [PASS] repaired collection appends completion after an earlier identical completion
All super-auto script tests passed
```

## RED output

Command: bash tests/super-auto/projection-output-r1.sh

```text
test_gap_projection_acceptance_consumer (__main__.ProjectionOutput.test_gap_projection_acceptance_consumer) ... FAIL
test_gap_projection_pipe (__main__.ProjectionOutput.test_gap_projection_pipe) ... FAIL
test_incomplete_pipe_write_is_failure (__main__.ProjectionOutput.test_incomplete_pipe_write_is_failure) ... FAIL
test_large_projection_acceptance_consumer (__main__.ProjectionOutput.test_large_projection_acceptance_consumer) ... FAIL
test_large_projection_pipe (__main__.ProjectionOutput.test_large_projection_pipe) ... FAIL
test_valid_empty_acceptance_consumer (__main__.ProjectionOutput.test_valid_empty_acceptance_consumer) ... ok
test_valid_empty_projection_pipe (__main__.ProjectionOutput.test_valid_empty_projection_pipe) ... ok

======================================================================
FAIL: test_gap_projection_acceptance_consumer (__main__.ProjectionOutput.test_gap_projection_acceptance_consumer)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "<stdin>", line 121, in test_gap_projection_acceptance_consumer
  File "<stdin>", line 99, in check_acceptance
AssertionError: True is not false : {'owner': 'super-auto', 'sourceTree': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'eligible': False, 'pending': [], 'gaps': ['finding projection unavailable', 'finding projection unavailable — retain known findings'], 'nonblockingFindings': []}

======================================================================
FAIL: test_gap_projection_pipe (__main__.ProjectionOutput.test_gap_projection_pipe)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "<stdin>", line 118, in test_gap_projection_pipe
  File "<stdin>", line 78, in check_projection
AssertionError: b'{\n[66617 chars]etain' != b'{\n[66617 chars]etained verification evidence. Detailed retain[141263 chars]n}\n' : pipe must preserve every serialized byte, including the final JSON delimiter

======================================================================
FAIL: test_incomplete_pipe_write_is_failure (__main__.ProjectionOutput.test_incomplete_pipe_write_is_failure)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "<stdin>", line 136, in test_incomplete_pipe_write_is_failure
AssertionError: 0 == 0 : a closed output pipe must not report success

======================================================================
FAIL: test_large_projection_acceptance_consumer (__main__.ProjectionOutput.test_large_projection_acceptance_consumer)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "<stdin>", line 115, in test_large_projection_acceptance_consumer
  File "<stdin>", line 99, in check_acceptance
AssertionError: True is not false : {'owner': 'super-auto', 'sourceTree': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'eligible': False, 'pending': [], 'gaps': ['finding projection unavailable', 'finding projection unavailable — retain known findings'], 'nonblockingFindings': []}

======================================================================
FAIL: test_large_projection_pipe (__main__.ProjectionOutput.test_large_projection_pipe)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "<stdin>", line 112, in test_large_projection_pipe
  File "<stdin>", line 78, in check_projection
AssertionError: b'{\n[66617 chars]etain' != b'{\n[66617 chars]etained verification evidence. Detailed retain[141097 chars]n}\n' : pipe must preserve every serialized byte, including the final JSON delimiter

----------------------------------------------------------------------
Ran 7 tests in 1.411s

FAILED (failures=5)
acceptance empty=True gap=False: 0 retained refs, exit 0
projection empty=True gap=False: 381 bytes, exit 0
```

## Files changed and self-review

- skills/super-auto/scripts/scope-dispositions
- tests/super-auto/projection-output-r1.sh

Only the named production mechanism and its own regression are committed. git diff --check and git diff --cached --check passed. The commit was rebased against super-auto/workflow-reliability without any source change (already up to date); final git status --short was empty. Caller search found report-status ordinary status and acceptance consumers; the unchanged script suite exercises both, alongside projection --keys and legacy round mode. Expected values are independently derived from retained fixture records, not projection helpers.

## Test hygiene

No leaked or survived task-owned processes remained after completed test runs; final stop-run-processes returned 0 with no matches or survived lines. A first --check invocation ran from inside the owned worktree and correctly refused that root (exit 2); rerunning from /private/tmp returned 0. One --check was inadvertently issued while the existing suite was still active: it listed PIDs 85736, 85752, 85976, 85980, 97054, 97060, 97208 belonging to the live test command. No process was stopped during the active test. After the suite completed (exit 0), --check from /private/tmp returned 0 with no matches; the final stop invocation also returned 0 with no matches. These were observed active test processes, not post-test leaks.

Checks used:
bash /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.25 /tmp/sp-bce79baa/super-plan-ufz.25

Final cleanup used the same command without --check. No background process was deliberately retained. No command was rejected by automatic approval review.

## Concerns

None for this bounded fix. Caller-owned final sweep, changed-instruction evaluations, independent review, root acceptance and human gates remain pending outside this task. Retained logs are in the task worktree's ignored .superpowers/sdd/super-plan-ufz.25-evidence directory; preserve that worktree until review has consumed the evidence. The report also embeds final and RED output for durable review.

## Evidence

```json
[
  {
    "sourceTree": "7b5e745ec8195d3b48021a50ee4795147106b5bf",
    "command": "bash tests/super-auto/projection-output-r1.sh",
    "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.25; HOME=/tmp/sp-bce79baa/super-plan-ufz.25/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/state",
    "outcome": "fail",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.25/.superpowers/sdd/super-plan-ufz.25-evidence/red.log",
    "kind": "live"
  },
  {
    "sourceTree": "ce39090e06acac84ba4dff8457445206723abb2f",
    "command": "bash tests/super-auto/projection-output-r1.sh",
    "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.25; HOME=/tmp/sp-bce79baa/super-plan-ufz.25/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/state",
    "outcome": "fail",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.25/.superpowers/sdd/super-plan-ufz.25-evidence/drain-only.log",
    "kind": "live"
  },
  {
    "sourceTree": "802896a13812a8ee3ad52a656cb32445514a59f6",
    "command": "bash tests/super-auto/projection-output-r1.sh",
    "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.25; HOME=/tmp/sp-bce79baa/super-plan-ufz.25/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/state",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.25/.superpowers/sdd/super-plan-ufz.25-evidence/green.log",
    "kind": "live"
  },
  {
    "sourceTree": "802896a13812a8ee3ad52a656cb32445514a59f6",
    "command": "bash tests/super-auto/test-scripts.sh",
    "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.25; HOME=/tmp/sp-bce79baa/super-plan-ufz.25/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/state",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.25/.superpowers/sdd/super-plan-ufz.25-evidence/existing-scripts.log",
    "kind": "live"
  }
]
```

## Required live checks

```json
[
  {
    "sourceTree": "802896a13812a8ee3ad52a656cb32445514a59f6",
    "command": "bash tests/super-auto/projection-output-r1.sh",
    "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.25; HOME=/tmp/sp-bce79baa/super-plan-ufz.25/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/state"
  },
  {
    "sourceTree": "802896a13812a8ee3ad52a656cb32445514a59f6",
    "command": "bash tests/super-auto/test-scripts.sh",
    "configuration": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.25; HOME=/tmp/sp-bce79baa/super-plan-ufz.25/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/config; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/data; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/cache; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.25/state"
  }
]
```
