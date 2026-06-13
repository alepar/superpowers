# roast — Adversarial, Evidence-Grounded Design Review

**Date:** 2026-06-13
**Status:** draft
**Relates to:** `brainstorming` (optional gate after spec write), the existing lenient `brainstorming/spec-document-reviewer-prompt.md` (complementary, untouched), and the Workflow-coordinated execution pattern from [2026-06-13 Workflow-Coordinated Autonomous Implementation](2026-06-13-workflow-coordinated-autonomous-implementation-design.md).

## Problem

When `brainstorming` produces a design spec, the only checks before implementation are a lenient inline self-review (and an orphaned single-reviewer prompt that is deliberately calibrated to "approve unless serious gaps"). Neither is adversarial, and neither is built to catch the two failure modes that most often sink an implementation: **gaps the spec silently fails to address** (unhandled cases, undefined interfaces, missing non-functional requirements, unstated assumptions) and **unverified load-bearing assumptions** the whole design rests on (e.g., "library X supports Y", "this approach scales to N", "this API can do Z"). We want a heavyweight, adversarial, evidence-grounded review — `roast` — that hunts these specifically and tells you what to de-risk with a spike before any code is written.

## Main Challenges

1. **Self-review doesn't work.** A model reviewing its own design shares its blind spots (self-correction without an external signal fixes few errors and introduces new ones; fresh/separate context beats same-session). So critics and judges must be fresh, isolated agents — never the spec's author grading itself.
2. **One judge is biased; agreement isn't accuracy.** Single LLM judges carry position/verbosity/style/self-preference/leniency biases; a panel only helps if the judges are genuinely diverse — and on Claude Code true cross-family diversity is limited, so diversity must come from personas, rubrics, model tiers, and blind/independent judging.
3. **Models won't surface assumptions from vague prompts.** Structured, forced output (explicitly enumerate "what must be true for this to work") catches far more than free-form critique; toolified assumption detection cut bad plans by >50% vs prompt-only guidance.
4. **Generic lenses miss domain-specific traps.** Domain-specific gaps (consistency/idempotency, token/replay, data-leakage/drift) are invisible to domain-agnostic review.
5. **Confidently-wrong claims cut both ways.** A critic can invent a non-issue and a judge can wave through (or reject) a real one from memory. Key factual claims must be grounded in actual research, not model priors.

## Key Decisions

`roast` is a **standalone skill, run via the dynamic Workflow tool** (subagent fallback → inline), invokable on any spec/RFC, and also offered as an **optional gate inside `brainstorming`** after the spec is written and before the implementation handoff. It uses a **find → verify** architecture: a **hybrid critic pool** (fixed core lenses + dynamically-selected domain experts), each producing **structured, classified, evidence-backed findings** and allowed to **web-research typical gaps** via `deep-research`; then a **3-judge verification panel** that independently confirms/rejects each finding with a severity, **grounding verification of external factual claims in actual research**. It aggregates to a **PASS / REVISE / BLOCK** verdict and **reports** findings plus a **recommended spike per unverified load-bearing assumption** — it does not edit the spec or file tasks; the caller decides. Critics run on sonnet (plus deep-research); judges run on opus.

## Decision Points

### Name: `roast`

Chosen by the user. It is not self-describing for skill discovery, so the **`description` frontmatter carries the triggers** (reviewing a design/spec/RFC before implementation; finding gaps and unverified/load-bearing assumptions; adversarial design review; de-risking). Per CSO guidance, Claude matches on the description, so discoverability is preserved despite the non-descriptive name. *Considered and discarded:* a descriptive name like `adversarial-design-review` — clearer for discovery but the user wants `roast`; the rich description closes the gap.

### Positioning: standalone + optional brainstorming gate

`roast` is its own skill, runnable on any spec at any time. `brainstorming` gains an **optional** "roast this spec?" step after the spec is written, before the plan/implement handoff. The existing lenient inline self-review remains for quick sanity; `roast` is the heavyweight, opt-in deep review. The orphan `spec-document-reviewer-prompt.md` is left untouched. *Considered and discarded:* (a) **replace** brainstorming's spec review so every spec is always roasted — strongest bar but slows every design including trivial ones, with no opt-out; (b) **pure standalone, no integration** — simplest but easy to forget at the one moment it matters most.

### Execution: dynamic Workflow tool

When the `Workflow` tool is available, `roast` runs as a background/dynamic workflow that fans out critics, then verifies findings through the judge panel as a pipeline (`find → verify`), model-tiered per role. Fallbacks, chosen by capability and never asked: **subagents** (manual fan-out) when there is no Workflow tool; **inline** as a last resort. Full procedure lives in `roast-workflow.md`. *Considered and discarded:* hand-rolled subagent dispatch as the primary path — retained only as the fallback, consistent with the project's preference for the native dynamic-workflow ability.

