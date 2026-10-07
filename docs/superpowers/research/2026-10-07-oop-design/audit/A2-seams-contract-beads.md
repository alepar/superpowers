# A2 — Seams, contract beads, integration fan-in, early unblock

Auditor A2, repository audit stream. Worktree `research/oop-design-scouts` @ base `eb0462b`
(6.4.2-alepar4.16). Read-only, except for these two output files. Two test scripts were run. Both
are side-effect free: they write only to `mktemp`/`os.tmpdir()` directories and clean them up.
`bash tests/super-design/test-scripts.sh` → "All super-design script tests passed".
`node tests/super-code/replay-harness.mjs` → `1501 passed, 0 failed`. I also ran `graph-shape`
once on the fixture (stdout only).

Hypothesis under audit (from the human partner): *large interfaces become separate contract
beads; the interface is drafted and reviewed up front so implementation and consumers can proceed
without waiting for the full implementation; then implementation and caller branches run, ending
in a final integration fan-in.*

## Scope and files read

| Path | Lines | Coverage |
|---|---|---|
| `docs/superpowers/specs/2026-08-25-integration-seams-design.md` | 127 | full |
| `docs/superpowers/plans/2026-08-25-integration-seams.md` | 307 | full |
| `docs/superpowers/specs/2026-08-26-leaf-sizing-design.md` | 94 | full |
| `docs/superpowers/plans/2026-08-26-leaf-sizing.md` | 237 | full |
| `skills/super-design/SKILL.md` | 811 | §Process/Re-entry/root epic 83–142, §Decomposition→§Splitting 143–335, §Coverage 379–526, §Parallelism/Hand-off/No-beads 629–690, Conventions/Red Flags/Integration 762–811, line 568; grep of the rest |
| `skills/super-design/coverage-reviewer-prompt.md` | 97 | full |
| `skills/super-design/graph-pass-prompt.md` | 70 | full |
| `skills/super-design/promotion-reviewer-prompt.md` | 81 | full |
| `skills/super-design/scripts/graph-shape` / `coverage-precheck` / `coverage-inputs` | 136 / 117 / 128 | headers + edge/decl logic (grep) |
| `skills/super-code/SKILL.md` | 308 | 12–95, 161–255; grep of the rest |
| `skills/super-code/coordinator-workflow.md` | 1999 | 17–206, 390–691, 877–935, 1077–1190, 1245–1341, 1739–1760; grep (dryRun counts) |
| `skills/super-code/coordinator.js` | 2086 | 328–333, 640–700, 870–1000, 1038–1150, 1286–1312, 1618, 1686, 1758, 1898–1945; grep |
| `skills/super-code/coordinator-subagents.md` | 221 | 1–16, 70–80, 148–160; grep |
| `skills/super-code/planner-prompt.md` / `implementer-prompt.md` / `task-reviewer-prompt.md` | 146 / 168 / 114 | full |
| `skills/super-code/triage-prompt.md` | 89 | 44–60, 85–89 |
| `skills/super-code/MAINTENANCE.md` | 1007 | 494–505, 736–750; grep |
| `skills/super-code/scripts/tree-deps`, `review-bead`, `tree-shape`, `already-merged` | 84 / 75 / 35 / 26 | full |
| `skills/super-code/scripts/ready-in-tree`, `epic-tree`, `close-in-tree-epics` | 74 / 68 / 54 | headers (semantics) |
| `tests/super-design/fixtures/graph.json`, `tree.json`, `cov-tree.json` | 281 / 28 / 8 | parsed / grep |
| `tests/super-design/test-scripts.sh` | 169 | 95–125; run |
| `tests/super-code/replay-harness.mjs` | 3059 | scenario index, 1789–1794, 2271–2301; run |
| `docs/superpowers/runs/2026-09-04-audit-plan-instrumentation/` settled-tree.md, run.md, report.md, coverage ledger, friction.md, audit-report.md | 109/42/64/66/13/112 | full except audit-report (28–60) |
| `docs/superpowers/runs/2026-10-01-prompting-guide-roast-fixes/` settled-tree-r3.md, run.md, report.md, coverage-ledger.md, coverage-findings-round-1/2, friction.md, upstream-feedback-draft.md | 121/58/67/34/14+13/5/107 | full except settled-tree-r3 (1–23, 105–121, plus grep), feedback draft (55–100, plus grep); r1/r2 trees via grep |
| Spot reads: `skills/super-auto/SKILL.md` 168–195, `skills/upstream-feedback/SKILL.md` 44–56, `skills/super-roast/scout-prompts-design.md` 148–195, `tests/super-auto/test-contract-lint.sh` 1–25 | — | partial |
| Commits: `a77db24`, `0d07b9a`, `d8f2736`, `944da17` (2026-08-25); `d4c5824` (2026-09-30); `205b77d`, `3d935e8`, `2bf1d53` (2026-10-01); `01983d6` (2026-10-03) | — | `git show -s` / ancestry checks |

