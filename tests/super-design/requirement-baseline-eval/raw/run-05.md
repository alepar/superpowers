requirements:
R1 → (unmapped) — rl.3 and rl.4 write the bare `relay` allow rule only for a `qualified` record, and no production task ever produces one; only rl.5's test constructs `Qualification.qualified`
R2 → (unmapped) — same reason for the installed absolute path form
R3 → rl.3, rl.4, rl.5 (held vacuously in production: no rules are written, so every relay command prompts, including `human`)
R4 → rl.4, rl.5
R-new: Some production path (`relay setup` or a named qualify command) computes the SHA-256 of the binary each command form resolves to, checks it against the intended relay binary, and moves that form's record from `pending` to `qualified` → (unmapped)
R-new: Qualification records persist between the step that qualifies a form and the `relay setup` run that builds rules from them, so setup reads existing `qualified` records and does not reset them to `pending` → (unmapped)
R-new: At least one end-to-end path runs setup → records `qualified` → rules written → agent runs `relay <cmd>` in both forms without a prompt and `relay human ...` prompts → (unmapped)

- **type:** GAP
  - **subject:** B1
  - **evidence:** The human said: "make sure the agent can run any `relay` command without prompting, except `relay human ...`". B1 says: "allow every relay command form the agent uses, bare `relay` and the installed absolute path". The revision adds a prerequisite: rules are written only for a form "whose qualification record is `qualified`". No task produces a `qualified` record on a production path. rl.2 only defines the constructor `Qualification.qualified(form, digest)`. rl.4 "creates a `pending` record for each command form, builds the rule set from the records and writes it". So on every real run every record is `pending`, `build_rules` returns no rules, and setup prints "awaiting qualification; no rules written" for both forms. The only call to `Qualification.qualified` is in rl.5's test ("a test builds `qualified` records ... with `Qualification.qualified`"), and that is a test-only constructor. rl.5's second acceptance line asserts the shipped behavior: setup "writes no relay rule while records are `pending`". If every task succeeds exactly as written, the agent is prompted for every relay command in both forms. That is a regression from the pre-revision design, which wrote `F *` for both forms, and it is the opposite of the request. The author's note that B1 is "preserved ... once each form's qualification record is `qualified`" depends on a condition that nothing in the tree brings about. No human scope change row covers dropping the behavior.
  - **proposed fix:** Add a new subepic needing design under rl: "Qualify command forms". It covers resolving each form to its binary (`PATH` lookup for bare `relay`, real path of `install_path` for the absolute form), computing the SHA-256, deciding what the digest is checked against (the binary the installer installed, or a digest the installer records), and producing `Qualification.qualified(form, digest)` on the `relay setup` production path. Amend rl.4 so setup builds rules from those qualified records and not from freshly created `pending` ones. Amend rl.5 to cover the qualified path through `run_setup` itself, not only through `build_rules`.

- **type:** GAP
  - **subject:** R1
  - **evidence:** R1 needs an allow rule `relay *` written by `relay setup`. rl.3 writes it only for a `qualified` record, and rl.4 feeds `build_rules` only `pending` records ("creates a `pending` record for each command form, builds the rule set from the records"). No task delivers R1 in production.
  - **proposed fix:** Same as the B1 finding: a qualification-producing subepic, with rl.4 consuming its output.

- **type:** GAP
  - **subject:** R2
  - **evidence:** Same as R1, for the installed absolute path. This form is also the one the security review targets, and no task ever computes or checks a digest for it. The `digest` field is defined (rl.2) but never filled from a real binary.
  - **proposed fix:** Same as the B1 finding. The qualify step must hash the real path of `install_path` and compare the result against the intended relay binary.

- **type:** GAP
  - **subject:** R-new: qualification check exists at all
  - **evidence:** The security concern in the root spec is that `install_path` "can name a different binary than the relay the agent runs". The tree carries a `digest` field but has no task that computes a SHA-256 of any binary, defines the trusted reference digest, or compares the two. The safety repair is therefore not implemented either: what the tree delivers is "never write rules", not "write rules only for verified binaries".
  - **proposed fix:** Fold this into the "Qualify command forms" subepic. Its spec must name the trusted reference, for example a digest the installer writes alongside `install_path`.

- **type:** GAP
  - **subject:** R-new: record persistence / setup idempotence with qualified records
  - **evidence:** rl.4 says "`relay setup` creates a `pending` record for each command form". Nothing stores records or reads existing ones. Even if a later step qualified a form, the next `relay setup` would recreate it as `pending` and drop its rules. rl.4 also promises that "running it twice gives the same file", which conflicts with this. No task owns where records live.
  - **proposed fix:** Add a leaf under the new qualification subepic (or amend rl.2) that owns record storage and load: path, format, and the rule that setup keeps an existing `qualified` record whose digest still matches.

- **type:** GAP
  - **subject:** end-to-end thin path
  - **evidence:** No task runs setup through to an actual rule write for either form. rl.5's `run_setup` test checks only the `pending` / no-rules branch. The qualified branch is tested only at `build_rules`, with hand-built records. No acceptance line checks the written permissions file against harness precedence: `relay human x` prompts and `relay status` is allowed in both forms.
  - **proposed fix:** Add a leaf under rl: an end-to-end test that runs `relay setup` against a real installed binary, then checks the written file contains `F human *` prompt and `F *` allow for both forms and that other tools' rules are unchanged.

- **type:** UNOWNED-SEAM
  - **subject:** qualification record store, between the producer of `qualified` records (missing) and rl.4 `run_setup`
  - **evidence:** rl.4: "creates a pending qualification record per command form, builds the rule set from the records". rl.2: "the qualification record that rules for a form are tied to". The records must outlive a single setup run for a `qualified` state to reach `build_rules`. Neither rl.2's `owns:` (the dataclass and its constructors) nor rl.4's `owns:` (`run_setup`) names the persisted format or location.
  - **proposed fix:** Contract the record store (location, serialization, and load/save API) in a seam task owned by rl.2 or the new qualification subepic, with rl.4 consuming it.

- **type:** UNOWNED-SEAM
  - **subject:** `build_rules` "forms left without rules" return shape, between rl.3 and rl.4
  - **evidence:** rl.3 owns "build_rules(records) returning the rules and the forms left without rules". rl.4 must iterate that second value to print "`relay setup: F awaiting qualification; no rules written`". The return shape (tuple order, type, and whether F is the form string) is named only loosely. This is lower risk because rl.3's `owns:` line does mention it.
  - **proposed fix:** Pin the return type in rl.3's `owns:` line, for example `-> (rules: list[Rule], unruled: list[str])`.

- **type:** GAP
  - **subject:** rl.5 acceptance text is malformed
  - **evidence:** rl.5's second line ends "...prints the notice and keeps other tools' rules` acceptance lines beneath it]". It looks like template residue, the line is truncated, and it does not state the idempotence check (R4 "same file when run twice") that rl.4 promises.
  - **proposed fix:** Rewrite the line: "a test runs `run_setup` twice and checks other tools' rules are unchanged and the file is identical". Also add the qualified-branch `run_setup` check.

- **type:** GAP
  - **subject:** rl.1 bare `relay` form qualification
  - **evidence:** The root spec gives bare `relay` as "found on `PATH`". The same substitution risk the review raised for `install_path` applies to whatever `relay` resolves to on `PATH`, but rl.1 lists the form only as the literal string `relay`. No task defines which binary the bare form's digest is taken from.
  - **proposed fix:** In the qualification subepic, specify how the bare form is resolved for hashing, for example `shutil.which("relay")` at setup time, and what happens when it differs from `install_path`.
