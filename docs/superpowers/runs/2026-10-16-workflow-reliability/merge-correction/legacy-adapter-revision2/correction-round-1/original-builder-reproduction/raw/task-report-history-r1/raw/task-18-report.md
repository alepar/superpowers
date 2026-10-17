Status: IMPLEMENTED
id: super-plan-ufz.20
base: 7a030486713f985ba8d02cc57c542f9d333756b8
head: e5672164d289900e29f9254741b9eed6c559b343
stacked: false

## Implementation

Mapped the actual read-only `resume-check:<id>` dispatch to the existing run-level `ready` stage and added `resume-check` to `RUN_KINDS` so ordinary Codex names and Claude descriptions are mapped. Production change is exactly two classifier additions. `parseLabel`, `BEAD_KINDS`, `IN_SLOT`, coordinator behavior, schemas, timing windows and bounds remain unchanged.

The ID is the observed obligation, retained as the run-level suffix. It is not an implementation attempt. The current coordinator's `resumeCheckPrompt`, including its verification-only branch, forbids implementation, review, merge, closure, cleanup and editing. A successful or held observation therefore remains pre-admission observation. Classifying its duration as readiness work does not assert the obligation became ready: `readyAt` still derives from creation/mapping/dependency evidence.

Checked task17's advisory against the actual metric consumers. Adding this kind to `BEAD_KINDS` would create a per-bead attempt for the first associated event, change `at.start` and `dispatchedAt` to the observation, and extend ordinary `slotSpans` from that observation through the chain. Merely excluding `ready` from `IN_SLOT` does not avoid that ordinary-chain inflation. Run-level association preserves the obligation suffix without changing task identities, starts, attempts, readiness timestamps or slots. The regression compares complete bead JSON (including readiness) and task-slot JSON against unchanged profiles.

## Requirements and assumptions

Read the current `bd show super-plan-ufz.20 --json` description and acceptance criteria, `bd comments super-plan-ufz.20` (no comments), generated task-18 brief, classifier/parser/ordinary decoder, coordinator resume dispatch and both prompt branches, fixture builders, historical fixtures and both suites. The current bead's narrow integration-fix scope and parent dispatch apply together; no conflicting amendments were found.

Created the exact assigned worktree/branch from integration `7a030486713f985ba8d02cc57c542f9d333756b8`. Already-merged check returned false. Project is zero dependency and declares no setup/install step. The bash test runners and production wrapper/module resolve inside this task worktree; `/opt/homebrew/bin/node` is the shared interpreter. No harness or installed plugin source was edited.

## Files changed

- `skills/super-code/scripts/run-profile.mjs`: add the ready-stage case and run-kind entry only.
- `tests/super-code/test-run-profile.sh`: add one focused temporary scenario group exercising Workflow, ordinary Codex and ordinary Claude profiles. Existing coverage assertion is unchanged. Fixture builders and all 34 historical JSON fixture files remain byte-for-byte unchanged.

## Test commands and results

All suite invocations started with this absolute working directory and environment (the tests create their own HOME beneath TMPDIR; all XDG homes remain beneath the same task root):

```bash
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.20
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.20 HOME=/tmp/sp-bce79baa/super-plan-ufz.20/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.20/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.20/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.20/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.20/state bash tests/super-code/test-run-profile.sh > evidence/super-plan-ufz.20/profile-green.log 2>&1
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.20 HOME=/tmp/sp-bce79baa/super-plan-ufz.20/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.20/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.20/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.20/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.20/state bash tests/super-code/test-run-profile-in-flight.sh > evidence/super-plan-ufz.20/in-flight-green.log 2>&1
node --check skills/super-code/scripts/run-profile.mjs
git diff --check
```

Final profiler exit 0: 325 PASS, zero FAIL. Relevant actual output:

```text
  [PASS] coordinator label kinds are all classified (missing: none)
run-profile: resume observations are run-level readiness work
  [PASS] resume observation Workflow profile exits 0
  [PASS] resume observation is run-level ready time
  [PASS] resume observation creates no task attempt or task timing
  [PASS] resume observation uses no task slot
  [PASS] resume observation Codex profile exits 0
  [PASS] resume observation Claude profile exits 0
  [PASS] ordinary resume observation is mapped (x)
  [PASS] ordinary resume observation preserves bead population and attempts (x)
  [PASS] ordinary resume observation preserves task slots (x)
  [PASS] ordinary resume observation is mapped (c)
  [PASS] ordinary resume observation preserves bead population and attempts (c)
  [PASS] ordinary resume observation preserves task slots (c)
run-profile: all tests passed
```

