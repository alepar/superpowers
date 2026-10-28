# Investigation: super-plan-tco (review readiness) and super-plan-row (finding continuity)

Repo: /Users/alepar/AleCode/superpowers/.worktrees/super-auto-review-continuity-followups (HEAD c5798364).
Evidence: /private/tmp/superpowers-mosh-phase2-triage-9tg/. Read-only; nothing edited.

---

## A. super-plan-tco — reviewReadiness

### The contract (super-roast)

- Validation: `skills/super-roast/scripts/assemble-args.mjs:288-297`. Default
  `{coverage:"unknown",provenance:"unknown",basis:""}`. Explicit input must be
  `coverage ∈ complete|bounded|unknown`, `provenance ∈ available|unavailable|unknown`, string
  `basis`, and a nonempty basis when complete+available. Otherwise exit 2. Flag at line 29:
  `--review-readiness <json|@file>`.
- Semantics: `skills/super-roast/super-roast-workflow.md:210-229`. Affirmative means `complete` +
  `available` + a nonempty basis "tied to the captured source and inspected scope". Scout
  success, selected paths, zero candidates and absence of parser gaps do not count as evidence.
  Engine code is at lines 551-598: `sourceReady` (559), `readinessTag` (560), `qualify()` (591-598).
- Effect: `skills/super-roast/SKILL.md:238-252` and `reporter-prompt.md:198-204`. Anything other
  than affirmative readiness adds `[low coverage] [review readiness incomplete]` and blocks
  `[converged]`.
- **Root hole:** the super-roast **Inputs table (`SKILL.md:46-58`) has no readiness row.** The
  input is only mentioned in prose at 238-241. A caller that follows the Inputs table, as
  super-auto and super-design do, never learns about it.

### Callers today

- super-auto phase 4: `skills/super-auto/SKILL.md:171`. It passes the report dir, spec intent,
  iteration, `autonomous`, iterationCap, prior report, punch list, `--repo/--base/--head`,
  `--diff-stat` and `--artifact`. It never passes readiness.
- super-auto post-cap audit, `SKILL.md:325`: "as in phase 4", so readiness is missing there too.
- super-auto amend design roast, `SKILL.md:415`: no readiness.
- super-design §Adversarial Review Loop, `skills/super-design/SKILL.md:686-691`: no readiness.
  The re-roast steps at 777 and 803 don't pass it either.
- Consequence (my inference from the engine code): since 8499ca6d (an ancestor of 444f86b2),
  canonical design and code loops **can never converge**. Every round is `[low coverage]`, and the
  loops run to their caps. In the mosh evidence, run.md:36 claims design r2 `[converged]`. Under
  6.6 that needs affirmative caller readiness, but the design reports are not in the triage dir,
  so I could not verify it. The plugin version may have differed.
- In the mosh run the caller improvised readiness for the code roast. Roast-pr-1 header line 5
  reads `coverage bounded, provenance unavailable — basis: "review-input assembly returned
  provenance unavailable (inherited …); direct review … limited to product paths …"`. That
  value is correct for the bounded route, but nothing canonical required it.

### Evidence available at each caller boundary

- Code roast: the assembler relay `{dir, exit, fits, cause}`
  (`skills/super-code/assembler-prompt.md:22-37`, step 7) plus `<dir>/review-inputs.json`
  (`dispatch-text.mjs:394`):
  `{base, head, sourceAvailable, wholeRangeReady:false, status:"complete"|"unavailable", changed, slices, omitted, gaps}`.
  - `wholeRangeReady` is **always false** (line 394), so it cannot serve as the readiness gate.
  - `fits` is size only, and `SKILL.md:171` says `fits: no` does not change the inputs. It
    carries no readiness meaning.
- Design roast: the settled spec-tree paths, their commit SHA and the coverage-loop approvals
  (`coverage-round-N`). super-design has no assembler or provenance artifact.

### Proposed caller text

1. **super-roast `SKILL.md` Inputs table, after line 57.** New row:
   `review readiness (optional) | {coverage, provenance, basis} source evidence per super-roast-workflow.md args.reviewReadiness; relayed as assemble-args --review-readiness. Omitted = unknown (no convergence).`
