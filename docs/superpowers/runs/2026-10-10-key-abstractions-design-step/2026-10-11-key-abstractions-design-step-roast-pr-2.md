super-roast verdict: Nit (2 confirmed) [converged]
mode: pr        iteration: 2 of 3
profile (assumed): Single-operator personal fork (alepar/superpowers) of a zero-dependency Claude Code / Codex plugin. The artifact under review is skill markdown (procedures an LLM executes), prompt templates, and a hand-graded eval fixture; there is no network surface, no external users, no real money or user data. Rollback is a normal plugin version update. Low blast radius: the Should-fix / Nit boundary sits at whether a literal reading of the text produces wrong tracker state or a wrong step order in an ordinary run, not at resilience or cost.
inputs: super-auto/key-abstractions-design-step@4da9552 vs main@0ea4761
delta vs prior: 2 new confirmed (0 Blocking) · 0 carried (0 Blocking) · 5 resolved · 0 regressed (0 Blocking) · 5 punch-listed (open)
coverage: scouts 12/12 (correctness, security, premortem, simplicity-design, hot-path-perf, concurrency-async, regression, deploy-safety, api-contract, observability, testing, hygiene-docs) · raw 6 → deduped 4 → panel 4 · spot 0 · promoted 0 · judge completion 100% · remainder-capped: 0
independence: same-family (Claude) — seat-differentiated panel · rung: Workflow
seat-agreement: panels 4 · rr 0.75 · rg 0.50 · fg 0.25 · unanimous 0.25 · ground-loo 0.33 (n=3) · reproduce 2/2/0 · refute 1/3/0 · ground 4/0/0
lane-yield (found/confirmed/unique/refuted): correctness 1/0/0/1 · security 0/0/0/0 · premortem 0/0/0/0 · simplicity-design 0/0/0/0 · hot-path-perf 0/0/0/0 · concurrency-async 0/0/0/0 · regression 2/0/0/2 · deploy-safety 0/0/0/0 · api-contract 1/0/0/1 · observability 0/0/0/0 · testing 1/1/1/0 · hygiene-docs 1/1/1/0

prior tracking (iteration 1 confirmed findings):
- resolved: [Should-fix] SKILL.md:106 re-entry row / §Root Brainstorm hand-off skipping §Key Abstractions — not re-surfaced by any scout.
- resolved: [Should-fix] SKILL.md:196-202 duplicate owner bead from sync + §Decomposition — not re-surfaced.
- resolved: [Should-fix] SKILL.md:308 sync-created owner bead not wired into the sweep — fix commit ad93122 landed; the regression-lane finding on its `--parent` wording was rejected (see Rejected).
- resolved: [Should-fix] rubric.md:19 X1 demanding a `Digest:` block for extend-only (c) — fix commit 445f766 amended X1; a new follow-on Nit on C1 is confirmed below.
- resolved: [Nit] SKILL.md:283-286 missing sync pointer in §Adversarial Review Loop — not re-surfaced.
- punch-listed (open): [Nit] SKILL.md:74; SKILL.md:176 ("as returned" vs §Precedence).
- punch-listed (open): [Nit] SKILL.md:293-296; SKILL.md:293; key-abstractions-prompt.md:119 (digest line contract).
- punch-listed (open): [Nit] promotion-reviewer-prompt.md:63 (`owns:` lines missing from reviewer input).
- punch-listed (open): [Nit] SKILL.md:306 (owner-bead entry has no splice markers).
- punch-listed (open): [Nit] SKILL.md:452 (no-beads design-pending marker).

## Confirmed findings            ← consumed by super-design, one task per finding
- [Nit] skills/super-design/SKILL.md:424 — When the root epic is handed in rather than created, no instruction says when the first Key abstractions sync runs. Apply defers the root's first sync to epic creation, and the new §Decomposition sentence ties it to creation only, so a flat tree with a handed-in root, no promotions and no roast fix touching a section may never get its digest written to the epic. (new) [lanes: hygiene-docs]
  verdict: confirmed (reproduce ✓ / refute: REJECT, outvoted / ground ✓)
  evidence: SKILL.md:169-171 (Apply) "at the root the epic does not exist yet, so the first sync runs when §Decomposition creates it." SKILL.md:424 (fix commit fbb1893) "The root invocation creates the epic first ... then runs the first Key abstractions sync on it ... before it creates any child." §The run's root epic (:124-127) adopts a handed-in bead and never creates it. §Re-entry row for §Decomposition, root (:108) says only "adopt it". The sync body (:303-305) covers the adopted epic but only says what the sync does once it runs. run.md:52 already lists "recommended: handed-in root first-sync clause" as open. Refute seat: SKILL.md:285 "Run the sync whenever any section is applied or changed" is the general trigger, and Apply's "Then run the sync" is unconditional, so a reasonable agent runs it at adoption; both confirming seats accept this as the reason the gap is Nit-sized.
  fix-shape hint: One clause at :424 (and/or :170): "creates the epic, or adopts a handed-in one, then runs the first sync on it".

