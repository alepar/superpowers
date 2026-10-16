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
  `started`, `registered_by_pid`, `worktree`, `session`, `runTag`.
- The session id comes from `$CLAUDE_CODE_SESSION_ID`, else `$CODEX_THREAD_ID`. With neither,
  `register` prints `run-marker: no session id — skipped` and exits 0, because a marker is an
  optimisation, never a gate.
- Every per-user path is resolved from the environment: `${XDG_STATE_HOME:-$HOME/.local/state}`.
  When the store cannot be written (a sandboxed coordinator), `register` writes the fallback marker
  `<worktree>/.superpowers/run-marker-<session>` (git-ignored, keyed by session) and prints `run-marker: wrote fallback
  <path> — <reason>`. When neither write succeeds it prints `run-marker: register failed —
  <reason>`. It always exits 0, but a failure is never printed as a normal skip.
- `get <session_id> [--cwd <dir>]` resolves the marker exactly once: first by session id in the
  store, then (only with `--cwd`) by the newest live store marker whose `worktree` contains
  `<dir>`, then by the caller's own session fallback marker found walking up from `<dir>`. Both
  fallbacks refuse when `<dir>` lies under any marker's `<worktree>/.worktrees/` (a task
  worktree), or when the hook input identifies a subagent (`agent_id` or the equivalent the spike
  records). A subagent that compacts must never receive the coordinator's run block. On success it prints `key: <session id or fallback path>` followed by every
  marker field (including `session` and `runTag`), and exits 0. Otherwise it exits 1. `get`'s
  stdout is a stable interface, not only its exit code. Both hook entries pass stdin `cwd` and
  pipe `get`'s full stdout into `run-digest` on stdin, so run-digest never resolves or reads a
  marker file itself.
- Live means the marker was registered or refreshed within the last 14 days, and also: under
  super-auto, `run_md` exists and its `phase:` is not `done`; for standalone super-code, the
  ledger exists. The age bound applies to every marker, so a crashed or abandoned run expires.
  super-auto re-registers on every resume, at phase 3, at each keepalive wake and at each refill
  it observes, which refreshes the age. A single phase running for days therefore stays live. Neither
  coordinator writes a new ledger line for this.
- One marker per run: `register` removes any other store marker with the same `run_md` (an old
  session id after a resume). One marker per session: when super-auto drives super-code in the same
  session, super-code finds the live super-auto marker and neither registers nor clears.
- `register` is idempotent: it rewrites the file, refreshes paths and age, and prunes markers that
  are no longer live. `clear` removes only the caller's session marker and its fallback marker.
- The marker format is private to the script. The hooks and `run-digest` read markers only
  through `get`.
- Who registers:
  - super-auto, at pre-flight step 4 once `run.md` exists, again on every resume, and again when
    phase 3 creates the ledger (to add its path);
  - super-code, at launch, only when `get <session> --cwd <integration worktree>` finds no live
    marker (a standalone run). Including `--cwd` lets the guard see a sandboxed super-auto's
    fallback marker.
- Who clears: super-auto at `phase: done`; super-code's calling session at Finish (after the
  coordinator Workflow returns, or at the ordinary loop's Finish), only when the marker's `skill`
  is `super-code`.
