# Coordinator and Subagent Compaction — Design

Implements, in one change, the two vision specs of 2026-10-15:
[coordinator compaction](../../specs/2026-10-15-vision-coordinator-compaction.md) and
[subagent compaction](../../specs/2026-10-15-vision-subagent-compaction.md). Their Problem sections
carry the measurements and are not repeated here. Where this spec is silent, the vision's
text holds. Where the two differ, this spec decides.

## Goal

super-auto and super-code coordinators and their subagents stay on track and below the context cap
on Claude Code and Codex:
- after any compaction, a coordinator holds the run's live state and its core rules, injected by
  a hook;
- the coordinator reads only what it needs to route work;
- Workflow waits on Claude Code no longer trigger idle compaction;
- every fix round or re-review is a fresh agent with a path handoff;
- read-heavy reviewers work from assembled inputs, and the whole-epic final review splits by
  subsystem when its inputs are too large;
- design leaves and planner tasks are shaped as one feature in one subsystem, with checkable
  acceptance checklists;
- a warn-only context pre-flight records each role's window.

## Problem description

Both visions measured the same runs from opposite ends. Codex coordinators compact constantly (228
times over 13 runs) and lose the skill's loop. Claude Code coordinators mostly compact while idle
during a Workflow wait. Subagents compact mostly because one agent is reused across rounds: 73% of
implementers that received four or more tasks compacted, against 5% for those that received one.
The final whole-epic reviewer runs near the window even without reuse. Several of the fixes land
in the same files: `coordinator.js`, `coordinator-workflow.md`, `coordinator-subagents.md`,
`dispatch-text`, `super-code/SKILL.md` and `super-auto/SKILL.md`. Designing them separately would
produce two decompositions fighting over one hot-file set.

## Main challenges

- **Codex hooks are deliberately off.** `.codex-plugin/plugin.json` declares `"hooks": {}` so that
  Codex does not auto-discover `hooks/hooks.json`, which would re-register the Claude bootstrap
  together with its install-time trust prompt. The Codex archive also excludes `hooks/`. The Codex
  hook's stdin and stdout shapes are known only from strings in the 0.162.1 binary, never verified
  live.
- **The Workflow script does no I/O.** The final review's size switch needs the reviewer's window,
  which only a pre-flight running outside the script can learn. It has to arrive in the args.
- **Shared prompt builders.** `dispatch-text.mjs` loads `coordinator.js`'s prompt builders, so
  every new dispatch kind or prompt change has to work on both paths at once.
- **An unmerged neighbour.** Branch `super-auto/run-profile-context-pass` (not on `main`) changes
  `run-profile.mjs` by 164 lines. Anything this run adds there must be small and separable.
- **Hot shared docs.** Several leaves must edit the same long docs, each in different sections.

## Key decisions made

The two visions' decisions stand, including the subagent vision's brainstorm list (fresh agent
per round, checklists instead of budgets, no reading-discipline rules, an assembler only for
read-heavy reviewers, qualitative sizing, a warn-only pre-flight). This spec adds the following:
- Codex gets its own hook file and entry script, which emit only the run block and never the
  bootstrap. A spike verifies the stdin and stdout shapes first, with a read-only fallback.
- The roast-code assembler is a caller-side pre-step that feeds `assemble-args`. The super-roast
  engine and its return shape stay unchanged.
- `run-profile.mjs` gains only a small `--in-flight` mode, for `run-digest`. The per-agent
  measurement pass belongs to the unmerged context-pass branch. The tasks-received count is
  deferred to it.
- The Workflow coordinator's final review writes its verdict to a file and returns a verdict line
  plus the path.
- Deterministic checks (sizes, `fits`, cluster coverage, oversized-split validation) are scripts.
  Agents gather and judge.

## Decision points, by section

### A. Coordinator compaction

