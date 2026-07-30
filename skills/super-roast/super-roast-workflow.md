# super-roast Workflow (find → dedupe → verify → report)

Engine reference for `super-roast`'s dual-mode (design / PR) adversarial review. Full stage
rationale, the PR lane roster, the severity-floor list, and the report template live in
the design spec (`docs/superpowers/specs/2026-07-29-super-roast-design.md`) — this doc is
the **engine contract**: the stable script plus the capability ladder and validation policy
that keep it stable. Don't duplicate the spec's reasoning here; link it.

## Pipeline (compressed reference)

| # | Stage | Model | Count | Role |
|---|---|---|---|---|
| 1 | Pre-flight | (inline, main session) | — | mode / inputs / environment profile — see spec §1 |
| 2 | Triage | sonnet | 1 | design: domains; PR: conditional-lane activation — spec §2 |
| 3 | Scouts | opus | 5–8 design / 6–13 PR | high-recall finding — spec §3 |
| 4 | Dedupe | fable | 1 | merge, suggest severity, apply caps — spec §4 |
| 5 | Judges | sonnet | 3×severe + 1×nit | seat-differentiated verification — spec §5 |
| 6 | Reporter | fable | 1 | final verdicts, env-aware severity, report file — spec §6 |
| 7 | Handoff | — | — | report → super-plan fix loop — spec §7 |

Severity vocabulary throughout (the only one): **Blocking | Should-fix | Nit | FYI**.
`blocker/major/minor` and `BLOCK/REVISE/PASS` do not appear anywhere in this pipeline.

## Capability ladder (never asked — selects the execution mechanism automatically)

- **`Workflow` tool available → dynamic workflow (preferred).** Run the engine script below
  via the tool. Triage → scout fan-out → dedupe → tiered judge panels → reporter, each phase
  model-tiered per role. Label the report
  `independence: same-family (Claude) — seat-differentiated panel`.
- **Subagents but no Workflow → manual fan-out**, same stage order and same prompt files:
  1. Dispatch the triage subagent (sonnet); collect lanes/domains.
  2. Dispatch all scouts in parallel (opus) from the resulting roster; collect findings,
     counting non-responses as coverage loss (never silently dropped).
  3. Dispatch one dedupe subagent (fable) with the pooled findings; split its output into
     severe (Blocking/Should-fix) and the remainder.
  4. For each severe finding, dispatch the 3-seat panel (reproduce/refute/ground, sonnet) in
     parallel; re-dispatch any seat that returns nothing, once. For each remaining finding,
     dispatch a single refute-seat spot check; a spot check that CONFIRMs at Blocking/Should-fix
     is promoted — dispatch the full 3-seat panel for it.
  5. Dispatch one reporter subagent (fable) with all judged packets, the profile, and the
     prior report (if any).

  Same label as the Workflow path: `independence: same-family (Claude) — seat-differentiated panel`.
- **No subagents → inline degraded (last resort).** Walk the same steps in one context. This
  is self-review — label the report `independence: none (inline)` so the caller knows the
  verdict is weak.

**Honest limit:** the three seats differ by *method* (reproduce / refute / ground), which
reduces correlated error but does not deliver family-level independence — a same-family panel
carries fewer effective votes than it has members. Use a non-Claude seat for one of the three
where a harness offers one.

## Key constraints

- **The script does no I/O.** It calls only its hooks (`agent()`, `parallel()`, `log()`,
  `phase()`) — no shell, no filesystem, no web, no repo reads. All I/O (reading the spec or
  diff, web search, repo greps, writing the report file) happens **inside dispatched agents**
  or in the orchestrator around the script, never in the script body.
- **Prompts are rendered by the orchestrator, not the script.** The script receives
  `args.prompts` fully assembled (prompt files + interpolated context); it never reads a
  prompt file itself. This keeps the script harness-neutral — the prompt `.md` files it
  points at carry no Workflow-specific syntax.
- **Agents can't nest `deep-research`.** Scouts and judges ground external claims with
  **`WebSearch`/`WebFetch`** directly, not the `deep-research` skill — a dispatched agent
  generally cannot spawn the sub-agents `deep-research` needs. PR-mode scouts/judges also get
  direct repo read access (to check pre-existing-vs-introduced, hot-path claims, etc.) — that
  read access is a tool grant on the dispatched agent, not something the script performs.

## Prompt contract: `args` is pure JSON

The Workflow tool's `args` must be plain JSON — **every prompt is a STRING, never a
function.** Prompts that need runtime data (the raw findings, a single finding, the judged
packets, the profile, the prior report) carry placeholder tokens instead, which the script
substitutes with a small `fill(template, vars)` helper (plain string replacement, no regex):

