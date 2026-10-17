# Task 23 — captured generated review inputs

Status: IMPLEMENTED
canonicalStatus: IMPLEMENTED
scopeHeld: false
completionKind: implementation
base: c3fac4369c7c737e2e7f9f7250fd253b21442d12
head: 4639ee8426129adf94103df2368c6db4f41b4410
sourceTree: 3397ea3c23392a9b6b0cf004b7c8a54bf9830067
stacked: false
reopened: false
blockerBead: null

## Current outcome

Implemented the assessment-backed existing-component boundary in `dispatch-text.mjs`. Its additive `review-inputs --ledger ... --base <full captured commit> --head <full captured commit> --out-dir ...` mode exits before loading coordinator builders. It verifies commit objects; uses argument-array Git operations, literal pathspecs and NUL-delimited enumeration; discovers collection records in tracked `run.md` files at the captured endpoints; derives archives from each record's own directory and safe invocation identity; and checks saved SHA-256 against captured regular-file blobs. It never reads a producer workspace or mutable run file for selection.

Only exact manifest-claimed assembled input files and invocation direct `.md.diff` payloads can be omitted. Unclaimed descendants, ordinary `reviews` content, collection metadata and final/cluster reports remain in the selected range. The selected list, diffstat and deterministic path-to-slice mapping are emitted with explicit captured record/invocation/archive/report/hash provenance. Ordinal slice names support unusual/long paths and avoid collisions; the recursion correction is verified exact payload selection, not filename shortening alone. The original captured BASE/HEAD is preserved.

Malformed/conflicting records, incomplete claimed bundles, missing/non-regular claimed files and hash mismatches produce an explicit unavailable sidecar and no omission authority. Inspecting prior endpoint claims also catches removed/corrupted payloads even when their record disappears. No record grants no exemption; untracked archives supply neither input nor authority. Historical archive bytes are never rewritten.

Both review profiles use this operation through the existing shared `assemblePrompt` builder. The digest includes generated-input provenance; semantic import/call clustering, digest extraction and size checks remain assembler-owned. Selection refusal follows the existing unavailable path and prevents a clean fallback result, in Workflow routing and the shared ordinary final-review prompt. Super-auto's roast fallback retains the same explicit gap. History/assess and general direct review-package behavior remain unchanged. `report-status` required no source edit: its existing path/hash manifest and derived archive identity already supply all reader provenance.

The isolated branch was rebased cleanly onto current integration `c3fac4369c7c737e2e7f9f7250fd253b21442d12` (integration advanced beyond the originally named `7c3fec35`). No full suite, merge, push, root closure, tracker write or Herdr mutation was performed. Caller-owned changed-instruction evaluation, independent review, final sweep and human/root acceptance remain pending.

## Amendments and assumptions

- Used the live `bd show super-plan-ufz.26 --json` and empty comments, amended Task 23/brief, `recursive-input-boundary-assessment-r1.md` and `recursive-boundary-amendment-r1.json`. The assessment chose the existing component and explicitly superseded the provisional report-status interface. The coordinator handed implementation to this fresh owner after the held RED-only handoff; no blocker bead or retry-spend assumption was introduced.
- Existing collector manifest records were sufficient; collection/replay, .24 archive integrity, .25 compact transport, .29 source binding, .23 startup and .32 cleanup intent were preserved. No new helper executable, role, agent call, engine, artifact database or finding lifecycle was added.
- System Node/Bash are runtime interpreters; the tested package scripts and fixtures resolve within this task worktree. Existing shell/Node tests need no setup/install step.
- Applied systematic-debugging, TDD, writing-skills and verification-before-completion. RED demonstrated the full-range assembly defect before production edits. For operative instruction edits, the failure shape is oversized recursive assembly; guidance now points to a deterministic selected-input contract. Fresh-context changed-instruction evaluation is owned by the enclosing coordinator and is PENDING, not passed by rendering/replay tests. No subagents were spawned.
- Both specification Goals, run.md, raw historical findings/provenance, scope-dispositions and the rejected measurement-classification/direct frozen-Git fallback materiality findings remain unchanged.

## TDD and development history

The prior held handoff and original RED logs remain intact. Its structured result was copied first to `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-23-scope-held-result.json`. The amended RED source was `01a0e9ce996bdcf910971497df8d978feafdf7b3`; the retained command ran the real collector and old assembler recipe. Invocation 1 collected successfully; invocation 2 included prior generated payloads and failed `prior generated payloads must not become fresh slices`. This is the expected behavioral RED, not a missing-command error. Temporary-index capture commands are retained in `evidence/super-plan-ufz.26/investigation.txt`; the real index was preserved. Assertions after that failure were unmeasured in RED.

