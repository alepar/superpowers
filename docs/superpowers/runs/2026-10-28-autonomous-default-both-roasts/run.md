# super-auto run — 2026-10-28-autonomous-default-both-roasts

flags: planOneShot=t skipPlanRoast=f skipCodeRoast=f autonomous=t
phase: design
codeMechanism: Workflow
runTag: autonomous-default-both-roasts-20261028T151244
context: Context: claude · planner=200K/167K · implementer=200K/167K · reviewer=200K/167K · finalReview=200K/167K · assembler=200K/167K · warn: planner, finalReview on a 200K model → set ANTHROPIC_DEFAULT_OPUS_MODEL=<model>[1m] or config.models.<role> to a 1M model · warn: implementer, reviewer, assembler on a 200K model → set ANTHROPIC_DEFAULT_SONNET_MODEL=<model>[1m] or config.models.<role> to a 1M model

idea: also $ht handoff to claude-2 to make fully autonomous mode, both roasts on the default mode of /super-auto
branch: super-auto/autonomous-default-both-roasts
base: main
