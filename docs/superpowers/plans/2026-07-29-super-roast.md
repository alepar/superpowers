# super-roast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `skills/super-roast/` — a dual-mode (design/PR) adversarial review skill per `docs/superpowers/specs/2026-07-29-super-roast-design.md` — validate it, then replace `skills/roast/`.

**Architecture:** A stable Workflow-script **engine** (stages, tiered judge routing, aggregation, coverage gating) with all fast-changing content flowing in as **data** (prompt files + args). Pipeline: pre-flight (inline) → triage (sonnet) → scouts (opus) → dedupe (fable) → seat-differentiated judges (sonnet) → reporter (fable) → super-plan handoff.

**Tech Stack:** Markdown skill files; Workflow-tool JavaScript script (no TypeScript, no I/O in script); subagent fan-out fallback; `gh` CLI (optional PR-mode path only).

## Global Constraints

- Severity vocabulary everywhere: `Blocking | Should-fix | Nit | FYI`. Never emit `blocker/major/minor` or `BLOCK/REVISE/PASS`.
- Models: triage `sonnet`, scouts `opus`, dedupe `fable`, judges `sonnet`, reporter `fable`; dryRun stubs `haiku`.
- Caps: dedupe keeps ALL Blocking/Should-fix candidates, remainder capped at 50 (configurable via `config.remainderCap`); iteration cap 3; failed judge re-dispatched exactly once.
- The Workflow script does **no I/O** — reading files, web, and report-writing happen in agents or the orchestrating session. Prompt file contents are rendered into the script's `args.prompts` by the orchestrator at invocation time.
- Prompt files are harness-neutral (dispatchable via Task tool verbatim) — no Workflow-tool-specific syntax inside prompts.
- super-roast is report-only. It never edits the artifact, never creates tasks.
- Zero new dependencies. `gh` is used only when the user supplies a PR number and `gh` exists; otherwise PR mode uses pure git.
- Preserve the same-family honesty caveat in SKILL.md, workflow doc, and report template: seats reduce error correlation, they are not family-level independence (`independence: same-family (Claude) — seat-differentiated panel`).
- Severity floors (verbatim list, used in Task 6 and SKILL.md): confirmed injection / authZ bypass / secrets-in-code on a network-exposed surface; data-loss or irreversible-migration risk on real data; violation of the artifact's own stated core purpose → **Blocking under any profile**.
- Source artifacts: validated seat prompts `~/Documents/Super-Roast_Design_Research_20260728/judge-seat-prompts-validated.md`; eval record `.../judge-seats-eval.md`; PR taxonomy `~/Downloads/super-review.md`; eval fixture `/private/tmp/claude-501/-Users-alepar-AleCode-superpowers/47038c17-f0dd-47c6-8516-79df0589c386/scratchpad/judge-fixture/webhook-dispatch-design.md` (copy into repo in Task 2 — the scratchpad is session-scoped and will vanish).

---

### Task 1: Workflow engine (`super-roast-workflow.md`) + dryRun validation

**Files:**
- Create: `skills/super-roast/super-roast-workflow.md`

**Interfaces:**
- Produces: the engine script contract consumed by SKILL.md (Task 7). **`args` must be pure
  JSON — every prompt is a STRING, never a function** (the Workflow tool rejects non-JSON
  args). Prompts that need runtime data carry placeholder tokens the script substitutes:
  `{{FINDINGS_JSON}}` (dedupe), `{{FINDING_JSON}}` (seats), `{{PACKETS_JSON}}`, `{{PROFILE}}`,
  `{{PRIOR_REPORT}}` (reporter).
  `args = { mode: 'design'|'pr', inputsDescription: string, profile: string, priorReport: string ('' on iteration 1), dryRun: boolean, prompts: {triage: string, scouts: {<name>: string}, dedupe: string, seats: {reproduce: string, refute: string, ground: string}, reporter: string, stubs: {<key>: string}}, config: {remainderCap: 50, models: {triage:'sonnet', scout:'opus', dedupe:'fable', judge:'sonnet', reporter:'fable'}, coreLanes: [...], coreLenses: [...]} }`
- Produces: return shape `{ verdict, reportMarkdown, coverage: {scoutsDispatched, scoutsDead, rawFindings, dedupedFindings, beyondCap, panelCount, spotCount, promotedCount, judgeCompletionPct} }`. The orchestrator writes `reportMarkdown` to the report path and invokes super-plan.

- [ ] **Step 1: Write the doc.** Sections: (1) pipeline reference (compressed restatement of spec §Pipeline — link the spec, don't duplicate rationale); (2) capability ladder (Workflow → subagent fan-out sequence → inline degraded with `independence: none (inline)` label); (3) key constraints (script does no I/O; prompts rendered by orchestrator; agents can't nest deep-research); (4) **engine script** (below); (5) dryRun policy (below); (6) stub table.

