# Task 4 implementation and verification

Status: owned implementation committed as **480f7a23e515bfb8d593d65775f2202086fdc1f6**, with test-only follow-up **c2c05d28480902f4426c4d6adfc680508415d4b2** (below), `fix(review): preserve bounded source review through provenance gaps`; parent **583f2486ebe6b00a5c6fe3b87bc3d5b98ed53533**. Commit tree **20d77f055078e9190ea8586ff4d434d45a4c3351**. Fresh independent review and prospective behavior evaluation remain parent-owned. This report does not establish whole-range review, live Workflow coverage, root acceptance or merge readiness.

Worktree: `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers`, branch `super-auto/workflow-reliability`. Read the Task 4 brief, Task 2/3 reports including their R1 corrections, the full independent policy review and approved design. Applied systematic-debugging, test-driven-development/writing-good-tests, writing-skills and verification-before-completion guidance. Parent had completed the prospective baseline subjects before instruction edits; no duplicate agents or behavior evaluations were launched.

## Scope and implementation

Only ten owned source/contracts/tests are committed:

- `skills/super-code/scripts/dispatch-text.mjs`
- `skills/super-code/coordinator.js` (final selection/fallback and finalReviewPrompt only)
- `skills/super-code/assembler-prompt.md`
- `skills/super-code/coordinator-subagents.md`
- `skills/super-auto/SKILL.md`
- `skills/super-auto/run-state.md`
- `skills/super-auto/resume.md`
- `skills/super-design/SKILL.md` (narrow Run-State producer/handoff contract only)
- `tests/super-auto/selection-recovery-correction.mjs`
- `tests/super-code/replay-harness.mjs` (one final-review scenario)

No scheduler/shared admission helper, Task 2 collector, Task 3 acceptance implementation, scout findings identity/lineage/dissolution/ledger semantics, tracker, main, Herdr state, installed skill, root gate or original report was changed. Parent plan/run.md changes and large untracked evidence remained unstaged. No push, release, external filing or waiver.

The selector still scans captured run records, records every invalid omission claim, returns exit 3/status unavailable on provenance gaps, selects the complete changed-path inventory, and omits zero paths on refusal. It now distinguishes independently available captured source with `sourceAvailable:true` and always records `wholeRangeReady:false`; selection is never a review verdict. There are no directory-name exclusions and no mutable-checkout fallback. Missing Git identities, extraction failures and existing-output guards still refuse their respective operation.

History replay mirrors Task 2's preserved recovery: the exact parsed predecessor object is SHA-256 hashed before any line metadata is added. The referenced valid record must already exist, be settled/null, match invocation/workspace/ordered required inputs and original verdict, and immediately precede the first transition. Expected final-report path, settled state and stable recovered verdict/metadata are checked. Markers are mandatory on the first transition and all subsequent snapshots, including when omitted. A hash-linked invalid `complete:true` null predecessor is rejected. Original events and saved-hash conflict checks remain intact; arbitrary replacement gains no omission authority.

The assembler exposes a bounded fallback only for the typed cause `review input selection: provenance unavailable; captured source available`, supported by its unchanged sidecar. Other selection/source/write refusals remain unavailable. Workflow and ordinary single-review prompts inspect named paths/hunks from the captured pair, keep the full inventory and original gaps, and use a new guarded `dispatch-text bounded-review` writer. Workflow also forces its returned verdict to not-ready if a synthetic reviewer returns ready.

The bounded writer requires an existing immutable invocation binding, verifies both commits and the complete captured changed-path inventory, refuses omissions/source mismatch/unknown hunks/existing outputs, and preserves the raw draft. It checks actual declared hunk headers against Git and writes a new expected `final-review-ID.md` exclusively. The report retains every draft finding, adds whole-epic untested scope, forces `not ready (unreviewed: whole-epic coverage and omission provenance remain incomplete)`, and records base/head, complete inventory, inspected hunks, unreviewed paths, all original gaps, and exact selection/draft/coverage hashes. The existing strict extractor/collector can consume it without parser or collector changes.

The draft and coverage JSON live as new files inside the existing invocation `assembled/final-review-ID-final/` directory, so ordinary bundle discovery preserves them without changing the prelaunch required array. The original failed sidecar/outputs are not overwritten. A newly partial review uses its own invocation/artifact; the old unavailable invocation is not relabeled. Collection completeness remains byte preservation, not review coverage.

Caller contracts now retain the entire actual settled design/code producer input list in `roast-design`/`roast-code`, including earlier/amend/keys-only/recognized-empty inputs. Both ledgers must reconcile against those declarations. The exact Task 3 source-correspondence schema, one-source physical key-line mappings, both artifact hashes, evidence-backed completeness, identical-copy rules and constrained legacy-adapter interpretation fields are documented in run-state.md. Missing/unknown populations remain gaps. Key membership is transport consistency only, never occurrence identity, linking or disposition.

## RED and GREEN