2. **super-auto `SKILL.md:171`**, after "read its returned `dir`, `exit` and `fits`". Pass
   readiness built from that round's captured result:
   - `exit` 0 and `<dir>/review-inputs.json` has `status:"complete"`, `gaps:[]`, and base/head
     equal to the captured SHAs:
     `{"coverage":"complete","provenance":"available","basis":"review-inputs <dir>/review-inputs.json (sha256 <h>): status complete, 0 gaps, <n> selected, <m> hash-verified omitted, captured <base>..<head>"}`.
   - Typed `review input selection: provenance unavailable; captured source available` bounded
     review:
     `{"coverage":"bounded","provenance":"unavailable","basis":"<cause verbatim>; inspected <paths>; unreviewed <paths>"}`.
   - Any other assembler failure or direct fallback:
     `{"coverage":"unknown","provenance":"unavailable","basis":"assembler: unavailable — <cause>"}`.
   - Fixed rules: `fits` neither grants nor removes readiness. Readiness is computed fresh each
     round and never copied from a prior round. Scout success or a green sweep never yields
     `complete`.
3. **`SKILL.md:325`, post-cap audit:** "…punch-list file, stated intent **and review readiness**
   as in phase 4".
4. **Design mode: `SKILL.md:415` (amend roast) and super-design `SKILL.md:686-690`.** Pass
   `complete/available` only when every spec of the settled tree is passed, the specs are
   committed at a captured SHA, and those paths are clean. Basis:
   `settled tree @<sha>: <spec paths>; coverage loop passed (<coverage-round line>)`. Otherwise
   pass `unknown`. **Human decision:** whether a coverage-loop pass counts as basis. The
   conservative option, always `unknown`, keeps design loops non-converging, as they are today.

---

## B. super-plan-row — finding continuity

### Where the instructions live

- Schema: `skills/super-auto/run-state.md:66-69` (field table) and `:325-508` (§Finding
  continuity). Source at 333-345, link at 433-440, route at 442-445, disposition at 447-461,
  CLI at 463-490, metrics at 491-503.
- Caller sites in super-auto `SKILL.md`:
  - 399, Step 2: the punch list is written "after retaining the round's complete source and
    `finding-route` records (§Review collection)". This is an indirect pointer.
  - 392-397: records `scopeFilter-round-N` lines only. **No instruction to append routes here.**
  - 401-403, Step 3: files beads. **No route `fix:<bead>` instruction.**
  - 432 and 452 (§Final-review items / Cap disposition): "For every resulting owner/fix/deferred
    decision, append `finding-route`".
  - 511 (§Review collection): "append … `finding-source` for every original report … Record the
    scope filter's decisions as `finding-route` refs". This is scoped to "each design/code
    handoff and resume", not to the round.

### Detection today

- `scope-dispositions --project` (`skills/super-auto/scripts/scope-dispositions:22-200`):
  - It produces a gap only when there is no source at all (80). It never checks that a finding
    has routes.
  - Routes affect only `deferred` (152).
  - An actionable group without routes is silently "outstanding, nondeferred", so `--keys`
    prints nothing (176).
  - **Nothing detects "routed/filed but no finding-route".**
- `report-status --acceptance` (`skills/super-auto/scripts/report-status:350-370`):
  - It reports `source coverage: declared report has no retained source extraction: <roast-code report>`,
    but only when a `root-acceptance` record exists.
  - Lines 390-398 also produce gaps for outstanding findings that lack a `findingAcceptance`
    judgment. That is a relevance check, not a routing check.
- Ordinary `report-status` (611-614) prints `outstanding findings: N` and
  `finding evidence gaps: N` from the projection, so new projection gaps surface there
  automatically.
- run-digest: no finding-record logic was found. Not inspected further.

### Escalations in the schema

- There is no record kind for them. A pending escalation exists only as a free-text `parked:`
  line, `- <source report> · escalation · "<text>"` (run-state.md:37; example at 558), carrying
  no occurrence ref.
- `report-verdict --complete` does extract the roast section `Escalations`
  (`skills/super-code/scripts/report-verdict:97`). The projector's actionable regex
  (`scope-dispositions:183`) excludes it, so it lands in `otherSectionGroups`.
- Final-review "human decision" items arrive as `Must fix` occurrences that repeat across
  invocations.
- **Pending status = outstanding (no supported disposition).** Identity across reviews needs an
  explicit `finding-link`.

### What the mosh caller actually did (run.md and friction.md)

- Six `finding-source` records, all kind `final-review`, one per collection.
  Projection = 158 occurrences (Untested scope 67, Deferred OK 62, Must fix 29), 0 gaps, exit 0,
  empty keys.
