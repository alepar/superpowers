# Task super-plan-ufz.2 implementation

Status: IMPLEMENTED
Initial base: 444ae642f59a22886526b41538eafadd8ff9faca
Final base: 01ff39cc0b6fc0effdf559e9b1164273610c24e6
Head: 9c4b5c74091bf7b882d44ccfee5a6dda5169fb79
Branch: task-super-plan-ufz.2
Stacked: false

## Implemented

Process inspection failures now produce `unknown:` facts and exit 4. Failed ancestry, cwd/executable discovery, environment/orphan discovery, terminal inspection and termination inspection cannot become a verified empty sweep. A failed/empty per-PID status query requires successful authoritative PID enumeration proving disappearance before `stopped:` is emitted. TERM failure still receives status verification and, for an observably live process, a KILL attempt; survivors remain exit 3. Interactive preservation now returns exit 3. Existing cwd/executable, exact HOME/TMPDIR, orphan-argument matching, caller/ancestor protection and lack of kinship expansion remain in force. A macOS privileged login ancestor with hidden cwd is excluded only after successful ownership inspection proves it belongs to another user.

Worktree cleanup verifies the worktree and its temp root together before removing either. Sweep verifies its owned roots before any worktree/branch/temp deletion. Survivor, unknown and deliberate-retention outcomes retain resources and identify their paths, including --discard and --sweep. Dirty/unmerged guards remain. Missing-worktree discard also verifies owned roots before deleting its branch/temp state.

Finish returns `processSweep.stopped`, `survived`, `unknown`, `kept`, combines relevant facts from resource preflight and the final process sweep, and retains worktree/temp paths in `worktreesKept`. Null/scriptError sweep dispatch and missing processLines produce explicit unknowns rather than invented survivors or verified absence. Delivery completion remains separate. Merge, close-only, discard, ordinary-subagent Finish, run-state and Remaining report sources carry the same concrete helper contract. No replacement engine or broader matching was added.

## Tests

All final commands began in the task worktree:
`/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.2`.

Final post-rebase runs:

```bash
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.2 node tests/super-code/replay-harness.mjs > /tmp/sp-bce79baa/super-plan-ufz.2/rebased-replay.log 2>&1
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.2 bash tests/super-code/test-dispatch-text.sh > /tmp/sp-bce79baa/super-plan-ufz.2/rebased-dispatch.log 2>&1
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.2 bash tests/super-auto/test-contract-lint.sh > /tmp/sp-bce79baa/super-plan-ufz.2/rebased-contract.log 2>&1
```

Every command exited 0. Relevant output:

```text
[PASS] 48 agent dispatches (got 48) — the doc's "Expected dispatch count" arithmetic
[PASS] 19 agent dispatches (got 19)
[PASS] 23 agent dispatches (got 23)
[PASS] unknown: completed code delivery remains independent of cleanup
[PASS] unknown: the cleanup outcome reaches its own result array
[PASS] survivor: worktree and temp paths reach Remaining sources
[PASS] interactive: the cleanup outcome reaches its own result array
[PASS] missing-process-lines: the cleanup outcome reaches its own result array
[PASS] script-error: unavailable inspection is unknown rather than an invented survivor
[PASS] unavailable: unavailable inspection is unknown rather than an invented survivor
[PASS] ancestry-discovery-denied: truthful exit distinguishes verified, unknown and retained outcomes
[PASS] ancestry-denied: truthful exit distinguishes verified, unknown and retained outcomes
[PASS] discovery-denied: denied inspection never claims stopped
[PASS] env-denied: worktree and temp resources survive together until verified cleanup
[PASS] tty-denied: denied inspection never claims stopped
[PASS] status-denied: retained resource identities are explicit
[PASS] status-listed: denied inspection never claims stopped
[PASS] signal-failed: truthful exit distinguishes verified, unknown and retained outcomes
[PASS] survivor: worktree and temp resources survive together until verified cleanup
[PASS] interactive: deliberate preservation sends no signal
[PASS] successful authoritative enumeration verifies disappearance after ps -p exits 1
[PASS] empty: worktree and temp resources survive together until verified cleanup
1852 passed, 0 failed

dispatch-text: all tests passed
All super-auto contract lint tests passed
```

The replay suite exercises the documented canonical/fix-pass-blocked/parked dryRuns and checks their expected dispatch counts. Each denial/survivor fixture checks both output/exit and resource existence; fake PID 990001 is the only permitted signal target and fake 990002 remains unrelated. Existing real owned sleepers exercise actual termination on macOS. `git diff --check` passed and `git status --short` was empty after commit/rebase.

Toolchain: this is a dependency-free repository with no setup/install step. Node interpreter resolved to `/opt/homebrew/bin/node`; the replay runner and helper scripts resolved inside this task worktree (`node -p "require.resolve('./tests/super-code/replay-harness.mjs')"` returned its absolute task-worktree path). No external package-under-test or shared package environment was used.

## TDD evidence

Helpers RED: the corrected signal-safe regression block was executed directly from replay-harness.mjs against unchanged helpers using:

```bash
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.2 node --input-type=module > /tmp/sp-bce79baa/super-plan-ufz.2/red-focused.log 2>&1 <<'JS'
import * as fs from 'node:fs'; import * as cp from 'node:child_process'; import os from 'node:os'; import path from 'node:path';
const src=fs.readFileSync('tests/super-code/replay-harness.mjs','utf8'); const start=src.indexOf("      scenario('scripts: cleanup uncertainty"); const end=src.indexOf("      scenario('scripts: remove-task-worktree",start); let failed=0;
const check=(ok,msg,detail)=>{console.log((ok?'PASS ':'FAIL ')+msg); if(!ok){failed++;console.log(detail)}};
const {mkdtempSync,mkdirSync,writeFileSync,existsSync,readFileSync,rmSync}=fs;const {execFileSync,spawnSync}=cp;
const args={mkdtempSync,mkdirSync,writeFileSync,existsSync,readFileSync,rmSync,execFileSync,spawnSync,os,path,process,scenario:console.log,check,bashPath:'/bin/bash',scriptsDir:path.resolve('skills/super-code/scripts')};
new Function(...Object.keys(args),src.slice(start,end))(...Object.values(args)); console.log(`${failed} failed`);process.exitCode=failed?1:0;
JS
```

