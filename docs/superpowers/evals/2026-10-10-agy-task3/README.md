# Task 3 requirements-source eval

Twenty independent fresh-context Codex subagents: five repetitions each of baseline initial dispatch, revised initial dispatch, baseline blocker triage clarification, revised blocker triage clarification. Each receives the same fixture (post-plan task amendment to seven days; frozen plan thirty days; empty comments), selects and executes context reads, and reports the intended requirements without changing source or live tracker state.

The unchanged baseline is commit `4c25b51` (`v6.4.2-alepar4.20`). The committed role templates and dispatch excerpts preserve the evaluated guidance; subsequent coordinator changes concern mechanical merge/closure recovery and do not change that requirements-source guidance.

| Scenario | Baseline correct | Revised correct |
|---|---:|---:|
| Initial dispatch | 1/5 | 5/5 |
| Blocker triage retry clarification | 5/5 | 5/5 |

PASS requires choosing the current task-description read and honoring its explicit seven-day amendment. All final responses were manually read before scoring. Baseline initial samples 1–4 planned stale thirty-day implementation; sample 5 selected seven days. Every revised sample and every triage sample selected seven days. Triage was already compliant and shows non-regression, not measured improvement.

The committed role-template snapshots preserve full unchanged and revised implementer and triage guidance. Large full coordinator/workflow snapshots were moved after execution to `/tmp/2026-10-10-agy-task3-full-context/`; `archived-context.json` preserves their original source paths, SHA256 and scratch paths. `*-dispatch-excerpts.js` preserves the relevant actual dispatch builders. The exact executed prompts retain their original historical snapshot references; those full references resolved during evaluation. `initial-prompt.txt` and `triage-prompt.txt` are baseline tasks; `after-*-prompt.txt` use revised role templates and render the actual new `currentRequirements` dispatch recipe. All exact final responses are `*-response.md`, scoring is in `*-scores.json`, and snapshot SHA256/metadata is in `*-metadata.json`.

This evaluates requirement selection and triage's intended retry clarification, not end-to-end implementation or execution of the retry. Workspace setup is pre-completed, process hygiene abbreviated; full role templates are supplied via paths, with full coordinator/workflow context available rather than forcibly injected. Tracker reads use `fixture.py`, no live tracker. Exact tool-call transcripts are not exported; chosen reads are self-reported in preserved final responses. Models are inherited and the precise hidden model identifier is not asserted. One revised initial agent also read `harness.md` (method/fixture description only, no scores); its direct task read still provides primary requirement evidence.
