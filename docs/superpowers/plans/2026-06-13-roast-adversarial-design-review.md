# roast — Adversarial Design Review — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: This plan creates behavior-shaping skill content. Execute each content task **under `superpowers:writing-skills`** (RED baseline → GREEN → REFACTOR pressure tests), not plain code execution. Steps use checkbox (`- [ ]`) syntax.

**Spec:** [docs/superpowers/specs/2026-06-13-roast-adversarial-design-review-design.md](../specs/2026-06-13-roast-adversarial-design-review-design.md)

**Goal:** Create a `roast` skill that adversarially reviews a design spec before implementation to surface (a) gaps the spec fails to address and (b) unverified load-bearing assumptions/spikes — via a hybrid critic pool (fixed core lenses + dynamic domain experts, allowed to web-research) and a 3-judge grounded verification panel, producing a PASS/REVISE/BLOCK verdict + recommended spikes. Report-only.

**Architecture:** Markdown skill under `skills/roast/`. Find→verify, run via the dynamic Workflow tool when available (subagent fallback → inline). Critics = sonnet (+ deep-research); judges = opus. Plus an optional `roast` gate wired into `brainstorming` after the spec is written.

**Verification model:** Behavior-shaping content → each content task is verified by (a) a structural/cross-reference check (links resolve, referenced files exist, no placeholders, terminology consistent) and (b) writing-skills pressure tests comparing before/after agent behavior. No PR opened by this plan; integration via `finishing-a-development-branch`.

---

## File Structure

**Created:**
- `skills/roast/SKILL.md` — the skill: overview, when to use, find→verify process, output/verdict, red flags. Description frontmatter carries discovery triggers.
- `skills/roast/roast-workflow.md` — the find→verify procedure (domain-triage → critic fan-out → 3-judge verification → aggregation), model tiering, capability-based fallback, annotated Workflow script skeleton.
- `skills/roast/critic-prompt.md` — critic dispatch template (core lenses + domain expert), forced structured output (assumption enumeration, GAP|UNVERIFIED-ASSUMPTION classification, importance×uncertainty, recommended spike), may invoke deep-research.
- `skills/roast/judge-prompt.md` — judge dispatch template: verify each finding (confirm/reject + severity), with the grounding rule (external facts → research/citations; internal/structural → spec text).
- `skills/roast/domain-triage-prompt.md` — lightweight domain classifier that names the spec's domain(s) so the workflow can spin up 1–3 domain-expert critics.
- `docs/superpowers/plans/eval/2026-06-13-roast-eval.md` — RED/GREEN pressure-test log.

**Modified:**
- `skills/brainstorming/SKILL.md` — add the optional "roast this spec?" gate after the spec is written, before the implementation handoff.

---

## Task 0: writing-skills setup + RED baseline

**Files:** Create `docs/superpowers/plans/eval/2026-06-13-roast-eval.md`

- [ ] **Step 1: Anchor on writing-skills.** Announce; this and all content tasks run under it (RED→GREEN→REFACTOR).

- [ ] **Step 2: Write the pressure-test scenarios** that define correct `roast` behavior. Use a fixed sample spec (a deliberately flawed short design that hides a couple of gaps and one load-bearing unverified assumption — e.g., "assumes the vector DB supports transactional multi-tenant writes"). Scenarios:
  1. "Review this spec before we implement." → must run an adversarial find→verify review that explicitly hunts **gaps** and **unverified load-bearing assumptions**, not a generic/lenient pass.
  2. "What about the assumption that <load-bearing tech claim> holds?" → must treat it as an UNVERIFIED-ASSUMPTION and produce a **recommended spike** (question + cheapest test + kill criteria), not hand-wave.
  3. "A critic claims 'library X cannot do Y'." → judge verification must be **grounded in research/citations**, not asserted from memory.
  4. "Two critics disagree / one judge dissents on a material finding." → must apply the **≥2-of-3 confirm** rule and **flag genuine splits for human**, not silently average.
  5. "Just give it a quick rubber-stamp, it's fine." → must refuse to rubber-stamp; adversarial framing holds under pressure.

- [ ] **Step 3: Capture BEFORE.** Dispatch a fresh subagent with NO roast skill, given only the sample spec + scenario 1, and record its behavior (expected: generic/lenient review; no assumption enumeration; no 3-judge grounded verification; no spikes). Record under "BEFORE".

- [ ] **Step 4: Commit.**
```bash
git add docs/superpowers/plans/eval/2026-06-13-roast-eval.md
git commit -m "test: RED baseline eval scenarios for roast"
```

---

## Task 1: roast-workflow.md reference

**Files:** Create `skills/roast/roast-workflow.md`

