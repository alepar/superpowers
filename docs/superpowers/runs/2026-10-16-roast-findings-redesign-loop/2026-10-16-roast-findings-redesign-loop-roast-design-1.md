super-roast verdict: Blocking (26 confirmed)
mode: design        iteration: 1 of 3
profile (assumed): The repository is the alepar fork of the superpowers Claude Code/Codex skills plugin, maintained by a single operator with no external users. The artifact is a design spec for an autonomous roast-fix loop implemented as SKILL.md prose plus bash/awk scripts; its failure costs are wasted LLM compute, wasted redesign budget and operator time, not money or customer data. Rollback is a git revert of spec or skill text. Blast radius is low, so resilience and cost findings are weighed down, while gaps that defeat the spec's own stated guarantee are not.
inputs: /Users/alepar/AleCode/superpowers/.worktrees/roast-findings-redesign-loop/docs/superpowers/runs/2026-10-16-roast-findings-redesign-loop/2026-10-16-roast-findings-redesign-loop-design.md + task tree super-plan-59b
coverage: scouts 8/8 (premortem, completeness, yagni, failure-mode, feasibility, domain:agent-workflow-orchestration, domain:state-machine-convergence-control, domain:shell-scripting-cli-tooling) · raw 158 → deduped 69 → panel 46 · spot 23 · promoted 0 · judge completion 100% · remainder-capped: 0
independence: same-family (Claude) — seat-differentiated panel · rung: Workflow
seat-agreement: panels 46 · rr 0.65 · rg 0.72 · fg 0.63 · unanimous 0.50 · ground-loo 0.77 (n=30) · reproduce 23/23/0 · refute 17/29/0 · ground 32/14/0
lane-yield (found/confirmed/unique/refuted): premortem 24/16/1/8 · completeness 24/15/1/8 · yagni 10/4/0/5 · failure-mode 21/12/1/9 · feasibility 21/14/0/7 · domain:agent-workflow-orchestration 24/11/1/13 · domain:state-machine-convergence-control 14/7/0/7 · domain:shell-scripting-cli-tooling 20/5/0/15

## Confirmed findings

- [Blocking] §3 Step 1 outcome list; §2 step-back-check rejections — The spec never defines the step-back-check reject path (exit 3) under a mechanical trigger. The inherited phase-5 fallback runs a rejected `local` answer as a patch round anyway, so the Goal's "cannot be answered `local`" is unenforced in the exact scenario it targets.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: skills/super-auto/SKILL.md:248 "On `reject:` lines (exit 3), run the round as `patch`". §3 Step 1 lists outcomes only for ok records (`local`, `redesign`+inside, `redesign`+outside, budget spent). §4 step 2 gives a reject rule for amend-check; §2 and §3 give none for step-back-check. §2 gives the design loop step-back-check for the first time with no reject rule at all. Thrash needs `redesignCycles-code` = 2, and a rejected-then-patched round never increments it.
  severity: Blocking under the core-purpose floor. Seats rated Blocking / Should-fix / Should-fix; the two Should-fix votes rest on the fix being small, which the floor does not weigh.
  fix-shape hint: state the reject path in §2/§3: re-dispatch the step-back once with the reject lines, then force the §Redesign cycle (budget left) or take the thrash exit; apply the same rule to the design loop.