Engine script to embed (the canonical, tested version — adjust only if dryRun reveals defects, and record any change in the doc):

```javascript
export const meta = {
  name: 'super-roast',
  description: 'Adversarial dual-mode review: scouts find, dedupe consolidates, seat-differentiated judges verify, reporter issues final verdicts',
  phases: [{ title: 'Triage' }, { title: 'Scout' }, { title: 'Dedupe' }, { title: 'Judge' }, { title: 'Report' }],
}

const SEVERE = ['Blocking', 'Should-fix']
const SEV = ['Blocking', 'Should-fix', 'Nit', 'FYI']
const LANES = { type:'object', properties:{ lanes:{ type:'array', items:{ type:'string' } }, domains:{ type:'array', items:{ type:'string' } } }, required:['lanes','domains'] }
const FINDINGS = { type:'object', properties:{ findings:{ type:'array', items:{ type:'object', properties:{
  claim:{type:'string'}, location:{type:'string'}, category:{type:'string'}, external:{type:'boolean'},
  kind:{enum:['GAP','UNVERIFIED-ASSUMPTION','ISSUE']}, evidence:{type:'string'}, spike:{type:'string'}
  }, required:['claim','location','category','external','evidence'] } } }, required:['findings'] }
const DEDUPED = { type:'object', properties:{ findings:{ type:'array', items:{ type:'object', properties:{
  claim:{type:'string'}, location:{type:'string'}, category:{type:'string'}, external:{type:'boolean'},
  kind:{enum:['GAP','UNVERIFIED-ASSUMPTION','ISSUE']}, evidence:{type:'string'}, spike:{type:'string'},
  suggestedSeverity:{enum:SEV}
  }, required:['claim','location','category','external','evidence','suggestedSeverity'] } },
  beyondCapCount:{type:'integer'} }, required:['findings','beyondCapCount'] }
// verdict + severity + evidence all REQUIRED so a missing field can't slide to clean.
const VERDICT = { type:'object', properties:{ verdict:{enum:['CONFIRM','REJECT','UNVERIFIED']}, severity:{enum:SEV}, evidence:{type:'string'} }, required:['verdict','severity','evidence'] }
const REPORT = { type:'object', properties:{ verdict:{type:'string'}, reportMarkdown:{type:'string'}, confirmedCount:{type:'integer'}, escalations:{type:'array', items:{type:'string'}} }, required:['verdict','reportMarkdown','confirmedCount','escalations'] }

const { mode, profile, priorReport = '', dryRun = false, prompts, config } = args
const model = role => dryRun ? 'haiku' : config.models[role]
const pick = (real, stubKey) => dryRun ? prompts.stubs[stubKey] : real

// Triage — design: domains for expert critics; PR: conditional-lane activation (recall-leaning).
const triage = await agent(pick(prompts.triage, 'triage'), { label:'triage', phase:'Triage', model:model('triage'), schema:LANES })
const scoutNames = mode === 'design'
  ? [...config.coreLenses, ...(triage?.domains ?? []).slice(0, 3).map(d => `domain:${d}`)]
  : [...new Set([...config.coreLanes, ...(triage?.lanes ?? [])])]

// Scouts — parallel, high-recall. Nulls are counted (coverage), then filtered.
const scoutResults = await parallel(scoutNames.map(name => () =>
  agent(pick(prompts.scouts[name], `scout:${name}`), { label:`scout:${name}`, phase:'Scout', model:model('scout'), schema:FINDINGS })))
const scoutsDead = scoutResults.filter(r => !r).length
const raw = scoutResults.filter(Boolean).flatMap(r => r.findings ?? [])

// Dedupe — merge + suggested severity; keeps ALL severe, caps remainder (agent applies config.remainderCap from its prompt).
const dd = await agent(pick(prompts.dedupe(JSON.stringify(raw)), 'dedupe'), { label:'dedupe', phase:'Dedupe', model:model('dedupe'), schema:DEDUPED })
const deduped = dd?.findings ?? []
const severe = deduped.filter(f => SEVERE.includes(f.suggestedSeverity))
const rest = deduped.filter(f => !SEVERE.includes(f.suggestedSeverity))

async function seat(f, name) {
  const one = () => agent(pick(prompts.seats[name](JSON.stringify(f)), `seat:${name}`), { label:`judge:${name}`, phase:'Judge', model:model('judge'), schema:VERDICT })
  return (await one()) ?? (await one())   // re-dispatch a failed seat exactly once
}
async function panel(f, promoted = false) {
  const votes = await parallel(['reproduce','refute','ground'].map(n => () => seat(f, n)))
  return { f, votes, tier: promoted ? 'promoted' : 'panel' }
}
async function spotCheck(f) {
  const v = await seat(f, 'refute')
  if (v?.verdict === 'CONFIRM' && SEVERE.includes(v.severity)) return panel(f, true)  // under-graded nit → full panel
  return { f, votes: [v], tier: 'spot' }
}
const judged = (await parallel([...severe.map(f => () => panel(f)), ...rest.map(f => () => spotCheck(f))])).filter(Boolean)

// Reporter — final verdicts + env-aware severity; aggregation arithmetic is IN the packets, the reporter may overrule with cited reasoning.
const packets = judged.map(j => ({ ...j, valid: j.votes.filter(Boolean).length }))
const totalSeats = judged.reduce((a, j) => a + j.votes.length, 0)
const validSeats = judged.reduce((a, j) => a + j.votes.filter(Boolean).length, 0)
const rep = await agent(pick(prompts.reporter(JSON.stringify(packets), profile, priorReport), 'reporter'), { label:'reporter', phase:'Report', model:model('reporter'), schema:REPORT })

return {
  verdict: rep?.verdict ?? 'clean (low coverage — reporter failed)',
  reportMarkdown: rep?.reportMarkdown ?? '',
  coverage: {
    scoutsDispatched: scoutNames.length, scoutsDead,
    rawFindings: raw.length, dedupedFindings: deduped.length, beyondCap: dd?.beyondCapCount ?? 0,
    panelCount: judged.filter(j => j.tier === 'panel').length,
    spotCount: judged.filter(j => j.tier === 'spot').length,
    promotedCount: judged.filter(j => j.tier === 'promoted').length,
    judgeCompletionPct: totalSeats ? Math.round(100 * validSeats / totalSeats) : 0,
  },
}
```

