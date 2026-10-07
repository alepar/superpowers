# A6: errors, logging, cleanup, and durable evidence

Auditor A6, a cross-cutting scope. Repo `research/oop-design-scouts` @ eb0462b (6.4.2-alepar4.16). Read-only.
I ran no tests. Everything comes from reading files, `grep`, and read-only `git log -S` / `git show --stat`.

## Scope and files read

The audit covers two things: (a) what Superpowers tells the code it produces about errors, logging and
cleanup; (b) how Superpowers' own engines and scripts handle failures and keep evidence.

Method: I grepped `skills/`, `docs/superpowers/specs/` and `tests/` for exception, throw, raise, panic,
Result, wrap, cause, rethrow, stack trace/traceback, log/logger/logging, stderr, cleanup, finally,
defer, dispose, retry, swallow and catch, then read every hit in context. A second grep for
cause-chain, translation and catch-all terms (`rethrow|cause chain|exception translation|log.and.(re)?throw|catch-all|broad catch|bare except|Result<|errors\.Is|raise .* from`)
found only engine-internal policy (`skills/super-code/coordinator.js:1249,1278`,
`skills/super-code/MAINTENANCE.md:804`) and one test helper (`tests/claude-code/analyze-token-usage.py:67`).
I also grepped the prompt strings in `coordinator.js` (swallow, logging, cleanup, exception, error
behaviour). The only hit addressed to produced code was the seam-review clause at `:1618`.

About 50 files were read in full or in the relevant part. Another 28 helper scripts were surveyed
through their headers and greps for `set -e`, `trap`, `>&2` and `exit N`.

| File (lines) | Read |
|---|---|
| `skills/super-code/implementer-prompt.md` (168), `task-reviewer-prompt.md` (114), `triage-prompt.md` (89) | full |
| `skills/subagent-driven-development/implementer-prompt.md` (154), `task-reviewer-prompt.md` (207), `re-review-prompt.md` (115) | full |
| `skills/requesting-code-review/code-reviewer.md` (181), `SKILL.md` (95) | full |
| `skills/systematic-debugging/SKILL.md` (283), `defense-in-depth.md` (122), `root-cause-tracing.md` (169) | full |
| `skills/test-driven-development/SKILL.md` (320) 60–300; `writing-good-tests.md` (198) 100–135 + grep | part |
| `skills/verification-before-completion/SKILL.md` (120) | full |
| `skills/super-roast/scout-prompts-pr.md` (587), `scout-prompts-design.md` (222), `triage-prompt.md` (55), `judge-seat-prompts.md` (164), `dedupe-prompt.md` (64), `reporter-prompt.md` (306) | full |
| `skills/super-roast/SKILL.md` (312) 60–140, 248–262; `super-roast-workflow.md` (1002) 30–70, 160–200, 240–300, 395–435, 654–700, 760–768 + grep; `scripts/assemble-args.mjs` (308) 150–200 | part |
| `docs/superpowers/specs/references/pr-review-taxonomy.md` (324) 1–45, 82–99, 131–163 + grep | part |
| `skills/super-code/coordinator.js` (2086): 25–60, 134–230, 320–380, 876–900, 1246–1282, 1474–1482, 1520–1526, 1849–1868 + grep of every `try/catch/throw/log(` | part |
| `skills/super-code/coordinator-workflow.md` (1999) 205–300, 542–692, 1077–1092 + grep; `MAINTENANCE.md` (1007) 288–300, 336–346, 795–812, 855–880; `SKILL.md` (308) 60–80 + grep | part |
| `skills/super-code/scripts/ledger-digest` (57) full; `remove-task-worktree` (140) 1–24; `skills/subagent-driven-development/scripts/review-package` (61) 20–61; `skills/super-auto/scripts/report-status` (186) 1–60 | full/part |
| `skills/super-auto/run-state.md` (235) 1–140; `report-prompt.md` (60) | part/full |
| `skills/upstream-feedback/SKILL.md` (128), `analyst-prompt.md` (76), `report-template.md` (68) | full |
| `skills/super-design/step-back-prompt.md` (102) full; `coverage-reviewer-prompt.md` (97) 40–97; `SKILL.md` (811) 488–506 + grep | full/part |
| `skills/brainstorming/SKILL.md` 215–240; `skills/writing-plans/SKILL.md` 125–145; brainstorming `start-server.sh`/`stop-server.sh` (grep) | part |
| `scripts/lint-shell.sh` (211) 1–80; `tests/skill-scripts/test-bash-invocation.sh` (29); `tests/super-auto/test-contract-lint.sh` (243) 1–80; `tests/super-roast/test-assemble-args.sh` (86), `engine-mock.mjs` (103), `tests/super-code/replay-harness.mjs` (3059) via grep | part |
| Specs: `2026-07-29-super-roast-design.md` (250) 76–90, 120–128; `2026-06-10-positive-instruction-redesign-design.md` (178) 78–90 | part |
| Run artifacts: `docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/…-roast-pr-1.md` (121) 1–12, 80–88; `runs/2026-09-04-audit-plan-instrumentation/friction.md` (13) 1–8, `upstream-feedback-draft.md` (129) 40–46; `docs/superpowers/reviews/2026-07-30-depth-cap-spec-roast-1.md` (205) grep + 39–40 | part |

