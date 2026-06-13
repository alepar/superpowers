# roast Workflow (find → verify)

Reference for how `roast` runs an adversarial, evidence-grounded review of a design spec. Use this when `roast` is invoked on a spec. The flow is **find → verify**: a hybrid pool of critics surfaces candidate flaws, then a 3-judge panel independently verifies each one.

**Core principle:** critics and judges are **fresh, isolated agents** that never saw the spec being written — never the author grading its own design. A model reviewing its own work shares its blind spots; independence is what makes the review real.

## Capability selection (never asked)

- **`Workflow` tool available → dynamic workflow (preferred).** Fan out critics, then verify each finding through the judge panel as a `find → verify` pipeline, model-tiered per role.
- **Subagents but no Workflow → manual fan-out.** Dispatch critics in parallel yourself, collect findings, dispatch 3 judges per finding, aggregate.
- **No subagents → inline.** Walk the same steps in one context as a last resort (weakest — you lose independence).

## Key constraint: the script does no I/O

As with any Workflow script, only the orchestration hooks are available (`agent()`, `parallel()`, `pipeline()`, `log()`, `phase()`) — no shell, no filesystem, no web. So **reading the spec, running `deep-research`, and fetching pages all happen inside dispatched agents**. The script only sequences fan-out, the verification pipeline, and the aggregation math.

## Inputs

- The spec path (required).
- Optional caller context: the originating requirements/epic, or what the design must satisfy.

## Step A — Domain triage

Dispatch the domain-triage agent (sonnet) with the spec → 1–3 domain labels (e.g., `distributed-systems`, `auth`, `ml-pipeline`), or `none` for a generic design. Cap at 3. Template: `./domain-triage-prompt.md`.

## Step B — Critic fan-out (parallel)

Dispatch the critic pool, all **sonnet**, each in isolated context, each permitted to invoke `deep-research`/web search. Template: `./critic-prompt.md`.

- **Fixed core lenses (always run):** premortem ("assume it shipped and failed — why?"), completeness/gap (missing requirements, interfaces, NFRs, error/edge cases), simplicity/YAGNI (over-engineering), failure-mode/ops (assume each component fails — blast radius), feasibility/assumptions ("what must be true for this to work?"). Add security and future-maintainer lenses when the design warrants.
- **Dynamic domain experts (1 per triaged domain, ≤3):** each researches that domain's typical failure modes and load-bearing assumptions, then tests the spec against them.

Each critic returns **structured findings**: an explicit list of the design's load-bearing assumptions, then findings each classified **GAP** or **UNVERIFIED-ASSUMPTION** with a spec location and evidence; for unverified assumptions, an importance×uncertainty score and — for high-importance/low-evidence ones — a **recommended spike** (question + cheapest test + kill criteria).

## Step C — Verify (3-judge panel)

For **each** surfaced finding, dispatch **three independent judges** (opus). Template: `./judge-prompt.md`. Each judge returns `CONFIRM <blocker|major|minor>` with justification, or `REJECT` with a reason.

**Grounding rule (enforced in the judge prompt):** a finding that asserts an **external fact** ("library X can't do Y", "won't scale to N", "the default config evicts") must be verified with **actual research/citations** (`deep-research`/web search), not the judge's memory. **Internal/structural** findings ("the spec never says what happens when Z fails") are verified against the spec text.

In a Workflow, run this as a pipeline so a finding is verified as soon as its critic produces it (no barrier between find and verify).

## Step D — Aggregate

