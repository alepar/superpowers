# Audit plan instrumentation — design

## Goal

The five super-* skills emit the measurements the 2026-09-04 audit found missing, guard test integrity per task, filter roast findings for scope before they become fix beads, and record why every bead-graph edge exists — and `upstream-feedback` gathers all of it into one `## Run metrics` section of the issue it files.

Source: `audit-report.md` §Recommendations P1–P4, plus the bead-graph item.

## Non-goals

- No held-out test partition, no CapReward-style capped tests.
- No change to the judge panel's shape or seat count (R4 deferred until seat-agreement data exists).
- No edits under `skills/subagent-driven-development/` (byte-identical to upstream).
- No version bump, no release, no marketplace manifest change in this tree.

## Approach

Each producer skill emits its metric into an artifact it already owns and commits; `upstream-feedback` gathers and renders. No shared metrics file, no cross-skill copies — pointers and artifact reads only, per super-auto's boundary.

## Components

### 1. super-roast — seat agreement (P1a)

The reporter already receives every packet's `votes[]`. Over **panel-tier** findings (tier `panel` or `promoted`, `valid == 3`) it computes:

- pairwise agreement per seat pair: `rr` (reproduce/refute), `rg` (reproduce/ground), `fg` (refute/ground) — fraction of panels where the two verdicts are identical;
- `unanimous` — fraction where all three verdicts are identical;
- `ground-loo` (leave-one-out) — over the subset of panels where reproduce and refute **agree** with each other, the fraction where ground's verdict equals theirs; reported with that subset's size. (Roast round 1: the earlier "ground-alone parity" against the ≥2-of-3 outcome included ground in its own majority and equals (1 − rr + rg + fg)/2 — no information. Leave-one-out is the statistic R4 actually needs.)
- per-seat verdict counts `C/R/U` (CONFIRM/REJECT/UNVERIFIED) for each seat, so a chance-corrected coefficient can be computed post hoc from the marginals.

One new header line, after `independence:`:

```
seat-agreement: panels N · rr 0.78 · rg 0.89 · fg 0.67 · unanimous 0.56 · ground-loo 0.83 (n=6) · reproduce 7/2/0 · refute 5/4/0 · ground 6/3/0
```

Omitted entirely when N = 0. Two-decimal fractions. Spot-tier and beyond-cap packets are excluded (one or zero votes). `votes[]` is positionally indexed `[reproduce, refute, ground]` for panel and promoted tiers — the engine's `panel()` dispatches the seats in that order — and the reporter prompt's packet-contract section must state this convention explicitly (roast round 1 Nit), since the reporter never sees the engine.

Files: `skills/super-roast/reporter-prompt.md` (a new step + the template line), `skills/super-roast/SKILL.md` (Report format block), `skills/super-roast/super-roast-workflow.md` (header list where it enumerates lines).

### 2. super-roast — testing-lane hunts (P2b)

`scout-prompts-pr.md` `## Lane: testing` gains three explicit hunt items: expected values hardcoded to match the visible test inputs; assertions weakened, loosened, or removed in the diff; test files deleted, renamed away from the runner's glob, or marked skip/xfail without a stated reason. Existing lane structure (Scope / Hunt list / Pragmatism filter) unchanged.

### 3. super-code — merge outcome lines (P1b)

After every serial merge, one ledger line appended by the existing `ledgerAppendPrompt` path:

```
Merge: <bead-id> — rebase <clean | conflict: N files> · seam-review <none | cleared | fixed> · gate <pass | fail>
```

- `rebase` from the merge agent's own report (it already rebases and reports conflicts).
- `seam-review` from whether `seamReviewPrompt` was dispatched and its outcome.
- `gate` from the declared gate's result.

