# Brief assembler (super-code)

super-code's coordinator dispatches the assembler with this file's absolute path and the values of
the bracketed parameters (the `assemblePrompt` builder in coordinator.js). Model tier: `mechanical`.
Everything below the line is addressed to the dispatched agent.

---

The assembler gathers inputs into one directory with tool calls and judges nothing: no verdicts, no
severity, no summaries beyond the extraction each section defines. Write only inside [OUT_DIR];
never edit another file, never commit, and don't spawn subagents.

Parameters: [CONSUMER], [INSTANCE], [OUT_DIR], [WORKTREE], [BASE], [HEAD], [SECTIONS] (one
`name: definition` line per digest section), [CLUSTERS] (yes or no), [THRESHOLD] (tokens),
[ASSEMBLED_SIZE] (the size script's command), [LEDGER], [WORKSPACE], [SPEC_PATHS].

1. `cd [WORKTREE]`. Review consumers (`final-review`, `roast-code`) receive captured commit
   identities as [BASE] and [HEAD]; verify both with `git rev-parse --verify <sha>^{commit}`.
   Other consumers resolve command-valued inputs once before collecting their data.
   Empty the instance directory first:
   `rm -rf [OUT_DIR] && mkdir -p [OUT_DIR]/slices`.
2. `git diff --stat [BASE]..[HEAD] > [OUT_DIR]/diffstat.txt`.
3. Write `[OUT_DIR]/digest.md` with one `## <name>` heading per [SECTIONS] line, in that order, each
   built only from the source its definition names. Copy; don't paraphrase or rank. A source that has
   nothing gets the line `none`.
4. Slices: one file per changed source file, `git diff [BASE]..[HEAD] -- <file>` written to
   `[OUT_DIR]/slices/<path with each / replaced by __>.diff`.
   Open source with `git show [HEAD]:<path>` so a concurrent caller advance cannot change it.
5. When [CLUSTERS] is yes, group the changed files by import and call edges between them (an edge
   when one changed file imports or calls a symbol another defines), else by top-level directory,
   never by a count of files. Write `[OUT_DIR]/clusters.json`:
   `{"changed": ["<repo path>", …], "clusters": [{"name": "<name>", "files": ["<repo path>", …], "slices": ["slices/<file>", …]}]}`
   with every changed file in exactly one cluster and each cluster's slices the ones for its files.
   Each `name` is a slug: lowercase letters, digits and `-` only (e.g. `run-marker`, `hooks`), unique in the file.
6. Run `[ASSEMBLED_SIZE] [OUT_DIR] --threshold [THRESHOLD]`. When [CLUSTERS] is yes and it prints
   `fits: no`, re-cluster once by subdirectory each cluster printed as `cluster-fits: <name> no`
   (update `clusters.json`), then run
   `[ASSEMBLED_SIZE] [OUT_DIR] --threshold [THRESHOLD] --clusters-required`.
7. Relay the LAST run of the size script unchanged: `exit` is its exit code (any exit code, including
   3 and 4, is relayed, not fixed), `fits` its `fits:` line verbatim, `clusterFits` its
   `cluster-fits:` lines verbatim (an empty list when it printed none), `clusters` the number of
   clusters in `clusters.json` (0 when none), `dir` is [OUT_DIR]. Set `cause` only when you could not
   finish a step, naming it.
