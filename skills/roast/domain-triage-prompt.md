# Domain Triage Subagent Prompt Template

Use this template to classify a spec's domain(s) so `roast` can spin up 1–3 domain-expert critics. **Model: sonnet.** Lightweight — name the domains, don't review.

```
Task tool (general-purpose), model: sonnet:
  description: "roast domain triage: [spec name]"
  prompt: |
    Read this spec and name the technical domain(s) whose typical failure modes and
    load-bearing assumptions most apply. These pick the domain-expert critics.

    ## Spec
    [SPEC_FILE_PATH — read it]

    ## Your job
    - Output 1–3 domain labels, most relevant first (e.g., distributed-systems, auth,
      ml-pipeline, payments/billing, data-pipeline, realtime, browser-extension).
    - Cap at 3. If the design is generic with no strong domain, output "none".
    - One short line of rationale per label.

    Do NOT review the design or list flaws — only classify.

    ## Output contract
    - `domains: [<label>, ...]` (or `domains: [none]`)
    - one rationale line per label
```
