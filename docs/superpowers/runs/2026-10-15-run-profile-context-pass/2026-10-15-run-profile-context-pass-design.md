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
trigger, pre, post, cause }], unmeasured }`, where `requests` counts the usage rows read and `peak`,
`first`, `pre` and `post` are tokens. `windowSource` is `transcript` (Codex), `table` (Claude model
table), `override` (CLI flag) or `inferred` (raised because an observed size exceeded the table
window). `unmeasured` is a reason string when no usage row was found, and then `peak` is `null`, not
0. **Considered:** per-task-span records (Codex children are already split into task spans for
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
  larger window, `source: inferred`.
- **Reporting:** the unmeasured line names `table` windows once per run, so a reader knows the
  percentage rests on the table.

**Considered:** reading the window from `~/.claude/settings.json` (it describes the user's current
settings, not the run's); skipping the percentage for Claude (it is the number the user asked for,
and the table is right for every model in the local corpus).

### Codex reader

**Recommended:**
- **Own rows only:** skip every row before `session_meta.payload.subagent_history_start_ordinal`
  (a row index into the rollout; the rows before it are the replayed ancestor history). Absent
  means 0.
- **Context per request:** the maximum over `event_msg` `token_count` →
  `info.last_token_usage.input_tokens` (cached tokens are already included),
  `token_usage_record.usage.input_tokens` and `compacted.latest_token_usage_record.usage.input_tokens`.
  `total_token_usage` is cumulative and never read. The compaction request appears only in the
  last two, and can be the largest request of the session.
- **Window:** `info.model_context_window`, tracked per row; `window` is the value in effect at
  the peak row (the latest seen before it, else the first after it).
- **Compactions:** each `compacted` row, `pre` from its `latest_token_usage_record.usage`, `post`
  from the next `token_count` with nonzero input.
- **Requests:** counts nonzero `token_count` rows.

**Considered:** counting `item_completed` `ContextCompaction` rows as well (they mark the same
compactions; the `compacted` row also carries the size).

### Compaction cause

**Recommended:** one rule per harness, applied in `summarizeContext`.
- **Claude:** `trigger: "manual"` → `manual`. `auto` with `pre ≥ 0.95 × compactAt` → `cap`.
  Otherwise `auto` with a gap of 50 minutes or more since the previous row → `idle`. Any other
  `auto` → `early` (sub-cap, not idle: unexplained, reported as such).
- **Codex:** `pre ≥ 0.9 × window` → `cap` (Codex's auto limit is at most 90% of the window).
  Otherwise → `early`, which covers background compaction from 65% and lowered configured limits.
  Codex logs no manual marker that can be told apart, so Codex has no `manual`, and the
  documentation says so.

**Considered:** a single threshold for both (the caps differ by design); treating every sub-cap
Claude `auto` as idle (it would hide the unexplained cases that the gap test separates).

### Which agents, per run type

**Recommended:** context is measured per transcript file, deduplicated by real path across
invocations.
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

**Recommended:** the coordinator session usually predates the run. Its rows are counted from its
last `super-auto` or `super-code` invocation at or before the run's first dispatch:
- on Claude Code, a user row containing `<command-name>/super-auto` or `/super-code`, or a `Skill`
  tool use whose `skill` is `super-auto` or `super-code` (either with or without a
  `superpowers:` prefix);
- on Codex, a user `response_item` containing `$super-auto`, `$super-code`, or the injected
  `<name>superpowers:super-auto` / `super-code` skill block.

When no invocation is found, count from the first row and add `coordinator rows counted from the
session start (no invocation found)` to the unmeasured line. Rows after the run's last activity
are counted too: compaction after the run still happened to that coordinator, but `peakAt` makes
it visible. **Considered:** counting only within the run's timing window (it would miss
design-phase compactions in a super-auto coordinator, which the user asked about).

### Output lines

**Recommended:**
- **Summary line:** `Profile: context — agents <N> (measured <M>) · peak≥80% <n> · compacted <a>
  agents, <c> compactions (cap <x> · early <y> · idle <z> · manual <w>) · coordinator <peak>K/<window>K
  (<pct>%), <k> compactions · max <label> <pct>%`, with zero-count causes left out.
- **Per-agent lines:** one `Profile: context agent — <label> peak <N>K/<W>K (<pct>%) · first <N>K ·
  compactions <n> (<cause> <k>, …)` for each agent that compacted or peaked at 50% or more of its
  window. At most 10 such lines, ordered by compactions then peak%; a final `Profile: context agent
  — <k> more in --out` line covers the rest.
- **Placement:** before `Profile: unmeasured`, which gains the context reasons (unmeasured agents,
  table windows, a coordinator counted from the session start).
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

## Post-Implementation Notes

> *As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