Skipped: `skills/writing-skills/anthropic-best-practices.md`, a vendored external doc whose grep hits
were all about skill authoring. I also skipped the brainstorming server JS internals; they are
companion UI and the grep showed no produced-code guidance in them. Two philosophy items, "skills
avoid overconstraining" and "autonomous runs degrade, don't stop", come from the session's memory
index, which lives outside the worktree. Where the repo states the same rule, I cite the repo.

## Mechanism map

**Design time (super-design / brainstorming / writing-plans).** Spec authors are told to "Cover:
architecture, components, data flow, error handling, testing" (`skills/brainstorming/SKILL.md:227`).
Plans may not contain the placeholder "Add appropriate error handling" (`skills/writing-plans/SKILL.md:134`),
so error handling must be written out concretely. No skill says what a good error model looks like.
Seam contract beads deliver "the interface/types/signatures, the schema fields, and the wiring"
(`skills/super-design/SKILL.md:500`). The UNOWNED-SEAM check names three kinds of exchange: config
values, interfaces and formats (`skills/super-design/coverage-reviewer-prompt.md:62-66`). Neither
mentions failure or error semantics. The design-roast lenses that touch errors are one-liners:
completeness ("unhandled error/edge cases", `skills/super-roast/scout-prompts-design.md:152-153`) and
failure-mode ("Assume each component/dependency fails — trace the blast radius", `:165`).

**Implementation time (super-code / SDD implementers).** The super-code implementer brief contains no
error, logging or cleanup guidance for product code. It says "Follow the codebase's established
patterns" (`skills/super-code/implementer-prompt.md:71-72`) and forbids extra work. The SDD implementer
adds "one clear responsibility with a well-defined interface" and "follow established patterns"
(`skills/subagent-driven-development/implementer-prompt.md:67,72`). Error idioms reach implementers
through the TDD and debugging skills, and every example there is TypeScript/Node:
`throw`/rethrow in `retryOperation` (`skills/test-driven-development/SKILL.md:136-145`),
`return { error: 'Email required' }` (`:266-269`), `console.error()` over the logger in tests
(`skills/systematic-debugging/root-cause-tracing.md:85,158`), and `new Error().stack`
(`:161`, `defense-in-depth.md:76-83`). Cleanup for produced code appears once: "Production classes
carry production methods only... Does this class own this resource's lifecycle?"
(`skills/test-driven-development/writing-good-tests.md:124-127`).

**Review time.**
- Task reviewers:
  - super-code checks "swallowed errors" under correctness (`skills/super-code/task-reviewer-prompt.md:71-72`).
  - The SDD reviewer asks "Proper error handling?" and calibrates swallowed errors as Important (`skills/subagent-driven-development/task-reviewer-prompt.md:119,148-152`).
  - requesting-code-review asks "Proper error handling?" and puts "poor error handling" under Important (`skills/requesting-code-review/code-reviewer.md:55,100`).
