# roast Depth-Capped Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `depth` setting to `roast` that caps how many distinct findings reach the 3-judge panel, promoting dedup to an LLM agent that grades blast radius and ranks, while listing (never dropping) below-cap findings.

**Architecture:** Three skill-content files change. A new `dedup-rank-prompt.md` defines the agent that merges + grades + ranks findings. `roast-workflow.md` gains depth-level definitions, the cap/blocker-bypass logic in verify, the new report fields, and an updated script skeleton. `SKILL.md` documents the depth levels, the dedup-and-rank role, the model tier, and the new output format. Because these files are behavior-shaping content (not code), validation is consistency re-reads plus adversarial pressure-testing via `superpowers:writing-skills` — there are no unit tests.

**Tech Stack:** Markdown skill content for the `roast` skill; the Workflow tool's `agent()`/`parallel()`/`pipeline()` hooks (JavaScript skeleton, illustrative only).

**Spec:** `docs/superpowers/specs/2026-06-16-roast-depth-capped-verification-design.md`

---

## File Structure

- **Create** `skills/roast/dedup-rank-prompt.md` — prompt template for the single dedup-and-rank agent (merge near-dupes, grade blast-radius severity, rank, emit ordered list). Mirrors the existing per-role prompt files.
- **Modify** `skills/roast/roast-workflow.md` — add depth levels + detection (new subsection), rewrite Step C (dedup → dedup-and-rank agent), Step D (cap + blocker bypass), Step F (report format), and the script skeleton.
- **Modify** `skills/roast/SKILL.md` — add depth to The Process / a Depth subsection, update Output Format, update Model Tiering with the dedup-and-rank tier.

Tasks 1–3 touch disjoint files except that Task 3 references names defined in Tasks 1–2, so run them in order. Task 4 validates the whole set.

---

### Task 1: Create the dedup-and-rank agent prompt

**Files:**
- Create: `skills/roast/dedup-rank-prompt.md`

- [ ] **Step 1: Write the prompt file**

Create `skills/roast/dedup-rank-prompt.md` with exactly this content (matches the house style of `critic-prompt.md` / `judge-prompt.md`):

````markdown
# Dedup-and-Rank Subagent Prompt Template

Use this template for the single `roast` dedup-and-rank agent that runs between the
critics and the judges. **Model: sonnet.** It merges overlapping critic findings,
grades each merged finding's blast radius, and ranks them so the depth cap can select
the top-X to verify. This grade is **triage only** — it is NOT the gate severity (the
judges still set that). Runs once, in isolated context, over the full pooled finding set.

```
Task tool (general-purpose), model: sonnet:
  description: "roast dedup-and-rank: [spec name]"
  prompt: |
    You receive the pooled findings from several adversarial design critics. Overlapping
    lenses surface the same issue repeatedly. Your job: merge duplicates, grade each
    distinct finding's blast radius, and rank them. You do NOT judge whether a finding is
    true — that is the judges' job. Do not add new findings or drop any distinct issue.

    ## Findings (pooled from all critics)
    [FINDINGS_JSON]

    ## Step 1 — Merge
    Combine near-duplicates: findings with the **same spec location AND the same root
    claim** are one finding. Keep the strongest/most-specific evidence and the union of
    spec locations. Preserve each finding's kind (GAP | UNVERIFIED-ASSUMPTION),
    `external` flag, and any `spike`. Different root claims at the same location are NOT
    duplicates — keep them separate.

    ## Step 2 — Grade blast radius (triage severity)
    For each merged finding, answer "**if this is true, how bad is it?**" — independent of
    how likely it is to be confirmed:
    - **blocker:** if unaddressed, the implementation is likely to be wrong, lose data, or
      fail its core purpose.
    - **major:** significant risk or rework, but not fatal to the core.
    - **minor:** real but low-impact.
    This is a fast triage estimate so the cap spends judges on what matters most. The
    judges re-grade independently; your grade does not bind them.

    ## Step 3 — Rank
    Sort findings by graded severity descending (blocker > major > minor); within a tier,
    UNVERIFIED-ASSUMPTION with a recommended spike ranks above a plain finding. Assign a
    stable 1-based rank.

    ## Output contract (structured)
    Return the ordered list. Each finding:
    - **rank:** 1-based integer
    - **kind:** GAP | UNVERIFIED-ASSUMPTION
    - **claim:** one sentence
    - **location:** section/quote or "absent"
    - **external:** true | false
    - **gradedSeverity:** blocker | major | minor
    - **spike:** (carry through if present)

    Report every distinct finding — the caller, not you, decides where the depth cap falls.
```
````

