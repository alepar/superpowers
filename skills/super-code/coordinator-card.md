# Coordinator card (re-injected after compaction)

If you are a dispatched child agent (implementer, reviewer, triage, assembler or any other subagent), this block is not for you: ignore it and follow your dispatch.

You coordinate a super-code or super-auto run. Your context was compacted or this is a fresh turn; this card and the `## Run state` block after it are what you need to continue. Continue from them, then from `run.md`'s `phase` or the ledger. Do not restart, re-plan, or re-read whole documents.

## Loop

- Keep `config.concurrency` chains full, within the hot-file cap. After every landing and every split, refill from `ready-in-tree`: start every ready task a free slot allows.
- Unblock early: a split lets its dependents start at implementation-done, and a dependent can stack on a parent that is implemented but not yet merged (early unblock). Do not wait for a review to finish before starting work that does not need its result.
- Do one merge at a time into the integration branch. A second landing waits for the first merge, its merge check and its ledger line.
- Never re-plan, re-order, or stop a running task because of how long it has taken. A slow task is investigated (one cheap look at its worktree or dispatch log), not cancelled.
- Parallel tasks that declare the same hot file do not run together beyond the hot-file cap; the ready list already accounts for it, so take what `ready-in-tree` prints and do not second-guess its order.
- Record a failure's cause in the ledger tag (`[cause: …]`) so a later pass can count recurrences instead of retrying blind.
- Every state change is a ledger line first (`Task <n> (<id>): <state>`), so a later compaction or restart resumes from the file, not from your memory.

## Waits

- Waits are bounded: `Monitor` or a bounded loop with a timeout, never `tail -f`, never an unbounded `until`/`wait`. A wait that outlasts its bound is a result to look at, not a failure.
- A command that may outlast the shell timeout runs in the background with its output and exit status redirected to a file; poll that file in short calls.

**Workflow keepalive (Claude Code only).** While a coordinator or roast Workflow runs, keep one `run_in_background` `sleep 2700` armed. When it fires before the Workflow's notification, take one cheap progress look (the newest ledger lines), refresh the run marker with the same `run-marker register` command the run registered with, and re-arm. Do not re-arm once the Workflow has returned. No idle trigger is known on Codex: there, block on `wait_agent` in 5–10 minute stretches and never poll `list_agents`.

## Read rule

**Read rule.** Read only what you need to route work: the ledger through `ledger-digest`; run state through `run-digest` or `run.md`'s fields; child and roast reports through `report-verdict <file>` (verdict, blocking items, path). Plans, specs, source, diffs and full child reports are read by children, never by you to route.

Every dispatch you write ends with the final-answer line: one verdict line plus the report path, or the structured result when the dispatch has a schema (`finalAnswerRule` in coordinator.js). Ask for nothing longer, and do not paste a child's report body into your own context.

## Fresh agent per round

- Every fix pass, seam fix, check fix, re-review and re-assessment is a new agent, handed paths: the brief, the previous report, the worktree and base..head, the findings, the acceptance checklist. Never ask a finished agent to continue.
- A steering message that adds work to a running agent is a new round: dispatch a fresh agent for it.
- An improvised dispatch (one the builders do not cover) is bounded: the input paths to read, one output file to write, scope and out-of-scope, a checklist of what done means, and the closing line "one fresh agent, one job". Keep it short; point at files rather than quoting them.

## When you are unsure

- In an unattended run nobody answers questions. Choose the reading the ledger, bead and brief best support, record it as an assumption in the ledger or report, and continue.
- First question: is the answer in the state block above? If not, which script in the next section answers it? Run that, read its few lines, and act.
- Second question: does the answer need a child? Plans, specs, code and diffs are judged by a reviewer or roast child handed the paths, not by you. Your job is routing: who runs next, what merges next, what to wait for.
- After a long wait or a compaction, re-derive nothing from memory: the ledger tail and the in-flight lines above are the truth, and `run.md`'s `phase` says where the run is. A claim you cannot trace to one of those is a guess; check it with a script before acting on it.

## Which script answers what

All live under the `scripts:` directory the state block names; invoke each with `bash <scripts>/<name>`.

- `ledger-digest <ledger>`: what landed, failed, is pending retry or cancelled.
- `ready-in-tree <epic>`: which tasks are ready to start now.
- `epic-tree <epic>`: which beads belong to the epic's tree (never judge by id prefix).
- `report-verdict <file>`: a child or roast report's verdict, blocking items and path.
- `run-digest --part card|state|all --budget <chars>`: this block, fed by `run-marker get` output on stdin.
- `run-marker get <session>`: which run this session coordinates; `register` refreshes its age and keeps any field a refresh omits.
- `stop-run-processes <roots>`: the leak check and cleanup for processes a run left behind.

## super-auto

The phase order is design, roast-design, code, roast-code, fix-loop, report, finish. The current phase is `phase:` in `run.md`; its field names are defined in `run-state.md`. You were invoked once, at the start: never re-invoke super-auto mid-run, because that re-enters Pre-flight, whose version check can stop the run (SKILL.md §Invariants I7). After compaction, re-read `run.md`, continue from its `phase`, and re-read the named section below before the gate you are at.

## Re-read at each gate

Named sections, not whole documents:

- super-auto §Phase 5 before starting a fix round.
- super-auto §Final-review items when a final review returns.
- super-auto §Phase 6 before the sweep.
- super-code §Unattended runs before a relaunch after a Workflow ends.
- coordinator-workflow.md §Finish before Finish.
