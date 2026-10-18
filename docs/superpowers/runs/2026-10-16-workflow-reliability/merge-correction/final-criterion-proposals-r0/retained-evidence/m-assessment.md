# Independent case M evidence assessment

**Judgment: retain the observed FAIL; no missing or ambiguous instruction requiring a source change is established by this response.** The full M result remains **4 PASS / 1 FAIL**, and G–M remains **34 PASS / 1 FAIL across 35 correlated decisions from the same five after respondents**. This assessment does not regrade the failure, waive an acceptance requirement, or declare complete resume behavior reliable. It supports using the correctly demonstrated M facets as bounded evidence while retaining the work-filing error as a material limitation.

## Exact failure and its effect

The frozen case says the digest and owner entry match committed text, an `owns:` bead exists, and **“no work item was filed before interruption.”** It supplies neither the amendment's work-title list nor evidence of an empty work list. Correct replay must inspect that actual work list and the recorded redesign-label population, file missing items, and only then advance. One cannot infer either that a particular unspecified work item must be created or that no work is missing merely from owner/digest equality.

Respondent `after_2` correctly states the rule, then inserts an unsupported premise:

> Then file only amend `work:` titles missing under `sp:redesign-design-<K>` (none are missing per the facts)

It immediately continues to `beads-filed` and later `applied`. That premise is not in the case and is not justified by the matching sync artifacts. The resulting proposed advance can skip real amendment work. The independent grader's FAIL is therefore substantively supported; describing the sentence as harmless or silently deleting the parenthesis would misrepresent the observation.

The four other respondents retain missing-title filing as a required step after successful sync, without claiming the work list is already satisfied. Their written decisions do not themselves prove that any tracker query or filing occurred.

## Operative source and exact clauses

Inspected source: commit `9e4e057136d449348135bfc18d1f084cb6e4c303`, tree `6e110b20c90d547016321ccc217d68720a0548bc`.

`skills/super-design/SKILL.md` is 105,517 bytes, SHA-256 `e23a402ce0fde5dbb4245c4bf4c0de6361aec144cfec71c0e2dfc787c38ecf95`. Its exact full bytes occur in the supplied additional frozen guide, matching `after-only-super-design-identity.json`. Thus the operative filing procedure was actually available in the tested context, not merely in a later repository revision.

- **Line 123, Re-entry:** `specs-committed` first replays the Key Abstractions sync, **then files the amend record's work items missing from the labelled beads**. The next state's separate action is at line 124.
- **Lines 305–343, Key abstractions sync and owner rules:** committed sections are the source; generated copies are replaced; existing owner beads are adopted and updated. Owner existence is a statement about abstraction ownership, not amendment work-title completion.
- **Lines 905–911, Amend Mode step 3:** replay sync even if a previous attempt completed it; adopt existing owners; a sync failure retains `specs-committed` and evidence and retries before filing or advancing.
- **Lines 912–926, step 4:** explicitly file the `work:` items with the label/title dedupe sequence; only this step records `beads-filed`.
- **Lines 931–958, actual filing procedure:** `id_of` queries `bd list --label "$LABEL" --all --json --limit 0`; the loop reads `field work`, checks each title, and invokes `bd create` when that title is absent. Digest equality and an `owns:` bead are not alternative predicates for skipping the loop.
- **Lines 1002–1005:** the general retry/degraded rule expressly applies to steps **4 through 6**. It does not override the step-3 sync-failure hold.

`skills/super-auto/resume.md` was read in full at the same commit (17,270 bytes; SHA-256 `4497ce1d0d47a0307ea6bb96eb008687595797e5ea1068ea7dd89b10bf546baf`). Line 73 says durable outputs, including a bead, are checked within the persisted state and never used to infer the cycle's state. Line 77 again requires sync followed by title-deduped work filing under `sp:redesign-<loop>-<K>`. These clauses agree with the design guide and provide no permission for the respondent's invented empty-work conclusion.

The observed response therefore demonstrates a failure to apply supplied facts to an already specified predicate. It does not expose a conflicting clause, an omitted work-filing step, an ambiguous owner/work identity, or a degraded-rule exception in the operative procedure. I cannot establish the model's internal cause from one response; in particular I do not claim proof of why it invented the premise.

## Facets that remain supported

All five M answers explicitly support these **written decision facets** at the supplied source/context:

