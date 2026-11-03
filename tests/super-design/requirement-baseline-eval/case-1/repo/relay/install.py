"""Write relay's rules into the harness permissions file."""
import json
import os

from relay.forms import command_forms
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


def run_setup(settings_path, install_path, out=print):
    rules = build_rules(command_forms(install_path))
    write_rules(settings_path, rules)
    out(f"relay setup: wrote {len(rules)} rules to {settings_path}")
    return rules
