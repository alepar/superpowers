requirements:
R1 → rl.1, rl.2, rl.3, rl.4, rl.5
R2 → rl.1, rl.2, rl.3, rl.4, rl.5
R3 → rl.3, rl.4, rl.5
R4 → rl.4, rl.5
R-new: `relay setup` in relay/cli.py reads `install_path` from `~/.config/relay/config.json`, finds the harness permissions file (`settings_path`) and passes them, with the process `PATH`, to `run_setup` on the production path → (unmapped; rl.4 owns only "passes running_relay()")
R-new: when a form is held, `relay setup` names it, and the human has a supported way to get it allowed → rl.4 (message only; no task gives a way to clear it)
R-new: the allowed forms match the spelling the agent actually types (bare `relay`, and the installed absolute path as the agent invokes it, symlink or not) → (unmapped)

findings:

- **type:** GAP
  **subject:** B1 (also R1)
  **evidence:** The human asked: "make sure the agent can run any `relay` command without prompting". B1 says to allow "bare `relay` and the installed absolute path". The revision adds a precondition. The bare form gets an allow rule only when `resolve_form("relay", path_env)` (rl.2), using the `PATH` of the process that runs `relay setup`, resolves to a file with the running relay's digest (rl.3, rl.4). No task makes that hold on the production path. The installer writes `install_path`, so it is the likely caller of `relay setup`. It often runs setup by absolute path before the install directory is on the shell's `PATH`, for example `~/.local/bin` added to the shell rc but not yet loaded. `relay` then resolves to `None` and is held. The agent's harness can still find `relay` on its own `PATH` later, but the bare form stays prompted until someone reruns setup by hand. Bare `relay` is the form the agent uses most. Before the revision it was always allowed; after it, allowing it depends on the setup process's environment. No task covers that condition: rl.4's acceptance line only covers "an ordinary install", and rl.5's test sets up `PATH` itself.
  **proposed fix:** New leaf under rl: define and test the production setup invocation (installer and `relay setup` in cli.py) so that `path_env` is the `PATH` the agent harness will use, or so that a bare form that resolves to `None` because it is not on `PATH` yet still gets its allow rule. Only a bare form that resolves to a different binary should be held. Add an rl.5 test for "relay not yet on PATH".

- **type:** GAP
  **subject:** B1 (also R1, R2)
  **evidence:** rl.2 says `running_relay()` "is the real path of `sys.argv[0]`". Several supported ways of running setup make that differ from the installed binary: `python -m relay setup` (argv[0] is `.../relay/__main__.py`), a wrapper or launcher script, and some packaging layouts where argv[0] is an interpreter shim rather than the file on `PATH` or at `install_path`. The digests then differ, both forms are held, and nothing is allowed. That is a full regression of the human's request with no error beyond the "stays prompted" lines. rl.5's first test passes the running relay to `run_setup` directly ("runs `run_setup` with it as the running relay"), so the production path through `running_relay()` → `relay setup` in cli.py is never exercised end to end.
  **proposed fix:** New leaf under rl: an end-to-end test that invokes the installed `relay setup` entry point as a subprocess (bare form on `PATH`, and by absolute path) and checks that both forms get allow rules. Either define `running_relay()` for each supported launch mode (console script, `python -m`, frozen binary) or state which modes are unsupported.

- **type:** GAP
  **subject:** R2 / B1 ("the installed absolute path")
  **evidence:** rl.1 says "`command_forms(install_path)` returns `relay` and the real path of `install_path`". The allow rule is written for the realpath. If `install_path` is a symlink (pipx, Homebrew, `~/.local/bin/relay` → venv), the agent invokes the symlink path it was told about, and `F *` for the resolved target does not match that string, so the agent is prompted. Identity checking through `resolve_form` and `binary_digest` should use the realpath, but the rule string should use the spelling the agent types. No task separates the two.
  **proposed fix:** New leaf under rl (or amend rl.1): `command_forms` returns the spelling the agent uses, with identity resolution on the realpath. Add an rl.5 test where `install_path` is a symlink.