Development named checks passed after the unchanged dispatch suite caught an initialization mismatch. The assembler's established `mkdir .../slices` contract was restored; the selector accepts only that empty directory, while partial artifact contents remain refused. The unchanged test was not loosened. The initial failing and passing rerun logs are retained; that development failure has no separate source snapshot and is not represented as source-bound attribution evidence. Final clean post-rebase results below supersede development observations.

The final fixture exercises initial collection, four unchanged-product fresh-ID re-entries, then a separate new-product round. It verifies original product hunk once, no generated payload selected or copied recursively, complete finding text, exact prior archive bytes/hashes and replay after producer cleanup. It also checks advanced checkout versus captured head, untracked archives, ordinary/unclaimed archive descendants, unusual space/newline/wildcard paths, corrupt/missing/incomplete/malformed/conflicting claims, record removal, unknown commits and preservation of partial outputs. Total selected bytes grow legitimately with metadata/distinct reports; no false constant-total-size requirement is imposed.

Meaningful assertion counterexamples include wrong/missing captured identities; lost original/new/ordinary membership; any generated payload re-entering slices; duplicated product hunks; stale/missing archive references; modified prior bytes; hidden corruption/deletion; a mutable checkout affecting frozen selection; a partial output overwritten; or an unknown commit accepted. The selected-list/mapping assertion catches missing or extra coverage, rather than comparing values generated by the same assertion helper. Final GREEN executed all assertions, including those unmeasured in RED.

## Final source capture and evidence

Immediately before final checks, on clean committed source:

```bash
git rev-parse HEAD
git rev-parse 'HEAD^{tree}'
git merge-base super-auto/workflow-reliability HEAD
git status --short
```

Captured head `4639ee8426129adf94103df2368c6db4f41b4410`, tree `3397ea3c23392a9b6b0cf004b7c8a54bf9830067`, base `c3fac4369c7c737e2e7f9f7250fd253b21442d12`. Status was empty before and after all checks. Final logs are under the ignored task-owned `.superpowers/evidence-super-plan-ufz.26/`; the complete outputs are retained below so they survive task-worktree cleanup. Configuration: `clean post-rebase task branch; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26; HOME=/tmp/sp-bce79baa/super-plan-ufz.26/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/config; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/cache; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/data; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/state`. The runner is retained at that directory's `final-run.sh`; every check ran to an observed exit 0, followed by an exit-0 empty task-scoped leak check. No full suite was run.

`evidence` (same array returned in the structured result):

```json
[
  {
    "sourceTree": "b961e615a65df862a0cf08e234617fee0005def2",
    "command": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26 GENERATED_REVIEW_INPUTS_BASELINE=1 bash tests/super-auto/generated-review-inputs-r1.sh",
    "configuration": "baseline pre-fix assembler recipe; real collector; original fixture",
    "outcome": "fail",
    "location": "evidence/super-plan-ufz.26/red.log",
    "kind": "live"
  },
  {
    "sourceTree": "0d0136c5b6cb8463da7d976bc0f48b5a6986718c",
    "command": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26 GENERATED_REVIEW_INPUTS_BASELINE=1 bash tests/super-auto/generated-review-inputs-r1.sh",
    "configuration": "baseline pre-fix assembler recipe; real collector; complete finding-text assertion",
    "outcome": "fail",
    "location": "evidence/super-plan-ufz.26/red2.log",
    "kind": "live"
  },
  {
    "sourceTree": "01a0e9ce996bdcf910971497df8d978feafdf7b3",
    "command": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26 GENERATED_REVIEW_INPUTS_BASELINE=1 bash tests/super-auto/generated-review-inputs-r1.sh",
    "configuration": "amended real-collector fixture, retained pre-fix assembler recipe",
    "outcome": "fail",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.26/evidence/super-plan-ufz.26/amended-red.log",
    "kind": "live"
  },
  {
    "sourceTree": "3397ea3c23392a9b6b0cf004b7c8a54bf9830067",
    "command": "bash tests/super-auto/generated-review-inputs-r1.sh",
    "configuration": "clean post-rebase task branch; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26; HOME=/tmp/sp-bce79baa/super-plan-ufz.26/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/config; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/cache; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/data; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/state",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-23-report.md#final-check-generated",
    "kind": "live"
  },
  {
    "sourceTree": "3397ea3c23392a9b6b0cf004b7c8a54bf9830067",
    "command": "bash tests/super-auto/test-scripts.sh",
    "configuration": "clean post-rebase task branch; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26; HOME=/tmp/sp-bce79baa/super-plan-ufz.26/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/config; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/cache; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/data; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/state",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-23-report.md#final-check-super-auto",
    "kind": "live"
  },
  {
    "sourceTree": "3397ea3c23392a9b6b0cf004b7c8a54bf9830067",
    "command": "bash tests/super-code/test-dispatch-text.sh",
    "configuration": "clean post-rebase task branch; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26; HOME=/tmp/sp-bce79baa/super-plan-ufz.26/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/config; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/cache; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/data; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/state",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-23-report.md#final-check-dispatch",
    "kind": "live"
  },
  {
    "sourceTree": "3397ea3c23392a9b6b0cf004b7c8a54bf9830067",
    "command": "node tests/super-code/invocation-source-binding-r1.mjs",
    "configuration": "clean post-rebase task branch; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26; HOME=/tmp/sp-bce79baa/super-plan-ufz.26/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/config; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/cache; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/data; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/state",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-23-report.md#final-check-source-binding",
    "kind": "live"
  },
  {
    "sourceTree": "3397ea3c23392a9b6b0cf004b7c8a54bf9830067",
    "command": "node tests/super-code/startup-builder-seam-r1.mjs",
    "configuration": "clean post-rebase task branch; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26; HOME=/tmp/sp-bce79baa/super-plan-ufz.26/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/config; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/cache; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/data; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/state",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-23-report.md#final-check-startup",
    "kind": "live"
  },
  {
    "sourceTree": "3397ea3c23392a9b6b0cf004b7c8a54bf9830067",
    "command": "bash tests/super-auto/archive-integrity-r1.sh",
    "configuration": "clean post-rebase task branch; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26; HOME=/tmp/sp-bce79baa/super-plan-ufz.26/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/config; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/cache; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/data; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/state",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-23-report.md#final-check-archive-integrity",
    "kind": "live"
  },
  {
    "sourceTree": "3397ea3c23392a9b6b0cf004b7c8a54bf9830067",
    "command": "node evidence/super-plan-ufz.26/coordinator-focused.mjs",
    "configuration": "clean post-rebase task branch; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26; HOME=/tmp/sp-bce79baa/super-plan-ufz.26/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/config; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/cache; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/data; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/state; existing replay harness doc fixtures and canned runtime answers, no hosted agents",
    "outcome": "pass",
    "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-23-report.md#final-check-coordinator",
    "kind": "simulated"
  }
]
```

