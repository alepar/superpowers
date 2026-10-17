diff --git a/skills/super-code/coordinator-workflow.md b/skills/super-code/coordinator-workflow.md
index c54cfebc..8a40bacb 100644
--- a/skills/super-code/coordinator-workflow.md
+++ b/skills/super-code/coordinator-workflow.md
@@ -26,8 +26,10 @@ args = {
   integrationBranch,
   integrationWorktree,   // optional — see below
   skillsRoot,            // required — see below
-  runTag,                // optional — see below
+  runTag,                // optional — enclosing run identity
+  invocationId,          // one invocation; reuse only on explicit unsettled resume
   deferSweep,            // optional — see below
+  rootAcceptance,        // optional 'caller' or default 'coordinator', independent of deferSweep
   processRoots,          // optional — see below
   dryRun,
   config: {
@@ -62,9 +64,26 @@ cap is `concurrency` as given, and a log line says it was not checked.
 effort. dryRun stubs take none.
 
 `runTag` is **optional**: the run's tag, `<epicId or slug>-<UTC yyyymmddThhmmss>`. A caller
-(`super-auto`) passes its own; a standalone pre-flight mints `<epicId>-…`. Every assembled directory
-and final-review file name uses it, and the Workflow writes it into its `Launch: args` line. Absent,
-it is the epic id.
+(`super-auto`) passes its own; a standalone pre-flight mints `<epicId>-…`. It groups processes and
+non-review assembly directories; absent, it is the epic id.
+
+`invocationId` owns this invocation’s review bundle. Before launch, the caller mints a fresh
+filesystem-safe token (1–128 ASCII letters, digits, `_` or `-`, starting with a letter or digit;
+for example `inv-$(uuidgen)`) and passes it in args. The script mints one when omitted. The existing
+`Launch: args` append persists it and is awaited; only `appended: true` authorizes review assembly
+and review writers. A persistence gap leaves an explicit unavailable review and `reviewPath: null`.
+For an explicit resume of an unsettled invocation, copy its recorded `invocationId` into args
+alongside `resumeFromRunId`; replay retains the same paths. After an invocation has returned a
+settled result, the next invocation mints a new identity, including after a blocked result, even
+when `runTag` stays the same. Never infer resume identity from the latest Launch solely by runTag.
+
+The immutable bundle is `<workspace>/final-review-<invocationId>.md`, its direct-input `.diff`,
+`final-review-<invocationId>.cluster-<n>.md`, and
+`assembled/final-review-<invocationId>-final/`. Single, seam and stub writers share only that
+invocation’s final path. The dot before `cluster` cannot occur in invocation tokens, so a
+suffix-like token cannot alias another invocation’s cluster artifact. A settled bundle remains
+available to downstream source/disposition consumers under its original invocation and artifact
+identity; a later review does not replace it.
 
 `contextWindows` is **optional**: `context-preflight --json`'s object (`{"<role>": <window tokens>}`
 for planner, implementer, reviewer, finalReview and assembler; absent roles are unknown), passed
@@ -77,10 +96,11 @@ bucketing — see "The coordinator loop" step 3 and SKILL.md §Parallelism).
 
 `topUpQueryCap` is **optional** — additive, defaulting to 40: the per-round budget of `bd ready`
 top-up re-queries ("The coordinator loop" step 4). Mid-round readiness is normally computed in JS
-from the planner's `deps` rows at no agent cost; the top-up query runs only where JS cannot see
-readiness — a mapping with no `deps` rows, or a waiting row marked `opaque` — and there it still
-costs one mechanical agent per landing, which this caps. Exhaustion degrades to the ordinary
-round-boundary refill (no work lost), and the detector line reports usage.
+from the planner's `deps` rows at no agent cost; the top-up query runs where JS cannot see
+readiness — mappings without `deps`, external dependency statuses, or waiting `opaque` rows.
+Landings, post-capacity refreshes and the in-flight cadence share this serialized query budget.
+Exhaustion leaves work needing fresh observations held for the next round; the detector reports
+usage. `readinessRefreshMs` is optional, default 30000 ms, and sets that bounded in-flight cadence.
 
 `earlyUnblock` is **optional**, default `true`: a task with open in-tree dependents is **split**
 when its implementer reports a commit. A mechanical dispatch (`scripts/review-bead split`) creates a
@@ -109,6 +129,15 @@ never a shared location.
 runs one after its fix loop exits). Finish then skips the sweep, tells the final reviewer it was
 deferred, and returns `sweep: "SWEEP DEFERRED (caller-owned)"`.
 
+`rootAcceptance` is **optional**: `"caller"` reserves root closure for the enclosing caller
+(super-auto always supplies it). The default `"coordinator"` preserves standalone acceptance
+ownership. Persist it in Launch and restore it on every retry/re-entry. It is independent of
+`deferSweep` and finish/worktree ownership. In caller mode every `close-in-tree-epics` invocation
+adds `--exclude-root`, including Close and live top-up/refill's preliminary close. Ready and its
+post-closure recheck remain read-only queries. Inner epics still close to fixpoint. An empty frontier returns `ready-drained`
+without demanding a closed root; report implementation results and durable acceptance obligations
+to the caller. Required reviews, measurements and human choices remain the caller's to settle.
+
 `mergeCheck` is **optional**: the exact BUILD-ONLY command — compile or typecheck, envelope
 included (`cargo check --all-targets`, `tsc --noEmit`, `go build ./...`) — the merge agent runs on
 the merged tree at every serial merge. It is never a test command: no tests run per merge. It
@@ -262,7 +291,7 @@ Two rules, both mandatory in `./coordinator.js`:
 | `final-review` (single) | `review` is an explicit UNAVAILABLE string — **never** "no findings". |
 | `assemble:final` | Not fatal: the final review runs once on direct inputs, uncapped, and the ledger line reads `Final review: single (assembler unavailable)`. |
 | `final-review:cluster:<n>` / `final-review:seam` | The cluster (or `seam`) is listed `unreviewed` and `review` becomes `not ready (…; unreviewed: …)` — never `ready`. A null seam dispatches `final-review:stub` so the handoff file exists. |
-| `worktree-sweep` | `worktreesKept` is `['WORKTREE SWEEP UNAVAILABLE — …']` and `processSweep.survived` is `['PROCESS SWEEP UNAVAILABLE — …']` — **never** empty lists, which would read as nothing left behind. |
+| `worktree-sweep` | `worktreesKept` names unchecked worktree/temp roots as `WORKTREE SWEEP UNAVAILABLE — …`; `processSweep.unknown` carries `PROCESS SWEEP UNAVAILABLE — …`, with `survived` empty. A null dispatch, `scriptError` or missing `processLines` is unverified inspection, not a verified empty sweep. |
 | ledger writes (`ledger:<id>` — one per task chain, carrying every line the task noted — plus `ledger-append:<kind>` and `ledger-recurring:<k>`; all via `appendLedger` on the ledger chain) | **Retried once, then marked**: a null append is re-dispatched once — with the lines' agent-authored free text elided where the call site has an elided variant (ids and outcome token kept) — and a second null is recorded by label in `ledgerAppendFailed` (returned), logged as `ledger-append-failed: <label>`, and counted on the Finish-phase `Metrics: ledger-check` line. Never silent, never fatal. |
 | `notify` | Retried once with the detail elided (ids and the blocker bead only); a second null is logged and the run continues — the ledger's BLOCKED line and the bead carry the record. |
 | `clarify` | Fire-and-forget: logged and continued. The clarification IS the payload, so there is no elided form; the retry then runs without it (a known cost, recorded here). |
