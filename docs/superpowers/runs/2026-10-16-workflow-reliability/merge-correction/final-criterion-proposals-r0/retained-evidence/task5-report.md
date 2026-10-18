# Task 5 report — amendment-resume abstraction synchronization

Implementation commit: **7fc5a4ddb2d0913b769484935f79e6daccff966b**, `fix(super-auto): replay abstraction sync before amendment advance`.
Parent/base: **c2c05d28480902f4426c4d6adfc680508415d4b2**. Branch: `super-auto/workflow-reliability`, existing isolated checkout only.
Ready for the parent's fresh spec/quality review; agent-behavior acceptance remains pending.

## Source trace and scope

Read the complete Task 5 brief and its Global Constraints, the approved
`docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`, and the actual post-cap audit.
The original finding identity remains `skills/super-auto/resume.md:68` in
`2026-10-16-workflow-reliability-roast-pr-post-cap-audit.md`; its evidence was a static instruction
trace, not a live execution. At this task's base, the affected replay bullet was line 77.

Traced both amendment replay paths: super-auto's code-loop replay in `resume.md` and
super-design's design-loop §Re-entry, their `amend-checked` / `specs-committed` transitions,
Amend Mode steps 2–7, and the callers' remaining steps. Amend Mode step 3 persists
`specs-committed` before syncing; both replay bullets previously went directly to filing.
The existing §Decomposition Key abstractions sync is an agent procedure using `bd show`,
wholesale `bd update --description`, and owner adoption/creation rules. There is no standalone
sync helper to invoke as an execution test. No tracker command was run by this implementer.

The existing procedure makes committed `## Key abstractions` sections and their Digest blocks
authoritative; it replaces only the epic's marked digest, preserves the rest of Global Constraints,
updates owner entries, and adopts an existing `owns:` bead before creating one. Its existing
creation, rename, ownership and sweep-dependency rules remain unchanged. Both amended replay
bullets call this same producer contract before their existing title-deduplicated filing.

## Change and specific policy ruling

Both `specs-committed` replay bullets now replay Amend Mode step 3's sync before filing.
Both landed `amend-checked` paths first persist `specs-committed` and use that common boundary,
rather than syncing once before entering a bullet that would sync again. An unchanged section
requires no amendment sync; changed sections are compared from the recorded `lastGood` to HEAD.
The shared producer explicitly replays from committed sections even after a previously completed
sync, replacing digest/owner text and adopting existing owners. It does not dispatch a designer,
change the goal, reset counters, or create a new cycle.

A concrete conflict was found: the old general postcommit rule covered step 3's sync through
step 6 and returned `applied` after a second failure, which could advance with stale abstractions.
The parent explicitly authorized the smallest sync exception: **a sync failure retains
`specs-committed` and failure evidence, with retry on resume before filing or advancing**.
The existing degraded/applied rule now covers steps 4–6 only. Cost: a persistent sync failure
keeps the amendment pending instead of permitting automatic degraded advancement. No retry
engine, new state, or generic failure-policy redesign was added.

Task 4's exact source-correspondence, complete producer-input-set, and bounded captured-source
contracts are unchanged; the only super-design hunks are the matching replay/Amend Mode contract.
No finding identity, linking, dissolution, lineage or scout-owner semantics changed.

## RED / GREEN and limits

- `node tests/super-auto/resume-sync-contract.mjs`: initial **exit 1, 9 passed / 1 failed**
  against the unmodified runtime guides at the base above. The actual-source contract test
  reported both missing sync boundaries, separate landed-state routing, missing replay/adoption/
  failure requirements and the general rule still covering sync. Literal positive and negative
  checker controls passed. Retained output: `/tmp/workflow-task5-red.log`; a direct run separately
  confirmed the nonzero command exit.
- Final focused run: **exit 0, 10 passed / 0 failed**, retained at
  `/tmp/workflow-task5-green.log`. Cases cover both replay surfaces, already-completed replay,
  owner adoption, pending sync failure and exclusion from degraded advancement. The test only
  extracts/checks instruction contracts; its literal mutation controls test the checker, not an
  executed tracker or agent workflow. A result-count bookkeeping cleanup after RED did not change
  its contract assertions.
- `bash tests/super-auto/test-contract-lint.sh`: initial **exit 1**, solely because the existing
  `approvals · source-correspondence` field was missing from the fixture allowlist; all mutation
  controls passed. Initial output was direct tool stdout, exec session `91939`, not a saved log.
  `git show c2c05d28480902f4426c4d6adfc680508415d4b2:...` confirmed both the field and its omission predated Task 5.
  The parent authorized adding exactly that one field to
  `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`, preserving field semantics,
  format checks and unexpected-field rejection. This is a separately discovered Task 4 producer/
  fixture seam, not removal or weakening of the runtime contract.
- After that single-field correction, the same complete lint command returned **exit 0**, with
  the live tree and all existing mutation controls passing. Retained log:
  `/tmp/workflow-task5-contract-lint-green.log`. This repeat was justified by the fixture correction.
- `node --check tests/super-auto/resume-sync-contract.mjs` and staged `git diff --cached --check`
  completed without errors. No broad repository suite was repeated.

These are mechanical contract/extraction checks, **not evidence of agent compliance, actual
idempotent tracker effects, or a completed live workflow**. The parent froze five baseline
responses before edits and owns the matching after evaluations plus the actual-helper case after
Task 6. No duplicate evaluation agent was spawned, no historical evidence was restamped, and no
fresh review result or root acceptance is claimed here.

## Exact committed source identities

- `skills/super-auto/resume.md`: blob `04328efc901547fb5d23878eae08e06f1d4e8dac`, SHA-256 `4497ce1d0d47a0307ea6bb96eb008687595797e5ea1068ea7dd89b10bf546baf`.
- `skills/super-design/SKILL.md`: blob `33cfc962107741ad939a5e8fc7b448bf3c7d7b81`, SHA-256 `e23a402ce0fde5dbb4245c4bf4c0de6361aec144cfec71c0e2dfc787c38ecf95`.
- `tests/super-auto/resume-sync-contract.mjs`: blob `3e16fdb66ecf7c4219412c333822db68a5566915`, SHA-256 `acdf27fed2346f2793b19abd2e9ed27c9ca87007494a508ad90a0a0915cab051`.
- `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`: blob `cf1979c8002c986534a6791e3bd177b615fae4e2`, SHA-256 `5cae2ad527fab6c3adac312f9f25c5509fb586c865efe131248e3424590dd2c4`.

The four precommit hashes in `/tmp/workflow-task5-source-identities.json` match the committed blobs.
Only those four files were staged/committed. Parent-owned plan/run.md modifications and untracked
legacy-adapter/merge-correction evidence remain unstaged. No main/root/tracker/Herdr mutation,
push, release or external filing was performed.
