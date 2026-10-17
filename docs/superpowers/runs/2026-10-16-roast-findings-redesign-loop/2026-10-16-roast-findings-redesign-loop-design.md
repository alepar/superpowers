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

`skills/super-auto/scripts/step-back-check` moves to `skills/super-design/scripts/step-back-check`. Update every reference: super-auto SKILL.md, resume.md, MAINTENANCE.md mentions, and `tests/super-auto/test-scripts.sh` cases, which move to `tests/super-design/test-step-back-check.sh`.

**Considered:** leaving it in super-auto, rejected because super-design would then depend on super-auto's scripts.

### 7. Testing

- **One test file per new or moved script** (decided at decomposition, so three beads don't serialize on one file): `tests/super-design/test-findings-ledger.sh`, `tests/super-design/test-step-back-check.sh` and `tests/super-design/test-amend-check.sh`, in the existing harness style, with fixtures under `tests/super-design/fixtures/<script>/`. The step-back-check bead registers all three in CLAUDE.md's release test list:
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

## Key abstractions

**Findings ledger** — new module (`skills/super-design/scripts/findings-ledger` plus the `findings-ledger.md` file format it writes): the only cross-round view of roast findings, and the only place mechanical triggers are computed.
- Owns: per-key identity across rounds (keys verbatim, `; ` multi-location included), each key's status (`open`, `open (returned rN)`, `resolved@rK`, `punch-listed`, plus `dissolved@rK` / `disputed (…)` taken from the overrides file), the `blocking:` counts line, and the `triggers:` header line (`no-progress`, `recurrence`, with evidence).
- Hides: how identity is decided (exact-key matching plus the reporter's `delta vs prior:` carried and regressed Blocking counts), the arithmetic of the two mechanical triggers, and the round-1 rule (no delta line, so only `returned` can fire). Keys come only through `super-code/scripts/report-verdict --keys`; headers come only from the `inputs:`, `iteration:` and `delta vs prior:` lines, never from report bodies.
- Must not: decide `local` vs `redesign` (the step-back agent does, gated by step-back-check); judge the semantic triggers `shared-cause` / `defect-type` (the step-back agent does); edit the overrides file (the orchestrator writes it from validated `dissolves:` / `disputes:` fields); keep state between calls.
- Relationships: delegates key extraction to report-verdict (super-design → super-code, the dependency direction I8 already sets). Its file is read by step-back-check, amend-check, the step-back prompt, the amend designer and report-prompt; nothing reads raw reports to route a decision.
- Lifecycle: each loop calls it after each roast round. Each call rebuilds the whole file from every round's report plus the punch list and the overrides file, so it is idempotent and resume-safe. There is one file per loop (`findingsLedger`, `findingsLedgerDesign`), owned by that loop, and the overrides file is that loop's to append to.
- Errors: exit 2 on bad input (a missing report, an unreadable overrides file, a report kind with no keys, i.e. report-verdict --keys exit 3). A round ≥2 with no `delta vs prior:` line is not an error: delta-based identity is reported as unavailable (`-`) in `blocking:`, and only the exact-key `returned` check can fire. Callers can therefore tell "no triggers" from "triggers not computable".

**Amend record and amend-check** — new module (the `amend-<loop>-<K>.md` format plus `skills/super-design/scripts/amend-check`): the structured contract between the amend designer and the orchestrator.
- Owns: the record's fields (`owners:`, `amended:`, `work:`, `unchanged:`; disputes are carried in `owners:`) and the rules a record must pass: every `open` ledger key appears in `owners:`; `git diff` shows no `## Goal` change; `## Unchanged behavior` exists in the root spec; every `work:` line covers ≥1 key.
- Hides: how `owners:` and `work:` are parsed (reusing step-back-check's split-on-`rN [` convention for key lists) and how specs are diffed.
- Must not: edit specs, file beads or write overrides (the orchestrator does, in Amend Mode); re-check the step-back record (step-back-check does).
- Relationships: reads the ledger's `open` keys and the spec files. It is a sibling of step-back-check with the same output and exit contract; the two share no code beyond that convention.
- Lifecycle: the amend designer writes one record per redesign cycle K. Once it passes the check it is immutable, and resume replays from it.
- Errors: 0 ok; 3 `reject:` lines (Amend Mode re-dispatches once with them, then aborts the cycle); 2 bad input, including a git failure, which must never read as a reject.

**Amend Mode** — new super-design skill section (`§Amend Mode`, with `amend-prompt.md`): the single redesign entry point both loops call, a Facade over super-design's spec-amending machinery.
- Owns: the sequence dispatch → amend-check (one retry) → commit specs (+ Key Abstractions sync when that section changed) → file `work:` beads per §Decomposition → one `coverage-amend-<loop>-<K>` round → an optional single design-roast round fixed locally → writing disputes to the ledger's overrides file.
- Hides: the per-loop differences, held in one closed table keyed by `--loop code|design`:
  - the code loop files post-hand-off beads with no sweep edges;
  - the design loop wires beads under `Integration sweep:` and `bd supersede`s obsoleted beads.
  
  It also hides how it reuses Key Abstractions sync, coverage and design roast while staying outside the two-round coverage cap, and the no-recursion rule (no redesign inside amend).
- Must not:
  - count or check the redesign budget, or write `redesignCycles-*` / `redesign-*` records;
  - run super-code or the next roast (the calling loop does all of these);
  - read raw reports to decide anything (the ledger is its input);
  - have the orchestrator edit specs (only the amend designer does, per I8).
- Relationships: the calling loop delegates to it. It composes the amend designer, amend-check, §Decomposition, §Key Abstractions sync, §Coverage and §Adversarial Review Loop (single local round). Dependencies point loop → Amend Mode → super-design internals, never back into super-auto.
- Lifecycle: invoked once per redesign cycle; stateless between cycles. Its durable outputs are the amend file, the spec commit, the beads and the coverage record. Resume re-enters at the first missing output.
- Errors: it returns one of three outcomes the caller can tell apart:
  - `applied`;
  - `aborted — amend rejected` (the caller runs the round `local`);
  - `aborted — <other cause>`.
  
  A failed coverage or design-roast round degrades and is recorded; it does not abort an applied amendment.

**Redesign budget** — new run-state concept (fields `redesignCycles-<loop>` and `redesign-<loop>-<K>` in `run-state.md` items 5/7, plus the effective-cap rule): how many redesign cycles a loop has spent, and the cap derived from them.
- Owns:
  - the counter (≤2, written before a cycle starts, never reset);
  - the per-cycle record (triggers, amended sections, `lastGood`, outcome applied | aborted | thrash);
  - the effective cap (`3 + cycles` code; `3 + 1 + cycles` design).
- Hides: the formula. Super-roast only ever sees a number as `config.iterationCap`.
- Must not: change super-roast round numbering or labels (Challenge 2); revert to `lastGood` (vision: a breach exits as thrash and is reported).
- Relationships: each loop's §Loop exits reads it to decide cap and thrash. The two loops state its exit rules separately, deliberately with no shared mode flag. Resume and report-prompt read it.
- Lifecycle: it lives in run.md for the run's life, one set of fields per loop, shared between none.
- Errors: none of its own. A record whose amend file is missing makes resume re-run Amend Mode.

**step-back-check** — extended: moved to `skills/super-design/scripts/`. It gains `--ledger`, and it is the one place that maps `patch` to `local`. It rejects `local` while the ledger names a mechanical trigger, `redesign` with `triggers: none`, and a cited mechanical trigger the ledger lacks. It holds the list of semantic (agent-judged) trigger names and treats every other trigger name as mechanical, which needs ledger confirmation.

**step-back-prompt.md** — extended: the `local | redesign` decision, the `triggers:` field, and the ledger as primary input. It is the single place the trigger vocabulary and the two semantic trigger definitions are written.

**report-prompt.md, resume.md, run-state.md** — extended: they read and replay the new fields, the ledger and the amend files. They add no decisions of their own.

Variation:
- The loop kind (`code` | `design`) is fixed. It is a closed enum, matched once in Amend Mode's loop table (bead wiring and supersede) and once in each loop's own exit section (cap formula). The shared scripts never branch on it beyond `--loop` labelling.
- The trigger set varies. A new mechanical trigger is computed only in findings-ledger; a new semantic one is defined only in step-back-prompt.md (and added to step-back-check's semantic list).

Walk-through, main use case:
1. Code round N ends, and findings-ledger rebuilds `findings-ledger.md` with `triggers: no-progress(...)`.
2. The step-back reads the ledger and answers `redesign`, `scope: inside`; step-back-check `--ledger` prints `ok`.
3. The loop checks that budget is left, records `lastGood`, increments `redesignCycles-code` and writes `redesign-code-1`.
4. Amend Mode dispatches the designer, amend-check prints `ok`, the specs are committed, the beads are filed, and `coverage-amend-code-1` runs.
5. The loop re-enters super-code (`deferSweep`), then roast round N+1 runs with `iterationCap` = 4.
6. The ledger rebuilds and shows the old keys as `resolved@rN+1`.

Likely future changes:
- A third mechanical trigger (e.g. a Should-fix key open for 3 rounds) touches one computation in findings-ledger and one vocabulary line in step-back-prompt.md. step-back-check, Amend Mode and both loops stay unchanged.
- A third loop (e.g. a plan roast) adds one row to Amend Mode's loop table and one counter field.

Deliberate exceptions forced by the spec's decisions:
- Per spec §1: findings-ledger calls `super-code/scripts/report-verdict --keys`. This deliberate cross-skill dependency is accepted so that key parsing stays in one place.
- Per spec §3 and §Key decisions: the budget is an effective cap passed as `iterationCap`, not a separate round label. Redesign rounds are therefore indistinguishable in super-roast reports; only the `redesign-*` records mark them.
- Per spec §4 step 7: disputes reach the ledger only through the orchestrator-written overrides file. The orchestrator transcribes validated amend fields, and findings-ledger never reads amend files directly.

Digest:
- Findings ledger: owns cross-round finding identity, statuses and mechanical triggers;
  new mechanical triggers are computed only in `findings-ledger`;
  callers never read raw reports or recompute Blocking deltas to route a decision.
- Amend record and amend-check: owns the amend designer's output contract and its validation;
  new amend rules go only in `amend-check`;
  callers never act on an amend file that amend-check has not passed.
- Amend Mode: owns the redesign sequence from the amend dispatch through beads, coverage and the optional design roast;
  per-loop differences go only in its `code|design` table;
  callers never edit specs, file amend beads or run coverage themselves, and Amend Mode never touches the budget.
- Redesign budget: owns the `redesignCycles-<loop>` counters, the `redesign-<loop>-<K>` records and the effective cap;
  cap and thrash rules go in each loop's §Loop exits;
  callers never pass super-roast anything but the computed number, and never reset the counter.

## Post-Implementation Notes

> *As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
