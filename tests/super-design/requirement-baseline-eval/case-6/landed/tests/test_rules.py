import unittest

from relay.qualify import Qualification
from relay.rules import build_rules


class RulesTest(unittest.TestCase):
    def test_qualified_forms_allowed_and_human_prompted(self):
        records = [
            Qualification.qualified("relay", "ab" * 32),
            Qualification.qualified("/opt/relay/bin/relay", "ab" * 32),
        ]
        rules, held = build_rules(records)
        self.assertEqual(held, [])
        self.assertEqual(
            {(r["decision"], r["command"]) for r in rules},
            {
                ("prompt", "relay human *"),
                ("allow", "relay *"),
                ("prompt", "/opt/relay/bin/relay human *"),
                ("allow", "/opt/relay/bin/relay *"),
            },
        )

    def test_pending_form_gets_no_rule(self):
        rules, held = build_rules([Qualification.pending("relay")])
        self.assertEqual(rules, [])
        self.assertEqual(held, ["relay"])


if __name__ == "__main__":
    unittest.main()
