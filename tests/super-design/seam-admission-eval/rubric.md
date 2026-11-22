# Seam admission eval — rubric (written before any run)

Graded text: each run's `decomposition.md` (a no-beads task table produced by applying
super-design §Decomposition to the case spec and the `stash` fixture).

## Case B — one-flag change (`--limit` on `stash list`)

- B1. No `Seam contract:` task.
- B2. No task whose deliverable is a new interface, base class, protocol, registry, factory,
  strategy, module or abstraction layer. (Adding a parameter or a helper inside an existing
  function is fine.)

Pass: B1 and B2.

## Case A — third backend (`tar`), with fixed decision D1 (labels stay in `report.label`)

- A1. At least one `Seam contract:` task for the backend boundary (where per-backend behavior
  is chosen), carrying `class: N` (or P, with a stated parallel pair).
- A2. Its description carries an obligation with all three parts: a requirement it protects, a
  worked failure without it, and the direct check tried first (for class N: names both
  implementations or lists existing call sites that branch on the backend kind).
- A3. The obligation does not rest only on "more backends are planned" (a likely future change).
- A4. Consumer tasks depend on the seam task (`blocked-by <id>: consumes boundary contract` or an
  equivalent dependency column entry).
- A5. D1 respected: no task moves the per-backend label text out of `report.label`.

Pass: A1–A5.

## Control (false negative of the grader)

A planted Case A decomposition that adds `tar` as another `elif` in each branching function and
files no seam must FAIL A1. If the grader passes it, the grading is not trusted.

## Addendum (written after round 1, before round 2 runs)

Round 1: both Case A runs declined the N seam, citing the obligation's example "branch once
inline" as a sufficient direct check. That example was removed from the skill text. Round 2
re-runs Case A twice on the revised text and adds Case V.

## Case V — snapshot age with a deterministic-test requirement (R2)

- V1. A `Seam contract:` task (class V) that makes the current time controllable for the age
  computation (an injectable clock / `now` parameter or equivalent).
- V2. Obligation: names R2 (or R1+R2), a worked failure (tests depend on the real clock), and the
  direct check tried first with why it falls short.
- V3. The tasks that use it depend on it.
- V4. No other new abstraction beyond what V1 needs.

Pass: V1–V4.

## Addendum 2 (written after round 2, before round 3 runs)

Round 2: Case A 0/2 and Case V 0/2. V runs made time controllable through a `now` argument
inside one leaf, which meets R2 without a contract bead. Round 3 adds Case P.

## Case P — two independently built commands exchanging a new manifest format

- P1. If `manifest` and `verify` are separate tasks with no edge between them, a
  `Seam contract:` task for the manifest format with `class: P`. (If they are one task, or
  `verify` depends on `manifest`, P1 is N/A and the run is recorded as "no parallel boundary".)
- P2. Obligation names R2 or R3, a worked failure (incompatible formats), the direct check.
- P3. Both command tasks depend on the contract.
- P4. The contract has signatures/stubs and one contract test (e.g. round-trip of R3 paths).

Pass: P1–P4, or recorded N/A.