- [Should-fix] §3 Loop exits 'Cap' vs Step 1 — The spec does not order the cap exit against Step 1, so a mechanical trigger first firing on the cap round (round 3 with zero cycles) can exit as capped and never start a redesign, contradicting "up to 2 redesign cycles beyond its round cap".
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: skills/super-auto/SKILL.md:262 "The step-back also runs when the loop exits at thrash or the cap ... a redesign is recorded as `parked` and surfaced, never applied". Spec §3 lists Loop exits and Step 1 as separate bullets with no precedence. `redesignCycles` is incremented only inside §Redesign cycle step 2. The `returned` half of recurrence cannot fire before round 3 (§7's own test case). The walk-through uses an unspecified round N; §7 has no cap-round test.
  fix-shape hint: one sentence: Step 1 runs before the cap test, and a redesign that increments the counter raises the cap before the test; add a cap-round trigger test.

- [Should-fix] Design loop §Loop exits (unwritten); Key decisions 'design: 3 + 1 extension + redesignCycles' — The design loop's exit rules (thrash, cap, budget-spent, lastGood, outside scope, extension round) are never specified; only the code loop's §3 is rewritten, so today's count-based thrash would end the design loop before a redesign can start.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: Redesign budget abstraction: "cap and thrash rules go in each loop's §Loop exits" and "The two loops state its exit rules separately". §3 is titled "Code loop (super-auto §Phase 5)". For the design loop the spec gives only the cap formula, "it now also runs step-back-check" (§2) and "redesign runs the same Amend Mode" (§4). Problem description: "The design loop has the same shape" as the thrash exit being replaced. Open: budget-spent behaviour, lastGood before code exists, `scope: outside`, whether the "+1 extension" is unconditional, redesign in the extension round.
  fix-shape hint: add a design-loop §Loop exits section mirroring §3, stating the extension and lastGood semantics explicitly.

- [Should-fix] §1 Statuses (dissolved/disputed from --overrides) vs Key decisions trigger formulas — Disputed/dissolved overrides change only per-key status and never reach the trigger arithmetic, so a single disputed Blocking finding re-fires no-progress every round until thrash.
  verdict: confirmed (reproduce ✓ / refute REJECT, outvoted / ground ✓)
  evidence: Spec lines 29-31: no-progress = carriedB + regressedB ≥ prevB, from the reporter's `delta vs prior:` line. Line 60: overrides are per-key statuses. Lines 197-198: trigger arithmetic comes from exact keys plus reporter counts. Challenge 2: super-roast unchanged, so the reporter cannot know about overrides. §4 step 7: "A disputed Blocking finding stays unresolved". Scenario: one disputed Blocking, carriedB=1 ≥ 1, no-progress fires, `local` rejected, two cycles spent re-litigating, then thrash. The refute seat's point that disputed stays open is intended does not address the wasted budget and the thrash label.
  fix-shape hint: one rule: exclude `disputed` and `dissolved` keys from carriedB/regressedB and from the previous-count comparison (or from the thrash reading).

- [Should-fix] §4 step 2 amend-check rules; §3 'Skipped in a redesign round: ... per-finding filing' — amend-check checks work→keys but never keys→work, and redesign rounds skip per-finding filing, so an open key marked `local` or `owner` with no covering `work:` line silently drops out of the fix queue.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: §4 step 2 and Key abstractions (line 205) list four rules: every open key in `owners:`, no Goal diff, `## Unchanged behavior` exists, every `work:` line covers ≥1 key. §3 line 110: per-finding filing skipped, "its local findings arrive as plain beads". §7 line 190 has four amend-check tests, none for an uncovered local/owner key. No check that an `owner: <spec> §X` section appears in `amended:`.
  fix-shape hint: add the reverse rule (every non-disputed open key appears in some `work:` `covers:` or in an owned section listed in `amended:`) plus a §7 test.

- [Should-fix] §1 overrides format; Key abstractions Amend record 'split-on-`rN [`' — Key formats differ between ledger rows (bare `[SEV] <location>`), step-back `dissolves:`/amend `owners:` (`rN [SEV] ...`) and override lines, with no stated normalisation, so overrides and amend-check matches can fail silently.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: skills/super-code/scripts/report-verdict keys mode prints `[SEV] <location>`; skills/super-auto/scripts/step-back-check keys file is `rN [SEV] <location>` and SKILL.md:244 prefixes `r<M>` with sed. Spec line 60: override lines "written by the orchestrator from step-back `dissolves:`" with no strip rule. Line 206: `owners:` parsed with the split-on-`rN [` convention, yet line 205 compares against bare ledger `open` keys. Line 202 Errors cover only an unreadable overrides file, so an unmatched override is silent. SKILL.md:267 and scope-filter-prompt.md:11 already say "without the rN prefix" for scope keys.
  fix-shape hint: state one canonical key form (strip `^rN `, match on `[SEV] <location>`), say which N for a recurring key, and make an unmatched override line an error.

- [Should-fix] §1 invocation (`--report <round>=<path>` only); §3 'final-review items ... unchanged' — Final-review Must-fix items are never ingested by findings-ledger, so a ledger-driven step-back and amend-check never see them and redesign rounds can drop them silently.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: Vision line 120 (binding): "Final-review items feeding the step-back (now also through the ledger)". Spec §1 inputs: roast reports, punch list, overrides only. skills/super-auto/SKILL.md:244 and §Final-review items (line 292): `rN [Must-fix] ...` keys go into the step-back keys file, not any ledger. §4 step 2 requires only `open` ledger keys in `owners:`. §3 skips per-finding filing in a redesign round. Mitigation: the step-back still sees them via `--keys`, and mechanical triggers are unaffected.
  fix-shape hint: add a `--final-review <round>=<file>` (or extra-keys) input to findings-ledger, or state that Amend Mode also receives the step-back keys file and amend-check covers those keys.

- [Should-fix] §3 Redesign cycle step 4 vs §4 step 4 and Digest — §3 has the code loop file Amend Mode's beads (§Fix-bead template) while §4, Key decisions and the Digest have Amend Mode file them per §Decomposition and forbid callers, risking double or no filing.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: Spec line 106: "File the beads it returns (I3 flags, §Fix-bead template ...)". Line 136: Amend Mode step 4 files `work:` items per §Decomposition. Line 213: Amend Mode owns filing. Line 280: "callers never edit specs, file amend beads or run coverage themselves". Amend Mode's outcomes (lines 220-224) return no bead list. Refute seat: the templates compose (SKILL.md:282, :334), so the template conflict is weak; the owner conflict is real.
  fix-shape hint: reword §3 step 4 to "Amend Mode has filed the beads; the loop adds fix-bead context" or drop the step.

- [Nit] Main challenges 1 ('delta vs prior: line does count ... reliably') — Both mechanical triggers rest on the LLM reporter's `delta vs prior:` counts, whose reliability is asserted from one anecdote with no consistency check against extracted keys.
  verdict: confirmed (reproduce ✓ / refute REJECT, outvoted / ground ✓)
  evidence: skills/super-roast/reporter-prompt.md:228 has the reporter write the line itself by matching "on substance". §1 Hides: headers come "only from the `inputs:`, `iteration:` and `delta vs prior:` lines, never from report bodies". §2 step-back-check hard-rejects on the derived triggers; §3 uses them for thrash. No sanity rule (carriedB ≤ prevB). §7's manual replay covers round 1 only, which has no delta line. Ground seat: the line is super-roast's existing convergence contract (SKILL.md:224, reporter-prompt.md:166) and a false negative falls back to today's behaviour.
  severity: demoted to Nit: profile is a single-operator dev tool where a miscount costs one bounded redesign cycle (≤2) of compute, and the line is an existing contract already relied on.
  fix-shape hint: add a cheap plausibility check in findings-ledger (carriedB ≤ prevB, else report `-`), and run the proposed spike over archived multi-round reports.

- [Should-fix] §5 resume.md bullets vs Amend Mode Lifecycle 'first missing output' — The resume stages omit partial states (beads partly filed, coverage-amend not run, design roast mid-way, design-loop cycles), and nothing ties filed beads to cycle K, risking duplicate or dropped beads.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: §5 lists three `redesign-code-<K>` cases only. Lifecycle (line ~225) names four durable outputs including the coverage record. Step 4 (line 136) files several beads with separate `bd` calls; "beads filed" is a single untested state with no per-cycle label or dedupe key. Line 23 lists "resume replay" as a stated cross-file contract. §7 has no resume test. Refute seat narrows: coverage record and design roast are covered by the generic rule; partial bead filing is the surviving hole.
  fix-shape hint: label beads `redesign:<loop>-<K>` and have resume diff `work:` titles against existing beads; add a `redesign-design-<K>` bullet.

- [Should-fix] §5 resume.md 'With the amend file but uncommitted specs, it applies the file.' — Resume applies the amend file although nothing marks it as having passed amend-check, so a rejected or aborted amendment can be committed on resume.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground REJECT, outvoted)
  evidence: §4 step 1 writes `amend-<loop>-<K>.md` and edits specs before validation; step 2 can reject and re-dispatch; abort leaves the file and dirty specs on disk. §5 resume rule does not say to re-run amend-check or read the record's outcome. Only the `redesign-<loop>-<K>` record carries `applied | aborted`. Digest: "callers never act on an amend file that amend-check has not passed". Ground seat reads the invariant as implying a re-check; the rule itself does not say so.
  fix-shape hint: resume re-runs the idempotent amend-check on the file plus working-tree diff and reads the record outcome before committing; treat a reject as aborted.