- super-roast PR lanes. The core lanes are correctness, security, premortem, simplicity-design,
  hot-path-perf and concurrency-async (`skills/super-roast/triage-prompt.md:32-33`). Error, logging and
  cleanup items are spread across them and across conditional lanes (map in A6-F03).
- Severity flows dedupe suggestion → blind three-seat judges → reporter. The reporter applies the
  profile and the profile-proof floors (`skills/super-roast/reporter-prompt.md:119-142`).
- The super-code final whole-epic review triages ledger minors and `Recurring` clusters first
  (`skills/super-code/coordinator.js:1860`).
- The post-rebase seam review checks error behaviour across a boundary in one case only: a
  `consumes <id>` dependency that merged after the task branched. It checks "names, signatures,
  schema, defaults, error and ordering behaviour the consumer assumes"
  (`skills/super-code/coordinator.js:1618`).

**Engine failure handling.**
- **super-code coordinator:**
  - every `agent()` call goes through `dispatch()`, which logs any null with its label and phase;
  - each dispatch class has its own null meaning;
  - degraded states are marked explicitly (`UNAVAILABLE`, `MEASUREMENT INVALID`, `METRICS INVALID`);
  - ledger appends are retried once, then marked.
- **super-roast engine:** dead agents become coverage loss (`lowCoverage`), and every unjudged finding
  is listed, never dropped.
- **Helper scripts:**
  - `set -euo pipefail`;
  - exit codes 0 ok / 2 bad input / 3 refused-kept-range / 4 dependency unavailable, with a
    `JQ_UNAVAILABLE:` manual fallback;
  - usage messages on stderr;
  - EXIT traps for temp files.

**Durable evidence.**
- super-code ledger, `<workspace>/progress.md`: git-ignored and workspace-lifetime only. It holds Task
  state lines, `minor (deferred): [class] …`, `[cause: …]`, `Merge:`, `Recurring <kind>:`,
  `Metrics:` and `Fallback:` lines.
- super-auto run directory, committed: `run.md`, `friction.md`, roast reports, step-back files and
  scope-filter records.
- super-design coverage ledger, committed with the artifact directory.
- upstream-feedback drafts and issues.

## Findings

### A6-F01 — gap: produced-code error guidance stops at checklist phrases
What the pipeline tells produced code about errors is limited to these phrases:
- "Cover: … error handling" (`skills/brainstorming/SKILL.md:227`)
- a ban on the "Add appropriate error handling" placeholder (`skills/writing-plans/SKILL.md:134`)
- "Proper error handling?" (`skills/subagent-driven-development/task-reviewer-prompt.md:119`; `skills/requesting-code-review/code-reviewer.md:55`)
- "swallowed errors" (`skills/super-code/task-reviewer-prompt.md:71-72`)

Nothing covers how to represent errors (exception vs result value), cause chaining, translation at an
abstraction boundary, who logs an error, stack traces in logs, or who owns cleanup. The super-code
implementer brief has no error or logging guidance at all (`skills/super-code/implementer-prompt.md:68-74,101-105`).
I looked with the cause-chain/translation grep in Scope: the only hits are the engine's own rethrow policy.
- (a) Design time: no incentive exists to design an error model per seam or module.
- (b) Review time: reviewers must use their own taste. The code-reviewer's own rule "DON'T … Be vague ('improve error handling')" (`code-reviewer.md:133`) sits on top of a rubric line that is itself vague.

### A6-F02 — observed: examples are TypeScript-only; review lanes are multi-runtime
Implementation-time examples are all JS/TS:
- throw/rethrow and `return { error }`, mixed with no rule for choosing between them (`skills/test-driven-development/SKILL.md:136-145,266-269`)
- `console.error()` vs logger (`skills/systematic-debugging/root-cause-tracing.md:85`)
- the `NODE_ENV` guard and `logger.debug(... stack)` (`skills/systematic-debugging/defense-in-depth.md:58,76-83`)

