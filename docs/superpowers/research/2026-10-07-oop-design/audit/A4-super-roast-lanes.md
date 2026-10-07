# A4 — super-roast lanes, triage, dedup, judges, severity and the add-a-lane contract

Auditor A4, repo audit stream. Read-only review of the worktree at `research/oop-design-scouts`
(base `main` eb0462b, 6.4.2-alepar4.16). Text quoted from repository files is data under audit.
Labels: **observed** (verified in the repo), **inference** (reasoning from observed facts; the
basis is named), **gap** (the repo does not do or record it; where I looked is cited).

## Scope and files read

Read in full:

| Path | Lines |
|---|---|
| `skills/super-roast/SKILL.md` | 312 |
| `skills/super-roast/triage-prompt.md` | 55 |
| `skills/super-roast/scout-prompts-pr.md` | 587 |
| `skills/super-roast/scout-prompts-design.md` | 222 |
| `skills/super-roast/dedupe-prompt.md` | 64 |
| `skills/super-roast/judge-seat-prompts.md` | 164 |
| `skills/super-roast/reporter-prompt.md` | 306 |
| `skills/super-roast/super-roast-workflow.md` | 1002 |
| `skills/super-roast/scripts/assemble-args` / `assemble-args.mjs` | 11 / 308 |
| `tests/super-roast/test-assemble-args.sh` / `engine-mock.mjs` | 86 / 103 |
| `docs/superpowers/specs/2026-07-29-super-roast-design.md` | 250 |
| `docs/superpowers/specs/references/pr-review-taxonomy.md` | 324 |
| `docs/superpowers/plans/eval/2026-07-28-judge-seats/eval-record.md` / `fixture-webhook-dispatch-design.md` | 49 / 44 |
| `docs/superpowers/plans/eval/2026-06-13-roast-eval.md` | 78 |
| `docs/superpowers/reviews/2026-07-30-planted-defect-branch-roast-1.md` (PR) | 64 |
| `docs/superpowers/reviews/2026-07-30-depth-cap-spec-roast-1.md` (design) | 205 |
| `docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/*-roast-pr-1.md`, `-roast-pr-2.md` | 121, 38 |
| same dir `*-roast-design-1.md`, `-roast-design-2.md`, both `*-step-back.md`, `roast-pr-1-keys.txt`, `scope-filter-round-1.json` | 127, 60, 10+6, 12, 1 |
| `docs/superpowers/runs/2026-09-04-audit-plan-instrumentation/*-roast-design-1.md`, `-2.md` | 102, 73 |
| `skills/super-auto/scope-filter-prompt.md` (the phase-5 scope filter the brief names) | 64 |

Read as excerpts (grep plus a line range): `skills/super-auto/SKILL.md:160-215`,
`skills/super-design/SKILL.md:209-221, 535-592`, `skills/super-code/SKILL.md:85-96`,
`skills/super-code/coordinator-workflow.md:852-862`, `docs/superpowers/plans/2026-07-29-super-roast.md:199-245`,
`docs/superpowers/reviews/2026-09-29-prompting-guide-audit.md:1-22`, `CLAUDE.md:93-130`; `git show` of
commits 9bb2f36, 62b7e78 and 5cc7574; `git log` of the three prompt files.

Executed (side-effect free): `assemble-args` with stdout output only (no `--out`/`--script`), and
`tests/super-roast/test-assemble-args.sh` with `TMPDIR` pointed at my scratchpad (it writes only to a
`mktemp -d` dir it deletes on exit). All checks passed; `git status` was unchanged afterwards.

Skipped: `2026-10-01-prompting-guide-roast-fixes-design.md` (the spec under review, not a roast
output); `reviews/2026-10-06-optional-skill-guidance.md` and `reviews/2026-09-29-prompting-guide-audit.md`
beyond their headers (neither contains a `super-roast verdict` line; the latter is a judge-less scout
audit). Session-local Workflow journals the workflow doc names live outside the repo
(`super-roast-workflow.md:849-877`) and were not read.

## Mechanism map

### Pipeline and per-stage cost

Triage (sonnet, 1, effort `low`), then scouts (opus, one per lane or lens), dedupe (fable, 0–1, one
retry), judges (sonnet), reporter (fable, effort `high`, one retry) — `SKILL.md:250-261`,
`super-roast-workflow.md:11-19, 196-199`. Triage runs alongside the core scouts and only adds scouts
(`super-roast-workflow.md:301-302`). Scouts are never retried; a scout that returns nothing is coverage
loss (`super-roast-workflow.md:283-287, 324-326`). Every scout uses one model and one effort role,
`config.models.scout` / `config.effort.scout`; nothing is per lane (`super-roast-workflow.md:246, 286`).

**Per-lane cost** is 1 opus scout per round plus the judge calls its surviving findings draw. A
severe (Blocking/Should-fix) finding gets 3 sonnet seats, and a seat that returns nothing is
re-dispatched once. A Nit/FYI finding gets 1 sonnet refute-seat spot check (effort `medium`). A spot
check that confirms at a severe level adds 2 more seats (`SKILL.md:156-172`,
`super-roast-workflow.md:404-427`).