**A1. Run marker — `skills/super-code/scripts/run-marker`.**
- Recommended: a bash script, `register | clear | get | prune`. It writes one `key: value` file per
  session at `${XDG_STATE_HOME:-~/.local/state}/superpowers/active-runs/<session_id>`, with the
  fields `skill`, `harness`, `run_md` (absent for standalone super-code), `ledger`, `epic`,
  `started`, `registered_by_pid`.
- The session id comes from `$CLAUDE_CODE_SESSION_ID`, else `$CODEX_THREAD_ID`. With neither,
  `register` prints `run-marker: no session id — skipped` and exits 0, because a marker is an
  optimisation, never a gate.
- `get <session_id>` prints the marker and exits 0 only when it is live, otherwise exit 1. Live
  means: under super-auto, `run_md` exists and its `phase:` is not `done`. For standalone
  super-code, the ledger exists, the marker is under 14 days old, and the ledger has no `Finish:
  done` line. super-code's Finish writes that one new ledger line, which `ledger-digest` drops.
- `register` is idempotent: it rewrites the file and refreshes paths. It also prunes markers older
  than 14 days that are no longer live. `clear` removes only the caller's session marker.
- The marker format is private to the script. The hook and `run-digest` read markers only through
  `get`.
- Who registers:
  - super-auto, at pre-flight step 4 once `run.md` exists, again on every resume, and again when
    phase 3 creates the ledger (to add its path);
  - super-code, at launch, only when `get` finds no live marker for this session (a standalone
    run).
- Who clears: super-auto at `phase: done`; super-code at Finish, only when the marker's `skill` is
  `super-code`.
- Considered: a JSON marker (would make the hook depend on jq or node); a marker inside the run
  directory (the hook only knows the session id, so it would have to search every repo).
  Discarded.

**A2. Claude Code re-inject — extend `hooks/session-start`.**
- Recommended: the hook reads its stdin JSON with a bounded, non-blocking read and extracts
  `source` and `session_id` with a plain pattern match (flat string fields, no jq).
- Only when `source` is `compact` and `run-marker get` succeeds does it append a run block to the
  existing context, after the `using-superpowers` text. The run block is `run-digest`'s output.
- The script runs under a portable watchdog (background process plus kill after 5 s; macOS has no
  `timeout`). On error or timeout, the run block is the static card plus one line: `Run state
  unavailable — read run.md's phase and run scripts/ledger-digest.`
- Every other case produces byte-identical output to today. The test harness checks this.
- Considered: a separate hook entry for the run block. It would duplicate the platform-detection
  logic and the JSON escaping. Discarded.

**A3. Codex re-inject — `hooks/hooks-codex.json` + `hooks/session-start-codex`.**
- Recommended: a Codex-only hook file, with SessionStart and matcher `compact` only, whose command
  runs `hooks/session-start-codex`.
- That script emits only the run block, in the JSON shape the spike confirmed. It emits nothing,
  with exit 0, when there is no live marker. It never emits the bootstrap.
- The session id comes from stdin `session_id`, falling back to `$CODEX_THREAD_ID`. The matcher
  already limits it to compaction, so a missing `source` field is not an error.
- `.codex-plugin/plugin.json`'s `hooks` points at the Codex hook file, in whichever form the spike
  confirmed (path or inline). It never falls back to `hooks/hooks.json`.
- `scripts/package-codex-plugin.sh` adds exactly the files the Codex hook needs. The hook entry's
  command string is fixed, so a release does not change it, which keeps the per-hook trust hash
  stable: one trust prompt at install, not one per version.
- Spike (a leaf of its own): install a throwaway SessionStart hook in a scratch `CODEX_HOME`,
  force a compaction with a low `model_auto_compact_token_limit`, and record the real stdin and
  the stdout shape that injects context. Read-only fallback when a live Codex run is not possible:
  derive the shapes from the 0.162.1 binary's strings and the Codex source. The wiring then ships
  with `source`-agnostic parsing and emits the `hookSpecificOutput.additionalContext` shape, with
  the gap recorded in `MAINTENANCE.md`.
