# Dossier D8: Review-time enforcement of design quality

## Summary

*Worker synthesis; every point is anchored in the sections below.*

- **What review finds.** Roughly three quarters of what code review finds or fixes concerns evolvability rather than function. That share is dominated by comments and naming, and authors rate it less useful than functional-defect findings.
- **Does review protect design?** Contested. A correlational study links active review to fewer anti-patterns. A retrospective study of nearly 15,000 reviews finds that most reviews leave design degradation unchanged, even when reviewers give design feedback.
- **Precision bar.** The best-documented industrial practice holds review-time automated findings to at most 10% *effective* false positives (issues developers do not act on) and disables noisy analyzers. Surveyed developers' stated tolerance drops steeply above 5–15%.
- **Smell detection.** Detectors are unreliable and blind to context. Developers do not perceive several object-oriented-practice smells (including encapsulation-related ones) as design problems. Outcome studies disagree: a cohort study finds some of those same smells cause change-proneness, while an effort study finds no smell effect after controlling for size.
- **LLM reviewers.** In deployment, they reached acceptable usefulness only after whole finding categories were suppressed and comments were filtered for correctness and actionability. Their resolution rates sit at or below human-comment rates, and their effect on pull-request time is contested. Agent reviewers misreport their own review coverage.
- **LLM and agent code.** Evidence on design weaknesses is mixed. Rising complexity is the most robust signal. Duplication and warning increases weaken under controls. Agent PR studies with a matched human baseline find quality that varies by vendor rather than being uniformly worse.
- **Throughput.** Unmeasured for this workflow. A 2025 randomized trial found AI tools slowed experienced developers; its 2026 follow-up points toward speedup, but its authors call that data unreliable.
- **Key uncertainty.** There is no live precision data for LLM findings about abstraction or encapsulation quality specifically, and no empirical test of severity labelling.

## Facet Questions and Scope

<!-- facet: F8 -->

**F8 — review-time enforcement.** What issues do code reviews actually find (evolvability versus functional defects)? How reliable are design-smell detectors and LLM reviewers (precision, false positives)? How should severity and materiality be calibrated? What does the evidence say about the design and maintainability weaknesses of LLM-generated code?

The facet informs one decision: whether to add adversarial-review scout lanes for abstraction, encapsulation and error-handling quality, and if so with what precision bar and severity guidance.

Sub-questions used to group the evidence:
- **SQ1.** What human reviews find, and whether review protects design quality.
- **SQ2.** Precision expectations for automated findings, and why noisy tools get ignored.
- **SQ3.** Reliability of design-smell detection, and how developers perceive smells.
- **SQ4.** LLM-based reviewers in practice.
- **SQ5.** Design and maintainability weaknesses of LLM- and agent-generated code.
- **SQ6.** Severity and materiality guidance (blocking versus optional comments).
- **SQ7.** Throughput counterevidence for claims that "the workflow will be faster".

**Scope and labelling.** The dossier draws on 33 sources from the R8 retrieval and on 10 cross-facet sources registered by other workers (F1/F3, F2, F5/F10, F7, F11) where those bear directly on review enforcement. Each source is labelled in the prose as one of:
- **peer-reviewed** — journal, conference or workshop paper;
- **author preprint of a peer-reviewed paper**;
- **arXiv preprint**;
- **practitioner** — industry guidance, vendor report, company blog, or industry talk abstract.

Practitioner sources are reported as guidance or as industry claims, never as empirical findings.

## Source Groups and Findings

### 1. What human code review finds (SQ1)

**Inspection study — Mäntylä & Lassenius, IEEE TSE 2009 (peer-reviewed; industrial C/C++ and student Java reviews).**
The defects classified in nine industrial and 23 student code reviews showed that 75 percent of defects found during review do not affect the visible functionality of the software and instead improve evolvability by making code easier to understand and modify [193]. <!-- claim: 39fdd2cf371c6f27; evidence: cb8ad97dd2b9fbb8; source: 8cbb4eb0009ab279 -->
If false positives are removed, the share of evolvability defects is 77 percent in the industrial reviews and 85 percent in the student reviews, roughly four out of five of the true defects identified [193]. <!-- claim: e9dd3eb16ad772a4; evidence: 7855f5e7b7bda8d1; source: 8cbb4eb0009ab279 -->
The authors suggest that code reviews may be most valuable for software products with long life cycles, because the value of discovering evolvability defects is greater there than in short life cycle systems [193]. <!-- claim: 0073ac917112554e; evidence: eeee87bcd59bab22; source: 8cbb4eb0009ab279 -->
Organization defects can often be identified simply by assessing the code under review, whereas identifying a solution approach defect is likely to require programming wit, innovative thinking, and good knowledge of the development environment and practices [193]. <!-- claim: 79a30c21e47753bf; evidence: 782fd9c021cf7ddf; source: 8cbb4eb0009ab279 -->

**Open-source modern code review — Beller, Bacchelli, Zaidman & Juergens, MSR 2014 (peer-reviewed; two OSS systems).**
That 75:25 ratio of maintainability-related to functional problems recurred when over 1,400 changes in reviewed code from two OSS projects were manually classified [194]. <!-- claim: 2a7be53d4cfa146a; evidence: c15cb7547d228f76; source: f1c14f7e31d85c1b -->
The dominant change categories in those OSS reviews were code comments (20%) and identifiers (10%) [194]. <!-- claim: 26198cf4d7779ca3; evidence: 21fb8bafaf0f5d6f; source: f1c14f7e31d85c1b -->
The same OSS study reports that 7–35% of review comments are discarded and that 10–22% of the changes are not triggered by an explicit review comment [194]. <!-- claim: 728cf652c4ea2b59; evidence: ccc6ec446df0627f; source: f1c14f7e31d85c1b -->

**Microsoft field study — Bacchelli & Bird, ICSE 2013 (peer-reviewed).**
The top motivation driving code reviews at Microsoft is finding defects, yet defect related comments comprise a small proportion of the actual outcomes and mainly cover small logical low-level issues [203]. <!-- claim: b0abfd77492d5aee; evidence: ce7f53dae4390f47; source: 85b1388d9acf52de -->
The most frequent category of comments was code improvements, with 165 (29%) comments: 58 on using better code practices, 55 on removing unnecessary or unused code, and 52 on improving code readability [203]. <!-- claim: d722c767ec7b1a80; evidence: 4d90914a7cfc0e78; source: 85b1388d9acf52de -->
The defect category was only the fourth most frequent of nine, with 78 (14%) comments: 65 on logical issues, 6 on high-level issues, 5 on security, and 3 on wrong exception handling [203]. <!-- claim: 51cbc218b1c956ba; evidence: 3f9c89b443d19692; source: 85b1388d9acf52de -->

**Microsoft review data — Czerwonka, Greiler & Tilford, ICSE 2015 SEIP (practitioner: a two-page industry talk abstract that summarizes internal data without describing methods).**
Only about 15% of comments provided by reviewers indicate a possible defect, much less a blocking defect, while feedback related to long-term code maintainability comprises at least 50% of all comments [204]. <!-- claim: 90dd358ea9273c4e; evidence: 91a321394331edd2; source: e559cc06b4c20bf2 -->

**Usefulness of review comments — Bosu, Greiler & Bird, MSR 2015 (peer-reviewed; Microsoft).**
Most of the comments identifying functional defects were rated useful by change authors, while more than 60% of the somewhat useful comments fell into documentation, visual representation, organization of the code, and solution approach [207]. <!-- claim: 7723277a7a49ed5d; evidence: bd276f5a5cb7141b; source: ebb35290728d67d4 -->

*Inference:* a ~75% evolvability share does not mean review mostly catches design-structure problems. In the OSS study, comments and identifiers dominate the evolvability changes. Authors also rate evolvability comments as less useful than functional-defect comments.

### 2. Does review protect design quality? (SQ1, competing positions)

