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
    - Cap at 3. **Lean toward recall:** a missed domain means its typical traps are never
      surfaced (a silent gap), whereas a wrong domain is cheaply rejected later. If a domain is
      plausibly relevant, name it. Only output "none" when the design is genuinely generic.
    - One short line of rationale per label.

    Do NOT review the design or list flaws — only classify.

    ## Output contract
    - `domains: [<label>, ...]` (or `domains: [none]`)
    - one rationale line per label
```
