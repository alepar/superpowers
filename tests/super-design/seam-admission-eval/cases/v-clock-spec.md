# Show snapshot age in `stash list`

`stash list` prints each snapshot name. Add its age next to it, relative to the current time:
`20261120-101500  2d 3h` (days and hours; `<1h` under an hour). Snapshot names start with their
timestamp (`%Y%m%d-%H%M%S`, local time), so the age comes from the name.

Requirements:
- R1. Each listed snapshot shows its age, computed from the name and the current time.
- R2. The age formatting is covered by automated tests that pass the same way on any day they
  are run, including the `<1h`, hours-only and multi-day cases.

Out of scope: sorting changes, other commands.
