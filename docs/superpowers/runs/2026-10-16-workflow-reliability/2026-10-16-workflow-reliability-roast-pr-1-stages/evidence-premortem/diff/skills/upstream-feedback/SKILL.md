diff --git a/skills/upstream-feedback/SKILL.md b/skills/upstream-feedback/SKILL.md
index fce8fe5a..541a1e02 100644
--- a/skills/upstream-feedback/SKILL.md
+++ b/skills/upstream-feedback/SKILL.md
@@ -57,9 +57,15 @@ append. A standalone run is its own outermost.
      the four-line `Metrics:` block;
    - the ledger's `Profile:` lines, one block per coordinator invocation (`super-code`'s run
      profile: critical path, bottleneck bead, wait causes, merge lane, what-ifs);
-   - the integration branch's merge count, `git log --merges --first-parent <base>..<branch>`,
-     against the ledger's success-path `Merge:` lines. A shortfall goes under Merge-back as
-     `ledger incomplete: <N> merge commits vs <M> Merge: lines`;
+   - task landing identities from `already-merged --landed <branch>` against the ledger's
+     success-path `Merge:`/re-entry IDs and reconciled completed IDs. Report concrete
+     ledger-only/Git-only/completed-only IDs before proposing a cause. `baseAbsorbed` merges
+     contribute zero task landings; duplicate appearances of one task add no landing;
+   - `scope-dispositions --project <run.md>` JSON metrics/gaps when a run record exists.
+     Exit 3 retains supported partial counts. Separate raw occurrences from actionable groups,
+     latest outcomes from durable Recovery fix history, and supported repaired findings from
+     deferred/rejected groups. State missing source populations, including task reviews absent
+     from a roast/final-review-only projection;
    - each coverage round's `requirements:` line and each fix round's `scope-filter:` line from
      `run.md`;
    - a bead-graph dump: `bd list --label sp:<root> --json --status all --limit 0` —
@@ -68,6 +74,12 @@ append. A standalone run is its own outermost.
      `dependencies` array (type `blocks`); the reason for each edge comes from the dependent's
      `blocked-by <id>:` description line, or `unstated` when that line is absent.
 
+   Count friction from recorded defects, workarounds and waste. A normal Workflow/ordinary
+   execution-mechanism selection contributes zero friction events. Preserve source scope and
+   transport status before interpretation: an unreadable ledger can leave “known invocation:
+   completed bd-17; run total unavailable,” rather than zero merges or a clean run. Profiles
+   retain their producer's invocation/residual scope, task/all-agent labels and generation owner.
+
    Gather what exists; name what was unavailable in the report's `## Not established` section
    rather than silently omitting it. A missing ledger, missing detector lines or missing `Metrics:`
    lines while merges exist on the branch is itself a candidate finding (the run took a path that
