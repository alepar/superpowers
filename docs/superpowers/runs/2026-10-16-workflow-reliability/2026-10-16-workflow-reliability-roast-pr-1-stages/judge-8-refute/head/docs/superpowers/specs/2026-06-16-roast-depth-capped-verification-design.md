# roast: depth-capped verification

## Problem

In `roast`, critics surface many candidate findings and the 3-judge panel verifies
**each distinct finding** (3 judge dispatches per finding). Judges are the dominant
cost. On a rich spec, critics can produce dozens of findings, so verification cost
scales with critic verbosity rather than with how many issues actually matter. We
want to bound judge cost by verifying only the most consequential findings, while
**not** silently dropping the rest — the skill's core principle forbids that.

## Approach

Introduce a **depth** setting that caps how many distinct findings reach the judges.
Promote the dedup step from a plain merge function to an LLM agent that also grades
each finding's blast radius and ranks them, so the cap selects the top-X by estimated
severity. Findings below the cap are **listed in the report as un-verified**, never
discarded.

## Depth levels

| Level | Cap (findings verified) | Trigger phrasing |
|---|---|---|
| shallow | 5 | "quick roast", "shallow roast" |
| **medium** | **10** | plain "roast" — **default** |
| deep | 20 | "deep roast", "thorough roast" |
| unlimited | ∞ (no cap) | "exhaustive roast", "full roast" |

- **Detection:** natural-language keywords in the invocation map to a level. No new
  syntax.
- **Default:** anything ambiguous, and every auto-invocation as the `brainstorming`
  gate, resolves to **medium**.
- The chosen level is echoed in the report so the user knows what was (and wasn't)
  verified.

## Dedup-and-rank agent

Today dedup is a plain code merge (`dedupe(raw)`: same location + same root claim →
one finding, keep strongest evidence). It becomes a single isolated LLM agent that:

1. **Merges** near-duplicates — same behaviour as the code version (same location +
   root claim, keep the strongest evidence).
2. **Grades** each merged finding a **pre-judge blast-radius severity** —
   blocker / major / minor, answering "if this is true, how bad is it?".
3. **Ranks** findings by that severity (descending) and splits the list at the cap.

This grade is **triage only**. It is explicitly *not* the gate severity — the gate
still uses the **median severity of the confirming judges** (unchanged). Critics are
unchanged and still emit no severity; the dedup-and-rank agent assigns it.

Output schema (added): each merged finding carries `gradedSeverity`
(blocker/major/minor) and a stable rank; the agent returns the ordered list.

## Verification (above vs below the cap)

- **Above the cap (top X):** dispatched to the unchanged 3-judge panel. All existing
  verify/aggregate logic (≥2/3 CONFIRM, median gate severity, re-dispatch a failed
  judge once, UNVERIFIED→human, material-dissent escalation) applies as today.
- **Blocker bypass (safety):** any finding the dedup-and-rank agent grades **blocker**
  is verified even if it sorts past rank X. Blockers normally sort into the top anyway,
  so this rarely adds cost, but it guarantees the cheap path never leaves a *potential
  blocker* un-verified.
- **Below the cap:** listed in the report under **"Not verified (below depth=`<level>`
  cap)"** with their dedup-graded severity and a nudge to re-run at a deeper level.
  Never sent to judges; **never silently dropped** — this preserves the skill's
  no-silent-drop principle (the same reason `PASS (low coverage)` exists).

## Report changes

- New line: `depth: <level> (cap <N>)`.
- `coverage:` line shows counts as `before-dedup → after-dedup → verified`.
- New section: `Not verified (below cap): <count>` with each finding's location,
  kind, and graded severity.
- The verdict gate (`BLOCK`/`REVISE`/`PASS`/`PASS (low coverage)`) is computed from
  **verified** findings only, exactly as today. A below-cap finding cannot by itself
  change the verdict — but because it is listed, the user can re-run deeper to verify
  it. (A below-cap finding graded blocker is verified via the bypass, so it *can*
  reach the gate.)

## Cost effect

- Judge dispatches drop from `3 × distinct` to `3 × min(distinct, cap)` (plus any
  blocker-bypass findings beyond the cap).
- The only new cost: dedup becomes one LLM agent call (previously free code).
- Net win whenever distinct findings exceed the cap, which is the motivating case.

## Files touched

- `skills/roast/SKILL.md` — document depth levels, default, the dedup-and-rank role,
  below-cap reporting; update the Output Format and Model Tiering (dedup agent tier).
- `skills/roast/roast-workflow.md` — update Step C (dedup → dedup-and-rank agent),
  Step D (cap + blocker bypass), Step F (report format), and the script skeleton
  (dedup becomes `await agent(...)`; cap/split logic; below-cap passthrough).
- Possibly a new `skills/roast/dedup-rank-prompt.md` for the dedup-and-rank agent
  prompt (mirrors the existing per-role prompt files).

## Out of scope

- Changing critic or judge prompts beyond what the new dedup role requires.
- Any change to how gate severity is computed (still median of confirming judges).
- Per-finding cost accounting in the report beyond the existing coverage counts.
