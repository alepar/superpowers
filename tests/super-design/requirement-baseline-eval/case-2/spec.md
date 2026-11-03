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

## Qualification

A security review found that the absolute path comes from `install_path` in the config file, which can name a different binary than the relay the agent runs; an allow rule for that path would then let the agent run that other binary without a prompt.

Rules for a form are therefore tied to a qualification record, `Qualification(form, state, digest)` in `relay/qualify.py`. `state` is `pending` or `qualified`; a `qualified` record carries the SHA-256 digest of the binary its qualification confirmed. `Qualification.pending(form)` and `Qualification.qualified(form, digest)` construct them. `relay setup` creates a `pending` record for each command form.

## Rule set

For each command form F whose qualification record is `qualified`, setup writes a prompt rule `F human *` and an allow rule `F *`. A form whose record is not `qualified` gets no rule, and setup prints `relay setup: F awaiting qualification; no rules written`. Because prompt rules are checked first, `relay human ...` prompts in a form that has rules and every other relay command in that form runs without a prompt; a form with no rule prompts for every command.

## Setup

`relay setup` lists the command forms, creates their qualification records, builds the rule set from the records and writes it to the permissions file, first removing every rule whose owner is `relay` and leaving every other rule as it was. Running it twice gives the same file.

## Unchanged behavior

- Rules owned by other tools in the permissions file are never changed.
- The harness checks prompt rules before allow rules, so a `human` prompt rule always takes precedence over an allow rule for the same form.
- Running `relay setup` twice gives the same file.