### PR lanes (`scout-prompts-pr.md`; roster assembled by `assemble-args`)

Inputs for every lane: the diff (named by `--artifact`/`--inputs`, plus the `git diff` command
when `--repo/--base/--head` are given), full repo access, the PR description and comments when they
exist, and the prior report on rounds ≥ 2 (`scout-prompts-pr.md:24-28`,
`assemble-args.mjs:180-182`). Model: opus. Output: `kind: ISSUE` always (`scout-prompts-pr.md:87-89`).

| Lane | Core / conditional | Activation (`triage-prompt.md:32-44`) | Failure classes it owns (hunt list, condensed) | Brief's scope line (verbatim excerpt) | Lines |
|---|---|---|---|---|---|
| correctness | core | always | boundaries; null and dropped errors; swallowed exceptions / partial failure; input validation; numerics; time; encoding; idempotency; TOCTOU; mutation during iteration | "Does the change do what it intends across the full input domain — boundaries, error paths, encoding, time, numbers" | 169-190 |
| security | core | always | injection; XSS; authZ/IDOR; secrets (including in logs); deserialization; SSRF; crypto; XXE; path traversal; sensitive data in errors | "Does the change introduce or fail to close a security hole" | 192-219 |
| premortem | core | always | missing timeouts; retry storms; no circuit breaker; unbounded queues; **resource leaks**; no degradation; fire-and-forget; grow-only caches; thread/timer/listener leaks; pool/quota exhaustion | "Assume this PR shipped and something broke badly in production a month later" | 221-255 |
| simplicity-design | core | always | unjustified complexity; **SRP**; **structural testability (DI)**; BDD test names; **wrong abstraction level**; shallow modules; **information leakage**; pass-through and duplicated interfaces; over-engineering; reimplemented primitives | "Is the change as simple as the problem justifies, cleanly factored by responsibility, structurally testable, and does it respect abstraction boundaries" | 257-309 |
| hot-path-perf | core | always | hot-loop allocation and escape; preallocation; pooling; N+1; O(n²); chatty I/O; pagination; cache correctness; payloads; blocking calls; recomputation | "Does the change add allocation/GC pressure, or I/O and algorithmic cost, on a path that runs often enough for it to matter?" | 311-354 |
| concurrency-async | core | always | races; lock order/nesting; over-synchronization; lock across I/O; sync-over-async; cancellation; unawaited promises (swallowed exceptions); unbounded parallelism; ordering; leaks on cancel | "Does the change introduce a race, deadlock, or async-runtime failure mode" | 356-404 |
| regression | core, rounds ≥ 2 only | a prior report is supplied | fix-introduced defects; claimed-but-absent fixes; contradictions; scope creep | "The prior round's fixes are themselves the change under review." | 141-167 |
| data-migrations | conditional | "schema/migration files touched, or model/entity changes" | expand/contract; locking DDL; transactions; lost updates; irreversible migrations; dual writes; data loss; PII | "Does a schema or persistence change preserve backward compatibility, transactional integrity, and recoverability" | 406-431 |
| deploy-safety | conditional | "CI/deploy/infra files touched, or a behavior change gated by a flag" | flags / kill switch; version skew; config readiness; rollback coupling; deploy ordering | "Can this ship and roll back safely in a live, partially-deployed fleet" | 433-453 |
| api-contract | conditional | "exported/public API surface changed, or a wire format ... changed" | breaking signatures and fields; **leaky abstraction**; ergonomics; REST verbs and idempotency; **inconsistent error contract**; over-broad surface | "Does the change preserve the consumer-facing contract — signatures, error shapes, versioning" | 455-479 |
| observability | conditional | "new failure paths introduced, or logging/metrics/tracing changed" | **silent failure**; PII in logs; cardinality; **log-level misuse**; trace propagation; unstructured logs; alert hooks | "If this change breaks in production, will the team know" | 481-501 |
| testing | conditional | "production code changed with no corresponding test changes, or the diff is test-heavy" | risky-path coverage; behavior assertions; flakiness; over-mocking; pyramid level; missing tests; mutation-worthiness; copy-pasted setup; weakened or skipped tests | "Does test coverage track actual risk" | 503-533 |
| dependency | conditional | "lockfile or manifest changes" | duplicated capability; maintenance; CVEs; license; transitive weight; pinning | "Is a new or changed third-party dependency justified, maintained, compatibly licensed, and pinned?" | 535-554 |
| hygiene-docs | conditional | "docs/README changes, or the diff mixes unrelated concerns" | bundled refactors; PR size; commit messages; docs/ADR gaps; uncommented invariants; cost; PII retention; a11y/i18n | "Is the PR a single reviewable unit, and does it keep docs/decisions/cost/privacy/a11y/i18n current" | 556-587 |

