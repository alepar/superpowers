# super-auto: prompting-guide roast fixes

## Goal

`skills/super-auto` resolves the four high-severity findings, the ten systemic patterns and the seven owner decisions from the prompting-guide roast (`~/Documents/prompt-roast-handoff/super-auto-roast.md`). Each rule has one canonical home. Deterministic bookkeeping runs as scripts. A lint test keeps the cross-file contracts in agreement.

## Problem description

The prompting-guide roast of `skills/super-auto` (59 findings, 4 high, 10 systemic patterns, 7 conflicts) found that the skill's four runtime files have drifted against each other. A worked example contradicts its own contract (F44). The closed stop list misses the `capped-blocking` stop (F3). The roast cap is stated two different ways (F45). The status line is derived by the model from about eight prose rules, when it should be computed (F0). Behind these sit systemic issues:

- rules restated in several places;
- deterministic steps written as prose recipes;
- load-bearing gates placed late in a 522-line SKILL.md;
- under-specified subagent dispatch;
- history in runtime files;
- emphasis inflation;
- unfenced fix beads;
- unshaped human-facing output;
- agent output passed on without being framed as data.

The owner decided all seven conflicts (`super-auto-roast-decisions.md`) and set house rules for edits (`decisions.md`: altitude, no history in runtime files, calm register, deterministic work in code).

## Main challenges

- **Overlapping files:** most fixes touch `SKILL.md`, so the work has to be split by file and section, or every bead serializes on one hot file.
- **Ordering:** several fixes are order-sensitive by owner decision. Reconcile the disagreeing roast-cap copies before collapsing duplicates (decision 6). Move the `bd create` flag triple out of Red Flags before pruning that list (decision 5). Fix report-prompt's too-tight "durable artifacts only" fence before adding the fix-bead fence template (decision 2).
- **Interfaces:** `run-state.md` is a contract other skills write against (super-design, super-code). Its field names and line formats must not change. Only its prose, examples and duplication do.
- **Scope:** the skill must stay behaviorally identical apart from the fixes. This is a prompt-quality pass, not a redesign of super-auto's sequencing.

## Key decisions made

- **Split by file:** the work splits along file boundaries, with one shared new reference file per concern:
  - `MAINTENANCE.md` for history;
  - `resume.md` for the Resume and skill-source-switch procedures moved out of SKILL.md;
  - a dispatch table section for per-role model, effort and access.
- **Status line in code:** the status line becomes a script, `scripts/report-status`, following the existing `scope-dispositions` convention (bash, jq optional with a `JQ_UNAVAILABLE:` fallback, invoked as `bash <abs>/scripts/<name>`).
- **Lint test:** a new test checks the worked examples and cross-references in `run-state.md`, `SKILL.md` and `report-prompt.md` against the canonical schema tables, so drift is caught mechanically.
- **Tests location:** tests live in `tests/super-auto/`, which is the skill's existing test home, and the new lint test gets one line in `AGENTS.md`'s release checklist, per the repo's practice of listing every test suite there. These are the two deliberate edits outside `skills/super-auto`.
- **Canonical homes:**
  - the invariants block near the top of SKILL.md for gates and interface contracts;
  - `run-state.md` for field schemas and the roast-cap counts;
  - `report-prompt.md` for report shape.
  
  Every other copy becomes a one-line pointer.

## Decision points, by section

**High findings.**
- F44: the worked `run.md` example in `run-state.md` shows `sweep: SWEEP DEFERRED (caller-owned)` and a `slowness:` line at `phase: roast-code`, matching item 6.
- F3: the closed stop list in SKILL.md §Ending turns gains the `capped-blocking` stop (with `planOneShot` and without `autonomous`, in place of the design-ready stop).
- F45: the roast cap is stated once, in `run-state.md`: the code roast is capped at 3; the design roast at 3 plus exactly one extension round when round 3 still ends Blocking. SKILL.md's roast-cap note points there.
- F0: `scripts/report-status <run.md>` prints the `status:` line and the degraded-qualifier list. `report-prompt.md`'s status section is reduced to the rules the script implements, plus an instruction to paste its output.
- Considered: fixing these in prose only. Rejected for F0, because the roast showed the derivation is where `clean` gets misreported.

