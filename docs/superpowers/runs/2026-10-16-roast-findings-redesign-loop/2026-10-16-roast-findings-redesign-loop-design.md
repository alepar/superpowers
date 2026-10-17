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

1. **Mechanical triggers need identities the reports don't fully give.** A regressed finding often comes back under a different location key (`coordinator.js:1401` → `:704` in the 2026-10-15 run). Exact-key matching alone misses it. The reporter's `delta vs prior:` line counts regressed Blocking findings by substance, but it is LLM-written: its counts are used only for the regression signal and only after a plausibility check, and everything else is decided by key identity.
2. **The redesign budget must not change super-roast.** Report naming, prior-report chaining and the `N of <cap>` header all assume numbered rounds.
3. **Amend mode must reuse super-design's machinery** (Key Abstractions sync, decomposition rules, coverage) without breaking its root-only, two-round coverage cap or recursing without bound.
4. **Many cross-file contracts to keep consistent:** run-state field names (contract-lint baseline), resume replay, report sections, and super-auto's read rule (I8).
5. **Degraded roast rounds** (`[low coverage]`, `[panel-capped: …]`) make absence of a finding weak evidence, so a key-absence signal must not cross them.

## Key decisions made

The ledger and the trigger computation are **one script**, `skills/super-design/scripts/findings-ledger`. It writes the ledger file and puts a `triggers:` header line in it. Both loops call it at the start of each round's Step 1, and again after every write to their overrides file, every call with the loop's full input set and the same exit-2 handling (§3 Step 1 item 2).

Every key is handled in one **canonical form**, `[SEV] <location>` (a leading `rN ` is stripped), in ledger rows, overrides lines, step-back `dissolves:`/`remains:`, amend `owners:`/`covers:` and both check scripts. A field holding several keys (`dissolves:`, `remains:`, `covers:`) separates them with `, ` and is split only on `, [`, since every key starts with `[SEV]` and keys may themselves contain `, ` or `; `. "Open" everywhere means status `open` or `open (returned rN)`.

Triggers fire only on evidence the ledger can vouch for per key:
- **no progress:** the previous round's effective open Blocking set (excluding `disputed` and `dissolved` keys) is non-empty, and every key in it is confirmed again in this round, compared by key identity (vision §2);
- **recurrence:** the reporter's `regressed Blocking ≥ 1` (only when its counts pass the plausibility check `carriedB + regressedB ≤ previous round's confirmed Blocking count`), or a Blocking/Should-fix key that was absent from the immediately preceding non-degraded round reappears.

Neither key-absence signal (no-progress, the `returned` half of recurrence) is computed across a degraded round.

`step-back-check` moves to `skills/super-design/scripts/` (both loops now use it). It gains a `--ledger` argument and enforces the trigger rules. A twice-rejected record under a mechanical trigger never falls back to `local`: it forces a redesign cycle, or the thrash exit when the budget is spent.

The redesign budget is implemented as an **effective cap**: `3 + redesignCycles` (design: `3 + redesignCycles`, plus today's conditional one-round extension), with `redesignCycles ≤ 2`. Redesign rounds are ordinary numbered rounds, and the effective cap is passed to super-roast as `config.iterationCap`. Super-roast is unchanged. Each loop's Step 1 runs before its cap and thrash tests, and a cycle Step 1 starts raises the cap before the cap test.

**Amend Mode** is a new super-design entry point, `§Amend Mode`, shared by both loops. A fresh opus **amend designer** (`amend-prompt.md`) edits the specs and returns a structured record. A new script, `amend-check`, validates it in both directions: every open item is accounted for and reaches a fix path (a `work:` line; in the design loop, alternatively an amended owning section), every section listed as amended is touched by the spec diff, `## Goal` is untouched, and an `## Unchanged behavior` section exists. Amend Mode is the single filer of the amendment's beads. It runs no roast: any design roast after an amendment belongs to the calling loop.

The ledger is authoritative for **identity, status and triggers**; each row points to the report that last confirmed it, and finding text is read there by key. Decisions route on the ledger, never on report bodies.

Each redesign cycle has **one state field**, the `redesign-<loop>-<K>` record, which the calling loop's orchestrator rewrites in place at each transition (it runs Amend Mode inline, so it also writes the states inside Amend Mode); resume dispatches only from it.

**Departures from the vision, recorded:**
- *Not-reconfirmed findings:* the vision says a finding the roast does not re-confirm becomes `dissolved@rN`. Here it becomes `resolved@rK` (absence in a non-degraded round K), and `dissolved@rN` is reserved for keys a validated step-back `dissolves:`. The vision's `regressed@rN` status is dropped: regression reaches the triggers through the reporter's regressed count, and a returned key shows `open (returned rN)`. Reason: the two meanings need different precedence (§1), and per-key regression marks are prose, not a contract.
- *Disputes are sticky* (the one exception to the status precedence in §1): a `disputed` override is not cleared by a later re-confirmation, only by a later override line. Reason: the reporter re-validates every prior finding each round, so a lapsing dispute would re-enter the no-progress arithmetic one round later and re-fire the trigger the dispute answered; the vision keeps a disputed Blocking unresolved and listed, which a sticky status preserves.
- *Redesign rounds count in `roastCodeRound`:* the vision says a redesign round's roast does not increment the counter. Here it does, and the cap rises by one per cycle instead (effective cap). Reason: same budget, without breaking super-roast's round numbering (Challenge 2).
- *Design-loop redesign runs Amend Mode* rather than literally re-running decomposition or the subepic brainstorm (§4 Considered). Amend Mode re-decomposes the affected subtree through §Decomposition.
- *Key Abstractions sync after an amend runs only when a `## Key abstractions` section changed* (vision decision 2 says "always"); the sync is a no-op otherwise. The coverage check always runs.
- *The post-redesign roast gets the ledger as a reference-only stated-intent input* (vision §3), not as a new super-roast input: super-roast is unchanged and the stated intent is already free text.

## Decision points, by section

### 1. Findings ledger — `skills/super-design/scripts/findings-ledger`

**Recommended:** a pure bash/awk script, no jq. Invocation:

`findings-ledger --loop code|design --out <ledger path> --report <round>=<report path> … [--final-review <round>=<keys file> …] [--punch-list <file>] [--overrides <file>]`