@@ -339,6 +368,9 @@ Done by the main session, not the Workflow:
      when it prints `{}`).
    - runTag: the caller's `args.runTag` when given, else mint `<epicId>-$(date -u +%Y%m%dT%H%M%S)`;
      pass it as `args.runTag` (the Workflow writes it into its `Launch: args` line).
+   - invocationId: mint `inv-$(uuidgen)` for a new invocation and pass `args.invocationId`;
+     reuse the persisted token only for explicit unsettled resume. Confirm the Launch append
+     before any review bundle output; leave a persistence gap unavailable.
    - Marker: `bash <skills>/super-code/scripts/run-marker get <session id> --cwd <integration worktree>`
      (session id: `$CLAUDE_CODE_SESSION_ID`, else `$CODEX_THREAD_ID`). Exit 1 (no live marker: a
      standalone run) → `bash <skills>/super-code/scripts/run-marker register --skill super-code
@@ -456,9 +488,12 @@ Round-based with refill (each `bd ready` batch is, by definition, mutually indep
    whose in-tree blocker this run quarantined or left awaiting its retry: bd sees that blocker's
    task bead closed only when a reopen was lost. A round whose every ready id is held back ends
    like an empty ready set (`ready-drained`).
-2. **Terminate?** — completion is **the root epic (`epicId`) closed**, not an empty ready set:
+2. **Terminate?** — under default standalone ownership, completion is **the root epic (`epicId`) closed**, not an empty ready set:
    run the epic-closure step (below) after each refill cycle and check whether the root closed.
-   An empty ready set with the root still open means the remaining work is quarantined blockers
+   With `rootAcceptance: "caller"`, skip root closure: an empty ready set ends implementation
+   normally as `ready-drained`, preserving caller review/measurement/human obligations. It does
+   not claim full run acceptance and is not itself a stall.
+   Under standalone ownership, an empty ready set with the root still open means the remaining work is quarantined blockers
    (see "The blocker-bead path") — that ends the loop too, but as a report, not a clean finish. A
    **third** exit, independent of both: a round that merges no task, closes no epic, gains no
    RESOLVE-pending id, and quarantines no id at all made no forward progress whatsoever and never
@@ -470,10 +505,14 @@ Round-based with refill (each `bd ready` batch is, by definition, mutually indep
 3. **Dispatch the batch under a sliding window** — every planned id dispatches as soon as a slot
    frees, bounded by the concurrency cap (`min(config.concurrency, runtimeSlots - 2)`, so every
    admitted chain is a running agent and two runtime slots stay free for merges and top-ups), with
-   one file-based scheduling constraint:
-   at most `config.hotFileCap` (default 3) in-flight tasks may declare the same file
-   (`filesTouched`, from the planner's mapping — a churn bound for shared barrel/index/registry
-   files, not a dispatch gate). No batch or wave barriers anywhere: a straggler never delays the
+   one file-based scheduling constraint: at most `config.hotFileCap` (default 3) in-flight tasks
+   may declare the same file (`filesTouched`, from the planner's mapping — a churn bound for shared
+   barrel/index/registry files, not a dispatch gate).
+   A waiting slot is a reservation. After acquiring it, recheck the merge-lane hold, cancellation,
+   quarantine/retry state and effective dependencies before creating an attempt. A rejected
+   reservation releases its slot with an admission reason and no implementation/fix/merge outcome.
+   This predicate covers round-head, graph/tracker top-up, retry and review re-entry dispatches.
+   No batch or wave barriers anywhere: a straggler never delays the
    next task's dispatch, and the per-task chain has **no barrier between stages** either (a fast
    task isn't held up by a slow sibling at any point, including its merge — see step 4).
    Disjoint-file bucketing used to gate dispatch here; it was removed on live measurement — see
@@ -494,15 +533,18 @@ Round-based with refill (each `bd ready` batch is, by definition, mutually indep
    already-merged re-entry are handled where the chain ends, beside the merges and inside a
    concurrency slot like any chain (none touches the integration branch, and `bd` writes are safe
    beside a merge); a merge that fails releases the queue before its triage runs. Ledger lines never hold it either (see "Workspace and ledger").
-   **Mid-round readiness is computed, not queried.** The planner's mapping rows carry each open
-   bead's in-tree leaf blockers (`deps`, from `scripts/tree-deps`) and whether anything else gates
-   it (`opaque`: an epic-level or out-of-tree blocker, a hand claim). Every landing — and, with
-   `earlyUnblock`, every split task's implementation — runs `readyFromGraph()` in JS: a row whose
-   blockers have all landed, at least one of them this round, dispatches into this round's
-   scheduler with no agent spent. The `bd ready` top-up (epic closure, then a ready re-query) runs
-   after a landing only where JS cannot see readiness: a mapping with no `deps` rows at all, or a
-   waiting `opaque` row (see the top-up block in `./coordinator.js` for the bounds: dedup set,
-   re-entrancy coalescing, mapping-row gate, quiescence before the drain).
+   **Mid-round readiness.** Local implementation dependencies use `completed` or `implDone` under
+   early unblock. Review, blocker, human-gate and other out-of-tree dependencies use authoritative
+   tracker closure, even when their IDs never enter those local sets. The existing mechanical
+   top-up returns compact `observations: [{id,status,kind}]` for the mapping's external blocks
+   relationships (`kind`: review, blocker, gate, epic or task); a failed/malformed lookup replaces
+   only that dependency's observation with an error and holds its consumers with a reason.
+   `opaque` rows still require `bd ready`; local graph readiness remains free of tracker calls.
+   Refresh external/opaque facts after a capacity wait. Landings and one in-flight timer share
+   the serialized top-up and its `topUpQueryCap` budget; `readinessRefreshMs` defaults to 30000 ms.
+   This finite cadence can release a consumer while unrelated work remains in flight. Budget
+   exhaustion leaves work needing a fresh observation held until the next round. Cancel the timer
+   at quiescence; refresh never waits on a task chain or the merge lane.
    **Early unblock** (`config.earlyUnblock`, default on). A task with open in-tree dependents is
    split when its implementer reports a commit: `scripts/review-bead split` creates its
    `review: <id>` bead, then closes its task bead — beside the review, never before the dependents
@@ -524,7 +566,8 @@ Round-based with refill (each `bd ready` batch is, by definition, mutually indep
 5. **Epic closure** — `bd epic close-eligible` is repo-global: it has no `--label`/`--parent`/
    `--mol` scoping flag (verified via `--help`), so the mutating form is **never** called
    unfiltered — in a repo holding more than one live epic it would close epics belonging to
-   unrelated work. An agent runs `scripts/close-in-tree-epics <epicId>`: every pass previews with
+   unrelated work. An agent runs `scripts/close-in-tree-epics <epicId>` (append `--exclude-root`
+   under caller root acceptance, in every helper caller): every pass previews with
    `bd epic close-eligible --dry-run --json`, keeps the candidates `scripts/epic-tree` places in
    this run's tree, and closes those individually via `bd close <id>`. **Stop condition: a pass that
    closes zero in-tree ids** — not "the preview is `[]`": an out-of-tree epic that is permanently
@@ -581,6 +624,81 @@ bounded infrastructure-outage stop (`ready-unavailable`/`plan-unavailable`/`disp
 see "Null dispatch policy") — **not** by token budget: there is no budget-based pause. Which one happened is returned
 as `stopReason`, so a caller never has to infer it from the buckets.
 
