def label(backend):
    if backend == "dir":
        return "directory snapshot"
    elif backend == "zip":
        return "zip archive"


def saved(backend, target):
    return f"saved {label(backend)}: {target}"


def empty(backend):
    return f"no {label(backend)}s stored"


def checked(backend, ok):
    return f"{backend}: {'ok' if ok else 'unavailable'}"
