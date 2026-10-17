# Task 14 review

Status: NEEDS_FIX
Task: super-plan-ufz.8.3
Base: 44a0c1896f7b52095d4d77b2580ff34c84974533
Head: 9095b2667b4a05fc4f229a725ab266211bce26f7

## Spec compliance

❌ Complete immutable bundle preservation misses the real direct-review package filename. Missing source preservation may authorize cleanup that destroys the only remaining direct input.

✅ Settled collection intent/replay, retained extraction identities, history-derived projection consumption, supported dispositions, and null/no-work distinctions are implemented. Latest invocation readiness remains separate from unresolved history. Historical 2bf1d53 fixtures are unchanged; additive fixtures extend the existing contract.

⚠️ Coordinator-owned fresh-agent post behavior evaluation remains explicitly pending per implementer report; deterministic fixtures do not establish that acceptance criterion (owner: super-plan-ufz.8 coordinator).

Current bead description and acceptance criteria plus comments were read. There are no comments/amendments or unresolved source conflicts.

## Issues

### Critical

None.

### Important

- skills/super-auto/scripts/report-status:107 — Discover and archive the actual direct-review package `final-review-ID.md.diff`. The collector discovers only `prefix+'.diff'`, while the real Workflow producer at skills/super-code/coordinator.js:2757 invokes review-package with `${reviewPath}.diff` and reviewPath is `final-review-ID.md`. A settled direct review can therefore return collection complete without preserving its input diff, allowing cleanup to destroy that source. The same incorrect suffix in hasBundle (:93) can classify a null/no-work return with a leftover actual direct package as artifact-free. Update discovery and null bundle detection to match the producer, and use producer-shaped .md.diff fixtures (tests/super-auto/test-scripts.sh:352 currently invents the shorter .diff filename). Retain byte-for-byte/idempotent archive assertions for that real filename.

### Minor

- [pending-behavior-eval] Coordinator-owned fresh-agent post behavior evaluation for super-plan-ufz.8 remains pending; see the implementer report's evaluation section.

## Test evidence

The report supplies exact isolated-environment commands for `bash tests/super-auto/test-scripts.sh` and `bash tests/super-auto/test-contract-lint.sh`, exit 0, relevant collector/projection assertions, and complete pass summaries. Evidence is plausible for the fixture behavior, but the direct-diff fixture uses a path the actual producer does not write. No tests were run during this review, as instructed.

Test changes inspected using:
`git diff --stat 44a0c1896f7b52095d4d77b2580ff34c84974533..9095b2667b4a05fc4f229a725ab266211bce26f7 -- 'tests/**' 'test/**' 'spec/**' '**/tests/**' '**/test/**' '**/spec/**' '*_test.*' '*.test.*' 'test_*.*' '*_spec.*' '*.spec.*' '**/*_test.*' '**/*.test.*' '**/test_*.*' '**/*_spec.*' '**/*.spec.*'`
and the identical command without `--stat`. Four test/fixture files change; additive collector cases plus a justified replacement of stale latest-review key lint with complete extraction/projection/collection checks. Existing null safety mutations remain. No skipped/deleted behavioral tests or weakened expected values were found.

`git diff --exit-code BASE..HEAD -- tests/super-auto/fixtures/contract-lint/run-state-fields-2bf1d53.txt tests/super-auto/fixtures/contract-lint/run-state-formats-2bf1d53.txt` exited 0.

## Focused boundary checks

Named risk: archival discovery may disagree with the real immutable producer. Traced SKILL.md Review collection's caller to report-status --collect, then checked coordinator.js finalReviewPrompt's concrete direct package path and split manifest producer format. This exposed the Important suffix mismatch. Resume and report consumers explicitly use the shared scope-dispositions projection; the latest verdict remains descriptive.

The package initially could not write outside the sandbox; the authorized artifact-only escalation succeeded and the nonempty package was read. No source/tests/tracker/Herdr state was modified.
