# Workflow reliability corrective continuation: policy and producer/consumer review

Reviewed 2026-10-17, read-only, against `c4c9bf712a0010346bbea0c020f8070d121d597c` on `super-auto/workflow-reliability` in `/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers`. All repository paths below are relative to that checkout and line references describe that revision. The checkout was clean when inspected. This review changed no source, Git state, tracker state, or Herdr state and ran no test suite or live model evaluation. Existing receipts are cited as retained evidence, not newly reproduced results.

## Recommended disposition

1. **Nested archival provenance must not prevent an explicitly incomplete review of independently verified Git source.** Preserve the refusal to trust invalid omission claims, every original gap, and the inability to issue a whole-range ready verdict. Repair the conflation between unavailable omission authority and unavailable product source. Do not simply suppress nested paths or delete the provenance guard.
2. **Known ledger/report inputs must be reconciled into the acceptance population or exposed as coverage gaps.** A design-loop ledger is a supported producer, but a ledger dispute alone is neither a supported rejection nor automatic proof that a code repair is required. Retained-source relevance judgments remain the acceptance mechanism. Repair missing population reconciliation; do not turn every ordinary-status Blocking count into an unconditional gate.

These are bounded corrections within the approved invariants. They do not waive any review, required live measurement, human gate, historical coverage obligation, or original 6.0 operational policy. The recorded escalations and dissent should remain in their original reports; append this ruling and subsequent verification/disposition rather than rewriting those reports as if they had reached consensus.

## Authority and evidence

The approved design `docs/superpowers/specs/2026-10-16-workflow-reliability-design.md` permits simpler mechanisms that preserve guarantees (9), requires stable source identities and permits read-only Git retrieval (17–19), separates implementation/review/measurement/acceptance facts (41–47), retains findings until supported disposition (53–57), and requires supported partial reports with explicit gaps (65–73). It specifically calls for producer/consumer boundary checks (77–79).

The current handoff `docs/superpowers/runs/2026-10-16-workflow-reliability/report.md:37–60` retains both escalations, the incomplete whole-range review, all 690 selector/provenance gaps, incomplete behavioral evidence, and a late acceptance checkpoint with `eligible:false`, 46 pending items and nine gaps. Its 73 registered sources / 273 occurrences / 256 groups are qualified by incomplete historical extraction. Nothing in this review changes those counts or certifies the actual run eligible.

The post-cap report `docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-post-cap-audit.md` retains the selector disagreement under Escalations and classifies the adjacent ledger omission as FYI/pre-existing. Its synthetic probes do not establish actual-run eligibility. The declared current corrective baseline is later than the audit's `f726f0e…`; the relevant mechanisms remain present at the inspected baseline.

For the pinned 6.0 operational baseline, `git show d84541ae:skills/super-code/coordinator.js` has single direct fallback for unavailable assembly at lines 1683–1726, and `git show d84541ae:skills/super-auto/SKILL.md:171` directs fallback on a missing/nonzero assembler result. That does not license current-source drift: the approved reliability design requires captured identities. The new all-or-nothing provenance refusal is product code being corrected, not a reason to silently change the running invocation's pinned policy.

## Escalation 1: omission authority versus available source

### Concrete mechanism

`skills/super-code/scripts/dispatch-text.mjs:125–262` verifies both full commit identities, reads captured Git trees, then treats **every** tracked path whose basename is `run.md` as a potential collection authority (154–155). A copied historical `run.md` containing collection records is interpreted relative to the copy's directory (187); a captured source fixture need not contain the original sibling `reviews/` tree. The selector has no explicit distinction between a live run record and a historical source copy.

Collection errors accumulate into a global `gaps` array. If any gap exists, the selector omits nothing, retains the full changed-path list, and does not emit slices (235–248). The sidecar returns `status:unavailable` and exit 3 (250–262). Refusing omission is correct. Suppressing all independently readable source is an additional behavior.

The refusal propagates through three consumers:

- `skills/super-code/assembler-prompt.md:22–29` relays it as exit 2, cause `review input selection:`, and prohibits clean fallback.
- `skills/super-code/coordinator.js:2326,2361` treats selection refusal like a source-write/source-identity refusal and skips final review dispatch entirely.
- `skills/super-code/coordinator.js:2943` also directs an ordinary final-review agent to return unavailable without a report/direct package when the sidecar has gaps. `skills/super-auto/SKILL.md:171,487` carries the same refusal across roast fallback.

The retained audit describes the actual range with 5,587 changed paths, 22 archive records, zero omissions, 690 gaps, valid Git endpoints, and an initial final-review attempt that returned UNAVAILABLE without a report. Its first cited missing bundle is the nested `…roast-pr-1-stages/evidence-observability/run.md:87` snapshot. That is session evidence of lost review opportunity, beyond the static code trace. I have not independently audited all 690 claims.

### Ruling and ambiguity

