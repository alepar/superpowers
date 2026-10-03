# Support ordinary-subagent orchestration when Workflow is unavailable

Plugin: 6.4.2-alepar4.14; inspected commit 0c7c895. User feedback received 2026-10-03; separate-fork run scale and results unavailable. Target: alepar/superpowers. Status: recorded locally; not filed on GitHub.

## Defects

None classified as accidental defects: the Workflow requirement is intentional.

## Run metrics

### Judge panel
none

### Fix loop
none

### Merge-back
none

### Coverage
none

### Bead graph
none; no bead graph or dependency dump supplied.

## Design questions

### Support an ordinary-subagent fallback with the same gates

The user requests: “We need a supported fallback mode that uses ordinary subagents for design, execution, and review with the same review and integration gates.” They report continuing a user-authorized one-off substitution in a separate fork.

Verified in this repository:

- `skills/super-code/SKILL.md:97–103` requires Workflow in the calling session's loaded functions, prohibits hand-driving the epic, and hands back when it is absent.
- `skills/super-auto/SKILL.md:85` requires Workflow for execution, fix-loop re-entry, and roast; absence stops the run.
- `skills/super-code/coordinator-workflow.md:4` says there is no hand-driven fallback.
- This reporting session has ordinary subagent tools (`spawn_agent`, `followup_task`, `wait_agent`) and no Workflow tool.

Requested behavior: select a documented ordinary-subagent mode when Workflow is missing, record that mechanism, and preserve the existing design, execution, review, and integration contracts.

For: removes an observed capability barrier in this session and avoids requiring ad hoc substitution. Against: the previous manual path lost durable artifacts, as reported in #6 and #8; removing the hard stop alone would restore that failure mode.

Evaluate an adapter for the existing coordinator versus a separately specified fallback protocol. An adapter may share gate logic but needs lifecycle/tool mapping; a separate protocol risks divergent orchestration. No architecture is selected by this feedback record.

If upstream decides otherwise, please state the position explicitly so downstream can reconcile against words rather than silence.

## Doc gaps

The requested fallback has no supported procedure in the inspected version. Its capability selection, durable state, resume behavior, and gate parity need a specified and tested contract.

## Already fixed — do not re-litigate

#6 and #8 are closed: 4.14 deliberately replaced the manual coordinator with a Workflow requirement. This request revisits that policy with a supported ordinary-subagent protocol, rather than alleging those prior issues remain unfixed. Searches of all issues and PRs found no open duplicate.

## Not established

- The user's statement that most harnesses lack Workflow is not independently measured; this session's absence is verified.
- No separate-fork transcript, run state, ledger, metrics, or completed substitution result was supplied. Gate parity and speed improvements are not claimed.
- Independent analyst: gpt-6-astra, high effort; one fresh-context evidence review, no behavior eval.
- Author: GPT-6 via Codex CLI 0.160.0. Installed plugins: superpowers 6.4.2-alepar4.14, openai-templates 0.1.1, pages 0.1.19, sites 0.1.75, plugin-management 0.1.0, work-pets 0.1.6. Only superpowers:upstream-feedback was applied to this record.

## Verification bar

Before declaring fallback support, run end-to-end design, execution, and independent review with Workflow absent. Verify per-task worktree isolation, review/base-evidence checks, bounded fix/seam passes, single-flight integration with build checks, final sweep ownership, final-review intake, and the human-owned finish gate. Compare durable ledger, Merge records, detector/Metrics, and resume reconstruction with Workflow mode. Exercise interrupted agents, blocked tasks, permission refusals, merge/build failures, and interrupted/resumed runs. Include multi-session adversarial behavior evaluation; prompt-only permission to substitute is insufficient.

---
If a premise above is wrong, stop and say so rather than improvising a larger change.
