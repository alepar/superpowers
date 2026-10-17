# Task 28 / super-plan-ufz.31: exact historical artifact restoration

Status: IMPLEMENTED. Completion kind: implementation.

Recovered all five missing historical byte streams from their original files under `/private/tmp/ufz-live-isolation`, after confirming each original SHA-256 matched the unchanged artifact manifest. Copied bytes without reconstruction or a replacement exercise, explicitly force-added ignored fixture paths, and retained provenance plus the complete 81-entry audit in the declared `retained-equivalents/provenance.json`. No equivalent substitute was necessary. No other files were changed.

The manifest and historical report remain byte-for-byte unchanged. Their retention claims and raw-evidence map now resolve to the actual package, final review, fixture ledger, fixture plan and output sentinel at their original identities. This avoids changing the report's own historical manifest hash. No observation, source revision, recorded reproduction failure, controlled assembler exit 3, verifier-first false positive, process-inspection uncertainty, rejected measurement classification or direct frozen-Git fallback disposition was rewritten.

## Source identity and setup

Initial task base: `e3749b014f6939cb82f5e79a33dc020f5b3961f0`, tree `79fc403800ff3b89c60012d61d7e55f5f0e7099d`. Fresh prescribed worktree and branch were created after already-merged returned false. Brief generation succeeded. No project install is declared in package.json (no dependencies or setup/test scripts); the task changes archived data only and imports Python's standard library, using `/opt/homebrew/bin/python3` as an audit interpreter and `/opt/homebrew/bin/git` against the assigned task tree. No product binary or installed package was invoked. Integration source was read-only.

Integration advanced during work. The task-only commit was rebased as required, then the full audit was repeated. Final base: `69c3a0d001b0533aa4a8f682f51ca4e4bd8a5551`; head: `7d5abfe28d01de5153d5905e48f057869ceb2a5e`; tree: `f062b7c7ec1b967aa64952fad937ff6982cdb084`. Original provenance baseline intentionally remains the actual pre-restoration source, not the rebased integration state.

## Tests

Read-only initial audit: 81 original identities, 76 present SHA-256 matches, exact five absent, zero mismatches. All five `git cat-file -e 612ea0a7e4d64480bdd01e0ac842b539115342ee:<archive-path>` reads failed as expected. Both retained pre-cleanup tar archives were inspected read-only and contained none of the missing basenames. `seat-b/response.md` duplicates only the final-review hash and was not used to replace the other four. All five original files were available and hash-matching in the original temp directory.

Final executed command, including full stdin script (also independently re-measures the red baseline):

```bash
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.31 && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.31 python3 - <<'PY'
import hashlib,json,pathlib,subprocess
root='docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/'
base='e3749b014f6939cb82f5e79a33dc020f5b3961f0'
source='f062b7c7ec1b967aa64952fad937ff6982cdb084'
def blob(rev,name):
 p=subprocess.run(['git','show',rev+':'+root+name],capture_output=True)
 return p.stdout if p.returncode==0 else None
manifestBytes=blob(base,'artifact-manifest.json');manifest=json.loads(manifestBytes)
assert blob(source,'artifact-manifest.json')==manifestBytes
missing=[];unchanged=0;restored=[]
for name,expected in manifest.items():
 old=blob(base,name);data=blob(source,name)
 assert data is not None,('missing',name)
 assert hashlib.sha256(data).hexdigest()==expected,('hash mismatch',name)
 assert (pathlib.Path(root)/name).read_bytes()==data,('worktree mismatch',name)
 if old is None:
  missing.append(name)
  restored.append({'identity':name,'sha256':expected,'gitBlob':subprocess.check_output(['git','rev-parse',source+':'+root+name],text=True).strip(),'bytes':len(data)})
 else:
  assert old==data,('original changed',name)
  unchanged+=1
expectedMissing=['caller/build/caller-output.txt','caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md','caller/.superpowers/sdd/ufz-live-review-plan/progress.md','caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md.diff','caller/.superpowers/sdd/ufz-live-review-plan/ufz-live-review-plan.md']
assert missing==expectedMissing
assert len(manifest)==81 and unchanged==76 and len(restored)==5
p=json.loads(blob(source,'retained-equivalents/provenance.json'))
assert {x['originalIdentity']:x['expectedSha256'] for x in p['restored']}=={x:manifest[x] for x in missing}
assert len(p['audit'])==81 and p['after']['hashMatches']==81
for entry in p['restored']:
 data=pathlib.Path(entry['sourceLocation']).read_bytes()
 assert hashlib.sha256(data).hexdigest()==entry['sourceSha256']==entry['expectedSha256']
 assert data==blob(source,entry['originalIdentity'])
assert blob(source,'report.md')==blob(base,'report.md')
changes=subprocess.check_output(['git','diff','--name-status','69c3a0d001b0533aa4a8f682f51ca4e4bd8a5551',source],text=True).splitlines()
assert set(changes)=={'A\t'+root+n for n in missing+['retained-equivalents/provenance.json']},changes
for name in expectedMissing[1:]:
 assert blob(source,name) is not None
print(json.dumps({'stage':'baseline-red-integrity','sourceTree':subprocess.check_output(['git','rev-parse',base+'^{tree}'],text=True).strip(),'outcome':'fail','entries':81,'hashMatches':76,'missing':missing,'hashMismatches':[]},indent=2))
print(json.dumps({'stage':'restored-git-tree-integrity','sourceTree':source,'outcome':'pass','entries':81,'hashMatches':81,'missing':[],'hashMismatches':[],'original76ByteIdentical':unchanged,'manifestAndReportUnchanged':True,'restoredGitBlobs':restored,'onlySixDeclaredAdditions':True,'retentionMapResolved':True},indent=2))
print('PASS: all 81 original manifest identities hash-match captured Git blobs; exact five restored; original 76 unchanged; no historical observations rewritten.')
PY
```

