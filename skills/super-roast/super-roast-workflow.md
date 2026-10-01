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
| 2 | Triage | sonnet | 1 | design: domains; PR: conditional-lane activation — spec §2. Runs alongside the core scouts; it only adds scouts |
| 3 | Scouts | opus | 5–8 design / 6–13 PR | high-recall finding — spec §3 |
| 4 | Dedupe | fable | 0–1 | group raw finding ids, suggest severity, rank (the engine assembles merged findings and applies the caps; skipped when there are no raw findings) — spec §4 |
| 5 | Judges | sonnet | 3×severe + 1×nit (+2 per promotion) | seat-differentiated verification — spec §5 |
| 6 | Reporter | fable | 1 | overrules of the engine's default routes (cited seat evidence only), env-aware severity, report file — spec §6 |
| 7 | Handoff | — | — | report → super-design fix loop — spec §7 |

Severity vocabulary throughout (the only one): **Blocking | Should-fix | Nit | FYI**.
`blocker/major/minor` and `BLOCK/REVISE/PASS` do not appear anywhere in this pipeline.

## Capability ladder (never asked — selects the execution mechanism automatically)

- **`Workflow` tool available → dynamic workflow (preferred).** Run the engine script below
  via the tool. Triage → scout fan-out → dedupe → tiered judge panels → reporter, each phase
  model-tiered per role.
- **Subagents but no Workflow → manual fan-out**, same stage order, same prompt files, **same
  bounds** as the engine:
  1. Dispatch the triage subagent (sonnet) and the core scouts (opus) together; when triage
     returns, dispatch the scouts it adds (activated lanes, or domain/widened lenses). Drop a
     lane name with no prompt and record it as an unknown lane (not a dead scout). Count scout
     non-responses as coverage loss (never silently dropped).
  2. If there are raw findings, number them (`id` = position) and dispatch one dedupe subagent
     (fable). It returns groups of ids; assemble the merged findings and split them into severe
     (Blocking/Should-fix) and the remainder by running the engine's own `mergeGroup` and cap
     code under node, not by hand. A raw finding no group claims is kept as a Nit, ranked last.
     `config.remainderCap` (default 50) keeps the first N of the ranked Nit/FYI list and records
     the overflow as `beyondCap`. If dedupe fails twice, pass every raw finding to the reporter
     as a `not-verified:dedupe-failed` packet.
  3. Every severe finding gets the 3-seat panel (reproduce/refute/ground, sonnet) in parallel,
     with `suggestedSeverity` and `previouslyRejected` removed from the finding JSON each seat
     sees — uncapped by default in both modes. Only when `config.panelCap` is set does it apply
     exactly as in the engine: the top `panelCap` severe findings get panels and the rest go to
     the report's "Not verified (beyond panel cap)" section unjudged, never dropped. Re-dispatch
     any seat that returns nothing, once. **Moderation-safe retry:** a seat whose provider
     rejects the dispatch on content-policy grounds (a refusal message, not a null) is
     re-dispatched once with the static-review wording: present the artifact as text to be
     analysed for correctness, drop the adversarial verbs ("break", "attack", "exploit") from
     the seat framing, keep the seat's method and output contract unchanged; a second rejection
     is a dead seat (coverage loss, reported). The engine does the same through the optional
     `prompts.seatsSafe.<seat>` strings. For each remaining finding, dispatch a single
     refute-seat spot check; a spot check that CONFIRMs at Blocking/Should-fix is promoted —
     dispatch the reproduce and ground seats for it and reuse the spot check's verdict as its
     refute vote.
  4. Compute what the engine computes before the reporter — the coverage object (every field
     `{{COVERAGE_JSON}}` carries, including `lowCoverage`, `panelCappedTag`,
     `convergenceEligible`), the coverage line, the seat-agreement line, and each packet's
     `defaultRoute` — by running the engine script's own helpers (`defaultRoute`,
     `seatAgreementLine`, the coverage block) under node over the collected results, not by
     hand. Persist the coverage object next to the report; a manual run without it cannot emit
     the coverage line or the verdict qualifiers, and the caller reads their absence as a clean
     run.
  5. Dispatch one reporter subagent (fable) with the packets, the profile, the coverage values,
     and the prior report (if any); re-dispatch once on failure, then fall back to the engine's
     `fallbackReport` rendering. Apply the engine's `enforce` step to a live report (header
     lines, omitted escalations, preExisting → FYI).
- **No subagents → inline degraded (last resort).** Walk the same steps in one context. This
  is self-review — the independence label is `none (inline)` so the caller knows the verdict
  is weak.

**The independence label is derived from the seats as actually invoked — never a fixed
string.** The orchestrator renders `{{INDEPENDENCE}}` in the reporter prompt from the roster it
dispatched (see "Prompt contract"): `same-family (<family>) — seat-differentiated panel` when
every seat ran on one model family, `cross-family (<families>) — seat-differentiated panel`
when the three seats span families, `none (inline)` for the degraded path. A caller reads
this line to weigh the verdict; a wrong family is a false claim about how independent the
verification was.

**Honest limit:** the three seats differ by *method* (reproduce / refute / ground), which
reduces correlated error but does not deliver family-level independence — a same-family panel
carries fewer effective votes than it has members. Use a seat from a second model family for
one of the three where a harness offers one, and label it so.

**Report header lines, in order:** `verdict:`, `mode:`/`iteration:`, `profile (assumed):`,
`inputs:`, `delta vs prior:` (iterations ≥ 2 only), `coverage:`, `independence:`, and
`seat-agreement:` — a panel-agreement summary (pairwise seat agreement, unanimity,
leave-one-out ground vs. the reproduce/refute pair, and per-seat C/R/U counts) over the
full panel/promoted-tier packets, printed immediately after `independence:` and omitted
entirely when there are none. The engine renders the `coverage:` and `seat-agreement:` lines
and re-applies the coverage-derived verdict qualifiers. The reporter copies the lines verbatim,
and after it returns the engine overwrites the `super-roast verdict:`, `coverage:`,
`independence:` and `seat-agreement:` lines with its own values anyway (inserting any that are
missing), so a miscopied header line cannot reach the caller.

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
substitutes with a small `fill(template, vars)` helper (a single pass over all tokens, so an
inserted value is never re-scanned for later tokens):

