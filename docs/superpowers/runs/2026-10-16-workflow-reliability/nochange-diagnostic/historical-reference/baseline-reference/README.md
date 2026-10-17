# Workflow reliability behavior baseline

This pack tests judgment through bounded text decisions, not live tool execution or mechanical helpers. It has three composite cases; five fresh runs per case and variant, one active test agent at a time. `control` has no tested workflow guidance; `baseline` receives verbatim installed 6.0 excerpts, recorded by full and excerpt SHA-256 in `source-manifest.json`. Excerpt applicability is limited to the role being simulated.

Common harness system/developer context and catalog are present in both arms. These are fresh-context instruction-ablation trials, not blank-system model trials. Case facts are deliberately concrete and pressure combines deadline, sunk-cost/team expectations, and authority. No rubric is shown to children.

Run messages are preserved in `*-prompt.txt` (exact spawn payload); scenario and guidance file contents form its referenced prompt input. Raw final responses go in `*-response.txt`. Agent IDs/model/effort and manual scores are recorded separately. No claims about process safety or schema/helper behavior can be inferred from these responses.

Reuse: after implementation freeze the relevant source text, create `after/guidance-<case>.txt` with exact source hashes/ranges, and run these same scenario and wrapper messages in fresh agents five times per case. Do not supply rubric or prior results. Compare claim-wise counts descriptively; five samples do not establish production reliability or strong causal effects. Add guidance only for demonstrated judgment failures; all-control successes supply no positive evidence that additional judgment prose is needed. Mechanical code/schema obligations have independent deterministic tests.