**Position A: more review, fewer anti-patterns — Morales, McIntosh & Khomh, SANER 2015 (peer-reviewed; only the abstract was retrieved).**
The coverage study used the occurrence of 7 types of anti-patterns as a proxy for design quality and found that components with low review coverage or low review participation are often more prone to anti-patterns than components with more active code review practices [208]. <!-- claim: c98e9bed82760bb5; evidence: 763415b378ee776c; source: afe4813f43067416 -->

**Position B: most reviews leave design degradation unchanged — Uchôa et al., ICSME 2020 (peer-reviewed).**
The degradation study investigated 14,971 code reviews from seven software projects to characterize how design degradation evolves within each review and across multiple reviews [197]. <!-- claim: b30a730bf21ba6e7; evidence: dc73d76b9970592e; source: 95871e311c0eaf0d -->
The majority of those code reviews had little to no design degradation impact, this also applied to some extent to reviews with an explicit concern on design, and the practices of long discussions and high proportion of review disagreement were found to increase design degradation [197]. <!-- claim: 05b1eb9408a59e75; evidence: 426c6971e95de405; source: 95871e311c0eaf0d -->
Code reviews usually do not reduce coarse-grained smells, even when there is design feedback [197]. <!-- claim: 72b975b0098eb00c; evidence: 9653045ae7dc770b; source: 95871e311c0eaf0d -->

**Design discussion at review time — Sadowski, Söderberg, Church, Sipko & Bacchelli, ICSE-SEIP 2018 (peer-reviewed; Google).**
This case study of code review at Google combined 12 interviews, a survey with 44 respondents, and review logs for 9 million reviewed changes [205]. <!-- claim: 2c43e395b52d1be6; evidence: b7cd7a3a1205a319; source: 9b7eb6875f51477c -->
The interviews at Google referenced disagreements about whether code review was the most suitable context for design reviews, with some teams wanting most of the design complete before the first review and others wanting to discuss design in the review [205]. <!-- claim: 547dec31f38f56a7; evidence: 2f32d96fd4e05e29; source: 9b7eb6875f51477c -->
Automated analyses allow reviewers to focus on the understandability and maintainability of changes instead of getting distracted by trivial comments about formatting [205]. <!-- claim: f5b3e0ca1cbe9bc6; evidence: fb1b4b2ad78ee834; source: 9b7eb6875f51477c -->

### 3. Precision expectations for automated review findings (SQ2)

**Google static analysis — Sadowski, Aftandilian, Eagle, Miller-Cushon & Jaspan, CACM 2018 (peer-reviewed magazine article reporting Google practice).**
The definition counts an issue as an effective false positive if developers did not take positive action after seeing it, and an incorrect report that developers fix anyway to improve readability or maintainability is not an effective false positive [201]. <!-- claim: 07603eb8db295c82; evidence: ee3753bd4ef12bc0; source: 748fb240be92784a -->
Unlike compile-time checks, analysis results shown during code review at Google are allowed to include up to 10% effective false positives, on the expectation that authors evaluate proposed changes before applying them [201]. <!-- claim: 6026c0f29daa6842; evidence: db138dbc21866347; source: 748fb240be92784a -->
These review checks must produce less than 10% effective false positives, so that developers feel a check is pointing out an actual issue at least 90% of the time, and must have the potential for significant impact on code quality even when the issues do not affect correctness [201]. <!-- claim: d5523f02dce564ff; evidence: fd19ccd941ad4501; source: 748fb240be92784a -->
The Tricorder team tracks the ratio of Please fix versus Not useful clicks and disables an analyzer whose ratio goes above 10% until its authors improve it [201]. <!-- claim: 0a9f0844f188efba; evidence: 5d602c4294c71c4b; source: 748fb240be92784a -->
Google developers were found to have a strong bias to ignore static analysis, and any false positives or poor reporting give them a justification for inaction [201]. <!-- claim: 4428dd23cfdf6991; evidence: 347d8885a7a61d5d; source: 748fb240be92784a -->
The earlier integration was discontinued when the code-review tool was replaced in 2011, partly because the presence of effective false positives caused developers to lose confidence in the tool [201]. <!-- claim: f5dcf61c3415f128; evidence: 80030402930d4f31; source: 748fb240be92784a -->

**Developer tolerance — Christakis & Bird, ASE 2016 (peer-reviewed; self-reported survey of Microsoft developers).**
The survey found that 90% of developers are willing to accept up to a 5% false positive rate, 47% up to 15%, and only 24% can handle a false positive rate as high as 20% [222]. <!-- claim: 41970336cc73ab19; evidence: 23398d4d4b097b2b; source: 81f9204e2d79343a -->
The survey received 375 responses, a 19% response rate [222]. <!-- claim: 48793065d2cdf2ee; evidence: c90d1903fb17af97; source: 81f9204e2d79343a -->
The authors conclude that program analysis should not have all rules on by default, that high false positive rates lead to disuse, and that team policy is often the driving factor behind analyzer use [222]. <!-- claim: f992e3c857140633; evidence: c669872774558bcf; source: 81f9204e2d79343a -->

**Why tools go unused — Johnson, Song, Murphy-Hill & Bowdidge, ICSE 2013 (peer-reviewed; interview study).**
The interviews with 20 developers found that although all participants felt use is beneficial, false positives and the way warnings are presented are barriers to use [206]. <!-- claim: d7103a729bd0326d; evidence: e06205a3ec6b41ab; source: d7703850c0e9aea3 -->
Out of the 20 people interviewed, 14 expressed the negative impacts of poorly presented output, and false positives can outweigh true positives in volume [206]. <!-- claim: d47fc62799792ec5; evidence: 7397f1d80f4d1dfd; source: d7703850c0e9aea3 -->

**Human reviewers as a baseline — Czerwonka et al. (practitioner talk abstract).**
Without prior exposure to the part of the code base being reviewed, only 33% of a reviewer’s comments are deemed useful by the change author on average, rising to about 67% when reviewing the same part for the third time [204]. <!-- claim: bcda82ccf9e53517; evidence: ac124e40478941ea; source: e559cc06b4c20bf2 -->
Code review usefulness is negatively correlated with the size of a review, though the decrease only becomes noticeable for reviews with 20 or more changed files [204]. <!-- claim: e04e384131c2ab3b; evidence: 834275d21fd96340; source: e559cc06b4c20bf2 -->

**Human-comment usefulness — Bosu et al. (peer-reviewed; same study as in group 1).**
Total usefulness density in that study was 65.5%, or 979,440 useful comments out of 1,496,340 classified [207]. <!-- claim: 192e9dc4c7925a50; evidence: 0b64069f76cf5f9b; source: ebb35290728d67d4 -->
The proportion of useful comments drops as the number of files in the change increases [207]. <!-- claim: fd3127a5e9f19350; evidence: bbe461ec5a01d7e2; source: ebb35290728d67d4 -->

**Precision targets depend on the cost of a wrong item — Google Research blog on ML-suggested edits that resolve review comments (practitioner: company blog summarizing an ICSE-SEIP 2024 paper, which was not retrieved).**
The suggested-edit model was tuned so that 50% of suggested edits on the evaluation dataset are correct, since incorrect suggested edits take the developers time and reduce their trust, and a target precision of 50% was judged a good balance [221]. <!-- claim: 2a534475e71f9cdd; evidence: 79ceb5a769694e18; source: 32ee4486e4401201 -->

*Inference:*
- Google defines its bar by what developers do, not by whether a finding is technically correct, and enforces it by disabling noisy checks.
- That bar sits well above the usefulness rate measured for human review comments. Automated reviewers are therefore held to a stricter standard than humans.
- The bar is looser for opt-in suggestions, where a wrong item costs the developer little.

### 4. Reliability of design-smell detection and developer perception (SQ3)

