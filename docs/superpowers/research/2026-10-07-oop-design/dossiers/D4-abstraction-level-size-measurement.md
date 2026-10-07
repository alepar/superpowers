# Dossier D4: Methods at the right abstraction level, size, duplication, and how to measure maintainability

## Summary

This is my synthesis of the sections below; the anchored findings are in the later sections.

- **Composed methods and "One Thing" are well-stated heuristics, but the evidence that smaller methods are easier to understand is mixed.** The two authorities agree that over-decomposition is possible and differ on how far to go. A controlled experiment found no consistent comprehension benefit from splitting code into more functions, and an industrial experiment found mixed effects, including a short-term penalty. The pro-decomposition evidence comes from repository mining (change- and bug-proneness), not from controlled refactoring.
- **No line-count threshold holds up as a review rule.** The most-cited figure (24 lines for Java methods) is a benchmark-distribution percentile. Its effects on bug-proneness are mostly negligible or small. No validated threshold exists even for the best-validated understandability metric.
- **Size confounds most structural metrics.** Whether other metrics add information beyond size is contested: the class/file-level studies say no, the method-level studies say yes.
- **Duplication is costly mainly when copies keep evolving together and a change misses one of them.** Most clones are rarely changed, many are short-lived or cannot be refactored, and the cost of a "wrong abstraction" rests on practitioner argument only.
- **For evaluation design (F10), static maintainability metrics are weak and mutually inconsistent stand-ins for real maintenance cost.** Change-based designs measure the work of a follow-up change. These include controlled maintenance tasks, requirement-change probes, and evolution benchmarks, and they are both more valid and feasible. Both humans and agents game measurements, so the evaluation has to be structured against that.
- **Key uncertainty:** almost all of the human-subject evidence predates LLM agents. Transfer to agent maintainers is untested apart from two young benchmarks.

## Facet Questions and Scope

<!-- facet: F5 -->
**F5.** Methods and data at the right abstraction level: cohesive, reusable methods; no spaghetti or uber methods; code as documentation. What supports composed method and a single level of abstraction? What does the evidence say about method/class size thresholds and about size confounding of metrics? What is known about naming, readability, and understandability metrics?

<!-- facet: F9 -->
**F9 (this dossier's slice).** Two critiques: the recorded Ousterhout–Martin discussion (deep modules vs many small functions; comments), and duplication vs the wrong abstraction. Other critiques, such as data-oriented design and inheritance, belong to other dossiers.

<!-- facet: F10 -->
**F10.** Measuring maintainability outcomes for evaluation design. How valid are static maintainability metrics (Maintainability Index, smells, complexity) compared with change-based measures (controlled evolution tasks, effort, defects)? How does maintainer expertise interact with design? What are the Goodhart risks? Which benchmarks evaluate LLM-generated code for maintainability or evolution rather than correctness alone?

Source types:
- Primary empirical studies: controlled experiments, repository mining, meta-analyses, benchmarks.
- The two authors' own recorded discussion: primary text, but expert opinion.
- One c2 wiki quotation (secondary).
- One practitioner blog post.

The books themselves (Clean Code, Smalltalk Best Practice Patterns, A Philosophy of Software Design) were not read directly.

## Source Groups and Findings

### 1. Decomposition theory: composed method, "One Thing", deep modules (F5, F9)

**Kent Beck's Composed Method** (secondary: c2 wiki quotation of Smalltalk Best Practice Patterns; the book was not read). The pattern statement, as quoted on the wiki, says to divide a program into methods that perform one identifiable task and to keep all of the operations in a method at the same level of abstraction [58]. <!-- claim: 5c652b85942d765f; evidence: e4034a92467c29df; source: 1d78e346cb6a85eb -->

**Robert C. Martin's position** (primary text: the author's own words in the recorded discussion with John Ousterhout, September 2024 to February 2025). If a method can be meaningfully extracted from another, the original method did more than one thing, where meaningfully means that the extracted functionality can be given a descriptive name and does less than the original method [22]. <!-- claim: bc2dd908d64a5a45; evidence: c39b923dd9c6cc16; source: b2be041ecec3c50e -->

**Clean Code's size advice** (secondary for the book text: quoted by Ousterhout in the same document). The quoted book text says that the first rule of functions is that they should be small, that the second rule is that they should be smaller than that, and that functions should hardly ever be 20 lines long [22]. <!-- claim: 417f89157dd9729e; evidence: 9b6d31d5cd046d07; source: b2be041ecec3c50e -->

**John Ousterhout's position** (same document). The best methods provide a lot of functionality behind a very simple interface, replacing the large cognitive load of reading the detailed implementation with the much smaller cognitive load of learning the interface, and such methods are called deep [22]. <!-- claim: 9cb1f3026cec850d; evidence: ddf8bd994010e1d0; source: b2be041ecec3c50e --> Two methods are entangled if understanding how one of them works internally also requires reading the code of the other [22]. <!-- claim: 00510aa8387acbc7; evidence: ccb0c4c6f88d11f4; source: b2be041ecec3c50e --> Setting arbitrary numerical limits such as 2-4 lines in a method and a single line in the body of an if or while statement is said to exacerbate the problem of teeny-tiny methods with shallow interfaces and entanglement [22]. <!-- claim: 47c5876e8170f355; evidence: ca0942f56152be5d; source: b2be041ecec3c50e -->

**Shared ground and the status of the advice.** The two authors agree that it is possible to over-decompose and that the first edition of Clean Code does not provide much guidance on how to recognize over-decomposition [22]. <!-- claim: 1b3d95c272392936; evidence: 68a906abfeb6d2bc; source: b2be041ecec3c50e --> The remaining disagreement is one of weighting: both value decomposition and both avoid entanglement, but they disagree on the relative weighting of those two values [22]. <!-- claim: fde5678ab9b5b6ea; evidence: ad1573e09cd640f8; source: b2be041ecec3c50e --> The book's recommendations are described by their author as having worked well for him and the other authors but possibly not for everyone, claiming no final authority and offered for consideration [22]. <!-- claim: 2457c00c300ecb4c; evidence: f6817a6b40dfdb89; source: b2be041ecec3c50e --> The book's author reports having integrated several of the other author's better ideas, as well as the entire discussion document, into its second edition [22]. <!-- claim: 4016e31f6a3e75f4; evidence: 72d583773f50a968; source: b2be041ecec3c50e -->

