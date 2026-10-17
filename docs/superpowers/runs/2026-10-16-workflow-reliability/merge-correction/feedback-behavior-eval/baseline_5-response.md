## Metadata

Plugin: version unavailable. Run: scale unavailable, date unavailable.

## Evidence qualification

The exact first-parent Git range contains three merge commits: task bead-X (1111111), task bead-Y (2222222), and absorption of updated main (3333333). Independent complete task-ID reconciliation identifies bead-X and bead-Y as the only task landings. The complete ledger has successful `Merge:` lines for bead-X and bead-Y and a `baseAbsorbed` record for 3333333. The third merge commit is therefore accounted for as base absorption and contributes zero task landings. There is no ledger incompleteness finding: although three first-parent merge commits exceed the two successful task `Merge:` lines, the additional commit has its matching `baseAbsorbed` record, and all ledger bytes and Git identities were verified with no missing task or unknown source remaining.

This is a hand-authored evidence packet for a textual decision test, not evidence of actual run performance. No profiling was requested, so no timing, performance, or profile claim is established.

## Read scope and limits

Read the complete supplied `baseline-context.md` and `case.txt` only. Did not read protocol, rubric, or other responses; inspect repositories or external sources; or perform development, Git, tracker, Herdr, process, network, or other mutations. This response is limited to the requested Metadata section and its evidence-qualification note. Plugin version, run scale, and date were not supplied and remain unavailable.
