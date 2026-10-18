# Bounded final fix wave report

## Source and scope

- Exact implementation BASE: `9e4e057136d449348135bfc18d1f084cb6e4c303` (Task 6 reviewed metrics/settlement contracts).
- Commit/HEAD: `4911223a98c2abd1ac1060e644053bf99ed7da0d` — `fix: preserve recovery admission and final review acceptance contracts`.
- Committed tree: `9d74c04d6a465e02439dc08e2076395d8e791583`.
- Checkout: `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers`.
- Complete owned diff: `/private/tmp/ufz-correction-final-fix-wave.diff`.
- Per-file committed Git blob IDs, SHA-256, byte counts, and unchanged-guide comparisons: `/private/tmp/ufz-correction-final-fix-wave-logs/committed-source-identities.json`.
- The four source reports remain pinned to `7b18b0c26b9f19d531c558e112d490743901a13b`, not this repair. They were read in full: runtime-review.md, source-review-report.md, harness-review.md, acceptance-review.md under `/private/tmp/ufz-correction-final-source-review`. Approved spec, corrective plan, brief, and their Global Constraints were read. This is the one authorized whole-branch final wave; original policy, counters/caps and earlier evidence identities are unchanged.
- Eleven owned files committed, listed below. Parent-owned plan/spec/run edits and untracked evidence remain unstaged. No main edits, tracker/Herdr mutations, subagents, external filings, push or release occurred. No profile or metrics producer contract was edited.

## Finding dispositions

| Original finding | Disposition and concrete correction | Verification |
| --- | --- | --- |
| Runtime R1 — Invalid compact Recovery records lose their admission constraint | Addressed. Invalid compact records preserve recognizable task scopes in a separate admission constraint set, without manufacturing valid obligations or clear authority. Unknown scope holds all new admission. Existing valid obligations and fix history survive. Diagnostic previews stay bounded; original raw ledger bytes remain unchanged. | Actual digest/Resume: 22 scenarios; unsupported version, missing evidence/malformed fields, unknown scope, broken JSON, valid compact/oversized clears, invalid clear, unrelated work controls. Replay separately retains valid-history closure/clean retry and malformed-history no-dispatch/no-close controls. |
| Runtime R2 — Unplanned task routing bypasses durable holds and post-capacity admission | Addressed. `withSlot` has an explicit new-work option used only by newly initiated unplanned routing; it checks existing admission after capacity acquisition. Already-started failure/cancellation settlement keeps its original release path. New hold remains visible at Finish. | Four focused real-runtime scenarios: eligible, task hold, global hold, hold recorded during an actual queued reservation; unrelated mapped work continues, held tasks create no blocker/triage/notification/task outcome. Existing replay parent-failure/cancellation/verification settlement controls pass. |
| SR-1 — The complete extractor rejects the normal generated null-seam fallback stub | Addressed in the producer. Stub supplies exact Markdown with truthful Untested scope bullets and explicit Deferred OK `- none`; cluster file pointers remain, whole review remains not ready. Strict extractor unchanged. | Real generated stub payload → `report-verdict --complete` → actual collection succeeds, preserving cluster bytes and original cluster occurrences. Empty-section rejection still passes existing parser suite. |
| A1 — A contract-complete declaration of final-review keys cannot pass acceptance | Addressed. Declared inputs retain kind using strict transport grammar plus typed ledger rows, never filenames or display-key identity. Both-direction population reconciliation uses the proper keys transport; undeclared ledger inputs stay gaps. Hash-bound source correspondence and physical line refs remain required. Empty ready/none key transports accept empty line mappings only with supported retained final-review sources. | 39 acceptance scenarios including actual key extractor → real ledger → complete caller declaration → independent acceptance prerequisites. Omitted declaration, bad/duplicate/uncovered mappings, bad hashes, unrelated same-key sources and missing population remain rejected. |
| A2 — Read-only acceptance skips the null-recovery history validation enforced by collection | Addressed. Existing pure collection shape/history/identity validator is shared by collector and read-only STATUS, hence acceptance. Missing final marker, wrong predecessor, changed unavailable verdict, unsupported kind and changed required bundle cannot pass. | 32 collection/recovery scenarios include actual null settlement and explicit recovery producer, valid immutable history/required file controls, status+acceptance rejection of corrupt history, read-only byte checks, and independent review/measurement/human prerequisites. |
| Runtime R3 — Top-level result contract still describes only two cleanup arrays | Addressed. `super-code/SKILL.md` now names stopped/survived/unknown/kept and retained worktree/temp resources, including process-blocked retention. | Contract inspection against existing producer/detailed contract. Parent owns after-only full-guide behavior case N; this wave makes no independent agent-behavior improvement claim. |
| Harness H1 — Writer snapshots do not establish that every writer guard executed | Addressed. Harness requires every writer's command to be found and actually executed, plus independent existing-output collisions at assembly, single, cluster, seam, stub and direct fallback boundaries. | 17 source-binding scenarios. Removing cluster, seam or stub guard execution passes the prior harness assertions and fails the amended assertions (six preserved mutation runs). |
| Harness H2 — The fixture liveness observer still accepts an ambiguous failed lookup as absence | Addressed. Nonempty ps diagnostics make inspection unavailable rather than death. | Six focused real subprocess observer controls; diagnostic denial/error/empty-success throw, alive/zombie/clean absence retain their explicit meanings. Full replay uses actual owned child-process fixtures outside sandbox. |

