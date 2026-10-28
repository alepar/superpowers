# Behavioral probes — BEFORE vs AFTER

Method: fresh sonnet subagent per session, read-only, answering from the skill text only (SKILL.md, run-state.md, resume.md) for each scenario in probe.md: Q1 asks before phase 1? Q2 the `flags:` line (planOneShot skipPlanRoast skipCodeRoast autonomous). Q3 stops before the phase-7 hand-back? Q4 merges into base without the human? These are subagent micro-tests of how the text is read, not drill evals of live runs (the drill harness is not checked out in this repo).

- BEFORE = skills/super-auto at main 444f86b2. Five sessions: three on the first six-scenario set (before-summary.md; its S6 was "skip the design roast", now S10) and two on the ten-scenario set below.
- AFTER = skills/super-auto at branch b4c1fb9e (the merged leaf). Three sessions on the ten-scenario set.

| Scenario | Expected after | BEFORE (5 sessions) | AFTER (3 sessions) |
|---|---|---|---|
| S1 unqualified | no ask · f f f t · no stop · no merge | 5/5 ask a batched flag question; f f f f; stop at top split | 3/3 as expected |
| S2 "interactive please" | no ask · f f f f · interactive stops | 5/5 still ask about the other flags | 3/3 as expected |
| S3 "skip the code roast" | no ask · f f t t · no stop | 5/5 ask; f f t f; interactive stops | 3/3 as expected |
| S4 "one-shot design, then stop so I can review" | no ask · t f f f · design-ready stop | 5/5 ask; t f f f; design-ready stop | 3/3 as expected |
| S5 resume, run.md autonomous=f | no ask · keeps f f f f | 5/5 as expected | 3/3 as expected |
| S6 "autonomous" | no ask · f f f t · no stop | 2/2 ask about the other flags; f f f t | 3/3 as expected |
| S7 "autonomous, stop for design review" | no ask · autonomous=t · contradiction named in status note · no stop | 2/2 ask (text silent on the conflict) | 3/3 autonomous=t, no ask, no stop; all three note the recorded planOneShot value is unspecified (t or f; no behavioral effect, autonomous forces Mode B) |
| S8 "one-shot" | no ask · t f f f · design-ready stop | 2/2 ask; t f f f | 3/3 as expected |
| S9 "ask me only about the database schema" | reserved-topic ask only · f f f t · no mid-run stop | 2/2 ask the flag batch; autonomous unresolved | 3/3 as expected |
| S10 "skip the design roast" | no ask · f t f t · no stop | 5/5 ask; f t f f; interactive stops | 3/3 as expected |
| Q4 merge without the human | no, every scenario | no, every session (I5) | no, every session (I5) |

Result: before, every fresh invocation asked a launch question and an unqualified one ran interactive. After, every fresh invocation resolves its flags without asking (except the reserved-topic ask in S9), an unqualified one runs autonomous with both roasts on, every opt-out takes effect, the resume keeps its recorded flags, and no session reads the change as merge authority.

Residual ambiguity (3/3 after sessions): S7's recorded planOneShot value. Harmless, carried to the report.
