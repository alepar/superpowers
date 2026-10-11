# Key abstractions eval: rubric

Written before any run. Grade each rep by hand: read the graded text (before arm: the
brainstorm's spec; after arm: the designer's returned section) and mark every check that
applies to its case pass or fail, with a one-line reason. A rep passes when all of its
applicable checks pass. A case passes when at least 2 of its 3 after-arm reps pass (the
before arm is the baseline and has no pass bar).

| ID | Case | Arm | Check (pass when …) |
|---|---|---|---|
| A1 | a | both | It names the missing abstraction: one interface, protocol or class hierarchy that owns per-backend behavior, with one implementation per backend (`dir`, `zip`, `tar`), so commands stop branching on the backend name. |
| A2 | a | both | It names what varies: the backend kind, with new backends expected to keep coming. |
| A3 | a | both | It names the single place a backend is chosen by name (a registry, factory or lookup table), and says no other code chooses one. |
| A4 | a | both | It does not contradict D1: `report.label` keeps its per-backend branch and the labels stay in `report`. A note that D1 is a deliberate exception, citing it, is good but not required; moving labels into the backends fails. |
| B1 | b | both | It answers that no new abstraction is needed (after arm: the one-liner `No new abstractions; extends <types>.`, naming what it extends). |
| B2 | b | both | It invents nothing: no new type, interface, registry, formatter or layer, and no redesign of the backends the `--limit` change does not need. |
| C1 | c | after | It extends the handed-in `Backend` (for example, deleting a snapshot becomes a Backend responsibility) and reuses `BackendRegistry`. It does not redefine either: no second per-backend type or hierarchy, no rename, and no change to their Owns or Must-not that contradicts the frame. |
| S1 | a, b, c | both | It gives no method signatures: names of operations are fine; parameter lists, types and return types are not. |
| X1 | a, b, c | after | Its shape matches the template's output contract: a `## Key abstractions` heading; for (a) and (c), a `Digest:` block with exactly one line per abstraction it adds (none for one it only extends); for (b), the one-liner and no `Digest:` block. |