## Commands and results

All paths below are relative to `/private/tmp/ufz-correction-final-fix-wave-logs`; command outputs are complete, including earlier failures. Commands ran in the checkout above. Final committed identities are in `committed-source-identities.json`; `final-source-hashes.json` is an earlier intermediate snapshot and is preserved, while `final-source-hashes-v2.json` matches the final owned bytes. Earlier runs are not relabeled as final-source results.

| Command | Result | Raw output |
| --- | --- | --- |
| `node tests/super-code/recovery-hold-scope-r1.mjs` | 22 scenarios, exit 0 | `R1-final.log` |
| `node tests/super-code/unplanned-admission-final-wave.mjs` | 4 scenarios, exit 0 | `R2-final.log` |
| `node tests/super-code/fixture-liveness-final-wave.mjs` | 6 scenarios, exit 0 | `H2-final.log` |
| `node tests/super-code/invocation-source-binding-r1.mjs` | 17 scenarios, exit 0; after commit, final bytes | `SR1-H1-final.log` |
| `node tests/super-auto/acceptance-population-correction.mjs` | 39 scenarios, exit 0; report-status and test hashes printed in log; helper bytes unchanged since this run | `A1-green.log` |
| `bash tests/super-auto/collection-recovery-correction.sh` | 32 scenarios, exit 0; final helper/test bytes | `focused-final-3.log` |
| `bash tests/super-code/test-report-verdict.sh` | all tests passed, exit 0 | `focused-final-4.log` |
| `bash tests/super-code/test-dispatch-text.sh` | all tests passed, exit 0 | `focused-final-5.log` |
| `bash tests/super-auto/collection-symlinks-r1.sh` | 32 scenarios, exit 0 | `focused-final-6.log` |
| `bash tests/super-auto/archive-integrity-r1.sh` | 15 scenarios, exit 0 | `focused-final-7.log` |
| `node tests/super-code/replay-harness.mjs` (approved outside-sandbox run for owned process fixtures) | 2404 passed, 0 failed, exit 0 | `replay-final-corrected-controls.log` |
| Guard omission mutation probes | Old assertions: 3/3 mutations escape; amended assertions: 3/3 rejected with exit 1 as expected | `H1-mutations.json`, `H1-*-mutation.log` and executable `.mjs` copies |
| `git diff --cached --check` before commit; `git diff --check` | exit 0 | tool transcript; no whitespace errors |

Documented Workflow dryRun controls within the actual replay retain exact counts: canonical 48, fix-pass-blocked 19, parked 23. Their successful assertions and topology/settlement checks are in the replay log. This is simulated Workflow runtime evidence, not hosted Workflow execution. The full parent-owned combined 45-command suite was not run here.

## RED evidence, intermediate failures and source truth

