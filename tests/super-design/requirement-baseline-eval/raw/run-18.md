requirements:
R1 → rl.1, rl.2, rl.3, rl.4, rl.5
R2 → rl.1, rl.2, rl.3, rl.4, rl.5
R3 → rl.3, rl.4, rl.5
R4 → rl.4, rl.5
R-new: The running `relay setup` gets `install_path` from `~/.config/relay/config.json` (the installer writes it) and passes it to `run_setup`. Without this, the absolute form is never computed on the production path. → (unmapped; rl.4's owns line names only `running_relay()` as what cli.py passes)
R-new: An end-to-end `relay setup` CLI invocation on an ordinary install allows both forms. This checks the production `running_relay()` and config-read path, not only `run_setup` with an injected `running_path`. → (unmapped; rl.5 calls `run_setup` directly)

- **type:** GAP
- **subject:** B1
- **evidence:** The human asked: "make sure the agent can run any `relay` command without prompting". B1 says "allow every relay command form the agent uses, bare `relay` and the installed absolute path". The revision adds a new prerequisite: a form gets an allow rule only when `resolve_form(form)` has the same SHA-256 as `running_relay()` (the real path of `sys.argv[0]`). The design treats "`relay` on `PATH`, `install_path` and the running relay are the same file" as given, but no task makes it true. There are common production setups where it is false and nothing is wrong with the install:
  (a) Version-manager shims (pyenv, asdf, mise and similar). `relay` on `PATH` resolves to a shim script, and the shim execs the real binary. So `sys.argv[0]` and `install_path` are the real binary, `resolve_form("relay")` is the shim, the digests differ, and the bare form is held. R1 fails.
  (b) Running setup as `python -m relay setup`, or through a wrapper or launcher script. `sys.argv[0]` is then `__main__.py` or the wrapper, so its digest matches neither form, both forms are held, and R1 and R2 both fail.
  (c) An installer that runs `relay setup` from a staging or build copy before or after copying the binary into `install_path`. The running digest differs from the installed file.
  In each case setup prints "stays prompted", and the human-requested behavior silently fails. That is a regression: before the revision, both forms got `F *` unconditionally. rl.4's acceptance line covers only "an ordinary install". No task defines what "ordinary" covers, makes setup recognise these layouts, or gives the user a supported way to get the allow rules back, and the human made no scope change accepting the loss.
- **proposed fix:** New leaf under rl. Decide and implement identity for these production layouts: shims, `python -m`, and an installer-invoked setup. Two options are comparing the form's resolved target with the installed binary at `install_path` rather than with `sys.argv[0]`, or having the installer run setup through `install_path`. Add acceptance lines for each layout. If some layouts are deliberately left prompted, record that as a human scope change instead of an implicit loss.

- **type:** GAP
- **subject:** R2 / B1 (absolute form source on the production path)
- **evidence:** The root spec says: "The absolute path is the real path of `install_path` in `~/.config/relay/config.json`, which the installer writes." `run_setup(settings_path, install_path, running_path, path_env, out)` takes `install_path` as a parameter. rl.4's owns line says only "relay setup in relay/cli.py passes running_relay()". No task's owns or acceptance line reads `install_path` from config.json in the CLI, says what happens when the key or file is missing, or covers `settings_path` and `path_env` being supplied from production values. rl.5 tests inject `install_path` directly. If every task succeeds as written, the production `relay setup` may never feed the real `install_path` in, and R2 is not delivered end to end.
- **proposed fix:** Extend rl.4, or add a leaf under rl, so that `relay setup` in cli.py reads `install_path` from `~/.config/relay/config.json`, passes `os.environ["PATH"]` and the harness settings path, and has a defined behavior when `install_path` is absent. Add an acceptance line for each.

- **type:** GAP
- **subject:** R1, R2 (no end-to-end path verified)
- **evidence:** rl.5's first acceptance line runs "`run_setup` with it as the running relay". The running path is injected, so nothing exercises `running_relay()` (the `sys.argv[0]` lookup) or the CLI wiring against a real installed entry point. Premortem: every unit test passes, but in production `sys.argv[0]` for the installed entry point does not hash equal to the `PATH` and `install_path` file, and both forms are held. No test would catch it. The thin end-to-end slice (installer writes config, then the `relay setup` CLI, then rules for both forms) has no task that checks it.
- **proposed fix:** Add a leaf under rl. Install relay the way the installer does into a temp prefix, put it on `PATH`, write config.json, invoke `relay setup` as a subprocess, and assert that both forms have allow rules plus `human` prompt rules.

- **type:** GAP
- **subject:** R2 (spelling of the absolute form)
- **evidence:** rl.1 acceptance: "`command_forms(install_path)` returns `relay` and the real path of `install_path`". The harness matches the command string the agent types. If `install_path` is a symlink, as on Homebrew, pipx or `~/.local/bin` installs, and the agent invokes the path as configured, the allow rule written for the resolved real path does not match the agent's command, so it prompts. The request says "any `relay` command" in every form the agent uses. No task establishes which spelling the agent actually uses, and none writes rules for both the configured and the resolved spelling.
- **proposed fix:** Amend rl.1, or add a leaf, to determine the absolute spelling the agent invokes. That means writing `install_path` as configured, plus its real path if they differ, each gated by the same identity check. Add an rl.5 test with a symlinked `install_path`.

- **type:** UNOWNED-SEAM
- **subject:** `install_path` in `~/.config/relay/config.json` (installer → relay setup)
- **evidence:** The root spec says "`install_path` in `~/.config/relay/config.json`, which the installer writes". rl.4 consumes `install_path` (`run_setup(settings_path, install_path, ...)`). No task's owns line names the config file format or key, and none names the read side in cli.py. The security finding that motivated the revision is about this very value ("`install_path` in the config file, which can name a different binary"), so its producer–consumer contract matters.
- **proposed fix:** Contract the config.json `install_path` key: who writes it, its form (as-written or resolved), and the reader in `relay/cli.py`. Put it in a seam contract leaf or in rl.4's owns line.

- **type:** UNOWNED-SEAM
- **subject:** form → digest mapping between rl.2/rl.4 and rl.3 (`form_digest`)
- **evidence:** rl.3 owns `build_rules(forms, running_digest, form_digest)` and "consumes: digests from rl.2". rl.2 provides `resolve_form` and `binary_digest` but no per-form digest. rl.4 "computes the running relay's digest and each form's digest". The shape of `form_digest` (a mapping or a callable, and how a `None` resolution is represented as "none") is not stated in any owns line, but rl.3's "a form with another digest, or none" depends on it.
- **proposed fix:** State in rl.3's owns line the type of `form_digest`, for example `dict[str, str | None]`, keyed by the exact form strings `command_forms` returns, and that rl.4 builds it from `resolve_form` and then `binary_digest`.
