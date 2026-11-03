requirements:
R1 → (unmapped) — rl.3/rl.4 write the bare-`relay` allow rule only for a `qualified` record, and no production task produces one
R2 → (unmapped) — same: the absolute-path allow rule needs a `qualified` record that only a test constructs
R3 → rl.3, rl.4 (holds trivially today, because with no rules every command prompts; holds as designed only once a form is qualified)
R4 → rl.4 (idempotence is not tested by rl.5)
R-new: A production step qualifies each command form: it computes the SHA-256 of the binary the form resolves to, confirms it is the intended relay, and records `Qualification.qualified(form, digest)` where `relay setup` reads it → (unmapped)
R-new: Qualification records persist between runs, and `relay setup` reads the existing records instead of resetting every form to `pending` → (unmapped)

findings:

- **type:** GAP
  - **subject:** B1 (and R1, R2)
  - **evidence:** The human asked: "make sure the agent can run any `relay` command without prompting, except `relay human ...`". B1 says to "allow every relay command form the agent uses, bare `relay` and the installed absolute path". The revision adds a prerequisite: rules are written only "for each command form F whose qualification record is `qualified`". No task produces a `qualified` record on a production path:
    - rl.4 makes `relay setup` "create a `pending` record for each command form" and then "build the rule set from the records".
    - rl.3 then gives "no rule" for every pending form, and rl.4 prints "F awaiting qualification; no rules written".
    - `Qualification.qualified(form, digest)` is called only in rl.5's test ("a test builds `qualified` records ... with `Qualification.qualified`"). That is a test-only constructor, not a producer.
    - No task computes a SHA-256 digest of a binary, compares it with anything, or moves a record from `pending` to `qualified`.

    If every task succeeds exactly as written, `relay setup` in production writes no relay rule for either form. Per the revised spec, "a form with no rule prompts for every command". So the agent is prompted for every relay command in both forms, which is the opposite of the request. The author's `preserved` claim depends on "once each form's qualification record is `qualified`", a state nothing in the tree reaches. Under the old design B1 worked unconditionally, so this revision regresses it. The security repair does not leave the requested behavior working, and no human scope change row covers the difference.
  - **proposed fix:** Add a new subepic under rl, "Form qualification", that needs design. It must:
    - define what "the binary its qualification confirmed" means (the intended relay, e.g. the running executable's digest compared against the real path of `install_path` and the `PATH`-resolved `relay`);
    - add a leaf that computes the digest and produces `Qualification.qualified(form, digest)` on the `relay setup` path, or on a named production command;
    - amend rl.4 so that `relay setup` uses that step's result instead of unconditionally creating `pending` records.

    Add a rl.5 acceptance line that runs `run_setup` end to end on a real (fixture) binary and finds allow rules for both forms plus `human` prompt rules.

- **type:** GAP
  - **subject:** goal outcome "agent runs relay commands without a prompt" (end-to-end thin path)
  - **evidence:** The premortem: the tree is executed and the goal is still not met, because no end-to-end path both creates qualified records and writes rules. rl.5's two tests are split. One feeds hand-made `qualified` records into `build_rules` only. The other runs `run_setup` and checks only the pending/no-rules branch ("checks it writes no relay rule while records are `pending`"). No acceptance line runs `relay setup` and observes an allow rule in the written file. So the tests pass while the delivered system never allows anything.
  - **proposed fix:** Add a leaf under rl (or extend rl.5) with this acceptance: after `relay setup` on a correctly installed relay, the permissions file holds `relay *` and `<abs> *` allow rules and `relay human *` and `<abs> human *` prompt rules.

- **type:** GAP
  - **subject:** R-new (record persistence) / rl.4
  - **evidence:** rl.4 says "`relay setup` creates a `pending` record for each command form". No task says where records are stored or whether setup keeps an existing `qualified` record. Even if a qualification producer were added, rl.4 as written would reset every form to `pending` on each run. Its rules would then vanish on the next setup, which also conflicts with "running it twice gives the same file" once a form is qualified.
  - **proposed fix:** Add a leaf under rl that owns record storage (location and format) and a load/save API. Amend rl.4 to create `pending` only for forms that have no record, and to keep `qualified` records whose digest still matches.

- **type:** GAP
  - **subject:** R4 (test coverage)
  - **evidence:** R4 and rl.4 require "running it twice gives the same file". rl.5's acceptance lines check only that setup "keeps other tools' rules" and do not test idempotence. The rl.5 line is also malformed: it ends "keeps other tools' rules` acceptance lines beneath it]", which looks like template residue, so the acceptance text is ambiguous.
  - **proposed fix:** Fix the rl.5 line, and add an acceptance line: running `run_setup` twice gives a byte-identical file, both with pending forms and with qualified forms.

- **type:** UNOWNED-SEAM
  - **subject:** Qualification record store (written/created by setup, read by the rule builder and by any future qualifier)
  - **evidence:** rl.4 "creates a `pending` record for each command form" and rl.3 "build rules from qualification records". The spec says "Rules for a form are therefore tied to a qualification record". Records must also reach the qualification step, which is missing per the GAP above. rl.2 owns only the in-memory type `Qualification(form, state, digest)` and its constructors. No `owns:` line names where records live or who may change their state.
  - **proposed fix:** Add a seam contract for the record store, `relay/qualify.py` load/save or equivalent: its location, its format, and that only the qualifier writes `qualified`.

- **type:** UNOWNED-SEAM
  - **subject:** `install_path` from `~/.config/relay/config.json` → `run_setup` / `command_forms`
  - **evidence:** The spec says "The absolute path is the real path of `install_path` in `~/.config/relay/config.json`, which the installer writes". rl.4 owns `run_setup(settings_path, install_path, out)` and rl.1 owns `command_forms(install_path)`. No task owns reading `install_path` from the config file and passing it to `run_setup`. That is the CLI entry for `relay setup`, and it is also the input the security review flagged as untrusted. If this is existing, unchanged code, it should be stated; if not, R2 has no producer for its input.
  - **proposed fix:** Name the owner of the config read and the `relay setup` CLI wiring, as an existing-code note or a leaf under rl. Tie it to the qualification subepic, since that subepic must confirm the binary at this path.

- **type:** ORPHAN
  - **subject:** rl.2 (`Qualification.qualified` constructor)
  - **evidence:** rl.2 says "`Qualification.qualified(form, digest)` has state `qualified` and carries the digest". Its only consumer in the tree is rl.5's test ("consumes: Qualification.qualified from rl.2"). No production task calls it, so as the tree stands it serves no goal outcome on a production path. It becomes non-orphan only once the qualification-producer leaf from the first GAP exists.
  - **proposed fix:** Keep it, and name the goal outcome it serves by adding the qualification-producer leaf that calls it in production (see the first GAP). Do not delete it.