- **Per report:** it reads keys through `super-code/scripts/report-verdict --keys`, the verdict qualifiers through `report-verdict`'s default-mode `verdict:` line (`[low coverage]`, `[panel-capped: N unverified]` mark the round **degraded**), and the `delta vs prior:` line, `inputs: …@<sha>` and `iteration:` headers. It never reads finding bodies.
- **Final-review items (code loop):** `--final-review <round>=<file>` takes the round's final-review keys file, the same `[Must-fix] …` lines the step-back keys file gets (§Final-review items), without the `rN ` prefix. These rows have source `final-review`; they are open while they appear in the latest final-review keys file passed and resolved once a later one omits them. They never feed the mechanical triggers.
- **Canonical key form:** `[SEV] <location>`, the text `report-verdict --keys` prints. Input lines from overrides, punch list and final-review files have a leading `rN ` stripped before matching. Keys are carried verbatim otherwise, including `; ` multi-location keys. A row's `raised r<M>` is the first round that confirmed the key.
- **Output file:**
  ```
  # findings ledger — <loop> — through r<N>
  triggers: none | <trigger>[, <trigger>] where trigger ∈ no-progress(<evidence>) | recurrence(<evidence>)
  blocking: r<N-1>=<n|-> r<N>=<n> carriedB=<n|-> regressedB=<n|-> degraded=<rK,…|none> not-computable=<no-progress,returned,regressed|none>
  ignored-overrides: <n>
  - <key> · raised r<M>@<sha|-> · <status> · source <roast|final-review> · text <path of the report or keys file that last confirmed it>
  ```
  `r<N-1>` and `r<N>` are the effective open Blocking counts (after overrides). `not-computable` names each signal the script could not evaluate this round, so callers can tell "no triggers" from "triggers not computable".
- **Statuses:**
  - `open`: confirmed in the latest round;
  - `open (returned r<N>)`: a key absent from the preceding non-degraded round that reappears in N;
  - `resolved@r<K>`: confirmed earlier, absent from non-degraded round K's confirmed keys, not punch-listed. Absence in a degraded round changes nothing: the key keeps its previous status;
  - `punch-listed`;
  - `dissolved@r<N>` and `disputed@r<N> (<reason>)`: from `--overrides`, one `<key> · dissolved@r<N>` or `<key> · disputed@r<N> (<reason>)` line per entry, `N` being the round whose ledger the deciding record read. Loops write `dissolved` lines from validated step-back `dissolves:`; Amend Mode writes `disputed` lines from validated amend `owners:` disputes.
- **Status resolution, in order (one table, in findings-ledger only):**
  1. an overrides line whose key no input report or final-review file contains (a mis-keyed line, or a key whose only report was dropped) is ignored and counted in `ignored-overrides:`; it never fails the build, so the file's other lines keep applying;
  2. among override lines for one key, the last line wins;
  3. `disputed@rN` stands until a later override line for that key (sticky; Key decisions);
  4. `dissolved@rN` stands unless the key is confirmed in a round later than N, where the computed `open` / `open (returned rN)` wins;
  5. otherwise the computed status (`open`, `open (returned)`, `resolved`, `punch-listed`).
- **Trigger computation:**
  - *no-progress:* `prev` = round N-1's effective open Blocking keys, minus `disputed` and `dissolved`. Fires when `prev` is non-empty and every key in `prev` is confirmed in round N. Not computed (`not-computable=no-progress`) when round N or N-1 is degraded or missing.
  - *recurrence (regressed):* fires when `regressedB ≥ 1` and `carriedB + regressedB ≤` round N-1's confirmed Blocking count. A failed plausibility check, a malformed or missing delta line, or round 1 shows `-` for both counts and `not-computable=regressed`.
  - *recurrence (returned):* fires when a Blocking or Should-fix key is `open (returned rN)` and is not `disputed`. It cannot fire before round 3 (a confirmed round, an absent non-degraded round, then the return), and a gap that was a degraded round does not count as absence.
