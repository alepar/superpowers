# super-plan-2s3 investigation: review report producer/extractor contract

Worktree: /Users/alepar/AleCode/superpowers/.worktrees/super-auto-review-continuity-followups (read-only; nothing edited).

## 1. Extractor (skills/super-code/scripts/report-verdict)

Three modes:
- default (L1-37 header, L180-360 body): bash/awk compact summary, at most 31 lines, items capped/cut. Lenient: only the first matching section, bullets only, prose ignored. Exit 0 on any readable file, 2 on missing/unreadable/argc.
- `--keys`: same recogniser order; prints roast `[SEV] <location>` from `## Confirmed findings` or final-review `[Must-fix] ...` / `[Must-fix] untested: ...`. Exit 3 for kinds with no keys. Also lenient.
- `--complete --source ID FILE` (L39-178, an embedded Node module): strict, uncapped JSON `{version:1,source,artifact,kind,verdict,occurrences:[{section,position,key,text}]}`. Any error prints `report-verdict: --complete: <msg>` and exits 2. Requires exactly 4 args (L49-52).

`--complete` grammar:
- Kind (L63-71): an exact `## Verdict` line means final-review. Otherwise a `Status: TOKEN` line means task-report, a `super-roast verdict: ` line means roast, and any `Verdict` heading or label means final-review. Anything else fails with `unrecognized finding source`.
- Section boundary (L86-89): every line matching `^#+[ \t]+` (any heading level) or `^\*\*[^*]+\*\*` (a line that opens with a bold label). The label is the heading text.
- Recognised (strict) sections (L90-95): for all kinds, a label starting (case-insensitive) with `deferred`, `concern(s)`, `blocker(s)`, `finding(s)` or `untested scope`. final-review adds `must fix`/`must-fix`. roast adds `confirmed findings`, `not verified`, `beyond remainder cap`, `rejected`, `unverified nits` and `escalations`. The match runs **anywhere in the file**, not only in the footer.
- Body rules (L119-138), inside a recognised section:
  - An item is a line `^ ?(?:[-*]|[0-9]+[.)])[ \t]+(.*)$`: at most one leading space, then `-`, `*`, `n.` or `n)`.
  - After an item, every following line (prose or indented) is a continuation and is kept verbatim.
  - A non-blank line before the first item fails unless it is a lone `none`: **`finding text without a list marker in <section>`**.
  - A section with no item and no `none` fails: **`empty finding section: <section>`**.
  - `- none` followed by continuation text fails: `none marker has finding text`.
  - An empty bullet fails: `empty finding item`.
  - No recognised section in the file fails: `missing finding sections`.
- Every heading line, at any depth, ends the current section (L124-131). A sub-heading inside an active section either:
  (a) empties the parent, so the parse fails (`final-subheading.md`, `final-original.md`); or
  (b) when the parent already has an item, **silently drops** every item under the sub-heading, because the sub-heading's label is not recognised. I reproduced (b): `## Must fix\n- a\n### detail\n- b dropped` returns only `a` with exit 0. This is a silent-loss hole that the "invalid cannot look clean" tests do not cover.

A duplicate copy of the final-review grammar lives in skills/super-code/scripts/assembly-archive.cjs:13-36 (`strictDraft`, bounded route).

## 2. Producers and what they are told

super-code (Workflow script skills/super-code/coordinator.js):
- `reviewFileFormat()` coordinator.js:2992-2994 is the only grammar text. It says: "End the file with exactly these four headings, in this order: "## Verdict" ... then "## Must fix before landing", "## Untested scope" and "## Deferred OK", each followed by flat "- " bullets, one item per bullet on one line (no numbered lists, no nested bullets, no bold labels in place of these headings), or the single line "- none"."
  - It constrains only the footer. It says nothing about the body above the footer, where `## Findings`, `## Concerns`, `## Blockers`, `## Deferred…` or a `**Findings**` bold line are also parsed strictly. It also does not ban `###` or bold sub-headings inside the four sections.
  - The comment at L2987 claims "report-verdict's final-review recogniser is its parser". The prompt does not state that parser's actual scope.
