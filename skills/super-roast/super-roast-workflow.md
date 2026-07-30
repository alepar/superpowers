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
  model-tiered per role.
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
- **No subagents → inline degraded (last resort).** Walk the same steps in one context. This
  is self-review — label the report `independence: none (inline)` so the caller knows the
  verdict is weak.

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
| `seat:reproduce` / `seat:ground` | `CONFIRM Blocking` |
| `seat:refute` | `REJECT` for panel findings; **one spot-checked nit gets `CONFIRM Should-fix`** → exercises promotion |
| `reporter` | fixed `{verdict:"Blocking (1 confirmed)", reportMarkdown:"# stub report", confirmedCount:1, escalations:[]}` |

**Known keying caveat (read before running):** `seat:refute`'s stub key is per **seat name**,
not per finding or call site — the same canned JSON is returned to *every* call to
`seat(f, 'refute')`, whether it's a vote inside a severe panel, the initial spot check on a
Nit/FYI finding, or the follow-up panel a promoted spot check triggers. That's intentional for
the promoted-panel case (its refute vote reusing the spot check's stub is harmless — the
assertion below is call *topology*, not verdict semantics). It is a real risk for the three
independent spot checks: with one invariant stub, a strictly deterministic stub agent would
give all three (not just one) the same `CONFIRM Should-fix` and promote all three. Treat
`promotedCount === 1` as the expected-and-asserted outcome; if an actual run instead promotes
0 or 3, that is a defect to fix **in the pick/seat keying** (e.g., a call-site-qualified stub
key), not a script rewrite — record whichever happens in the report before touching the
script.

## Assertions for the canonical dryRun (mode `pr`, `config.remainderCap: 3`)

- triage: 1 call.
- scouts: 4 calls (3 core-configured + 1 triage-activated `data-migrations`).
- dedupe: 1 call.
- judges: 2 severe panels × 3 seats (6 calls) + 3 spot checks (3 calls) + 1 promotion panel ×
  3 seats (3 calls) = **12 seat calls**.
- reporter: 1 call.
- Return value: `coverage.beyondCap === 2`, `coverage.promotedCount === 1`,
  `coverage.judgeCompletionPct === 100`, `verdict` non-empty.

If any assertion fails, fix the script **in this doc** (this doc's script is canonical) and
re-run before committing the fix.
