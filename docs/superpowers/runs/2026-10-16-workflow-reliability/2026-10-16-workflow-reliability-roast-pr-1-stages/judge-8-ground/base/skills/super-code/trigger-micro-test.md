# Trigger micro-test (maintenance procedure — not loaded at skill invocation)

Re-run this probe set before changing this skill's frontmatter `description`; it is the
description's regression test, moved out of SKILL.md so it doesn't ride along in every
invocation's context.

Three fresh haiku subagents, each given *only* this skill's frontmatter description plus one
scenario, asked "would you invoke this skill? yes/no." Re-run all three on any miss.

| Probe | Scenario | Expected | Result |
|---|---|---|---|
| (a) | "run the epic in beads — build out all the ready tasks" | yes | yes |
| (b) | "execute this implementation plan task by task, review between tasks" | no (that is SDD) | no |
| (c) | "spin up a few agents to investigate why these three tests are flaky" | no (that is dispatching-parallel-agents) | no |

All three matched on the first pass; the description was not tightened. A future editor changing
the description should re-run this probe set before merging.
