# super-auto maintenance notes

Maintenance-only: history, provenance and notes to editors for super-auto's runtime files, one heading per file; never loaded at runtime.

## Pointer syntax

A runtime file points at a rule's canonical home instead of restating it, copying the heading text exactly so the pointer can be checked by search:

- within a file: `§<Exact heading>`
- across files: `<file> §<Exact heading>`
- a numbered contract item: `run-state.md item <N> (<label>)`

## SKILL.md


## run-state.md

- The cap-in-session-memory blockquote ("A cap that lives in session memory is not a cap: if a restart resets the counter, the cap-3 loop can run indefinitely") was removed from item 5 as the rationale behind per-round persistence; item 5 now states the persistence and its one-clause reason (F45).
- The rationale for recording parked items mode-independently was cut to one clause: recording only the autonomous answers would let an interactive run decline a panel-cap re-roast, proceed, and still report a bare `clean`, the outcome the status line exists to prevent.
- The rationale for overwriting `codeBuckets` on every fix-loop re-entry was trimmed: keeping only the first run's buckets left every fix bead out of the report's Implemented section and every fix-loop quarantine out of its escalation count, which is how a run reports `clean` over an escalation.
- The full "Do not wait for the return" recipe was replaced by the judgment plus the overwrite-with-returned-fields rule (F2): phase 3 is the longest stretch of a run, a return-only write records nothing across it, so a session ending inside phase 3 resumed knowing only `phase: code`; the tracker refresh keeps the same fields written more often, not a second schema.
- The "There is no second convention to pick between" rationale was folded into "one convention, so two writers produce compatible files".
- The "pointer invented to look tidy" narrative (`design.md`, `roast-code-1.md` as dangling pointers that leave report sections thinner than the run) was cut down to the one-clause reason in item 3.
- The second "no plan pointer" copy in item 3 was deleted, keeping one canonical statement (systemic 2-3).
- The worked example's intro said it was taken from a real run, and its `codeBuckets` showed a full-suite `sweep` result before phase 6, contradicting item 6 (F29, F44). It is now labelled illustrative and shows `SWEEP DEFERRED (caller-owned)` with an empty `slowness:`.

## resume.md


## report-prompt.md


## scope-filter-prompt.md

