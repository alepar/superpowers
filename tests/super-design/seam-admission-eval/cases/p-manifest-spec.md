# Snapshot manifests: `stash manifest` and `stash verify`

Two new commands, built and reviewed independently:

- `stash manifest --backend <b> --dest <d> <snapshot>` writes `<snapshot>.manifest` next to the
  snapshot: every file in it with its relative path, size in bytes and SHA-256.
- `stash verify --backend <b> --dest <d> <snapshot>` reads that manifest and reports every file
  that is missing, extra, or whose size or hash differs; exit 1 on any difference, 0 otherwise.

Requirements:
- R1. `manifest` writes a manifest for a `dir` or `zip` snapshot.
- R2. `verify` checks a snapshot against the manifest `manifest` wrote, for both backends.
- R3. Paths with spaces and non-ASCII names round-trip between the two commands.

The two commands share no code today; the manifest file format is new. Out of scope: signing,
remote storage, other commands.
