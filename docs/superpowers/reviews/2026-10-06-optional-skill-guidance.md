# Optional skill guidance — implementation evidence

The fork owner requested removal of automatically injected compulsory skill
selection and brainstorming pauses. The change replaces using-superpowers with
an optional catalog, makes brainstorming discovery explicit-request/caller
based, and removes priority wrappers from SessionStart, OpenCode, Pi, and
Hermes. Gemini and Kimi consume the shared source. Workflow checkpoints inside
explicitly selected skills remain unchanged. Porting/install guidance describes
the fork's optional behavior.

## Behavior probes

Evidence is in `/tmp/optional-skills-evidence/`, with initial multi-scenario
reports at `/tmp/optional-skills-before.md` and `/tmp/optional-skills-after.md`.
Immutable before guidance is `before-bootstrap.md` and `before-catalog.txt`.

Five fresh-context samples per variant were run using Codex subagents. The
first sample covered routine feature work, urgent debugging, explicit
brainstorming, and substantial combined design/implementation. Four additional
samples covered a settled CLI flag, urgent parser fix, settled sort dropdown,
and substantial dashboard. Each included a no-Superpowers-guidance control.
These are next-action wording simulations, not five repetitions of every
scenario or an external harness benchmark.

Observed before: unsolicited skill loads for routine work (brainstorming,
debugging, or TDD depending on the sample). The first CLI sample respected its
explicit no-pause request but still selected brainstorming. Additional samples
selected skills before inspection. Dashboard samples selected brainstorming;
only the first predicted its later approval checkpoint. Controls proceeded
directly to repository inspection.

Observed after: routine guided samples matched controls and proceeded without
unsolicited workflow loads or approval pauses. Explicit brainstorming remained
selected with its checkpoints. Dashboard samples considered super-auto as an
option and proceeded with normal work rather than forcing it.

An actual isolated coding probe used identical temporary CLI fixtures and a
failing test for `{name, verbose}`. Before guidance selected brainstorming and
paused at its bounded approval gate; the fixture stayed unchanged and the test
failed. After guidance edited the fixture directly and the same test passed.
Exact actions/output are in `coding-before-result.md` and
`coding-after-result.md`, with fixtures in `coding-before/` and `coding-after/`.

Portable excerpts from the actual coding probe:

- Before first response: “I’m using the brainstorming skill to check the settled
  CLI requirements before implementing `--verbose`.” It then presented the
  one-line implementation intent and stopped for approval. Test result:
  `Expected { name: 'Ada', verbose: false }; actual { name: 'Ada' }`;
  1 test file failed, exit 1. No fixture code was edited.
- After first prose response: “I’ll inspect the CLI and its tests, add
  `--verbose` with a default of `false`, and run the tests to verify the result.”
  It ran the failing test, added `verbose: args.includes('--verbose')`, and
  reran the test: 1 passed, 0 failed, exit 0. No approval pause occurred.

The fixture exported `parseArgs(args)`, choosing the first argument not starting
with `--` as `name` (default `world`). Its test asserted `{name: 'Ada',
verbose: false}` for `['Ada']` and `{name: 'Ada', verbose: true}` for
`['--verbose', 'Ada']`. This is a small real implementation probe, not evidence
of successful completion of a substantial workflow.

Representative wording-sample responses: old guided routine work announced
brainstorming or TDD before inspection; after CLI sample said “I’ll inspect the
CLI’s argument parsing and output paths, add `--verbose` diagnostics on stderr,
and check that stdout stays unchanged,” matching its control. The after urgent
parser and sort-dropdown samples likewise chose direct inspection/fix/testing.
The after dashboard sample considered super-auto optional and chose repository
inspection. The explicitly requested brainstorming sample selected the skill
and its design checkpoints. No sample established later multi-turn behavior.

Limits: subagents inherit the host's instructions and catalog, so these are not
fully isolated raw API calls or clean installed-plugin sessions. The actual
before probe used immutable old discovery wording and the unchanged current
brainstorming body; its old bootstrap's subagent exemption did not prevent the
mandatory brainstorming description from selecting the workflow. No full
multi-turn substantial-work or explicit-brainstorming implementation run was
performed. The evals checkout is absent here; Drill was not run. Results do not
establish behavior across other models or all installed harnesses.

## Verification

All commands below passed on the feature worktree. Logs are in the evidence
directory. The hook test first failed on old compulsory wording (five failures;
`/tmp/optional-skills-hook-red.log`) and passed after the change.

- `bash tests/hooks/test-session-start.sh` — registration and five output paths.
- `node --test tests/pi/test-pi-extension.mjs` — 6 tests, including compaction.
- `bash tests/opencode/test-bootstrap-caching.sh` — present/missing caching,
  fresh arrays, same-array dedup, optional wording, and tool mapping.
- `python3 -m pytest tests/hermes -q -p no:cacheprovider` — 20 tests; executed
  with cached packages on PYTHONPATH, bytecode writes and third-party plugin
  autoload disabled. Plain python lacked pytest; no dependency was installed.
- `bash tests/antigravity/test-antigravity-tools.sh` — mapping/source links.
- `bash tests/kimi/test-plugin-manifest.sh` — manifest/discovery contract.
- `node tests/super-code/replay-harness.mjs` — 1,501 passed, 0 failed. Initial
  sandbox run aborted when blocked `ps` left stdout undefined; the authorized
  unsandboxed run passed. It operated on its own temporary fixtures.
- `bash tests/super-design/test-scripts.sh` — passed.
- `bash tests/super-roast/test-assemble-args.sh` — passed.
- `bash tests/super-auto/test-scripts.sh` — passed.
- `bash tests/super-auto/test-contract-lint.sh` — passed.
- `bash tests/skill-scripts/test-bash-invocation.sh` — 24 helpers checked.
- `bash tests/codex/test-marketplace-manifest.sh` — passed.
- `git diff --check` — passed.

No workflow engine changed, so engine dryRun scenarios were not required.
The parent release agent owns clean-main release verification and versioning.

## Independent review

The reviewer identified stale forced activation in the porting guide and
missing OpenCode same-array dedup coverage. Both were corrected, along with
stale documentation about a nonexistent ban on direct skill-file reads.
Final verdict: no remaining actionable findings, ready to merge after checks.
Reports: `/tmp/optional-skills-review.md` and
`/tmp/optional-skills-review-final.md`.

No version bump, tag, push, GitHub issue/PR, release, or install update belongs
to this change. The main checkout's tracked tree was clean before integration;
its untracked `.beads.gate.lock` was left untouched.