`assemble-args` produced 13 PR scout prompts in round 1, with core `correctness, security, premortem,
simplicity-design, hot-path-perf, concurrency-async` (verified by running it). A PR round therefore
dispatches 6–13 scouts in round 1, or 7–14 once `regression` joins.

### Design lenses (`scout-prompts-design.md`)

Inputs: the spec path, caller context (`[REQUIREMENTS / EPIC]`, filled by `--context`), WebSearch and
WebFetch, and the prior report (`scout-prompts-design.md:24-45`, `assemble-args.mjs:196-199`). Model: opus.

| Lens | Core / conditional | Activation | Brief (verbatim) | Lines |
|---|---|---|---|---|
| premortem | core | always | "Assume this shipped and failed badly in a month. Write the failure stories." | 143-147 |
| completeness | core | always | "Missing requirements, undefined interfaces, missing non-functional requirements, unhandled error/edge cases, integration points not covered." | 149-154 |
| yagni | core | always | "Over-engineering, unjustified complexity, speculative generality." | 156-160 |
| failure-mode | core | always | "Assume each component/dependency fails — trace the blast radius." | 162-166 |
| feasibility | core | always | "\"What must be true for this to work?\" — surface every load-bearing assumption." | 168-172 |
| security, maintainer | widen | only when triage names zero domains | "As warranted for a security or maintainability review of this spec." | 174-179 |
| regression | core, rounds ≥ 2 | a prior report is supplied | contradictions, ownership collisions, scope creep, claimed-but-absent | 181-206 |
| `domain:<name>` | 0–3 | triage domains (recall-leaning) | "You are a {{DOMAIN}} expert. FIRST use web search to pull the typical failure modes" | 208-222 |

### Severity mechanics

- There is one vocabulary: Blocking, Should-fix, Nit, FYI (`SKILL.md:136-139`). The dedupe stage and the
  judges share one definition, "Should-fix: significant risk or rework" (`dedupe-prompt.md:40-46`,
  `judge-seat-prompts.md:70-75`).
- Scouts never assign severity and never write the words (`scout-prompts-pr.md:55-62`). Dedupe *suggests*
  a severity, which only routes verification depth (`dedupe-prompt.md:48-50`). Judges rate blind:
  `suggestedSeverity`, `previouslyRejected` and `lanes` are stripped (`super-roast-workflow.md:392-394`).
  The reporter starts from the confirming seats' severities (`reporter-prompt.md:125`).
- The profile is visible only to the reporter (`2026-07-29-super-roast-design.md:115-117`). It "moves the
  Should-fix ↔ Nit boundary, and down-weights resilience/observability/cost findings for low-blast-radius
  projects", and each demotion needs a one-line profile fact (`reporter-prompt.md:125-131`).
- Floors (Blocking under any profile) cover exploitable security, data loss, and "Violation of the
  artifact's own stated core purpose" (`SKILL.md:141-154`, `reporter-prompt.md:132-142`). A pre-existing
  defect is confirmed at FYI and the engine enforces it (`reporter-prompt.md:120-123`,
  `super-roast-workflow.md:585-599`).
- Materiality: "Material means material against the spec's stated requirements, contract, and scope — not
  against an imagined stricter system" (`judge-seat-prompts.md:35-40`). In PR mode, "Stated requirements"
  include "the repository's own conventions and the change's stated intent" (`judge-seat-prompts.md:146-150`).
- The rounds ≥ 2 materiality bar differs by mode: PR mode keeps only findings "materially affecting
  correctness, security, or the change's stated purpose" (`scout-prompts-pr.md:129-139`), while design mode
  also keeps "rework an implementer would otherwise hit" (`scout-prompts-design.md:130-141`).
- Downstream: the super-auto phase-5 scope filter punch-lists "a quality improvement to goal-named code
  (style, structure, naming, extra hardening)" (`skills/super-auto/scope-filter-prompt.md:29-38`).
  super-design's converged exit sends the remaining sub-Blocking findings to a punch list
  (`skills/super-design/SKILL.md:581-590`).

### Judges

The seats are reproduce, refute and ground, with votes positional in that order. A severe finding gets
all three in parallel. A Nit/FYI gets refute only, and that spot check is promoted to a full panel on a
severe CONFIRM, reusing its vote as the refute seat (`super-roast-workflow.md:414-427`). Default routes are
computed by the engine: 2+ CONFIRM is confirmed, 2+ REJECT is rejected, and everything else escalates
(`super-roast-workflow.md:435-452`). Refute checks: (a) present under another name, (b) within the stated
contract, (c) out of stated scope, (d) immaterial, plus in PR mode (e) pre-existing and (f) linter
territory (`judge-seat-prompts.md:106-125, 152-161`).

### Dedup and caps

