"""Write relay's rules into the harness permissions file."""
import json
import os

from relay.forms import command_forms
from relay.identity import binary_digest, resolve_form
from relay.rules import OWNER, build_rules


def write_rules(settings_path, rules):
    """Replace every relay-owned rule with `rules`; keep every other rule as it was."""
    data = {"rules": []}
    if os.path.exists(settings_path):
        with open(settings_path) as fh:
            data = json.load(fh)
    kept = [r for r in data.get("rules", []) if r.get("owner") != OWNER]
    data["rules"] = kept + rules
    os.makedirs(os.path.dirname(settings_path) or ".", exist_ok=True)
    with open(settings_path, "w") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")


def run_setup(settings_path, install_path, running_path, path_env=None, out=print):
    running_digest = binary_digest(running_path)

    def form_digest(form):
        target = resolve_form(form, path_env)
        return binary_digest(target) if target else None

    rules, held = build_rules(command_forms(install_path), running_digest, form_digest)
    write_rules(settings_path, rules)
    for form in held:
        out(f"relay setup: {form} does not resolve to the running relay; {form} stays prompted")
    out(f"relay setup: wrote {len(rules)} rules to {settings_path}")
    return rules
