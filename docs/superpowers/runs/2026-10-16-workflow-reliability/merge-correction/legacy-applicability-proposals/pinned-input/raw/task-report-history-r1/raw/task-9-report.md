# super-plan-ufz.8.2 implementation evidence

Status: IMPLEMENTED

## Implementation

Added `report-verdict --complete --source IMMUTABLE_SOURCE_ID FILE` as a separate additive parser branch. The existing default and `--keys` parser branches are unchanged. The new mode emits one JSON object and exits 0 only after validating the entire recognized finding source; errors exit 2 with a stderr diagnostic and no success JSON.

Complete extraction includes final-review Must fix, Untested scope and Deferred OK; task-report concern/blocker/finding and deferred sections, even with a success status; and roast Confirmed findings of every severity, both Not verified routes, Beyond remainder cap count evidence, Rejected with reason, Unverified nits, Escalations and deferred sections. It retains duplicate appearances and multiline continuations, without legacy item or text caps. It does not store, match, resolve, route, amend or project findings.

## Interface for super-plan-ufz.8.4

CLI: `bash skills/super-code/scripts/report-verdict --complete --source '<immutable invocation/logical-artifact identity>' '<actual report path>'`

Schema: `{version:1,source,artifact,kind,verdict,occurrences:[{section,position,key,text}]}`.

- `source`: the supplied immutable string verbatim; required, nonblank, no ASCII control characters. The caller owns the immutable identity promise. This extractor does not derive identity from the file path or infer semantic equivalence.
- `artifact`: FILE exactly as supplied; may change when the source is archived.
- `kind`: `final-review`, `roast`, or `task-report`, selected using the existing recognition priority (exact `## Verdict` wins over quoted task Status).
- `verdict`: full recognized verdict without the compact summary's truncation.
- `section`: exact source heading/label text with its Markdown heading/bold delimiter removed. A bold label's colon remains part of the label, consistent with existing label parsing. No case or wording normalization is applied.
- `position`: 1-based appearance position within that exact section label, accumulated across repeated headings with the same label. Duplicate finding text remains separate. `none` markers do not consume occurrence positions.
- `key`: original first item line without its Markdown list marker. For roast items, only the portion before the first ` — ` is the key. Markdown emphasis and Unicode are retained.
- `text`: original first item line without its list marker, followed by original continuation lines (including indentation, nested bullets, emphasis and internal blank lines). Trailing separator blank lines are excluded. CRLF/CR are normalized to LF; neither text nor key is capped.
- The occurrence identity is `(source,section,position)`, not `(artifact,section,position)`. An archive copied byte for byte and parsed with the same source has exactly the same occurrences.

Missing/non-file/unreadable paths, unknown/unsupported source formats, invalid UTF-8, missing verdict/sections, empty finding sections, and unmarked leading finding text fail explicitly. A recognized review with explicit `none` sections succeeds with an empty occurrences array. Bare success task reports with no finding sections are not accepted as an explicit empty finding review. Step-back and assembled digest formats have no finding extraction contract and are refused in complete mode; their old modes remain unchanged. Consumers must retain existing evidence when complete extraction fails.

## Tests

Final suite ran after rebasing onto the current integration tip, exit 0:

```bash
cd /Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.8.2 && TMPDIR=/tmp/sp-bce79baa/super-plan-ufz.8.2 HOME=/tmp/sp-bce79baa/super-plan-ufz.8.2/home XDG_CONFIG_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.2/config XDG_CACHE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.2/cache XDG_DATA_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.2/data XDG_STATE_HOME=/tmp/sp-bce79baa/super-plan-ufz.8.2/state bash tests/super-code/test-report-verdict.sh
```

Relevant final output (all existing legacy assertions also passed):

```text
report-verdict --complete: complete final-review occurrences and stable archive identity
  [PASS] complete mode accepts a caller-supplied immutable source
  [PASS] all relevant sections, repeated occurrences and original text survive JSON encoding
  [PASS] repeat parsing is deterministic
  [PASS] archiving changes artifact path but preserves source and occurrence identities
report-verdict --complete: every roast finding section and severity
  [PASS] roast complete mode exits 0
  [PASS] all roast routes, severities, reason text and section-local positions are retained
report-verdict --complete: uncapped extraction
  [PASS] large final review accepted
  [PASS] complete extraction has no default item caps
  [PASS] long roast accepted
  [PASS] complete extraction does not truncate keys or text
report-verdict --complete: task concerns, bold labels and valid explicit empty reviews
  [PASS] task report with successful status can retain concerns
  [PASS] successful task status does not erase concern/deferred occurrences
  [PASS] recognized explicitly empty review succeeds
  [PASS] explicit none markers are not findings
report-verdict --complete: invalid or incomplete input cannot look clean
  [PASS] no-verdict.md: explicit failure
  [PASS] no-sections.md: explicit failure
  [PASS] malformed-section.md: explicit failure
  [PASS] empty-roast-verdict.md: explicit failure
  [PASS] truncated-section.md: explicit failure
  [PASS] missing --source exits 2
  [PASS] missing artifact exits 2
report-verdict: all tests passed
```

