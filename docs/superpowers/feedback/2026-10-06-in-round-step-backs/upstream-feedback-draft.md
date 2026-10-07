# Recurring holistic step-backs within a code-roast fix round

Received: 2026-10-06. Inspected: superpowers 6.4.2-alepar4.15, main e2c1521.
Status: accepted workflow-improvement feedback; recorded locally, implementation pending. No GitHub publication requested or performed. No changes to the ongoing harness-adapters worktree are authorized by this record.

## Disposition

Accept the cadence gap as a concrete improvement request. The existing holistic assessment is useful; its scheduling should also cover a long sequence of repairs inside one numbered code-roast round. Do not replace it with another full roast on every leaf or reset the round/fix caps. This record does not implement a new runtime rule.

The exact periodic interval and the unit counted as a completed repair/review cycle remain implementation decisions. A candidate is a small fixed number of completed repair/review batches, with immediate evidence-based triggers taking priority. “Every few” is the user's example, not an approved numeric default.

## Evidence and scope

User-reported observation from the ongoing harness-adapters run:

- Formal design and code-round-1 step-backs happened before the user reminder.
- A long sequence of mapped repairs, task reviews/fixes, and repeated whole-epic convergence checks remained within code round 1.
- The subsequent holistic assessment identified generic producers with legacy consumers left behind; deadline/ownership guarantees missing sibling and failure paths; and local shape success separated from durable evidence lifecycle.

Verified in the inspected skill text:

- `skills/super-auto/SKILL.md`, Phase 5 Step 1, runs the formal step-back from the numbered round's reports, then files fixes and re-enters super-code.
- The same section adds a step-back at thrash/cap exit with Blocking findings still open, but specifies no recurring checkpoint inside a long round.
- `skills/super-design/step-back-prompt.md` describes assessment after a roast round's report and before fix work for that round, with one stepBackCode record per round.
- `skills/super-auto/resume.md` replays existing stepBackCode-round-N records rather than dispatching a new assessment.
- Final-review Must-fix findings feed step-back intake, but their arrival does not itself define an immediate within-round checkpoint.

The run observations above are supplied by the user; no transcript, repair count, or independent classification of those families was supplied here. No claim is made that every neighboring failure was introduced by a fix.

## Requested workflow change

During Phase 5, before admitting the next repair batch, dispatch a fresh, read-only holistic assessment when either the bounded periodic cadence is due or a substantive immediate trigger occurs:

- The same root cause recurs after an attempted repair.
- A repair moves failure to a neighboring path.
- Whole-epic review adds related Must-fix findings.

Assess recent findings together with the accumulated reports, prior decisions, and repair diffs. Decide between independent patches, a family-wide sweep of the same rule, or a targeted change of approach that dissolves related findings. Check neighboring producers, consumers, sibling/failure paths, and cleanup/publication paths; local happy-path shape is insufficient evidence of durable lifecycle correctness.

Separate newly discovered pre-existing issues from regressions introduced by this fix stage, using base-versus-fix evidence where available. Unknown provenance remains explicitly unknown rather than being dismissed as pre-existing or asserted as a regression.

## Constraints on implementation

- Preserve roast round numbers, task/fix/retry allowances, scope decisions, and independent task/seam/integration/final-review gates. An assessment cannot grant another repair allowance or reopen a spent cap.
- Schedule at a safe admission boundary; do not edit specs, beads, or tracked integration files while their coordinator or merge operations are active. An immediate trigger requests the next safe checkpoint, not an unsafe concurrent mutation.
- Persist a distinct within-round checkpoint id, input revision, decision, and cadence progress. Resume replays an already completed assessment for those inputs and evaluates newly accumulated evidence without repeating the same assessment indefinitely.
- Retain inside/outside-scope redesign authority and human decision boundaries. An assessment recommends; it does not silently broaden the goal.
- Avoid a full roast per leaf. Batch related triggers and document when an existing decision already covers unchanged evidence.
- Keep this improvement separate from the current optional-skill-hook work and from operational changes to harness-adapters.

## Follow-up targets

Likely contract homes: super-auto Phase 5 and Final-review items; super-design/step-back-prompt.md; super-auto run-state.md and resume.md; step-back key/check fixtures as needed. Coordinator participation may be needed to expose a safe checkpoint within one long invocation; a caller-only instruction that cannot observe that boundary would not close the gap.

## Verification bar

Use a long single-round repair scenario to show that a checkpoint fires without incrementing roastCodeRound. Exercise each immediate trigger, an independent unrelated finding, repeated identical evidence, interruption/resume, and spent fix/roast allowances. Verify the next batch consumes the recorded decision, provenance remains evidence-based, neighboring lifecycle paths are considered, and no assessment bypasses gates or changes the goal. Compare before/after behavior across fresh sessions and run relevant contract checks before implementing or releasing the change.
