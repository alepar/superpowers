# Task 21: Validate retained archive bytes at read-only acceptance

Status: IMPLEMENTED

Completion kind: implementation

## Implementation

Ordinary report-status now verifies every file in each latest retained collection record against its saved SHA-256. Missing, unreadable or non-file artifacts add an invocation/path-specific archive-unavailable gap; changed bytes add an integrity-mismatch gap. An affected collection is pending even if its saved complete flag remains true. The existing acceptance delegation consumes these qualifiers and therefore refuses acceptance without a mutating recollection. Status reads never rewrite collection records, archives or source bundles. Existing persisted gaps and independent acceptance obligations remain effective.

The focused test uses real --collect, ordinary status and --acceptance commands. It independently deletes and corrupts the direct review, direct .md.diff, cluster review, assembled clusters manifest, assembled slice and declared required input. It verifies complete matching archives remain eligible before and after source cleanup, requires specific integrity gaps for all twelve damaged states, and preserves a separate pending human decision. Before/after snapshots compare exact bytes (stronger than their hashes), mtimes, mode and directory inventory for run text, archives and fixture sources. Each damaged file is restored only by the test fixture between independent cases; --collect is called only once.

## Source identity and workspace

Original task cut: 586a40783832e054d54b9e9b19068ef2260a8549. Commit c3963629 was rebased once as required onto the advanced integration tip. Final base: 5bfbb92331652df67d9af367f0f81baa8267f020. Final head: 22634c4c57e190dea56db60710b6de4f9327bfad. Final tested source tree: a487f101832c60590555f835faa3ba9a27e0d691. Final git status --short was empty and git diff --check passed. No integration checkout files, historical archives or specs were modified.

This package has no install/setup or declared runtime dependencies. The test runner /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.24/tests/super-auto/archive-integrity-r1.sh and package script /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.24/skills/super-auto/scripts/report-status resolve inside the assigned task worktree. They use system Bash and Node v26.9.0; no external package import or shared build environment is involved.

## TDD

The first diagnostic ordered the direct review first and observed the already-existing finding-source-unavailable gap without the required collection-integrity gap. The retained RED run orders the directly implicated .md.diff first. It fails because deleting that archive input still returns exit 0, eligible:true, pending:[], gaps:[], where exit 3 is required. Checks after that failing assertion were unmeasured in RED. After the fix, the complete regression passes all 15 scenarios.

RED command: bash tests/super-auto/archive-integrity-r1.sh

```text
PASS: complete matching archive remains eligible and unchanged
PASS: matching archive remains eligible after source cleanup
node:internal/assert/utils:146
  throw error;
  ^

AssertionError [ERR_ASSERTION]: {"owner":"super-auto","sourceTree":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","eligible":true,"pending":[],"gaps":[],"nonblockingFindings":[]}


0 !== 3

    at cli ([stdin]:24:96)
    at gate ([stdin]:30:76)
    at [stdin]:42:3
    at runScriptInThisContext (node:internal/vm:219:10)
    at node:internal/process/execution:485:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:483:60)
    at evalFunction (node:internal/process/execution:317:30)
    at evalTypeScript (node:internal/process/execution:329:3)
    at node:internal/main/eval_stdin:51:5 {
  generatedMessage: false,
  code: 'ERR_ASSERTION',
  actual: 0,
  expected: 3,
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v26.9.0
```

## Final verification

Both named checks ran against the final committed tree after rebase. Each command used this isolated environment, following an absolute cd to the task worktree:

```bash
export TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24
export HOME=$TMPDIR/home XDG_CONFIG_HOME=$TMPDIR/config XDG_CACHE_HOME=$TMPDIR/cache XDG_DATA_HOME=$TMPDIR/data XDG_STATE_HOME=$TMPDIR/state
bash tests/super-auto/archive-integrity-r1.sh
bash tests/super-auto/test-scripts.sh
```

Focused regression exit 0:

```text
PASS: complete matching archive remains eligible and unchanged
PASS: matching archive remains eligible after source cleanup
PASS: missing final-review-integrity.md.diff blocks acceptance with a specific gap
PASS: corrupted final-review-integrity.md.diff blocks acceptance with a specific gap
PASS: missing final-review-integrity.md blocks acceptance with a specific gap
PASS: corrupted final-review-integrity.md blocks acceptance with a specific gap
PASS: missing final-review-integrity.cluster-1.md blocks acceptance with a specific gap
PASS: corrupted final-review-integrity.cluster-1.md blocks acceptance with a specific gap
PASS: missing assembled/final-review-integrity-final/clusters.json blocks acceptance with a specific gap
PASS: corrupted assembled/final-review-integrity-final/clusters.json blocks acceptance with a specific gap
PASS: missing assembled/final-review-integrity-final/slices/core.diff blocks acceptance with a specific gap
PASS: corrupted assembled/final-review-integrity-final/slices/core.diff blocks acceptance with a specific gap
PASS: missing required-input.diff blocks acceptance with a specific gap
PASS: corrupted required-input.diff blocks acceptance with a specific gap
PASS: integrity gaps preserve independent human acceptance obligations
archive integrity: 15 scenarios passed
```