| Prompt | Token(s) |
|---|---|
| `prompts.scouts.<name>` | `{{PRIOR_REPORT}}` |
| `prompts.scoutDomainTemplate` | `{{DOMAIN}}`, `{{PRIOR_REPORT}}` |
| `prompts.dedupe` | `{{FINDINGS_JSON}}` (the raw findings, each with an `id` — its position — which the deduper's groups refer to) |
| `prompts.seats.reproduce` / `.refute` / `.ground` | `{{FINDING_JSON}}` (without `suggestedSeverity` / `previouslyRejected` — judges rate blind) |
| `prompts.seatsSafe.<seat>` (optional) | `{{FINDING_JSON}}` — the seat's static-review wording (artifact presented as text to analyse, no adversarial verbs, same method and output contract), used for the one re-dispatch of a seat that returned nothing; absent, the re-dispatch repeats `prompts.seats.<seat>` |
| `prompts.reporter` | `{{PACKETS_JSON}}`, `{{PROFILE}}`, `{{PRIOR_REPORT}}`, `{{COVERAGE_JSON}}`, `{{COVERAGE_LINE}}`, `{{SEAT_AGREEMENT}}`, `{{MODE}}`, `{{ITERATION}}`, `{{INPUTS}}` — plus `{{INDEPENDENCE}}`, which the **orchestrator** renders before the script runs (the script never sees model families; the orchestrator chose them), from the seat roster as actually configured: `same-family (<family>) — seat-differentiated panel`, `cross-family (<families>) — seat-differentiated panel`, or `none (inline)`. Left unrendered, the literal token reaches the report — visibly wrong, which is the intended failure over a silently wrong family. The orchestrator also passes the same rendered string as `args.independence`, which the engine's fallback report uses if the reporter fails (it falls back to reading the rendered prompt only when the arg is absent) |

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
cannot derive from packets: `args.mode`, `args.iteration` rendered as `N of <cap>` for a number
and passed through verbatim otherwise (a caller running a whole-branch roast after its fix
loop's cap tripped passes `post-cap audit`), and `args.inputs` (the spec paths, or
`branch@sha vs base@sha [+dirty]`, or `PR#` string the pre-flight step recorded).

`{{COVERAGE_JSON}}` carries the coverage object the script computes **before** the reporter
call — scout dispatch/dead counts, `unknownLanes`, `domainsDropped`, the raw→deduped funnel,
`dedupeOrphans`, `beyondCap`, `beyondPanelCap`, `dedupeDead`, panel/spot/promoted counts,
`judgeLost`, `spotLost`, and the qualifier inputs `lowCoverage`, `panelCappedTag`,
`convergenceEligible`. Only panel-tier seat losses, a lost judge dispatch, a dead triage, scout
or dedupe set `lowCoverage`; a lost Nit spot check is counted (`spotLost`) and does not. `{{COVERAGE_LINE}}` and `{{SEAT_AGREEMENT}}` are the
engine-rendered header lines (the latter empty when no full panel exists). Each packet in
`{{PACKETS_JSON}}` is `{finding, votes, tier, valid, preExisting, defaultRoute}` (`preExisting`
only on judged packets). `tier` is `panel`, `spot`, `promoted`, `beyond-cap`, `dedupe-failed` or
`judge-lost`. `defaultRoute` is one of `confirmed`, `rejected`, `unverified-nit`,
`not-verified` (beyond the panel cap), `not-verified:dedupe-failed` (dedupe died; the raw finding
passes through unjudged), `not-verified:judge-lost` (its judge dispatch threw),
`not-verified:dead-spot` (its spot check returned nothing twice), `escalate:dead-seat`,
`escalate:external-unverified`, `escalate:unsettled-panel`. Escalate and not-verified routes are
final.

`prompts.triage` carries no tokens — it needs no runtime substitution and is used as a plain
string. Its `lanes` schema is an enum built at runtime from the conditional lane keys in
`prompts.scouts`, so an invented lane is retried by schema validation; a lane that still has no
prompt is logged and recorded in `coverage.unknownLanes`, not counted as a dead scout. A function
anywhere in `args` makes the script unrunnable.

**`config.effort`** (optional, `{role: effort}`) sets the reasoning effort per stage, for the
roles `triage`, `scout`, `dedupe`, `judge` (panel seats), `spot` (spot checks) and `reporter`.
Defaults: triage `low`, spot `medium`, reporter `high`; the rest inherit the session effort.
`dryRun` forces `low` everywhere.

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
const FINDING_PROPS = {
  claim:{type:'string'}, location:{type:'string'}, category:{type:'string'}, external:{type:'boolean'},
  kind:{enum:['GAP','UNVERIFIED-ASSUMPTION','ISSUE']}, evidence:{type:'string'}, spike:{type:'string'},
  previouslyRejected:{type:'boolean'},
}
const FINDINGS = { type:'object', properties:{ findings:{ type:'array', items:{ type:'object', properties:FINDING_PROPS,
  required:['claim','location','category','external','evidence'] } } }, required:['findings'] }
// Dedupe returns groups of raw-finding ids, not rewritten findings; the engine assembles each merged
// finding from its members, so no claim, location or evidence is lost in transcription.
const GROUPS = { type:'object', properties:{ groups:{ type:'array', items:{ type:'object', properties:{
  ids:{ type:'array', items:{ type:'integer' } }, suggestedSeverity:{enum:SEV}, rank:{type:'integer'}, mergedClaim:{type:'string'} },
  required:['ids','suggestedSeverity','rank'] } } }, required:['groups'] }
// verdict + severity + evidence all REQUIRED so a missing field can't slide to clean.
// preExisting (PR mode, refute check e): the defect is real but already on the base branch.
const VERDICT = { type:'object', properties:{ verdict:{enum:['CONFIRM','REJECT','UNVERIFIED']}, severity:{enum:SEV}, evidence:{type:'string'}, preExisting:{type:'boolean'} }, required:['verdict','severity','evidence'] }
const REPORT = { type:'object', properties:{ verdict:{type:'string'}, reportMarkdown:{type:'string'}, confirmedCount:{type:'integer'}, escalations:{type:'array', items:{type:'string'}} }, required:['verdict','reportMarkdown','confirmedCount','escalations'] }

// The harness delivers args as an object on most paths but as a JSON string on some — tolerate
// both, and fail loudly (not with a cryptic destructure error) if the required shape is missing.
const A = typeof args === 'string' ? JSON.parse(args) : args
if (!A || !A.prompts || !A.config) throw new Error('super-roast: args must carry {mode, prompts, config} — got ' + JSON.stringify(A).slice(0, 200))
const { mode, profile, priorReport = '', inputs = '', iteration = 1, dryRun = false, prompts, config, independence } = A
const model = role => dryRun ? 'haiku' : config.models?.[role]
// Mechanical stages run at low effort, the gate at high; the rest inherit the session effort.
const EFFORT = { triage:'low', spot:'medium', reporter:'high' }
const effort = role => dryRun ? 'low' : (config.effort?.[role] ?? EFFORT[role])
const opts = (role, label, phase, schema, modelRole = role) => {
  const o = { label, phase, model:model(modelRole), schema }
  const e = effort(role)
  if (e) o.effort = e
  return o
}
const pick = (real, stubKey) => dryRun ? prompts.stubs[stubKey] : real
// `N of <cap>` for a numbered round; any other value (e.g. `post-cap audit`) passes through verbatim.
const iterationLabel = /^\d+$/.test(String(iteration)) ? `${iteration} of ${config.iterationCap ?? 3}` : String(iteration)
// Single pass over all tokens: a substituted value is never re-scanned, so a prior report or a
// finding that quotes a later token (this skill roasts its own prompt files) stays literal. The
// function replacement keeps `$&`/`$'`/`$1` inside values literal too.
const fill = (template, vars) => {
  const keys = Object.keys(vars)
  if (!keys.length) return template
  const re = new RegExp(keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')
  return template.replace(re, t => String(vars[t] ?? ''))
}
const omit = (o, ...keys) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)))

