# Dossier D9: Do design guidance and process interventions improve the structural quality of LLM and agent code?

## Summary

Synthesis (this dossier's inference from the anchored findings below, not a finding of any single source): yes, but only partly, and at a price. Taken together, the findings suggest that several interventions measurably shift structural indicators of LLM-generated code in controlled settings:

- design-first decomposition prompts;
- structured reasoning before coding;
- object-oriented design guidance in prompts;
- critique-and-revise loops.

The same findings suggest three caveats:

- **Model-dependence.** The size, and sometimes the direction, of the effect depends on the model.
- **Proxy measurement.** Outcomes come mostly from LLM judges, heuristic or composite metrics, or small developer panels, largely on function-level or competition-style tasks.
- **Trade-offs.** Gains come with more total size and coupling, correctness regressions on some models, and added inference cost.

The direction of design error is not uniform. Section 2 and Counterevidence B report under-abstraction by unguided generation alongside over-decomposition under guidance, and vendor documentation describes some models as over-engineering. A single fixed instruction in either direction is therefore risky.

LLM refactoring looks useful for local smells but unreliable for design-level restructuring, and tests alone do not fully catch semantic drift.

Vendor guidance converges on short, non-inferable convention files, planning before coding, and independent review. The one controlled evaluation of context files does not show a reliable task-success gain, and it does not measure design quality.

Key uncertainty: no retrieved study measures the maintainability or evolution cost of guided versus unguided agent output in real repositories over time.

## Facet Questions and Scope

<!-- facet: F11 -->

F11 asks whether design-guidance instructions, checklists, design-first or planning steps, modular-decomposition steps, or self-review and refactoring loops measurably improve the structural or design quality of LLM- or agent-generated code. Structural quality here means modularity, cohesion, smells, maintainability and readability, not only functional correctness. F11 also asks what the side effects are. The sub-questions:

1. **Controlled prompting.** Do controlled prompting results show design outcomes changing with modularity, structure or design-principle instructions, and how were those outcomes measured?
2. **Refactoring.** How well do LLMs refactor or remove smells when asked? What behavior-preservation failures occur, and how do humans judge the results?
3. **Instruction-following.** How well do LLMs follow coding conventions, design-pattern instructions and design-principle instructions?
4. **Side effects.** Do these instructions induce over-abstraction, over-engineering or verbosity, and what do they add in cost?
5. **Critique loops.** What do self-review and critique loops gain on code-quality attributes, and where do they stop helping?
6. **Vendor guidance.** What do vendors and practitioners advise about steering coding agents with conventions or design documents? This is labelled as such and is not treated as empirical evidence.

Out of scope, and covered by other dossiers:

- multi-agent contract-first systems;
- review tooling and general weaknesses of LLM code;
- maintainability benchmarks.

### Source classes

- **Peer-reviewed or preprint empirical studies:** most sources.
- **Vendor official documentation, not empirical:** Anthropic's prompting documentation and OpenAI's Codex AGENTS.md page.
- **Vendor practitioner guidance, not empirical:** Anthropic's Claude Code best-practices article.

## Source Groups and Findings

### 1. Design-first decomposition and structured reasoning on function-level and competition tasks

#### CodeChain: modular decomposition prompt plus a self-revision loop that reuses sub-modules

By encouraging the LLM to reuse previously developed and verified sub-modules, CodeChain can significantly boost both modularity and correctness of the generated solutions, achieving relative pass@1 improvements of 35% on APPS and 76% on CodeContests [226]. <!-- claim: 218c2954cd6c231b; evidence: cdecbb4c790293df; source: 1a57f5502b9d73be -->

With CodeChain, the majority of GPT3.5 outputs were rated 3 to 5 for modularity and reusability, whereas the conventional direct generation approach produced non-modular or non-reusable code (score 0) about 80% of the time [226]. <!-- claim: 6c48a305ac60b908; evidence: e0a9a1f38a1725d4; source: 1a57f5502b9d73be -->

The modularity and reusability scores came from prompting GPT4 to rate output samples on a Likert scale from 0 to 5, reusing GPT3.5 generated samples for a set of 20 random test tasks [226]. <!-- claim: c57f48a0ef19df76; evidence: b28d7a30affdd82a; source: 1a57f5502b9d73be -->

#### Structured chain-of-thought (SCoT)

SCoT prompting outperformed the CoT prompting baseline in human evaluation by 15.27% in correctness, 10.66% in code smell, and 15.90% in maintainability [228]. <!-- claim: 18c970e24109cbe9; evidence: af636603a335f21d; source: 1f72231d276c039e -->

That human evaluation used ChatGPT as the fixed base model, collected 200 generated programs per approach for 800 programs in total, and invited 10 developers with 3-5 years of development experience to evaluate them in a questionnaire [228]. <!-- claim: 7e866b229dd529a0; evidence: db36e9b6ee98c1c4; source: 1f72231d276c039e -->

#### Self-planning

The self-planning approach exhibited the best readability among all approaches in human evaluation, and its correctness and robustness were on par with the ground-truth planning approach [229]. <!-- claim: 8f46cd68aab79759; evidence: ea64747dcb9a481b; source: de53c7fa337cef86 -->

The self-planning evaluation showed developers five codes per task, including self-planning-generated and Code CoT-generated code, scored with integers from 0 to 4 by a team of 10 developers with 2-5 years of Python programming experience [229]. <!-- claim: 5f2c5e3a9b7c860c; evidence: 43fb605ff1734ebe; source: de53c7fa337cef86 -->

#### Module-of-Thought instruction tuning (MoTCoder)

In the MoTCoder study, MoT code consistently demonstrates significantly higher maintainability compared to normal finetuning code and the baseline for all levels [248]. <!-- claim: 05fecfb821762b04; evidence: 2ad6a430d19ca3aa; source: 0d906b2a8296ae5a -->

Inference: MoTCoder is a training intervention rather than a prompt; its comparison is against normal fine-tuning. Across this group, the design-related outcomes are LLM-judge ratings, developer ratings on short functions, or a composite maintainability index. They show that structure-oriented prompting changes how code is organized. They do not show downstream maintenance benefit.

### 2. Object-oriented design guidance at project level

#### Comparative case study of human-involved and LLM-generated object-oriented projects under increasingly specific object-oriented design (OOD) guidance

Relative to human-involved projects, PureAI projects generated end-to-end by LLMs show lower code smell density and appear simpler in total size, complexity, and coupling, which is consistent with oversimplification associated with missing abstractions and weaker responsibility separation [237]. <!-- claim: 7270c5bed5d1ca89; evidence: 4eed6e4c3b4fb2cf; source: 19cbec92a90070bf -->

Overall, increasing the specificity of OOD guidance tends to produce projects with more classes and higher total complexity, size, and coupling, but lower average and max-percentage values of those metrics, while worst-case cohesion tends to decrease [237]. <!-- claim: 8d6d80eba782f238; evidence: 5020c71de7b276f1; source: 19cbec92a90070bf -->

Additionally, moving to a more specific prompt yields limited impacts for certain models, and average cohesion is more model-dependent [237]. <!-- claim: 60508a0eaf2af49f; evidence: 5020c71de7b276f1; source: 19cbec92a90070bf -->

Increasing OOD-guidance specificity tends to reduce overall and method-level code smell density, while class-level code smell density generally shows negligible effects [237]. <!-- claim: e7885a97c0ea0252; evidence: b8424a7f8fc668e3; source: 19cbec92a90070bf -->

The most specific prompt used in this study did not fully eliminate the gap between PureAI and human-involved projects in object-oriented decomposition, suggesting that making generic OOD guidance more specific may be insufficient and that prompt engineering alone may not be enough [237]. <!-- claim: c252936617d77748; evidence: 90db00bc5fd8532b; source: 19cbec92a90070bf -->

Inference: this is the only retrieved study where design guidance is varied in a controlled way at project level. Its pattern is the one most relevant to design-time incentives:

- guidance moves method-level and per-class indicators in the desired direction;
- guidance also inflates total structure;
- guidance does not reach human-level decomposition.

### 3. Style, convention and design-instruction following

#### Readability issue patterns and prompt dimensions

The study found that current LLMs produce code comparable to human-written code in overall readability, but this aggregate similarity masks distinct issue patterns, including excessive complexity, redundant comments, and unknown API usage [238]. <!-- claim: 747bfbaab27337ac; evidence: 4c8a40fce59fa3d7; source: 773e3c818444098d -->

The prompt dimensions most strongly associated with code readability were function signature, constraints, and style description, although the overall role of prompt design remains bounded [238]. <!-- claim: b086f588cc2d97d0; evidence: 4c8a40fce59fa3d7; source: 773e3c818444098d -->

The R2 of the random forest model was below 0.3, and prompt dimensions explain only part of the readability variation, while problem complexity, model capability, and generation variability may also play substantial roles [238]. <!-- claim: e21441799396e72c; evidence: fbbe4f206a115cd1; source: 773e3c818444098d -->

Style description and constraints are most useful when the prompt is underspecified, whereas function signature is most important when the prompt is otherwise complete [238]. <!-- claim: 46f7aa698fa5e4ec; evidence: 1d48ab4484c9b85b; source: 773e3c818444098d -->

#### Constraint-following benchmark (IFEvalCode)

IFEvalCode results for 40+ LLMs show that closed-source LLMs still dominate controllable code generation and that the ability of LLMs to generate controllable code is far behind their ability to generate correct code [246]. <!-- claim: d1cabceb51fc9af3; evidence: ae1b8e9d871ee8d9; source: cb5ac58b2be71aad -->

Claude-3.7-Sonnet averaged 38.5 correctness and 22.6 instruction-following, and GPT-4.1 averaged 36.8 and 23.0 [246]. <!-- claim: 44fb4061beb1cd53; evidence: 0c9c6ac12f7e75d4; source: cb5ac58b2be71aad -->

#### Design-pattern instructions (Singleton case)

The optimal strategy to guide LLMs to include design patterns depended heavily on the type of model, and with guiding instructions Llama 3.3 generated Singleton classes in 100% of cases [247]. <!-- claim: 8cd4d64ccf434554; evidence: 34222f700849acab; source: b4f01b8a3a3a9332 -->

Still, overall, iterative binary feedback provided the best alignment with Singleton while preserving or improving the code's functionality [247]. <!-- claim: c885aa6e37fa9501; evidence: 34222f700849acab; source: b4f01b8a3a3a9332 -->

#### Repository context files (AGENTS.md / CLAUDE.md) and instruction-following

uv is used 1.6 times per instance on average when mentioned in the context files, compared to fewer than 0.01 times when it is not mentioned, and repository-specific tools are used 2.5 times per instance when mentioned versus fewer than 0.05 times when not [232]. <!-- claim: e51c6d4f2bed96fb; evidence: 4d05390260825dd0; source: 3a3cb6b676d84987 -->

Instructions in context files were generally followed and led to more testing and broader exploration [232]. <!-- claim: 6689e9c00f0d112c; evidence: ff0cd027c7c1c951; source: 3a3cb6b676d84987 -->

Inference: explicit, checkable instructions are followed. Examples are a named tool, a required pattern, or a stated convention. A rich set of simultaneous constraints is followed far less reliably than correctness is achieved. Compliance with a design instruction is not evidence that the instruction improved the design.

### 4. Refactoring and smell remediation

#### Commit-level refactoring across models

The canonical source covers two versions of one study, and their numbers differ. See Methodological Limits.

The TOSEM version reports that production-grade models such as GPT-4o and DeepSeek-v3 achieve pass@5 unit test success rates above 90% on multi-file refactorings [231]. <!-- claim: 0fa2b00880714bb8; evidence: ce39d1157219f19e; source: 52c5fa88e1170765 -->

LLaMA 3 achieves the highest overall code smell reduction with a median reduction of 15.1%, while DeepSeek-v3 and GPT-4o achieve the greatest improvements in cohesion, coupling, and complexity [231]. <!-- claim: 2bd676b19f1cf326; evidence: ce39d1157219f19e; source: 52c5fa88e1170765 -->

Developers outperform LLMs in complex, context-sensitive refactorings such as attribute encapsulation [231]. <!-- claim: 80a12ca0b9eefe60; evidence: ce39d1157219f19e; source: 52c5fa88e1170765 -->

The median first-attempt pass rates were 33.0% for StarCoder2, 73.2% for LLaMA 3, 78.5% for GPT-4o Mini, 82.1% for DeepSeek-v3, and 85.4% for GPT-4o [231]. <!-- claim: 1bbd0eecee5af2a0; evidence: 5af7354a287891f4; source: 52c5fa88e1170765 -->

Developer refactorings reduced smells by a median of 1.65% versus 4.93% for StarCoder2, 6.78% for GPT-4o Mini, 10.42% for DeepSeek-v3, 12.21% for GPT-4o and 15.15% for LLaMA 3 [231]. <!-- claim: 689e36e1d18fdd1c; evidence: 5af7354a287891f4; source: 52c5fa88e1170765 -->

In the earlier arXiv version, StarCoder2 excelled at reducing code smells such as Long Statement, Magic Number, Empty Catch Clause, and Long Identifier, while developers performed better in fixing complex issues such as Broken Modularization, Deficient Encapsulation, and Multifaceted Abstraction [231]. <!-- claim: 110763773127d08b; evidence: cd75c1e636958d71; source: 52c5fa88e1170765 -->

#### Refactoring identification and safety

With the to-be-refactored Java documents as input, ChatGPT and Gemini identified only 28 and 7 of the 180 refactoring opportunities, but explaining the expected refactoring subcategories and narrowing the search space in the prompts increased the success rate of ChatGPT from 15.6% to 86.7% [241]. <!-- claim: 7044cdc3a34def3c; evidence: 45a1e5d96657a331; source: 818334cf8e94bdaf -->

ChatGPT recommended solutions comparable to (even better than) those of human experts in 63.6% of cases, but 13 of its 176 solutions and 9 of the 137 solutions suggested by Gemini were unsafe because they changed the functionality of the source code or introduced syntax errors [241]. <!-- claim: 612ecbb690a242fe; evidence: 3871a0d9ea02d8f4; source: 818334cf8e94bdaf -->

By reapplying the identified refactorings to the original code using thoroughly tested refactoring engines, RefactoringMirror accurately reapplied 94.3% of the refactorings conducted by LLMs and avoided all of the buggy solutions [241]. <!-- claim: 209ea56e59bc5325; evidence: 1bbff8ec757c4e9a; source: 818334cf8e94bdaf -->

#### Behavior preservation beyond the existing tests

A differential fuzzing evaluation found that LLMs show a non-trivial tendency to alter program semantics, producing 19-35% functionally non-equivalent refactorings, and about 21% of these remain undetected by the existing test suites [242]. <!-- claim: b1cf5739ff10ae7c; evidence: 690f1a9a3eb17638; source: 46855973c6b1bd90 -->

#### LLM suggestions validated by IDE static analysis (Extract Method)

A formative study on 1752 EM scenarios found that LLMs are very effective for giving expert suggestions yet unreliable, with up to 76.3% of the suggestions being hallucinations [243]. <!-- claim: bc9783a3797357b8; evidence: cddc90a4bde96d04; source: 147fbae373ba0c1d -->

EM-Assist suggests the developer-performed refactoring in 53.4% of cases, improving over the recall rate of 39.4% for previous best-in-class tools, and 81.3% of 16 surveyed industrial developers agreed with its recommendations [243]. <!-- claim: 7119c98f4f6a4a69; evidence: 9be0936cb0d3a280; source: 147fbae373ba0c1d -->

#### Multi-file agent refactoring (RefactorBench)

RefactorBench baselines reveal that current LM agents struggle with simple compositional tasks, solving only 22% of tasks with base instructions, in contrast to 87% for a human developer with short time constraints [240]. <!-- claim: fc9250a96acafb4a; evidence: 3ebff5acbcf1d958; source: e42383cc6feb9f55 -->

On the lazy, base, and descriptive instruction sets, SWE-agent with gpt-4 solves 12%, 18%, and 27% respectively [240]. <!-- claim: 009a5675280956c9; evidence: f53dfe73e2cfa1e6; source: e42383cc6feb9f55 -->

Inference: newer models are much better at preserving behavior on commit-level refactorings. Even so:

- design-level refactorings (encapsulation, modularization) remain a human strength;
- specific instructions raise success;
- deterministic execution through refactoring engines or the IDE is the step that removed unsafe outcomes in the studies that tried it.

### 5. Self-review and critique loops

#### Self-Refine: iterative self-feedback, Table 1 readability metric and the readability appendix

Code Readability scores rose from 37.4 to 51.3 (↑13.9), 27.7 to 63.1 (↑35.4), and 27.4 to 56.2 (↑28.8) [227]. <!-- claim: 06d57b15902af94e; evidence: cef343aa309378fa; source: accef2157d87cf33 -->

The average of all three readability metrics grows across iterations of the feedback loop, and the greedy critique provides more suggestions on refactoring the code for modularization [227]. <!-- claim: fb7ae026b9b33b30; evidence: 0a90d585fc34e5de; source: accef2157d87cf33 -->

Prompting the model to generate generic feedback, or no feedback at all, leads to reduced scores, indicating the importance of the feedback step [227]. <!-- claim: abc6e729591b804e; evidence: 4e261166a8fc1885; source: accef2157d87cf33 -->

#### Feedback-driven repair of static-analysis quality issues

ChatGPT self-repaired code quality issues with a fixed rate of 20% to 60% [213]. <!-- claim: be1b57d26311df8e; evidence: 0fee249d516bbe7a; source: 0c0de32182584e2a -->

Feedback with static analysis and runtime errors was more effective in fixing code style and maintainability, while simple feedback performed better on the remaining quality issues in both Java and Python [213]. <!-- claim: 49524ccd3eebfa58; evidence: 6da2b24bb7bf8479; source: 0c0de32182584e2a -->

The limits of these loops, including cost, new defects and critique quality, are in Counterevidence and Disagreements, subsections F and G.

### 6. Vendor and practitioner guidance (not empirical) and its empirical check

The statements in the first three subsections below are vendor guidance. They describe recommended practice and, in some cases, version-specific model behavior. They are not controlled findings.

#### Anthropic, "Best practices for Claude Code" (vendor practitioner guidance)

The guide says to keep it concise, warning that bloated CLAUDE.md files cause Claude to ignore your actual instructions and that a line should be cut unless removing it would cause Claude to make mistakes [235]. <!-- claim: f1291cbd04ffa836; evidence: 41e355159e8605b2; source: 59c6c0fdd3e6b67e -->

Its include list has code style rules that differ from defaults and architectural decisions specific to your project, and its exclude list has standard language conventions Claude already knows and self-evident practices like write clean code [235]. <!-- claim: 711a4c4a21d10fdb; evidence: e27266bc73c1774f; source: 59c6c0fdd3e6b67e -->

Letting Claude jump straight to coding can produce code that solves the wrong problem, so the guide recommends plan mode to separate exploration from execution [235]. <!-- claim: d9e81832038dcc28; evidence: 60170049c650b979; source: 59c6c0fdd3e6b67e -->

The guide's rationale for an adversarial review step is that a reviewer running in a fresh subagent context sees only the diff and the criteria you give it, not the reasoning that produced the change [235]. <!-- claim: fd2d18ccb349b363; evidence: 7cb7dfe63476cb1a; source: 59c6c0fdd3e6b67e -->

The guide says to treat CLAUDE.md like code: review it when things go wrong, prune it regularly, and test changes by observing whether Claude's behavior actually shifts [235]. <!-- claim: 40926d4a6a4c3104; evidence: c793d077be324a1f; source: 59c6c0fdd3e6b67e -->

#### OpenAI, Codex "Custom instructions with AGENTS.md" (vendor documentation)

Keep rules concise, explain the behavior to flag and any safe path or exception, and reserve formatting and lint checks for CI, according to the Codex AGENTS.md guidance [236]. <!-- claim: d5ae74858cc060e1; evidence: 6fcd8686c1f592c6; source: 175cba93472d223f -->

#### Anthropic prompting documentation (vendor documentation; claims are tied to specific model versions)

The prompting documentation states that Claude Opus 4.5 and Claude Opus 4.6 have a tendency to overengineer by creating extra files, adding unnecessary abstractions, or building in flexibility that wasn't requested [233]. <!-- claim: 27d63ef56b3167b8; evidence: d5747609b40c6bce; source: da45de5646cbbc5b -->

Its sample prompt says not to create helpers, utilities, or abstractions for one-time operations or design for hypothetical future requirements, because the right amount of complexity is the minimum needed for the current task [233]. <!-- claim: c2e829286065350a; evidence: c64da0e61c6770a4; source: da45de5646cbbc5b -->

The same documentation notes that Claude can sometimes focus too heavily on making tests pass at the expense of more general solutions, or use workarounds like helper scripts for complex refactoring instead of standard tools [233]. <!-- claim: b3e21c21ba05808e; evidence: 0b2e7e78aafab4f4; source: da45de5646cbbc5b -->

Claude Opus 5 verifies its own work without being told to, and the vendor says explicit verification instructions cause over-verification and that removing them reduces wasted tokens with no loss in quality [234]. <!-- claim: 6722d8fa24a75e64; evidence: efdf1e8b69345ba9; source: 30d2cbded8543418 -->

Claude Opus 5 catches and fixes its own mistakes well without prompting, and instructed re-checks compound with the model's own behavior and add cost without improving results [234]. <!-- claim: 140295f11877a262; evidence: 9e61326078859d33; source: 30d2cbded8543418 -->

Claude Opus 5 can also expand the scope of a task, adding steps that weren't requested or applying its own judgment about what the task should be, so the vendor advises constraining scope explicitly for narrow tasks [234]. <!-- claim: 0ebf4493e963db66; evidence: ddc306ebe52c8443; source: 30d2cbded8543418 -->

#### Empirical check: a controlled evaluation of repository context files

Providing context files does not generally improve task success rates, while increasing inference cost by over 20% on average, and this holds across different LLMs, coding agents, and both LLM-generated and developer-committed context files [232]. <!-- claim: e58d15aab28d8f47; evidence: c32fd9178b456cb8; source: 3a3cb6b676d84987 -->

LLM-generated context files had a marginal negative effect on task success rates and developer-written ones a marginal performance gain, neither statistically significant [232]. <!-- claim: 86c1161bfd79048a; evidence: ff0cd027c7c1c951; source: 3a3cb6b676d84987 -->

The authors recommend that human-written context files include only instructions not already present in the README, such as specific conventions or non-functional requirements, and be rigorously evaluated before adoption [232]. <!-- claim: e2cb6087a2dd1cf5; evidence: e8625f6cc403ded2; source: 3a3cb6b676d84987 -->

Inference: the empirical result fits the vendors' "keep it short and non-inferable" advice. It does not support the expectation that context files raise task success. Neither the vendor pages nor the evaluation provides evidence about design quality.

## Counterevidence and Disagreements

### A. Is modularity itself the active ingredient?

#### Revisiting the impact of pursuing modularity for code generation (modular versus singular code examples)

Its authors report, surprisingly and unlike conventional wisdom on the topic, that modularity is not a core factor for improving the performance of code generation models [230]. <!-- claim: 8e4328f9685a247d; evidence: e33984d2d0f7fd69; source: 69db0b8c722c55dc -->

The authors argue that the previously reported effectiveness of modularity on performance was likely due to unforeseen consequences of the transformation process, rather than the modularity itself [230]. <!-- claim: 921034658a2cf14f; evidence: bfa6c2d05d1335b9; source: 69db0b8c722c55dc -->

When comparing modular code (MC) to singular code (SC), MC consistently underperforms SC, and the comparison between transformed modular code (TMC) and its manually de-modularized counterpart (TSC) shows no clear correlation between code modularity and performance [230]. <!-- claim: e7d3007e6d3991e6; evidence: fad35a7a5b2a2190; source: 69db0b8c722c55dc -->

#### CodeChain without its revision loop

Without self-revisions, CodeChain's modular CoT prompting actually negatively affects model performance compared to normal prompting, possibly because pretrained LLMs are not designed to generate perfectly modularized solutions [226]. <!-- claim: 87f03dddc2c8cf95; evidence: 7b94ee73e0f3c606; source: 1a57f5502b9d73be -->

#### Class-level generation strategies (ClassEval)

Generating the entire class all at once was the best strategy only for GPT-4 and GPT-3.5, while method-by-method generation was better for the other models with limited ability to understand long instructions [245]. <!-- claim: 6558b591ee21597c; evidence: 2bb71a0096460122; source: 77995e609923f22b -->

Inference: the correctness gains reported for decomposition-oriented methods may come from the revision or selection loop rather than from modular structure as such. Whether decomposition helps depends on model capability.

### B. Over-abstraction versus under-abstraction

The evidence points in both directions, and the design-time rules should not assume one failure mode.

**Under-abstraction, from the project-level OO study:**

However, the simpler PureAI projects are consistent with oversimplification, as they are associated with missing abstractions and weaker responsibility separation [237]. <!-- claim: 25d3ae4faca28531; evidence: 4eed6e4c3b4fb2cf; source: 19cbec92a90070bf -->

**Over-abstraction and excess structure, in the same study and elsewhere:**

Increasing the specificity of OOD guidance tends to produce projects with more classes and higher total complexity, size, and coupling [237]. <!-- claim: 6e08f50b11812e61; evidence: 5020c71de7b276f1; source: 19cbec92a90070bf -->

Claude Opus 4.5 and Claude Opus 4.6 are described by their vendor as having a tendency to overengineer by creating extra files and adding unnecessary abstractions [233]. <!-- claim: c4228ee8b5845196; evidence: d5747609b40c6bce; source: da45de5646cbbc5b -->

The aggregate similarity in readability masks distinct issue patterns in LLM-generated code, including excessive complexity and redundant comments [238]. <!-- claim: c232a29cabd53488; evidence: 4c8a40fce59fa3d7; source: 773e3c818444098d -->

Human Annotator Rewrites averaged 0.70 function units, against 1.41 (T = 0.0) and 1.33 (T = 0.7) for the refined code [227]. <!-- claim: 8d9b098e10b2e8f4; evidence: d7581e44a2be349c; source: accef2157d87cf33 -->

For introductory problems, accuracy generally declines as the number of functions increases, suggesting that simpler solutions benefit from minimal modularity and that excessive modularization adds unnecessary complexity for problems solvable in a few lines of code [248]. <!-- claim: b0232685e39d8a41; evidence: 03ed8e94f4849f5d; source: 0d906b2a8296ae5a -->

Inference: these sources together suggest that the failure mode depends on the model, the prompt and the task. Unguided generation can under-decompose: it omits domain concepts and assigns responsibilities poorly. Guided or self-refined generation can over-decompose: more classes, more function units, more total coupling. Model-specific tendencies, per vendor reports, can add unrequested abstraction. A single fixed instruction, either "always modularize" or "keep it minimal", would fix one failure mode and worsen the other.

### C. Plan granularity and model capability

#### Self-planning study: comparison with Code CoT and across model sizes

CoT exhibits subpar readability because its solution steps provide excessive detail and can become outdated if code modifications occur, which can adversely affect code maintainability [229]. <!-- claim: 744257721016a178; evidence: 564207fc71801726; source: de53c7fa337cef86 -->

Detailed solution steps also entail a loss of diversity, since the Pass@5 and pass@10 of Code CoT are both lower than Direct [229]. <!-- claim: fdb8201022ffa910; evidence: 3c592fe769ccbebf; source: de53c7fa337cef86 -->

In general, self-planning is an emergent ability that can only appear in large-enough language models, although planning proves effective for most of the models [229]. <!-- claim: d22c3dbb5e4de351; evidence: c61419a989114f05; source: de53c7fa337cef86 -->

### D. Design instructions can cost correctness

Some models, such as DeepSeek-Coder and Gemma3 (4B), showed a significant adverse effect, with fewer solutions passing the tests when instructed to follow the Singleton pattern [247]. <!-- claim: 430427b445dc404e; evidence: 79afcd4e79348684; source: b4f01b8a3a3a9332 -->

In many cases pattern guidance even boosts the functional correctness of the generated code, but the effect on functionality is not guaranteed and model-specific [247]. <!-- claim: 6f4c4507562be36d; evidence: c31103768a62754b; source: b4f01b8a3a3a9332 -->

### E. A null result for generic prompt patterns

Analysis of 7583 ChatGPT-assisted code files revealed minimal issues, with Kruskal-Wallis tests indicating no significant differences among prompt patterns in these quality metrics [239]. <!-- claim: 01aa826f063c31fb; evidence: 615d46fd04164f6e; source: 300f944a86583631 -->

The weaknesses of this null result are in Methodological Limits.

### F. Cost and process overhead

Context files increased inference cost by over 20% on average while not generally improving task success rates [232]. <!-- claim: 23145a507860cc70; evidence: c32fd9178b456cb8; source: 3a3cb6b676d84987 -->

The vendor says that on Claude Opus 5 explicit verification instructions cause over-verification and waste tokens [234]. <!-- claim: 20a3473b22009f36; evidence: efdf1e8b69345ba9; source: 30d2cbded8543418 -->

When the cost of carrying out repair is taken into account, self-repair performance gains are often modest, vary a lot between subsets of the data, and are sometimes not present at all [244]. <!-- claim: 6942ee700df83d36; evidence: 0664b88bf99f78bf; source: becfa304df6f60c1 -->

The authors hypothesize that self-repair is bottlenecked by the model's ability to provide feedback on its own code [244]. <!-- claim: 07d216651a625b25; evidence: 0664b88bf99f78bf; source: becfa304df6f60c1 -->

Using a stronger model to boost the quality of the feedback produced substantially larger performance gains, and even for the strongest models self-repair still lags far behind what can be achieved with human-level debugging [244]. <!-- claim: 91697f0ef7e735dd; evidence: 3ab7cbf7a07b7d54; source: becfa304df6f60c1 -->

CodeChain's optimal performance gain was obtained in revision round 4, with a slight performance drop in round 5 that the authors attribute to overfitting to the small set of public test cases [226]. <!-- claim: 1006c8e3c85ed449; evidence: 31fcc7f0c755f4e4; source: 1a57f5502b9d73be -->

Inference: every process intervention in this facet adds inference or interaction cost:

- context files;
- verification instructions;
- revision rounds;
- self-repair loops.

The retrieved evidence shows the added cost is sometimes clear: over 20% for context files. The quality return varies and is sometimes absent. No retrieved study reports a cost-normalized design-quality gain.

### G. Self-review introduces new problems

Despite being effective in self-repairing code quality issues, ChatGPT still introduces new code quality issues in the generated fixes [213]. <!-- claim: 7bdf3b00a54bb759; evidence: d2c6443ea4bbf6b5; source: 0c0de32182584e2a -->

### H. Refactoring safety

About 21% of the functionally non-equivalent refactorings remained undetected by the existing test suites [242]. <!-- claim: 08ec9639cfd1503a; evidence: 690f1a9a3eb17638; source: 46855973c6b1bd90 -->

LLMs are unreliable for EM refactoring: up to 76.3% of the suggestions are hallucinations [243]. <!-- claim: 1ababec3a346b593; evidence: cddc90a4bde96d04; source: 147fbae373ba0c1d -->

13 out of the 176 solutions suggested by ChatGPT and 9 out of the 137 solutions suggested by Gemini were unsafe [241]. <!-- claim: 954a617ea59d5c62; evidence: 3871a0d9ea02d8f4; source: 818334cf8e94bdaf -->

### I. Instruction compliance is not quality

The ability of LLMs to generate controllable code is far behind their ability to generate correct code [246]. <!-- claim: aeb00577a8e3f8ac; evidence: ae1b8e9d871ee8d9; source: cb5ac58b2be71aad -->

Neither the marginal negative effect of LLM-generated context files nor the marginal gain from developer-written ones was statistically significant [232]. <!-- claim: 61657fab06625c33; evidence: ff0cd027c7c1c951; source: 3a3cb6b676d84987 -->

## Implications for an agentic design/review workflow

Everything in this section is this dossier's inference from the findings above. None of it is a finding of any source.

1. **Supply design intent, not exhortations.** At design time, prefer explicit, project-specific design input over generic principle reminders such as "follow SOLID" or "write clean code". Examples of design input: domain concepts, responsibilities, interfaces, ownership. Generic guidance helped only partially in the project-level study and inflated total structure. The vendor guidance itself excludes self-evident "clean code" rules.
2. **Calibrate decomposition to task complexity.** A blanket modularization requirement risks over-decomposing small changes. A blanket minimalism requirement risks under-abstracting larger features. Ask the design step to justify each new class or module against a named responsibility or domain concept. Ask the review step to check both directions: missing concepts or responsibilities, and unjustified extra layers.
3. **Do not read low smell density or pattern presence as good design.** Review-time enforcement should look at concept coverage and responsibility assignment. Pattern compliance and smell counts can look fine while decomposition is poor.
4. **Prefer independent, criteria-driven critique over same-model "improve it" loops.** Specifically:
   - use a fresh-context reviewer;
   - give it explicit criteria and tool findings, such as static analysis;
   - cap the number of rounds;
   - require a check that fixes did not introduce new issues.

   For models whose vendors say they already self-verify, do not stack extra self-check instructions.
5. **Treat LLM refactoring as a proposal, not an execution.** Apply refactorings through deterministic engines or IDE refactorings where possible. Gate on tests plus an equivalence or differential check, because existing tests miss part of the semantic drift. Route design-level refactorings, such as encapsulation and modularization, to a human or to a higher-scrutiny review lane.
6. **Keep convention files short and non-inferable, and leave mechanical style to tooling.** Budget for the added cost and measure whether a rule changes behavior before keeping it. No retrieved evidence shows that convention files improve design quality, so their design value is an open hypothesis.
7. **Avoid throughput or quality claims without measurement.** Every intervention here costs tokens or steps, and none has a cost-normalized design-quality result. Any adoption should be paired with an evaluation that measures structural outcomes, not only task success.

## Methodological Limits and Open Gaps

### Measurement validity

The design-quality evidence in this facet rests mostly on proxies.

CodeChain's modularity evidence rests on GPT4 Likert ratings of GPT3.5 generated samples for 20 random test tasks [226]. <!-- claim: 99a7a22164d24d7d; evidence: b28d7a30affdd82a; source: 1a57f5502b9d73be -->

For Code Readability Improvement, the headline metric came from prompting GPT-4 to calculate the fraction of the variables that are appropriately named given the context [227]. <!-- claim: e51b416ec894a218; evidence: 25da6c868e58e6eb; source: accef2157d87cf33 -->

The SCoT human evaluation invited 10 developers with 3-5 years of development experience to evaluate 800 generated programs [228]. <!-- claim: 17e8bbd1e7bd2550; evidence: db36e9b6ee98c1c4; source: 1f72231d276c039e -->

The self-planning human evaluation assembled a team of 10 developers with 2-5 years of Python programming experience [229]. <!-- claim: 6ecf46222ea61888; evidence: 43fb605ff1734ebe; source: de53c7fa337cef86 -->

Prompt dimensions explain only part of the readability variation, with the random forest R2 below 0.3 [238]. <!-- claim: 9b543570d5a4adb6; evidence: fbbe4f206a115cd1; source: 773e3c818444098d -->

The context-file study evaluated the impact of context files on task resolution rate only, leaving other aspects of coding agent performance such as code efficiency and security to future work [232]. <!-- claim: 4a4ee432b5a6a3a2; evidence: 7135b400e2698f32; source: 3a3cb6b676d84987 -->

The prompt-pattern null result is unbalanced across patterns and floor-limited:

The maintainability table counts 6534 zero-shot files against 441 or fewer for each other pattern, with a median of 0.000 maintainability issues in most patterns [239]. <!-- claim: db2d543d9090c16d; evidence: 8481f149186f50ac; source: 300f944a86583631 -->

### Version drift within one source

The refactoring study's arXiv and TOSEM versions report different numbers. Cite the TOSEM figures for current claims.

TOSEM version (current):

Chain-of-thought prompting improved StarCoder2's test pass rate by 1.7% compared to zero-shot prompting [231]. <!-- claim: f9a5c66793afe7ce; evidence: 63c063455762eb00; source: 52c5fa88e1170765 -->

Earlier arXiv version (StarCoder2 only):

The earlier arXiv version reported a 26.8% median Pass@1 unit test pass rate for its single model, rising to 55.4% at Pass@5 [231]. <!-- claim: 975d1145e7dee69c; evidence: 747a88a9c6f12149; source: 52c5fa88e1170765 -->

The arXiv version instead reported that one-shot prompting yields the highest unit test pass rate of 34.51%, an improvement of 6.15% over zero-shot prompting [231]. <!-- claim: 6f611126bba71caa; evidence: 05ab061387d3259c; source: 52c5fa88e1170765 -->

Inference: these arXiv figures differ from the TOSEM figures in the findings section, including the single-attempt pass rate for the same model. Prompting-effect sizes are small in both versions.

### Stable versus version-specific

This subsection is inference.

**Likely stable across model generations:**

- specific, tool-grounded feedback beats generic feedback;
- existing tests under-detect semantic drift in refactorings;
- deterministic execution of refactorings is safer than free rewriting;
- design-level smells and refactorings are harder for LLMs than local ones;
- the value of decomposition depends on problem complexity.

**Version-specific, to re-check per model release:**

- vendor statements about named models (Claude Opus 4.5, 4.6 and 5);
- per-model pass rates and constraint-following rates;
- effect sizes from the earlier prompting studies, which may shrink as models internalize planning and self-correction. Of these, CodeChain, SCoT and Self-Refine name GPT-3.5- and GPT-4-generation models in their anchored quotes.

Further model and setting details were extracted while writing this dossier and handed to the lead for registration. They are not stated here until registered. They include:

- the models used in the project-level OO study, the context-file evaluation and the readability study;
- the filtering of the IFEvalCode benchmark;
- the outdated-baseline note in RefactorBench.

### Unverified leads (not retrieved; nothing here is evidence)

- An SSRN paper on the impact of object-oriented design guidance on the structural quality of AI-generated code (SSRN 6991925). SSRN and ResearchGate blocked retrieval.
- An ACM paper on using architectural documentation as input to LLM-assisted code generation (doi:10.1145/3786152.3788588). Blocked.
- An LLM4Code 2026 developer study of LLM-driven Java refactoring of code smells (doi:10.1145/3786181.3788720). Not retrieved.
- Work on prompting LLMs to detect SOLID violations (arXiv 2509.03093). Not retrieved; it is about detection, not generation.
- Further instruction-following benchmarks: CodeIF, CodeIF-Bench, CIFE, CodeAlignBench. Not retrieved.
- A two-agent ablation of context files (arXiv 2607.27250). Not retrieved.

### Open gaps

1. **No repository-scale design study.** No retrieved controlled study varies design guidance or process for coding agents working in real multi-file repositories and measures maintainability or design quality.
2. **No longitudinal evidence.** Nothing measures the evolution or change cost of guided versus unguided generated code.
3. **No SOLID-adherence evidence.** No fetched study measures adherence to explicit SOLID-principle instructions in generated code.
4. **Thin human evaluation.** Human evaluation is limited to small developer panels on short functions. No study measures developers' maintenance performance on the generated code.
5. **No cost-benefit data.** There is no cost-benefit evidence for plan-mode or design-first steps in agents, and no cost-normalized design-quality outcome for any intervention.

## Bibliography

[213] [Refining ChatGPT-Generated Code: Characterizing and Mitigating Code Quality Issues](https://arxiv.org/abs/2307.12596)
[226] [CodeChain: Towards Modular Code Generation Through Chain of Self-revisions with Representative Sub-modules](https://arxiv.org/abs/2310.08992)
[227] [Self-Refine: Iterative Refinement with Self-Feedback](https://arxiv.org/abs/2303.17651)
[228] [Structured Chain-of-Thought Prompting for Code Generation](https://doi.org/10.1145/3690635)
[229] [Self-planning Code Generation with Large Language Models](https://doi.org/10.1145/3672456)
[230] [Revisiting the Impact of Pursuing Modularity for Code Generation](https://aclanthology.org/2024.findings-emnlp.676/)
[231] [An Empirical Study on the Code Refactoring Capability of Large Language Models](https://arxiv.org/abs/2411.02320)
[232] [Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?](https://arxiv.org/abs/2602.11988)
[233] [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
[234] [Prompting Claude Opus 5](https://docs.anthropic.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)
[235] [Best practices for Claude Code](https://www.anthropic.com/engineering/claude-code-best-practices)
[236] [Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
[237] [Can LLMs Produce Better Object-Oriented Designs than Human-Involved Development?](https://arxiv.org/abs/2605.19901)
[238] [Characterizing Readability Issue Patterns and the Role of Prompt Design in LLM-Generated Code](https://arxiv.org/abs/2605.13280)
[239] [Do Prompt Patterns Affect Code Quality? A First Empirical Assessment of ChatGPT-Generated Code](https://arxiv.org/abs/2504.13656)
[240] [RefactorBench: Evaluating Stateful Reasoning in Language Agents Through Code](https://arxiv.org/abs/2503.07832)
[241] [An Empirical Study on the Potential of LLMs in Automated Software Refactoring](https://arxiv.org/abs/2411.04444)
[242] [A Differential Fuzzing-Based Evaluation of Functional Equivalence in LLM-Generated Code Refactorings](https://arxiv.org/abs/2602.15761)
[243] [Together We Go Further: LLMs and IDE Static Analysis for Extract Method Refactoring](https://arxiv.org/abs/2401.15298)
[244] [Is Self-Repair a Silver Bullet for Code Generation?](https://arxiv.org/abs/2306.09896)
[245] [ClassEval: A Manually-Crafted Benchmark for Evaluating LLMs on Class-level Code Generation](https://arxiv.org/abs/2308.01861)
[246] [IFEvalCode: Controlled Code Generation](https://arxiv.org/abs/2507.22462)
[247] [Strategies for Guiding LLMs to Use Software Design Patterns: A Case of Singleton](https://arxiv.org/abs/2605.26898)
[248] [MoTCoder: Elevating Large Language Models with Module-of-Thought](https://arxiv.org/abs/2312.15960)
