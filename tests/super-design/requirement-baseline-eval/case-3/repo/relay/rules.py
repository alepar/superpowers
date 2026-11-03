"""Harness permission rules owned by relay."""
OWNER = "relay"


def rule(decision, command):
    return {"decision": decision, "command": command, "owner": OWNER}


def build_rules(forms):
    """Per form: a prompt rule for `human` and an allow rule for every other command."""
    rules = []
    for form in forms:
        rules.append(rule("prompt", f"{form} human *"))
        rules.append(rule("allow", f"{form} *"))
    return rules
