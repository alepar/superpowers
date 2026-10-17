# Trigger micro-test (maintenance procedure — not loaded at skill invocation)

Re-run this probe set before changing this skill's frontmatter `description`. Three fresh haiku
subagents, each given *only* the description plus one scenario, asked "would you invoke this
skill? yes/no."

| Probe | Scenario | Expected | Result |
|---|---|---|---|
| (a) | "the super-auto run just finished and its report is written — run the feedback pass" | yes | yes |
| (b) | "file a bug about my app's login flow" | no | no |
| (c) | "report this skill defect upstream to the superpowers repo" | yes | yes |

3/3 on the initial wording (2026-08-26); the description was not tightened.