- [ ] **Step 2: Verify house-style consistency**

Run: `head -5 skills/roast/dedup-rank-prompt.md && grep -n "Model: sonnet" skills/roast/dedup-rank-prompt.md`
Expected: the title line `# Dedup-and-Rank Subagent Prompt Template` and a `**Model: sonnet.**` match — consistent with `domain-triage-prompt.md` and `judge-prompt.md`.

- [ ] **Step 3: Commit**

```bash
git add skills/roast/dedup-rank-prompt.md
git commit -m "feat(roast): add dedup-and-rank agent prompt"
```

---

### Task 2: Update roast-workflow.md (depth, dedup-and-rank, cap, report, skeleton)

**Files:**
- Modify: `skills/roast/roast-workflow.md`

- [ ] **Step 1: Add a "Depth (verification cap)" subsection after Inputs**

Insert this new section immediately after the `## Inputs` block (before `## Step A — Domain triage`):

```markdown
## Depth (verification cap)

`depth` caps how many **distinct (post-dedup) findings** are sent to the 3-judge panel —
judges are the dominant cost, so this bounds it. Detected from the invocation's natural
language; **no new syntax**.

| Level | Cap | Trigger phrasing |
|---|---|---|
| shallow | 5 | "quick roast", "shallow roast" |
| **medium** | **10** | plain "roast" (**default**) |
| deep | 20 | "deep roast", "thorough roast" |
| unlimited | ∞ | "exhaustive roast", "full roast" |

- Ambiguous phrasing, and **every auto-invocation as the `brainstorming` gate**, resolve
  to **medium**.
- Findings ranked **below** the cap are **not dropped** — they are listed in the report as
  un-verified (Step F), preserving the skill's no-silent-drop principle.
- **Blocker bypass:** a finding the dedup-and-rank agent grades `blocker` is verified even
  if it ranks past the cap, so the cheap path never leaves a potential blocker un-verified.
```

- [ ] **Step 2: Rewrite Step C as dedup-and-rank (agent, not code)**

Replace the entire `## Step C — Dedup (barrier)` section with:

```markdown
## Step C — Dedup-and-rank (barrier, one agent)

Overlapping lenses surface the same issue repeatedly (premortem ≈ failure-mode ≈ a domain
expert). Collect all critic findings (deliberate barrier — wait for all critics), then
dispatch a **single dedup-and-rank agent (sonnet)**. Template: `./dedup-rank-prompt.md`.
It (1) merges near-duplicates (same location + root claim, keep strongest evidence),
(2) grades each merged finding a **blast-radius severity** (blocker/major/minor — "if true,
how bad?"), and (3) ranks them so the depth cap can select the top-X.

This replaces the former plain-code merge. The graded severity is **triage only** — it is
distinct from the gate severity, which is still the **median of the confirming judges**
(Step E). Record pre-dedup and post-dedup counts in the report.
```

- [ ] **Step 3: Add the cap + blocker-bypass to Step D**

In `## Step D — Verify (3-judge panel)`, replace the first sentence:

Find:
```markdown
For **each distinct finding**, dispatch **three independent judges** (sonnet; use a non-Claude judge for one seat if the harness offers it). Template: `./judge-prompt.md`. Each judge returns `CONFIRM <severity>` (with required evidence for external claims), `REJECT`, or `UNVERIFIED`.
```

Replace with:
```markdown
Apply the depth cap to the ranked findings from Step C: the **top-X** (X = the depth level's
cap) plus any finding graded `blocker` by the dedup-and-rank agent (blocker bypass) are the
**verified set**; findings below the cap are the **un-verified set** (reported in Step F,
never sent to judges, never dropped). For **each finding in the verified set**, dispatch
**three independent judges** (sonnet; use a non-Claude judge for one seat if the harness
offers it). Template: `./judge-prompt.md`. Each judge returns `CONFIRM <severity>` (with
required evidence for external claims), `REJECT`, or `UNVERIFIED`.
```

- [ ] **Step 4: Update Step F report format**

In `## Step F — Report (report-only)`, replace the fenced report template with:

```
roast verdict: BLOCK | REVISE | PASS | PASS (low coverage)
depth: <shallow|medium|deep|unlimited> (cap <N>)
independence: cross-family | same-family (Claude) | none (inline)
coverage: <N lenses ran>, <M domains>, <before-dedup → after-dedup → verified counts>, <judge completion %>
Confirmed findings:
  - [GAP|UNVERIFIED-ASSUMPTION] (median severity / max severity) <location> — <claim> — <evidence/citation>
Recommended spikes (unverified load-bearing assumptions):
  - Question: … | Cheapest test: … | Kill criteria: …
Not verified (below depth=<level> cap): <count> — re-run at a deeper level to verify
  - [GAP|UNVERIFIED-ASSUMPTION] (graded severity) <location> — <claim>
Escalations (need human): <UNVERIFIED externals, incomplete panels, material dissent>
Judge-raised (not from critics): …
```

- [ ] **Step 5: Update the script skeleton**

In the `## Annotated Workflow script skeleton`, make these three edits.

(a) Replace the destructured args line:
```javascript
const { specPath, context } = args
```
with:
```javascript
const { specPath, context, depth = 'medium' } = args
const CAP = { shallow: 5, medium: 10, deep: 20, unlimited: Infinity }[depth] ?? 10
```

(b) Replace the dedup line:
```javascript
const findings = dedupe(raw)   // merge same location + same root claim; keep strongest evidence
```
with:
```javascript
// Dedup-and-rank is now an agent: merge near-dupes + grade blast radius + rank (./dedup-rank-prompt.md).
const ranked = (await agent(dedupRankPrompt(raw), { label:'dedup-rank', phase:'Verify', model:'sonnet', schema:RANKED }))?.findings ?? []
// Cap selects the verified set; blocker-graded findings bypass the cap; the rest are reported un-verified.
const verifySet = ranked.filter((f, i) => i < CAP || f.gradedSeverity === 'blocker')
const belowCap  = ranked.filter((f, i) => !(i < CAP || f.gradedSeverity === 'blocker'))
```

(c) Replace the verify line:
```javascript
const judged = await parallel(findings.map(f => () => verifyFinding(f)))
```
with:
```javascript
const judged = await parallel(verifySet.map(f => () => verifyFinding(f)))
```

(d) Add the `RANKED` schema after the `VERDICT` schema definition:
```javascript
const RANKED = { type:'object', properties:{ findings:{ type:'array', items:{ type:'object', properties:{
  rank:{type:'integer'}, kind:{enum:['GAP','UNVERIFIED-ASSUMPTION']}, claim:{type:'string'}, location:{type:'string'},
  external:{type:'boolean'}, gradedSeverity:{enum:['blocker','major','minor']}, spike:{type:'string'}
  }, required:['rank','kind','claim','location','external','gradedSeverity'] } } }, required:['findings'] }
```