- A finding is **confirmed** if **≥2 of 3 judges** confirm it. Its **severity** is the **highest** severity assigned among the confirming judges (a de-risking review rounds up — if one confirmer says major and another minor, it's major).
- **Verdict:** any confirmed **blocker → BLOCK**; else any confirmed **major → REVISE**; else **PASS**.
- **Split → human:** a finding that is *not* confirmed but where a judge called it **blocker or major** (e.g., one blocker, two rejects) is **flagged for human**, not silently dropped. Never average a split away.

## Step E — Report (report-only)

Emit a structured report and stop. `roast` does **not** edit the spec or create tasks; the caller decides.

```
roast verdict: BLOCK | REVISE | PASS
Confirmed findings:
  - [GAP|UNVERIFIED-ASSUMPTION] (severity) <spec location> — <claim> — <evidence/citation>
Recommended spikes (for unverified load-bearing assumptions):
  - Question: … | Cheapest test: … | Kill criteria: …
Unresolved splits (need human): …
```

When invoked from `brainstorming`, REVISE/BLOCK loops back to spec revision before implementation; spikes are surfaced for the user to schedule.

## Annotated Workflow script skeleton

Illustrative — adapt prompts to the spec. `opts.model` is explicit per role: critics sonnet, judges opus. All I/O (spec read, deep-research) happens inside agents.

```javascript
export const meta = {
  name: 'roast-design-review',
  description: 'Adversarially review a design spec: find gaps + unverified load-bearing assumptions, then verify with a 3-judge panel',
  phases: [
    { title: 'Triage' },
    { title: 'Critique' },
    { title: 'Verify' },
    { title: 'Report' },
  ],
}

// args: { specPath, context }
const { specPath, context } = args
const DOMAINS = { type:'object', properties:{ domains:{ type:'array', items:{ type:'string' } } }, required:['domains'] }
const FINDINGS = { type:'object', properties:{ findings:{ type:'array', items:{ type:'object', properties:{
  kind:{enum:['GAP','UNVERIFIED-ASSUMPTION']}, claim:{type:'string'}, location:{type:'string'},
  external:{type:'boolean'}, importance:{type:'string'}, uncertainty:{type:'string'},
  spike:{type:'string'} }, required:['kind','claim','location','external'] } } }, required:['findings'] }
const VERDICT = { type:'object', properties:{ confirm:{type:'boolean'}, severity:{enum:['blocker','major','minor']}, evidence:{type:'string'} }, required:['confirm'] }

phase('Triage')
const triage = await agent(domainTriagePrompt(specPath), { label:'triage', phase:'Triage', model:'sonnet', schema:DOMAINS })
const domains = (triage?.domains ?? []).slice(0, 3)

const CORE = ['premortem','completeness','yagni','failure-mode','feasibility','security','maintainer']
const lenses = [...CORE.map(l => ({type:'lens', name:l})), ...domains.map(d => ({type:'domain', name:d}))]

// find -> verify, no barrier: each critic's findings are judged as soon as they arrive.
phase('Critique')
const perCritic = await pipeline(lenses,
  lens => agent(criticPrompt(specPath, context, lens), { label:`critic:${lens.name}`, phase:'Critique', model:'sonnet', schema:FINDINGS }),
  (res, lens) => parallel((res?.findings ?? []).map(f => () =>
    verifyFinding(f).then(v => ({ ...f, verdict:v }))))
)

phase('Report')
const judged = perCritic.flat().filter(Boolean)
const confirmed = judged.filter(f => f.verdict?.confirmed)
const splits   = judged.filter(f => f.verdict?.split)
const verdict = confirmed.some(f => f.verdict.severity === 'blocker') ? 'BLOCK'
              : confirmed.some(f => f.verdict.severity === 'major')   ? 'REVISE' : 'PASS'
log(`roast: ${verdict} — ${confirmed.length} confirmed, ${splits.length} splits`)
return { verdict, confirmed, splits }

// --- helpers ---
async function verifyFinding(f) {
  phase('Verify')
  const votes = await parallel([0,1,2].map(i => () =>
    agent(judgePrompt(specPath, f, i), { label:`judge${i}:${f.kind}`, phase:'Verify', model:'opus', schema:VERDICT })))
  const ok = votes.filter(Boolean)
  const yes = ok.filter(v => v.confirm)
  const confirmed = yes.length >= 2                              // >=2 of 3
  const severity = highestSeverity(yes)                          // confirmed -> round up among confirmers
  const split = !confirmed && yes.some(v => v.severity === 'blocker' || v.severity === 'major')  // material dissent -> human
  return { confirmed, split, severity, evidence: yes.map(v => v.evidence).filter(Boolean) }
}
```

> The Workflow tool's built-in `isolation:'worktree'` is irrelevant here — `roast` reads and reasons; it writes nothing to the repo. Keep it report-only.
