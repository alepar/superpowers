# Subagent Compaction — Fresh Agent per Round, Assembled Inputs, Shaped Units

## Goal

Keep super-code and super-auto subagents (implementers, fixers, reviewers, whole-epic reviewers, and
the history and assess passes the coordinator improvises) from reaching their context cap and
compacting. The observable outcome comes from the next profiled Codex super-auto run:
- implementer compaction falls from 15% toward the single-task baseline of about 5%;
- no agent receives more than one task;
- the whole-epic final review no longer runs near the window.

The changes are harness-neutral. Codex is the primary target, because it compacts. On Claude Code's
1M windows the same changes reduce context size and cost.

## Problem

This section summarizes measurements taken on 2026-10-15. The evidence is in
`~/Documents/Agent_Context_Peak_Research_20261015/` (the compaction survey) and
`~/Documents/Subagent_Task_Sizing_Research_20261015/` (deep research: `final_report.md`, four
dossiers, and the local analyses `workers/w5`, which predicts peaks, and `workers/w6`, which measures
reading waste).

- **Codex, 13 super-auto runs, 2,112 subagents.**
  - 157 subagents compacted (7.4%), 309 times in all.
  - Implementers account for the most compactions (21% compacted by label in the survey, 15% of the
    371 implementer-like agents in w5).
  - The coordinator's improvised roles were the next worst: history readers 33%, first-gate 80%,
    assess 38%.
  - Whole-epic and convergence reviewers compacted repeatedly.
  - Roasters (2%) and adapters (3%) almost never compacted.
- **Claude Code: no compactions.** None of 12,955 subagents compacted on 1M models. 400 exceeded 200K
  and the largest reached 921K.
- **Reuse across rounds is the dominant cause.** Compaction by number of tasks one implementer
  received:

  | Tasks received | Implementers | Share that compacted |
  |---|---|---|
  | 1 | 269 | 5% |
  | 2–3 | 65 | 23% |
  | 4 or more | 37 | 73% |

  - The 4-or-more group accounts for 82 of the 117 implementer compactions.
  - Follow-up tasks start with a median of 118,859 tokens already in context.
  - 28 of the 29 implementers that compacted within their first task had received five or more
    steering messages from the parent, so steering by message counts as reuse too.
  - The reuse comes from the skill itself: `skills/using-superpowers/references/codex-tools.md` says
    "Fix rounds: resume the implementer with `followup_task` … Never dispatch a fresh implementer"
    (upstream `28882fc`).
- **Planned scope barely predicts the peak.**
  - Brief size: AUC 0.50.
  - Number of files the brief lists: AUC 0.48.
  - Size of those files on disk: AUC 0.52 overall; Spearman 0.31 against first-task peak, from 15
    compaction positives.
  - External work agrees. Nothing known before a run narrowed cost ranges in a 424k-session study, and
    identical reruns differ by a median 1.55x.
- **Reading is necessary, not wasteful.**
  - File reads are about 50% of what accumulates in an agent's context.
  - The avoidable share is about 1% (strict) and 4–6% (upper bound). Re-reads are 1.4–1.9% of reads.
  - Codex already caps command output at about 10K tokens.
  - Agents that compacted had *less* avoidable reading than average.
  - Prompt rules about reading would therefore be redundant (w6).
- **Whole-epic review.** Single whole-epic reviewers ran at 327–339K of a 354K window even without
  reuse, so one epic's inputs can fill one agent.
- **External guidance agrees on the unit of work.** Vendors and practitioners converge on one feature
  or logical unit per session, with compaction as a backstop ("compaction isn't sufficient",
  Anthropic). No study gives an optimal task size. Splitting along dependencies beats naive per-file
  splitting: pass rate 68.1% against 56.8%, and 28% cheaper. Over-splitting and parallel sub-agents
  cost 1.4–3.3x the tokens for no gain on bounded tasks. An explicit list of obligations recovered
  agents whose quality had dropped in long contexts: 10 of 10 runs passed, against 5 of 10 with a
  generic "validate" instruction.

## Decisions

These were taken during brainstorming, 2026-10-15:
- Every fix round and re-review goes to a fresh agent.
- No goals, token budgets, stop hooks or self-monitored handoff. Each brief carries an explicit
  acceptance checklist instead.
- No reading-discipline prompt rules, because the w6 data shows little to gain.
- The brief assembler serves the read-heavy reviewers only, not implementers.
- super-design's sizing stays qualitative now and becomes numeric later, from calibration data.
- The final review switches between one reviewer and a split by subsystem, depending on input size.
- A context pre-flight check lives inside the skill: it warns and never stops.

## Design

### 1. Dispatch lifecycle

**Fresh agent per round.**
- **`skills/using-superpowers/references/codex-tools.md`:** replace the "Fix rounds" bullet. Every fix
  pass, seam fix, check fix, re-review and re-assessment is a new `spawn_agent {fork_turns: "none"}`.
  `followup_task` is limited to chasing or clarifying a report the same job owes. It is never used for
  new work, a new round, or steering that changes scope.