The deduper returns id groups, "same location AND the same root claim", and nothing else
(`dedupe-prompt.md:34-38`). The engine merges each group: `category` is the first member's, `lanes` the
union, evidence and locations the union (`super-roast-workflow.md:331-349`). Unclaimed ids are kept as
last-ranked Nits (`super-roast-workflow.md:367-373`). Severe findings are uncapped unless the caller sets
`config.panelCap`. The Nit/FYI tail is capped at `remainderCap` (default 50) and the overflow survives
only as a count (`super-roast-workflow.md:377-390`, `SKILL.md:86-97`).

### Engine versus data

Lane rosters and prompt text are data. `assemble-args` discovers every `## Lane: <name>` section
(`assemble-args.mjs:183-190`). It parses the core lanes from the triage sentence "Core lanes (...) always
run" (`assemble-args.mjs:157`) and the design lens lists from `SKILL.md` (`assemble-args.mjs:158-159`).
The engine builds triage's lane enum from the conditional keys of `prompts.scouts`
(`super-roast-workflow.md:190-194, 292-299`). The dryRun policy says "Data edits skip it — lane rosters,
prompt wording, caps, model tiers" (`super-roast-workflow.md:669-673`).

## Findings

**A4-F01 — observed.** The PR roster is 6 always-on lanes plus 7 triage-activated ones, and `regression`
is appended on rounds ≥ 2. The design roster is 5 core lenses, plus `security` and `maintainer` only when
triage names no domain, plus up to 3 domain scouts. Citations: `triage-prompt.md:32-44`,
`scout-prompts-pr.md:5-8, 163-167`, `SKILL.md:119-125`, `super-roast-workflow.md:306-319`, and the
`assemble-args` stderr roster line. *Implication (b):* in PR mode, design quality has exactly one
always-on owner (F02). In design mode it has none (F05).

**A4-F02 — observed.** `simplicity-design` is the only core PR lane that owns OOP and design quality.
Hunt items: "Single-responsibility violation: a class/function serving two distinct reasons to change"
(`:275-276`), "Structural testability: hidden construction (`new`d-up dependencies instead of injected
ones)" (`:277-278`), "Implementation/exposure at the wrong abstraction level" (`:282-285`), shallow
modules, information leakage, pass-through and over-engineering (`:286-295`). The lane's framing came
from the user's own priorities, not from the vendored taxonomy (`scout-prompts-pr.md:259-264`; commit
9bb2f36). Its pragmatism filter limits reporting: "Single-responsibility violations and
structural-testability smells matter most on logic that's actually risky or already under test; on a
trivial, stable helper they are rarely worth a finding" and "don't block on subjective architectural
taste" (`scout-prompts-pr.md:299-308`). *Implication (b):* this block is the existing attachment point
for review-time OOP rules, and editing its text is a data-only change.

**A4-F03 — observed.** Ownership and overlaps for the concerns in question 2:

- **Error handling** is split four ways. correctness owns "errors dropped (`catch {}`…)" and "swallowed
  exceptions, logged-but-continued" (`:177-178`). concurrency-async owns "fire-and-forget without error
  capture — swallowed exceptions" (`:386-387`). The conditional api-contract lane owns "Inconsistent
  error contract" (`:471-472`), and the conditional observability lane owns "New failure path with no
  log/metric" (`:488`).
- **Resource cleanup** is duplicated across two core lanes. premortem has items 5 and 10 (`:239-246`),
  and concurrency-async has item 13, "timers/listeners never cleaned up" (`:392`).
- **Logging** belongs to observability, which is conditional: "new failure paths introduced, or
  logging/metrics/tracing changed" (`triage-prompt.md:40`; `:481-501`). Secrets-in-logs belongs to
  security (`:204`).
- **API and interface quality** belongs to api-contract (conditional) plus simplicity-design items 5–8,
  and the two overlap. api-contract's "Leaky abstraction: returns an ORM entity" (`:466`) sits next to
  simplicity-design's "public method exposing state that properly belongs to a different object"
  (`:284-285`). Its "Over-broad public surface" (`:473`) sits next to simplicity's speculative
  generality (`:293-295`).
- **Testability** is split between simplicity-design items 3–4 (core) and the testing lane (conditional).

*Implication (b):* only dedupe matching resolves these overlaps (F14). A new design lane would add a
third claimant to the same root claims.

**A4-F04 — gap.** No lane hunts copy-pasted production logic, identifier naming, dead code, or
long-function complexity. Duplication appears only as information leakage (`:289-290`), a
"reimplemented" primitive (`:296-297`), test-setup copy-paste (`:520-521`), and duplicated dependency
capability (`:551`). The taxonomy deliberately left these unscouted: "Readability (J) is largely
linter/formatter territory — automate it, don't spend scout budget on it" (`pr-review-taxonomy.md:292`).
§J item 5 is "Duplication that should be abstracted" (`:188`). The lane's original explicit item, "5.
Encapsulation breaks: internal state or an implementation type (e.g. an ORM entity) exposed instead of a
narrow domain interface", was removed in commit 9bb2f36. Its ORM half survives only in the conditional
api-contract lane. Searched with grep over `scout-prompts-pr.md`, `git show 9bb2f36`, and the taxonomy.
*Implication (b):* duplication and encapsulation are the clearest unowned OOP failure classes.