Exit 1, `25 failed`. Representative failures: denied discovery returned code 0 and removed both the task worktree and temp directory; survivors and interactive retention also lost resources. This was the expected defect. The first full RED run had 1783 passed/27 failed, but its fixture path initially used a logical /tmp alias; only the corrected focused RED is the definitive helper baseline.

Coordinator RED: after adding result propagation fixtures and before coordinator implementation, the coordinator-only section of replay-harness.mjs ran with the following extraction command:

```bash
TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.2 node --input-type=module > /tmp/sp-bce79baa/super-plan-ufz.2/red-coordinator.log 2>&1 <<'JS'
import {readFileSync} from 'node:fs';import {pathToFileURL} from 'node:url';import path from 'node:path';const file=path.resolve('tests/super-code/replay-harness.mjs');const src=readFileSync(file,'utf8').replaceAll('import.meta.url',JSON.stringify(pathToFileURL(file).href));const cut=src.indexOf('  // ===== 10. shipped tree scripts');const end=src.indexOf('  // ===== summary =====',cut);await import('data:text/javascript;base64,'+Buffer.from(src.slice(0,cut)+src.slice(end)).toString('base64'));
JS
```

Exit 1, `1699 passed, 10 failed`: unknown/kept result arrays and missing-output handling did not exist, and unavailable inspection was put in survived. After implementation the same coordinator-only checks passed `1709 passed, 0 failed`; final full GREEN is the post-rebase `1852 passed, 0 failed` run above.

One intermediate full GREEN attempt exposed the previously ignored root-owned macOS login ancestor's hidden cwd; it correctly returned unknown but prevented actual fixture cleanup. Ownership exclusion was added for verified different-user ancestors. A separate contract-lint failure rejected numeric wording "all four"; named outcome fields replaced it. Both failures were fixed before the final runs.

## Files changed

- skills/super-code/scripts/stop-run-processes
- skills/super-code/scripts/remove-task-worktree
- skills/super-code/coordinator.js
- skills/super-code/coordinator-workflow.md
- skills/super-code/coordinator-subagents.md
- skills/super-auto/run-state.md
- skills/super-auto/report-prompt.md
- tests/super-code/replay-harness.mjs

## Test hygiene

The failed intermediate replay run (green.log) left these narrowly matched owned fixtures, discovered by the prescribed canonical `stop-run-processes --check` from /tmp:

- PID 10170, `sleep 300`, cwd under task TMPDIR's rtw-5mdEhk task t1: leaked by the real remove-task-worktree success fixture while the hidden privileged ancestor blocked cleanup; canonical stop reported `stopped:`.
- PID 11201, owned copied `sleepcopy 301`, executable under task TMPDIR's srp-1pFlUZ/wt/.bin: same ancestor issue in stop-run-processes real-process fixture; canonical stop reported `stopped:`.
- PID 11200, Node sleeper with HOME under task TMPDIR's srp-1pFlUZ/wt/.tmp/home: same fixture/cause; canonical stop reported `stopped:`.

A check launched while contract-lint was still finishing also observed active test processes PID 42917 (`bash tests/super-auto/test-contract-lint.sh`) and PID 53314 (transient child, command already unavailable). These were active validation, not residual fixtures; both exited before the follow-up canonical stop, which found nothing. Subsequent checks were performed only after all validation sessions ended.

The canonical check initially refused task-local cwd by its normal caller-protection guard; checks were rerun from /tmp. The final post-rebase canonical stop and then `--check` each exited 0 with empty stdout. No `survived:` lines, remaining background processes or human cleanup actions remain.

All test runs use assigned TMPDIR. Fixtures exercising the existing --tmp validator need unique `/tmp/sp-<hex>[/onechild]` resources; the coordinator explicitly allowed this existing interface-compatible layout rather than widening validation. The new fixture removes its own unique root in finally. Process signals in denial/survivor fixtures are intercepted through BASH_ENV and a fake kill; real sleeper fixtures use their existing narrowly owned teardown only.

## Assumptions

Current bead description/acceptance and comments were read before implementation. There were no explicit amendments or comments overriding the frozen brief. Coordinator steering assigns fresh-agent instruction evaluations to the parent, and asks for only truthful concrete helper protocol rather than stronger generic prose. The caller edits follow that limit. No tracker mutation, integration-tree write or thread mutation was performed.

## Concerns and coordinator-owned evidence

Fresh-agent before/after instruction evaluation belongs to the coordinator and is not claimed by this report. The coordinator confirmed the baseline controls did not justify stronger general guidance and will evaluate stable integrated task-1/task-2 guidance.

Prepared denied-inspection acceptance scenario: start with delivered/closed code, a clean merged task worktree and its temp socket state; controlled lsof discovery fails while other process enumeration succeeds. remove-task-worktree must return unknown/exit 4 and keep both resources. Finish reports the code id in completed, the unknown inspection in processSweep.unknown, and retained worktree/temp identities in worktreesKept/Remaining. Signal-safe mechanical versions of both halves pass in replay.

Actual process integration was exercised on macOS. Deterministic denial fixtures force the lsof branch on other platforms as well; native Linux /proc integration was not run on this host. Final whole-epic sweep and integrated pressure evaluation remain parent-owned as dispatched.
