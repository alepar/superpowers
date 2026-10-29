cl-1 · r1 · flag-sweep · super-plan-2s3 · kept as leaf — promotion overruled by split; super-roast half is super-plan-mlr.2, repair recording specified in spec §4.1(c)
cl-2 · r1 · flag-sweep · super-plan-row · kept as leaf — promotion overruled by split; caller half is super-plan-mlr.3, matching/linking defined in spec §4.4
cl-3 · r1 · flag-sweep · super-plan-v94 · kept as leaf — oldBase defined in spec §4.5 (existing both-exist base rule); one subsystem
cl-4 · r1 · GAP · R11 · rejected — already in super-plan-v94 and super-plan-zhk acceptance (close note keeps verified gap apart from unproven cause); report phase restates it
cl-5 · r1 · GAP · R10 · applied — super-plan-zhk retitled to a fix title; acceptance already delivers commit-step rule, Important severity and full-message inspection
cl-6 · r1 · GAP · tests registered in release list · applied — integration sweep super-plan-mlr.4 registers new test files in CLAUDE.md and runs the list
cl-7 · r1 · GAP · coordinator dryRun after v94 · rejected — replay-harness dryRun-count item already in super-plan-v94 and super-plan-2s3 acceptance
cl-8 · r1 · GAP · end-to-end review path · applied — integration sweep super-plan-mlr.4 runs producer→extract→collect→review-inputs→readiness round trip
cl-9 · r1 · UNOWNED-SEAM · report --complete grammar · applied — super-plan-mlr.1 owns it; rule decided in spec §4.1 so 2s3/mlr.2 run in parallel; sweep integrates; mlr.2 gets restated-rule parity test
cl-10 · r1 · UNOWNED-SEAM · review-inputs outOfRange · applied — super-plan-rsc owns field; super-plan-tco consumes, edge tco<-rsc
cl-11 · r1 · UNOWNED-SEAM · bookkeeping gap text · applied — super-plan-row owns kinds and text; super-plan-mlr.3 consumes, edge mlr.3<-row
cl-12 · r1 · UNOWNED-SEAM · repaired roast report file · applied — super-plan-mlr.2 owns naming and recording in roast-code:/roast-design: per spec §4.1(c)
cl-13 · r2 · GAP · R3 · applied — super-plan-mlr.1 owns line names report-verdict and assembly-archive.cjs strictDraft
cl-14 · r2 · GAP · R13 · applied — super-plan-mlr.2 acceptance: super-roast-workflow.md unchanged, else dryRun re-run with matching counts
cl-15 · r2 · GAP · R1 · rejected — super-plan-2s3 acceptance already names final, cluster and seam prompts
cl-16 · r2 · GAP · end-to-end repaired roast report · applied — sweep super-plan-mlr.4 scenario: malformed roast → repair → collect, original kept
cl-17 · r2 · GAP · R-new collection survives malformed report · rejected — existing report-status --collect records a per-source "complete extraction unavailable" gap and continues (inv-2s3 §4)
cl-18 · r2 · GAP · R11 · applied — sweep super-plan-mlr.4 close note lists unproven causes qualified
cl-19 · r2 · UNOWNED-SEAM · report --complete grammar · applied — 2s3/mlr.2 consume the spec §4.1 grammar as mlr.1 enforces it; sweep re-runs producer fixtures after mlr.1
cl-20 · r2 · UNOWNED-SEAM · reviewFileFormat vs grammar canonical · applied — parity test moved from mlr.2 to sweep super-plan-mlr.4
cl-21 · r2 · UNOWNED-SEAM · repaired roast report file · rejected — rsc relevance is path-only over run.md/sidecar/reviews; repair file is an ordinary changed path; sweep scenario covers collection
cl-22 · r2 · UNOWNED-SEAM · review-inputs status/gaps semantics · applied — super-plan-rsc owns semantics after range scoping
cl-23 · r2 · UNOWNED-SEAM · repair round readiness · applied — super-plan-mlr.2: format repair keeps the round's reviewReadiness unchanged
cl-24 · r2 · UNOWNED-SEAM · reconcile commits commit policy · applied — super-plan-v94: drift rebuild makes only fixed-message stack: merges, outside zhk scope
cl-25 · graph · GRAPH-EDGE · super-plan-tco <- super-plan-rsc · parked — drop would cut depth only with the mlr.3 edge too (3→2); safe no: tco consumes rsc's outOfRange field and both edit skills/super-auto/SKILL.md
cl-26 · graph · GRAPH-EDGE · super-plan-mlr.3 <- super-plan-row · parked — drop safe no: mlr.3 consumes row's gap message text; spec §4.4 fixes the text, so a drop is plausible but needs a human
cl-27 · amend-code-1 · flag-sweep · super-plan-mlr.10 · kept — super-code early-unblock review: bead (closed bookkeeping), flag inherited from its task
cl-28 · amend-code-1 · flag-sweep · super-plan-mlr.9 · kept — super-code early-unblock review: bead (closed bookkeeping), flag inherited from its task
cl-29 · amend-code-1 · unstated · super-plan-mlr.14 <- super-plan-mlr.3 · kept — coordinator-created review-bead edge (review: <id> blocked by its task by construction), closed
cl-30 · amend-code-1 · unstated · super-plan-mlr.13 <- super-plan-tco · kept — coordinator-created review-bead edge (review: <id> blocked by its task by construction), closed
cl-31 · amend-code-1 · unstated · super-plan-mlr.12 <- super-plan-mlr.6 · kept — coordinator-created review-bead edge (review: <id> blocked by its task by construction), closed
cl-32 · amend-code-1 · unstated · super-plan-mlr.11 <- super-plan-mlr.5 · kept — coordinator-created review-bead edge (review: <id> blocked by its task by construction), closed
cl-33 · amend-code-1 · unstated · super-plan-mlr.10 <- super-plan-2s3 · kept — coordinator-created review-bead edge (review: <id> blocked by its task by construction), closed
cl-34 · amend-code-1 · unstated · super-plan-mlr.9 <- super-plan-row · kept — coordinator-created review-bead edge (review: <id> blocked by its task by construction), closed
cl-35 · amend-code-1 · unstated · super-plan-mlr.8 <- super-plan-rsc · kept — coordinator-created review-bead edge (review: <id> blocked by its task by construction), closed
cl-36 · amend-code-1 · unstated · super-plan-mlr.7 <- super-plan-mlr.1 · kept — coordinator-created review-bead edge (review: <id> blocked by its task by construction), closed
cl-37 · amend-code-2 · GAP · mlr.28 (iii) count source · applied — mlr.28 consumes line: (ii) keeps the pre-## header (verdict line included) byte-identical to the original, so (iii)'s count is the original's; fixture: repair drops a finding and lowers its header → exit 4 (ii)
cl-38 · amend-code-2 · GAP · mlr.28 (iv) fold removal / finding content · rejected with rationale recorded on mlr.28 — every original line stays byte-identical and aligned (iv); a sibling finding fold is caught by the (iii) count; an unprefixed non-finding prose line folding into the next item is the spec §4.1(a) accepted residual
cl-39 · amend-code-2 · GAP · mlr.28 fixture continuity (mlr.16/21/23/26/27) · applied — mlr.28 acceptance names the converted mlr.27 rc_cf fixtures and keeps mlr.16/21/23/26 fixtures and byte-identical --complete
cl-40 · amend-code-2 · UNOWNED-SEAM · --repair-check (iii)/(iv) ownership after mlr.28 · applied — mlr.28 owns line; supersedes mlr.23 (iii) and mlr.27 (iv); mlr.21 keeps --classify and the other (iv) rules
cl-41 · amend-code-2 · ORPHAN · super-plan-mlr.27 / mlr.16 behaviour · applied — superseded through mlr.28's owns line (mlr.16 already replaced by mlr.21, cycle 1)
cl-42 · amend-code-2 · UNOWNED-SEAM · super-roast format-repair step text vs amended §4.1(c) · rejected — skills/super-roast/SKILL.md:229-239 cites only the --repair-check exit codes, not key equality or the fold rule; no text change needed
cl-43 · amend-code-2 · GAP · sweep / dryRun after mlr.15–mlr.28 · rejected — phase-6 sweep runs the full CLAUDE.md release list incl. replay-harness at the final SHA after every bead lands; coordinator.js dryRun scenarios (mlr.17/mlr.24 edits) run in phase 6 per CLAUDE.md, mlr.4 closed (as cycle-1's same finding)
cl-44 · amend-code-2 · UNOWNED-SEAM · mlr.3 <- mlr.6 edge without consumes line · rejected — both beads closed and landed; historical edge, no open work consumes it
cl-45 · amend-code-2 · GAP · review bead for mlr.28 · rejected — super-code's coordinator creates review: beads at dispatch by construction (cl-29..36)
