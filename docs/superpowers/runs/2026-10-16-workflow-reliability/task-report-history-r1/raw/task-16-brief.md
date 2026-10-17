## Task 16: Keep super-auto root acceptance caller-owned

**filesTouched:**
- `skills/super-auto/SKILL.md`
- `skills/super-auto/run-state.md`
- `skills/super-auto/resume.md`
- `skills/super-auto/scripts/report-status`
- `skills/super-code/scripts/close-in-tree-epics`
- `skills/super-code/coordinator.js`
- `skills/super-code/coordinator-workflow.md`
- `skills/super-code/coordinator-subagents.md`
- `tests/super-code/replay-harness.mjs`
- `tests/super-auto/test-scripts.sh`
- `tests/super-auto/test-contract-lint.sh`
- `tests/super-auto/fixtures/contract-lint/run-state-added-fields.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-added-formats.txt`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `skills/super-auto/report-prompt.md`
- `skills/super-auto/scripts/scope-dispositions`
- `skills/super-code/SKILL.md`
- `tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt`
- `tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt`

**Bead:** super-plan-ufz.6. **Surface:** 242801 tokens at integration base `560a05eb83cdc44013ea528e99854151c2f17d12`.

**Scope:** Keep measurement obligations caller-owned and preserve super-auto root acceptance after leaf completion. Standalone execution retains its current root ownership.

**Interfaces:** Consume .4 durable obligations, .5 evidence and .8.3 accumulated outstanding findings. Use an explicit existing-launch option/protocol parameter identifying caller-owned root acceptance; deferSweep alone is not that ownership signal. A narrow optional exclude-root flag on close-in-tree-epics is a bounded implementation choice, preserving its no-option behavior. Carry the same ownership to Workflow and ordinary calls, including every fix-loop re-entry and root-close path.

### Acceptance (verbatim)

- [ ] A deferred sweep remains an explicit pending measurement with an owner and does not hide actual code findings (needs: super-plan-ufz.4, super-plan-ufz.5).
- [ ] All implementation leaves can finish while the super-auto root remains open for required review, measurement or human acceptance (needs: super-plan-ufz.4, super-plan-ufz.5, super-plan-ufz.8.3).
- [ ] Standalone callers retain their existing acceptance ownership.
- [ ] Deterministic gate/status fixtures pass; the coordinator owns fresh-agent deferred-sweep and final-acceptance scenarios.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Add a fake-bd closure fixture (inside the existing replay script-test harness) with every implementation leaf closed and an eligible inner epic plus the root. Under caller-owned acceptance assert only the inner epic closes and rootClosed remains false; under the unchanged standalone invocation assert normal root closure. Cover the helper's manual no-jq instructions so fallback cannot close an excluded root. Add replay cases that propagate ownership into Close, Ready and every other helper caller.
2. Add caller run/status fixtures with an owned deferred sweep and actual code finding together, then a supported passing measurement that clears only its matching measurement obligation. Test required review, unavailable/failed/live-required measurement and open human gate independently while leaves finish. Assert a root stays open until its actual caller acceptance obligations and reserved human choice are satisfied; no agent auto-closes a human gate. Run replay, test-scripts and contract lint before editing the closure contract.
3. Carry explicit caller-owned-root acceptance through the existing Workflow args/Launch and ordinary launch protocol. Change close-in-tree-epics additively to skip the root when that ownership is supplied, while retaining fixpoint inner-epic closure and existing standalone defaults. Pass the ownership at every coordinator helper invocation, including readyPrompt's preliminary close pass. Empty implementation frontier under caller-owned acceptance ends implementation normally; it must not require rootClosed true or spin into false stall/completion.
4. In super-auto code and re-entry invocation instructions, always supply the same root acceptance ownership. Retain required pending review/measurement/human obligations with owner and evidence using .4/.5, and consume .8.3's outstanding projection when deciding what remains. The final sweep discharges only source-matched measurement evidence; actual code findings retain their routing/disposition even when unmeasured status is resolved. Do not replace acceptance with child-count or latest-ready checks.
5. Update resume/run-state/report-status handling to preserve pending caller acceptance across interruption and qualify completed leaves accordingly. Keep the existing phase-7 human decision and finish semantics: caller-owned root closes only after its specified obligations and authorized final acceptance; cancelled/kept-branch outcomes remain distinguishable. Standalone callers retain their existing finish ownership and defaults.
6. Use writing-skills for operative acceptance/gate instructions. Prepare the deferred-sweep plus code-defect and all-leaves-done/open-human-gate scenarios for coordinator-owned fresh-agent evaluation. Run the three named suites and commit helper/caller changes, reporting the exact ownership option and every call site updated.

**Contract fixture upkeep:** Preserve both historical 2bf1d53 fixture files byte-for-byte. If the task adds run-state fields/formats, represent them in Field table/worked example and record their exact current additions in the declared run-state-added-fields.txt/run-state-added-formats.txt fixtures. Extend test-contract-lint.sh to validate the union of unchanged historical expectations and these explicit approved additions; keep rejection of dropped legacy fields, changed legacy formats and unapproved extra fields, with mutation coverage. Reuse this same additive-fixture contract when a predecessor has installed it; no top-level field is needed where an existing record holds the fact. These small current-contract goldens are tests, not a second runtime schema.

Run:

```bash
node tests/super-code/replay-harness.mjs
bash tests/super-auto/test-scripts.sh
bash tests/super-auto/test-contract-lint.sh
```

Expected final result: task-relevant deterministic checks pass; unavailable checks and coordinator-owned live evaluations remain identified separately. **Independently testable deliverable:** Leaves can complete while the super-auto root awaits caller-owned review, measurement or human acceptance, with standalone closure unchanged.

