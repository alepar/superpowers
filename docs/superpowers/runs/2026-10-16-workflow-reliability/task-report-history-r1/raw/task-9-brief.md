## Task 9: Extract complete source finding occurrences

**filesTouched:**
- `skills/super-code/scripts/report-verdict`
- `tests/super-code/test-report-verdict.sh`

**filesToRead:**
- `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md`
- `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-finding-continuity-design.md`
- `skills/super-roast/reporter-prompt.md`
- `tests/super-code/fixtures/report-verdict/final-review-real.md`
- `tests/super-code/fixtures/report-verdict/roast-report.md`

**Bead:** super-plan-ufz.8.2. **Surface:** 17681 tokens at the integration base.

**Scope:** Complete additive finding occurrence extraction only; no storage, semantic matching, disposition, scope routing or external roast-ledger ownership.

**Interfaces:** Add report-verdict --complete --source <immutable-source-id> FILE emitting JSON {version:1,source,artifact,kind,verdict,occurrences:[{section,position,key,text}]}. source is caller-supplied immutable identity, artifact preserves caller path, position is deterministic section-local occurrence position and text is original uncapped finding text (including continuations). Existing default and --keys output/exit semantics stay byte-compatible. Complete mode rejects missing/unreadable/unrecognized or malformed source as an explicit nonzero error, never an empty clean result.

### Acceptance (verbatim)

- [ ] Complete additive extraction includes all relevant finding sections including deferred items and preserves occurrence/source references and original text.
- [ ] Existing default and --keys outputs retain their semantics.
- [ ] Repeated parsing of the same source retains stable occurrences; malformed/missing source is explicit, not an empty clean review.
- [ ] Focused extraction fixtures pass.

### Global Constraints (verbatim)

- Extend existing components; preserve Workflow and ordinary-subagent paths and compact coordinator inputs.
- Concurrent roast-redesign run owns redesign triggers/amend and its ledger; reconcile the finding-continuity seam before implementation.

### Implementation and verification

1. Extend test-report-verdict.sh with temporary report fixtures containing Must fix, Untested scope, Deferred OK, all roast Confirmed finding severities and deferred findings, repeated identical lines, nested continuations, unicode, quoted status text, and a valid explicitly empty review. Call complete mode twice with the same immutable source and compare occurrence identities/text; archive-path changes must preserve source/section/position identity rather than treating the copy as a new occurrence.
2. Keep all existing default and --keys fixture assertions. Add missing --source, missing/unreadable file, unknown format and malformed recognized review cases; assert they cannot return successful empty occurrences. Run the failing suite before editing the helper.
3. Extend argument parsing additively, using the existing recognition priority (an exact Verdict heading still wins over quoted task Status). Enumerate every relevant finding section, including deferred and untested entries, without default mode's caps, severity filters or truncation. Preserve raw key/text and section/position for duplicates instead of deduping by wording. Source validation establishes a supplied reference, not semantic matching or trust in a disposition.
4. Emit correctly escaped JSON from complete mode, using repository-available tooling without adding dependencies; reject missing required source fields explicitly. Leave default/--keys parser branches untouched unless sharing a proven compatible recognizer. A valid empty review is empty only with a recognized valid verdict/format and source; unknown/malformed is not clean.
5. Run the shell suite below and compare legacy output byte-for-byte for existing fixtures. Commit the extractor and tests. Report the exact CLI/JSON schema for the downstream .8.4 projection task; no fresh-agent judgment eval is needed for a deterministic extraction-only change.

Run:

```bash
bash tests/super-code/test-report-verdict.sh
```

Expected final result: all task-relevant checks pass; any unavailable or parent-owned live evaluation remains identified separately. **Independently testable deliverable:** The helper can return every source finding occurrence with stable provenance, including deferred entries, while current coordinator summary/key consumers retain their behavior.

