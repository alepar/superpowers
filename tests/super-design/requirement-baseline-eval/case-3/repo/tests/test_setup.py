import json
import os
import tempfile
import unittest

from relay.install import run_setup


class SetupTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.binary = os.path.join(self.dir, "bin", "relay")
        os.makedirs(os.path.dirname(self.binary))
        with open(self.binary, "w") as fh:
            fh.write("#!/bin/sh\n")
        self.settings = os.path.join(self.dir, "agent", "permissions.json")

    def rules(self):
        with open(self.settings) as fh:
            return json.load(fh)["rules"]

    def test_both_forms_allowed_and_human_prompted(self):
        run_setup(self.settings, self.binary, out=lambda _: None)
        real = os.path.realpath(self.binary)
        self.assertEqual(
            {(r["decision"], r["command"]) for r in self.rules()},
            {
                ("prompt", "relay human *"),
                ("allow", "relay *"),
                ("prompt", f"{real} human *"),
                ("allow", f"{real} *"),
            },
        )

    def test_other_tools_rules_kept_and_rerun_stable(self):
        os.makedirs(os.path.dirname(self.settings))
        other = {"decision": "allow", "command": "git status", "owner": "git-helper"}
        with open(self.settings, "w") as fh:
            json.dump({"rules": [other]}, fh)
        run_setup(self.settings, self.binary, out=lambda _: None)
        first = self.rules()
        run_setup(self.settings, self.binary, out=lambda _: None)
        self.assertEqual(self.rules(), first)
        self.assertIn(other, first)


if __name__ == "__main__":
    unittest.main()
