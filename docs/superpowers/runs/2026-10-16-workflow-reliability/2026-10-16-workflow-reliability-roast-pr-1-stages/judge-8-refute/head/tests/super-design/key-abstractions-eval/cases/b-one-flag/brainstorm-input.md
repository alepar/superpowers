# Add `--limit` to `stash list`

Add an optional `--limit N` flag to `stash list`: print at most the N newest snapshots.
Snapshot names start with their timestamp, so the newest sort last. Without the flag the
output is unchanged. No other command changes.