Initial focused RED at base 583f2486: `node tests/super-auto/selection-recovery-correction.mjs > /tmp/workflow-task4-red.log 2>&1`, exit 1, **8 passed / 4 failed**. It reproduced rejection of actual collector-generated valid recovery, absence of source availability on nested historical provenance, absence of the bounded writer, and the ordinary prompt's hard provenance refusal. Initial negative guard checks could also fail because the command was absent; final controls run against the real implemented writer, with the prior output removed after its preservation check so validation cannot be masked by an existing-file refusal.

Workflow RED: `node tests/super-code/replay-harness.mjs > /tmp/workflow-task4-replay-red.log 2>&1`, exit 1, **2397 passed / 3 failed**, exactly bounded dispatch, synthetic-ready forced incompleteness, and bounded-writer prompt. The source/write refusal control passed.

Additional predecessor RED: `TEST_FILTER='invalid complete null predecessor' node tests/super-auto/selection-recovery-correction.mjs > /tmp/workflow-task4-invalid-predecessor-red.log 2>&1`, exit 1, **0 passed / 1 failed**. A forged complete null event with a recomputed, internally consistent predecessor hash incorrectly returned selector exit 0 before the complete-field validation was added.

Actual-range refresh then exposed a second concrete availability failure: redundant full-range diffstat argv hit `spawnSync git E2BIG`. The narrow fix omits path argv when there are zero omissions, because the full range is already the exact selection. `TEST_FILTER='large captured range' KEEP_FIXTURES=1 node tests/super-auto/selection-recovery-correction.mjs > /tmp/workflow-task4-large-red.log 2>&1` reproduced exit 1 / `sourceAvailable:false` with the E2BIG gap. The fixture derives its size from host `getconf ARG_MAX`; here ARG_MAX=1048576, 1507 real files under a 723-byte path prefix. A first fixture attempt exceeded macOS PATH_MAX and was corrected before the meaningful E2BIG RED; that setup error is not counted as regression evidence.

Final focused GREEN: `KEEP_FIXTURES=1 node tests/super-auto/selection-recovery-correction.mjs > /tmp/workflow-task4-final-selection-identities.log 2>&1`, exit 0, **21 passed / 0 failed**, with exact implementation hashes embedded in stdout. Retained fixture root `/var/folders/d3/rsgv6zk54y5dd7137_cmcc100000gn/T/selection-correction-Kr1L5z`. Captured bounded range `ac5419abcb7ec854718f01c68059b5995fe4b32c..896f1aca1e168f5ce550e3d2f80be196506c8c7e`; the later wide-range fixture head is `fdf0dd69461a5087dc20e15c6c4d80298fdd95fd`.

Controls include actual collector null settlement/recovery captured into Git; all/final stripped markers; forged predecessor/verdict/required inputs/path; malformed complete predecessor; copied nested run.md without its archive; zero unsupported omissions; strict report extraction preserving the concrete finding and untested scope; prelaunch `required:[]` followed by final/draft/coverage archival with unchanged bytes; ordinary status; acceptance pending despite a synthetic passing live suite and human decision; source mismatch, missing Git object, claimed omission, incomplete inventory, unknown hunk and existing-output preservation; and ordinary prompt generation. Explicit relevance controls avoid passing acceptance merely because unrelated prerequisite fields were missing.

Earlier intermediate integration runs caught fixture mistakes (ordinary status flags lacked `=`, then the gate fixture omitted measurement/human requirements) and a source-binding-order mistake after placing outputs under the real assembled directory. These were corrected to real producer contracts; `/tmp/workflow-task4-green-first.log`, `green-second.log` and the overwritten intermediate `final-selection.log` names do not replace the final GREEN evidence above.

Affected existing checks:

- Workflow replay: `/tmp/workflow-task4-replay-green.log`, exit 0, **2400 passed / 0 failed**. This preceded the subsequent prompt ancillary-path adjustment and selector predecessor/E2BIG refinements; it is not restamped as a full final-source sweep.
- Captured Git/generated-input protections: `/tmp/workflow-task4-generated-inputs-green.log`, exit 0. Repeated collection/re-entry, exact verified claims, immutable archives, checkout advance, unusual path names, deleted/corrupted claims and ordinary archive-shaped content remain covered. This ran before the final predecessor/E2BIG refinements.
- Ordinary dispatch: `/tmp/workflow-task4-dispatch-final.log`, exit 0, all tests passed. Initial check caught option-object parity and the new command's help error contract; both were corrected. Final run includes the ancillary-path adjustment but predates the final selector-only predicate/E2BIG change.
- Final `node --check` on selector and new test, plus staged `git diff --check`: exit 0.
- The single host-derived large-range scenario's postcommit timing is retained at `/tmp/workflow-task4-large-timing.log`; no broad corpus or repository suite rerun was launched.

## Actual captured-range refresh and old evidence

