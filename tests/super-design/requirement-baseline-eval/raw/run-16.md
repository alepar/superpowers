requirements:
R1 → rl.1, rl.3, rl.4 (only reachable once a `qualified` record exists; no production task produces one, see GAP B1)
R2 → rl.1, rl.3, rl.4 (same caveat as R1)
R3 → rl.3, rl.4 (holds vacuously while every form is `pending`; holds by rule once `qualified`)
R4 → rl.4 (test coverage partial in rl.5, see GAP R4)
R-new: A production path turns a form's `pending` qualification record into a `qualified` one: it computes the SHA-256 digest of the binary the form resolves to, confirms that binary is the relay the agent runs, and records the result → (unmapped)
R-new: Qualification records persist between `relay setup` runs, so a `qualified` record survives the next setup instead of being re-created as `pending` → (unmapped)
R-new: When the binary behind a qualified form changes (its digest no longer matches), the form's allow rule is withdrawn or re-qualified → (unmapped)

- **type:** GAP
  **subject:** B1 (also R1, R2)
  **evidence:** Human: "make sure the agent can run any `relay` command without prompting, except `relay human ...`". S1 defers this only "until a qualification exists"; it does not drop it. The revision makes rules conditional on a `qualified` record, but the only producer of a `qualified` record in the tree is `Qualification.qualified(form, digest)`, a constructor (rl.2) that is called only by a test (rl.5: "a test builds `qualified` records ... with `Qualification.qualified`"). rl.4 creates only `pending` records ("`relay setup` creates a `pending` record for each command form"). No task computes a digest, runs a qualification, or turns a `pending` record into `qualified` on a production path. If every task succeeds exactly as written, `relay setup` in production writes no relay rules ever, and the agent is prompted for every relay command in both forms forever. The author's accounting ("Once a record is `qualified`, rl.3 builds an allow rule ... and rl.4 writes them") assumes a state that nothing in production reaches. This is a test-only constructor standing in for the prerequisite the revision adds.
  **proposed fix:** New subepic under rl needing design: "Qualify command forms" — define how a form becomes `qualified` (compute SHA-256 of the real path of the form's binary, confirm it is the relay the agent runs, e.g. matches the running relay's own binary or a digest the installer records), what triggers it (setup itself, the installer, or a `relay qualify` command), and have rl.4 consume its output instead of always creating `pending`. Add an end-to-end acceptance: on a clean install, `relay setup` followed by the agent running `relay status` and `<abs path> status` gives no prompt, and `relay human ...` prompts.

- **type:** GAP
  **subject:** Qualification record persistence (B1, R1, R2, R4)
  **evidence:** rl.4: "setup creates a pending qualification record per command form, builds the rule set from the records and writes it". No task owns storing records or reading existing ones. Even if a qualification step existed, the next `relay setup` would re-create every record as `pending` and, via rl.3 ("a record that is not `qualified` gives no rule"), remove the relay rules it had written, since rl.4 "replaces only relay-owned rules". R4's "running it twice gives the same file" would then hold only because both runs write nothing.
  **proposed fix:** New leaf under rl (or part of the qualification subepic): persist qualification records (location and format owned by one task); rl.4 loads an existing record per form and creates `pending` only for forms that have none.

- **type:** GAP
  **subject:** Security intent of the revision (digest is never checked)
  **evidence:** Root spec revision: "the absolute path comes from `install_path` in the config file, which can name a different binary than the relay the agent runs". A `qualified` record "carries the SHA-256 digest of the binary its qualification confirmed", but no task compares that digest to the binary currently at the form's path, either at setup time or later. If the config's `install_path` is changed to another binary after qualification, the allow rule `F *` stays and the hazard the security review named returns. Bare `relay` resolves through `PATH` and has the same exposure.
  **proposed fix:** Leaf in the qualification subepic: at setup, a `qualified` record whose digest does not match the current binary at the form's real path is treated as not `qualified` (no rules, notice printed); acceptance test changes the binary and checks the rules are withdrawn.

- **type:** GAP
  **subject:** R4 (test coverage) and rl.5 acceptance
  **evidence:** rl.5's second acceptance line is malformed: "checks it writes no relay rule while records are `pending`, prints the notice and keeps other tools' rules` acceptance lines beneath it]" — the text is truncated or a template leak, so its checkable content is unclear. No rl.5 line tests "running it twice gives the same file" (R4, rl.4's third acceptance line), and no test runs `run_setup` with `qualified` records and checks it writes both forms' allow and `human` prompt rules, so the end-to-end path R1/R2 depend on is untested at the setup level.
  **proposed fix:** Rewrite rl.5's acceptance lines: (a) `run_setup` twice gives an identical file; (b) `run_setup` with `qualified` records for both forms writes `F human *` and `F *` for each and keeps other tools' rules; (c) the pending case as now, with the malformed text removed.

- **type:** UNOWNED-SEAM
  **subject:** Rule representation and relay ownership marker between rl.3 and rl.4
  **evidence:** rl.3 "owns: build_rules(records) returning the rules and the forms left without rules"; rl.4 "replaces only relay-owned rules and leaves rules of other tools unchanged"; root spec: "first removing every rule whose owner is `relay`". rl.4 writes rules rl.3 produces and must later recognise them as relay-owned, but no owns line names the rule shape (kind prompt/allow, pattern, owner field) or who sets `owner = relay`.
  **proposed fix:** Contract the rule record: fields, the `relay` owner tag, and whether rl.3 or rl.4 attaches it; name it in rl.3's owns line.

- **type:** UNOWNED-SEAM
  **subject:** `install_path` from `~/.config/relay/config.json` into `run_setup`
  **evidence:** Root spec: "The absolute path is the real path of `install_path` in `~/.config/relay/config.json`, which the installer writes." rl.4 owns `run_setup(settings_path, install_path, out)` and rl.1 owns `command_forms(install_path)`, but no task owns reading the config file and passing `install_path` to setup, nor the behavior when the key is missing. If existing code already does this, the task lines do not say so.
  **proposed fix:** Name the config read (file, key, missing-key behavior) in rl.4's owns line, or confirm it is existing unchanged code.

- **type:** GAP
  **subject:** Previous round's fix (root spec revision adding Qualification)
  **evidence:** The revision closes the security finding by withholding rules, but opens the producer gap above: it introduces `qualified` as a prerequisite for B1 and assigns its creation to nothing on a production path. Under S1 the deferral is legitimate only if a qualification can come to exist; as written it cannot.
  **proposed fix:** Same as GAP B1: the qualification subepic.