| Prompt | Token(s) |
|---|---|
| `prompts.dedupe` | `{{FINDINGS_JSON}}` |
| `prompts.seats.reproduce` / `.refute` / `.ground` | `{{FINDING_JSON}}` |
| `prompts.reporter` | `{{PACKETS_JSON}}`, `{{PROFILE}}`, `{{PRIOR_REPORT}}` |

`prompts.triage` and each `prompts.scouts.<name>` carry no tokens — they need no runtime
substitution and are used as plain strings. This is the contract Task 7's SKILL.md and the
orchestrator build `args.prompts` against; a function anywhere in `args` makes the script
unrunnable (an earlier draft of this doc had `dedupe`/`seats.*`/`reporter` as functions —
that draft never crossed the Workflow `args` boundary and was corrected before any real run).

**`args` may arrive as an object or as a JSON string.** Some harness paths stringify `args`
before invoking the script; the engine tolerates both — `JSON.parse`s it if it's a string —
and validates that `{prompts, config}` are present before destructuring, throwing a loud,
specific error instead of letting a bare property-access-on-undefined surface mid-run (this
was discovered by an actual failed run, not by inspection — see the engine script's first
lines).

## Engine script

The canonical script. Validated once via `dryRun` at implementation (topology only, see
below) and re-validated after any structural edit (stage order, routing, aggregation,
schemas, gating). Data — lane rosters, prompt wording, caps, model tiers — flows in through
`args` and is trivially editable without re-running `dryRun`.

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

// The harness delivers args as an object on most paths but as a JSON string on some — tolerate
// both, and fail loudly (not with a cryptic destructure error) if the required shape is missing.
const A = typeof args === 'string' ? JSON.parse(args) : args
if (!A || !A.prompts || !A.config) throw new Error('super-roast: args must carry {mode, prompts, config} — got ' + JSON.stringify(A).slice(0, 200))
const { mode, profile, priorReport = '', dryRun = false, prompts, config } = A
const model = role => dryRun ? 'haiku' : config.models[role]
const pick = (real, stubKey) => dryRun ? prompts.stubs[stubKey] : real
const fill = (template, vars) => Object.entries(vars).reduce((s, [token, value]) => s.replaceAll(token, value), template)

// Triage — design: domains for expert critics; PR: conditional-lane activation (recall-leaning).
const triage = await agent(pick(prompts.triage, 'triage'), { label:'triage', phase:'Triage', model:model('triage'), schema:LANES })
const domains = (triage?.domains ?? []).filter(d => d && d !== 'none').slice(0, 3)
const scoutNames = mode === 'design'
  ? [...config.coreLenses, ...(domains.length ? [] : (config.widenLenses ?? [])), ...domains.map(d => `domain:${d}`)]
  : [...new Set([...config.coreLanes, ...(triage?.lanes ?? [])])]

// Scouts — parallel, high-recall. Nulls are counted (coverage), then filtered.
const scoutResults = await parallel(scoutNames.map(name => () =>
  agent(pick(prompts.scouts[name], `scout:${name}`), { label:`scout:${name}`, phase:'Scout', model:model('scout'), schema:FINDINGS })))
const scoutsDead = scoutResults.filter(r => !r).length
const raw = scoutResults.filter(Boolean).flatMap(r => r.findings ?? [])

// Dedupe — merge + suggested severity; keeps ALL severe, caps remainder (agent applies config.remainderCap from its prompt).
const dedupePrompt = fill(prompts.dedupe, { '{{FINDINGS_JSON}}': JSON.stringify(raw) })
const dd = await agent(pick(dedupePrompt, 'dedupe'), { label:'dedupe', phase:'Dedupe', model:model('dedupe'), schema:DEDUPED })
const deduped = dd?.findings ?? []
const severe = deduped.filter(f => SEVERE.includes(f.suggestedSeverity))
const rest = deduped.filter(f => !SEVERE.includes(f.suggestedSeverity))

// site: 'panel' | 'spot' — stub keys are call-site qualified (seat:<name>:<site>) so a single
// canned value per key stays deterministic; a per-seat-name-only key would have to answer
// both a panel vote and a spot check with the same fixed value, which no stub can satisfy.
async function seat(f, name, site) {
  const stubKey = `seat:${name}:${site}`
  const seatPrompt = fill(prompts.seats[name], { '{{FINDING_JSON}}': JSON.stringify(f) })
  const one = () => agent(pick(seatPrompt, stubKey), { label:`judge:${name}`, phase:'Judge', model:model('judge'), schema:VERDICT })
  return (await one()) ?? (await one())   // re-dispatch a failed seat exactly once
}
async function panel(f, promoted = false) {
  const votes = await parallel(['reproduce','refute','ground'].map(n => () => seat(f, n, 'panel')))
  return { f, votes, tier: promoted ? 'promoted' : 'panel' }
}
async function spotCheck(f) {
  const v = await seat(f, 'refute', 'spot')
  if (v?.verdict === 'CONFIRM' && SEVERE.includes(v.severity)) return panel(f, true)  // under-graded nit → full panel
  return { f, votes: [v], tier: 'spot' }
}
const judged = (await parallel([...severe.map(f => () => panel(f)), ...rest.map(f => () => spotCheck(f))])).filter(Boolean)