Failed pre-fix actual refresh is retained at `/var/folders/d3/rsgv6zk54y5dd7137_cmcc100000gn/T/task4-actual-selection-taqmdwz7/receipt.json`: base `832b051c870ae5c69adfa7f14d770292ab6c1a81`, head `583f2486ebe6b00a5c6fe3b87bc3d5b98ed53533`, **8469 paths, 708 gaps, zero omissions, sourceAvailable:false**, including E2BIG. This is separate from the historical original 690-gap invocation.

Committed-source refresh receipts are at `/var/folders/d3/rsgv6zk54y5dd7137_cmcc100000gn/T/task4-refreshed-selection-_d5fzpnr/receipt.json`:

- Exact same prior range: **8469 paths, 707 provenance gaps, zero omissions, status unavailable, sourceAvailable:true**, exit 3. Only the E2BIG extraction gap disappears from this comparison.
- Original pinned product base `d84541ae20a97f3a4a28aa6b1d3d2043c3de1bb5` to Task 4 commit `480f7a23e515bfb8d593d65775f2202086fdc1f6`: **8725 paths, 707 provenance gaps, zero omissions, status unavailable, sourceAvailable:true**, exit 3. This establishes availability for a new bounded review, not validated archive authority or completed actual review.

Original `.superpowers/sdd/super-plan-ufz-plan/assembled/final-review-inv-c96916a964634bb0bb5f2bd3b8e1769b-final/review-inputs.json` remains byte-identical, with all **690 original gaps**, original `d84541ae..ee275436bc69c3dd77cf1753399e0f93b44f2cff` identity and SHA-256 **c838e1390ca298afea5a1d8d5e4f5b2b6a74ab696ba8768d7e7780f39ff4707e**. Neither original failed artifact nor original source identity was restamped.

## Source identities and remaining limits

`/tmp/workflow-task4-source-identities.json` binds all ten files. Precommit and postcommit file hashes match. Key SHA-256 values:

- dispatch-text.mjs: `f669b649ed115d8f92fac6cd46c025722c1b206841df084f4a3a633ad4ffe087`
- coordinator.js: `9d12dd0c8d50f93b51bb486e1af9a7d65c6a642de0e9d4c500775620e18d3fb8`
- selection-recovery-correction.mjs: `f9bf48d00df117219e056a76746dd14a63ed082120531aac05d3bed2d9a89a46`
- replay-harness.mjs: `d75451549811e819b3fbb261178171b08441d5dc35c7703760e8142ea5ddf4d9`

All changed operative instruction surfaces are named in the ten-file list above. The added full `skills/super-design/SKILL.md` Run-State clarification requires the parent's supplemental after-only packet; no nonexistent before coverage is claimed for that guide. Prompt/string tests are mechanical integration checks, not proof of agent behavior.

The bounded writer validates declared textual hunk coverage against captured Git; it cannot prove a reviewer actually reasoned over those hunks. A binary-only change with no textual hunk is not admitted as inspected by this narrow schema and remains unreviewed. Full inventories/provenance remain external evidence for a large range; the reviewer must inspect a bounded subset. New ancestor/path concurrency attacks are not claimed covered by this patch. Existing archive ownership and sole-producer expectations remain in force.

No new actual bounded independent review was fabricated by this implementer; fresh scoped policy/spec/quality review belongs to the parent. Historical gaps, omitted live measurements, unavailable original review results and human gates remain pending. The parent also owns Task 5/6 corrections, behavior evaluations and final acceptance accounting.

## Postcommit fixture teardown correction

The requested single-case runtime check at `/tmp/workflow-task4-large-timing.log` passed its
product assertion but exited 1 during fixture teardown: `rmSync` returned ENOTEMPTY and the
remaining file was `repo/.git/objects/info/packs`. Git auto-maintenance was still writing into
the fixture after its last commit. This command is **not** passing evidence.

The test Git wrapper now supplies `-c maintenance.auto=false -c gc.auto=0` for its own fixture
commands, avoiding background maintenance without changing user/repository configuration.
Only that test-line correction was committed as **c2c05d28480902f4426c4d6adfc680508415d4b2**,
`test(review): disable fixture background maintenance`, parent 480f7a23.

`TEST_FILTER='large captured range' /usr/bin/time -p node tests/super-auto/selection-recovery-correction.mjs`
then exited 0 at `/tmp/workflow-task4-large-timing-corrected.log`: **1 passed / 0 failed**,
**2.07 seconds real**, 0.63 user, 1.41 system; 1507 files, host ARG_MAX 1048576, 723-byte prefix.
The default teardown completed and removed the temporary fixture. No full suite rerun was needed
for this test-only control. Source implementation hashes and actual selection receipts above
remain bound to 480f7a23; they are not relabeled onto this later tree.

Final test SHA-256: `d46d2814f4c332d7d25bac5393738f7fc6b52244c74bfe04d36593408cb10e7d`.
Staged names/whitespace were checked; parent plan/run/evidence remained unstaged.