Existing suite exit 0, unchanged:

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

## Source capture commands

Dirty-source tree snapshots used a temporary index and included the new regression while preserving the real index:

```bash
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.24/red.index git read-tree HEAD
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.24/red.index git add tests/super-auto/archive-integrity-r1.sh
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.24/red.index git write-tree
# c3e10cacbf5be5008b16e915c291267531fa1499 after the direct-package-first fixture refinement
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.24/green.index git read-tree HEAD
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.24/green.index git add skills/super-auto/scripts/report-status tests/super-auto/archive-integrity-r1.sh
GIT_INDEX_FILE=/tmp/sp-bce79baa/super-plan-ufz.24/green.index git write-tree
# b42f3d131b5a1be9adecc0f6026378bc79da436f
git rev-parse HEAD^{tree}
# a487f101832c60590555f835faa3ba9a27e0d691, clean final committed source
```

## Files changed

- skills/super-auto/scripts/report-status
- tests/super-auto/archive-integrity-r1.sh

## Test hygiene

No match: or survived: processes. The first stop-run-processes --check call was correctly refused (exit 2) because its working directory was the task worktree under inspection. It was immediately rerun from the read-only integration directory. All subsequent post-test checks and final default stop completed with exit 0 and empty output. No background services, daemons or watchers were started. Tests used disposable state under the assigned temp root and removed their own fixtures.

## Assumptions and amendments

Read bd show super-plan-ufz.24 --json and bd comments super-plan-ufz.24 before implementation; there were no comments or amendments. The frozen brief and current bead agree. Saved files from the latest collection record are the integrity boundary; collection settlement, finding semantics and source bindings retain their existing contracts. Symlink containment remains separately owned by task .27.

## Concerns

None within this task. Caller-owned final sweep, independent review, instruction evaluations and root/human acceptance remain pending under their existing owners. No extra agents, workflow roles or replacement engine were introduced.

## Full structured result

```json
{
  "id": "super-plan-ufz.24",
  "status": "IMPLEMENTED",
  "files": [
    "skills/super-auto/scripts/report-status",
    "tests/super-auto/archive-integrity-r1.sh"
  ],
  "base": "5bfbb92331652df67d9af367f0f81baa8267f020",
  "head": "22634c4c57e190dea56db60710b6de4f9327bfad",
  "stacked": false,
  "reopened": false,
  "completionKind": "implementation",
  "sourceTree": "a487f101832c60590555f835faa3ba9a27e0d691",
  "evidence": [
    {
      "sourceTree": "c3e10cacbf5be5008b16e915c291267531fa1499",
      "command": "bash tests/super-auto/archive-integrity-r1.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.24/.superpowers/task-evidence/archive-red.log",
      "kind": "live"
    },
    {
      "sourceTree": "b42f3d131b5a1be9adecc0f6026378bc79da436f",
      "command": "bash tests/super-auto/archive-integrity-r1.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.24/.superpowers/task-evidence/archive-green.log",
      "kind": "live"
    },
    {
      "sourceTree": "b42f3d131b5a1be9adecc0f6026378bc79da436f",
      "command": "bash tests/super-auto/test-scripts.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.24/.superpowers/task-evidence/script-suite.log",
      "kind": "live"
    },
    {
      "sourceTree": "a487f101832c60590555f835faa3ba9a27e0d691",
      "command": "bash tests/super-auto/archive-integrity-r1.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.24/.superpowers/task-evidence/archive-final.log",
      "kind": "live"
    },
    {
      "sourceTree": "a487f101832c60590555f835faa3ba9a27e0d691",
      "command": "bash tests/super-auto/test-scripts.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.24/.superpowers/task-evidence/script-suite-final.log",
      "kind": "live"
    }
  ],
  "requiredLiveChecks": [
    {
      "sourceTree": "a487f101832c60590555f835faa3ba9a27e0d691",
      "command": "bash tests/super-auto/archive-integrity-r1.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state"
    },
    {
      "sourceTree": "a487f101832c60590555f835faa3ba9a27e0d691",
      "command": "bash tests/super-auto/test-scripts.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state"
    }
  ],
  "report": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-21-report.md"
}
```
