## Task 20: Start Workflow without forbidden clock or random calls

**filesTouched:**
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-code/invocation-start-r1.mjs`
- `tests/super-code/replay-harness.mjs`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-step-back.md`
- `tests/super-code/replay-harness.mjs`
- `skills/super-code/scripts/dispatch-text.mjs`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-1-ground/repro.mjs`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1-stages/judge-1-ground/repro-runtime-result.json`

**Bead:** super-plan-ufz.23. **Surface:** 248550 tokens at the integration base.

**Scope:** Obtain invocation identity through the existing Workflow-safe caller/argument or dispatched-mechanical boundary: omitted IDs are minted externally by the existing read-ledger Resume dispatch, returned as structured invocationId, validated and persisted by the existing awaited Launch append before review output. Preserve distinct invocation identities, explicit unsettled resume and the supported omitted-ID startup path without Date.now or Math.random inside a Workflow script.

### Covered findings (verbatim)

- [Blocking] skills/super-code/coordinator.js:25

### Acceptance (verbatim)

- [ ] With Date.now and Math.random throwing inside a Workflow-like VM, omitted invocationId starts, logs and reaches the existing Resume dispatch. That dispatch mints externally and returns a safe identity; the existing awaited Launch append persists exactly it before review output. No additional dispatch is introduced.
- [ ] Explicit invocationId remains unchanged; explicit unsettled resume reuses it. Two fresh omitted-ID launches sharing runTag and prior-ledger contents consume different boundary tokens and produce distinct single/split review identities. Existing preservation and reviewPath/null semantics remain covered.
- [ ] Missing or unsafe acquired identity fails visibly without a fabricated Launch or artifact write. Unconfirmed Launch persistence continues to suppress review assembly/writers. Existing ledger retry behavior preserves a selected valid identity or reports its absence explicitly.
- [ ] Caller/ordinary-subagent instructions state exactly where fresh IDs are minted and passed, distinguish fresh launch from explicit unsettled resume, and retain both execution paths. The enclosing coordinator owns the bounded changed-instruction evaluation and records it pending until measured.
- [ ] Run `node tests/super-code/invocation-start-r1.mjs` and `node tests/super-code/replay-harness.mjs`. The replay is unchanged except the named omitted-ID fixture response and strengthened assertions below. All other scenarios/assertions remain intact. Immutable source/resume binding remains Task 26 / .29; root sweep and human acceptance remain caller-owned.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Create tests/super-code/invocation-start-r1.mjs around the real coordinator builder in a Workflow-like sandbox where Date.now and Math.random throw. Exercise omitted invocationId through the documented supported startup path and an explicit ID. Assert execution reaches logging and dispatch; capture two fresh launches and verify their review destinations differ. Run the fixture to expose the current top-level identity expression.

2. Use the existing read-ledger mechanical Resume agent as the omitted-ID acquisition boundary: it executes the documented uuidgen command outside the Workflow VM and returns inv-<uuid> in structured invocationId. Extend its request/schema and validate the returned identity before constructing Launch; explicit arguments never trigger minting. Missing/unsafe acquired identity fails visibly before Launch or artifact authorization and never borrows a previous Launch identity. Preserve a selected valid identity through existing ledger-read retry/result reconstruction; reuse Workflow-recorded results on replay. Explicit unsettled resume passes its persisted token; settled relaunch acquires a fresh token. Keep successful startup to exactly read-ledger then ledger-append:launch; no added agents, runtime-global escape or extra dispatch. Preserve the focused fixture's forbidden Date.now/Math.random, distinct fresh identities, explicit identity/resume, missing identity, unsafe identity and persistence-gap coverage; also cover unsafe mechanically returned identity and changed retry transport. Do not conflate invocation identity with its separately owned captured source binding.

3. Update coordinator-workflow.md and coordinator-subagents.md only where needed to state exactly which existing caller boundary mints the ID, how it is passed, and how unsettled resume reuses it. Retain both execution paths. Use superpowers:writing-skills for changed operative instructions; the coordinator owns fresh-agent changed-instruction evaluation and records it as pending until measured.

4. Named test defect and amendment: In `tests/super-code/replay-harness.mjs`, only the omitted-ID tail of scenario `invocation review bundles: shared runTag, split/stub retention and explicit resume` (assessment lines 1603–1607) lacks the deterministic boundary output required for a fresh invocation. Keep `liveArgs({ runTag: 'shared-run', invocationId: undefined })` and prior-ledger text `Launch: args {"runTag":"shared-run","invocationId":"inv-first"}`. Extend that case's `read-ledger` canned output with structured `invocationId: 'inv-fresh-a'`; run a second omitted-ID launch with identical runTag/old ledger text and `invocationId: 'inv-fresh-b'`. Adjust only those cases' existing assembler/reviewer canned paths consistently with their expected token where required. Retain inequalities and strengthen assertions: both launches succeed, persisted Launch tokens equal the respective supplied tokens, emitted review/assembly destinations differ and use those tokens, and neither token copies inv-first or shared-run. Assert Resume requests minting only for omission and requests the structured identity field before the acknowledged Launch append. Keep explicit single/split/stub retention, explicit resume, unsafe-token, failed-persistence and reviewPath/null tests intact. No unrelated scenario/assertion, runtime stub, global default or dispatch-count change is authorized. The deterministic tokens represent external mint operations; no runtime bypass, random generation inside the replayed script, hidden harness fallback or identity-only dispatch is permitted.

5. Run node tests/super-code/invocation-start-r1.mjs and node tests/super-code/replay-harness.mjs with only the named fixture amendment above. Deliverable: supported startup survives forbidden clock/random globals and fresh invocations retain distinct safe identities; Task 26/.29 independently owns immutable source/resume binding.

**Boundary:** No added agents, roles, replacement engine or unrelated repairs. The spec's Goal and run.md are not edited. Historical evidence remains immutable except the specifically named retention restoration or claim qualification. Keep the rejected measurement-classification and direct frozen-Git fallback materiality findings rejected. Caller-owned final sweep, changed-instruction evaluation, independent review coverage and root/human acceptance remain pending; this task cannot close the root.


## Fix-pass scope and acceptance amendment

Fix-pass scope amendment (authorized coordinator direction; task-20-review.md NEEDS_FIX and startup-builder-seam-assessment-r1.md): additionally own skills/super-code/scripts/dispatch-text.mjs and tests/super-code/startup-builder-seam-r1.mjs. Separate internal builder initialization from operational Resume/Launch, forward the selected last Launch safe persisted invocationId to every builder mode, and preserve identity-free legacy non-review rendering without minting or fabricated identity. Preserve real Workflow missing/unsafe-ID failure and awaited persistence, .29 immutable source-binding guards, strict persisted review identity/override equality, ordinary review paths and deterministic runtime. Verify actual ordinary dispatch suite, focused combined loader matrix, startup, replay and source-binding fixtures on the rebased integrated source. Preserve prior evidence; changed-instruction evaluation/root sweep/human acceptance remain caller-owned and pending. No other task/status/Goal/run.md/ledger/dependency changes.
