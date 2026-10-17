# Coordinator Compaction — Re-inject Run State, Read Less, Stay Warm

## Goal

A super-auto / super-code coordinator survives context compaction on Claude Code and Codex
without losing its loop: after every compaction it holds the run's live state and its core rules
(injected by a hook, not recalled from the summary), and it fills its context more slowly because
it reads only what it needs to route work. On Claude Code, Workflow waits no longer trigger idle
compaction.

## Problem

Measured 2026-10-15 over local runs (raw data and scripts:
`~/Documents/Agent_Context_Peak_Research_20261015/`).

**Codex.** All 13 super-auto coordinators compacted, 228 times in total, and the count grows with
run length. Each compaction carries only ~30K tokens (median; p90 52K) of a 258K window forward,
then the context grows ~190K before the next one. In practice the coordinator gets lost on big
runs: it drifts off the skill's loop (the scripted `dispatch-text` / `ledger-digest` flow is barely
used), accumulates cruft that a fresh session immediately cuts (a hand-off to a fresh agent, Codex
or Opus, ran markedly faster), and in the worst case waits forever on a child that cannot finish,
because nothing in its remaining context tells it to bound the wait. What entered root context
(44.8M tokens, chars/4 estimate, ±~20%):

| Source | Share |
|---|---|
| Plans, specs, source the coordinator read itself | ~24% |
| Reasoning (residual) | ~14% |
| Skill and coordinator docs (super-auto/SKILL.md read 256×; re-read after 124 of 228 compactions) | ~13% |
| Child report files read from disk | ~12.5% |
| Coordinator's own file edits / state writes | ~10% |
| herdr-threads CLI output | ~5% |
| git (mostly `git diff`) | ~4% |
| bd + ledger | <2% |
| Child final answers (median 140 tokens, p90 256) | ~1% |

Polling is heavy too: up to 1,675 `wait_agent` calls in one run (~64% timed out), up to 609
`list_agents` calls.

**Claude Code.** 10 of 13 Workflow-mode coordinators compacted, 27 times in total. Split by the
time between the last assistant turn and the `compact_boundary`:

| Kind | Count | Gap | Pre-compaction size |
|---|---|---|---|
| Idle compaction | 20 | 54.3–56.5 min (every one) | 205K–937K |
| Cap hit | 5 | 0.1–1.6 min | ~967K |
| Manual `/compact` | 3 | 0.9–2.0 min | 409K–913K |

Idle compaction is Claude Code's (v2.1.290+) compaction of a 200K+ conversation left idle ~54 min,
before its one-hour prompt cache expires; it fires while still idle. `"idleCompaction": false` in
settings.json disables it; `CLAUDE_CODE_IDLE_COMPACT_MIN_TOKENS` raises its minimum. 6 of the 20
fired while the coordinator waited on a Workflow task notification; the rest were between
activities in multi-day sessions. Cap hits occur only in 1,200–1,900-agent sessions. Context
growth there is mostly the coordinator's own work: thinking ~23%, its own outputs (inline docs,
heredocs, agent prompts) ~22%, Bash output ~20% (broad `sed -n`, grep, cat; ledger/run.md/bd/
run-profile <1.5% together), skill bodies ~9% (Claude Code re-injects invoked skills after each
compaction, 25–36K per compaction), Workflow completion notifications ~6%, subagent hand-backs ~6%.

## Design

Four parts, both harnesses unless noted.

### 1. Run marker

At launch, once `run.md` exists, super-auto (and a standalone super-code run) registers the
coordinating session:

```
scripts/run-marker register --run-md <path> --ledger <path> --epic <id> --skill <super-auto|super-code>
scripts/run-marker clear
```

`register` writes `~/.local/state/superpowers/active-runs/<session_id>` with the `run.md` path,
ledger path, epic id, skill, harness and start time. The session id is `$CLAUDE_CODE_SESSION_ID`
on Claude Code and `$CODEX_THREAD_ID` on Codex. `register` is idempotent; resume calls it again to
refresh paths. Finish calls `clear`. `register` also prunes markers older than 14 days whose
`run.md` is gone or whose phase is done.

A marker is **live** only if its `run.md` exists and its phase is not done. The marker format lives
in `run-marker` alone; the hook and `run-digest` read it through the script.

### 2. Re-inject hook

The plugin already ships a `SessionStart` hook (`hooks/session-start`, matcher
`startup|clear|compact`) that re-injects `using-superpowers`. It is a plugin hook, so it fires in
every session where superpowers is enabled; it is extended rather than duplicated.

- When the event's source is `compact` and a live marker exists for the hook input's `session_id`,
  the hook appends a run block after the existing content. In every other case its output is
  unchanged.
