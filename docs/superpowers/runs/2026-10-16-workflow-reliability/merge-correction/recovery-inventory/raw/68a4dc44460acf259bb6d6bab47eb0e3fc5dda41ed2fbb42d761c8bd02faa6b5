## Task 18: Classify resume-check dispatch in run profile

**filesTouched:**
- `skills/super-code/scripts/run-profile.mjs`
- `tests/super-code/test-run-profile.sh`

**filesToRead:**
- `skills/super-code/coordinator.js`
- `skills/super-code/scripts/run-profile`
- `tests/super-code/run-profile-fixture.mjs`
- `tests/super-code/run-profile-ordinary-fixture.mjs`
- `tests/super-code/test-run-profile-in-flight.sh`
- `tests/super-code/fixtures/run-profile/chain.json`
- `tests/super-code/fixtures/run-profile/ordinary.json`
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`

**Bead:** super-plan-ufz.20. **Surface:** 130756 tokens at integration base `7a030486713f985ba8d02cc57c542f9d333756b8`. Read the classifier, ordinary label decoding, actual resume dispatch/prompt, and named fixture neighborhoods. This is the single integration fix discovered by super-plan-ufz.14, not a replan of earlier work.

**Failure and interfaces:** `test-run-profile.sh` lines 331–337 enumerate literal coordinator dispatch label kinds and require a matching classifier `case`. The observed failure is `resume-check` missing. Keep that valid assertion unchanged. The Resume phase in `coordinator.js` dispatches `resume-check:<id>` before admission to reconcile pending-closure obligations. `resumeCheckPrompt(record, required)`, including its verification-only branch, only observes exact Git source/landing and tracker status and forbids implementation, review, merge, closure and cleanup. This belongs to the existing run-level `ready` stage. The ID identifies the observed obligation; it must not produce a new implementation attempt or occupy a task slot. Extend `stageOf` and `RUN_KINDS`; preserve `parseLabel`, `BEAD_KINDS`, `IN_SLOT`, other categories and output schemas. Existing fixture builders already support arbitrary labels and need no changes.

### Acceptance (bead text verbatim)

Done when: the profiler classifies the actual resume-check dispatch consistently with its resume/readiness observation role, existing run-profile and in-flight suites pass, and other labels/populations are unchanged. Add only a focused meaningful regression if existing label coverage does not exercise semantics.

Historical fixtures remain byte-for-byte. Parent final sweep and behavior evidence remain pending. No real epic acceptance.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Read the exact failing assertion and actual `resumeCheckPrompt` before editing. Run `bash tests/super-code/test-run-profile.sh` and retain the existing `coordinator label kinds are all classified (missing: resume-check)` failure. Its source-string coverage does not exercise semantics, so a focused behavioral regression is necessary. Integration replay was reported 2273/0; this task does not rerun replay or weaken acceptance to accommodate a missing category.
2. Add the following focused temporary variants beside the label-coverage check in `test-run-profile.sh`. The suite already creates `$T/chain-p.json`, `$T/ox.json` and `$T/oc.json` as unchanged baselines. Keep fixture files/builders unmodified; construct scenarios in `$T` only:

```bash
node - "$FX" "$T" <<'JS'
const fs = require('node:fs'), [FX, T] = process.argv.slice(2)
const workflow = JSON.parse(fs.readFileSync(`${FX}/chain.json`, 'utf8'))
const observation = workflow.agents.find(a => a.label === 'bd-ready')
observation.label = 'resume-check:ep.1'
observation.phase = 'Resume'
observation.result = { landed: true, sourceVerified: false, closed: ['ep.1'], open: [] }
fs.writeFileSync(`${T}/resume-label-workflow.json`, JSON.stringify(workflow))
const ordinary = JSON.parse(fs.readFileSync(`${FX}/ordinary.json`, 'utf8'))
ordinary.agents.push({ codex: 'resume_check_cx_1', label: 'resume-check:cx.1', start: 0, end: 10 })
fs.writeFileSync(`${T}/resume-label-ordinary.json`, JSON.stringify(ordinary))
JS
node "$BUILD" "$T/resume-label-workflow.json" "$T/resume-label-workflow"
run bash "$P" --workflow "$T/resume-label-workflow" --out "$T/resume-label-w"
assert_eq "$code" 0 "resume observation Workflow profile exits 0"
assert_eq "$(q "$T/resume-label-w.json" "JSON.stringify(d.criticalPath.segments.filter(s => s.label === 'resume-check:ep.1').map(s => [s.kind,s.bead,s.ms]))")" '[["ready",null,10000]]' "resume observation is run-level ready time"
assert_eq "$(q "$T/resume-label-w.json" "JSON.stringify(d.beads)")" "$(q "$T/chain-p.json" "JSON.stringify(d.beads)")" "resume observation creates no task attempt or task timing"
assert_eq "$(q "$T/resume-label-w.json" "JSON.stringify(d.taskSlots)")" "$(q "$T/chain-p.json" "JSON.stringify(d.taskSlots)")" "resume observation uses no task slot"
RC=$(node "$ORD" "$T/resume-label-ordinary.json" codex "$T/resume-label-codex")
run bash "$P" --codex "$RC" --codex-home "$T/resume-label-codex/codex" --ledger "$T/resume-label-codex/progress.md" --beads "$T/resume-label-codex/beads.json" --out "$T/resume-label-x"
assert_eq "$code" 0 "resume observation Codex profile exits 0"
RS=$(node "$ORD" "$T/resume-label-ordinary.json" claude "$T/resume-label-claude")
run bash "$P" --subagents "$RS" --ledger "$T/resume-label-claude/progress.md" --beads "$T/resume-label-claude/beads.json" --out "$T/resume-label-c"
assert_eq "$code" 0 "resume observation Claude profile exits 0"
for pair in 'x ox' 'c oc'; do
  read -r variant baseline <<< "$pair"
  assert_eq "$(q "$T/resume-label-$variant.json" "JSON.stringify(d.concurrency.kinds.filter(k => k.kind === 'resume-check').map(k => [k.mapped,k.n,k.ms]))")" '[[true,1,10000]]' "ordinary resume observation is mapped ($variant)"
  assert_eq "$(q "$T/resume-label-$variant.json" "JSON.stringify(d.beads)")" "$(q "$T/$baseline.json" "JSON.stringify(d.beads)")" "ordinary resume observation preserves bead population and attempts ($variant)"
  assert_eq "$(q "$T/resume-label-$variant.json" "JSON.stringify(d.taskSlots)")" "$(q "$T/$baseline.json" "JSON.stringify(d.taskSlots)")" "ordinary resume observation preserves task slots ($variant)"
