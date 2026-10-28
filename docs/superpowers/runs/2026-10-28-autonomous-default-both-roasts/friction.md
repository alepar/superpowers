# friction log — 2026-10-28-autonomous-default-both-roasts
- [2026-10-28] super-roast design r1 · rung: Workflow
- [2026-10-28] super-roast design r1: dedupe and reporter failed on "Login expired"; human re-logged in; resumed the same Workflow run (wf_1452b3a4-e03) so cached scouts replay · workaround: resumeFromRunId
- [2026-10-28] phase 3: first coordinator launch passed a literal placeholder invocationId; stopped before any Launch/ledger write (verified: ledger has only the Context line, no worktree, bead untouched); relaunched with the minted id
- [2026-10-28] code roast r1 assembler: review input selection: provenance unavailable; captured source available — 2115 gaps, all missing captured files of archived invocation inv-mvc60k41-xt8p35rk04d in base's 2026-10-16-workflow-reliability run (not this branch); ran a bounded direct review of product paths at the same captured base/head; round review remains unavailable for acceptance
- [2026-10-28] report-verdict --complete failed on the design roast r1 report ("finding text without a list marker in Unverified nits (spot-checked)": reporter wrapped an item onto a second unbulleted line); design-roast source extraction left as a coverage gap
- [2026-10-28] code roast r2 assembler: same typed result as r1 (provenance unavailable; captured source available; 2115 base-history gaps); bounded direct review again
- [2026-10-28] scope-dispositions --project --keys mixes final-review prose keys with [SEV] roast keys; super-roast assemble-args --punch-listed rejects non-[SEV] lines; passed a [SEV]-only filtered copy
- [2026-10-28] session ended mid code-roast r2 (wf_6c439a6d-1c3); scratchpad lost; regenerated the identical engine script and resumed with resumeFromRunId; run marker re-registered