dryRun policy section (verbatim intent): dryRun swaps every agent for a haiku stub returning canned JSON, validating the **engine topology** for pennies. Required once at implementation and after **structural engine edits** (stage order, routing, aggregation, schemas, gating). Data edits — lane rosters, prompt wording, caps, model tiers — are trivial by construction and skip it.

Stub table to embed (each stub prompt is literally `You are a stub. Call no tools. Return exactly this JSON as your structured output: <json>`):

| Stub key | Canned output exercises |
|---|---|
| `triage` | `{lanes:["data-migrations"], domains:["queueing"]}` — conditional activation |
| `scout:<core-1>` | 2 findings: one duplicate-of-scout-2's, one injection-flavored severe candidate |
| `scout:<core-2>` | 2 findings: the duplicate + one nit |
| `scout:data-migrations` | `{findings: []}` — empty-scout path |
| `dedupe` | 1 Blocking + 1 Should-fix + 3 Nit/FYI findings, `beyondCapCount: 2` (run with `config.remainderCap: 3` in dryRun args to exercise the cap) |
| `seat:reproduce:panel` / `seat:ground:panel` / `seat:reproduce:spot` / `seat:ground:spot` | `CONFIRM Blocking` |
| `seat:refute:panel` | `REJECT` — panel findings survive on 2-of-3 |
| `seat:refute:spot` | `CONFIRM Should-fix` → every spot check promotes (deterministic) |

**Stub keys are call-site qualified** (`seat:<name>:panel` vs `seat:<name>:spot`) so a single
canned value per key stays deterministic — a per-seat-name key would make the same stub answer
both panel votes and spot checks, which no fixed value can satisfy.
| `reporter` | fixed `{verdict:"Blocking (1 confirmed)", reportMarkdown:"# stub report", confirmedCount:1, escalations:[]}` |

- [ ] **Step 2: Run the dryRun.** Invoke the Workflow tool with the script and dryRun args (mode `pr`, `remainderCap: 3`, 3 core lanes + 1 triage-activated lane, stub prompts as above — all strings, pure JSON). The assertion is call topology, not verdict semantics.
- [ ] **Step 3: Assert against the journal/result:** triage=1 call; scouts=4 (3 core-configured + 1 activated); dedupe=1; judges: 2 severe panels (6 seat calls) + 3 spot checks + 3 promotion panels (9 more) = **18 seat calls**; reporter=1. Return value: `coverage.beyondCap === 2`, `promotedCount === 3`, `judgeCompletionPct === 100`, `verdict` non-empty. If any assertion fails, fix the script **in the doc** and re-run — the doc's script is canonical.
- [ ] **Step 4: Commit** — `git commit -m "feat(super-roast): workflow engine doc with dryRun-validated script"`

### Task 2: Judge seat prompts + eval regression

