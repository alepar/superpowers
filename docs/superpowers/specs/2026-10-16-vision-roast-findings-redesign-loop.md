# Roast Findings Redesign Loop — Local Fix or Re-run the Design

## Goal

Each round of a roast fix loop makes an explicit, checkable choice:

- **local fix:** today's fix beads, then `super-code`;
- **redesign:** re-run the design loop on what the round showed. In the code loop that means `super-design` in amend mode, then `super-code` on the resulting beads, then a fresh code roast. In the design loop it means re-decomposing, or re-brainstorming, from the level that owns the defect.

Redesign is chosen when objective triggers say patching is failing, or when a finding implicates a design decision. It replaces today's loosely defined "step back and think bigger" pass in both loops: super-auto phase 5 (code roast) and super-design §Adversarial Review Loop (design roast).

Observable outcome:

- A run whose roast findings recur, or whose open Blocking set stops shrinking, re-enters design instead of patching again or exiting at thrash.
- Each redesign is recorded with the trigger that caused it.
- Every later decision reads a SHA-bound findings ledger, not the raw reports.

## Problem

Phase 5 currently runs a step-back agent per round that answers `patch | redesign`. A `redesign` with `scope: inside` amends the spec in place and files fix beads inside the fix loop. Around that sit the step-back keys file and `step-back-check`, cluster carry-over into the scope filter, the regression-only pass, and thrash and cap exits. The step-back decision is free judgment with no grounding signal, and the redesign it applies is a spec patch, not a design pass. Accumulated triage (`docs/superpowers/feedback/2026-10-16-accumulated-triage/`) shows a series of special cases added around this loop.

Research basis: `~/Documents/Roast_Replan_Loop_Research_20261016/final_report.md` (deep run, 54 sources, three dossiers). Its findings:

- **Re-plan when feedback contradicts the plan.** ADaPT, AdaPlanner, Plan-and-Act and PairCoder support this. The spiral and transform models and ODC are the classical precedent for routing a defect to the stage that owns it.
- **Scope the replan.** Global replanning re-justifies unaffected decisions; TDP cut output tokens by 82% by scoping. Plan repair is more stable than replanning from scratch (Fox et al.). Local repair contributed more than plan switching in the PairCoder ablation, and the combination did best.
- **Use recurrence as the switch signal.** PairCoder switches plans when a failure seen before reappears under the current plan.
- **Don't feed stale findings.** Findings bound to old code states harmed 34/135 correct starts, against 4/135 for current ones. Use a curated ledger bound to the commit each finding was raised at, not raw history.
- **Guard against regression.** Revision regresses previously correct content (16–27%). Use anchors, an explicit unchanged-behavior set and a last-known-good tip.
- **Correct only from external, located critique.** LLMs correct designs when the critique is external and locates the error. Roast findings meet that, but LLM critique skews toward local fixes, so redesign depth must be asked for explicitly.

## Decisions

Decided with the human on 2026-10-16:

1. **Scope:** both fix loops, code (super-auto phase 5) and design (super-design §Adversarial Review Loop).
2. **Amend gates are proportional.** A code-loop redesign always runs the Key Abstractions sync and the coverage check on the amended subtree. A design roast runs only when a spec decision changed, and its rounds count toward the design-roast cap.
3. **Decider: script plus step-back agent.** A script computes the mechanical triggers, and when one fires redesign is mandatory. Otherwise the step-back agent judges the semantic triggers and must cite which one fired. `step-back-check` validates the citation.
4. **Separate redesign budget.** Each loop gets up to 2 redesign cycles per run, outside its round cap. The code-roast cap stays at 3 rounds; the design-roast cap stays at 3 + 1 extension.
5. **The local path keeps today's machinery:** scope filter, clusters (one rule across many sites), fix beads, super-code re-entry, regression-only pass. Redesign rounds skip the scope filter and clusters; super-design amend owns scoping.

## Design

### 1. Findings ledger (both loops)

- One script-maintained ledger per loop in the run directory: `findings-ledger.md` (code) and `findings-ledger-design.md` (design). Without a run directory, it goes beside the roast reports.
- One row per confirmed finding:
  - its key, `[SEV] <location>`, the same keys `report-verdict --keys` prints;
  - the round and the commit (`sha`) it was raised at;
  - its status: `open`, `resolved@rN`, `regressed@rN`, `punch-listed`, `dissolved@rN` or `disputed (<reason>)`.
- The ledger is built from `report-verdict --keys` and super-roast's existing provenance (new / carried / regressed), plus the scope filter's punch list and redesign records.
- It replaces raw roast reports as the primary input to the step-back, to super-design amend and to fixers. Reports stay on disk and are passed as paths for reference only.

### 2. Triggers and the decision

- **Mechanical triggers (scripted).** When one fires, redesign is mandatory:
  - *recurrence*: a key whose status was `resolved@…` appears again, or super-roast tags a finding regressed;
  - *no progress*: the set of open Blocking keys did not shrink from the previous round, compared by key identity (not count).
- **Semantic triggers (judged by the step-back agent):**
  - *shared cause*: several findings stem from one design decision;
  - *defect type*: a finding touches an interface, a contract, shared data or behaviour visible from outside, rather than an algorithm or internal structure.
- **Step-back output.** The decision changes from `patch | redesign` to `local | redesign`, plus a `triggers:` line naming the fired triggers, and the existing `scope: inside | outside`.
- **`step-back-check` rejects:**
  - `local` when the trigger script reported a mechanical trigger;
  - `redesign` with no trigger cited;
  - a cited mechanical trigger the script did not report.
