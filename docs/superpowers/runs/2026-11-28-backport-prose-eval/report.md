# Prose eval of the superpowers-wf prompt backports (super-plan-4wr)

Arm A is the prose skills at 5fd17f4d. Arm B is the prose skills at 551fbe27; the range between them
also includes 31cccbd5, the text-formats roast lane, which reaches only S4 and appears only as a lane
name. Each sample is one fresh `codex exec` on gpt-6.1-terra, given a dispatch that each arm's own
`dispatch-text` or `assemble-args` generated from the r1-terra-confirm incident inputs (see
`method.md` for the inputs and deviations). Scoring was blind (`scores/blind-scores.json`,
`scores/scorer-notes.md`), against `rubric.md`, with the local `arm-map.json` joined afterwards
(`scores/unblinded.txt`). There were n=5 per arm per dispatch. The counts below are descriptive only:
five samples show no statistical significance, reliability or generalization.

## Result

| dispatch | arm A (5fd17f4d) | arm B (551fbe27) |
|---|---|---|
| S2 triage: kxp.12 blocker, a test that contradicts the fix brief | 0 PASS, 5 FAIL-BLOCKED (ESCALATE) | 5 PASS (RESOLVE) |
| S3 merge: kxp.14 rebase conflict in `dumb_test.go` | 0 PASS, 4 FAIL-BLOCKED (rebase aborted, blocker filed), 1 FAIL-FALSE-CONVERGENCE | 5 PASS |
| S4 roast reporter, round 3: the kxp.12 fix never landed | 0 PASS, 5 FAIL-FALSE-CONVERGENCE (`[converged]`, "4 resolved") | 5 PASS ("4 unjudged (open) (1 Blocking)", no `[converged]`) |
| S1 implementer: kxp.7 missing seam | not measured | not measured |
| S2 implementer: kxp.12 fix | not measured | not measured |

Arm A reproduced each original terra failure: triage escalated (terra had 6 of 6 ESCALATE), the merge
blocked on the rebase conflict, and the third roast converged on a finding whose fix had not landed. So
the baseline shows a targeted failure, and in these three dispatches arm B avoided it every time.

On the measured dispatches, the evidence supports the bead's claim: fewer parked or escalated
outcomes (S2 triage, S3) and less false convergence (S4). Arm B produced no new false convergence.
Its S3 resolutions kept both sides' intent, and the scorer confirmed this from each workspace diff.

## Limits of the B passes

- **S2 triage.** All five RESOLVE clarifications cite the design correctly ("compatible monochrome mode
  when available, otherwise reports a clear initialization error"). None permits changing the
  contradicting test: each says to implement the error path and report the `go test ./...` failure
  that follows. The next implementer attempt could therefore block again on the bead's passing-suite
  requirement. Whether triage converts into a landed task is not measured.
- **S3.** The plan sent to the coordinator said a PASS also runs the conflicted tests. The frozen rubric
  relaxed that to "recorded but not required", because `merged false` with `seamOverlap` hands the merge
  to a seam review. Only 2 of 5 B samples (s33, s48) ran `TestDumbTerminalPlayback`; both passed. Under
  the plan's stricter reading, B scores 2 of 5 and A still 0 of 5. Arm B's merge text says to run the
  conflicted tests, so 3 of 5 B samples not following it is a small instruction-following gap.
- **S4.** The B passes still print the verdict word "clean" while a Blocking finding is unjudged (open).
  The rubric does not score this; it may be a separate wording problem. Only the reporter was replayed.
  B's other route, a regression scout returning `held:false`, was not exercised, so the S4 B result is a
  lower bound. No S4 sample in either arm read `dumb.go`; the result rests on how the prompt treats
  prior findings with no checked evidence. That is what changed between the arms.

## Not measured: the implementer-side guidance

All five implementer samples that ran, two in arm B and three in arm A, returned `SETUP_FAILED` at
setup. None reached the seam or contradicting-test decision:

| sample | arm | dispatch | finding |
|---|---|---|---|
| s02 | A | S2 impl | "The Go test runner resolves to $HOME/sdk/go1.26.0/bin/go, outside the task worktree." |
| s03 | A | S1 | same cause |
| s08 | B | S1 | same cause |
| s11 | B | S2 impl | same cause |
| s14 | A | S2 impl | same cause |

The cause is the TOOLCHAIN PROVENANCE clause in `dispatch-text`'s implement setup, which is the same in
both arms: the test runner must resolve inside the task worktree, or the agent returns `SETUP_FAILED`.
For a system-installed compiled toolchain (Go in `$HOME/sdk`) this holds on every task, so prose super-code
on such a project parks every implementer. This is filed as super-plan-ax0. By the coordinator's
decision, the remaining S1 and S2-impl samples were not run. The implementer guidance in 551fbe27 (a
needed seam is in scope and listed; a contradicting test may change, with its reason) is untested by this eval.

## Cost

There were 35 samples in all: 30 scored, 5 SETUP_FAILED, and 4 interrupted and rerun (the interrupted
attempts' usage is lost). They used 7.11M input+output tokens: 6.18M cached input, 0.87M uncached input
and 63k output. Wall time per sample was about 40-70 s, four running in parallel. The samples ran
under two Codex sign-ins (`method.md` item 9).

## Confounds

These apply to both arms: the user's global Codex AGENTS.md (method item 8); hand-written plan sections
and rewritten fix beads (method items 1-2); and the end-of-run tracker copy (item 5). The S3
`end-state.txt` probe reports "(rebase in progress)" after a rebase completes, because of a stale
`REBASE_HEAD`. The scorer checked the worktrees directly. Nothing in the dispatches names the arm. The
blinding is not perfect: a sample that printed a prompt template shows that arm's wording.

## Follow-ups

- super-plan-ax0: toolchain provenance blocks compiled-language implementers (already filed).
- Once ax0 is fixed, S1 and S2-impl can rerun from the local pack (`<EVAL_WS>/super-plan-4wr/launch.sh`, the same schedule ids).
- S4: whether a verdict of "clean" should be withheld while a Blocking finding is unjudged.
- S3: merge samples skip the conflicted tests that the prompt asks for (3 of 5 in B).