**A4-F05 — observed.** Design-mode maintainability coverage is one generic line, "As warranted for a
security or maintainability review of this spec" (`scout-prompts-design.md:174-179`). It runs only when
triage names zero domains: "Non-empty domains never trigger widening" (`SKILL.md:124`), and triage is told
"Only output `none` when the design is genuinely generic" (`triage-prompt.md:25-26`). Both recorded
2026-10-01 design rounds named 3 domains, so `maintainer` did not run (`…-roast-design-1.md:5`,
`…-roast-design-2.md:6`). Whether it ran in the 2026-09-04 rounds cannot be determined, because their
coverage lines give only counts ("7 lenses ran", `2026-09-04-…-roast-design-1.md:5`). Interfaces appear
only inside completeness ("undefined interfaces", `:152`), and over-engineering inside yagni (`:158`).
*Implication (a):* the design-time review has no dedicated abstraction or interface-modeling lens, and the
recall-leaning domain triage structurally suppresses the one maintainability lens that exists.

**A4-F06 — observed.** PR triage sees only `git diff --name-status` plus `--shortstat`, or a
caller-supplied `--diff-stat` (`assemble-args.mjs:138-148`; `triage-prompt.md:16`). It gets no hunks, no
PR description and no profile (the profile is reporter-only, `2026-07-29-super-roast-design.md:115-117`).
The prompt leans to recall: "On doubt, activate — a missed lane is a silent gap; an extra lane is one
wasted scout" (`triage-prompt.md:46`; spec `:63-66`). The lane enum is built from the supplied prompts, so
an invented lane is retried by the schema and an unknown one is logged rather than fatal
(`super-roast-workflow.md:190-194, 313-317`). In practice triage activated 5 of 7 conditional lanes on a
markdown-plus-bash diff (`…-roast-pr-1.md:5`). *Implication (b):* a conditional OOP lane can only key on
paths, extensions, A/M/D/R status and total churn. It could catch "new source files added", but not "new
public types or interfaces", which needs hunk content.

**A4-F07 — observed for the formula, inference for the totals (computed from the coverage lines).** The
marginal cost of a lane is 1 opus scout per round, but the judge calls its findings draw dominate. In the
recorded runs:

- PR round 1: 11 scouts → 59 raw → 47 deduped → 17 panels and 30 spot checks, about 81 seat calls and
  about 95 agents (`…-roast-pr-1.md:5`).
- Design round 1: 8 scouts → 152 raw → 64 deduped → 31 panels and 33 spot checks, about 126 seat calls
  (`…-roast-design-1.md:5`).
- Planted-defect PR: 8 scouts → 65 raw → 32 deduped (`2026-07-30-planted-defect-branch-roast-1.md:6`).

*Implication:* the cost of a design lane depends on how dedupe grades its findings. About 5 raw findings
per PR scout, each severe one costing 3 sonnet seats.

**A4-F08 — observed.** How a design-quality finding is graded:

- It maps to Should-fix ("significant risk or rework") or Nit ("real but low-impact")
  (`dedupe-prompt.md:42-46`, `judge-seat-prompts.md:70-75`).
- No floor applies unless it violates the artifact's stated core purpose (`SKILL.md:141-151`), and the
  reporter cannot apply that floor because it "never receives the artifact or its stated purpose"
  (accepted as deferred, `super-roast-workflow.md:968`).
- Design quality is not on the profile's down-weight list (resilience, observability, cost;
  `reporter-prompt.md:126-128`). The profile can still move it across the Should-fix ↔ Nit boundary.
- The taxonomy's rule "Label Nit and never block on personal style" (`pr-review-taxonomy.md:193`) became
  reporting guidance only (`scout-prompts-pr.md:307-308`). No severity ceiling exists per lane or per
  category.

*Implication (b):* severity for OOP findings is set by judge judgement plus the profile, with no explicit
rubric.

**A4-F09 — observed.** Severity inflation is held back by stacked layers:

1. Scouts are barred from severity words (`scout-prompts-pr.md:55-62`).
2. Judges rate blind (`super-roast-workflow.md:392-394`).
3. The materiality definition (`judge-seat-prompts.md:35-40`) was the eval-validated lever "cited by every
   trap rejection" (`eval-record.md:38-42`); commit 5cc7574 restored its wording.
4. Refute check (d) asks whether it "change[s] any outcome the stated requirements care about"
   (`judge-seat-prompts.md:120-121`), and check (f) rejects linter territory (`:159-161`).
5. Profile demotion needs a cited profile fact (`reporter-prompt.md:128-131`).
6. Pre-existing defects drop to FYI (`super-roast-workflow.md:585-599`).

*Implication (b):* the same layers that stop inflation also suppress real design findings unless they are
anchored to a stated requirement or convention (F12, F19).

