"""Harness permission rules owned by relay."""
OWNER = "relay"


def rule(decision, command):
    return {"decision": decision, "command": command, "owner": OWNER}


def build_rules(records):
    """Rules for every qualified record; returns (rules, forms left without rules)."""
    rules, held = [], []
    for record in records:
        if not record.is_qualified:
            held.append(record.form)
            continue
        rules.append(rule("prompt", f"{record.form} human *"))
        rules.append(rule("allow", f"{record.form} *"))
    return rules, held
