# roast Workflow (find → dedup → verify)

Reference for how `roast` runs an adversarial, evidence-grounded review of a design spec. The flow is **find → dedup → verify**: a hybrid pool of critics surfaces candidate flaws, overlapping findings are merged, then a 3-judge panel verifies each distinct finding.

**Core principle:** critics and judges are **fresh, isolated agents** that never saw the spec being written — never the author grading its own design. A model reviewing its own work shares its blind spots; independence is what makes the review real.

**Honest limit (read this):** on Claude Code the critics and judges are mostly the *same model family* (Claude). The research this design is based on (PoLL) attributes a jury's bias reduction to **disjoint model families** — so a same-family panel does **not** deliver independent verification. Persona/rubric variation reduces *some* noise, not correlated blind spots. Therefore: treat "≥2 of 3 judges agree" as **panel agreement, not independent verification**; where the harness offers a **non-Claude judge, use it for at least one of the three**; and never report a verdict as more certain than "a Claude panel agreed." This same-family caveat also means roast catches mainly what Claude already knows to look for — for high-stakes designs, pair it with a human or cross-family review.

## Capability selection (never asked)

This selects the execution *mechanism* automatically (it is not a user prompt); launching the Workflow tool may still surface its own permission.

- **`Workflow` tool available → dynamic workflow (preferred).** Fan out critics, dedup, then verify each distinct finding through the judge panel, model-tiered per role.
- **Subagents but no Workflow → manual fan-out.** Dispatch critics in parallel, collect + dedup findings, dispatch 3 judges per distinct finding, aggregate.
- **No subagents → inline (degraded).** Walk the steps in one context **only as a last resort**. This violates the independence principle (it is self-review), so **label the report `independence: none (inline)`** so the caller knows the verdict is weak.

## Key constraint: the script does no I/O, and agents can't nest

A Workflow script can call only its hooks (`agent()`, `parallel()`, `pipeline()`, `log()`, `phase()`) — no shell, no filesystem, no web. All I/O (reading the spec, web search, fetching pages) happens **inside dispatched agents**.

Critics and judges ground claims with **`WebSearch`/`WebFetch`**, **not** the `deep-research` skill: a dispatched agent generally cannot spawn the sub-agents `deep-research` needs (the same nesting limit documented in the autonomous-implementation design). Plain web search is available to a dispatched general-purpose agent and is sufficient.

## Inputs

- The spec path (required). If the spec spans multiple files, pass all paths.
- Optional caller context: the originating requirements/epic, or what the design must satisfy.
- **Degenerate inputs:** if the spec is empty/near-empty or states no requirements, the completeness lens has no baseline — say so in the report (`coverage: no-requirements-baseline`) rather than emitting a hollow PASS. For a spec larger than a critic's context, critics review by section and the report notes which sections were covered.

## Step A — Domain triage

Dispatch the domain-triage agent (sonnet) with the spec → 1–3 domain labels, leaning toward recall (a missed domain is a silent gap). `none` only for a genuinely generic design. Template: `./domain-triage-prompt.md`. **If triage returns `none`, widen the core lenses** (add security + future-maintainer) rather than running fewer critics.

## Step B — Critic fan-out (parallel)

Dispatch the critic pool, all **sonnet**, each in isolated context, each permitted to use **WebSearch/WebFetch**. Template: `./critic-prompt.md`.

- **Fixed core lenses (always run):** premortem ("assume it shipped and failed — why?"), completeness/gap (missing requirements, interfaces, NFRs, error/edge cases), simplicity/YAGNI (over-engineering), failure-mode/ops (assume each component fails — blast radius), feasibility/assumptions ("what must be true for this to work?"). Add security and future-maintainer lenses when the design warrants (always, if triage said `none`).
- **Dynamic domain experts (1 per triaged domain, ≤3):** each researches that domain's typical failure modes and load-bearing assumptions, then tests the spec against them.

Each critic returns **structured findings**: the design's load-bearing assumptions, then findings each classified **GAP** or **UNVERIFIED-ASSUMPTION** with a spec location, `external` flag, and evidence; for unverified assumptions, an importance×uncertainty score and (high-importance/low-evidence) a **recommended spike** (question + cheapest test + kill criteria).

## Step C — Dedup (barrier)

Overlapping lenses surface the same issue repeatedly (premortem ≈ failure-mode ≈ a domain expert). Before verifying, **collect all critic findings and merge near-duplicates** (same spec location + same root claim) into one finding, keeping the strongest evidence. This is a deliberate barrier — wait for all critics — so each distinct issue is judged once, not N times. Record the pre/post counts in the report.

