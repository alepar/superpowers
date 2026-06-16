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
