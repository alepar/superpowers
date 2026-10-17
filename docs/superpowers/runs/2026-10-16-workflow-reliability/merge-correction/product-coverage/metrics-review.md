# Metrics/reporting bounded current-product review

Verdict: **needs fixes within this partition**. Two Should-fix findings; no Blocking finding established by this review. This is not a whole-branch readiness or run-acceptance assessment.

Reviewed baseline `832b051c870ae5c69adfa7f14d770292ab6c1a81` to pinned head `86ce3567e365fed967d50f3f4eeca77783fccf8b`. All reads used the supplied diff or pinned Git blobs, extracted under this private review directory. The caller's source, index, HEAD, tracker, Herdr state and existing processes were not mutated.

## Findings

### METRICS-1 — Should-fix (P2): verification-only completion is counted as a task landing and creates a synthetic merge

The new `verification-only` token is retained by `ledger-digest` (line 83), but `run-digest` still classifies every `complete` line as landed (lines 105–114). The profiler's `readLedger` likewise adds every complete task to `landed` (line 726), then invents a zero-duration successful merge when no merge transcript exists (lines 989–1002).

This conflicts with the pinned ordinary-coordinator producer contract, `skills/super-code/coordinator-subagents.md:31–50`: reviewed no-change evidence completes the task, but “There is no merge, commit nudge, early implementation split or new task landing. Count this completion separately.” It also violates the approved design's independent implementation/evidence facts and consistent metric meanings. These existing consumers were not updated for the newly supported completion kind.

A narrow private fixture used two ordinary Codex dispatches (implementation and review), no caller merge command, and the ledger line `Task 1 (verify.1): complete, verification-only, review clean`. Both tools exited 0:

- `run-digest`: `ledger: landed 1 · failed/BLOCKED 0 · pending retry 0 · cancelled 0`.
- `run-profile`: `beads dispatched 1, landed 1, planned 1`; JSON `landed: true`, `landedAt: "2026-10-01T00:00:40.000Z"`, and `lane.merges: 1`.
- Its limitation says `1 landed bead(s) with no merge in the coordinator's log: lane time 0`, treating the explicit no-merge success as missing merge evidence.

The fabricated landing enters profile totals, the schedule model, and subsequent baseline aggregation. Preserve verification-only completion independently in both consumers and do not synthesize a merge from that completion kind. A separate real landing already evidenced for the same ID must remain historical evidence.

Evidence: [fixture](metrics-probe/verification-only.json), [commands](metrics-probe/commands.json), [digest stdout](metrics-probe/digest.stdout), [profile stdout](metrics-probe/profile.stdout), [profile JSON](metrics-probe/profile.json). This is synthetic deterministic evidence, not a hosted/live coordinator run.

### METRICS-2 — Should-fix (P2): the feedback report template reintroduces raw merge-count reconciliation

The changed `skills/upstream-feedback/SKILL.md:60–68` requires task landing identities, concrete ID differences, and zero task landings from `baseAbsorbed` merges. Step 4 at line 98 still requires drafting with `report-template.md`. That pinned consumer template, lines 29–33, explicitly directs the author to write `ledger incomplete: <N> merge commits vs <M> Merge: lines` whenever first-parent merge commits exceed successful ledger Merge lines.

Consequently, a run with two task landings, two corresponding success lines, and one base-absorption merge satisfies the template's false incompleteness condition (3 > 2), even though the new identity comparison has no discrepancy. The mandatory template still prescribes precisely the accounting the changed skill removes. Update that consumer instruction to use task-ID reconciliation and retain source gaps separately from ordinary base absorption.

Evidence is the pinned instruction conflict, not an observed new agent report. The template blob is `7dad720eea0e927fdc02a715df2353add448668c`; the changed skill blob is `541a1e02cedf2c97f8c902206afd8b2a55281c3c`. No live behavior evaluation was run for this finding.

## Coverage and assessment

