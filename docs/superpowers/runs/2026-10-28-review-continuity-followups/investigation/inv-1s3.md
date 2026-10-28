# super-plan-1s3 investigation: context-preflight vs context-pass model windows

Repo: /Users/alepar/AleCode/superpowers/.worktrees/super-auto-review-continuity-followups (read-only; nothing edited)

## The two resolvers

### A. skills/super-code/scripts/context-preflight (pure bash; no node; jq only for Codex)
- read_claude(): lines 118-188. Session model: ANTHROPIC_MODEL, else first settings file with a "model" key
  (./.claude/settings.local.json, ./.claude/settings.json, $CLAUDE_CONFIG_DIR/settings.json) (lines 120-129).
- Session family sfam via `*opus*`/`*sonnet*` glob (131-132).
- Per-role model (136-142): planner/finalReview = opus family, others sonnet. Precedence:
  CLAUDE_CODE_SUBAGENT_MODEL > ANTHROPIC_DEFAULT_{OPUS,SONNET}_MODEL > bare alias.
- Window "table" (143-151) — this is the bug:
  - `*"[1m]"` -> 1000000
  - bare `opus|sonnet` -> unknown if no readable session source; 1M only if session is same family AND ends `[1m]`; else 200000
  - `*)` -> 200000  <- every explicit id, incl. claude-opus-5-5, Sonnet 5, Fable, Haiku 5.5
- Compact point (153-157): CLAUDE_CODE_AUTO_COMPACT_WINDOW, else 967000 / 167000 (hard-coded, matches window-33K).
- No model-family knowledge at all; no config.models input (yet its warning at line 171 recommends
  `config.models.<role>`, which preflight cannot see).

### B. skills/super-code/scripts/context-pass.mjs (ESM, pure, imported by run-profile.mjs)
- CLAUDE_DEFAULT_WINDOW=200000 (line 13), CLAUDE_BUFFER=33000 (line 12).
- CLAUDE_WINDOWS (57-64), first match wins:
  `/\[1m\]$/i`, `/claude-opus-4-(?:[7-9]|\d{2})(?!\d)/`, `/claude-opus-5(?!\d)/`, `/claude-sonnet-5(?!\d)/`,
  `/claude-haiku-5-5(?!\d)/`, `/fable/i` -> 1000000; else 200000.
- claudeWindow(model, override) (65-70): positive override wins (source 'override'); else table (source 'table').
- Callers: context-pass.mjs:110 (each compact_boundary), :118 (peak model; then 'inferred' bump when peak > window, 119-125).
  claudeContext is reached from run-profile.mjs:808 and :820 via HARNESSES[...].read with
  `contextWindow` from `--context-window` (run-profile.mjs:785, validated :105).
- Exported; unit tests tests/super-code/context-pass-unit.mjs:53-64 (run by tests/super-code/test-run-profile.sh).

### Callers of context-preflight
- skills/super-code/coordinator-workflow.md:382-385 (pre-flight Context: line + `--json` -> config.contextWindows)
- skills/super-auto/SKILL.md:122,129,170; skills/super-auto/run-state.md:33 (`context:` field)
- Consumer of --json: skills/super-code/coordinator.js:2376 (`config.contextWindows.finalReview || FINAL_REVIEW_FALLBACK_WINDOW.workflow`), docs coordinator-subagents.md:230, SKILL.md:137.
- Tests: tests/super-code/test-context-preflight.sh (fixtures tests/super-code/fixtures/context-preflight/claude-1m {"model":"opus[1m]"}, claude-200k {"model":"sonnet"}).

## Reproduction (env -i, empty HOME, CLAUDE_CONFIG_DIR nonexistent)
- `CLAUDE_CODE_SUBAGENT_MODEL=claude-opus-5-5 context-preflight --harness claude --json`
  -> {"planner":200000,...all 200000} plus two false "on a 200K model" warnings. Matches
  /private/tmp/superpowers-mosh-feedback-triage-dx2/context-preflight.json exactly.
- `claudeWindow('claude-opus-5-5')` -> {"window":1000000,"compactAt":967000,"source":"table"}.
- Further preflight divergences: claude-sonnet-5, fable, claude-haiku-5-5 -> 200000 (table says 1M).
  `ANTHROPIC_MODEL=claude-opus-5-5` (session) with bare `opus` role alias -> 200000 (inherit branch only checks `[1m]`).
  `ANTHROPIC_DEFAULT_OPUS_MODEL=claude-opus-5-5` -> 200000 for planner/finalReview.
  Agreement: `[1m]` ids, claude-opus-4-6 (200K), unknown ids (200K default).
- This very run is affected: docs/superpowers/runs/2026-10-28-review-continuity-followups/run.md:7 records all-200K + both warnings.

## Which is right for claude-opus-5-5
The repo's only authoritative statement is the context-pass table and its documented rationale:
skills/super-code/MAINTENANCE.md:425 ("Opus 4.7 and later, Opus 5, Sonnet 5, Fable and Haiku 5.5 have 1,000,000;
every other model ... and any unknown id ... 200,000; an id ending [1m] has 1,000,000 ... A new model family is
one new row in the table") and context-pass.mjs:55-56; unit test context-pass-unit.mjs:56 pins it.
context-preflight makes no claim about Opus 5 — its `*) win=200000` is a catch-all, not a model fact.
So 1M is the repo's position. (The 2026-10-15 design roast, .../roast-design-1.md:91, cites code.claude.com
model-config saying Opus/Sonnet 4.6 reach 1M only via `[1m]` and mentions CLAUDE_CODE_DISABLE_1M_CONTEXT —
consistent with the table; neither script honours DISABLE_1M today.)