// Domain scouts are named at runtime from open-ended triage output, so `prompts.scouts[name]`
// can never hold them; they resolve from the single `prompts.scoutDomainTemplate` string. Every
// scout prompt gets {{PRIOR_REPORT}}. An unresolvable name yields null → a dead scout (coverage
// loss), never an exception.
const scoutPrompt = name => {
  const named = prompts.scouts?.[name]
  if (named) return fill(named, { '{{PRIOR_REPORT}}': priorReport })
  if (name.startsWith('domain:') && prompts.scoutDomainTemplate)
    return fill(prompts.scoutDomainTemplate, { '{{DOMAIN}}': name.slice('domain:'.length), '{{PRIOR_REPORT}}': priorReport })
  return null
}
// pick() runs before the guard so dryRun dispatches from the stub table; the guard only fires on
// a real run with an unresolvable name.
const runScout = name => async () => {
  const p = pick(scoutPrompt(name), `scout:${name}`)
  if (!p) return null
  return agent(p, opts('scout', `scout:${name}`, 'Scout', FINDINGS))
}

// Core scouts need nothing from triage, so they start alongside it; triage only adds scouts.
const coreNames = [...new Set(mode === 'design' ? config.coreLenses : config.coreLanes)]
const scoutKnown = name => dryRun ? !!prompts.stubs?.[`scout:${name}`] : !!prompts.scouts?.[name]
const laneKeys = Object.keys(dryRun ? (prompts.stubs ?? {}) : (prompts.scouts ?? {}))
  .map(k => dryRun ? (k.startsWith('scout:') ? k.slice('scout:'.length) : null) : k)
  .filter(k => k && !k.startsWith('domain:') && !coreNames.includes(k))
// The lanes enum comes from the scout prompts actually supplied, so the schema retries an invented
// lane instead of letting it reach dispatch. With no conditional prompts, lanes stay free strings.
const LANES = { type:'object', properties:{
  lanes:{ type:'array', items: laneKeys.length ? { enum: laneKeys } : { type:'string' } },
  domains:{ type:'array', items:{ type:'string' } } }, required:['lanes','domains'] }

const triageP = agent(pick(prompts.triage, 'triage'), opts('triage', 'triage', 'Triage', LANES))
const coreP = parallel(coreNames.map(runScout))
const triage = await triageP
// A dead triage is not a clean triage: the roster collapses to core, and triageDead feeds lowCoverage.
const triageDead = !triage
const domainsAll = [...new Set((triage?.domains ?? []).filter(d => d && d !== 'none'))]
const domains = domainsAll.slice(0, 3)
const domainsDropped = domainsAll.slice(3)
if (domainsDropped.length) log(`triage: ${domainsAll.length} domains, kept 3, dropped ${domainsDropped.join(', ')}`)
let extraNames, unknownLanes = []
if (mode === 'design') {
  extraNames = [...(domains.length ? [] : (config.widenLenses ?? [])), ...domains.map(d => `domain:${d}`)]
} else {
  const lanes = [...new Set(triage?.lanes ?? [])].filter(l => !coreNames.includes(l))
  unknownLanes = lanes.filter(l => !scoutKnown(l))
  if (unknownLanes.length) log(`triage: unknown lane(s) ignored: ${unknownLanes.join(', ')}`)
  extraNames = lanes.filter(l => scoutKnown(l))
}
extraNames = [...new Set(extraNames)].filter(n => !coreNames.includes(n))
const extraResults = await parallel(extraNames.map(runScout))
const coreResults = await coreP
const scoutNames = [...coreNames, ...extraNames]
const scoutResults = [...coreResults, ...extraResults]
const deadScouts = scoutNames.filter((_, i) => !scoutResults[i])
const scoutsDead = deadScouts.length
const raw = scoutResults.filter(Boolean).flatMap(r => r.findings ?? [])
log(`scouts: ${scoutNames.length - scoutsDead}/${scoutNames.length} returned · raw findings ${raw.length}`)

// Dedupe — groups raw findings by id, suggests a severity, ranks. Skipped when there is nothing to
// merge; re-dispatched once on a dead response.
function mergeGroup(g) {
  const members = g.ids.map(i => raw[i])
  const uniq = xs => [...new Set(xs.filter(Boolean))]
  const locations = uniq(members.map(m => m.location))
  const kinds = uniq(members.map(m => m.kind))
  const spikes = uniq(members.map(m => m.spike))
  const f = {
    claim: g.mergedClaim || members[0].claim,
    location: locations.join('; '),
    category: members[0].category,
    external: members.some(m => m.external === true),
    evidence: members.length === 1 ? members[0].evidence : members.map(m => `[${m.location}] ${m.evidence}`).join('\n---\n'),
  }
  if (kinds.length) f.kind = kinds[0]
  if (spikes.length) f.spike = spikes.join('\n')
  if (members.some(m => m.previouslyRejected === true)) f.previouslyRejected = true
  return { ...f, suggestedSeverity: g.suggestedSeverity, rank: g.rank }
}
let dd = null
if (raw.length) {
  const dedupePrompt = fill(prompts.dedupe, { '{{FINDINGS_JSON}}': JSON.stringify(raw.map((f, id) => ({ id, ...f }))) })
  const dedupeOnce = () => agent(pick(dedupePrompt, 'dedupe'), opts('dedupe', 'dedupe', 'Dedupe', GROUPS))
  dd = (await dedupeOnce()) ?? (await dedupeOnce())
}
// Non-empty scout input with no usable dedupe output means dedupe died on both tries.
const dedupeDead = raw.length > 0 && !(dd?.groups?.length)
let deduped = [], dedupeOrphans = 0
if (!dedupeDead && raw.length) {
  const claimed = new Set()
  const groups = []
  for (const g of dd.groups) {
    const ids = [...new Set(g.ids)].filter(i => Number.isInteger(i) && i >= 0 && i < raw.length && !claimed.has(i))
    ids.forEach(i => claimed.add(i))
    if (ids.length) groups.push({ ...g, ids })
  }
  // A raw finding no group claimed is kept, ranked last as a Nit: the spot check and its
  // promotion rule still reach it, so a merge slip never drops a finding.
  const orphans = raw.map((_, i) => i).filter(i => !claimed.has(i))
  dedupeOrphans = orphans.length
  if (orphans.length) log(`dedupe: ${orphans.length} raw finding(s) in no group, kept as Nit: ids ${orphans.join(', ')}`)
  const maxRank = Math.max(0, ...groups.map(g => g.rank))
  orphans.forEach((i, k) => groups.push({ ids: [i], suggestedSeverity: 'Nit', rank: maxRank + 1 + k }))
  deduped = groups.map(mergeGroup).sort((a, b) => a.rank - b.rank).map(f => omit(f, 'rank'))
}