## Step D — Verify (3-judge panel)

For **each distinct finding**, dispatch **three independent judges** (opus; use a non-Claude judge for one seat if the harness offers it). Template: `./judge-prompt.md`. Each judge returns `CONFIRM <severity>` (with required evidence for external claims), `REJECT`, or `UNVERIFIED`.

**Grounding rule:** an **external-fact** finding ("library X can't do Y", "won't scale to N") must be verified with **WebSearch/WebFetch** and a CONFIRM **requires a resolved citation** (URL + supporting quote); if research is inconclusive the judge returns **UNVERIFIED** (routed to human, not dropped). **Internal/structural** findings are verified against the spec text.

**Judge failure:** the ≥2/3 rule assumes three valid verdicts. If a judge returns nothing, **re-dispatch it once**; if still short of three valid verdicts, do not silently lower the bar — mark the finding `needs human (incomplete panel)`.

**Recall safeguard (counter PASS-by-blindness):** instruct each judge to also report any *new* material issue it would raise that no critic surfaced. New issues go through the same verification next round (or are listed as judge-raised in the report). This is a partial hedge against the structural fact that judges only see what critics found.

## Step E — Aggregate

- **Confirmed** if **≥2 of 3 judges CONFIRM** it.
- **Severity for the verdict = the median severity of the confirming judges** (not the max). Using the median keeps a single alarmist judge from driving the BLOCK/REVISE gate — consistent with the anti-single-judge philosophy. (The max severity is still shown in the report as the most-severe opinion.)
- **Verdict:** any confirmed **blocker → BLOCK**; else any confirmed **major → REVISE**; else **PASS**.
- **Escalate to human (not silently dropped):** any **UNVERIFIED** external finding; any **incomplete panel**; and any *unconfirmed* finding a judge called **blocker/major** (material dissent).
- **Coverage gate (PASS must mean something):** a `PASS` is only valid if the panel actually ran — critics produced output and judges returned verdicts. If critics/judges largely failed, or the spec had no requirements baseline, report **`PASS (low coverage — not a clearance)`**, never a clean PASS. A PASS-by-absence is not a PASS.

## Step F — Report (report-only)

Emit a structured report and stop. `roast` does **not** edit the spec or create tasks; the caller decides.

```
roast verdict: BLOCK | REVISE | PASS | PASS (low coverage)
independence: cross-family | same-family (Claude) | none (inline)
coverage: <N lenses ran>, <M domains>, <findings before→after dedup>, <judge completion %>
Confirmed findings:
  - [GAP|UNVERIFIED-ASSUMPTION] (median severity / max severity) <location> — <claim> — <evidence/citation>
Recommended spikes (unverified load-bearing assumptions):
  - Question: … | Cheapest test: … | Kill criteria: …
Escalations (need human): <UNVERIFIED externals, incomplete panels, material dissent>
Judge-raised (not from critics): …
```

**REVISE vs BLOCK (so the verdict is actionable):** **BLOCK** = do not implement until the blocker findings are resolved or knowingly accepted. **REVISE** = address the major findings in the spec, then proceed (re-roast optional). When invoked from `brainstorming`, both loop back to revision; the difference is that a BLOCK should not be waved through. Cap re-roast at ~2 iterations to avoid thrash; if still BLOCK, escalate to the human.

## Limitations (state these; don't pretend they're solved)

- **Same-family panel** (see top): not independent verification.
- **No calibration loop:** roast's own false-positive/false-negative rate is unmeasured — verdicts are judgement, not measurement.
- **Recall is critic-bound:** the panel can only verify what critics surfaced (the recall safeguard is a partial hedge).
- **Grounding depends on the open web:** claims about internal/proprietary/very-new tech often can't be cited → expect `UNVERIFIED`, which is the honest answer, not a pass.

## Annotated Workflow script skeleton

Illustrative. `opts.model` is explicit per role: critics sonnet, judges opus. All I/O happens inside agents. Phases are conveyed via per-agent `phase:` opts (not a global `phase()` call inside concurrent code, which would race).

