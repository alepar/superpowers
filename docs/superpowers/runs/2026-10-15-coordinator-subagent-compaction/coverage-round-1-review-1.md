requirements:
R1 → super-plan-goq.2, super-plan-goq.3, super-plan-goq.5, super-plan-goq.6
R2 → super-plan-goq.1, super-plan-goq.7
R3 → super-plan-goq.6
R4 → super-plan-goq.2, super-plan-goq.9, super-plan-goq.10
R5 → super-plan-goq.4, super-plan-goq.8, super-plan-goq.9, super-plan-goq.10
R6 → super-plan-goq.9, super-plan-goq.10
R7 → super-plan-goq.11
R8 → super-plan-goq.11
R9 → super-plan-goq.12, super-plan-goq.13, super-plan-goq.14
R10 → super-plan-goq.13
R11 → super-plan-goq.17
R12 → super-plan-goq.15, super-plan-goq.16
R13 → super-plan-goq.18, super-plan-goq.9, super-plan-goq.10, super-plan-goq.13
R-new: End-to-end check on each harness that a real or simulated compaction with a live marker yields the run block, and no marker yields unchanged output → (unmapped)
R-new: Codex coordinators' waits are shown not to trigger idle compaction or are explicitly out of scope → (unmapped)

findings (abridged; full text in the session):
GAP · R6 · no task owns the keepalive mechanism
GAP · R9 · improvised history/assess passes have no assembler consumer
GAP · super-plan-goq.9/.10 · wiring tasks have no deps on consumed scripts
GAP · R4 · no task named as prune caller
GAP · ledger-digest · no owner
GAP · R-new · end-to-end re-inject verification
GAP · R-new · Codex idle compaction scope
UNOWNED-SEAM · config.contextWindows
UNOWNED-SEAM · coordinator card content vs rules (.5 vs .8/.9/.10/.11)
UNOWNED-SEAM · path-handoff format (.8/.11)
UNOWNED-SEAM · marker session id (.2/.5/.6/.7/.9/.10)
NEEDS-SPEC: super-plan-goq.9 / super-plan-goq.10 — keepalive meaning
