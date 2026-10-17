# Bounded historical task-report intake

All **79** requested source entries have a lossless sidecar: **74** former parser gaps and **5** existing strict parses (**24** existing strict occurrences). Every original section label, heading position, body and full item/passage text is retained with exact byte and line locators. All 110 raw-inventory SHA-256 values and byte counts match the inventory. No raw source, source code, run.md or Git state was changed.

The sidecars retain **622 prospective passages** and **27 structured-field appearances**. Those counts include declarations, qualifications and repeated renditions; they are not counts of unique defects or new canonical occurrences. No parse failure, DONE/FIXED/CLEAN status, later silence or reported fix was converted into None or resolution.

## Boundaries and uncertainties

A sidecar is an evidence representation, not a replacement parser or an accepted source record. All 74 original strict-parser failures remain visibly qualified. Narrative reports without standardized headings retain their complete text; unheaded fields retain a null section rather than an invented heading. Explicit None declarations are retained as declarations, while qualified None plus remaining obligations is retained in full. JSON renditions and prose renditions stay separate. No identities are automatically merged.

The three known Task 19 handoff references are separately hash-checked and retained. Both report/review handoff copies are byte-identical to their canonical raw-intake counterparts; no byte mismatch is established. No canonical source record or semantic disposition was changed. The diff is supporting evidence, not a finding report. The other 33 raw-inventory artifacts (29 input briefs and four JSON helpers) are explicitly accounted for outside the requested 79-source report population.

## Source coverage