The same suite includes unchanged coordinator dispatch-text producer/parser checks and all historical default/keys assertions. No existing caller signature changed.

Additional byte compatibility probe, exit 0, used Node built-ins to obtain the old helper with `git show 444ae642f59a22886526b41538eafadd8ff9faca:skills/super-code/scripts/report-verdict`, then compared running `bash -s -- [--keys] FILE` with that script on stdin against `bash skills/super-code/scripts/report-verdict [--keys] FILE`, for each of the 13 existing fixture files. Compared stdout, stderr and status via `node:assert/strict`:

```text
Legacy byte compatibility: 26 fixture/mode combinations match base stdout, stderr and exit status
```

`git diff --check` passed. The final task worktree status is clean.

## TDD evidence

RED: ran the exact suite command above before changing the helper. Existing assertions passed; six new valid complete-mode invocations failed because the helper did not recognize `--complete --source`, returning 2 instead of 0:

```text
  [FAIL] complete mode accepts a caller-supplied immutable source
    expected: 0
    got:      2
  [FAIL] roast complete mode exits 0
  [FAIL] large final review accepted
  [FAIL] long roast accepted
  [FAIL] task report with successful status can retain concerns
  [FAIL] recognized explicitly empty review succeeds
report-verdict: 6 failure(s)
```

Assertions dependent on successful JSON extraction were guarded and unmeasured during RED; they were exercised and passed during GREEN. GREEN: same command after implementation passed; it passed again after rebase. Tests catch dropped sections/severities, deduplication, reset positions at repeated labels, path-derived identities, capped or normalized-away text, loss of continuations, invalid JSON escaping, status precedence, and malformed sources returning success/empty output. Expectations are hand-written source values, with actual CLI execution and built-in JSON parsing.

## Files changed

- `skills/super-code/scripts/report-verdict` — additive extraction branch and interface comments.
- `tests/super-code/test-report-verdict.sh` — focused temporary complete-mode fixtures and assertions; existing tests retained unchanged.

## Test hygiene

No leaked processes and no survivors. After each suite run and the compatibility probe, `stop-run-processes --check` exited 0 with no output when invoked from outside the owned roots. The first RED-run check invoked from inside the task worktree refused that root (exit 2) because it contained the check's working directory; rerunning from `/Users/alepar/AleCode/superpowers` passed. No process was killed for that refusal. Final cleanup uses the same owned worktree and `/tmp/sp-bce79baa/super-plan-ufz.8.2` roots. No background server/daemon/watcher was started.

All fixture temp state was under the task TMPDIR. HOME and XDG_CONFIG_HOME/XDG_CACHE_HOME/XDG_DATA_HOME/XDG_STATE_HOME were isolated for helper/test invocations. Runtime binaries are system Bash/Node; the suite and package-under-test scripts resolved to this task worktree. This repository has no install step or external dependencies for these shell/Node built-in checks.

## Assumptions

Current bead and comments were read before the brief. No amendments or conflicts were present. Source identity is an opaque caller-supplied immutable reference and is not a content hash or disposition judgment. Markdown item text means item content without the outer list marker, retaining all inner formatting/continuations; exact full source bytes remain at the artifact. Strict failures expose an evidence gap rather than inventing an empty clean review.

## Concerns

No implementation blocker. Complete mode intentionally rejects unsupported/non-finding reports and empty/truncated finding sections even where the legacy compact summary remains permissive. Permission-denied regular-file reads are handled by filesystem exceptions, while the portable deterministic unreadable-input fixture uses a directory; no permission changes were made. The parent owns integration, tracker closure, full sweep and fresh-agent behavior evaluations; these were not run for this deterministic extraction task.

## Git evidence

Initial base: `444ae642f59a22886526b41538eafadd8ff9faca`.
Rebased base: `560a05eb83cdc44013ea528e99854151c2f17d12`.
Head: `f38393ed8234df0cfc4c193f2936cae3a48c41a9`.
Branch: `task-super-plan-ufz.8.2`.
Stacked: false. Reopened: false.