Final in-flight exit 0: 14 PASS, zero FAIL. Actual complete output:

```text
run-profile --in-flight: Claude Code
  [PASS] exits 0
  [PASS] unfinished dispatches only, oldest first, unknown ages last; other epic's run and finished agents skipped
  [PASS] another session: no lines, exit 0
run-profile --in-flight: Codex
  [PASS] exits 0
  [PASS] only the child whose last task event is task_started
  [PASS] unknown coordinator: no lines
run-profile --in-flight: unreadable roots and bad args
  [PASS] claude: exits 0
  [PASS] claude: unreadable root
  [PASS] codex: exits 0
  [PASS] codex: unreadable root
  [PASS] missing --harness exits 2
  [PASS] bad --harness exits 2
run-profile --in-flight: scans only the named session (3000 unrelated sessions and rollouts present)
  [PASS] both harnesses in 326 ms (< 2000)
  [PASS] run-profile.mjs parses
run-profile-in-flight: all tests passed
```

The explicit `node --check` and `git diff --check` both exited 0 without output. The integration tip did not advance; `git rebase super-auto/workflow-reliability` reported `Current branch task-super-plan-ufz.20 is up to date.` No post-rebase code change required another suite run. No full-23 sweep or real-epic acceptance was run or claimed; those remain parent-owned.

## TDD evidence

Before modifying any test or production source, ran the exact same profiler command above with output `evidence/super-plan-ufz.20/label-red.log`. Exit 1; 312 PASS, 1 FAIL. Original valid assertion failed:

```text
  [FAIL] coordinator label kinds are all classified (missing: resume-check)
    expected: none
    got:       resume-check
run-profile: 1 failure(s)
```

Added only the specified semantic temporary scenarios; ran the same profiler command with output `evidence/super-plan-ufz.20/semantic-red.log`, before changing the classifier. Exit 1; 321 PASS, 4 FAIL. Actual focused output:

```text
run-profile: resume observations are run-level readiness work
  [PASS] resume observation Workflow profile exits 0
  [FAIL] resume observation is run-level ready time
    expected: [["ready",null,10000]]
    got:      [["other",null,10000]]
  [PASS] resume observation creates no task attempt or task timing
  [PASS] resume observation uses no task slot
  [PASS] resume observation Codex profile exits 0
  [PASS] resume observation Claude profile exits 0
  [FAIL] ordinary resume observation is mapped (x)
    expected: [[true,1,10000]]
    got:      []
  [PASS] ordinary resume observation preserves bead population and attempts (x)
  [PASS] ordinary resume observation preserves task slots (x)
  [FAIL] ordinary resume observation is mapped (c)
    expected: [[true,1,10000]]
    got:      []
  [PASS] ordinary resume observation preserves bead population and attempts (c)
  [PASS] ordinary resume observation preserves task slots (c)
run-profile: 4 failure(s)
```

Expected RED: Workflow classified the 10-second observation as `other`; ordinary Codex and Claude did not map its kind. Existing coverage also remained red. Production then changed by exactly the two additions and the same full suite became GREEN. Every new assertion executed in RED and GREEN. The new readiness assertion would fail on `other` or bead-associated time; mapping assertions would fail on missing/unmapped/wrong count or duration; full bead JSON comparisons would fail on an extra attempt, population, changed start/readiness/timing/landing; slot comparisons would fail on changed cap/peak/full duration; exit assertions would fail on an unsuccessful profile. These exercise the actual CLI, not source-string semantics.

## Frozen evidence compatibility

SHA256 checked current files against the product `0bb280edcf5fc6a60499fdfdb090d1819a432963` manifests at `docs/superpowers/runs/2026-10-16-workflow-reliability/behavior-after/source-manifest.json` and `live-review-isolation/source-manifest.json`, plus final guidance expectations in `nochange-diagnostic/source-recheck-before.json`. All matched before this isolated classifier change; the committed diff touches none of those sources. No behavior result, historical fixture, protocol, scorer or frozen artifact was changed or rerun.

