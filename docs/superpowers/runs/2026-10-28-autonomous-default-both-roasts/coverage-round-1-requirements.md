R1 An unqualified /super-auto invocation asks no launch question and records autonomous=t, skipPlanRoast=f, skipCodeRoast=f.
R2 An explicit interactive request records autonomous=f and the run asks the top-split question.
R3 An explicit design-review-stop request records planOneShot=t, autonomous=f and the run stops after phase 2.
R4 An explicit skip-the-plan/design-roast request records skipPlanRoast=t; skip-the-code-roast records skipCodeRoast=t; autonomy stays default.
R5 A resumed run continues with the flags its run.md recorded, never the new defaults.
R6 Default autonomy grants no merge into base without the human's choice (I5 unchanged).
R7 Entry points (skill description, opening paragraph, README) describe autonomy as the default, not optional.
R8 Mode names, invocation examples and flag collection text are internally consistent with the new defaults.