**Files:**
- Create: `skills/super-roast/judge-seat-prompts.md`
- Create: `docs/superpowers/plans/eval/2026-07-28-judge-seats/fixture-webhook-dispatch-design.md` (copy from the session scratchpad path in Global Constraints — do this FIRST, the scratchpad is ephemeral)
- Create: `docs/superpowers/plans/eval/2026-07-28-judge-seats/eval-record.md` (copy from `~/Documents/Super-Roast_Design_Research_20260728/judge-seats-eval.md`)

**Interfaces:**
- Consumes: nothing (independent of Task 1).
- Produces: `prompts.seats.reproduce/refute/ground` content used by the engine (Task 1 contract) and the fan-out fallback; the eval fixture used by Step 3 and future regressions.

- [ ] **Step 1: Vendor the artifacts.** Copy the fixture and eval record to the paths above.
- [ ] **Step 2: Write `judge-seat-prompts.md`** from `~/Documents/Super-Roast_Design_Research_20260728/judge-seat-prompts-validated.md` — keep the shared core (including the tested materiality definition verbatim: *"Material means material against the spec's stated requirements, contract, and scope — not against an imagined stricter system"* — copy it from the source file, not from this quote) and the three seat blocks unchanged, then add the PR-mode block:

```markdown
## PR mode adjustments (append to the shared core when mode = pr)

In PR mode, "the spec" means the change under review: the diff, its stated intent
(PR description / commit messages), and the surrounding repository. "Stated
requirements" include the repository's own conventions and the change's stated intent.
You have repo read access — ground internal claims by reading the actual files, not
just the diff hunk.

Additional REFUTE checks (e) and (f):
(e) **Pre-existing** — does the defect exist on the base branch rather than being
    introduced or materially worsened by this change? Check the base version of the
    file. Pre-existing issues are FYI, not this change's gap.
(f) **Linter territory** — is this pure style/formatting a linter or formatter
    enforces? That is a Nit at most, and usually not worth reporting at all.

Additional GROUND duty: repo-context premises ("this is on a hot path", "a dependency
for this already exists", "this pattern is used elsewhere") must be verified by
actually grepping/reading the repository, not assumed.
```

Also update severity words in the seat/shared text: the VERDICT severities are `Blocking | Should-fix | Nit | FYI` with these definitions — **Blocking:** if unaddressed, the change is likely to be wrong, lose data, or fail its core purpose — must fix before proceeding; **Should-fix:** significant risk or rework, address before/soon after merge; **Nit:** real but low-impact; **FYI:** context/observation, no action required.
- [ ] **Step 3: Regression — trap A must die.** Dispatch 3 sonnet subagents (one per seat, prompts spliced exactly as the file specifies, design mode) against the vendored fixture with the trap finding: *claim:* "Webhook deliveries can be duplicated: if a slow-but-alive worker's lease expires mid-delivery, another worker reclaims the same job and delivers it again concurrently — the design does not prevent double-delivery." *location:* "Worker scheduling and fairness / Delivery", *external:* false. **Expected: 0/3 CONFIRM** (eval baseline: identical judges confirmed it 2/3).
- [ ] **Step 4: Regression — real gap must survive.** Same dispatch with: *claim:* "Dead-lettered jobs are unrecoverable and effectively invisible: after 10 attempts a job moves to webhook_dead_letters, but the design specifies no redrive/replay mechanism and no alert on dead-lettering — so any endpoint outage longer than the backoff schedule permanently loses those deliveries despite the stated at-least-once goal." *location:* "Delivery / Observability", *external:* false. **Expected: ≥2/3 CONFIRM at Blocking or Should-fix.** If either regression fails, fix the prompt file (not the fixture) and re-run both.
- [ ] **Step 5: Commit** — `git commit -m "feat(super-roast): seat-differentiated judge prompts + vendored eval fixture"`

### Task 3: Triage prompt + design-mode scout prompts

**Files:**
- Create: `skills/super-roast/triage-prompt.md`
- Create: `skills/super-roast/scout-prompts-design.md`
- Read (source): `skills/roast/domain-triage-prompt.md`, `skills/roast/critic-prompt.md`

**Interfaces:**
- Consumes: PR lane names from the spec (must match Task 4's headings and Task 1's `config` lists exactly): core `correctness`, `security`, `premortem`, `simplicity-design`, `hot-path-perf`, `concurrency-async`; conditional `data-migrations`, `deploy-safety`, `api-contract`, `observability`, `testing`, `dependency`, `hygiene-docs`.
- Produces: `prompts.triage` and design-mode `prompts.scouts` content. Design core lenses keep roast's names: `premortem`, `completeness`, `yagni`, `failure-mode`, `feasibility` (+ `security`, `maintainer` when triage returns no domains).

