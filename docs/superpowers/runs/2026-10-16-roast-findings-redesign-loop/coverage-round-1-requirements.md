R1 findings-ledger rebuilds a per-loop ledger from every round's report, the punch list and an overrides file, with per-key statuses (open, open (returned rN), resolved@rK, punch-listed, dissolved@rK, disputed)
R2 the ledger's triggers line computes no-progress (carried+regressed Blocking ≥ previous Blocking > 0) and recurrence (regressed Blocking ≥1 or a Blocking/Should-fix key returning)
R3 the step-back prompt answers local | redesign with a triggers field, reading the ledger as primary input
R4 step-back-check lives in super-design/scripts and rejects local under a mechanical trigger, redesign with no trigger, and a cited mechanical trigger the ledger lacks
R5 the code loop runs a redesign round through super-design Amend Mode, files its beads, re-enters super-code and roasts the next numbered round, skipping scope filter and clusters
R6 the design loop makes the same validated local/redesign choice and runs Amend Mode for redesign
R7 Amend Mode dispatches the amend designer, validates with amend-check (one retry), commits specs with Key Abstractions sync, files work beads, runs one coverage-amend round and an optional single design-roast round, and records disputes
R8 each loop has a redesign budget of 2 cycles; effective cap is passed to super-roast as config.iterationCap; thrash fires when a mechanical trigger meets a spent budget or a redesign round ends with more Blocking (lastGood breach)
R9 run-state.md defines the new fields, resume replays an interrupted redesign cycle, and contract-lint accepts the new fields
R10 report.md surfaces redesign records with triggers, disputed findings (a disputed Blocking stays unresolved) and redesign-budget-spent parks
R11 tests for findings-ledger, step-back-check and amend-check exist and are on CLAUDE.md's release test list
R12 a goal-changing (scope outside) redesign is parked in autonomous runs and offered in interactive runs; ## Goal is never edited
R13 an end-to-end fixture test drives findings-ledger output through step-back-check and amend-check and checks trigger tokens agree across the ledger, the prompt example and the checker
R14 no reference to the old skills/super-auto/scripts/step-back-check path remains
