# Parallelism Pass Prompt Template

Use this template for §Parallelism Pass: once per run, on the settled tree, after the roast loop
and before the design-ready point. It looks at the whole bead graph for cheap ways to shorten
the longest chain: edges that encode narrative order, epic-level gates whose dependents need only
specific leaves, and chains serialized on one shared file. **Model: opus.** Fresh context.

The numbers come from `scripts/graph-shape`; the reviewer judges only the edges. The caller
pastes §Decomposition's "Blocking deps encode genuine blocking" paragraph and its five edge rules
verbatim into `## Edge rules`.

```
Task tool (general-purpose), model: opus:
  description: "parallelism pass: [ROOT_TOPIC]"
  prompt: |
    You are looking at a settled design tree just before it goes to execution. Execution runs
    every ready bead at once and spends one round per bead along a chain of blocking edges, so
    the longest chain sets the run's length. Your job: find the low-hanging ways to shorten it.
    Change edges, not scope: no new work, no re-decomposition.

    You are read-only. Read the dump below and use `bd show` / `bd list` as needed. Edit
    nothing, add or remove no edges, create no beads. Your output is a list of proposed changes
    the caller verifies and applies.

    ## Graph numbers (from scripts/graph-shape)
    [GRAPH_SHAPE_OUTPUT — verbatim: the `shape:` line, one `edge:` line per candidate with the
    depth if only that edge were removed, and the `summary:` line. Seam-contract and
    integration-sweep edges are already excluded; leave them alone.]

    ## Task tree
    [DUMP_PATH — `bd list --label sp:<root-epic-id> --all --json --limit 0`. Each bead's
    description carries its files-touched hint, its `owns:` / `consumes:` boundaries, and a
    `blocked-by <id>: consumes <artifact>` line per blocking edge.]

    ## Edge rules
    [Paste §Decomposition's "Blocking deps encode genuine blocking" paragraph and its five edge
    rules here, verbatim.]

    ## What to look at
    - Every `edge:` line. Is the named artifact real, and does the dependent's work consume it?
      The `blocked-by` line alone does not make an edge real.
    - An epic-level edge: which leaves under the dependent actually consume which leaves of the
      blocker? Narrow the edge to those leaf→leaf edges.
    - An edge aimed at a sub-epic's headline bead when the consumed artifact lands earlier:
      repoint it at the earliest producer.
    - The critical-path beads: consecutive beads that are chained only because they declare the
      same file. That is a proposal (split the file, or a seam contract), not an edge change.

    **Safe** means the caller may apply the change with no human in the loop. Mark a change
    `safe yes` only when, for every wait the change removes, the two beads declare no file in
    common and nothing else in either bead (`owns:` / `consumes:`, acceptance criteria,
    `(needs: <id>)` citations, the description body) references the other's output or
    interface. Otherwise `safe no`. Proposals are never safe.

    `keep` is a normal answer for an edge that carries a real artifact. Say so in one line and
    move on. Report only changes that shorten the chain or remove an epic-level gate.

    ## Output (exactly these lines)

    change: <dependent> <- <blocker> · drop · safe yes|no · <reason>
    change: <dependent> <- <blocker> · narrow · <new-dependent> <- <producer>: <artifact>; … · safe yes|no · <reason>
    change: <dependent> <- <blocker> · repoint · <dependent> <- <producer>: <artifact> · safe yes|no · <reason>
    change: <dependent> <- <blocker> · keep · <the artifact that makes it real>
    proposal: <bead ids> · split-file <path> | seam-contract <boundary> · <one line>
    expected: depth <D>→<D'> · width <W>→<W'>   (if every safe change is applied)
    recommendation: <one or two sentences: which changes matter most, and why>

    One `change:` line per `edge:` line in the numbers above, in the same order; `proposal:`
    lines only when you found one.
```
