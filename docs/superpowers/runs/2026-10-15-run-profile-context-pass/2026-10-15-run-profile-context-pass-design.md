# run-profile Context Pass — Peak Context and Compactions per Agent

Root spec of super-auto run `2026-10-15-run-profile-context-pass`.

## Goal

`skills/super-code/scripts/run-profile` reports, for every agent of a super-code / super-auto run
(the coordinator session and each dispatched agent, on Claude Code with or without Workflow and on
Codex), the largest context the agent held, its window, that peak as a percentage, its first
request's context, and each compaction with its cause (cap, early, idle, manual). It does so as
ledger-ready per-agent lines and a run summary line, plus a Markdown table and a JSON block. A
context-only mode does the same for any session that is not a profiled super-code run, and fixture
tests in `tests/super-code/test-run-profile.sh` cover every transcript format.

## Problem description

Agents in super-auto runs compact, and nobody can see it. A scan on 2026-10-15 of the 13 real
super-auto runs on Codex found that every coordinator compacted (228 compactions in all) and 157
of 2,112 subagents compacted (309 compactions), mostly long implementers and whole-epic reviewers.
On Claude Code, 10 of 13 super-auto coordinators compacted, many of them far below the cap, which
suggests idle compaction. Compaction loses detail mid-task, but no run artifact records it:
`run-profile` reads the same transcripts for timing and ignores their token usage. The research
behind this design (`~/Documents/Agent_Context_Peak_Research_20261015/final_report.md`) found that
both harnesses log enough to rebuild each request's context size and every compaction, after the
fact, with no setup.

## Main challenges

The two harnesses log context differently. Claude Code puts token usage on every assistant row
but never records the window, so the window must come from a model table. Codex records the
window, but splits usage across three row kinds (the compaction request appears only in two of
them) and lets the window change mid-session. Forked Codex children replay their parent's
history, compactions included, so a naive count credits every child with its parent's
compactions. Compaction causes are not logged: Claude Code's `auto` trigger covers both the cap
and idle compaction, and Codex compacts in the background well below its hard limit. Finally,
`run-profile` today is built around beads: a run whose dispatch names do not map to beads, or a
session that is not a coordinator at all, exits before any output. Context measurement must not
depend on that mapping.

## Key decisions made

The context pass is a separate module, `skills/super-code/scripts/context-pass.mjs`, with one
reader per harness that turns a transcript into a uniform per-agent record. `run-profile.mjs`
collects the transcripts each run type already locates, runs the readers, and prints the
results. The new lines follow the existing ledger convention, `Profile: context — …`, rather than
new `Context:` / `Metrics:` prefixes. `Metrics:` is the coordinator's own Finish tally, and the
ledger copies `run-profile` output as `Profile:` lines, which `upstream-feedback` already reads. A
new `--context-only` mode prints the context lines for any session, bypassing the bead and
coordinator checks. Causes are classified from sizes and gaps, and the rules are stated in the
output's documentation, not hidden.

## Decision points, by section

### Module boundary

**Recommended:** a new ES module `skills/super-code/scripts/context-pass.mjs`, imported by
`run-profile.mjs`, exporting pure functions: `claudeContext(rows, opts)`, `codexContext(rows,
opts)`, `claudeWindow(model, override)`, `summarizeContext(agents, opts)` and
`contextLines(summary, opts)`. Each reader takes parsed rows and returns an `AgentContext` record
(below). It does no file discovery and no printing, so it can be tested directly with
synthetic rows. **Considered:** adding the code inline to `run-profile.mjs` (already 1,500 lines,
built as one top-level script, so the new logic could not be unit-tested without running the
whole profiler); a separate CLI script (it would duplicate `run-profile`'s transcript discovery for
all three run types).

### The per-agent record

