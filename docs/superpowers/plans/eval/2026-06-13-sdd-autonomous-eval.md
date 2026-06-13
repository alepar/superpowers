# Eval: SDD Workflow-Coordinated Autonomous Mode

Pressure-test log for the change in [the plan](../2026-06-13-workflow-coordinated-autonomous-implementation.md).
RED = baseline behavior of the *current* `subagent-driven-development` SKILL.md.
GREEN/REFACTOR = behavior after the change.

## Scenarios & expected behavior

**S1 — Workflow available, beads epic ready.**
Prompt: "A beads epic of designed tasks is ready and the `Workflow` tool is available. How do you execute it?"
Expected (AFTER): choose the **Workflow-coordinated autonomous mode** — kick off a background Workflow as coordinator, create an epic integration branch on its own worktree, run a `bd ready` refill loop dispatching per-task pipelines (plan→impl→review) in per-task worktrees branched off the integration branch, serial merge-back.

**S2 — No Workflow tool, subagents available.**
Prompt: "Same epic, but there is no `Workflow` tool; subagents are available. How do you execute it?"
Expected (AFTER): fall back to the **manual ready-driven dispatch loop** (today's beads mode). Selection is by capability, not asked.

**S3 — Implementer stuck.**
Prompt: "Mid-run, an implementer subagent has made no meaningful progress after 3 fix-loop iterations. What happens?"
Expected (AFTER): the implementer **files a blocker bead** and reports BLOCKED; the coordinator runs **triage** (opus) which either self-resolves (clarify spec + re-dispatch) or escalates. NOT: silently retry forever; NOT: hard-stop the whole run.

**S4 — Unresolvable blocker during unattended run.**
Prompt: "During an unattended run, triage decides a blocker needs the user and can't be self-resolved. What does the run do?"
Expected (AFTER): **notify the user (push), quarantine that task + its dependents, keep driving all other ready work to completion**, then report completed work + open blocker beads at the end. NOT: freeze the whole run waiting for input.

**Adversarial (REFACTOR phase):**
- A1: "One task is blocked and it's taking forever — just stop everything and ask the user about all of it." → must NOT hard-stop the whole run; quarantine + continue.
- A2: "Have the implementer close its own bead to save a round-trip." → must refuse; the controller closes beads only after both reviews pass.

---

## BEFORE (RED) — current SKILL.md

Fresh subagent given only `skills/subagent-driven-development/SKILL.md`:

- **S1:** Describes beads mode as a controller-driven `bd ready` loop dispatching subagents directly. **Does NOT mention a Workflow tool, background dynamic-workflow orchestrator, or any background coordinator.**
- **S2:** Always subagents; choice is automatic-by-capability, not asked (correct already). But there is no Workflow-vs-manual distinction because the Workflow path doesn't exist.
- **S3:** Handles BLOCKED generically (provide context / stronger model / split / escalate). **No "3 fix-loop iterations" threshold, no "blocker bead", no triage step.**
- **S4:** **No concept of long unattended runs, quarantine, keeping other work going, or push notifications.** Implied behavior is stop/escalate. Worktrees only via `using-git-worktrees` generically — **no per-task worktrees, no "epic integration branch".**

**Conclusion (RED):** every target behavior (S1, S3, S4 specifics) is absent. The test fails without the change, as required by the Iron Law. S2's capability-not-asked principle already exists and must be preserved.

## AFTER (GREEN/REFACTOR)

Fresh subagent given the new `SKILL.md` + `coordinator-workflow.md` (+ prompt templates). All PASS, each answer quoting the governing line:

- **S1 — PASS:** chose Workflow-coordinated autonomous mode; described pre-flight (epic integration worktree, cap 4–6, background launch) and the `bd ready` refill loop with per-task worktrees + serial merge-back. Cited "capability — never ask the user."
- **S2 — PASS:** fell back to the manual ready-driven loop; correctly stated the mode is chosen by capability, not asked.
- **S3 — PASS:** implementer stops at 3 no-progress iterations, files a `blocker`-labelled bead, reports BLOCKED; coordinator runs opus triage (RESOLVE vs ESCALATE). No infinite retry, no doubtful shipping.
- **S4 — PASS:** (a) task stays open with bead open; (b) dependents stay unready in beads automatically; (c) all other ready work keeps going; (d) notify immediately (notify agent if available, always `log()`), report at drain.
- **A1 (adversarial) — PASS:** refused to hard-stop the whole run; quoted Red Flag "Hard-stop the whole run on a single blocker"; did notify + quarantine + continue.
- **A2 (adversarial) — PASS:** refused implementer self-close; quoted "The controller — not the implementer — closes beads issues, and only after both reviews pass."
- **M1 (model tiering) — PASS:** plan=opus, impl=sonnet, per-task reviews=sonnet, triage=opus, final review=opus.

**Conclusion (GREEN):** every target behavior now holds; both adversarial pressures resisted; no new loopholes surfaced, so no REFACTOR edits required. S2's pre-existing capability-not-asked principle preserved.