- **Round 1** has no history, so only semantic triggers can fire.

### 3. Redesign cycle: code loop (super-auto phase 5)

- **The whole round goes through amend.** Once any trigger leads to `redesign`, the round's local findings pass through amend mode as plain beads, so no code is fixed that the redesign is about to change.
- **super-design amend mode** is a new invocation mode on the existing root epic.
  - *Inputs:*
    - the immutable `## Goal` and `run.md`'s `idea:`;
    - the current specs and task tree;
    - the findings ledger;
    - the step-back record;
    - roast report paths (reference only).
  - *Steps:*
    - for each open finding, name the design decision that owns it, or call it local;
    - amend only the spec sections those decisions live in (never `## Goal`);
    - write or update an `## Unchanged behavior` section in the root spec;
    - re-decompose the affected subtrees;
    - file local findings as fix beads with no spec change;
    - a finding may be marked `disputed (<reason>)`.
  - *Disputes:* a disputed Blocking finding is never cleared. `report-status` counts it as unresolved, and `report.md` lists it under Remaining.
  - *Gates (proportional):*
    - the Key Abstractions sync and the coverage check on the amended subtree always run;
    - a design roast runs only when a spec decision changed, and its rounds count toward the design-roast cap.
- **Then** `super-code` drains the new beads (`deferSweep: true`) and a full code roast follows. The roast gets the ledger, and its stated intent includes the amended specs.
- **Re-validate after redesign.** The next roast re-checks the old open findings. Fixers never receive them as instructions. A finding the roast does not re-confirm becomes `dissolved@rN`.
- **Out of scope:** a redesign that would change `## Goal` is parked (`degraded-verdict`, `redesign proposed, not applied`) when the run is autonomous, and offered to the human when it is interactive, as today.
- **Budget:** up to 2 redesign cycles per run, outside the 3-round cap. A redesign round's roast does not increment `roastCodeRound`.
- **Thrash exit:** when a mechanical trigger fires and the redesign budget is spent, the loop exits as thrash. §Cap disposition applies unchanged.
- **Last-known-good:**
  - Before each redesign cycle, record the integration tip as `lastGood <sha>`.
  - If the cycle's roast shows more open Blocking keys than the round before it, the loop exits as thrash. The run reports the regression and `lastGood`, and continues to phase 6 (degrade, don't stop).
  - Reverting is never automatic.

### 4. Redesign cycle: design loop (super-design §Adversarial Review Loop)

- Same ledger, triggers, step-back output and check, in `design` mode.
- `local` is today's behaviour: inline spec or bead amendments, plus fix tasks.
- `redesign` means re-running decomposition, or the subepic brainstorm, from the level that owns the implicated decision, with the ledger as input. It replaces patching spec text.
- Up to 2 redesign cycles, outside the 3 + 1 round cap. Thrash and capped-Blocking handling keep today's rules once the budget is spent.

### 5. Run state and report

- **New `run-state.md` fields:**
  - `findingsLedger: <path>` and `findingsLedgerDesign: <path>` (pointers);
  - `redesignCycles-code: <K>` and `redesignCycles-design: <K>`;
  - one record per cycle: `redesign-<code|design>-<K>: round <N> · triggers <list> · amended <spec sections> · lastGood <sha>`.
- **Changed lines:** `stepBackCode-round-<N>` and `stepBackDesign-round-<N>` record `local | redesign` and the triggers.
- **Resume** replays recorded step-back decisions and redesign records, and continues an interrupted amend cycle from its record.
- **`report-prompt.md`** reports each redesign cycle and its triggers under Gotchas & surprises, and disputed findings under Remaining.

## Unchanged

- The local path: scope filter, clusters, fix beads, super-code re-entry.
- The regression-only pass on a converged round.
- Final-review items feeding the step-back (now also through the ledger).
- The `[converged]` exit, punch lists and the post-cap audit.
- The human-owned merge, and interactive presentation of redesigns.
- super-roast's scouts, judges and report format.

## Testing

- Script tests in the existing `tests/super-auto/` and `tests/super-design/` patterns:
  - **ledger builder:** new, carried, regressed, punch-listed, and resolved-then-returned keys;
  - **trigger script:** recurrence; no progress by key identity, including the same count with different keys (progress) and the same keys (no progress);
  - **`step-back-check`:** `local` with a fired mechanical trigger rejected; `redesign` without a citation rejected; a cited mechanical trigger not reported by the script rejected.
- Contract lint (`tests/super-auto/test-contract-lint.sh`) and the replay harness pass, and every test listed in CLAUDE.md's release checklist passes.
- Manual acceptance note, not automated: replay one finished multi-round run's round-1 report through amend mode, and check that it names the decision later rounds kept circling.

## Out of scope

- An ODC defect-type field in super-roast output. Defect type is judged by the step-back.
- Generating several alternative amendments in parallel on thrash.
- Changing either roast cap.
- Automatic revert to `lastGood`.

## Post-Implementation Notes

**Changes vs. original design (2026-10-17).** Implemented by the linked redesign-loop design: shared ledger and amendment gates, bounded caller-owned cycles, durable resume state and unresolved disputed Blocking reporting. Post-hand-back fixes repaired amendment filing and recovery; no vision decision changed. Live model-driven end-to-end redesign behavior remains unmeasured, as recorded in the run report.

> *As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
