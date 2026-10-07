# Dossier D1: Coherent abstraction models and information hiding as evolution levers (F1, F3)

## Summary

Synthesis (this dossier's reading of the evidence below; individual findings carry their own citations in later sections):

- **Stable theory gives a clear, testable criterion, and its sources state the assumptions behind it.**
  - The primary sources say to decompose by design decisions that are hard or likely to change. Each module hides one such decision. Interfaces carry only assumptions judged unlikely to change. A module is a work assignment.
  - The criterion depends on the designer's ability to predict change. Its own authors supported it with worked examples and an experience report, not with measured outcomes.
  - Once a system grows to hundreds of modules, the authors needed an explicit, hierarchical record of each module's secrets to keep the model coherent.
- **Empirical support is real but correlational.**
  - Several independent studies, including two with industrial data, link coupling to defects and maintenance cost. The links are strongest for co-change ("logical") coupling, for dependence on frequently changing, heavily used interfaces, and for dependencies that bridge otherwise independent modules.
  - At least one study controls for file size and complexity.
  - Cohesion metrics (LCOM) do not predict faults. No metric thresholds have been found.
  - Whether design metrics carry information beyond class size is actively disputed.
- **Hiding implementation details is supported mainly as a compatibility and change-localization lever.**
  - Clients that depend on internal APIs break more. Current Rust, Go, Java and Swift guidance applies the principle to fields, return types and error types.
  - Hiding has documented costs. Performance characteristics and observable behavior leak through any interface. Delegation-heavy designs help skilled maintainers and hurt novices. One small experiment found that a more modular design improved modification success but trended toward lower understanding.
- **Key uncertainty.**
  - Almost all evidence is correlational, retrospective, or from small samples.
  - Information hiding itself, as opposed to proxy metrics, has not been measured against change effort in industrial evolution with size controls.
  - Evidence specific to coding agents is thin and mixed.

## Facet Questions and Scope

<!-- facet: F1 -->
**F1.** What do primary sources and empirical studies say about decomposition that keeps evolution cheap as functionality grows, and what are the limits? Primary sources here cover information hiding, cohesion and coupling, deep modules and conceptual integrity.

<!-- facet: F3 -->
**F3.** What evidence links information hiding, narrow interfaces, coupling and Law-of-Demeter-style rules to change propagation, defects, or maintenance effort? Where is hiding over-applied?

Scope notes:
- Inheritance and substitutability belong to F2, and method size to F5. They appear here only where they bear on encapsulation or decomposition.
- Language error-handling canon belongs to F6. A few official error-API documents appear here because they apply information hiding at a boundary.
- Contract-first parallel work belongs to F7, and reviewer reliability to F8.
- Labels: practitioner, secondary and official-documentation sources are labelled where they appear. Official documentation is current guidance, not empirical evidence.

## Source Groups and Findings

### 1. Decomposition criteria (stable primary theory)

**Parnas, 1971 Carnegie Mellon technical report (precursor of the 1972 CACM paper; primary theory).** The criterion proposed is to begin with a list of difficult design decisions or design decisions which are likely to change, and then to design each module to hide such a decision from the others. [1] <!-- claim: 12596aa8fe51bcf6; evidence: 80139c0eba9d07a2; source: bd3a3b7ad83e5f33 --> Every module in the second decomposition is characterized by its knowledge of a design decision which it hides from all others, and its interface was chosen to reveal as little as possible about its inner workings. [1] <!-- claim: ae6631c8df507429; evidence: ac497113ddf0fa3c; source: bd3a3b7ad83e5f33 --> The paper says a module is best considered to be a work assignment unit rather than a subprogram. [1] <!-- claim: 785a2d40545df2f8; evidence: 830685c2a6f510e9; source: bd3a3b7ad83e5f33 --> The worked example hides knowledge of the exact way the lines are stored from all but one module, so any change in the manner of storage can be confined to that module. [1] <!-- claim: 8474bc60c9084d15; evidence: d88aece0c1406048; source: bd3a3b7ad83e5f33 -->

**Parnas, Clements and Weiss, "The Modular Structure of Complex Systems" (ICSE 1984 version; primary theory with an experience report).** The design principle states that system details likely to change independently should be the secrets of separate modules, and that the only assumptions appearing in the interfaces between modules should be those considered unlikely to change. [2] <!-- claim: 4e07c2d17f671fbf; evidence: faf49268c78ef0e5; source: e9c889ed967319c9 --> A stated goal is that the ease of making a change in the design should bear a reasonable relationship to the likelihood of the change being needed, so that likely changes can be made without changing any module interfaces. [2] <!-- claim: ecd8c1ee15ba56d2; evidence: 5c36e57fa1cb0b0b; source: e9c889ed967319c9 --> The module structure is defined as the decomposition of the program into modules plus the assumptions that the team responsible for each module is allowed to make about the other modules. [2] <!-- claim: 2d0f36e84350ac69; evidence: 0dca252ab14aa032; source: e9c889ed967319c9 --> To reduce the cost of software changes, the use of modules that provide such change-prone information is restricted. [2] <!-- claim: 25a724938839d43e; evidence: f664d63a92f83d4f; source: e9c889ed967319c9 -->

**Design rules (Baldwin and Clark's notion as used by Wong, Cai, Kim and Dalton).** The term design rules refers to stable design decisions that decouple otherwise coupled design decisions, hiding the details of subordinate components. [8] <!-- claim: e4c726368aeb41cb; evidence: e5416c087175f7b0; source: 2f1bff31853d3a63 -->

**Structured design (Stevens, Myers and Constantine, IBM Systems Journal 1974; primary theory, OCR text).** The fewer and simpler the connections between modules, the easier it is to understand each module without reference to other modules. [3] <!-- claim: e93c17d64a219b09; evidence: 6a6717eb90d8eba5; source: 06a3930b0c3a3a78 --> The paper notes that coincidental binding might result when an existing program is modularized by splitting it apart into modules, or when modules are created to consolidate duplicate coding in other modules. [3] <!-- claim: 32bd51202586fa9f; evidence: c953acc84ca6949d; source: 06a3930b0c3a3a78 -->

**Deep modules (Ousterhout; practitioner, from the author's own debate README and lecture notes).** The practitioner account calls methods deep when they provide a lot of functionality but have a very simple interface, replacing a large cognitive load with a much smaller cognitive load. [22] <!-- claim: df1701dc8561e370; evidence: a0bb00284a761adc; source: b2be041ecec3c50e --> The same author holds that size itself is not the most important metric, but functionality relative to interface complexity. [23] <!-- claim: b8d8ccbdeadf3c51; evidence: 92288375d20d0b74; source: 07d4b43641793987 --> The interface of a module includes formal aspects such as method signatures and public variables and informal aspects such as side effects and algorithms that affect behavior of methods. [23] <!-- claim: d39c324af7210b0e; evidence: 1087dbbbca1b6481; source: 07d4b43641793987 -->

Inference: all these sources measure an abstraction by what it lets others not know. Line counts and the number of units do not enter. The cohesion warning in Stevens et al. cuts against mechanical extraction done only to remove duplicated lines.

### 2. Keeping the abstraction model coherent as functionality grows

**Scale and the module guide (Parnas, Clements and Weiss).** With 25 or fewer modules it would not be difficult to know which modules would be affected by a change, but with hundreds of modules that is not the case. [2] <!-- claim: 615dfe008960571c; evidence: 241f17b6d2412607; source: e9c889ed967319c9 --> When the authors tried to work without the module guide, numerous problems slipped between the cracks and responsibilities ended up either in two modules or in none. [2] <!-- claim: 15908090505a1ce3; evidence: e508fdfaf2787e56; source: e9c889ed967319c9 --> The authors could find no sizable product in which the idea of information hiding had been consistently used. [2] <!-- claim: b71790f28500ae5f; evidence: 85decc08e8e62ab5; source: e9c889ed967319c9 -->

**Conceptual integrity (Jackson, MIT CSAIL technical report 2013; Brooks is quoted by Jackson, so the Brooks material is secondary).** The quoted statement holds that it is better to have a system omit certain anomalous features and improvements, but reflect one set of design ideas, than to have one that contains many good but independent and uncoordinated ideas. [24] <!-- claim: 81b0150fc853d252; evidence: b5f77ecfce20e3de; source: 3a25cc2df9b8843b --> The report contends that poor interfaces and excessive coupling between modules usually reflect a more fundamental problem: the concepts on which the code abstractions are built are not sufficiently clear and simple. [24] <!-- claim: 8341a9d05c77884d; evidence: 7522bcb1339dbc9d; source: 3a25cc2df9b8843b --> Jackson offers that second sentence as a contention, not a measured result.

**Architecture erosion (systematic mapping study; secondary).** The mapping study defines architecture erosion as the divergence between the intended and implemented architectures. [25] <!-- claim: 2bb0b454587032d9; evidence: e10c438c8e8360a0; source: 8fe7079ca1cfced9 --> The mapping study reports that 34.2% (25 out of 73) of the studies propose consistency-based approaches to detect erosion, and about 56.0% (14 out of 25) of those use architecture conformance checking. [25] <!-- claim: 692743a3b026b964; evidence: 6c9edc1278690efc; source: 8fe7079ca1cfced9 -->

**Modularity violations and design-rule spaces (Cai and colleagues; primary empirical).** A modularity violation is flagged when two components always change together to accommodate modification requests although they belong to two separate modules that are supposed to evolve independently. [8] <!-- claim: 5aae373cf3bf3e2a; evidence: 164f269057161241; source: 2f1bff31853d3a63 --> The approach identified 231 violations (47%) from the 490 modification requests of Hadoop, of which 152 (65%) violations were confirmed. [8] <!-- claim: 40c27007e20a3883; evidence: 4a3597980e2e47ad; source: 2f1bff31853d3a63 --> The study of three large-scale open source projects found that error-prone files can be captured by just a few design rule sub-spaces. [10] <!-- claim: 569219605eb26e8c; evidence: f0eebd992fd6caef; source: f0028a6b6c5e9152 -->

**Purposeful redesign (MacCormack, Rusnak and Baldwin; primary empirical, working-paper version).** The authors suggest that purposeful actions to reduce rogue dependencies can be effective, since the redesign of Mozilla reduced propagation cost by over 80%. [6] <!-- claim: 6a93e1317f6c066a; evidence: 5d0e8a66355a369e; source: b6ea8a84d60f6ba9 --> The study finds that designs with greater numbers of dependencies are not necessarily less modular than those with fewer, and that poorly placed dependencies linking otherwise independent modules may result in a cascade of unwanted and hard-to-detect indirect interactions. [6] <!-- claim: dd038c7d9df42c73; evidence: 7338d3c6eb441a17; source: b6ea8a84d60f6ba9 -->

Inference: these sources treat coherence as something kept up actively. They keep an explicit statement of the intended structure (secrets, design rules, intended architecture) and compare the implemented structure or the change history against it. One redesign result shows that drift can be reversed on purpose.

### 3. Empirical links between coupling or modularity and defects or maintenance cost

The supporting evidence is collected here. The dispute over whether design metrics measure anything beyond size is in the Counterevidence section, next to the claims it qualifies.

**Design structure matrices (MacCormack, Rusnak and Baldwin; MacCormack and Sturtevant; primary empirical).** Comparing Mozilla with Linux: The propagation cost for Mozilla was 17.35% versus 5.16% for Linux, a striking difference. [6] <!-- claim: 2192f1f04f6c4041; evidence: a49eab0fc960ca91; source: b6ea8a84d60f6ba9 --> For two industrial systems: The study shows that in both systems the tightly-coupled Core or Central components cost significantly more to maintain than loosely-coupled Peripheral components. [7] <!-- claim: 831d962f846ff10b; evidence: f41a9395e590e661; source: 111a399701810c52 --> The cost analysis finds each line of code in a Central file costs over 15 times as much to maintain as a line of code in a Peripheral-M file, and each line in a Core file of the other system costs around three times as much as a Peripheral file. [7] <!-- claim: ae9809a4faaaa97c; evidence: a067471c99dbfa40; source: 111a399701810c52 --> These regression models control for the number of lines of code in a file, as well as its cyclomatic complexity. [7] <!-- claim: 708462b39af4f273; evidence: 92fbdb83ca661306; source: 111a399701810c52 -->

**Logical (co-change) versus syntactic dependencies (Cataldo, Mockus, Roberts and Herbsleb; primary empirical, two companies).** While all dependencies increase the fault proneness, the logical dependencies explained most of the variance in fault proneness, while workflow dependencies had more impact than syntactic dependencies. [12] <!-- claim: 668cd5cb6ab11154; evidence: 9d004f4b95947b7f; source: 6ac14d85d17ac41e --> A unit increase in the log-transformed number of logical dependencies increases the odds of a failure 2.272 times for project A. [12] <!-- claim: c03d8ea9d9ed88bc; evidence: 4cc72aeafdd443ee; source: 6ac14d85d17ac41e --> In project A, 74.3 percent of the syntactic dependencies were not identified as logical relationships between a pair of files, while in project B the difference was 97.3 percent. [12] <!-- claim: 010eabc83e2c6c2b; evidence: 122b0eee0203902c; source: 6ac14d85d17ac41e -->

**Change coupling and defects (D'Ambros, Lanza and Robbes; primary empirical).** The study of three large software systems found a correlation between change coupling and defects which is higher than the one observed with complexity metrics. [13] <!-- claim: f3f96e30861030f8; evidence: 479efe08765a116d; source: e09e302ef937366e --> For all the software systems, change coupling correlates with the number of bugs, with Spearman correlation above 0.5 and a maximum above 0.8 for Eclipse. [13] <!-- claim: e1ecf8d2cbf5e9e6; evidence: cbe73d71ded32e99; source: e09e302ef937366e -->

**Architecture anti-patterns (Mo, Cai, Kazman, Xiao and Feng; primary empirical).** The anti-pattern study reports that files involved in these architecture anti-patterns are more error-prone and change-prone, and that the more anti-patterns a file is involved in, the more error-prone and change-prone it is. [9] <!-- claim: e139a6f24a041e98; evidence: 23e65672da7c27a7; source: 7fc5ff64f6cc0152 --> Unstable Interface and Crossing contribute the most by far to file error-proneness and change-proneness among the defined anti-patterns. [9] <!-- claim: 1935cd71b79db584; evidence: 23e65672da7c27a7; source: 7fc5ff64f6cc0152 --> If a highly influential file, one with a large number of dependents, is changed frequently with other files as shown in the revision history, it is called an Unstable Interface. [9] <!-- claim: 9c896479c6e79be6; evidence: 689d48445b01bb0a; source: 7fc5ff64f6cc0152 -->

**Co-change mining (Zimmermann, Weissgerber, Diehl and Zeller; primary empirical).** The mined association rules suggest and predict likely further changes, show up item coupling that is undetectable by program analysis, and can prevent errors due to incomplete changes. [11] <!-- claim: 2023187104e98ce5; evidence: 2b5a851924ccc7cc; source: bee09f4a360fa71f --> In about 2-7 percent of all erroneous transactions the tool correctly detects the missing change, and only 2 percent of all transactions cause false alarms. [11] <!-- claim: d9b61e53643d60b7; evidence: c5ab20f4e74a9a2d; source: bee09f4a360fa71f --> For stable systems like GCC, the tool makes a recommendation in 63 percent of all transactions, and these contain 45 percent of the related items with a precision of more than 30 percent. [11] <!-- claim: e7c7102d236674a2; evidence: 3cafa12bf5b00faf; source: bee09f4a360fa71f -->

**Object-oriented design metrics (Basili, Briand and Melo, primary empirical; El-Emam's review, secondary).** Coupling Between Object classes (CBO) was significant as a predictor of fault-prone classes, particularly for UI classes. [4] <!-- claim: a1d2e82d60dd649c; evidence: 0b34620bc9fcf6d2; source: e15e17c8624244fd --> Lack of Cohesion on Methods (LCOM) was insignificant in all cases. [4] <!-- claim: 5c43d4bf22a7c2f7; evidence: 93c78c20fcb9c35f; source: e15e17c8624244fd --> The review finds that the most promising results with object-oriented metrics were obtained using coupling metrics. [5] <!-- claim: 8cc37f78d50cb73e; evidence: 2b7d72769673b793; source: 3a4153f5400047a8 -->

**Encapsulation-related smells in a cohort design (primary empirical; registered by another worker).** Class Data Should Be Private and Message Chains are among the smells that cause an increase in change-proneness, while Refused Parent Bequest is the only one also increasing fault-proneness. [38] <!-- claim: c9076be6ca7ec9bf; evidence: 51d3e54b6f3f970b; source: a907cdd6b476ebc0 -->

**Controlled experiment (Tempero, Blincoe and Lottridge; 40 students; primary empirical).** Nine out of twenty participants in the high modularity condition were able to complete the modification, compared to only three out of twenty participants in the low modularity condition. [21] <!-- claim: 4b4bd3f619152796; evidence: 55b4f18b0b4612ac; source: b0b34be03ea0ba16 -->

**Law of Demeter violations (Guo, Wuersch, Giger and Gall; primary empirical).** Empirical results show that violations of the Law of Demeter highly correlate with the number of bugs and are early predictors of software quality. [15] <!-- claim: 319909a769b7e2ef; evidence: 13d0fb275dcec203; source: 4e11edf33442d9b9 --> The Counterevidence section shows how this correlation compares with plain size.

Inference: across designs, from file-level DSMs to co-change mining, coupling that actually propagates change predicts defects and cost better than static structure or complexity alone. That means co-change across modules and frequently changing interfaces with many dependents. Structural dependencies on stable code are a weak signal.

### 4. Hiding implementation details: compatibility evidence and current language guidance

**Hyrum's law (practitioner doctrine, as stated in "Software Engineering at Google", chapter 1).** The law named in the book holds that with a sufficient number of users of an API, it does not matter what you promise in the contract, because all observable behaviors of your system will be depended on by somebody. [18] <!-- claim: f2375b540fd930c0; evidence: 98c53a1e3d51d2be; source: d4d5cfab36bc917d -->

**Internal-API use by Eclipse third-party plug-ins (Businge, Serebrenik and van den Brand; primary empirical).** The use of non-APIs is not uncommon: 44.2% of the third-party plug-ins on SourceForge have at least one version that depends on at least one non-API. [20] <!-- claim: 6eeee990a06f6140; evidence: e9f9966437a45453; source: ef6469a7e954e34d --> The plug-ins depending solely on APIs have a very high source compatibility success rate compared to those that depend on at least one of the non-APIs. [20] <!-- claim: 2605a44ee8841d93; evidence: 41b4872268db3e4d; source: ef6469a7e954e34d -->

**Rust (official documentation).** The API Guidelines are a living document, read on 2026-10-07. The lint page is the rustc_lint API documentation for 1.99.0, dated 2026-09-28; lint levels and names can change between toolchains. Making a field public is a strong commitment, the guidelines say, because it pins down a representation choice and prevents the type from providing any validation or maintaining any invariants on the contents of the field, since clients can mutate it arbitrarily. [26] <!-- claim: 0d30d6560e2f93ef; evidence: f01e497b7a4a7fb1; source: 20f5a5bcd847fbf3 --> The guidelines recommend newtypes so that the client does not know how the result iterator is constructed or represented, which means the representation can change in the future without breaking client code. [26] <!-- claim: 735d1d7fd45f05f1; evidence: a9fd22ae569b5f5a; source: 20f5a5bcd847fbf3 --> The private_interfaces lint detects types in a primary interface of an item that are more private than the item itself. [27] <!-- claim: 2a9d9406c7e6ba7c; evidence: 1f8e2384b7ebab45; source: 0f5ff52b72e6a5cf -->

**Go (official documentation, current at retrieval).** If a type exists only to implement an interface and will never have exported methods beyond that interface, there is no need to export the type itself, and the constructor should return an interface value. [45] <!-- claim: bb9fba32e2957094; evidence: 169389909db3e723; source: 5d82dc9a454dc245 --> Go interfaces generally belong in the package that uses values of the interface type, and the implementing package should return concrete types so that new methods can be added to implementations without requiring extensive refactoring. [44] <!-- claim: 553bdecdf73ebb5c; evidence: 38a24b29a72ff162; source: 7d7209181e775e43 --> Synthesis: read together, the two Go documents make hiding conditional. They say to hide the implementing type when it adds nothing beyond an interface, and otherwise to return concrete types and let consumers define interfaces.

**Error types as part of an interface (official documentation plus one third-party library; these sources belong mainly to F6).** The Java statement comes from the Java SE 25 `Throwable` documentation. The Go statements come from the Go 1.13 errors blog post and the Go error-values FAQ. The Swift statement comes from Swift Evolution proposal SE-0413. The Rust statement comes from the README of thiserror, a third-party crate, so it is ecosystem practice rather than language canon. It would be bad design, per the documentation, to let the throwable thrown by the lower layer propagate outward, as it is generally unrelated to the abstraction provided by the upper layer and would tie the API of the upper layer to the details of its implementation. [131] <!-- claim: cecb9c5ba0e927ee; evidence: b4dfb88d3b7e7c3f; source: 544cc463e08c246e --> Wrap an error to expose it to callers, but do not wrap an error when doing so would expose implementation details. [104] <!-- claim: ad0be78f2d092480; evidence: eb8392f2bd8b284e; source: 8de9f533db3604ee --> Callers can depend on the type and value of a wrapped error, so wrapping may expose implementation detail that can constrain the evolution of the code. [105] <!-- claim: ee96c61f991a5a54; evidence: 2f7bfa7122e678bd; source: 56f5a9f3635207d0 --> Typed throws makes it possible to strictly specify the thrown error type of a function, but doing so constrains the evolution of that function's implementation. [142] <!-- claim: f63b77f55636521c; evidence: e4a745144087b946; source: dff42f30fb838662 --> Another documented use case is hiding implementation details of an error representation behind an opaque error type, so that the representation is able to evolve without breaking the crate's public API. [96] <!-- claim: 5ff51be9c249e969; evidence: fb9bdc3f6e4ff55d; source: 97eb4dd8c8069535 -->

**Inheritance as a breach of encapsulation (primary theory; registered under F2).** When encapsulation is violated, the benefits of locality are lost: the combined code of sub- and superclass must be considered in reasoning about the subclass, and reimplementing the superclass may require reimplementing its subclasses too. [28] <!-- claim: 02374f62a2ee7b61; evidence: 12f36fa8b817c65b; source: 3049e1862f4ceee5 --> In most languages, the introduction of inheritance severely compromises the benefits of encapsulation, and because the use of inheritance is globally visible, changes to the inheritance hierarchy cannot be made safely. [30] <!-- claim: b8f0cdde4e2caa48; evidence: 350046eb1989f696; source: 0e2c6698c7f2f644 -->

Inference: the current official guidance across four ecosystems gives one rule. Whatever appears in a signature is a promise: field visibility, a returned concrete type, a wrapped error type, a typed error list. The guidance is to promise only what you are willing to keep stable. This is Parnas's criterion applied to modern language features. It is a design norm, not measured evidence.

## Counterevidence and Disagreements

### Over-hiding and leaky abstractions

Parnas's own paper names a cost: The information-hiding decomposition can prove much less efficient if each function is actually implemented as a procedure with an elaborate calling sequence, because of the repeated switching between modules. [1] <!-- claim: 76de063f6585856e; evidence: 79ff207d2c7c1526; source: bd3a3b7ad83e5f33 --> Kiczales's critique of black-box abstraction (1992 workshop paper; primary theory): The implementation cannot always be hidden: its performance characteristics can show through in important ways, and the client programmer is limited by them just as by the abstraction itself. [16] <!-- claim: b17cc83c43265af6; evidence: 4ba2ffda80e11549; source: 8427129b64174cd5 --> The reimplementation of functionality which could not be reused from the window system appears as a hematoma in the application, and each such hematoma increases the size of the application. [16] <!-- claim: 53f4c8b07b62e56b; evidence: 5ac801027df8f494; source: 8427129b64174cd5 --> The 1997 open-implementation design guidelines (primary theory): Exposing only the functionality of a module in its interface can sometimes lead to performance difficulties when the module gets reused, and clients then code around the problem by re-implementing the module or by using existing modules in contorted ways. [17] <!-- claim: 8cb241ac5d8874e6; evidence: fa4270d89554fbb5; source: d54b9ad530ba977e --> The open implementation approach lets modules allow clients some control over selection of their implementation strategy, while still hiding many true details of their implementation. [17] <!-- claim: 6694853cce6375a1; evidence: c381a76ee0b6a8d5; source: d54b9ad530ba977e -->

### Observable behavior becomes the contract, but how often does change actually break clients?

On Hyrum's law itself, from the book's chapter (practitioner): The authors say they can mitigate it but know that it can never be eradicated. [18] <!-- claim: 676686f66c3de8b7; evidence: 9d3d6aacc846621b; source: d4d5cfab36bc917d --> On randomizing unpromised behavior: Some languages randomize hash ordering between library versions or even between executions of the same program in an attempt to prevent dependencies, but this still allows some surprises. [18] <!-- claim: 148210eaba2d6276; evidence: 0fb47e050f4da0e5; source: d4d5cfab36bc917d --> The Eclipse plug-in study qualifies its own result: However, recently released plug-ins that depend on non-APIs predominantly depend on old non-APIs rather than on newly introduced ones. [20] <!-- claim: 190542fdc7b031e7; evidence: 337886af1599ffcb; source: ef6469a7e954e34d --> A Maven ecosystem replication (registered under F7) gives a usage-weighted view: A large replication found that most breaking changes affect code that is not used by any client, and that only 7.9% of all clients are affected by breaking changes. [178] <!-- claim: 74738edafd7a609e; evidence: 0872e3261fad721e; source: 641a9e77470cd881 -->

Synthesis: the two positions answer different questions. Hyrum's law is a practitioner observation about behaviors and widely used APIs over time. The Maven study counts breaking changes against actual client usage. Together they suggest the cost of exposure scales with how many consumers use a given surface and with how stable it is. Neither source measures that scaling directly.

### Indirection and decomposition costs depend on who maintains the code

The delegated versus centralized control-style experiment (Arisholm and Sjøberg; primary empirical; registered under F10 and F5): A total of 99 junior, intermediate, and senior professional consultants from several international consultancy companies were hired for one day to participate in the experiment. [70] <!-- claim: b362d93076fe8b15; evidence: 0721ebf5e3da4b6f; source: d85a05cd60c96952 --> The most skilled developers, in particular the senior consultants, required less time to maintain software with a delegated control style, whereas more novice developers had serious problems understanding a delegated control style and performed far better with a centralized control style. [70] <!-- claim: 9745702f32b11d31; evidence: 61edda9d8835f77b; source: d85a05cd60c96952 --> The authors conclude that the maintainability of object-oriented software depends, to a large extent, on the skill of the developers who are going to maintain it. [70] <!-- claim: 789023c75875151c; evidence: fec5f5ff23aff73c; source: d85a05cd60c96952 --> The modularity experiment's other result: The experiment observed a statistical trend in which those in the high modularity condition exhibited poorer understanding than those in the low modularity condition (mean high modularity = 2.4, mean low modularity = 3, p=.07). [21] <!-- claim: db346ce6eaff19c9; evidence: 48c72836d2c0e978; source: b0b34be03ea0ba16 --> Practitioner warnings about over-decomposition (Ousterhout): Two methods are entangled, or conjoined, if understanding how one of them works internally requires reading the code of the other as well. [22] <!-- claim: 872d16de35e3290b; evidence: c751c0c90ce4cecb; source: b2be041ecec3c50e --> Very deep call stacks, especially where one method simply calls another with essentially the same arguments, are listed as a red flag. [23] <!-- claim: 16204ebff3974b61; evidence: c0d46b91878c2492; source: 07d4b43641793987 --> Go's review guidance against speculative abstraction (official documentation): Do not define interfaces before they are used, because without a realistic example of usage it is too difficult to see whether an interface is even necessary, let alone what methods it ought to contain. [44] <!-- claim: 174180869f6348fb; evidence: 09e370e87434dc98; source: 7d7209181e775e43 -->

### Not all coupling is a problem

Cataldo et al. on stable libraries: The syntactic dependencies approach would highlight basic libraries as highly coupled files, yet they tend to be very stable and unlikely to fail despite a high level of coupling. [12] <!-- claim: 4e3a9b0fdb6f22b6; evidence: a4886bbce70215af; source: 6ac14d85d17ac41e --> Wong et al. on co-change-based detection: The authors acknowledge that some violations detected by the approach may not embody any design problems but reveal valid semantic dependency. [8] <!-- claim: 8efb47ebf5024e27; evidence: 304bcb2b7397868d; source: 2f1bff31853d3a63 -->

### Do design metrics measure anything beyond size?

El Emam, Benlarbi, Goel and Rai (primary empirical): After controlling for size, none of the metrics studied were associated with fault-proneness anymore, although before controlling for size the expected associations appeared. [62] <!-- claim: 8b4c0c0f8237563f; evidence: 9d9f3bb7722e7716; source: 370ae4ea452c7b80 --> The authors demonstrate a strong size confounding effect and question the results of previous object-oriented metrics validation studies. [62] <!-- claim: 2d286e83bd7fd21f; evidence: 15532f70ad0f1ed5; source: 370ae4ea452c7b80 --> The review lists Briand et al. (2000) among validation studies that did not control for size. [5] <!-- claim: 6da3a0e6de7a2e1c; evidence: 1c618b743b371157; source: 3a4153f5400047a8 --> The opposing positions: A rebuttal argues that the ability to measure size does not temporally precede the ability to measure many object-oriented metrics, so the condition that a confounding variable must occur causally prior to another explanatory variable is not met. [63] <!-- claim: 6c795c6d31663be1; evidence: 96dd44e3fd498529; source: e29781d59509ed60 --> A later study concludes that code metrics can in fact help estimate maintenance effort, such as change proneness, even when the confounding influence of size is eliminated. [65] <!-- claim: 315e9f6316dfd2f2; evidence: b7cb9db7d9c76ce0; source: 4a71d0a1b6fb47fc --> On cohesion and thresholds: Three studies that evaluated cohesion through the LCOM metric found no effect of cohesion on fault-proneness. [5] <!-- claim: 995583f218620996; evidence: 9dbd9ae61c153ea9; source: 3a4153f5400047a8 --> The review reports that there are no thresholds for contemporary object-oriented metrics, including class size. [5] <!-- claim: bb1b42003fd81008; evidence: c4375917ce8af1f8; source: 3a4153f5400047a8 -->

Synthesis: this dispute is unresolved in the registered evidence. Claims that a design property "causes" defects should state whether size was controlled and how.

### The Law of Demeter

The strong and weak violation correlations in compare (0.70 and 0.62) rank second only to LOC and fourth. [15] <!-- claim: 8649d3690fa202cb; evidence: bfebe85a5b5f9385; source: 4e11edf33442d9b9 --> While the law is said to foster information hiding, the authors state that solid empirical evidence confirming the positive effects of following the Law of Demeter is still lacking. [15] <!-- claim: f0dfb15e239c38cb; evidence: 3285dee2ff542b51; source: 4e11edf33442d9b9 --> No claim from the original 1989 Law-of-Demeter article is anchored in this dossier, because the run's registry flags its text as model-processed. R1 actually obtained that text by local OCR of the publisher's scan, so the lead may re-verify it and unflag it.

### Do developers see encapsulation smells as design problems?

Those smells generally not perceived by developers as design problems are Class Data Should Be Private, Middle Man, Long Parameter List, Lazy Class, and Inappropriate Intimacy. [209] <!-- claim: 49ddbb708a85667b; evidence: 4a1d5f8f69786127; source: d02990c71a986d74 --> The cohort results show that the presence of code smells appears to cause a significant increase in change-proneness, while with few exceptions fault-proneness appears unaffected. [38] <!-- claim: b8b1ff4e53cbb3c3; evidence: de647596bf7cbf3f; source: a907cdd6b476ebc0 --> Synthesis: read with the cohort finding in Section 3, these two results suggest that a review finding about encapsulation-type smells is a claim about future change cost, not about defects. Developers may also not perceive it as a problem without a concrete change scenario.

## Implications for an agentic design/review workflow

Everything in this section is R1's inference from the findings above. None of it is a measured result, and no throughput or speed-up is claimed.

**Design time (super-design, super-code, contract-first interface beads).**
- For each interface bead, record three things:
  - the secret(s) it hides;
  - the assumptions other beads may rely on;
  - the likely changes it absorbs without an interface change.

  This is Parnas, Clements and Weiss's criterion in checkable form. The supporting evidence is an experience report, so treat it as a hypothesis worth testing.
- State which observable behaviors are promised and which are deliberately not. Examples are ordering, error types and messages, timing, and wrapping of underlying errors. Go's and Rust's official guidance and Hyrum's law all point here. Choosing not to wrap, or randomizing unpromised behavior, is the documented mitigation.
- Do not ask beads to hide stable, well-defined concepts or to build abstractions ahead of real use. The Go review guidance, the stable-library coupling result, and the practitioner over-decomposition warnings all argue against speculative interfaces.
- As the bead set grows past what one reader can hold in mind, keep a one-page map from modules to their secrets, as the module-guide report did. Without it, expect responsibilities to be duplicated or dropped.
- Where performance matters, allow an explicit, optional strategy-control hook rather than forcing clients to code around a closed interface (open implementation).

**Review time (super-roast scout lanes).**
- Phrase design findings as change scenarios, not principle names:
  - "decision X now requires edits in modules A, B and C";
  - "this interface with many dependents changes for a foreseeable reason";
  - "this signature now exposes representation Y or error type Z";
  - "unpromised behavior W is now observable".
- Base severity on a concrete, plausible change and how far it would propagate. Do not use metric thresholds; none have been found, and the size-confounding dispute is open.
- Co-change checks need repository history:
  - Where history exists, cross-module co-change and frequently changing high-fan-in files are the best-supported signals. They are still retrospective, and some co-change is legitimate.
  - On a fresh diff, scouts can only reason forward from the stated decision.
- Built-in false-positive guards:
  - heavy dependence on stable libraries and utilities is not a finding;
  - intended cycles, as in visitor patterns, are not findings;
  - reaching into the structure of a stable, well-defined concept is not a finding by itself;
  - encapsulation smells predict change cost, not defects.
- Legibility depends on who reads the code. Delegation-heavy or highly modular designs helped skilled maintainers and hurt novices in the experiments above. For code that humans of mixed experience will maintain, legibility deserves explicit weight.

**Measuring whether a skill change helps (overlap with F10).** Prefer evolution-task outcomes, such as modification success on a follow-up change, and size-controlled co-change or propagation measures. CBO or LCOM counts are weaker choices. Report whether size was controlled.

## Methodological Limits and Open Gaps

### Limits of the theory sources

- Parnas, 1971: The original paper proceeds by means of examples to suggest the type of criteria that should be used, rather than by measurement. [1] <!-- claim: 4711591a2115db0b; evidence: 9fb2c6db9d9369e7; source: bd3a3b7ad83e5f33 -->
- Parnas, Clements and Weiss: Applying this principle requires that the designer estimate the likelihood of changes, and such estimates are based on past experience and may require knowledge of the application area. [2] <!-- claim: b0cfc42fbd2dc00c; evidence: d8c2e2566e914d2e; source: e9c889ed967319c9 --> The authors call their conclusions tentative because they had not been confirmed by the production of a running program. [2] <!-- claim: 6f976a6dc14eb3b7; evidence: 3332ec0930e26db5; source: e9c889ed967319c9 -->
- Stevens, Myers and Constantine: The structured-design guidance rests on the observation that programs that were easiest to implement and change were those composed of simple, independent modules. [3] <!-- claim: f983bd6500e50695; evidence: c22d997df54d0a38; source: 06a3930b0c3a3a78 -->
- Jackson: The report notes an apparent lack of consensus about the meaning of the term conceptual integrity and takes the liberty to invent its own definition. [24] <!-- claim: d1dcd500c110059f; evidence: 531b4f2edd72948b; source: 3a25cc2df9b8843b -->

### Limits of the empirical sources

- MacCormack, Rusnak and Baldwin: The propagation-cost metric measures the proportion of elements that could be affected, on average, when a change is made to one element in the system. [6] <!-- claim: 436c13da84926a27; evidence: 64eddef494a1100a; source: b6ea8a84d60f6ba9 --> The authors note that few studies show correlation between measures of modularity and the outcomes it might impact. [6] <!-- claim: ed3f8a3f5be7fd3e; evidence: c6e99edf010bced7; source: b6ea8a84d60f6ba9 -->
- MacCormack and Sturtevant: The authors examine only two systems from two different firms and cannot be sure that the findings would apply to other firms or systems. [7] <!-- claim: f9e1919be9fe2edd; evidence: 0041a1a7111a97db; source: 111a399701810c52 -->
- Cataldo et al.: The authors state that their analysis cannot claim causal effects. [12] <!-- claim: 14f1a06c7b2d902d; evidence: d9b9585110ec7f39; source: 6ac14d85d17ac41e -->
- D'Ambros et al.: The authors note that they analyzed only three software systems and that they are all open-source. [13] <!-- claim: c2ef7978ea90a9e6; evidence: 969749ee0011873c; source: e09e302ef937366e -->
- Mo et al.: The authors did not explore the predictive power of these anti-patterns. [9] <!-- claim: b25cbaa0ead67565; evidence: 9b8cd048d7c7089f; source: 7fc5ff64f6cc0152 --> To partially address the file-size threat, the authors investigated whether anti-pattern instances are merely sets of large files and found that only 24% of Unstable interface instances in the Avro project are in the top 10% largest files. [9] <!-- claim: 278f2abd2f3c17a4; evidence: fb115e27c68c43d0; source: 7fc5ff64f6cc0152 --> The authors note, as a threat to validity, that a dependency cycle is an intrinsic part of the visitor pattern. [9] <!-- claim: 4fb46bcf8cdd9d6a; evidence: 0d29829e3dca0504; source: 7fc5ff64f6cc0152 --> The study approximated maintenance effort with four history measures: bug frequency, bug churn, change proneness and change churn. [9] <!-- claim: 76b50dd21b07f822; evidence: 0cef0942b2f34605; source: 7fc5ff64f6cc0152 -->
- Xiao, Cai and Kazman: The authors chose several thresholds purely based on their observations. [10] <!-- claim: f8a60f5d9c9cb1c0; evidence: 09e16788d9ea7e2c; source: f0028a6b6c5e9152 -->
- Zimmermann et al.: The tool learned from past transactions regardless of whether they were desired, so the rules learned may reflect good practices as well as bad practices. [11] <!-- claim: c5f6e31de6762efb; evidence: 4dcb893f4537f06c; source: bee09f4a360fa71f -->
- Basili, Briand and Melo: The data came from eight medium-sized information management systems developed from identical requirements. [4] <!-- claim: cfdc6664e32c1218; evidence: 71cb7c6cb5c72def; source: e15e17c8624244fd --> The study was unable to analyze the capability of OO design metrics to predict rework because of an inadequate data collection process. [4] <!-- claim: 64fbcbc001b5c824; evidence: 35699ea5ab4d5988; source: e15e17c8624244fd -->
- El-Emam's review: The review concludes that the field is not yet at the stage where precise prescriptive or proscriptive design guidelines can be developed. [5] <!-- claim: 6755f6b40f821bf2; evidence: ecaf70b403d9cc10; source: 3a4153f5400047a8 -->
- Tempero et al.: The modularity of the two designs was assessed by one of the researchers. [21] <!-- claim: f6bcf84fd286451d; evidence: 3ec335925c11c95e; source: b0b34be03ea0ba16 -->
- Erosion mapping study: The mapping study calls for more empirical studies to investigate the practices of detecting and addressing erosion in industrial settings. [25] <!-- claim: f019c694b16d6bf3; evidence: d18bd8344088032e; source: 8fe7079ca1cfced9 -->

### Modularity is not the only coordination mechanism (registered under F7)

This line of work argues that modularization, the traditional technique intended to reduce interdependencies among components of a system, has serious limitations in the context of software development. [167] <!-- claim: 9b4a90bb1b83ae55; evidence: 7c92e8a389eabf6d; source: 24f0ed604cda4ee6 --> Since designs never exhibit perfect modularity and the world is never completely predictable, informal communication will be essential to maintain project coordination. [165] <!-- claim: 9d7cc0e66cc76a08; evidence: aaaae851366840af; source: 325c8727b739270d -->

### Evidence from LLM-generated code (registered under F11)

Overall, increasing the specificity of OOD guidance tends to produce projects with more classes and higher total complexity, size, and coupling, but lower average values of the latter three metrics. [237] <!-- claim: 6e37a7dc5f1e0c3b; evidence: 5020c71de7b276f1; source: 19cbec92a90070bf --> Relative to human-involved projects, the fully generated projects show lower code smell density and appear simpler, which is consistent with oversimplification associated with missing abstractions and weaker responsibility separation. [237] <!-- claim: 07fe02f865121745; evidence: 4eed6e4c3b4fb2cf; source: 19cbec92a90070bf --> Inference: two findings point the same way. Prompting for more design structure raised total size, complexity and coupling. Fully generated projects looked simple but were missing abstractions. In this evidence, adding OO-design pressure to agent prompts is not automatically a maintainability gain. Because of the oversimplification finding, a low smell count is not evidence of good decomposition either.

### Open gaps (stated without anchors because they describe missing evidence)

- No registered study measures information hiding itself against change effort in industrial evolution with size controls. That means decision-hiding as a property, not CBO-style proxies. The strongest evidence links propagating coupling to defects and cost, and it is correlational.
- **Not anchored:**
  - The original Law of Demeter article, whose registry text is flagged as model-processed.
  - The hyrumslaw.com page, whose text is model-processed.
- **Unretrieved leads, all unverified:**
  - Liskov and Zilles 1974;
  - the Briand, Wüst, Daly and Porter 2000 primary text;
  - Zhou, Xu and Leung 2009 and Zhou et al. 2014 on size confounding;
  - Korson and Vaishnavi 1986;
  - Sullivan, Griswold, Cai and Hallen 2001;
  - van Hillegersberg 1995;
  - de Silva and Balasubramaniam 2012.
- No registered evidence on how precisely reviewers, human or LLM, flag interface leakage or misplaced secrets. This overlaps with F8.
- Conceptual integrity has no empirical operationalization in the registered evidence.

## Bibliography

[1] [On the criteria to be used in decomposing systems into modules](https://doi.org/10.1145/361598.361623)
[2] [The Modular Structure of Complex Systems](https://doi.org/10.1109/TSE.1985.232209)
[3] [Structured design](https://doi.org/10.1147/sj.132.0115)
[4] [A Validation of Object-Oriented Design Metrics as Quality Indicators](https://doi.org/10.1109/32.544352)
[5] [Object-Oriented Metrics: A Review of Theory and Practice](https://www.ehealthinformation.ca/web/default/files/wp-files/2001-Object-oriented-metrics.pdf)
[6] [Exploring the Structure of Complex Software Designs: An Empirical Study of Open Source and Proprietary Code](https://doi.org/10.1287/mnsc.1060.0552)
[7] [Technical debt and system architecture: The impact of coupling on defect-related activity](https://doi.org/10.1016/j.jss.2016.06.007)
[8] [Detecting Software Modularity Violations](https://doi.org/10.1145/1985793.1985850)
[9] [Architecture Anti-patterns: Automatically Detectable Violations of Design Principles](https://www.computer.org/csdl/journal/ts/2021/05/08691586/19utN8Vpl8Q)
[10] [Design Rule Spaces: A New Form of Architecture Insight](https://doi.org/10.1145/2568225.2568241)
[11] [Mining Version Histories to Guide Software Changes](https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf)
[12] [Software Dependencies, Work Dependencies, and Their Impact on Failures](https://doi.org/10.1109/TSE.2009.42)
[13] [On the Relationship Between Change Coupling and Software Defects](https://doi.org/10.1109/WCRE.2009.19)
[15] [An Empirical Validation of the Benefits of Adhering to the Law of Demeter](https://www.ccs.neu.edu/home/lieber/LoD/LoD-2011-Zurich.pdf)
[16] [Towards a New Model of Abstraction in the Engineering of Software](https://embeddedartistry.com/wp-content/uploads/2022/01/Towards-a-New-Model-of-Abstraction-in-Software-Engineering.pdf)
[17] [Open Implementation Design Guidelines](https://www.eecg.toronto.edu/~jacobsen/courses/ece1770/reader/p481-kiczales.pdf)
[18] [Software Engineering at Google, Chapter 1: What Is Software Engineering?](https://abseil.io/resources/swe-book/html/ch01.html)
[20] [Survival of Eclipse Third-party Plug-ins](https://doi.org/10.1109/ICSM.2012.6405295)
[21] [An Experiment on the Effects of Modularity on Code Modification and Understanding](https://doi.org/10.1145/3576123.3576138)
[22] [A Philosophy of Software Design vs Clean Code](https://github.com/johnousterhout/aposd-vs-clean-code)
[23] [Modular Design (Lecture Notes for CS 190 Spring 2016)](https://web.stanford.edu/~ouster/cgi-bin/cs190-spring16/lecture.php?topic=modularDesign)
[24] [Conceptual Design of Software: A Research Agenda](https://groups.csail.mit.edu/sdg/pubs/2013/conceptual-research-agenda-2013.pdf)
[25] [Understanding software architecture erosion: A systematic mapping study](https://doi.org/10.1002/smr.2423)
[26] [Rust API Guidelines: Future proofing](https://rust-lang.github.io/api-guidelines/future-proofing.html)
[27] [PRIVATE_INTERFACES in rustc_lint::builtin](https://doc.rust-lang.org/stable/nightly-rustc/rustc_lint/builtin/static.PRIVATE_INTERFACES.html)
[28] [Data Abstraction and Hierarchy](https://doi.org/10.1145/62139.62141)
[30] [Encapsulation and Inheritance in Object-Oriented Programming Languages](https://doi.org/10.1145/960112.28702)
[38] [Causal or Correlational? A Cohort Study on the Effects of Code Smells on Class Change- and Fault-Proneness](https://doi.org/10.1145/3744916.3787786)
[44] [Go Wiki: Go Code Review Comments](https://go.dev/wiki/CodeReviewComments)
[45] [Effective Go](https://go.dev/doc/effective_go)
[62] [The Confounding Effect of Class Size on the Validity of Object-oriented Metrics](https://ehealthinformation.ca/web/default/files/wp-files/1062.pdf)
[63] [Comments on "The Confounding Effect of Class Size on the Validity of Object-Oriented Metrics"](https://doi.org/10.1109/TSE.2003.1214331)
[65] [Revisiting the Debate: Are Code Metrics Useful for Measuring Maintenance Effort?](https://doi.org/10.1007/s10664-022-10193-8)
[70] [Evaluating the effect of a delegated versus centralized control style on the maintainability of object-oriented software](https://doi.org/10.1109/TSE.2004.43)
[96] [thiserror README](https://github.com/dtolnay/thiserror)
[104] [Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)
[105] [Go Wiki: Error Values: Frequently Asked Questions](https://go.dev/wiki/ErrorValueFAQ)
[131] [Throwable (Java SE 25 & JDK 25)](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Throwable.html)
[142] [SE-0413: Typed throws](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0413-typed-throws.md)
[165] [Splitting the Organization and Integrating the Code: Conway's Law Revisited](https://doi.org/10.1145/302405.302455)
[167] [Socio-Technical Congruence: A Framework for Assessing the Impact of Technical and Work Dependencies on Software Development Productivity](https://doi.org/10.1145/1414004.1414008)
[178] [Breaking bad? Semantic versioning and impact of breaking changes in Maven Central: An external and differentiated replication study](https://doi.org/10.1007/s10664-021-10052-y)
[209] [Do they Really Smell Bad? A Study on Developers’ Perception of Bad Code Smells](https://doi.org/10.1109/ICSME.2014.32)
[237] [Can LLMs Produce Better Object-Oriented Designs than Human-Involved Development?](https://arxiv.org/abs/2605.19901)
