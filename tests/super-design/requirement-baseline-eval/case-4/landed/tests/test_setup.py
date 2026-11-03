import json
import os
import subprocess
import sys
import tempfile
import unittest

from relay.install import run_setup

PACKAGE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class SetupTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.bin = os.path.join(self.dir, "bin")
        os.makedirs(self.bin)
        self.binary = os.path.join(self.bin, "relay")
        with open(self.binary, "w") as fh:
            fh.write("#!/bin/sh\necho relay 0.4.0\n")
        os.chmod(self.binary, 0o755)
        self.settings = os.path.join(self.dir, "agent", "permissions.json")
        self.lines = []

    def rules(self):
        with open(self.settings) as fh:
            return {(r["decision"], r["command"]) for r in json.load(fh)["rules"]}

    def setup_run(self, path_env=None):
        run_setup(self.settings, self.binary, self.binary,
                  path_env=path_env or self.bin, out=self.lines.append)

    def test_ordinary_install_allows_both_forms_in_one_run(self):
        self.setup_run()
        real = os.path.realpath(self.binary)
        self.assertEqual(
            self.rules(),
            {
                ("prompt", "relay human *"),
                ("allow", "relay *"),
                ("prompt", f"{real} human *"),
                ("allow", f"{real} *"),
            },
        )

    def test_symlinked_path_entry_is_the_same_relay(self):
        link_dir = os.path.join(self.dir, "links")
        os.makedirs(link_dir)
        os.symlink(self.binary, os.path.join(link_dir, "relay"))
        self.setup_run(path_env=link_dir)
        self.assertIn(("allow", "relay *"), self.rules())

    def test_other_relay_on_path_keeps_bare_form_prompted(self):
        other_dir = os.path.join(self.dir, "other")
        os.makedirs(other_dir)
        other = os.path.join(other_dir, "relay")
        with open(other, "w") as fh:
            fh.write("#!/bin/sh\necho something else\n")
        os.chmod(other, 0o755)
        self.setup_run(path_env=other_dir)
        real = os.path.realpath(self.binary)
        rules = self.rules()
        self.assertNotIn(("allow", "relay *"), rules)
        self.assertIn(("prompt", "relay human *"), rules)
        self.assertIn(("allow", f"{real} *"), rules)
        self.assertIn("relay setup: relay does not resolve to the running relay; relay stays prompted", self.lines)

    def test_other_tools_rules_kept_and_rerun_stable(self):
        os.makedirs(os.path.dirname(self.settings))
        other = {"decision": "allow", "command": "git status", "owner": "git-helper"}
        with open(self.settings, "w") as fh:
            json.dump({"rules": [other]}, fh)
        self.setup_run()
        with open(self.settings) as fh:
            first = json.load(fh)
        self.setup_run()
        with open(self.settings) as fh:
            self.assertEqual(json.load(fh), first)
        self.assertIn(other, first["rules"])

    def test_installed_relay_setup_command(self):
        launcher = os.path.join(PACKAGE_ROOT, "bin", "relay")
        config = os.path.join(self.dir, "config.json")
        with open(config, "w") as fh:
            json.dump({"install_path": launcher}, fh)
        env = dict(os.environ, PATH=os.path.dirname(launcher) + os.pathsep + os.environ.get("PATH", ""))
        subprocess.run([launcher, "setup", "--settings", self.settings, "--config", config],
                       check=True, env=env, capture_output=True)
        real = os.path.realpath(launcher)
        rules = self.rules()
        self.assertIn(("allow", "relay *"), rules)
        self.assertIn(("allow", f"{real} *"), rules)
        self.assertIn(("prompt", "relay human *"), rules)
        self.assertIn(("prompt", f"{real} human *"), rules)


if __name__ == "__main__":
    unittest.main()
