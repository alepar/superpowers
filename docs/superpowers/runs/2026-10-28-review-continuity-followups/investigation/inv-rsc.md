# super-plan-rsc investigation: scope review-inputs provenance checks to the captured range

Repo: /Users/alepar/AleCode/superpowers/.worktrees/super-auto-review-continuity-followups (HEAD c5798364). Read-only; no repo edits.
Artifacts: prototype diff /private/tmp/claude-501/-Users-alepar-AleCode-superpowers/466f2ab3-a599-49d3-9c01-54016a393867/scratchpad/rsc/proto.diff,
scenario script .../scratchpad/rsc/scenarios.sh, output .../scratchpad/rsc/scenarios.out.

## 1. Code path (skills/super-code/scripts/dispatch-text.mjs)

- 476-487 `review-inputs` kind -> `reviewInputs(worktree, base, head, out, current)` (129-408). `assemble` reaches the same
  function via the assembler command built in coordinator.js:2591.
- 146 `changed = git diff --name-only base..head` (the range inventory).
- 151 `snapshot(revision)`: 164-165 iterates EVERY tree path whose basename is `run.md` (`for (const run of tree.keys())`), no
  relation to `changed`. Parse failures (167 unreadable blob, 197 conflicting identity, 201 conflicting saved hash, 205 malformed
  record) call `snapshotGap` -> global `gap()`.
- 221 `validateCollections(snapshot, revision)`: 224-236 for every run and every latest record, `!complete || !settled || gaps.length`
  -> `collectionGap(': incomplete claimed collection')` (236), plus bundle/hash checks 237-286.
- 358-363: `snapshot(base)`, `snapshot(head)`, `authenticateOrigins` both ways, `validateCollections` both endpoints.
- 376 `if (!gaps.length)` gates omission; 394 `status: gaps.length ? 'unavailable'`; 407 `process.exit(gaps.length ? 3 : 0)`.
  So one untouched incomplete record yields two gaps (base + head) and exit 3.

What selection actually needs: omission only removes `changed` paths that are in `after.claims` (377-378). Claims are built at
275-282 only for `posix.join(dirname(run), 'reviews', invocationId, relative)` (archive, 228) under `assembled/` or `*.md.diff`.
`before.saved` (370-375) likewise contains only archive paths. So a run.md can influence this range only through:
  (a) its own path, (b) its `run.md.collection-origin.json` sidecar (mirror), (c) any path at/under `<dirname(run)>/reviews`.
If none of those is in `changed`, the run cannot claim, omit, or lose anything in the range: its byte content and its
archive are identical at both endpoints.

## 2. Reproduction

Retained repro (/private/tmp/superpowers-mosh-phase2-triage-9tg/unrelated-history-repro, base 2c079ca0, head 564f05dd, changes
only product.txt) re-run against current HEAD:
  exit=3 {"status":"unavailable","sourceAvailable":true,"selected":1,"omitted":0,"gaps":[
   "2c079ca...:docs/prior/run.md:3 old-inv: incomplete claimed collection",
   "564f05dd...:docs/prior/run.md:3 old-inv: incomplete claimed collection"]}
With the prototype: exit=0 status complete, gaps [], and the provenance md carries
  "- Outside captured range (informational; neither selected nor waived): <rev>:docs/prior/run.md:3 old-inv: incomplete collection outside captured range".

## 3. Relevance rule and placement

A run.md R is relevant to base..head iff any of:
  1. R is the caller-bound current run (`current.run`, from --review-run-file + Launch);
  2. R in changed (added, edited, deleted, mode/symlink change -> covers corrupt and deleted);
  3. R + '.collection-origin.json' in changed;
  4. some changed path p == dirname(R)/reviews or startsWith dirname(R)/reviews/ (claimed/archived payload or report changed,
     added or deleted);
  5. R is being re-snapshotted as an authenticated mirror origin (`snapshot(origin.commit, origin.run)`, onlyRun != null) - keep
     those strict as today.
Not a rule: run ID filtering. Not needed: content-based "claims a changed path" - claims are confined to (4) by construction,
so the path rule is a superset and needs no parsing (works even when R is corrupt).

Handling of irrelevant runs: still parsed (so mirror ambiguity checks at 344-347 see the full population), but their parse
and validation problems go to a new non-blocking `outOfRange` list in review-inputs.json and the provenance md; they are
never validated for claims, never contribute claims/saved, and never change exit status. Nothing is waived: the moment a
range touches the run file, its sidecar or its archive, every existing guard applies to it at both endpoints. A broad range
whose base predates the old run (coordinator final review on upstream base) adds that run.md, so it stays guarded (case F).

Implementation (prototype, ~25 changed lines, all in reviewInputs; see proto.diff):
- after line 146: `changedSet`, `touches(run)`, `outOfRange`/`note`.
- snapshot loop: `relevant = onlyRun !== null || run === current?.run || touches(run)`; route the four `snapshotGap` calls
  through `runGap = relevant ? snapshotGap : note`; store `relevant` on the collection.
- validateCollections: `if (!relevant) { note incomplete records; continue }`.
- authenticateOrigins: filter `declared` (both the endpoint and fallback sets) by `touches(mirrorRun)`.
- result JSON gains `outOfRange`; provenance md lists it. `archives` now lists only relevant runs (behavior change, no consumer
  depends on the count other than generated-review-inputs-r1.sh, which still passes).
Docs: skills/super-auto/SKILL.md:507 should say the operation validates run records the captured range touches (file, origin
sidecar, or reviews archive) and reports untouched historical gaps as informational.

Prototype regression results (copy of skills/ in scratchpad): tests/super-code/test-dispatch-text.sh pass;
tests/super-auto/test-scripts.sh all pass; current-review-selection.mjs 28/28; collection-origin-selection.mjs 52/52;
failed-assembly-archive.mjs 58/58; selection-recovery-correction.mjs 21/21; generated-review-inputs-r1.sh,
archive-integrity-r1.sh (15), collection-symlinks-r1.sh (32) pass.

## 4. Tests

Existing review-inputs coverage lives in tests/super-auto/{current-review-selection,collection-origin-selection,
failed-assembly-archive,selection-recovery-correction}.mjs and {generated-review-inputs-r1,archive-integrity-r1,
collection-symlinks-r1}.sh. None of these is invoked by any runner or by the CLAUDE.md release checklist (only
multi-source-correspondence.mjs is run from tests/super-auto/test-scripts.sh:12). tests/super-code/test-dispatch-text.sh has no
review-inputs case. Follow-up: wire them into test-scripts.sh (they all pass today).

Cases to add (scenarios.sh implements all; current vs prototype exits):
  A product-only range, untouched incomplete prior run            current 3, proto 0 (assert outOfRange non-empty, gaps [])
  B range edits the prior run.md                                  3 / 3
  C range edits a file under the prior run's reviews/ archive     3 / 3
  D range corrupts the prior run.md (malformed record)            3 / 3
  E range deletes the (corrupt) run.md                            3 / 3 (base-side gap)
  F broad range whose base predates the prior run (adds run.md)   3 / 3 (inherited gap kept)
Also worth adding: mirror sidecar changed while origin untouched (still authenticated); current run with incomplete history
untouched in range stays guarded (rule 1); untouched corrupt run.md outside range is informational only.

Caveat: an untouched run whose archive is byte-identical but was already corrupt at base stays unreported as a gap for that
range; it was not part of the range and the next range that touches it will hit the existing guards.
