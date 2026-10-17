# Roast Findings Redesign Loop — Design

Vision: [2026-10-16-vision-roast-findings-redesign-loop.md](../../specs/2026-10-16-vision-roast-findings-redesign-loop.md) (its Decisions are binding). Research: `~/Documents/Roast_Replan_Loop_Research_20261016/final_report.md`.

## Goal

Both roast fix loops, super-auto phase 5 (code) and super-design §Adversarial Review Loop (design), make one validated choice per round: a **local** fix (today's path), or a **redesign** cycle. A redesign cycle runs super-design's new amend mode against a script-built findings ledger, then (code loop) super-code and a fresh code roast. Observable outcomes:

- A round whose prior Blocking findings are all still open, or that carries a regressed Blocking finding, cannot be answered `local`: `step-back-check` rejects it.
- Each loop gets up to 2 redesign cycles beyond its round cap, each recorded with its triggers.
- Every step-back and amend decision reads `findings-ledger.md`, not raw reports.
- All of this is covered by script tests.

## Problem description

Today's step-back answers `patch | redesign` from free judgment over raw roast reports. Nothing forces a redesign when patches demonstrably fail. A `redesign` applied in phase 5 is an in-place spec patch filed as fix beads inside the fix loop, never a design pass. When the open Blocking count does not shrink, the loop simply exits as thrash: the clearest "the design is wrong" signal ends the loop instead of triggering redesign. The design loop has the same shape without any validation of the step-back record.

## Main challenges

1. **Mechanical triggers need identities the reports don't fully give.** A regressed finding often comes back under a different location key (`coordinator.js:1401` → `:704` in the 2026-10-15 run). Exact-key matching alone misses it. The reporter's `delta vs prior:` line does count carried and regressed Blocking findings reliably.
2. **The redesign budget must not change super-roast.** Report naming, prior-report chaining and the `N of <cap>` header all assume numbered rounds.
3. **Amend mode must reuse super-design's machinery** (Key Abstractions sync, decomposition rules, coverage, design roast) without breaking its root-only, two-round coverage cap or recursing without bound.
4. **Many cross-file contracts to keep consistent:** run-state field names (contract-lint baseline), resume replay, report sections, and super-auto's read rule (I8).

## Key decisions made

The ledger and the trigger computation are **one script**, `skills/super-design/scripts/findings-ledger`. It writes the ledger file and puts a `triggers:` header line in it. Both loops call it after each roast round.

Triggers use the reporter's `delta vs prior:` counts for identity-robust signals, plus exact-key returns:
- **no progress:** `carried Blocking + regressed Blocking ≥ previous round's Blocking count > 0`, meaning none of last round's Blocking findings were resolved;
- **recurrence:** `regressed Blocking ≥ 1`, or a Blocking/Should-fix key that was absent from the immediately preceding round reappears.

`step-back-check` moves to `skills/super-design/scripts/` (both loops now use it). It gains a `--ledger` argument and enforces the trigger rules.

The redesign budget is implemented as an **effective cap**: `3 + redesignCycles` (design: `3 + 1 extension + redesignCycles`), with `redesignCycles ≤ 2`. Redesign rounds are ordinary numbered rounds, and the effective cap is passed to super-roast as `config.iterationCap`. Super-roast is unchanged.

**Amend mode** is a new super-design entry point, `§Amend Mode`, shared by both loops. A fresh opus **amend designer** (`amend-prompt.md`) edits the specs and returns a structured record. A new script, `amend-check`, validates it: every open ledger key is accounted for, `## Goal` is untouched, and an `## Unchanged behavior` section exists. The orchestrator then files beads per §Decomposition.

## Decision points, by section

### 1. Findings ledger — `skills/super-design/scripts/findings-ledger`

**Recommended:** a pure bash/awk script, no jq. Invocation:

`findings-ledger --loop code|design --out <ledger path> --report <round>=<report path> … [--punch-list <file>] [--overrides <file>]`

- **Per report:** it reads keys through the same rule `report-verdict --keys` uses (calling `super-code/scripts/report-verdict --keys`), the `delta vs prior:` line, and the `inputs: …@<sha>` / `iteration:` header.
- **Output file:**
  ```
  # findings ledger — <loop> — through r<N>
  triggers: none | <trigger>[, <trigger>] where trigger ∈ no-progress(<evidence>) | recurrence(<evidence>)
  blocking: r<N-1>=<n> r<N>=<n> carriedB=<n> regressedB=<n>
  - <key> · raised r<M>@<sha|-> · <status>
  ```
- **Statuses:**
  - `open`: confirmed in the latest round;
  - `open (returned r<N>)`: a key absent from round N-1 that reappears in N;
  - `resolved@r<K>`: confirmed earlier, absent from round K's confirmed keys and not punch-listed;
  - `punch-listed`;
  - `dissolved@r<K>` and `disputed (<reason>)`: these come from `--overrides`, one `<key> · <status>` line per entry, written by the orchestrator from step-back `dissolves:` and amend `disputes:`.
- Keys are carried verbatim, including `; ` multi-location keys. Round 1 has no delta line, so only `returned` can fire, and it can't on round 1.

**Considered:**
- *Per-key regressed status from inline prose marks:* rejected, because prose marks are not a contract and super-roast is out of scope.
- *Exact-key identity only:* rejected, because it misses relocated regressions (Challenge 1).
- *jq/JSON ledger:* rejected; the fork's scripts are bash/awk with JQ_UNAVAILABLE fallbacks, and this needs no JSON.

### 2. Triggers and the step-back decision

**Recommended:**
- **`step-back-prompt.md`:**
  - `decision:` becomes `local | redesign` (`patch` is still accepted as a synonym for `local` for one release, so in-flight runs resume).
  - Add `triggers: <comma list from {no-progress, recurrence, shared-cause, defect-type}> | none`.
  - The prompt receives the ledger path as primary input. Reports become reference-only.
  - The "What to look for" section is replaced by the four trigger definitions:
    - *shared cause:* ≥2 open findings stem from one design decision;
    - *defect type:* a finding touches an interface, a contract, shared data or behaviour visible from outside, rather than an algorithm or internal structure;
    - plus the instruction that a redesign must name the owning decision.
- **`step-back-check --step-back F --keys K --ledger L`** additionally rejects:
  - `local`/`patch` while the ledger's `triggers:` names a mechanical trigger;
  - `redesign` with `triggers: none`;
  - `triggers:` naming `no-progress` or `recurrence` when the ledger does not list it.
- **Design loop:** it now also runs `step-back-check`, which it never did before.

**Considered:**
- *The step-back agent computes all triggers:* rejected by decision 3 (the script is authoritative for mechanical triggers).
- *Fully scripted defect type:* rejected; it would need a new super-roast field (out of scope).

### 3. Code loop (super-auto §Phase 5)

**Recommended:** rewrite §Loop exits and §Step 1, and add **§Redesign cycle**:

- **Loop exits.**
  - `converged` is unchanged.
  - **Thrash** becomes: a mechanical trigger fired and `redesignCycles-code` = 2, or a redesign cycle's round ended with more Blocking than the round before it (last-known-good breach).
  - **Cap:** reaching `roastCodeRound` = `3 + redesignCycles-code`.
- **Step 1** runs `findings-ledger`, then the step-back with the ledger, then `step-back-check --ledger`.
  - `local`: today's Steps 2–4.
  - `redesign` + `scope: inside` + budget left: §Redesign cycle.
  - `redesign` + `outside`: parked as today, and the round runs `local`.
  - `redesign` with the budget spent: when a mechanical trigger fired, thrash exit; when only a semantic trigger fired, park it as a `degraded-verdict` `redesign budget spent` and run `local`.
- **§Redesign cycle:**
  1. Record `lastGood` (the integration tip SHA).
  2. Increment `redesignCycles-code` and write the `redesign-code-<K>` record.
  3. Invoke super-design §Amend Mode with the ledger, step-back record, run.md and the round's report paths.
  4. File the beads it returns (I3 flags, §Fix-bead template with the amended spec sections as context).
  5. Re-enter super-code (`deferSweep: true`).
  6. Run phase 4 as the next numbered round with `config.iterationCap` = the effective cap.
  
  Skipped in a redesign round: the scope filter, clusters and per-finding filing. Amend owns scoping, and its local findings arrive as plain beads.
- **After redesign:** the next roast's prior report is the pre-redesign round's report, so old findings are re-validated by the reporter's Step 3 (resolved / still-open). Fixers get beads, never the ledger's open list.
- **Regression-only pass, final-review items, punch lists, the post-cap audit and §Cap disposition:** unchanged, except that the thrash definition above feeds `roastCodeCapped:`.

**Considered:**
- *A separate iteration label like `redesign 1`:* rejected, because it breaks prior-report chaining in `assemble-args` (Challenge 2).
- *Automatic revert to `lastGood`:* rejected by the vision (destructive). The breach exits thrash and is reported.

### 4. Amend Mode (super-design, new §Amend Mode; both loops)

**Recommended:**

- **Inputs:** root epic id, root and nested spec paths, the ledger path, the step-back record, roast report paths (reference only), the run-state file, mode flags, and the loop (`code|design`).
- **Steps:**
  1. **Dispatch the amend designer** (`skills/super-design/amend-prompt.md`; opus, fresh context, writes only spec files, never `## Goal`). For each open ledger key it decides one of:
     - `owner: <spec path> §<section>`: a design decision owns it;
     - `local`;
     - `disputed: <reason>`.
     
     It edits the owning spec sections, writes or updates `## Unchanged behavior` in the root spec, and returns `amend-<loop>-<K>.md` with fields:
     - `owners:` (key → owner | local | disputed);
     - `amended:` (spec §s);
     - `work:` (one line per new work item: title | short description with owns:/consumes: | files-touched | covers: keys);
     - `unchanged:` (bullets).
  2. **Validate** with `scripts/amend-check --amend <file> --ledger <ledger> --specs <paths>`. It checks that every `open` key appears in `owners:`, that `git diff` shows no `## Goal` change, that `## Unchanged behavior` exists, and that every `work:` line covers ≥1 key. It prints `ok` or `reject:` lines, with exit codes 0/3/2 like `step-back-check`. On reject, re-dispatch once with the reject lines; if it fails again, the round runs `local` and the run records `redesign-…: aborted — amend rejected`.
  3. **Commit** the specs. Run the Key Abstractions sync when a `## Key abstractions` section changed.
  4. **File the `work:` items** as beads per §Decomposition (flag triple; under the root epic, or under the subepic that owns the amended spec). Code loop: these are post-hand-off beads, no sweep edges. Design loop: wired under the existing `Integration sweep:`, as today's step 1 does.
  5. **Coverage:** one extra round recorded as `coverage-amend-<loop>-<K>`, outside the two-round cap. Its `## Changes since the previous round` lists the amend's beads and amended sections.
  6. **Design roast:** only when `amended:` is non-empty *and* `roastDesignRound` is below the design effective cap. It runs a single round, confirmed findings are fixed on the local path, and no nested redesign happens inside amend.
  7. **Disputes:** written to the ledger `--overrides` as `disputed (<reason>)`. A disputed Blocking finding stays unresolved for `report-status` and is listed in Remaining.
- **Design loop:** `redesign` runs the same Amend Mode. Its "re-decompose" also supersedes open beads the amendment obsoletes (`bd supersede`), since nothing has executed yet.

**Considered:**
- *Literally re-brainstorming the owning level:* rejected; Mode B brainstorm rewrites whole specs, which is the regression the research warns about (16–27%).
- *Orchestrator edits specs itself:* rejected; it violates the I8 read rule and puts design work in the coordinator.
- *Full two-round coverage per amend:* rejected as disproportionate (decision 2: proportional).

### 5. Run state, resume, report

**Recommended:**

- **`run-state.md` §Field table, new fields:**
  - `findingsLedger: <path>` and `findingsLedgerDesign: <path>` (item 3, Pointers);
  - `redesignCycles-code: <K>` and `redesignCycles-design: <K>` (item 5, single-valued, written before each cycle starts);
  - `redesign-<code|design>-<K>: round <N> · triggers <list> · amended <§s|none> · lastGood <sha|-> · <applied|aborted — <reason>|thrash — lastGood breach>` (item 7).
- **Changed field:** the `stepBack…-round-<N>` line format now reads `local | redesign` (patch accepted on read).
- **Contract lint:** `tests/super-auto/test-contract-lint.sh`'s deliberate-additions list gains the new fields.
- **resume.md:**
  - A `redesign-code-<K>` record with no `amend-code-<K>.md` re-runs Amend Mode.
  - With the amend file but uncommitted specs, it applies the file.
  - With beads filed, it re-enters super-code.
  - Counters are never reset.
- **report-prompt.md:**
  - Gotchas & surprises lists each `redesign-*` record with its triggers.
  - Remaining lists `disputed` findings and parked `redesign budget spent` items.
  - The allowed sources gain the ledger and the amend files.

### 6. Moves and references

`skills/super-auto/scripts/step-back-check` moves to `skills/super-design/scripts/step-back-check`. Update every reference: super-auto SKILL.md, resume.md, MAINTENANCE.md mentions, and `tests/super-auto/test-scripts.sh` cases, which move to `tests/super-design/test-scripts.sh`.

**Considered:** leaving it in super-auto, rejected because super-design would then depend on super-auto's scripts.

### 7. Testing

- **`tests/super-design/test-scripts.sh`** (existing, already on CLAUDE.md's release list), extended with fixtures under `tests/super-design/fixtures/`:
  - **`findings-ledger`:**
    - round 1 only;
    - round 2 with every prior Blocking carried → `no-progress`;
    - same Blocking count with different keys and `carriedB=0` → `triggers: none`;
    - regressed Blocking → `recurrence`;
    - a key absent in r2 and back in r3 → `open (returned r3)` plus `recurrence`;
    - punch-list and overrides statuses;
    - `; ` multi-location keys.
  - **`step-back-check`:**
    - every existing case;
    - `local` rejected under a mechanical trigger;
    - `redesign` with `triggers: none` rejected;
    - a cited mechanical trigger the ledger lacks rejected;
    - `patch` accepted as `local`.
  - **`amend-check`:** a missing open key, a `## Goal` diff, a missing `## Unchanged behavior`, a `work:` line without covers.
- **Also must pass:** `tests/super-auto/test-contract-lint.sh` and `test-scripts.sh` (with the moved cases removed), and the full CLAUDE.md release test list.
- **Manual acceptance (report phase, not a bead):** replay the 2026-10-15 coordinator-subagent-compaction run's round-1 code roast report through `findings-ledger` and the amend designer. Record whether amend names a decision for the clustered findings.

## Post-Implementation Notes

> *As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
