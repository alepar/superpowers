## Verdict

amend-fixture

The real startup defect is confirmed. A bounded repair can keep omitted `args.invocationId` supported by minting the token outside the Workflow script in its existing Resume mechanical dispatch, returning it as structured output, validating it, and awaiting the existing Launch append before review output. The replay must supply that newly required boundary output. Keeping the current omitted-ID canned response literally unchanged while also requiring fresh identities from identical deterministic inputs is not a sound acceptance contract.

## Recommendation

Authorize one named fixture amendment in `tests/super-code/replay-harness.mjs`: only the omitted-ID tail of scenario **`invocation review bundles: shared runTag, split/stub retention and explicit resume`**, currently lines 1603–1607. Add this file to task .23's allowed files for that amendment; do not alter unrelated scenarios, runtime stubs, global defaults, dispatch counts, or assertions.

Keep `liveArgs({ runTag: 'shared-run', invocationId: undefined })` and the ledger text naming the previous `inv-first` invocation. Add an explicit new structured field to that case's `read-ledger` canned output:

```js
'read-ledger': {
  text: 'Launch: args {"runTag":"shared-run","invocationId":"inv-first"}',
  invocationId: 'inv-fresh-a'
}
```

Run a second omitted-ID launch with the same runTag and same old ledger text, but boundary output `invocationId: 'inv-fresh-b'`. These are fixed deterministic test tokens representing two external mint operations; do not generate randomness inside the replayed script or inject a hidden fallback into the harness. Supply each case's existing assembler/reviewer canned paths consistently with its expected token where needed.

Retain the existing inequality checks and strengthen them: both runs must succeed, their persisted Launch tokens must exactly equal their respective supplied fresh tokens, and their emitted review/assembly destinations must differ and use those tokens. Neither may copy `inv-first` or `shared-run`. Assert the Resume request asks for minting only when the argument is omitted, requests the structured identity field, and precedes the existing acknowledged Launch write; no added identity-only dispatch is permitted. Leave the existing explicit single/split/stub retention, explicit resume, unsafe-token, failed-persistence and reviewPath/null tests intact.

For production, use the existing `read-ledger` mechanical agent as the omitted-ID acquisition boundary (the plan explicitly permits a dispatched-mechanical boundary). That agent executes the documented `uuidgen` command outside the Workflow VM and returns `inv-<uuid>` in structured `invocationId`. Extend its request/schema and consume the returned field before constructing Launch. An explicit argument retains its value and must not trigger minting. Missing/unsafe identity must fail visibly before Launch/artifact authorization; it must not borrow the prior Launch identity. Preserve a valid identity through any existing ledger-read retry/result reconstruction: the current retry-combination object at coordinator.js:218–223 drops arbitrary added fields. Reuse the Workflow-recorded result on replay; callers explicitly resuming an unsettled invocation continue passing its persisted token. A settled relaunch acquires a fresh token.

The new `tests/super-code/invocation-start-r1.mjs` already models this approach and constrains successful startup to exactly `read-ledger` then `ledger-append:launch`. Keep its forbidden Date.now/Math.random environment, distinct fresh identities, explicit identity/resume, missing identity, unsafe identity and persistence-gap coverage. Also cover unsafe mechanically returned identity and any changed retry transport so neither can authorize artifacts. No engine replacement, added agent, runtime-global escape, extra dispatch, source-binding fix or spec change is needed.

Replace task .23 / Task 20 acceptance with:

1. With Date.now and Math.random throwing inside a Workflow-like VM, omitted invocationId starts, logs and reaches the existing Resume dispatch. That dispatch mints externally and returns a safe identity; the existing awaited Launch append persists exactly it before review output. No additional dispatch is introduced.
2. Explicit invocationId remains unchanged; explicit unsettled resume reuses it. Two fresh omitted-ID launches sharing runTag and prior-ledger contents consume different boundary tokens and produce distinct single/split review identities. Existing preservation and reviewPath/null semantics remain covered.
3. Missing or unsafe acquired identity fails visibly without a fabricated Launch or artifact write. Unconfirmed Launch persistence continues to suppress review assembly/writers. Existing ledger retry behavior preserves a selected valid identity or reports its absence explicitly.
4. Caller/ordinary-subagent instructions state exactly where fresh IDs are minted and passed, distinguish fresh launch from explicit unsettled resume, and retain both execution paths. The enclosing coordinator owns the bounded changed-instruction evaluation and records it pending until measured.
5. Run `node tests/super-code/invocation-start-r1.mjs` and `node tests/super-code/replay-harness.mjs`. The replay is unchanged **except the named omitted-ID fixture response and strengthened assertions above**. All other scenarios/assertions remain intact. Immutable source/resume binding remains Task 26 / .29; root sweep and human acceptance remain caller-owned.