- **Shared reference:** the same reference serves `subagent-driven-development`, which gets the same
  rule, since it describes the same harness behaviour.
- **`skills/super-code/coordinator-subagents.md`:** state the rule for the ordinary-subagent
  coordinator, including that a steering message which adds work counts as a new round.
- **Workflow coordinator:** it already dispatches a fresh `agent()` per step and is unchanged.

**Handoff by path.** A fresh agent gets paths, not pasted content:
- the brief;
- the previous report;
- the worktree and its `base..head` range;
- the findings to address;
- the acceptance checklist.

The implementer prompt's "Fix pass" section already reads these. The change is that they are the
agent's only memory of the earlier round.

**Bounded briefs for improvised dispatches.** When the coordinator dispatches a role that isn't in
the skill's dispatch table (history reader, assess, first gate, absorb, and similar), the dispatch
must state:
- its input paths;
- its single output file;
- its scope and what's out of scope;
- the checklist it must satisfy;
- that it is one fresh agent with one job.

The coordinator splits a large input across several such agents instead of handing one agent a whole
history. The rule goes in `coordinator-subagents.md` and in the coordinator contract of
`coordinator-workflow.md`.

### 2. Assembled inputs for read-heavy reviewers

**A new shared role, the brief assembler,** with a prompt template in `skills/super-code/`.
- **Model:** Sonnet on Claude. On Codex, the cheapest V2 preset in the session's actual spawn
  allowlist. The template names no model.
- **Job:** it gathers inputs with tool calls and judges nothing.
- **Output:** a directory in the plan workspace holding:
  - `digest.md`, carrying whichever of these the consumer needs: the diffstat, per-task report
    summaries (status, assumptions, concerns), the interfaces and seams, the ledger's deferred minors,
    and bead-comment amendments;
  - `slices/`, holding the relevant hunks or file ranges;
  - a size line per file, in tokens estimated as characters divided by 4;
  - one `fits: yes|no` line against a threshold the dispatch provides.
- **Consumers:**
  - **Roast-code:** the assembler prepares the diff and repo-context inputs that
    `super-roast/scripts/assemble-args` then packs.
  - **The whole-epic final review:** see below.
  - **Improvised history and assess passes:** they read the digest instead of raw history.
- **Not implementers.** Implementers are steered by the planner's read list (Section 3).

**Size switch for the final review.**
- **Fits:** if the assembled inputs fit under 40% of the final reviewer's window (the window comes from
  Section 4), one opus reviewer works from the digest and slices. It opens code only for a named risk,
  the same one-check-per-risk rule `task-reviewer-prompt.md` already uses.
- **Doesn't fit:** the assembler also writes clusters, grouping changed files by import and call edges
  and falling back to directory, never by file count. One reviewer takes each cluster. A seam reviewer
  receives only the cluster verdicts plus the cross-cluster hunks and interfaces.
- **The verdict** keeps today's shape (`ready` or `not ready (<summary>)`).
- **The ledger** records the mode and the reason, for example
  `Final review: split (inputs 212K > 40% of 354K) · clusters 4`.

### 3. Shaped units (sizing)

**super-design** (`promotion-reviewer-prompt.md` and the decomposition guidance it enforces).
- **The size test** keeps its wording and adds that a LEAF delivers one feature in one subsystem.
- **Dependency grouping:** a leaf must not split tightly coupled work. Files that call and import each
  other heavily belong to the same leaf.
- **Interface contracts:** siblings that share an interface name it as a contract. This builds on the
  existing `owns:`/`consumes:` and `Seam contract:` beads.
- **Acceptance checklist:** every leaf's acceptance criteria are an explicit list of checkable items,
  which the planner carries verbatim into the brief.
- **No numeric thresholds in this change.**

**The super-code planner** (`planner-prompt.md`).
- **`filesToRead`:** each `## Task <N>` section gets this list next to `filesTouched`. It names the
  files the implementer must understand. `filesTouched` keeps its write-only meaning and its hot-file
  cap role.
- **`scripts/task-surface`:** a new script that sums the token sizes of `filesTouched` and
  `filesToRead` at the base commit. Its result is recorded on the mapping row as `surfaceTokens`.
- **`oversized` report field:** `[{id, reason, children: [{title, filesTouched, filesToRead,
  acceptance}]}]`. The planner uses it when it judges a bead too large for one session and sees
  independent groups in it. It is the planner's judgment, informed by `surfaceTokens`, not a hard gate.
  - The coordinator files the children as beads under the bead's parent, with the original's
    dependencies, and supersedes the original.
  - It handles them the way it already handles `unplanned` and `missingEdges`: in both coordinators,
    with ledger lines and with the edges added before the next refill.