- [ ] **Step 1: Write `triage-prompt.md`** with two sections. *Design mode:* port roast's domain triage verbatim (1–3 domains, recall-leaning, `none` → widen core lenses). *PR mode:* given the diff's file list and stat summary, return the conditional lanes to activate from the fixed list above, with the activation heuristics per lane (schema/migration files or model changes → `data-migrations`; CI/deploy/infra files or flagged behavior changes → `deploy-safety`; exported/public API or wire-format changes → `api-contract`; new failure paths or logging changes → `observability`; production code without test changes, or test-heavy diffs → `testing`; lockfile/manifest changes → `dependency`; docs/README/mixed-concern diffs → `hygiene-docs`). Close with the recall rule: **on doubt, activate — a missed lane is a silent gap; an extra lane is one wasted scout.**
- [ ] **Step 2: Write `scout-prompts-design.md`** — port `critic-prompt.md` content (adversarial stance, lens list, research permission, structured output with GAP/UNVERIFIED-ASSUMPTION kinds, importance×uncertainty spike rule) with two changes: output items also carry `category` (the lens name) and `evidence`; add the high-recall mandate sentence: *"Report every defensible finding with location and evidence, including ones you are uncertain about — do not filter by severity or confidence; downstream stages do that."*
- [ ] **Step 3: Verify:** `grep -nE "blocker|major|minor|BLOCK|REVISE|PASS" skills/super-roast/triage-prompt.md skills/super-roast/scout-prompts-design.md` → no matches (case-sensitive on the gate words). Side-by-side check that every roast critic-prompt section has a counterpart (stance, lens, research, output contract).
- [ ] **Step 4: Commit** — `git commit -m "feat(super-roast): triage + design-mode scout prompts"`

### Task 4: PR-mode scout lanes

**Files:**
- Create: `docs/superpowers/specs/references/pr-review-taxonomy.md` (copy of `~/Downloads/super-review.md`, with a one-line provenance header: research report, 2026-07-28, source for PR scout lanes)
- Create: `skills/super-roast/scout-prompts-pr.md`

**Interfaces:**
- Consumes: lane names from Task 3 (exact match).
- Produces: PR-mode `prompts.scouts` content — a shared preamble + one section per lane.

- [ ] **Step 1: Vendor the taxonomy** to the reference path.
- [ ] **Step 2: Write the shared preamble** (applies to every lane): adversarial stance; inputs are the diff + repo access + PR description/comments when present; the high-recall mandate (same sentence as Task 3 Step 2); structured output per finding: `claim, location (file:line), category (lane name), external, evidence, kind: ISSUE`; instruction to read surrounding code, not just hunks; when a prior report is supplied, do not re-surface its Rejected findings.
- [ ] **Step 3: Write the 13 lanes**, each with **Scope**, **Hunt list** (5–15 heuristics), and **Pragmatism filter**, sourced from the vendored taxonomy per this mapping — copy the heuristics and pragmatism filters from the mapped sections, condensing to the strongest items rather than rewriting:

| Lane | Taxonomy source sections |
|---|---|
| `correctness` (core) | A. Correctness & Edge Cases |
| `security` (core) | B. Security |
| `premortem` (core) | user's premortem category + D. Reliability & Resilience (timeouts, retries, blast radius) + M. Resource Management |
| `simplicity-design` (core) | user's simplicity + clean-OOP categories + J's Ousterhout red flags (shallow modules, leakage) |
| `hot-path-perf` (core) | user's GC-churn category + E. Performance & Scalability Beyond GC |
| `concurrency-async` (core) | user's concurrency category + N. Async/Cancellation/Ordering |
| `data-migrations` | C. Data Integrity, Persistence & Migrations |
| `deploy-safety` | F. Deployment / Rollout Safety |
| `api-contract` | H. API / Interface Design & Contract Stability |
| `observability` | G. Observability & Operability |
| `testing` | I. Testing Strategy Beyond Naming |
| `dependency` | L. Dependency & Supply-Chain |
| `hygiene-docs` | K. Scope & Change Hygiene + O. Cost/Privacy + P. Documentation/a11y/i18n |

Fully worked example for the `correctness` lane (write the others to this shape):