**Skipped:** the super-roast PR scouts' design-quality lanes (another auditor's scope), the
roast-design/roast-pr report bodies of both runs, `step-back-prompt.md`, and the internals of
`coverage-inputs` beyond its declaration extraction. I did not run `bd`: even read-only bd commands
can touch the Dolt store.

## Mechanism map

**1. Design-time ownership.** Every child description names the boundaries it `owns:` and
`consumes:`, as literal tokens (`skills/super-design/SKILL.md:208-221`). A child that exchanges
nothing with a sibling omits the declaration (`:220-221`). A question-shaped edge is treated as a
seam: "Decide it in the spec, or extract it as a seam contract … and let both tasks run in parallel
against the decided boundary" (`:255-259`). One sibling owns each cross-sub-epic integration
(`:251-254`).

**2. Detection.** The coverage reviewers (two of them, opus, root pass, two rounds fixed) run check
3, `UNOWNED-SEAM`: "Two tasks exchange a named thing … and no task's `owns:` line names that
boundary" (`coverage-reviewer-prompt.md:62-66`). `scripts/coverage-inputs` extracts the
`owns:`/`consumes:`/`boundary contract:` lines into the task tree (`coverage-inputs:106`).
Disposition is automatic: verify, then apply (`SKILL.md:461-471`).

**3. Seam beads (the existing contract-bead machinery).** A verified `UNOWNED-SEAM` first adopts
any existing seam bead. Otherwise it creates two leaf tasks (`SKILL.md:495-502`):
- `Seam contract: <boundary>`. It delivers "**compilable boundary code**, not prose: the
  interface/types/signatures, the schema fields, and the wiring itself plumbed end-to-end as stubs
  or defaults". Its acceptance is "compiles, suite green, wiring present". Every participant gets a
  blocking edge onto it, with the `blocked-by <contract-id>: consumes boundary contract` line.
  Its files hint spans both sides of the seam (`:500`).
- `Seam integration: <boundary>`. It depends on the participants only and writes integration
  tests across the seam (`:501`).
- Each participant's description gets the pointer `boundary contract: <id>` (`:502`).

  Design rationale: the seam spec's Decisions 2–5 (`2026-08-25-integration-seams-design.md:29-38`).
  Its out-of-scope list rejects execution-time seam logic, prose-only contracts, and
  "contract-owned failing tests" (`:113-119`).

**4. Fan-in.** One root `Integration sweep:` leaf is created after the coverage loop. It depends on
every leaf and every `Seam integration:` bead, and it *implements* what it finds: it verifies the
main flows, adds the missing integration tests, and sweeps for unwired config/params/interfaces
(`SKILL.md:506-525`). Re-entry adopts the existing sweep and never creates a second (`:110`).
Design-time fix tasks are wired under it (`:568`). Post-hand-off fix beads are not (`:521-523`).
super-code's Finish adds a full-suite `sweep` and a report-only final review
(`coordinator-workflow.md:1089-1136`). The two "sweep"s are different things.