**Calibration (deferred).** The ledger keeps each task's `surfaceTokens`. Once `run-profile.mjs`
reports per-agent peaks, a later change may join the two and set a numeric threshold. Nothing here
depends on that.

### 4. Context pre-flight

**`skills/super-code/scripts/context-preflight`** runs at super-code start and in super-auto
pre-flight. It writes one `Context:` line to the ledger, and to `run.md` under super-auto.

On Codex it reads `~/.codex/config.toml` and the local model cache. It reports:
- the active model and its `context_window`;
- `effective_context_window_percent`;
- `model_auto_compact_token_limit`;
- whether multi-agent support is enabled.

On Claude Code it resolves the window and compaction point (1M with compaction near 967K, or 200K) of
each role model: planner, implementer, reviewer, final review and assembler. It uses the session's
model settings and the environment overrides (`CLAUDE_CODE_SUBAGENT_MODEL`, `ANTHROPIC_DEFAULT_*_MODEL`,
`CLAUDE_CODE_AUTO_COMPACT_WINDOW`).

**It warns and never stops.** A warning fires when:
- a role resolves to a 200K model;
- the compaction limit or window override is below a sane floor;
- Codex has no multi-agent support.

Each warning carries its one-line fix. The script never edits user configuration. Its window feeds the
final review's size switch.

### 5. Measurement

This depends on the separate change adding per-agent peak context and compactions to
`skills/super-code/scripts/run-profile.mjs`. It adds:
- a per-agent count of tasks received, which should read 1 after Section 1;
- the per-task `surfaceTokens` for the deferred calibration.

## Failure handling

- **The assembler fails or returns nothing usable.** The consumer falls back to today's direct inputs
  (paths to the diff and reports), and the ledger records `assembler: unavailable`. For the final
  review, that means the single-reviewer mode on raw inputs.
- **Cluster review fails.** If a cluster reviewer or the seam reviewer fails, the final review reports
  that cluster as unreviewed in its verdict summary instead of reading `ready`.
- **`context-preflight` can't read a config or cache.** It prints `Context: unknown — <reason>`. The
  size switch then assumes the smallest window known for that harness (258K on Codex, 200K on Claude).
- **Bad `oversized` proposals.** A proposal whose children don't cover the original's acceptance
  criteria, or that names files outside the original's surface, is not filed. The bead proceeds
  unsplit, and the ledger records the reason.

## Testing

- **Script tests:**
  - `task-surface`, with fixture repos;
  - `context-preflight`, with fixture Codex configs and model caches plus Claude environment and
    settings combinations, including the 200K, low-limit and unknown cases;
  - the assembler's size, `fits` and cluster output, if any of it is scripted.
- **`tests/super-code/test-dispatch-text.sh`:** new kinds `assemble` and `final-review` in single,
  cluster and seam modes, and a fresh `fix` dispatch carrying the path handoff.
- **Prompt-text checks:**
  - `codex-tools.md` no longer tells agents to resume implementers with `followup_task`;
  - `coordinator-subagents.md` states the fresh-per-round and bounded-brief rules;
  - `planner-prompt.md` defines `filesToRead`, `surfaceTokens` and `oversized`.
- **Workflow engine:** if `coordinator.js` gains the assembler, the final-review switch or `oversized`
  handling:
  - run `node tests/super-code/replay-harness.mjs`;
  - run the `dryRun` scenarios documented in `coordinator-workflow.md`;
  - update their expected agent counts.
- **Fork release checklist:** the usual list in `CLAUDE.md`.
- **Acceptance evidence:** profile the next real Codex super-auto run with `run-profile`, and compare
  it with the 2026-10-15 baseline:
  - implementer compaction against 15%;
  - tasks per agent against the 4-or-more tail;
  - the final reviewer's peak against 327–339K.

## Out of scope

- Codex goals and token budgets (`create_goal` / `token_budget`), Claude `/goal`, `SubagentStop`
  hooks and `maxTurns` budgets. They were evaluated and set aside: Codex subagents do get
  `create_goal`, and a 6,000-token budget did trigger `budget_limited` steering, but enforcement is
  soft and measures tokens spent, not context.
- Reading-discipline prompt rules (see the w6 result above).
- A brief assembler for implementers. Revisit if the planner's `filesToRead` proves insufficient.
- Numeric sizing thresholds, until calibration data exists.
- Coordinator compaction, which is covered by `2026-10-15-vision-coordinator-compaction.md`.

## Post-Implementation Notes

**2026-10-16 — Changes vs. original design.** Implemented by the combined coordinator/subagent compaction design and shipped in 6.4.2-alepar6.0: fresh agents per round, bounded briefs, assembled final-review inputs with cluster/seam review, shaped planning units, surface estimates, split proposals, and warn-only context preflight. Review fixes preserve ordinary-mode argument parity and explicit missing-review behavior. Live context-reduction measurements and window calibration remain follow-up work; the combined run report records the remaining split-race and parser nits.

*As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
