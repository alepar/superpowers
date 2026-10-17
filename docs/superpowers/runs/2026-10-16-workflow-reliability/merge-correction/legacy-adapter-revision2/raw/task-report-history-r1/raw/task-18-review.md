Status: CLEAN
id: super-plan-ufz.20
review bead: super-plan-ufz.21
base: 7a030486713f985ba8d02cc57c542f9d333756b8
head: e5672164d289900e29f9254741b9eed6c559b343

Spec compliance: ✅

Read current `bd show super-plan-ufz.20 --json` and `bd comments super-plan-ufz.20`: no comments or conflicting amendments. Applied current narrow task requirements together with frozen task-18 brief. Base ancestry check succeeded; HEAD exactly equals the requested immutable tip. Review package contains one commit and two files.

The production change adds only resume-check to the existing ready-stage case and RUN_KINDS. parseLabel, BEAD_KINDS, IN_SLOT, schemas, coordinator semantics, guidance and prose remain unchanged. Historical fixture files and builders have no diff. Original coordinator label coverage assertion remains unchanged.

Focused semantic regression builds temporary variants from unchanged historical fixtures, drives the real Workflow, Codex and Claude CLIs, checks ready/null-bead duration for Workflow, mapped count/duration for both ordinary decoders, and compares complete bead JSON and taskSlots to existing baselines. Complete bead comparisons preserve attempts, readiness and task timing, rather than merely checking a classifier string.

Issues:
- Critical: none.
- Important: none.
- Minor: none.
- Unverified requirements: none.

Focused reachability and concrete-risk checks:
- Risk: the classifier fix might not cover a real resume dispatch. Checked coordinator.js:820–845 and resumeCheckPrompt:2770–2784. The actual pre-admission dispatch uses resume-check:<id>; both prompt branches observe exact Git/tracker facts and forbid implementation/review/merge/closure/cleanup/editing. The ready observation category is appropriate without asserting readyAt.
- Risk: ordinary mapping could discard the obligation suffix or turn it into a task association. Traced the run-profile shell entrypoint to run-profile.mjs, Workflow parse/stage calls at 450–451, and ordinary decoder/mapping calls at 965–967. Codex run-kind decoding at 507 retains normalized cx_1 as suffix; Claude/Workflow parseLabel at 284–293 retain the actual post-colon text. All yield bead:null because resume-check remains outside BEAD_KINDS. Searched sibling parseLabel/stageOf calls; both real paths reach the modified shared classifier.
- Risk: associating this observation with a bead would invent attempts, readiness/start timing or slot occupancy. Checked per-bead collection/attempt creation at 1142–1159 and slotSpans at 1197–1202: any bead-associated observation joins an attempt and can become its start, and ordinary slots span from that start. Existing null bead association avoids that inflation; full bead/task-slot baseline comparisons exercise this behavior for all three paths.

Test evidence:
The implementer report includes exact task-worktree commands with isolated TMPDIR/HOME/XDG roots for `bash tests/super-code/test-run-profile.sh` and `bash tests/super-code/test-run-profile-in-flight.sh`, plus `node --check skills/super-code/scripts/run-profile.mjs` and `git diff --check`. Reported final outputs: profiler exit 0, 325 PASS/0 FAIL; in-flight exit 0, 14 PASS/0 FAIL; syntax/diff checks exit 0. Evidence plausibly covers the changed shared stage and both ordinary mappings. Original RED reports the actual missing-label failure; semantic RED reports wrong Workflow category and unmapped Codex/Claude observations; corresponding GREEN assertions all pass. No failure is glossed over. No warnings or leaked test processes reported. No tests run during this read-only review, as required.

Test changes commands run successfully in the task worktree:
`git diff --stat 7a030486713f985ba8d02cc57c542f9d333756b8..e5672164d289900e29f9254741b9eed6c559b343 -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'`
`git diff 7a030486713f985ba8d02cc57c542f9d333756b8..e5672164d289900e29f9254741b9eed6c559b343 -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'`
Result: exactly 32 added lines in tests/super-code/test-run-profile.sh; no removed, skipped or weakened test. Full immutable-range name-only diff confirms only the two declared files.

Review-package initially could not write the authorized artifact under sandbox restrictions; rerun with scoped escalation succeeded, then the resulting complete package was read. No remaining review gap.
