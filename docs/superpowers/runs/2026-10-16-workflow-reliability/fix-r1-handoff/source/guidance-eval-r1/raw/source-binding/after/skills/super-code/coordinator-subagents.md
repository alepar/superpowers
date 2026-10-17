# Ordinary-subagent coordinator

Use this when the calling session has ordinary subagent spawn/wait tools and no `Workflow` tool
(Codex, or Claude Code with Workflow unavailable). The calling session drives the epic itself, a
manual ready-driven loop under the same contract as the Workflow coordinator:
`coordinator-workflow.md` is the spec for the per-task pipeline, gates, ledger line formats and
Finish. How you schedule and track the loop is your call. Do not emulate the script step by
step. The calling session stays the scheduler through Finish, because some harnesses do not let
a subagent spawn a reviewer.

Run the loop as SKILL.md's Parallelism section describes: keep up to `config.concurrency` task
chains in flight, within the hot-file cap, refill from `ready-in-tree` as chains end, and keep one
merge into the integration branch at a time. Write each agent's dispatch with
`bash <skillsRoot>/super-code/scripts/dispatch-text --ledger <ledger> <kind> …` (`--help` lists the
kinds). It writes the text `coordinator.js` would send to a file and prints the path, so spawn the
agent with "Read <path> and follow it exactly." The merge text leaves the ledger lines to you.

Carry the explicit launch parameter `rootAcceptance: "caller"` when the enclosing caller owns
acceptance (super-auto always does), and persist it in `Launch: args`. Its absence means the
existing standalone coordinator ownership. `deferSweep` alone never transfers root ownership.
In caller mode use `close-in-tree-epics EPIC --exclude-root` at every closure pass, including
round-head Close and refill's preliminary close (Ready and its rechecks are read-only). Carry that option into each
ordinary mechanical closure command. Close eligible inner epics to fixpoint while
keeping root closure with the caller; never run an unfiltered or fallback root close. The no-jq
manual procedure must preserve the same exclusion. Restore this parameter on every fix-loop or
interrupted re-entry. Empty ready work ends implementation normally (`ready-drained`) while the
root awaits required reviews, measurements or human gates; it neither stalls nor accepts the run.
Return the existing durable Recovery obligations, source-bound checkEvidence and runFailures
classification/state so the caller can reconcile acceptance independently of leaf completion.

For an `IMPLEMENTED` reply with `completionKind: "verification-only"`, equal captured base/head,
`files: []` and source-bound records, select the evidence-review path described in
`coordinator-workflow.md` before building a diff package. Keep its JSON reply in the existing
workspace and dispatch `review --id <id> --n <n> --base <sha> --head <same sha>
--result-file <implementer-result.json>`. The reviewer must independently confirm current task
acceptance permits no-change verification, the fixed tree and required check coverage. Null or
INVALID is no review; a rejected verdict does not complete or use an unreviewed fix shortcut.
Implementation replies retain their ordinary commit/diff requirements.

After independent CLEAN, compare both replies' identities and original evidence, including all
required live checks. Keep the accepted basis with `status: "CLEAN"`, `reviewStatus: "CLEAN"`,
`completionKind`, `base`, `head`, `files`, `sourceTree`, `evidence`, `requiredLiveChecks`,
`reportPath` and `reviewPath`. Persist it as existing pending-closure Recovery data `verification`
before closure; `verification-close --id <id> --result-file <basis.json>` produces the shared
closure prompt and validates the record shape. Confirm tracker closure of all required beads
before settling completed. Retain cleanup output and unconfirmed closure faithfully; resume an
accepted pending basis at closure, without repeating implementation/review. Write the
verification-only complete line and clear the pending closure record after confirmation.
There is no merge, commit nudge, early implementation split or new task landing. Count this
completion separately; root acceptance remains independent.

Keep the window full. The Workflow coordinator does these, and so do you:

- **Start dependents early** (unless `config.earlyUnblock` is false). When an implementer reports a
  commit and its task has open dependents in the tree (`scripts/tree-deps`), run
  `scripts/review-bead split <id>`. Its dependents become ready; dispatch each with
  `implement --parents <its unmerged in-tree blockers>`. The setup stacks them on those branches.
  A ready review bead (`ready-in-tree`'s `reviews`) re-enters its task at review
  (`implement --reentry`).
  - A stacked task merges only after all its parents have landed, with `merge --stacked --base
    <its reported base>`, so only its own commits are rebased. A split task's merge passes
    `--review-bead <its review bead>`, which the merge closes after the task bead.
  - A parent that ends without merging cancels its stacked dependents, and theirs in turn. Run
    `review-bead reopen <parent>`, stop each dependent's agent or ignore its late report, discard
    its worktree (`remove-task-worktree --discard`), and write a `cancelled (parent <id> …)` line.
    Do not dispatch a ready id whose in-tree blocker failed or awaits a retry this run.
  - `STACK_CONFLICT`: re-dispatch the task fresh once the parents it names have merged.
- **A task that already landed is closed, not failed.** An implementer's `ALREADY_MERGED` or a
  merge reply with `alreadyMerged true` goes to the close-only step (`coordinator-workflow.md`'s
  closure rules): bd first, then the git re-check. Nothing stacked on it is cancelled.
- **Merge what others wait on first.** Among tasks ready to merge, take the one with the most
  live tasks stacked on it or waiting for it; otherwise, the first ready. Triage of a failed merge
  runs beside the merge lane, never in it.
- **Plan the ready set first.** The first planner gets `plan --mode ready`. Dispatch those tasks,
  then run `plan --mode rest` beside them. Split a task only after the rest of the tree is mapped.
- **Add edges at once.** For a planner's `missingEdges` or a triage `waitFor`, run
  `bd dep add <dependent> <blocker>` yourself before the next refill, and write `Edge add:` or
  `waiting on <bead>`. A `waitFor` does not spend the task's retry.
- **Split oversized beads before dispatch.** For a planner's `oversized` entry, write the proposal
  (with the original's `filesTouched` and `filesToRead` from its mapping row) to
  `<workspace>/split-<id>.json` and run `bash <skillsRoot>/super-code/scripts/split-oversized <file>`
  yourself; route exit 0 / 3 / 5 exactly as coordinator-workflow.md Plan materialization says, writing
  the same `Split…` and `Surface:` ledger lines.
- **Do not idle.** Wait for whichever agent finishes first. Refill after every landing and
  every split. If a file holds back two tasks while a slot is free, raise its cap by one. Write a
  `Detector:` line at each refill, not only at Finish.
- **Admit after capacity.** Keep queued work as reservations. Once a slot is available, recheck
  integration holds, cancellation, quarantine/retries and effective dependencies before spawning
  its attempt, on every dispatch path including retries and review re-entry. Rejection releases
  the slot with an admission reason and no implementation/fix/merge outcome. Local implementation
  dependencies may use implementation-done; review, blocker, human-gate and out-of-tree dependencies
  require tracker closure. Observe each external dependency independently with `bd show <id> --json`:
  retain its ID, status and kind (review, blocker, gate, epic or task) for the mapping's blocks
  relationship. Failed/malformed reads hold only that dependency's consumers with the error.
  Refresh external/opaque readiness after capacity waits and at bounded waits while agents remain
  in flight (default 30 seconds, sharing the round's `topUpQueryCap`, default 40, with refill
  queries). A closed external review can release its consumer before another agent finishes.
  Serialize refreshes, stop them at quiescence and leave consumers needing a fresh observation held
  on budget exhaustion.

For recurring process observations, use the exact process-tag table in
`coordinator-workflow.md` §Finish: `cleanup-inspection` and its two inspection-denial aliases,
`missing-evidence` and its two absent-evidence aliases, and existing `suite-not-run`. Preserve each
raw finding, task ID and source reference. Read compact `[recurrence-id: …]` / `[source-line: N]`
metadata as identity/provenance transport, not as a class or Task status. Other tags retain exact
finding-text distinctions, including assertion values and paths. A recurrence count supports
reassessment; finding identity, disposition, severity and fix scope require separate judgments.

**One fresh agent per round.**

- Every fix pass, seam fix, check fix, re-review and re-assessment is a fresh agent; its only memory
  of the earlier round is the paths the dispatch hands it (dispatch-text's `fix` text names them).
- A steering message that adds work is a new round: spawn a fresh agent for it.
- Improvised dispatches (a history reader, an assess pass, a first gate, an absorb, and similar) state
  their input paths, one output file, scope and out-of-scope, a checklist, and "one fresh agent, one
  job". Split a large input across several such agents.
- History and assess passes read assembled inputs: run
  `dispatch-text assemble --consumer history|assess --instance <bead id>` first and point the pass at
  the digest it writes. When the assembler returns nothing or a non-zero exit, give the pass its
  direct inputs and append `assembler: unavailable — <cause>` to the ledger.

Collect optional `evidence` and `requiredLiveChecks` arrays from RESULT replies in the existing
task report/review. Use the complete source/check/kind/outcome records in
`coordinator-workflow.md` §Source-bound check records, preserving the tested tree and output
location. For deterministic classification, retain replies as a JSON array of `{dispatch, result}`
and run `dispatch-text --ledger <ledger> check-evidence --results-file <replies.json>`; retain its
JSON output with those artifacts. Its `records`, `gaps` and `requiredLiveChecks` equal Workflow's
`checkEvidence`, including exact tree/command/configuration matching and distinct failed versus
unavailable outcomes. Only matching live/pass evidence supplies an explicitly required live
check. The reviewer judges semantic coverage; delivery buckets and caller acceptance stay
separate. Old producers may omit the arrays; required checks without evidence stay outstanding.

For run regressions, collect optional `failureAttribution` associations in the same replies and
reports. Use `coordinator-workflow.md` §Run-failure attribution for the exact record shape and
A/B example. Indices reference that reply's existing evidence array. Read relevant source/fix
history before accepting the association; equal failure display text alone is insufficient.
Append the same `Recovery` kind `deferred` record with `data.runFailure` and the complete event
history, retaining earlier introducing ownership and all source-bound arrays. Compare exact
command/configuration and live outcomes; absent/unavailable baseline or uncertain correspondence
stays an attribution gap. Keep task-base exonerations separate. A run-start live/fail is `pre-run`
and does not automatically create repair work; run-start live/pass plus a source-supported
introducing task establishes a run owner. Preserve known ownership on missing/conflicting
measurements. Only linked live/pass fix verification marks the obligation verified; CLEAN/FIXED
status and later empty buckets do not. Retain verified history; a later linked failing observation
reopens the obligation. Return `runFailures` with the same id/owner/classification/state,
comparisons, taskExonerations, gaps and evidence references as Workflow. On re-entry reconstruct
from these Recovery records independently of Task status, preserving malformed/oversized gaps.
This adds no retry round or caller acceptance gate.

Three things keep the run measurable and resumable:

- **Launch line.** Before the Launch line, run the same identity steps as `coordinator-workflow.md`
  §Pre-flight (step 2's run-identity bullets): the `Context:` line, the runTag, and the marker guard.
  Mint `invocationId` as `inv-$(uuidgen)` for each new invocation; retain it across an explicit
  unsettled resume only. A settled return (including blocked) followed by another invocation
  gets a fresh token even with the same runTag. Use 1–128 ASCII letters, digits, `_` or `-`,
  starting with a letter or digit. Do not copy the latest Launch identity just because runTag matches.
  Register only when `run-marker get … --cwd` finds no live marker; under super-auto neither register
  nor clear. Before the first task dispatch, append `Launch: mechanism ordinary-subagents ·
  epic <id> · runTag <tag> · invocationId <token> · branch <branch> · integrationWorktree <absolute path> · concurrency <N> ·
  earlyUnblock <on or off> · sweep <command or deferred> · mergeCheck <build-only command or none>`
  to the ledger and confirm it was written before any review bundle output. Append another one
  with the same identity on explicit unsettled resume. A failed write is an evidence gap: no review
  assembly/writer dispatch; report review unavailable and `reviewPath: null`. `dispatch-text` reads
  this persisted field for final assembly and single/cluster/seam/stub review modes; it refuses
  a missing/unsafe identity or a `--invocation-id` differing from that launch.
- **Ledger outcomes.** Write each task's `Task …` and `Merge: …` lines in `coordinator-workflow.md`'s
  formats as the task settles, and the `Detector:`, `Sweep:`, four `Metrics:` and `Final review:` lines at Finish.
  Resume reads them back, through `scripts/ledger-digest`, together with beads and git
  (`scripts/already-merged --landed <integration branch>` lists the task merges git holds, for
  landings whose ledger lines were lost). Do not write a `Human action:` or `Edge add:` line the
  ledger already has. Append the same compact `Recovery: <JSON>` records defined in
  §Workspace and ledger: lane holds; pending closure with known landing head and related bead
  IDs; caller-owned sweep deferral; and every review/seam/check fix result. Each record carries
  source/artifact references in nonempty `evidence`; leave report bodies in their files. Clear
  only the matching `(kind,id)` obligation with observed evidence, and keep fix history
  append-only across clean retries. Preserve these records verbatim on elided append retries,
  drain the existing writer before reporting settled results, and read `obligations`,
  `fixHistory`, and malformed/unknown-version `gaps` separately from latest Task status.
  Before admitting resumed affected work, reconcile each active pending closure once against
  `already-merged <integration branch> <exact persisted head>` and authoritative task/review/blocker
  statuses. Valid landings reuse the original head/range and take closure-only routing: when all
  associated beads are already closed, append the matching clear/completion; otherwise recheck
  statuses and close only observed-open beads. Drain the writer before calling recovery settled.
  Failed/denied lookups, incomplete statuses or Git disagreement retain the original evidence and
  an explicit `hold` ID `resume:<task>` with `data.taskId`; successful fresh reconciliation alone
  clears that reconciler-owned hold. Never spend another implementation retry on these facts.
  Restore other holds before admission: `merge-lane` holds all work; a task hold names its ID or
  `data.taskId`; scoped hold/deferred records can name `data.affectedIds`. Hold those tasks and
  consumers while unrelated eligible work proceeds. Only the owner's explicit matching clear
  releases other obligations. Silence, a deleted branch or a later clean Task line clears nothing.
  Keep unscoped caller sweeps and `data.runFailure` diagnostics visible without generic repair
  dispatch; retain unknown/additive fields and fix history. Return `recovery-held` for unresolved
  admission obligations, with the exact discrepancy or unavailable observation in the report.
- **Dispatch names.** Name every dispatch `<kind>:<bead id>[:<suffix>]` with the Workflow kinds:
  `impl`, `review`, `fix`, `fix:<id>:seam` or `fix:<id>:check`, `seam-review` (`seam-review:<id>:check`
  for a merge-check fix's review), `merge`, `triage`, and `plan`, `plan-rest`, `final-review`, `final-review:cluster:<n>`, `final-review:seam` or
  `final-review:stub` with no bead. On Codex, task names accept only `[a-z0-9_]`, so write
  `<kind>_<bead id>[_<suffix>]` with every other character as `_` (`seam_review_ht_3bi_3_4`), and
  append `__2`, `__3`, … when a name repeats.

Keep each settled bundle immutable: `<workspace>/final-review-<invocationId>.md`, its direct-input
`.diff`, `final-review-<invocationId>.cluster-<n>.md`, and
`assembled/final-review-<invocationId>-final/`. Review dispatch files also include the token.
`runTag` still groups the enclosing run and processes. `reviewPath` points only to this invocation’s
written final review (single, seam or stub); no landed work or an unavailable writer leaves null.

Metrics at Finish use `coordinator-workflow.md` §Metrics' four-line contract. First reconcile
available Git/tracker facts and persist resulting completion lines. Read `ledger-digest` with
its exact kept/total validation and explicit missing/unreadable status, and independently read
`already-merged --landed`. Calculate counts mechanically from those observations: unique task
landings, latest per-task completion states, separate durable Recovery fix history, and actual
ledger-only/completed-only/Git-only IDs. Report observed source scope and gaps alongside counts.
For an unavailable ledger, retain known invocation buckets with a run-total gap. For finding
metrics, consume `scope-dispositions --project <run.md>` JSON (`metrics`, `gaps`); exit 3 keeps
partial results. Source kinds/populations absent from that projection remain unestablished.
Append Metrics before final review. Normal execution selection contributes zero friction;
`baseAbsorbed` contributes zero task landings. The existing profile owner below is unchanged.

Final review: window = `config.contextWindows.finalReview` (from `context-preflight --json`), else
`FINAL_REVIEW_FALLBACK_WINDOW` in coordinator.js (258K on Codex, 200K on Claude Code); threshold 40%.
First run `dispatch-text --ledger <ledger> bind-review-source --read` to retrieve this invocation's
persisted pair without recapturing a newer tip. If no binding exists and no partial bundle exists,
capture `reviewHead` during the existing Finish Git inspection with
`git rev-parse --verify <integration branch>^{commit}` and `reviewBase` as its verified merge-base
with the repository's default branch commit; persist them using
`dispatch-text --ledger <ledger> bind-review-source --base <reviewBase> --head <reviewHead>`.
The compact Recovery `data.reviewSource` fact retains invocationId/base/head through digest reads.
A mismatched source, invalid fact, existing unbound bundle or failed persistence is an evidence
gap: preserve all partial files and report final review unavailable. A fresh source requires a
fresh invocation identity. Pass the persisted `--base <reviewBase> --head <reviewHead>` to assembly
and every final review mode below, including direct-input fallbacks. Their generated guard runs
before any artifact/package writes and refuses existing outputs even on same-source retry.
An assembler guard refusal returns exit 2 with cause prefixed `review source guard:`: preserve
the partial bundle and return `reviewPath: null` instead of bypassing it with a direct review.
Other assembler failures keep their existing fallback. A failed capture without a persisted
binding leaves final review unavailable with the command/error evidence. Task `review` takes the
implementer's captured `--head` alongside `--base`; `check-fix-review` takes the fixer's `--head`.
Review filesystem views use unique detached worktrees; mutable reproductions own their outputs.
Run `dispatch-text assemble --consumer final-review --instance final --threshold <40% of the window>`,
then `final-review --mode single [--dir …] [--capped]` (it reads the sweep and Metrics from the
ledger's `Sweep:`/`Metrics:` lines, so append those first, as §Finish orders) or one `--mode cluster`
per fitting cluster (concurrently) then `--mode seam --reviewed <ordinals with a verdict> --unreviewed
<file>`; on a null seam review, `--mode stub --reviewed … --unreviewed <file listing every unreviewed
entry plus seam>`. Route exactly as `coordinator-workflow.md` §Finish says, and write
the same `Final review:` ledger line. Read the result through `report-verdict
<workspace>/final-review-<invocationId>.md`.

At Finish, run the worktree/process sweep from `coordinator-workflow.md` §Finish and return
`worktreesKept` (resource paths and reasons, including temp roots) and `processSweep` arrays
`stopped`, `survived`, `unknown`, `kept`. Cleanup helpers return 0 for verified completion, 3 for
survivors or deliberate retention, and 4 for unverified inspection/termination; retain every output
fact on all three exits. `remove-task-worktree` checks worktree/temp processes together before
removal and retains resources on 3/4, including `--discard` and `--sweep`. An unavailable dispatch,
`scriptError` or absent process output field becomes `unknown`, with unchecked roots identified.
Record these facts alongside completed code; copy the same arrays and paths to the caller.

After the ordinary invocation settles, the invoking session records one run profile (Finish does
not generate a second one): `bash <skillsRoot>/super-code/scripts/run-profile --codex
"$CODEX_THREAD_ID"` on Codex, or `--subagents ~/.claude/projects/*/"$CLAUDE_CODE_SESSION_ID"/subagents`
on Claude Code, with `--ledger <ledger> --out <ledger dir>/profile-<session id>`. Append its whole stdout
once to the ledger on every exit path: on exit 3 its last line is `Profile: unavailable — …`, and
the `Profile: context` lines it prints before that line belong in the ledger too. `--out` writes the
md/json pair beside the ledger, including qualified unavailable output. Under super-auto, collection
copies that invocation's existing pair into the committed run directory without regenerating it.

Then clear the run marker by the same rule as `coordinator-workflow.md` §Finish: `bash
<skillsRoot>/super-code/scripts/run-marker get <session id> --cwd <integration worktree>`, and only
when its `skill:` line is `super-code`, `run-marker clear --worktree <integration worktree>`. Under
super-auto clear nothing.

Every read you make to route the loop follows the read rule in `coordinator-card.md` (re-injected
after compaction): the ledger through `ledger-digest`, child reports through `report-verdict <file>`,
never a report body, plan, spec or diff.