**A4-F10 — observed.** Late-round recall policy differs by mode. On PR rounds ≥ 2 scouts keep a finding
only if it is "materially affecting correctness, security, or the change's stated purpose — not a
could-be-slightly-better observation" (`scout-prompts-pr.md:135-136`). Design rounds ≥ 2 also keep "rework
an implementer would otherwise hit" (`scout-prompts-design.md:136-138`). *Implication (b):* PR re-roasts
filter out maintainability findings by construction. Design re-roasts can keep them as rework.

**A4-F11 — observed.** Downstream consumers demote design-quality findings further.

- The super-auto phase-5 scope filter: "Blocking findings are always in-scope"
  (`scope-filter-prompt.md:25`). Everything else goes to `punch-list` when it "is a quality improvement to
  goal-named code (style, structure, naming, extra hardening) that does not change whether that code is
  correct" (`:33-35`). The recorded filter punch-listed only a process/eval gap and two pre-existing
  findings (`scope-filter-round-1.json:1`).
- super-code: "detailed code review is `super-roast`'s job (PR mode), not this skill's"
  (`skills/super-code/SKILL.md:90-91`).
- super-design: confirmed findings become "One task per finding" (`skills/super-design/SKILL.md:546`), and
  the converged exit sends sub-Blocking findings to a punch list (`:581-590`).

*Implication (b):* in autonomous code runs a confirmed Should-fix structural finding is punch-listed
unless the goal names it. The roast is the only detailed code-review stage, so in practice nothing
enforces OOP quality at code time.

**A4-F12 — gap, with a recorded outcome.** The reproduce seat defines procedures only for GAP and
UNVERIFIED-ASSUMPTION: "walk the concrete failure story … until it contradicts a **stated requirement**"
and "a mechanism that 'can happen' but never contradicts anything the spec promises is not a completed
demonstration" (`judge-seat-prompts.md:96-103`). PR findings are always `ISSUE`
(`scout-prompts-pr.md:87-88`), and the PR adjustments only redefine "spec" as the diff, its intent and
the repo (`judge-seat-prompts.md:146-150`). No ISSUE-specific reproduce procedure exists. Inference: for a
non-executable maintainability claim, "reproduce" means a change-scenario story that ends in a
contradiction with a repo convention or stated intent; otherwise the seat rejects. Recorded case: the SRP
finding "runOnce carries four responsibilities" was rejected because "no stated contract or existing test
scaffolding demands the decomposition" (`2026-07-30-planted-defect-branch-roast-1.md:45`). *Implication
(b):* the seats can only confirm OOP findings that are measured against a written rule.

**A4-F13 — observed.** Panel sizes are 3 seats per severe finding, 1 per Nit/FYI, and +2 per promotion
(`super-roast-workflow.md:416-427`). Recorded seat-agreement lines:

| Round | Panels | rr | rg | fg | Unanimous | Per-seat C/R/U (reproduce · refute · ground) | Source |
|---|---|---|---|---|---|---|---|
| PR r1 | 17 | 0.76 | 0.82 | 0.82 | 0.71 | 14/3/0 · 10/7/0 · 13/4/0 | `…-roast-pr-1.md:7` |
| PR r2 | 3 | 1.00 | 1.00 | 1.00 | 1.00 | 2/1/0 · 2/1/0 · 2/1/0 | `…-roast-pr-2.md:8` |
| Design r1 | 31 | 0.77 | 0.81 | 0.65 | 0.61 | 11/20/0 · 4/27/0 · 15/16/0 | `…-roast-design-1.md:7` |
| Design r2 | 11 | 0.82 | 0.55 | 0.36 | 0.36 | 5/6/0 · 3/8/0 · 10/1/0 | `…-roast-design-2.md:8` |

Refute rejects most often and ground is the most permissive seat. The only seat eval used one design
fixture with 4 findings, "not a calibrated benchmark" (`eval-record.md:44-49`). *Gap:* no eval covers
seats on maintainability or OOP claims, and no agreement figure is broken down by lane.

**A4-F14 — observed.** Dedupe ignores lanes. It groups by "same location AND the same root claim"
(`dedupe-prompt.md:35-37`). A merged finding takes `category: members[0].category` and
`lanes: uniq(...)` (`super-roast-workflow.md:340-341`). Ranking puts "Blocking/Should-fix groups first,
then the Nit/FYI groups ordered by importance, correctness and risk" (`dedupe-prompt.md:53-56`). Caps:
severe findings are uncapped by default, and the Nit/FYI tail is capped at 50 (`super-roast-workflow.md:381-388`).
No rule says which lane owns a root claim. Recorded: the planted-defect run's panel cap left 8 severe
candidates unverified. They included the DI/testability, `util.parseArgs` and zero-tests findings
(`2026-07-30-planted-defect-branch-roast-1.md:31-39`). Inference: dedupe ranked these design-quality
candidates below correctness ones. *Implication (b):* when a panel cap is set, design findings are the
first to go unverified.