+## Source-bound check records
+
+RESULT replies optionally carry `evidence` and `requiredLiveChecks`. Keep these arrays in the
+existing implementer/fixer report and review artifact as well as the reply; the reports retain
+them durably. An evidence record is:
+
+```text
+{"sourceTree":"d84541aed84541aed84541aed84541aed84541ae","command":"node smoke.mjs","configuration":"target=staging","outcome":"pass","location":"evidence/smoke.log","kind":"live"}
+```
+
+The hash above is illustrative. `sourceTree` is the full tested Git tree hash (40 or 64 lowercase
+hex characters), captured with `HEAD^{tree}` for clean committed source or `git write-tree` using
+a temporary index containing the tested changes/inputs. `configuration` is a concrete string
+(`default` when none); `location` points to retained check output. `kind` is
+`live|simulated|fallback`; `outcome` is independently `pass|fail|unavailable`. Failed execution
+and an unavailable check retain different outcomes. Legacy replies can omit the arrays; an
+explicitly required check without evidence stays outstanding.
+
+The reviewer selects required live-check identities against acceptance and returns them as
+`requiredLiveChecks: [{sourceTree, command, configuration}]`. The coordinator returns additive
+`checkEvidence: {records, gaps, requiredLiveChecks}` alongside its existing delivery buckets.
+Each record retains task `id` and producer `dispatch`. Each required check retains those fields,
+an `outcome`, and `matches` (indices into `records`). Matching requires the same task, exact tree,
+command and configuration, and kind `live`. Its outcome is `pass` if matching live/pass evidence
+exists, otherwise `fail` if matching live/fail exists, otherwise `unavailable`. Every matched
+record remains visible, including conflicting outcomes; this classification establishes evidence
+availability, while semantic coverage and acceptance remain the reviewer's/caller's decisions.
+Malformed arrays/records produce `gaps` with producer and field references. Omitted optional
+arrays produce no invented facts. For implementation tasks, check records do not change routing
+or replace delivered changes. Verification-only completion below consumes the same records
+after independent acceptance review; neither path replaces run acceptance.
+
+The ordinary coordinator uses the same validator/classifier through
+`dispatch-text --ledger <ledger> check-evidence --results-file <replies.json>`, where the JSON
+array contains `{dispatch, result}` replies. It writes `dispatch/check-evidence.json` by default
+(`--out` or `--stdout` also work). Keep that classification with the task/report evidence; its
+result shape equals Workflow's `checkEvidence`.
+
+## Run-failure attribution
+
+Optional RESULT `failureAttribution` associations refer to the existing source-bound `evidence`
+array, not a second evidence format. Entries carry `failure`, `command`, `configuration`, optional
+`introducedBy`, and zero-based evidence indices `observed`, `runBaseline`, `taskBase`,
+`verification`. Each index belongs to that same reply. Reviewers establish source chronology and
+check relevance against the captured source/fix history; the runtime checks exact command and
+configuration, source identity shape, kind and outcome. It does not invent a run-start measurement
+from a sweep summary, task status or absence of previous failures.
+
+For example, evidence indices 0/1/2 can hold run-start live/pass, task A live/fail and B-base
+live/fail for `node smoke.mjs --case F`, `target=staging`. An association
+`{"failure":"F","command":"node smoke.mjs --case F","configuration":"target=staging","runBaseline":0,"observed":1,"taskBase":2,"introducedBy":"bd-A"}`
+retains A as the run owner independently of the reviewing task's base exoneration. A baseline
+live/fail instead classifies `pre-run`; missing/unavailable/non-live or unassociated baseline
+produces a gap. Same display text with a different command or configuration stays separate.
+
+Workflow appends an existing `Recovery` record of kind `deferred`, id
+`run-failure:<JSON [failure,command,configuration]>`. Its `data.runFailure` holds those identity
+fields and `history`, an array of `{task,dispatch,claim,evidence}` events. `evidence` uses exactly
+the source-bound records above; `claim` is the association unchanged. The Recovery `evidence`
+list points to measurement outputs, or the dispatch when no usable measurement exists. Updates
+retain every previous event. `runFailures` returns the reduced classification, introducing
+`owner`, `state` (`open` or `verified`), `taskExonerations`, comparisons and gaps with the same
+record id/evidence references. Existing Recovery digest bounds and explicit oversized/malformed
+gaps still apply. No new Recovery kind, task route, run-acceptance gate or finding lifecycle is added.
+
+A later task's live/fail base comparison does not release an owner. Neither does a clean retry,
+FIXED status, missing baseline, bucket replacement or a passing unrelated check. Only an explicit
+`verification` association to live/pass source evidence resolves the recorded obligation; the
+introducing owner/history remains available. A later failing observation reopens it. Conflicting
+pre-run or owner claims preserve the known owner and record a reconciliation gap. Unknown
+correspondence remains a gap rather than a fabricated attribution. Callers retain these run facts
+across invocations independently of task completion; pre-run failures are not automatically new
+repair work. Ordinary subagents follow the same associations and Recovery contract in
+`coordinator-subagents.md`; deterministic replay is simulated mechanics, not fresh-agent proof.
+
 ## Workspace and ledger
 
 This skill's `scripts/sdd-workspace` and the durable ledger it anchors exist to provide one
@@ -596,13 +714,79 @@ is most of a long ledger. A verbatim echo of a ~90 KB ledger was refused by mode
 every launch once the epic grew; the digest of the same ledger is ~12 KB, and the coordinator's
 parsers read it exactly as they read the raw file. Its first line, `# ledger-digest: <kept> of
 <total> lines`, lets the coordinator tell an empty ledger from a lost or truncated echo: text