The PR lanes cover several runtimes: Go `_`, TS `!` (`skills/super-roast/scout-prompts-pr.md:177`);
`defer close`/try-with-resources/context manager (`:239-240`); C#/Rust/Node/Python sync-over-async
(`:381-382`); and "route by language/runtime" (`:403`). For produced code, the only way to adapt to the
language is "follow the codebase's established patterns" (`skills/super-code/implementer-prompt.md:71-72`).
- Implication: any new error guidance must adapt to the language, or it will push one runtime's habits. The lanes already show a model for that: per-runtime examples under one rule.

### A6-F03 — observed: review lanes catch error defects but miss error-model defects
| Lane | Error/logging/cleanup items | Citation |
|---|---|---|
| correctness (core) | errors dropped (`catch {}`, Go `_`, TS `!`); swallowed exceptions, logged-but-continued, partial failure leaving inconsistent state | `scout-prompts-pr.md:177-178` |
| security (core) | secrets written to logs; stack traces/internal detail returned to clients | `:204,212` |
| premortem (core) | leaks; missing `defer close`/try-with-resources; pool not released on error path; fire-and-forget with no observability; listener/`useEffect` cleanup | `:239-246` |
| concurrency-async (core) | unawaited promises / fire-and-forget without error capture — swallowed exceptions; timers/listeners never cleaned up | `:386-387,392` |
| data-migrations (cond.) | partial commit on error | `:417` |
| api-contract (cond.) | "Inconsistent error contract: some errors thrown, some returned, some swallowed; no error schema/codes" | `:471-472` |
| observability (cond.) | silent failure, PII in logs, log-level misuse, unstructured logs, missing trace context, no alert hook | `:488-496` |
| testing (cond.) | coverage of error branches | `:510` |
| design lenses | completeness "unhandled error/edge cases"; failure-mode blast radius | `scout-prompts-design.md:152-153,165` |
| super-code seam review (only for a `consumes` dependency that merged after branching) | "error and ordering behaviour the consumer assumes" | `skills/super-code/coordinator.js:1618` |

Observability only joins a review when triage sees "new failure paths introduced, or logging/metrics/tracing changed"
(`skills/super-roast/triage-prompt.md:40`). No lane hunts for:
- loss of the original cause when an error is wrapped or rethrown;
- missing translation of an error at an abstraction boundary;
- logging and then rethrowing, so the same error is logged twice;
- catch-alls that are too broad;
- unclear cleanup ownership.

These are design-level error defects. They sit between simplicity-design and api-contract and belong to neither lane.
- (b) A lane or a hunt-list extension would be new coverage, not a duplicate of an existing lane.

### A6-F04 — observed: taxonomy severities are stripped, and error/observability findings can be demoted
Scouts may not use severity words (`skills/super-roast/scout-prompts-pr.md:57-59`). The taxonomy's
per-smell severities ("Silent failure on a critical path = Should-fix. PII-in-logs = Blocking",
`docs/superpowers/specs/references/pr-review-taxonomy.md:143`) survive only as recall instructions
("always report PII-in-logs … silent failure on a critical path", `scout-prompts-pr.md:498-499`).

The reporter "down-weights resilience/observability/cost findings for low-blast-radius projects"
(`skills/super-roast/reporter-prompt.md:126-127`). The profile-proof floors cover injection, authZ,
secrets-in-code, data loss and core purpose (`:132-138`). They do not cover silent failure, PII in
logs or swallowed errors. A recorded roast applied the demotion: "so resilience and observability
findings are weighted down" (`docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/2026-10-01-prompting-guide-roast-fixes-roast-pr-1.md:3`).

Task-review severity for errors:
- super-code: Important means "incorrect or fragile behavior"; Critical includes data loss (`skills/super-code/task-reviewer-prompt.md:83-86`).
- SDD: swallowed errors are explicitly Important (`skills/subagent-driven-development/task-reviewer-prompt.md:148-152`).
- (b) The severity a design/error lane ends up with is decided by the generic scale plus the profile, not by the lane. A must-not-demote rule would need a floor edit.