- Considered: a JSON marker (would make the hook depend on jq or node); only a marker inside the
  run directory (the hook would have to search every repo; it is kept as the fallback, found from
  the hook's `cwd`). Discarded.

**A2. Claude Code re-inject — two compact SessionStart entries, card and state.**
- Recommended: `hooks/hooks.json` gains two SessionStart entries, both matcher `compact`. One runs
  `hooks/session-start-runblock card` and emits the static card. The other runs
  `hooks/session-start-runblock state` and emits the live state. Each entry has its own
  10,000-character budget, so the card can be the full size the vision intended. `hooks/session-start` and its existing entry are not changed, so
  every non-compact case stays byte-identical by construction.
- Claude Code caps each hook's `additionalContext` at 10,000 characters and replaces a longer
  string with a file path and a 2,000-character preview. A separate entry gives the run block its
  own budget instead of sharing one string with the bootstrap.
- `session-start-runblock` sources `hooks/run-block.sh` (RunBlockInjector):
  - a bounded, non-blocking stdin read;
  - pattern extraction of `session_id` and `cwd`;
  - `run-marker get <session_id> --cwd <cwd>`;
  - `run-marker get … | run-digest --part card|state --budget 9000` under a portable watchdog (background process
    plus kill after 5 s; macOS has no `timeout`).
  On a live marker it emits the run block in Claude Code's
  `hookSpecificOutput.additionalContext` shape. With no live marker it emits nothing and exits 0.
- Both entries emit only when a live marker resolves. The card entry prints the static card file
  without running run-digest, so it cannot time out. On error or timeout, the state entry emits one
  line: `Run state unavailable — read run.md's phase and run scripts/ledger-digest.`
- All dynamic text is sanitised before JSON escaping: U+0000–U+001F other than newline and tab
  are stripped, then the library's own copy of `escape_for_json` escapes the rest. The function is
  duplicated, not moved, so `hooks/session-start` is not edited at all.
- Cursor and Copilot keep their own hook configurations and get no run block. Re-inject is scoped
  to Claude Code and Codex.
- Considered: appending the run block to the bootstrap string. It would overflow the 10K cap and
  lose both. Discarded.

**A3. Codex re-inject — `hooks/hooks-codex.json` + `hooks/session-start-codex`.**
- Recommended: a Codex-only hook file, with SessionStart and matcher `compact` only, whose command
  runs `hooks/session-start-codex`.
- That script sources `hooks/run-block.sh` as A2 does. It emits only the run block, in the JSON
  shape the spike confirmed, as one string: card then state (`run-digest --part all --budget
  18000`). It emits nothing, with exit 0, when
  there is no live marker. It never emits the bootstrap.
- The Codex hook entry sets `additionalContextLimit` (6000 tokens, above the 18,000-character block
  whether Codex counts tokens with a tokenizer or as bytes ÷ 4), so Codex's default 2,500-token threshold does not
  replace the block with a head-and-tail preview.
- The session id comes from stdin `session_id`, falling back to `$CODEX_THREAD_ID`, and `cwd`
  from stdin. The matcher already limits it to compaction, so a missing `source` field is not an
  error.
- `.codex-plugin/plugin.json`'s `hooks` points at the Codex hook file, in whichever form the spike
  confirmed (path or inline). It never falls back to `hooks/hooks.json`.
- `scripts/package-codex-plugin.sh` adds exactly the files the Codex hook needs. The hook entry's
  command string is fixed, so a release does not change it, which keeps the per-hook trust hash
  stable: one trust prompt at install, not one per version.
- Spike (a leaf of its own): install a throwaway SessionStart hook in a scratch `CODEX_HOME`,
  force a compaction with a low `model_auto_compact_token_limit`, and record the real stdin and
  the stdout shape that injects context. Also record: whether `additionalContextLimit` is honoured;
  what the per-hook trust hash covers (diff `[hooks.state]` across two installs with the same
  command string); what a malformed `hooks` value does to the rest of the plugin; and, on Claude
  Code, whether a compact-matcher hook's `additionalContext` reaches the model (a unique token
  emitted on `/compact`, then asked for) and whether `$CLAUDE_CODE_SESSION_ID` equals the hook's
  `session_id`. The Claude Code compact-injection check is required live, with docs only as a
  last-resort fallback, because everything in A2 rests on it. Also record: whether Claude Code's
  idle compaction fires SessionStart with source `compact`; whether compaction fires the hook for
  Codex child threads and Claude Code subagents or Workflow agents; and which stdin fields
  identify them. Read-only fallback when a live Codex run is not possible:
  derive the shapes from the 0.162.1 binary's strings and the Codex source. The wiring then ships
  with `source`-agnostic parsing and emits the `hookSpecificOutput.additionalContext` shape, with
  the gap recorded in `MAINTENANCE.md`.