```markdown
## Lane: correctness

**Scope:** Does the change do what it intends across the full input domain — boundaries,
error paths, encoding, time, numbers — per Google's "Functionality" pillar?

**Hunt list:**
1. Boundary/off-by-one: `<=` vs `<`, loop bounds, slice indices, empty/single-element collections.
2. Null/undefined: unchecked dereferences; errors dropped (`catch {}`, Go `_`, TS `!`).
3. Error paths: swallowed exceptions, logged-but-continued, partial failure leaving inconsistent state.
4. Input validation missing at system boundaries; trusting client-supplied IDs.
5. Numeric: overflow, float equality, money in floats, division-by-zero, rounding.
6. Time: naive datetimes, DST, local-vs-UTC comparison, week/day math.
7. Encoding: byte-vs-char length, UTF-8 truncation mid-codepoint.
8. Idempotency: retries double-writing; missing idempotency keys on mutating endpoints.
9. TOCTOU / non-atomic read-modify-write.
10. Collection mutation during iteration; mutable default arguments.

**Pragmatism filter:** anything on a user-facing or data-writing path matters most;
boundary quibbles on well-tested internal helpers are low-value. Don't invent
adversarial inputs the type system already excludes.
```

- [ ] **Step 4: Verify:** all 13 lane headings present and spelled exactly as Task 3's list (`grep -c '^## Lane:' skills/super-roast/scout-prompts-pr.md` → 13); each lane has the three parts; no retired severity vocabulary.
- [ ] **Step 5: Commit** — `git commit -m "feat(super-roast): PR-mode scout lanes + vendored taxonomy reference"`

### Task 5: Dedupe prompt

**Files:**
- Create: `skills/super-roast/dedupe-prompt.md`
- Read (source): `skills/roast/dedup-rank-prompt.md` (merge rules port from here)

**Interfaces:**
- Consumes: raw findings JSON (Task 1 `FINDINGS` item shape).
- Produces: `prompts.dedupe` content; output must match Task 1's `DEDUPED` schema (`findings[]` with `suggestedSeverity`, plus `beyondCapCount`).

- [ ] **Step 1: Write `dedupe-prompt.md`.** Model note: **fable** — merge errors silently drop findings and nothing downstream recovers them. Content: (1) merge rules ported from roast (same location AND same root claim → one finding; keep strongest evidence, union of locations; different root claims at same location are NOT duplicates; never add findings; carry `kind`/`external`/`spike` through); (2) suggest a severity per merged finding using the four-level definitions from Task 2 Step 2 — flag it as a suggestion that routes verification depth and informs (never binds) the reporter; (3) selection: keep ALL Blocking/Should-fix candidates; order the remainder by importance with correctness and risk first, keep the top `[REMAINDER_CAP]` (orchestrator substitutes the configured value, default 50), and report `beyondCapCount` for the dropped tail; (4) output contract mirroring the `DEDUPED` schema field-for-field.
- [ ] **Step 2: Verify:** output contract field names match Task 1's `DEDUPED` schema exactly (`suggestedSeverity`, `beyondCapCount` — grep both in both files).
- [ ] **Step 3: Commit** — `git commit -m "feat(super-roast): dedupe prompt (fable merge + suggested severity + caps)"`

### Task 6: Reporter prompt

**Files:**
- Create: `skills/super-roast/reporter-prompt.md`

**Interfaces:**
- Consumes: judged packets JSON (`{f, votes[], tier, valid}` per finding, Task 1 shape), profile prose, prior report text.
- Produces: `prompts.reporter` content; output must match Task 1's `REPORT` schema.

- [ ] **Step 1: Write `reporter-prompt.md`** with these rules:
  - **Per-finding verdict:** confirmed | rejected. Panel arithmetic (≥2 of 3 valid CONFIRMs) is the default; you may overrule it **only with reasoning that cites specific seat evidence** (e.g., two CONFIRMs whose evidence the refute seat factually disproved). Findings with <3 valid seat votes (panel tier) or an UNVERIFIED external → Escalations, never silently dropped or confirmed.
  - **Final severity:** start from seat severities, condition on the environment profile — the profile moves the Should-fix↔Nit boundary and down-weights resilience/observability/cost findings for low-blast-radius projects. **Floors (profile-proof):** [the verbatim floors list from Global Constraints]. State in one line, per demoted finding, which profile fact drove the demotion.
  - **Verdict line:** `<highest confirmed severity> (<n> confirmed)` or `clean (<n> nits)`; append `[low coverage]` when scouts/judges substantially failed (any dead scout, judge completion <100%, or zero raw findings on a non-trivial artifact).
  - **Prior report handling:** mark each previous confirmed finding resolved/regressed/still-open; do not re-litigate its Rejected section.
  - **Report template** — embed verbatim from the spec (§Report format): header block (verdict/mode/iteration/profile/inputs/coverage/independence), `## Confirmed findings` (with per-finding `verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)`, strongest evidence, one-line advisory `fix-shape hint`), `## Rejected (with reason)`, `## Unverified nits (spot-checked)`, `## Escalations (need human)`.
  - Output contract mirroring the `REPORT` schema: `verdict`, `reportMarkdown` (the full report), `confirmedCount`, `escalations`.