- Codex 0.162 supports `SessionStart` with a `compact` source and `additionalContext`; the Codex
  plugin manifest (`.codex-plugin/plugin.json`, currently `"hooks": {}`) gains the wiring, emitting
  the JSON shape Codex consumes.

The run block comes from `scripts/run-digest <marker>`, hard-capped at ~6K tokens:

- **Live state.** Phase from `run.md`; `ledger-digest` output (landed / in flight / failed /
  retries); open beads in the epic; in-flight dispatches with their age where the harness exposes
  it, reusing `run-profile`'s discovery (Workflow run dirs on Claude Code, child rollouts on
  Codex). Unknown ages are printed as unknown, never guessed.
- **Coordinator card.** Static file `skills/super-code/coordinator-card.md`, ~1.5–2.5K tokens: the
  loop rules (refill, early unblock, one merge at a time), bounded waits, "block on wait, don't
  poll `list_agents`" on Codex, the read rule (§3), which script answers which question, and the
  gates at which a named section of a full skill doc is worth re-reading. It replaces the
  whole-doc re-read after compaction.

### 3. Read rule and cheap scripts

The coordinator reads only what it needs to route work. Plans, specs, source, diffs and full child
reports are read by children; the coordinator receives a verdict plus a path. Stated in the card,
in `super-code/SKILL.md`, `coordinator-subagents.md` and `super-auto/SKILL.md`.

- New `scripts/report-verdict <file>`: prints a child report's verdict, blocking findings and path
  in ≤ ~20 lines.
- Dispatch prompts (implementer, reviewer, fix, merge, triage, plan, and the report/drafter roles,
  which produced the largest answers) end with the matching contract: final answer = one verdict
  line plus the report path.
- On Claude Code the same applies to Workflow completion `result` fields and subagent hand-backs:
  verdict plus path, not review text.

### 4. Keepalive during Workflow waits (Claude Code)

While a Workflow runs, the coordinator keeps one background `sleep 2700` armed. If it fires before
a Workflow notification, the coordinator checks progress briefly and re-arms; it stops re-arming
when the Workflow returns. This resets the ~54-minute idle timer at the cost of one cached read per
45 minutes. Between runs, idle compaction behaves as today.

## Failure handling

- **The hook never breaks a session.** No marker, an unreadable marker, or a non-`compact` source
  → output byte-identical to today. If `run-digest` errors or exceeds ~5 s, the hook still emits
  the card (static) plus one line: read state from `run.md` and run `ledger-digest`.
- **Size cap.** Overflow truncates the in-flight list with "+N more, see ledger-digest"; the card
  is never cut.
- **Stale markers.** Liveness check plus `register`'s prune and Finish's `clear`. A resumed session
  keeps its session id, so its marker correctly still applies.
- **Unrecognised report.** `report-verdict` prints `verdict: unknown`, the path and the first ~10
  lines; the coordinator dispatches a child to read it instead of reading it itself.
- **Keepalive after the Workflow returned.** No active Workflow → no re-arm. At most one stray
  wake per arm.

## Testing

- `tests/hooks/test-session-start.sh`: unchanged output without a marker; run block on `compact`
  with a live marker; nothing extra on `startup`; fallback block when `run-digest` fails or hangs;
  size cap; correct JSON shape for Claude Code and Codex.
- New `tests/super-code/test-run-marker.sh` (register / clear / prune / done-phase liveness),
  `test-run-digest.sh` and `test-report-verdict.sh` on fixture runs, reusing the run-profile
  fixtures for in-flight discovery.
- `tests/codex/test-marketplace-manifest.sh` and `tests/codex-plugin-sync/` extended for the Codex
  hook wiring.
- **Live check.** A small super-auto run on each harness with a compaction forced mid-run
  (`/compact` on Claude Code, a low compaction limit on Codex). Pass: the run block appears; the
  coordinator does not re-read whole skill docs; it continues from the digest; it does not read
  child reports directly. Compare skill-doc share, report-read share and post-compaction size
  before and after, using the 2026-10-15 measurement scripts.

## Out of scope

- Forced / agent-triggered compaction (Claude Code mods can call `$.session.compact`; rejected).
- Codex compaction settings (handled separately).
- Disabling idle compaction globally.
- Splitting oversized beads that a single implementer cannot finish.
- herdr-threads output volume.
- A script-driven `codex exec` loop as a Workflow substitute.

## Post-Implementation Notes

**2026-10-16 — Changes vs. original design.** Implemented by the combined coordinator/subagent compaction design and shipped in 6.4.2-alepar6.0. Run-state injection uses separate compact-hook entries, a capped digest, and a static coordinator card. Codex uses a dedicated hooks manifest and its own session-keyed fallback marker. Live Codex session-id equality and context-limit behavior, Workflow-agent compact payloads, and idle-keepalive effectiveness remain unverified. See the combined run report for validation and deferred findings.

> *As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
