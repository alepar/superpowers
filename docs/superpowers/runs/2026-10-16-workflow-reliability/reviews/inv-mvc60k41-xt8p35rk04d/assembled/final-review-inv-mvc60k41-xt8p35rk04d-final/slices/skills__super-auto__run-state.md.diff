diff --git a/skills/super-auto/run-state.md b/skills/super-auto/run-state.md
index 1c6835f1..1e06a94a 100644
--- a/skills/super-auto/run-state.md
+++ b/skills/super-auto/run-state.md
@@ -48,12 +48,18 @@ The schema home for `run.md`: every field's name and line format. The numbered i
 | `codeBuckets.review` | `  review: ready \| not ready (<summary>)`, or `  review: ready (after the phase-6 sweep @ <sha>)` when the review's only blocker was the unmeasured branch; `  review: CLEAN` and `  review: <verdict> (<N> confirmed)` are older forms, read as `ready` and `not ready` | 6 | super-auto |
 | `codeBuckets.sweep` | `  sweep: <one-line result> @ <sha>`, the result in `super-code`'s sweep form, `<sha7> — <P> passed, <F> failed, <E> errors, <S> skipped; failing: <ids, or none>; command: <command>`, or `MEASUREMENT INVALID: <cause>`; `  sweep: SWEEP DEFERRED (caller-owned)` until phase 6 | 6 | super-auto (SKILL.md §Phase 6 — report steps 1 and 2) |
 | `codeBuckets.slowness` | `  slowness: <items>`, appended across invocations | 6 | super-auto |