- [ ] **Step 2: Verify:** template section headings match the spec exactly; floors list matches Global Constraints verbatim; `grep -nE "BLOCK|REVISE|PASS|blocker|major|minor"` → no matches.
- [ ] **Step 3: Commit** — `git commit -m "feat(super-roast): reporter prompt (final verdicts, env-aware severity, floors)"`

### Task 7: SKILL.md

**Files:**
- Create: `skills/super-roast/SKILL.md`
- Read (source): `skills/roast/SKILL.md` (structure/voice template)

**Interfaces:**
- Consumes: everything Tasks 1–6 produced (file names, arg contract, severity vocabulary, floors).
- Produces: the user/agent-facing entry point; frontmatter description is the trigger surface tested in Step 2.

- [ ] **Step 1: Write SKILL.md** following roast's structure (Overview → When to Use → Process → Output → Model Tiering → Red Flags → Limitations → Integration), updated:
  - Frontmatter: `name: super-roast`; `description: Use when adversarially reviewing either a design doc/spec/RFC before implementation or a PR/branch/diff before merge — surfaces gaps, unverified assumptions, and defects, verifies them with a judge panel, and reports severity calibrated to the project's blast radius. Not for reviewing prose style or answering questions about code.`
  - Process: the 7 pipeline stages (one line each), pre-flight rules (mode: caller > obvious > ask, never guess on ambiguity; PR inputs: branch diff + working tree, or PR# via `gh` when available; profile: auto-detected, stated in header, never asked), severity vocabulary + floors, tiered verification (panel for severe, refute spot-check for nits — this replaces roast's depth levels), report format pointer, super-plan handoff + loop (auto re-roast by fix scope, cap 3, early-stop on no-progress, both exits pause for the human).
  - Model tiering table with one-line rationales (triage sonnet / scouts opus / dedupe **fable** / judges sonnet / reporter **fable**).
  - Red Flags (port roast's, then update): never dispatch three identical judge prompts — one judge per seat; never let the profile demote a floors-class finding; never re-litigate a prior report's Rejected section; never edit the artifact or create tasks (report-only); never guess the mode on ambiguous input; never report a clean verdict when scouts/judges failed — `[low coverage]`; never CONFIRM an external claim without a resolved citation; UNVERIFIED/incomplete panels escalate, never drop.
  - Honest limits: same-family caveat; recall bounded by scouts; web-only grounding for externals; profile inference can be wrong (that's why the header states it).
- [ ] **Step 2: Trigger micro-test.** Dispatch 3 fresh haiku subagents, each given ONLY the frontmatter description plus one scenario, asked "would you invoke this skill? yes/no": (a) "I finished writing a design doc for a new sync service, look it over before I build it" → expect yes; (b) "review my branch before I open the PR" → expect yes; (c) "can you explain what this function does?" → expect no. Any miss → tighten the description wording and re-run all three.
- [ ] **Step 3: Implement design-mode lens widening in the engine.** Both roast and `triage-prompt.md` promise that a design-mode triage returning no domains widens the core lens set (adding security + future-maintainer) so the scout pool does not shrink — but the engine applies `config.coreLenses` unconditionally, and the orchestrator cannot decide it because triage runs inside the workflow. Give the config explicit semantics: **`config.coreLenses`** = lenses that always run; **`config.widenLenses`** = added only when design mode triages to no domains. In `skills/super-roast/super-roast-workflow.md`, change the design branch of `scoutNames` to:

```javascript
const domains = (triage?.domains ?? []).filter(d => d && d !== 'none').slice(0, 3)
const scoutNames = mode === 'design'
  ? [...config.coreLenses, ...(domains.length ? [] : (config.widenLenses ?? [])), ...domains.map(d => `domain:${d}`)]
  : [...new Set([...config.coreLanes, ...(triage?.lanes ?? [])])]
```

SKILL.md documents both config keys, with design defaults `coreLenses: ['premortem','completeness','yagni','failure-mode','feasibility']` and `widenLenses: ['security','maintainer']`.

- [ ] **Step 4: dryRun the design-mode branch** (this is a structural engine change, and the Task 1 dryRun only exercised PR mode). Run twice with `mode: 'design'`, stubs keyed to the design lens names: (a) triage stub returns `{"lanes":[],"domains":["queueing"]}` → assert 6 scouts dispatched (5 core + 1 domain), no widen lenses; (b) triage stub returns `{"lanes":[],"domains":[]}` → assert 7 scouts (5 core + 2 widen), no `domain:` scouts. Everything downstream of scouts is already covered by the Task 1 baseline, so a minimal dedupe stub returning one Blocking finding is enough. Record both results in the workflow doc's assertion section.
- [ ] **Step 5: Commit** — `git commit -m "feat(super-roast): SKILL.md + design-mode lens widening"`

### Task 8: Live validation (both modes, before roast is deleted)

**Files:**
- Create (throwaway): branch `super-roast-live-test` with `scripts/collect-metrics.js` (planted defects)
- Create: `docs/superpowers/reviews/` (first reports land here)

**Interfaces:**
- Consumes: the complete skill from Tasks 1–7.
- Produces: two real reports demonstrating end-to-end function; go/no-go for Task 9.

- [ ] **Step 1: Design-mode live run.** Invoke super-roast per its own SKILL.md on `docs/superpowers/specs/2026-06-16-roast-depth-capped-verification-design.md` (a real, implemented spec — findings are expected and harmless). Verify: mode classified `design` without asking; profile inferred and stated; report file written with all sections; verdict line well-formed; coverage numbers consistent (raw ≥ deduped ≥ panel+spot).
- [ ] **Step 2: PR-mode live run.** Create branch `super-roast-live-test`; add `scripts/collect-metrics.js` containing two planted defects — (1) SQL built by string concatenation from a CLI argument, (2) an unbounded in-memory cache (module-level map, no eviction) on a described-as-long-running path — plus innocuous code. Commit on the branch. Run super-roast in PR mode against it. Verify: mode classified `pr`; `security`/`correctness` lanes fired; **the injection is a confirmed Blocking** (floor applies regardless of the repo's hobby-grade profile); the unbounded cache is confirmed (severity may legitimately land Should-fix or Nit given the profile — that's the env-awareness working, record which); no confirmed finding about pre-existing repo code.
- [ ] **Step 3: Cleanup + record.** Delete the test branch. Commit the two reports as eval evidence: `git commit -m "test(super-roast): live design-mode and PR-mode validation reports"`. If either run misbehaved structurally, fix the responsible file, dryRun if the engine changed, and re-run the failed mode.

### Task 9: Replace roast + integrations

**Files:**
- Delete: `skills/roast/` (entire directory)
- Modify: `skills/brainstorming/SKILL.md` (roast gate → super-roast)
- Modify: `skills/super-plan/SKILL.md` (roast mention at root; add receive-report → fix → auto-re-roast step)
- Modify: `docs/superpowers/specs/INDEX.md` (statuses)

**Interfaces:**
- Consumes: validated skill from Task 8.
- Produces: a repo where `superpowers:roast` no longer exists and nothing references it as live.

- [ ] **Step 1: Enumerate references (RED list):** `grep -rn --include='*.md' -i 'roast' skills/ docs/ .claude/ | grep -v 'super-roast' | grep -v 'docs/superpowers/specs/20' | grep -v 'docs/superpowers/plans/'` — historical specs/plans keep their references; everything else on the list must be updated.
- [ ] **Step 2: Update live references.** brainstorming's gate offers `superpowers:super-roast`; super-plan's root-level roast offer becomes super-roast **and** gains the loop step per spec §7: after super-roast returns a report with confirmed findings, super-plan creates one task per confirmed finding, fixes per its normal ladder, then auto-decides re-roast — mechanical single-file fixes with no design change → done; fixes that changed design decisions, data handling, or resolved multiple Blocking findings → re-invoke super-roast with the prior report path; obey the cap of 3 and the no-progress early-stop; on either exit, pause and summarize for the human.
- [ ] **Step 3: Delete `skills/roast/`** (`git rm -r skills/roast`).
- [ ] **Step 4: INDEX updates:** the two roast spec rows → `superseded-by: 2026-07-29-super-roast-design.md`; the super-roast row stays `draft` until finishing-a-development-branch flips it.
- [ ] **Step 5: Verify:** re-run the Step 1 grep — only historical docs remain. `ls skills/roast` → gone. `grep -rn 'superpowers:roast\b' skills/` → no matches.
- [ ] **Step 6: Commit** — `git commit -m "feat(super-roast)!: replace roast with super-roast; wire brainstorming + super-plan loop"`

---

## Self-review notes (completed)

- **Spec coverage:** every spec section maps to a task — pipeline/engine (1), judges (2), triage+design scouts (3), PR lanes (4), dedupe (5), reporter+profile+floors+report format (6), SKILL/mode/inputs/ladder (7), testing plan items 1–3 (1/2/8), item 4 (7 Step 2), integration changes (9), engine-vs-data + dryRun policy (1).
- **Type consistency:** `suggestedSeverity`/`beyondCapCount` (Tasks 1/5), seat names `reproduce/refute/ground` (1/2), lane names (3/4/1-config), `REPORT` fields (1/6) cross-checked.
- **Known judgment point for the executor:** dryRun stub keying is per seat name, so the promoted panel reuses stubs — assert call counts, not verdict semantics (noted in Task 1 Step 2).
