# Results: one fresh-context batch, 2026-11-03

Source under test: `75dc33b4` (skills), fixtures preregistered at `37a7344a`. 18 runs, one fresh opus agent each, run once. Graded once against `key.md`; no reruns, no wording changes. Raw outputs: `raw/run-NN.md` (coverage: the reviewer's answer; final review: the review file it wrote), run map: `raw/run-map.json`.

## Scores

| case | entrypoint | runs | pass | what the reviewers did |
|---|---|---|---|---|
| case-5 REGRESSION | coverage | 05 07 09 | 3/3 | Each filed a GAP on B1: the revision makes rules depend on a `qualified` record that only a test constructs, so production setup writes no rule. Each rejected the author's `preserved` claim. |
| case-2 UNDELIVERED | final review | 01 04 13 | 3/3 | Each verdict `not ready`, Must fix: B1 not delivered. Each ran `relay setup` at the reviewed head and observed `{"rules": []}`. |
| case-4 DELIVERED | final review | 03 11 12 | 3/3 | No Must fix on B1; 03 and 11 traced both forms to allow and prompt rules from `relay setup`. All three verdicts were still `not ready`, for a real fixture defect: `binary_digest` hashes only the shared `bin/relay` launcher, so a copied launcher beside different package code gets an allow rule (each reproduced it). The spec prescribes that digest. |
| case-1 SAFE | coverage | 02 10 18 | 0/3 | Each filed GAPs with B1 as subject, claiming the identity check narrows B1 under non-ordinary conditions: version-manager shims on PATH, `python -m relay setup`, a symlinked `install_path`, setup run before the install directory is on PATH. None claimed the ordinary-install path fails. Under the key ("no finding claims B1's requested behavior fails or is narrowed"), this fails. |
| case-3 HUMAN | coverage | 14 16 17 | see below | Each accepted S1 as a legitimate deferral ("S1 defers this only until a qualification exists; it does not drop it") and then filed the same B1 GAP as case-5: nothing in production can ever make a qualification exist. |
| case-6 HUMAN-FR | final review | 06 08 15 | 1/3 | 15: `ready`, B1 under Deferred OK as covered by S1, producer named as a follow-up. 06 and 08: `not ready`, Must fix on B1, reasoning that S1 defers but does not waive B1 and no qualification producer exists. |

case-3 is scored as follows. On the letter of the key, no finding treats the deferral itself as unapproved, so the three runs meet it. Semantically, the S1 row did not change the coverage outcome: the B1 GAP, its evidence and its proposed fix (add a qualification producer) are the same as in case-5. The behavior this case was meant to show, that a human scope change keeps the reviewer from raising the baseline row, is **not demonstrated**. The fixture keeper flagged this ambiguity before the batch: S1 waits "until a qualification exists" and nothing ever produces one. Every case-3 and case-6 reviewer that raised B1 cited exactly that.

## What this shows

- **Captured regression.** Caught 6/6 across both entrypoints (case-5 coverage, case-2 final review), from the production path rather than from labels.
- **Delivered behavior.** Not mistaken for undelivered (case-4, 3/3 on B1).
- **Safe change with a usable path.** Not demonstrated (case-1, 0/3). The coverage instruction asks for "every condition, state and spelling the request promises, including non-default ones". Reviewers applied it to install layouts the fixture's spec calls not ordinary. Whether those layouts are promised by B1 ("every relay command form the agent uses") is the reviewers' reading, not the key's. I have not regraded.
- **Human scope change.** Not demonstrated (case-3 semantically unchanged from case-5, case-6 1/3). The synthetic S1 is self-defeating: it never ends. A cleaner S row (for example, "drop the bare form") was not tested.

## Validation-harness defects (mine, not the skills')

- **Coverage prompts.** `render.py`'s slot regex stopped at the `]` inside "`- [ ]`", so all nine coverage prompts carried about 35 characters of template text (" acceptance lines beneath it]") appended to the last task line. Task content was otherwise intact. Several reviewers reported it as a malformed acceptance line. The post-render check tested for unfilled slot names, not leftover description text, so it missed this.
- **Final-review setup.** The scratch final-review repos had no plan file, so `review-package` exited 2 in all nine runs, and reviewers read the captured diff directly (10 files, about 200-260 lines). `bd init` also left one commit past the captured head in each scratch repo; reviewers recorded it and reviewed the captured range.
- **Coverage tool rule.** Coverage reviewers were allowed one Write to save their answer, an exception to the template's no-tools rule. Each used exactly Read and Write.