### A6-F05 — observed (good): super-code keeps failures visible and context-rich
- `dispatch()` logs each null as `NULL dispatch: <label> (phase …)` and `SCRIPT FAILURE` (`skills/super-code/coordinator.js:147-160`).
- A failing script returns its name, exit code and the last lines of its stderr (`:1480`).
- "There is no blanket default … most defaults would fabricate an outcome no agent produced" (`skills/super-code/coordinator-workflow.md:225-226`).
- Chain rejections are logged with `e.stack` before they are swallowed (`coordinator.js:892-894`).
- `FINAL REVIEW UNAVAILABLE`, never "no findings" (`:1441`).
- Arguments are validated with their values shown (`:25`).
- The workspace-divergence throw names the causes to check (`:604`).
- Policy is decided per mode: "rethrow under `dryRun`, swallow-and-log in a live run" (`skills/super-code/MAINTENANCE.md:804-809`).

Provenance: a live crash, `null is not an object (evaluating 'm.merged')`, and a false "drained"
success (`coordinator-workflow.md:209-215`). These were fixed in a308a57 and 46fd7e7.
- (a)/(b) This is the repo's own working error policy. It could be written down as guidance for produced code.

### A6-F06 — observed: the roast engine and the first-failure latches lose error causes
The super-roast engine turns a throwing judge thunk into `null` and logs only a count:
"judges: N finding(s) lost their judge dispatch" (`skills/super-roast/super-roast-workflow.md:430-433`).
The runtime's `parallel()` "turns a throwing thunk into `null`" (`:764-765`), and the mock copies that
with `.catch(() => null)` (`tests/super-roast/engine-mock.mjs:11`). The coordinator's `chainCatch`
logs `e.stack`; the roast engine does not.

Separately, `ledgerFailure = ledgerFailure ?? e` and `topUpFailure = topUpFailure ?? e`
(`skills/super-code/coordinator.js:211,1254`; "The first failure is kept", `MAINTENANCE.md:802`)
drop every later error in the same window without logging it.

Inference: unless the Workflow runtime logs the thrown error, the cause of a judge-lost packet is not recorded anywhere.
- (b) This is a weak spot in the repo's own error evidence. A self-roast with an error-cause lane would flag it.

### A6-F07 — observed: helper scripts share an error convention that only lives in each script's header
The super-* and SDD scripts all use `set -euo pipefail` and "Exit 0 ok, 2 bad input, … 4 jq
unavailable (prints a JQ_UNAVAILABLE: line on stdout)" (e.g. `skills/super-design/scripts/coverage-inputs:18,37`;
`skills/super-roast/scripts/assemble-args:4`). Temp files are cleaned with EXIT traps
(`skills/super-code/scripts/tree-deps:33`, `tree-shape:28`, `coverage-inputs:57`). Several scripts
fail closed:
- "a git failure counts as a change" (`skills/super-auto/scripts/report-status:11`)
- review-package refuses a header-only package and says where HEAD was resolved; this came from about 40 empty reviews on one run (`skills/subagent-driven-development/scripts/review-package:30-35`)

The brainstorming server scripts use a different convention: a JSON `{"error": …}` on stdout with
exit 1 and no `set -e` (`skills/brainstorming/scripts/start-server.sh:60-61,208-209`). I found no
repo-level document of the convention; grep finds only call-site uses such as
`skills/super-auto/report-prompt.md:36`. ShellCheck is the only lint (`scripts/lint-shell.sh:8`).
- (a) This is a reusable, language-specific (bash) template for "error contract at a tool boundary".

### A6-F08 — observed: cleanup ownership is explicit for the engine, barely stated for produced code
For the engine:
- "It runs whoever owns the finish, because task worktrees and the processes started in them are this skill's, not the caller's" (`skills/super-code/coordinator-workflow.md:1086-1087`).
- Cleanup never uses `--force` and reports what it kept, exiting 3 (`skills/super-code/scripts/remove-task-worktree:9-15,23`).
- Implementers must stop any process their tests leaked (`coordinator.js:1526`).
- Leaked processes are Minor, or Important for a daemon or a survivor (`skills/super-code/task-reviewer-prompt.md:62-63`).