- [Nit] tests/super-design/key-abstractions-eval/rubric.md:17 — After fix 445f766 the correct extend-only answer for case (c) is a bare one-liner, so C1's substantive check (deletion becomes a Backend responsibility; Owns/Must-not not contradicted) can no longer be observed in the graded text, and (c) passes any `No new abstractions; extends Backend.` answer. (new) [lanes: testing]
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: key-abstractions-prompt.md:117-123 (fix pass) "Extended entries appear only beside at least one new abstraction" and "An answer that adds no abstraction, including one that only extends existing ones, takes the one-liner form ... with no entries and no `Digest:` block". rubric.md:19 X1 now names "an extend-only (c)" as taking the one-liner. rubric.md:17 C1 is unchanged: "extends the handed-in `Backend` (for example, deleting a snapshot becomes a Backend responsibility) ... no change to their Owns or Must-not that contradicts the frame". A one-liner carries no responsibility, Owns or Must-not text, so the second half passes vacuously and the first half reduces to the name appearing. cases/c-nested/spec.md says "Deleting a snapshot differs per backend". (c) runs after-only (README "Arms and reps"), so no other check covers design.md:171 "(c) extends the given abstraction without redefining it". All three seats agree the cost is a weakened hand-run eval check, not a shipped-behavior defect.
  fix-shape hint: Either let C1 accept the one-liner naming Backend and BackendRegistry and drop its unobservable half, or let an extend-only answer carry a short `extended:` entry (no `Digest:` block) so C1 has text to grade.

## Not verified (beyond panel cap)   ← severe candidates the panel cap left unverified — listed, never dropped
- none

## Not verified (dedupe failed or judge lost)   ← findings a pipeline failure left unjudged — listed, never dropped
- none

## Beyond remainder cap (count only)   ← low-severity candidates the dedupe remainder cap dropped; the count survives, the claims do not
- none

## Rejected (with reason)        ← so re-roasts don't re-litigate
- [FYI] skills/super-design/key-abstractions-prompt.md:118; key-abstractions-prompt.md:117-123 — Fix commit 445f766 makes an extend-only `## Key abstractions` answer a bare one-liner with no `extended:` entries, so the responsibilities a nested design adds to an existing abstraction are recorded nowhere, while SKILL.md:164 still says "one entry per new or extended abstraction". [lanes: correctness, regression, api-contract]
  reason: panel 2 REJECT / 1 CONFIRM(Nit). design.md:73 ("Proportional") and SKILL.md:164-166 both say "A change that needs nothing new gets one line: `No new abstractions; extends <types>.`", so the one-liner for extend-only answers is the spec's own stated form and 445f766 closed an ambiguity in its favour rather than adding a rule. design.md:56/:141 give extension bookkeeping to the bead that changes the responsibilities, and the root digest line still reaches every brief. The confirming seat concedes the same points and rates the remainder a wording mismatch at SKILL.md:164 plus the C1 weakening, which is carried as its own confirmed Nit above. The SKILL.md:164 phrasing can be tightened as doc polish when that Nit is fixed.

- [FYI] skills/super-design/SKILL.md:313-316 — The sync-created owner bead uses `--parent <that level's epic>` while the step-1 fix-task rule it says it copies (SKILL.md:~695) and super-auto I3 (super-auto/SKILL.md:23) use `--parent <root-epic-id>`; a phase-5 sync could create an open bead under a nested epic phase 4 already closed. [lanes: regression] [fix-regression]
  reason: panel 2 REJECT / 1 CONFIRM(Should-fix). The wording mismatch is real and all three seats agree on it. The majority shows it does not reach a stated requirement: I3's rationale is a bead "outside the epic's tree", but a bead under a nested epic is a transitive descendant of the root and carries `-l sp:<root-epic-id>`, which is how tree membership is defined (SKILL.md:481; coordinator-workflow.md:~494 follows parent links to the root). The per-level `--parent <id>` shape matches §Decomposition's own rule. The only path to harm (bd closing the root while a child of a closed nested epic is open) is one the finding itself leaves unverified, and root-parented phase-5 beads sit under an already-closed root in the same way (SKILL.md:692). The dissenting seat's evidence is the same text the majority addresses, so the default stands. A one-token alignment of the cited triple to `--parent <root-epic-id>`, or dropping the "made like a step-1 fix task" comparison, would remove the inconsistency if the author wants the text self-consistent.

## Unverified nits (spot-checked)
- none

## Escalations (need human)      ← UNVERIFIED externals, incomplete panels, unsettled panels, material dissent
- none