done
```

Run the suite and observe the new semantic assertions failing on the current classifier. These cover category, both ordinary decoders and task populations; do not substitute assertions that merely search for implementation strings.
3. Apply the smallest classifier change in `run-profile.mjs`:

```js
// Extend only stageOf's existing ready case group:
case 'bd-ready': case 'bd-ready-topup': case 'bd-ready-recheck': case 'blocker-check': case 'close-epics': case 'resume-check': return 'ready'
```

Add `'resume-check'` once to the existing `RUN_KINDS` array. Keep it out of `BEAD_KINDS` and `IN_SLOT`. The ordinary decoder should recognize `resume_check_cx_1` with `kind: resume-check`, `bead: null`, and the obligation identifier as the run-level suffix. Do not alter coordinator semantics, timing bounds, behavior prose, acceptance gates or unrelated tests.
4. Run the current profiler checks and retain actual results:

```bash
bash tests/super-code/test-run-profile.sh
bash tests/super-code/test-run-profile-in-flight.sh
node --check skills/super-code/scripts/run-profile.mjs
```

All existing historical expectations and the exact original label-coverage assertion must pass unchanged. The in-flight suite keeps its existing unfinished-dispatch and truthful-age behavior. Review the diff to ensure only the two declared files changed and fixture files remain byte-for-byte. Report the fix and evidence to the coordinator. The genuine graph edge `.14` blocked-by `.20` means the held integration profiler check consumes this correction; do not stop or reorder `.14`'s unaffected suites. Root acceptance and the broader final sweep remain coordinator-owned.

**Independently testable deliverable:** Resume-check becomes mapped run-level `ready` work, adds no implementation attempt or task-slot occupancy, and both existing profiler suites pass with historical labels/populations retained.