**Recommended:** `AgentContext` = `{ harness: 'claude'|'codex', role: 'coordinator'|'agent', label,
file, model, requests, peak, peakAt, first, window, windowSource, peakPct, compactions: [{ at,
trigger, pre, post, model, window, gapMs, cause }], unmeasured }`, where `requests` counts the usage rows read and `peak`,
`first`, `pre` and `post` are tokens. The record-level `model` and `window` are the peak row's
values; each compaction is stamped with the model and window in effect at its own row (the latest
usage row before it), and its cause is classified against that stamp. `post` is informational:
Claude's `postTokens` counts the conversation only, not the system and tools baseline, so it is not
comparable with `peak`. `windowSource` is `transcript` (Codex), `table` (Claude model
table), `override` (CLI flag) or `inferred` (raised because an observed size exceeded the table
window). `unmeasured` is a reason string when no usage row was found, and then `peak` is `null`, not
0. A record is measured exactly when `peak !== null`; that decides the summary's `measured <M>`
count. A record whose window cannot be found (a Codex rollout with no `model_context_window`) is
still measured: it keeps its peak but has `window: null`, `peakPct: null` and causes `unknown`,
and its `no window recorded` reason goes only on the `Profile: unmeasured` line, not in the
record's `unmeasured` field. **Considered:** per-task-span records (Codex children are already split into task spans for
timing, but context belongs to the transcript, not the span: a resumed child carries its context
across spans).

### Claude Code reader

**Recommended:**
- **Usage rows:** read every row with `type: "assistant"` and a `message.usage`, skipping
  `message.model === "<synthetic>"`. Context is `input_tokens + cache_read_input_tokens +
  cache_creation_input_tokens`.
- **Duplicates:** rows repeated for one response share `message.id` and carry the same input
  side, so max and first are unaffected; `requests` counts distinct `message.id`s.
- **Compactions:** a row with `type: "system"`, `subtype: "compact_boundary"` is a compaction,
  with `compactMetadata.trigger`, `preTokens` and `postTokens`. `post` falls back to the next
  usage row's context when `postTokens` is absent.
- **Peak:** `max(context, every preTokens)`.
- **First:** the first usage row's context. A fork's first request carries its inherited
  context, so a high `first` identifies a fork without a separate marker.

**Considered:** deduplicating by `requestId` (same effect, and `message.id` is present on more rows
in the local corpus).

### Claude Code window

**Recommended:** `claudeWindow(model, override)` returns `{ window, compactAt, source }`.
- **The table:** models in the Opus 4.7+, Opus 5, Sonnet 5, Fable and Haiku 5.5 families have a
  1,000,000 window; every other model, Opus/Sonnet 4.6 and older included, has 200,000; a model id
  ending `[1m]` has 1,000,000. `compactAt` is `window − 33,000`, Claude Code's reserved buffer,
  which gives the observed 967K point on 1M models.
- **Override:** `--context-window <N>` overrides the table for every Claude agent of the run,
  standing in for an unrecorded `CLAUDE_CODE_AUTO_COMPACT_WINDOW`.
- **Inference:** an agent whose peak exceeds its table window is reported against the next
  larger window, `source: inferred`. Inference raises every window stamp in the record, and
  `compactAt` with it, so its compactions are classified against the inferred window.
- **Reporting:** the unmeasured line names `table` windows once per run, so a reader knows the
  percentage rests on the table.

**Considered:** reading the window from `~/.claude/settings.json` (it describes the user's current
settings, not the run's); skipping the percentage for Claude (it is the number the user asked for,
and the table is right for every model in the local corpus).

### Codex reader

**Recommended:**
- **Own rows only:** skip every row before `session_meta.payload.subagent_history_start_ordinal`
  (a row index into the rollout; the rows before it are the replayed ancestor history). Only
  the rollout's first `session_meta` row (its own) supplies the ordinal; replayed ancestor
  `session_meta` rows after it are ignored. Absent means 0.
- **Context per request:** the maximum over `event_msg` `token_count` →
  `info.last_token_usage.input_tokens` (cached tokens are already included),
  `token_usage_record.usage.input_tokens` and `compacted.latest_token_usage_record.usage.input_tokens`.
  `total_token_usage` is cumulative and never read. The compaction request appears only in the
  last two, and can be the largest request of the session.
- **Window:** `info.model_context_window`, tracked per row; the value in effect at a row is the
  latest seen before it, else the first after it. `window` is the value at the peak row, and each
  compaction carries the value at its own row.
- **Compactions:** each `compacted` row, `pre` from its `latest_token_usage_record.usage`, `post`
  from the next `token_count` with nonzero input.