// Caps — both applied here, never by an agent. Remainder cap: the top `remainderCap` of the ranked
// Nit/FYI tail get spot checks; the overflow survives as a count. Panel cap: uncapped by default,
// because an unverified Blocking candidate is not a cleared one; a caller-set `config.panelCap`
// sends the excess to the reporter as 'beyond-cap' packets, listed, never dropped.
const remainderCap = config.remainderCap ?? 50
const panelCap = config.panelCap ?? Infinity
const severeAll = deduped.filter(f => SEVERE.includes(f.suggestedSeverity))
const restAll = deduped.filter(f => !SEVERE.includes(f.suggestedSeverity))
const severe = severeAll.slice(0, panelCap)
const beyondPanelCap = severeAll.slice(panelCap)
const rest = restAll.slice(0, remainderCap)
const beyondCap = restAll.length - rest.length
log(`dedupe: raw ${raw.length} → ${dedupeDead ? 'FAILED (raw passed through unverified)' : `deduped ${deduped.length}`} · panels ${severe.length} · spot checks ${rest.length}` +
  (beyondPanelCap.length ? ` · beyond panel cap ${beyondPanelCap.length}` : '') + (beyondCap ? ` · beyond remainder cap ${beyondCap}` : ''))

// Judges rate blind: the deduper's suggestedSeverity and the scouts' previouslyRejected tag are
// stripped so neither anchors a seat's verdict.
const blind = f => omit(f, 'suggestedSeverity', 'previouslyRejected')

// site: 'panel' | 'spot' — stub keys are call-site qualified (seat:<name>:<site>) so one canned
// value per key stays deterministic. The re-dispatch uses `prompts.seatsSafe[name]` when supplied
// (static-review wording, same method and contract), so a content-policy refusal is not simply
// repeated.
async function seat(f, name, site, idx) {
  const stubKey = `seat:${name}:${site}`
  const vars = { '{{FINDING_JSON}}': JSON.stringify(blind(f)) }
  const first = fill(prompts.seats[name], vars)
  const second = prompts.seatsSafe?.[name] ? fill(prompts.seatsSafe[name], vars) : first
  const label = site === 'spot' ? `spot#${idx}` : `judge:${name}#${idx}`
  const role = site === 'spot' ? 'spot' : 'judge'
  return (await agent(pick(first, stubKey), opts(role, label, 'Judge', VERDICT, 'judge')))
    ?? (await agent(pick(second, stubKey), opts(role, label, 'Judge', VERDICT, 'judge')))
}
// Votes are positional [reproduce, refute, ground]. A promoted panel reuses the spot check's refute
// verdict, so it dispatches only reproduce and ground.
async function panel(f, idx, refuteVote) {
  const promoted = refuteVote !== undefined
  const names = promoted ? ['reproduce', 'ground'] : ['reproduce', 'refute', 'ground']
  const got = await parallel(names.map(n => () => seat(f, n, 'panel', idx)))
  const votes = promoted ? [got[0], refuteVote, got[1]] : got
  return { f, votes, tier: promoted ? 'promoted' : 'panel' }
}
async function spotCheck(f, idx) {
  const v = await seat(f, 'refute', 'spot', idx)
  if (v?.verdict === 'CONFIRM' && SEVERE.includes(v.severity) && !v.preExisting) return panel(f, idx, v)  // under-graded nit → full panel
  return { f, votes: [v], tier: 'spot' }
}
const toJudge = [...severe.map(f => ({ f, kind: 'panel' })), ...rest.map(f => ({ f, kind: 'spot' }))]
const judgedRaw = await parallel(toJudge.map((t, i) => () => t.kind === 'panel' ? panel(t.f, i) : spotCheck(t.f, i)))
// A judge thunk that threw resolves to null; its finding is kept as a 'judge-lost' packet.
const judged = judgedRaw.map((j, i) => j ?? { f: toJudge[i].f, votes: [], tier: 'judge-lost' })
const judgeLost = judged.filter(j => j.tier === 'judge-lost').length
if (judgeLost) log(`judges: ${judgeLost} finding(s) lost their judge dispatch — kept as not-verified`)

// Default route — the mechanical part of each verdict, computed here in precedence order so the
// reporter keeps only the judgment remainder (evidence-cited overrules of confirmed/rejected,
// material dissent, final severity). Escalate and not-verified routes are final. UNVERIFIED is
// neither a pass nor a refutation: a panel with no 2-vote majority escalates, never rejects.
const isPanelTier = p => p.tier === 'panel' || p.tier === 'promoted'
function defaultRoute(p) {
  if (p.tier === 'beyond-cap') return 'not-verified'
  if (p.tier === 'dedupe-failed') return 'not-verified:dedupe-failed'
  if (p.tier === 'judge-lost') return 'not-verified:judge-lost'
  const votes = p.votes.filter(Boolean)
  if (isPanelTier(p) && votes.length < 3) return 'escalate:dead-seat'
  if (p.finding.external && votes.some(v => v.verdict === 'UNVERIFIED')) return 'escalate:external-unverified'
  if (!isPanelTier(p)) return votes.length ? 'unverified-nit' : 'not-verified:dead-spot'
  const count = k => votes.filter(v => v.verdict === k).length
  if (count('CONFIRM') >= 2) return 'confirmed'
  if (count('REJECT') >= 2) return 'rejected'
  return 'escalate:unsettled-panel'
}
// Judged packets drop suggestedSeverity (the reporter starts from seat severities); unjudged
// packets keep it, since it is the only severity they have. preExisting marks a defect a seat
// found already on the base branch: its final severity is FYI, so it never drives a fix round.
const unjudged = (f, tier) => ({ finding: f, votes: [], tier, valid: 0 })
const packets = [
  ...judged.map(j => j.tier === 'judge-lost' ? unjudged(j.f, 'judge-lost')
    : { finding: omit(j.f, 'suggestedSeverity'), votes: j.votes, tier: j.tier, valid: j.votes.filter(Boolean).length, preExisting: j.votes.some(v => v?.preExisting === true) }),
  ...beyondPanelCap.map(f => unjudged(f, 'beyond-cap')),
  ...(dedupeDead ? raw.map(f => unjudged(f, 'dedupe-failed')) : []),
].map(p => ({ ...p, defaultRoute: defaultRoute(p) }))
const routeCounts = packets.reduce((a, p) => ({ ...a, [p.defaultRoute]: (a[p.defaultRoute] ?? 0) + 1 }), {})

