## Verdict

**incomplete — infrastructure preflight blocked; zero candidate launches.** The twenty scheduled fresh contexts remain unmeasurable. No responses, behavioral failures, ambiguous responses, baseline behavioral RED, guidance improvement, or runtime/cleanup results were observed. A setup incompatibility is not measured candidate behavior.

| Family | Arm | Scheduled | Launched | Scorable | Pass | Fail | Ambiguous | Unmeasurable |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| source-binding | baseline | 5 | 0 | 0 | 0 | 0 | 0 | 5 |
| source-binding | after | 5 | 0 | 0 | 0 | 0 | 0 | 5 |
| outer-cleanup | baseline | 5 | 0 | 0 | 0 | 0 | 0 | 5 |
| outer-cleanup | after | 5 | 0 | 0 | 0 | 0 | 0 | 5 |

All 150 case decisions, including source-binding controls E/F and outer-cleanup controls E/F/I, are unmeasurable. Cases are paired subitems; they do not enlarge the sample count. There are no contrary outputs to omit, rationalizations to quote, or observed variance to characterize. Every scheduled row is preserved in responses/index.json and scores.json with null response/identity/timestamps and an explicit preflight reason. No hidden retries, substitutions, or supplemental candidates ran.

The 49 sealed file hashes and sizes validate. All 28 Git-backed raw snapshots match their named commit paths; the other two raw-source entries are nonconsumed methodology snapshots covered by the freeze hashes. Shared user-message bytes match across both arms in each family. Frozen index SHA-256: `89a7ceef91edf282a2a31cc62253fa88bd454fb07a08b97b2a9ff864cefb6b1f`.

## Must-fix

The sealed config.json and run-plan.md require known exact launch settings, tool access off, canonical system/user message delivery, known input window, a 12000-token output cap, and preserved effective harness/request metadata. The available native collaboration.spawn_agent interface accepts task_name, message, fork_turns, model, and reasoning_effort. It cannot satisfy these fields:

1. It exposes a model alias and reasoning effort, without the exact provider revision or effective sampling parameters.
2. It exposes no tool-disable option. A read-only instruction does not disable tools.
3. It accepts one task message, rather than the canonical system/user message array. Loading the payload through tools changes the required no-read, tool-off delivery protocol and message roles.
4. It exposes no input-window metadata or output-token cap. The largest canonical messages file is 318329 bytes; full capacity and the frozen output limit cannot be certified.
5. It does not expose the full serialized unavoidable harness prefix, provider request IDs, token usage, or finish reason. fork_turns:none addresses parent conversation history, but does not remove common harness instructions.

The parent explicitly directed a preflight stop rather than doomed-unmeasurable launches. CandidateRunsStarted remains 0. The locally observed CLI version is codex-cli 0.163.0; this is not a claim about an unlaunched candidate's effective provider configuration. A harmless PATH-alias permission warning accompanied the successful version query. An initial provenance reader encountered a non-Git methodology entry lacking commit; the corrected validation explicitly separated those entries and completed. Both diagnostics are preserved in execution.json.

A feasible next experiment needs a **new versioned preparation**, preserving this complete sealed pack. Use a native-subagent protocol that explicitly accepts the observable interface: fork_turns:none, model gpt-6.1-sol, reasoning_effort high, at most three active candidate children, the same neutral adapter wrapper for every arm, and opaque payload/sample names. Permit read-only complete payload loading in bounded sequential chunks and retain exact payload bytes/hashes. Candidates produce decisions only and receive no rubric, arm labels, prior responses, runtime task, Herdr, or tracker work. Audit all tool attempts and complete input/case coverage. Document that system text is delivered as task data, tools remain available, exact provider revision/sampling/token limits are unknown, and isolation is behavioral. Those accepted constraints and a frozen rubric must be recorded before the first measured response. The detailed proposal is in execution.json; it is not a retroactive amendment or authorization to reinterpret this attempt as complete.

## Untested scope

All twenty candidate samples and all 150 case decisions are untested. No baseline target failure or treatment effect was established. General harness safety instructions could influence both arms in a future native run. Five samples per arm would remain a bounded textual comparison, not proof of reliability or generalization. If both arms pass a future run, report no measured guidance improvement.

No actual Workflow execution, generated writer guard, source binding, process termination, retained subtree survival, Git cleanup, final-parent verification, multi-turn pressure compliance, or runtime correctness was exercised. No response-level isolation, context capacity, or output completeness was tested because no candidate was launched.

## Deferred OK

Keep the sealed scenarios, sources, contexts, configuration, rubric, provenance, schedule, index, and freeze unchanged. execution.json, responses/index.json, scores.json, and this report are new result-only artifacts under the parent-authorized output path. No source/test/spec/bead/tracked integration/run.md edits, merges, pushes, Herdr mutations, live cleanup, or process operations were performed.

A separate preparation can explicitly approve the feasible native protocol before any outcomes. Live pressure scenarios and mechanical regression evidence remain separate work; this report claims neither.