**The line is written on both paths** (roast round 1 Should-fix): after a successful merge, and on the blocker-bead path when a merge fails — a red gate that survived the one auto-resolve attempt, or an unresolvable rebase — with `gate fail` / `rebase conflict: N files` and a trailing ` → blocker` marker. Without the failure-path line, `gate-fails G` is unreachable and `rebase-conflicts C` undercounts exactly the failures the audit asked to measure. Stub keys `ledger-append:merge:<id>` (success path) and `ledger-append:merge-failed:<id>` (blocker path). The dryRun scenarios that reach a merge gain the first; the breaker/blocker scenario gains the second.

### 4. super-code — Metrics block at Finish (P1c)

At Finish, before the final review, one mechanical dispatch reads the ledger and appends **four separate ledger lines, via four `ledgerAppendPrompt` calls** — that path appends exactly one physical line per call and strips embedded newlines (roast round 1, applied from the unjudged list; count corrected to four in roast round 2):

```
Metrics: merges M · merge-failed Mf · rebase-conflicts C · seam-reviews S (fixed F) · gate-fails G
Metrics: fix-loop round 1: A1 addressed / E1 entered · round 2: … · round 5: …
Metrics: fix-loop breaker-tripped: B
Metrics: ledger-check <ok | M≠completed: M vs N>
```

Sources, stated: **M counts success-path `Merge:` lines only; `Mf` counts ` → blocker` lines** (roast round 2: comparing a both-paths M against the `completed` bucket, which never holds a failed merge, would report a false mismatch on exactly the runs with failures); C, S, F, G from `Merge:` lines on both paths (§3); `E_r` = count of distinct tasks with a fix-round line for round r, `A_r` = sum of `<X> addressed` on those lines; `B` = count of `complete (… parked)` completion lines plus `BLOCKED` lines whose reason is the breaker cap. The former count `tasks entering round ≥4` equalled `E4` and is dropped. The fourth line cross-checks M against the coordinator's `completed` bucket size — the ledger-append path is fire-and-forget and can lose lines, so a count with no check is a count nobody can trust (roast round 1 Nit); with M defined over success-path lines the check reads `ok` on a lossless run with failures.

**Resume dedupe rule** (roast round 1 Should-fix; operation corrected in roast round 2): a coordinator resume re-enters a mid-loop task from the brief stage and its fix loop restarts at round 1, so the ledger can hold two series of fix-round lines for the same task. The Metrics parser **dedupes by series**: for each bead id, it drops every fix-round line that precedes that bead's **last** `fix round 1/5` line, keeping only the final attempt's series; `E_r` and `A_r` are computed over that set. (Per-round last-occurrence, the round-1 wording, would have kept rounds 2 and 3 of an abandoned attempt.) No attempt marker is added to the line.

