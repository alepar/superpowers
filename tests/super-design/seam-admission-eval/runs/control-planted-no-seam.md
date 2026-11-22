# Decomposition — Add a `tar` backend to stash

| id | depth | deps | title | description | files | acceptance |
|---|---|---|---|---|---|---|
| stash-tar.1 | 1 | — | Add tar backend branches | Add `"tar"` to `config.SUPPORTED`, a `.tar.gz` branch to `config.snapshot_suffix`, and an `elif backend == "tar":` branch to `commands.save`, `commands.list_snapshots` and `commands.check` using `tarfile` with gzip. owns: tar branches in config.py and commands.py | stash/config.py, stash/commands.py | - [ ] `stash save --backend tar` writes a `.tar.gz` snapshot<br>- [ ] `stash list --backend tar` lists it<br>- [ ] `stash check --backend tar` passes<br>- [ ] existing dir/zip behavior unchanged |
| stash-tar.2 | 1 | stash-tar.1 | Add tar label | Add the `tar` label text in `report.label`, keeping every label in that function (D1). blocked-by stash-tar.1: consumes tar backend name in config.SUPPORTED | stash/report.py | - [ ] `report.label("tar")` returns the tar label<br>- [ ] dir/zip labels unchanged |