- The trust prompt is an accepted cost. Codex sessions without the hook keep today's behaviour.
- Considered: removing `"hooks": {}` so that `hooks/hooks.json` is discovered. That re-registers
  the bootstrap on Codex. Discarded.

**A4. Run block — `skills/super-code/scripts/run-digest <session_id>` + `skills/super-code/coordinator-card.md`.**
- Recommended: `run-digest` resolves the marker through `run-marker get`, then prints, in order:
  1. a header naming the skill, epic and phase (`run.md`'s `phase:`, or `super-code` standalone);
  2. state counts reduced from `ledger-digest` (landed, in flight, failed or BLOCKED, pending
     retry, cancelled), plus its last 15 lines;
  3. open beads in the epic tree (count, then ids, capped at 40);
  4. in-flight dispatches with ages, from `run-profile --in-flight` (below). An unknown age prints
     as `age unknown`;
  5. the card, verbatim.
- The block is hard-capped at 24,000 characters (about 6K tokens). Overflow trims the in-flight
  list first (`+N more, see ledger-digest`), then the open-bead ids, then the ledger tail. The
  card is never cut.
- The card is static, 1.5–2.5K tokens, and covers:
  - the loop rules (refill, early unblock, one merge at a time);
  - bounded waits, and on Codex "block on `wait_agent` in 5–10 minute stretches, don't poll
    `list_agents`";
  - the read rule (A5);
  - the Workflow keepalive (A6);
  - which script answers which question (`ledger-digest`, `ready-in-tree`, `report-verdict`,
    `run-digest`, `epic-tree`);
  - a short super-auto paragraph: phase order, `run.md` field names live in `run-state.md`, never
    re-invoke super-auto mid-run;
  - the named sections worth re-reading at each gate (for example super-auto §Phase 5 before a
    fix round, super-code Finish before Finish), in place of whole-doc re-reads.
- `run-profile.mjs --in-flight --epic <id>` is a small, separable mode. It reuses the existing
  discovery (Workflow run dirs, Codex child rollouts, Claude subagent dirs) and prints one line per
  dispatch that has started and not finished: `in-flight: <label> · <age or unknown>`. It touches
  the argv block and one new function only, to keep conflicts with the context-pass branch small.
- Considered: re-injecting full skill sections (too large, and Claude Code already re-injects
  invoked skills); a digest built by an agent (a hook cannot spawn one). Discarded.

**A5. Read rule and `skills/super-code/scripts/report-verdict <file>`.**
- Recommended: the rule says the coordinator reads only what it needs to route work. Plans,
  specs, source, diffs and full child reports are read by children; the coordinator gets a verdict
  plus a path. It is stated once in the card and pointed to from `super-code/SKILL.md`,
  `coordinator-subagents.md` and `super-auto/SKILL.md`.
- `report-verdict` prints at most about 20 lines: `verdict: <…>`, the blocking or must-fix items
  (one line each, capped), and `path: <file>`. It recognises:
  - super-code task reports (status line);
  - super-roast reports (verdict line plus `## Confirmed findings` Blocking entries);
  - final-review files (Verdict and Must-fix sections);
  - step-back records (`decision:`);
  - assembler digests (`fits:`).
  Anything else prints `verdict: unknown`, the path and the first 10 lines, and exits 0.
- Final-answer contract: every dispatch text the coordinator sends (implementer, reviewer, fix,
  seam-review, check-fix-review, merge, triage, plan, assemble, final-review, and super-auto's
  step-back, scope filter and report drafter) ends with one line. When the dispatch carries no
  structured result schema, the final message is one verdict line plus the report path. Schema
  dispatches keep their schema, and the line tells them the schema is the answer. The builders
  live in `coordinator.js`, so `dispatch-text` inherits the line.
- The report drafter writes its draft to `<run-dir>/report.draft.md` and returns the path. The
  orchestrator renames the draft to `report.md` after splicing in the status line, without reading
  the body.
- On Claude Code, the coordinator Workflow's `review` result becomes the verdict line, plus a new
  `reviewPath`. The final reviewer writes its full review to
  `<workspace>/final-review-<runId>.md`. super-auto's §Final-review items reads it through
  `report-verdict` and hands the path, not the text, to the step-back.
- The super-roast engine's `reportMarkdown` return is unchanged (subagent vision §2). Callers
  write it to disk and from then on read it through `report-verdict`. This is recorded as
  follow-on.
- Considered: changing super-roast to write its own report. It changes a standalone skill's
  contract and its dryRun baselines, for three or four returns per run. Deferred.

**A6. Keepalive during Workflow waits (Claude Code).**
- Recommended: while a coordinator or roast Workflow runs, the session keeps one
  `run_in_background` `sleep 2700` armed. When it fires before the Workflow notification, the
  session takes one cheap progress look (the newest ledger lines) and re-arms. It does not re-arm
  once the Workflow has returned.
- Stated in super-code `SKILL.md` "Unattended runs" beside the slowness watch, in the card, and as
  a pointer from super-auto's §Ending turns. It complements the existing Monitor or bounded-loop
  watcher and replaces neither. Between runs, idle compaction behaves as today.
- Considered: `"idleCompaction": false` (global, a user setting, out of scope); a Monitor-only
  approach (a quiet Monitor does not produce assistant turns). Discarded.

### B. Subagent compaction

**B1. Fresh agent per round and bounded improvised briefs.**
- `skills/using-superpowers/references/codex-tools.md`: replace the "Fix rounds" bullet. Every fix
  pass, seam fix, check fix, re-review and re-assessment is a new `spawn_agent {fork_turns:
  "none"}`. `followup_task` only chases or clarifies a report the same job owes, and is never used
  for new work, a new round, or steering that changes scope.
- `subagent-driven-development` gets the same rule where it describes fix rounds. It is a pointer
  to the shared reference, not a copy.
- `coordinator-subagents.md` states three rules:
  - fresh agent per round;
  - a steering message that adds work counts as a new round;
  - improvised dispatches (history reader, assess, first gate, absorb, and similar) carry input
    paths, one output file, scope and out-of-scope, a checklist, and "one fresh agent, one job".
    A large input is split across several such agents.
- `coordinator-workflow.md`'s coordinator contract gets the improvised-dispatch rule. The Workflow
  engine already dispatches fresh.
- The fix-pass handoff is by path: brief, previous report, worktree with `base..head`, findings
  file, and acceptance checklist. These are what the existing fix prompt already reads, stated as
  the agent's only memory of the earlier round.

**B2. Brief assembler.**
- Prompt template `skills/super-code/assembler-prompt.md`. Model tier `mechanical` (Sonnet on
  Claude; on Codex, the cheapest V2 preset in the actual spawn allowlist; the template names no
  model). It gathers with tool calls and judges nothing.
- It writes `<workspace>/assembled/<consumer>-<runId>/` containing:
  - `digest.md`: the diffstat, per-task report summaries (status, assumptions, concerns),
    interfaces and seams, deferred minors from the ledger, and bead-comment amendments, each
    section only when the consumer asks for it;
  - `slices/`: the relevant hunks or file ranges;
  - `clusters.json`: when asked, changed files grouped by import and call edges, else by
    directory, never by count.
- New script `skills/super-code/scripts/assembled-size <dir> --threshold <tokens>` sizes the
  output deterministically. It appends a `size:` line per file (characters ÷ 4) and one
  `fits: yes|no (<total> of <threshold>)` line. When `clusters.json` exists, it checks that every
  changed file lands in exactly one cluster (exit 3 otherwise). The assembler runs it last. A
  consumer trusts `fits` only from this script.
- Consumers:
  - the final review (B3);
  - roast-code: super-auto phase 4 dispatches the assembler before each round, then passes
    `--diff-stat @<dir>/digest.md` and `--context @<dir>/digest.md` to `assemble-args`. The
    engine is unchanged;
  - improvised history and assess passes, which are pointed at a digest instead of raw history
    (rule in `coordinator-subagents.md`).
- Not implementers.
- Failure: no output, or a non-zero `assembled-size` → the consumer falls back to today's direct
  inputs, and the ledger (or `run.md` friction, for roast-code) records `assembler: unavailable —
  <cause>`.

**B3. Final-review size switch.**
- In `coordinator.js` Finish, and as `dispatch-text` kinds `assemble` and `final-review --mode
  single|cluster|seam`.
- The threshold is 40% of the final reviewer's window. The window arrives as
  `config.contextWindows.finalReview`, which super-code's pre-flight sets from `context-preflight`.
  When it is absent, the smallest known window applies: 200K in a Workflow (Claude Code), 258K for
  ordinary-subagent mode on Codex.
- `fits: yes` → one opus reviewer works from the digest and slices, and opens code only for a
  named risk.
- `fits: no` → one reviewer per cluster, then a seam reviewer given only the cluster verdict files
  plus the cross-cluster hunks and interfaces. Cluster and seam reviewers run concurrently within
  the existing cap. The seam reviewer runs after all clusters.
- The verdict shape is unchanged: `ready` or `not ready (<summary>)`. A failed or null cluster or
  seam review is listed as unreviewed, and the verdict reads `not ready (… unreviewed)`, never
  `ready`.
- Ledger line: `Final review: single|split (inputs <N>K <=|> 40% of <W>K) · clusters <k>`, or
  `Final review: single (assembler unavailable)`.
- The `coordinator-workflow.md` dryRun baselines are updated for the new Finish agents.

**B4. Shaped units.**
- super-design:
  - §Decomposition's sizing bar and `promotion-reviewer-prompt.md`'s size test gain the same
    wording: a LEAF is one feature in one subsystem; tightly coupled files (heavy mutual calls or
    imports) stay in one leaf;
  - siblings that share an interface name it as a contract, through the existing `owns:` /
    `consumes:` / `Seam contract:` machinery;
  - every leaf's acceptance is a checkable `- [ ]` list, which the planner carries verbatim.
  - No numbers.
- super-code planner (`planner-prompt.md`, the `PLANNED` schema, and both coordinators):
  - each `## Task <N>` gains `filesToRead` beside `filesTouched`;
  - the planner runs new `scripts/task-surface --base <sha> <files…>` (sum of characters ÷ 4 at
    the base commit) and records `surfaceTokens` on the mapping row;
  - the coordinator writes `Surface: <id> <N> tokens` to the ledger (a new line kind, which
    `ledger-digest` drops);
  - the planner may return `oversized: [{id, reason, children:[{title, filesTouched,
    filesToRead, acceptance}]}]`.
- New script `scripts/split-oversized <proposal.json>` does the oversized handling
  deterministically. It refuses a proposal whose child files fall outside the original's
  `filesTouched ∪ filesToRead`, or whose children's acceptance does not cover every checklist
  item of the original verbatim. Otherwise it files the children (flag triple, the original's
  deps copied, `blocked-by` lines), then runs `bd supersede`.
- Both coordinators run it through a mechanical dispatch, handling it like `unplanned` and
  `missingEdges`: edges in before the next refill, ledger `Split: <id> → <children>` or `Split
  refused: <id> — <reason>`.

**B5. Context pre-flight — `skills/super-code/scripts/context-preflight`.**
- Runs at super-code pre-flight and super-auto pre-flight. Prints one line, `Context: <harness> ·
  <role>=<window>/<compact point> … [· warn: <issue> → <fix>]`, which the caller appends to the
  ledger, or to `run.md` as `context:` (a new `run-state.md` field).
- On Codex it reads `~/.codex/config.toml` and the local model cache: model, `context_window`,
  `effective_context_window_percent`, `model_auto_compact_token_limit`, and multi-agent
  enablement.
- On Claude Code it resolves each role model (planner, implementer, reviewer, final review,
  assembler) to 1M (compaction near 967K) or 200K. It uses the session's model settings and
  `CLAUDE_CODE_SUBAGENT_MODEL`, `ANTHROPIC_DEFAULT_*_MODEL` and `CLAUDE_CODE_AUTO_COMPACT_WINDOW`.
- A warning fires for a role on a 200K model, a compaction limit or window override below the
  floor (50% of the window), or Codex without multi-agent. Each warning carries its one-line fix.
- It never edits configuration and never stops. When it cannot read its sources, it prints
  `Context: unknown — <reason>`.
- `--json` emits the windows that super-code passes on as `config.contextWindows`.

**B6. Measurement.**
- `surfaceTokens` lives on the mapping rows and in `Surface:` ledger lines. The tasks-received
  count and the join with per-agent peaks belong to the context-pass branch. They are follow-on
  work and not in this tree.

### C. Verification

- Script tests: new `tests/super-code/test-run-marker.sh`, `test-run-digest.sh`,
  `test-report-verdict.sh`, `test-task-surface.sh`, `test-context-preflight.sh`,
  `test-assembled-size.sh` and `test-split-oversized.sh`, on fixtures.
- `tests/hooks/test-session-start.sh` extended:
  - no marker → unchanged output;
  - `compact` with a live marker → run block;
  - `startup` → nothing extra;
  - `run-digest` failing or hanging → fallback block;
  - size cap;
  - Claude and Codex JSON shapes.
- `tests/codex/test-marketplace-manifest.sh` and `test-package-codex-plugin.sh`: the manifest
  points at the Codex hook file and never at `hooks/hooks.json`; the archive carries exactly the
  Codex hook files.
- `tests/super-code/test-dispatch-text.sh`: kinds `assemble` and `final-review` (single, cluster,
  seam); a fresh `fix` carries the path handoff; every kind ends with the final-answer line.
- Prompt-text checks:
  - `codex-tools.md` no longer resumes implementers with `followup_task`;
  - `coordinator-subagents.md` states fresh-per-round and bounded briefs;
  - `planner-prompt.md` defines `filesToRead`, `surfaceTokens` and `oversized`.
- `tests/super-auto/test-contract-lint.sh` stays green with the new `context:` field.
- Workflow engine: `node tests/super-code/replay-harness.mjs` and the documented dryRun scenarios,
  with updated counts.
- Live checks (forced compaction on each harness, and a profiled Codex run against the baselines)
  are orchestrator work after the merge, listed under Follow-on, not leaves.

## Failure handling

The visions' failure sections hold. In addition:
- **No session id**: the marker is skipped, the hook adds nothing, and the run behaves as today.
- **Codex spike cannot run live**: the wiring ships on the binary-derived shapes, and the gap is
  recorded.
- **`oversized` refused**: the bead proceeds unsplit.
- **A missing window**: the smallest known window applies.

## Out of scope

- The super-roast engine's return shape.
- `run-profile.mjs` per-agent peaks and the tasks-received count (context-pass branch).
- Forced or agent-triggered compaction.
- Codex compaction settings.
- Disabling idle compaction globally.
- herdr-threads output volume.
- A `codex exec` loop as a Workflow substitute.
- Codex goals and token budgets.
- Reading-discipline rules.
- An assembler for implementers.
- Numeric sizing thresholds.

## Follow-on (after merge, outside this tree)

- Live compaction check on Claude Code (`/compact` mid-run) and on Codex (low compaction limit):
  the run block appears, no whole-doc re-reads, no direct child-report reads.
- Profile the next Codex super-auto run against the 2026-10-15 baselines: implementer compaction
  against 15%, tasks per agent, and the final reviewer's peak against 327–339K.
- Once the context-pass branch lands: the tasks-received count and the `surfaceTokens` × peak
  calibration.
- super-roast writing its own report file.
- A fork release per `CLAUDE.md`.

## Post-Implementation Notes

> *As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