| # | Source | Format | Passages | Existing strict occurrences | Sidecar |
|---|---|---|---:|---:|---|
| 1 | `inv-mvc60k41-xt8p35rk04d/task-1-review` | legacy-task-review | 5 | 0 | [01-task-1-review.sidecar.json](sidecars/01-task-1-review.sidecar.json) |
| 2 | `inv-mvc60k41-xt8p35rk04d/task-10-report-fix` | legacy-task-report | 8 | 0 | [02-task-10-report-fix.sidecar.json](sidecars/02-task-10-report-fix.sidecar.json) |
| 3 | `inv-mvc60k41-xt8p35rk04d/task-10-report` | legacy-task-report | 19 | 0 | [03-task-10-report.sidecar.json](sidecars/03-task-10-report.sidecar.json) |
| 4 | `inv-mvc60k41-xt8p35rk04d/task-10-review-seam` | legacy-task-review | 15 | 0 | [04-task-10-review-seam.sidecar.json](sidecars/04-task-10-review-seam.sidecar.json) |
| 5 | `inv-mvc60k41-xt8p35rk04d/task-10-review` | legacy-task-review | 9 | 0 | [05-task-10-review.sidecar.json](sidecars/05-task-10-review.sidecar.json) |
| 6 | `inv-mvc60k41-xt8p35rk04d/task-11-report-fix` | legacy-task-report | 9 | 0 | [06-task-11-report-fix.sidecar.json](sidecars/06-task-11-report-fix.sidecar.json) |
| 7 | `inv-mvc60k41-xt8p35rk04d/task-11-report` | legacy-task-report | 19 | 0 | [07-task-11-report.sidecar.json](sidecars/07-task-11-report.sidecar.json) |
| 8 | `inv-mvc60k41-xt8p35rk04d/task-11-review-seam-round-1` | legacy-task-review | 9 | 0 | [08-task-11-review-seam-round-1.sidecar.json](sidecars/08-task-11-review-seam-round-1.sidecar.json) |
| 9 | `inv-mvc60k41-xt8p35rk04d/task-11-review-seam` | legacy-task-review | 10 | 0 | [09-task-11-review-seam.sidecar.json](sidecars/09-task-11-review-seam.sidecar.json) |
| 10 | `inv-mvc60k41-xt8p35rk04d/task-11-review` | legacy-task-review | 17 | 0 | [10-task-11-review.sidecar.json](sidecars/10-task-11-review.sidecar.json) |
| 11 | `inv-mvc60k41-xt8p35rk04d/task-12-report` | legacy-task-report | 16 | 0 | [11-task-12-report.sidecar.json](sidecars/11-task-12-report.sidecar.json) |
| 12 | `inv-mvc60k41-xt8p35rk04d/task-12-review-seam` | legacy-task-review | 1 | 0 | [12-task-12-review-seam.sidecar.json](sidecars/12-task-12-review-seam.sidecar.json) |
| 13 | `inv-mvc60k41-xt8p35rk04d/task-12-review` | legacy-task-review | 4 | 0 | [13-task-12-review.sidecar.json](sidecars/13-task-12-review.sidecar.json) |
| 14 | `inv-mvc60k41-xt8p35rk04d/task-12-seam-findings` | seam-finding-artifact | 2 | 0 | [14-task-12-seam-findings.sidecar.json](sidecars/14-task-12-seam-findings.sidecar.json) |
| 15 | `inv-mvc60k41-xt8p35rk04d/task-13-report` | legacy-task-report | 4 | 0 | [15-task-13-report.sidecar.json](sidecars/15-task-13-report.sidecar.json) |
| 16 | `inv-mvc60k41-xt8p35rk04d/task-13-review` | legacy-task-review | 4 | 0 | [16-task-13-review.sidecar.json](sidecars/16-task-13-review.sidecar.json) |
| 17 | `inv-mvc60k41-xt8p35rk04d/task-14-report-fix` | legacy-task-report | 12 | 0 | [17-task-14-report-fix.sidecar.json](sidecars/17-task-14-report-fix.sidecar.json) |
| 18 | `inv-mvc60k41-xt8p35rk04d/task-14-report` | legacy-task-report | 21 | 0 | [18-task-14-report.sidecar.json](sidecars/18-task-14-report.sidecar.json) |
| 19 | `inv-mvc60k41-xt8p35rk04d/task-14-review` | legacy-task-review | 5 | 0 | [19-task-14-review.sidecar.json](sidecars/19-task-14-review.sidecar.json) |
| 20 | `inv-mvc60k41-xt8p35rk04d/task-15-report-fix` | legacy-task-report | 12 | 0 | [20-task-15-report-fix.sidecar.json](sidecars/20-task-15-report-fix.sidecar.json) |
| 21 | `inv-mvc60k41-xt8p35rk04d/task-15-report` | legacy-task-report | 22 | 0 | [21-task-15-report.sidecar.json](sidecars/21-task-15-report.sidecar.json) |
| 22 | `inv-mvc60k41-xt8p35rk04d/task-15-review-seam` | legacy-task-review | 2 | 0 | [22-task-15-review-seam.sidecar.json](sidecars/22-task-15-review-seam.sidecar.json) |
| 23 | `inv-mvc60k41-xt8p35rk04d/task-15-review` | legacy-task-review | 5 | 0 | [23-task-15-review.sidecar.json](sidecars/23-task-15-review.sidecar.json) |
| 24 | `inv-mvc60k41-xt8p35rk04d/task-15-seam-findings` | seam-finding-artifact | 2 | 0 | [24-task-15-seam-findings.sidecar.json](sidecars/24-task-15-seam-findings.sidecar.json) |
| 25 | `inv-mvc60k41-xt8p35rk04d/task-16-report` | legacy-task-report | 22 | 0 | [25-task-16-report.sidecar.json](sidecars/25-task-16-report.sidecar.json) |
| 26 | `inv-mvc60k41-xt8p35rk04d/task-16-review-seam` | legacy-task-review | 2 | 0 | [26-task-16-review-seam.sidecar.json](sidecars/26-task-16-review-seam.sidecar.json) |
| 27 | `inv-mvc60k41-xt8p35rk04d/task-16-review` | legacy-task-review | 4 | 0 | [27-task-16-review.sidecar.json](sidecars/27-task-16-review.sidecar.json) |
| 28 | `inv-mvc60k41-xt8p35rk04d/task-16-seam-findings` | seam-finding-artifact | 2 | 0 | [28-task-16-seam-findings.sidecar.json](sidecars/28-task-16-seam-findings.sidecar.json) |
| 29 | `inv-mvc60k41-xt8p35rk04d/task-17-review` | legacy-task-review | 5 | 0 | [29-task-17-review.sidecar.json](sidecars/29-task-17-review.sidecar.json) |
| 30 | `inv-mvc60k41-xt8p35rk04d/task-18-report` | legacy-task-report | 8 | 0 | [30-task-18-report.sidecar.json](sidecars/30-task-18-report.sidecar.json) |
| 31 | `inv-mvc60k41-xt8p35rk04d/task-18-review` | legacy-task-review | 20 | 0 | [31-task-18-review.sidecar.json](sidecars/31-task-18-review.sidecar.json) |
| 32 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-19-review` | legacy-task-review | 10 | 0 | [32-task-19-review.sidecar.json](sidecars/32-task-19-review.sidecar.json) |
| 33 | `inv-mvc60k41-xt8p35rk04d/task-2-report` | legacy-task-report | 4 | 0 | [33-task-2-report.sidecar.json](sidecars/33-task-2-report.sidecar.json) |
| 34 | `inv-mvc60k41-xt8p35rk04d/task-2-review-seam` | legacy-task-review | 8 | 0 | [34-task-2-review-seam.sidecar.json](sidecars/34-task-2-review-seam.sidecar.json) |
| 35 | `inv-mvc60k41-xt8p35rk04d/task-2-review` | legacy-task-review | 7 | 0 | [35-task-2-review.sidecar.json](sidecars/35-task-2-review.sidecar.json) |
| 36 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-20-report` | legacy-task-report | 10 | 0 | [36-task-20-report.sidecar.json](sidecars/36-task-20-report.sidecar.json) |
| 37 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-20-review` | legacy-task-review | 6 | 0 | [37-task-20-review.sidecar.json](sidecars/37-task-20-review.sidecar.json) |
| 38 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-21-report` | legacy-task-report | 2 | 0 | [38-task-21-report.sidecar.json](sidecars/38-task-21-report.sidecar.json) |
| 39 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-21-review` | legacy-task-review | 2 | 0 | [39-task-21-review.sidecar.json](sidecars/39-task-21-review.sidecar.json) |
| 40 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-22-report` | legacy-task-report | 7 | 0 | [40-task-22-report.sidecar.json](sidecars/40-task-22-report.sidecar.json) |
| 41 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-22-review` | legacy-task-review | 9 | 0 | [41-task-22-review.sidecar.json](sidecars/41-task-22-review.sidecar.json) |
| 42 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-23-review` | legacy-task-review | 8 | 0 | [42-task-23-review.sidecar.json](sidecars/42-task-23-review.sidecar.json) |
| 43 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-24-report` | legacy-task-report | 4 | 0 | [43-task-24-report.sidecar.json](sidecars/43-task-24-report.sidecar.json) |
| 44 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-24-review` | legacy-task-review | 7 | 0 | [44-task-24-review.sidecar.json](sidecars/44-task-24-review.sidecar.json) |
| 45 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-25-report` | legacy-task-report | 4 | 0 | [45-task-25-report.sidecar.json](sidecars/45-task-25-report.sidecar.json) |
| 46 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-25-review` | legacy-task-review | 2 | 0 | [46-task-25-review.sidecar.json](sidecars/46-task-25-review.sidecar.json) |
| 47 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-26-report` | legacy-task-report | 2 | 0 | [47-task-26-report.sidecar.json](sidecars/47-task-26-report.sidecar.json) |
| 48 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-26-review` | legacy-task-review | 4 | 0 | [48-task-26-review.sidecar.json](sidecars/48-task-26-review.sidecar.json) |
| 49 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-27-report` | legacy-task-report | 8 | 0 | [49-task-27-report.sidecar.json](sidecars/49-task-27-report.sidecar.json) |
| 50 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-27-review` | legacy-task-review | 5 | 0 | [50-task-27-review.sidecar.json](sidecars/50-task-27-review.sidecar.json) |
| 51 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-28-report` | legacy-task-report | 2 | 0 | [51-task-28-report.sidecar.json](sidecars/51-task-28-report.sidecar.json) |
| 52 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-28-review` | legacy-task-review | 4 | 0 | [52-task-28-review.sidecar.json](sidecars/52-task-28-review.sidecar.json) |
| 53 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-29-report` | legacy-task-report | 2 | 0 | [53-task-29-report.sidecar.json](sidecars/53-task-29-report.sidecar.json) |
| 54 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-29-review` | legacy-task-review | 9 | 0 | [54-task-29-review.sidecar.json](sidecars/54-task-29-review.sidecar.json) |
| 55 | `inv-mvc60k41-xt8p35rk04d/task-3-report` | legacy-task-report | 6 | 0 | [55-task-3-report.sidecar.json](sidecars/55-task-3-report.sidecar.json) |
| 56 | `inv-mvc60k41-xt8p35rk04d/task-3-review-seam` | legacy-task-review | 2 | 0 | [56-task-3-review-seam.sidecar.json](sidecars/56-task-3-review-seam.sidecar.json) |
| 57 | `inv-mvc60k41-xt8p35rk04d/task-3-review` | legacy-task-review | 4 | 0 | [57-task-3-review.sidecar.json](sidecars/57-task-3-review.sidecar.json) |
| 58 | `inv-mvc60k41-xt8p35rk04d/task-4-report` | legacy-task-report | 20 | 0 | [58-task-4-report.sidecar.json](sidecars/58-task-4-report.sidecar.json) |
| 59 | `inv-mvc60k41-xt8p35rk04d/task-4-review-seam` | legacy-task-review | 13 | 0 | [59-task-4-review-seam.sidecar.json](sidecars/59-task-4-review-seam.sidecar.json) |
| 60 | `inv-mvc60k41-xt8p35rk04d/task-4-review` | legacy-task-review | 5 | 0 | [60-task-4-review.sidecar.json](sidecars/60-task-4-review.sidecar.json) |
| 61 | `inv-mvc60k41-xt8p35rk04d/task-4-seam-findings` | seam-finding-artifact | 2 | 0 | [61-task-4-seam-findings.sidecar.json](sidecars/61-task-4-seam-findings.sidecar.json) |
| 62 | `inv-mvc60k41-xt8p35rk04d/task-5-report` | legacy-task-report | 4 | 0 | [62-task-5-report.sidecar.json](sidecars/62-task-5-report.sidecar.json) |
| 63 | `inv-mvc60k41-xt8p35rk04d/task-5-review-seam` | legacy-task-review | 8 | 0 | [63-task-5-review-seam.sidecar.json](sidecars/63-task-5-review-seam.sidecar.json) |
| 64 | `inv-mvc60k41-xt8p35rk04d/task-5-review` | legacy-task-review | 4 | 0 | [64-task-5-review.sidecar.json](sidecars/64-task-5-review.sidecar.json) |
| 65 | `inv-mvc60k41-xt8p35rk04d/task-6-report` | legacy-task-report | 5 | 0 | [65-task-6-report.sidecar.json](sidecars/65-task-6-report.sidecar.json) |
| 66 | `inv-mvc60k41-xt8p35rk04d/task-6-review` | legacy-task-review | 6 | 0 | [66-task-6-review.sidecar.json](sidecars/66-task-6-review.sidecar.json) |
| 67 | `inv-mvc60k41-xt8p35rk04d/task-7-report` | legacy-task-report | 3 | 0 | [67-task-7-report.sidecar.json](sidecars/67-task-7-report.sidecar.json) |
| 68 | `inv-mvc60k41-xt8p35rk04d/task-7-review-seam` | legacy-task-review | 2 | 0 | [68-task-7-review-seam.sidecar.json](sidecars/68-task-7-review-seam.sidecar.json) |
| 69 | `inv-mvc60k41-xt8p35rk04d/task-7-review` | legacy-task-review | 18 | 0 | [69-task-7-review.sidecar.json](sidecars/69-task-7-review.sidecar.json) |
| 70 | `inv-mvc60k41-xt8p35rk04d/task-8-report` | legacy-task-report | 4 | 0 | [70-task-8-report.sidecar.json](sidecars/70-task-8-report.sidecar.json) |
| 71 | `inv-mvc60k41-xt8p35rk04d/task-8-review` | legacy-task-review | 8 | 0 | [71-task-8-review.sidecar.json](sidecars/71-task-8-review.sidecar.json) |
| 72 | `inv-mvc60k41-xt8p35rk04d/task-9-report` | legacy-task-report | 3 | 0 | [72-task-9-report.sidecar.json](sidecars/72-task-9-report.sidecar.json) |
| 73 | `inv-mvc60k41-xt8p35rk04d/task-9-review` | legacy-task-review | 4 | 0 | [73-task-9-review.sidecar.json](sidecars/73-task-9-review.sidecar.json) |
| 74 | `inv-mvc60k41-xt8p35rk04d/roast-code-round-1` | historical-roast-report | 16 | 0 | [74-2026-10-16-workflow-reliability-roast-pr-1.sidecar.json](sidecars/74-2026-10-16-workflow-reliability-roast-pr-1.sidecar.json) |
| 75 | `inv-mvc60k41-xt8p35rk04d/task-1-report` | legacy-task-report | 6 | 2 | [75-task-1-report.sidecar.json](sidecars/75-task-1-report.sidecar.json) |
| 76 | `inv-mvc60k41-xt8p35rk04d/task-17-report` | legacy-task-report | 15 | 7 | [76-task-17-report.sidecar.json](sidecars/76-task-17-report.sidecar.json) |
| 77 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-19-report` | legacy-task-report | 11 | 4 | [77-task-19-report.sidecar.json](sidecars/77-task-19-report.sidecar.json) |
| 78 | `inv-c96916a964634bb0bb5f2bd3b8e1769b/task-23-report` | legacy-task-report | 22 | 7 | [78-task-23-report.sidecar.json](sidecars/78-task-23-report.sidecar.json) |
| 79 | `workflow-reliability-20261017T054545/roast-design-round-1` | historical-roast-report | 10 | 4 | [79-2026-10-16-workflow-reliability-roast-design-1.sidecar.json](sidecars/79-2026-10-16-workflow-reliability-roast-design-1.sidecar.json) |

## Retained Task 19 variants

- `fix-r1-handoff/source/task-19-report.md`: SHA-256 `f87cb8fbc6ae1145de527bfe6214f2c55e8430d0d7a1f4d51463a3d00cbcc44e`, 47192 bytes; canonical byte match: True. [variant-1-task-19-report.md.sidecar.json](variants/variant-1-task-19-report.md.sidecar.json)
- `fix-r1-handoff/source/task-19-review.md`: SHA-256 `caa0325029349cd0cf07f973ad92b84ffee8025964dc55d73ab02f40e3e4eb43`, 20313 bytes; canonical byte match: True. [variant-2-task-19-review.md.sidecar.json](variants/variant-2-task-19-review.md.sidecar.json)
- `fix-r1-handoff/source/task-19-review-initial.diff`: SHA-256 `ba6e49d02081b96f5d0e0edc698ea5f1a8a3bdd4b5ad6d3ad6beb252fbc525a7`, 33655 bytes; canonical byte match: None. [variant-3-task-19-review-initial.diff.sidecar.json](variants/variant-3-task-19-review-initial.diff.sidecar.json)

## Reproduce

Run `python3 adapt_history.py` from any directory. The utility reads only the named inventory/raw/retained paths and writes only this output directory. It asserts raw hashes/lengths, exact section reconstruction, exact passage byte locators and the 79-source population. It runs no product tests and modifies no canonical source or ledger.