- It is used by `finalReviewPrompt` (L2995-3020, writes at L3019), `finalClusterReviewPrompt` (L3022-3025, writes at L3024) and `finalSeamReviewPrompt` (L3027-3033, writes at L3032). Their STEP 1 at L3019 ("write those findings down") invites a narrative findings section.
- The bounded route (L3004) writes a draft that dispatch-text.mjs:518 **does** validate with `--complete` before it writes the final file with flag `wx`. This is the only producer-side validation that exists today, and it is a precedent.
- `finalReviewStubPrompt` L3035: same footer. Not implicated in the evidence.

super-roast:
- skills/super-roast/reporter-prompt.md Step 6 (L221-262) gives the template. Bodies are given only for Confirmed (L242-246), Not verified (L248-252) and Beyond cap (L254-255). `## Rejected (with reason)`, `## Unverified nits (spot-checked)` and `## Escalations (need human)` (L259-261) are **bare headings with no body grammar**. The notes require `- none` only for Beyond cap (L280) and dedupe/judge-lost (L285). Nowhere does the prompt say "every section body is `- ` entries only; no preamble prose". Line L232 ("short sentences, one fact per line") encourages prose.
- skills/super-roast/SKILL.md L195-216 mirrors the same template.
- The engine skills/super-roast/super-roast-workflow.md: `fallbackReport()` (~L624-655) always emits conforming sections (`section()` adds `- none`). The live-reporter `enforce()` (~L660-733) rewrites header lines, severity and lanes, but does **no section-grammar validation**. The reporter is retried only when it returns null (`rep = (await reporterOnce()) ?? (await reporterOnce())`, ~L616).
- The report is written by the orchestrator from `reportMarkdown` (SKILL.md L218-220). No validation happens there either.

## 3. Reproduction (`report-verdict --complete --source s FILE`, all exit 2)

| File | Error | Mismatch class |
|---|---|---|
| /private/tmp/superpowers-mosh-feedback-triage-dx2/final-original.md | `empty finding section: Findings` | Narrative `## Findings` (L32) above the footer, whose content sits under `### 1. …` / `### 2. …` sub-headings (L34, L60). The sub-heading ends the section, so it is empty. |
| …/cluster1-original.md | `finding text without a list marker in Findings` | Narrative `## Findings` (L36) opens with a prose paragraph (L38) before its numbered bold items. |
| …/pr1-original.md | `finding text without a list marker in Unverified nits (spot-checked)` | Roast prose preamble at L134, "One refute-seat pass each; not panel-strength verification…", directly under the heading. |
| /private/tmp/superpowers-mosh-phase2-triage-9tg/2026-10-28-mosh-phase2-keeper-inflight-window-roast-pr-1.md | same as pr1 | Same preamble at L56 (a different report, same reporter habit). |
| …dx2/final-subheading.md (synthetic) | `empty finding section: Must fix before landing` | `###` sub-heading as an item inside a footer section. |
| …dx2/roast-prose.md (synthetic) | `… Unverified nits` | "No unverified nits." prose in place of `- none`. |

Controls that pass (exit 0): `final-original-footer-control.md`, `cluster1-original-footer-control.md`, `final-bullets.md`, `roast-bullets.md`. The canonical footers on their own are fine. Note: the `PIPESTATUS` echo in my loop printed blank; the exit code was confirmed via retained-original-parser-results.json (`exit: 2`) and the absence of stdout JSON.

Classes:
1. A narrative heading above the footer that collides with recognised vocabulary (`Findings`, and in principle `Concerns`, `Blockers` or `Deferred…`).
2. Sub-headings or bold labels inside a recognised section: either a parse failure or **silent item loss**.
3. A prose preamble or a prose "none" inside a recognised roast section.

## 4. Validation after write / where repair fits

- **No post-write validation exists** for the final/cluster/seam reviews. coordinator.js:2419-2449 accepts any non-empty `verdict` from the `FINAL_VERDICT` schema. **No validation exists** for roast reports either.
- First strict parse is at collection: skills/super-auto/scripts/report-status L527-530. On exit≠0 it calls `gap('complete extraction unavailable: '+rel)` and degrades. Archive copy uses `COPYFILE_EXCL` (L535), so originals are never overwritten. Other strict consumers: report-status L268 (`extract`) and L465 (null recovery); the run-state.md L333 procedure.
- Constraints on repair:
  - reviewWriteGuard (coordinator.js:2980-2985): "Existing partial contents must never be replaced, even on same-source retry."
  - dispatch-text.mjs:513-516 refuses to overwrite any existing output.
  - The issue: "preserve original generations".
  - So a repair after the dispatch returns must write a **new sibling file**, never rewrite `final-review-<id>.md`.