- The trust prompt is an accepted cost (the human confirmed this on 2026-10-15). Codex sessions
  without the hook keep today's behaviour.
- Considered: removing `"hooks": {}` so that `hooks/hooks.json` is discovered. That re-registers
  the bootstrap on Codex. Discarded.

**A4. Run block — `skills/super-code/scripts/run-digest --part card|state|all --budget <chars>` (marker on stdin) + `skills/super-code/coordinator-card.md`.**
- Recommended: `run-digest` reads the marker fields from stdin (`run-marker get` output, never a
  second resolution), then prints, in order (`--part card` prints only item 1, `--part state`
  items 2–5, `--part all` everything):
  1. the card, verbatim;
  2. a header naming the skill, epic, phase (`run.md`'s `phase:`, or `super-code` standalone) and
     `runTag`;
  3. state counts reduced from `ledger-digest` (landed, failed or BLOCKED, pending retry,
     cancelled), plus its last 15 lines;
  4. open beads in the epic tree (count, then ids, capped at 40);
  5. in-flight dispatches with ages, from `run-profile --in-flight` (below), with their count. An
     unknown age prints as `age unknown`.
- Each part never exceeds `--budget` characters (Claude Code passes 9000 per entry, Codex 18,000
  for `all`).
  The card comes first and is never cut; overflow trims the in-flight list first (`+N more, see
  ledger-digest`), then the open-bead ids, then the ledger tail. The sources run concurrently under
  one shared 4 s deadline (each capped at 3 s), below RunBlockInjector's 5 s watchdog. A source that
  misses the deadline or fails prints `unknown` for its section, and the rest still print.
- The card is static, 1.5–2.5K tokens (at most 9,000 characters), and covers:
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
- `run-profile.mjs --in-flight --epic <id> --session <id> --harness <claude|codex>` is a small,
  separable mode. It scans only that session's Workflow run dirs and subagent dir (Claude Code,
  under `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects`) or its child rollouts (Codex, under
  `${CODEX_HOME:-$HOME/.codex}`), never every project. A full discovery scan measured 5–10 s,
  which a hook cannot afford. It prints one line per dispatch that has started and not finished:
  `in-flight: <label> · <age or unknown>`. An unreadable discovery root prints `in-flight:
  unknown — <reason>`, never an empty list. It touches
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
  dispatches keep their schema, and the line tells them the schema is the answer. The step-back's
  template output fields, and the scope filter's JSON, count as schemas, so they return those in
  full. The builders
  live in `coordinator.js`, so `dispatch-text` inherits the line.
- The report drafter writes its draft to `<run-dir>/report.draft.md` and returns the path. The
  orchestrator renames the draft to `report.md` after splicing in the status line, without reading
  the body.
- On Claude Code, the coordinator Workflow's `review` result becomes the verdict line, plus a new
  `reviewPath`. The final reviewer writes its full review to
  `<workspace>/final-review-<runTag>.md`. super-auto's §Final-review items reads it through
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
- No idle trigger is known on Codex. Its compactions are token-driven (some async, starting well
  below the cap), and nothing measured points to an idle cause. So the keepalive is Claude Code
  only, and Codex waits need only the bounded `wait_agent` stretches the card states.
- Considered: `"idleCompaction": false` (global, a user setting, out of scope); a Monitor-only
  approach (a quiet Monitor does not produce assistant turns). Discarded.

### B. Subagent compaction

**B1. Fresh agent per round and bounded improvised briefs.**
- `skills/using-superpowers/references/codex-tools.md`: replace the "Fix rounds" bullet. Every fix
  pass, seam fix, check fix, re-review and re-assessment is a new `spawn_agent {fork_turns:
  "none"}`. `followup_task` only chases or clarifies a report the same job owes, and is never used
  for new work, a new round, or steering that changes scope.
