# Method: prose replay of the superpowers-wf backport (super-plan-4wr)

**Question.** In prose super-code and super-roast, do 551fbe27's behaviour-shaping prompt changes
reduce the parked and escalated tasks the r1-terra-confirm run hit, without causing false convergence?

**Where the raw pack lives.** Only the durable record is committed here: this file, `report.md`,
`rubric.md` and `scores/`. The full pack stays local, outside the repo, under `<EVAL_WS>/super-plan-4wr/`.
That covers the incident inputs rebuilt from the private super-workflow-e2e run, both arms' generated
dispatches, fixtures, `launch.sh`, `schedule.json`, `arm-map.json`, `provenance.json`, per-sample outputs
and transcripts. The file names below refer to that local pack.

**Design.** A targeted replay of four incidents from r1-terra-confirm. Every sample is one fresh
`codex exec` on gpt-6.1-terra, given the prose dispatch that super-code (or super-roast) would send at
that point in the run, in a throwaway copy of the terra repo restored to the incident's commit. There
are two arms. Arm A has the skills tree at 5fd17f4d and arm B at 551fbe27. Within an incident, the
two arms' dispatches differ only in text from their own templates and scripts (`dispatch/<incident>/arms.diff`,
`templates.diff`). There are n=5 samples per incident per arm, 50 in total, run in the order of
`schedule.json`. Scoring follows `rubric.md`, blind to arm. The report gives descriptive counts only.
The user chose the model. The plan sent to the coordinator set the rest (mnSGw0S2woFV), and the
coordinator approved it (mnSG7Jn0DSjw). The coordinator added a stop line on top: if spend runs well past
7M tokens or 5h, stop and report.

| incident | dispatch | arm-sensitive text |
|---|---|---|
| S1-kxp7 | `dispatch-text implement --id r1x-kxp.7 --n 7` | implementer-prompt.md; CURRENT REQUIREMENTS clause |
| S2-kxp12-impl | `dispatch-text implement --id r1x-kxp.12 --n 15` | same |
| S2-kxp12-triage | `dispatch-text triage --id r1x-kxp.12 --blocker r1x-blk12` | triage-prompt.md; CURRENT REQUIREMENTS clause |
| S3-kxp14-merge | `dispatch-text merge --id r1x-kxp.14 --n 16 --base b319dc35…` | merge CONFLICTS clause (coordinator.js) |
| S4-roast-regression | reporter prompt from the arm's own engine (`tools/gen-reporter.sh`) | reporter-prompt.md prior-report rules, `{{FIXES_CHECKED}}` |

## How to run

1. Extract the arms (they are git-ignored): `git -C <SUPERPOWERS_REPO> archive <sha> skills | tar -x -C arms/<A|B>/`.
   Check them against the sha256 values in `provenance.json`.
2. Optionally regenerate the dispatches with `tools/gen-dispatch.sh <incident> <arm>` and
   `tools/gen-reporter.sh <arm>`. They are deterministic. `provenance.json` holds the sha256 of each committed dispatch.
3. `./launch.sh <id>` for each sample in `schedule.json` order, with at most three running at once.
   `DRY_RUN=1` prints the command. Results go to `results/<id>/`: `dispatch.md`, `cmd.txt`,
   `events.jsonl` (the codex `--json` transcript, git-ignored), `last-message.md`, `exit-code`,
   `started-at`/`finished-at`, `usage.json`, `end-state.txt` (refs, worktrees, status, beads),
   `task-branch.diff`/`.log`, and the task report.
4. Score from `results/` with `rubric.md`, without opening `arm-map.json`. Then unblind.
5. Clean up: `rm -rf <SAMPLE_WS_ROOT>/`. Each sample workspace is about 40 MB plus its Go cache.

## Workspace

`fixtures/<incident>.sh <ws> <arm>` (shared steps in `fixtures/common.sh`):

- `git clone --no-hardlinks` of the terra repo (read-only at its source), then local branches for the
  integration branch and `task-r1x-kxp.14`. The origin remote is removed.
- One fixture commit on `main` removes the Go-engine setup: the project-local skills (`.agents/`,
  `.claude/`), the harness configs pinned to the terra run's paths (`.codex/`, `.cursor/`), and AGENTS.md's
  "Git authority for super runs" block. The beads guidance in AGENTS.md stays.
- `.beads/` is copied from the terra repo. The incident's bead is put back to its state at dispatch time:
  status open, park note and `sp:parked:*` label removed, the Go engine's `key:` label removed, and the
  blocker beads filed after the incident deleted with their edges.
- The integration worktree goes at `.worktrees/integration` on the incident's integration tip. For S3, the
  task worktree goes at the path the prose dispatch names, on the accepted head 8a67451.
- The arm's `skills/` goes to `.eval-skills/skills`, a path that does not name the arm. `.eval-run/` holds the
  ledger (`progress.md`, one Launch line) and the plan file. S2 and S3 also get the round-1 and round-2
  roast records their fix beads cite.

## Codex invocation (`launch.sh`)