- Minimal placement options:
  - **A (cheapest, no new files or abstractions): producer self-check inside the same dispatch.**
    - Append to `reviewFileFormat()` (coordinator.js:2993): "Before returning, run `bash ${codeSkill}/scripts/report-verdict --complete --source self-check <file>`; if it exits 2, fix only the formatting its error names (never delete or reword a finding) and re-run; return only when it exits 0."
    - The file is still the producer's own unreturned generation, so nothing settled is overwritten. This mirrors the bounded route at dispatch-text.mjs:518.
    - For roast, the reporter returns markdown and does not write a file, so the equivalent check goes in the orchestrator step at super-roast SKILL.md L218-220 (write, run `--complete`, and on failure re-dispatch the reporter once with the parser error).
  - **B (bounded post-hoc repair):**
    - After each final/cluster/seam dispatch (coordinator.js:2422, 2433, 2437), add a `tier('mechanical')` dispatch that runs `--complete`.
    - On exit 2, one format-only repair dispatch gets the stderr line and writes `final-review-<id>.format-repair-1.md` (flag `wx`), keeping every finding's text.
    - The repair is accepted only if it parses and preserves the original's item text.
    - report-status (L527-530) would need to learn the sibling name and record both files. This is a larger change; it touches report-status' path regexes and the bundle manifest.

## 5. Tests

- tests/super-code/test-report-verdict.sh L254-450 cover `--complete`: final occurrences and archive identity (L254-312), all roast sections (L314-363), uncapped extraction (L365-391), task/bold/explicit-empty (L393-426), invalid inputs (L428-447). Missing:
  - narrative `## Findings` above the footer;
  - a sub-heading inside an active section, including the silent-drop case;
  - roast preamble prose.
- No test ties producer prompt text to the extractor grammar. Two meaningful contract cases:
  1. Prompt side: `replay-harness.mjs` live-sim runs the real prompt builders (trace at L109-116). Assert that the final/cluster/seam prompts contain the full grammar sentence, or follow the tests/skill-scripts/test-prompt-text-fresh-rounds.sh `assert_has` style on coordinator.js and reporter-prompt.md.
  2. Consumer side:
     - Fixtures rendered **from the prompt's own example grammar** must parse. The reporter-prompt Step 6 template filled with one entry per section, and a footer in reviewFileFormat style, should both give exit 0 with the expected occurrences.
     - The retained failing shapes (narrative Findings with `###`, preamble) must give exit 2 with the exact error.
     - Add the silent-drop case. It should give exit 2 once fixed.

## Recommendation (smallest fix)

1. **Align producers to the extractor (primary).**
   - Rewrite `reviewFileFormat()` (coordinator.js:2993) to state the whole-file grammar. Any heading or bold-label line whose text starts with Findings, Concerns, Blockers, Deferred, Untested scope or Must fix is parsed as a finding section **anywhere in the file**. So use those words only for the four footer headings, and put narrative under other headings (e.g. `## Analysis`). Inside the four sections: no sub-headings or bold label lines; each item starts with `- `; continuation lines are allowed but indented.
   - In reporter-prompt.md Step 6 (L221-262 plus notes L264-300) and SKILL.md L195-216, give every section a body line and add one rule: "every section body is `- ` entries (indented continuation lines allowed) or the single line `- none`; no preamble or prose lines directly under a heading."
2. **Do not relax the extractor for narrative.** The issue forbids ignoring narrative findings, and strictness is what keeps a malformed file from looking clean. One narrow **tightening** is warranted: a sub-heading or bold label inside an active recognised section should fail (`sub-heading inside finding section`) rather than silently drop items (report-verdict L124-131, plus the same fix in assembly-archive.cjs:24-27).
3. **Validation and repair: option A.** Add the self-check to `reviewFileFormat()` and the roast orchestrator write step. This covers all producers with roughly three prompt sentences and no new files. Treat option B as a follow-up if self-check compliance proves unreliable, because it needs report-status changes to keep originals and repairs side by side.
4. **Tests:** test-report-verdict.sh gets the retained failing shapes and the silent-drop case. A prompt-text assertion covers the new grammar sentences. Template-rendered fixtures parse with exit 0.