- `R1-red.log`: invalid compact version permits implementation (1 versus expected 0); valid compact/oversized positive controls passed first.
- `R2-red.log`: eligible control passes; task/global/during-wait cases erroneously route unplanned blockers. `R2-green.log` preserves an intermediate test error: it forbade a legitimate Recovery-only ledger write from the injected producer. Corrected assertion forbids task outcome records, preserving the actual hold record; later green logs pass.
- `A1-red.log`: complete declarations falsely conflict with roast kind; empty ready/none keys controls also fail. Original negative controls and independently satisfied prerequisites remain.
- `A2-red.log` and `A2-red-acceptance.log`: STATUS falsely clean and acceptance erroneously eligible from corrupt recovery metadata; collection rejects the same histories. Valid recovered and unresolved-null controls passed.
- `SR1-red.log`: actual generated legacy fallback fails strict extraction with `empty finding section: Untested scope`. `SR1-green.log` preserves the intermediate fixture defect: missing cluster manifest. Added realistic manifest/slice fixture data without changing collection validation; `SR1-H1-final.log` passes.
- `H2-red.log`: denied ps observation falsely reports absence; alive/zombie/absence controls pass first.
- `replay-final.log`: sandbox denies real process inspection; helper truthfully throws unavailable. No approval refusal occurred. Narrow outside-sandbox execution was approved for this owned-fixture test.
- `replay-final-unsandboxed.log`: 2394 pass / 5 fail from old expectations that malformed Recovery records still allowed retry/closure and generated new agent association evidence. Split valid-history retry/closure from malformed-history hold controls; original ownership/fix history assertions remain, new no-dispatch/no-close/raw-ledger preservation checks added. Final replay passes. Compact diagnostics keep the preexisting bounded preview format; oversized source pointers remain bounded.
- All prior reports/results retain original source identities. No normal-loop count/cap reset or retrospective reclassification of unavailable evidence occurred.

## Review and limits

Self-review covered the complete owned diff, including shared-validator extraction against its previous collector implementation, typed-key population/correspondence boundaries, scheduler reservation versus already-started settlement paths, invalid-clear preservation, strict stub extraction/cluster retention, per-writer collision evidence and unknown-process behavior. The Task 6 typed close/acknowledged settlement/history grouping code is unchanged. Replay template-literal baseline changes by exactly minus one because stub content is now assembled from explicit strings.

The R2 during-wait case uses documented test-only boundary injection: real scheduler acquisition queues bd-106, then existing `noteRecovery` records its hold; the test verifies `waited === true`. It exercises the production producer, admission, routing and ledger behavior, but does not claim a live external hold-arrival event. The stub fixture mechanically copies the exact generated payload; it proves producer/parser/collector compatibility, not agent obedience. Fixture acceptance decisions and live evidence records are synthetic prerequisites to isolate mechanics; no actual root acceptance or human decision is inferred.

The eleven frozen instruction/feedback files compare byte-for-byte with BASE (identities JSON). Only the separately scoped top-level `skills/super-code/SKILL.md` guide changed, SHA-256 `fdd8596017bf2a5b6660721145eb9aff07a039a390f35bdde99de5940a261c64`; parent after-only N evaluation remains separate. Parent owns final combined-source checks, actual interrupted-helper execution, finding applicability, independent scoped re-review and root acceptance. This report makes no global ready/merge claim.

**Helper snapshot dependency:** any isolated copy of `skills/super-auto/scripts/report-status` must now include sibling `skills/super-auto/scripts/collection-records.cjs`, hash-bound from this same HEAD. That pure CommonJS module uses only built-in `node:path` and `node:crypto`. Existing report-status consumers also require `scope-dispositions` and `../../super-code/scripts/report-verdict` as before. No new engine, database or third-party dependency is introduced.

## Owned files

- `skills/super-auto/scripts/collection-records.cjs`
- `skills/super-auto/scripts/report-status`
- `skills/super-code/SKILL.md`
- `skills/super-code/coordinator.js`
- `tests/super-auto/acceptance-population-correction.mjs`
- `tests/super-auto/collection-recovery-correction.sh`
- `tests/super-code/fixture-liveness-final-wave.mjs`
- `tests/super-code/invocation-source-binding-r1.mjs`
- `tests/super-code/recovery-hold-scope-r1.mjs`
- `tests/super-code/replay-harness.mjs`
- `tests/super-code/unplanned-admission-final-wave.mjs`