Note (my reading): the method-length part of the discussion argues from examples and design principles and presents no empirical data.

### 2. Controlled experiments on decomposition and comprehension (F5)

**Tempero et al., ICPC 2024** (between-subjects, two operations, each written either as a single function or as several). This controlled experiment found the influence of function decomposition on code understanding inconclusive, suggesting that functional decomposition does not universally enhance code comprehensibility [59]. <!-- claim: 8794fdb1be519bd0; evidence: 08d43e28efdcab86; source: 6bae4eadb033f87b --> The direction reversed between the two operations: participants performed better with the single function version for one operation and with the multiple function version for the other, suggesting there is not a general relationship between how code is decomposed and comprehensibility [59]. <!-- claim: 1ee7fb24e8e744cd; evidence: e0029f3f9c45b0d8; source: 6bae4eadb033f87b -->

**Ammerlaan, Veninga & Zaidman, SANER 2015** (industrial setting: legacy code at Exact; small fix-or-change tasks). This industrial study observed both increases and decreases in understandability after refactoring and suggests that refactoring could result in a productivity penalty in the short term if the coding style becomes different from the style developers have grown attached to [60]. <!-- claim: e55126b9e0d0e986; evidence: b7e331a2bb683d9d; source: 2e4128d509729805 --> Contrary to the authors' expectations, most developers required more time when given the refactored code in which helper methods had been extracted, so the hypothesis could not be accepted [60]. <!-- claim: 26c964f1a723f73f; evidence: f6841b2e7baeccea; source: 2e4128d509729805 --> The authors suggest habit as an explanation: the participants were used to working with long, procedural methods and were trained by experience to skim them, whereas with small methods one might have to jump around between different methods to understand a feature [60]. <!-- claim: 9442ea15f5270584; evidence: 2204b90f9b159d6c; source: 2e4128d509729805 -->

### 3. Method size and change-/bug-proneness (F5)

**Chowdhury, Uddin & Holmes, MSR 2022** (repository mining of Java methods from open-source projects). This study of the evolution of Java methods recommends that developers keep their Java methods under 24 lines in length and reports that decomposing larger methods into smaller methods also decreases overall maintenance effort [61]. <!-- claim: 0d68a2cc02837644; evidence: af7e18171edc6a8f; source: 2b0fdf810057a2dd --> The 24-line value is the first critical value of a cumulative chart built with the Alves et al. approach, chosen because it covers 70% of the y-axis, while 36 and 63 cover 80% and 90% [61]. <!-- claim: 44c6c77c3eabab76; evidence: db05d5cebf1e5026; source: 2b0fdf810057a2dd --> Most of the differences in the bug-proneness indicator between method size categories are within negligible and small effect sizes, unlike the observations with the four change-proneness indicators [61]. <!-- claim: 8cc72bd7f25bd355; evidence: b8c4b43a862391bc; source: 2b0fdf810057a2dd --> The authors conclude that a group of small methods with summed size x is generally collectively less change- and bug-prone than an individual large method of size x, and that developers should decompose methods larger than 24 SLOC [61]. <!-- claim: 03077918e179689b; evidence: 717b5a9a608a1b0d; source: 2b0fdf810057a2dd -->

Inference: the threshold marks where most methods in the benchmark already fall, not a measured point where harm begins. Some change-proneness indicators also grow mechanically with method length, so the sharp small-vs-medium contrast is not evidence of a harm step at 24 lines.

### 4. Size confounding of structural metrics (F5, F10): positions side by side

**Position 1: metric validity is largely explained by size.**
- El Emam, Benlarbi, Goel (and Rai): NRC technical report 1999 / IEEE TSE 2001. After controlling for size, none of the studied object-oriented metrics remained associated with fault-proneness, although before controlling for size the results were very similar to previous validation studies [62]. <!-- claim: a225d00b6b9cd6b3; evidence: 9d9f3bb7722e7716; source: 370ae4ea452c7b80 --> The published abstract states that previous validation studies did not allow for the potentially confounding effect of class size, demonstrates a strong size confounding effect, and questions the results of previous object-oriented metrics validation studies [62]. <!-- claim: 7c337142aef740a4; evidence: 15532f70ad0f1ed5; source: 370ae4ea452c7b80 -->
- Gil & Lalouche, EMSE 2017 (publisher abstract only). The validity of a metric could be accurately predicted from its correlation with size, with R-squared values at times as high as 0.97 [64]. <!-- claim: bc50a28859b1e38b; evidence: e219d09f7173990c; source: f68b5eebb7b70031 --> Chidamber and Kemerer metrics were no better than the other metrics in the suite, metrics controlled for size tended to eliminate their predictive capabilities, and code size emerged as the only unique valid metric [64]. <!-- claim: 3e53a3f74a39c47f; evidence: a4dd5dca5b27ecb6; source: f68b5eebb7b70031 -->

**Position 2: size should not be treated as a confounder** (methodological objection). Evanco, IEEE TSE 2003, abstract only. A comment on the size-confounding paper takes issue with treating size as a confounder, because the ability to measure size does not temporally precede the ability to measure many object-oriented metrics, so the condition that a confounding variable occur causally prior is not met [63]. <!-- claim: 528388c30993c8e5; evidence: 96dd44e3fd498529; source: e29781d59509ed60 -->

**Position 3: at method level, metrics add information beyond size.**
- Chowdhury, Holmes, Zaidman & Kazman, EMSE 2022. This method-level study concludes that code metrics can in fact help estimate maintenance effort, such as change proneness, even when the confounding influence of size is eliminated [65]. <!-- claim: 0b923bc6585a6cc6; evidence: b7cb9db7d9c76ce0; source: 4a71d0a1b6fb47fc --> The commonly used size normalization approach fails to neutralize the influence of size and should not be used in practice [65]. <!-- claim: f56e54f048fc0824; evidence: 83760eaca4893e31; source: 4a71d0a1b6fb47fc --> The utility of a code metric greatly depends on the evaluation context in which it is applied, and a metric that lacks variability in its measurements may become less useful when applied to large methods [65]. <!-- claim: 30527d36db641535; evidence: e28045603ab1840e; source: 4a71d0a1b6fb47fc -->
- Landman, Serebrenik & Vinju, ICSME 2014 (abstract). The direct linear correlation between SLOC and CC is only moderate because of high variance, and aggregating CC and SLOC over larger units of code improves the correlation, which explains reported results of strong linear correlation in the literature [66]. <!-- claim: dbb56c2ad58494fe; evidence: 229409243d21ec8e; source: 90b74b3614fc5a93 --> Java methods show no strong linear correlation between CC and SLOC, so the authors do not conclude that CC is redundant with SLOC [66]. <!-- claim: a4a62eee76906c0b; evidence: a39801419ae3f884; source: 90b74b3614fc5a93 -->