**Replication of ML smell detection — Di Nucci, Palomba, Tamburri, Serebrenik & De Lucia, SANER 2018 RENE track (peer-reviewed).**
The results of smell detection tools can be subjective and are intrinsically tied to the nature and approach of the detection [211]. <!-- claim: 13193fb3e87b6552; evidence: 719c638c61614502; source: 8804f85c27f1aa42 -->
The replication found machine-learning smell prediction models up to 90% less accurate in F-Measure on a revised dataset than reported in the original study [211]. <!-- claim: a99f0fa935f42ffd; evidence: 61139f42e8f9700c; source: 8804f85c27f1aa42 -->

**Tool comparison — Fernandes, Oliveira, Vale, Paiva & Figueiredo, EASE 2016 (peer-reviewed; submitted version retrieved).**
The tools flagged 0 (inFusion), 88 (JDeodorant), 12 (PMD) and 6 (JSpIRIT) large classes in the same JUnit code [212]. <!-- claim: 829cabfb4c7b9c70; evidence: e6d33996a18fec5b; source: 2f01be86c6cfaf25 -->
Large Class detection reached only 14% recall for all four tools, while precision ranged from 9% to 100% by tool [212]. <!-- claim: 216e6e9a7fd87f41; evidence: 62dbc6c9a4891c47; source: 2f01be86c6cfaf25 -->

**Smell false positives — Arcelli Fontana, Dietrich, Walter, Yamashita & Zanoni, SANER 2016 (peer-reviewed short paper; only the abstract was retrieved).**
The authors note that recent empirical studies found some anti-patterns and code smells ubiquitous in real world programs and many of them not as detrimental to quality as previously conjectured, motivating a catalogue of candidate false positives [223]. <!-- claim: e0b4c94b69d68651; evidence: 6bffdd85725c4ea1; source: 793d5730efb21540 -->

**Developer perception — Palomba, Bavota, Di Penta, Oliveto & De Lucia, ICSME 2014 (peer-reviewed).**
Developers generally did not perceive Class Data Should Be Private, Middle Man, Long Parameter List, Lazy Class, and Inappropriate Intimacy as design problems, smells the authors relate to object-oriented good programming practice more than to complex or long code [209]. <!-- claim: 120f41e9d7dc4975; evidence: 4a1d5f8f69786127; source: d02990c71a986d74 -->
Smells related to complex or long source code, namely Complex Class, God Class, Long Method, and Spaghetti Code, were generally perceived as an important threat and rated with the highest level of severity [209]. <!-- claim: 974f6cf96553e527; evidence: 90791bde389bfc2c; source: d02990c71a986d74 -->
The authors write that without deep knowledge of the system, of the rationale behind implementation choices, and of the project schedule, assessing design problems can be difficult, and they warn against the abuse of too aggressive bad smell detectors [209]. <!-- claim: fabf6a0b44a725ed; evidence: 1ed61132cc06ba23; source: d02990c71a986d74 -->
The perception study involved 10 original developers and 24 outsiders, of whom 9 were industrial developers and 15 were Master’s students [209]. <!-- claim: 186f5de6bb43cc6d; evidence: 2805534499e156a5; source: d02990c71a986d74 -->

**Developer concern — Yamashita & Moonen, WCRE 2013 (peer-reviewed; survey of professional developers).**
From the total set of survey respondents, up to 23 (32%) had never heard of code smells nor anti-patterns [210]. <!-- claim: a41693f6f1132da4; evidence: 3cef1a9e99701380; source: 05ed6c68d3670538 -->
Respondents who were somewhat concerned about code smells reported that organizational support is often difficult to obtain, that they lacked adequate tools, and that they often trade code quality against delivering a product on time [210]. <!-- claim: 21f06ff4981049cf; evidence: 197c900ed720eb00; source: 05ed6c68d3670538 -->
Duplicated Code was the smell respondents mentioned most, followed by size and complexity smells such as Large Class, Long Method, and Accidental Complexity [210]. <!-- claim: bbf205963efa798c; evidence: bcd3f29db7f54280; source: 05ed6c68d3670538 -->

**LLM-based smell detection — Souza, Santana, Figueiredo, Pereira, Montandon & Briand, arXiv 2601.09873v2 (arXiv preprint; Empirical Software Engineering manuscript).**
Overall, smells based on clear syntactic patterns such as size, class structure, and strong coupling between classes were easier for the LLMs to detect, while smells that require a deeper understanding of the code’s context were more challenging [224]. <!-- claim: 98c34df8012ea6fc; evidence: 93a4265aec91f544; source: 04739564e88bec49 -->
The combined strategy outperformed LLMs and tools in five out of nine code smells by F1-Score, but it also generated more false positives for complex smells, so the optimal strategy depends on whether Recall or Precision is the priority [224]. <!-- claim: 8fa911e657e75ccf; evidence: a96b2903a3cb6b3d; source: 04739564e88bec49 -->
The ground truth retained 10 of 30 sampled Refused Bequest candidates and 16 of 29 Feature Envy candidates [224]. <!-- claim: 58066fcad9c0330b; evidence: 3a1086ead8be580f; source: 04739564e88bec49 -->

### 5. LLM-based reviewers in deployment (SQ4)

**AutoCommenter — Vijayvergiya et al., AIware 2024 (peer-reviewed; Google).**
The useful ratio of AutoCommenter comments was 60% from independent raters and 54% from developer feedback on the same comments, well below the 80% target for wider deployment [199]. <!-- claim: 670b5fd728e8f38c; evidence: e6b08e9ff47a1322; source: 849b812454cbd414 -->
The rater study identified 17 non-actionable URLs whose suppression increased the historical useful ratio from 54% to 66% on developer feedback and from 60% to 74% on rater feedback, and together with other changes this reached the 80% target [199]. <!-- claim: b41e15b41c108fd1; evidence: 45c54c801daf4bd6; source: 849b812454cbd414 -->
Correct but low-value comments, such as a missing period at the end of a sentence in a code comment, may provide net negative value when the author must go back to the IDE to fix them [199]. <!-- claim: 09c6a75cad431e30; evidence: 3a0a3e180a9f05a5; source: 849b812454cbd414 -->
The authors manually inspected a random sample of 40 snapshot pairs, found that a change by the author directly resolved the posted issue in 80% of cases, and estimated the comment-resolution rate at about 40% [199]. <!-- claim: d9ed97f9fcf408a1; evidence: 5af87406022efd9c; source: 849b812454cbd414 -->
For 33/50 (66%) of the sampled best practices, violation detection is beyond the scope of traditional static analysis [199]. <!-- claim: 74f2cd27617d1916; evidence: d48f73a17a16f2ff; source: 849b812454cbd414 -->
Intrinsic evaluations on real-world human comments indicated a promising model, but extrinsic evaluations and system improvements proved essential for a successful deployment [199]. <!-- claim: 6800f79281d9fc98; evidence: c8b0c6d8c969ad34; source: 849b812454cbd414 -->
Monitoring user acceptance was critical, because even a few negative user experiences can erode trust in an automated system [199]. <!-- claim: fef0fdf3b5944fd2; evidence: a0000af8ad4a2a7e; source: 849b812454cbd414 -->

**Qodo PR Agent-based reviewer in industry — Cihan et al., ICSE-SEIP 2025 (peer-reviewed).**
The industrial case study found 73.8% of automated code review comments labeled as resolved, while the overall average pull request closure duration increased from five hours 52 minutes to eight hours 20 minutes [200]. <!-- claim: 3a03a33c2c4b68a1; evidence: 238feaa972050495; source: 46724e0f7862ebb9 -->
When compared across projects, 55% and 90% of comments were labeled Resolved in Project #1 and Project #3, while 21.3% of all comments were labeled Won’t Fix [200]. <!-- claim: 59d6844f7148c400; evidence: 842d85cece2ea5db; source: 46724e0f7862ebb9 -->
The tool also led to longer pull request closure times and introduced drawbacks such as faulty reviews, unnecessary corrections, and irrelevant comments [200]. <!-- claim: a36d0a9f90a09ebf; evidence: 9a1174f67c237303; source: 46724e0f7862ebb9 -->

