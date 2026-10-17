import os
import shutil
import time
import zipfile

from stash import config, report


def save(source, backend, dest):
    config.validate(backend)
    os.makedirs(dest, exist_ok=True)
    target = os.path.join(dest, time.strftime("%Y%m%d-%H%M%S") + config.snapshot_suffix(backend))
    if backend == "dir":
        shutil.copytree(source, target)
    elif backend == "zip":
        with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for root, _dirs, files in os.walk(source):
                for name in files:
                    path = os.path.join(root, name)
                    zf.write(path, os.path.relpath(path, source))
    print(report.saved(backend, target))
    return 0


def list_snapshots(backend, dest):
    config.validate(backend)
    names = []
    if os.path.isdir(dest):
        if backend == "dir":
            names = [n for n in os.listdir(dest) if os.path.isdir(os.path.join(dest, n))]
        elif backend == "zip":
            names = [n for n in os.listdir(dest) if n.endswith(".zip")]
    for name in sorted(names):
        print(name)
    if not names:
        print(report.empty(backend))
    return 0


def check(backend):
    config.validate(backend)
    if backend == "dir":
        ok = True
    elif backend == "zip":
        try:
            import zlib  # noqa: F401  (zip snapshots are deflate-compressed)
            ok = True
        except ImportError:
            ok = False
    print(report.checked(backend, ok))
    return 0 if ok else 1