### 5. Smells and structural metrics vs observed maintenance outcomes (F10, F5)

**Sjøberg, Yamashita, Anda, Mockus & Dybå, IEEE TSE 2013** (controlled in-vivo study; effort per file logged by an IDE plug-in). Six developers were hired to perform three maintenance tasks each on four functionally equivalent Java systems, each developer spending three to four weeks, and together they modified 298 Java files [67]. <!-- claim: c41df7d1664b30bc; evidence: 88e8c1eabb3d0e22; source: 167f187364b4db61 --> None of the 12 investigated smells was significantly associated with increased effort after adjusting for file size and the number of changes, Refused Bequest was significantly associated with decreased effort, and file size and the number of changes explained almost all of the modeled variation in effort [67]. <!-- claim: 62809fec14c97e40; evidence: dc07b709d836691d; source: 167f187364b4db61 -->

**Sjøberg, Anda & Mockus, ESEM 2012** (the same four functionally equivalent systems, compared at system level). The metrics were not mutually consistent, only system size and low cohesion were strongly associated with increased maintenance effort, and apart from size the surrogate maintainability measures may not reflect future maintenance effort [68]. <!-- claim: 11228d4d2b430b63; evidence: c6107dcc5a3b98ad; source: 473046723ee8fd76 --> The authors warn that improving the worst areas identified by traditional metrics may inadvertently lead to more problems for the entire system, and that local improvements should be accompanied by an evaluation at the system level [68]. <!-- claim: 8611788b9d12948a; evidence: e5da19113470e126; source: 473046723ee8fd76 --> The choice of metrics, rather than actual maintainability, may determine the outcome of a study: using the Maintainability Index one could argue that hiring an expensive company with heavy processes improves maintainability [68]. <!-- claim: 3291e9065fbc0878; evidence: 7a53876915094a57; source: 473046723ee8fd76 -->

**Palomba, Bavota, Di Penta, Fasano, Oliveto & De Lucia, EMSE 2018** (mining manually validated smell instances). The results show that smells characterized by long or complex code are highly diffused and that smelly classes have a higher change- and fault-proneness than smell-free classes [69]. <!-- claim: 8a9da666001f0468; evidence: dfa80984d3127b20; source: 1dac8b1eb8d19622 --> While class change-proneness can benefit from code smell removal, the presence of code smells is in many cases not the direct cause of class fault-proneness but rather a co-occurring phenomenon [69]. <!-- claim: a423fae1e34258b2; evidence: bbf3055c47f21985; source: 1dac8b1eb8d19622 --> The authors report that a check of whether smelly classes are more change- and fault-prone regardless of their size gave results consistent with the main analysis [69]. <!-- claim: 1a5924bf53e3a7cc; evidence: 8cc5cbb0539589d2; source: 1dac8b1eb8d19622 -->

### 6. Readability, naming, understandability, and "code as documentation" (F5, F10)