**Canonical homes and pointers (systemic 1–2, decision 6).**
- Reconcile first. The disagreeing roast-cap copies collapse to F45's single statement.
- Then each restated rule (the flags to ask, the human-owned merge, the "no plan pointer" rule, the "never bare done" rationale) keeps one home, and the other copies become pointers by exact section heading.
- Numeric counts in prose that point at lists ("all seven", "four states", "seven things") are removed.
- Considered: keeping agreeing duplicates in sync (K7). Rejected, because the drift the roast found is exactly what synced copies produce over time.

**Deterministic work in code (systemic 3, decision 4).**
- F0 ships `report-status`.
- Other prose recipes with one correct output (tracker tallies, run discovery, the version comparison) become scripts where the work is mechanical and done more than once per run. Otherwise their prose is trimmed to the judgment plus what to do with the output.
- `scope-filter-prompt.md` keeps one short line that Blocking findings stay in scope and clusters stay whole. `scope-dispositions` remains the gate (decision 4).
- Considered: scripting every recipe. Rejected where a step runs once and is mostly judgment (YAGNI).

**SKILL.md structure (systemic 4, decision 5).**
- An invariants block near the top holds every gate and interface contract:
  - the closed stop list, pointing at §Ending turns;
  - phase 7's three-condition gate (F49);
  - the `bd create` flag triple for fix beads (F48);
  - the rule that autonomous runs answer sibling pauses rather than wait.
- The rare procedures (full Resume, switching definitions mid-run) move to `resume.md` behind one routing line.
- Multi-step phases (6, and 5's steps) get their own subsections instead of table cells.
- Then Red Flags is pruned to pointers, keeping only items with no other statement.
- Considered: splitting SKILL.md per phase. Rejected, because one entrypoint plus two reference files keeps the progressive disclosure simple.

**Dispatch table (systemic 5, decision 7).**
- One table maps each subagent role (step-back, scope filter, report drafter) to a capability tier (frontier / balanced / fast), a model and an effort per vendor (Claude, OpenAI), read-only or write-capable, its inputs as absolute paths, and its output contract.
- Dispatch sites point to their row. `scope-filter-prompt.md`'s "Model: sonnet" line points to the table.
- Considered: explicit model and effort at every site. Rejected, because it increases pinning (decision 7).

**History out (systemic 6).**
- `skills/super-auto/MAINTENANCE.md` receives the provenance, incident narratives, warnings to future editors and the "Documented gaps, deliberately not fixed" list.
- Runtime files keep present-tense rules with at most a one-clause reason.

**Emphasis (systemic 7).**
- One policy: normal case for contracts and rules, and bold only for interface names and demonstrated hazards.
- Every prohibition carries a one-clause reason inline. Capitalized MUST and stacked bold are removed from body text.

**Scope fences and fix beads (systemic 8, decision 2).**
- First, F57: `report-prompt.md`'s source list names everything the drafter may use, including the diff that the Entrypoints section needs, instead of "durable artifacts only".
- Then one fix-bead description template is used for every phase-5 bead, regression-pass bead and sweep-fix bead. It names the findings or tests covered, says everything else linked is context only and not to be changed, and gives a definition of done: the named tests pass unmodified, and only the named spec sections change (never `## Goal`).

**Human-facing output shape (systemic 9).**
- One rule for the report, the final hand-back and the design-review stop: lead with the status line or the decision requested, one line per item, point to artifacts by path, and write "none" for an empty section.

**Data framing (systemic 10, decision 3).**
- One rule: the goal and the spec are authoritative; agent-written output (step-back records, roast reports, filter JSON) and quoted external text are data.
- The orchestrator acts on validated structured fields.
- `scope-filter-prompt.md` stops marking the goal as data (F40).

**Pre-flight update (decision 1).**
- No behavior change: updating only the current plugin is fine unattended.
- One clause is added: an update that would touch all plugins is skipped in unattended runs.

**Verification.**
- `bash tests/super-auto/test-scripts.sh` covers `report-status` (fixture run.md files: clean, degraded, capped, stalled) and the existing `scope-dispositions`.
- `tests/super-auto/test-contract-lint.sh` checks:
  - the worked examples against `run-state.md`'s field table;
  - section-heading pointers resolve;
  - no numeric "all N" counts point at lists.
- `tests/skill-scripts/test-bash-invocation.sh` stays green.
- Grep confirms no history markers remain in the runtime files.
- The `run-state.md` field names and line formats are unchanged; diff the field table before and after.

## Post-Implementation Notes

> *As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