`requiredLiveChecks`:

```json
[
  {
    "sourceTree": "3397ea3c23392a9b6b0cf004b7c8a54bf9830067",
    "command": "bash tests/super-auto/generated-review-inputs-r1.sh",
    "configuration": "clean post-rebase task branch; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26; HOME=/tmp/sp-bce79baa/super-plan-ufz.26/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/config; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/cache; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/data; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/state"
  },
  {
    "sourceTree": "3397ea3c23392a9b6b0cf004b7c8a54bf9830067",
    "command": "bash tests/super-auto/test-scripts.sh",
    "configuration": "clean post-rebase task branch; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26; HOME=/tmp/sp-bce79baa/super-plan-ufz.26/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/config; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/cache; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/data; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/state"
  },
  {
    "sourceTree": "3397ea3c23392a9b6b0cf004b7c8a54bf9830067",
    "command": "bash tests/super-code/test-dispatch-text.sh",
    "configuration": "clean post-rebase task branch; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26; HOME=/tmp/sp-bce79baa/super-plan-ufz.26/home; XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/config; XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/cache; XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/data; XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.26/state"
  }
]
```

## Final check generated

Command: `bash tests/super-auto/generated-review-inputs-r1.sh`. Exit: 0. Kind: `live`.

```text
{"invocation":"inv-1","files":5,"bytes":1015,"maxBasename":11}
{"invocation":"inv-2","files":7,"bytes":4241,"maxBasename":11}
{"invocation":"inv-3","files":8,"bytes":7538,"maxBasename":11}
{"invocation":"inv-4","files":9,"bytes":10977,"maxBasename":11}
{"invocation":"inv-5","files":10,"bytes":14556,"maxBasename":11}
{"invocation":"inv-6","files":12,"bytes":18461,"maxBasename":11}
PASS: four unchanged-product collection/re-entry cycles, new product, immutable archives, captured source, exact claims, unusual paths and explicit provenance gaps
```

## Final check super-auto

Command: `bash tests/super-auto/test-scripts.sh`. Exit: 0. Kind: `live`.

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

## Final check dispatch

Command: `bash tests/super-code/test-dispatch-text.sh`. Exit: 0. Kind: `live`.