(e) Update the final `return` to surface depth + below-cap. Replace:
```javascript
return { verdict, independence: 'same-family (Claude)', confirmed, escalations,
         coverage: { lenses: lenses.length, beforeDedup: raw.length, afterDedup: findings.length } }
```
with:
```javascript
return { verdict, depth, cap: CAP, independence: 'same-family (Claude)', confirmed, escalations, belowCap,
         coverage: { lenses: lenses.length, beforeDedup: raw.length, afterDedup: ranked.length, verified: verifySet.length } }
```

(f) Update the closing comment line that lists helpers — remove `dedupe` from it (it is now an agent):
Find `// castPanel / redispatchFailures / dedupe / invSev:` and change to
`// castPanel / redispatchFailures / invSev:` with matching prose, and change the trailing
description so it no longer says "merge duplicate findings" (that moved to the dedup-rank agent).

- [ ] **Step 6: Verify internal consistency**

Run: `grep -n "dedupe(\|dedup-and-rank\|dedupRankPrompt\|gradedSeverity\|RANKED\|CAP\|belowCap\|depth" skills/roast/roast-workflow.md`
Expected: no remaining `dedupe(` call; `dedupRankPrompt`, `RANKED`, `CAP`, `belowCap`, `gradedSeverity`, and `depth` all appear; Step C titled "Dedup-and-rank". Confirm the report template includes the `depth:` line and the `Not verified (below depth=` line.

- [ ] **Step 7: Commit**

```bash
git add skills/roast/roast-workflow.md
git commit -m "feat(roast): depth cap, dedup-and-rank agent, below-cap reporting in workflow"
```

---

### Task 3: Update SKILL.md (depth, dedup-and-rank role, output, tiering)

**Files:**
- Modify: `skills/roast/SKILL.md`

- [ ] **Step 1: Update process step 3 (dedup → dedup-and-rank)**

In `## The Process`, replace the step-3 line:

Find:
```markdown
3. **Dedup** — merge overlapping findings (same location + root claim) so each distinct issue is judged once, not once per lens.
```

Replace with:
```markdown
3. **Dedup-and-rank (agent)** — one sonnet agent merges overlapping findings (same location + root claim), grades each a **blast-radius severity** (triage only — not the gate severity), and ranks them so the **depth** cap can pick the top-X to verify (`./dedup-rank-prompt.md`).
```

- [ ] **Step 2: Add a Depth subsection**

Immediately after the numbered Process list (before `## Output Format`), insert:

```markdown
## Depth

`depth` caps how many distinct (post-dedup) findings reach the judges — the dominant cost.
Detected from the invocation's natural language; default **medium**. Below-cap findings are
**listed, not dropped**; a finding graded `blocker` is verified even past the cap.

| Level | Cap | Phrasing |
|---|---|---|
| shallow | 5 | "quick / shallow roast" |
| **medium** | **10** | plain "roast" (**default**, incl. the brainstorming gate) |
| deep | 20 | "deep / thorough roast" |
| unlimited | ∞ | "exhaustive / full roast" |

Full mechanics in `./roast-workflow.md`.
```

- [ ] **Step 3: Update the Output Format block**

In `## Output Format`, replace the fenced block with the same template used in the workflow (keep them identical):

```
roast verdict: BLOCK | REVISE | PASS | PASS (low coverage)
depth: <shallow|medium|deep|unlimited> (cap <N>)
independence: cross-family | same-family (Claude) | none (inline)
coverage: <lenses>, <domains>, <before→after dedup → verified>, <judge completion %>
Confirmed findings:
  - [GAP|UNVERIFIED-ASSUMPTION] (median sev / max sev) <spec location> — <claim> — <evidence/citation>
Recommended spikes:
  - Question / Cheapest test / Kill criteria
Not verified (below depth cap): <count> — re-run deeper to verify
  - [GAP|UNVERIFIED-ASSUMPTION] (graded sev) <spec location> — <claim>
Escalations (need human): <UNVERIFIED externals, incomplete panels, material dissent>
```