-without that header, or with fewer lines than it counts, is an unavailable read (retried once),
-never content — an empty echo once seeded 1 of 29 completions on Resume. The digest also keeps
-each minor's `[class]` tag and each blocker's `[cause: …]`, from which Resume re-seeds the
-recurrence counts. The Resume read also echoes `scripts/already-merged --landed`: the
+without that header, with a kept count greater than total, or with a different number of echoed
+lines is an unavailable read (retried once), never content — an empty echo once seeded 1 of 29 completions on Resume. Missing and unreadable
+files print `# ledger-status: missing|unreadable`; an existing empty file prints
+`# ledger-digest: 0 of 0 lines`. Empty stdout has no established source status. Missing/empty
+source after confirmed appends is unavailable evidence. A failed Git landing lookup has its
+own `landedError`, independent from ledger transport and captured review commits. The digest also keeps
+each minor's raw `[class]` tag, `[recurrence-id: v1-<bytes>-<hash>-<hash>]` and
+`[source-line: N]` pointer into this ledger, plus each blocker's `[cause: …]` and source-line
+pointer, from which Resume re-seeds recurrence. The fingerprint retains exact-text distinctions without transporting prose;
+the task ID and ledger line retain provenance. These suffixes are transport metadata, not class tags
+or Task status. Original ledger/report text remains authoritative. The Resume read also echoes
+`scripts/already-merged --landed`: the
 `task-<id>` merges git holds on the integration branch, so a landing whose ledger lines were lost
 (an outage during its append) is still known (see "Resume behavior").
 
+The ledger also carries additive `Recovery: <JSON>` lines. These compact records contain
+`{version:1,id,kind,operation,reason,evidence,data}`: `kind` is `hold`, `pending-closure`,
+`deferred`, or `fix`; `operation` is `record` or `clear`. An obligation is identified by
+`(kind,id)`; a clear names that same pair. Fix records are append-only, including a FIXED
+attempt before a later clean retry. `reason` is a short routing description, `evidence` is a
+nonempty array of source/artifact references, and `data` holds known facts only. Keep report
+bodies and finding prose in their source artifacts. Unknown versions or malformed records
+remain actionable as explicit record gaps. Recovery lines up to 4096 characters pass through
+verbatim; larger lines become `Recovery gap: <original line number> <ledger path>`, preserving
+the complete source on disk. Decoded malformed/unknown compact records return the source path,
+digestLine and a preview of at most 200 characters; oversized gaps return source/line/reason.
+Neither path echoes a full evidence body into coordinator input.
+
+For example (the replay fixtures use these source names and SHA):
+
+```text
+Recovery: {"version":1,"id":"bd-101","kind":"pending-closure","operation":"record","reason":"tracker closure unconfirmed","evidence":["task-1-report.md","bead:bd-112","bead:bd-109"],"data":{"head":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","reviewBead":"bd-112","blockerBead":"bd-109"}}
+Recovery: {"version":1,"id":"bd-101","kind":"fix","operation":"record","reason":"review finding","evidence":["task-1-review.md","task-1-report.md"],"data":{"outcome":"FIXED","reviewPath":"task-1-review.md","head":"ffffffffffffffffffffffffffffffffffffffff"}}
+```
+
+Workflow emits these at existing merge-lane holds, unconfirmed/confirmed closures, caller-owned
+sweep deferral, and review/seam/check fix results. A pending closure includes the exact known
+landing `head`/`range` and related `reviewBead`/`blockerBead`; its clear cites observed tracker
+closure. Hold ID `merge-lane` identifies the integration lane; data includes the affected task,
+branch/worktree, and at most five dirty paths plus their total count. A deferred sweep uses ID
+`<epicId>:sweep:<runTag>` and data `owner:"caller"`, `runTag`, branch and the declared command
+when known. The caller owns clearing it with measurement evidence. Fix data carries outcome,
+phase (`review|seam|check`), known base/head and report/source references. A check fix cites the
+merge dispatch's errors and report; it has no invented review-file pointer. Omitted commit
+fields mean unreported, never an inferred SHA.
+
+Both paths append through the existing ledger writer and drain before reporting settled results.
+Elided append retries keep Recovery lines intact. Legacy `Task`, `Merge` and `Human action`
+lines retain their formats and reducers. The return field `recovery` separates current
+`obligations`, append-only `fixHistory`, and `gaps` (source/line reference, reason, bounded preview) from latest terminal task
+buckets. Recovery/acceptance/attribution/metrics consumers read that history independently;
+retaining these facts alone does not complete the root.
+
+Before resumed admission, reconcile each active `pending-closure` record once: verify its exact
+40-character `data.head` with `already-merged` and read authoritative status for the task plus
+its `reviewBead`/`blockerBead`. A valid landing seeds closure-only routing with its original
+head/range even after branch deletion. If all associated beads are observed closed, append the
+matching clear and completion without another repair; otherwise use the existing close-only
+path, which checks statuses again and closes only observed-open beads. Drain those records before
+calling recovery settled. Never implement, review or merge that valid landing again.
+
+A Git mismatch, denied/failed query, missing exact head or incomplete status is an explicit hold
+on the affected task and its consumers. Retain the original record/evidence plus the observation;
+do not infer closure from ready-set silence, a missing branch or a later clean Task line. Persist
+the reconciler's hold as `hold` ID `resume:<task>` with `data.taskId`; only successful fresh
+reconciliation clears that hold. Observe once per restart, with no added implementation retry.
+Other holds require their owner's matching clear: `merge-lane` holds all admission, task holds
+name their task via ID or `data.taskId`, and scoped holds/deferred obligations may also use
+`data.affectedIds`. Unrelated eligible work continues. Return `recovery-held` while these admission
+obligations remain. Unscoped caller sweep deferrals and `data.runFailure` diagnostics remain
+visible obligations, without automatic generic repair dispatch. Preserve additive record/data
+fields and append-only fix history through reconciliation and later retries.
+
 - **Workspace, one per epic:** I7 fix — every epic's plan file used to be named literally
   `plan.md`, so `scripts/sdd-workspace`'s basename-derived directory
   (`.superpowers/sdd/plan/`) was the *same path for every epic in the repo*: every epic's ledger
@@ -684,7 +868,7 @@ recurrence counts. The Resume read also echoes `scripts/already-merged --landed`
   stage — "The coordinator loop" step 1) (a bead can
   accumulate more than one line over a run's history, e.g. a `pending retry` line followed later by
   `complete` or `BLOCKED`). **Stated plainly:** after the
-  relaxation described below, resume's only dispatch-gating, behavior-affecting reconstruction is
+  relaxation described below, the legacy Task reducer's dispatch-gating reconstruction is
   `pendingRetry` (it seeds C-2's one-bounded-retry check). A `complete` line (with or without
   `parked`) is recorded into `completed`/`parked` for **reporting and the no-progress guard's
   baseline only** — it does not, by itself, remove the id from what gets dispatched: `bd ready` is
@@ -966,7 +1150,7 @@ blocker filing, commit last). Two conventions the coordinator owns:
   A setup that re-enters an existing stacked branch finds that base again from the newest
   first-parent `stack: ` commit.
 - **Commit is the implementer's last step:** the implementer reports `head` (`git rev-parse HEAD`
-  after its commit, with `git status --short` empty); a `head` equal to the `base` it reports means
+  after its commit, with `git status --short` empty); for default implementation completion, a `head` equal to the `base` it reports means
   nothing was committed, and the coordinator sends one bounded commit nudge before treating the
   task as BLOCKED with a finding that names the cause.
 - **An unstacked implementer rebases before reporting:** after committing, it runs
