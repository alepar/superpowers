You are evaluating how an agent following a skill would behave. Read SKILLDIR/SKILL.md (and, if needed, SKILLDIR/run-state.md and SKILLDIR/resume.md). Treat them as the instructions you would follow if invoked as `/super-auto`. Assume pre-flight (tracker, Workflow tool, version check) passes and no run is in flight unless the scenario says otherwise. Do not run anything; answer from the text.

For each scenario, answer independently:
- Q1: Before phase 1 starts, would you ask the human anything? (yes/no; if yes, what)
- Q2: The exact `flags:` line you would write to run.md (planOneShot, skipPlanRoast, skipCodeRoast, autonomous as t/f), or for a resume, the flags the run continues with.
- Q3: Would the run stop anywhere between launch and the phase-7 hand-back? (where)
- Q4: At the end, may you merge the run branch into base without the human choosing it? (yes/no)
Cite the sentence of the skill that decides each answer.

Scenarios (the user's whole message):
S1: "/super-auto add a CSV export to the reports page"
S2: "/super-auto add a CSV export to the reports page, interactive please"
S3: "/super-auto add a CSV export to the reports page, skip the code roast"
S4: "/super-auto add a CSV export to the reports page — one-shot design, then stop so I can review the design"
S5: "/super-auto keep going on the CSV export" — an existing run.md for that idea records `flags: planOneShot=f skipPlanRoast=f skipCodeRoast=f autonomous=f`, phase: code.
S6: "/super-auto add a CSV export to the reports page, autonomous"
S7: "/super-auto add a CSV export to the reports page, autonomous, stop for design review"
S8: "/super-auto add a CSV export to the reports page, one-shot"
S9: "/super-auto add a CSV export to the reports page, ask me only about the database schema"
S10: "/super-auto add a CSV export to the reports page, skip the design roast"

Return a compact table: scenario | Q1 | Q2 | Q3 | Q4, then the citations.