Unknown vs default: both already agree that an explicit unrecognized id -> 200K (the design's "unknown ->
smallest known window" fallback). preflight additionally has a true *unknown* (omitted from --json) for a bare
alias whose session source is unreadable — keep that; it is the only case where the window is unknowable.
No repo statement says what bare `opus`/`sonnet` aliases resolve to, so keep current alias semantics.

## Shared-helper feasibility
- No shared helper module exists. context-pass.mjs is ESM and pure; context-preflight is bash with an explicit
  no-node design (Codex path degrades without jq; run-profile wrapper is the pattern for node-backed scripts).
- Option 1 (single resolver): preflight shells `node -e "import(context-pass.mjs).claudeWindow(m).window"`.
  Adds a node dependency to preflight; must degrade to `unknown` without node (new failure mode); per-role
  process spawn. Single source of truth.
- Option 2 (one table, mirrored + parity test) — recommended minimal: replace preflight's `*) win=200000`
  with a bash ERE table mirroring CLAUDE_WINDOWS, and add a parity test that runs both over a fixed id list.
  Bash ERE has no lookahead; use `([^0-9]|$)`:
    claude_window() { case "$1" in *"[1m]"|*"[1M]") echo 1000000; return ;; esac
      if [[ "$1" =~ claude-opus-4-([7-9]|[0-9]{2})([^0-9]|$) || "$1" =~ claude-opus-5([^0-9]|$) ||
            "$1" =~ claude-sonnet-5([^0-9]|$) || "$1" =~ claude-haiku-5-5([^0-9]|$) ]] ||
         printf '%s' "$1" | grep -qi fable; then echo 1000000; else echo 200000; fi; }
  (context-pass's `[1m]` regex is case-insensitive and anchored at end; preflight's glob is case-sensitive — align.)
  Then line 143-151 becomes:
    `opus|sonnet)` -> unknown if !have_src; if sfam==model -> claude_window "$session"; else 200000
    `*)` -> claude_window "$model"
  Add a pointer comment in both files + MAINTENANCE.md:425 ("mirrored in context-preflight; parity test X").
  Diff size ~15 lines script + ~20 lines tests. No new abstraction beyond one function.

Precedence/overrides unchanged: SUBAGENT_MODEL > DEFAULT_*_MODEL > alias; `[1m]` suffix still 1M;
CLAUDE_CODE_AUTO_COMPACT_WINDOW still sets compact point; run-profile `--context-window` override untouched;
config.contextWindows passes through unchanged.

## Proposed tests
tests/super-code/test-context-preflight.sh (claude section):
1. `CLAUDE_CONFIG_DIR=$T/nope CLAUDE_CODE_SUBAGENT_MODEL=claude-opus-5-5 --json` -> all 1000000; text line has no "200K model" warn. (the bug)
2. `CLAUDE_CODE_SUBAGENT_MODEL=claude-opus-4-6` -> all 200000 + both warnings (old explicit id stays 200K).
3. `CLAUDE_CODE_SUBAGENT_MODEL=claude-opus-4-6[1m]` -> all 1M (suffix override).
4. `ANTHROPIC_DEFAULT_OPUS_MODEL=claude-opus-5-5` with claude-200k fixture -> planner/finalReview 1M, sonnet roles 200K, only sonnet warning.
5. `ANTHROPIC_MODEL=claude-opus-5-5` (session), no role env -> planner/finalReview 1M (alias inherits session via table), sonnet roles 200K.
6. Unknown explicit id `CLAUDE_CODE_SUBAGENT_MODEL=some-vendor-model` -> 200000 (default, not omitted).
7. Existing: bare alias + unreadable settings -> unknown / omitted from --json (keep).
8. `CLAUDE_CODE_AUTO_COMPACT_WINDOW=300000` with opus-5-5 -> 1M/300K + below-50% warn.
Parity test (new block in test-context-preflight.sh or context-pass-unit.mjs): for ids
[claude-opus-5-5, claude-opus-5, claude-opus-4-7, claude-opus-4-10, claude-opus-4-6, claude-opus-4-20250514,
claude-sonnet-5, claude-sonnet-4-6, claude-sonnet-4-6[1m], claude-haiku-5-5, claude-haiku-4-5-20251001,
claude-fable-1, unknown-x] run preflight `--json` with CLAUDE_CODE_SUBAGENT_MODEL=<id> and assert `.planner`
equals `claudeWindow(id).window`. This is what keeps the mirrored table from drifting.
run-profile: context-pass-unit.mjs:53-60 already covers opus-5-5, override, unknown; no change needed unless
the table is touched.

## Out-of-scope notes (follow-ups, not part of the fix)
- preflight's warning recommends `config.models.<role>` but preflight never reads config.models, so a run that
  sets config.models to a 1M model still reports/passes 200K. Fixing needs a new input (e.g. a --models arg) — separate issue.
- CLAUDE_CODE_DISABLE_1M_CONTEXT is honoured by neither script.
- Bare `opus`/`sonnet` alias resolution (what Claude Code maps them to) has no repo-authoritative statement; left as-is.
