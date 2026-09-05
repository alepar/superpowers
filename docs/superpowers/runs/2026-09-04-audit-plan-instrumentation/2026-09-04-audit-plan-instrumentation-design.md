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
- `ground-alone parity` — fraction where the ground seat's verdict equals the panel's ≥2-of-3 outcome.

One new header line, after `independence:`:

```
seat-agreement: panels N · rr 0.78 · rg 0.89 · fg 0.67 · unanimous 0.56 · ground-alone parity 0.89
```

Omitted entirely when N = 0. Two-decimal fractions. Spot-tier and beyond-cap packets are excluded (one or zero votes).

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

Stub key `ledger-append:merge:<id>`. The dryRun scenarios that reach a merge gain this stub.

### 4. super-code — Metrics block at Finish (P1c)

At Finish, before the final review, one mechanical dispatch reads the ledger and appends:

```
Metrics: merges M · rebase-conflicts C · seam-reviews S (fixed F) · gate-fails G
Metrics: fix-loop round 1: A1 addressed / E1 entered · round 2: … · round 5: …
Metrics: fix-loop tasks entering round ≥4: K · breaker-tripped: B
```

Parsed from the `Merge:` lines and from per-round fix-loop ledger lines. **The coordinator does not currently write SDD's per-round line** (`Task <N>: fix round <R>/5 (<X> addressed, <Y> open — …; commits <a7>..<b7>)`) — only `complete`, `minor (deferred)` and `BLOCKED-AUTH` lines; `reviewAndFix` keeps round state in memory. So §4 has a prerequisite: `reviewAndFix` appends that exact SDD line after every re-review, through `ledgerAppendPrompt`, stub key `ledger-append:fix-round:<id>:<r>`. This also closes a gap against SDD's own ledger contract (its resume rule reads "a task whose last line is a fix round is mid-loop"). Stub key for the block: `ledger-append:metrics`. Returned as a new additive field `metrics` (the three lines) alongside `sweep`.

### 5. super-code — test-changes block (P2a)

In `reviewPrompt` assembly (the coordinator, not `scripts/review-package`), the reviewer dispatch additionally runs, in the task worktree:

```
git diff --stat <base>..HEAD -- '**/test*' '**/*_test.*' '**/*.test.*' '**/spec/**' '**/tests/**'
git diff <base>..HEAD -- <same paths>
```

and receives it as a `## Test changes` block with the rule: **a test deleted, skipped, loosened, or whose expected values were edited to match the implementation, with no justification in the brief, is NEEDS_FIX** — put it in `finding`. An empty block is stated as `Test changes: none`. The same block is handed to `seamReviewPrompt`. The path globs are a default; `config.testPaths` (optional) overrides them per project.

Replay harness: a prompt-text assertion that the review dispatch text contains the `Test changes` instruction and the NEEDS_FIX rule; no new stub (the diff runs inside the reviewer dispatch, which is already stubbed).

### 6. super-auto — scope filter on phase-5 findings (P3)

Before filing fix beads, dispatch one fresh-context pass (sonnet) with `./scope-filter-prompt.md`: inputs are the root spec's `## Goal`, the spec's stated scope/non-goals, and the roast's `## Confirmed findings`. For each finding it returns `in-scope` or `punch-list` with one line of reason. Rules in the prompt: **Blocking findings are always in-scope** — super-auto never overrules severity, so the filter only ever demotes Should-fix and below. A Should-fix/Nit/FYI finding is in-scope iff fixing it is required for the goal as stated; everything else is punch-list.

In-scope → beads as today. Punch-list → `report.md` Remaining section, tagged `out of scope (filtered)`. `run.md` records `scopeFilter-round-<N>: <finding-id> in-scope | punch-list — <reason>` under `approvals` (auto). A resume replays it.

Files: `skills/super-auto/SKILL.md` (phase 5 row + Red Flags), `run-state.md` (item 7 shape), `report-prompt.md` (Remaining sourcing), new `scope-filter-prompt.md`.

### 7. super-auto — metrics pointer in report.md

`report-prompt.md`: the status block gains one line `metrics: <path of the upstream-feedback draft or issue URL>` sourced from `run.md`'s `feedback:` field or the parked draft path. No metrics content in `report.md`.

### 8. super-design — requirement traceability count (P4)

`coverage-reviewer-prompt.md`, root pass only: a new first step — enumerate the root `## Goal`'s requirements (one observable outcome each, numbered R1…Rn), and for each list the task ids that deliver it. Output a `requirements` block before the findings list. Each unmapped requirement is also emitted as a `GAP` finding (existing path fixes it). The orchestrator unions the three reviewers' unmapped sets, and writes to the round summary and to `run.md`'s `coverage-round-<N>` record:

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

Gather step adds four inputs: every roast report's `seat-agreement:` line (with mode and iteration); the ledger's `Merge:` lines and `Metrics:` block; each coverage round's `requirements:` line; and a bead-graph dump from `bd list --label sp:<root> --json --status all`. The analyst prompt gains `## Run metrics` / `[RUN_METRICS]` after Graph shape.

`report-template.md` gains, between `## Defects` and `## Design questions`:

```
## Run metrics
### Judge panel
<one line per roast report: mode, iteration, seat-agreement line>
### Fix loop
<Metrics: fix-loop lines>
### Merge-back
<Metrics: merges line; count of Merge: lines with conflict / seam-review fired / gate fail>
### Coverage
<requirements: line per round>
### Bead graph
| id | type | title | what (first sentence of description) |
| dependent | blocker | reason (from `blocked-by` line, or `unstated`) |
```

Always filled; `none` under a subsection whose source was absent (and named in `## Not established`). Scrubbing rules apply to the graph tables as to any other content (titles and descriptions are project nouns; ids are bead ids).

## Data flow

super-design (bead descriptions, coverage summary, run.md) → super-code (ledger) → super-roast (report header) → super-auto (run.md, report.md pointer) → upstream-feedback gather (reads all of the above + `bd list --json`) → `## Run metrics` in the draft/issue.

## Error handling

Every metric is optional at the consumer: a missing source is `none` plus a `## Not established` line, never a failed filing. A roast with zero panels omits the line. A run with no ledger (standalone super-design) has no Fix loop / Merge-back subsections. A bead with no `blocked-by` line for an edge renders `unstated`.

## Testing

- `tests/super-code/test-coordinator-replay.sh`: new stub keys `ledger-append:merge:<id>` and `ledger-append:metrics` in the canonical scenario; prompt-text assertions for the `Test changes` block and its NEEDS_FIX rule in the review and seam-review dispatch text; return-shape assertion for `metrics`.
- Prompt-only changes: a manual read of the assembled text for the seat-agreement arithmetic worked example. `trigger-micro-test.md` exists only for super-code and upstream-feedback and probes the frontmatter description, which no task here changes — it is re-run only if a task edits a description.
- No live run is part of this tree; the first live super-auto run after merge is the measurement.

## Configuration

`config.testPaths` (super-code, optional): array of pathspecs replacing the default test globs. Exercised by a replay assertion that the override replaces, not appends to, the defaults.

## Follow-on (outside this tree)

After one live run with these metrics: decide R4 (panel adaptivity) from seat-agreement data; decide the per-task cap from fix-loop yield; decide whether requirement counts predict design-origin defects.