This changes the test double to represent the new, legitimate boundary output. It does not waive omitted-ID startup or distinct-invocation semantics. The parent should amend task/plan scope explicitly before authorizing implementation; this assessment itself changes neither.

## Evidence

- `bd show super-plan-ufz.23` and `.superpowers/sdd/super-plan-ufz-plan/super-plan-ufz-plan.md`, Task 20, require omitted-ID support, forbidden-clock/random startup, distinct invocation artifacts and unchanged replay. Task 20 implementation step 2 expressly allows acquisition at an existing caller/argument **or dispatched-mechanical** boundary. Its allowed files omit the replay harness, so an explicit narrow authorization adjustment is needed.
- Root spec `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, §Scope and approach and §4, permits simpler mechanisms preserving observable guarantees and requires unique invocation artifacts. Nested spec `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`, §Chosen contract and §Acceptance, requires distinct invocation identity persisted in the existing launch record before review output, including two invocations sharing runTag. Neither spec mandates random generation inside Workflow or byte-for-byte preservation of a canned reply.
- Round-1 roast `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-1.md`, finding `[Blocking] skills/super-code/coordinator.js:25`, identifies the supported omission failure. Its retained `...-stages/judge-1-ground/repro.mjs` freezes the VM globals; `repro-runtime-result.json` records the base logging successfully and head throwing before any log. The reproduction executes a source prefix, not a full live Workflow. The roast correctly notes documented dryRun examples already supply IDs.
- Current `skills/super-code/coordinator.js:25` evaluates Date.now/Math.random before its first log. Startup already performs `readLedger('read-ledger', 'Resume', true)` at line 730, then constructs and awaits Launch at lines 736–738. `LEDGER_TEXT` at line 380 currently has no identity field; `readLedgerPrompt` at lines 2835–2842 requests digest/Git facts only. Launch acknowledgment returns only `appended`, too late and insufficient to supply the identity embedded in its own requested line.
- `tests/super-code/replay-harness.mjs:303–340` defaults ordinary live cases to explicit invocationId, making the omission defect localized. Its sole explicit omitted-ID case at lines 1603–1607 supplies only prior Launch text and expects a fresh token before the Launch append. Its runtime at lines 176–182 exposes no run-ID API: `workflow()` throws. No deterministic runtime identity facility appears in the inspected coordinator contract/source.
- Deriving `inv-first-next`, a hash, or a ledger count can satisfy the current weak inequality once, but identical args/canned observations deterministically repeat it across fresh launches. It therefore fails the actual distinct-invocation invariant. Real `skills/super-code/scripts/ledger-digest:19` also drops Launch lines, so this fixture's old Launch text is not an authoritative allocation counter. Mutable in-process counters, caller-omission prohibition, stable epic/runTag IDs, unsandboxed global access and extra identity dispatches do not meet the stated boundary.
- `coordinator-workflow.md:70–78` supports omission and already documents caller-side `inv-$(uuidgen)`; `coordinator-subagents.md:152–166` already uses that external minting convention and acknowledged Launch persistence. Extending the existing Workflow Resume mechanical request follows that established boundary.
- Task worktree `.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.23` has only untracked `tests/super-code/invocation-start-r1.mjs`; its coordinator diff is empty. The focused fixture simulates an external uuidgen call and expects an identity-bearing Resume result. No product implementation is present to validate.

## Limits

Read-only source/evidence assessment only; no tests, source/spec/fixture edits, bead changes or Herdr mutations were performed. The report is the only write. I did not re-run historical reproductions or assert a live Workflow result. Absence of a runtime ID API is bounded to the supplied/inspected contracts and replay, not a claim about every possible future runtime. A newly proven, documented, replay-stable runtime identity API would warrant reconsideration; none is evidenced here.

The fixture amendment and production repair remain proposed, and task .23 is not accepted. Fresh-agent instruction evaluation, broader integration verification, immutable source binding, the rejected measurement-classification/direct frozen-Git fallback findings, and caller-owned final/root acceptance retain their existing ownership and status.