Output (exit 0, 1.034092792 seconds):

```text
{
  "stage": "baseline-red-integrity",
  "sourceTree": "79fc403800ff3b89c60012d61d7e55f5f0e7099d",
  "outcome": "fail",
  "entries": 81,
  "hashMatches": 76,
  "missing": [
    "caller/build/caller-output.txt",
    "caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md",
    "caller/.superpowers/sdd/ufz-live-review-plan/progress.md",
    "caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md.diff",
    "caller/.superpowers/sdd/ufz-live-review-plan/ufz-live-review-plan.md"
  ],
  "hashMismatches": []
}
{
  "stage": "restored-git-tree-integrity",
  "sourceTree": "f062b7c7ec1b967aa64952fad937ff6982cdb084",
  "outcome": "pass",
  "entries": 81,
  "hashMatches": 81,
  "missing": [],
  "hashMismatches": [],
  "original76ByteIdentical": 76,
  "manifestAndReportUnchanged": true,
  "restoredGitBlobs": [
    {
      "identity": "caller/build/caller-output.txt",
      "sha256": "2fd7eea5648b3ba81c32ca30175ab8032f915e6b3a06c37deaa74145cc34a1f9",
      "gitBlob": "07187bf126847e6b50f0028de40ab9f974c8a858",
      "bytes": 30
    },
    {
      "identity": "caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md",
      "sha256": "48ced495dd63e6a6824b836c1503649ddf5bd8113c003d39c655bc5212cfb073",
      "gitBlob": "222cd1aad7dc82d3caa1f18e66871e726d78e0e9",
      "bytes": 4072
    },
    {
      "identity": "caller/.superpowers/sdd/ufz-live-review-plan/progress.md",
      "sha256": "b5b94bdab87dad925cac97ba8a51a04e066353df60120f483a14fda4f8a2e7a4",
      "gitBlob": "f5919ff840e0ea1cc9f69f67e7b3cbcf5672e01b",
      "bytes": 436
    },
    {
      "identity": "caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md.diff",
      "sha256": "99ee436cce41bc648250612a01fa1c31c2187d9e7aeaf909aff073e894a727d5",
      "gitBlob": "d11e03902519b235eb40d715e1fc45a046be85b1",
      "bytes": 597
    },
    {
      "identity": "caller/.superpowers/sdd/ufz-live-review-plan/ufz-live-review-plan.md",
      "sha256": "cd7e91a3f6462f45d3e521f076815fa608f3fd9a0578352a75d8d310c38593d3",
      "gitBlob": "6335fd448976ae21b02dc8b19f85ca32abbf0ea7",
      "bytes": 72
    }
  ],
  "onlySixDeclaredAdditions": true,
  "retentionMapResolved": true
}
PASS: all 81 original manifest identities hash-match captured Git blobs; exact five restored; original 76 unchanged; no historical observations rewritten.
```