```text
dispatch-text: evidence classification shares the Workflow record contract
  [PASS] ordinary record classification exits 0
  [PASS] ordinary results preserve provenance, failed/unavailable and required-live gaps
dispatch-text: verification-only evidence review
  [PASS] verification review dispatch exits 0
  [PASS] ordinary review transports explicit verification intent
  [PASS] ordinary review transports the fixed tree
  [PASS] ordinary review transports retained measurement references
  [PASS] evidence review reads the existing report
  [PASS] evidence review branches before nonempty-diff packaging
  [PASS] legacy review keeps implementation intent
  [PASS] reviewed verification produces ordinary closure dispatch
  [PASS] closure observes tracker status first
  [PASS] closure carries independent review identity
  [PASS] verification closure claims no Git landing
  [PASS] verification closure retains cleanup outcomes
  [PASS] unreviewed verification cannot dispatch closure
dispatch-text: implement
  [PASS] exits 0
  [PASS] writes <ledger dir>/dispatch/<label>.md and prints only its path
  [PASS] the implementer dispatch
  [PASS] task worktree under the Launch: line's integration worktree
  [PASS] artifacts in the ledger's directory, by ordinal
  [PASS] workspace setup cuts from the integration branch
  [PASS] process hygiene the implementer template points at
  [PASS] current requirements
  [PASS] implementer RESULT carries optional evidence
  [PASS] implementer dispatch names the complete provenance contract
  [PASS] no stacking without --parents
  [PASS] --parents stacks on the parent's branch
  [PASS] and names the stack-conflict return
  [PASS] --reentry: the review re-entry setup
dispatch-text: review, fix, seam review, check-fix review
  [PASS] task review receives captured implementation head
  [PASS] base check uses captured head
  [PASS] pinned final single exits 0
  [PASS] final single diff is captured
  [PASS] final single source is captured
  [PASS] pinned final cluster exits 0
  [PASS] final cluster diff is captured
  [PASS] final cluster source is captured
  [PASS] pinned final seam exits 0
  [PASS] final seam diff is captured
  [PASS] final seam source is captured
  [PASS] task review rejects a moving source ref
  [PASS] final review rejects a moving source ref
  [PASS] review carries the base check
  [PASS] review dispatch carries explicit live-check identities
  [PASS] review dispatch carries the shared evidence contract
  [PASS] and the reported base
  [PASS] fix --kind check: the merge-check fix scope
  [PASS] with the Launch: line's mergeCheck
  [PASS] and the build errors as data
  [PASS] fix --kind check: fresh-agent handoff
  [PASS] fix --kind check: brief path
  [PASS] fix --kind check: previous report path
  [PASS] fix --kind check: base..HEAD range
  [PASS] fix --kind seam: fresh-agent handoff
  [PASS] fix --kind seam: brief path
  [PASS] fix --kind seam: previous report path
  [PASS] fix --kind seam: base..HEAD range
  [PASS] fix --kind review: fresh-agent handoff
  [PASS] fix --kind review: brief path
  [PASS] fix --kind review: previous report path
  [PASS] fix --kind review: base..HEAD range
  [PASS] fix --kind review: the review file path
  [PASS] seam review
  [PASS] a consumes entry gets the composed-review text
  [PASS] check-fix review
dispatch-text: merge
  [PASS] an unstacked merge rebases the whole branch
  [PASS] fail-closed branch and clean checks
  [PASS] the merge check
  [PASS] the merge leaves the ledger lines to the coordinator
  [PASS] an unsplit task's branch is removed
  [PASS] --stacked rebases only the task's own commits
  [PASS] --review-bead closes the review bead after the task bead
  [PASS] and keeps a split task's branch for its dependents
dispatch-text: plan, triage
  [PASS] plan --mode ready
  [PASS] plan --mode rest appends
  [PASS] plan text names task-surface
  [PASS] plan text names filesToRead
  [PASS] plan text names surfaceTokens
  [PASS] plan text names oversized
  [PASS] triage
  [PASS] and its waitFor field
dispatch-text: final-answer rule
  [PASS] implement ends with the final-answer rule
  [PASS] implement (stacked) ends with the final-answer rule
  [PASS] implement (reentry) ends with the final-answer rule
  [PASS] review ends with the final-answer rule
  [PASS] fix (check) ends with the final-answer rule
  [PASS] fix (review) ends with the final-answer rule
  [PASS] fix (seam) ends with the final-answer rule
  [PASS] seam-review ends with the final-answer rule
  [PASS] check-fix-review ends with the final-answer rule
  [PASS] merge ends with the final-answer rule
  [PASS] merge (stacked) ends with the final-answer rule
  [PASS] plan (ready) ends with the final-answer rule
  [PASS] plan (rest) ends with the final-answer rule
  [PASS] plan (refill) ends with the final-answer rule
  [PASS] triage ends with the final-answer rule
  [PASS] coordinator.js carries the schema-form rule
  [PASS] coordinator.js carries the verdict-form rule
  [PASS] step-back-prompt.md copies the schema form
  [PASS] scope-filter-prompt.md copies the schema form
  [PASS] report-prompt.md copies the verdict form
  [PASS] report-prompt.md has no schema form
  [PASS] step-back-prompt.md has no verdict form
  [PASS] scope-filter-prompt.md has no verdict form
  [PASS] report-prompt.md describes the draft handoff
  [PASS] report-prompt.md names the status placeholder
  [PASS] SKILL.md's report drafter row names report.draft.md
dispatch-text: assemble
  [PASS] assemble final-review exits 0
  [PASS] final-review OUT_DIR includes persisted invocation identity
  [PASS] points at the assembler template
  [PASS] names the consumer
  [PASS] final-review asks for clusters
  [PASS] final-review section: diffstat
  [PASS] final-review section: report summaries
  [PASS] final-review section: interfaces and seams
  [PASS] final-review section: deferred minors
  [PASS] final-review section: amendments
  [PASS] assembled-size is named by absolute script path
  [PASS] and it is the script, not a re-implementation
  [PASS] the ledger path
  [PASS] default threshold
  [PASS] no spec paths by default
  [PASS] assemble final-review ends with the final-answer rule
  [PASS] roast-code OUT_DIR carries the instance
  [PASS] roast-code section: slice index
  [PASS] roast-code section: stated-intent spec paths
  [PASS] roast-code section: diffstat
  [PASS] roast-code carries no report summaries
  [PASS] roast-code carries no concerns
  [PASS] roast-code asks for no clusters
  [PASS] assemble roast-code ends with the final-answer rule
  [PASS] --spec lists the spec paths
  [PASS] history instance is a bead id
  [PASS] history section: ledger lines
  [PASS] history section: bead comments
  [PASS] history section: report summaries
  [PASS] history asks for no clusters
  [PASS] assemble history ends with the final-answer rule
  [PASS] assess section: ledger state counts
  [PASS] assess section: deferred minors
  [PASS] assess asks for no clusters
  [PASS] assemble assess ends with the final-answer rule
  [PASS] --run-tag overrides the Launch: line
  [PASS] the Launch: args form carries runTag
  [PASS] final-review assembly uses the persisted identity without runTag
  [PASS] assembler-prompt.md states it judges nothing
  [PASS] assembler-prompt.md empties the instance dir first
  [PASS] assembler-prompt.md relays the exit code and the fits: line
  [PASS] assembler-prompt.md names no model (opus)
  [PASS] assembler-prompt.md names no model (sonnet)
  [PASS] assembler-prompt.md names no model (haiku)
  [PASS] assembler-prompt.md names no model (gpt)
  [PASS] --consumer bogus: exit 2
  [PASS] assemble without --instance: exit 2
dispatch-text: final-review
  [PASS] final-review --mode single exits 0
  [PASS] single without --dir reviews direct inputs through the review package
  [PASS] single writes the invocation handoff file
  [PASS] an uncapped single review is not told its inputs overflow
  [PASS] single ends with the final-answer line
  [PASS] single --dir reads the assembled digest
  [PASS] single --dir does not rebuild the review package
  [PASS] --capped tells the reviewer its inputs exceed the window
  [PASS] cluster writes the invocation cluster file
  [PASS] cluster names the cluster it reviews
  [PASS] cluster ends with the final-answer line
  [PASS] seam --reviewed exits 0
  [PASS] seam is given reviewed cluster file 1
  [PASS] seam is given reviewed cluster file 3
  [PASS] seam is not given the unreviewed cluster's file
  [PASS] seam names the unreviewed entry verbatim
  [PASS] seam writes the handoff file
  [PASS] seam ends with the final-answer line
  [PASS] --reviewed none: the empty list
  [PASS] stub exits 0
  [PASS] stub writes the handoff file
  [PASS] stub names the unreviewed entries
  [PASS] stub lists the reviewed cluster file
  [PASS] stub ends with the final-answer line
  [PASS] stub dispatch name includes its invocation identity
  [PASS] final-review --mode bogus: exit 2
  [PASS] cluster without --name: exit 2
  [PASS] stub without --unreviewed: exit 2
  [PASS] seam --reviewed 0: exit 2
  [PASS] seam --reviewed a,b: exit 2
  [PASS] seam without --reviewed: exit 2
  [PASS] and says what is missing
  [PASS] single reads the ledger's Sweep: line into the prompt
  [PASS] and its text
  [PASS] single reads the four Metrics: lines
  [PASS] a recorded sweep is not reported absent
  [PASS] --sweep deferred passes the deferred marker
  [PASS] --sweep F overrides the ledger
  [PASS] and the ledger's sweep is not used
  [PASS] --metrics F overrides the ledger
  [PASS] and the ledger's metrics are not used
  [PASS] a Launch line with sweep deferred and no Sweep: line defers the sweep
  [PASS] the Workflow Launch form's deferSweep defers the sweep
  [PASS] no Sweep: line and no deferral: still no sweep result
  [PASS] argument parity: finalReviewPrompt
  [PASS] argument parity: finalClusterReviewPrompt
  [PASS] argument parity: finalSeamReviewPrompt
  [PASS] argument parity: finalReviewStubPrompt
dispatch-text: advancing caller fixture
  [PASS] regenerated task/assembly/single/cluster/seam prompts preserve captured source across two caller advances
dispatch-text: invocation bundle identity and resume
  [PASS] inv-a/single builds from persisted identity
  [PASS] inv-a/single bundle includes invocation identity
  [PASS] inv-a/single never uses the enclosing runTag for review files
  [PASS] inv-a/cluster builds from persisted identity
  [PASS] inv-a/cluster bundle includes invocation identity
  [PASS] inv-a/cluster never uses the enclosing runTag for review files
  [PASS] inv-a/seam builds from persisted identity
  [PASS] inv-a/seam bundle includes invocation identity
  [PASS] inv-a/seam never uses the enclosing runTag for review files
  [PASS] inv-a/stub builds from persisted identity
  [PASS] inv-a/stub bundle includes invocation identity
  [PASS] inv-a/stub never uses the enclosing runTag for review files
  [PASS] inv-a assembly is invocation scoped
  [PASS] inv-b/single builds from persisted identity
  [PASS] inv-b/single bundle includes invocation identity
  [PASS] inv-b/single never uses the enclosing runTag for review files
  [PASS] inv-b/cluster builds from persisted identity
  [PASS] inv-b/cluster bundle includes invocation identity
  [PASS] inv-b/cluster never uses the enclosing runTag for review files
  [PASS] inv-b/seam builds from persisted identity
  [PASS] inv-b/seam bundle includes invocation identity
  [PASS] inv-b/seam never uses the enclosing runTag for review files
  [PASS] inv-b/stub builds from persisted identity
  [PASS] inv-b/stub bundle includes invocation identity
  [PASS] inv-b/stub never uses the enclosing runTag for review files
  [PASS] inv-b assembly is invocation scoped
  [PASS] resume replay uses the identical persisted source and artifact path
  [PASS] Workflow Launch args also replay invocation identity
  [PASS] unsafe or missing invocation identity [../escape] refuses review output
  [PASS] unsafe or missing invocation identity [a/b] refuses review output
  [PASS] unsafe or missing invocation identity [a b] refuses review output
  [PASS] unsafe or missing invocation identity [] refuses review output
  [PASS] an unpersisted identity override cannot replace the launch identity
dispatch-text: emitted bundle paths retain prior contents, including suffix-like identities
  [PASS] distinct ordinary invocation bundles preserve prior artifact contents, including suffix-like IDs
dispatch-text: run facts and bad input
  [PASS] a Workflow Launch: args line is read too
  [PASS] mergeCheck none: no check step
  [PASS] --branch overrides the Launch: line
  [PASS] no Launch: line and no overrides: exit 2
  [PASS] a missing required option: exit 2
  [PASS] an unknown kind: exit 2
dispatch-text: every kind --help lists is one it builds
  [PASS] the help's kinds all parse (missing: none)

dispatch-text: all tests passed
```

