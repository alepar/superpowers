requirements:
R1 → rl.1, rl.3, rl.4 (rules are written only for `qualified` records; no task produces a `qualified` record on a production path, so the rule is never written. See GAP R1/B1)
R2 → rl.1, rl.3, rl.4 (same shortfall as R1. See GAP R2/B1)
R3 → rl.3, rl.4, rl.5 (holds vacuously while no rule is written, because every command prompts. It holds by design once a form has rules)
R4 → rl.4, rl.5
R-new: A production path qualifies each command form. It resolves the binary the form runs, computes its SHA-256, confirms it is relay and records `Qualification.qualified(form, digest)` → (unmapped)
R-new: Qualification records persist between runs, and `relay setup` loads existing records instead of always recreating them as `pending` → (unmapped)
R-new: Before writing rules for a form, `relay setup` checks that the binary the form resolves to still matches the qualified digest. A mismatch counts as not `qualified` → (unmapped)

findings:

- **type:** GAP
  - **subject:** B1 (also R1, R2)
  - **evidence:** The human asked: "make sure the agent can run any `relay` command without prompting, except `relay human ...`". B1 says to allow both forms. S1 says "allows can wait until a qualification exists; publish no allow or prompt rule before then". S1 defers the allows until a qualification exists. It does not drop them, so some task has to make a qualification exist. The revision adds that prerequisite: rules are written only for a record whose state is `qualified`. Only one place in the tree constructs a `qualified` record. rl.5 does it in a test: "a test builds `qualified` records ... with `Qualification.qualified`". That is a test-only constructor. rl.2 only defines the constructor and never calls it. rl.4 creates only `pending` records ("`relay setup` creates a `pending` record for each command form"). No task computes a SHA-256 digest of a binary, checks it, or records a qualified state. Premortem: every task ships exactly as written, the user runs `relay setup`, and it prints "awaiting qualification" for both forms forever. The agent is prompted on every relay command, in both forms, permanently. R1 and R2 are never delivered in production. The author's accounting reads "Once a record is `qualified`, rl.3 builds ... and rl.4 writes them". That describes a state nothing in the tree can reach.
  - **proposed fix:** Add a new subepic under rl, "Qualify command forms", which needs design. It needs a production producer, for example a `relay qualify` command or a qualification step inside setup. That producer resolves each form to its binary (the real path of `install_path`, and whatever `relay` resolves to on `PATH`), computes the SHA-256, confirms it is the relay binary that is running, and records `Qualification.qualified(form, digest)`. Add an acceptance line: after qualification, `relay setup` writes the allow and `human` prompt rules for both forms.

- **type:** GAP
  - **subject:** B1. `run_setup` discards any qualification (R1, R2)
  - **evidence:** rl.4 says setup "creates a pending qualification record per command form, builds the rule set from the records and writes it". The root spec says the same: "creates their qualification records, builds the rule set from the records". Records are created fresh as `pending` on every run, and `build_rules` is fed those same records. Suppose a qualification producer is added. Setup would still overwrite or ignore its result and build from `pending` records, so no rule is ever written. No task loads previously qualified records, and none says where records are stored.
  - **proposed fix:** Add a new leaf under rl. Records are persisted, for example in `~/.config/relay/` next to config.json, by a named owner. rl.4 is reworded to load existing records and create a `pending` record only for a form that has none. Acceptance: a form with an existing `qualified` record keeps it across `relay setup`, and its rules are written.

- **type:** UNOWNED-SEAM
  - **subject:** Qualification record storage (rl.4 writes it; the qualification producer and later setup runs read it)
  - **evidence:** rl.4 "creates a `pending` record for each command form", and the root spec says rules are "tied to a qualification record". That implies a record outlives one setup run so that it can later become `qualified`. No `owns:` line names a storage location or format. rl.2 owns only the in-memory type `Qualification(form, state, digest)`.
  - **proposed fix:** Add a seam contract for the qualification record store: path, serialization, and the key (per form). Owners: rl.2 or the new qualification subepic.