- **type:** UNOWNED-SEAM
  **subject:** `install_path` from `~/.config/relay/config.json` (installer / cli.py) → `run_setup(settings_path, install_path, …)` (rl.4)
  **evidence:** The root spec says "The absolute path is the real path of `install_path` in `~/.config/relay/config.json`, which the installer writes." rl.4 owns "run_setup(settings_path, install_path, running_path, path_env, out) …; relay setup in relay/cli.py passes running_relay()". No task's `owns:` line names reading `install_path` (or locating `settings_path`, or choosing `path_env`) on the cli.py side. No task covers the installer's config format either: the key, and whether the value is absolute or a symlink. Under the revision this value now decides whether R2's form is allowed, so whatever reads it is part of the requirement.
  **proposed fix:** Contract the boundary `relay setup` (cli.py) → `run_setup`. Say who reads `install_path` from config.json and how, what happens when it is missing or unreadable, where `settings_path` comes from, and that `path_env` is `os.environ["PATH"]` (or the harness PATH; see first GAP).

- **type:** UNOWNED-SEAM
  **subject:** held-forms list, rl.3 → rl.4
  **evidence:** rl.3 owns "build_rules(forms, running_digest, form_digest) returning the rules and the forms left without an allow rule", and rl.4 prints "for each held form … `F does not resolve to the running relay; F stays prompted`". The shape of `form_digest` (a map from form to digest, or `None`) and of the returned "held" value is exchanged between the two tasks, but no `owns:` line names it. rl.3 also says "a form with another digest, or none", so how `None` is represented must agree with rl.2's `resolve_form` returning `None`.
  **proposed fix:** Add the `form_digest` mapping (including `None`) and the held-forms return value to rl.3's `owns:` line as an interface that rl.4 consumes.

- **type:** GAP
  **subject:** held form recovery (R-new above; B1)
  **evidence:** When a form is held, rl.4 prints "F stays prompted" and stops there. No task gives the human a supported way to get the form allowed: no flag, no guidance in the message, no documented rerun condition. Under the CLAUDE-level rules in the prompt ("a separate manual step with no supported producer … is not one"), recovering from a held bare form or absolute form depends on an unspecified manual step, so B1's "any relay command" is not met in those states.
  **proposed fix:** Amend rl.4: make the message say what to fix, for example "put the installed relay on PATH and rerun `relay setup`". If the design wants it, add a supported path, but say what it does to the security finding.

- **type:** GAP
  **subject:** R1/R2 test coverage of the revision's added behavior
  **evidence:** rl.5 does not cover several things the revision adds: the printed held message (rl.4's acceptance line 2); `resolve_form` returning `None` for a missing bare `relay` or a non-file absolute path; a held absolute form when `install_path` names a different binary, which is the exact case the security review raised ("`install_path` in the config file … can name a different binary"); and `running_relay()` itself. Only the bare-form mismatch is tested.
  **proposed fix:** Add rl.5 tests for an `install_path` that names a different file (absolute form held, bare allowed), for `relay` absent from `PATH`, and for the held message text.

- **type:** GAP
  **subject:** R3 (`relay human ...` prompts in both forms)
  **evidence:** R3 rests on the spec's line "Because prompt rules are checked first". No task checks or owns that ordering against the harness's real permission evaluation. rl.3 and rl.5 check only that the rule `F human *` is written. If the harness evaluates allow rules before prompt rules, or uses the most specific match, `relay human …` runs without a prompt. A related open question: whether `F *` matches a bare `relay` with no arguments and argument spellings such as `relay --flag human …`, which could get past the `F human *` prompt.
  **proposed fix:** New leaf under rl: confirm the harness's rule precedence and matching for `F human *` against `F *`, including global flags placed before `human`, and add a test, or a documented harness reference, that `relay human …` prompts in both forms.

- **type:** GAP
  **subject:** previous round's fix (root spec revision, Binary identity)
  **evidence:** The revision closes the security finding by holding mismatched forms. In doing so it opens the conditional allow gaps above: `PATH` at setup time, `sys.argv[0]` launch mode, symlinked `install_path`. The author's accounting ("On an ordinary install bare `relay`, the installed absolute path and the running relay are one file") assumes these conditions without any task producing or verifying them. Relevant here: rl.5 test 1 builds its "ordinary install" as a fixture ("puts it on `PATH` and as `install_path`"), and a test-only fixture is not a production producer.
  **proposed fix:** Covered by the fixes in the first three GAPs. In particular, add an end-to-end installer + `relay setup` test that checks the ordinary-install claim on the real production path.

No ORPHAN findings: rl.1–rl.5 each serve R1–R4.