- **Requests:** counts nonzero `token_count` rows.

**Considered:** counting `item_completed` `ContextCompaction` rows as well (they mark the same
compactions; the `compacted` row also carries the size).

### Compaction cause

**Recommended:** one rule per harness, applied in `summarizeContext`.
- **Claude:** `trigger: "manual"` → `manual`. `auto` with `pre ≥ 0.95 × compactAt` → `cap`.
  Otherwise `auto` with a gap of 50 minutes or more since the last timestamped assistant usage
  row before the boundary → `idle` (housekeeping and system rows written while idle do not reset
  the gap; with no such row, the gap is unknown and the rule falls through). Any other
  `auto` → `early` (sub-cap, not idle: unexplained, reported as such).
- **Codex:** `pre ≥ 0.9 × window` (the compaction's own window) → `cap` (Codex's auto limit is
  at most 90% of the window). With no window, `unknown`. Otherwise → `early`, which covers background compaction from 65% and lowered configured limits.
  Codex logs no manual marker that can be told apart, so Codex has no `manual`, and the
  documentation says so.

**Considered:** a single threshold for both (the caps differ by design); treating every sub-cap
Claude `auto` as idle (it would hide the unexplained cases that the gap test separates).

### Which agents, per run type

**Recommended:** context is measured per transcript file, deduplicated by real path across
invocations. Targets are taken from the runs that survive run-profile's existing filters (the
dry-run skip, the by-run-id dedupe and `--latest`), after the load block and before the first
exit that follows it. Every coordinator session file gets one run window (§The coordinator's
window of rows); when the same file arrives from several runs (repeated `--workflow` or
`--subagents`, `--discover`), the windows are merged into their union. Ordinary subagents and
Codex descendants are scoped to the run by the same window: one whose first row falls outside it
belongs to other work in that session and is left out. A Workflow run directory is already
run-scoped, and `--session` measures the whole session: every row and every agent, with no window
and no caveat.
- **Workflow run directory:** each `agent-<id>.jsonl`, labelled as timing labels it. The
  coordinator is the session that owns the run: the directory is
  `<session>/subagents/workflows/wf_<id>`, so the session file is `<session>.jsonl`, three
  levels up plus the extension.
- **Ordinary subagents on Claude Code:** each `agent-<id>.jsonl` in the `subagents/` directory,
  labelled by `.meta.json` `description`, plus the calling session `<session>.jsonl` as
  coordinator.
- **Codex:** the coordinator's own rollout(s), plus every descendant rollout (children found
  transitively through `thread_spawn.parent_thread_id`), labelled by `agent_path`.

**Considered:** limiting Claude subagents to those whose label maps to a bead (it would drop
design-phase and roast agents, which compact too).

### The coordinator's window of rows

**Recommended:** the coordinator session usually predates the run, and may host several runs.
The run's coordinator rows form a window `[start, end)`, found from an anchor time `T0`:
- **`T0`:** the earliest start among the run's own dispatches. For a Workflow run, that is the
  earliest agent transcript in its run directories. For an ordinary-subagent or Codex run, it is
  the first dispatch timing maps to a bead. When timing has no mapped dispatch (bead mapping
  failed, the exit-3 path, or `--context-only` with `--subagents`/`--codex`), `T0` is the
  session's end.
- **`start`:** the latest `super-auto` invocation at or before `T0`, so a super-auto run's design
  and roast phases are included while an earlier run in the same session is not; when no
  `super-auto` invocation precedes `T0`, the latest `super-code` invocation at or before it. A
  super-code invocation inside a super-auto run (phase 3, fix-loop re-entries) does not move
  `start`. A resumed super-auto run counts from its resume invocation; its earlier rows belong to
  whichever session ran them.
- **`end`:** the next `super-auto` invocation after `start`, else the session's end.

An invocation is:
- on Claude Code, a genuine prompt row (`type: "user"`, not `isMeta`, its content not a
  `tool_result`) containing a `<command-name>` element naming `/super-auto` or `/super-code`,
  either with or without a `superpowers:` prefix, or an assistant `Skill` tool use whose `skill`
  is `super-auto` or `super-code`, with or without that prefix;