```javascript
export const meta = {
  name: 'roast-design-review',
  description: 'Adversarially review a design spec: find gaps + unverified load-bearing assumptions, dedup, then verify with a 3-judge panel',
  phases: [{ title: 'Triage' }, { title: 'Critique' }, { title: 'Verify' }, { title: 'Report' }],
}

const SEV = { blocker: 3, major: 2, minor: 1 }
const { specPath, context } = args
const DOMAINS  = { type:'object', properties:{ domains:{ type:'array', items:{ type:'string' } } }, required:['domains'] }
const FINDINGS = { type:'object', properties:{ findings:{ type:'array', items:{ type:'object', properties:{
  kind:{enum:['GAP','UNVERIFIED-ASSUMPTION']}, claim:{type:'string'}, location:{type:'string'},
  external:{type:'boolean'}, importance:{type:'string'}, uncertainty:{type:'string'}, spike:{type:'string'}
  }, required:['kind','claim','location','external'] } } }, required:['findings'] }
// verdict + severity + evidence all REQUIRED so a missing severity can't silently fall through to PASS.
const VERDICT  = { type:'object', properties:{
  verdict:{enum:['CONFIRM','REJECT','UNVERIFIED']}, severity:{enum:['blocker','major','minor']}, evidence:{type:'string'}
  }, required:['verdict','severity','evidence'] }

const triage  = await agent(domainTriagePrompt(specPath), { label:'triage', phase:'Triage', model:'sonnet', schema:DOMAINS })
const domains = (triage?.domains ?? []).slice(0, 3)
const core    = domains.length ? ['premortem','completeness','yagni','failure-mode','feasibility']
                               : ['premortem','completeness','yagni','failure-mode','feasibility','security','maintainer']
const lenses  = [...core.map(name => ({type:'lens', name})), ...domains.map(name => ({type:'domain', name}))]

// Critique: parallel. Barrier here (await all) so we can dedup before spending judges.
const raw = (await parallel(lenses.map(lens => () =>
  agent(criticPrompt(specPath, context, lens), { label:`critic:${lens.name}`, phase:'Critique', model:'sonnet', schema:FINDINGS }))))
  .filter(Boolean).flatMap(r => r.findings ?? [])
const findings = dedupe(raw)   // merge same location + same root claim; keep strongest evidence

// Verify: parallel per distinct finding; 3 judges each, re-dispatch a failed judge once.
const judged = await parallel(findings.map(f => () => verifyFinding(f)))

const confirmed   = judged.filter(j => j.confirmed)
const escalations = judged.filter(j => j.escalate)
const lowCoverage = raw.length === 0 || judged.some(j => j.incomplete) // critics/judges largely failed
const sev = confirmed.length ? Math.max(...confirmed.map(c => SEV[c.gateSeverity])) : 0
let verdict = sev === 3 ? 'BLOCK' : sev === 2 ? 'REVISE' : 'PASS'
if (verdict === 'PASS' && lowCoverage) verdict = 'PASS (low coverage)'
return { verdict, independence: 'same-family (Claude)', confirmed, escalations,
         coverage: { lenses: lenses.length, beforeDedup: raw.length, afterDedup: findings.length } }

async function verifyFinding(f) {
  let votes = await castPanel(f)
  votes = await redispatchFailures(f, votes)            // re-dispatch a null judge once (F12)
  const valid = votes.filter(Boolean)
  const yes   = valid.filter(v => v.verdict === 'CONFIRM')
  const confirmed = valid.length === 3 && yes.length >= 2
  const sevs = yes.map(v => SEV[v.severity]).sort((a,b) => a - b)
  const gateSeverity = sevs.length ? invSev(sevs[Math.floor((sevs.length - 1) / 2)]) : 'minor' // MEDIAN, not max (F14)
  const maxSeverity  = sevs.length ? invSev(sevs[sevs.length - 1]) : 'minor'
  const escalate = valid.length < 3                                   // incomplete panel
    || valid.some(v => v.verdict === 'UNVERIFIED')                    // unverifiable external
    || (!confirmed && yes.some(v => SEV[v.severity] >= 2))            // material dissent
  return { ...f, confirmed, escalate, incomplete: valid.length < 3, gateSeverity, maxSeverity,
           evidence: yes.map(v => v.evidence).filter(Boolean) }
}
// castPanel / redispatchFailures / dedupe / invSev: dispatch the 3 judges (one non-Claude if available),
// retry a failed seat once, merge duplicate findings, and map the severity rank back to a label.
```

> The Workflow tool's built-in `isolation:'worktree'` is irrelevant here — `roast` reads and reasons; it writes nothing to the repo. Keep it report-only.
