# Seam admission eval

A bounded behavioral check of super-design §Decomposition's seam admission rule (classes P, V,
N with an obligation), which replaced the Key abstractions step. Each run is one fresh agent
told to apply §Decomposition in no-beads mode to a spec and the `stash` fixture
(`../key-abstractions-eval/fixture/`), writing a task table. The rubric was written before the
first run; its addenda were written between rounds, before the next round ran.

Model: Claude Opus 5.5 for the decomposers (Claude Code subagents), Sonnet for the blind grader.
One harness, one model, two reps per case: evidence of direction, not a measurement.

## Cases

| Case | Spec | Seam the rubric expected |
|---|---|---|
| B one-flag | `../key-abstractions-eval/cases/b-one-flag/brainstorm-input.md` | none |
| A third backend | `../key-abstractions-eval/cases/a-third-integration/brainstorm-input.md` | class N (five call sites branch on backend) |
| V clock | `cases/v-clock-spec.md` | class V (R2 needs deterministic age tests) |
| P manifest | `cases/p-manifest-spec.md` | class P (two independently built commands share a new format) |
| S shared default | `cases/s-shared-default-spec.md` | none (shared files and an undecided shared default) |
| U unowned seam | `cases/u-unowned-seam-case.md` (paper, no repository) | none: a coverage `UNOWNED-SEAM` between serial tasks is fixed by ownership |

## Results

| Round | Skill text | Case | Runs | Result |
|---|---|---|---|---|
| 1 | first draft | B | b1, b2 | 2/2 pass: one leaf, no seam, no new abstraction |
| 1 | first draft | A | a1, a2 | 0/2 by rubric: both name class N, then decline because adding one inline branch per call site meets and checks the requirement |
| 1 | — | control | planted no-seam A table | grader FAILs it on A1, as required; grading trusted |
| 2 | example "branch once inline" removed from the direct check | A | a3, a4 | 0/2 by rubric, same reasoning, now from the obligation alone |
| 2 | same | V | v1, v2 | 0/2 by rubric: both give the formatter a `now` argument inside the one leaf, which meets R2 without a contract bead |
| 3 | same | P | p1, p2 | 2/2 pass: one `Seam contract:` row, `class: P`, full obligation, both command tasks blocked on it with `boundary contract:`, contract test; both reject an N-style reader interface (p2 implements the format functions in the contract bead instead of stubbing them, and says why) |

| 4 | every seam route applies the full admission test | S | s1, s2 | 2/2 pass: shared default given to one owner task, shared files left to the merge gate (2 parallel leaves), no seam |
| 4 | same | U | u1, u2 | 2/2 pass: admission fails (serial, not V, not N), ownership fixed with `owns:`/`consumes:` and the layout decided in the spec, no contract or integration bead |

Round 1 was graded blind (`runs/round1-blind-grades.md`, with the file mapping); rounds 2 and 3
were graded by the author against the same rubric.

## Reading

- The rule does not over-build: no unrequested abstraction in any of 10 runs, and the one-flag
  change gets none.
- It admits a seam where parallel tasks exchange a new format (P), and declines one for shared
  files, an undecided shared value, or a coverage `UNOWNED-SEAM` between serial tasks.
- It does not admit N for a single new implementation added to existing kind-branching code, nor
  a V contract bead when the controllable input fits inside one task. Under the approved
  obligation (requirement, worked failure, direct check) the decomposers judged the direct check
  sufficient. That is the under-structuring risk the research report names for Design A on its
  motivating case; this eval does not settle whether it is the wanted outcome.