// Seat agreement over full panels (panel/promoted tier, all three seats returned), votes
// positional [reproduce, refute, ground]. Empty string when there are none — the line is omitted.
function seatAgreementLine() {
  const full = packets.filter(p => isPanelTier(p) && p.valid === 3).map(p => p.votes.map(v => v.verdict))
  const N = full.length
  if (!N) return ''
  const frac = (k, d) => (Math.round(100 * k / d) / 100).toFixed(2)
  const agree = (i, j) => full.filter(v => v[i] === v[j]).length
  const pair = full.filter(v => v[0] === v[1])
  const loo = pair.length ? `${frac(pair.filter(v => v[2] === v[0]).length, pair.length)} (n=${pair.length})` : 'n/a (n=0)'
  const cru = i => ['CONFIRM','REJECT','UNVERIFIED'].map(k => full.filter(v => v[i] === k).length).join('/')
  const unanimous = full.filter(v => v[0] === v[1] && v[1] === v[2]).length
  return `seat-agreement: panels ${N} · rr ${frac(agree(0,1), N)} · rg ${frac(agree(0,2), N)} · fg ${frac(agree(1,2), N)} · unanimous ${frac(unanimous, N)} · ground-loo ${loo} · reproduce ${cru(0)} · refute ${cru(1)} · ground ${cru(2)}`
}
const seatAgreement = seatAgreementLine()

// Coverage — built before the reporter call so it reaches the reporter via {{COVERAGE_JSON}}.
// Only panel-tier seat losses drive lowCoverage; a lost Nit spot check is reported as a count.
const panelJudged = judged.filter(isPanelTier)
const totalSeats = panelJudged.reduce((a, j) => a + j.votes.length, 0)
const validSeats = panelJudged.reduce((a, j) => a + j.votes.filter(Boolean).length, 0)
const spotLost = judged.filter(j => j.tier === 'spot' && !j.votes[0]).length
const lowCoverage = triageDead || scoutsDead > 0 || dedupeDead || judgeLost > 0 || validSeats < totalSeats
const panelCappedTag = beyondPanelCap.length ? `[panel-capped: ${beyondPanelCap.length} unverified]` : ''
const coverage = {
  triageDead,
  scoutsDispatched: scoutNames.length, scoutsDead, unknownLanes, domainsDropped,
  rawFindings: raw.length, dedupedFindings: deduped.length, dedupeOrphans, beyondCap,
  beyondPanelCap: beyondPanelCap.length, dedupeDead,
  panelCount: judged.filter(j => j.tier === 'panel').length,
  spotCount: judged.filter(j => j.tier === 'spot').length,
  promotedCount: judged.filter(j => j.tier === 'promoted').length,
  judgeLost, spotLost,
  judgeCompletionPct: totalSeats ? Math.round(100 * validSeats / totalSeats) : 0,
  lowCoverage, panelCappedTag,
  convergenceEligible: String(priorReport).trim() !== '' && !lowCoverage && !panelCappedTag,
}
const coverageLine = [
  `coverage: scouts ${scoutNames.length - scoutsDead}/${scoutNames.length} (${scoutNames.join(', ')})${scoutsDead ? ` — dead: ${deadScouts.join(', ')}` : ''}`,
  ...(triageDead ? ['triage failed (core roster only)'] : []),
  ...(unknownLanes.length ? [`unknown lanes ignored: ${unknownLanes.join(', ')}`] : []),
  ...(domainsDropped.length ? [`domains dropped: ${domainsDropped.join(', ')}`] : []),
  `raw ${raw.length} → deduped ${deduped.length}${dedupeDead ? ` (dedupe failed — ${raw.length} raw unverified)` : ''} → panel ${coverage.panelCount} · spot ${coverage.spotCount} · promoted ${coverage.promotedCount}${beyondPanelCap.length ? ` · beyond panel cap ${beyondPanelCap.length}` : ''}${judgeLost ? ` · judge lost ${judgeLost}` : ''}`,
  `judge completion ${totalSeats ? coverage.judgeCompletionPct + '%' : 'n/a (no panels)'}${spotLost ? ` (spot checks lost ${spotLost})` : ''}`,
  `remainder-capped: ${beyondCap}`,
].join(' · ')

// Verdict qualifiers are re-applied to whatever the reporter returns, so a missed or spurious
// qualifier can't make a degraded round read clean or converged.
function qualify(verdict, allowConverged) {
  const v = String(verdict ?? '').replace(/^super-roast verdict:\s*/, '')
  const base = v.replace(/\s*\[(low coverage|panel-capped[^\]]*|converged)\]/g, '').trim()
  const low = lowCoverage || v.includes('[low coverage]')
  const converged = allowConverged && v.includes('[converged]') && coverage.convergenceEligible && !low
  return [base, low && '[low coverage]', panelCappedTag, converged && '[converged]'].filter(Boolean).join(' ')
}

// Reporter — final placement, env-aware severity, report markdown. Re-dispatched once on failure.
const reporterPrompt = fill(prompts.reporter, {
  '{{PACKETS_JSON}}': JSON.stringify(packets),
  '{{PROFILE}}': profile,
  '{{PRIOR_REPORT}}': priorReport,
  '{{COVERAGE_JSON}}': JSON.stringify(coverage),
  '{{COVERAGE_LINE}}': coverageLine,
  '{{SEAT_AGREEMENT}}': seatAgreement,
  // Report-header facts the reporter cannot derive from packets — supplied, not guessed.
  '{{MODE}}': mode,
  '{{ITERATION}}': iterationLabel,
  '{{INPUTS}}': inputs,
})
const reporterOnce = () => agent(pick(reporterPrompt, 'reporter'), opts('reporter', 'reporter', 'Report', REPORT))
const rep = (await reporterOnce()) ?? (await reporterOnce())