-| `codeBuckets.worktreesKept` | `  worktreesKept: <worktree — reason>, …` (empty when every finished task's worktree was removed) | 6 | super-auto |
-| `codeBuckets.processSweep` | `  processSweep: stopped <N> · survived <M>[ — <pid command — why>; …]` (the survivors listed; `PROCESS SWEEP UNAVAILABLE — …` when super-code's sweep could not run) | 6 | super-auto |
+| `codeBuckets.worktreesKept` | `  worktreesKept: <worktree-or-temp-root — reason>, …` (empty after verified resource cleanup; unavailable cleanup names unchecked roots) | 6 | super-auto |
+| `codeBuckets.processSweep` | `  processSweep: stopped <N> · survived <M> · unknown <U> · kept <K>[ — survived: <fact>; unknown: <root-or-pid — failed inspection>; kept: <pid command — reason>; …]` (preserve stopped/survived/unknown/kept facts; unavailable sweep or missing output is unknown) | 6 | super-auto |
 | `sweepFix` | `sweepFix: <N> failing → <fix bead ids> · re-run <result> @ <sha>`, then ` · regression <K> failing → <fix bead id> · re-run <result> @ <sha>` when the regression-only bead ran; `<result>` in the `codeBuckets.sweep` form | 6 | super-auto |
 | `approvals` | `approvals:` then one `- <record>` line per decision below | 7 | super-design; super-auto (`design-review`) |
 | `approvals · top-split` | `- top-split · human \| auto · <child id> LEAF \| PROMOTE, …` | 7 | super-design |
 | `approvals · design-review` | `- design-review · pending \| approved` | 7 | super-auto |
+| `approvals · review-collection` | `- review-collection · <JSON invocation/workspace/review/required/settlement/archive facts>` | 7 | super-auto, before launch and after settled collection |
+| `approvals · root-acceptance` | `- root-acceptance · <JSON requirements/evidence/recovery/checkEvidence/runFailures/decisions>` | 7 | super-auto, before code and after settlement or acceptance evidence changes |
+| `approvals · finding-source` | `- finding-source · <complete extraction JSON>` | 7 | super-auto, on source collection |
+| `approvals · finding-link` | `- finding-link · <JSON refs and basis>` | 7 | super-auto, after judging an explicit match |
+| `approvals · finding-route` | `- finding-route · <JSON ref and owner/fix/deferred>` | 7 | super-auto, when routing a finding |
+| `approvals · finding-disposition` | `- finding-disposition · <JSON ref and supported disposition/basis>` | 7 | super-auto, after judging verification or rejection support |
 | `approvals · coverage-round-<N>` | `- coverage-round-<N> · <each finding's disposition, marked auto \| human>`; round 1 also carries the canonical R-list and the `requirements: N · mapped: M · unmapped: K (…)` line | 7 | super-design |
 | `baseAbsorbed` | `baseAbsorbed: <base sha> → <merge sha>, <N> conflicted files`, one line per absorption | 7 | super-auto |
 | `stepBackCode-round-<N>` | the line format `super-design/step-back-prompt.md` defines | 7 | super-auto |
@@ -74,7 +80,7 @@ The schema home for `run.md`: every field's name and line format. The numbered i
 
    A stall at phases 1–5 writes `report.md` (status line per report-prompt.md §The status block) but leaves `phase` where it was. A stall at phase 6 leaves `phase: report` with a `stalled` status line, which is why the phase-7 gate also checks the status line (SKILL.md §Invariants I2 (phase-7 gate)).
 
-3. **Pointers** — the raw idea text, spec path, epic id, integration branch, the base branch the run merges back into (the repo branch this run's worktree was cut from, usually `main`), and the roast report paths. `branch` is this run's own branch, which is also the integration branch `super-code` merges into. There is no plan pointer: a tracker is required (SKILL.md §Pre-flight), so the epic and its beads are the plan, and a `plan:` line would send a resume looking for a file that does not exist. `base` is written in pre-flight, when this run's worktree is created, so phase 7 can supply it instead of asking; a resumed run has no other way to know it. Pointers only, never inline content: `run.md` says where the spec and reports live and does not restate them. The exception is `idea`, which carries the raw idea verbatim because resume.md §Finding a run matches on it, and a run that dies during phase 1 has no spec yet. `runTag` names this run in every assembled-input dir and final-review file and in the run marker; `context` records each role's context window at pre-flight. `skillSource` appears only after a mid-run definitions switch or a pre-flight that proceeded on the updated cache instead of restarting (SKILL.md §Pre-flight), and a resume reads skills from it; `migrated` lines beside it map fields the new contract dropped (resume.md §Switching definitions mid-run).
+3. **Pointers** — the raw idea text, spec path, epic id, integration branch, the base branch the run merges back into (the repo branch this run's worktree was cut from, usually `main`), and the roast report paths. `branch` is this run's own branch, which is also the integration branch `super-code` merges into. There is no plan pointer: a tracker is required (SKILL.md §Pre-flight), so the epic and its beads are the plan, and a `plan:` line would send a resume looking for a file that does not exist. `base` is written in pre-flight, when this run's worktree is created, so phase 7 can supply it instead of asking; a resumed run has no other way to know it. Pointers only, never inline content: `run.md` says where the spec and reports live and does not restate them. Finding-source records retain complete extraction JSON under approvals so unavailable artifacts cannot erase known occurrences. The other exception is `idea`, which carries the raw idea verbatim because resume.md §Finding a run matches on it, and a run that dies during phase 1 has no spec yet. `runTag` groups this run and its run marker; each super-code invocation separately persists `invocationId` in its Launch before producing its immutable final-review bundle; `context` records each role's context window at pre-flight. `skillSource` appears only after a mid-run definitions switch or a pre-flight that proceeded on the updated cache instead of restarting (SKILL.md §Pre-flight), and a resume reads skills from it; `migrated` lines beside it map fields the new contract dropped (resume.md §Switching definitions mid-run).
 
    Path-valued pointers are relative to the run directory (`docs/superpowers/runs/YYYY-MM-DD-<slug>/`), never bare filenames or full repo-relative paths: one convention, so two writers produce compatible files.
 
@@ -90,6 +96,16 @@ The schema home for `run.md`: every field's name and line format. The numbered i
    - degraded-verdict: a sibling's own mandated pause that autonomous mode answered on the human's behalf instead of asking, such as a declined re-roast-at-raised-`config.panelCap` offer, or a `clean [low coverage]` / `clean [panel-capped: N unverified]` verdict autonomous mode proceeded past. Recorded with which branch was taken, e.g. `"clean [low coverage] — proceeded"`. A goal- or scope-changing redesign the phase-5 step-back proposed and autonomous mode did not apply is this kind too: `"redesign proposed, not applied — <one line>"`;
    - graph-change: an edge change or proposal from super-design's parallelism pass that was not applied (outside the safe class), as super-design recorded it beside its `graph-pass:` line.
 
+   Run attribution uses these existing records, without a new top-level field: retain an open
+   `run-regression` or `attribution gap` as `degraded-verdict` with the super-code ledger's Recovery
+   id, introducing owner (when known), exact command/configuration and source-output pointers.
+   A task-base exoneration is a separate fact and does not clear the run owner. Preserve these
+   entries across code bucket replacement and later clean invocations; update the same source
+   entry rather than duplicating it. Only linked live/pass fix verification retires the open
+   qualifier, retaining its durable history and verification pointer in Recovery. These entries
+   never use `resolves-on: sweep`. A recorded pre-run failure stays distinct and does not by
+   itself assign this run repair work. Missing baseline evidence remains an attribution gap.
+
    A `degraded-verdict` line may end ` · resolves-on: sweep`: the qualifier stands only until the phase-6 sweep passes, and `scripts/report-status` skips it once `codeBuckets.sweep` is a pass stamped at the tip. Phase 6 adds the key when it parks a final review that read `not ready` only because the deferred sweep left the branch unmeasured (SKILL.md §Phase 6 — report step 4).
 
    Parking is mode-independent: a `beyond-cap` or `degraded-verdict` item is recorded the same way whether autonomous mode or a human answered, noting who chose, because the question was raised and an unverified Blocking candidate survived it either way. These items carry open concerns and self-made calls a resumed session never saw raised.
@@ -102,11 +118,11 @@ The schema home for `run.md`: every field's name and line format. The numbered i
 
    `roastCodeExit` is written by `super-auto` the moment the phase-5 loop ends (SKILL.md §Loop exits): `converged`, `thrash`, `capped`, or `operator-skipped (<reason>)` when the operator ended it early. Any value means the loop has ended, and a resume starts no further round (resume.md §Resuming at a phase). Absent when the loop never ran (`skipCodeRoast`) or has not ended.
 
-6. **Code buckets** — `completed`, `escalated`, `pendingRetry`, `parked`, `stalled`, `review`, `sweep`, `slowness` (appended across invocations, not overwritten), `worktreesKept`, `processSweep`, recorded verbatim at every phase 3→4 transition and overwritten on each fix-loop re-entry, because the latest `super-code` return is the current truth. The exception is `sweep`, which phase 6 rewrites after each sweep it runs (SKILL.md §Phase 6 — report). `super-code` returns them once and does not persist them, and report-prompt.md §Sections and their sources reads them.
+6. **Code buckets** — `completed`, `escalated`, `pendingRetry`, `parked`, `stalled`, `review`, `sweep`, `slowness` (appended across invocations, not overwritten), `worktreesKept`, `processSweep`, recorded verbatim at every phase 3→4 transition and overwritten on each fix-loop re-entry, because the latest `super-code` return is the current truth. The exception is `sweep`, which phase 6 rewrites after each sweep it runs (SKILL.md §Phase 6 — report). `super-code` returns them once and does not persist them, and report-prompt.md §Sections and their sources reads them. `completed` describes delivered code; `worktreesKept` and `processSweep` independently describe cleanup. Preserve unknown inspection, known survivors and deliberate retention with their resource paths even when code landed. Older processSweep lines without unknown/kept counts leave those outcomes unrecorded, rather than verified empty.
 
    Refresh them from the tracker as phase 3 proceeds, so a session that ends inside phase 3 resumes with the last completed round: closed task beads under the epic are `completed`, quarantined ones `escalated`. A `review: <id>` bead (label `sp:review`) is `super-code`'s bookkeeping, never a task, and a task whose review bead is still open is in flight. When `super-code` returns, overwrite the buckets with its returned fields verbatim.
 
-   `review` records the verdict of `super-code`'s final whole-epic review: `ready` or `not ready (<summary>)`. A `run.md` written before this form has `CLEAN` or `<verdict> (<N> confirmed)`; read them as `ready` and `not ready`. Under `deferSweep` each invocation's review is informational; the one the report uses is the last invocation's, read after the phase-6 sweep, and its items are routed per SKILL.md §Final-review items. That review is mandatory even when `skipCodeRoast` is set.
+   `review` records the verdict of `super-code`'s final whole-epic review: `ready` or `not ready (<summary>)`. A `run.md` written before this form has `CLEAN` or `<verdict> (<N> confirmed)`; read them as `ready` and `not ready`. Under `deferSweep` each invocation's review is informational; the report describes the latest verdict after the phase-6 sweep, while its outstanding items come from the accumulated projection per SKILL.md §Final-review items. That review is mandatory even when `skipCodeRoast` is set.
 
    `sweep` is the run's one full-suite result in the §Field table form, stamped with the SHA it measured; it reads `SWEEP DEFERRED (caller-owned)` until phase 6. `scripts/report-status` counts it as a pass only in that form with zero failed and zero errors, stamped at the report's tip as report-prompt.md §The status block defines it; any other value becomes a qualifier.
 
@@ -186,6 +202,185 @@ The schema home for `run.md`: every field's name and line format. The numbered i
    they never saw, which is the failure mode this record exists to prevent, arrived
    at from the other direction.
 
+## Review collection records
+
+Use existing `approvals:` records, with one JSON object per line after `- review-collection · `.
+Before launch commit `{"invocationId":"inv-a","workspace":"<absolute workspace>","reviewPath":"<absolute workspace>/final-review-inv-a.md","review":"pending","required":[],"settled":false}`. Pass that ID to either coordinator mechanism; runTag remains the enclosing run identity. The caller adds relative `required` files when a known direct input is required beyond discovered `.diff`/assembled/split inputs. These are collection facts, not new producer result fields.
+
+After confirmed settlement, `report-status --collect RUN_MD --invocation ID --workspace WORKSPACE --review PATH_OR_none --verdict REVIEW [--required RELATIVE_FILE]...` appends the settled intent before copying. Preserve the exact original required-input list. `reviewPath:null` records a null result: only `review:"no work landed"` permits collection without a review. Any other null/missing review leaves an evidence gap, owned by the orchestrator; no clean review/source is invented. Unexpected recoverable bundle artifacts with a null result are still extracted and archived, with a gap requiring reconciliation.
+
+The helper appends complete extraction JSON under `finding-source`, preserving immutable `ID/final` and `ID/cluster-N` identities and every section/position/key/text, with an archive pointer under `reviews/ID/`. It copies final/cluster review files, the direct `.diff` when present, and the complete assembled input directory, checking declared files and split manifest slices. An interrupted copy is replayable before completion. Identical copies do not change; conflicting bytes remain untouched. Completion adds `complete:true`, `files:[{"path":"<bundle-relative path>","sha256":"<hash>"}]` and `gaps:[]`; missing/incomplete/conflicting artifacts add `complete:false` and nonempty `gaps`. Earlier records and supported finding dispositions remain append-only. The last collection record per invocation describes recovery progress; it never disposes a finding.
+
+`report-status --collect RUN_MD` replays all retained collections. It verifies complete archive hashes even after source cleanup. Exit 0 confirms preservation; exit 3 leaves pending/gaps and requires preserving the source workspace plus archive before later invocation or cleanup; exit 2/4 establishes no collection. Unsettled intents require ledger/result confirmation, not inference from artifact presence. A missing source extraction retains known inline occurrences and exposes unavailable coverage. Ordinary `report-status RUN_MD` is read-only: with new records it adds `outstanding findings: N`, `review collections pending: N`, `review collection gaps: N` and/or `finding evidence gaps: N` qualifiers as applicable, derived from this collection history and the shared outstanding projection. Unavailable tooling/projection is qualified explicitly. Without new records legacy status output is unchanged.
+
+## Caller-owned root acceptance
+
+Every super-auto launch and re-entry supplies `rootAcceptance: "caller"` independently of
+`deferSweep`. All helper closures use `close-in-tree-epics EPIC --exclude-root`. Completed leaves,
+Git landing, an empty ready set, and a ready review each establish their own facts; the root stays
+open while caller acceptance is pending. Standalone super-code keeps its default root ownership.
+
+The existing `approvals:` block carries `root-acceptance` JSON snapshots, version 1, owner
+`super-auto`. Each has `sourceTree` (the full Git tree of the reviewed/measured code), `requirements`,
+`evidence`, `reviews`, `decisions`, `recovery`, `checkEvidence`, and `runFailures`. Write the initial
+snapshot before code, with pending requirements and empty evidence/decisions. After each settled
+invocation, preserve its returned Recovery obligations/gaps, source-bound checkEvidence records,
+requiredLiveChecks/gaps, and runFailures classification/state, using the exact prerequisite
+contracts. Carry still-open facts forward on bucket replacement; reconcile them from their durable
+ledger before removing them from a later snapshot. Earlier snapshots stay as evidence history.
+
+Each requirement has `id`, `kind` (`review`, `measurement`, `human`), and `owner`. Include the final
+whole-epic review, final full-suite measurement, existing phase-7 human choice, and every additional
+acceptance criterion or reserved human gate the run actually requires. This record describes those
+existing obligations; it introduces no additional approval ceremony. Measurement requirements add
+`command`, `configuration`, `requiredLive` (boolean), and optionally `sourceTree` for a check tied
+to a particular earlier tree. Without that override they measure the snapshot's final tree.
+Optional `obligations: [<exact Recovery ids>]` binds deferred final-suite records to that final
+measurement. Preserve a declared Recovery command; a different command cannot discharge it.
+Other deferred measurements need their own command/configuration/source binding. Requirements
+omitted in a later snapshot remain required; an amendment changes the existing requirement by ID
+with its authority/evidence retained in approvals. Never erase a required check by omission.
+
+`evidence` uses the existing sourceTree/command/configuration/outcome/location/kind records.
+`reviews` entries are `{id, sourceTree, outcome, location}`: `pass` means the required review's
+coverage and supported dispositions were verified, rather than copying a ready verdict over
+unresolved findings. `decisions` entries are `{id, authority:"human", decision, evidence:[...]}`.
+Only an actual human's `accept` decision satisfies a human requirement. `keep` and `cancel` preserve
+those outcomes and leave acceptance open, even when the run phase is `done`. Never invent an agent
+decision or infer acceptance from child closure. Retain every reserved human gate separately.
+
+Optional `findingAcceptance` entries carry `{ref, judgment:"supported", effect, basis, evidence}`.
+The existing caller assessment judges `effect:"required"` with the named `requirement` it blocks,
+or `effect:"nonblocking"` with evidence supporting its exclusion from required acceptance. Judge
+each outstanding projected finding/group once using an exact original source ref; explicit links
+make duplicate occurrences one group, while all their original refs remain available. A deferred
+or explicitly non-actionable source item is not automatically a required code defect. Missing or
+unsupported relevance is an acceptance gap. This judgment changes only its acceptance effect:
+nonblocking findings remain outstanding in the shared projection and punch list. It never invents
+a resolution or demands new human approval for every minor; human authority is required only for
+the human decisions already reserved by the task/spec and phase-7 menu.
+
+`report-status --acceptance RUN_MD --tree FULL_GIT_TREE` is a read-only root-close gate: exit 0 and
+`eligible:true` establish that recorded obligations are satisfied; exit 3 returns `pending`/`gaps`;
+2/4 establish no acceptance. Resolve the reviewed/measured source identity and confirm it still
+matches the final code (run-directory-only commits may be excluded per
+report-prompt.md §The status block) before passing that tree. Ordinary status also qualifies pending root acceptance when the
+record is present, using its recorded tree. Legacy status without the record is unchanged.
+
+The gate independently checks required reviews, matching measurements (live when required),
+Recovery holds/pending closures/deferred obligations, source-bound required live checks, run-owned
+failures, collection integrity and supported requirement relevance in the shared outstanding finding projection. A passing measurement
+discharges only its matching obligation. Failed and unavailable outcomes stay distinct; simulated
+or fallback evidence cannot satisfy live requirements. A contradictory pass/fail at the same tree
+requires reconciliation. An open run-introduced failure retains its owner; a missing attribution
+remains a gap. Evidenced pre-run failures are diagnostic unless a requirement separately calls for
+repair. A valid empty finding projection can pass; an empty key stream or missing extraction cannot.
+
+Only after the existing final choice and all required gates are supported, rerun this gate against
+the final code identity and explicitly close the root on exit 0. A passing gate never closes a bead
+or supplies a human decision. A report/hand-back may still describe delivered leaves with pending
+acceptance; keep the root open and name each owner and evidence gap.
+
+## Finding continuity records and projection
+
+Append the finding records below to the existing `approvals:` block. Preserve earlier records
+across code bucket replacement; the latest review verdict describes its own invocation, while
+this projection accounts for outstanding findings from every retained source. These additive
+facts are independent: ownership, fix-task reference and deferral can coexist with verification.
+They impose no state sequence and do not replace the externally owned roast ledger.
+
+**Source.** Use `bash skills/super-code/scripts/report-verdict --complete --source
+'<invocationId>/<logical-artifact>' FILE`. The invocation token comes from the persisted
+super-code Launch, separate from runTag; e.g. `inv-a/final` identifies
+`final-review-inv-a.md`. Split artifacts have their own logical suffix (e.g. `inv-a/cluster-1`).
+Retain the exact returned object as one JSON line after `- finding-source · `, including
+`version:1`, `source`, `artifact`, `kind`, `verdict`, and every occurrence's `section`, `position`,
+`key` and `text`. JSON escapes preserve multiline text and keys with commas or Unicode.
+Keep the original artifact alongside the extraction. Relative artifact paths resolve from the
+run.md directory; when archiving, update only `artifact` to the retained copy, preserving
+`source` and the complete occurrence array. Source identity is never derived from archive paths.
+An unavailable artifact reports a gap while its inline extraction still preserves known findings.
+Extraction failure is a gap, never a replacement empty source. An explicit clean recognized
+review may have `occurrences:[]`; a run with no retained sources has unknown coverage.
+
+**Reference and link.** An occurrence reference is exactly
+`{"source":"inv-a/final","section":"Deferred OK","position":1}`. Section and source strings
+match exactly, and position is the extractor's positive section-local integer. Source path,
+wording, severity and key alone do not link appearances. Append
+`- finding-link · {"refs":[<ref>,<other-ref>],"basis":"why these appearances are the same obligation"}`
+only after judging the explicit match. Links combine referenced occurrences transitively.
+Ambiguous matches remain separate. Archive copies with identical source/section/position and
+text deduplicate; conflicting extractions retain text variants, expose a gap and keep affected
+findings outstanding even if a disposition claims resolution.
+
+**Routing.** Append `- finding-route · {"ref":<ref>,"owner":"<bead>","fix":"<fix bead>",
+"deferred":"<reason>"}` as one JSON line, with any nonempty subset of owner/fix/deferred.
+Deferral is explicit routing, not inferred from a section name. A fix-task assignment, closed
+bead, success claim or a later silent/ready review leaves the finding outstanding.
+
+**Supported disposition.** Append
+`- finding-disposition · {"ref":<ref>,"disposition":"resolved","judgment":"supported",
+"basis":"why the fix addresses this finding","evidence":["verification.log @ <sha>"],
+"verification":"exact relevant check and observed repaired behavior"}` as one JSON line.
+A rejection uses `"disposition":"rejected"`, keeps its reasoning in `basis` and supporting
+references in the nonempty `evidence` array, and does not require `verification`. Helpers validate
+references and required fields. The owning agent first judges whether the evidence semantically
+supports this particular fix or rejection, then records `judgment:"supported"`; a nonempty
+file name or a successful task is insufficient. Verification of a fix supplied by another task
+uses the same contract. A passing sweep settles only the measurement obligation it establishes;
+it cannot stand in for verification of unrelated actionable findings. Unsupported disposition
+records remain visible with a gap and do not resolve findings. A supported disposition applies
+to the explicitly linked group; other appearances remain independent.
+
+**CLI and output.** Run `bash skills/super-auto/scripts/scope-dispositions --project RUN_MD`
+for JSON `{version:1,findings:[...],gaps:[{origin,message}]}`. Each finding holds its first retained
+`ref`, original `occurrences` (including source/artifact/section/position/key/text), all archive
+`artifacts`, conflicting `variants`, explicit `links`, `routes`, `dispositions` with mechanically
+validated `supported`, and booleans `outstanding`/`deferred`. Source order is deterministic.
+No source/disposition is removed from run.md by projection. Append-only history stays available
+even after a supported disposition makes a finding no longer outstanding.
+
+Add `--keys` for the legacy punch-list transport: one exact original key per line, from only
+outstanding deferred groups, deduplicated in first appearance order. Resolved/rejected findings
+and active nondeferred findings are excluded. This is derived from the same validated projection;
+an empty key stream alone cannot establish clean acceptance. Detailed JSON retains all distinct
+occurrences despite equal printed keys. Consumers must check exit status and gaps, and use the
+full projection for Remaining/resume/status rather than treating the latest ready verdict as
+clearance of earlier findings.
+
+Optional `--external FILE` consumes a supplementary JSON object
+`{"version":1,"records":[{"type":"finding-link",...},{"type":"finding-disposition",...}]}`.
+Each record has the same refs/basis/support fields as the local counterpart and can reference
+only retained local occurrences. This is a consumer seam, not a new roast-ledger API or policy.
+Unsupported/unknown types (including silence-based dissolution), absent files, malformed or
+incomplete records produce gaps without replacing local evidence; valid supplementary records
+are applied individually. Omitting this optional argument does not imply an external disposition.
+
+Exit 0 means projection validated; 3 means projection returned retained findings plus explicit
+gaps; 2 means bad CLI or unreadable run record and no projection; 4 means Node unavailable.
+In key mode gaps go to stderr as `FINDING_GAP:`; JSON mode includes them in `gaps`.
+No jq is required by projection (the legacy round mode still uses its existing jq/manual fallback).
+If Node is unavailable, `NODE_UNAVAILABLE:` is printed on stderr and no projection is established:
+retain all known occurrences, manually follow explicit links and supported dispositions, and
+list every unresolved deferred key plus any evidence gaps. Never interpret unavailable output
+as an empty punch list or a clean review.
+
+Projection JSON also carries additive `metrics` over retained sources: raw `occurrences`,
+`occurrenceGroups`, actionable `findings`, supported `repaired`/`rejected`, `outstanding`,
+outstanding `deferred`, `otherSectionGroups`, source kinds, section labels and gap count.
+Actionable groups have an occurrence in Confirmed findings, Must fix, Deferred, Concerns,
+Blockers, Findings or Untested scope; other extraction sections remain separately visible.
+A group counts as repaired only with a supported resolved disposition and no outstanding
+conflict. Rejection/deferral contributes zero repairs. Explicit links can reduce group counts
+without reducing raw occurrence counts. Exit 3 retains these supported partial metrics and gaps.
+The scope is retained sources: absent task-report/roast/final-review populations remain
+unestablished rather than supplying zero run-wide findings. No new run.md field is required.
+
+Report sources preserve the latest invocation verdict separately from durable Recovery fix
+history and the finding projection. A `baseAbsorbed` record supplies zero task landings;
+normal execution-mechanism selection supplies zero friction events. An unavailable ledger can
+still supply known invocation results, labelled with a run-total gap.
+
 ## File format — worked example
 
 An illustrative `run.md` mid-run: the design phase went through two roast
@@ -213,10 +408,19 @@ roastDesignRound: 2
 roastCodeRound: 1
 
 approvals:
+- root-acceptance · {"version":1,"owner":"super-auto","sourceTree":"1111111111111111111111111111111111111111","requirements":[{"id":"final-review","kind":"review","owner":"super-auto"},{"id":"sweep","kind":"measurement","owner":"super-auto","command":"npm test","configuration":"quiet host","requiredLive":true,"obligations":["bd-412:sweep:rate-limiter-20260731T120000"]},{"id":"finish","kind":"human","owner":"human"}],"evidence":[],"reviews":[],"decisions":[],"recovery":{"obligations":[],"gaps":[]},"checkEvidence":{"records":[],"requiredLiveChecks":[],"gaps":[]},"runFailures":[]}
+- review-collection · {"invocationId":"inv-a","workspace":"/work/project/.superpowers/sdd/bd-root-plan","reviewPath":"/work/project/.superpowers/sdd/bd-root-plan/final-review-inv-a.md","review":"pending","required":[],"settled":false}
 - top-split · auto · bd-413 PROMOTE, bd-414 PROMOTE, bd-415 LEAF, bd-416 LEAF
+- finding-source · {"version":1,"source":"inv-a/final","artifact":"final-review-inv-a.md","kind":"final-review","verdict":"not ready","occurrences":[{"section":"Deferred OK","position":1,"key":"[Nit] lib/format.ts:12 — inconsistent formatting","text":"[Nit] lib/format.ts:12 — inconsistent formatting"}]}
+- finding-source · {"version":1,"source":"inv-b/final","artifact":"final-review-inv-b.md","kind":"final-review","verdict":"not ready","occurrences":[{"section":"Deferred OK","position":1,"key":"[Nit] lib/format.ts:12 — same formatting obligation","text":"[Nit] lib/format.ts:12 — same formatting obligation"}]}
+- finding-link · {"refs":[{"source":"inv-a/final","section":"Deferred OK","position":1},{"source":"inv-b/final","section":"Deferred OK","position":1}],"basis":"reviewed as the same source location and defect"}
+- finding-route · {"ref":{"source":"inv-a/final","section":"Deferred OK","position":1},"owner":"bd-421","fix":"bd-421","deferred":"formatting lies outside the goal"}
+- finding-disposition · {"ref":{"source":"inv-a/final","section":"Deferred OK","position":1},"disposition":"resolved","judgment":"supported","basis":"bd-422 supplied the formatting fix","evidence":["format-verification.log @ 1a2b3c4"],"verification":"formatter check passes on both affected ranges"}
 - coverage-round-1 · canonical R-list: R1 "enforce per-tenant request quota", R2 "reject over-quota requests with 429", R3 "expose current quota usage to callers" · requirements: 3 · mapped: 2 · unmapped: 1 (R3) · auto GAP "no backpressure path" → leaf bd-417; auto ORPHAN "metrics exporter" → kept, goal element added; auto UNOWNED-SEAM "tenant-id propagation" → contract bd-418 / integration bd-419; auto unstated "bd-411<-bd-405" → edge dropped (no artifact to name); auto GAP "R3 unmapped — usage exposure" → leaf bd-420
 
 parked:
+- ../../../../.superpowers/sdd/bd-412-plan/progress.md#run-failure-F · degraded-verdict · "run-regression F owner bd-413; command npm test -- F; configuration target=staging; run-start/A/B-base evidence in Recovery; bd-414 task-base exonerated"
+- ../../../../.superpowers/sdd/bd-412-plan/progress.md#run-failure-G · degraded-verdict · "attribution gap G: missing run baseline; evidence/G.log"
 - 2026-07-31-per-tenant-rate-limiter-roast-design-2.md · escalation · "cache invalidation premise unverified — no valid judge votes"
 - 2026-07-31-per-tenant-rate-limiter-roast-design-2.md · degraded-verdict · "clean [low coverage] — proceeded, not re-roasted"
 - 2026-08-01-per-tenant-rate-limiter-roast-pr-1.md · beyond-cap · "Blocking candidate left unjudged at panel cap"
@@ -231,7 +435,7 @@ codeBuckets:
   sweep: SWEEP DEFERRED (caller-owned)
   slowness:
   worktreesKept:
-  processSweep: stopped 0 · survived 0
+  processSweep: stopped 0 · survived 0 · unknown 0 · kept 0
 ```
 
 ## The resume rule