`codex exec -m gpt-6.1-terra -c model_reasoning_effort=<e> -c approval_policy="never" --sandbox workspace-write -c sandbox_workspace_write.writable_roots=["<ws>/.git"] -c sandbox_workspace_write.network_access=true -c shell_environment_policy.set={GOCACHE, GOTMPDIR under <ws>, GOMODCACHE=$HOME/go/pkg/mod, GOPROXY=off, GOMAXPROCS=4, GOFLAGS=-p=2, HOME=<ws>/.eval-home} --ignore-user-config --ignore-rules --disable hooks --ephemeral --skip-git-repo-check -C <ws> --json -o results/<id>/last-message.md -`, with the dispatch on stdin.

- Effort follows the terra run's spawn records for the same dispatch kinds: Implement and Rebase
  medium (seq 2324, 4600, 4824), Triage high (4626), RoastReporter xhigh (5413).
- Sign-in uses the user's own `CODEX_HOME`. Codex refreshes `auth.json` by rename, so the file is neither
  copied nor linked. Its config, rules and hooks are kept out by flags. `--ephemeral` stops session files
  from landing in the user's history. HOME is a per-sample empty directory, so user-level skills
  (`$HOME/.agents/skills`, including the herdr ones) are not visible. The herdr pane variables are unset.
- Approvals are off and nobody watches the sample, as in the e2e eval lanes. Network access is on, as in
  the terra run's config. Go runs offline from the host module cache (`GOPROXY=off`); the build was
  checked offline at 0df554fc.
- The S1 to S3 dispatches go out with no output schema, as in super-code's ordinary-subagent path
  (`coordinator-subagents.md`). S4's reporter schema is saved as `dispatch/S4-roast-regression/schema-<arm>.json`.
  It is identical in both arms and is not passed either. The scorer reads the final message and the end state.

## Deviations from a real prose run

1. **Plan sections are hand-written.** The prose planner (`planner-prompt.md`, identical in both arms) would
   write each `## Task <N>` section. Here they are written from the bead text, as the terra run's brief was:
   filesTouched, filesToRead, acceptance carried verbatim, and short steps. Running the planner would cost a
   model call per sample and add variance that does not depend on the arm.
2. **Fix beads are rewritten into super-auto's §Fix-bead template.** The terra beads used the Go engine's
   short form. The template is the same in both arms apart from one section name. Context links point at the
   copied round reports.
3. **The S2 triage blocker body is the terra implementer's BLOCKED text**, and both arms get the same one.
   This case measures triage on the blocker the run actually produced, not on what each arm's
   implementer would have written.
4. **S4 replays only the reporter.** Round 3's scouts, dedupe and judges are not rerun. The mock
   feeds the reporter the recorded stage outputs (zero raw findings, zero groups). That is the terra
   condition. It also leaves out one route arm B adds: a regression scout returning a `held: false`
   fix check for the dumb.go finding. Arm B's result here is therefore a lower bound for its full roast.
5. **The tracker is the end-of-run copy, with the incident bead scrubbed.** Beads filed after the incident (the later fix beads and the
   other tasks' blocker beads) are present, in the state they ended in. Both arms see the same copy.
6. **The merge-check command is `go build ./...`**, which prose pre-flight would resolve for a Go project.
   The terra Launch line recorded `none`.
7. **The workspaces sit under `<SAMPLE_WS_ROOT>/`**, outside the superpowers checkout. The
   codex sandbox restricts writes, not reads, so a sample could still read this pack by absolute path. The scorer checks `events.jsonl` for any read outside `<ws>` and the host toolchain, and
   marks such a sample UNMEASURABLE (contaminated).

## Known confounds

- **Arm B is the whole 5fd17f4d..551fbe27 range**, not only 551fbe27. It also contains 31cccbd5, a
  text-formats scout lane (visible in S4's lane list), plus a manifest bump and a coordinator doc commit. `provenance.json` lists them.
- **Arm A's failures in the source run came from the Go fork's prompts**, not prose arm A. If prose arm A
  passes an incident, the replay cannot reproduce that failure in prose, and it shows no measured
  improvement there.
- **Unknown provider settings.** Sampling, server-side model revision and token limits are not exposed.
  Codex CLI 0.172.0 is the same for every sample.
- **n=5 per cell** gives descriptive counts with no claim of significance or generalization.

- **The user's global Codex instructions load in every sample.** `CODEX_HOME` is the user's own (sign-in
  refreshes `auth.json` in place), and Codex reads `$CODEX_HOME/AGENTS.md` even with `--ignore-user-config`.
   Both arms get the same bytes. Its Herdr rules do nothing here, because the Herdr variables are unset
   (s01 showed "herdr-threads unavailable").

- **Codex account.** s01-s09, s11-s14 ran under the default `$HOME/.codex` sign-in. The rest ran under the
   `codex-2` profile (a second Codex profile directory), at the user's request (2026-11-28). The model, the
   flags and the global AGENTS.md (the same symlink) are identical in both.