- [ ] **Step 4: Update Model Tiering**

In `## Model Tiering`, replace the `Domain-triage: **sonnet**...` sentence to also cover the dedup-and-rank agent:

Find:
```markdown
Domain-triage: **sonnet** (lightweight labeling, not critique).
```

Replace with:
```markdown
Domain-triage and dedup-and-rank: **sonnet** — both are bounded labeling passes (triage names domains; dedup-and-rank merges + grades a blast-radius triage severity), run once, and do not set the gate; keeping them off opus is part of the cost win that the depth cap targets.
```

- [ ] **Step 5: Verify consistency between SKILL.md and the workflow**

Run: `grep -n "depth\|Dedup-and-rank\|dedup-and-rank\|Not verified\|blocker" skills/roast/SKILL.md`
Expected: the Depth subsection, the updated step 3, the `depth:` + `Not verified` lines in Output Format, and the tiering sentence all present. Confirm the cap numbers (5/10/20/∞) match Task 2's table exactly.

- [ ] **Step 6: Commit**

```bash
git add skills/roast/SKILL.md
git commit -m "feat(roast): document depth levels, dedup-and-rank role, and output in SKILL.md"
```

---

### Task 4: Validate with writing-skills pressure-testing

**Files:**
- No file changes unless the pressure test surfaces a defect (then fix inline and amend the relevant commit).

- [ ] **Step 1: Invoke the writing-skills skill**

Invoke `superpowers:writing-skills` and run its evaluation/pressure-testing process against the modified `roast` skill, focused on the new behavior.

- [ ] **Step 2: Adversarially check the new behavior**

Pressure-test these specific failure modes the change could introduce:
1. **Silent drop:** does any path discard a below-cap finding without listing it? (Must always appear under "Not verified".)
2. **Default resolution:** does an ambiguous or auto-gate invocation reliably resolve to `medium`, never to a wrong level?
3. **Blocker bypass:** is a dedup-graded `blocker` always verified even past the cap?
4. **Severity confusion:** is the dedup-and-rank `gradedSeverity` (triage) ever mistaken for the gate severity (judges' median)? The two must stay clearly distinct in SKILL.md and the workflow.
5. **Coverage honesty:** does a capped run ever read as a clean clearance when many findings went un-verified? The report must make the un-verified count visible.

- [ ] **Step 3: Fix any defects inline and re-verify**

For each defect, edit the relevant file, re-run the Step 5/6 consistency greps from Tasks 2–3, and amend the corresponding commit.

- [ ] **Step 4: Final commit (if any fixes were made)**

```bash
git add skills/roast/
git commit -m "fix(roast): address depth-cap pressure-test findings"
```

---

## Self-Review

**Spec coverage:** depth levels + NL detection (Task 2 Step 1, Task 3 Step 2) ✓; dedup→LLM agent grading blast radius + ranking (Task 1, Task 2 Step 2) ✓; above-cap unchanged verify + blocker bypass (Task 2 Step 3) ✓; below-cap listed not dropped (Task 2 Steps 3–4, Task 3 Step 3) ✓; report additions depth/coverage/Not-verified (Task 2 Step 4, Task 3 Step 3) ✓; gate still median-of-judges (Task 2 Step 2 prose) ✓; cost/model-tier (Task 3 Step 4) ✓; new prompt file (Task 1) ✓.

**Placeholder scan:** all insert/replace blocks contain literal final content; greps have concrete expected results; no "TBD"/"handle edge cases".

**Type consistency:** `gradedSeverity`, `RANKED`, `dedupRankPrompt`, `CAP`, `verifySet`/`belowCap`, `depth` are used identically across Tasks 1–3; the `RANKED` schema field names match the prompt's Output contract in Task 1; cap numbers 5/10/20/∞ match across the workflow table, SKILL.md table, and the script `CAP` map.
