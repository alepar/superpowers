# Key abstractions eval

A small before/after check of super-design's Key abstractions step: does the designer
(`skills/super-design/key-abstractions-prompt.md`, with `skills/super-design/design-distillate.md`)
name the missing abstraction when a CLI adds a third integration, answer "no new
abstractions" for a one-flag change, and extend, not redefine, a handed-in abstraction? The
orchestrator runs it by hand in super-auto's phase 6: a leaf implementer cannot dispatch model
runs.

## Layout

- `fixture/`: the synthetic CLI `stash` (Python standard library; run `python3 -m stash --help`
  from inside `fixture/`). Two backends, `dir` and `zip`; five functions branch on the backend
  name.
- `cases/a-third-integration/brainstorm-input.md`: (a) add a `tar` backend, with the planted
  fixed decision D1.
- `cases/b-one-flag/brainstorm-input.md`: (b) add `--limit` to `stash list`.
- `cases/c-nested/spec.md` and `cases/c-nested/root-key-abstractions.md`: (c) a nested spec
  and the root section it is handed.
- `rubric.md`: the checks, written before any run.

## Isolation

Each run gets its own scratch directory, outside the repository:

- `<run>/repo/`: a copy of `fixture/` alone (`cp -R fixture/. <run>/repo/`), then
  `git init && git add -A && git commit -m fixture` inside it. This is the run's
  `[REPO_ROOT]`. Never copy `rubric.md`, `README.md`, `cases/` or any run document into it.
- `<run>/inputs/`: a copy of `design-distillate.md` (the designer's `[DISTILLATE_PATH — read it]`),
  so the designer is not pointed into the skills tree next to this eval.

## Arms and reps

- **Before:** in each rep, a fresh one-shot (Mode B) brainstorm spec for the case: what
  decomposition reads today. Cases (a) and (b).
- **After:** the designer run on that same rep's spec. Cases (a) and (b), and (c) after-only,
  on `cases/c-nested/spec.md`.
- **3 reps** per arm and case: (a) 3 + 3, (b) 3 + 3, (c) 3 = **15 runs**.

### Before-arm prompt (one fresh subagent per rep)

> Use the superpowers:brainstorming skill in one-shot mode (Mode B) on the idea below. No human
> is available: decide everything yourself and do not ask questions. Work directly in
> `<run>/repo` (declared preference: no new worktree). Write the design spec to
> `<run>/repo/docs/spec.md` and commit it there. Do not offer super-roast or the visual
> companion. Idea:
>
> <the full text of the case's brainstorm-input.md>

**The planted decision must survive.** For (a), read the spec: if it drops D1 or contradicts
it, re-run that brainstorm rep (fresh scratch directory), so both arms share a spec that
carries D1. Record each re-run.

### After-arm prompt (one fresh subagent per rep, model opus)

Dispatch the template in `skills/super-design/key-abstractions-prompt.md` as written, with:

- `[SPEC_FILE_PATH — read it]`: `<run>/repo/docs/spec.md` (that rep's before-arm spec; for
  (c), copy `cases/c-nested/spec.md` there first);
- `[DISTILLATE_PATH — read it]`: `<run>/inputs/design-distillate.md`;
- `[REPO_ROOT]`: `<run>/repo`;
- `[KEY_ABSTRACTIONS_SO_FAR]`: (a) and (b), `none — this is the root spec`; (c), the text of
  `cases/c-nested/root-key-abstractions.md`, headed
  `Ancestor (the frame this spec builds within): root spec`.

## Grading

By hand, against `rubric.md`: each rep's graded text (before: the spec; after: the returned
section), check by check, pass or fail with a one-line reason. **Pass rule:** a case passes
when at least 2 of its 3 after-arm reps pass every check that applies.

Record each run's **token cost**: the total tokens the dispatch reported (the subagent's usage
line), plus the brainstorm re-runs.

**On a failed case:** file one fix bead against the template or the distillate, apply the fix
inline, and re-run that case's 3 after-arm reps once, all before phase 6's sweep, so that the
sweep and any post-loop audit cover the changed skill text. Then report what still fails.

## Results

Write them to
`docs/superpowers/runs/2026-10-10-key-abstractions-design-step/key-abstractions-eval.md`:
one table row per run (case · arm · rep · each check pass/fail with its reason · rep pass ·
tokens), each case's verdict under the pass rule, the before/after comparison, the total token
cost, and any brainstorm re-runs or fix-and-re-run. The orchestrator then summarizes them in
`skills/super-design/MAINTENANCE.md` and the TODO item.

## Not exercised

The eval grades only what the designer writes. These skill-text rules run only in real
super-design runs:

- the mode flows (Mode A showing the section, unattended applying it);
- re-entry;
- digest placement in the root epic and in no-beads plans;
- the owner-bead and promotion-review rules.
