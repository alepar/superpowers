# Task 21 review — super-plan-ufz.24

Status: CLEAN

Spec compliance: ✅. Current bead and comments were read before the frozen brief; no amendments or comments exist. The captured range implements the stated archive-integrity boundary and adds only the named regression. No spec or existing suite changes.

Critical issues: none.
Important issues: none.
Minor issues: none.
Unverified requirement items: none.

The read-only status loop at skills/super-auto/scripts/report-status:297–312 reads and hashes every file in each latest valid collection inventory, even when complete:true persists. Missing, unreadable, nonregular and changed files become path/invocation-specific gaps; an affected collection is pending. No write or recollection occurs in this branch. Existing saved gaps remain counted. The acceptance entrypoint at :168–173 invokes ordinary status with RS_SKIP_ACCEPTANCE=1 and consumes these qualifiers, so the new check is reached by the actual acceptance command.

Concrete boundary checks beyond changed context: inspected the acceptance delegation at :168–173 for reachability and recursion; inspected collection inventory production and the unchanged validation at :283–293 for malformed/missing/duplicate records. Malformed records retain an error even alongside valid records; incomplete/missing inventories for ordinary non-null complete reviews fail validation; latest records intentionally supersede earlier intent/completion snapshots. Every duplicate file entry in a selected inventory is checked, so a conflicting hash cannot silently become a pass. Existing no-work null-review semantics are preserved. Source-bound root acceptance, finding projection, settlement validation and evidence matching are unchanged. The patch does not introduce another weaker acceptance path. Final-component symlinks are rejected by lstat.isFile; ancestor symlink containment remains the independently owned .27 scope and is not reopened.

Test evidence: no product tests were run by this reviewer. Reviewed original retained logs and the report. Final archive-final.log records all 15 focused scenarios passing; script-suite-final.log ends with All super-auto script tests passed and includes 44 root-acceptance assertions. Their commands are bash tests/super-auto/archive-integrity-r1.sh and bash tests/super-auto/test-scripts.sh, both bound to a487f101832c60590555f835faa3ba9a27e0d691, which git rev-parse of captured HEAD^{tree} confirms. The focused source deletes and corrupts all six retained artifact classes independently, uses the real collection/status/acceptance CLI, checks exact gaps, checks a matching archive after workspace removal, and snapshots bytes/mtimes/modes/inventory across each read. It preserves the separate human obligation. This plausibly covers all acceptance criteria.

Test changes: ran git diff --stat BASE..HEAD -- TEST_PATHSPECS and git diff BASE..HEAD -- TEST_PATHSPECS with the dispatch's full pathspec list. Both succeeded; only the new 70-line tests/super-auto/archive-integrity-r1.sh appears. No tests were deleted, skipped, loosened or edited to match the implementation. Existing test-scripts.sh is unchanged.

Identity/package checks: both captured commits resolve; merge-base --is-ancestor BASE HEAD succeeds. review-package produced a nonempty two-file package. Caller git status --short was empty. A first combined rev-parse --verify call was invalid CLI usage and was corrected to separate successful identity checks. Initial sandboxed package write was denied; the explicitly authorized named diff write succeeded with narrow escalation. No source, Git, bead or Herdr state was mutated. No filesystem view or reproduction was required.

Check records: retained below unchanged from the implementer report, with full source capture commands remaining in task-21-report.md (temporary-index read-tree/add/write-tree for RED/GREEN and git rev-parse HEAD^{tree} for final committed source). RED measures the actual missing-direct-package acceptance defect; GREEN and final evidence show the targeted correction. Earlier RED/GREEN records are historical; requiredLiveChecks select only final captured source. Both required final checks have matching live/pass evidence at their original locations.

Failure attribution: [] — no recorded run failure history was supplied; the relevant progress ledger has no Recovery records, and this review makes no unsupported run-baseline/owner attribution. The intentional pre-fix RED is retained as fail evidence rather than relabeled a passing measurement. Root final sweep and human acceptance remain caller-owned.

## Full structured result

```json
{
  "id": "super-plan-ufz.24",
  "base": "5bfbb92331652df67d9af367f0f81baa8267f020",
  "head": "22634c4c57e190dea56db60710b6de4f9327bfad",
  "completionKind": "implementation",
  "sourceTree": "a487f101832c60590555f835faa3ba9a27e0d691",
  "files": [
    "skills/super-auto/scripts/report-status",
    "tests/super-auto/archive-integrity-r1.sh"
  ],
  "evidence": [
    {
      "sourceTree": "c3e10cacbf5be5008b16e915c291267531fa1499",
      "command": "bash tests/super-auto/archive-integrity-r1.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state",
      "outcome": "fail",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.24/.superpowers/task-evidence/archive-red.log",
      "kind": "live"
    },
    {
      "sourceTree": "b42f3d131b5a1be9adecc0f6026378bc79da436f",
      "command": "bash tests/super-auto/archive-integrity-r1.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.24/.superpowers/task-evidence/archive-green.log",
      "kind": "live"
    },
    {
      "sourceTree": "b42f3d131b5a1be9adecc0f6026378bc79da436f",
      "command": "bash tests/super-auto/test-scripts.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.24/.superpowers/task-evidence/script-suite.log",
      "kind": "live"
    },
    {
      "sourceTree": "a487f101832c60590555f835faa3ba9a27e0d691",
      "command": "bash tests/super-auto/archive-integrity-r1.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.24/.superpowers/task-evidence/archive-final.log",
      "kind": "live"
    },
    {
      "sourceTree": "a487f101832c60590555f835faa3ba9a27e0d691",
      "command": "bash tests/super-auto/test-scripts.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state",
      "outcome": "pass",
      "location": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.24/.superpowers/task-evidence/script-suite-final.log",
      "kind": "live"
    }
  ],
  "requiredLiveChecks": [
    {
      "sourceTree": "a487f101832c60590555f835faa3ba9a27e0d691",
      "command": "bash tests/super-auto/archive-integrity-r1.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state"
    },
    {
      "sourceTree": "a487f101832c60590555f835faa3ba9a27e0d691",
      "command": "bash tests/super-auto/test-scripts.sh",
      "configuration": "macOS; bash; Node v26.9.0; TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.24; HOME=$TMPDIR/home; XDG_CONFIG_HOME=$TMPDIR/config; XDG_CACHE_HOME=$TMPDIR/cache; XDG_DATA_HOME=$TMPDIR/data; XDG_STATE_HOME=$TMPDIR/state"
    }
  ],
  "status": "CLEAN",
  "finding": "",
  "minors": [],
  "failureAttribution": [],
  "report": "/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.superpowers/sdd/super-plan-ufz-plan/task-21-review.md"
}
```
