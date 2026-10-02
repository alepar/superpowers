# super-auto maintenance notes

Maintenance-only: history, provenance and notes to editors for super-auto's runtime files, one heading per file; never loaded at runtime.

## Pointer syntax

A runtime file points at a rule's canonical home instead of restating it, copying the heading text exactly so the pointer can be checked by search:

- within a file: `§<Exact heading>`
- across files: `<file> §<Exact heading>`
- a numbered contract item: `run-state.md item <N> (<label>)`

## SKILL.md

- Removed the parenthetical "mismatched by construction on every handoff before this field existed" from phase 3's `integrationWorktree` note (F18).
- Removed "`super-roast` uses the report-location override added for this." from SKILL.md §Run directory (F19).
- Removed the clause tying the `skipPlanRoast` + `autonomous` flag precedence to the cheap validation run (F21).
- The local-checkout rule used to read "it exists on one machine only and says nothing about what this session loaded"; it now says it shows what is on disk, not what this session loaded (F26).
- Removed the whole `## Known limitations` section (F30): "Nothing enforces the workspace rule. Pre-flight creating the run's worktree and branch is the load-bearing assumption behind one `run.md`, an observable `base`, and a phase-7 merge that carries the whole run. Nothing checks it happened, and a run that skips it fails far downstream — at phase 7, with the report on an unmerged branch." And "Documented gaps, deliberately not fixed": "Gate order is convention, not enforcement. Nothing catches an agent that writes `phase: finish` before actually confirming phase 7's three conditions; the rule is evaluate, then write." and "Resume can't distinguish a stall from a plain interruption. Both leave `phase` at whatever was in flight; nothing marks *why* the run stopped there."
- Removed the separate "Hard stop, not a fallback" paragraph from SKILL.md §Pre-flight; its reason is folded into the tracker-check sentence.
- Removed the "Recorded decisions replay" paragraph from SKILL.md §Autonomous mode (replay only on an exact match, never widened into a blanket approval); run-state.md item 7 (Design decisions) is its one home.
- The closed stop list gained stop 4, the `capped-blocking` stop under `planOneShot` without `autonomous` (F3). The fix-bead flag triple moved from Red Flags to SKILL.md §Invariants I3 (F48, decision 5), and the human-owned merge rule's canonical home is SKILL.md §Invariants I5.
- The Resume section, the "Switching definitions mid-run" paragraph and the `design-review · pending` resume sentence moved to resume.md (F6); numeric counts that pointed at lists were removed (F46, F47, F50, F53).


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

- resume.md was split out of SKILL.md (F6, F12, F46). Run discovery stays prose because it runs once per invocation and is judgment (which candidates match), not a mechanical step worth a script.


## report-prompt.md

- Removed the status-form list and every status rule paragraph; `scripts/report-status` implements them now (F0). With them went their rationales: `[degraded: ...]` attaches to the `completed with ...` form too, because a `clean`-only suffix forced the qualifier to be dropped exactly where the reader was already being warned (F22); `<N>` and `<M>` count code outcomes, with `codeBuckets.escalated` in `<M>` and a non-empty `codeBuckets.parked` adding `code findings parked`, because roast-only counters let a run that skipped both roasts, quarantined a task and merged over a finding open as `clean [degraded: plan roast skipped, code roast skipped]` (F20); the paragraph on `clean [degraded: ...]` no longer meaning "nothing was left for a human", since autonomous mode can answer a sibling's gate on the human's behalf (F23); and the skipped-roast rationale: nothing was reviewed, so zero Blocking means "never checked".
- Removed the warning to future editors that letting `super-code` run its own Finish before `report` would cut off two sources, because the ledger and implementer reports live git-ignored inside the integration worktree (F24).
- Removed the "easy to lose in a rewrite" lead-in to the Smells section (F25).
- Replaced the "durable artifacts only" sourcing prohibition with report-prompt.md §Allowed sources, which lists every permitted source including the diff Entrypoints needs (F57, decision 2). The old text's reason survives: recollection and `super-code`'s non-durable return value are excluded because the drafter may not be the session that ran phase `code`.


## scope-filter-prompt.md


- The goal is no longer marked as data; only the roast findings text is (F40, decision 3). The Blocking and cluster paragraphs collapsed to one line because `scripts/scope-dispositions` is the gate (F35, F36, decision 4). The `Model: sonnet` line moved to the dispatch table in SKILL.md (F32, decision 7).