Parsed from the `Merge:` lines and from per-round fix-loop ledger lines. **The coordinator does not currently write a per-round line** — only `complete`, `minor (deferred)` and `BLOCKED-AUTH` lines; `reviewAndFix` keeps round state in memory. So §4 has a prerequisite: `reviewAndFix` appends a per-round line after every re-review, through `ledgerAppendPrompt`, stub key `ledger-append:fix-round:<id>:<r>`. **Its shape is the coordinator's own ledger-line shape, not SDD's verbatim** (roast round 1, applied from the unjudged list — the coordinator's `LEDGER_LINE_RE` requires the bead id in parentheses after the ordinal, and the Metrics parser needs the bead id to group by):

```
Task <N> (<bead-id>): fix round <R>/5 (<X> addressed, <Y> open — <finding one-liners>; commits <a7>..<b7>)
```

This mirrors SDD's ledger contract (its resume rule reads "a task whose last line is a fix round is mid-loop") in the coordinator's dialect; the coordinator's coarse resume is unchanged and says so explicitly. Stub key for the block: `ledger-append:metrics` (one dispatch per line; the stub key is suffixed `:1`, `:2`, `:3`, `:check`). Returned as a new additive field `metrics` — an array of exactly the four lines, in order — alongside `sweep`.

### 5. super-code — test-changes block (P2a)

In `reviewPrompt` assembly (the coordinator, not `scripts/review-package`), the reviewer dispatch is instructed to run, **itself, in the task worktree** (the coordinator script has no shell — each reviewing dispatch computes its own block; roast round 1, applied from the unjudged list):

```
git diff --stat <base>..HEAD -- <test pathspecs>
git diff <base>..HEAD -- <test pathspecs>
```

**Default test pathspecs** (roast round 1 **Blocking**: the earlier `'**/tests/**'` never matches a top-level `tests/` tree under git's pathspec rules — this repo's own suite was invisible — and bare `'**/test*'` matched prose files):

```
'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'
```

(Roast round 2: the bare-filename alternates are required too — under git's pathspec rules `'**/*_test.*'` never matches a root-level `main_test.go`, `index.test.js`, `test_foo.py`, or `foo_spec.rb`.)

and receives it as a `## Test changes` block with the rule: **a test deleted, skipped, loosened, or whose expected values were edited to match the implementation, with no justification in the brief, is NEEDS_FIX** — put it in `finding`. An empty block is stated as `Test changes: none`, and **the reviewer must state the command it ran** — a `none` with no command is INVALID, the same way an empty review package is (a reviewer that skips the diff must not be indistinguishable from a clean task). The stat diff is always included; the full diff is capped at 400 lines, beyond which the block carries the stat plus `full diff truncated at 400 lines — re-run with a narrower pathspec if needed`; a diff-command error is reported verbatim as INVALID. The block is required in **every** review dispatch on the task: the initial review, every re-review round inside the fix loop (where pressure to weaken tests is highest), and the seam review. For the seam review the range is the **post-rebase** one — `merge-base <integration-tip> <rebased-branch>..HEAD` — not `<base>..HEAD`, which spans sibling tasks' changes once the branch has been rebased. `config.testPaths` (optional, array) replaces the defaults; an empty array is rejected at pre-flight with the defaults retained and a logged warning — a misconfiguration must not silently disable the guard.

Replay harness: prompt-text assertions that the initial review, the re-review, and the seam-review dispatch texts each contain the `Test changes` instruction, the NEEDS_FIX rule, and the command-stated rule; a **fixture-repo assertion** that the default pathspecs, run as a real `git diff` in a scratch repo with a deleted `tests/x/y.sh`, a deleted `src/foo_test.go`, and a deleted root-level `main_test.go`, list all three deletions (the earlier defaults would have listed none); no new agent stub (the diff runs inside the reviewer dispatch, which is already stubbed).

### 6. super-auto — scope filter on phase-5 findings (P3)

Before filing fix beads, dispatch one fresh-context pass (sonnet) with `./scope-filter-prompt.md`: inputs are the root spec's `## Goal`, the spec's stated scope/non-goals, and the roast's `## Confirmed findings`. For each finding it returns `in-scope` or `punch-list` with one line of reason. Rules in the prompt: **Blocking findings are always in-scope** — super-auto never overrules severity, so the filter only ever demotes Should-fix and below. A Should-fix/Nit/FYI finding is in-scope iff fixing it is required for the goal as stated; everything else is punch-list.

In-scope → beads as today. Punch-list → `report.md` Remaining section, tagged `out of scope (filtered)`. `run.md` records `scopeFilter-round-<N>: <finding-key> in-scope | punch-list — <reason>` under `approvals` (auto), where **`<finding-key>` is the report's own entry prefix `[SEV] <location>` verbatim** — the roast report defines no finding id, and this prefix is the stable key the report already renders (roast round 1, applied from the unjudged list). A resume matches on it exactly and replays. **Each `scopeFilter-round-<N>` block in `run.md` ends with one aggregate line, written by super-auto in the same phase-5 step: `scope-filter: <in-scope> in-scope · <punch> punch-listed`** — super-auto owns it, `run-state.md` item 7 shows it, and upstream-feedback's gather reads it into the `## Run metrics` Coverage subsection (§10), so the demotion rate is visible, never silent (roast round 2: the line previously had no producer).

Files: `skills/super-auto/SKILL.md` (phase 5 row + Red Flags), `run-state.md` (item 7 shape), `report-prompt.md` (Remaining sourcing), new `scope-filter-prompt.md`.

### 7. super-auto — metrics pointer in report.md

`report-prompt.md`: the status block gains one line `metrics: <path of the upstream-feedback draft or issue URL>` sourced from `run.md`'s `feedback:` field or the parked draft path. No metrics content in `report.md`. **Ordering** (roast round 1, applied from the unjudged list): phase 6 writes `report.md` *before* invoking upstream-feedback, so on the first write the line reads `metrics: pending (upstream-feedback not yet run)`; after upstream-feedback returns — filed, parked, or nothing to file — phase 6 rewrites that one line in place with the issue URL, the parked draft path, or `metrics: none (clean run, nothing filed)`. super-auto SKILL.md's phase-6 row states the rewrite.

### 8. super-design — requirement traceability count (P4)

Root pass only. **The orchestrator produces the canonical requirement list once** — before dispatching the round, from the root `## Goal` and the root spec: one observable outcome per requirement, numbered R1…Rn — and passes the same list to all three reviewers as a new `## Requirements (canonical)` input section (roast round 1 Should-fix: three isolated reviewers each numbering their own list yields a union with no shared referent). `coverage-reviewer-prompt.md`'s new first step: for each canonical requirement, list the task ids that deliver it; a reviewer may additionally propose a missing requirement as `R-new: <text>` (which the orchestrator adds to the canonical list for the next round), but never renumbers. **The orchestrator writes the canonical list itself (R-id + text, `R-new` appends included) into `run.md`'s `coverage-round-<N>` record, and round 2 or a resume reads it back from there rather than re-deriving it** — otherwise R-ids are not stable across rounds or a resume and the per-round `unmapped: K (R3, R7)` lines are not comparable (roast round 2 Nit). Output a `requirements` block before the findings list. Each unmapped requirement is also emitted as a `GAP` finding (existing path fixes it). The orchestrator unions the three reviewers' unmapped sets by canonical id, and writes to the round summary and to `run.md`'s `coverage-round-<N>` record:

```
requirements: N · mapped: M · unmapped: K (R3, R7)
```

Per-subepic passes do not enumerate (their `## Goal` is local; the root pass is the traceability check).

### 9. super-design — edge reasons in bead descriptions

Every `bd dep add <dependent> <blocker>` made by §Decomposition, §Splitting a Bead, §Coverage (NARRATIVE-EDGE repoint, UNOWNED-SEAM wiring, UNSATISFIABLE-ACCEPTANCE unwired, sweep edges), and §Adversarial Review Loop is paired with a literal line in the **dependent's** description:

```
blocked-by <blocker-id>: consumes <artifact — interface, schema, file, or recorded decision>
```

Removing or re-pointing an edge updates the line (`bd update --description` with the full text, per the existing wholesale-replace rule). The NARRATIVE-EDGE check reads the line: an edge with no `blocked-by` line, or one whose artifact cannot be resolved to the blocker's deliverable, is reported with `unstated` in the evidence. Sweep and seam-contract edges use the fixed artifacts `all leaves (integration sweep)` and `boundary contract`.

Files: `skills/super-design/SKILL.md` (Decomposition edge rules, Splitting, Coverage fixes, sweep), `coverage-reviewer-prompt.md` (NARRATIVE-EDGE evidence).

### 10. upstream-feedback — gather and render `## Run metrics`

Gather step adds four inputs: every roast report's `seat-agreement:` line (with mode, iteration, **and its `independence:` line** — the main confounder when comparing agreement across runs; roast round 1 Nit); the ledger's `Merge:` lines and `Metrics:` block; each coverage round's `requirements:` line and each fix round's `scope-filter:` line; and a bead-graph dump from `bd list --label sp:<root> --json --status all --limit 0` (**`--limit 0` is required** — `bd list` defaults to 50 rows and would silently truncate a larger tree; roast round 1, applied from the unjudged list). The analyst prompt gains `## Run metrics` / `[RUN_METRICS]` after Graph shape. Edges whose dependent carries no `blocked-by` line render with the dependent id, the blocker id from the dump's `dependencies` array, and reason `unstated`.

`report-template.md` gains, between `## Defects` and `## Design questions`:

```
## Run metrics
### Judge panel
<one line per roast report: mode, iteration, independence, seat-agreement line>
### Fix loop
<Metrics: fix-loop lines>
### Merge-back
<Metrics: merges line + ledger-check line; count of Merge: lines with conflict / seam-review fired / gate fail / → blocker>
### Coverage
<requirements: line per coverage round; scope-filter: line per code-roast fix round>
### Bead graph
| id | type | title | what (first sentence of description) |
| dependent | blocker | reason (from `blocked-by` line, or `unstated`) |
```

Always filled; `none` under a subsection whose source was absent (and named in `## Not established`). Scrubbing rules apply to the graph tables as to any other content (titles and descriptions are project nouns; ids are bead ids). The graph tables never leave the machine unscrubbed without the user seeing them: upstream-feedback's step 7 already shows the final body verbatim before any `gh` write, and a parked draft is presented at the finish menu — the tables are included in that presentation, not summarized away.

## Data flow

super-design (bead descriptions, coverage summary, run.md) → super-code (ledger) → super-roast (report header) → super-auto (run.md, report.md pointer) → upstream-feedback gather (reads all of the above + `bd list --json`) → `## Run metrics` in the draft/issue.

## Error handling

Every metric is optional at the consumer: a missing source is `none` plus a `## Not established` line, never a failed filing. A roast with zero panels omits the line. A run with no ledger (standalone super-design) has no Fix loop / Merge-back subsections. A bead with no `blocked-by` line for an edge renders `unstated`. **Known caveat, stated in the template's Not established section by default:** the coordinator's ledger-append path is fire-and-forget and can lose a line without the coordinator noticing, so every ledger-derived count is a lower bound; the `Metrics: ledger-check` line (§4) is the one cross-check that exists (roast round 1 Nit).

## Testing

- `tests/super-code/test-coordinator-replay.sh`: new stub keys `ledger-append:merge:<id>`, `ledger-append:merge-failed:<id>`, `ledger-append:fix-round:<id>:<r>` and `ledger-append:metrics:*` in the scenarios that reach them; prompt-text assertions for the `Test changes` block, its NEEDS_FIX rule and its command-stated rule in the initial-review, re-review and seam-review dispatch text; the §5 fixture-repo pathspec assertion; return-shape assertion for `metrics`. **Arithmetic is pinned, not trusted** (roast round 1, applied from the unjudged list): one replay scenario feeds a known ledger (two merges, one failed merge, one task with three fix rounds, one resumed task whose attempt 1 reached round 3 and whose attempt 2 resolved at round 1) and asserts the exact four `Metrics:` lines the Finish dispatch must produce — including `merges 2 · merge-failed 1`, `ledger-check ok`, and E2 == E3 == 0 for the resumed task; the seat-agreement worked example in `reporter-prompt.md` is likewise a fixed three-packet input with the exact expected line.
- Prompt-only changes: a manual read of the assembled text for the seat-agreement arithmetic worked example. `trigger-micro-test.md` exists only for super-code and upstream-feedback and probes the frontmatter description, which no task here changes — it is re-run only if a task edits a description.
- No live run is part of this tree; the first live super-auto run after merge is the measurement.

## Configuration

`config.testPaths` (super-code, optional): array of pathspecs replacing the default test globs. Exercised by a replay assertion that the override replaces, not appends to, the defaults.

## Follow-on (outside this tree)

After one live run with these metrics: decide R4 (panel adaptivity) from seat-agreement data; decide the per-task cap from fix-loop yield; decide whether requirement counts predict design-origin defects.
