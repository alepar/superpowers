# Add a `tar` backend to stash

stash (this repository) copies a directory into a backend, and lists and checks what is
stored. It has two backends, `dir` and `zip`. Add a third, `tar`: snapshots are
gzip-compressed tar files (`.tar.gz`), saved, listed and checked like the other two. More
backends are planned after this one, starting with remote object stores.

Fixed decision D1 (not open for redesign): `report.py` keeps its own per-backend label text,
chosen in `report.label`. Downstream scripts parse these strings, and their owner wants every
label kept in that one function. Do not move the labels into the backends.

Out of scope: restore, retention, remote storage itself.
