import hashlib
import os
import tempfile
import unittest

from relay.identity import binary_digest, resolve_form


class IdentityTest(unittest.TestCase):
    def test_digest_and_resolution(self):
        d = tempfile.mkdtemp()
        path = os.path.join(d, "relay")
        with open(path, "wb") as fh:
            fh.write(b"relay-bytes")
        self.assertEqual(binary_digest(path), hashlib.sha256(b"relay-bytes").hexdigest())
        self.assertEqual(resolve_form(path), os.path.realpath(path))
        self.assertIsNone(resolve_form(os.path.join(d, "missing")))
        os.chmod(path, 0o755)
        self.assertEqual(resolve_form("relay", d), os.path.realpath(path))
        self.assertIsNone(resolve_form("relay", os.path.join(d, "empty")))


if __name__ == "__main__":
    unittest.main()