## Final check source-binding

Command: `node tests/super-code/invocation-source-binding-r1.mjs`. Exit: 0. Kind: `live`.

```text
11 invocation source-binding scenarios passed
```

## Final check startup

Command: `node tests/super-code/startup-builder-seam-r1.mjs`. Exit: 0. Kind: `live`.

```text
PASS: 126 startup/builder seam checks; real CLI, both Launch forms, all ordinary modes, strict review gates, no startup or ledger/artifact mutation
```

## Final check archive-integrity

Command: `bash tests/super-auto/archive-integrity-r1.sh`. Exit: 0. Kind: `live`.

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

## Final check coordinator

Command: `node evidence/super-plan-ufz.26/coordinator-focused.mjs`. Exit: 0. Kind: `simulated`.

```text
PASS dryRun 0: 48 agent dispatches, 0 errors
PASS dryRun 1: 19 agent dispatches, 0 errors
PASS dryRun 2: 23 agent dispatches, 0 errors
PASS live-sim selection refusal: no final-review fallback dispatch; explicit hash gap retained
```

## Test hygiene

All seven final per-check leak probes returned exit 0 with empty output, from `/private/tmp` after the test completed. Final `stop-run-processes <task worktree> /tmp/sp-bce79baa/super-plan-ufz.26` returned exit 0 with empty output: no stopped, survived, unknown or kept lines. No background server/daemon/watcher was started. Earlier RED/development probes also found no matches; the prior held handoff's cleanup caveat remains preserved verbatim below rather than being rewritten as a clean historical measurement.

