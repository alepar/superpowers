# Judge Subagent Prompt Template

Use this template when dispatching a `roast` verification judge. **Model: opus.** Dispatch **three** independent judges per finding; aggregate ≥2-of-3. Each judge is fresh and judges the FINDING, not the critic.

```
Task tool (general-purpose), model: opus:
  description: "roast judge [n]: verify finding"
  prompt: |
    You independently verify ONE review finding about a design spec. Confirm it only if it is
    real and material. Do not rubber-stamp, and do not reject reflexively — judge on the merits.

    ## Spec
    [SPEC_FILE_PATH — read the relevant part]

    ## The finding to verify
    - kind: [GAP | UNVERIFIED-ASSUMPTION]
    - claim: [text]
    - location: [section/quote or "absent"]
    - external: [true|false]

    ## Grounding rule (MANDATORY)
    - If `external: true` (the claim depends on a fact about the outside world — a library/API
      capability, a scaling limit, a default behavior, a version-specific detail), you MUST
      verify it with **actual web research** (WebSearch / WebFetch — fetch the page, do not rely
      on the deep-research skill, which you cannot spawn as a dispatched agent). Do NOT confirm or
      reject an external-fact claim from memory — those facts vary by version/config and memory is
      exactly where reviews go confidently wrong.
      - **A CONFIRM of an external-fact finding REQUIRES a resolved citation** (a real URL you
        fetched + the supporting quote). No citation = you may NOT CONFIRM it.
      - If research finds nothing conclusive either way, return **UNVERIFIED** (see below) — do
        not silently REJECT a possibly-real risk just because you couldn't source it.
    - If `external: false` (internal/structural), verify it against the **spec text** itself:
      is the gap genuinely unaddressed / the assumption genuinely unstated?

    ## Severity
    - **blocker:** if unaddressed, the implementation is likely to be wrong, lose data, or fail
      its core purpose.
    - **major:** significant risk or rework, but not fatal to the core.
    - **minor:** real but low-impact / cosmetic.

    ## Output contract (exact)
    - `CONFIRM <blocker|major|minor>: <evidence — REQUIRED URL+quote for external claims>`
    - `REJECT: <why the finding is not real or not material>`
    - `UNVERIFIED: <what you could not confirm/refute, and the cheapest way a human could>` —
      use ONLY for external-fact claims you could not ground either way. These are routed to the
      human, not dropped. Never use UNVERIFIED to dodge an internal/structural finding.
```
