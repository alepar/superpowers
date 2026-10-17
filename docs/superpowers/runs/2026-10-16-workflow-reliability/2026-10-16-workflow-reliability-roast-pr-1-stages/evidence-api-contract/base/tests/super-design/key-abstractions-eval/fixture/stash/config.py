SUPPORTED = ("dir", "zip")


def validate(backend):
    if backend not in SUPPORTED:
        raise SystemExit(f"stash: unknown backend {backend!r} (supported: {', '.join(SUPPORTED)})")


def snapshot_suffix(backend):
    if backend == "dir":
        return ""
    elif backend == "zip":
        return ".zip"