**5. Sizing.** Decomposition first splits the work, then connects it
(`SKILL.md:171-183`). The bottleneck rule says a gating bead "lands **only the unblocking
artifact** … Seam-contract beads are the exemplar: compilable stubs, inert-by-default"
(`:201-206`). The promotion review's `SPLIT` fires only when a task is both oversized and gates
two or more siblings, and it names "artifact / remainder" (`promotion-reviewer-prompt.md:44-54`,
`SKILL.md:304-313`). §Splitting a Bead re-points dependents to the fragment they consume
(`:315-332`).

**6. Edge bookkeeping.** Every `bd dep add` is paired with `blocked-by <id>: consumes <artifact>`
in the dependent (`SKILL.md:268-289`, Red Flag `:800-802`). Two fixed tokens exist:
`boundary contract` and `all leaves (integration sweep)` (`:283-289`). `graph-shape` exempts both
from the parallelism pass (`graph-shape:11-12,56`; fixture `exempt 7`,
`tests/super-design/test-scripts.sh:102-107`). The pass may not touch them (`SKILL.md:642,787-788`).
The precheck only checks that the `blocked-by <blocker>:` text is present
(`coverage-precheck:6-7`).

**7. Execution scheduling.** Each task gets its own worktree. Dispatch is not gated on file overlap.
A sliding window is capped at `min(concurrency, runtimeSlots-2)`, and `hotFileCap` (default 3)
limits in-flight tasks per declared file (`skills/super-code/SKILL.md:189-203`). Merges are
single-flight. Readiness is computed in JS from the planner's `deps`/`opaque` rows, which come from
`tree-deps` (`coordinator.js:923-929`; `tree-deps:4-11`). **Early unblock** (default on) splits a
task with open dependents at its implementation commit: a `review: <id>` bead is created, and the
dependents dispatch at once, stacked on the unmerged branch (`stack: <id>` commits), merging only
after it with `rebase --onto`. A parent that fails cancels and discards its stacked dependents
(`coordinator-workflow.md:73-80,464-481`; `coordinator.js:954-992,1117-1118`). The
ordinary-subagent mode never early-unblocks (`coordinator-subagents.md:8-13,75-76`).

**8. Merge-time composition checks.** Three checks run at merge time:
- A build-only `mergeCheck` runs at every merge. A failure routes to one merge-check fix
  (`coordinator-workflow.md:100-106,912-929`).
- A post-rebase seam review runs on file overlap (`:888-896`).
- Since `01983d6` (2026-10-03), a "composed review" also runs. A consumed in-tree producer that
  landed after the consumer branched (and is not a stack parent) forces a seam review that checks
  "names, signatures, schema, defaults, error and ordering behaviour the consumer assumes"
  (`:896-901`; `coordinator.js:664-668,1618,1758`; harness `replay-harness.mjs:1789-1794`).

**9. Measurement.**
- Ledger `Task`/`Merge:` lines carry no timestamps (`coordinator-workflow.md:587-627`).
- The script has no clock (`:189-205`); it orders events with a `landSeq` counter
  (`coordinator.js:328-333,978`).
- `Detector:` lines carry counts: stacked, cancelled, waiting on deps, merge-queue peak, idle slots
  (`coordinator.js:1292-1307`).
- `Metrics:` carries `dispatched early E · cancelled K` (`coordinator-workflow.md:1145,1158-1159`).
- `graph-shape` reports depth/width in rounds (`graph-shape:2-7`).

### Dimension matrix (what exists / what is missing / covered by extending seam beads?)