@@ -985,6 +1169,43 @@ An implementer that cannot proceed within its own dispatch (a missing dependency
 contradiction) files the blocker bead itself and reports BLOCKED with its id; the coordinator's
 missing-bead fallback files one if it didn't.
 
+## Verification-only task completion
+
+`IMPLEMENTED` may declare `completionKind: "verification-only"` only when the current task
+acceptance permits no-change verification. It carries equal full `base`/`head` commit hashes,
+`files: []`, `sourceTree`, and the existing `evidence`/`requiredLiveChecks` records. The default
+completion kind is `implementation`; its commit nudge, nonempty review package and delivered
+change requirements remain in force.
+
+Select the evidence-review branch before calling `review-package`. The reviewer resolves the
+captured commits and tree, confirms a clean source and verification-only acceptance against
+the bead/comments/brief, and reads retained measurements without rerunning tests. CLEAN carries
+`completionKind: "verification-only"`, the same `base`, `head`, `sourceTree`, and original
+reviewed evidence records. Coverage, including required live kind, is an independent review
+judgment. Missing/stale/failed/unavailable checks or an absent/rejected/INVALID review cannot
+complete the task. A verification rejection never takes an unreviewed fix-to-merge shortcut.
+
+The coordinator validates matching captured identity and passing records, including every
+required live check from both producers. On acceptance, it records the basis in the existing
+`Recovery: … pending-closure` data as `verification` (source, unchanged range, check records,
+report/review paths and `reviewStatus: "CLEAN"`). This is separate from Git landings. The coordinator awaits `appended: true` before tracker
+closure; an unavailable durable write withholds closure. It uses
+existing close-only/status confirmation and cleanup machinery with a verification closure
+prompt: tracker status first, then the captured commit/tree check; no merge or artificial commit.
+Preserve cleanup output and unavailable status as facts. Closure remains unconfirmed until the
+tracker confirms every required bead closed. Resume reconstructs the verification basis from
+Recovery before Task completion lines; an unconfirmed task retries closure only. A confirmed
+completion writes `Task <N> (<id>): complete (verification-only, reviewed acceptance evidence;
+no Git landing)`. Digest reduction keeps `complete, verification-only`; the Recovery basis
+preserves its identity and evidence when other Task text is reduced. The existing 4096-byte
+Recovery bound and gap source pointers remain unchanged. A typed completion without its valid
+basis remains an evidence gap, and a ready reentry obtains independent review before closure.
+
+`verificationCompletions` returns those durable bases, including ones awaiting tracker closure;
+`completed` contains only confirmed closures. Count verification completions separately in the
+completion metrics and exclude them from task-landings accounting. They do not supply root or
+run acceptance, which remains the caller's independent obligation.
+
 ## Review and fix pass
 
 Each task gets **one** review and **at most one** fix pass; there is no re-review and no round
@@ -1072,17 +1293,20 @@ independent by definition):
 5. On a passing check (or none), commit the merge into the integration branch, then `bd close <id>`
    (a leaf-task close; epic closure is the separate fixpoint step in "The coordinator loop") and,
    for a split task, `bd close <review bead>` after it — first stopping the task's processes with
-   `scripts/stop-run-processes <task worktree>`, so nothing a task started outlives its close. Then,
+   `scripts/stop-run-processes <task worktree> <task temp root>` and recording its outcomes. Then,
    still in the same dispatch, the merge agent removes the finished task's worktree with
-   `scripts/remove-task-worktree`: it stops every process belonging to the worktree (cwd,
-   executable, arguments or HOME/TMPDIR under it, and their children — test daemons, private
-   servers with temp homes, a `tail -f`), then runs `git worktree remove`
-   and `git branch -d`, never `--force` or `-D`, and keeps anything uncommitted or unmerged (exit
-   3). A split task passes `--keep-branch`: a dependent being cut at that moment may still merge its
+   `scripts/remove-task-worktree --tmp <task temp root>`: it verifies all resources' process cleanup
+   before `git worktree remove` and `git branch -d`. Matching stays limited to cwd, executable,
+   exact HOME/TMPDIR and orphan argument paths, with no kinship expansion. Exit 0 means verified
+   completion; exit 3 means a survivor or deliberate retention (also dirty/unmerged guards);
+   exit 4 means inspection or termination is unverified. On 3 or 4, worktree/temp resources remain
+   and their paths appear in `kept:` lines. Code landing and tracker closure remain independent
+   of cleanup completion. Normal removal never uses `--force` or `-D`. A split task passes `--keep-branch`: a dependent being cut at that moment may still merge its
    branch by name, so only the worktree goes now and the Finish sweep deletes the branch. The outcome
    lines go on a `Cleanup: <id> — …` ledger line, which the Resume and Metrics parsers skip. An
    already-merged re-entry close runs the same script, and a cancelled task's discard runs it with
-   `--discard` (force, because that work is abandoned by design).
+   `--discard` (force for abandoned work, after the same process verification; exits 3/4 still
+   retain resources).
 6. Held, not blocked: a dirty integration worktree, or one not on its branch, is a run-wide
    condition, so the first merge that reports it (`dirty` / `detachedHead`) holds the merge lane:
    no blocker bead, no triage, a `Merge: … → held: <cause>` ledger line, no further merge or new
@@ -1228,14 +1452,21 @@ never as findings and never as done.
 ## Finish
 
 After the final review and the bucket reconciliation, one mechanical `worktree-sweep` dispatch
