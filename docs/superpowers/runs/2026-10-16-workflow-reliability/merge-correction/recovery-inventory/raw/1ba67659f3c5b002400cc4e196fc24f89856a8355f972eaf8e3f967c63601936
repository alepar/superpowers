## Task 13: Project outstanding findings and supported dispositions

**filesTouched:**
- `skills/super-auto/run-state.md`
- `skills/super-auto/scripts/scope-dispositions`
- `tests/super-auto/test-scripts.sh`
- `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt`
- `tests/super-auto/test-contract-lint.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `skills/super-code/scripts/report-verdict`
- `skills/super-code/coordinator.js`
- `tests/super-code/test-report-verdict.sh`
- `tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt`

**Bead:** super-plan-ufz.8.4. **Surface:** 84306 tokens at integration base `560a05eb83cdc44013ea528e99854151c2f17d12`.

**Scope:** Own the durable finding/disposition extension and its deterministic outstanding projection. Collection, caller routing and status consumers belong to .8.3; roast redesign/ledger policy remains external.

**Interfaces:** Consume the immutable invocation/artifact identity actually delivered by .8.1 and report-verdict complete occurrence output delivered by .8.2. Existing planned extractor interface is --complete --source <immutable-source-id> FILE; inspect its landed output before coding rather than introducing an alternate extractor schema. Extend run-state with the smallest additive occurrence/link/disposition records and scope-dispositions with additive projection and key-only modes. This task owns and documents the resulting CLI/record contract for .8.3 and .9. Helpers validate source references and required basis fields; the agent judges semantic support.

### Acceptance (verbatim)

- [ ] Explicit references link occurrences; ambiguous matches stay separate.
- [ ] Supported resolution/rejection explicitly references findings and basis; assignment/success/silence do not resolve.
- [ ] Missing or unsupported external input leaves known evidence open.
- [ ] Key-only punch-list output contains only outstanding deferred findings and excludes findings with supported resolved or rejected dispositions, including verified fixes supplied elsewhere.
- [ ] Projection/record validation fixtures pass; source identity and extraction consumed from predecessors (needs: super-plan-ufz.8.1, super-plan-ufz.8.2).

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add failing scope-dispositions projection fixtures in test-scripts.sh using complete extraction from the landed .8.2 helper and .8.1 immutable invocation IDs. Include duplicate-looking occurrences from two sources, an explicit cross-source link, ambiguous wording without a link, an unresolved deferral, assignment/closed-fix/success-only/silent retry, supported fix verification supplied by another task, and supported rejection with basis. Assert only explicit links combine occurrences, raw source text/positions survive, and known obligations remain open for unsupported inputs.
2. Run `bash tests/super-auto/test-scripts.sh` before modifying the helper. Keep every existing --round/--findings/--filter/--step-back output/exit assertion byte-compatible. Add malformed/absent external projection, unknown finding reference, missing evidence/basis, malformed record and unavailable source cases; none may delete a previously known open occurrence. Include source keys with commas/Unicode and archive copies with original source identity.
3. Define the smallest additive record lines in run-state.md for source/occurrence pointer, explicit link, owner/fix reference, deferral and supported disposition/basis. Reuse predecessor source/section/position identities and existing run record conventions. Allow assignment, deferral and verification to coexist; no mandatory state chain. Document that helpers check referential structure while the owning agent records its semantic support judgment and evidence. Unsupported semantic claims cannot become resolutions merely because they include a nonempty evidence field.
4. Add an explicit projection mode to scope-dispositions that reads those records and retained local source extractions, validates source/occurrence references and disposition basis, and returns outstanding/deferred rows plus explicit gaps. Preserve local evidence when an external projection is absent, malformed, unsupported or incomplete. Only validated explicit linking combines identities; keep uncertain matches separate. Archive copies must not duplicate occurrences; unsupported resolution/rejection remains outstanding with its gap.
5. Add a key-only output mode derived from that same validated projection. Include only outstanding deferred findings, excluding supported resolved/rejected findings, including fixes verified elsewhere. A bare successful task, assignment or missing latest mention stays open. Deterministically dedupe the printed keys only for legacy transport while preserving all distinct underlying occurrences. Add exact output assertions for open deferred A, verified-fixed deferred B, rejected deferred C and active nondeferred D: keys contain A only.
6. Document actual CLI flags, record examples, supported disposition validation, exit/gap behavior and no-jq fallback in run-state.md; downstream .8.3/.9 must consume this contract. Use writing-skills for operative record instructions, run the named suite plus contract lint, and commit records/helper/fixtures. Return exact producer examples; do not build artifact collection or a competing roast ledger.

**Contract fixture upkeep:** Preserve both historical 2bf1d53 fixture files byte-for-byte. If the task adds run-state fields/formats, represent them in Field table/worked example and record their exact current additions in the declared run-state-added-fields.txt/run-state-added-formats.txt fixtures. Extend test-contract-lint.sh to validate the union of unchanged historical expectations and these explicit approved additions; keep rejection of dropped legacy fields, changed legacy formats and unapproved extra fields, with mutation coverage. Reuse this same additive-fixture contract when a predecessor has installed it; no top-level field is needed where an existing record holds the fact. These small current-contract goldens are tests, not a second runtime schema.

Run:

```bash
bash tests/super-auto/test-scripts.sh
bash tests/super-auto/test-contract-lint.sh
```

Expected final result: task-relevant deterministic checks pass; unavailable checks and coordinator-owned live evaluations remain identified separately. **Independently testable deliverable:** One validated projection retains source occurrences and supported dispositions and generates keys only for outstanding deferred findings.

