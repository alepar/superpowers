# super-design maintenance notes

History and evidence behind super-design's design choices. Maintenance-only; not read at run time.

## Key abstractions step

Added 2026-10-11 (super-auto run `2026-10-10-key-abstractions-design-step`, design: `docs/superpowers/runs/2026-10-10-key-abstractions-design-step/2026-10-10-key-abstractions-design-step-design.md`). It revisits option D-a in `TODO-OOP-RECOMMENDATIONS.md`, which rejected a separate super-auto phase after the design roast; this step runs inside super-design, before decomposition, so the design roast reviews it.

**Motivation.** A CLI tool added a second and then a third agent-harness integration; its callers branched on harness-name strings in about 15 places, and even after a later run designed an adapter trait and registry, such branches grew to 18 across 11 files. Nothing said where per-harness behavior belonged.

**Decisions made with the human partner:** responsibility comments on types, not tests or lints; question-driven prompting with a Gang-of-Four-based distillate; the step runs at every level, top-down; the spec's explicit decisions take priority; an epic-wide digest in every brief; no new review pass or gate.

**Eval (2026-10-11).** `tests/super-design/key-abstractions-eval/`, 15 runs, results in the run directory's `key-abstractions-eval.md`:

- All three cases pass the 2-of-3 rule: (a) third integration 2/3, (b) one-flag change 3/3, (c) nested extension 3/3.
- The one-shot brainstorm baseline already named the backend abstraction and registry on (a) in 3 of 3 reps, so this fixture does not show the step catching an abstraction a brainstorm missed. It does show the step keeping designs at the responsibility level (no signatures in 8 of 9 after reps, 0 of 6 before), stating the fixed-decision exception with a citation, answering "no new abstractions" explicitly, and extending rather than redefining a handed-in frame.
- One (a) rep over-abstracted (each concrete backend got a digest line) and used a parameter list.
- Cost: 772k tokens for the eval; about 49k tokens per designer run on this fixture.

**Open follow-ups:** a replay eval on a real project (the motivating case), which would test whether the step finds abstractions a brainstorm misses; the code roasts' punch-listed Nits (in `docs/superpowers/runs/2026-10-10-key-abstractions-design-step/2026-10-11-key-abstractions-design-step-roast-pr-2-punch-list.txt`); and rubric C1, which an extend-only one-liner cannot fully exercise.
