# Behavioral probes — BEFORE (skills/super-auto at main 444f86b2)

Method: fresh sonnet subagent per session, read-only, given the pre-change SKILL.md/run-state.md/resume.md and the six scenarios in ../evals/probe.md. Subagent micro-tests, not drill evals.

| Session | S1 unqualified | S2 interactive | S3 skip code roast | S4 design-review stop | S5 resume autonomous=f | S6 skip design roast | Merge w/o human |
|---|---|---|---|---|---|---|---|
| 1 | asks batched question; f f f f; stops (top split) | asks remaining; f f f f | asks; f f t f | asks; t f f f; stops after phase 2 | no ask; keeps f f f f | asks; f t f f | no (I5) |
| 2 | asks batched question; f f f f; stops (top split) | asks remaining; f f f f | asks; f f t f | asks; t f f f; stops after phase 2 | no ask; keeps f f f f | asks; f t f f | no (I5) |
| 3 | asks batched question; f f f f; stops (top split) | asks remaining; f f f f | asks; f f t f | asks; t f f f; stops after phase 2 | no ask; keeps f f f f | asks; f t f f | no (I5) |

Session 3 noted ambiguity: whether a stated flag suppresses the question for the others (read literally: no).
All three sessions flagged that plain phrases ("interactive", "stop so I can review") have no explicit flag mapping in the before text.
