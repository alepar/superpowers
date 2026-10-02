Behavioral probe (2026-10-02, fresh Sonnet agents, same six scenario questions; base = 2bf1d53 skills/super-auto, branch = 060c662 minus MAINTENANCE.md):
1 resume at fix-loop — base: correct, runs pre-flight first · branch: correct replay/filter/file order, did not mention pre-flight (resume.md stands alone; add a first line that pre-flight runs before it)
2 capped design roast (planOneShot, not autonomous) — both: roastDesignCapped stopped, phase capped-blocking, no phase 3 · branch names it stop 4
3 scope-filter model/effort — base: sonnet, effort unspecified (harness default) · branch: sonnet enforced, effort advisory, OpenAI model+effort together (improved)
4 fix-bead flags — both: --parent, --no-inherit-labels, -l sp:<root> with reasons (base via Red Flags, branch via Invariant I3)
5 after compaction — base: re-read run.md, refresh codeBuckets from tracker · branch: re-read run.md + invariants, never re-invoke (improved; tracker refresh not mentioned)
6 status line / report.md — base: model composes status from report-prompt rules · branch: report-status output pasted verbatim, orchestrator writes report.md (improved)