| Behavior source | Current SHA256 (= frozen full hash) |
|---|---|
| `skills/super-roast/SKILL.md` | `2ccbcbfb760eaebc64fa2519a02e71a057a78ac6b024ff18c7c2a9b22d30dd60` |
| `skills/super-code/SKILL.md` | `b1cddafcf9bcaae2503baa461ae40a91baa04239816914c94da1261c7ce2c1b6` |
| `skills/super-code/task-reviewer-prompt.md` | `e56081ee222894a286605007a0131aeec4692942eed684c5cc7b7f52be62d1e8` |
| `skills/super-roast/reporter-prompt.md` | `9c53e99f7173fd14daf0451a211588659176c4728f39f0e940ff13fa60e095c1` |
| `skills/super-auto/SKILL.md` | `6571134c1aebdf5574182a7ab1db0f90d41e86b9d534ffb37a1ec8914e7c5434` |
| `skills/super-auto/report-prompt.md` | `d6aeca28475787b7facb65b63260db804f62c5603020bff6138c8a569d699e91` |
| `skills/upstream-feedback/SKILL.md` | `2daad7d73e54462e8fe24f1152be47ffbbd8fe135a638bb851b97286b989ff30` |

| Live source | Current SHA256 (= frozen hash) |
|---|---|
| `skills/super-roast/scout-prompts-pr.md` | `485c9378985059ed56eb770b19da8af8e0c01b855285a1bf02380020418b1f60` |
| `skills/super-roast/scripts/assemble-args.mjs` | `df42cad6bf4870d5c47d49645067abfdfe7d237699b97adaae7011b9c5e7a8a4` |
| `skills/super-code/coordinator.js` | `c0809cda1726438999896b786bf199585d71dd35e949784ef37833c251fb410c` |
| `skills/super-code/scripts/dispatch-text.mjs` | `9eef3159838598ca243c1509db1ef18325cdd439af985083f6c12d2aa8f93fda` |
| `skills/super-code/task-reviewer-prompt.md` | `e56081ee222894a286605007a0131aeec4692942eed684c5cc7b7f52be62d1e8` |
| `skills/subagent-driven-development/scripts/review-package` | `bc5ede61d5579255ad4f167beb3a8035bd3e339b38cf35e604201f65f37dd0a6` |
| `coordinator.js:2852-2880` | `59a34a2622846567cacbde00a80e04b8f36c280c2da80d12e9201b882184dccd` |

The three no-change final guidance files (`task-reviewer-prompt.md`, `reporter-prompt.md`, `super-auto/SKILL.md`) match the same full hashes above. The live coordinator excerpt copy also matches its declared frozen hash. Category/decoder changes are confined to reporting `resume-check`; they have no effect on the frozen agent guidance, source-isolation helpers, acceptance gates, or behavior/live evidence. Historical profiler fixture bytes were separately compared with committed HEAD: 34/34 unchanged.

## Test hygiene

None: no `match:` or `survived:` processes. After baseline RED, semantic RED, profiler GREEN and in-flight GREEN, ran the required `stop-run-processes --check` with the exact worktree and `/tmp/sp-bce79baa/super-plan-ufz.20` roots from `/Users/alepar/AleCode/superpowers`; each exited 0 with no output. The first baseline hygiene command was mistakenly invoked from inside the task worktree; the script safely refused its own ancestor root (exit 2); immediately rerunning from outside succeeded. No process was stopped outside task roots. Final stop sweep likewise exited 0 with no output. Suite scratch files were cleaned by their EXIT traps; raw log excerpts and actual summaries are retained in this report, and transient task-created log files were removed to leave a clean task branch. No Herdr writes or subagent dispatches.

## Self-review and concerns

Reviewed final diff against brief: exactly the two declared files, two production-line additions, unchanged original coverage assertion, semantic tests covering both ordinary decoders plus Workflow, no historical fixture/builder edits, no schema/prose/coordinator changes. No concerns. Broader final sweep and root acceptance remain pending with the parent.
