# Coordinator session rules

These rules apply to the Superpowers space's main coordination session. They are
not general instructions for implementation, research, or replay tabs.

## Role and ownership

Accept feedback from other tabs, triage it, and hand fixes off to owner tabs in
this space. Request a reviewed integration branch from each fix owner. Own the
final integration into main and the release cut; fix-owner tabs hand their work
back for those steps.

## Coordinating delegated runs

- When research or a proposal becomes implementation, give your human partner two options before launch: the smallest change covering every element of their literal request, and the full proposal. Give each its files, rough size and new abstractions. In every brief, quote their literal request separately from your own elaborations.
- Every condition you attach to a delegated run names its source: your human partner's request, a project instruction, or a concrete risk to work you own. A condition with no such source is not attached.
- When a delegated run's updates report no decision needed for about two hours with no change to product files, ask it which user-visible deliverable changed and which of its open checks your human partner asked for.
- A goal-mode objective (Codex goal, a long-running loop) names the deliverable and an exit, e.g. "hand off branch X, or stop and report when only checks nobody asked for remain".

## Cleanup and tab closure

After a fix is accepted and merged, ask its owner tab to clean up its own
worktrees, temporary resources, and owned processes, preserving required evidence
and unrelated work. The owner reports cleanup completion or concrete retained
resource blockers. Once cleanup is confirmed and no work remains, close that tab.

Include the cleanup expectation in future handoffs. Keep unmerged fixes and
active research or replay tabs open.

## Cutting a Fork Release (alepar/superpowers)

This repository is the `alepar` fork. Its versions are `<upstream version>-alepar<major>.<minor>`, e.g. `6.4.2-alepar4.1`. Bump the minor by default. Bump the major only when your human partner asks.

1. **Verify on a clean `main`.** Run the tests:
   - `node tests/super-code/replay-harness.mjs`
   - `bash tests/super-code/test-run-profile.sh`
   - `bash tests/super-code/test-dispatch-text.sh`
   - `bash tests/super-design/test-scripts.sh`
   - `bash tests/super-design/test-findings-ledger.sh`
   - `bash tests/super-design/test-step-back-check.sh`
   - `bash tests/super-design/test-amend-check.sh`
   - `bash tests/super-design/test-redesign-chain.sh`
   - `bash tests/super-design/test-redesign-cycle-filing.sh`
   - `bash tests/super-roast/test-assemble-args.sh`
   - `bash tests/super-auto/test-scripts.sh`
   - `bash tests/super-auto/test-contract-lint.sh`
   - `bash tests/skill-scripts/test-bash-invocation.sh`
   - `bash tests/codex/test-marketplace-manifest.sh`
   - `bash tests/super-code/test-run-marker.sh`
   - `bash tests/super-code/test-run-profile-in-flight.sh`
   - `bash tests/super-code/test-report-verdict.sh`
   - `bash tests/super-code/test-run-digest.sh`
   - `bash tests/super-code/test-task-surface.sh`
   - `bash tests/super-code/test-split-oversized.sh`
   - `bash tests/super-code/test-context-preflight.sh`
   - `bash tests/super-code/test-assembled-size.sh`
   - `bash tests/hooks/test-session-start.sh`
   - `bash tests/hooks/test-run-block.sh`
   - `bash tests/hooks/test-reinject-smoke.sh`
   - `bash tests/codex/test-package-codex-plugin.sh`
   - `bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`
   - `bash tests/skill-scripts/test-prompt-text-fresh-rounds.sh`
   
   If a Workflow engine changed (`skills/super-code/coordinator.js`, `skills/super-roast/super-roast-workflow.md`), also run its documented `dryRun` scenarios and compare against the expected agent counts recorded in its doc (`coordinator-workflow.md` or `super-roast-workflow.md`).
2. **Bump every manifest:** `./scripts/bump-version.sh <version>`. It updates all files listed in `.version-bump.json` and audits the repo for stragglers; `--check` reports drift. Never hand-edit a single manifest.
3. **Commit, tag, push:**
   ```bash
   git commit -am "chore: v<version> — bump manifests (<one-line theme>)"
   git tag v<version>
   git push origin main && git push origin v<version>
   ```
4. **Publish a GitHub release** with `gh release create v<version> -R alepar/superpowers --title "v<version> — <theme>" --notes-file <file> --latest`. The notes have two parts:
   - one paragraph in the style of a whitepaper abstract: what changed and why it matters;
   - then one `##` section per skill, each a bullet list with one item per fix, one or two sentences each, written for a reader who is not deeply involved.
   
   Every tagged version gets a release.
5. **Update the local installs:**
   - Claude Code: `claude plugin marketplace update superpowers-alepar && claude plugin update superpowers@superpowers-alepar -y`, then restart or `/reload-plugins`.
   - Codex: `codex plugin marketplace upgrade superpowers-alepar && codex plugin add superpowers@superpowers-alepar`.

Published tags are permanent: delete or move one only when your human partner explicitly asks. Fork releases never go upstream (see [AGENTS.md: Fork-specific changes](AGENTS.md#fork-specific-changes)).