-runs `scripts/remove-task-worktree --sweep` over every task worktree still under the integration
-worktree's `.worktrees/` (the backstop for anything the per-task cleanup missed), plus `git branch -d`
-on split tasks' kept branches. It keeps anything uncommitted or unmerged, never forces, and its
-`kept:` lines are returned as `worktreesKept`. The same dispatch then runs the final process
-sweep, `scripts/stop-run-processes` over the task-worktree root, the run temp root and any
-`processRoots`, appends a `Process sweep: <N> stopped · <M> survived` ledger line, and its lines
-are returned as `processSweep` (`stopped`, `survived`). It runs whoever owns the finish, because
-task worktrees and the processes started in them are this skill's, not the caller's.
+runs `scripts/remove-task-worktree --sweep --tmp <run temp root>` over remaining task worktrees
+and split tasks' branches. It verifies owned processes before removing any resources; surviving,
+unverified or deliberately kept processes retain the worktree/temp paths they may need, including
+on `--discard` and `--sweep`. Dirty/unmerged guards still apply. Resource `kept:` lines become
+`worktreesKept`, including temp roots and their reasons.
+
+The same dispatch runs `scripts/stop-run-processes` over the task-worktree root, run temp roots and
+caller `processRoots`. Exit 0 means verified completion; 3 means survivors or intentional retention;
+4 means failed inspection/termination. Both steps' facts populate `processSweep` arrays `stopped`,
+`survived`, `unknown` and `kept` (interactive processes). The ledger line is
+`Process sweep: <N> stopped · <M> survived · <U> unknown · <K> kept`, followed by outstanding facts.
+An unavailable dispatch or `scriptError` yields unknown inspection and names unchecked resource
+roots; missing `processLines` also yields unknown. These cleanup obligations accompany completed
+code buckets and flow to run-state/reporting. This sweep runs whoever owns Finish because the
+owned task worktrees and their processes belong to this skill.
 
 When the loop ends (and at least some work landed), run the sweep (below), then the **final
 whole-epic review (opus)** against the integration branch, whose shape depends on size (next
@@ -1254,20 +1485,26 @@ review reports Minor and ⚠️ items in `RESULT.minors`, and the merge gate wri
 `Task <N> (<id>): minor (deferred): <one-liner>` line per item, in the task's one ledger flush. They
 are written at the merge gate, alongside `parked`, because a minor on a task that never merges is
 part of a blocked task's open state, which the blocker path already carries.
-**Recurring minors are clustered, run-wide** (issue #3 defect 2): the coordinator normalises each
-minor's text (numbers, hashes, paths, quoting stripped) into a signature and counts it across
-tasks; a signature seen ≥5 times or on ≥3 distinct tasks is reported once — a `Recurring minor:
-×N across M task(s) — <sample>` ledger line and a `RECURRING MINOR` log line — and the Finish
-reviewer is told to triage those lines *first* and name the class. Measured: 1,335 individually
-correct deferrals on one run hid a single line recurring ~40 times — the pipeline reporting its
-own empty-review-package defect once per merge, never heard — and ~30 unfalsifiable-assertion
-findings that nobody owned as a class; per-epic triage would not have surfaced either, since the
-distribution was even across nine sub-epics. The key is the reviewer's `[class]` tag on each minor
-(two to four task-independent words, `./task-reviewer-prompt.md`), else the normalised text:
-free-text matching never clustered one class worded five ways ("full suite not run",
-"whole-suite tests not run", …) on a run where it hit seven tasks. The counts survive relaunches:
-minors and pending-retry/BLOCKED lines carry their tag on the ledger, and Resume seeds the clusters
-from them.
+**Recurring minors are clustered, run-wide** (issue #3 defect 2): a signature seen ≥5 times or
+on ≥3 distinct tasks is reported once as a `Recurring minor: ×N across M task(s)` ledger line
+and a `RECURRING MINOR` log line. The small process vocabulary is an exact lookup on `[class]`:
+
+| Process class | Accepted tags |
+| --- | --- |
+| `cleanup-inspection` | `cleanup-inspection`, `cleanup-inspection-denied`, `process-inspection-refused` |
+| `missing-evidence` | `missing-evidence`, `evidence-missing`, `test-evidence-missing` |
+| `suite-not-run` | `suite-not-run` (existing class) |
+
+The first class denotes denied inspection of owned-process liveness; `cleanup-denied` is ambiguous
+and stays distinct, as do survived processes and termination failures. Missing evidence denotes
+absent evidence, independently of a failed live measurement. Unknown tags and untagged findings
+use an exact-text fingerprint, preserving numeric/path distinctions between product bugs and
+assertions. The existing untagged `review-package resolved HEAD in <path> (<N> bytes)` process
+message retains its bounded legacy normalization. Tags are compared without case; original tag
+spelling and ledger/report evidence stay intact. Grouped lines add `[process-class: <canonical>]`;
+this is a grouping fact, not a finding ID. Counts support reassessment: identity, severity,
+disposition and fix scope remain separate judgments. Resume resolves the same aliases from raw
+tags and retains unknown exact-text identities through the compact fingerprint.
 **Blocker entries feed the same detector** (issue #5 defect 7): every triaged blocker — RESOLVE or
 ESCALATE — is counted under the triage agent's `cause` (a short root-cause phrase the TRIAGE schema
 now carries; `detail` is the fallback), in its own `blocker:` namespace with the same threshold,
@@ -1276,9 +1513,20 @@ one run (the implementer looking the report up under the bead id instead of the
 finished work left uncommitted) were each RESOLVEd correctly and never counted, because the
 detector only saw review minors.
 
+**Captured review source.** The existing `read-ledger:finish` dispatch also captures `reviewHead`
+with `git rev-parse --verify <integration branch>^{commit}` and `reviewBase` as its verified
+merge-base with the default branch commit. The pair is returned alongside the ledger text;
+`reviewError` records a capture failure independently. Assembly and all final reviewers receive
+the same pair, including direct-input fallbacks when assembly fails. Failed or missing capture
+leaves final review unavailable. This adds no dispatch. Task review carries the implementer's
+captured head; seam/check-fix reviews carry the merge/fixer head. Source reads use `git show
+<head>:<path>`; filesystem views use unique review-owned detached worktrees, with separate mutable
+output/temp directories. Observed caller commit/status differences carry evidence without
+assigning cause from differences alone or restoring the caller checkout.
+
 **The final review is size-switched.** After the Metrics re-read and before its append, one
 mechanical `assemble:final` dispatch (`assemblePrompt('final-review', 'final', …)`) gathers the review
-inputs into `<workspace>/assembled/final-review-<runTag>-final/` and measures them. The window is
+inputs into `<workspace>/assembled/final-review-<invocationId>-final/` and measures them. The window is
 `config.contextWindows.finalReview`, else `FINAL_REVIEW_FALLBACK_WINDOW.workflow` (200K, defined once
 beside `MODEL_DEFAULTS` in `coordinator.js`; the ordinary-subagent coordinator uses its `ordinary`
 entry, 258K); the threshold is 40% of it. The mode follows the assembler's reply:
@@ -1294,11 +1542,11 @@ entry, 258K); the threshold is 40% of it. The mode follows the assembler's reply
 The `Final review:` line is appended in the same dispatch as the four `Metrics:` lines. Clusters come
 from the assembler's `clusters.json` (import and call edges, else directory), never from a declared
 key. A cluster still `cluster-fits: no` after the assembler's one re-cluster is not dispatched and is
-listed `unreviewed`. Cluster reviewers write `<workspace>/final-review-<runTag>-cluster-<n>.md`; the
+listed `unreviewed`. Cluster reviewers write `<workspace>/final-review-<invocationId>.cluster-<n>.md`; the
 seam reviewer, given only those files and the cross-cluster hunks and interfaces, writes the handoff
-file. **`<workspace>/final-review-<runTag>.md` exists whenever `reviewPath` is non-null**: the single or seam
+file. **`<workspace>/final-review-<invocationId>.md` exists whenever `reviewPath` is non-null**: the single or seam
 reviewer writes it, and on a null seam review a mechanical `final-review:stub` dispatch writes a stub
-that lists the cluster files; only a null stub leaves it absent, and `reviewPath` is then null. The
+that lists the cluster files; a null stub or a reply without `written: true` leaves `reviewPath` null. The
 Workflow returns `review` (the verdict line) and `reviewPath` (that file, or null when no file was
 written) and never a body; callers read the file through `report-verdict`. Anything unreviewed — a null
 cluster or seam review, an over-window cluster — makes `review` `not ready (<summary>; unreviewed: …)`,
@@ -1316,39 +1564,36 @@ the landed subset:** an escalated or pending-retry leaf's code is not in the tip
 names those ids as `not in this measurement` — a green sweep is evidence for what merged, never for
 the epic.
 
-**Metrics: a run-wide tally, written right before the final review, unconditionally.** One
-mechanical dispatch re-reads the ledger fresh (this run's own appends since Resume's one-time read
-are not in that variable); the script computes four lines from it and one `ledgerAppendPrompt`
-dispatch appends them, in this order:
-
-```
-Metrics: merges M · merge-failed Mf · rebase-conflicts C · seam-reviews S (fixed F) · check-fails G (fixed H)
-Metrics: completions — review clean A · after fix pass B · parked P · re-entry closes R · dispatched early E · cancelled K
-Metrics: fix-pass — entered E · FIXED X · BLOCKED Y
-Metrics: ledger-check <ok | landed≠completed: L vs N — <likeliest cause> | METRICS INVALID — …> · append-failed K · append-retried J
-```
-
-Stub keys: `read-ledger:finish` and `ledger-append:metrics`. It runs even on a run that merged
-nothing. A null re-read (after its one retry) writes `Metrics: UNAVAILABLE …` lines instead of
-zero counts, each carrying this invocation's own buckets, labelled `this invocation only`.
-
-- `M` counts success-path `Merge:` lines (no trailing marker); `Mf` counts the ` → blocker` and
-  ` → auth-refused` lines. `C`, `S`, `F` come from `Merge:` lines on both paths; `G` counts lines whose check failed
-  at least once (`fail` and `fail→fixed`), `H` the `fail→fixed` ones.
-- `A`/`B`/`P`/`R` count `complete` lines by variant: `review clean`, `fix pass` (parked included),
-  `parked`, `already merged`. `E` counts `stacked on` lines (tasks dispatched on an unmerged
-  parent), `K` counts `cancelled` lines (stacked attempts stopped because a parent did not merge).
-- `E`/`X`/`Y` count `fix pass` lines, all of them (a retried task's second fix pass is a real
-  dispatch).
-- `ledger-check` cross-checks the ids the ledger shows landed — success-path `Merge:` lines plus
-  re-entry closes, which land without a `Merge:` line — against the in-memory `completed.size`,
-  rather than treating the lossy ledger as authoritative. A mismatch names its likeliest cause: a
-  failed append, a completion settled without its line, an incomplete Resume read (the ledger shows
-  more), or — no landing lines at all while tasks completed — a failed reader, written `METRICS
-  INVALID` because every count on the block is then wrong. Before this split, every legitimate
-  re-entry close read as a mismatch.
-
-The return carries `metrics`, the same four strings. The `Final review:` line (above) rides in the same append.
+**Metrics: observed counts after Finish reconciliation, before the final review.** Finish first
+reconciles unsettled tracker closures and drains their ledger writes, then `read-ledger:finish`
+echoes `ledger-digest` and `already-merged --landed`. The four existing `Metrics:` lines retain
+their prefixes and order: merges, completions, fix-pass, ledger-check. The return also carries
+`metricsEvidence`: ledger transport status, observed Git IDs, completed IDs, durable fix history,
+concrete identity discrepancies and evidence gaps.
+
+- Merges counts unique task IDs with successful `Merge:` lines. Other merge fields describe
+  observed event lines. `baseAbsorbed` contributes zero task landings.
+- Completions classifies the latest retained terminal/unfinished state per task. Stacked counts
+  unique task IDs; cancelled counts latest cancelled states. Earlier durable `Recovery:` fixes
+  remain separate history even after a clean retry. Legacy `fix pass` event lines are labelled as
+  such; exact duplicate durable records count once. FIXED task results establish no repaired
+  finding count by themselves.
+- Ledger-check compares actual ID sets, reporting `ledger-only`, `completed-only`, `git-only`
+  and `ledger-only-git` before interpretation. Equal cardinalities can still disagree. A failed
+  Git lookup or tracker reconciliation is an independent gap; supported ledger counts survive.
+- An unavailable ledger produces four `Metrics: UNAVAILABLE` lines with known in-memory buckets
+  labelled `this invocation only`, plus a run-total gap. Available counts have their observed
+  source scope and gaps on ledger-check. A missing source has no established zero total.
+
+For finding counts use the JSON `metrics` from `scope-dispositions --project <run.md>` (§run-state
+finding continuity): raw occurrences, actionable groups, supported repaired/rejected, outstanding,
+deferred, source kinds and gaps. Exit 3 retains supported partial results. Missing source
+populations (for example task reviews when only roast/final reviews were retained) stay explicit.
+These findings and durable fix attempts are separate units; neither is inferred from the latest
+invocation verdict. Workflow/ordinary execution selection metadata contributes zero friction
+events. Profile production and its invocation/residual labels retain their existing owner.
+
+The `Final review:` line rides in the same single `ledger-append:metrics` dispatch.
 
 **Friction capture is the invoking session's job, not the Workflow script's.** The Workflow script
 itself cannot write files — it has no I/O (see "Key constraint: the script does no I/O") — so it
@@ -1371,17 +1616,21 @@ up as context fills. Friction entries already written to the log survive compact
 
 **The run profile is the invoking session's job too.** The script has no clock and the ledger no
 timestamps, so per-bead timing is measured after the fact from the Workflow runtime's own run
-files. When the Workflow returns with a `stopReason` (not a budget-cap or first-outage return you
+files. The invoking session generates one profile after each settled invocation, including a
+qualified or unavailable result; `coordinator.js` and Finish do not generate it. When the Workflow
+returns with a `stopReason` (not a budget-cap or first-outage return you
 relaunch), run `bash <this skill's dir>/scripts/run-profile --workflow <dir> … --out
 <workspace>/profile-<runId>` with one `--workflow` per run of this invocation, relaunches included
 (each launch result prints its `Transcript dir:`; after a compaction, `--discover --epic <epicId>
---latest` finds them), and append its stdout to the ledger. Those `Profile:` lines give the bead
-graph's shape, the realized critical path and its bottleneck bead with what its time went to, each
-bead's ready-to-start wait and cause, the merge lane's load and conflict files, and modelled
-what-ifs. It dispatches nothing. Append its whole stdout on every exit path: where the harness keeps no
+--latest` finds them), and append its whole stdout once to the ledger for that invocation. Those
+`Profile:` lines describe the observed invocation/residual graph, evidenced waits, planning-aware
+diagnosis, task bottlenecks, separate all-agent/task-slot concurrency and counterfactual estimates.
+It dispatches nothing. Include every exit path: where the harness keeps no
 such files it exits 3 with `Profile: unavailable — …` as its last line, after the
 `Profile: context` lines it could still measure, and those lines belong in the ledger too. Run
-it before the hand-off removes the integration worktree.
+it before the hand-off removes the integration worktree. `--out` writes the md/json pair beside the
+ledger, including a qualified unavailable pair on exit 3. Under super-auto, collection copies this
+invocation's existing pair into the committed run directory; it does not regenerate or append it again.
 
 **The run marker is the invoking session's too.** After the Workflow returns with a `stopReason` (not
 a relaunch), run `bash <skills>/super-code/scripts/run-marker get <session id> --cwd <integration
@@ -1900,7 +2149,7 @@ exercised by the replay harness's live-sim scenarios.
 | `triage:bd-103` / `triage:bd-104` | ESCALATE / RESOLVE (reused) | bd-104's second visit is bounced from RESOLVE into ESCALATE |
 | `notify:bd-103` / `notify:bd-104` / `clarify:bd-104` / `ledger:bd-104` | fixed | notify on ESCALATE; clarification on RESOLVE; bd-104 flushes once per chain — `pending retry`, then `BLOCKED` |
 | `sweep` / `ledger-append:sweep` | `{summary:"f00dbee — 12 passed, …"}` / `{appended:true}` | the mandatory full-suite sweep at Finish (work landed); the summary names bd-103/bd-104 as not in the measurement |
-| `read-ledger:finish` / `ledger-append:metrics` | `{text:""}` / `{appended:true}` | the Metrics re-read and the one dispatch appending all four lines |
+| `read-ledger:finish` / `ledger-append:metrics` | `{text:"",reviewBase,reviewHead}` / `{appended:true}` | the Metrics re-read and source capture and the one dispatch appending all four lines |
 | `reconcile-buckets` | `{closed:[]}` | Finish reconciliation of escalated ids (and any landed id whose closure is unconfirmed) against the tracker |
 | `worktree-sweep` | `{lines:[]}` | the Finish task-worktree backstop (always dispatched) |
 | `assemble:final` | `{dir:"…",exit:0,fits:"fits: yes (1200 of 80000)",clusterFits:[],clusters:0}` | the final review's assembler pre-step: fits, so a single review. The split-mode keys (`final-review:cluster:<n>`, `final-review:seam`, `final-review:stub`) are exercised by the replay harness's live-sim scenarios only |
@@ -2023,8 +2272,11 @@ it even by coincidence. The figures were real and unaltered — and still not ev
 run never executed. That is the failure the rule generalizes.
 
 **Schema-less dispatches — the harness's "N empty results" is expected, not a defect.** `notify`,
-`clarify` and the ledger appends (`ledger:<id>`, `ledger-append:*`, `ledger-recurring:*`) carry no
-`schema:`; the coordinator reads them only for null. The final-review dispatches carry `FINAL_VERDICT`
+`clarify` and ledger appends other than Launch (`ledger:<id>`, `ledger-append:*`,
+`ledger-recurring:*`) carry no `schema:`; their replies are read only for null. The Launch append
+carries an `{appended: boolean}` schema and requires `appended: true` before review artifacts.
+The final stub requires `written: true`.
+The final-review dispatches carry `FINAL_VERDICT`
 (`{verdict, path}`; `review` is the verdict line), the stub `STUB_WRITTEN`, the assembler `ASSEMBLED`. `sweep` carries `SWEEP_SUMMARY`, and its line must match a
 measurement form (counts, `PASS|FAIL` for a non-test command, or `MEASUREMENT INVALID:`) or it is
 recorded as `SWEEP UNAVAILABLE` — an agent's interim status once reached the final reviewer as the
@@ -2050,6 +2302,7 @@ To reproduce or re-verify after a structural edit, run the Workflow tool with th
 ```json
 {
   "epicId": "bd-100",
+  "invocationId": "bd-100",
   "integrationBranch": "epic-bd-100-integration",
   "skillsRoot": "/abs/superpowers/skills",
   "dryRun": true,
@@ -2059,7 +2312,7 @@ To reproduce or re-verify after a structural edit, run the Workflow tool with th
   },
   "prompts": {
     "stubs": {
-      "read-ledger": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
+      "read-ledger": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"# ledger-status: missing\"}",
       "ledger-append:launch": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
       "ledger-append:detector": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
       "close-epics": [
@@ -2101,7 +2354,7 @@ To reproduce or re-verify after a structural edit, run the Workflow tool with th
       "clarify:bd-104": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"recorded\":true}",
       "ledger:bd-104": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
       "worktree-sweep": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"lines\":[]}",
-      "read-ledger:finish": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
+      "read-ledger:finish": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"reviewBase\":\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"reviewHead\":\"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\",\"text\":\"# ledger-digest: 0 of 1 lines\"}",
       "ledger-append:metrics": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
       "reconcile-buckets": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"closed\":[]}",
       "sweep": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"summary\":\"f00dbee \\u2014 12 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: <project test command>\"}",
@@ -2140,6 +2393,7 @@ replay harness at the current revision.
 ```json
 {
   "epicId": "bd-200",
+  "invocationId": "bd-200",
   "integrationBranch": "epic-bd-200-integration",
   "skillsRoot": "/abs/superpowers/skills",
   "dryRun": true,
@@ -2149,7 +2403,7 @@ replay harness at the current revision.
   },
   "prompts": {
     "stubs": {
-      "read-ledger": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
+      "read-ledger": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"# ledger-status: missing\"}",
       "ledger-append:launch": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
       "ledger-append:detector": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
       "close-epics": [
@@ -2171,7 +2425,7 @@ replay harness at the current revision.
       "triage:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"decision\":\"ESCALATE\",\"detail\":\"the caching strategy is a design decision the spec does not settle\"}",
       "notify:bd-201": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"sent\":true}",
       "worktree-sweep": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"lines\":[]}",
-      "read-ledger:finish": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
+      "read-ledger:finish": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"reviewBase\":\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"reviewHead\":\"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\",\"text\":\"# ledger-digest: 0 of 1 lines\"}",
       "ledger-append:metrics": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
       "reconcile-buckets": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"closed\":[]}"
     }
@@ -2208,6 +2462,7 @@ the current revision.
 ```json
 {
   "epicId": "bd-300",
+  "invocationId": "bd-300",
   "integrationBranch": "epic-bd-300-integration",
   "skillsRoot": "/abs/superpowers/skills",
   "dryRun": true,
@@ -2217,7 +2472,7 @@ the current revision.
   },
   "prompts": {
     "stubs": {
-      "read-ledger": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
+      "read-ledger": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"# ledger-status: missing\"}",
       "ledger-append:launch": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
       "ledger-append:detector": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
       "close-epics": [
@@ -2239,7 +2494,7 @@ the current revision.
       "close-check:bd-301": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"closed\":[\"bd-301\"]}",
       "merge:bd-301": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"id\":\"bd-301\",\"merged\":true,\"mergeExit\":0,\"mergeHead\":true,\"head\":\"f6f6f6f6666666666666666666666666666666\",\"mergeBase\":\"eeeeeee5555555555555555555555555555555\",\"rebaseConflictFiles\":0,\"ledgerAppended\":true}",
       "worktree-sweep": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"lines\":[]}",
-      "read-ledger:finish": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"text\":\"\"}",
+      "read-ledger:finish": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"reviewBase\":\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"reviewHead\":\"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\",\"text\":\"# ledger-digest: 0 of 1 lines\"}",
       "ledger-append:metrics": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"appended\":true}",
       "reconcile-buckets": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"closed\":[]}",
       "sweep": "You are a stub. Call no tools. Return exactly this JSON as your structured output: {\"summary\":\"f00dbee \\u2014 12 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: <project test command>\"}",