For produced code there is the test-utility rule (`skills/test-driven-development/writing-good-tests.md:124-127`)
and the leak heuristics (`scout-prompts-pr.md:239-246,392`).
- (a) "Who owns this resource's lifecycle" is already asked once. It could become a design-time question per class or seam.

### A6-F09 — observed: evidence fields a design/error lane or contract bead could reuse
- **Roast:**
  - Confirmed-finding entries: `[SEV] <location> — <claim>`, seat `verdict:`, `evidence:`, `fix-shape hint:` (`skills/super-roast/reporter-prompt.md:232-236`).
  - Packets carry `category`/`lanes` and `[fix-regression]` (`:45-52`).
  - The coverage object (`super-roast-workflow.md:171-178`).
  - Judge rules: an external CONFIRM needs a resolved URL plus a quote (`judge-seat-prompts.md:64-65`); `preExisting: true` with the base location (`:153-157`); repo-context premises must be grepped (`:162-164`).
- **super-code:**
  - Reviewer `minors` carry `[class]` tags (`skills/super-code/task-reviewer-prompt.md:110-114`).
  - Triage `cause` is under 12 words and generic (`skills/super-code/triage-prompt.md:79-86`).
  - Both are clustered at ≥5 occurrences or ≥3 tasks into `Recurring <kind>:` lines (`coordinator.js:336-338,356`), which the final review triages first (`:1860`).
  - The digest keeps `[cause: …]` and `minor [class]` (`skills/super-code/scripts/ledger-digest:10-11`).
- **Fix loops:** step-back `clusters: - <id>: <keys> | rule: <the one fix that applies to every instance…>` (`skills/super-design/step-back-prompt.md:91-92`).
- **Design:** the coverage ledger line `<ledger-id> · r<N> · <TYPE> · <subject> · <disposition> — <one line>` (`skills/super-design/SKILL.md:436`).
- **run.md:** `parked:` kinds are a closed set (`skills/super-auto/run-state.md:33`).
- **Friction log:** `- [<date> <phase/round>] <what happened> — <why…>` (`skills/upstream-feedback/SKILL.md:18-22`).
- (b) An error lane needs no new evidence machinery. Its `category` value and canonical `[class]` tags would flow through as they are.

### A6-F10 — observed: the class-tag evidence is not committed
`sdd-workspace` writes `*` into `.superpowers/sdd/.gitignore`
(`skills/subagent-driven-development/scripts/sdd-workspace:81`). The ledger and reports "live
git-ignored inside the integration worktree" (`skills/super-auto/report-prompt.md:14`). The report's
Smells sources are parked findings, degraded verdicts, DONE_WITH_CONCERNS reports and tasks that
needed a fix pass. Deferred `[class]` minors are not among them (`report-prompt.md:56`). Standalone
super-code friction is "workspace-lifetime only" (`skills/upstream-feedback/SKILL.md:29-35`).
- (b) Cross-run statistics on error/logging smells (for example, how often `[swallowed-error]` appears) cannot be rebuilt from the repo. An eval of a new lane needs its own capture.

### A6-F11 — gap: error semantics are checked late, never declared in contracts
At design time, error semantics are never declared. A `Seam contract:` bead delivers "the
interface/types/signatures, the schema fields, and the wiring itself plumbed end-to-end as stubs or
defaults" (`skills/super-design/SKILL.md:500`). The UNOWNED-SEAM exchange kinds are config value,
interface and format (`skills/super-design/coverage-reviewer-prompt.md:62-66`). Nothing declares
which errors cross the seam, who translates them, or who logs them.

At review time they are checked only conditionally:
- **super-code seam review.** It checks "error and ordering behaviour the consumer assumes", but only
  for a `consumes <id>` dependency that merged after the task branched
  (`skills/super-code/coordinator.js:1618`). It checks against the producer's merged code, because no
  declared error contract exists.
- **PR roast.** api-contract item 6 covers this (`scout-prompts-pr.md:471-472`), and api-contract is a
  conditional lane.
- (a) The contract bead is the natural place to put an error contract into compilable code: error types in signatures and a translation point.
- (b) A seam-integration test or the api-contract lane could then check against it.