The audit retrieves every artifact from the captured Git tree, hashes its bytes independently, compares every original present blob to the original baseline, checks all five source paths and provenance mappings, checks the report's four package/ledger/plan/final-review paths, and checks that only the six allowed additions are delivered. Missing files, one-byte hash changes, alterations to any original 76, an incorrect original-source mapping or any extra changed path fail these checks. No new tests mirror prose; no product suite or behavior eval was run because no product code or instructions changed.

Before commit, `git diff --cached --check` passed. All six additions were inspected; the retained .diff still names captured fixture pair `96ba44f6f5ced6166997c74aee1ba374b6c3fe0f..7ddd110053fb302c4f6a0bd645ddbf28c512c563`, and the progress ledger still records controlled assembler unavailability. Git status after commit/rebase was empty.

## Evidence

```json
{
  "evidence": [
    {
      "sourceTree": "79fc403800ff3b89c60012d61d7e55f5f0e7099d",
      "command": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.31 python3 -",
      "configuration": "baseline-red-integrity; captured e3749b014f6939cb82f5e79a33dc020f5b3961f0; exact stdin script in report Tests",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-28-report.md",
      "kind": "live"
    },
    {
      "sourceTree": "f062b7c7ec1b967aa64952fad937ff6982cdb084",
      "command": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.31 python3 -",
      "configuration": "restored-git-tree-integrity; all 81 historical manifest identities; exact stdin script in report Tests",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-28-report.md",
      "kind": "live"
    }
  ],
  "requiredLiveChecks": [
    {
      "sourceTree": "f062b7c7ec1b967aa64952fad937ff6982cdb084",
      "command": "TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.31 python3 -",
      "configuration": "restored-git-tree-integrity; all 81 historical manifest identities; exact stdin script in report Tests"
    }
  ]
}
```

The compact evidence command is the actual interpreter invocation; the full shell capture command and stdin script are retained above. The baseline record's `fail` is the observed 76/81 archive-integrity defect, even though the combined verification script exits zero once the expected red state and repaired green state are both confirmed. It is not relabeled as a passing historical exercise.

## Files changed

- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/build/caller-output.txt`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/progress.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/final-review-seat-b-live.md.diff`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/caller/.superpowers/sdd/ufz-live-review-plan/ufz-live-review-plan.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/live-review-isolation/retained-equivalents/provenance.json`

## Test hygiene

No server, daemon, watcher or background process was started. Initial sandbox helper:

```text
unknown: /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.31 — ps ancestry discovery failed
unknown: /tmp/sp-bce79baa/super-plan-ufz.31 — ps ancestry discovery failed
(exit 4)
```

The authorized check from within the task cwd then returned:

```text
refusing root /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.31: it contains the working directory of this process or an ancestor (/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.31)
(exit 2)
```

These are retained tool/environment observations, not evidence of zero leaks. Running the helper from `/private/tmp` outside the target root resolved its safety guard. The authorized post-audit `--check` and final stop calls both exited 0 without output. Exact final command:

```bash
cd /private/tmp && bash /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/skills/super-code/scripts/stop-run-processes --check /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.31 /tmp/sp-bce79baa/super-plan-ufz.31 && bash /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/skills/super-code/scripts/stop-run-processes /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.31 /tmp/sp-bce79baa/super-plan-ufz.31
```

No `match:` or `survived:` lines; nothing required termination. No automatic approval rejection occurred.

## Assumptions and current requirements

Read `bd show super-plan-ufz.31 --json` and `bd comments super-plan-ufz.31`; there were no comments or task amendments. Applied bead acceptance and frozen task 28 compatibly. The explicit contingency paths authorize provenance.json for the before/after audit even though all five preferred original paths were recovered. Historical report and manifest need no edited qualification because their complete retained-path claims now hold and all original hashes remain intact. No task .27 resources, ledger, main/base branch, Herdr mutation, merge, push or added agents were touched.

## Concerns

No remaining retention gaps: 81/81 original entries match captured Git blobs, including each of the five recovered identities. This repairs archival completeness; original single-run source limits, assembler-transition coverage limits, no task-review policy coverage, global historical process-inspection uncertainty, caller-owned sweeps, behavioral assessment, independent review and root/human acceptance remain pending. No historical observation was rerun or certified for current product source.