- The rule is scoped to super-code and super-auto dispatches. `subagent-driven-development` keeps
  its own bounded design (resume the implementer for fix rounds 1–3, fresh from round 4), and
  codex-tools.md says so. Changing SDD would mean editing behaviour-shaping upstream content that
  needs eval evidence, which is out of this tree.
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
- **runTag**, defined once: the run's first pre-flight mints `<epicId or slug>-<UTC
  yyyymmddThhmmss>`. Under super-auto that is super-auto's pre-flight, which records `runTag:` in
  `run.md` and passes it to every super-code invocation as `args.runTag`. A standalone super-code
  mints its own. It is written on the `Launch:` line and into the run marker, so the run block's
  header shows it after a compaction. Every file name below uses it, so relaunches never collide.
- It writes `<workspace>/assembled/<consumer>-<runTag>-<instance>/`, where instance is `r<N>` (a
  roast round), `audit` (the post-cap audit), `final`, or the bead id of a history or assess pass.
  It empties that directory first. The directory contains:
  - `diffstat.txt`: the branch diffstat alone (for `assemble-args --diff-stat`);
  - `digest.md`: the diffstat, per-task report summaries (status, assumptions, concerns),
    interfaces and seams, deferred minors from the ledger, and bead-comment amendments, each
    section only when the consumer asks for it. The roast-code profile carries only the diffstat,
    slice index and stated-intent spec paths, never report summaries or concerns, so adversarial
    scouts judge the diff rather than anchor on implementers' self-reports;
  - `slices/`: the relevant hunks or file ranges;
  - `clusters.json`: when asked, changed files grouped by import and call edges, else by
    directory, never by count.
- New script `skills/super-code/scripts/assembled-size <dir> --threshold <tokens>` sizes the
  output deterministically. It appends a `size:` line per file (characters ÷ 4) and one
  `fits: yes|no (<total> of <threshold>)` line. With `--clusters-required` (the final review
  passes it), a missing or empty `clusters.json` is exit 3. When `clusters.json` exists it checks
  that every changed file lands in exactly one cluster (exit 3 otherwise), and prints one
  `cluster-fits: <name> yes|no (<tokens> of <threshold>)` line per cluster. The assembler runs it
  last, and re-clusters once by subdirectory any cluster reported `no` before the final run. A
  consumer trusts `fits` only from this script.
- Consumers:
  - the final review (B3);
  - roast-code: super-auto phase 4 dispatches the assembler before each round, then passes
    `--diff-stat @<dir>/diffstat.txt` and names the digest in `--artifact`: `<branch@sha> vs
    <base@sha> — stated intent: <spec paths> — assembled inputs: <dir>/digest.md, slices under
    <dir>/slices/`. Scouts and judges already read `--artifact` as the change's naming, so they
    open the digest. `assemble-args` reads `--context` only in design mode, so it is not used. The
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
  plus the cross-cluster hunks and interfaces. Cluster reviewers run concurrently within the
  existing cap. The seam reviewer runs after all clusters.
- Files, all under `<workspace>/`: cluster verdicts
  `final-review-<runTag>-cluster-<n>.md`, and the single handoff file `final-review-<runTag>.md`,
  which always exists. The single reviewer writes it in single mode, and the seam reviewer in split
  mode. When the seam review is null, a mechanical dispatch writes a stub there listing the cluster
  files and naming the seam unreviewed.
- The verdict shape is unchanged: `ready` or `not ready (<summary>)`. Each of these is listed as
  unreviewed, and the verdict reads `not ready (… unreviewed)`, never `ready`:
  - a failed or null cluster or seam review;
  - a cluster still reported `cluster-fits: … no` after the re-cluster;
  - `fits: no` with no usable clusters (`assembled-size` exit 3). The review still runs in single
    mode on direct inputs, but its verdict is capped at `not ready (… unreviewed: inputs exceed the
    window and no usable clusters)`, with the ledger line `Final review: single (no usable clusters
    — capped)`. The assembler relays the exit code together with the `fits:` line. A null or empty
    assemble (fits unknown) is the uncapped `single (assembler unavailable)` case.
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
  - each task carries the bead's `- [ ]` checklist verbatim. The planner may report a bead as
    `oversized` when it judges it too large for one session with independent groups, informed by
    `surfaceTokens`. It is a judgment, never a gate; super-design owns the one-subsystem shape;
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
  item of the original verbatim. Otherwise it rewrites the graph in one pass:
  1. file the children (flag triple, the original's upstream deps copied, `blocked-by` lines);
  2. add every bead that depended on the original as a dependent of every child, with
     `blocked-by` lines;
  3. only then run `bd supersede`.
  A failure before step 3 exits with its own code and lists the children filed. The coordinator
  then writes `Split partial: <id> — filed <children>`, closes those children with that reason,
  and proceeds unsplit.
- Both coordinators run it through a mechanical dispatch, handling it like `unplanned` and
  `missingEdges`: edges in before the next refill, ledger `Split: <id> → <children>` or `Split
  refused: <id> — <reason>`.

**B5. Context pre-flight — `skills/super-code/scripts/context-preflight`.**
- Runs at super-code pre-flight and super-auto pre-flight. Prints one line, `Context: <harness> ·
  <role>=<window>/<compact point> … [· warn: <issue> → <fix>]`, which the caller appends to the
  ledger, or to `run.md` as `context:` (a new `run-state.md` field).
- Paths come from the environment: `${CODEX_HOME:-$HOME/.codex}` and
  `${CLAUDE_CONFIG_DIR:-$HOME/.claude}`. An unreadable source is reported as `unknown`, never as a
  default.
- On Codex it reads `config.toml` under that home and the local model cache: model, `context_window`,
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
- `tests/hooks/test-session-start.sh` stays green unchanged (the bootstrap entry is untouched),
  and new `tests/hooks/test-run-block.sh` covers `session-start-runblock` and
  `session-start-codex`:
  - no marker → no output;
  - a task-worktree `cwd` (under `<worktree>/.worktrees/`) or a subagent id, with a non-matching
    session id → no output;
  - a live marker (by session id, by `cwd`, by fallback marker) → a run block in each harness's
    JSON shape;
  - `run-digest` failing or hanging → the fallback block;
  - every emitted `additionalContext` stays under 10,000 characters, including at the budget edge
    and with a maximal ledger;
  - control characters in ledger or bead text still yield valid JSON.
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

## Key abstractions

**run-marker** — new bash module (script with subcommands `register | clear | get | prune`), the single store of "which session is coordinating which run".
- Owns: the marker file location, its private `key: value` format, the liveness rule (every marker < 14 days since its last register; super-auto: `run_md` phase ≠ `done`; standalone: ledger exists), the one-pass resolution (session id → `--cwd` worktree match → the caller's own session-keyed fallback marker; both fallbacks refuse task worktrees and subagents) whose stdout (key plus every field) is the stable interface, the 14-day prune, and session-id resolution (`$CLAUDE_CODE_SESSION_ID` → `$CODEX_THREAD_ID` → explicit id argument).
- Hides: the marker file format and how liveness is computed — the hook, run-digest and the skills see only `get`'s exit code and stdout.
- Must not: read `run.md` fields or the ledger beyond liveness, or print run state (run-digest does that); never fail a caller — no session id means skip, exit 0.
- Relationships: leaf. super-auto/super-code (register/clear), run-digest and both hook entries (get) depend on it; it depends on nothing in the repo.
- Lifecycle: one file per session under `${XDG_STATE_HOME:-~/.local/state}/superpowers/active-runs/` (or the fallback `<worktree>/.superpowers/run-marker-<session>` when the store is not writable); created at register, removed by `clear` from its own session only, or by prune once not live; register drops other markers for the same `run_md`. The directory is shared by every session on the machine (global, per user).
- Errors: `get` → exit 0 live / exit 1 absent-or-not-live (callers do not distinguish the two); `register`/`clear` always exit 0, reporting a skip on stdout.

**run-digest** — new bash script plus static data (`coordinator-card.md`), the run-block builder.
- Owns: the block's parts (`card`, `state`, `all`) and section order (card first), the per-part `--budget` cap and trim order (in-flight → bead ids → ledger tail; card never cut), concurrent sources under one shared 4 s deadline, and reducing `ledger-digest` lines to state counts.
- Hides: which scripts supply each section (`run-marker get`, `ledger-digest`, the epic tree via `bd`, `run-profile --in-flight`).
- Must not: run the whole-block watchdog, choose a hook output shape, or JSON-escape (RunBlockInjector does); must not resolve or read a marker itself — it reads `run-marker get`'s output on stdin. The card's rules live in the card file, never in script code.
- Relationships: Facade over four sources; both hooks depend on it through RunBlockInjector.
- Lifecycle: one process per compaction event; stateless.
- Errors: non-zero exit or hang → the caller's fallback; a missing section source degrades that section only (`age unknown`, counts omitted), never the whole block.

**RunBlockInjector** (`hooks/run-block.sh`, sourced) — new bash library, the shared core of the two run-block hook entries.
- Owns: bounded non-blocking stdin read, pattern extraction of `session_id` and `cwd`, the single `run-marker get` resolution, the portable 5 s watchdog around `run-digest`, the fallback text (static card + `Run state unavailable — …`) within the budget, control-character sanitising, and its own copy of `escape_for_json` (duplicated so `session-start` stays untouched).
- Hides: how a run block is obtained and degraded, from both entry scripts.
- Must not: choose the output JSON shape — each entry script decides; it never touches the bootstrap, which stays in `session-start`'s own hook entry.
- Relationships: entry adapters use it, each its own compact-matcher hook entry — `session-start-runblock card` and `session-start-runblock state` (Claude Code, `hookSpecificOutput.additionalContext`, one 10K budget each) and `session-start-codex` (the spike-confirmed shape, `$CODEX_THREAD_ID` fallback, `additionalContextLimit` 6000 on its entry, card and state in one string). Dependency: entry → library → run-marker / run-digest.
- Lifecycle: sourced per hook invocation; no state; the watchdog kills its own background child.
- Errors: never returns failure to an entry; a run block is always either the digest or the fallback, so neither hook can fail SessionStart.

**report-verdict** — new bash script with an ordered recogniser table: child report → verdict, blocking items, path, in ≤ ~20 lines.
- Owns: one recogniser per report kind (task report status line; super-roast verdict + Blocking entries; final-review Verdict/Must-fix; step-back `decision:`; assembler `fits:`), tried in one ordered list, first match wins.
- Hides: report file formats from the coordinators, which never parse child reports themselves.
- Must not: judge or summarise beyond the extracted lines; exit non-zero for an unknown format.
- Relationships: leaf; super-code, super-auto, the card's guidance and the step-back hand-off depend on it.
- Lifecycle: stateless, per call.
- Errors: unknown format → `verdict: unknown` + exit 0 (callers must distinguish this from a real verdict); missing/unreadable file → usage error, exit 2.

**Final-answer rule** — new rule helper in `coordinator.js` (beside `scriptOutcomeRule`/`authRefusalRule`), the closing line every dispatch carries.
- Owns: the text, in its two forms ("one verdict line plus report path" / "your schema is the answer").
- Hides: wording; each builder states only whether it carries a schema.
- Must not: be appended inside `dispatch()` (dispatch-text calls builders directly and would miss it). super-auto's step-back, scope-filter and report-drafter templates copy the line literally; a prompt-text test pins the copies together.
- Relationships: every builder delegates its closing line to it; dispatch-text inherits it through the builders.

**Assembler** — new prompt template (`assembler-prompt.md`) plus a deterministic gauge script (`assembled-size`): raw history → digest, slices, clusters for one consumer.
- Owns: gathering into `<workspace>/assembled/<consumer>-<runTag>-<instance>/`, emptied first (template); `size:`, `fits:` and per-cluster `cluster-fits:` lines and exactly-one-cluster coverage, required clusters under `--clusters-required` (`assembled-size`).
- Hides: what each consumer needs — one consumer profile (digest sections, clusters yes/no) per consumer, in one table inside the `assemblePrompt` builder in `coordinator.js`, reached via `dispatch-text assemble --consumer <name>` (super-auto phase 4 uses that kind rather than writing its own brief).
- Must not: judge findings, or compute `fits` itself (consumers trust `fits` only from `assembled-size`; the assembler agent relays it).
- Relationships: consumers (final review, roast-code, improvised history/assess passes) depend on its output dir; roast-code feeds `@<dir>/digest.md` to `assemble-args`; the super-roast engine is unaware of it.
- Lifecycle: one directory per consumer per run, kept with the workspace for audit; not cleaned mid-run.
- Errors: callers distinguish no output or non-zero `assembled-size` (→ direct inputs, `assembler: unavailable — <cause>`) from `fits: no` (→ split); exit 3 (bad cluster coverage) counts as unavailable, never as a split.

**FinalReview step** — new Finish section in `coordinator.js` (one function plus three plain builders), the whole-epic review with its size switch.
- Owns: window resolution (`config.contextWindows.finalReview`, else the per-harness smallest known window, defined in one place), the 40% threshold, assemble → single or cluster→seam, verdict combination (any null cluster/seam → `not ready (… unreviewed)`), the `Final review:` ledger line, and the verdict-line-plus-`reviewPath` return.
- Hides: the split from the Workflow return contract and from super-auto, which see one verdict and one path either way.
- Must not: read review bodies (it gets verdicts through schema fields; the file is the reader's); write files (the Workflow does no I/O) — the reviewer writes `final-review-<runTag>.md`, in split mode the seam reviewer writes it from the `final-review-<runTag>-cluster-<n>.md` files; on a null seam review a mechanical dispatch writes a stub `final-review-<runTag>.md` listing the cluster files, so `reviewPath` is always that one file, and the verdict names the seam unreviewed.
- Relationships: composes the Assembler and three builders (`finalReviewPrompt` single, a cluster builder, and a final-seam builder named apart from the existing task `seamReviewPrompt`); dispatch-text's `final-review --mode` selects among them, one case each.
- Lifecycle: once per invocation, at Finish.
- Errors: null assemble → `single (assembler unavailable)` on direct inputs; null single review → today's `FINAL REVIEW UNAVAILABLE`.

**OversizedSplit** — new script pair: `task-surface` (surface measurement) and `split-oversized` (validate and file a planner's split proposal).
- Owns: the `surfaceTokens` arithmetic at the base commit; refusal rules (child files outside `filesTouched ∪ filesToRead`; children's acceptance missing an original checklist item verbatim); filing as one graph rewrite (flag triple, copied upstream deps, the original's dependents rewired onto every child, `blocked-by` lines, then `bd supersede` last).
- Hides: all deterministic split logic; coordinators only dispatch the script and route on its outcome, as for `unplanned`/`missingEdges`.
- Must not: decide whether a task is oversized — the planner judges that.
- Errors: callers distinguish `refused` (→ `Split refused: <id> — <reason>`, proceed unsplit) from a filing failure after partial children (must not supersede; reports filed children for reconciliation) — distinct exit codes.

**context-preflight** — new bash script, one window reader per harness: records each role's context window and warns.
- Owns: harness detection (the one place the reader is chosen), the Codex reader (`config.toml` + model cache), the Claude reader (session model settings + env overrides → 1M/200K), the warning rules with their one-line fixes, and the line and `--json` output forms.
- Must not: edit configuration, stop the run, or apply the "smallest known window" default (the FinalReview step owns that).
- Errors: none cross the boundary — it prints `Context: unknown — <reason>` and exits 0.

**run-profile.mjs** — extended: an `--in-flight --epic` mode, one new function over the existing discovery plus its argv entry, nothing else (separable from the context-pass branch).

**coordinator.js prompt builders / dispatch-text** — extended: the `assemblePrompt` builder and the final-review trio, the final-answer rule in every builder, the fix-pass path handoff stated as the agent's only memory, and the PLANNED schema's `filesToRead`, `surfaceTokens`, `oversized`; dispatch-text's builder return list (`loadBuilders`) and its `switch` are the registration point for each new kind.

Variation: harness hook output shape (Claude Code, Codex) → one compact-matcher entry script per hook manifest over RunBlockInjector, the shape chosen in each entry. Report formats → one recogniser each in report-verdict's ordered table. Assembler consumers → one profile entry in `assemblePrompt`'s table. Final-review modes (single/cluster/seam, fixed by the spec) → three plain builders chosen in the FinalReview step and dispatch-text's `--mode` case, no mode flag inside builders. Harness window sources → two readers in context-preflight, chosen by its single harness detection.
Walk-through: Claude Code compacts mid super-auto run → `session-start` emits the bootstrap as today from its own entry → the compact entry runs `session-start-runblock` → RunBlockInjector reads `session_id` + `cwd` → `run-marker get` prints the resolved key → the card entry emits the static card, and the state entry runs `run-marker get … | run-digest --part state --budget 9000` under the watchdog (header, ledger-digest counts and tail, open beads, session-scoped `run-profile --in-flight`) → each sanitised, escaped, emitted as its own `additionalContext`; the coordinator then reads child results only through `report-verdict`, and at Finish the FinalReview step assembles, gets `fits: no` → cluster reviewers → seam reviewer → verdict line + `reviewPath`. Likely future change — re-inject for a new harness (e.g. Gemini CLI) — touches one new entry script plus its hook-manifest entry, no change to run-digest, run-marker or the existing hooks; a new child report kind touches one recogniser plus one table entry in report-verdict.
Per spec §A2: the run block gets its own hook entry so each string stays under Claude Code's 10,000-character cap; `session-start` keeps only the bootstrap.
Per spec §A5: super-roast keeps returning `reportMarkdown` — callers must write it to disk before `report-verdict` can read it, a step every roast caller repeats until the follow-on lands.

Digest:
- run-marker: owns marker storage, format and liveness; new liveness rules go only in its `get`;
  callers never read marker files directly, only `get`'s exit code.
- run-digest: owns the run block's sections, order (card first), budget trim and shared deadline; a new section is one source call plus
  its place in the trim order; callers never assemble run state themselves.
- RunBlockInjector: owns stdin parsing, the watchdog, the fallback and JSON escaping for re-inject; a new
  harness adds one entry script that sources it; entry scripts never call run-digest unguarded.
- report-verdict: owns child-report → verdict/blocking/path parsing; a new report kind is one
  recogniser in its ordered table; coordinators never read report bodies.
- Final-answer rule: owns the closing line of every dispatch; each new builder ends with it,
  and super-auto templates copy it literally; never appended in `dispatch()`.
- Assembler: owns gathering into digest/slices/clusters, with `assembled-size` owning `fits` and coverage;
  a new consumer is one profile entry in `assemblePrompt`; consumers never compute `fits` themselves.
- FinalReview step: owns the window threshold, the single/split switch, verdict combination and the
  ledger line; new modes are a builder plus one case; callers never see the split or read the body.
- OversizedSplit: owns surface measurement, split validation and filing; new refusal rules go
  in `split-oversized`; coordinators never file split children themselves.
- context-preflight: owns harness detection, per-harness window reading and warnings; a new harness
  is one reader chosen at its detection; it never edits config or stops a run.

## Post-Implementation Notes

> *As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
