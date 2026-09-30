# Report template (the rollup issue body)

One issue per run. This shape is load-bearing — it is the form three rounds of real
cross-machine feedback converged on, and every section exists because its absence cost a
consumer time. Fill every section; write `none` under a heading rather than dropping it.

```markdown
# <run-slug>: <one-line summary of the top finding>

Plugin: <version>. Run: <scale — bead count / rounds / duration if known>, <date>.

## Defects
<!-- ordered by impact; each: -->
### <n>. <claim>
- **Evidence:** <quoted lines / numbers from this run>
- **Premise to verify:** <what the fix relies on — upstream must check this before building>
- **Suggested fix shape:** <one advisory line, not a prescription>

## Run metrics
<!-- always filled: `none` under any subsection whose source was absent, and the absent source
     named in `## Not established`. A missing source never blocks filing. A standalone
     super-design run (no ledger) renders Fix loop and Merge-back as `none`. -->
### Judge panel
<!-- one line per roast report: mode, iteration, independence, seat-agreement line -->
### Fix loop
<!-- the `Metrics: completions` line (review clean / after fix pass / parked / re-entry closes)
     and the `Metrics: fix-pass` line (entered / FIXED / BLOCKED) -->
### Merge-back
<!-- the `Metrics: merges` line (including check-fails and how many were fixed) and the
     `ledger-check` line; count of `Merge:` lines with conflict / seam-review fired /
     check fail→fixed / check fail / → blocker -->
### Coverage
<!-- the `requirements:` line per coverage round and the `scope-filter:` line per fix round -->
### Bead graph
| id | type | title | what (first sentence of description) |
| --- | --- | --- | --- |

| dependent | blocker | reason (from `blocked-by` line, or `unstated`) |
| --- | --- | --- |

## Design questions
<!-- offered for adjudication, not as corrections; each argues both sides and ends with: -->
<!-- "If upstream decides otherwise, please state the position explicitly so downstream can
     reconcile against words rather than silence." -->

## Doc gaps

## Already fixed — do not re-litigate
<!-- anything this run worked around that is known-fixed in <version/commit>, so upstream
     doesn't re-fix it and the reader doesn't re-report it -->

## Not established
<!-- honest caveats: claims this report does NOT make — unmeasured speedups, untuned defaults,
     single-run observations — named as such so nobody cites them as findings -->
- By default: the coordinator's ledger-append path is fire-and-forget and can lose a line
  without the coordinator noticing, so every ledger-derived count in `## Run metrics` (Fix loop,
  Merge-back) is a lower bound. The `Metrics: ledger-check` line is the one cross-check that
  exists.

## Verification bar
<!-- what upstream should run/check before trusting a fix: the harness, the probes, a live
     round — whatever this run's evidence says would have caught the defects listed above -->

---
If a premise above is wrong, stop and say so rather than improvising a larger change.
```