## Files changed

- `evidence/super-plan-ufz.26/amended-red-source-tree.txt`
- `evidence/super-plan-ufz.26/amended-red.log`
- `evidence/super-plan-ufz.26/coordinator-development.log`
- `evidence/super-plan-ufz.26/coordinator-focused.mjs`
- `evidence/super-plan-ufz.26/dispatch-development.log`
- `evidence/super-plan-ufz.26/dispatch-development2.log`
- `evidence/super-plan-ufz.26/green-development.log`
- `evidence/super-plan-ufz.26/green-development2.log`
- `evidence/super-plan-ufz.26/green-development3.log`
- `evidence/super-plan-ufz.26/investigation.txt`
- `evidence/super-plan-ufz.26/red-hygiene-corrected.log`
- `evidence/super-plan-ufz.26/red-hygiene.log`
- `evidence/super-plan-ufz.26/red-source-tree.txt`
- `evidence/super-plan-ufz.26/red.log`
- `evidence/super-plan-ufz.26/red2-hygiene.log`
- `evidence/super-plan-ufz.26/red2-source-tree.txt`
- `evidence/super-plan-ufz.26/red2.log`
- `evidence/super-plan-ufz.26/super-auto-development.log`
- `skills/super-auto/SKILL.md`
- `skills/super-code/assembler-prompt.md`
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/dispatch-text.mjs`
- `tests/super-auto/generated-review-inputs-r1.sh`

## Concerns and pending obligations

- Changed-instruction evaluation is pending the enclosing coordinator. The real CLI/collector tests, rendering checks and simulated replay do not establish live agent adherence, semantic clustering quality, hosted Workflow success, full-suite success or root/human acceptance.
- The selected set retains report and metadata growth by design; ordinary large evidence can still exceed the existing assembler window. That remains honestly capped/unavailable rather than gaining a directory-name exemption.
- No unrelated collector, transport, source-binding, startup, cleanup, finding projection or direct frozen-Git fallback redesign was attempted.

## Prior scope-held handoff (retained verbatim; superseded status)

# Task 23 — recursive generated review inputs

Status: BLOCKED
scopeHeld: true
blockerBead: null
completionKind: implementation
base: 18b0b6d5fdfa772f3aa74d53706d6a4615b4ae86
head: a66116ef122b57f308920f09ec3d34eb8f2b871b
stacked: false
reopened: false

## Outcome

Coordinator-owned scope amendment is pending; this is a held handoff, not a missing dependency or outage, and does not consume the implementation retry budget. On explicit coordinator instruction, no production edits were made. The isolated task branch contains a clean commit of the named regression fixture and retained RED evidence for a fresh implementation owner. No blocker bead was filed, per coordinator instruction.

The demonstrated cause crosses the existing collector and assembler: report-status preserves the complete direct diff and assembled slice directory under the committed review archive, then assembler-prompt steps 2/4 enumerate that full captured diff again and generate slices for prior generated slices. The fixture executes the real report-status collector and, in baseline mode, the actual pre-fix assembler recipe. Collection itself succeeds before the next assembly consumes its archive.

The proposed additional helper filename was not authorized and was not created. The coordinator assessed an existing-component approach separately at `recursive-input-boundary-assessment-r1.md`; a fresh owner will receive that assessment and an explicit amendment. The fixture's default call to a prospective report-status --review-inputs mode remains a provisional, unimplemented interface for that owner to revise against the amendment.

## Tests and TDD evidence

Final measured command (RED only):

```bash
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26 GENERATED_REVIEW_INPUTS_BASELINE=1 bash tests/super-auto/generated-review-inputs-r1.sh
```

Exit 1, expected behavior failure:

```text
{"invocation":"inv-1","files":2,"bytes":357,"maxBasename":31}
{"invocation":"inv-2","files":9,"bytes":5211,"maxBasename":108}
AssertionError [ERR_ASSERTION]: prior collected packages must not become fresh slices
actual: false
expected: true
```

The first real collection succeeded, including complete original finding-text extraction. The second assembly included paths under `docs/run/reviews/`, violating the exclusion assertion. Source snapshot: `0d0136c5b6cb8463da7d976bc0f48b5a6986718c`. Original earlier RED output is retained too. No GREEN result is claimed.

Assertions after the failure, iterations 3–5, the later-product control, complete archive hash checks and collection replay after source cleanup are unmeasured. Their fixture coverage is present for continuation. The default named regression and unchanged existing `bash tests/super-auto/test-scripts.sh` acceptance run remain pending implementation. No full suite was run.

Each assertion has an observable counterexample: lost original/new product membership; an archived path entering changed files; an ordinary product path named reviews being omitted; changed base/head; missing prior invocation or raw finding/direct-diff provenance; a modified archived byte/hash; an incomplete collection or missing finding text; basename amplification; recursive byte growth; or failed replay after source cleanup. None of those post-failure assertions is presented as measured.

## Evidence

```json
[
  {"sourceTree":"b961e615a65df862a0cf08e234617fee0005def2","command":"TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26 GENERATED_REVIEW_INPUTS_BASELINE=1 bash tests/super-auto/generated-review-inputs-r1.sh","configuration":"baseline pre-fix assembler recipe; real collector; original fixture","outcome":"fail","location":"evidence/super-plan-ufz.26/red.log","kind":"live"},
  {"sourceTree":"0d0136c5b6cb8463da7d976bc0f48b5a6986718c","command":"TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.26 GENERATED_REVIEW_INPUTS_BASELINE=1 bash tests/super-auto/generated-review-inputs-r1.sh","configuration":"baseline pre-fix assembler recipe; real collector; complete finding-text assertion","outcome":"fail","location":"evidence/super-plan-ufz.26/red2.log","kind":"live"}
]
```

requiredLiveChecks: [] (no acceptance check completed in this held implementation handoff; the two named acceptance commands above remain pending).

Capture commands are retained verbatim in `evidence/super-plan-ufz.26/investigation.txt`: each temporary index first read HEAD, added only the untracked named regression, then wrote the tested tree. The real Git index was preserved. Raw logs were committed before final cleanup. The handoff commit's tree is `15705982927774e1ec949da8d793bd4b5cb31322`; it additionally contains retained logs and investigation text, not a passing implementation.

## Files changed

- tests/super-auto/generated-review-inputs-r1.sh
- evidence/super-plan-ufz.26/investigation.txt
- evidence/super-plan-ufz.26/red.log
- evidence/super-plan-ufz.26/red-source-tree.txt
- evidence/super-plan-ufz.26/red-hygiene.log
- evidence/super-plan-ufz.26/red-hygiene-corrected.log
- evidence/super-plan-ufz.26/red2.log
- evidence/super-plan-ufz.26/red2-source-tree.txt
- evidence/super-plan-ufz.26/red2-hygiene.log

## Test hygiene

No process matches were found. The first leak check ran from inside the task worktree and the helper refused its own cwd (exit 2, retained in red-hygiene.log). Running the same check from /private/tmp returned exit 0 with no matches; revised RED check also returned exit 0 with no matches. No background process was started by the fixture. Final cleanup uses only the assigned worktree and temporary root; its result is recorded in the structured handoff.

## Assumptions and amendments

- Read current `bd show super-plan-ufz.26 --json` and comments: no comments or explicit task amendments existed at investigation start. Frozen ordinal/scope and compatible current bead requirements were used.
- Coordinator subsequently explicitly held production implementation pending a scope amendment and ordered this clean RED-only handoff with BLOCKED, scopeHeld:true and blockerBead:null. That instruction governs this result.
- Repository uses system Node/Bash and its own shell scripts; no package setup or importable local package/test runner exists. The fixture and collector both resolve inside the assigned task worktree; `/opt/homebrew/bin/node` and `/bin/bash` are runtime interpreters, not external package-under-test resolutions.
- Read and applied systematic-debugging and TDD; read writing-skills for prospective operative text changes. No operative text changed. No subagent was spawned from this seat; coordinator owns any later bounded instruction evaluation.

## Concerns and preserved boundaries

- The defect is reproduced but NOT fixed. At least four successful unchanged-product collection/re-entry cycles, later product membership and immutable provenance still require a passing implementation run.
- Historical repository evidence remained byte-unchanged; the narrower rejected direct frozen-Git fallback materiality finding remains rejected. No independent filename-only repair was attempted.
- No production changes affect .24 hash validation, .29 source binding, .23 deterministic startup or .32 cleanup contracts.
- No replacement engine, agent role, new finding lifecycle, merge, rebase, push, tracker write, Herdr mutation, root closure or unrelated suite was performed. The integration worktree remained read-only except explicitly authorized plan brief/report/result paths.

Final cleanup result: exit 0, with the exact line below and no `survived:` lines:

```text
stopped: 29238 ? — cwd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.26
```

The process command was unavailable (`?`); there is no evidence attributing it to a particular test. Earlier per-test checks found no matches. Cleanup ran concurrently with the final read-only Git status/identity capture. This possible command-process overlap is reported as observed, without labeling it a test leak.