// Reporter — final verdicts + env-aware severity; aggregation arithmetic is IN the packets, the reporter may overrule with cited reasoning.
const packets = judged.map(j => ({ ...j, valid: j.votes.filter(Boolean).length }))
const totalSeats = judged.reduce((a, j) => a + j.votes.length, 0)
const validSeats = judged.reduce((a, j) => a + j.votes.filter(Boolean).length, 0)
const reporterPrompt = fill(prompts.reporter, { '{{PACKETS_JSON}}': JSON.stringify(packets), '{{PROFILE}}': profile, '{{PRIOR_REPORT}}': priorReport })
const rep = await agent(pick(reporterPrompt, 'reporter'), { label:'reporter', phase:'Report', model:model('reporter'), schema:REPORT })

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

> The Workflow tool's built-in `isolation:'worktree'` is irrelevant here — `super-roast` reads
> and reasons; in both modes it writes nothing to the repo itself (the orchestrator writes
> `reportMarkdown` to the report path after the script returns). Keep it report-only.

## dryRun policy

`dryRun: true` swaps every agent call for a haiku stub returning canned JSON, validating the
**engine topology** — call counts, routing, aggregation arithmetic, coverage gating — for
pennies, without touching a real spec/diff or spending opus/sonnet/fable budget.

Required **once at implementation** and **after any structural engine edit**: stage order,
routing (which findings go to a panel vs. a spot check), aggregation (the ≥2-of-3 / promotion
logic), schemas, or coverage gating. **Data edits skip it** — lane rosters, prompt wording,
caps, model tiers are trivial by construction and can't silently break topology.

The orchestrator should pass `args` as an actual JSON value wherever the harness supports it —
the string-tolerance in the engine script exists as a defensive fallback for harness paths that
stringify `args` before invoking the script, not as license to always stringify by default.

## Stub table

Each stub prompt is literally `You are a stub. Call no tools. Return exactly this JSON as
your structured output: <json>`. The table below is the exact set used to exercise the
topology in one pass: conditional lane activation, an empty scout, dedupe's cap, panel
routing, and spot-check promotion.