const indepRaw = independence ?? (String(prompts.reporter).match(/^independence: (.+)$/m) ?? [])[1]
const indep = indepRaw && !indepRaw.includes('{{') ? indepRaw : undefined   // an unrendered token is not a roster
const escalationLine = p => `${p.finding.location} — ${p.finding.claim} (${p.defaultRoute.slice('escalate:'.length)})`
const engineEscalated = packets.filter(p => p.defaultRoute.startsWith('escalate:'))
const pipelineLossLine = p => `- [${p.finding.suggestedSeverity ? `suggested ${p.finding.suggestedSeverity}` : 'unrated'}] ${p.finding.location} — ${p.finding.claim} (${p.defaultRoute === 'not-verified:judge-lost' ? 'judge lost' : 'dedupe failed'})`

// Reporter dead on both tries: render a minimal report from the default routes instead of
// returning an empty one. Always [low coverage]; seat severities, no profile conditioning.
function fallbackReport() {
  const of = r => packets.filter(p => p.defaultRoute === r)
  const seatSev = p => p.preExisting ? 'FYI' : SEV[Math.min(...p.votes.filter(v => v?.verdict === 'CONFIRM').map(v => SEV.indexOf(v.severity)))]
  const confirmed = of('confirmed'), nits = of('unverified-nit'), lostSpots = of('not-verified:dead-spot')
  const top = confirmed.length ? SEV[Math.min(...confirmed.map(p => SEV.indexOf(seatSev(p))))] : null
  const verdict = qualify(`${top ? `${top} (${confirmed.length} confirmed)` : `clean (${nits.length} nits)`} [low coverage]`, false)
  const line = (p, sev) => `- [${sev}] ${p.finding.location} — ${p.finding.claim}`
  const section = (heading, lines) => ['', heading, ...(lines.length ? lines : ['- none'])]
  const escalations = engineEscalated.map(escalationLine)
  const reportMarkdown = [
    `super-roast verdict: ${verdict}`,
    `mode: ${mode}        iteration: ${iterationLabel}`,
    `profile (assumed): ${profile ?? 'not supplied'} — NOT applied: the reporter failed; severities are raw seat severities and routes are the engine defaults`,
    `inputs: ${inputs || 'not supplied'}`,
    coverageLine,
    `independence: ${indep ?? 'unknown — reporter failed'}`,
    ...(seatAgreement ? [seatAgreement] : []),
    ...section('## Confirmed findings', confirmed.map(p => line(p, seatSev(p)))),
    ...section('## Not verified (beyond panel cap)', of('not-verified').map(p => line(p, `suggested ${p.finding.suggestedSeverity}`))),
    ...section('## Not verified (dedupe failed or judge lost)', [...of('not-verified:dedupe-failed'), ...of('not-verified:judge-lost')].map(pipelineLossLine)),
    ...section('## Beyond remainder cap (count only)', beyondCap ? [`- ${beyondCap} candidates dropped by the remainder cap — raise config.remainderCap and re-run to see them`] : []),
    ...section('## Rejected (with reason)', of('rejected').map(p => `${line(p, 'rejected')} — 2-of-3 REJECT`)),
    ...section('## Unverified nits (spot-checked)', [...nits.map(p => line(p, 'Nit/FYI')), ...lostSpots.map(p => `${line(p, 'Nit/FYI')} (spot check lost)`)]),
    ...section('## Escalations (need human)', escalations.map(e => `- ${e}`)),
  ].join('\n')
  return { verdict, reportMarkdown, confirmedCount: confirmed.length, escalations }
}

