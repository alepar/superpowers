# Reduce repeated verification orchestration while preserving causal evidence

Received: 2026-10-07. Inspected: main eb0462b, superpowers 6.4.2-alepar4.16.
Disposition: accepted opportunities for investigation and evaluation; implementation pending. Recorded locally only. No adapter execution, run mutation, permission expansion, GitHub publication, release, or workflow change is authorized by this feedback.

## Evidence-backed observations (user-supplied)

The ongoing harness-adapters run spans approximately 3–4 days. The user reports that a small in-process Claude/Codex/Hermes registry is not the recurring bottleneck; surrounding producer-consumer migration and verification orchestration are. The run preserves two overall review gates, bounded fix counters, native/source evidence distinctions, and serialized compiler/native ownership.

- **Task53:** changed two wired test expectations from 24 to 25, but still required recorder preparation/admission, targeted suites, per-leaf clippy/default/fmt/leak gates, independent light review, full parent artifact consumption, repeated parent build-only guards, and merge bookkeeping.
- **Task52:** required one coherent accepted-kind correction across journal ACK, recovery composition, and replay negatives.
- **Task51:** found the same blocking FIFO-read family across asset readers.
- **Evidence:** large canonical artifacts duplicate raw JSON, environments, and hashes, consuming context and admission time.
- **Scheduling:** parent dispatch/admission waits delay independent reviewers while disjoint source lanes could continue.

These are explicit user-provided examples, not independently inspected run artifacts. No measured duration breakdown, check-cache hit rate, raw transcript, or native ownership trace was supplied here. Do not infer a speedup or characterize any individual check as redundant solely from the size of a code diff.

## Verified core guidance and attribution limits

- `skills/super-code/implementer-prompt.md` requires task-relevant verification evidence and isolates evidence under the task worktree.
- `skills/super-code/task-reviewer-prompt.md`, Test evidence, says reviewers do not rerun tests; targeted evidence is checked and the full suite runs once at the epic's end.
- `skills/super-code/SKILL.md` describes independent task chains and single-flight merge-back; merges run build-only checks rather than the full suite.
- `skills/super-auto/SKILL.md`, phase 3 and phase 6, gives the caller ownership of the final sweep and preserves final-review intake.

Accordingly, a universal per-leaf native recorder ritual is not established as a core requirement. Follow-up should map each reported operation to its actual owner: core skill, project policy, run adaptation, or permission/native execution contract. Proposals below are not instructions to skip current gates.

## Most useful changes, prioritized

### 1. Concise evidence manifests (first candidate)

Replace repeated canonical copies with a compact manifest: claimed invariant, immutable source/integration SHA, exact command and feature matrix, result/exit status, source-versus-native evidence kind, relevant environment identity, raw-log location/hash, and owning execution/admission record. Keep raw artifacts available and integrity-checkable. A reviewer reads the manifest first and follows links when checking a claim; a hash alone is not behavioral evidence. Record only necessary environment identities, not repeated complete environments or secrets.

**Expected benefit to test:** lower canonical bytes/tokens and admission reading time with unchanged reviewer detection and evidence accessibility. No ownership gate disappears.

### 2. Risk-based verification and coherent invariant batches

Plan repairs around causal invariants and complete producer-consumer migrations, including neighboring negative cases. Task52 and Task51 are candidate examples; retain per-bead identities, acceptance mapping, reviewed heads, and bounded counters when a review or verification unit spans multiple beads.

Select checks by actual behavior and touched boundaries. Strict process ownership, leak, FIFO/deadline, publication/cleanup, and native evidence controls remain for OS/native/resource work. A demonstrably pure parser or expectation-only edit may have a lighter evidence route, but classification cannot rely only on its filename or small diff: changed expectations can conceal a product defect, and asset readers can block on FIFOs.

**Expected benefit to test:** fewer incomplete migrations and repeated family fixes, with no causal test/neighbor-negative coverage loss. Grouping must specify who admits each bead and how partial failures are reported.

### 3. Recurring family-level mechanism reassessment

Connect this report to the accepted [in-round step-back cadence feedback](../2026-10-06-in-round-step-backs/upstream-feedback-draft.md). Periodically synthesize recent repairs and whole-epic findings before the next safe repair-batch admission. Recurrence, neighboring-path failures, and related Must-fix findings should prompt a family sweep or a targeted approach change rather than another topical patch.

Preserve history, both overall gates, and round/fix allowances. Newly discovered pre-existing defects, fix-introduced regressions, and unknown provenance remain distinct. This record adds evidence for that earlier request; it does not implement its cadence.

### 4. Prompt independent reviews of frozen leaves

Dispatch independent reviewers once a leaf's diff and evidence are frozen and eligible, alongside disjoint source work, rather than waiting for unrelated parent admission work. Keep review read-only, bind it to an exact immutable head and base, and invalidate it if relevant code/contracts change. Serialized compiler/native ownership and the merge lane remain serialized; a source review does not acquire native execution permission.

Core Workflow already offers concurrent task chains; first identify whether the observed delay is a parent adaptation, scarce agent slots, required evidence availability, or native ownership. The ordinary-subagent fallback is intentionally serial today; extending it would be a separately evaluated change.

### 5. Share lint/default checks over immutable integration batches

Evaluate running common checks once for an immutable integration batch and reusing that evidence only where the relevant input set is proven unchanged. Identity must include the integration SHA, command/toolchain, feature configuration, relevant environment, generated inputs, and declared scope. Changed or unknown inputs invalidate reuse. A leaf result is not proof for a later combined tree.

Record explicit cache hits and misses with reasons. Do not skip the current per-merge build guard, compiler/native ownership admission, or final sweep before the new admission model has been tested. Measure repeated checks and wait time first; quantify what is actually redundant.

## Other proposals and guardrails

- **Fewer bead-level checks plus one comprehensive final super-roast:** evaluate selectively, preserving both existing overall review gates. Static roast cannot replace real FIFO, replay, migration, resource, or native tests. Failed or missing execution evidence stays unmeasured.
- **Split large files:** split at stable interface and ownership boundaries where that reduces independently measured conflict/change cost. Arbitrary size-based splitting adds churn and may scatter one invariant.
- **Amend the existing run without resetting history:** a future authorized run-policy change must preserve completed evidence, prior verdicts, decisions, limits, and remaining allowances. This message supplies no such implementation authority.

## Evaluation and follow-up

Collect a representative operation/time ledger for Task51–53 if the run owner later authorizes sharing artifacts. Identify causal tests, native ownership transitions, compiler guards, evidence copies, and reviewer-ready/admitted timestamps. Compare manifest size and review time, checks executed/reused, admission wait, merge conflict rate, and defect detection under the same gates.

Exercise incomplete producer-consumer migrations, FIFO blocking, replay negative cases, forged/missing logs, changed environment/feature inputs, interrupted/resumed batches, partial failures, and stale frozen-leaf reviews. A proposed optimization succeeds only if it reduces measured repeated work without turning unavailable evidence into success or expanding execution permissions.

Likely follow-up homes: task report/review-package and evidence contracts; super-code scheduling, integration-check identity and metrics; super-auto final-review intake and in-round checkpoints. Keep this feedback independent of the completed optional-guidance release and the research-only OOP branch. No production files were changed by this record.