| Stub key | Canned output exercises |
|---|---|
| `triage` | `{lanes:["data-migrations"], domains:["queueing"]}` — conditional activation |
| `scout:<core-1>` | 2 findings: one duplicate-of-scout-2's, one injection-flavored severe candidate |
| `scout:<core-2>` | 2 findings: the duplicate + one nit |
| `scout:<core-3>` | `{findings: []}` — a second empty-scout path alongside the activated lane (added so the 3-core-configured topology in Step 3 below has a stub for every dispatched core scout; the brief's table names only two core examples) |
| `scout:data-migrations` | `{findings: []}` — empty-scout path (the triage-activated lane) |
| `dedupe` | 1 Blocking + 1 Should-fix + 3 Nit/FYI findings, `beyondCapCount: 2` (run with `config.remainderCap: 3` in dryRun args to exercise the cap) |
| `seat:reproduce:panel` / `seat:ground:panel` / `seat:reproduce:spot` / `seat:ground:spot` | `CONFIRM Blocking` |
| `seat:refute:panel` | `REJECT` — panel findings survive on 2-of-3 |
| `seat:refute:spot` | `CONFIRM Should-fix` → every spot check promotes (deterministic) |
| `reporter` | fixed `{verdict:"Blocking (1 confirmed)", reportMarkdown:"# stub report", confirmedCount:1, escalations:[]}` |

**Stub keys are call-site qualified** (`seat:<name>:panel` vs `seat:<name>:spot`) so a single
canned value per key stays deterministic. A per-seat-name-only key (an earlier draft of this
doc used `seat:refute` for both) would have to answer both a panel vote and a spot check with
one fixed value — no stub can satisfy `REJECT` and `CONFIRM Should-fix` simultaneously, so that
draft made `promotedCount === 1` unreachable (it would land on 0 or 3 depending on which value
was picked). Qualifying by site removes the ambiguity: every spot check now deterministically
promotes.

## Assertions for the canonical dryRun (mode `pr`, `config.remainderCap: 3`)

- triage: 1 call.
- scouts: 4 calls (3 core-configured + 1 triage-activated `data-migrations`).
- dedupe: 1 call.
- judges: 2 severe panels × 3 seats (6 calls) + 3 spot checks (3 calls) + 3 promotion panels ×
  3 seats (9 calls, since every spot check promotes deterministically) = **18 seat calls**.
- reporter: 1 call.
- Return value: `coverage.beyondCap === 2`, `coverage.promotedCount === 3`,
  `coverage.judgeCompletionPct === 100`, `verdict` non-empty.

If any assertion fails, fix the script **in this doc** (this doc's script is canonical) and
re-run before committing the fix.

### Passing baseline (recorded, not illustrative)

Run `wf_cbe52959-ff0`, 2026-07-29, against the args above: **25 agents dispatched, 0 errors**
— triage 1, scouts 4 (3 core + 1 triage-activated), dedupe 1, seat calls 18 (2 panels × 3 + 3
spot checks + 3 promoted panels × 3), reporter 1. The 2 empty-findings scouts (`premortem`,
`data-migrations`) exercised the empty-result path (harness reported `agents_empty_result: 2`).

Returned `coverage`: `scoutsDispatched: 4, scoutsDead: 0, rawFindings: 4, dedupedFindings: 5,
beyondCap: 2, panelCount: 2, spotCount: 0, promotedCount: 3, judgeCompletionPct: 100`. Verdict:
`"Blocking (1 confirmed)"`. All figures match the assertions above — this dryRun is validated.

## Assertions for the design-mode lens-widening dryRun (mode `design`)

Added when the design branch of `scoutNames` changed to use `config.coreLenses` /
`config.widenLenses` (see the engine script above). Exercises the widening logic specifically,
with a minimal one-Blocking-finding dedupe stub (everything past scouts is already covered by
the PR-mode baseline above).

- **(a) domains present** — triage stub `{"lanes":[],"domains":["queueing"]}`:
  `scoutNames.length === 6` (5 `config.coreLenses` + 1 `domain:queueing`), `config.widenLenses`
  **not** added, `coverage.scoutsDispatched === 6`.
- **(b) domains empty** — triage stub `{"lanes":[],"domains":[]}`: `scoutNames.length === 7`
  (5 `config.coreLenses` + 2 `config.widenLenses`), **no** `domain:` scouts,
  `coverage.scoutsDispatched === 7`.

### Passing baseline (recorded, not illustrative)

**(a) domains present, no widening.** Run `wf_2fab6c5d-dc9`, 2026-07-30, triage stub
`{"lanes":[],"domains":["queueing"]}`: **12 agents dispatched, 0 errors** (1 triage + 6 scouts +
1 dedupe + 3 seats + 1 reporter). The 6 scouts were the 5 core lenses plus `domain:queueing`;
no widen lenses dispatched. 5 of 6 scouts returned empty findings (harness reported
`agents_empty_result: 5`), exercising the empty-scout path.

Returned `coverage`: `scoutsDispatched: 6, scoutsDead: 0, rawFindings: 1, dedupedFindings: 1,
beyondCap: 0, panelCount: 1, spotCount: 0, promotedCount: 0 (n/a — no Nit/FYI candidates),
judgeCompletionPct: 100`. Verdict: `"Blocking (1 confirmed)"`. Matches the case-(a) assertions
above — `scoutNames.length === 6`, no `security`/`maintainer` dispatched.

**(b) no domains, widening fires.** Run `wf_f1f77176-482`, 2026-07-30, triage stub
`{"lanes":[],"domains":[]}`: **13 agents dispatched, 0 errors** (1 triage + 7 scouts + 1 dedupe
+ 3 seats + 1 reporter). The 7 scouts were the 5 core lenses plus `security` and `maintainer`
from `config.widenLenses`; **no `domain:` scouts dispatched**, confirming the
widen-only-when-empty condition. 6 of 7 scouts returned empty findings.

Returned `coverage`: `scoutsDispatched: 7, scoutsDead: 0, rawFindings: 1, dedupedFindings: 1,
beyondCap: 0, panelCount: 1, spotCount: 0, promotedCount: 0, judgeCompletionPct: 100`. Verdict:
`"Blocking (1 confirmed)"`. Matches the case-(b) assertions above — `scoutNames.length === 7`,
no `domain:` entries.

**All three `scoutNames` paths are now covered by at least one recorded run:** PR-mode lanes by
the canonical baseline above (`wf_cbe52959-ff0`), design-mode with domains by `wf_2fab6c5d-dc9`,
and design-mode widened by `wf_f1f77176-482`. This design-mode dryRun is validated.
