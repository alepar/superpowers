"""Harness permission rules owned by relay."""
OWNER = "relay"


def rule(decision, command):
    return {"decision": decision, "command": command, "owner": OWNER}


def build_rules(forms, running_digest, form_digest):
    """A `human` prompt rule per form, and an allow rule per form that runs the running relay.

    `form_digest(form)` is the digest of the file the form runs, or None.
    Returns (rules, forms held without an allow rule).
    """
    rules, held = [], []
    for form in forms:
        rules.append(rule("prompt", f"{form} human *"))
        if form_digest(form) == running_digest:
            rules.append(rule("allow", f"{form} *"))
        else:
            held.append(form)
    return rules, held
