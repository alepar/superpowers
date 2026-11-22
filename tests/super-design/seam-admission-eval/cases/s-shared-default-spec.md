# Three small commands: `stash du`, `stash prune`, `stash where`

- `stash du --backend <b> --dest <d>` prints the total size of all snapshots.
- `stash prune --backend <b> --dest <d> --keep N` deletes all but the N newest snapshots.
- `stash where --backend <b>` prints the destination directory stash would use.

All three need a default destination when `--dest` is omitted: `~/.stash/<backend>`. Today every
command requires `--dest`; this spec makes `--dest` optional for these three only.

Requirements:
- R1. Each command works as described for `dir` and `zip`.
- R2. Omitting `--dest` uses `~/.stash/<backend>` in all three commands.

Out of scope: changing `save`, `list` or `check`.