### A6-F12 — inference: TDD minimalism pulls against premortem's retry hunt
TDD's "Good" GREEN example retries with no backoff, and its "Bad" example labels backoff and an
`onRetry` hook as over-engineered (`skills/test-driven-development/SKILL.md:134-163`). The premortem
lane hunts "Retries without backoff+jitter" and "always report" it on high-fanout paths
(`scout-prompts-pr.md:235-236,250-251`). Only the lane's process-lifetime filter (`:252-254`) settles
the conflict.

This is my inference: the snippet is a TDD minimal-step example, not a design rule. Confidence: low–medium.
- (a)/(b) Design-time minimalism can produce code that review-time lanes then flag. A new error incentive should not be phrased as YAGNI-exempt.

### A6-F13 — observed: the pipeline audits its own swallowed failures, and that changed policy
The upstream-feedback analyst's correctness lens hunts for "failures that were swallowed where they
should have been visible" (`skills/upstream-feedback/analyst-prompt.md:45-47`). Two recorded
instances changed policy:
1. **Lost ledger appends.** A run logged "so the ledger silently lacks those lines"
   (`docs/superpowers/runs/2026-09-04-audit-plan-instrumentation/friction.md:5`). Its feedback draft
   proposed retry-then-mark (`upstream-feedback-draft.md:42-46`). Commit 46fd7e7 shipped that as
   `coordinator.js:183-203`.
2. **Dead dedupe stage.** A design roast confirmed as Blocking that a dead dedupe stage "reports
   `clean (0 nits)`" (`docs/superpowers/reviews/2026-07-30-depth-cap-spec-roast-1.md:39`). That
   finding became `dedupeDead` in `lowCoverage` (`super-roast-workflow.md:487`).
- (b) This is evidence that roast and feedback lanes do enforce error visibility when they are pointed at it.

## Extension points

**Data-only edits.** The super-roast dryRun policy says "Data edits skip it — lane rosters, prompt
wording, caps, model tiers" (`skills/super-roast/super-roast-workflow.md:669-673`).
- **PR lanes, `skills/super-roast/scout-prompts-pr.md`.** Two options:
  - extend the hunt lists of correctness (`:177-178`), api-contract (`:471-472`) or observability (`:488-496`);
  - add a `## Lane: <name>` block.

  `assemble-args.mjs:183-190` picks up every `Lane:` section automatically. A conditional lane needs
  an activation rule in `skills/super-roast/triage-prompt.md:36-44`; a core lane goes in the core-list
  sentence at `:32-33`, which is parsed at `assemble-args.mjs:157`. Update the expectations in
  `tests/super-roast/test-assemble-args.sh:27-28`.
- **Design lenses.** Add a `## Lens:` block in `scout-prompts-design.md`, or extend completeness or
  failure-mode (`:149-166`). Roster: `config.coreLenses` (`skills/super-roast/SKILL.md:119-120`,
  parsed at `assemble-args.mjs:158`). Test: `test-assemble-args.sh:44`.
- **Severity.** The profile down-weight sentence (`reporter-prompt.md:125-130`) and the floors
  (`:132-142`) shape behavior directly; floors must stay profile-proof.
- **Task review.** super-code "What to check" item 2 and the `[class]` examples
  (`skills/super-code/task-reviewer-prompt.md:71-72,110-114`); SDD Part 2 and Calibration
  (`skills/subagent-driven-development/task-reviewer-prompt.md:117-121,145-157`); `code-reviewer.md:53-58`.
- **Implementers.** super-code Scope and Self-review (`implementer-prompt.md:68-74,101-105`); SDD Code
  Organization and Self-Review (`:62-117`).
- **Design.** `brainstorming/SKILL.md:227`; `writing-plans/SKILL.md:130-138`; the seam-contract
  definition (`super-design/SKILL.md:500`); UNOWNED-SEAM exchange kinds (`coverage-reviewer-prompt.md:62-66`).
  Bead-description tokens `owns:`, `consumes:` and `boundary contract:` are parsed by
  `skills/super-design/scripts/coverage-inputs:94-106` and reach execution briefs through the planner
  (`super-design/SKILL.md:502`).
