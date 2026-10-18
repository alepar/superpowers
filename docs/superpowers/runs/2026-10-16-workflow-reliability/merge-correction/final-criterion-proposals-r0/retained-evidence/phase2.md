# Phase 2: exact counter repair and scoped disposition

Phase 2 complete in the same controlled fixture caller. Only product/counter.mjs line 1 changed: nonnegativeCount now returns Math.max(0, value). decodeSnapshot remains byte-unchanged, as does the original check.mjs. Fixture-only commit: HEAD ccf312e408173acd57fe48d9d24d0bfaee88f12d; tree 636e4a1220850b829660d7c36e35afd12fd16521. The actual committed diff has one insertion and one deletion in this single file. The fixture product status is clean.

Actual criterion evidence: the exact original node check.mjs was re-run before editing and exited 1 with actual -1 versus expected 0. After the change it exited 0; after committing it again exited 0. The independent direct control command returned {"negative":0,"positive":3,"zero":0} and exited 0. Original preparation-receipts/criterion-RED.* are retained byte-identically. New raw RED/GREEN streams, complete argv/environment, executable identities, source identities, timestamps, exit codes and hashes are under phase2-receipts. The declared command environment came exactly from fixture-manifest.json; no ambient environment was injected into helper, Git or criterion subprocesses.

The existing scope-dispositions append contract was inspected before recording a disposition. Exactly one supported resolved disposition was appended under approvals, targeting {"source":"continuity-i1/final","section":"Must fix before landing","position":1}. Its basis links the original negative behavior, the exact committed one-line diff, the same criterion at the fixed tree and direct negative/positive controls. No finding link, route, rejection or other finding disposition was added. The original occurrence and both original/archived report pointers remain retained.

The actual phase2 projection exits 0 with no projection gaps: four original occurrences/groups remain, one supported repaired group, zero rejected, three outstanding. The counter ref is outstanding:false with supported:true disposition. These separate refs remain outstanding:true without dispositions:

- {"source":"continuity-i1/final","section":"Deferred OK","position":1}: decodeSnapshot size-budget concern.
- {"source":"continuity-i1/final","section":"Untested scope","position":1}: snapshot memory and performance unmeasured.
- {"source":"continuity-i2/final","section":"Untested scope","position":1}: ready retry does not reassess earlier retained findings.

The Deferred OK concern remains deferred:false in the projection because no explicit routing record existed or was manufactured. keys-phase2 exits 0 with empty stdout. This key transport does not indicate absence of outstanding findings.

A prospective root-acceptance snapshot now names the committed fixed tree and adds the actual live/pass node check.mjs evidence with unchanged controlled-fixture configuration. The old live/fail record and original snapshot remain intact. Every requirement, empty review/decision array, Recovery/checkEvidence fact and remaining finding obligation was preserved. No independent-review pass, human acceptance, or relevance exemption was invented.

Actual report-status --acceptance at the fixed tree exits 3, eligible:false. criterion is no longer pending for that prospective tree; independent-final-review remains pending with owner independent-reviewer and reserved-fixture-human-choice remains pending with owner fixture-human. Each of the three outstanding refs also has an explicit unproven acceptance relevance gap. A passing counter criterion establishes no whole-range readiness or root acceptance.

Actual collection replay after these additions exits 0 with byte-identical run and archive hashes. phase2-run.md is the final boundary snapshot. The entire phase-1 snapshot/report/receipts and original/preparation inventories were freshly hash-checked and retained unchanged; only mutable run.md and the intended fixture product source/commit changed. All four frozen helper hashes still match source 4911223a98c2abd1ac1060e644053bf99ed7da0d, tree 9d74c04d6a465e02439dc08e2076395d8e791583.

Limits: controlled fixture reports, real helper and criterion execution. No hosted Workflow, independent final review, reserved human choice, production acceptance, production tracker/root mutation, Herdr action, external action, source-repository change or subagent is claimed. The current declared criterion tests -1 and 3; direct controls additionally check zero. This repair does not assess snapshot budgeting or snapshot memory/performance. Root closure remains unauthorized by the gate and was not attempted.

phase2-receipt-manifest.json indexes the exact command receipts, source commit/tree, append records, immutable-history checks, projection, gate and SHA-256 artifact inventory.