**A4-F15 — gap.** Lane attribution never reaches the report or the return value. Packets carry `lanes`
for the reporter (`reporter-prompt.md:46-50`), but the entry template is `- [SEV] <location> — <claim>`
(`:233`). The engine returns `coverage`, `routeCounts` and `fixRegressions` only
(`super-roast-workflow.md:638-647`). The taxonomy advises "Track a per-category usefulness /
false-positive rate and tune or retire noisy scouts" (`pr-review-taxonomy.md:310`). *Implication (b):*
the precision of `simplicity-design`, or of any new OOP lane, cannot be measured from recorded reports.
Per-lane counts would need an engine change (the coverage object, `super-roast-workflow.md:492-504`).

**A4-F16 — observed.** Adding a lane is a data change.

- Conditional lane: add a `## Lane: <name>` block with a fenced brief to `scout-prompts-pr.md` (it is
  discovered automatically) and an activation bullet to `triage-prompt.md:36-44`.
- Core lane: also add the name to the sentence at `triage-prompt.md:32-33`.
- Design lens: add a `## Lens:` block and put its name in the `SKILL.md:119-122` config lists.
- Tests that change: `tests/super-roast/test-assemble-args.sh:28` (`"13"` prompt count, for any PR lane),
  `:27` (the core list, if the lane is core), and `:44` (the design rosters).