// Live reporter output: the engine's facts win. Header lines are overwritten with engine values,
// escalate routes the reporter left out are added back, and a preExisting finding placed above
// FYI is rewritten to FYI (with the verdict's severity recomputed from the Confirmed section).
const enforcement = []
function enforce(rep) {
  let verdict = qualify(rep.verdict, true)
  let lines = String(rep.reportMarkdown ?? '').split('\n')
  // preExisting → FYI, matched on the `- [SEV] <location> — ` entry line.
  let rewrote = 0
  for (const p of packets.filter(p => p.preExisting)) {
    const re = new RegExp(`^(\\s*- )\\[(Blocking|Should-fix|Nit)\\] (${p.finding.location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} — )`)
    lines = lines.map(l => re.test(l) ? (rewrote++, l.replace(re, '$1[FYI] $3')) : l)
  }
  if (rewrote) {
    enforcement.push(`preExisting: ${rewrote} entr${rewrote === 1 ? 'y' : 'ies'} rewritten to FYI`)
    const start = lines.findIndex(l => l.startsWith('## Confirmed findings'))
    const end = start < 0 ? -1 : lines.findIndex((l, i) => i > start && l.startsWith('## '))
    const sevs = start < 0 ? [] : lines.slice(start + 1, end < 0 ? undefined : end)
      .map(l => (l.match(/^\s*- \[(Blocking|Should-fix|Nit|FYI)\]/) ?? [])[1]).filter(Boolean)
    const top = sevs.length ? SEV[Math.min(...sevs.map(s => SEV.indexOf(s)))] : null
    if (top) verdict = verdict.replace(/^(Blocking|Should-fix|Nit|FYI)(?= \()/, top)
  }
  // Header lines live above the first `## ` section.
  const headEnd = () => { const i = lines.findIndex(l => l.startsWith('## ')); return i < 0 ? lines.length : i }
  const find = key => lines.slice(0, headEnd()).findIndex(l => l.startsWith(key))
  const put = (key, value, after) => {
    const i = find(key)
    if (value === null) { if (i >= 0) lines.splice(i, 1); return }
    if (i >= 0) { if (lines[i] !== value) enforcement.push(`header: ${key} overwritten`); lines[i] = value; return }
    const anchors = after.map(find).filter(j => j >= 0)
    lines.splice(anchors.length ? Math.max(...anchors) + 1 : 0, 0, value)
    enforcement.push(`header: ${key} inserted`)
  }
  put('super-roast verdict:', `super-roast verdict: ${verdict}`, [])
  put('coverage:', coverageLine, ['super-roast verdict:', 'mode:', 'profile (assumed):', 'inputs:', 'delta vs prior:'])
  if (indep) put('independence:', `independence: ${indep}`, ['coverage:'])
  put('seat-agreement:', seatAgreement || null, ['independence:', 'coverage:'])
  // Escalate routes are final: any the reporter omitted are appended.
  const escalations = [...(rep.escalations ?? [])]
  const missing = engineEscalated.filter(p => !escalations.some(e => e.includes(p.finding.location)))
  if (missing.length) {
    escalations.push(...missing.map(escalationLine))
    lines.push('', '## Escalations the reporter omitted (engine-added — escalate routes are final)', ...missing.map(p => `- ${escalationLine(p)}`))
    enforcement.push(`escalations: ${missing.length} engine-added`)
  }
  const confirmedRoutes = packets.filter(p => p.defaultRoute === 'confirmed').length
  if (rep.confirmedCount !== confirmedRoutes)
    enforcement.push(`confirmedCount ${rep.confirmedCount} vs ${confirmedRoutes} confirmed default routes (overrules account for the gap)`)
  enforcement.forEach(e => log(`reporter enforcement: ${e}`))
  return { verdict, reportMarkdown: lines.join('\n'), confirmedCount: rep.confirmedCount, escalations }
}

const out = rep ? enforce(rep) : fallbackReport()
return {
  verdict: out.verdict,
  reportMarkdown: out.reportMarkdown,
  confirmedCount: out.confirmedCount,
  escalations: out.escalations,
  reporterFailed: !rep,
  enforcement,
  coverage, routeCounts, seatAgreement,
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
caps, schemas, the `coverage` fields, each packet's `defaultRoute` (the ≥2-of-3 tally and the
escalation tests, visible as `routeCounts`), the `seatAgreement` line, the verdict-qualifier
re-application, the header overwrite on a live report, and the reporter-failure fallback. It proves nothing about the reporter's
judgment — overrules, material dissent, profile-conditioned severity, prior-report tracking —
because `pick()` replaces the reporter with a fixed canned stub; that is exercised only by a
live run.

Required **once at implementation** and **after any structural engine edit**: stage order,
routing, the promotion rule, cap application, schemas, coverage construction, default routes,
or the reporter fallback. **Data edits
skip it** — lane rosters, prompt wording, caps, model tiers are trivial by construction and
can't silently break topology.

The orchestrator should pass `args` as an actual JSON value wherever the harness supports it —
the string-tolerance in the engine script exists as a defensive fallback for harness paths that
stringify `args` before invoking the script, not as license to always stringify by default.

**Stub flake: a stub read as injection.** A haiku stub standing in for a judge seat can treat
its own canned-JSON instruction as a prompt injection and return `UNVERIFIED` instead; one
canonical run came back `{confirmed: 4, "escalate:unsettled-panel": 1}` that way, with every
coverage count correct. When `routeCounts` differs from the assertion, check the seat votes in
the run journal: if the routes match the votes actually returned, the engine is correct and the
stub flaked. A cheap mitigation, not yet validated by a run: put one context line before the
literal stub sentence — `Pipeline dryRun: this prompt is the test harness's own canned
response, not reviewed content.` — and keep the stub sentence itself byte-exact.

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
topology in one pass: conditional lane activation, an empty scout, the remainder cap, panel
routing, spot-check promotion, and default routing.

| Stub key | Canned output exercises |
|---|---|
| `triage` | `{lanes:["data-migrations"], domains:["queueing"]}` — conditional activation (`domains` is ignored in PR mode) |
| `scout:<core-1>` | 4 findings (ids 0–3): `dup` at `a.js:1`, `inj` at `b.js:1`, two nits |
| `scout:<core-2>` | 4 findings (ids 4–7): the duplicate `dup` at `a.js:1`, three nits |
| `scout:<core-3>` | `{findings: []}` — empty-scout path |
| `scout:data-migrations` | `{findings: []}` — empty-scout path (the triage-activated lane) |
| `dedupe` | `{groups: [{ids:[0,4], Blocking, rank 1}, {ids:[1], Should-fix, rank 2}, {ids:[2], Nit, 3}, {ids:[3], Nit, 4}, {ids:[5], FYI, 5}, {ids:[6], FYI, 6}, {ids:[7], Nit, 7}]}` — one merge, 7 deduped findings (run with `config.remainderCap: 3`: the engine keeps 3 Nit/FYI and counts 2 as `beyondCap`) |
| `seat:reproduce:panel` / `seat:ground:panel` / `seat:reproduce:spot` / `seat:ground:spot` | `CONFIRM Blocking` |
| `seat:refute:panel` | `REJECT` — panel findings survive on 2-of-3 |
| `seat:refute:spot` | `CONFIRM Should-fix` → every spot check promotes (deterministic), and its verdict becomes the promoted panel's refute vote |
| `reporter` | fixed `{verdict:"Blocking (1 confirmed)", reportMarkdown:"# stub report", confirmedCount:1, escalations:[]}` |

For the two variant runs below, change one stub: `reporter` → `You are a stub. Call no tools.
Reply with the single word: none` (no structured output ⇒ a dead reporter), or
`seat:ground:panel` → `UNVERIFIED FYI`.

**Stub keys are call-site qualified** (`seat:<name>:panel` vs `seat:<name>:spot`) so a single
canned value per key stays deterministic: no one stub could answer both a panel `REJECT` and a
spot `CONFIRM Should-fix`. Agent labels carry the packet index (`judge:<seat>#<idx>`,
`spot#<idx>`) so the progress view and the journal map back to findings; the stub key does not
depend on the label.

## Assertions for the canonical dryRun (mode `pr`, `config.remainderCap: 3`)

- triage: 1 call, dispatched concurrently with the 3 core scouts.
- scouts: 4 calls (3 core-configured + 1 triage-activated `data-migrations`).
- dedupe: 1 call.
- judges: 2 severe panels × 3 seats (6 calls) + 3 spot checks (3 calls) + 3 promotion panels ×
  2 seats (6 calls — reproduce and ground; the spot verdict is the refute vote) = **15 seat
  calls**.
- reporter: 1 call. **22 agents total.**
- Return value: `coverage.rawFindings === 8`, `coverage.dedupedFindings === 7`,
  `coverage.beyondCap === 2`, `coverage.promotedCount === 3`, `coverage.judgeCompletionPct ===
  100`, `coverage.lowCoverage === false`, `reporterFailed === false`,
  `verdict === "Blocking (1 confirmed)"` (no qualifier re-applied),
  `routeCounts` deep-equals `{confirmed: 5}`, and `seatAgreement === "seat-agreement: panels 5 ·
  rr 0.60 · rg 1.00 · fg 0.60 · unanimous 0.60 · ground-loo 1.00 (n=3) · reproduce 5/0/0 ·
  refute 3/2/0 · ground 5/0/0"` (one line). `reportMarkdown` is the stub's `# stub report` with
  the engine's verdict, `coverage:`, `independence:` and `seat-agreement:` header lines inserted.
- **Dead-reporter variant:** 23 agents (reporter dispatched twice), `reporterFailed === true`,
  `verdict === "Blocking (5 confirmed) [low coverage]"`, `reportMarkdown` starts with
  `super-roast verdict: Blocking (5 confirmed) [low coverage]` and carries every report heading.
- **Unsettled-panel variant** (`seat:ground:panel` UNVERIFIED): 22 agents, `routeCounts`
  deep-equals `{"escalate:unsettled-panel": 2, confirmed: 3}` — the two severe panels
  (CONFIRM · REJECT · UNVERIFIED) reach no 2-vote majority and none lands in `rejected`; the
  promoted panels (CONFIRM · reused CONFIRM · UNVERIFIED) confirm. `escalations` carries the
  2 escalations the stub reporter omitted, engine-added.
- `coverage.dedupeDead === false` and `coverage.beyondPanelCap === 0` here: the panel-cap,
  dead-dedupe, unknown-lane, lost-judge, dead-spot, empty-raw and reporter-enforcement paths are
  exercised by the local mock harness (below), not by this topology run.

If any assertion fails, fix the script **in this doc** (this doc's script is canonical) and
re-run before committing the fix.

### Local mock harness (failure paths)

A dryRun spends one haiku call per agent and can only reach a failure path through a stub that
returns nothing. The cheaper check for structural edits is to extract the script from this doc
and run it under node with a stub `agent()` and a `parallel()` that, like the runtime, turns a
throwing thunk into `null`. Unlike a dryRun it can also see the filled prompts. The cases it
should cover, beyond the canonical topology and the two variants above:

| Case | Setup | Expect |
|---|---|---|
| dead dedupe | dedupe returns nothing | dedupe dispatched twice; `routeCounts` `{"not-verified:dedupe-failed": 8}`; `[low coverage]` |
| unknown lane | triage adds `bogus` (no prompt) | `coverage.unknownLanes` `["bogus"]`, `scoutsDead` 0, a log line |
| lost judge | the `spot#3` dispatch throws | `routeCounts["not-verified:judge-lost"]` 1, `judgeLost` 1, `lowCoverage` true |
| dead spot checks | `seat:refute:spot` returns nothing | 3 × `not-verified:dead-spot`, `spotLost` 3, `lowCoverage` false |
| empty raw | every scout returns `[]` | no dedupe call, 6 agents |
| dedupe orphans | groups claim only ids 0, 1, 4 (plus an out-of-range id) | `dedupeOrphans` 5, `dedupedFindings` 7 |
| reporter enforcement | refute seats CONFIRM with `preExisting`; reporter returns a made-up `coverage:` line and Blocking entries | entries rewritten to `[FYI]`, verdict severity recomputed, header lines overwritten, `enforcement` non-empty |
| real path | `dryRun: false`, `prompts.seatsSafe`, first seat dispatch returns null | retry uses the safe wording; seat prompt has no `suggestedSeverity`; dedupe prompt carries numbered ids; effort `low`/`medium`/`high` on triage/spot/reporter; lanes enum from `prompts.scouts` |
| design domains | triage returns `q, q, r, s, t` | 3 domain scouts (Set-deduped), `domainsDropped` `["t"]`, no widening; dryRun effort `low` on every call |
| triage overlap | triage resolves only after a core scout is dispatched | core scouts dispatched before the activated lane |

### Passing baseline (recorded, not illustrative)

> **Superseded:** recorded against an earlier engine (deduper returned rewritten findings and applied its own cap, reporter did the routing, promotion re-ran the refute seat); a fresh run against the assertions above is owed.

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
  `coverage.beyondPanelCap === 0` (1 severe finding, no `config.panelCap`).

### Passing baseline (recorded, not illustrative)

> **Superseded 2026-09-29:** recorded against the earlier engine; the scout-roster logic these runs assert on is unchanged, but the agent counts predate the reporter retry.

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

> **Superseded 2026-09-29:** recorded against the earlier engine (the dead-dedupe runs predate the reporter fallback, which now renders a report for them); re-run owed.

Recorded alongside (not replacing) the three baselines above. These target the dedupe
retry/liveness flag and the panel cap, which the canonical and design-mode baselines above
don't exercise.

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
  **`scoutsDispatched: 7`, `scoutsDead: 2`, no exception** — `scoutsDispatched` counts scout
  *names*, not survivors, so the two unresolvable domain scouts appear in both figures; the
  guard degrades to coverage loss as intended, and `scoutsDead > 0` feeds the `[low coverage]`
  qualifier. A prior report containing `$&` and `$'` survived substitution byte-intact, confirming
  the function-form `fill()`.

## Accepted / deferred findings from this branch's own live runs

Recorded so the gaps below read as deliberate choices rather than oversights. super-roast's own
design was reviewed by super-roast (`docs/superpowers/reviews/2026-07-30-depth-cap-spec-roast-1.md`,
findings tagged `[super-roast spec]`). Most of its confirmed findings were fixed on this branch —
the dedupe-liveness Blocking, the `{{COVERAGE_JSON}}` Blocking, unbounded judge fan-out
(`config.panelCap`), the beyond-remainder-cap reporting gap, the dead-triage signal, and the
super-design integration direction. These confirmed findings are **knowingly not fixed**:

| Confirmed finding (design run) | Status | Why |
|---|---|---|
| §6 — floor 3 ("violation of the artifact's own stated core purpose") can't be applied: the reporter never receives the artifact or its stated purpose | **Deferred** | Fixing it means handing the full artifact to the reporter, changing what the gate stage reads and its cost profile. Needs its own design pass, not a patch in a consistency wave. |
| §3 — design-mode `spike` recommendations survive dedupe and the schema, then have no report section | **Deferred** | The data path exists end-to-end (`FINDINGS` carries `spike` and the engine's group merge keeps it); only the report template lacks a slot. Adding a section is cheap but changes the byte-identical template shared with SKILL.md, so it is queued as its own change. |
| §5 — an under-graded severe finding is spot-checked only by the refute seat, whose job is to kill findings | **Accepted** | The promotion rule (a spot check returning CONFIRM at Blocking/Should-fix escalates to a full panel) is the deliberate mitigation. It is one-sided by construction, and that residual is the price of the tiering. |
| §7 — the 3-iteration cap depends on the caller handing back the prior report; nothing discovers existing `-roast-N.md` files | **Accepted** | `super-design` owns the loop and its iteration state (see `skills/super-design/SKILL.md` §Adversarial Review Loop). super-roast stays report-only; `args.iteration` is caller-supplied by contract. |
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