- **Rebuild timing:** each call rebuilds the whole file. A loop calls it at the start of Step 1 and again after every write to its overrides file (validated `dissolves:`, Amend Mode's disputes), so amend-check and every later reader see the overrides applied. Every one of these calls is the loop's own: the same input set as its Step 1 call (dropped inputs excluded), with exit 2 handled as in §3 Step 1 item 2.

**Considered:**
- *Per-key regressed status from inline prose marks:* rejected, because prose marks are not a contract and super-roast is out of scope.
- *Exact-key identity only for every signal:* rejected for the regression signal, because it misses relocated regressions (Challenge 1); kept for no-progress, where a relocated key only produces a false negative that falls back to the semantic triggers.
- *Reporter carried counts for no-progress:* rejected; they cannot exclude disputed or dissolved keys, so one disputed Blocking would re-fire the trigger every round.
- *A one-line gist per ledger row:* rejected; it would make findings-ledger parse report bodies. Rows point to the confirming report instead.
- *jq/JSON ledger:* rejected; the fork's scripts are bash/awk with JQ_UNAVAILABLE fallbacks, and this needs no JSON.

### 2. Triggers and the step-back decision

**Recommended:**
- **`step-back-prompt.md`:**
  - `decision:` becomes `local | redesign` (`patch` is still accepted as a synonym for `local` for one release, so in-flight runs resume).
  - Add `triggers: <comma list from {no-progress, recurrence, shared-cause, defect-type}> | none`.
  - The prompt receives the ledger path as primary input: identity, status and triggers come from it. For each key it needs the content of, it reads the finding in the report the row's `text` points to. Reports are never scanned to decide what is open.
  - The "What to look for" section is replaced by the four trigger definitions:
    - *shared cause:* ≥2 open findings stem from one design decision;
    - *defect type:* a finding touches an interface, a contract, shared data or behaviour visible from outside, rather than an algorithm or internal structure;
    - plus the instruction that a redesign must name the owning decision.
  - `dissolves:` and `remains:` name keys in canonical form, separated by `, ` and split on `, [` (Key decisions); the keys file keeps its `rN ` prefixes, which step-back-check strips.
- **`step-back-check --step-back F --keys K --ledger L`** additionally rejects:
  - `local`/`patch` while the ledger's `triggers:` names a mechanical trigger;
  - `redesign` with `triggers: none`;
  - `triggers:` naming `no-progress` or `recurrence` when the ledger does not list it.
- **Keys file, both loops:** one `rN [SEV] <location>` line per confirmed key of every round so far: `report-verdict --keys <round M report> | sed 's/^/rM /'` over each of the loop's roast reports (`roast-pr-<M>` in the code loop, `roast-design-<M>` in the design loop), plus, in the code loop only, the final-review keys per §Final-review items.
- **report-verdict:** its step-back recogniser (`^decision:(patch|redesign)`) becomes `^decision:(patch|local|redesign)`, with its header comment and `tests/super-code/test-report-verdict.sh` gaining a `local` fixture.
- **Design loop:** it now also runs `step-back-check`, which it never did before (§3b).

**Considered:**
- *The step-back agent computes all triggers:* rejected by decision 3 (the script is authoritative for mechanical triggers).
- *Fully scripted defect type:* rejected; it would need a new super-roast field (out of scope).

### 3. Code loop (super-auto §Phase 5)

**Recommended:** rewrite §Loop exits and §Step 1, and add **§Redesign cycle**. A round's report is handled in this order: the converged test, then Step 1, then the thrash and cap tests, then the branch Step 1 chose.

- **Converged** is unchanged and tested first.
- **Step 1 — one ordered procedure**, every outcome with an explicit branch:
  1. Write the step-back keys file (§2) and the round's final-review keys file.
  2. Run `findings-ledger --loop code` over every round's report, final-review keys files, the punch list and `<run-dir>/findings-overrides.md`.
     - Exit 2 (from this call or any later rebuild in the round): drop the named bad input from this and every later invocation (a round whose previous round is missing computes no triggers); if it still exits 2, the gate is not computable: record `stepBackCode-round-<N>: local — gate not computable: <reason>`, park a `degraded-verdict` `redesign gate not computable — <reason>`, skip the step-back, and run Steps 2–4 with every finding through the scope filter individually.
  3. **Last-known-good breach:** when this round is the first after redesign cycle K, that cycle's state is `applied`, and its effective open Blocking count (the ledger's `r<N>=`) is higher than the previous round's, rewrite `redesign-code-<K>` with state `thrash — lastGood breach` and take the thrash exit. Nothing else in Step 1 runs.
  4. Dispatch the step-back with the ledger, the keys file and report paths, and save it.
  5. Run `step-back-check --step-back … --keys … --ledger …`:
     - exit 0: continue;
     - exit 3: re-dispatch the step-back once with the reject lines and check again. On a second exit 3: when the ledger names a mechanical trigger, the decision is a **forced redesign** (recorded `stepBackCode-round-<N>: redesign — forced: step-back record rejected: <reject lines>`, scope `inside`, triggers from the ledger); otherwise run `local` with every finding through the scope filter individually (today's fallback), recorded as today;
     - exit 2: fix the invocation and run it again.
  6. Write each validated `dissolves:` key to the overrides file as `<key> · dissolved@r<N>`, then rebuild the ledger.
  7. **Interactive runs:** a `redesign` (mandated or not) is presented to the human with the recommendation. A human decline is recorded `stepBackCode-round-<N>: local — redesign declined by human`, parked as a `degraded-verdict` `redesign declined by human — <triggers>`, and the round runs `local`. step-back-check is not re-run on the human's choice.
  8. Choose the branch:
     - `local`: Steps 2–4.
     - `redesign` + `scope: inside` + `redesignCycles-code` < 2: commit any uncommitted changes to the spec paths (so HEAD is the pre-amendment spec state every Amend Mode restore returns to), record `lastGood` (the integration tip SHA), increment `redesignCycles-code`, write `redesign-code-<K>` with state `started`, and take §Redesign cycle after the exit tests.
     - `redesign` + `scope: outside`: parked as today, and the round runs `local`.
     - `redesign` with the budget spent: when a mechanical trigger fired, the thrash exit; when only a semantic trigger fired, park it as a `degraded-verdict` `redesign budget spent` and run `local`.
- **Loop exits after Step 1:**
  - **Thrash:** Step 1 reached the thrash exit (budget spent under a mechanical trigger, or a lastGood breach).
  - **Cap:** `roastCodeRound` ≥ `3 + redesignCycles-code`, using the counter as Step 1 left it. A cycle started on the cap round raises the cap first, so a trigger first firing on round 3 starts a redesign instead of exiting capped. A capped round's `local` findings go to §Cap disposition instead of Steps 2–4.
  - The step-back no longer re-runs at an exit; Step 1 already ran and its record stands.
- **§Redesign cycle** (the record already says `started`; the loop rewrites its state at each transition):
  1. Run super-design §Amend Mode inline (`--loop code`, K, the ledger and overrides paths, the loop's findings-ledger invocation, the step-back record, the task-tree dump, the run-state file, and the bead context: the I3 flags and the §Fix-bead template context lines, with the amended spec sections as context), rewriting the record's state after each of its steps. Amend Mode files the amendment's beads; the loop files only step 3's roast-fix tasks.
  2. On `aborted — <reason>` (rejected or other cause): rewrite the state, park a `degraded-verdict` `redesign aborted — <reason>`, and run the round `local` (Steps 2–4). The spent cycle is not refunded.
  3. On `applied` with a non-empty `amended:`, when `roastDesignRound` < `3 + redesignCycles-design` (the design loop's §3b cap; §Capped Blocking's extension belongs to the design loop's own fix rounds and is not used here): increment `roastDesignRound` to M and write `designRoast r<M>` in the record, then run **design roast round M**: super-roast design mode on the amended specs, its prior report the latest `roast-design` report of the run (phase 2's last, or an earlier amend roast), `config.iterationCap` = `3 + redesignCycles-design`. Rebuild `findingsLedgerDesign` with it. Fix its confirmed findings with no step-back and no redesign, on super-design's local path with these exceptions: a dispatched spec fixer (fresh context, given every `roast-design` report; the orchestrator never edits specs, I8) applies the inline spec fixes; findings that need build work become tasks the loop files as post-hand-off beads with no sweep edges, labelled `sp:redesign-code-<K>-roast` and deduped by title against that label; a finding that needs design work is not escalated, it is parked as a `degraded-verdict` `amend roast finding not fixed — <key>`. Commit the spec edits, then write `designRoast r<M> fixed`. When `roastDesignRound` has already reached `3 + redesignCycles-design`, record `designRoast skipped — design cap spent` and go on. With `amended: none`, `designRoast none`.
  4. Rewrite the state to `applied`. Re-enter super-code (`deferSweep: true`).
  5. Run phase 4 as the next numbered round with `config.iterationCap` = the effective cap. Its stated intent names the ledger path as reference-only input: the previously open findings and their statuses, to re-check.
  
  Skipped in a redesign round: the scope filter, clusters and per-finding filing. Amend Mode owns scoping, and every non-disputed open item, final-review items included, reaches a `work:` bead through amend-check's code-loop reverse rule.
- **After redesign:** the next roast's prior report is the pre-redesign round's report, so old findings are re-validated by the reporter's Step 3 (resolved / still-open). Fixers get beads, never the ledger's open list.
- **Regression-only pass, final-review items, punch lists, the post-cap audit and §Cap disposition:** unchanged, except that the thrash definition above feeds `roastCodeCapped:` and final-review keys also reach the ledger.

**Considered:**
- *A separate iteration label like `redesign 1`:* rejected, because it breaks prior-report chaining in `assemble-args` (Challenge 2).
- *Automatic revert to `lastGood`:* rejected by the vision (destructive). The breach exits thrash and is reported.
- *Running `local` after a twice-rejected record under a mechanical trigger (today's fallback):* rejected; it is exactly the patch round the Goal forbids.
- *Testing the cap before Step 1 (today's order):* rejected; a trigger first firing on the cap round would exit capped and never use the budget.

### 3b. Design loop (super-design §Adversarial Review Loop)

**Recommended:** rewrite the step-back paragraph and step 4 with the design loop's own counterpart of every §3 element. Round order: converged test, Step 1, thrash and cap tests, the chosen branch.

- **Step 1 — the same ordered procedure as §3 Step 1**, with these values:
  - keys file `…-roast-design-<N>-step-back-keys.txt` per §2 (no final-review items);
  - `findings-ledger --loop design` with `findingsLedgerDesign` and the design overrides file (`<artifact-dir>/findings-overrides-design.md`); exit 2 handled as in §3 (gate not computable → `local`, parked);
  - breach: the first round after cycle K, when that cycle's state is `applied`, with a higher effective open Blocking count than the previous round → `redesign-design-<K>` state `thrash — lastGood breach`, thrash exit;
  - step-back-check exit 3 → one re-dispatch, then forced redesign under a mechanical trigger (budget left) or thrash (budget spent), else `local` with every finding as its own task and no clusters;
  - validated `dissolves:` → `<key> · dissolved@r<N>` in the design overrides file, then a rebuild;
  - interactive decline → `stepBackDesign-round-<N>: local — redesign declined by human`, parked `degraded-verdict`, round runs `local`;
  - branches: `local` = today's steps 1–4; `redesign` + inside + `redesignCycles-design` < 2 → commit any uncommitted spec changes (as §3 item 8), record `lastGood`, increment the counter, write `redesign-design-<K>` (`started`); outside → parked unattended, offered to the human interactively, round runs `local`; budget spent → thrash under a mechanical trigger, else parked `redesign budget spent` and `local`.
- **Loop exits:**
  - **Converged:** unchanged.
  - **Thrash** replaces today's "the confirmed-Blocking count did not shrink": budget spent under a mechanical trigger, or a lastGood breach. Its pause/summary handling is today's.
  - **Cap:** `roastDesignRound` ≥ `3 + redesignCycles-design` after Step 1, except that a round in which Step 1 started a cycle never takes the cap exit: its redesign branch runs. §Capped Blocking's one-round extension is unchanged and conditional: it follows the effective cap round, not round 3. A redesign started in the extension round (budget left) replaces the extension: the post-amendment roast is the loop's last round, and if it still ends Blocking, §Capped Blocking records `capped-blocking` as it would after the extension.
  - `config.iterationCap` = `3 + redesignCycles-design`, plus 1 in the extension round or in the post-amendment roast that replaced it.
- **`lastGood` before code exists:** the HEAD commit SHA of the spec state before the amendment (after Step 1's commit of uncommitted spec changes). Nothing has executed, so it is reported, never reverted.
- **Redesign cycle (design):** run §Amend Mode inline with `--loop design` (inputs as §3, the bead context being §Decomposition's flag triple and the `Integration sweep:` wiring), rewriting the record's state after each of its steps. On `aborted`, as §3 step 2. On `applied`, the loop's own next numbered round is the design roast that follows the amendment (step 3's re-roast; an applied amendment with a non-empty `amended:` always re-roasts), with the ledger path in its stated intent. Steps 1–2 (per-finding tasks, clusters) are skipped for the round; Amend Mode files and supersedes beads.
- **Code-loop amend roasts count here:** design roast rounds the code loop runs after an amendment (§3 step 3) increment `roastDesignRound` and rebuild `findingsLedgerDesign`, so they spend this loop's cap (vision decision 2).
- **Records:** `redesign-design-<K>` and `redesignCycles-design` in the run-state file; standalone (no caller run-state file), in the round summaries, with the ledger, overrides and amend files in the artifact directory. §Re-entry adopts them and never resets the counter.

**Considered:**
- *"Same as the code loop" by reference:* rejected; the design loop's thrash rule, extension, lastGood and keys file differ and must be written where the loop runs.

### 4. Amend Mode (super-design, new §Amend Mode; both loops)

**Recommended:**

- **Inputs:** root epic id, root and nested spec paths, the ledger and overrides paths, the calling loop's findings-ledger invocation (its Step 1 input set, dropped inputs excluded), the step-back record, the task-tree dump (`bd list --label sp:<root> --all --json`, for re-decomposition and the design loop's supersede step), roast report paths (looked up by key through the ledger's `text` pointers), the run-state file, mode flags, the loop (`code|design`), K, and the caller's bead context.
- **Steps.** Amend Mode is a procedure the calling loop's orchestrator runs inline; only the amend designer is dispatched. After each step the orchestrator rewrites the `redesign-<loop>-<K>` state with the state that step names; nothing else writes it.
  1. **Dispatch the amend designer.** Precondition: the `--specs` paths are clean at HEAD (the caller committed them before writing `started`, §3 Step 1 item 8), so every restore below discards only the designer's edits. The designer (`skills/super-design/amend-prompt.md`; opus, fresh context) writes only spec files and the amend record, never `## Goal`. For each open item in the ledger (roast and final-review rows, status `open` or `open (returned rN)`) it decides one of:
     - `owner: <spec path> §<section>`: a design decision owns it;
     - `local`;
     - `disputed: <reason>`.
     
     It edits the owning spec sections, writes or updates `## Unchanged behavior` in the root spec, and returns `amend-<loop>-<K>.md` with fields:
     - `owners:` (canonical key → owner | local | disputed);
     - `amended:` (spec §s);
     - `work:` (one line per new work item: title | short description with owns:/consumes: | files-touched | covers: canonical keys; `covers:` is the last `|` field, so a ` | ` inside a key is safe, and its keys split on `, [`);
     - `unchanged:` (bullets).
  2. **Validate** with `scripts/amend-check --loop <loop> --amend <file> --ledger <ledger> --specs <paths>`. It prints `ok` or `reject:` lines, with exit codes 0/3/2 like `step-back-check`. On ok the state becomes `amend-checked`. On reject, restore the `--specs` files to HEAD (`git checkout HEAD -- <paths>`), so the retry starts clean, and re-dispatch once with the reject lines. A second reject restores the specs again and returns `aborted — amend rejected`. An abort is possible only before step 3's commit lands, and every abort restores the specs first.
  3. **Commit** the specs (state `specs-committed`). Run the Key Abstractions sync when a `## Key abstractions` section changed.
  4. **File the `work:` items** as beads per §Decomposition, with the caller's bead context (flag triple; under the root epic, or under the subepic that owns the amended spec), each labelled `sp:redesign-<loop>-<K>`. Before filing, list the beads with that label and file only `work:` titles not already present. Code loop: post-hand-off beads, no sweep edges. Design loop: wired under the existing `Integration sweep:`, and open beads the amendment obsoletes are `bd supersede`d (nothing has executed). Amend Mode is the single filer; the caller files none. State `beads-filed`.
  5. **Disputes:** append each `disputed` owner as `<key> · disputed@r<N> (<reason>)` to the overrides file (skipping a line already present), then rebuild the ledger with the calling loop's findings-ledger invocation (an input), handling exit 2 as that loop's Step 1 item 2 does. A disputed Blocking finding stays unresolved for `report-status` and is listed in Remaining.
  6. **Coverage:** one extra round recorded as `coverage-amend-<loop>-<K>`, outside the two-round cap. Its `## Changes since the previous round` lists the amend's beads and amended sections.
  7. **Return** `applied` with the amend record path, the filed bead ids and `amended:`.
- **After the commit nothing aborts.** A step from step 3's Key Abstractions sync through step 6 that fails is retried once through its state's §5 resume action; a second failure parks a `degraded-verdict` `redesign incomplete — <step>: <cause>`, and Amend Mode returns `applied` with what it produced, so the next roast re-validates the open items.
- **Amend Mode runs no roast.** Whether a design roast follows is the calling loop's decision (§3 step 3, §3b), so there is no nested redesign and no double roast.
- **amend-check's rules** (step 2): every open item appears in `owners:`, and every `owners:` key is an open ledger key; `git diff` shows no `## Goal` change; every `<spec> §<section>` in `amended:` has at least one changed line inside that section in the `--specs` diff; `## Unchanged behavior` exists; every `work:` line covers ≥1 key; and the reverse — every non-disputed open item appears in some `work:` `covers:`. Under `--loop design` an item `owner:` a `<spec> §<section>` listed in `amended:` also passes (a `local` item still needs a `work:` line); under `--loop code` it does not, since only a bead changes code.

**Considered:**
- *Literally re-brainstorming the owning level:* rejected; Mode B brainstorm rewrites whole specs, which is the regression the research warns about (16–27%).
- *Orchestrator edits specs itself:* rejected; it violates the I8 read rule and puts design work in the coordinator.
- *Full two-round coverage per amend:* rejected as disproportionate (decision 2: proportional).
- *A design-roast step inside Amend Mode:* rejected; in the design loop it duplicated the loop's own next round, and in the code loop it needed the design budget Amend Mode must not touch.
- *The code loop filing amend beads with its §Fix-bead template:* rejected; two filers risk double or no filing. The loop passes its template context instead.

### 5. Run state, resume, report

**Recommended:**

- **`run-state.md` §Field table, new fields:**
  - `findingsLedger: <path>` and `findingsLedgerDesign: <path>` (item 3, Pointers);
  - `redesignCycles-code: <K>` and `redesignCycles-design: <K>` (item 5, single-valued, written when Step 1 starts a cycle, never reset);
  - `redesign-<code|design>-<K>: round <N> · triggers <list> · amended <§s|none> · lastGood <sha|-> · designRoast <r<M>|r<M> fixed|skipped — design cap spent|none|-> · state <started|amend-checked|specs-committed|beads-filed|applied|aborted — <reason>|thrash — lastGood breach>` (item 7). It is the cycle's single state field: one line per K, rewritten in place by the calling loop's orchestrator at each transition (Amend Mode's steps included, since it runs them inline), never appended. `designRoast r<M>` is written with the counter increment, before the code loop's amend roast; `r<M> fixed` after its fixes are committed.
  - `approvals · coverage-amend-<loop>-<K>` (item 7), in the `coverage-round-<N>` line format.
- **Changed field:** the `stepBack…-round-<N>` line format now reads `local | redesign` (patch accepted on read), including the `gate not computable`, `forced` and `declined by human` forms.
- **New park texts** (kind `degraded-verdict`): `redesign budget spent`, `redesign gate not computable — <reason>`, `redesign declined by human — <triggers>`, `redesign aborted — <reason>`, `redesign incomplete — <step>: <cause>`, `amend roast finding not fixed — <key>`.
- **Contract lint:** `tests/super-auto/test-contract-lint.sh`'s deliberate-additions list gains the new fields.
- **resume.md** dispatches an interrupted cycle only from its record's `state`:
  - `started`: if an amend file and spec diff exist, re-run amend-check on them; ok → continue from step 3, otherwise restore the specs to HEAD and re-run Amend Mode from step 1. With no amend file, restore and re-run from step 1.
  - `amend-checked`: re-run amend-check (idempotent) before committing anything; ok → commit; reject → restore the specs, state `aborted — amend rejected on resume`.
  - `specs-committed`: file the `work:` items missing from the beads labelled `sp:redesign-<loop>-<K>`.
  - `beads-filed`: write missing dispute lines, run the coverage-amend round unless its approvals line exists, then the caller's remaining steps. Code loop, by `designRoast`: `-` → run §3 step 3; `r<M>` with no round-M report → run roast round M without incrementing again; `r<M>` with its report → finish the fix step (tasks deduped by title, commit) and write `r<M> fixed`; `r<M> fixed`, `skipped` or `none` → go on. Then state `applied`, super-code re-entry, next round.
  - `applied`, `aborted`, `thrash`: nothing to replay; the loop continues from its other records.
  - Counters are never reset. The same rules apply to `redesign-design-<K>` (design loop, via super-design §Re-entry).
- **report-prompt.md:**
  - Gotchas & surprises lists each `redesign-*` record with its triggers, state and `designRoast`.
  - Remaining lists `disputed` findings and the six parked texts above.
  - The allowed sources gain the ledger and the amend files.

### 6. Moves and references

`skills/super-auto/scripts/step-back-check` moves to `skills/super-design/scripts/step-back-check`. Update every reference: super-auto SKILL.md, resume.md, MAINTENANCE.md mentions, and `tests/super-auto/test-scripts.sh` cases, which move to `tests/super-design/test-step-back-check.sh`.

`skills/super-code/scripts/report-verdict`: the step-back recogniser regex and header comment accept `local` (§2); `tests/super-code/test-report-verdict.sh` and `tests/super-code/fixtures/report-verdict/` gain a `decision: local` case.

**Considered:** leaving step-back-check in super-auto, rejected because super-design would then depend on super-auto's scripts.

### 7. Testing

- **One test file per new or moved script** (decided at decomposition, so three beads don't serialize on one file): `tests/super-design/test-findings-ledger.sh`, `tests/super-design/test-step-back-check.sh` and `tests/super-design/test-amend-check.sh`, in the existing harness style, with fixtures under `tests/super-design/fixtures/<script>/`. The step-back-check bead registers all three in CLAUDE.md's release test list:
  - **`findings-ledger`:**
    - round 1 only;
    - r2 with every prior Blocking key re-confirmed → `no-progress`;
    - same Blocking count with different keys → `triggers: none`;
    - a disputed Blocking key re-confirmed → no `no-progress`;
    - regressed Blocking → `recurrence`; implausible counts (`carriedB + regressedB` > prior) → `-` and `not-computable=regressed`;
    - a key absent in r2 and back in r3 → `open (returned r3)` plus `recurrence`;
    - a degraded r2 (`[low coverage]`): its missing keys stay `open`, no `returned` in r3, `not-computable` names the skipped signals;
    - punch-list and overrides statuses, the precedence table (last line wins, dissolved beaten by a later re-confirmation, disputed sticky);
    - an override for an unknown key, and one whose key only a dropped report held → ignored, `ignored-overrides: 2`, exit 0, the file's other overrides still applied;
    - `rN `-prefixed override lines matched in canonical form; `; ` multi-location keys;
    - final-review keys files → `source final-review` rows, never in triggers;
    - every row's `text` points to the confirming report.
  - **`step-back-check`:**
    - every existing case;
    - `local` rejected under a mechanical trigger;
    - `redesign` with `triggers: none` rejected;
    - a cited mechanical trigger the ledger lacks rejected;
    - `patch` accepted as `local`;
    - a `dissolves:` list holding a key that contains `, ` splits on `, [` into the right keys.
  - **`amend-check`:** a missing open key; a missing `open (returned rN)` key; an `owners:` key that is not an open ledger key; a `## Goal` diff; a missing `## Unchanged behavior`; a `work:` line without covers; an open `local` or `owner` key no `work:` line covers and whose section is not in `amended:` (reverse rule); under `--loop code`, an open key covered only by an amended owner section (rejected; the same record passes under `--loop design`); a section in `amended:` the `--specs` diff does not touch; a final-review row not accounted for; a `covers:` list with a key containing `, ` and a key containing ` | `, parsed correctly.
  - **`report-verdict`:** a `decision: local` step-back is recognised.
- **Chain test** (integration sweep): `tests/super-design/test-redesign-chain.sh` runs fixture reports through findings-ledger, step-back-check and amend-check, including a round-3 (cap round) fixture where no-progress first fires and `local` is rejected.
- **Also must pass:** `tests/super-auto/test-contract-lint.sh` (with the new fields and record states) and `test-scripts.sh` (with the moved cases removed), and the full CLAUDE.md release test list.
- **What the scripts verify, and what they don't.** Script-verified: the trigger arithmetic, statuses, precedence, canonical keys and degraded-round rules, the lastGood-breach inputs (the `r<N-1>=` and `r<N>=` counts on the `blocking:` line, the comparison applied to them, and the rule that an `@rN` override reduces only later rounds) and the no-progress/recurrence routing inputs, including a round-3 cap-round no-progress and both triggers firing together (`tests/super-design/test-findings-ledger.sh`); the `local`/`redesign` gate (step-back-check); both directions of amend coverage (amend-check); the end-to-end script chain including a cap-round trigger (`tests/super-design/test-redesign-chain.sh`); the redesign-round bead filing lifecycle: epic reopen before filing, parent rule, title dedupe on resume, design-loop supersede (`tests/super-design/test-redesign-cycle-filing.sh`); the run-state field and record formats, Step 1's item order and branch outcomes in both loops' SKILL.md files, Amend Mode's steps 1-7 in order with step 4's `bd update` before `bd create`, and the spelling of the effective-cap formula `3 + redesignCycles-<loop>` and the budget compare `< 2` (`tests/super-auto/test-contract-lint.sh`, checks `(step1)` and the run-state pins). Prose-only, verified by no script in this run: that the orchestrator performs the cap and budget arithmetic (the increment, the cap test against the raised cap), the reject → forced-redesign / thrash path as behaviour, the ledger exit-2 degrade, the interactive decline as a human interaction, the extension-round redesign rule, Amend Mode's clean-spec precondition, spec restore and post-commit retry, resume's state dispatch, and the code loop's post-amend design roast, its fix step and its `designRoast` markers. The contract-lint checks pin that the ordered steps and outcomes are written down; they do not show an agent follows them. These rest on the manual acceptance below and on skill-behaviour evals in the separate eval harness, which this run does not add.
- **Manual acceptance (report phase, not a bead):** replay the 2026-10-15 coordinator-subagent-compaction run's round-1 code roast report through `findings-ledger` and the amend designer. Record whether amend names a decision for the clustered findings.

## Key abstractions

**Findings ledger** — new module (`skills/super-design/scripts/findings-ledger` plus the `findings-ledger.md` file format it writes): the only cross-round view of roast and final-review findings, and the only place mechanical triggers are computed.
- Owns: per-key identity across rounds in the canonical form `[SEV] <location>` (`rN ` stripped, `; ` multi-location included); each key's status (`open`, `open (returned rN)`, `resolved@rK`, `punch-listed`, plus `dissolved@rN` / `disputed@rN (…)` from the overrides file) and the one status-resolution table; the row's `source` and `text` pointer to the confirming report; the degraded-round rule; the `blocking:` line; and the `triggers:` header line (`no-progress`, `recurrence`, with evidence).
- Hides: how identity is decided (key identity for statuses and no-progress; the reporter's regressed count, after its plausibility check, for regression), the arithmetic of the two mechanical triggers, and the round-1 and degraded-round rules. Keys and verdict qualifiers come only through `super-code/scripts/report-verdict`; headers come only from the `inputs:`, `iteration:` and `delta vs prior:` lines, never from report bodies.
- Must not: decide `local` vs `redesign` (the step-back agent does, gated by step-back-check); judge the semantic triggers `shared-cause` / `defect-type` (the step-back agent does); edit the overrides file (the loops write `dissolved` lines, Amend Mode writes `disputed` lines); keep state between calls.
- Relationships: delegates key and verdict extraction to report-verdict (super-design → super-code, the dependency direction I8 already sets). Its file is read by step-back-check, amend-check, the step-back prompt, the amend designer and report-prompt; they route on it and read finding text only through its `text` pointers.
- Lifecycle: each loop calls it at the start of each round's Step 1 and after every overrides write, always with its Step 1 input set (dropped inputs excluded). Each call rebuilds the whole file from every round's report, the final-review keys files, the punch list and the overrides file, so it is idempotent and resume-safe. There is one file per loop (`findingsLedger`, `findingsLedgerDesign`), with one overrides file per loop.
- Errors: exit 2 on bad input (a missing report, an unreadable overrides file, a report kind with no keys, i.e. report-verdict --keys exit 3), naming the input so the loop can drop it. An override line for a key no input contains is not an error: it is ignored and counted in `ignored-overrides:`. A round ≥2 with a missing, malformed or implausible `delta vs prior:` line, or a degraded round, is not an error: the affected signals are listed in `not-computable=` and show `-`, so callers can tell "no triggers" from "triggers not computable".

**Amend record and amend-check** — new module (the `amend-<loop>-<K>.md` format plus `skills/super-design/scripts/amend-check`): the structured contract between the amend designer and the orchestrator.
- Owns: the record's fields (`owners:`, `amended:`, `work:`, `unchanged:`; disputes are carried in `owners:`; keys in canonical form) and the rules a record must pass: every open ledger item (`open` or `open (returned rN)`, roast or final-review) appears in `owners:`, and every `owners:` key is one; every non-disputed open item appears in a `work:` `covers:` (in the design loop, alternatively owned by a section listed in `amended:`); every section in `amended:` is touched by the `--specs` diff; `git diff` shows no `## Goal` change; `## Unchanged behavior` exists in the root spec; every `work:` line covers ≥1 key.
- Hides: how `owners:` and `work:` are parsed (canonical keys, a leading `rN ` stripped, `covers:` the last `|` field split on `, [`) and how specs are diffed.
- Must not: edit or restore specs, file beads or write overrides (Amend Mode does); re-check the step-back record (step-back-check does).
- Relationships: reads the ledger's open rows and the spec files. It is a sibling of step-back-check with the same output and exit contract; the two share no code beyond that convention.
- Lifecycle: the amend designer writes one record per redesign cycle K. Once it passes the check it is immutable; resume re-runs the check before acting on it.
- Errors: 0 ok; 3 `reject:` lines (Amend Mode restores the specs and re-dispatches once, then aborts the cycle); 2 bad input, including a git failure, which must never read as a reject.

**Amend Mode** — new super-design skill section (`§Amend Mode`, with `amend-prompt.md`): the single redesign entry point both loops call, a Facade over super-design's spec-amending machinery.
- Owns: the sequence dispatch (on clean spec paths) → amend-check (spec restore + one retry) → commit specs (+ Key Abstractions sync when that section changed) → file `work:` beads per §Decomposition, labelled `sp:redesign-<loop>-<K>` and deduped by title → dispute lines to the overrides file + ledger rebuild with the caller's invocation → one `coverage-amend-<loop>-<K>` round; restoring the specs to HEAD on every reject and abort (both only before the commit); retry-once-then-`redesign incomplete` after the commit; naming the record state each step completes; being the single filer of the amendment's beads.
- Hides: the per-loop differences, held in one closed table keyed by `--loop code|design`:
  - the code loop files post-hand-off beads with no sweep edges, and its amend-check requires a `work:` line for every non-disputed open item;
  - the design loop wires beads under `Integration sweep:` and `bd supersede`s obsoleted beads.
  
  It also hides how it reuses Key Abstractions sync and coverage while staying outside the two-round coverage cap.
- Must not:
  - count or check the redesign budget, write `redesignCycles-*`, or write any `redesign-*` field but `state` (the calling loop's orchestrator runs Amend Mode inline and rewrites the record's state after each step);
  - run any roast, super-code or the next round (the calling loop does all of these);
  - route on raw reports (the ledger is its input; report text is read by key through its pointers);
  - have the orchestrator edit specs (only the amend designer does, per I8).
- Relationships: the calling loop delegates to it, passing its bead context. It composes the amend designer, amend-check, §Decomposition, §Key Abstractions sync and §Coverage. Dependencies point loop → Amend Mode → super-design internals, never back into super-auto.
- Lifecycle: invoked once per redesign cycle; stateless between cycles. Its durable outputs are the amend file, the spec commit, the labelled beads, the dispute lines and the coverage record. Resume re-enters at the step after the record's `state`.
- Errors: it returns one of three outcomes the caller can tell apart:
  - `applied` (with the record path, bead ids and `amended:`);
  - `aborted — amend rejected`;
  - `aborted — <other cause>`.
  
  Both aborts happen before the spec commit and leave the specs at HEAD; the caller runs the round `local`. After the commit nothing aborts: a step that fails twice (a failed coverage round included) parks `redesign incomplete — <step>: <cause>`, and the outcome is `applied`.

**Redesign budget** — new run-state concept (fields `redesignCycles-<loop>` and `redesign-<loop>-<K>` in `run-state.md` items 5/7, plus the effective-cap rule): how many redesign cycles a loop has spent, the cap derived from them, and each cycle's state.
- Owns:
  - the counter (≤2, written when Step 1 starts a cycle, never reset);
  - the per-cycle record, the cycle's single state field (triggers, amended sections, `lastGood`, `designRoast` with its `r<M>` / `r<M> fixed` markers, state `started → amend-checked → specs-committed → beads-filed → applied | aborted | thrash`), rewritten in place by the calling loop;
  - the effective cap (`3 + cycles` code; `3 + cycles`, plus the conditional extension, design).
- Hides: the formula. Super-roast only ever sees a number as `config.iterationCap`.
- Must not: change super-roast round numbering or labels (Challenge 2); revert to `lastGood` (vision: a breach exits as thrash and is reported).
- Relationships: each loop's §Loop exits reads it to decide cap and thrash, after that loop's Step 1. The two loops state its exit rules separately, deliberately with no shared mode flag. Resume dispatches from the record's state; report-prompt reads it.
- Lifecycle: it lives in run.md (or the design loop's round summaries when standalone) for the run's life, one set of fields per loop, shared between none.
- Errors: none of its own. A record whose state names a step without its durable output makes resume re-run that step.

**step-back-check** — extended: moved to `skills/super-design/scripts/`. It gains `--ledger`, and it is the one place that maps `patch` to `local`. It rejects `local` while the ledger names a mechanical trigger, `redesign` with `triggers: none`, and a cited mechanical trigger the ledger lacks. It holds the list of semantic (agent-judged) trigger names and treats every other trigger name as mechanical, which needs ledger confirmation. It strips the keys file's `rN ` prefixes and matches `dissolves:`/`remains:` in canonical form.

**step-back-prompt.md** — extended: the `local | redesign` decision, the `triggers:` field, and the ledger as primary input (finding text read by key through its `text` pointers). It is the single place the trigger vocabulary and the two semantic trigger definitions are written.

**report-prompt.md, resume.md, run-state.md, report-verdict** — extended: they read and replay the new fields, the ledger and the amend files, and report-verdict recognises `decision: local`. They add no decisions of their own.

Variation:
- The loop kind (`code` | `design`) is fixed. It is a closed enum, matched once in Amend Mode's loop table (bead wiring, supersede and the amend-check reverse rule) and once in each loop's own Step 1 and exit sections (cap formula, breach, post-amend roast). The shared scripts never branch on it beyond `--loop` labelling, accepting `--final-review` only from the code loop, and amend-check's code-loop reverse rule (Amend Mode's table row).
- The trigger set varies. A new mechanical trigger is computed only in findings-ledger; a new semantic one is defined only in step-back-prompt.md (and added to step-back-check's semantic list).

Walk-through, main use case:
1. Code round N's report arrives, not converged. Step 1 rebuilds `findings-ledger.md` with `triggers: no-progress(...)`; there is no breach.
2. The step-back reads the ledger and answers `redesign`, `scope: inside`; step-back-check `--ledger` prints `ok`. Its `dissolves:` go to the overrides file and the ledger is rebuilt.
3. Budget is left: Step 1 records `lastGood`, increments `redesignCycles-code` and writes `redesign-code-1` (`started`). The cap test now uses `3 + 1`.
4. The loop runs Amend Mode inline, writing each state: the designer is dispatched, amend-check prints `ok` (`amend-checked`), the specs are committed (`specs-committed`), the labelled beads are filed (`beads-filed`), disputes are written, the ledger is rebuilt and `coverage-amend-code-1` runs.
5. Phase 2 converged at design round 2, so the design cap (3) allows one amend roast: the loop runs design roast round 3 on the amended specs (`designRoast r3`), a dispatched fixer applies its spec fixes, the loop commits them (`designRoast r3 fixed`), sets `applied`, re-enters super-code (`deferSweep`), then roast round N+1 runs with `iterationCap` = 4 and the ledger in its stated intent.
6. The ledger rebuilds and shows the old keys as `resolved@rN+1`.

Likely future changes:
- A third mechanical trigger (e.g. a Should-fix key open for 3 rounds) touches one computation in findings-ledger and one vocabulary line in step-back-prompt.md. step-back-check, Amend Mode and both loops stay unchanged.
- A third loop (e.g. a plan roast) adds one row to Amend Mode's loop table and one counter field.

Deliberate exceptions forced by the spec's decisions:
- Per spec §1: findings-ledger calls `super-code/scripts/report-verdict` for keys and verdict qualifiers. This deliberate cross-skill dependency is accepted so that report parsing stays in one place.
- Per spec §3 and §Key decisions: the budget is an effective cap passed as `iterationCap`, not a separate round label. Redesign rounds are therefore indistinguishable in super-roast reports; only the `redesign-*` records mark them.
- Per spec §1 and §4 step 5: disputes reach the ledger only through the overrides file that Amend Mode writes from validated `owners:`; findings-ledger never reads amend files directly.
- Per spec §1 and §Key decisions: `disputed` is the one status that a later re-confirmation does not override.

Digest:
- Findings ledger: owns cross-round finding identity in canonical form, statuses with their precedence, report pointers and mechanical triggers;
  new mechanical triggers and status rules are computed only in `findings-ledger`;
  callers never route on raw reports or recompute Blocking deltas, and read finding text only through the ledger's pointers.
- Amend record and amend-check: owns the amend designer's output contract and its two-way validation;
  new amend rules go only in `amend-check`;
  callers never act on an amend file that amend-check has not passed, including on resume.
- Amend Mode: owns the redesign sequence from the amend dispatch through spec restore, beads, disputes and coverage;
  per-loop differences go only in its `code|design` table;
  callers never edit specs, file amend beads or run coverage themselves, and Amend Mode never touches the budget or runs a roast.
- Redesign budget: owns the `redesignCycles-<loop>` counters, the `redesign-<loop>-<K>` state records and the effective cap;
  cap and thrash rules go in each loop's §Loop exits, tested after its Step 1;
  callers never pass super-roast anything but the computed number, never reset the counter, and resume only from the record's state.

## Post-Implementation Notes

**Changes vs. original design (2026-10-17).** The design and code roasts tightened it in place; no decision of the vision changed.
- `dissolved@rN` overrides are written only inside the taken redesign branch, count only from round N on, and are removed (ledger rebuilt) on every abort path, live or resumed; `step-back-check` rejects `dissolves:`/`remains:` on a non-redesign record and compares mechanical triggers both ways with a paren-aware parser.
- A redesign round's bead filing carries §Step 3's lifecycle duties: reopen the root epic, `bd supersede` obsoleted beads (`supersedes:` field), and, in the design loop, the Integration-sweep edge.
- The calling loop, not Amend Mode, writes the cycle's `applied` state; the code loop's post-amend design roast is an ordinary numbered round owned by the caller.
- The final-review keys file says whether a review ran, so a clean review resolves keys and a no-review round does not; the punch list merges the latest existing file across redesign rounds.
- The redesign step-back line is written only after the branch is chosen; resume replays a redesign only through its `redesign-<loop>-<K>` record.
- Known open at merge (report.md Remaining): the `id_of` raw-title lookup (JSON-escaped titles), an empty-`work:` loop in the design-loop sweep wiring, `amend-check` fail-closed git handling and CommonMark fence parsing, and the final review's untested-scope list.


> *As this design is implemented and iterated on — bug fixes, adjustments, anything that diverged from the assumptions above — append a dated note here, whether or not a formal debugging skill was used.*