1. Committed sections remain the sync authority, and matching generated copies do not skip replay.
2. Existing `owns:` beads are adopted without creating a duplicate owner.
3. Repeated denial of the required sync update retains `specs-committed` plus failure evidence and blocks filing/downstream advance.
4. The steps-4–6 degraded/applied rule does not bypass the required sync.

These facets are visible in `after_2` as well as the four passing full responses. They do not erase its separate work-filing failure. Full M compliance remains 4/5; no 5/5 full-M claim is supported. The case does not exercise actual `bd` behavior, persisted state transitions, denial handling, idempotent updates, filing or downstream gates. Actual operational behavior remains unestablished by these text decisions and must come from separately attributed evidence where required.

This is after-only supplementary evidence from the original five respondents after A–F, with additional full super-design context. It supplies neither five new independent subjects nor a before/after comparison nor a general reliability estimate. L/M expectations derive from the frozen cases and contract; they were not represented by the grader as a preregistered score sheet. A 34/35 count must not hide the M-specific failure or be described as 35 independent successes/trials.

## Writing-skills policy and repair judgment

I read the complete installed `writing-skills/SKILL.md` and checked it byte-identical to both the repository guide at `9e4e0571` and the run's earlier `d84541ae…` source (26,360 bytes; SHA-256 `d34db5c8aed6a4e0440132bd0613aace70a693ec7819d5637ad77481d8e10d1b`). This avoids silently substituting a different evaluation policy.

Its relevant requirements are complementary: classify the actual failure before adding guidance (line 461); close a demonstrated loophole and retest (lines 571–573); include a no-guidance control (line 580); use at least five fresh-context repetitions per variant (line 581); manually inspect flagged results and assess variance (lines 582–583). It does not license calling a failed response green because the prose appears clear. Equally, it does not establish that every unsupported factual assertion proves a missing instruction or that adding another prohibition is an evidenced remedy. The observed response already recites the correct conditional; no alternative wording was tested here, and case M has no no-guidance comparison establishing the cause or benefit of a new formulation.

**Recommended action within the current wave: preserve the current procedure and record this exact failure/limitation; do not add an untested clarification solely to obtain a cleaner narrative.** This is not a claim that the procedure is bulletproof or that the full application scenario passed. It is a bounded semantic judgment that these data establish no specific source defect to repair, while showing useful positive evidence for the changed synchronization behavior and incomplete full-case compliance.

If the parent elects to pursue the filing error as a separate wording improvement, the narrow candidate is an explicit observed reconciliation boundary immediately before `beads-filed`: compare every amend `work:` title with the queried redesign-label inventory and retain the missing-title/create results. That is a restatement of the existing step-4 recipe, not a proven repair. It should be tested as a candidate against the unchanged wording/control with the full realistic context and fresh repetitions, retaining this failure and negative/positive filing controls. Changing the guide would invalidate reuse of the five current responses as evidence for that new wording and require a new source binding and relevant evaluation; no reason is established to change unrelated packets or rerun unrelated historical reviews. No new dispatch or edit is made by this assessment.

For acceptance, the parent may credit the four supported sync facets without asserting perfect full-M compliance. It must retain the filing failure and separately assess whether the actual required interruption/filing evidence supports the remaining contract. If a particular declared criterion requires flawless completion of this full case, this evidence does not satisfy it; this report supplies no waiver. The approved representative-behavior scope does not by itself create a universal zero-error agent certification, and the failure does not invalidate unrelated demonstrated facets or all other G–M observations.

## Read scope and operations

Read the complete frozen M case; complete `after_2` supplemental response; M sections and read-scope tails from the other four responses; supplemental dispatch instructions; grading instructions/rubric; all five M grading objects and aggregate limitations from `g-m-grade.json`; the additional guide's complete relevant Re-entry/Key Abstractions/Amend Mode procedures; complete current `super-auto/resume.md`; and complete writing-skills policy. Searched the full supplemental super-design guide for sync, state, owner and filing call sites. I did **not** claim a fresh semantic read of all 1,233 lines of that additional guide, regrade unrelated G–L responses, or inspect case N. Complete guide-byte equality was checked independently of that selective semantic read.

Only read-only file/Git/hash operations and this report write occurred. No tests, tracker operations, source edits, canonical state changes, new evaluator dispatches or broad review were performed. The final code wave and its eventual source freeze remain parent-owned.