- 0 link/route/disposition records.
- **No roast-code or roast-design `finding-source`.** `report-verdict --complete` on
  roast-pr-1.md fails with exit 2: "finding text without a list marker in Unverified nits",
  which duplicates super-plan-2s3. With no source, no ref exists for a route.
  - Corollary (my inference): the roast-level checks proposed below, and routes for
    roast-scope decisions, only work once 2s3 makes roast extraction succeed. Until then they
    stay gaps.
- `scopeFilter-round-1/2` recorded 7 decisions, and the fix beads mosh-hex.12/.13/.15/.16/.17
  were named in the stepBack lines. None became routes.
- Friction log: "scope-dispositions --project --keys returned an empty projection although
  round-1 punch-listed keys exist; punch-list file written from the scope keys instead (same gap
  as phase 1)". **The caller saw the failure and substituted keys silently. Nothing made it a
  gap.**
- Escalations were parked as free text that cites invocations: `final-review-inv-d659cb48 ·
  escalation · "Must-fix: human decision to accept …"`, and the same for d1b970ad. No ref and no
  link between the repeats.
- The `finish · human` approval later accepted them. No disposition records that.

### Minimal change

1. **Script check, in `scope-dispositions --project` (new gaps, exit 3):**
   - (a) For each `scopeFilter-round-N: <key> <in-scope|punch-list> — …` line in run.md:
     gap `scope-filter decision without finding-route: round N <key>` unless some route targets
     an occurrence whose source is a roast source and whose key equals `<key>`.
     - The display key is used **only to detect missing bookkeeping**. It never links or
       resolves anything.
   - (b) For each `roast-code:` / `roast-design:` declared report: gap
     `declared roast report has no finding-source: <path>` when no source has that artifact
     path. This mirrors report-status:350-356 but works without root-acceptance and at Step 2
     time.
   - (c) Additive metric `unrouted`: actionable outstanding groups with zero routes. Not a gap,
     since mid-run groups can legitimately be unrouted.
   - Effect on the mosh run.md: (a) gives 7 gaps, (b) gives 5. Ordinary `report-status` would
     print `finding evidence gaps: 12` instead of nothing. The Step 2 rule at 399 ("Exit 3 …
     recover the gaps") then fires instead of a silent substitution.
2. **Instruction fixes at the call sites:**
   - `SKILL.md:392-399` (Step 2): before computing dispositions, append the round's
     `finding-source` (`report-verdict --complete --source roast-code/round-<N> <report>`).
     After them, append one `finding-route` per decision on its `Confirmed findings` ref
     (`deferred:<reason>` for punch-list). On extraction failure, record the failure. Never
     write the punch list from scope keys in place of the projection; carry its
     `FINDING_GAP:` lines instead.
   - `SKILL.md:401-403` (Step 3): after each `bd create`, append
     `finding-route {ref, fix:<bead>}` for every member ref, cluster members included.
   - `SKILL.md:430/452` (final-review items) and `super-design` 697 (escalations):
     - For a human-gated item (roast `Escalations` entry or final-review "human decision"
       Must-fix), append `finding-route {ref, deferred:"pending human decision: <text>"}`.
     - Put the ref in the parked escalation text.
     - For a re-appearance in a later review, append a `finding-link` with a judged basis.
       Never infer the link from the key.
     - Resolve only with a `finding-disposition` whose evidence cites the human's recorded
       approval line. Autonomous mode never writes it (existing rule at SKILL.md:585).
     - Bead closure, an equal key or a later clean review never disposes.
   - `run-state.md:442-445`: one sentence defining the `pending human decision:` deferred
     prefix as the pending-escalation status. No new record kind.

### Tests to touch

- `tests/super-auto/test-scripts.sh`: projection cases around 343, 442 and 484. Add
  scopeFilter-without-route and declared-report-without-source fixtures.
- `tests/super-auto/test-contract-lint.sh`.
- `tests/super-roast/test-assemble-args.sh`, if the Inputs row is linted.

### Seams with the default-flags tab (autonomous/roasts defaults)

- Shared text: the `SKILL.md` phase table rows 168-171. Row 171 carries `autonomous` and is
  where readiness would be added.
- Shared text: §Autonomous mode 544-593 (576 is the roast-offer default).
- Pre-flight/Inputs 80-159 (flags line at 118) is theirs and is not touched here.
- Behavior seam: if their defaults turn both roasts on, the non-convergence from A (every
  canonical loop runs to cap) becomes the common path.