- on Codex, a user `response_item` containing `$super-auto`, `$super-code`, or the injected
  `<name>superpowers:super-auto` / `super-code` skill block.

When no invocation is found, `start` is the first row, and `coordinator rows counted from the
session start (no invocation found)` is added to the unmeasured line (never for `--session`, which
has no window). Rows after the run's last activity but before `end` are counted too: compaction
after the run still happened to that coordinator, and `peakAt` makes it visible. **Considered:** counting only within the run's timing window (it would miss
design-phase compactions in a super-auto coordinator, which the user asked about).

### Output lines

**Recommended:**
- **Summary line:** `Profile: context — agents <N> (measured <M>) · peak≥80% <n> · compacted <a>
  agents, <c> compactions (cap <x> · early <y> · idle <z> · manual <w> · unknown <v>) · coordinator <peak>K/<window>K
  (<pct>%), <k> compactions · max <label> <pct>%`, with zero-count causes left out.
- **Absent values:** a null peak, window or percentage prints as `unmeasured` (a null window
  prints `<peak>K (window unknown)`), never as 0. The coordinator segment reads `coordinator
  unmeasured` when its record has no peak and is left out when the run has no coordinator record;
  with several coordinator records it shows the largest-peak record's peak and window and the
  summed compactions. `max` ranges over measured records with a percentage.
- **Per-agent lines:** one `Profile: context agent — <label> peak <N>K/<W>K (<pct>%) · first <N>K ·
  compactions <n> (<cause> <k>, …)` for each agent that compacted or peaked at 50% or more of its
  window. At most 10 such lines, ordered by compactions then peak%; a final `Profile: context agent
  — <k> more in --out` line covers the rest.
- **Placement:** before `Profile: unmeasured`, which gains the context reasons (unmeasured agents,
  table windows, a coordinator counted from the session start). On a path that prints no
  `Profile: unmeasured` line today (exit 3, the missing-epic die, context-only mode), the helper
  prints one after the context lines whenever any context reason exists.
- **Markdown:** `--out` adds a `## Context` section with every agent in a table (label, role,
  model, requests, first, peak, window, source, peak%, compactions with causes and sizes).
- **JSON:** `--out` gains a `context` key `{ agents: [AgentContext…], summary }`.
- **Baseline:** `--summarize` prints one `Baseline: context — …` line aggregating compacted agents
  and compactions by cause across the profiles that have a `context` key.

**Considered:** the `Context:` / `Metrics: context` prefixes first proposed in chat (they would
collide with the coordinator's `Metrics:` tally and fall outside the `Profile:` lines the ledger
and `upstream-feedback` already carry); printing every agent on stdout (a 400-agent run would flood
the ledger).

### Context-only mode

**Recommended:** `--context-only` with any of `--codex <thread|rollout>`, `--subagents <dir>`,
`--workflow <dir>`, or a new `--session <session.jsonl>`.
- **What `--session` reads:** that Claude Code session as coordinator, every
  `<session>/subagents/agent-*.jsonl` and every `<session>/subagents/workflows/*/agent-*.jsonl`.
- **What the mode skips:** the coordinator check, epic resolution, ledger and `bd` reads, and the
  timing profile.
- **What it prints:** the summary and per-agent lines (with `--out`, the Markdown section and
  JSON) and exits 0. With no usage rows anywhere it prints `Profile: context — unavailable —
  <why>` and exits 3.
- **Normal mode:** a profiled run whose timing exits early (exit 3, or bead mapping failure)
  still prints its context lines before exiting, since context does not need beads.

**Considered:** a separate script (duplicate discovery); requiring an epic (most sessions worth
checking are not super-code runs).

### Tests and validation

**Recommended:**
- **Unit tests:** `context-pass.mjs` is tested with synthetic rows. The cases: duplicate rows
  for one response, a `<synthetic>` row, a cap boundary, an idle boundary (50-minute gap), a
  manual boundary, a sub-cap non-idle boundary, the Claude window table with override and
  inference, a Codex rollout whose compaction request exceeds every `token_count`, a mid-session
  window change, and a forked Codex child whose replayed rows hold a `compacted` row.
