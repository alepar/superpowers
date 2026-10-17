Status: NEEDS_FIX

# Legacy interpretation adapter

Adapter-only synthetic labels and item boundaries. Exact raw source, original headings, complete passages, line/byte locators and interpretation limits are recorded in the hash-bound metadata. This document proposes history representation and makes no acceptance, identity-link or resolution decision.

## Concerns — adapter/pending-obligation/raw-section-2/raw-byte-000000708

- ⚠️ Coordinator-owned fresh-agent post behavior evaluation remains explicitly pending per implementer report; deterministic fixtures do not establish that acceptance criterion (owner: super-plan-ufz.8 coordinator).

## Findings — adapter/review-finding/raw-section-5/raw-byte-000001114

- skills/super-auto/scripts/report-status:107 — Discover and archive the actual direct-review package `final-review-ID.md.diff`. The collector discovers only `prefix+'.diff'`, while the real Workflow producer at skills/super-code/coordinator.js:2757 invokes review-package with `${reviewPath}.diff` and reviewPath is `final-review-ID.md`. A settled direct review can therefore return collection complete without preserving its input diff, allowing cleanup to destroy that source. The same incorrect suffix in hasBundle (:93) can classify a null/no-work return with a leftover actual direct package as artifact-free. Update discovery and null bundle detection to match the producer, and use producer-shaped .md.diff fixtures (tests/super-auto/test-scripts.sh:352 currently invents the shorter .diff filename). Retain byte-for-byte/idempotent archive assertions for that real filename.

## Findings — adapter/review-finding/raw-section-6/raw-byte-000002012

- [pending-behavior-eval] Coordinator-owned fresh-agent post behavior evaluation for super-plan-ufz.8 remains pending; see the implementer report's evaluation section.