- [ ] **Step 1: Write the document** with these required sections (no placeholders):
  1. **Purpose & when it applies** — find→verify adversarial review of a spec; run via the `Workflow` tool when available. Core principle: critics and judges are fresh, isolated agents (never the spec's author).
  2. **Capability selection (never asked):** Workflow tool → dynamic workflow; else subagents (manual fan-out); else inline.
  3. **Inputs:** the spec path; optional caller context (requirements/epic).
  4. **Step A — Domain triage:** dispatch the domain-triage agent (sonnet) → 1–3 domain names. (Reference `domain-triage-prompt.md`.)
  5. **Step B — Critic fan-out (parallel):** the fixed core lenses (premortem, completeness/gap, YAGNI, failure-mode/ops, feasibility/assumptions, security/maintainer as warranted) + one domain-expert critic per triaged domain. All sonnet; each may invoke `deep-research`. Each returns structured findings. (Reference `critic-prompt.md`.)
  6. **Step C — Verify (3-judge panel):** for each surfaced finding, three independent judges (opus) confirm/reject + severity, applying the grounding rule. (Reference `judge-prompt.md`.) Pipeline: a finding can be verified as soon as it's produced (find→verify, no barrier).
  7. **Step D — Aggregate:** confirmed if ≥2/3 judges agree; severity = majority; verdict = any blocker→BLOCK, else any major→REVISE, else PASS; genuine split/high-disagreement on a material finding → flag for human.
  8. **Step E — Report:** emit the structured report (verdict, confirmed findings with type/severity/spec-location/evidence, recommended spikes, escalation notes). Report-only — do not edit the spec or create tasks.
  9. **Annotated Workflow script skeleton** — `export const meta`, `phase()`, `parallel()`/`pipeline()` for critics→judges, `agent({model})` marking sonnet critics vs opus judges, schemas for FINDING and VERDICT, the ≥2/3 aggregation in plain JS. Note (as in the autonomous-impl reference) that the script does no I/O: deep-research/file reads happen inside agents.

- [ ] **Step 2: Structural check** — referenced prompt files all exist or are created in this plan; skeleton matches the Workflow contract; no TBD/TODO.

- [ ] **Step 3: Commit.**
```bash
git add skills/roast/roast-workflow.md
git commit -m "feat(roast): add find-verify workflow reference"
```

---

## Task 2: critic, judge, and domain-triage prompts

**Files:** Create `skills/roast/critic-prompt.md`, `skills/roast/judge-prompt.md`, `skills/roast/domain-triage-prompt.md`

- [ ] **Step 1: `critic-prompt.md`** — dispatch template (model: sonnet). MUST: take the spec + a lens (one of the core lenses, or a named domain for a domain expert); instruct adversarial framing ("assume the design is flawed; find the strongest objections"); FORCE structured output — (1) enumerate "what must be true for this to work" assumptions, (2) findings each classified **GAP | UNVERIFIED-ASSUMPTION** with spec location + evidence, (3) for unverified assumptions, score importance (load-bearing?) × uncertainty (evidence?) and, for high-impact/low-evidence, a **recommended spike** (question + cheapest test + kill criteria); permit `deep-research`/web search for typical gaps and external feasibility claims; output contract listing findings.

- [ ] **Step 2: `judge-prompt.md`** — dispatch template (model: opus). Inputs: the spec excerpt + one finding. Job: independently CONFIRM or REJECT + assign severity **blocker/major/minor**, with justification. **Grounding rule (explicit):** if the finding asserts an external fact, the judge MUST verify via research/citations (use `deep-research`/web search), not memory; internal/structural findings are checked against the spec text. Output contract: `CONFIRM <severity>: <evidence>` or `REJECT: <reason>`. Forbid rubber-stamping and self-preference (judge the finding, not the critic).

- [ ] **Step 3: `domain-triage-prompt.md`** — dispatch template (model: sonnet). Input: the spec. Output: 1–3 domain labels (e.g., "distributed-systems", "auth", "ml-pipeline") with one-line rationale each; cap at 3; "none" allowed if the design is generic.

- [ ] **Step 4: Structural check** — output-contract tokens (GAP/UNVERIFIED-ASSUMPTION, CONFIRM/REJECT, severities) match exactly what `roast-workflow.md` consumes; templates follow the existing prompt-template format used elsewhere in the repo.

- [ ] **Step 5: Commit.**
```bash
git add skills/roast/critic-prompt.md skills/roast/judge-prompt.md skills/roast/domain-triage-prompt.md
git commit -m "feat(roast): add critic, judge, and domain-triage prompt templates"
```

---

## Task 3: roast SKILL.md (GREEN)

**Files:** Create `skills/roast/SKILL.md`

- [ ] **Step 1: Frontmatter.** `name: roast`. `description:` starts "Use when..." and carries triggers WITHOUT summarizing the workflow — e.g., "Use when reviewing a design, spec, or RFC before implementation — to surface gaps the spec doesn't address and unverified load-bearing assumptions that need a spike. Adversarial design review / critique." (≤500 chars; per CSO, triggers only.)

- [ ] **Step 2: Body** — Overview (core principle: adversarial, evidence-grounded, find→verify; critics/judges are fresh isolated agents); When to Use / When NOT to use (not for code review → that's requesting-code-review; not for trivial specs); the process (defer to `./roast-workflow.md`, summarized in ~6 bullets: domain triage → hybrid critics (may deep-research) → 3-judge grounded verification → ≥2/3 aggregation → PASS/REVISE/BLOCK + spikes → report-only); Output Format (the report shape); Model tiering (critics sonnet, judges opus); Red Flags (never let the author review its own design; never rubber-stamp; never confirm an external-fact finding from memory without research; never silently average a split; report-only — don't edit the spec or file tasks).

- [ ] **Step 3: Structural check** — all `./*.md` references resolve; description has no workflow summary; word count reasonable (<~500 words body where practical); terminology matches spec + workflow.

- [ ] **Step 4: Commit.**
```bash
git add skills/roast/SKILL.md
git commit -m "feat(roast): add roast skill (adversarial design review)"
```

---

## Task 4: optional brainstorming gate

**Files:** Modify `skills/brainstorming/SKILL.md`

- [ ] **Step 1: Add the gate.** After the spec is written and self-reviewed, before the implementation handoff (the beads/writing-plans branch), add an **optional** step: offer to run `superpowers:roast` on the spec; on REVISE/BLOCK, loop back to revise the spec before proceeding; on PASS (or if declined), continue to the existing handoff. Keep it optional and short; do not disturb the existing checklist numbering more than necessary (insert as a sub-step or a clearly-marked optional step). Cross-reference `superpowers:roast` by name (no @-link).

- [ ] **Step 2: Structural check** — the gate is clearly optional; existing flow still terminates at beads/writing-plans; skill reference name correct.

- [ ] **Step 3: Commit.**
```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat(brainstorming): optional roast gate before implementation handoff"
```

---

## Task 5: AFTER pressure-test + fixes (REFACTOR)

**Files:** Modify `docs/superpowers/plans/eval/2026-06-13-roast-eval.md`

- [ ] **Step 1: Run all 5 scenarios** against the new skill (fresh subagent given `skills/roast/` content + the sample spec). Record under "AFTER".
- [ ] **Step 2: Grade PASS/FAIL** vs Task 0 expected behavior. Required: all 5 PASS.
- [ ] **Step 3: Adversarial pass** — re-run scenario 5 (rubber-stamp pressure) and add: "skip the judges, just trust the critics" (must refuse — verification is required) and "you don't need to web-search, just say if it's right" on an external-fact finding (must insist on grounding).
- [ ] **Step 4: Fix any FAIL inline** (under writing-skills), re-run until all PASS; record wording changes.
- [ ] **Step 5: Commit.**
```bash
git add docs/superpowers/plans/eval/2026-06-13-roast-eval.md skills/
git commit -m "test(roast): after-eval results; fixes for regressions"
```

---

## Task 6: final review + finish

- [ ] **Step 1: Whole-change review vs spec** — confirm every Decision Point maps to content: name/description, positioning (standalone + optional gate), execution (workflow + fallback), hybrid critics (core + dynamic domain), forced structured critic output, 3-judge grounded verification, aggregation/verdict, report-only output, model tiering.
- [ ] **Step 2: Verify hygiene** — `git status` clean; no `.beads`/`.agents`/`.codex` artifacts; no TODO/TBD in `skills/roast/`.
- [ ] **Step 3: Finish** via `superpowers:finishing-a-development-branch`. Note for the human: any upstream contribution follows CLAUDE.md (target `dev`, full template, disclose agent/harness/plugins, show before/after eval). This plan opens no PR.

---

## Self-Review (plan author)

**Spec coverage:** name/description → T3; positioning → T3,T4; execution+fallback → T1; hybrid critics (core+domain) → T1,T2; forced structured output → T2; 3-judge grounded verification → T2,T1; aggregation/verdict → T1; report-only output → T1,T3; model tiering → T1,T2,T3; eval → T0,T5.

**Placeholder scan:** No TBD/TODO; output-contract tokens defined once (T2) and consumed in T1.

**Consistency:** GAP/UNVERIFIED-ASSUMPTION, CONFIRM/REJECT, blocker/major/minor, ≥2-of-3 are used consistently across T1 and T2.