Read the complete supplied diff, **136,376 bytes / 1,733 lines**, in seven bounded chunks: 1–240, 241–500, 501–760, 761–1020, 1021–1230, 1231–1460, and 1461–1733. SHA-256: `696414394c59c7e64dde18bfd8dafb55391321dc7676196606a6c36840614d51`.

Read all changed bodies and the complete pinned head body of every member below. In particular, all 1,821 lines of `run-profile.mjs` were inspected, including transcript discovery, ordinary ledger outcomes, attempts, readiness, critical-path construction, simulation, lower-bound modeling, summaries, and Markdown/JSON rendering. One combined source-read response clipped 178 tokens; the affected 1070–1110 source range was reread completely. No member-body or supplied-diff range remains unread.

| Member | Pinned Git blob | Lines |
| --- | --- | ---: |
| skills/super-code/scripts/ledger-digest | ea0310b9994cac7d516230802836e182e5cdf010 | 107 |
| skills/super-code/scripts/run-digest | ce8ab8c9deb80330a2e9b34f7645886d65c3e255 | 244 |
| skills/super-code/scripts/run-profile.mjs | 3ed891e96450432bdbcb726502b8786ad29067d9 | 1821 |
| skills/upstream-feedback/SKILL.md | 541a1e02cedf2c97f8c902206afd8b2a55281c3c | 142 |
| tests/super-code/test-run-digest.sh | 60796d9970299543bbf7d49d0209c5007aae218c | 215 |
| tests/super-code/test-run-profile.sh | 7c46b1c8ca6218f287fe50344fb31f16ae18f51a | 622 |
| tests/super-code/test-run-profile-in-flight.sh | dd45ab1a59c017b6df6ca77dbc2330add96a1e11 | 114 |
| tests/super-code/run-profile-fixture.mjs | b1046205b308f9e609c333e5cec66a3ece6469fe | 75 |
| tests/super-code/run-profile-ordinary-fixture.mjs | a734891e95e39b9191ee194c403d301aab130568 | 141 |

The source inspection supports the following bounded observations; these are not test-pass or acceptance claims:

- Missing/unreadable ledger statuses and invalid transported row counts now reach `run-digest` as unknown instead of authoritative zeroes; valid-empty transport remains distinct.
- Creation bounds, mapping/dependency timestamps, unknown readiness, and residual graph labels are carried into profiler JSON and summaries. Unknown release timing uses dispatch as a conservative simulation boundary, and external unavailable dependencies do not silently establish readiness.
- The complete simulation was inspected: in-model dependencies release dynamically, external modeled releases stay fixed, creation/invocation/mapping bounds are retained, and counterfactuals are labeled estimates. Planning contributes through the actual critical path and release boundaries, with a planning-dominated diagnosis.
- Task-slot and overall dispatch concurrency are represented separately. Resume-check is run-level readiness work and does not create a bead attempt. The listed tests contain targeted assertions for these changes.
- The feedback skill now distinguishes latest outcomes from durable fix history, repaired versus deferred/rejected findings, source population gaps, and normal execution metadata from friction. The mandatory report-template seam remains inconsistent as METRICS-2 explains.

## Limits

- No broad suite was rerun. The three listed shell test bodies and both fixture builders were reviewed; only the narrowly scoped verification-only fixture was executed.
- No live/hosted Workflow execution or fresh agent-behavior evaluation is established.
- Other product partitions, historical review artifacts, actual run landing reconciliation, Recovery internals, and scope-disposition calculation were not re-audited. Their producers were inspected only where needed to establish the two metrics seams.
- The approved design and feedback report template/analyst prompt were read completely. Ordinary-coordinator context was read at lines 25–52 plus the relevant finish-metrics search excerpt. The unchanged `context-pass.mjs` was imported by the probe and its first 40 lines inspected; its internals were not audited.
- Full baseline bodies outside the supplied diff context were not audited. No conclusion about whole-branch readiness, root acceptance, repair completion in other partitions, or performance improvement follows from this review.

The machine-readable identity, coverage and limits record is [metrics-coverage.json](metrics-coverage.json).