- **End-to-end:** `run-profile` gets fixtures for a Workflow run, ordinary Claude subagents, a
  Codex coordinator with a forked child, and `--context-only --session`, extending the existing
  fixture builders.
- **Where they live:** all tests in `tests/super-code/test-run-profile.sh`.
- **Validation:** one bead runs `--context-only --codex` on the 13 real Codex super-auto
  coordinators listed in `~/Documents/Agent_Context_Peak_Research_20261015/cx_out2.txt`. Each
  run's compacted-agent and compaction counts must match that file, or every difference must be
  explained, and the result is recorded in `MAINTENANCE.md`. Where the local data is absent the
  bead records that and passes on the fixtures alone.

**Considered:** checking real rollouts in CI (they live only on the maintainer's disk).

### Documentation

**Recommended:** document the new lines and modes in three places:
- `run-profile`'s usage text;
- `skills/super-code/SKILL.md`'s `run-profile` reference line;
- `skills/super-code/MAINTENANCE.md`'s Run profile section, covering the field paths, the cause
  rules, the window table and how it breaks.

Add the `Profile: context` lines to the list `skills/upstream-feedback/report-template.md` copies
from the ledger. No change to how the coordinator records the profile: it already copies every
`Profile:` line. **Considered:** documenting in the research report only (it is outside the repo).

## Follow-on (not in this tree)

Ideas for avoiding compaction in subagents and coordinators are being brainstormed separately; this
tree only measures.

## Key abstractions

**context-pass** (new module, `skills/super-code/scripts/context-pass.mjs`): the pure core of the context measurement. It turns parsed rows into per-agent records, then into a summary and its rendered output.
- Owns: the per-harness readers, the Claude window table, compaction-cause classification, the run summary, and every rendering of context data: the `Profile: context` lines, the `## Context` Markdown table, the `context` JSON value and the `Baseline: context` line for `--summarize`.
- Hides: transcript field paths, how duplicate rows are dropped, which Codex rows are replayed history, the model→window table and the 33K buffer, the cause thresholds, and the line formats (ordering, the cap of 10 lines, leaving out zero-count causes).
- Must not: read files, walk directories, resolve sessions, print or exit. All of that stays in run-profile. It imports nothing from run-profile.
- Relationships: run-profile depends on context-pass, never the reverse. The tests import it directly with synthetic rows.
- Lifecycle: a stateless ES module. The model table is a frozen constant.
- Errors: it throws nothing on bad rows. A malformed row is skipped. A transcript with no usage row still yields a record, with `unmeasured` set and `peak: null`. Callers tell measured from unmeasured by `peak === null`, never by `peak === 0`.

**Harness entry** (new: a frozen table `HARNESSES = { claude, codex }` inside context-pass): one record per harness that bundles that harness's reader, window resolution, cause rule and coordinator-invocation marker.
- Owns: everything that differs by harness. That is 4 operations across the 2 kinds that exist today. The Claude entry composes `claudeContext` and `claudeWindow`, including table, override and inference. The Codex entry composes `codexContext`, whose window comes from the transcript and is tracked per row. Each entry also holds its own cause rule and invocation matcher.
- Hides: which harness-specific rule applies. `summarizeContext` and run-profile look an entry up by `record.harness` (or `target.harness`) in this one table and never test `harness === 'claude'` themselves.
- Must not: hold run-type logic, i.e. how a Workflow, subagents or Codex run lays out its files. That belongs to the run-profile source listers.
- Relationships: composition of plain functions. The table is the one registry where a harness kind is chosen.
- Errors: none of its own. The readers' unmeasured reasons pass through it.

**AgentContext** (new record type, a plain object as spec'd): the uniform per-agent record. It is the seam between the readers and everything downstream, and it is also what `--out` JSON writes.
- Owns: the spec's fields. To fill a gap, each compaction also carries the raw facts its cause needs, chiefly the gap since the last timestamped assistant usage row (§Compaction cause). `cause` is left empty until summarize fills it.
- Must not: be built outside a harness reader. Run-profile adds only the `label`, `role` and `file` it was handed.

**Context targets** (new, in run-profile: one source lister per run type): each lister turns a located run into a list of transcripts to measure (file, harness, role, label, model).
- Owns: where transcripts live. Workflow: each `agent-<id>.jsonl`, plus `<session>.jsonl` three levels up. Ordinary Claude subagents: each `agent-<id>.jsonl`, plus `${dirname(d)}.jsonl`. Codex: the coordinator's rollout(s), plus descendants found transitively through the cached `codexIndex` parent links. `--session`: the session file, its `subagents/agent-*.jsonl` and `subagents/workflows/*/agent-*.jsonl`. It also owns the dedupe by real path (one step over all targets, keeping the earliest cutoff for a duplicated coordinator file), the row cutoff for coordinators (§The coordinator's window of rows) and the scoping of agent transcripts by that cutoff.
- Hides: the run-type layouts from context-pass.
- Must not: parse usage or decide anything about context. Note that today `readCodex` sees only direct children. The transitive walk is for context only and leaves timing unchanged.
- Relationships: `readRun`, `readCodex` and `readSubagents` are extended to return their targets next to the timing data they already compute. `--session` gets a fourth lister. The lister results go through dedupe, then `readJsonl`, then the harness entry's reader.
- Lifecycle: built once per process, after load and **before** any early exit, so all exit paths share one context result.
- Errors: a missing directory, or a file that is not a rollout, is exit 2 as today. A target file that is missing or unreadable becomes an unmeasured record and never aborts the run.

**run-profile.mjs**, extended: it parses `--context-only`, `--session` and `--context-window`; it builds the context result once; and one helper places that result into each output. The helper puts the context lines before `Profile: unmeasured`, adds the context reasons to that line, and adds the `context` key and the `## Context` section to `--out`. The outputs that use it are the full profile, the no-bead partial (exit 0), the `Profile: unavailable` path (exit 3), the missing-epic die and context-only mode. `--summarize` delegates its context line to context-pass.

Variation:
- **Harness** (2 kinds now; Gemini CLI is a likely next one). Absorbed by `HARNESSES` in context-pass; that table is the one place a kind is chosen.
- **Run type** (workflow, subagents, codex, session). Absorbed by one source lister each in run-profile.
- **Model windows.** A new model family is a new row in the window table.
- **Causes** are a closed enum (cap, early, idle, manual). Rendering always walks them in that fixed order.

Walk-through: `run-profile --workflow <dir>` runs `readRun`, which yields the timing plus targets: every agent transcript, and the session file as coordinator with the first-dispatch cutoff. The targets are deduped by real path and read with `readJsonl`. Each one goes through `HARNESSES.claude` (its reader, then `claudeWindow`), which returns an `AgentContext`. `summarizeContext` classifies each compaction with that entry's cause rule and builds the summary and the unmeasured reasons. `contextLines` renders the result, and the helper places it in whichever exit path the timing takes.

Future change: adding Gemini CLI touches one new harness entry (its reader, window, cause rule and invocation matcher) and one new source lister plus its flag in run-profile. `summarizeContext`, the renderers and the exit paths stay unchanged.

- Per spec §Compaction cause: causes are applied in `summarizeContext`, not in the readers. So readers must record the raw gap on each compaction, and summarize looks up the per-harness rule through the harness entry. That split is intended.
- Per spec §Claude Code window: only Claude has a window function (table, override, inferred). Codex takes its window from the transcript. The asymmetry is intended.
- Per spec §Context-only mode: `--context-only` deliberately branches past the coordinator check, epic resolution, the ledger, `bd` and the timing profile. Normal mode prints context before its early exits. Both are intended branches in run-profile's main flow.
- Per spec §Module boundary: readers take parsed rows, not paths, so file I/O and `readJsonl` stay in run-profile.
- Gap filled (the spec does not decide this): with more than one coordinator record, which happens with a resumed Codex thread that has several rollouts, the summary's coordinator figures use the largest peak and the summed compactions.
- Gap filled (since settled in §The coordinator's window of rows): in context-only mode with `--workflow`, `T0` is the earliest agent start in its directories; with `--subagents` or `--codex`, `T0` is the session's end; `--session` has no window.

Digest:
- context-pass: owns per-harness reading, windows, cause classification, summary and every context rendering (lines, Markdown, JSON, baseline);
  new context logic and new output formats are added here; callers never parse usage fields or format context lines themselves.
- Harness entry: owns everything that differs by harness (reader, window, cause rule, invocation marker);
  a new harness is one new entry in `HARNESSES`; callers never branch on `harness`.
- AgentContext: owns the uniform per-agent record and the raw compaction facts;
  new measured facts are added as fields set by the readers; callers never build one outside a reader, and never treat a null `peak` as 0.
- Context targets: owns which transcripts each run type contributes, the dedupe by real path and the coordinator cutoff;
  a new run type is one new lister; context-pass never discovers files.

Design roast round 1 (2026-10-15) amended §The per-agent record, §Codex reader, §Compaction cause,
§Which agents, §The coordinator's window of rows and §Output lines: one cutoff per session anchored
on the earliest super-auto invocation, a stricter invocation matcher, per-compaction model and
window stamps, the idle gap from the last assistant usage row, the first `session_meta` only, and
rendering rules for absent values. Round 2 converged; its punch list was applied inline: the
coordinator window became `[start, end)` from an anchor `T0`, bounded by the next `super-auto`
invocation, with agents scoped to the same window; `--session` has no window; inference raises
the compaction stamps; targets come after run-profile's run filters; "measured" means a non-null
peak.

## Post-Implementation Notes

**Changes vs. original design (2026-10-15):** readers take the whole transcript plus `[fromRow, toRow)` spans instead of a row slice, so model, gap and window state carries from row 0 (code roast round 1). The coordinator Finish docs now say to append run-profile's whole stdout on every exit path, which overrides this design's "no agent-facing change" constraint; the human is to confirm or revert. `contextBaseline` dedupes records across a run's super-code invocations, but its file-only key undercounts runs that share one coordinator session (open, post-cap audit). Open from the final review: `contextResult` holds every parsed transcript in memory before reducing them (OOM risk on very large runs). Validated on 13 real Codex runs and 13 Claude coordinator sessions (MAINTENANCE.md).

> *As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*

### 2026-10-15 — run-profile integration (super-plan-fqb.2)

- When `summary.measured === 0` the output is the single `Profile: context — unavailable — <why>` line and no context reason is added to `Profile: unmeasured`, so every pre-existing fixture (whose transcripts carry no usage rows) keeps `Profile: unmeasured — none`.
- A Workflow run directory gets a coordinator target only in a session layout (parent `workflows`, grandparent `subagents`), where the coordinator is `<dirname³(dir)>.jsonl` and a missing file is an unmeasured coordinator record; a directory outside that layout has no coordinator record.
- Coordinator records are labelled `coordinator`, or `coordinator:<k>` (k from 1, in target order) when more than one coordinator file results; Workflow agents use the timing label (else `agent-<id>`), Claude subagents their `.meta.json` `description` (else `agent-<id>`), and Codex descendants their `agent_path` without the leading `/root/` (else the thread id).
- One context result is built per process, lazily by the first exit path that asks, and memoized so every path prints the same result; the ordinary-run anchor T0 reads the bead mapping, so on the missing-epic exit (mapping not yet run) T0 is the session's end, the spec's "no mapped dispatch" rule.
- Each run contributes one `runRows` window per coordinator file and the windows of one file are merged as a union; the reader gets the whole file with the merged windows as `spans` (`[fromRow, toRow)` pairs in original row indices). It tracks the carry-over state (model, the last request's time, the Codex window) over every row, counts requests, peak, first and compactions only inside a span, and never takes a compaction's post from past its span's end. Agents are scoped by the same windows converted to time, and an agent whose first timestamped row lies in none of its run's spans is left out.
- `--session` requires `--context-only` (else exit 2), `--context-only` refuses `--discover` and `--summarize` (exit 2), `--context-window` must be a positive number (exit 2) and a `--session` file that does not exist is exit 2; exit 3 prints the context lines, then the context `Profile: unmeasured` line when reasons exist, then `Profile: unavailable — …`, and still writes no `--out` files.
- A context-only `--out` writes `<prefix>.json` = `{ version: 1, contextOnly: true, context }` and `<prefix>.md` = `# Context profile` plus the `## Context` section; such a JSON has no `criticalPath`, so `--summarize` refuses it like a partial profile.
