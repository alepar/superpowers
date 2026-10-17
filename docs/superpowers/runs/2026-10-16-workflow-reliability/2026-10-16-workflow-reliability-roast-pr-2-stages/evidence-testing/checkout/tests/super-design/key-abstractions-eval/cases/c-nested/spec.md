# stash: retention (`stash prune`)

Parent: the root spec of the stash backend redesign; its `## Key abstractions` section is
handed to the designer as the frame. Bead: eval-c.

## Goal

`stash prune --backend B --dest D --keep N` deletes all but the N newest snapshots that
backend B stores in D, for every backend.

## Design

- A new `prune` command beside `save`, `list` and `check`.
- Snapshots are ordered by their timestamp name; the N newest are kept.
- Deleting a snapshot differs per backend: a directory snapshot is removed recursively, an
  archive snapshot is a single file to unlink.
- `--dry-run` prints what would be deleted and deletes nothing.
- User-facing text goes through `report`, as for the other commands.

## Out of scope

Age-based retention; remote backends.

## Post-Implementation Notes
