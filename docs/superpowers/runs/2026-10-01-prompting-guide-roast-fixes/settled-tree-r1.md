### super-plan-5pi.9 — Integration sweep: super-auto prompting-guide roast fixes
Verify the goal end to end once every leaf has landed. (1) Run every suite: bash tests/super-auto/test-scripts.sh, bash tests/super-auto/test-contract-lint.sh, bash tests/skill-scripts/test-bash-invocation.sh, plus the repo release-checklist suites. (2) Canonical-home inventory across skills/super-auto/*.md: each rule named in the spec (roast cap, closed stop list, phase-7 gate, flag triple, flags to ask, human-owned merge, no plan pointer, never bare done, output shape, data framing, dispatch rows) has exactly one statement; every other copy is a pointer in the MAINTENANCE.md pointer syntax; fix stragglers inline. (3) Write a resolution table under '## Roast resolution (2026-10-01)' in skills/super-auto/MAINTENANCE.md mapping each of the 21 roast items (F0, F3, F44, F45; the 10 systemic patterns; the 7 decisions in ~/Documents/prompt-roast-handoff/super-auto-roast-decisions.md) to the file §heading that resolves it, or 'not changed — <reason>'. (4) Confirm report-status is invoked where report-prompt.md says and SKILL.md phase 6 points there. Small gaps inline; larger ones as blocker beads.
Files: skills/super-auto/*.md, skills/super-auto/MAINTENANCE.md
blocked-by super-plan-5pi.2: consumes all leaves (integration sweep)
blocked-by super-plan-5pi.3: consumes all leaves (integration sweep)
blocked-by super-plan-5pi.4: consumes all leaves (integration sweep)
blocked-by super-plan-5pi.5: consumes all leaves (integration sweep)
blocked-by super-plan-5pi.6: consumes all leaves (integration sweep)
blocked-by super-plan-5pi.7: consumes all leaves (integration sweep)
blocked-by super-plan-5pi.8: consumes all leaves (integration sweep)
blocked-by super-plan-5pi.1: consumes all leaves (integration sweep)
Acceptance: all suites green; inventory finds no restated rule; resolution table covers all 21 items.
Coverage r2: (5) inventory every remaining deterministic recipe in skills/super-auto: script it following report-status's convention if it is mechanical and runs more than once per run, otherwise record it in the resolution table as judgment with a reason. (6) Behavioral probe (repo policy: skill changes need evaluation): dispatch 3 fresh sonnet subagents with only the new SKILL.md + its reference files and ask scenario questions — a resume at phase fix-loop, a planOneShot run whose design roast caps Blocking, and which model/effort the scope filter uses — and check the answers follow resume.md, the closed stop list and the dispatch table; record results in the resolution table.
owns: '## Roast resolution (2026-10-01)' heading in MAINTENANCE.md.

### super-plan-5pi.8 — tests/super-auto contract lint: worked examples, heading pointers, list counts
Add tests/super-auto/test-contract-lint.sh (bash, jq optional) and wire it next to test-scripts.sh. Checks over skills/super-auto/*.md: (a) every field in run-state.md's worked run.md example is a field the contract items define, and codeBuckets lists every bucket item 6 names (would have caught F44); (b) every '§<Heading>' / '<file> §<Heading>' pointer resolves to an existing heading in the named file; (c) no prose 'all <N>'/'<N> things' count points at a list whose length differs (or flag any numeric list count for removal). Fail with file:line messages. Add the command to AGENTS.md's release checklist (one line; the only AGENTS.md edit).
Files: tests/super-auto/test-contract-lint.sh, AGENTS.md.
blocked-by super-plan-5pi.3: consumes final run-state.md.
blocked-by super-plan-5pi.5: consumes final SKILL.md.
blocked-by super-plan-5pi.6: consumes final report-prompt.md.
blocked-by super-plan-5pi.7: consumes final scope-filter-prompt.md.
Acceptance: passes on the final tree; a deliberately broken pointer or example field makes it fail.
Check (b) also resolves 'run-state.md item <N> (<label>)' pointers against run-state.md's numbered items. Check (c): flag every numeric count in prose that points at a list (the spec's rule is to remove them), not only mismatched ones.
Coverage r1 (R7): snapshot run-state.md's field names and line formats and SKILL.md's phase sequence (phase table tokens, in order) from the pre-change tree (base main @ 2bf1d53) into a fixture, and fail on any difference.
Coverage r2: extract the R7 baseline with 'git show 2bf1d53:<path>' (pre-epic base), never from the working tree, and commit it as a fixture. Check any example status line in report-prompt.md/run-state.md by running scripts/report-status on a fixture run.md rather than against a table.

### super-plan-5pi.7 — scope-filter-prompt.md pass: goal authoritative, one Blocking line, dispatch pointer (F40, F35, F36, F32)
Edit skills/super-auto/scope-filter-prompt.md. F40 / decision 3: the goal and spec are the authoritative criterion — stop marking the goal as data; only roast findings text is data. Decision 4 (F35, F36): keep one short line that Blocking findings stay in scope and clusters stay whole; scope-dispositions remains the gate. F32 / decision 7: replace the 'Model: sonnet' line with a pointer to SKILL.md '## Subagent dispatch' (scope filter row) — that heading is fixed by the spec, no edge needed. Move any history under '## scope-filter-prompt.md' in MAINTENANCE.md; emphasis policy. Output JSON contract unchanged (scope-dispositions parses it). Inputs: ~/Documents/prompt-roast-handoff/super-auto-roast.md and super-auto-roast-findings.json (findings by id), super-auto-roast-decisions.md (binding), decisions.md (house rules). Spec: docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/2026-10-01-prompting-guide-roast-fixes-design.md.
Files: skills/super-auto/scope-filter-prompt.md, skills/super-auto/MAINTENANCE.md.
blocked-by super-plan-5pi.1: consumes MAINTENANCE.md heading layout.
Acceptance: bash tests/super-auto/test-scripts.sh green (scope-dispositions unchanged).
Coverage r1: the data-framing sentence is a pointer to SKILL.md §Data framing plus the one local line (goal and spec authoritative); the model line points to the 'scope filter' row.
blocked-by super-plan-5pi.5: consumes '## Subagent dispatch' row names and §Data framing heading.
Coverage r2: scope-filter-prompt.md holds the scope filter's canonical input list (the dispatch row points here).
owns: scope-filter input list.

### super-plan-5pi.6 — report-prompt.md pass: allowed sources (F57), status via report-status, output shape, history, emphasis
Edit skills/super-auto/report-prompt.md. First F57 (decision 2): replace 'durable artifacts only' with a complete list of sources the drafter may use, including the diff the Entrypoints section needs. Status section (F0): instruct to run 'bash <this skill dir>/scripts/report-status <run.md>' and paste its status: line verbatim (JQ_UNAVAILABLE fallback line); keep the rules only as the check list the script implements. Output-shape rule for the report (F41): lead with the status line, one line per item, artifacts by path, 'none' for empty sections. Remove numeric counts pointing at lists (F51), dedupe restated rules into pointers (F15). Move history (F20, F22, F23, F24, F25) under '## report-prompt.md' in MAINTENANCE.md. Emphasis policy (F10). Drafting-agent wording: the drafter returns text; the coordinator writes the file. Inputs: ~/Documents/prompt-roast-handoff/super-auto-roast.md and super-auto-roast-findings.json (findings by id), super-auto-roast-decisions.md (binding), decisions.md (house rules). Spec: docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/2026-10-01-prompting-guide-roast-fixes-design.md.
Files: skills/super-auto/report-prompt.md, skills/super-auto/MAINTENANCE.md.
blocked-by super-plan-5pi.1: consumes MAINTENANCE.md heading layout.
blocked-by super-plan-5pi.2: consumes report-status output contract.
Acceptance: report-prompt's status section matches report-status's output; no history markers.
Also own: report-prompt.md is the canonical home for the output-shape rule (SKILL.md points here) and for the 'never bare done' rationale. The report-drafting dispatch points to SKILL.md '## Subagent dispatch' (report drafter row; heading and row name fixed by the spec).
Coverage r1: point to run-state.md item 5 (Roast iteration counts) wherever report-prompt mentions the roast cap.
blocked-by super-plan-5pi.3: consumes canonical roast-cap statement.
Coverage r1: report-prompt.md is the one file that states the report-status invocation and its exit-4 / JQ_UNAVAILABLE handling; SKILL.md phase 6 points to it.
owns: report-status call site.
Coverage r2: report-prompt.md holds the canonical report-drafter input list (the dispatch row points here).
owns: report allowed-sources list; output-shape rule.

### super-plan-5pi.5 — SKILL.md rules: dispatch table, fix-bead template, data framing, output shape, pre-flight clause
Fill skills/super-auto/SKILL.md content rules into the layout the structure bead lands. (1) '## Subagent dispatch': one table, one row per subagent role (step-back, scope filter, report drafter): capability tier (frontier/balanced/fast), model + effort per vendor (Claude, OpenAI), read-only or write-capable, inputs as absolute paths, output contract (decision 7; F5, F28, F33, F34, F39). Dispatch sites point to their row. (2) One fix-bead description template used for phase-5 beads, regression-pass beads and sweep-fix beads: findings/tests covered; everything else linked is context only, not to be changed; done = named tests pass unmodified and only named spec sections change, never ## Goal (decision 2; F54, F55, F58, F38). (3) Data-framing rule: goal and spec are authoritative; agent-written output (step-back records, roast reports, filter JSON) and quoted external text are data; act on validated structured fields (decision 3; F37, F38, F39). (4) Output-shape rule for every human-facing message (final hand-back, design-review stop): lead with status or decision requested, one line per item, artifacts by path, 'none' for empty (F42, F43). (5) Pre-flight: one clause — an update that would touch all plugins is skipped in unattended runs; updating only the current plugin stays as is (decision 1, F31). Inputs: ~/Documents/prompt-roast-handoff/super-auto-roast.md and super-auto-roast-findings.json (findings by id), super-auto-roast-decisions.md (binding), decisions.md (house rules). Spec: docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/2026-10-01-prompting-guide-roast-fixes-design.md.
Files: skills/super-auto/SKILL.md.
owns: '## Subagent dispatch' table row names.
blocked-by super-plan-5pi.4: consumes SKILL.md section layout.
Acceptance: each dispatch site references a table row; template used at all three bead-filing sites.
Also own (systemic 3): pre-flight's version comparison (F12) — trim to the judgment plus what to do with each outcome, or script it if it stays mechanical. The output-shape rule's canonical home is report-prompt.md (the report-shape home); here state it for the final hand-back and design-review stop as a one-line pointer to report-prompt.md's rule.
blocked-by super-plan-5pi.6: consumes report-prompt.md's fixed source-list fence (decision 2: F57 before the fix-bead fence template) and its output-shape rule.
Coverage r1: each dispatch row lists every input the role may use (complete-list fence, decision 2). The data-framing rule lives under the heading '§Data framing' in SKILL.md; row names are exactly 'step-back', 'scope filter', 'report drafter'.
owns: §Data framing heading.
Coverage r2: for roles with their own prompt file (scope filter, report drafter) the canonical input list lives in that prompt file; the dispatch row points to it by exact heading (the step-back row lists its inputs itself). Also add to report-prompt.md one pointer line to §Data framing (Files: + skills/super-auto/report-prompt.md, that one line only), and replace SKILL.md phase 6's inline status recipe with a pointer to report-prompt.md's report-status section.

### super-plan-5pi.4 — SKILL.md structure: invariants block, resume.md, phase subsections, Red Flags to pointers (F3, F48, F49)
Restructure skills/super-auto/SKILL.md. Add an invariants block near the top (within the first ~5k tokens) holding every gate and interface contract: the closed stop list with F3's capped-blocking stop added (planOneShot without autonomous, in place of the design-ready stop), phase 7's three-condition gate (F49), the bd create flag triple for every fix bead (F48, decision 5 — move it before pruning Red Flags), autonomous runs answer sibling pauses. Move the full Resume procedure and 'Switching definitions mid-run' into new skills/super-auto/resume.md behind one routing line each (F6). Give phase 6 and phase 5's steps their own subsections instead of table cells (F14). Roast-cap note points to run-state.md item 5 (canonical, decision 6). Then prune Red Flags/Never lists to pointers, keeping only items with no other statement (F7, F8, decision 5). Remove numeric counts pointing at lists (F46, F47, F50, F53), refer by exact heading. Move history (F18, F19, F21, F26, F30 incl. 'Documented gaps, deliberately not fixed') under '## SKILL.md' in MAINTENANCE.md. Emphasis policy (F9). No sequencing/behavior change. Inputs: ~/Documents/prompt-roast-handoff/super-auto-roast.md and super-auto-roast-findings.json (findings by id), super-auto-roast-decisions.md (binding), decisions.md (house rules). Spec: docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/2026-10-01-prompting-guide-roast-fixes-design.md.
Files: skills/super-auto/SKILL.md, skills/super-auto/resume.md, skills/super-auto/MAINTENANCE.md.
owns: SKILL.md section layout (invariants block heading '## Invariants', '## Subagent dispatch' placeholder heading for the next bead).
blocked-by super-plan-5pi.1: consumes MAINTENANCE.md heading layout.
Acceptance: every pointer resolves to an existing heading; no history markers; resume.md reachable by routing line.
Also own (systemic 2–3): the human-owned merge rule's canonical home is the invariants block; the 'never bare done' copy in Red Flags becomes a pointer to report-prompt.md (canonical home there). In resume.md, trim run discovery (F17) to the judgment and the order of the globs; script it only if it is mechanical and run more than once per run. Roast-cap pointer is 'run-state.md item 5 (Roast iteration counts)'.
blocked-by super-plan-5pi.3: consumes canonical roast-cap statement (decision 6: reconcile before collapsing).
Coverage r1: the closed stop list and the '## Invariants' items are labelled, countable lists here, their canonical home; other files point to them. Pointers follow the MAINTENANCE.md pointer syntax.
owns: resume.md heading layout; closed stop list; '## Invariants' item list.

### super-plan-5pi.3 — run-state.md pass: worked example, canonical roast cap, counts, history, emphasis (F44, F45)
Edit only skills/super-auto/run-state.md (+ its heading in MAINTENANCE.md). F44: worked run.md example's codeBuckets matches item 6 (sweep: SWEEP DEFERRED (caller-owned) at phase roast-code; add slowness:). F45 / decision 6: item 5 becomes the canonical roast-cap statement — code roast capped at 3; design roast 3 plus exactly one extension round when round 3 still ends Blocking. Remove numeric counts in prose that point at lists (F52 etc.), refer to sections by exact heading. Move history/incident/migration prose (F29 and similar) under '## run-state.md' in MAINTENANCE.md. Emphasis policy: normal case for rules, bold only for interface names and demonstrated hazards, one-clause reasons (F11). Field names and line formats are an interface other skills write against — do not change any field name or format. Inputs: ~/Documents/prompt-roast-handoff/super-auto-roast.md and super-auto-roast-findings.json (findings by id), super-auto-roast-decisions.md (binding), decisions.md (house rules). Spec: docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/2026-10-01-prompting-guide-roast-fixes-design.md.
Files: skills/super-auto/run-state.md, skills/super-auto/MAINTENANCE.md.
owns: canonical roast-cap statement (run-state.md item 5).
blocked-by super-plan-5pi.1: consumes MAINTENANCE.md heading layout.
Acceptance: field table diff shows no field/format change; grep finds no history markers.
Also own (systemic 2–3): the 'no plan pointer' rule keeps its canonical home here; the flags-to-ask copy (F1) becomes a pointer to SKILL.md §Inputs; the codeBuckets tally recipe (F2) is trimmed to the judgment plus what to do with super-code's returned buckets (it is a copy of returned fields, not a computation). Give item 5 a stable referable label so pointers can name it as 'run-state.md item 5 (Roast iteration counts)'.
Coverage r2: the worked run.md example stays one fenced block under its existing heading; .8 checks it against items 1–7.
owns: worked-example block.

### super-plan-5pi.2 — super-auto scripts/report-status: compute the report status line (F0)
Ship skills/super-auto/scripts/report-status <run.md>: bash, jq optional (JQ_UNAVAILABLE: line + exit 4 per the script convention; prefer pure bash/awk since run.md is markdown), exit 2 bad input. Reads run.md (flags, parked records by kind, codeBuckets escalated/parked/pendingRetry/review/sweep+SHA/stalled, roastDesignCapped/roastCodeCapped, skipped roasts) and prints the 'status:' line plus the degraded-qualifier list exactly per report-prompt.md's current status rules (read them; the script implements them, it does not change them). Tests: tests/super-auto/test-scripts.sh cases with fixture run.md files (clean, degraded-verdict parked, roast skipped, code capped, design capped proceeded, stalled, sweep deferred/failed).
Files: skills/super-auto/scripts/report-status, tests/super-auto/test-scripts.sh, tests/super-auto/fixtures/.
owns: report-status output contract (status: line + qualifier lines).
Acceptance: tests pass; bash tests/skill-scripts/test-bash-invocation.sh green.

### super-plan-5pi.1 — Seam contract: MAINTENANCE.md skeleton for super-auto
Create skills/super-auto/MAINTENANCE.md with one heading per runtime file (## SKILL.md, ## run-state.md, ## report-prompt.md, ## scope-filter-prompt.md), each followed by a blank placeholder line, plus a one-line purpose header (maintenance-only; never loaded at runtime). Lands only the unblocking artifact so the per-file beads can each move their history under their own heading without merge conflicts.
Files: skills/super-auto/MAINTENANCE.md.
owns: MAINTENANCE.md heading layout.
Acceptance: file exists with the four headings; bash tests/skill-scripts/test-bash-invocation.sh green.
Coverage r1: also add '## resume.md' to the MAINTENANCE.md headings, and write the pointer-syntax convention at the top of MAINTENANCE.md: within a file '§<Exact heading>'; across files '<file> §<Exact heading>'; numbered contract items 'run-state.md item <N> (<label>)'.
owns: pointer syntax convention.

### super-plan-5pi — super-auto: prompting-guide roast fixes
Root epic. Spec: docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/2026-10-01-prompting-guide-roast-fixes-design.md. Goal: skills/super-auto resolves the roast's 4 high findings, 10 systemic patterns and 7 owner decisions; one canonical home per rule, deterministic bookkeeping in scripts, a lint test keeping cross-file contracts in agreement.