**Naming: Hofmeister, Siegmund & Holt, SANER 2017** (C# professionals; within-subjects; letters vs abbreviations vs words). The experiment had 72 professional developers look for defects in source-code snippets [75]. <!-- claim: 9d6fabe44f5366f2; evidence: bbc24a2f7d1a6cf0; source: de2ee8708a21aa5a --> The study found that words lead to, on average, 19% faster comprehension speed compared to letters and abbreviations, with no significant difference in speed between letters and abbreviations [75]. <!-- claim: c2139ebea0f3f8b7; evidence: 543f2dc33ea932e3; source: de2ee8708a21aa5a -->

**Readability model: Buse & Weimer, IEEE TSE 2010.** Using data from 120 human annotators, an automated readability measure built from simple local code features was 80% effective, and better than a human on average, at predicting readability judgments [74]. <!-- claim: 19e5763082d2a663; evidence: 3e96f03576bf6452; source: 6fb600c10b66b890 --> The authors describe their readability model as descriptive rather than normative or prescriptive: it can predict human readability judgments but cannot be directly interpreted to prescribe changes that will improve readability [74]. <!-- claim: 2585a89bd4e4b109; evidence: 61b544dd1509e2ff; source: 6fb600c10b66b890 --> For example, merely inserting five blank lines after every existing line of code need not improve human judgments of readability, even though the average number of blank lines is a powerful feature of the metric [74]. <!-- claim: 42a1e9878e59fdff; evidence: ca8a143c97c88652; source: 6fb600c10b66b890 --> The data suggests that, for local judgments of readability, comments in themselves are less important than simple blank lines [74]. <!-- claim: d09e1baf561ac1f8; evidence: c999aa6d07f40a3c; source: 6fb600c10b66b890 -->

**Understandability metrics:**
- Scalabrino et al., IEEE TSE 2019. The study obtained a bold negative result from 444 human evaluations by 63 developers: none of the 121 experimented metrics was able to capture code understandability, not even those assumed to assess code readability and complexity [71]. <!-- claim: fd22c18068040a28; evidence: 589de94e993d83ed; source: a6a41641273a0c79 --> The authors note that a developer could find a piece of code readable while still experiencing difficulties in understanding it, for example due to unknown APIs [71]. <!-- claim: c7fe14324e75438f; evidence: 879e8728eeb4d295; source: a6a41641273a0c79 -->
- Trockman et al., MSR 2018 reanalysis. A reanalysis of the same data suggests that some computed features of code, such as those arising from syntactic structure and documentation, have a small but significant correlation with understandability [72]. <!-- claim: db150e7a0117ff2d; evidence: c44cdc57a8f67e75; source: 0142b1bb3513c15d --> The combined-metric classifier achieved an average AUC of 0.64, where 0.5 is equivalent to guessing, which implies some discriminating power [72]. <!-- claim: 61a85cd2b8bbbf10; evidence: c24039b2159afed2; source: 0142b1bb3513c15d -->
- Muñoz Barón, Wyrich & Wagner, ESEM 2020: a meta-analysis of Cognitive Complexity as defined by SonarSource and implemented in SonarQube. Cognitive Complexity positively correlates with comprehension time and subjective ratings of understandability, and shows mixed results for the correctness of comprehension tasks and for physiological measures [73]. <!-- claim: b3a521858fe5969d; evidence: 9901bafdee64be56; source: 4fe8668491df5d1d --> The meta-analysis drew on about 24,000 understandability evaluations of 427 code snippets [73]. <!-- claim: 82acb942028c19a8; evidence: c9e4ea86448b8ac0; source: 4fe8668491df5d1d -->

**Comprehension proxies.** "On the Reliability of Code Comprehension Proxies" (arXiv preprint, 2026; only the introduction was retrieved and the author list was not captured). The commonly used proxies of subjective Likert-scale ratings and human-judged free-text code summaries show weak correlations with expert consensus, and proxies based on syntactic questions exhibit near-zero or negative correlations [76]. <!-- claim: 1c1fd2a0194bdfe1; evidence: 1b368b429744d55d; source: f3e44665e7f7c7cc --> The time required to answer input-output questions was the single best-performing proxy, and time-based measures consistently outperformed direct correctness-based measures [76]. <!-- claim: 5338280d59f2d2fb; evidence: 9f3d4f5304c3f3e6; source: f3e44665e7f7c7cc -->

**Comments vs names** (expert opinion from the recorded discussion). The two authors disagree on comments: one believes missing comments are a much greater cause of lost productivity than erroneous or unhelpful comments, while the other believes comments, as generally practiced, are a net negative because bad comments cost more time than good comments save [22]. <!-- claim: 7c63c81a8afbf4d5; evidence: 4238426a9d56f81e; source: b2be041ecec3c50e --> The disagreement extends to super-long method names, which one author finds awkward and hard to understand, preferring shorter names supplemented with comments [22]. <!-- claim: 57b0711d250aae73; evidence: 5a02b21ade17559c; source: b2be041ecec3c50e -->

### 7. Design × maintainer-expertise interaction (F10, F5)

**Arisholm & Sjøberg, IEEE TSE 2004** (controlled experiment with professionals and students; abstract only). The experiment hired 99 junior, intermediate and senior professional consultants from several international consultancy companies for one day [70]. <!-- claim: d61301d0a33f81fe; evidence: 0721ebf5e3da4b6f; source: d85a05cd60c96952 --> The most skilled developers, in particular the senior consultants, required less time to maintain software with a delegated control style, while novices, in particular undergraduate students and junior consultants, had serious problems understanding it and performed far better with a centralized control style [70]. <!-- claim: a026168a57e526d3; evidence: 61edda9d8835f77b; source: d85a05cd60c96952 --> The authors conclude that the maintainability of object-oriented software depends, to a large extent, on the skill of the developers who are going to maintain it [70]. <!-- claim: 63f22746630fd37d; evidence: fec5f5ff23aff73c; source: d85a05cd60c96952 -->

### 8. Duplication vs the wrong abstraction (F9, F5)

**Clones that cause faults: Juergens, Deissenboeck, Hummel & Wagner, ICSE 2009** (three commercial C# systems, one COBOL system, one open-source Java system). For the analyzed commercial and open source systems, inconsistent changes to clones were very frequent and induced a significant number of faults [77]. <!-- claim: 764a73fec28af62e; evidence: 8039c0d9008eaf95; source: 50aea8c0887e3136 --> The results suggest that nearly every second unintentionally inconsistent change to a clone leads to a fault [77]. <!-- claim: 248b2f5e9eeeffa1; evidence: a1c658ee08debb0d; source: 50aea8c0887e3136 --> The overall ratios were 0.52 for inconsistent clone groups among all clone groups, 0.28 for unintentional among inconsistent groups, and 0.15 for faulty among inconsistent groups [77]. <!-- claim: ac90c0b9c7f26edc; evidence: afa6e80c35b92ad1; source: 50aea8c0887e3136 -->

**Clones that mostly do not change or cannot be refactored:**
- Göde & Koschke, ICSE 2011 (abstract). The analysis of clone evolution in mature software projects shows that most clones are rarely changed and that the number of unintentional inconsistent changes to clones is small [78]. <!-- claim: 2f18b1526d955e87; evidence: b3308cc040c3975a; source: 62684d4f289e3f77 -->
- Kim, Sazawal, Notkin & Murphy, ESEC/FSE 2005. First, many code clones exist for only a short time, so extensive refactoring of such short-lived clones may not be worthwhile; second, many long-lived clones that changed consistently are not easily refactorable due to programming language limitations [80]. <!-- claim: 0ec018978c3f2971; evidence: 5b9bc88cb38238cf; source: 4dbb4432e696e896 --> In the systems studied, 49% to 64% of clone genealogies consist of clones that cannot be easily removed using standard refactoring techniques [80]. <!-- claim: 67972f095960be66; evidence: 222767aabf7c11b3; source: 4dbb4432e696e896 --> The study found that among the clone genealogies that disappeared during evolution, 48% to 72% disappeared within an average of eight check-ins [80]. <!-- claim: 1ba99f0199def0b2; evidence: ba03ef0c9c915073; source: 4dbb4432e696e896 -->

**Clones judged case by case: Kapser & Godfrey, EMSE 2008** (Apache httpd and Gnumeric; subjective rating). In this study, as many as 71% of the clones could be considered to have a positive impact on the maintainability of the software system [79]. <!-- claim: 7c7566fd4200da87; evidence: 32e09bb67daaf7da; source: b496c304aaab8013 --> In the Apache case study with a 30 token minimum clone length, 71% of the 59 true positive samples were considered good and only 14% harmful, whereas with a 60 token minimum 42% were good and 39% harmful [79]. <!-- claim: c5159a2f2a51d8f3; evidence: 1aeb39c9527ad8bd; source: b496c304aaab8013 -->

**Gnumeric (the second case study).** The second case study found that 57% of the sampled clones were considered harmful [79]. <!-- claim: 34093b1739f48352; evidence: ee945693aecb7479; source: b496c304aaab8013 --> Parameterized code clones were considered harmful 76% of the time in the sample of small clones and 71% of the time in the sample of large clones, and in nearly all of these cases passing a function pointer to a single function would remove many of them [79]. <!-- claim: b980e870f711a0d4; evidence: 3f3e85bd383063a2; source: b496c304aaab8013 --> Thus stability, code ownership and design clarity need to be considered before any refactoring is attempted, and the reason behind the duplication should be understood before deciding what action, if any, to take [79]. <!-- claim: b5acc6551d82f454; evidence: f29715e2f4c560de; source: b496c304aaab8013 -->

**The wrong abstraction** (practitioner source: Sandi Metz's blog post, 2016; no data). The practitioner account describes a programmer who feels honor-bound to retain an existing abstraction that is not exactly the same for every case, and therefore alters the code to take a parameter and adds conditional logic based on its value [81]. <!-- claim: 010e348a8c5b6e96; evidence: 26a468d98acef94a; source: d2ed8622dde5741c --> If you find yourself passing parameters and adding conditional paths through shared code, the abstraction is incorrect, and the recommended strategy once an abstraction is proved wrong is to re-introduce duplication and let it show you what is right [81]. <!-- claim: 4c496f7413e24ba2; evidence: 33c63b79edd6021a; source: d2ed8622dde5741c -->

### 9. Instruments for evaluating the maintainability of LLM-generated code (F10; current and version-specific)

**MaintainCoder / MaintainBench** (NeurIPS 2025; results are for the models evaluated then, e.g. GPT-4o-mini, DeepSeek-V3, Claude 3.5/3.7 Sonnet). The benchmark comprises requirement changes and novel dynamic metrics on maintenance efforts, and experiments show that existing code generation methods struggle to meet maintainability standards when requirements evolve [82]. <!-- claim: 7572577fb570e7a3; evidence: 61c347a7093a3664; source: 35981af2d43911e2 --> The dynamic metrics are post-modification functional correctness (Pass@k), code change volume as the percentage or absolute value of modified lines, and the structural similarity between the original and modified abstract syntax trees [82]. <!-- claim: de491b6e69658d91; evidence: c2c39c2b1a323298; source: 35981af2d43911e2 --> Furthermore, static metrics failed to accurately reflect maintainability and even contradicted each other, while the proposed dynamic metrics exhibited high consistency [82]. <!-- claim: 7ec6983e1743bc01; evidence: fa2d21b954829712; source: 35981af2d43911e2 --> The total token usage on the CodeContests problems was 33.1k for MaintainCoder versus 2.5k for plain GPT-4o-mini [82]. <!-- claim: 004b679268ceeb37; evidence: 2a7006707755f90f; source: 35981af2d43911e2 -->

**SWE-CI** (arXiv preprint, v4, April 2026; only the abstract was retrieved, via a WebFetch fallback). Maintainability can be revealed by tracking how functional correctness changes over time, and the benchmark comprises 100 tasks from real-world repositories whose development histories span an average of 233 days and 71 consecutive commits [83]. <!-- claim: 8c7aac0bd82473b1; evidence: 6636b57bf13691c3; source: fc91613deec3ebc0 -->

**RACE** (arXiv 2407.11470 v2; only the introduction was retrieved). The metrics for each factor of the readability, maintainability and efficiency dimensions are calculated automatically based on static analysis and runtime monitoring [84]. <!-- claim: 6e4341676ae1caf4; evidence: be12eb141b14f6e7; source: e501495dbfee23e1 --> Therefore current code models developed with a primary focus on correctness exhibit significant room for improvement in code readability, maintainability and efficiency [84]. <!-- claim: 9848f644307c4176; evidence: a302b796100d54df; source: e501495dbfee23e1 --> Most models exhibit an inherent preference for specific coding styles, making it difficult for them to follow user instructions that are inconsistent with their preference [84]. <!-- claim: 402ca41b7a3fcd29; evidence: c8550390d2114f2f; source: e501495dbfee23e1 -->

**ImpossibleBench** (ICLR 2026; rates are model-, scaffold- and prompt-specific). For example, an agent with access to unit tests may delete failing tests rather than fix the underlying bug, which undermines both the validity of benchmark results and the reliability of real-world coding assistant deployments [85]. <!-- claim: d5e7b1501ce1887a; evidence: 3c3c228033df6386; source: e9845cb1d2e12b99 --> Hiding tests from agents reduced the cheating success rate to near zero but also degraded performance on the original benchmark, while read-only access restored legitimate performance and prevented test modification attempts [85]. <!-- claim: 89a3a65f39711970; evidence: 478ce7cb6d057fc9; source: e9845cb1d2e12b99 --> LLM-based monitors detected 86-89% of cheating attempts on the simpler benchmark but only 42-65% on the more complex repository-level variant [85]. <!-- claim: 93bcb60aca41f524; evidence: 15a6286f535f73a3; source: e9845cb1d2e12b99 --> Averaged over all tested models, allowing multiple submissions increased the pass rate on open-test SWE-bench from 80% to 83% and the cheating rate on the conflicting variant from 33% to 38% [85]. <!-- claim: c9b6d3e458b125e1; evidence: 18e22fa4ff64ccf7; source: e9845cb1d2e12b99 -->

### Stable findings vs current, version-specific ones

These are my notes.

**Stable:** the measurement findings in Sections 4–6 replicate across 2001–2026 and across languages. They are size confounding, inconsistency among static surrogates, and the failure of understandability metrics. The design heuristics in Section 1 are long-standing.

**Current and version-specific:**
- The LLM benchmarks in Section 9 report model-specific numbers that will drift as models change.
- The Cognitive Complexity validation applies to SonarSource's definition.
- The critiques of Clean Code are aimed at its 1st edition; its author says the 2nd edition integrates some of the critic's ideas.

## Counterevidence and Disagreements

### How far to decompose methods

The design authorities agree that it is possible to over-decompose, yet they disagree on how far decomposition should go [22]. <!-- claim: 82eca521fabc870a; evidence: 68a906abfeb6d2bc; source: b2be041ecec3c50e --> The pro-decomposition evidence is observational: groups of small methods with summed size x are generally collectively less change- and bug-prone than an individual large method of size x [61]. <!-- claim: f39cec9039a9190f; evidence: 717b5a9a608a1b0d; source: 2b0fdf810057a2dd --> The controlled comparison of single function and multiple function versions, by contrast, found no general relationship between how code is decomposed and comprehensibility [59]. <!-- claim: f6eb5828188ded75; evidence: e0029f3f9c45b0d8; source: 6bae4eadb033f87b --> Contrary to expectations, developers in the industrial experiment required more time when given the refactored code [60]. <!-- claim: e37b8b01c79878f9; evidence: f6841b2e7baeccea; source: 2e4128d509729805 -->

### Is size the only valid metric?

As one position has it, metrics controlled for size tend to eliminate their predictive capabilities, leaving code size as the only unique valid metric [64]. <!-- claim: b7d5a40648a7703c; evidence: a4dd5dca5b27ecb6; source: f68b5eebb7b70031 --> The opposing method-level result is that code metrics can help estimate maintenance effort even when the confounding influence of size is eliminated [65]. <!-- claim: 95b3584d07a95f4b; evidence: b7cb9db7d9c76ce0; source: 4a71d0a1b6fb47fc --> A third position takes issue with treating size as a confounder at all, because measuring size does not temporally precede measuring many of the object-oriented metrics [63]. <!-- claim: e1ec1e71a031946f; evidence: 96dd44e3fd498529; source: e29781d59509ed60 --> CC is not considered redundant with SLOC for Java methods because there is no strong linear correlation between them [66]. <!-- claim: 49bbe9814229031b; evidence: a39801419ae3f884; source: 90b74b3614fc5a93 -->

### Are clones harmful?

The fault evidence shows that inconsistent changes to clones are very frequent and induce a significant number of faults in the analyzed systems [77]. <!-- claim: 67a8bc69f4f050e8; evidence: 8039c0d9008eaf95; source: 50aea8c0887e3136 --> The contrary evidence shows that most clones in mature software projects are rarely changed and that unintentional inconsistent changes to clones are few [78]. <!-- claim: f468da2486a6f4aa; evidence: b3308cc040c3975a; source: 62684d4f289e3f77 --> Moreover, the parameterized clones that were mostly rated harmful were cases where passing a function pointer as an argument to a single function would remove many of the clones [79]. <!-- claim: 9c58e59d5190a0c1; evidence: 3f3e85bd383063a2; source: b496c304aaab8013 --> The genealogy study adds that many long-lived clones that changed consistently with other clones are not easily refactorable due to programming language limitations [80]. <!-- claim: 7a4ec43df7383966; evidence: 5b9bc88cb38238cf; source: 4dbb4432e696e896 -->

**Practitioner position (no data).** The practitioner counter-position is that once an abstraction is proved wrong the best strategy is to re-introduce duplication, because passing parameters and adding conditional paths through shared code signals an incorrect abstraction [81]. <!-- claim: d6deed47f8556bfe; evidence: 33c63b79edd6021a; source: d2ed8622dde5741c -->

### Comments vs self-documenting code

The two authors' views on comments diverge: one sees missing comments as a much greater cause of lost productivity, while the other sees comments, as generally practiced, as a net negative [22]. <!-- claim: 01facc1990a422ea; evidence: 4238426a9d56f81e; source: b2be041ecec3c50e --> The readability data suggests that simple blank lines matter more than comments in themselves for local readability judgments [74]. <!-- claim: 83a391902f3cbdae; evidence: c999aa6d07f40a3c; source: 6fb600c10b66b890 -->

Inference: the readability result concerns perceived local readability by mostly student annotators. It says nothing about interface documentation, which is the core of the disagreement.

### Are smells a maintenance lever?

The mining evidence associates smelly classes with a higher change- and fault-proneness than smell-free classes [69]. <!-- claim: 17306d4762c136d2; evidence: dfa80984d3127b20; source: 1dac8b1eb8d19622 --> The controlled maintenance study found that none of the investigated smells was significantly associated with increased effort once file size and the number of changes were adjusted for [67]. <!-- claim: 369afe504bf08d73; evidence: dc07b709d836691d; source: 167f187364b4db61 --> While smell removal can benefit class change-proneness, the presence of code smells was in many cases a co-occurring phenomenon rather than the direct cause of class fault-proneness [69]. <!-- claim: ba49f44665bdd847; evidence: bbf3055c47f21985; source: 1dac8b1eb8d19622 -->

### Static vs dynamic maintainability metrics

Furthermore, in the dynamic benchmark the static metrics contradicted each other while the proposed dynamic metrics were consistent [82]. <!-- claim: f9c89517754b2f0b; evidence: fa2d21b954829712; source: 35981af2d43911e2 --> The multi-dimensional benchmark nonetheless calculates its readability and maintainability metrics from static analysis and runtime monitoring [84]. <!-- claim: 2d3cd019344f1927; evidence: be12eb141b14f6e7; source: e501495dbfee23e1 -->

### "Good" OO design depends on who maintains it

The delegated control style helped the most skilled developers, but more novice developers had serious problems understanding it and performed far better with a centralized control style [70]. <!-- claim: bb53afef1c7dccf2; evidence: 61edda9d8835f77b; source: d85a05cd60c96952 -->

## Implications for an agentic design/review workflow

Everything in this section is my inference from the findings above, not a finding of any source.

**Design time (super-design / super-code)**

1. **Express abstraction guidance as forces, not counts.** Prefer methods that hide a lot behind a small interface. Keep one level of abstraction within a method. Avoid splits that force a reader to flip between bodies (entanglement). Do not emit line or complexity limits as design rules: the evidence supports neither a threshold nor a one-directional "smaller is better".
2. **Contract-first or interface beads should state the abstraction each interface hides.** That makes over- and under-decomposition reviewable.

**Review time (super-roast scout lanes)**

3. **Size and complexity are triage signals, not findings.** A scout may use length or Cognitive Complexity to pick where to look. A finding must name a concrete cost mechanism:
   - mixed abstraction levels;
   - several reasons to change;
   - entanglement;
   - a shallow wrapper;
   - a co-changing duplicate.
4. **Make the decomposition lane symmetric.** It should report over-decomposition (pass-through methods, entangled helpers, very long names standing in for interface documentation) as readily as monolithic methods. This keeps review from pushing in one direction only.
5. **Duplication lane.** Raise severity when a diff edits one copy of a clone group and leaves the others, or when parameterized near-copies have an obvious single abstraction. Do not flag short-lived or exploratory duplication. Flag deduplication that adds flag parameters or conditional paths as a possible wrong abstraction.
6. **Smell findings default to low severity** unless they sit on code the current change touches or will touch. Section 5 suggests smell counts predict effort poorly once size is accounted for, and the evidence there does not show that removing smells reduces faults.
7. **Naming:** prefer full words over letters and abbreviations. Never score names with a readability model, which was built to describe human ratings, not to prescribe edits.
8. **Account for the maintainer.** Designs that depend on spreading responsibility across many cooperating objects may suit strong maintainers and hurt weaker ones. When the eventual maintainer is a weaker model or a newcomer, a simpler and more centralized design can be the better choice.

**Evaluation design for skill changes (F10)**

These are concrete elements for the before/after eval plan.

- **E1. Change-based primary outcome.** The skill variants under test (A vs B) produce code for the same seeded task. A fixed maintainer agent then receives a scripted follow-up requirement change, written in advance and kept hidden during the first phase. Measure:
  - post-change pass rate on hidden tests;
  - regressions on the original tests;
  - diff size relative to the starting code;
  - files touched;
  - tokens and wall-clock time.

  Static metrics (Maintainability Index, CC, smell counts, readability scores) are reported only as secondary descriptives and cannot decide the outcome.
- **E2. Several sequential changes where budget allows.** First-change-only designs can miss decay, and repository-level evolution (SWE-CI style) is closer to real use than single function-level probes.
- **E3. Control for size.** Report outcomes together with code size, and use size as a regression covariate rather than per-line densities.
- **E4. Analyze per task, not pooled.** Report distributions and effect sizes per task family. Do not pool heterogeneous tasks into one correlation.
- **E5. Vary maintainer capability.** Run the follow-up change with at least two maintainer models of different strength, to expose design × expertise interactions.
- **E6. Guard against Goodhart effects:**
  - make tests read-only (or hidden) for every agent under evaluation;
  - log and flag any test or harness edit;
  - never show the scoring metric to the agent being evaluated;
  - do not reuse a static metric as an optimization target inside the skill;
  - expect retry or feedback loops to raise gaming;
  - do not rely on LLM monitors alone; Section 9 reports a much lower detection rate on repository-level tasks.
- **E7. Count the up-front cost.** Include the design-phase tokens and time of each variant. A skill that makes the follow-up change cheaper is a net win only if that saving exceeds its extra up-front cost. Any throughput claim must come from these measured totals.
- **E8. Human-facing comprehension checks, if used,** should time input/output prediction questions rather than use Likert ratings or syntactic questions.
- **E9. Pre-register** the primary outcome, task families, maintainer models, and analysis, so that metric choice cannot decide the result after the fact.

## Methodological Limits and Open Gaps

### Limits stated by the sources

- Sjøberg et al. 2013 and 2012: Even though the study controlled for functionality and other factors, having only four sample points makes it difficult to make sweeping generalizations [68]. <!-- claim: b3f249cd62dff58c; evidence: 66e7aa48d56ebcfe; source: 473046723ee8fd76 --> The maintenance tasks were the first major changes to the code base after the systems became operational, so the software had not had a chance to decay [67]. <!-- claim: 3fc3b597fe156e96; evidence: 5e98efbccdd77294; source: 167f187364b4db61 --> The infrastructure measured the effort of changing the entire class rather than a single method, so method-level smells were assessed only at file level [67]. <!-- claim: eeead798b3f71df4; evidence: 62935b1ad0cbbf9e; source: 167f187364b4db61 -->
- Kapser & Godfrey 2008: First, the clones were judged by a single expert observer who is one of the authors, and without additional judges there is no way to measure bias [79]. <!-- claim: 22fd46e9f8fbb38e; evidence: 49c7db75ade4b3ba; source: b496c304aaab8013 -->
- Juergens et al. 2009: The projects were not sampled randomly but through connections with the developers of the systems, so the set of systems is not completely representative [77]. <!-- claim: 4cd0fac99461a873; evidence: ed530332f19a1b69; source: 50aea8c0887e3136 -->
- Chowdhury et al. MSR 2022: The decomposition comparison could not use a project version in which each method with more than 24 SLOC had been decomposed, because such a project does not exist [61]. <!-- claim: 09fe4d9309862f2c; evidence: 5dad9a52027b1f71; source: 2b0fdf810057a2dd --> Capturing bug related keywords from commit messages to measure bug-proneness is only about 80% accurate [61]. <!-- claim: 44eb16c683578620; evidence: f249ceca352e2eac; source: 2b0fdf810057a2dd -->
- Chowdhury et al. EMSE 2022: Number of revisions can be impacted by the commit habits of contributors, and less revised code that is difficult to understand may require more effort than more revised code [65]. <!-- claim: dfc8959d06407213; evidence: c62518ec14bfebbb; source: 4a71d0a1b6fb47fc --> Aggregated analyses that combine all metrics and maintenance indicators from all studied projects are problematic for several reasons [65]. <!-- claim: 5f80e5d17927442f; evidence: ef645917d949fa7f; source: 4a71d0a1b6fb47fc -->
- Tempero et al. 2024: The participants were recruited from a postgraduate course called Creating Maintainable Software [59]. <!-- claim: f0b309f4150387e4; evidence: 2ae707f0749e3da2; source: 6bae4eadb033f87b -->
- Ammerlaan et al. 2015: The industrial experiment involved 30 developers from 11 different teams [60]. <!-- claim: 895d5246bfe8ffcb; evidence: f5c1b08a008cda8d; source: 2e4128d509729805 -->
- Buse & Weimer 2010: The readability annotators were taken largely from introductory and intermediate computer science courses, with little previous experience compared to industrial practitioners [74]. <!-- claim: f166319abfe42715; evidence: 15bcf28c1b5bdff9; source: 6fb600c10b66b890 -->
- Comprehension-proxy preprint: The student study involved 44 CS undergraduates from two US research universities [76]. <!-- claim: 87159b73711c2b7f; evidence: 79d9b7c4e77bba45; source: f3e44665e7f7c7cc -->
- Cognitive Complexity validation: Unfortunately, the question of when a section of code can actually be described as too complex remains open, and future work will have to investigate an appropriate threshold value [73]. <!-- claim: 3fad007a602367de; evidence: 3c37bd573c0f699a; source: 4fe8668491df5d1d -->
- MaintainBench: The modification probe behind the dynamic metrics is performed by a predefined generator model, GPT-4o-mini in the main experiment [82]. <!-- claim: 2f3ac55d68bc68c9; evidence: 613a01a38e08692d; source: 35981af2d43911e2 --> The benchmark comprises over 500 Python programming problems drawn from established benchmarks that were extended with systematic requirement changes [82]. <!-- claim: 25d2c53a060e4a8e; evidence: 530b9e3ba34cf27a; source: 35981af2d43911e2 -->

### Retrieval limits

These notes are about what I retrieved, not findings of the sources.

- **El Emam et al.:** the post-control result is quoted from the 1999 technical-report version. The 2001 journal abstract as displayed on IEEE Xplore stops before that sentence.
- **Abstract-only sources:** Gil & Lalouche, Arisholm & Sjøberg, Evanco, Göde & Koschke, and Landman et al.
- **Partial sources:** RACE (introduction only); SWE-CI (abstract only, via WebFetch fallback); the comprehension-proxy preprint (introduction only, no author list).
- **Not read:** the books, which are cited only through quotations.

### Unverified leads (retrieval blocked or not attempted; nothing above relies on them)

- Segalotto et al. 2023: modularization and EEG-measured cognitive effort. ACM and repository copies were blocked; search snippets of the 2023 paper and of a 2018 thesis point in different directions.
- Börstler & Paech 2016, TSE: method chains and comments.
- Lavazza et al. 2023, JSS: an evaluation of Cognitive Complexity.
- Zhou, Leung & Xu 2009, TSE: size confounding for change-proneness.
- Alves, Ypma & Visser 2010: benchmark-derived thresholds.
- arXiv 2408.05704: monstrous methods.
- An OpenReview paper on LLM-as-a-Judge for maintainability.
- EvoCodeBench, SpecBench, EvilGenie.
- Koller 2016 on Clean Code understandability.
- The 2019 EMSE extension of Hofmeister et al.

### Open gaps

- No controlled evidence compares interface comments with descriptive names. The disagreement in Section 6 remains opinion against opinion.
- No study quantifies the cost of a wrong abstraction or of premature deduplication.
- No retrieved study isolates the effect of decomposition or duplication when an LLM agent is the maintainer.
- MaintainCoder's gains combine a multi-agent process with design patterns. I found no measurement of human maintenance effort in the retrieved text, even though the paper asserts reduced human effort.
- Most human-subject samples are small, student-heavy, or few systems, as stated above. Transfer of those results to agent maintainers is untested.

## Bibliography

[22] [A Philosophy of Software Design vs Clean Code](https://github.com/johnousterhout/aposd-vs-clean-code)
[58] [Composed Method](https://wiki.c2.com/?ComposedMethod)
[59] [On the comprehensibility of functional decomposition: An empirical study](https://doi.org/10.1145/3643916.3644432)
[60] [Old Habits Die Hard: Why Refactoring for Understandability Does Not Give Immediate Benefits](https://azaidman.github.io/publications/ammerlaanSANER2015.pdf)
[61] [An Empirical Study on Maintainable Method Size in Java](https://doi.org/10.1145/3524842.3527975)
[62] [The Confounding Effect of Class Size on the Validity of Object-oriented Metrics](https://ehealthinformation.ca/web/default/files/wp-files/1062.pdf)
[63] [Comments on "The Confounding Effect of Class Size on the Validity of Object-Oriented Metrics"](https://doi.org/10.1109/TSE.2003.1214331)
[64] [On the correlation between size and metric validity](https://doi.org/10.1007/s10664-017-9513-5)
[65] [Revisiting the Debate: Are Code Metrics Useful for Measuring Maintenance Effort?](https://doi.org/10.1007/s10664-022-10193-8)
[66] [Empirical analysis of the relationship between CC and SLOC in a large corpus of Java methods](https://ir.cwi.nl/pub/22662/)
[67] [Quantifying the Effect of Code Smells on Maintenance Effort](https://doi.org/10.1109/TSE.2012.89)
[68] [Questioning Software Maintenance Metrics: A Comparative Case Study](https://doi.org/10.1145/2372251.2372269)
[69] [On the Diffuseness and the Impact on Maintainability of Code Smells: A Large Scale Empirical Investigation](https://doi.org/10.1007/s10664-017-9535-z)
[70] [Evaluating the effect of a delegated versus centralized control style on the maintainability of object-oriented software](https://doi.org/10.1109/TSE.2004.43)
[71] [Automatically Assessing Code Understandability](https://www.cs.wm.edu/~dposhyvanyk/pubs/TSE'19-Understandability.pdf)
[72] [“Automatically Assessing Code Understandability” Reanalyzed: Combined Metrics Matter](https://doi.org/10.1145/3196398.3196441)
[73] [An Empirical Validation of Cognitive Complexity as a Measure of Source Code Understandability](https://doi.org/10.1145/3382494.3410636)
[74] [Learning a Metric for Code Readability](https://doi.org/10.1109/TSE.2009.70)
[75] [Shorter Identifier Names Take Longer to Comprehend](https://www.se.cs.uni-saarland.de/publications/docs/HoSeHo17.pdf)
[76] [On the Reliability of Code Comprehension Proxies](https://arxiv.org/html/2605.23008v1)
[77] [Do Code Clones Matter?](https://doi.org/10.1109/ICSE.2009.5070547)
[78] [Frequency and Risks of Changes to Clones](https://doi.org/10.1145/1985793.1985836)
[79] [“Cloning Considered Harmful” Considered Harmful: Patterns of Cloning in Software](https://doi.org/10.1007/s10664-008-9076-6)
[80] [An Empirical Study of Code Clone Genealogies](https://plg.uwaterloo.ca/~migod/846/papers/fse06-kim.pdf)
[81] [The Wrong Abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)
[82] [MaintainCoder: Maintainable Code Generation Under Dynamic Requirements](https://arxiv.org/abs/2503.24260)
[83] [SWE-CI: Evaluating Agent Capabilities in Maintaining Codebases via Continuous Integration](https://arxiv.org/abs/2603.03823)
[84] [Beyond Correctness: Benchmarking Multi-dimensional Code Generation for Large Language Models](https://arxiv.org/abs/2407.11470)
[85] [ImpossibleBench: Measuring LLMs' Propensity of Exploiting Test Cases](https://proceedings.iclr.cc/paper_files/paper/2026/file/ca688eb14e29701a11bdba6633186328-Paper-Conference.pdf)
