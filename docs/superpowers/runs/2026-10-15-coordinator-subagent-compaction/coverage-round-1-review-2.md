requirements:
R1 → super-plan-goq.2, super-plan-goq.3, super-plan-goq.5, super-plan-goq.6, super-plan-goq.9, super-plan-goq.10
R2 → super-plan-goq.1, super-plan-goq.7
R3 → super-plan-goq.6, super-plan-goq.7
R4 → super-plan-goq.2, super-plan-goq.9, super-plan-goq.10
R5 → super-plan-goq.4, super-plan-goq.8, super-plan-goq.9, super-plan-goq.10
R6 → super-plan-goq.9, super-plan-goq.10
R7 → super-plan-goq.11
R8 → super-plan-goq.11
R9 → super-plan-goq.12, super-plan-goq.13, super-plan-goq.14
R10 → super-plan-goq.13, super-plan-goq.14
R11 → super-plan-goq.17
R12 → super-plan-goq.15, super-plan-goq.16
R13 → super-plan-goq.18, super-plan-goq.9, super-plan-goq.10, super-plan-goq.13
R-new: A coordinator can learn its own harness session id so it registers the marker under the key the hook later looks up → (unmapped)
R-new: End-to-end check on each harness that a compaction during a live run injects the run block (and no marker means unchanged output) → (unmapped)

findings (abridged; full text in the session):
GAP · R9 · improvised history/assess passes not wired to the assembler
GAP · R-new · coordinator session id for the marker key
GAP · R-new · end-to-end re-inject; wiring tasks lack deps on consumed scripts
UNOWNED-SEAM · config.contextWindows
UNOWNED-SEAM · child report file format (.4/.8/.13)
UNOWNED-SEAM · ledger-digest
GAP · R3 · fallback/passthrough not named in .6/.7 lines
NEEDS-SPEC: super-plan-goq — marker key definition; whether ledger-digest exists