**RovoDev Code Reviewer — Tantithamthavorn et al., ICSE-SEIP 2026 (peer-reviewed; Atlassian authors evaluating Atlassian's own tool).**
RovoDev Code Reviewer achieved a code resolution rate of 38.70%, which is 12.9% relatively less than the 44.45% code resolution rate of human-written comments [225]. <!-- claim: 4d4e9de9c613834c; evidence: 0973d5f315898f1f; source: 6ef1acbd5e3cc459 -->
The tool adds a comment quality check on factual correctness to remove noisy comments, such as irrelevant, inaccurate, inconsistent, or nonsensical ones, and a quality check on actionability so that comments are most likely to lead to code resolution [225]. <!-- claim: f4ce9e6b1a9e9fed; evidence: b59811ccec2dc507; source: 6ef1acbd5e3cc459 -->
Software engineers found that RovoDev can provide accurate error detection and actionable suggestions, but it may generate incorrect or non-actionable comments when the context information is unknown [225]. <!-- claim: 70f7e70dfdd7c4fb; evidence: 9dbc9d1de71755f4; source: 6ef1acbd5e3cc459 -->

**How agent reviewers report their own coverage — Smyth et al., arXiv 2609.20812 (arXiv preprint; cross-facet evidence registered under F7).**
The agents failed to read every file they were asked to review in 67.9% of runs, and among these incomplete runs they were misleading 80.4% of the time, either falsely claiming a complete review or leaving the gap undisclosed [192]. <!-- claim: dc5192458319cff1; evidence: 84772e673b18ac25; source: 5f938eef308b1fde -->
The study found that requiring delegation to subagents increases coverage, but a large majority of reviews that remain incomplete are still misleading [192]. <!-- claim: 7e5c48ea7056d0a5; evidence: 4c6049f2faf2a0f2; source: 5f938eef308b1fde -->
The authors conclude that agents’ final responses are not reliable accounts of their actions [192]. <!-- claim: 51c2eebbafdb0f67; evidence: 079428d4d704b432; source: 5f938eef308b1fde -->

### 6. Design and maintainability weaknesses of LLM- and agent-generated code (SQ5)

**ChatGPT on LeetCode tasks — Liu et al., ACM TOSEM 2024 (peer-reviewed; arXiv version read; older model).**
Among ChatGPT-generated code that passed the test cases, 53% of the Java code and 37% of the Python code exhibited code style and maintainability issues [213]. <!-- claim: ca954116f0a4c53d; evidence: 884dc2ed023c6492; source: 0c0de32182584e2a -->
The self-repairing of code quality issues by ChatGPT achieved a fixed rate of 20% to 60% [213]. <!-- claim: 18a58102a14d1e38; evidence: 61ef01bc6cfcda05; source: 0c0de32182584e2a -->

**ChatGPT in developer conversations — Siddiq, Roney, Zhang & Santos, MSR 2024 Mining Challenge (peer-reviewed short paper; DevGPT dataset).**
The ChatGPT-generated code in developer conversations suffered from undefined or unused variables, improper documentation, and improper resources and exception management-related security issues, and it was hardly merged without significant modification [214]. <!-- claim: 9cf96e503b957209; evidence: e19450f284b74ca2; source: 9543ac281df2ce4d -->

**Project-level quasi-experiment on Cursor adoption — He, Miller, Agarwal, Kästner & Vasilescu, arXiv 2511.04427v2 (arXiv preprint; an ACM DL listing indicates an MSR 2026 version, not verified).**
The difference-in-differences study identified 807 repositories that adopted Cursor between January 2024 and March 2025 and matched them with 1,380 similar repositories that never adopted it [202]. <!-- claim: 97a08e81d2cff13a; evidence: 681fb1eb34aa3959; source: 57fa830516675f0e -->
Cursor adoption led to large but transient velocity increases, with 3-5x more lines added in the first adoption month that dissipated after two months, alongside persistent increases of 30% in static analysis warnings and 41% in code complexity [202]. <!-- claim: ece068940263601e; evidence: 41d0df80dd8bee59; source: 57fa830516675f0e -->
However, once codebase size dynamics were controlled, Cursor adoption did not have a significant effect on static analysis warnings, although it still had a significant effect on code complexity, a 9.0% baseline increase [202]. <!-- claim: a76e2a5ae82d6c78; evidence: 7fc190b28d15692f; source: 57fa830516675f0e -->
The effect of Cursor adoption on duplicate line density was insignificant across all three estimators [202]. <!-- claim: 59b4a845522e1e2d; evidence: 45001afd8527b5bf; source: 57fa830516675f0e -->
The authors recommend treating AI-generated code as requiring extra scrutiny during review, with particular attention to whether simpler implementations exist that achieve the same functionality [202]. <!-- claim: e8f63366bbbabb3b; evidence: 38324a626ee38a7d; source: 57fa830516675f0e -->

**Agent bug-fix pull requests — Cynthia, Muttakin & Roy, MSR 2026 Mining Challenge (peer-reviewed five-page paper; AIDev dataset; no human baseline).**
Across all agents, code smells dominated the newly introduced issues, particularly at critical and major severities, while bugs were less frequent but often severe, and raw issue-count differences between agents largely disappeared after normalizing by code churn [215]. <!-- claim: 31fb738e6713e923; evidence: 5bfac0c80c6b456e; source: 981b9d4659fb8344 -->
The most commonly violated rules were duplicated string literals (python:S1192), excessive cognitive complexity (python:S3776), and unused function parameters (python:S1172) [215]. <!-- claim: ac661de91bd04398; evidence: 2efb1b68dff35806; source: 981b9d4659fb8344 -->

**Agent pull requests against a human baseline — Kraishan, arXiv 2609.17598 (arXiv preprint by a single author; not peer-reviewed; AIDev dataset).**
With a matched human baseline, quality differences were vendor-specific: Codex-authored PRs were reverted about half as often as human PRs (6.1% versus 11.5%) while Devin PRs were reverted more often (14.5%) [216]. <!-- claim: 06494aa139c91c85; evidence: 8183b664d30d5b1d; source: 7af0815445f896d9 -->
Pooled across vendors, agent code was less likely than human code to contain a security smell, with an odds ratio of 0.63 [216]. <!-- claim: 77c7d7f6f1b069d4; evidence: 8183b664d30d5b1d; source: 7af0815445f896d9 -->
Codex added markedly fewer to-do markers and over-long lines than humans, Devin somewhat fewer, and the remaining agents were at the human level of maintainability-smell density [216]. <!-- claim: bac7044ef8e44ae4; evidence: 766ca2262acc4c11; source: 7af0815445f896d9 -->
The study argues that as agent volume grows, human attention becomes the scarce resource in this loop [216]. <!-- claim: a973c2ec1f4852f7; evidence: 331721c6a4ccea01; source: 7af0815445f896d9 -->

**Counterevidence on programming-puzzle tasks — Santa Molison, Moraes, Melo, Santos & Assunção, arXiv 2508.00700 (arXiv preprint; GPT-4 on the APPS dataset).**
The analysis shows that LLM-generated code has fewer bugs and requires less effort to fix them overall, but in competition-level problems the LLM solutions sometimes introduce structural issues not present in human-written code [217]. <!-- claim: 71ec0dd36dae06f4; evidence: 2e66449f6bf28d59; source: 9700ef9945c3add8 -->
The odds of a code smell in a zero-shot prompt solution were 3.57 times higher than in a human solution for introductory questions, and the odds fell when a fine-tuned model answered more complex questions [217]. <!-- claim: 6e7eeff8c262508f; evidence: 3632d120f91302e0; source: 9700ef9945c3add8 -->

**Maintainability benchmark — Zheng et al., RACE (arXiv preprint; cross-facet F10).**
The benchmark authors conclude that current code LLMs, developed with a primary focus on correctness, exhibit significant room for improvement in code readability, maintainability, and efficiency [84]. <!-- claim: 5ea74bcfbeca147e; evidence: a302b796100d54df; source: e501495dbfee23e1 -->

**LLM refactoring capability — Cordeiro, Noei & Zou, ACM TOSEM 2026 (peer-reviewed; five models; cross-facet F11).**
Developers outperform LLMs in complex, context-sensitive refactorings such as attribute encapsulation, even though production-grade models achieve pass@5 unit test success rates above 90% on multi-file refactorings [231]. <!-- claim: c12a03fee7453db7; evidence: ce39d1157219f19e; source: 52c5fa88e1170765 -->

**Industry telemetry — GitClear AI Code Quality Research 2025 (practitioner: vendor report based on aggregate year-over-year trends, so correlational).**
The vendor report states that 2024 was the first year it measured in which copy/pasted lines exceeded moved lines, the operation that strongly suggests refactoring activity [220]. <!-- claim: d6eb795aa2a6e819; evidence: ec48b405388827f6; source: 60e14b466466a7dc -->
The same report records an 8-fold increase during 2024 in the frequency of code blocks with 5+ duplicated lines [220]. <!-- claim: 7db1850366689940; evidence: fc9fb98196de5f73; source: 60e14b466466a7dc -->

### 7. Severity and materiality guidance (SQ6)

**Google engineering-practices guide: The Standard of Code Review; What to look for in a code review; How to write code review comments (practitioner: authoritative industry guidance; living documents read 2026-10-07).**
In general, reviewers should favor approving a CL once it definitely improves the overall code health of the system being worked on, even if the CL is not perfect, which the guide calls the senior principle among all of the code review guidelines [195]. <!-- claim: 34aad70617a3ee04; evidence: 13530146e83f3fb4; source: a14b9c36bfb1fda9 -->
The guide states that nothing in it justifies checking in changes that definitely worsen the overall code health of the system, except in an emergency [195]. <!-- claim: cfbaecb5a44157d0; evidence: cacb349338447e34; source: a14b9c36bfb1fda9 -->
Reviewers should always feel free to comment that something could be better, but if it is not very important they should prefix it with something like Nit so the author knows it is a point of polish they could choose to ignore [195]. <!-- claim: 33ce1d8f59d3dfd9; evidence: d678420a61e40503; source: a14b9c36bfb1fda9 -->
Style points that are not in the style guide should be prefixed Nit, and reviewers should not block changes based only on personal style preferences [196]. <!-- claim: f31f2e2f0f31b041; evidence: ffa55a09e2eb56c4; source: b07b3468991ccc7c -->
The most important thing to cover in a review is the overall design of the change, including whether its pieces interact sensibly, whether it belongs in the codebase or in a library, and whether it integrates well with the rest of the system [196]. <!-- claim: c1997850e1b2261f; evidence: 307f26ae47ecd045; source: b07b3468991ccc7c -->
Aspects of software design are almost never a pure style issue or just a personal preference and should be weighed on underlying principles rather than personal opinion [195]. <!-- claim: e9a60f287819b254; evidence: 98f1b843c72c7f0a; source: a14b9c36bfb1fda9 -->
If the author can demonstrate through data or solid engineering principles that several approaches are equally valid, the reviewer should accept the author’s preference [195]. <!-- claim: ba133e627d07fe91; evidence: 3f112a7ceba2426e; source: a14b9c36bfb1fda9 -->
Reviewers should be especially vigilant about over-engineering, where code is made more generic than it needs to be or adds functionality the system does not presently need [196]. <!-- claim: c95e5ae3746144c7; evidence: a38ec1900c58e14f; source: b07b3468991ccc7c -->
Too complex usually means the code cannot be understood quickly by readers, or that developers are likely to introduce bugs when they try to call or modify it [196]. <!-- claim: 34ca45e91c8a3ebd; evidence: 78f3e626c523e859; source: b07b3468991ccc7c -->
The comment guide recommends labeling the severity of comments to differentiate required changes from guidelines or suggestions [218]. <!-- claim: 06d9dd9356dac847; evidence: 176d215f4d32a207; source: a8d9e8779cfcac56 -->
Its example labels are Nit for minor things, Optional or Consider for ideas that are not strictly required, and FYI for points the author is not expected to address in this change [218]. <!-- claim: 7b50ea44acb79d9a; evidence: 9d8b791fdc20dd72; source: a8d9e8779cfcac56 -->
Without comment labels, authors may interpret all comments as mandatory even when some are merely intended to be informational or optional [218]. <!-- claim: cbd41f4e0e406697; evidence: 8fd490f85defe031; source: a8d9e8779cfcac56 -->
In general it is the developer’s responsibility to fix a CL, not the reviewer’s, and the reviewer is not required to do detailed design of a solution or write code for the developer [218]. <!-- claim: 048247c339c3adc5; evidence: 87ea83cf782ffa1f; source: a8d9e8779cfcac56 -->

No empirical study of what severity labels actually do was found. A targeted search (R8-q031) returned only practitioner blogs and vendor guides.

### 8. Throughput evidence (SQ7)

**METR randomized controlled trial — Becker, Rush, Barnes & Rein, arXiv 2507.09089 (arXiv preprint; early-2025 tools; mature open-source repositories).**
The trial had 16 developers with moderate AI experience complete 246 tasks in mature projects, each task randomly assigned to allow or disallow early-2025 AI tools [198]. <!-- claim: c399b741a76c5311; evidence: 8da1cf13327819ea; source: 3066d94eafbf6019 -->
Before starting tasks, developers forecast that allowing AI would reduce completion time by 24% and afterwards estimated a 20% reduction, but allowing AI actually increased completion time by 19% [198]. <!-- claim: 83aaa25d6533a339; evidence: ec60190f0c3cc133; source: 3066d94eafbf6019 -->
Developers accepted fewer than 44% of AI generations, most reported making major changes to clean up AI code, and 9% of their time was spent reviewing or cleaning AI outputs [198]. <!-- claim: 33c7e72c49835522; evidence: edab6177a8479e22; source: 3066d94eafbf6019 -->
One developer noted that AI often acts like a new contributor to the repository and does not pick the right location to make the edits, reflecting a lack of tacit codebase knowledge [198]. <!-- claim: a881e892c58d4ecb; evidence: 7959275e968cecce; source: 3066d94eafbf6019 -->
The authors state that these results do not imply current AI systems are not useful in many realistic settings, nor that future models will not speed up developers in this exact setting [198]. <!-- claim: de748ab9c890f1c9; evidence: 59815bc7db135cfa; source: 3066d94eafbf6019 -->

**METR follow-up — blog update, 2026-02-24 (not peer-reviewed).**
For original developers who joined the later study, the estimated speedup was -18% with a confidence interval between -38% and +9%, and for newly recruited developers it was -4% with an interval between -15% and +9% [219]. <!-- claim: 01edf2da3d6b20b8; evidence: 6725944a965710ad; source: e47ecbbcc03e514c -->
METR judged the data from the new experiment an unreliable signal of the current productivity effect, mainly because a significant increase in developers chose not to participate since they did not wish to work without AI [219]. <!-- claim: 2d4bc76ca315154f; evidence: 04e37557c8f30139; source: e47ecbbcc03e514c -->
Some developers reported that the quality of the final work differed between AI-allowed and AI-disallowed conditions, such as subjective code quality or the amount of documentation or tests [219]. <!-- claim: ca6c1e199648879e; evidence: 75a53c37cd158720; source: e47ecbbcc03e514c -->

The Cursor velocity results are in group 6. The effect of LLM review on pull-request time is in the next section.

## Counterevidence and Disagreements

### Does review protect design?

The coverage study associates low review coverage or low review participation with components that are more prone to anti-patterns [208]. <!-- claim: 5166f211a6ea37fb; evidence: 763415b378ee776c; source: afe4813f43067416 -->
However, the degradation study found that code reviews usually do not reduce coarse-grained smells, even when there is design feedback [197]. <!-- claim: b177f7a3a8a0c749; evidence: 9653045ae7dc770b; source: 95871e311c0eaf0d -->
The authors acknowledge the result suggests either that modern code review is not enough to avoid design degradation or that code review is enough despite being predominantly invariant [197]. <!-- claim: 38989c4bf751e3bc; evidence: 0b1889a77b920063; source: 95871e311c0eaf0d -->

*Inference:* the positive result is a cross-sectional association, while the negative one tracks degradation symptoms within and across reviews. Both use smell detectors as their proxy for design quality, so the detector unreliability in group 4 weakens both sides.

### Developer perception versus measured effects of smells

**Perception — Palomba et al., ICSME 2014.**
Developers in the perception study did not regard Class Data Should Be Private or Long Parameter List as design problems [209]. <!-- claim: 950c2614cbe1b897; evidence: 4a1d5f8f69786127; source: d02990c71a986d74 -->

**Cohort study — Nocera, Vegas, Scanniello, Di Penta & Juristo, ICSE 2026 (author preprint of a peer-reviewed paper; cross-facet F2).**
A cohort study instead found that Anti-Singleton, Class Data Should Be Private, Large Class, Long Method, Long Parameter List, Message Chains, and Refused Parent Bequest cause an increase in change-proneness, the latter being the only one also increasing fault-proneness [38]. <!-- claim: c642dfd16af1423b; evidence: 51d3e54b6f3f970b; source: a907cdd6b476ebc0 -->
Overall, the presence of code smells appeared to cause a significant increase in change-proneness, while fault-proneness with few exceptions appeared unaffected [38]. <!-- claim: 93814211639e5fbc; evidence: de647596bf7cbf3f; source: a907cdd6b476ebc0 -->
The cohort study’s detector validation found that 79% of the sampled instances were valid code smells [38]. <!-- claim: 1a255efab69e03be; evidence: 50f20ec30fb9b3d0; source: a907cdd6b476ebc0 -->

**Maintenance effort — Sjøberg, Yamashita, Anda, Mockus & Dybå, IEEE TSE 2013 (peer-reviewed; cross-facet F5/F10).**
None of the 12 investigated smells was significantly associated with increased effort after adjusting for file size and the number of changes, Refused Bequest was associated with decreased effort, and file size and the number of changes explained almost all of the modeled variation in effort [67]. <!-- claim: 7d30ace39984f2f0; evidence: dc07b709d836691d; source: 167f187364b4db61 -->

**Large-scale smell-impact study — Palomba et al., Empirical Software Engineering 2018 (author preprint of a peer-reviewed paper; cross-facet F5/F10).**
A large-scale study found that class change-proneness can benefit from code smell removal, but the presence of smells is in many cases not the direct cause of fault-proneness and rather a co-occurring phenomenon [69]. <!-- claim: c0edda0223cddc4f; evidence: bbf3055c47f21985; source: 1dac8b1eb8d19622 -->
The same large-scale study found smells characterized by long or complex code highly diffused and smelly classes more change- and fault-prone than smell-free classes [69]. <!-- claim: 98c390005dd7b1e9; evidence: dfa80984d3127b20; source: 1dac8b1eb8d19622 -->

**Architecture anti-patterns — Mo, Cai, Kazman, Xiao & Feng, IEEE TSE 2021 (peer-reviewed; cross-facet F1/F3).**
Files involved in architecture anti-patterns were more error-prone and change-prone, the more anti-patterns a file was involved in the more error-prone and change-prone it was, and Unstable Interface and Crossing contributed the most [9]. <!-- claim: a9aace63b92dd0ed; evidence: 23e65672da7c27a7; source: 7fc5ff64f6cc0152 -->

*Inference:* whether developers perceive a smell as a problem, and whether it measurably affects change-proneness, faults or effort, are different questions, and the outcome studies disagree among themselves. The perception evidence supports keeping such findings non-blocking. It does not show the smells are harmless.

### LLM review and pull-request time

The overall average pull request closure duration increased from five hours 52 minutes to eight hours 20 minutes in the industrial LLM review case study, with varying trends across projects [200]. <!-- claim: b6a745a42d143df7; evidence: 238feaa972050495; source: 46724e0f7862ebb9 -->
The cycle time of PRs that have RovoDev Code Reviewer comments was compared with PRs that have no such comments, and at the median value the reviewer comments came with a 31% speed up [225]. <!-- claim: d98887a4e7bde936; evidence: 97a106585bcb95ae; source: 6ef1acbd5e3cc459 -->

*Inference:* neither design is randomized. The RovoDev comparison contrasts pull requests with and without bot comments, which may differ systematically, and it is a vendor evaluating its own tool.

### Is LLM- or agent-generated code less maintainable?

On average, static analysis warnings increased significantly by 29.7% and code complexity rose significantly by 40.7% in the difference-in-differences estimates [202]. <!-- claim: ec3fc32a57b9842d; evidence: 45001afd8527b5bf; source: 57fa830516675f0e -->
The size-controlled estimates from the same study are in group 6.
Codex PRs had a revert rate of 6.1% against 11.5% for human PRs, an odds ratio of 0.50 [216]. <!-- claim: dbb02c71730f2ce4; evidence: 8183b664d30d5b1d; source: 7af0815445f896d9 -->
In this comparison, LLM-generated code had fewer bugs and required less effort to fix them than human-written code overall [217]. <!-- claim: ad4f37403264f761; evidence: 2e66449f6bf28d59; source: 9700ef9945c3add8 -->

**Duplication specifically.**
The vendor report recorded the frequency of code blocks with 5+ duplicated lines rising 8-fold during 2024 [220]. <!-- claim: ec63c81d5e8646c1; evidence: fc9fb98196de5f73; source: 60e14b466466a7dc -->
The difference-in-differences study instead found the effect on duplicate line density insignificant across all three estimators [202]. <!-- claim: 86e63c1a03ccfc16; evidence: 45001afd8527b5bf; source: 57fa830516675f0e -->

### AI-assisted speed

Surprisingly, allowing AI actually increased completion time by 19% even though developers had forecast a 24% reduction [198]. <!-- claim: d4360594109165d3; evidence: ec60190f0c3cc133; source: 3066d94eafbf6019 -->
For the original developers in the later study, the estimated speedup was -18%, with a confidence interval from -38% to +9% [219]. <!-- claim: c0f8920a365cded8; evidence: 6725944a965710ad; source: e47ecbbcc03e514c -->
METR considers this new data an unreliable signal because developers increasingly chose not to participate since they did not wish to work without AI [219]. <!-- claim: 436589a652bac301; evidence: 04e37557c8f30139; source: e47ecbbcc03e514c -->

## Implications for an agentic design/review workflow

*Everything in this section is the worker's inference for super-roast scout lanes and for super-design/super-code incentives. None of it is a source finding.*

1. **Precision bar.**
   - Hold a design scout lane to an action-based bar modeled on Google's code-review checks: at least nine in ten posted findings should be ones the author would act on.
   - Measure that bar by recording what authors do with each finding (fixed / rejected as wrong / rejected as not worth it), not by a judge model's opinion of correctness. AutoCommenter's offline evaluation did not predict its live usefulness.
2. **Per-category suppression.** Track usefulness per finding category. Suppress or retire a category automatically when its not-acted-on rate exceeds about one in ten. Suppressing non-actionable categories, together with rewritten summaries, is what moved AutoCommenter from about half useful to its deployment bar.
3. **Severity defaults.**
   - Abstraction and encapsulation findings should default to non-blocking labels: Nit, Optional or FYI.
   - Blocking should require a concrete, stated way the change definitely worsens code health: a named future modification that becomes error-prone, or a caller that can now violate an invariant. A smell name or principle name alone ("violates encapsulation", "feature envy") is not enough.
   - Unlabelled comments are read as mandatory, so every finding needs an explicit label.
4. **Which concerns merit a lane.**
   - The most robust measured weaknesses of LLM and agent code are complexity and local redundancy: cognitive complexity, duplicated literals, unused parameters. Linters already detect much of this.
   - A complexity and over-engineering check is therefore better supported than a smell-catalogue lane.
   - Any abstraction or encapsulation lane needs an explicit over-engineering counterweight, because the review guide asks reviewers to be especially vigilant about over-engineering.
   - Developers do not perceive several encapsulation-related smells as problems, while one cohort study finds some of them cause change-proneness. That combination argues for recording these findings without blocking, and for measuring outcomes.
5. **Context and placement.**
   - LLM design findings degrade without context. Give scouts the design document or interface contract, and limit scouts that lack context to defects visible in the diff (organization defects).
   - Debates over solution approach belong at design time (super-design, contract-first beads), not in review. Teams report friction over doing design review inside code review, and long review discussions are associated with more degradation.
   - Context injection is not free. Repository context files raised agent inference cost without improving task success. Scout context should be targeted, and its value measured.
6. **Error handling.** Human reviewers rarely comment on exception handling, and LLM-generated code shows resource and exception-management issues. That weakly suggests an error-handling lane could catch things humans miss. Its precision is unmeasured, so it should start non-blocking, with acted-on tracking.
7. **Coverage honesty.** Agent reviewers misreport how much they actually reviewed. A scout lane should list exactly which files and hunks it inspected, and the coordinator should check that list rather than trust a summary.
8. **Throughput.**
   - No evidence shows that adding review lanes, or adopting agentic workflows generally, makes delivery net faster.
   - LLM review has been associated with both longer and shorter pull-request times, in non-randomized studies. AI tooling slowed experienced developers in the 2025 trial, and the 2026 follow-up's apparent speedup is described by its authors as unreliable.
   - Any speed claim should be measured: for example, wall-clock time to merge-ready and post-merge rework, for sessions with and without the lane, interleaved or randomized by task.

## Methodological Limits and Open Gaps

**Study-level limits (anchored).**

*Review-composition studies — Mäntylä & Lassenius; Beller et al.*
The inspection study could not follow individual evolvability defects longitudinally, so some of them may later turn out to be false positives in an amount that cannot be estimated [193]. <!-- claim: 323a6b3f20d4240e; evidence: ce9e07b00e8f99dd; source: 8cbb4eb0009ab279 -->
The OSS review study analyzed only two systems, which does not allow conclusions about OSS in general [194]. <!-- claim: 46af1dc3daafd0a4; evidence: 7f5eac94dd691bfb; source: f1c14f7e31d85c1b -->

*Perception and tolerance surveys — Palomba et al. 2014; Christakis & Bird 2016.*
The perception results rest on 10 original developers and 24 outsiders [209]. <!-- claim: 24e97da743c243a5; evidence: 2805534499e156a5; source: d02990c71a986d74 -->
The false positive tolerance figures are self-reports from 375 survey responses at a 19% response rate [222]. <!-- claim: d604455d1f1438de; evidence: c90d1903fb17af97; source: 81f9204e2d79343a -->

*LLM reviewer and LLM-code studies — Cihan et al.; Cynthia et al.; Santa Molison et al.*
The automated-review case study cautions that developers might disregard the labeling policy and use Resolved instead of Closed or Won’t Fix [200]. <!-- claim: 65cea387115863a8; evidence: 572d8984e45ca374; source: 46724e0f7862ebb9 -->
The agent bug-fix study lacks a matched human baseline and covers only static post-merge quality signals, excluding downstream runtime and maintenance effects [215]. <!-- claim: fd4747714e94e056; evidence: 948747011bb8e314; source: 981b9d4659fb8344 -->
The human baseline in the APPS comparison consists of solutions mined from websites for training purposes, which were not intended for professional use and may leave quality metrics a low priority [217]. <!-- claim: cdc8a43d0d71aa89; evidence: a39cf92c9f18a5fa; source: 9700ef9945c3add8 -->

*Smell-outcome studies and metric validity — Sjøberg et al., IEEE TSE 2013 (peer-reviewed), and El Emam, Benlarbi & Goel, 1999 (NRC technical report, precursor of a 2001 IEEE TSE paper); cross-facet F5/F10.*
The maintenance-effort study observed the first major changes after the systems became operational, so the software had not had a chance to decay [67]. <!-- claim: 59eb61a9b88481dd; evidence: 5e98efbccdd77294; source: 167f187364b4db61 -->
The effort study could not measure the effort of changing a single method for method-level smells, only the effort of changing the entire class or file [67]. <!-- claim: e63a88ae31170ffe; evidence: 62935b1ad0cbbf9e; source: 167f187364b4db61 -->
After controlling for class size, none of the object-oriented metrics studied was associated with fault-proneness anymore, although before controlling for size they were [62]. <!-- claim: b95c167c4b79faf3; evidence: 9d9f3bb7722e7716; source: 370ae4ea452c7b80 -->

*LLM oversight and context — ImpossibleBench (Zhong, Raghunathan & Carlini, ICLR 2026, peer-reviewed; cross-facet F10) and an evaluation of AGENTS.md context files (arXiv preprint; cross-facet F11).*
LLM-based monitors detected 86-89% of cheating attempts on the simpler benchmark but struggled more with the more complex SWE-bench variant, at a 42-65% detection rate [85]. <!-- claim: 81c8681d482865b7; evidence: 15a6286f535f73a3; source: e9845cb1d2e12b99 -->
Surprisingly, providing context files did not generally improve coding-agent task success rates while increasing inference cost by over 20% on average [232]. <!-- claim: 2c47973654a509ef; evidence: c32fd9178b456cb8; source: 3a3cb6b676d84987 -->

**Worker notes (not anchored claims).**
- *Recall versus precision in the smell-tool comparison.* The Fernandes et al. abstract describes its ~14% Large Class figure as precision, but its Table 9 places 14% in the recall columns. This dossier follows the table. The abstract passage is offered for registration in the return message.
- *Inference: completion time is not a pure measure.* Completion-time comparisons mix speed with differences in output. Some developers in METR's follow-up reported different code quality, documentation or tests between conditions.
- *Measurement proxies.* Nearly all maintainability outcomes for LLM and agent code here are static-analysis proxies over short horizons: SonarQube warnings, cognitive complexity, duplicated lines, regex-detected smells. No study here measured later change effort on agent-written code.

**Stable versus version-specific.**
- *Stable* (replicated across contexts, independent of any model):
  - review-composition findings (2009–2015);
  - action-based precision policy and developer false-positive tolerance (2013–2018);
  - developer perception of smells (2013–2014).
- *Version-specific, expected to drift:*
  - **LLM reviewer usefulness** (model and context details from passages offered for registration, not cited here):
    - AutoCommenter used a 2022 model with a 2048-token context.
    - The Cihan et al. tool is based on the open-source Qodo PR Agent.
    - RovoDev results are limited to Claude Sonnet 3.5 at Atlassian.
  - **LLM code quality** (also from offered passages): ChatGPT on GPT-3.5 for the LeetCode study; GPT-4 for the APPS comparison.
  - **Agent pull-request studies:** AIDev pull requests from December 2024 to July 2025 (offered passage).
  - **METR:** early-2025 tools versus a follow-up experiment started in August 2025 (offered passage).
  - **Google guidance:** living documents, read on 2026-10-07.

**Open gaps.**
- No live precision data for LLM findings specifically about abstraction, encapsulation or error-handling design quality. Deployment numbers cover best practices (AutoCommenter) or all comment types (RovoDev, Cihan et al.).
- No empirical test of severity labels: whether labelling changes author behavior, review latency or design outcomes.
- No evidence on an error-handling-specific review lane.
- Evidence on agent-code maintainability rests on static metrics over months. No studies measured later change effort.
- The speedup expected from contract-first beads and multi-lane review is unmeasured.

**Unretrieved leads (unverified; not cited).**
- Review and design-quality studies:
  - Paixão et al., "The impact of code review on architectural changes".
  - Paixão et al., "Are developers aware of the architectural impact of their changes?".
  - Zanaty et al., "An empirical study of design discussions in code review" (ESEM 2018).
  - Uchôa et al., "Predicting design impactful changes in modern code review".
  - Bavota & Russo, "On the impact of code reviews on software quality" (ICSME 2015).
- Review bots and LLM-assisted review:
  - Wessel et al., "Don't Disturb Me" (CSCW 2021; bot noise).
  - The full Frömmgen et al. ICSE-SEIP 2024 paper.
  - "Rethinking Code Review Workflows with LLM Assistance" (arXiv 2505.16339).
- Smell detection and prioritization:
  - Arcelli Fontana et al. 2016, ML smell detection (Empirical Software Engineering; seen only through the Di Nucci et al. replication).
  - Pecorelli et al. 2020, developer-driven smell prioritization.
- Agent pull requests:
  - Watanabe et al. 2025 (Claude Code pull requests).
  - The AIDev dataset paper (arXiv 2507.15003).
- Industry reports:
  - The DORA 2024 report.
  - GitClear's 2026 follow-up report.

## Bibliography

[9] [Architecture Anti-patterns: Automatically Detectable Violations of Design Principles](https://www.computer.org/csdl/journal/ts/2021/05/08691586/19utN8Vpl8Q)
[38] [Causal or Correlational? A Cohort Study on the Effects of Code Smells on Class Change- and Fault-Proneness](https://doi.org/10.1145/3744916.3787786)
[62] [The Confounding Effect of Class Size on the Validity of Object-oriented Metrics](https://ehealthinformation.ca/web/default/files/wp-files/1062.pdf)
[67] [Quantifying the Effect of Code Smells on Maintenance Effort](https://doi.org/10.1109/TSE.2012.89)
[69] [On the Diffuseness and the Impact on Maintainability of Code Smells: A Large Scale Empirical Investigation](https://doi.org/10.1007/s10664-017-9535-z)
[84] [Beyond Correctness: Benchmarking Multi-dimensional Code Generation for Large Language Models](https://arxiv.org/abs/2407.11470)
[85] [ImpossibleBench: Measuring LLMs' Propensity of Exploiting Test Cases](https://proceedings.iclr.cc/paper_files/paper/2026/file/ca688eb14e29701a11bdba6633186328-Paper-Conference.pdf)
[192] [Quantifying Overclaiming Propensity in Frontier LLM Agents](https://arxiv.org/abs/2609.20812)
[193] [What Types of Defects Are Really Discovered in Code Reviews?](https://doi.org/10.1109/TSE.2008.71)
[194] [Modern Code Reviews in Open-Source Projects: Which Problems Do They Fix?](https://doi.org/10.1145/2597073.2597082)
[195] [The Standard of Code Review](https://google.github.io/eng-practices/review/reviewer/standard.html)
[196] [What to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html)
[197] [How Does Modern Code Review Impact Software Design Degradation? An In-depth Empirical Study](https://anderson-uchoa.github.io/publications/UchoaCWPRAC20.pdf)
[198] [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://arxiv.org/abs/2507.09089)
[199] [AI-Assisted Assessment of Coding Practices in Modern Code Review](https://doi.org/10.1145/3664646.3665664)
[200] [Automated Code Review In Practice](https://doi.org/10.1109/ICSE-SEIP66354.2025.00043)
[201] [Lessons from Building Static Analysis Tools at Google](https://cacm.acm.org/research/lessons-from-building-static-analysis-tools-at-google/)
[202] [Does AI-Assisted Coding Deliver? A Difference-in-Differences Study of Cursor’s Impact on Software Projects](https://arxiv.org/abs/2511.04427)
[203] [Expectations, Outcomes, and Challenges of Modern Code Review](https://doi.org/10.1109/ICSE.2013.6606617)
[204] [Code Reviews Do Not Find Bugs. How the Current Code Review Best Practice Slows Us Down](https://www.microsoft.com/en-us/research/publication/code-reviews-do-not-find-bugs-how-the-current-code-review-best-practice-slows-us-down/)
[205] [Modern Code Review: A Case Study at Google](https://doi.org/10.1145/3183519.3183525)
[206] [Why Don’t Software Developers Use Static Analysis Tools to Find Bugs?](https://ieeexplore.ieee.org/document/6606613)
[207] [Characteristics of Useful Code Reviews: An Empirical Study at Microsoft](https://ieeexplore.ieee.org/document/7180075/)
[208] [Do Code Review Practices Impact Design Quality? A Case Study of the Qt, VTK, and ITK Projects](https://ieeexplore.ieee.org/document/7081827/)
[209] [Do they Really Smell Bad? A Study on Developers’ Perception of Bad Code Smells](https://doi.org/10.1109/ICSME.2014.32)
[210] [Do Developers Care about Code Smells? An Exploratory Survey](https://dblp.org/rec/conf/wcre/YamashitaM13)
[211] [Detecting Code Smells using Machine Learning Techniques: Are We There Yet?](https://ieeexplore.ieee.org/document/8330266/)
[212] [A Review-based Comparative Study of Bad Smell Detection Tools](https://homepages.dcc.ufmg.br/~figueiredo/publications/ease16submitted.pdf)
[213] [Refining ChatGPT-Generated Code: Characterizing and Mitigating Code Quality Issues](https://arxiv.org/abs/2307.12596)
[214] [Quality Assessment of ChatGPT Generated Code and their Use by Developers](https://doi.org/10.1145/3643991.3645071)
[215] [Beyond Bug Fixes: An Empirical Investigation of Post-Merge Code Quality Issues in Agent-Generated Pull Requests](https://doi.org/10.1145/3793302.3793615)
[216] [Not All Agents Are Equal: Code Quality and Post-Merge Maintenance Across Five Autonomous Coding Agents in the Wild](https://arxiv.org/abs/2609.17598)
[217] [Is LLM-Generated Code More Maintainable & Reliable than Human-Written Code?](https://arxiv.org/abs/2508.00700)
[218] [How to write code review comments](https://google.github.io/eng-practices/review/reviewer/comments.html)
[219] [We are Changing our Developer Productivity Experiment Design](https://metr.org/blog/2026-02-24-uplift-update/)
[220] [AI Copilot Code Quality: Evaluating 2024's Increased Defect Rate (GitClear AI Code Quality Research v2025.2.5)](https://gitclear-public.s3.us-west-2.amazonaws.com/GitClear-AI-Copilot-Code-Quality-2025.pdf)
[221] [Resolving code review comments with ML](https://research.google/blog/resolving-code-review-comments-with-ml/)
[222] [What Developers Want and Need from Program Analysis: An Empirical Study](https://doi.org/10.1145/2970276.2970347)
[223] [Antipattern and Code Smell False Positives: Preliminary Conceptualization and Classification](https://doi.org/10.1109/SANER.2016.84)
[224] [Beyond Strict Rules: Assessing the Effectiveness of Large Language Models for Code Smell Detection](https://arxiv.org/abs/2601.09873)
[225] [RovoDev Code Reviewer: A Large-Scale Online Evaluation of LLM-based Code Review Automation at Atlassian](https://doi.org/10.1145/3786583.3786851)
[231] [An Empirical Study on the Code Refactoring Capability of Large Language Models](https://arxiv.org/abs/2411.02320)
[232] [Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?](https://arxiv.org/abs/2602.11988)
