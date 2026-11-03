requirements:
R1 → rl.1, rl.2, rl.3, rl.4, rl.5
R2 → rl.1, rl.2, rl.3, rl.4, rl.5
R3 → rl.3, rl.4, rl.5
R4 → rl.4, rl.5
R-new: the rules land in the permissions file the agent harness actually reads (the `settings_path` that `relay setup` passes to `run_setup`) → rl.4 (partially: rl.4 owns `run_setup(settings_path, ...)`, but no line says how `relay setup` chooses `settings_path`)
R-new: a form that runs a binary other than the running relay gets no allow rule (the safety outcome the revision adds) → rl.2, rl.3, rl.4, rl.5
R-new: `relay setup` as the user actually invokes it (cli.py → `running_relay()` → `run_setup`) produces the allowed rule set end to end → rl.4 (no test task covers it; see GAP below)

- **type:** GAP
- **subject:** B1 (bare form under shim-based or wrapper installs)
- **evidence:** Human: "make sure the agent can run any `relay` command without prompting". B1: "allow every relay command form the agent uses, bare `relay` and the installed absolute path". The revision adds a prerequisite the old design did not have: the bare form is allowed only if `resolve_form("relay", path_env)` has the same SHA-256 as `running_relay()`. `resolve_form` returns the real path of the file found on PATH; `running_relay()` returns the real path of `sys.argv[0]`. Under any install where the `relay` on PATH is a shim or launcher that execs the real executable (pyenv/asdf/mise shims, wrapper scripts, some package-manager launchers), the file found on PATH is the shim while `sys.argv[0]` is the real executable, so the digests differ even though `relay` runs the same relay. rl.3's third acceptance line then holds the bare form, and every bare `relay` command prompts. The same happens when setup runs as `python -m relay setup` (`sys.argv[0]` is a `.py` module file, not the installed binary): both forms are held and nothing is allowed. No human scope change row covers this. rl.4 only promises success "on an ordinary install", and the only remedy offered is a printed message; no task produces a supported way to get the bare form allowed in these states. rl.5 tests only the ordinary install and a deliberately different binary.
- **proposed fix:** New leaf under rl (or design amendment to the rl.2/rl.3 identity rule): define identity so that a launcher which runs the running relay counts as the same relay (for example, compare what the form actually executes, such as asking the form for its own `running_relay()` or version or digest, rather than hashing the PATH entry's bytes), and make `running_relay()` handle `python -m relay` invocations. Add rl.5 tests for a shim on PATH and for `python -m relay setup`. Alternatively, record a human scope change row that accepts these installs staying prompted.

- **type:** GAP
- **subject:** B1 / R2 (absolute form spelled differently from the real path)
- **evidence:** rl.1: "`command_forms(install_path)` returns `relay` and the real path of `install_path`". Rules are command-string patterns (`F *`). If `install_path` is a symlink (for example `~/.local/bin/relay` → a venv or Cellar path) and the agent invokes the path it was given (`install_path` as written, or with `~`), that command string does not match the real-path rule and prompts. B1 says "the installed absolute path", meaning the one the agent uses. No task establishes which spelling the agent invokes, and no test checks a symlinked `install_path`.
- **proposed fix:** Leaf under rl amending rl.1: emit the form the agent actually uses (`install_path` as written, plus its real path if that differs), and identity-check each form. Add an rl.5 test with a symlinked `install_path`.

- **type:** GAP
- **subject:** R3 (`human` prompt can be bypassed or missed by spelling)
- **evidence:** R3: "`relay human ...` prompts in both forms". rl.3 writes only `F human *` (prompt) and `F *` (allow). Any spelling of a human command that does not start literally with `F human ` matches the allow rule instead. Examples are a global option before the subcommand (`relay --config x human ...`, if the CLI accepts global options) and `relay human` with no trailing arguments, if the harness pattern `F human *` needs at least one argument. No task enumerates relay's accepted argv shapes for `human`, and no test checks these spellings.
- **proposed fix:** Leaf under rl: list the CLI spellings that reach the `human` subcommand (global flags, bare `relay human`) and either add prompt rules for each or make the CLI reject global options before `human`. Add rl.5 tests for `relay human` with no arguments and with a leading global option.

- **type:** GAP
- **subject:** end-to-end path (`relay setup` CLI → `running_relay()` → `run_setup`)
- **evidence:** rl.4 owns "relay setup in relay/cli.py passes running_relay()". rl.5's tests all "run `run_setup` with it as the running relay" and pass the running path directly. No acceptance line tests `running_relay()` (rl.2 has the line, but rl.5 has no test of it) or the cli wiring. The whole B1 outcome now depends on `running_relay()` returning a file whose bytes match the PATH entry. A wrong `sys.argv[0]` resolution, such as a relative path, a bare name with no PATH hit, or a `-m` invocation, would leave both forms held while every rl.5 test stays green. Premortem: all tasks pass, the user runs `relay setup`, and nothing is allowed.
- **proposed fix:** Add to rl.5 (or a new leaf): a test that invokes the `relay setup` entry point (subprocess, or cli main with a controlled `sys.argv`/PATH) on an ordinary install and checks both forms are allowed. Add unit tests for `running_relay()` with an absolute, a relative and a bare-name `argv[0]`.

- **type:** GAP
- **subject:** R-new (rules written where the harness reads them) / root goal "installs permission rules into the agent harness"
- **evidence:** rl.4 owns `run_setup(settings_path, ...)`. No task line says how `relay setup` chooses `settings_path` or `install_path`. Nothing covers reading `install_path` from `~/.config/relay/config.json`, or the case where that file or key is missing. If that config is missing, `command_forms(install_path)` has no input, and the tree does not say whether setup fails, skips the absolute form, or crashes.
- **proposed fix:** Leaf under rl: the cli passes `settings_path` (the harness's permissions file) and `install_path` (read from config.json), with defined behavior when the config is missing (bare form only, with a message). Add an acceptance line and a test. If this already exists in code, state it as an unchanged precondition in rl.4.

- **type:** UNOWNED-SEAM
- **subject:** relay-owned rule marker (rl.3 ↔ rl.4)
- **evidence:** rl.3 produces the rules ("build_rules ... returning the rules"). rl.4 "replaces only relay-owned rules and leaves rules of other tools unchanged", which the spec states as "removing every rule whose owner is `relay`". The owner tag that rl.3 must stamp and rl.4 must recognize is exchanged between the two tasks. Neither `owns:` line names that marker or the rule-file format.
- **proposed fix:** Contract the rule representation, including the owner field and its value `relay`, in rl.3's `owns:` line, with rl.4 consuming it.

- **type:** UNOWNED-SEAM
- **subject:** `form_digest` input shape and the held-forms return (rl.2/rl.4 → rl.3)
- **evidence:** rl.3 owns "build_rules(forms, running_digest, form_digest) returning the rules and the forms left without an allow rule". rl.3 must treat "a form with another digest, or none" as held, so rl.4 has to turn `resolve_form` → `None` into a "none" digest that rl.3 recognizes. rl.4 also consumes the held list to print the message. Whether `form_digest` is a mapping or a callable, how a missing digest is represented, and the order of the held forms (which the idempotence and message output depend on) are not stated in any `owns:` line.
- **proposed fix:** State in rl.3's `owns:` line: `form_digest: dict[str, str | None]`, and held returned as an ordered list in `forms` order.

- **type:** GAP
- **subject:** previous-round revision (Binary identity), safety outcome
- **evidence:** The revision's stated purpose is "an allow rule for that path would then let the agent run that other binary without a prompt". `binary_digest` hashes only the file the form names. For a Python package (relay/*.py) that file is a console-script wrapper, and its bytes do not identify the code it runs: two wrappers with the same shebang import whatever `relay` package that interpreter resolves. The allow rule is also a command string, so it stays in force after the file at that path is later replaced. The new check therefore may not deliver the safety outcome it adds, while it does take away B1 coverage in the cases above. No task or test covers either point.
- **proposed fix:** Design amendment under rl: either choose an identity check that reflects the code that runs, or record that the check covers only the configured-path-mismatch case named in the security review, so its cost to B1 is weighed against what it actually protects.

- **type:** GAP
- **subject:** rl.5 acceptance text integrity
- **evidence:** rl.5's third acceptance line ends with "a second run gives the same file` acceptance lines beneath it]", and rl.4's description is cut off ("in the same ru"). Garbled or truncated acceptance text may not be the checks the author intended, so R4's test coverage cannot be confirmed from the tree.
- **proposed fix:** Restore the full text of rl.4's description and rl.5's acceptance lines in the tracker.