- **Evidence.**
  - Seed canonical `[class]` tags. Clustering keys on them (`coordinator.js:343-346`).
  - A coverage-ledger `TYPE`.
  - Step-back `rule:` clusters, for sweeping one error rule across all its instances.

**Engine-code edits, which are expensive.**
- `skills/super-code/coordinator.js`: the replay harness pins the template-literal count at 398
  (`tests/super-code/replay-harness.mjs:374`), and the documented dryRun scenarios must be re-run
  (`CLAUDE.md:130`).
- The engine block in `super-roast-workflow.md`: a structural edit requires a dryRun (`:669-671`).
- Closing the A6-F06 cause loss is an engine-code edit.

**Must stay untouched.**
- One review and one fix pass per task: "This is the only fix pass the task gets" (`skills/super-code/implementer-prompt.md:147-148`; `task-reviewer-prompt.md:10-12`).
- The roast cap of 3 iterations and the human pause (`skills/super-roast/SKILL.md:102-111`).
- Scouts never assign severity (`scout-prompts-pr.md:55-62`).
- The three-seat panel with ≥2-of-3 agreement (`judge-seat-prompts.md:3-9`).
- The single severity vocabulary (`super-roast/SKILL.md:136-139`).
- Profile-proof floors (`reporter-prompt.md:132-142`).
- Frozen run.md fields (`tests/super-auto/test-contract-lint.sh:1-7`).

## Constraints and costs

- **Cost per lane.**
  - Scouts run on opus; judges on sonnet, up to 3 seats per severe finding (`skills/super-roast/SKILL.md:255-257`).
  - A new core lane adds one opus scout to every PR-roast round, up to 3 rounds, plus panels for its severe findings.
  - A conditional lane costs only when triage activates it, and triage biases toward activating: "On doubt, activate" (`triage-prompt.md:46`).
- **Tests.**
  - `test-assemble-args.sh` asserts exactly 6 core lanes and 13 lane prompts (`:27-28`) and the design rosters (`:44`).
  - The replay harness has about 620 `check(` assertions and a literal-count baseline.
  - The contract lint freezes run.md field names and formats against fixtures from 2bf1d53 (`test-contract-lint.sh:1-7`). A recorded roast rejected a challenge to that freeze, citing "Its field names and line formats must not change" (`…-roast-pr-1.md`, Rejected section).
  - Release checklist: `CLAUDE.md:121-130`.
- **Philosophy.**
  - Skill changes need before/after evals (`CLAUDE.md:93-99`).
  - No nuance clauses; exceptions are written as conditionals on an observable predicate (`skills/writing-skills/SKILL.md:468,473`).
  - A pragmatism filter is not a severity label (`scout-prompts-pr.md:55-62`).
  - Implementers "Change only what the task needs" (`skills/super-code/implementer-prompt.md:70-74`), so an error incentive must not license scope creep.
  - Degrade, don't stop (`skills/super-auto/SKILL.md:99`; `skills/super-code/SKILL.md:71-72`).
  - Skills avoid overconstraining, and SKILL.md carries no history (session memory index).
- **Low-blast profiles.** These profiles demote observability findings by design (A6-F04). An error lane meant to stay effective on internal tools must either prove correctness impact in `evidence` or argue for a floor.

## Open questions

1. When `parallel()` nulls a throwing thunk, does the Workflow runtime log the exception? The answer decides whether A6-F06 is a real loss of cause.
2. How often does triage activate the observability and api-contract lanes, and what do they yield? Only one run's PR roasts are committed (2026-10-01, rounds 1–2), so the repo cannot answer this.
3. How common are error-handling defects in code super-code produces? The `[class]` minor corpus is git-ignored (A6-F10), and no eval measures error-handling quality.
4. Should profile demotion apply to swallowed-error correctness findings, or only to observability? The reporter text names "resilience/observability/cost" but not correctness.
5. How should language-adaptive error guidance coexist with "follow established patterns" in a codebase whose existing error conventions are poor?
