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
      verify it with **actual research** (superpowers:deep-research or web search) and cite what
      you found. Do NOT confirm or reject an external-fact claim from memory — those facts vary
      by version/config and memory is exactly where reviews go confidently wrong.
    - If `external: false` (internal/structural), verify it against the **spec text** itself:
      is the gap genuinely unaddressed / the assumption genuinely unstated?

    ## Severity
    - **blocker:** if unaddressed, the implementation is likely to be wrong, lose data, or fail
      its core purpose.
    - **major:** significant risk or rework, but not fatal to the core.
    - **minor:** real but low-impact / cosmetic.

    ## Output contract (exact)
    - `CONFIRM <blocker|major|minor>: <evidence — cite sources for external claims>`
    - `REJECT: <why the finding is not real or not material>`
```