- **type:** GAP
  - **subject:** The security intent of the digest is not enforced (R2, plus the root spec's §Qualification)
  - **evidence:** The root spec says "a `qualified` record carries the SHA-256 digest of the binary its qualification confirmed". The review's concern was that `install_path` "can name a different binary than the relay the agent runs". No task compares the digest against the binary currently at the form's path when rules are built or written. rl.3's acceptance line only requires state `qualified`: "a `qualified` record for form F gives a prompt rule ... and an allow rule". If the binary at the path is replaced after qualification, the allow rule still applies, and the fix the revision exists for does nothing. The same applies to bare `relay`, which resolves through `PATH` at runtime, so its digest cannot be bound to a static rule at all. No task addresses what qualifying bare `relay` means.
  - **proposed fix:** Add a leaf under rl, or include it in the new qualification subepic. `build_rules` or `run_setup` treats a record as qualified only when the SHA-256 of the binary the form currently resolves to equals `digest`. Specify what qualification of the bare `relay` form binds to, which needs design.

- **type:** GAP
  - **subject:** R2. The spelling of the absolute path
  - **evidence:** rl.1: "`command_forms(install_path)` returns `relay` and the real path of `install_path`". The human asked for "any `relay` command" and B1 asks for "the installed absolute path". If `install_path` is a symlink (common with package-manager installs), the agent may invoke the symlink path rather than its real path. A rule `<realpath> *` does not match that invocation, so it prompts. No task or acceptance line covers the agent invoking `install_path` as written.
  - **proposed fix:** Add an acceptance line to rl.1: when `install_path` differs from its real path, both spellings are listed as forms. Otherwise, record the design decision that the agent always invokes the real path.

- **type:** GAP
  - **subject:** R4 and the root spec §Setup. Rule ownership marking
  - **evidence:** rl.4 says it "replaces only relay-owned rules and leaves rules of other tools unchanged". The root spec says it removes "every rule whose owner is `relay`". rl.3's `build_rules` "return[s] the rules", but no line says the rules carry the `relay` owner marker. If they don't, a second run cannot identify its own earlier rules. That breaks idempotence and could leave stale allow rules behind after a form becomes un-qualified.
  - **proposed fix:** Add an acceptance line to rl.3: every rule `build_rules` returns carries owner `relay`. Add one to rl.4: a previously written relay allow rule is removed when its form is no longer `qualified`.

- **type:** UNOWNED-SEAM
  - **subject:** Rule representation and owner tag between rl.3 (producer) and rl.4 (writer to the permissions file)
  - **evidence:** rl.3 "owns: build_rules(records) returning the rules and the forms left without rules". rl.4 "consumes ... build_rules(records) from rl.3" and must write rules to the harness permissions file with relay ownership. The shape of a rule (pattern, kind prompt/allow, owner) and how it serializes into the permissions file are not named in any `owns:` line.
  - **proposed fix:** Add a seam contract for the rule object and its permissions-file serialization, including the owner field. Owner: rl.3.

- **type:** GAP
  - **subject:** rl.5 acceptance text is malformed, and its test coverage misses the end-to-end path
  - **evidence:** rl.5's second line ends "and keeps other tools' rules` acceptance lines beneath it]", which is truncated or template residue, so the acceptance line cannot be checked as written. No test covers the production path where a qualified form gets rules through `run_setup`. Qualified rules are tested only through `build_rules`, with records built in the test. No test runs `run_setup` twice to check that the file is identical (R4).
  - **proposed fix:** Fix the rl.5 acceptance text. Add an acceptance line: `run_setup` with a persisted `qualified` record whose digest matches writes both rules for that form. Add another: running `run_setup` twice yields an identical file.

- **type:** GAP
  - **subject:** Previous round's fix (the root spec revision), check 4
  - **evidence:** The revision answers the security finding by withholding rules. It closes that finding only by making R1 and R2 unreachable. It opens the producer gap and the storage seam above, and it adds a digest that nothing checks. The author's B1 accounting ("changed ... as S1 directs") counts S1 as covering the shortfall. But S1 is conditional ("until a qualification exists"), and the tree has no path by which a qualification ever exists.
  - **proposed fix:** As in the first four findings: a qualification subepic, record persistence, and a digest check.
