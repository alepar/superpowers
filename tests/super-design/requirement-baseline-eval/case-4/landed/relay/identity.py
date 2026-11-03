"""Tell whether a command form runs the same binary as the relay running setup."""
import hashlib
import os
import shutil
import sys


def binary_digest(path):
    """SHA-256 hex digest of the file's bytes."""
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def resolve_form(form, path_env=None):
    """Real path of the file a form runs, or None when there is no such file."""
    if os.path.isabs(form):
        return os.path.realpath(form) if os.path.isfile(form) else None
    found = shutil.which(form, path=path_env)
    return os.path.realpath(found) if found else None


def running_relay():
    """Real path of the executable that invoked this process."""
    argv0 = sys.argv[0]
    if os.path.isfile(argv0):
        return os.path.realpath(argv0)
    return resolve_form(argv0)