### Critic pool: hybrid (fixed core lenses + dynamic domain experts)

**Fixed core lenses (~5–7, always run), each pairing a dimension with an adversarial stance:** premortem ("assume it shipped and failed — why?"), completeness/gap (missing requirements, interfaces, NFRs, error/edge cases), simplicity/YAGNI (over-engineering), failure-mode/ops (assume each component fails — blast radius), feasibility/assumptions ("what must be true for this to work?"), and security and future-maintainer as warranted.

**Dynamic domain experts (1–3, capped):** a lightweight **domain-triage** step reads the spec, names the design's domain(s), and spins up one expert critic per domain. Each leans heavily on `deep-research` to surface that domain's typical failure modes and load-bearing assumptions, then tests the spec against them. The cap bounds cost; mis-classification is low-harm because the judge panel rejects off-target findings. *Considered and discarded:* fixed lenses only — predictable but blind to domain-specific traps; fully dynamic critic selection — flexible but unpredictable coverage and cost.

### Critic output: forced structure, classification, evidence

Every critic (core and domain) must produce **structured** output, not prose: explicitly enumerate the assumptions the design depends on, and classify each finding as **GAP** or **UNVERIFIED-ASSUMPTION**, with a spec location and supporting evidence. Critics **may invoke `deep-research`/web search** (where available) to find typical gaps and to check external feasibility claims. For unverified assumptions, the critic scores **importance × uncertainty**; high-importance/low-evidence ones carry a **recommended spike** (the question, the cheapest way to answer it, the kill criteria). *Considered and discarded:* free-form critique — research shows it surfaces far fewer assumptions than forced structured output.

### Verification: 3-judge panel, grounded

Three **independent** judges verify **each** surfaced finding: confirm or reject, with a severity of **blocker / major / minor**. Diversity comes from **distinct personas + rubrics + model tiers + blind/independent judging** (honest caveat: judges are mostly Claude, so we do not claim cross-family independence). **Grounding rule:** findings that assert *external facts* ("library X can't do Y", "won't scale to N") must be verified with **actual research/citations**, not model memory; *internal/structural* findings ("the spec never says what happens when Z fails") are verified against the spec text. Judges must justify each verdict with evidence. *Considered and discarded:* single judge (3–5× cheaper but biased and undiscriminating); critics double as judges (loses the independent verification that cuts false positives); full multi-agent debate (surfaces more only if heterogeneous, otherwise degrades into premature consensus/persuasion-over-truth — not worth the risk here).

### Aggregation & verdict

Per finding: **confirmed if ≥2 of 3 judges agree it is real**; severity is the majority/median of the confirming judges. Overall verdict: any confirmed **blocker → BLOCK**; one or more confirmed **majors → REVISE**; only minors or none → **PASS**. A genuine 3-way split or high disagreement on a material finding is **flagged for human** rather than averaged away. *Considered and discarded:* naive mean scoring — hides disagreement and is corrupted by correlated judge errors.

### Output: report-only; caller decides

`roast` returns a structured report: the **verdict**, the confirmed findings (type, severity, spec location, evidence/citations), the **recommended spikes** for unverified load-bearing assumptions, and any escalation/split notes. It does **not** edit the spec or create beads tasks. When invoked from `brainstorming`, a REVISE/BLOCK verdict loops back to spec revision before implementation; spikes are surfaced for the user to schedule. *Considered and discarded:* (a) auto-filing beads spikes/gaps — convenient but couples `roast` to the beads flow and to write-side state; (b) driving an internal revise→re-roast loop — most autonomous but makes `roast` own spec edits (scope creep) and reintroduces the self-revision blind spot.

### Model tiering

Critics run on **sonnet** (plus `deep-research` when needed); the domain-triage step on **sonnet**; the **3 judges on opus** (judgment-heavy and responsible for grounded verification). Consistent with "least powerful model that can handle each role," with the most capable model on the verification bookend.

## How It's Built

New `skills/roast/` containing `SKILL.md`, `critic-prompt.md`, `judge-prompt.md`, and a `roast-workflow.md` reference (the find→verify workflow with model tiering and the capability-based fallback), plus the optional gate wired into `brainstorming`. Built under `superpowers:writing-skills` (RED baseline → GREEN → REFACTOR pressure tests). `roast` cannot be dogfooded on its own spec (it does not exist yet), so this spec gets the normal inline self-review only.

## Post-Implementation Notes

_(none yet — added by `finishing-a-development-branch` when this design is built.)_
