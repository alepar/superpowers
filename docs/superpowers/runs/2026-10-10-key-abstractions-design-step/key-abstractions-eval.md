# Key abstractions eval: results

Run 2026-10-11 by the super-auto orchestrator (phase 6), per `tests/super-design/key-abstractions-eval/README.md`, against the designer template and distillate at branch `super-auto/key-abstractions-design-step@f998715`. Each run used its own scratch copy of the fixture, without the rubric, cases or run docs. Graded by hand against `rubric.md`.

**Verdict: all three cases pass** under the pass rule (at least 2 of 3 after-arm reps pass every applicable check). No fix bead or re-run was needed. No brainstorm rep dropped the planted decision D1, so no brainstorm was re-run.

## Runs

| Case | Arm | Rep | Checks | Rep | Tokens |
|---|---|---|---|---|---|
| a | before | 1 | A1 ✓ backends package + registry dict · A2 ✓ "remote backends planned next" · A3 ✓ registry maps name → module, `SUPPORTED` derived · A4 ✓ D1 kept · S1 ✗ gives `save(source: str, dest: str, stamp: str) -> str` | fail | 58,833 |
| a | before | 2 | A1 ✓ `Backend` base class + subclasses · A2 ✓ · A3 ✓ single `BACKENDS` dict · A4 ✓ · S1 ✗ `list(dest) -> list[str]` | fail | 55,576 |
| a | before | 3 | A1 ✓ backend interface · A2 ✓ · A3 ✓ registry · A4 ✓ · S1 ✗ `save(source, dest, stamp) -> str` | fail | 59,815 |
| a | after | 1 | A1 ✓ `Backend` Protocol, one module per backend · A2 ✓ · A3 ✓ `BACKENDS` "the one place a backend name is mapped" · A4 ✓ D1 cited as a deliberate exception · S1 ✓ operations named only · X1 ✓ entries + 2 digest lines for the 2 added abstractions | pass | 52,701 |
| a | after | 2 | A1 ✓ `Backend` base class · A2 ✓ · A3 ✓ `BACKENDS`, looked up only through `config.get` · A4 ✓ D1 cited · S1 ✓ · X1 ✓ 2 digest lines | pass | 52,401 |
| a | after | 3 | A1 ✓ · A2 ✓ · A3 ✓ `REGISTRY` · A4 ✓ D1 cited · S1 ✗ writes `get(name)` · X1 ✗ 5 added abstractions but 4 digest lines (`DirBackend, ZipBackend` merged); per-backend classes each given digest lines | fail | 52,834 |
| b | before | 1 | B1 ✗ never states that no abstraction is needed · B2 ✓ invents nothing · S1 ✗ `def list_snapshots(backend, dest, limit=None)` | fail | 52,160 |
| b | before | 2 | B1 ✓ refactoring the backends is "left out" · B2 ✓ · S1 ✗ `lst.add_argument("--limit", type=positive_int, …)` | fail | 53,322 |
| b | before | 3 | B1 ✓ "Scope boundary": backend branches untouched · B2 ✓ · S1 ✗ `add_argument` call | fail | 51,828 |
| b | after | 1 | B1 ✓ one-liner naming `commands.list_snapshots` and the `list` subparser · B2 ✓ · S1 ✓ · X1 ✓ | pass | 47,931 |
| b | after | 2 | B1 ✓ one-liner · B2 ✓ · S1 ✓ · X1 ✓ (plus a one-line scope note citing the spec, which the template allows) | pass | 48,243 |
| b | after | 3 | B1 ✓ one-liner · B2 ✓ · S1 ✓ · X1 ✓ (plus a cited scope note) | pass | 47,947 |
| c | after | 1 | C1 ✓ "extends Backend", no redefinition · S1 ✓ · X1 ✓ one-liner, no Digest | pass | 46,103 |
| c | after | 2 | C1 ✓ · S1 ✓ · X1 ✓ | pass | 46,404 |
| c | after | 3 | C1 ✓ names what Backend gains (deleting a snapshot) · S1 ✓ · X1 ✓ | pass | 46,325 |

Case verdicts: (a) 2/3 pass, (b) 3/3, (c) 3/3.

## Before vs after

- **The baseline was already good at the headline case.** Every one-shot brainstorm spec for (a) named a backend abstraction and a single registry, and respected D1. On this fixture the step did not supply a missing abstraction the brainstorm had overlooked. The fixture's goal ("more backends are planned") states the variation plainly; the motivating real case, where the abstraction was missed, likely had subtler signals. A replay on a real project remains the follow-up that would show whether the step catches what a brainstorm misses.
- **What the step added:** a design that stays at the level of responsibilities (no signatures in 8 of 9 after reps vs 0 of 6 before reps), owner and must-not lines, the D1 exception stated with a citation in every (a) rep, an explicit "no new abstractions" answer on the small change (3 of 3 vs 2 of 3), digest lines ready for the epic, and correct extension rather than redefinition of a handed-in frame in (c).
- **Over-abstraction risk seen once:** rep a3 promoted each concrete backend class to its own digest-lined abstraction. The template's restraint question did not stop it; the rubric's X1 caught the shape.

## Limits

- **C1 is partly unobservable.** An extend-only answer is a one-liner, so C1's "no change to Owns or Must-not" half passes vacuously (code-roast round 2, punch-listed Nit). Graded on the half that is observable: Backend named as extended, nothing redefined.
- **Small sample:** 3 reps per arm, one fixture, one model family, graded by the orchestrator that ran the run.

## Cost

15 runs, **772,423 tokens** in total (subagent totals as reported): before arm 331,534 (6 runs), after arm 440,889 (9 runs). Designer runs averaged about 49k tokens each, which is the step's per-spec cost on a fixture this size.