- [Should-fix] §4 step 1/step 2 abort path ('if it fails again, the round runs `local`') — On an aborted or rejected amendment the designer's uncommitted spec edits are never reverted, so rejected edits (including a `## Goal` change) stay in the worktree through the local round and can leak into a later commit.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: §4 step 1 edits specs in place; step 2 validates with `git diff`; step 3 commits only after a pass. Abort path records `aborted — amend rejected` only. Grep for revert/restore/reset/checkout/stash finds only the ban on reverting code to `lastGood` (lines 116, 239). The retry's starting state is unstated; a stacked Goal edit would still show in the retry's diff. §5 treats "amend file but uncommitted specs" as a state to apply.
  fix-shape hint: restore the owned specs to HEAD on each reject and on abort; say the retry starts clean.

- [Should-fix] §4 step 6 together with 'Design loop: `redesign` runs the same Amend Mode' — Amend Mode's step-6 design roast overlaps the design loop's own next round; the spec never says whether it increments `roastDesignRound`, enters `findingsLedgerDesign`, chains prior reports, passes step-back-check, or is skipped for `--loop design`.
  verdict: confirmed (reproduce ✓ / refute REJECT, outvoted / ground ✓)
  evidence: Line 138 step 6 gates on `roastDesignRound` but states no increment. Line 140 and the per-loop table (217, 251) list only bead wiring and supersede as differences, so step 6 runs in both loops. Line 216: Amend Mode must not run "the next roast (the calling loop does all of these)", so the design loop roasts the same specs twice back to back. Line 201: the ledger is called "after each roast round", with no place for the inner report. Refute seat cites the coverage ledger L23 intent ("numbered design round, design-ledger input") which the spec text does not state.
  fix-shape hint: skip step 6 under `--loop design` (the caller's next round is the roast); for the code loop state the counter increment, ledger input and prior-report chaining.

- [Nit] §2 '`decision:` becomes `local | redesign`'; skills/super-code/scripts/report-verdict:226 — Changing `decision:` to `local` breaks report-verdict's step-back recogniser (`^decision:(patch|redesign)`) and its test fixtures, which §6 does not list for update.
  verdict: confirmed (reproduce REJECT, outvoted / refute ✗-survived / ground ✓)
  evidence: report-verdict:226 `grep -m1 -E '^decision:[[:space:]]*(patch|redesign)'`; tests/super-code/test-report-verdict.sh:124-131 and step-back fixtures assume `patch`. §6 lists only step-back-check path references; §7 covers only the three new scripts. Reproduce and refute seats both found no live caller that passes a step-back file to report-verdict (super-auto reads records via step-back-check, SKILL.md:248, :330).
  severity: Nit from seat evidence: two seats found no live caller, so the effect is a stale recogniser and fixture, not a runtime failure.
  fix-shape hint: add report-verdict (regex `(patch|local|redesign)`) and its test to the §6 update list.

- [Should-fix] §1 Statuses (overrides) and Findings ledger Lifecycle ('the overrides file is that loop's to append to') — The append-only overrides file has no precedence rule against computed statuses or conflicting lines, no rule for an override whose key no report contains, and no timing rule relative to the ledger rebuild that feeds amend-check.
  verdict: confirmed (reproduce ✓ / refute REJECT, outvoted / ground ✓)
  evidence: §1 lists statuses as parallel alternatives; only `open` has a computed rule. Lifecycle: rebuilt "from every round's report plus the punch list and the overrides file"; append-only, so nothing can be withdrawn. Errors list only an unreadable overrides file. §7 line 182 tests "punch-list and overrides statuses" with no conflict case. Timing: §3 Step 1 runs findings-ledger before the step-back, so `dissolves:` reach overrides after the ledger amend-check reads. No rule picks N in `dissolved@r<N>`. A dissolved key re-confirmed later could be `dissolved` or `open`, which decides whether amend-check requires it in `owners:`.
  fix-shape hint: one precedence sentence (computed `open`/`returned` in the latest round beats a stale override; last line wins among overrides; unknown key is an error) and one sentence on rebuilding the ledger before amend-check.

- [Nit] §2 'Design loop: it now also runs step-back-check' — The design loop's step-back-check `--keys` file construction is undefined; the spec gives the keys-file recipe only for the code loop.
  verdict: confirmed (reproduce ✓ / refute REJECT, outvoted / ground ✓)
  evidence: step-back-check requires `--keys K`. skills/super-auto/SKILL.md:244 builds it for phase 5 only; skills/super-design/SKILL.md ~683-692 has no keys-file step. Narrowed by the reproduce seat: `stepBackDesign-round-<N>` already exists (super-design SKILL.md:689, :857), and super-design's run-state/round-summary convention covers the standalone budget, so those halves of the claim do not hold.
  fix-shape hint: one line in §2: the design loop builds the keys file the same way, from `report-verdict --keys` over each `roast-design` report with an `rN ` prefix.

- [Nit] §4 step 2 'every `open` key appears in `owners:`' — The rule does not say whether `open (returned rN)` keys count as open, so a literal exact-match implementation leaves recurrence keys unvalidated.
  verdict: confirmed (reproduce ✓ / refute REJECT, outvoted / ground ✓)
  evidence: §1 lines 55-60 define `open` and `open (returned r<N>)` as separate status strings. §4 step 2 (line 134), line 205 and line 37 say only `open`. §7 line 190 tests only "a missing open key". Returned keys are the recurrence keys the redesign most needs owned.
  fix-shape hint: say "status `open` or `open (returned rN)`" and add a returned-key fixture.

- [Nit] §5 record format 'redesign-<loop>-<K>: ... <applied|aborted — <reason>|thrash — lastGood breach>' — The record is written before the cycle starts, Amend Mode is forbidden to write it, and no step says who records the outcome afterwards or whether the line is rewritten or appended.
  verdict: confirmed (reproduce ✓ / refute REJECT, outvoted / ground ✓)
  evidence: §3 step 2 writes the record before step 3 invokes Amend Mode. Amend Mode "Must not ... write `redesign-*` records". Thrash is known only after the next roast. No update/rewrite/append wording anywhere. Resume keys off file existence, so replay is unaffected; the report's Gotchas listing and contract lint read the field.
  fix-shape hint: one sentence: the loop rewrites the outcome in place when Amend Mode returns and again on a thrash exit.

- [Should-fix] §1 Output file format; §2 'Reports become reference-only'; Amend Mode Must not 'read raw reports to decide anything' — The ledger carries only keys, rounds, SHAs and statuses, no finding text, yet the step-back and amend designer are told to decide from it and not from reports, so the read rule contradicts what the decisions need.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: Row format `- <key> · raised r<M>@<sha|-> · <status>`; report-verdict `keys_roast` cuts everything from the first " — ", so no description survives. §4 step 1 requires `owner: <spec path> §<section>` per key; §2 requires judging shared-cause and defect-type. Line 11: "Every step-back and amend decision reads findings-ledger.md, not raw reports". Amend Mode inputs do list "roast report paths (reference only)", so the intent is lookup-by-key; the stated rule forbids it and nothing enforces either.
  fix-shape hint: state that reports are read for finding content and the ledger is authoritative for identity, status and triggers; or add a one-line gist per ledger row.

- [Should-fix] §1 per-report inputs; Key decisions trigger definitions — Degraded rounds (`[low coverage]`, dead scouts, panel-capped) feed trigger computation unchanged: a dead lane makes findings look `resolved`, and when the lane recovers the same keys look `returned` and fire recurrence, forcing a redesign on a coverage artifact.
  verdict: confirmed (reproduce REJECT, outvoted / refute ✗-survived / ground ✓)
  evidence: Ledger reads only keys, `delta vs prior:`, `inputs:` and `iteration:`; "never from report bodies" (line 198). `resolved@rK` is defined purely as absence. The only "degraded" term in the spec is the `degraded-verdict` park label. skills/super-design/SKILL.md:754: "a shrinking Blocking count under low coverage is weaker evidence of progress than it looks". A false `returned` is mechanical, so step-back-check rejects `local`.
  fix-shape hint: read the verdict qualifiers via report-verdict and suppress or flag `resolved`/`returned` transitions that cross a degraded round.

- [Should-fix] Findings ledger Lifecycle and Errors; §3 Step 1 — One unreadable or keyless roast report makes findings-ledger exit 2 on every later rebuild, and the spec gives the loop no behaviour for a ledger exit 2 (run local, degrade or halt), so all later rounds lose the gated decision.
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: Lifecycle: "Each call rebuilds the whole file from every round's report". Errors: "exit 2 on bad input (a missing report, ..., a report kind with no keys, i.e. report-verdict --keys exit 3)"; report-verdict:168-169 exits 3 for `--keys` on a non-roast kind. §3 Step 1 "runs findings-ledger, then the step-back ..., then step-back-check --ledger" with no exit-2 branch. Degrade handling exists only for budget spent (line 101), amend rejected (134) and failed coverage/design roast (231).
  fix-shape hint: one sentence: on ledger exit 2, skip the bad round's report or run `local` with the gate recorded as not computable and a degraded-verdict park.

- [Should-fix] §4 step 6 ('roastDesignRound is below the design effective cap') in the code loop — When the code loop calls Amend Mode, the design roast is gated on the design loop's cap and counter, and its numbering, ledger input and chaining to phase 2 are undefined; if phase 2 ended at its cap the amended spec gets no design roast and nothing records it.
  verdict: confirmed (reproduce REJECT, outvoted / refute ✗-survived / ground ✓)
  evidence: Effective design cap is `3 + 1 + redesignCycles-design` (line 35); the code loop never increments `redesignCycles-design`. `roastDesignRound` is written only by super-design per run-state.md. No statement of whether the amend roast increments it, rebuilds `findingsLedgerDesign`, or chains its prior report to phase 2's last design report (whose findings target the pre-amend spec). Amend Mode "Must not ... count or check the redesign budget" yet reads the design cap.
  fix-shape hint: state which counter the code-loop amend roast reads, that it increments `roastDesignRound`, which ledger it feeds, and what happens when the design cap is already spent.

- [Nit] §2/§3 Step 1/§4 'Design loop' (no interactive branch) — The spec does not say whether an interactive human choice of `local` can override step-back-check under a mechanical trigger, or whether interactive runs lose the choice.
  verdict: confirmed (reproduce REJECT, outvoted / refute ✗-survived / ground ✓)
  evidence: skills/super-design/SKILL.md ~690: "On `redesign`: interactive (§Gates by Mode), present it with its recommendation and let the human choose". Vision lines 91 and 122 keep "interactive presentation of redesigns" and the human offer. Spec §3 and §4 cover only the scripted path; grep for interactive/human/decline finds nothing.
  severity: demoted to Nit: profile is a single operator who is the only interactive human; step-back-check validates the agent's record, so an undefined human decline is a one-sentence clarification with no autonomous-run impact.
  fix-shape hint: one sentence: in interactive mode a human may decline a mandated redesign, and the decline is recorded as a parked `degraded-verdict`.

- [Nit] Key decisions no-progress formula; §1 statuses — The spec replaces the vision's key-identity no-progress rule with a count rule and maps non-reconfirmed findings to `resolved@rK` instead of the vision's `dissolved@rN` without recording the departure.
  verdict: confirmed (reproduce ✓ / refute REJECT, outvoted / ground ✓)
  evidence: Spec line 3: vision Decisions are binding. Vision line 57: "compared by key identity (not count)". Vision line 90: "A finding the roast does not re-confirm becomes `dissolved@rN`". Spec line 30 uses reporter counts; line 58 assigns `resolved@rK` for absence; line 60 reserves `dissolved` for overrides. §1 Considered rejects exact-key-only identity but never records the departure. Behaviour is preserved (carried counts are identity-based), so this is a documentation gap.
  fix-shape hint: add one Key-decisions bullet recording both departures and why.

- [Nit] §3 Redesign cycle step 6; §4 Inputs — The post-redesign roast is not given the ledger the vision promises it, and Amend Mode's inputs omit the task tree the design loop's `bd supersede` step needs.
  verdict: confirmed (reproduce ✓ / refute REJECT, outvoted / ground ✓)
  evidence: Vision line 89 (binding): "The roast gets the ledger, and its stated intent includes the amended specs." Spec §3 step 6 changes only `config.iterationCap`; "After redesign" sets only the prior report. Narrowed by the refute seat's evidence: skills/super-auto/SKILL.md phase-4 row already passes "every `*-design.md` in the run directory" as stated intent, so the amended specs reach the roast; `idea:` is reachable through the run-state file. The ledger half (super-roast unchanged per Challenge 2, so the vision line is not carried and the departure is unrecorded) and the task-tree input remain.
  severity: Nit from seat evidence: the intent half, which drove the Should-fix votes, is refuted by SKILL.md; what remains is a decision to record and one input to list.
  fix-shape hint: either pass the ledger path as a reference-only roast input or record in Key decisions that prior-report revalidation replaces it; add the task tree to §4 Inputs.

- [Nit] Goal bullet 4 ('All of this is covered by script tests.') — The Goal claims full script-test coverage, but the loop-level behaviour (reject fallback, cap ordering, lastGood breach, budget-spent paths, resume) is untested SKILL.md prose.
  verdict: confirmed (reproduce ✓ / refute REJECT, outvoted / ground ✓)
  evidence: §7 names tests for findings-ledger, step-back-check, amend-check, contract-lint field names and a manual replay of one round-1 report (which has no delta line). The 2-cycle budget outcome (line 10), the breach rule (line 95), the budget-spent paths (99-101) and the `redesign-<loop>-<K>` records (154) have no test. The repo keeps skill-behaviour evals in a separate harness, so this is mostly an overclaim.
  fix-shape hint: narrow the Goal to "the mechanical triggers and validators are script-tested", or name an eval for the budget, cap and breach paths.

## Not verified (beyond panel cap)
- none

## Not verified (dedupe failed or judge lost)
- none

## Beyond remainder cap (count only)
- none

## Rejected (with reason)
- Key decisions 'no progress:' gloss — formula over-fires when regressed findings inflate it. Rejected 3-0: per reporter-prompt.md Step 3 carried and regressed are both subsets of the immediately prior report's confirmed findings, so carriedB + regressedB ≥ prevB does mean none were resolved; the re-rating edge case is a Nit at most and recurrence already forces redesign in every regression case.
- §3 Step 1 '`redesign` + `outside`: parked as today, and the round runs `local`' — mandatory redesign bypassable via outside scope. Rejected 3-0: the Goal promises only that `local` is rejected, which holds; outside-scope parking is an explicit, bounded tradeoff ending at the cap with the item surfaced in Remaining.
- §3 Redesign cycle steps 2-3 — redesignCycles incremented before Amend Mode, aborted amendments spend budget. Rejected 2-1: counting started cycles is stated policy ("written before a cycle starts, never reset") and bounds retries; Amend already retries once. Residual Nit all seats noted: `aborted — <other cause>` has no stated caller behaviour.
- Key decisions 'recurrence: ... absent from the immediately preceding round reappears' — fires on stochastic scout recall. Rejected 2-1: the vision makes reappearance the switch signal; cost is bounded to ≤2 cycles; the agentpatterns.ai citation is analogy, not a fact about this system. The proposed spike (re-roast one unchanged SHA 3 times) is a reasonable post-implementation calibration.
- §3 Loop exits 'last-known-good breach' — raw-count comparison with no tolerance. Rejected 3-0: vision lines 94-97 (binding) define the breach exit and forbid auto-revert; "which count" is a wording nit.
- Key decisions recurrence rule; §1 'punch-listed' — punch-listed keys not excluded from `returned`. Rejected 2-1: punch lists are a cap/final-review channel, the scenario needs an unstated reporter behaviour, and the outcome is a bounded, intended signal. Residual Nit: say whether punch-listed keys count toward `returned`.
- §4 step 2 'git diff shows no ## Goal change' — no base ref, vacuous after commit. Rejected 3-0: validation precedes commit; "how specs are diffed" is deliberately under Hides; no resume path re-runs the check on committed specs.
- §4 step 6 'fixed on the local path' vs step-back-check rejecting local — nested roast conflict undefined. Rejected 2-1: "local path" means Steps 2-4 with no step-back decision, so no record exists for the check to reject; one clarifying sentence would help (Nit).
- Findings ledger Errors ('triggers not computable' `-`) — gate fails open. Rejected 3-0: the degraded mode is stated explicitly, the exact-key `returned` check still fires, and the step-back agent sees `-` in its primary input; matches the project's degrade-don't-stop policy.
- Key decisions '**recurrence:** `regressed Blocking ≥ 1`' — fires on 'fixed incompletely'. Rejected 2-1: a Blocking finding a patch only partly fixed is the failed-patch case the Problem description names; the Goal states this outcome.
- §1 'amend `disputes:`' vs Amend record Owns — nonexistent `disputes:` field. Rejected 2-1: §4 step 1 and line 205 state disputes live in `owners:` as `disputed: <reason>`; the stray wording is shorthand (Nit).
- §3 step 3 vs §4 Inputs — K and overrides path not passed. Rejected 3-0: K is `redesignCycles-<loop>` in run.md, written before Amend Mode runs and passed as the run-state file; reading it is not counting the budget; the overrides path follows the per-loop ledger path.
- Findings ledger Errors 'unreadable overrides file' — absent file exits 2 on early rounds. Rejected 3-0: `--overrides` is optional (line 45); no fixed always-passed path appears in the spec.
- §1 `[--punch-list <file>]` — single file cannot represent per-round punch lists. Rejected 3-0: skills/super-auto/SKILL.md:278 defines the punch-list file as cumulative ("every key punch-listed so far"), so one file is a superset.
- §1 `--punch-list` format; §4 amend file path; §5 Pointers — formats and paths undefined. Rejected 3-0: punch list is an unchanged existing artifact; ledger paths are run-state Pointers and explicit `--out`/`--overrides` args; exact directory names are delegated to bead .1.
- §1 'resolved@r<K>' by exact-key absence — relocated finding shows as resolved plus new open. Rejected 3-0: triggers use delta counts; amend-check covers the new `open` key; Remaining lists disputed and parked items, not resolved ones; the `resolved` label is cosmetic.
- Findings ledger 'keys verbatim' — severity tag in key breaks identity on re-rating. Rejected 2-1: exact-key identity is the stated rule, counts come from the delta line, and the re-rated finding stays visible as `open`. Residual Nit: a severity-change fixture.
- §3 Step 1 parked redesigns — parked findings never excluded from triggers. Rejected 3-0: what is parked is the redesign proposal, not the findings (SKILL.md ~254-256), which still take the local fix path; the step-back's `redesign`+`outside` record passes step-back-check, so there is no reject loop.
- §Walk-through steps 5-6 — no cooldown after a redesign. Rejected 3-0: back-to-back cycles are inside the 2-cycle budget; no-progress fires only when none of the prior Blocking were resolved, which is the case the trigger exists for; the lastGood breach guards a worsening redesign.
- §1 'step-back `dissolves:`' / §2 — `dissolves:` never defined or validated, duplicates `resolved`. OVERRULED from confirmed (2-1) to rejected on the reproduce seat's evidence, verified: skills/super-auto/scripts/step-back-check already parses `dissolves:` (line 49) and validates every key against `--keys` via `checkkeys` (line 58), and step-back-prompt.md defines the field; §2 lists only changes to existing fields, so "never defined or validated" is factually false and the ground seat's "an implementer would have to invent both" does not hold. Residual Nit (refute seat): nothing in the spec consumes `dissolved`, and whether `dissolves:` may name a Blocking key under a mechanical trigger is unstated.

## Unverified nits (spot-checked)
- [FYI] §1 '`iteration:` header' — `iteration:` shares a line with `mode:` in super-roast's report format; relation to the `--report <round>` label unstated. Spot refute: REJECT (round identity comes from the CLI label; parsing is implementation detail).
- [FYI] §1 'inputs: …@<sha>' — code-mode `inputs:` has two SHAs; which becomes `raised r<M>@<sha>` is unstated. Spot refute: REJECT (the row SHA is informational; lastGood is recorded separately).
- [FYI] Digest 'callers never ... recompute Blocking deltas' vs §3 thrash breach — loop compares counts itself. Spot refute: REJECT (compares ledger-provided numbers; the breach is owned by the Redesign budget module, not a trigger).
- [FYI] Key decisions 'design: 3 + 1 extension + redesignCycles' — extension made unconditional. Spot refute: REJECT (the extension's trigger is unchanged in super-design §Capped Blocking; `iterationCap` is a display label).
- [Nit] §5 new fields list; §4 step 5 'coverage-amend-<loop>-<K>' — the coverage-amend record has no field definition and is missing from the contract-lint deliberate-additions list. Spot refute: CONFIRM Nit (amend file pointers are derivable; the coverage record half stands).
- [FYI] §4 step 2 'every work: line covers ≥1 key' — blocks follow-on work no finding names. Spot refute: REJECT (every amendment is caused by a key; follow-on items cite it in `covers:`; coverage-amend catches gaps).
- [FYI] §2 'triggers: ... shared-cause, defect-type' — semantic triggers accepted by name alone. Spot refute: REJECT (agent-judged by design; amend-check and the 2-cycle budget are the backstops).
- [FYI] §4 'Design loop: ... bd supersede' — no `supersedes:` field; orchestrator chooses beads unvalidated. Spot refute: REJECT (mechanical lookup against amended sections; nothing has executed in the design loop).
- [FYI] Findings ledger Lifecycle — no write-to-temp-then-rename; truncated ledger read as valid. Spot refute: REJECT (ledger is a derived cache regenerated before any read on resume; external claim not relied on). External source unverified.
- [FYI] §1 `--report <round>=<path>`; §4 `--specs <paths>` — multi-value and validation underspecified. Spot refute: REJECT (repeated flag with explicit round; bash parsing detail; exit 2 covers bad input).
- [FYI] Findings ledger Errors — present-but-malformed `delta vs prior:` line unhandled. Spot refute: REJECT (unavailable `-` rule applies to unparseable counts; add a fixture at the bead level).
- [FYI] §1 `triggers:` `name(<evidence>)` — evidence grammar undefined, commas can misparse. Spot refute: REJECT (closed name set; match on `name(` needs no comma split).
- [FYI] §1 row separator ` · ` with verbatim keys — no escaping or parse direction. Spot refute: REJECT (fixed trailing grammar allows right-anchored parsing; no instance observed). Unverified assumption.
- [FYI] §4 step 1 'writes only spec files' — nothing verifies the designer's write scope beyond the Goal diff. Spot refute: REJECT (step 3 commits only the specs; prompt-level scope is the stated guard).
- [FYI] §4 step 5 'Coverage: one extra round' — who acts on coverage-amend gaps is unstated. Spot refute: REJECT (inherited from §Coverage; failed rounds degrade and are recorded).
- [FYI] §4 step 2 'that `## Unchanged behavior` exists' — existence-only check passes trivially from cycle 2. Spot refute: REJECT (structural gate by design; budget bounds it to one stale case).
- [FYI] §4 step 1 'unchanged: (bullets)' — duplicates the spec section with no consumer. Spot refute: REJECT (immutable per-cycle snapshot; cost is a few bullets).
- [FYI] §2 'patch ... synonym for one release'; §5 'patch accepted on read' — speculative compat in two places. Spot refute: REJECT (deliberate, tested alias; "one place" is loose wording). Unverified assumption.
- [FYI] §3 Step 1 'degraded-verdict redesign budget spent' — new park record type for a case that behaves like local. Spot refute: REJECT (`degraded-verdict` is an existing kind in run-state.md:35/:90; this adds a string, not a type).
- [FYI] §1 Statuses; walk-through step 6 — vision `dissolved@rN` mapped to `resolved@rK`, `regressed@rN` dropped. Spot refute: REJECT (vision line 49 lists `resolved@rN` too; regression is covered by `returned` and delta counts). Overlaps the confirmed Nit on unrecorded vision departures.
- [FYI] §1 'Recommended: a pure bash/awk script' — BSD/gawk portability untested. Spot refute: REJECT (follows the fork's existing bash/awk scripts and harness, which run on this macOS setup; no gawk-only feature required). External claim unverified.
- [Nit] §1 `--loop code|design` — required flag only labels the ledger header; `--out` already identifies the loop. Spot refute: CONFIRM Nit.
- [FYI] Key abstractions 'Variation' / 'Likely future changes' — extension points for a hypothetical third loop and trigger. Spot refute: REJECT (descriptive notes; the two-row table and semantic-name list are needed by the two real cases).

## Escalations (need human)
- none