The refute seat was correct about the literal implementation contract: current assembler/fallback text explicitly forbids bypassing this refusal. The confirming seats were correct that invalid archive provenance does not invalidate separately verified Git objects. Those statements can both be true. A repair must change the contract at the boundary, not tell reviewers to disregard existing refusal text while claiming compliance.

The approved design supports a bounded review with explicit limitations. It does not require a clean assembly, whole-epic review completion, or repaired archival provenance before an agent may report a concrete current-source defect. A nested snapshot is historical evidence; its filename alone does not establish that its relative collection references are authoritative for current omission decisions.

The exact authority-discovery mechanism is a design choice not settled by the approved spec. Do not resolve it with a broad `reviews/`, `fixtures/`, or directory-name exclusion: legitimate source and unclaimed evidence can live there. Existing selector tests expressly protect that property. The minimum safe correction can retain the current scan and gaps while permitting a separate partial-review route; explicit caller-bound authority roots can be a later or narrowly justified refinement.

### Minimum implementation boundary

Keep immutable invocation binding, commit validation, caller-checkout write guards and existing-output preservation hard failures. Distinguish those failures from an archive/omission provenance gap. On the latter, preserve the original sidecar and failed assembly; allow a separately named, source-bound direct review artifact over declared inspected paths/hunks. Record full base/head, actual inspected coverage, unreviewed scope, and the exact original provenance reference. No unverifiable payload gains omission authority; no historical report or archive is rewritten.

Propagate partial coverage through both ordinary and Workflow dispatch paths and through report extraction/collection. A bounded report must mechanically remain `not ready` or equivalent incomplete status for whole-range acceptance even if the reviewer finds no defects. A complete collection of the partial report means its bytes were preserved, not that whole-epic review passed. The final parent must not convert this into `ready` merely because the suite passed.

The smallest coherent source boundary is the selector result semantics plus the relevant coordinator/assembler/ordinary-caller guards and their targeted documentation. Do not remove the omission validation, broaden retry caps, invent successful historical reviews, or reset the old invocation to overwrite its unavailable result. Any recovered report requires the separately supported collection-reconciliation transition.

### Required regression cases

1. Capture a Git range with a nested historical `run.md` whose referenced bundle is absent and an independent product edit. The product edit can receive an explicitly incomplete direct review; all original gaps remain; no unverified omission or whole-range ready result is possible.
2. Keep existing `tests/super-auto/generated-review-inputs-r1.sh` protections: exact hash-verified omissions only; malformed/conflicting/missing/corrupted collections remain gaps; deleted previously claimed files remain visible; ordinary archive-shaped content remains reviewable; captured source is unchanged by checkout advance.
3. Invalid/missing captured commit, conflicting invocation binding, or write-guard refusal still prevents unauthorized direct review. Existing partial assembly files remain unchanged.
4. Exercise both actual Workflow selection and ordinary `final-review` prompt generation: provenance-only failure reaches the bounded route; identity/write failure does not. A synthetic reviewer returning `ready` cannot erase mechanically known partial coverage.
5. Round-trip the partial report through `report-verdict --complete`, collection/status, and acceptance. Findings survive, collection can preserve the report, and the original whole-epic review requirement stays pending. Source/provenance gaps cannot be discharged by a green sweep.

## Escalation 2: ledger-only disputes and acceptance population

### Actual producers and consumers

`skills/super-design/SKILL.md:710–722` builds a design ledger from all roast rounds and records `findingsLedgerDesign`. Its run-state co-writer contract explicitly records report paths and that pointer (1114–1117), but does not create complete finding-source records. `skills/super-auto/SKILL.md:399` also builds that ledger during amendment design roast. This is a real supported path, not an invented unknown input.

Ownership remains explicit: `skills/super-auto/run-state.md:26–29` names report/ledger pointer producers; `:63` assigns `finding-source` collection to super-auto. `skills/super-auto/SKILL.md:491` says **each settled roast source** receives complete extraction. That wording is broad enough to include design roasts; the example `roast-code/round-N` is not an exclusion of design. The outer owner therefore must reconcile design roast sources at its existing settlement/handoff boundary. Requiring super-design itself to own super-auto acceptance would unnecessarily change ownership.

`skills/super-design/scripts/findings-ledger:66–88` makes `disputed@rN` an explicit sticky override and `resolved@rK` a status that can be inferred from later silence. The local continuity contract deliberately does not trust those statuses as supported source dispositions (`super-auto/SKILL.md:491`, `run-state.md:324–345`). Ledger keys/text paths help identify candidate source material; equal keys alone cannot establish exact source occurrence identity.

Ordinary `report-status` reads disputed Blocking rows from either pointer (`:388–405,468–469`) and reports unresolved counts. Its acceptance branch instead consumes outstanding findings from `scope-dispositions --project` (`:154–173`). That projection reads registered `finding-source` records (`scope-dispositions:80–117`), without comparing the declared roast/ledger population. One unrelated valid-empty source prevents the no-source gap. Acceptance's ordinary-status reuse (`report-status:174–177`) imports only collection/finding-evidence qualifiers; it does not inspect the unresolved count or even the missing-ledger qualifier.

