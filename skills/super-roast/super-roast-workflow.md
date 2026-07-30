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
| `prompts.scouts.<name>` | `{{PRIOR_REPORT}}` |
| `prompts.scoutDomainTemplate` | `{{DOMAIN}}`, `{{PRIOR_REPORT}}` |
| `prompts.dedupe` | `{{FINDINGS_JSON}}` |
| `prompts.seats.reproduce` / `.refute` / `.ground` | `{{FINDING_JSON}}` |
| `prompts.reporter` | `{{PACKETS_JSON}}`, `{{PROFILE}}`, `{{PRIOR_REPORT}}`, `{{COVERAGE_JSON}}`, `{{MODE}}`, `{{ITERATION}}`, `{{INPUTS}}` |

**`prompts.scoutDomainTemplate` is why design-mode domain scouts work at all.** Domain names are
open-ended free text produced by triage **at runtime**, but `args.prompts` is assembled by the
orchestrator **before** the script runs — so `prompts.scouts['domain:queueing']` can never be
pre-populated for a domain nobody knew about yet. The orchestrator therefore supplies **one**
`scoutDomainTemplate` string (the `Lens: domain:<name>` assembly from
`./scout-prompts-design.md`, carrying a literal `{{DOMAIN}}` token), and the script `fill()`s it
per triaged domain exactly as it fills seat and dedupe prompts. Without this, naming domains
would both suppress `config.widenLenses` **and** yield undispatchable scouts — making a triage
that found domains strictly weaker than one that found none.

**`{{MODE}}` / `{{ITERATION}}` / `{{INPUTS}}`** carry the three report-header facts the reporter
cannot derive from packets: `args.mode`, `args.iteration` rendered as `N of <cap>`, and
`args.inputs` (the spec paths, or `branch@sha vs base@sha [+dirty]`, or `PR#` string the
pre-flight step recorded).

