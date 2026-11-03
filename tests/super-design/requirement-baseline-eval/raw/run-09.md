requirements:
R1 → (unmapped) — rl.1, rl.3, rl.4 produce rules for bare `relay` only from a `qualified` record, and no production task ever produces one
R2 → (unmapped) — same: the absolute-path form never reaches `qualified` on any production path
R3 → rl.3, rl.4, rl.5 (holds trivially today because no rules are written at all; the `F human *` prompt rule only matters once a form is qualified)
R4 → rl.4, rl.5
R-new: A production qualification step confirms that each command form resolves to the intended relay binary, computes its SHA-256 digest and marks the record `qualified`, so setup can write rules for it → (unmapped)
R-new: Qualification records persist between runs, so a second `relay setup` neither discards an earlier qualification nor changes the permissions file → (unmapped)
R-new: The rule pattern for the absolute-path form matches the path the agent actually types (the installed path, which may be a symlink) and not only its resolved real path → rl.1 (partial; see GAP below)

- **type:** GAP
  - **subject:** B1 (also R1, R2)
  - **evidence:** Human: "make sure the agent can run any `relay` command without prompting, except `relay human ...`". B1: "allow every relay command form the agent uses, bare `relay` and the installed absolute path". The revision adds a prerequisite: "For each command form F whose qualification record is `qualified`, setup writes ... A form whose record is not `qualified` gets no rule". The only producer of records on a production path is rl.4: "`relay setup` creates a `pending` record for each command form". `Qualification.qualified(form, digest)` is constructed only in rl.5, a test: "a test builds `qualified` records ... with `Qualification.qualified`". No task computes a digest, checks the binary, or moves a record from `pending` to `qualified`. If every task succeeds exactly as written, `relay setup` always prints "awaiting qualification; no rules written" for both forms and writes no allow rule, so every relay command prompts. That is the opposite of the request. rl.5's second acceptance line even asserts this state ("writes no relay rule while records are `pending`"), and no test runs setup end to end and gets an allow rule. The author's "preserved ... once each form's qualification record is `qualified`" claim depends on a step that has no producer. The revision is not a safety repair that keeps the behavior working, and no human scope change row covers dropping the behavior.
  - **proposed fix:** Add a new subepic needing design, "Qualify command forms", under rl. It defines how a form is confirmed to run the intended relay binary (for example, resolve bare `relay` on `PATH` and the real path of `install_path`, check that both are the binary setup is running from or one the installer recorded, then compute SHA-256). It must own a production function that returns `Qualification.qualified(form, digest)`, and it must be called from `run_setup`, or from a documented `relay qualify` command that setup invokes or tells the user to run. Amend rl.4 so that a qualified form gets its rules in the same run. Add an rl.5 acceptance line: on a correct install, `run_setup` with no test-built records writes allow rules and `human` prompt rules for both forms.

- **type:** GAP
  - **subject:** Qualification digest is never verified (the security repair is incomplete)
  - **evidence:** Root spec: "a `qualified` record carries the SHA-256 digest of the binary its qualification confirmed". The stated threat: "`install_path` ... can name a different binary than the relay the agent runs". No task reads the digest. Nothing re-checks the binary against the digest at setup or later, and nothing detects the binary at the path being replaced after qualification. Even with a qualification producer, an allow rule on a path keeps allowing whatever binary later sits at that path. `Qualification(form, state, digest)` in rl.2 carries a field no task consumes.
  - **proposed fix:** As part of the qualification subepic above, define where the digest is checked: at minimum, on every `relay setup` run, recompute the digest and drop the form's rules (back to `pending`) on a mismatch. Otherwise, remove `digest` from rl.2.

- **type:** GAP
  - **subject:** R4 / qualification persistence (idempotence)
  - **evidence:** rl.4: "`relay setup` creates a `pending` record for each command form" on every run. No task owns where records are stored or how they are loaded. If records are persisted, a second run overwrites any `qualified` record with `pending` and removes the rules the first run wrote. That violates "running it twice gives the same file" whenever the first run wrote rules. If records are not persisted, qualification cannot outlive one run. Either way no task defines this.
  - **proposed fix:** In the qualification subepic, add a leaf that owns record storage (location and format) and makes setup create a `pending` record only when none exists. Add an rl.5 acceptance line: two runs with a qualified form give the same file with rules.

- **type:** GAP
  - **subject:** R2 / B1 "the installed absolute path"
  - **evidence:** rl.1: "`command_forms(install_path)` returns `relay` and the real path of `install_path`". The human asks for the installed absolute path that the agent uses. If `install_path` is a symlink (common for installer shims, e.g. `/usr/local/bin/relay` → a versioned path), the agent types the symlink path, and an allow rule for the resolved real path does not match it, so those commands prompt. No acceptance line covers a symlinked `install_path`.
  - **proposed fix:** Amend rl.1 to decide explicitly which spellings the agent uses (the `install_path` as written, its real path, or both), and add an acceptance line plus a test for a symlinked `install_path`.

- **type:** UNOWNED-SEAM
  - **subject:** relay rule ownership marker (rl.3 ↔ rl.4)
  - **evidence:** rl.3 "owns: build_rules(records) returning the rules". rl.4: "`relay setup` replaces only relay-owned rules and leaves rules of other tools unchanged". The root spec says "removing every rule whose owner is `relay`". So rl.4 identifies rules by an owner tag that must be present on the rules rl.3 builds, or that rl.4 must add. Neither `owns:` line names the rule shape or the owner tag, so the two tasks can disagree, and setup either fails to remove its own old rules or tags them inconsistently.
  - **proposed fix:** Contract the rule record shape, including the `owner: relay` field and the pattern strings `F human *` and `F *`, in rl.3's `owns:` line, and have rl.4 consume it.

- **type:** UNOWNED-SEAM
  - **subject:** "forms left without rules" return shape (rl.3 ↔ rl.4)
  - **evidence:** rl.3 owns "build_rules(records) returning the rules and the forms left without rules". rl.4 prints "for each form left without rules, `relay setup` prints `relay setup: F awaiting qualification; no rules written`". The `owns:` line names the function but not the shape of the returned pair. It does not say whether the form is returned as the string to print or as a record, which matters for the absolute-path spelling. This is a minor point; it may be covered by the owns line.
  - **proposed fix:** State the return type in rl.3's owns line (e.g. `(rules, unruled_forms: list[str])` with each form being the exact string printed).

- **type:** GAP
  - **subject:** rl.5 acceptance lines (malformed)
  - **evidence:** rl.5's second line ends "...prints the notice and keeps other tools' rules` acceptance lines beneath it]". This looks like leftover template text. Also, no rl.5 line tests that `relay human ...` prompts while other commands are allowed through the full setup path (R3 end to end), or that a second run is byte-identical (R4).
  - **proposed fix:** Rewrite rl.5's lines. Add a test that `run_setup` run twice gives an identical file, and an end-to-end test that, after the qualification fix, the written file allows `relay status` and `<abs> status` and prompts `relay human x` and `<abs> human x`.