The archived `…post-cap-audit-stages/probe-panel0-ground/receipt.json` demonstrates this seam with a real ledger producer and a valid-empty clean final source: both ledger pointer variants report one unresolved Blocking while acceptance returns eligible. The fixture also contains an open row, reinforcing that it is a population issue beyond disputed counts. The driver `probe.py:12` uses `--loop code` even for the `findingsLedgerDesign` pointer variant; the design producer trace is static source evidence, not a live end-to-end design run. Keep that limitation explicit.

### Ruling and ambiguity

A known ledger-only finding is evidence of unreconciled source coverage. It cannot disappear just because a separately registered review is clean. The acceptance gate should return a named coverage/reconciliation gap until the outer owner supplies retained source extraction and supported reference correspondence, or records an explicit supported explanation that the declared input is outside the acceptance population. The actual finding remains retained throughout.

This does **not** establish that every disputed Blocking row must block forever or be fixed. After exact source reconciliation, the existing `findingAcceptance` mechanism can mark a finding required or nonblocking with evidence, and supported resolution/rejection can close it. `run-state.md:270–279` intentionally preserves nonblocking outstanding findings. Making ordinary status counts a universal veto would contradict that distinction and could create unsatisfiable acceptance after a supported local disposition while the external ledger remains disputed.

The unresolved contract question is which component enforces completeness and how it records correspondence. The intent is sufficiently clear to repair the integration without a gate waiver: outer ownership must collect all settled design and code roast sources, and the read-only gate must not treat a known missing population as valid-empty. A missing or unreadable declared ledger/report should be a coverage gap, not a zero finding count. This is a producer/consumer completeness defect, not evidence that the incoming ledger display change newly introduced the bypass; preserve the existing FYI/pre-existing attribution.

### Minimum implementation boundary

Add reconciliation at the existing caller handoff/settlement and acceptance/projection boundary. Reuse existing roast pointers and source records rather than creating a general finding database. Preserve original reports, ledger overrides and immutable source identities; register complete original report extraction, not fabricated ledger-row extraction. Carry missing/ambiguous/malformed source coverage as an explicit gap. The gate stays read-only and never silently collects or rewrites sources.

If a narrow first repair detects only unreconciled disputed rows, call it that and retain the broader declared-report coverage limitation. Prefer a deterministic source-coverage check that accounts for declared settled design/code reports plus known ledger-only rows, because an unrelated valid-empty final report must not mask either population. Any added association record must identify original ledger/report evidence and exact retained refs; key equality can find candidates but cannot merge findings or prove semantic equivalence by itself.

Do not replace `findings-ledger` trigger/dispute semantics, infer local resolution from its silent-round status, downgrade severity, or make a blanket assertion that every source item is an actionable required defect. Fully reconciled nonblocking findings may remain visible in ordinary status while the independently justified root gate passes.

### Required regression cases

1. Use the real ledger producer with both `--loop design` and `--loop code`; point the run at that ledger and include an unrelated valid-empty final extraction plus otherwise satisfied synthetic gate controls. Before source reconciliation, acceptance must return an identifiable missing-population gap, not eligible.
2. Provide complete original roast extraction and explicit correspondence. Missing relevance still fails; required relevance remains pending; supported nonblocking relevance can pass while preserving the original occurrence and dispute. A supported resolved/rejected disposition must not be reblocked solely by a stale ordinary-status count.
3. Exercise missing ledger, missing declared roast source, malformed/truncated source extraction and an empty unknown source separately from genuinely recognized clean empty sources.
4. Later clean/silent roast does not remove an earlier disputed or actionable source. Include a ledger `resolved@rN` caused only by silence and verify it supplies no local resolution.
5. Same display key at unrelated source locations or rounds must not auto-link or satisfy another item's reconciliation. Multiple explicit linked occurrences are assessed once without losing original refs.
6. Resume after the design producer persisted its pointer/report but before outer collection: expose an owned gap, then append collection/reconciliation idempotently at the existing boundary. No duplicate immutable source identities or rewritten historical results.

## Continuation accounting

Record these rulings as corrective-continuation decisions tied to the current source baseline and original escalation refs. Subsequent narrow code verification can support disposition of the implementation defects; it does not independently close the actual run's historical source coverage, 690 provenance gaps, raw extraction gaps, required live measurements, or final human choice. New behavior-shaping instructions require the repository's appropriate bounded evaluation evidence; this review supplies none and does not recommend launching a broad study before the mechanical boundaries are corrected.

The durable result should distinguish: original observed failure, policy clarification, implementation repair, focused regression evidence, and actual-run acceptance reconciliation. Preserve each rather than collapsing them into a new clean verdict.