| Dimension | Exists (cited) | Missing | Extension covers? |
|---|---|---|---|
| Contract ownership | `owns:`/`consumes:` literal tokens (`SKILL.md:208-221`); UNOWNED-SEAM check (`coverage-reviewer-prompt.md:62-66`); `boundary contract:` pointer (`SKILL.md:502`); regression lens "Ownership collisions" (`scout-prompts-design.md:186-189`) | Nothing checks mechanically that a boundary has exactly one owner, and there is no contract registry. The trigger is ambiguity, not fan-out or interface size | Yes. Add a fan-out trigger: SPLIT's "artifact" becomes a `Seam contract:` bead |
| Executable signatures / stubs; must compile/test? | "compilable boundary code … stubs or defaults"; acceptance "compiles, suite green, wiring present" (`SKILL.md:500`); contract-owned failing tests rejected (spec `:118-119`) | No contract/interface tests are required. "Compilable" has no analogue for doc/prompt repos (the only recorded contract bead was a Markdown skeleton, `settled-tree-r3.md:111-117`) | Partly. A project-dependent "executable contract check" field would be needed |
| Reviewer judgment of contract beads; stub-as-implemented | Same light task review as any bead (`task-reviewer-prompt.md:10-12,65-79`); behavioral backstops: `Seam integration:` tests (`SKILL.md:501`), the sweep's "sweep for unwired config" (`:515-516`), Finish suite and final review | No contract rubric and no "contract approved/frozen" record. No stub-marker convention (grep: none). No stub→participant "replaced-by" link. The planner prompt never mentions `boundary contract:` pointers (`planner-prompt.md:85-87` covers only the file span) | Yes, through prompt data: a reviewer rubric, a planner carry-through, and a stub inventory in the contract bead description |
| Version / compatibility after consumers start | Stacked consumers' seam check counts the parent's fix-pass files (`coordinator-workflow.md:470-474`); mergeCheck catches signature drift (`:912-929`); design-time "Changes since" input (`SKILL.md:451-454`) | No version field, no change protocol, no in-flight consumer notice. "No re-plans, no edits to running tasks" (`super-code/SKILL.md:71-72`). The graph is read once per planning pass (`coordinator-workflow.md:1305-1310`) | Partly. Needs a policy; per-bead early-unblock behaviour needs an engine change |
| Contract-drift detection | mergeCheck (compile), file-overlap seam review, composed review (consumer's own deps), Seam integration, root sweep, Finish suite | No consumer-vs-contract diff. A participant that changes a contract it does not own reaches other consumers only through compile errors or file overlap (`coordinator.js:667`, inference). Run 10-01 built a project-specific contract lint as a deliverable (`report.md:18`) | Mostly. Seam integration plus the sweep are the drift net; a cheap mechanical check is missing |
| Dependency edges ("consumes <artifact>") | Mandatory reason lines and fixed tokens (`SKILL.md:268-289`); execution-added edges also get lines (`coordinator.js:1686`) | Token usage is not enforced: the decomposition-time contract bead's 4 edges used free text (`settled-tree-r3.md:40,51,83,96`). The scheduler is reason-blind: `tree-deps` emits ids only (`tree-deps:70-81`) | Yes for design time (a precheck rule). The scheduler awareness would be an engine change |
| Safe concurrent dispatch | Per-task worktrees, hot-file count, single-flight merge, `STACK_CONFLICT` (`coordinator-workflow.md:480-481`); "No exclusive file ownership" (`:1317-1319`) | The contract's both-sides span counts toward `hotFileCap` during its review window while its stacked dependents run (`coordinator.js:1045,1117-1118,1133`). The cross-note `super-code/SKILL.md:219-221` predates early unblock (`0d07b9a` vs `d4c5824`) | Yes (doc fix), or a scheduler exemption (engine change) |
| Review evidence recorded | Review file; `complete (… review clean / fix pass)`; `Merge: … seam-review … check …`; minors with `[class]` tags (`coordinator-workflow.md:587-627`); coverage ledger seam lines (`SKILL.md:436-438`) | No contract-specific evidence (what was frozen, what was stubbed) | Yes, as a ledger/description convention |
| Integration fan-in | `Seam integration:` + root `Integration sweep:` (`SKILL.md:501,506-525`); Finish suite and final review | No `Seam integration:` bead was ever created in a recorded run. The join cost is inherent: one quarantined leaf leaves the sweep unready (`SKILL.md:519-520`; 09-04 `friction.md:9`) | Already exists |
| Speedup measurable? | Depth/width (`graph-shape`), `graph-pass:` line, Detector counts, `dispatched early E` | No per-bead or per-merge timestamps, and no clock in the engine. Wall-clock times appear only ad hoc in run.md or feedback drafts (09-04 `run.md:32`; 10-01 draft `:4`). No script reads bd timestamps (grep: none) | No. Needs new ledger fields (an engine change, which means a dryRun recount) |

## Findings

**A2-F01 — observed.** The hypothesis' contract → parallel branches → fan-in shape already
ships as design-time beads: `Seam contract:` (compilable interface plus stubbed wiring; every
participant blocked on it), `Seam integration:` (depends on the participants), and the root
`Integration sweep:` (depends on every leaf and every seam-integration bead). Execution needed
zero engine changes. Cites `SKILL.md:495-502,506-525`; spec `2026-08-25-integration-seams-design.md:29-38,63-102`.
*Implication (a):* extend these beads rather than invent a parallel stage.

**A2-F02 — observed.** Contract beads are triggered by *ownership ambiguity* (UNOWNED-SEAM), not
by interface size or fan-out (`coverage-reviewer-prompt.md:62-66`; spec `:16-19`). The fan-out
trigger lives separately in the bottleneck rule and `SPLIT`, which needs "gates ≥2 AND oversized"
and names "artifact / remainder" (`promotion-reviewer-prompt.md:44-54`). That SPLIT path creates
no `Seam contract:` title, no fixed edge token and no integration bead. *Implication (a):* "large
interface → contract bead" is half-present. The missing half is to route SPLIT's artifact through
the seam-bead template.

**A2-F03 — observed (counts) + inference (cause).** Both recorded runs together produced 20
UNOWNED-SEAM findings: 6 in 09-04 (coverage ledger `:8-9,14-15,27,29`) and 14 in 10-01
(`coverage-ledger.md:9-25`). 15 were applied, 5 rejected ("shared file, not a dataflow boundary"),
and **zero** became contract+integration bead pairs. Applied fixes amended `owns:`/`consumes:`
lines or added edges onto full implementations (c10 "edge .7<-.5"; c11 "edges .6<-.3, .7<-.5").
The rule in force at run base `2bf1d53` said "create two leaf tasks" (`git show
2bf1d53:skills/super-design/SKILL.md:484-487`). Inference: in practice the two-bead path is judged
too heavy for these seams. Both runs edited Markdown skills, not compiled code. *Implication (a):*
the existing contract path is untested in recorded runs, so evidence for code-interface contracts
is thin.

**A2-F04 — observed.** The only recorded `Seam contract:` bead was `super-plan-5pi.1`, a
MAINTENANCE.md heading skeleton. It came from decomposition (a top-split LEAF, `run.md:35`). Its
4 dependents used the free-text artifact "consumes MAINTENANCE.md heading layout"
(`settled-tree-r3.md:40,51,83,96`) instead of the `boundary contract` token. It had no
`Seam integration:` bead. Coverage round 1 widened its scope (c7, c8; `coverage-ledger.md:7-8`).
Its acceptance was "file exists with the four headings" (`settled-tree-r3.md:115`). The graph pass
evaluated its edge and "kept — seam contract" (`coverage-ledger.md:34`). *Implication (b):* the
exemption depends on a literal token that nothing enforces.

**A2-F05 — observed.** Early unblock already lets consumers start before a blocker is reviewed,
fixed or merged. They start at its implementation commit, stacked on its branch, and merge after it
(`coordinator-workflow.md:73-80,464-481`; `coordinator.js:954-974,1117-1118`; harness
`replay-harness.mjs:2271-2301`). Run 10-01 recorded `dispatched early 7 · cancelled 0`
(`upstream-feedback-draft.md:60`). *Implication (a):* a contract bead changes what consumers wait
for, from the full implementation's commit to the contract's commit. Review-before-unblock is not
what the engine does.

**A2-F06 — observed.** The scheduler cannot tell edge kinds apart. `tree-deps` emits only blocker
ids and `opaque` (`tree-deps:4-11,70-81`), and `readyFromGraph` treats every edge alike
(`coordinator.js:923-929`). A speedup therefore exists only when the design points edges at the
contract; the engine cannot infer it. *Implication (a).*

**A2-F07 — observed.** The parallelism pass's safe class makes contract-mediated cuts unsafe.
"Safe yes" requires that neither bead references "the other's output or interface"
(`graph-pass-prompt.md:49-53`). In 10-01 this parked 4 cuts that would have taken depth 7→5
(`run.md:43-48`; `report.md:37`): "edges carry spec-fixed heading names, not artifacts". Edge
`.7<-.5` was judged "drop … safe no" four times. The run's feedback proposed a "spec-fixed name"
safe class gated on a downstream lint or sweep (`upstream-feedback-draft.md:80-83`). It was not
adopted: no match for "spec-fixed" exists in `skills/`. *Implication (a)/(b):* this is the concrete
parallelism the hypothesis would recover.

**A2-F08 — observed + gap.** A contract bead gets the same light task review as any other bead.
Nothing distinguishes "stub is the deliverable" from "stub left in place". The reviewer's
reachability check ("A tested wrapper nothing calls … is Important", `task-reviewer-prompt.md:73-76`)
is generic. No stub-marker convention exists (grep finds only `SKILL.md:205,214,500`), and no
stub→participant mapping exists. The planner prompt never mentions `boundary contract:` pointers
(`planner-prompt.md:85-87` covers only the file span). *Implication (b):* the guard against an
inert stub is behavioral (Seam integration tests, the sweep), not mechanical.

**A2-F09 — observed + inference.** Consumers stack on the contract's *unreviewed* branch. The
contract's fix-pass files feed the consumers' seam check (`coordinator-workflow.md:470-474`;
`coordinator.js:1758`). A contract that fails to merge cancels and discards every stacked consumer
(`coordinator-workflow.md:474-481`; Known limitation 4, `:1300-1304`). `earlyUnblock` is a global
setting (`:73-80`). Inference: the discard risk concentrates on the highest fan-out bead.
*Implication (b):* a per-bead "unblock only after review" policy is an engine change.

**A2-F10 — gap.** There is no contract version or compatibility protocol. Running tasks are never
re-planned (`super-code/SKILL.md:71-72`). Edges added mid-run stay invisible until the next
planning pass (`coordinator-workflow.md:1305-1310`). At design time, contract changes are
description rewrites plus the round-2 "Changes since" input (`SKILL.md:451-454`). Run 09-04 shows
design-time drift: the sweep "pins superseded literals", so the fix was to read the current formats
from the producers' `owns:` lines (09-04 coverage ledger `:60`). *Implication (b).*

**A2-F11 — observed + inference.** Drift detection at execution has three layers: mergeCheck
(compile only), the seam review (file overlap plus the consumer's own deps, the latter since
`01983d6`, after the 10-01 run), and the Finish suite plus final review. Inference from
`coordinator.js:667`: when a participant changes a contract it does not own, sibling consumers hear
about it only through compile errors or shared files. *Implication (b).*

**A2-F12 — observed.** Edge reasons provide a ready "edge kind" channel: the fixed tokens are
already parsed by `graph-shape` (`:56`) and listed in `SKILL.md:283-289`. The precheck checks only
that a reason is present (`coverage-precheck:6-7`). *Implication (a):* a precheck rule could flag a
`Seam contract:` bead's dependents that lack the token. That is a script change, with fixtures in
`tests/super-design`.

**A2-F13 — inference (medium).** A chain holds its scheduler slot and file counts from implement
through fix (`coordinator.js:1045-1046,1133,1898-1939`), but its dependents dispatch at
implementation (`:1117-1118`). So a both-sides contract span counts toward `hotFileCap` while its
consumers run. The claim at `super-code/SKILL.md:219-221` ("its span never contends") predates
early unblock (`0d07b9a` 2026-08-25 vs `d4c5824` 2026-09-30).

**A2-F14 — observed.** The fan-in works and is costly when a leaf fails. In 09-04 the sweep found
zero drift (`report.md:22`), but one refused leaf kept it from ever becoming ready (`friction.md:9`;
the "join cost is inherent", `SKILL.md:519-520`). No recorded run created a `Seam integration:`
bead.

**A2-F15 — gap.** Speedup is not measurable in time from repo artifacts. There are no timestamps on
ledger or detector lines (`coordinator-workflow.md:587-627`; `coordinator.js:1307`) and no clock in
the engine (`coordinator-workflow.md:189-205`). Wall-clock appears only ad hoc ("74 min", "7.8 h",
09-04 `run.md:32`; "about 3.5 h", 10-01 draft `:4`). What can be measured: design depth/width, and
the counts `stacked`/`dispatched early`/`cancelled`. *Implication:* an A/B test of contract-first
needs per-bead dispatch/implemented/merged markers.

**A2-F16 — observed.** Depth, not width, is what binds, and re-pointing edges at minimal artifacts
pays:
- "raising a cap 4 → 14 bought 1.5×, not 3.5×"; edge audits took the critical path
  "16 → 11 → 9 → 8 rounds" (`super-code/SKILL.md:241-249`);
- a split re-point took it "15 → 11 rounds" (`super-design/SKILL.md:320-321`);
- "Two chained edges (~2 rounds) encoded an unanswered data-ownership question" (`944da17`);
- in 10-01, peak in-flight was 2–3 against a cap of 8 at depth 7 (`report.md:50`).

**A2-F17 — observed.** An execution-time contract hook already exists outside the engine. For a
file held back across two rounds, the watching session may "file one `Seam contract:` bead … for
the next round's planner" (`super-code/SKILL.md:61-62`, added in `3d935e8`). This contradicts the
spec's rejection of execution-time seam creation (`integration-seams-design.md:115-116`). It is
driven by shared files, not by interfaces.

**A2-F18 — observed.** The fallback mode gets no early-unblock benefit. It never dispatches a
dependent before its blocker merges and runs one chain at a time
(`coordinator-subagents.md:8-13,75-76`). Contract-first pays nothing there beyond a cleaner graph.

## Extension points

- **Design trigger (prompt and skill data):** route SPLIT's "artifact" through the
  `Seam contract:` template when it is an interface consumed by ≥2 siblings:
  - `promotion-reviewer-prompt.md:44-54`;
  - `SKILL.md:201-206` (bottleneck rule), `:304-313` (SPLIT handling), `:495-502` (seam template).
- **Edge kind:**
  - enforce the `boundary contract` token on contract dependents with a `coverage-precheck` rule
    (fixtures in `tests/super-design/fixtures/graph.json`);
  - extend the `graph-pass-prompt.md:49-53` safe class with a contract-mediated `repoint`
    (impl→contract) when a `Seam contract:` bead lands the consumed interface.
- **Planner carry-through (prompt data):** copy `boundary contract:` and stub-inventory lines into
  the `## Task <N>` section (`planner-prompt.md:89-97`).
- **Review rubric (prompt data):** a contract-bead item in `task-reviewer-prompt.md` "What to
  check" (`:65-79`); a participant item: "every stub this bead owns is replaced".
- **Engine (needs dryRun recount):**
  - `tree-deps` and mapping rows could carry the edge kind;
  - a per-bead early-unblock policy (`coordinator.js:956-974`);
  - per-bead timing in ledger lines, consumed by upstream-feedback's Run metrics.
- **Must stay untouched:**
  - the single-flight merge queue; one review plus at most one fix pass; a build-only mergeCheck,
    never tests;
  - hot-file cap semantics;
  - the two-round coverage cap; the "no new pass, no new gate" decision (spec `:35`; leaf-sizing
    spec `:13-15,84`);
  - the sweep's adopt-never-duplicate rule (`SKILL.md:110`) and the seam/sweep edge exemption
    (`:787-788`);
  - the explicit gates (top split, ORPHAN escalation); the flag triple (`SKILL.md:774`);
  - `subagent-driven-development` stays byte-identical.

## Constraints and costs

- **Tests:** the replay harness passes 1501/0 and super-design scripts all pass (runs above).
  dryRun baselines are 44 / 19 / 21 agent calls (`coordinator-workflow.md:1732,1886,1954`), and
  CLAUDE.md requires re-running them after any engine edit. The super-auto contract lint freezes
  run-state fields against the `2bf1d53` baseline (`test-contract-lint.sh:1-7`), so a new run.md
  field needs a deliberate fixture update.
- **Cost per bead:** about five dispatches of ceremony (`SKILL.md:197-200`); a clean task is four
  agents (`super-code/SKILL.md:82`). A seam pair adds two beads, and an early-unblock split adds one
  mechanical dispatch. The sizing floor forbids splitting below the ceremony.
- **Caps:** `hotFileCap` 3, concurrency `min(16, runtimeSlots-2)`, `edgeAuditCap` 3, two coverage
  rounds.
- **Philosophy:** "Execution (super-code) stays dumb" (spec `:31-32`); SKILL.md carries execution
  content only (leaf-sizing plan `:14`); autonomous runs degrade, they don't stop
  (`super-code/SKILL.md:71-72`); skills avoid overconstraining (memory index, session context).
  CLAUDE.md requires eval evidence for skill changes.

## Open questions

1. Why did 10-01 resolve 12 verified UNOWNED-SEAMs by amending owners instead of creating the two
   documented beads? The ledger records only dispositions.
2. Has any compiled-code epic produced seam bead pairs? The spec's "canonical incident" and the
   "197-bead epic" runs are not in this repo.
3. How often does a contract's fix pass change its interface after consumers have stacked? `K`
   exists, but no run recorded it for a contract bead.
4. Does the Workflow runtime log per-agent timestamps that could be joined to the ledger?
5. Are bd's per-bead timestamps usable? I did not verify this, and nothing in the repo uses them.

## Conclusion: extend the seam beads, or add a new stage?

**Facts.**
- The repo already has contract beads (compilable stubs, participants blocked on them),
  per-seam integration beads, a root fan-in sweep, a fan-out sizing rule (SPLIT), and an engine
  that starts consumers at a blocker's implementation commit (F01, F02, F05, F14).
- The design decisions explicitly forbid new passes and gates (spec `:35`; leaf-sizing `:13-15`).
- Recorded runs never produced a contract+integration pair from UNOWNED-SEAM (F03).
- The concrete parallelism loss observed came from the graph pass's safe class refusing
  interface-mediated cuts, depth 7 where 5 was possible (F07).
- Speedup is measured in rounds, not time (F15).

**Inferences.** Extending the existing seam beads covers the hypothesis without a new stage, which
would collide with the "no new pass/gate" decisions and the depth/ceremony costs. The gaps to close:
1. A fan-out/size trigger that turns SPLIT's artifact into a `Seam contract:` bead (F02).
2. An enforced `boundary contract` edge token, plus a contract-mediated safe class or repoint in
   the graph pass (F04, F07, F12).
3. A contract-bead review rubric, a stub inventory and replaced-by link, and planner carry-through
   of `boundary contract:` (F08).
4. A policy for consumers stacked on an unreviewed contract and for contract changes after
   dispatch (F09, F10). This is an engine change, if one is wanted.
5. A doc fix for the hot-file cross-note (F13).
6. Per-bead timing markers, so any speedup claim can be measured (F15).

The evidence base is two Markdown-only runs, so the benefit for code interfaces remains unmeasured.
