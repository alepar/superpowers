requirements:
R1 → rl.1, rl.3, rl.4, rl.5 (delivered only once a `qualified` record exists for bare `relay`; no task produces one in production, see GAP R1/B1)
R2 → rl.1, rl.3, rl.4, rl.5 (same dependency on a `qualified` record for the absolute path; see GAP R2/B1)
R3 → rl.3, rl.4, rl.5
R4 → rl.4, rl.5
R-new: A supported production path qualifies a command form: it confirms the binary the form resolves to is the relay the agent runs, records its SHA-256 digest and produces `Qualification.qualified(form, digest)` → (unmapped)
R-new: Qualification records persist between `relay setup` runs, and setup reads existing records instead of resetting every form to `pending` → (unmapped)
R-new: A qualified form's rules stop applying when the binary at that form no longer matches the qualified digest (the security review's threat, a different binary at `install_path`, is otherwise only deferred, not closed) → (unmapped)
R-new: The `relay` owner marker on written rules is defined in one place, so setup's "remove every rule whose owner is `relay`" step matches the rules `build_rules` produces → rl.3, rl.4 (no owner named; see UNOWNED-SEAM)

---

- **type:** GAP
- **subject:** B1 (and R1, R2)
- **evidence:** The human asked: "make sure the agent can run any `relay` command without prompting, except `relay human ...`". B1 asks to "allow every relay command form the agent uses, bare `relay` and the installed absolute path". S1 defers allows only "until a qualification exists". It does not drop them. The revision makes rules conditional on a `qualified` record. The only production path that creates records is rl.4: "`relay setup` creates a `pending` record for each command form". No task produces a `qualified` record on a production path. `Qualification.qualified(form, digest)` (rl.2) is called only in the rl.5 test ("a test builds `qualified` records ... with `Qualification.qualified`"). No task verifies a binary, computes a digest or marks a form qualified. So if every task succeeds as written, `build_rules` in production always receives only `pending` records. It returns every form "left without rules", and setup writes no allow rule for either form, ever. The agent is prompted for every relay command, in both forms, permanently. S1 permits "no allow ... before then". It does not cover a tree in which "then" can never arrive. A test-only constructor is not a producer. The accounting's claim, "Once a record is `qualified`, rl.3 builds an allow rule ... and rl.4 writes them", describes a state that no task can reach.
- **proposed fix:** New subepic needing design under rl, "Form qualification". It defines how each form is qualified: who or what confirms the binary, and whether that is a `relay qualify` command, a step inside setup, or a human-approved step. It also covers how the SHA-256 digest is computed for bare `relay`, which resolves through `PATH`, and for the real path of `install_path`. Its acceptance: running the supported flow and then `relay setup` writes `F human *` and `F *` for each qualified form. Also add an end-to-end test under rl.5 that runs the real qualification flow, not `Qualification.qualified` directly, and checks that setup writes the allow and prompt rules for both forms.

- **type:** GAP
- **subject:** R-new: qualification records persist between setup runs
- **evidence:** rl.4: "Rework `run_setup` ... so setup creates a pending qualification record per command form, builds the rule set from the records and writes it". The root spec says the same: "`relay setup` lists the command forms, creates their qualification records, builds the rule set from the records". No task stores records, loads existing ones, or keeps a `qualified` record across runs. Suppose a qualified record were produced somewhere. Each `relay setup` still creates fresh `pending` records and builds rules only from those, so it would discard the qualification and remove the form's rules. No task owns a storage location or format for records, so a producer and setup could not exchange them in any case.
- **proposed fix:** Add a leaf under rl, or fold it into the qualification subepic, that owns a record store (location and format). Amend rl.4 so setup loads the stored record for each form and creates a `pending` record only when none exists. Acceptance: with a stored `qualified` record for F, `relay setup` writes F's rules, and running it twice gives the same file.

- **type:** GAP
- **subject:** R-new: rules are bound to the qualified digest (security review closure)
- **evidence:** Root spec §Qualification: "the absolute path comes from `install_path` in the config file, which can name a different binary than the relay the agent runs; an allow rule for that path would then let the agent run that other binary without a prompt." A `qualified` record "carries the SHA-256 digest". No task ever compares that digest with the binary currently at the form's path. rl.3 only checks that the state is `qualified`, and the harness rule `F *` is path-based. If the binary at `install_path` changes after qualification, `F *` still allows it without a prompt, which is the exact threat the review raised. Bare `relay` resolves through `PATH` and has the same exposure, and the spec does not address it.
- **proposed fix:** Add acceptance to rl.3 or rl.4: a `qualified` record whose digest does not match the current binary at that form is treated as not qualified, so the form gets no rule and is reported as awaiting qualification. Add a test under rl.5 for the mismatch case.

- **type:** GAP
- **subject:** B1 — end-to-end path
- **evidence:** The premortem check is whether some thin set of tasks runs end to end. The production path is rl.1 → rl.4 (pending) → rl.3 → write, and it always ends in "F awaiting qualification; no rules written". The only path that yields rules is rl.5's test, which injects `Qualification.qualified` records directly into `build_rules`. Its second acceptance line also contains stray text: "keeps other tools' rules` acceptance lines beneath it]". That line looks truncated or malformed, so it cannot be checked as written. No acceptance line anywhere asserts that a production `relay setup` yields an allow rule.
- **proposed fix:** Repair the rl.5 acceptance line. Add an end-to-end acceptance, under the qualification subepic above, that goes from qualification to `relay setup` to an allow rule for `relay` and for the absolute path, plus the `human` prompt rule for each.

- **type:** UNOWNED-SEAM
- **subject:** The `relay` rule-owner marker (rule format produced by `build_rules` and matched by setup's removal step)
- **evidence:** rl.3 owns "build_rules(records) returning the rules". rl.4 must replace "only relay-owned rules and leaves rules of other tools unchanged", and the spec says "first removing every rule whose owner is `relay`". The rules rl.3 builds must carry the owner tag that rl.4's removal step recognizes. Neither task's `owns:` line names that owner field or its value. If they disagree, R4 breaks: rule removal fails, which duplicates rules and breaks idempotence, or it removes another tool's rules.
- **proposed fix:** Contract the rule shape, including the owner field and the value `relay`, in rl.3's `owns:` line. Alternatively, add a "Seam contract: relay rule owner marker" leaf under rl that both rl.3 and rl.4 consume.

- **type:** UNOWNED-SEAM
- **subject:** The qualification record store (between a qualification producer and rl.4 setup)
- **evidence:** rl.2 owns the record type: "Qualification(form, state, digest)". rl.4 consumes "Qualification.pending from rl.2". The spec implies that a `qualified` record reaches setup: "For each command form F whose qualification record is `qualified`, setup writes ...". For that to happen, something must hand records to setup. No task owns where records live or how they are serialized. This is the dataflow boundary behind the persistence GAP.
- **proposed fix:** Assign ownership of the record store (path and serialization) to rl.2 or to the new qualification subepic, and list it under rl.4's `consumes:`.

NEEDS-SPEC: rl — how a form becomes `qualified` (who confirms the binary, how the digest is taken for the PATH-resolved `relay`, where records persist); the Goal and the revision diff define the record but never a producer.