- Prose counts that drift: `super-roast-workflow.md:15` ("6–13 PR"), `scout-prompts-pr.md:7` ("remaining
  7"), and spec `:37, :218`.
- Precedent: `regression` was added as "pure config/prompt data, no engine edit"
  (`scout-prompts-pr.md:166-167`).
- Behaviour that depends on the lane is structural, not data. Routing uses only `suggestedSeverity`. Lanes
  feed only `isFixRegression` (`super-roast-workflow.md:383-398`). Seat names are hard-coded (`:418`). The
  model is shared by all scouts (`:246, 286`). Per-lane severity caps, panels or models therefore need an
  engine edit plus a dryRun.

**A4-F17 — observed.** The canonical PR dryRun asserts "**22 agents total**" (15 seat calls), the
dead-reporter variant 23, and the unsettled-panel variant 22 (`super-roast-workflow.md:728-755`). The mock
"empty raw" case has 6 agents (`:774`). Every recorded passing baseline is marked superseded, "a fresh run
against the assertions above is owed" (`:789, 819, 881, 941-943`). The release checklist requires the
dryRun when the engine changes (`CLAUDE.md:130`). *Implication:* any change that touches the engine
inherits a dryRun re-baseline that is already owed.

**A4-F18 — observed per item; the pattern is inference.** Past roasts did raise design-quality findings:

- Planted-defect PR: the SRP finding was **rejected** (`:45`). The hard-required DB client instead of an
  injected one (`:38`), the hand-rolled parser where `util.parseArgs` would do (`:35`), and "no stop path
  … structurally untestable" (`:33`) went **unverified beyond the panel cap**. "Five internals exported …
  speculative library surface" (`:54`) and the "whole CLI args bag … leaking flag names" (`:55`) were
  **spot-checked nits**. The swallow-all catch was **escalated 0/3** (`:63`), and the write-only cache
  **escalated** on a dead seat (`:60`).
- Prompting-guide PR r1: duplicated stallable-phase list, **spot CONFIRM Nit** (`:91`). Three regex copies,
  REJECT, "differences are deliberate per input" (`:103`). Coupling, hard-coded names and call order, all
  REJECT (`:107-110`).
- Prompting-guide design r1: "two homes for one rule" and "synced duplicate" were **confirmed Nit**
  (`:40-49`). Design r2 rejected the table-duplication claim 3-0 (`:51`).
- Audit-plan design: the interface-contract findings were **confirmed** at Nit (`…-1.md:39-42`) and
  Should-fix (`…-2.md:20-23`).

Pattern: OOP and maintainability findings end up as Nit or FYI, get rejected on materiality, or are lost
to caps. Interface findings are confirmed when a written contract exists to contradict.

**A4-F19 — gap.** A PR-mode roast receives no design-time contracts. Scout inputs are the diff, the repo,
the PR description and comments, and the prior report (`scout-prompts-pr.md:24-28`). `--context` is
"design mode: caller context the spec must satisfy" (`assemble-args.mjs:20`), used only in the design
branch (`:199`). super-auto's phase 4 passes no spec or bead contracts (`skills/super-auto/SKILL.md:164`),
even though super-design records `owns:`/`consumes:` and `boundary contract:` lines
(`skills/super-design/SKILL.md:209-221, 502`). Inference, from F12 and F18: contract-first interface beads
would give PR judges a "stated requirement" to confirm against, but only if a PR-mode context slot
carried them.

**A4-F20 — observed (document drift).** The spec says "The ≥2-of-3 confirm arithmetic is not in the
engine" (`2026-07-29-super-roast-design.md:192-194`), but the engine now computes `defaultRoute`
(`super-roast-workflow.md:435-452`; commit 62b7e78). The spec defers to the prompt files (`:135-136`).
*Implication:* cite the workflow doc, not the spec, for the engine-versus-data split.

## Extension points

- **Data-only changes (no dryRun; `test-assemble-args.sh` counts may change):**
  - Rewrite the `simplicity-design` brief (`scout-prompts-pr.md:266-309`): add duplication and
    encapsulation hunts, or contract-conformance hunts.
  - Add a `## Lane: <name>` block plus a triage bullet (`triage-prompt.md:36-44`), or a core entry at
    `:32-33`.
  - Replace the one-line `maintainer` lens, or promote a design lens into `config.coreLenses`
    (`scout-prompts-design.md:174-179`, `SKILL.md:119-122`).
  - Extend the reporter's Step 2 profile rules (`reporter-prompt.md:119-142`).
  - Outside super-roast: change the scope-filter test (`skills/super-auto/scope-filter-prompt.md:29-38`).
- **Script change (not the engine):** add a PR-mode context slot, for example letting `--context` carry
  bead `owns:`/`consumes:` contracts into the scout preamble and the seats' "stated requirements"
  (`assemble-args.mjs:20, 180-199`; `judge-seat-prompts.md:146-150`).
- **Engine changes (structural; dryRun and mock harness required):** per-lane routing, severity caps or
  models; lane attribution in report entries or the coverage object (`super-roast-workflow.md:492-504,
  556`); and any new or ISSUE-specific seat (seat names are hard-coded at `:418`, votes positional at
  `:414-415, 467-478`).
- **Must stay untouched:**
  - the severity vocabulary and the verbatim floors (`SKILL.md:136-154`);
  - blind judging and three distinct seats (`SKILL.md:167, 266-267`);
  - the eval-validated materiality wording (`judge-seat-prompts.md:35-40`; commit 5cc7574);
  - the scouts' no-severity rule (`scout-prompts-pr.md:55-62`);
  - the report headings and the literal `confirmed` verdict grammar that callers parse
    (`reporter-prompt.md:179-185, 209-211`);
  - the never-silently-dropped caps (`SKILL.md:235-240`);
  - the iteration cap and `[converged]` semantics (`SKILL.md:102-111, 284-286`);
  - "Blocking always in-scope" in the scope filter (`scope-filter-prompt.md:25`).

## Constraints and costs

- **Tests.** `tests/super-roast/test-assemble-args.sh` hard-codes the core list (`:27`), the 13 prompts
  (`:28`) and the design rosters (`:44`). It also runs the `pr-r1`, `pr-r2`, `pr-r2-empty` and `design-r1`
  mock-engine scenarios (`:79-83`; `engine-mock.mjs:56-100`). It is on the release checklist
  (`CLAUDE.md:124`). It passed in this audit.
- **dryRun.** The canonical PR run is 22 agents, the dead-reporter variant 23, the unsettled variant 22,
  and empty raw 6 (`super-roast-workflow.md:728-775`). The baselines are superseded and owed (F17).
  `CLAUDE.md:130` requires the dryRun on engine change.
- **Costs and caps.** Scouts run on opus, judges and triage on sonnet, dedupe and reporter on fable
  (`SKILL.md:250-258`). Caps: `remainderCap` 50, optional `panelCap`, `iterationCap` 3, at most 3 domains
  (`super-roast-workflow.md:306-308, 381-382`; `assemble-args.mjs:161-167`). Per-lane cost is in F07.
- **Policy.**
  - Skill content changes need before/after eval evidence (`CLAUDE.md:93-100`).
  - Lane pragmatism filters are a "recall guide, not a grading rubric" (`scout-prompts-pr.md:56-57`), in
    line with the "avoid overconstraining" memo.
  - Provenance notes live in the prompt files, not in SKILL.md ("SKILL.md carries no history").
  - Unknown lanes and dead scouts degrade to logged coverage loss, never a stop
    (`super-roast-workflow.md:313-317`; `SKILL.md:133-134`).
  - The taxonomy warns that §J is "Most prone to **nit-flooding**" (`pr-review-taxonomy.md:193`), and
    that 8 findings on a 24-line PR "is *itself* a failure mode" (`:312`).

## Open questions

1. What precision and false-positive rate does `simplicity-design` have? Lane attribution is not
   recorded (F15).
2. Has the `maintainer` lens ever run live? The 2026-09-04 coverage lines omit lens names (F05).
3. How do seats behave on ISSUE-kind maintainability claims? No fixture or eval exists (F12, F13).
4. Do punch-listed design findings ever get fixed? Nothing after `run.md` tracks them.
5. What is the per-lane cost in tokens rather than dispatch counts? None is recorded, and an earlier roast
   called the "judges dominate" premise unmeasured (`2026-07-30-depth-cap-spec-roast-1.md:104-107`).
6. Does dedupe ranking systematically put design findings below correctness ones? Only one panel-capped PR
   run exists (F14).