`{{COVERAGE_JSON}}` carries the coverage object the script can compute **before** the reporter
call — scout dispatch/dead counts, the raw→deduped funnel, `beyondCap`, `beyondPanelCap`,
`dedupeDead`, and panel/spot/promoted counts. It exists because the reporter is required to
emit the coverage line and the `[low coverage]`/`[panel-capped]` qualifiers, but had no way to
see any of that until this token was added — see the engine script's coverage-building
comment below for exactly what is (and isn't) in it.

`prompts.triage` carries no tokens — it needs no runtime substitution and is used as a plain
string. This is the contract Task 7's SKILL.md and the
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
const { mode, profile, priorReport = '', inputs = '', iteration = 1, dryRun = false, prompts, config } = A
const model = role => dryRun ? 'haiku' : config.models[role]
const pick = (real, stubKey) => dryRun ? prompts.stubs[stubKey] : real
// The replacement is a FUNCTION, not a string: a bare string replacement would let `$&`/`$'`/`$1`
// inside a substituted value (prior-report markdown and JSON blobs are arbitrary text) be
// re-interpreted by replaceAll as capture-group syntax and silently corrupt the prompt.
const fill = (template, vars) => Object.entries(vars).reduce((s, [token, value]) => s.replaceAll(token, () => String(value ?? '')), template)

// Triage — design: domains for expert critics; PR: conditional-lane activation (recall-leaning).
// A dead triage is NOT a clean triage: in PR mode `triage?.lanes ?? []` silently collapses the
// roster to core lanes, which is indistinguishable from "triage activated nothing" unless we
// record it. triageDead feeds coverage and the reporter's [low coverage] qualifier.
const triage = await agent(pick(prompts.triage, 'triage'), { label:'triage', phase:'Triage', model:model('triage'), schema:LANES })
const triageDead = !triage
const domains = (triage?.domains ?? []).filter(d => d && d !== 'none').slice(0, 3)
const scoutNames = mode === 'design'
  ? [...config.coreLenses, ...(domains.length ? [] : (config.widenLenses ?? [])), ...domains.map(d => `domain:${d}`)]
  : [...new Set([...config.coreLanes, ...(triage?.lanes ?? [])])]

// Domain scouts are named at RUNTIME from open-ended triage output, so `prompts.scouts[name]`
// can never hold them (args.prompts is assembled before this script runs). Resolve them from the
// single `prompts.scoutDomainTemplate` string instead, filling {{DOMAIN}} the same way seats fill
// {{FINDING_JSON}}. Every scout prompt also gets {{PRIOR_REPORT}} so re-roasts don't re-surface
// findings the prior report already rejected. An unresolvable name yields null → counted as a
// dead scout below (coverage loss, visible), never an exception mid-run.
const scoutPrompt = name => {
  const base = prompts.scouts?.[name]
    ?? (name.startsWith('domain:') && prompts.scoutDomainTemplate
        ? fill(prompts.scoutDomainTemplate, { '{{DOMAIN}}': name.slice('domain:'.length) })
        : null)
  return base ? fill(base, { '{{PRIOR_REPORT}}': priorReport }) : null
}

// Scouts — parallel, high-recall. Nulls are counted (coverage), then filtered.
// pick() runs BEFORE the guard so dryRun keeps dispatching from the stub table exactly as the
// recorded baselines below did; the guard only ever fires on a real run with an unresolvable name.
const scoutResults = await parallel(scoutNames.map(name => async () => {
  const p = pick(scoutPrompt(name), `scout:${name}`)
  if (!p) return null   // unresolvable prompt ⇒ dead scout, not a crash
  return agent(p, { label:`scout:${name}`, phase:'Scout', model:model('scout'), schema:FINDINGS })
}))
const scoutsDead = scoutResults.filter(r => !r).length
const raw = scoutResults.filter(Boolean).flatMap(r => r.findings ?? [])

// Dedupe — merge + suggested severity; keeps ALL severe, caps remainder (agent applies config.remainderCap from its prompt).
// Re-dispatched once on a dead/truncated response (same shape as seat()'s retry below) — dedupe
// is the one stage the prompt file calls silent-and-unrecoverable: a dead dedupe with no retry
// yields zero packets downstream, which reads as a false "clean" verdict rather than a failure.
const dedupePrompt = fill(prompts.dedupe, { '{{FINDINGS_JSON}}': JSON.stringify(raw) })
const dedupeOnce = () => agent(pick(dedupePrompt, 'dedupe'), { label:'dedupe', phase:'Dedupe', model:model('dedupe'), schema:DEDUPED })
const dd = (await dedupeOnce()) ?? (await dedupeOnce())
const deduped = dd?.findings ?? []
// Forced low-coverage signal: non-empty scout input collapsing to zero deduped findings means
// dedupe died/truncated on both tries, not that the artifact is actually clean.
const dedupeDead = raw.length > 0 && deduped.length === 0

// Panel cap — bounds cost: only the top config.panelCap (default 12) severe candidates, in the
// deduper's own rank order, get a full 3-seat panel. Excess is never silently dropped — it
// carries through to the reporter as 'beyond-cap' packets (suggested severity, no votes) for
// the "## Not verified (beyond panel cap)" section.
const panelCap = config.panelCap ?? 12
const severeAll = deduped.filter(f => SEVERE.includes(f.suggestedSeverity))
const severe = severeAll.slice(0, panelCap)
const beyondPanelCap = severeAll.slice(panelCap)
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

// Coverage — built BEFORE the reporter call (not after, as an earlier draft had it) so its
// facts can be surfaced INTO the reporter's own prompt via {{COVERAGE_JSON}}, not just exist in
// the value the script returns once the reporter has already run and can no longer see it.
// Nothing here depends on the reporter's own output — every field is known from scouts/dedupe/
// judges — so the full object is built here and reused unchanged for the final return.
const totalSeats = judged.reduce((a, j) => a + j.votes.length, 0)
const validSeats = judged.reduce((a, j) => a + j.votes.filter(Boolean).length, 0)
const coverage = {
  triageDead,
  scoutsDispatched: scoutNames.length, scoutsDead,
  rawFindings: raw.length, dedupedFindings: deduped.length, beyondCap: dd?.beyondCapCount ?? 0,
  beyondPanelCap: beyondPanelCap.length, dedupeDead,
  panelCount: judged.filter(j => j.tier === 'panel').length,
  spotCount: judged.filter(j => j.tier === 'spot').length,
  promotedCount: judged.filter(j => j.tier === 'promoted').length,
  judgeCompletionPct: totalSeats ? Math.round(100 * validSeats / totalSeats) : 0,
}

// Reporter — final verdicts + env-aware severity. The script does NOT aggregate: it hands over
// the raw per-seat votes plus a `valid` count, and the reporter applies the ≥2-of-3 arithmetic
// (and may overrule it with cited seat evidence). See reporter-prompt.md Step 1.
// beyond-cap packets carry no votes (never dispatched to a judge) — the reporter lists them
// under their own section by suggestedSeverity; it must not verify or count them as judged.
const packets = [
  ...judged.map(j => ({ ...j, valid: j.votes.filter(Boolean).length })),
  ...beyondPanelCap.map(f => ({ f, votes: [], tier: 'beyond-cap', valid: 0 })),
]
const reporterPrompt = fill(prompts.reporter, {
  '{{PACKETS_JSON}}': JSON.stringify(packets),
  '{{PROFILE}}': profile,
  '{{PRIOR_REPORT}}': priorReport,
  '{{COVERAGE_JSON}}': JSON.stringify(coverage),
  // Report-header facts the reporter cannot derive from packets — supplied, not guessed.
  '{{MODE}}': mode,
  '{{ITERATION}}': `${iteration} of ${config.iterationCap ?? 3}`,
  '{{INPUTS}}': inputs,
})
const rep = await agent(pick(reporterPrompt, 'reporter'), { label:'reporter', phase:'Report', model:model('reporter'), schema:REPORT })

return {
  verdict: rep?.verdict ?? 'clean (low coverage — reporter failed)',
  reportMarkdown: rep?.reportMarkdown ?? '',
  coverage,
}
```

> The Workflow tool's built-in `isolation:'worktree'` is irrelevant here — `super-roast` reads
> and reasons; in both modes it writes nothing to the repo itself (the orchestrator writes
> `reportMarkdown` to the report path after the script returns). Keep it report-only.

## dryRun policy

`dryRun: true` swaps every agent call for a haiku stub returning canned JSON, validating the
**engine topology** — call counts, routing, cap application, coverage-object construction — for
pennies, without touching a real spec/diff or spending opus/sonnet/fable budget.

**What a dryRun can and cannot prove.** It proves what the *script* owns: stage order, which
findings go to a panel vs. a spot check, the spot-check **promotion** rule, the panel/remainder
caps, schemas, and the `coverage` fields. It proves nothing about the **≥2-of-3 confirm
arithmetic** — that lives in the reporter prompt (`./reporter-prompt.md` Step 1), and `pick()`
replaces the reporter with a fixed canned stub on every dryRun, so no dryRun assertion can ever
reach it. The recorded baselines below are evidence of topology, not of verdict correctness; the
reporter's arithmetic is exercised only by a live run.

Required **once at implementation** and **after any structural engine edit**: stage order,
routing, the promotion rule, cap application, schemas, or coverage construction. **Data edits
skip it** — lane rosters, prompt wording, caps, model tiers are trivial by construction and
can't silently break topology.

The orchestrator should pass `args` as an actual JSON value wherever the harness supports it —
the string-tolerance in the engine script exists as a defensive fallback for harness paths that
stringify `args` before invoking the script, not as license to always stringify by default.

**Stub phrasing is exact, not a paraphrase.** Every stub prompt MUST use the literal wording
`You are a stub. Call no tools. Return exactly this JSON as your structured output: <json>`
(see the Stub table below). A shortened variant — e.g. "Return this JSON exactly, nothing
else:" — was tried during Step 1c and cost two wasted runs: haiku answered in prose instead of
invoking the structured-output tool, every stubbed agent call returned nothing, and the dryRun
silently tested the dead-agent/coverage-loss path instead of the intended topology. A malformed
stub doesn't error — it quietly converts any dryRun into an accidental failure-path test, which
can look like a passing run (dead-agent handling *is* exercised) while asserting nothing about
what you actually meant to validate. Use the exact phrasing above, every time.

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
- Since this stub table's dedupe returns only 2 severe findings (1 Blocking + 1 Should-fix),
  well under the default `config.panelCap: 12`, both new coverage fields are non-firing here:
  `coverage.dedupeDead === false` (dedupe returned findings normally) and
  `coverage.beyondPanelCap === 0` (nothing exceeds the cap). Exercising the panel-cap-firing
  and dedupe-dead paths themselves is a separate dryRun (small `panelCap`, a dedupe stub
  returning nothing), not this canonical topology run — see "Additional passing baselines —
  panel cap + dead dedupe" below for those runs and their recorded results.

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
- Both cases use a single-Blocking-finding dedupe stub, so — same as the canonical PR-mode
  dryRun — neither new coverage field fires here: `coverage.dedupeDead === false`,
  `coverage.beyondPanelCap === 0` (1 severe finding, default `config.panelCap: 12`).

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

### Journal evidence for the three recorded runs (session-local — see caveat)

Each `Workflow` run writes a per-agent journal at
`<transcript-root>/<run-id>/journal.jsonl`, one line per agent lifecycle event
(`started`/`result`/etc.); the count of `type:"result"` lines is the durable agent-dispatch
count quoted above. For the session that produced these three runs, `<transcript-root>` was:

```
/Users/alepar/.claude/projects/-Users-alepar-AleCode-superpowers--claude-worktrees-super-roast/47038c17-f0dd-47c6-8516-79df0589c386/subagents/workflows/
```

giving:

| Run | Journal path | `result` lines |
|---|---|---|
| `wf_cbe52959-ff0` (PR-mode baseline) | `<transcript-root>/wf_cbe52959-ff0/journal.jsonl` | 25 |
| `wf_2fab6c5d-dc9` (design, case a) | `<transcript-root>/wf_2fab6c5d-dc9/journal.jsonl` | 12 |
| `wf_f1f77176-482` (design, case b) | `<transcript-root>/wf_f1f77176-482/journal.jsonl` | 13 |

**Caveat — this is session-local evidence, not durable evidence.** `<transcript-root>` lives
under the harness's per-session project directory (keyed by machine path + session ID); it is
not part of the repo, will not exist for someone who clones it, and may be pruned by the harness
over time. The recorded run IDs and figures in this doc are the durable record; the journal
path pattern above is provided so that *while the session that produced a run is still on
disk*, its evidence is locatable and mechanically checkable (`grep -c '"type":"result"'
<path>`), not just asserted in prose. **To re-verify from scratch** (e.g. after the journal is
gone, or to check a doc edit didn't silently change behavior): re-run the dryRun with the exact
`args` recorded for that case (canonical script + stub table above; design-mode args are in
`task-7-report.md`) and compare the returned `coverage` object and agent count against the
figures recorded here — the script and stubs are the reproducible source of truth, the journal
is a point-in-time receipt.

## Additional passing baselines — panel cap + dead dedupe (recorded 2026-07-30)

Recorded alongside (not replacing) the three baselines above. These target the two structural
additions from Step 1b (item 1's dedupe retry/liveness flag, item 3's panel cap) that the
canonical and design-mode baselines above don't exercise, since both used dedupe stubs with
severe-finding counts far under the default `config.panelCap: 12` and a dedupe stub that
returns normally.

**Panel cap fires.** Run `wf_603bf9de-184`, PR mode, `config.panelCap: 1`, dedupe stub
returning 2 Blocking + 0 Nit/FYI findings: **8 agents dispatched, 0 errors** (1 triage + 2
scouts + 1 dedupe + 3 seats + 1 reporter — only 3 seat calls total, confirming a single panel
was dispatched, not two).

Returned `coverage`: `scoutsDispatched: 2, scoutsDead: 0, rawFindings: 1, dedupedFindings: 2,
beyondCap: 0, beyondPanelCap: 1, dedupeDead: false, panelCount: 1, spotCount: 0,
promotedCount: 0, judgeCompletionPct: 100`. Confirms: with 2 severe candidates and
`panelCap: 1`, exactly one full 3-seat panel is dispatched and the second severe candidate
flows through as a beyond-cap packet — `beyondPanelCap === 1` — rather than being dropped.

**Dead dedupe detected.** Runs `wf_26f91db9-a6c` and `wf_810e2d78-f6a` both hit the
dedupe-failure path for real: the dedupe agent failed schema validation on both the initial
call and the retry (a genuine agent failure, not a stub deliberately returning `{findings: []}`
to simulate one). Both runs returned `dedupedFindings: 0, dedupeDead: true, panelCount: 0,
spotCount: 0, judgeCompletionPct: 0`, with `rawFindings > 0` in both — exactly the
`raw.length > 0 && deduped.length === 0` condition item 1's fix targets. This validates the
retry-and-flag behavior against a genuine failure rather than a synthetic one: the retry fired
(both calls failed schema validation, matching `(await one()) ?? (await one())`'s two-attempt
shape), and `dedupeDead` correctly came back `true` — the "never a silent clean" behavior the
fix exists to provide — instead of the pipeline reporting `clean (0 nits)`.

**`{{COVERAGE_JSON}}` — inspection-verified, not execution-verified.** A dryRun structurally
cannot exercise this token: `pick()` swaps the reporter's real, filled `reporterPrompt` for a
fixed canned stub *before* the call, so the filled prompt — the only place `{{COVERAGE_JSON}}`
is substituted — is built but then discarded rather than dispatched; no dryRun assertion can
observe whether the substitution happened correctly. This was verified by reading the engine
instead: the `coverage` object is built strictly before the `agent(...)` dispatch for the
reporter, and the `fill(prompts.reporter, {...})` call includes
`'{{COVERAGE_JSON}}': JSON.stringify(coverage)` alongside the other three tokens. It is
confirmed correct **by code inspection**, and will be exercised for real — with a live fable
reporter actually reading and rendering it — by the PR-mode live run (Step 2).

## Post-review fix wave (2026-07-30) — what the recorded baselines do and don't still cover

The final whole-branch review changed the engine in four places. What that means for everything
recorded above:

- **Token substitution is structurally un-dryRunnable, same as `{{COVERAGE_JSON}}`.** `pick()`
  swaps every real, filled prompt for a canned stub *before* dispatch, so the new
  `prompts.scoutDomainTemplate` → `{{DOMAIN}}` resolution, the scouts' `{{PRIOR_REPORT}}` fill,
  and the reporter's `{{MODE}}`/`{{ITERATION}}`/`{{INPUTS}}` fills are all built-then-discarded
  under `dryRun`. They are **inspection-verified** (the `fill()` calls are in the script above,
  and `scoutPrompt()` returns `null` only when neither a named prompt nor a template exists) and
  are exercised for real only by a live run. This is also precisely why the recorded design-mode
  case (a) passed while real design-mode domain scouts could not be dispatched at all: its
  `domain:queueing` scout resolved through `prompts.stubs['scout:domain:queueing']`, never
  through `prompts.scouts`.
- **Scout-dispatch counts are unchanged.** The new guard sits *after* `pick()`, so under `dryRun`
  every name in the stub table still dispatches — `scoutsDispatched`/`scoutsDead` in all four
  recorded runs stand as written.
- **`coverage.triageDead` is a new field, non-firing in every recorded run** (each used a triage
  stub that returned normally), exactly like `dedupeDead` and `beyondPanelCap` were when first
  added. A firing case needs a triage stub that returns nothing.
- **Not re-dryRun in this wave.** The routing, cap and coverage-construction logic the baselines
  assert on is byte-unchanged; the edits are prompt-resolution and one added coverage field. A
  fresh topology dryRun is still owed before the next structural edit builds on top of these.
- **What was checked instead: a local mock harness** (the script body extracted from this doc and
  run under Node with stub `agent()`/`parallel()` — cheaper than a dryRun and, unlike a dryRun,
  able to see the *filled* prompts because it doesn't call `pick()`'s stub path). Design mode,
  triage returning `['queueing','sharding']`: **7 scouts dispatched** (5 core + both domains),
  `widenLenses` correctly suppressed, `domain:queueing`'s prompt rendered as `You are a queueing
  expert. Prior: <prior report>`, and `{{MODE}}`/`{{ITERATION}}`/`{{INPUTS}}` present in the
  reporter prompt as `design` / `2 of 3` / `spec.md`. Re-run with `scoutDomainTemplate` **absent**:
  **5 dispatched, `scoutsDead: 2`, no exception** — the guard degrades to coverage loss as
  intended. A prior report containing `$&` and `$'` survived substitution byte-intact, confirming
  the function-form `fill()`.

## Accepted / deferred findings from this branch's own live runs

Recorded so the gaps below read as deliberate choices rather than oversights. super-roast's own
design was reviewed by super-roast (`docs/superpowers/reviews/2026-07-30-depth-cap-spec-roast-1.md`,
findings tagged `[super-roast spec]`). Most of its confirmed findings were fixed on this branch —
the dedupe-liveness Blocking, the `{{COVERAGE_JSON}}` Blocking, unbounded judge fan-out
(`config.panelCap`), the beyond-remainder-cap reporting gap, the dead-triage signal, and the
super-plan integration direction. These confirmed findings are **knowingly not fixed**:

| Confirmed finding (design run) | Status | Why |
|---|---|---|
| §6 — floor 3 ("violation of the artifact's own stated core purpose") can't be applied: the reporter never receives the artifact or its stated purpose | **Deferred** | Fixing it means handing the full artifact to the reporter, changing what the gate stage reads and its cost profile. Needs its own design pass, not a patch in a consistency wave. |
| §3 — design-mode `spike` recommendations survive dedupe and the schema, then have no report section | **Deferred** | The data path exists end-to-end (`FINDINGS`/`DEDUPED` both carry `spike`); only the report template lacks a slot. Adding a section is cheap but changes the byte-identical template shared with SKILL.md, so it is queued as its own change. |
| §5 — an under-graded severe finding is spot-checked only by the refute seat, whose job is to kill findings | **Accepted** | The promotion rule (a spot check returning CONFIRM at Blocking/Should-fix escalates to a full panel) is the deliberate mitigation. It is one-sided by construction, and that residual is the price of the tiering. |
| §7 — the 3-iteration cap depends on the caller handing back the prior report; nothing discovers existing `-roast-N.md` files | **Accepted** | `super-plan` owns the loop and its iteration state (see `skills/super-plan/SKILL.md` §Adversarial Review Loop). super-roast stays report-only; `args.iteration` is caller-supplied by contract. |
| §1 — in PR mode the report is written into the working tree, which PR-mode inputs include, so a re-roast can review its own prior report | **Deferred** | Real, but only bites from iteration 2 onward and is avoided in practice by committing the report before re-roasting. A proper fix (excluding `docs/superpowers/reviews/` from PR inputs) belongs with the pre-flight input spec. |
| §1 + §6 — profile inference runs inline in the main session, which on the brainstorming path authored the spec | **Accepted** | Deliberate: the profile is stated in the report header (`profile (assumed):`) precisely so a wrong or biased inference is visible and correctable by re-running, rather than silently applied. |

Any future confirmed finding this branch chooses not to fix belongs in this table, with a reason.

## Step 2 trigger micro-test (frontmatter description, SKILL.md)

Recorded here (rather than only in the implementation report) so a maintainer who edits
`SKILL.md`'s frontmatter `description` knows what to re-check and against which cases. Given
**only** the verbatim frontmatter description string, three fresh haiku probes were asked
"would you invoke this skill? yes/no":

| Scenario | Expected | Result |
|---|---|---|
| "I finished writing a design doc for a new sync service, look it over before I build it" | yes | **yes** |
| "review my branch before I open the PR" | yes | **yes** |
| "can you explain what this function does?" | no | **no** |

**3/3 on the current wording.** If the description is reworded, re-run these same three probes
(or equivalents covering: design-mode trigger, PR-mode trigger, a negative "explain code" case)
before trusting the new wording to trigger correctly.

**Wording history.** The original description appended a workflow summary — "surfaces gaps,
unverified assumptions, and defects, **verifies them with a judge panel**, and reports severity
calibrated to the project's blast radius". That scored 3/3 twice (once during implementation,
once on a fresh coordinator re-run), but `skills/writing-skills/SKILL.md` is explicit that a
description must state **triggering conditions only**, with a documented eval showing agents
follow a description that summarizes workflow *instead of* reading the skill body. The
description was trimmed to triggers alone on 2026-07-30 and the three probes were re-run on
three fresh haiku subagents given only the new string plus one scenario each: **3/3 again**
(yes / yes / no), so the trim cost no discoverability in either mode.
