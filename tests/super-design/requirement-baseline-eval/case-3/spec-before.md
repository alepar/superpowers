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

- S1 · 2026-11-03 · "allows can wait until a qualification exists; publish no allow or prompt rule before then" · source: human message in the design session · affects: B1

## Harness rules

The harness reads `~/.agent/permissions.json`: `{"rules": [{"decision": "allow" | "prompt", "command": "<pattern>", "owner": "<tool>"}]}`. A pattern is a command form followed by words; a trailing `*` matches any remaining arguments, including none. The harness checks prompt rules first, then allow rules; a command matching no rule prompts.

## Command forms

The agent invokes relay in two forms: bare `relay`, found on `PATH`, and the installed absolute path. The absolute path is the real path of `install_path` in `~/.config/relay/config.json`, which the installer writes. `command_forms(install_path)` in `relay/forms.py` lists both.

## Rule set

For each command form F, setup writes a prompt rule `F human *` and an allow rule `F *`. Because prompt rules are checked first, `relay human ...` prompts in either form and every other relay command runs without a prompt.

## Setup

`relay setup` builds the rule set and writes it to the permissions file, first removing every rule whose owner is `relay` and leaving every other rule as it was. Running it twice gives the same file.

## Unchanged behavior

- Rules owned by other tools in the permissions file are never changed.
