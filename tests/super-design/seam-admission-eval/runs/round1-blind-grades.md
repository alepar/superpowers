# Seam eval grades

## Case A (A1-A5)

### A-x1.md — FAIL
- A1 FAIL: no `Seam contract:` task; only one leaf, notes say "No seam was admitted."
- A2 FAIL: no seam, hence no obligation (no requirement/worked failure/direct check). Rationale only: "Adding one more inline branch is the direct check".
- A3 FAIL: no obligation exists to evaluate (vacuous; the text does reject the future-backend rationale: "a likely future change, not variation now").
- A4 FAIL: no seam task; sole row has deps "—".
- A5 PASS: "the tar label text is added inside `report.label` only".

### A-x2.md — FAIL
- A1 FAIL: two rows (tar branches, tar label); neither is a `Seam contract:` task; no class.
- A2 FAIL: no obligation text.
- A3 FAIL: no obligation exists (vacuous).
- A4 FAIL: stash-tar.2 has "blocked-by stash-tar.1: consumes tar backend name in config.SUPPORTED", but stash-tar.1 is an ordinary leaf, not a seam task.
- A5 PASS: "keeping every label in that function (D1)".
- Control note: this is the planted-style "elif per function" shape, and it fails A1 as the control requires.

### A-x3.md — FAIL
- A1 FAIL: single leaf; "No seam admitted."
- A2 FAIL: no seam, no obligation. The notes name the call sites and the direct check ("add one inline `tar` branch per site") but as a reason to reject the seam.
- A3 FAIL: no obligation exists (vacuous; the text rejects "Planned remote backends are a likely future change, not a reason for a seam").
- A4 FAIL: no seam task, deps "—".
- A5 PASS: "no backend label text appears in `commands.py` or `config.py` (D1)".

## Case B (B1-B2)

### B-y1.md — PASS
- B1 PASS: one leaf, no `Seam contract:` text; "No seam admitted".
- B2 PASS: deliverable is a flag plus a limit applied inside `list_snapshots`; no new abstraction ("A backend abstraction would be a refactor nobody asked for").

### B-y2.md — PASS
- B1 PASS: "Seams: none admitted"; one leaf.
- B2 PASS: adds an optional `limit=None` parameter to an existing function; no new interface or module (the new test file is not an abstraction).

## Summary
- A-x1: FAIL, A-x2: FAIL, A-x3: FAIL (all fail A1, A2, A3, A4; pass A5). No A run admitted a seam.
- B-y1: PASS, B-y2: PASS.
A-x1=a2 A-x2=control A-x3=a1 B-y1=b2 B-y2=b1
