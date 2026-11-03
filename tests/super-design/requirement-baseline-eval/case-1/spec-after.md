# relay agent permissions

Bead: rl

## Goal

`relay setup` installs permission rules into the agent harness so the agent runs `relay` commands without a prompt, while `relay human` commands still prompt.

## Requirement baseline

Source: the human user in the relay project session, 2026-11-02.

### Human request

> make sure the agent can run any `relay` command without prompting, except `relay human ...` commands, which must still prompt

### Requirements

- B1 · "allow every relay command form the agent uses, bare `relay` and the installed absolute path, with a prompt rule for their `human` subcommand" · source: approved design

### Human scope changes

- none

## Harness rules

The harness reads `~/.agent/permissions.json`: `{"rules": [{"decision": "allow" | "prompt", "command": "<pattern>", "owner": "<tool>"}]}`. A pattern is a command form followed by words; a trailing `*` matches any remaining arguments, including none. The harness checks prompt rules first, then allow rules; a command matching no rule prompts.

## Command forms

The agent invokes relay in two forms: bare `relay`, found on `PATH`, and the installed absolute path. The absolute path is the real path of `install_path` in `~/.config/relay/config.json`, which the installer writes. `command_forms(install_path)` in `relay/forms.py` lists both.

## Binary identity

A security review found that the absolute path comes from `install_path` in the config file, which can name a different binary than the relay the agent runs; an allow rule for that path would then let the agent run that other binary without a prompt.

Setup therefore allows a form only when it runs the same binary as the relay running setup. `relay/identity.py` provides `binary_digest(path)`, the SHA-256 of the file's bytes; `resolve_form(form, path_env)`, the real path of the file a form runs (bare `relay` looked up on `PATH`, an absolute form taken as is), or `None` when no such file exists; and `running_relay()`, the real path of the executable that invoked `relay setup` (`sys.argv[0]`, looked up on `PATH` when it is not a file path).

## Rule set

For each command form F, setup writes a prompt rule `F human *`. It also writes an allow rule `F *` when F resolves to a file whose digest equals the running relay's digest; otherwise it writes no allow rule for F and prints `relay setup: F does not resolve to the running relay; F stays prompted`. On an ordinary install, `relay` on `PATH`, `install_path` and the running relay are the same file, so a default `relay setup` allows both forms in one run, with no other step. Because prompt rules are checked first, `relay human ...` prompts in either form and every other relay command in an allowed form runs without a prompt.

## Setup

`relay setup` lists the command forms, computes the running relay's digest and each form's digest in the same run, builds the rule set and writes it to the permissions file, first removing every rule whose owner is `relay` and leaving every other rule as it was. Running it twice gives the same file.

## Unchanged behavior

- Rules owned by other tools in the permissions file are never changed.
- After a default `relay setup` on an ordinary install, the absolute-path form runs every non-`human` relay command without a prompt, as the bare form does.
- `relay human ...` prompts in every form, whether or not that form is allowed.
- Running `relay setup` twice gives the same file.
