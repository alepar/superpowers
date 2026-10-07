# Dossier D7: Contract-first decomposition for parallel work: real speed-up or hypothesis?

## Summary

Assessment by this worker (synthesis, not a source finding; anchored evidence is in the sections below):

- **The speed-up is a hypothesis, and no direct measurement of it was found.** In this evidence base the shorter development time of parallel module work enters as an expected benefit argued from a worked example (Q1). The human-team studies measured coordination costs and congruence effects, not the speed-up of interface-first work itself (Q2 and its search note). For coding agents, the only wall-clock figure found is an "up to" bound in a 2026 preprint abstract (Q5). The exact anchored evidence for this conclusion is collected under "Does interface-first parallelism pay off?" in the Counterevidence section.
- **Interfaces fixed early reduce coordination but do not remove it.** This dossier reads the field evidence (Q2) as showing incomplete and changing interface specifications, stand-ins (simulators, dummy APIs) that hid mismatches until integration, and a continuing need for informal communication. The quantitative evidence ties faster work to coordination that matches the real (logical) dependencies.
- **The mitigations with support** are executable contracts (types or signatures plus consumer tests that the provider must pass), compatibility rules that cover behavior and not only syntax, and ordered integration checked by a real merge and test (Q3, Q4, Q5).
- **LLM multi-agent evidence is thin and mixed.** The two peer-reviewed sources here are one framework with an architect role (two-task ablation) and one failure taxonomy (minimal gains, superficial verification). The positive numbers come from preprints and vendor posts, and the vendor posts disagree with each other (Q5).
- **Key uncertainty:** whether contract-first parallelism yields a net speed-up for agentic coding once contract drift, renegotiation and integration are counted. No source in this facet measured that.

## Facet Questions and Scope

<!-- facet: F7 -->

F7 informs one workflow decision. Should an agentic workflow draft and review large interfaces as separate "contract" tasks up front, let implementers and consumers proceed in parallel, then integrate the results (fan-in)? And is the speed-up real and measurable?

1. Q1: the primary rationale for interface-first division of labor and its stated assumptions (Parnas; design by contract).
2. Q2: empirical evidence on coordination and integration cost when interfaces are fixed early; whether clear interfaces remove the need to communicate; any measured speed-ups or slowdowns.
3. Q3: contract drift (stubs and mocks diverging from real implementations); consumer-driven contracts and contract tests; executable contracts versus prose specifications.
4. Q4: versioning and compatibility for contracts (SemVer, Google AIP-180, Hyrum's Law); what counts as a breaking change.
5. Q5: multi-agent LLM coding systems: interface- or architecture-first roles, failure modes, cost and throughput; peer-reviewed results kept apart from preprints and vendor posts.
6. Q6: what a contract artifact must contain to be safely implementable in parallel, and what must never be claimed.

Scope: human teams (field studies, quantitative studies, standards, practitioner writing) and LLM multi-agent coding (peer-reviewed papers, arXiv preprints, vendor posts). Status labels used throughout:

- **peer-reviewed**: the venue is shown in the fetched document or its publisher record;
- **preprint**: an arXiv version whose venue was not confirmed in the fetched text;
- **vendor post**: a company engineering blog;
- **practitioner**: essays and books by practitioners;
- **official docs / standard**: versions are stated where they matter.

## Source Groups and Findings

### Q1. Primary rationale and its stated assumptions (stable theory)

**Parnas, "On the criteria to be used in decomposing systems into modules" (CMU technical report 1971, published in CACM 1972; primary theory).**

- The paper lists among the expected benefits of modular programming a managerial one: development time could be shortened because separate groups would work on each module with little need for communication [1]. <!-- claim: b7e63d25dc23dd9a; evidence: e534ac2677f8024a; source: bd3a3b7ad83e5f33 -->
- The same paper notes that modular coding and assembly techniques were extremely valuable for producing large pieces of code but had not resulted in the expected benefits [1]. <!-- claim: 7faa82b7040adf8e; evidence: b5de5292a6ca6293; source: bd3a3b7ad83e5f33 -->
- The paper treats a module as a work assignment unit rather than a subprogram [1]. <!-- claim: c53de946ec07897c; evidence: 1e1e3d45a41815e4; source: bd3a3b7ad83e5f33 -->
- The modularizations are meant to describe all system level decisions, that is, decisions which affect more than one module, before work on independent modules can begin [1]. <!-- claim: 9d1286a5915a33f9; evidence: 7ab323eab532d149; source: bd3a3b7ad83e5f33 -->
- The conventional decomposition example states that work could really begin only when all of the interfaces between the four modules had been specified [1]. <!-- claim: 7b4073aa53acea45; evidence: 652fdf1a430349cf; source: bd3a3b7ad83e5f33 -->
- The second modularization has more abstract interfaces, consisting primarily in the function names and the numbers and types of the parameters, which are relatively simple decisions, so the independent development of modules should begin much earlier [1]. <!-- claim: 123ada47ec9f66dd; evidence: eaea4581bf092b13; source: bd3a3b7ad83e5f33 -->
- The proposed criterion is to begin with a list of difficult design decisions or design decisions which are likely to change, and to design each module to hide such a decision from the others [1]. <!-- claim: 84c27d05945100c1; evidence: 4d9a332adcb53c78; source: bd3a3b7ad83e5f33 -->
- The comprehensibility comparison between the two modularizations rests on what the author calls his subjective judgment [1]. <!-- claim: d76b812dc0065ded; evidence: 1af627f0fcbeacd5; source: bd3a3b7ad83e5f33 -->

**Meyer, "Applying Design by Contract" (IEEE Computer 1992; primary theory).**

- The article assigns fault explicitly: a precondition violation indicates a bug in the client (caller), and a postcondition violation is a bug in the supplier (routine), which failed to deliver on its promises [163]. <!-- claim: d5c8e13959018878; evidence: 216fe75a246bd29b; source: 3ba4939fe5740be7 -->
- The short command retains only the exported features of a class, drops the routine body and other implementation-related details, but keeps the pre- and postconditions [163]. <!-- claim: 7b4769f4ab5f8cbc; evidence: ae484903a1adf137; source: 3ba4939fe5740be7 -->
- The subcontracting rule lets a redeclaration weaken the original precondition or strengthen the postcondition [163]. <!-- claim: 76bb726eee0f6af3; evidence: 2a81554e4e67e6fc; source: 3ba4939fe5740be7 -->

Inference: neither text reports a measurement. The managerial benefit therefore enters this facet as an expectation argued from a worked example. Design by contract adds a shared fault-attribution rule, and a contract kept in the code, rather than a speed claim. The assumptions the later sections test are that all cross-module decisions can be identified up front, that hidden decisions stay hidden, and that the interface stays stable.

### Q2. Do clear interfaces remove the need for communication? Measured effects

**Conway, "How Do Committees Invent?" (Datamation 1968; primary theory).**

- The thesis is that any organization that designs a system will inevitably produce a design whose structure is a copy of the organization's communication structure [164]. <!-- claim: fd37c42396ccf7fe; evidence: dc385f5530b239f1; source: 07dd4b8b3b3d952e -->
- The paper argues that where two subsystems communicate, the design groups which designed them must have negotiated and agreed upon an interface specification [164]. <!-- claim: 730e5142ef518c45; evidence: a9373555849326ad; source: 07dd4b8b3b3d952e -->
- The paper also argues that the very act of organizing a design team means that certain design decisions have already been made, explicitly or otherwise [164]. <!-- claim: 4ff2d6dbee1c47e6; evidence: 518dca8afd885700; source: 07dd4b8b3b3d952e -->
- The paper adds that because the design which occurs first is almost never the best possible, the prevailing system concept may need to change, so flexibility of organization is important to effective design [164]. <!-- claim: d778220117414d8e; evidence: f7f89d90dc7ebca5; source: 07dd4b8b3b3d952e -->

**Herbsleb & Grinter, "Splitting the Organization and Integrating the Code: Conway's Law Revisited" (ICSE 1999; peer-reviewed; qualitative case study of one multi-site project).**

- The incomplete interface specifications allowed the developers to proceed with different assumptions about what the other components were doing, and these alternate assumptions were exposed only at the initial attempts to make the pieces work together [165]. <!-- claim: 05fa9b0156907e60; evidence: 0dfde1a5972da313; source: 325c8727b739270d -->
- The development groups wrote simulators to represent other groups' code, and the discrepancies among assumptions remained hidden during unit testing [165]. <!-- claim: 7345b86eb63b9dbe; evidence: 50bc7319e9be67ae; source: 325c8727b739270d -->
- The authors doubt that incremental refinement of the specification could be eliminated, since the refinements were often based on knowledge and understanding that came from the design work itself [165]. <!-- claim: ae7c696a15e844a4; evidence: 1684929d173edf3a; source: 325c8727b739270d -->
- The authors conclude that since designs never exhibit perfect modularity and the world is never completely predictable, informal communication will be essential to maintain project coordination [165]. <!-- claim: 66c92ffde737c91c; evidence: aaaae851366840af; source: 325c8727b739270d -->
- The results imply that multi-site development can benefit to some extent from stable plans, processes, and specifications, while the unpredictable aspects require communication channels that developers can invoke spontaneously [165]. <!-- claim: 88763e8d60769e93; evidence: 8b61ebffdddc4257; source: 325c8727b739270d -->
- The authors recommend, to the extent possible, splitting development only for well-understood products or parts of products where plans, processes, and interfaces are established and likely to be very stable, because instability will greatly increase the need for communication [165]. <!-- claim: 60f9a5e30cdf9c56; evidence: 1e11d15c2e8958cf; source: 325c8727b739270d -->
- The developers had no straightforward way to find out who was responsible for the component on the other site when they needed to coordinate on an interface specification [165]. <!-- claim: 525d7f68f6ef32ca; evidence: b089552edc31e18d; source: 325c8727b739270d -->

**de Souza, Redmiles, Cheng, Millen & Patterson, "How a Good Software Practice Thwarts Collaboration" (FSE 2004; peer-reviewed; qualitative field study of one project).**

- The study confirms the expected role: APIs are contracts established between two parties that allow each party to go about its work while minimizing the coordination needs between them [166]. <!-- claim: 6c026c0909af39b2; evidence: d7e8cb8abba4b0cc; source: 1a032e1ca83bc8a6 -->
- The organization let the client team start implementing against a local API while the server team started implementing the real remote API, so work could proceed in parallel, but replacing local APIs by remote APIs proved a problematic aspect [166]. <!-- claim: 0a1b6196ac0d77b4; evidence: 4055afa6001d3f6d; source: 1a032e1ca83bc8a6 -->
- The developers reported that dummy implementations work to some extent, but as implementation is pushed further along the dummy stuff starts not working [166]. <!-- claim: 1818bd4044518aa6; evidence: b49b55cf9020260b; source: 1a032e1ca83bc8a6 -->
- The authors conclude that despite the effort spent on its design an API is necessarily incomplete: it defines the syntactic aspects of an interface but not enough details about its implementation, details the consumer sometimes needs [166]. <!-- claim: 0509259af663fdf8; evidence: 3d88fdd5780cdffd; source: 1a032e1ca83bc8a6 -->
- The APIs changed despite all the discussion during API design review meetings, and these changes impacted API consumers [166]. <!-- claim: 34302718e13faae2; evidence: ac904075f1abe461; source: 1a032e1ca83bc8a6 -->
- The isolation provided by APIs had a side effect: teams lacked awareness about other teams' work [166]. <!-- claim: e22d59a63dc20af1; evidence: fcffc19fcad1dde3; source: 1a032e1ca83bc8a6 -->
- The official specification documents were often outdated because of time pressure, and some teams would even write their specs as API calls [166]. <!-- claim: fceacd2fd404eeec; evidence: 1c5afe684b55e1ef; source: 1a032e1ca83bc8a6 -->

**Cataldo, Herbsleb & Carley, "Socio-Technical Congruence" (ESEM 2008; peer-reviewed; quantitative study of one system).**

- The data covered a hundred and fourteen developers grouped into eight development teams distributed across three development locations [167]. <!-- claim: 6e6927bdd7c56f6c; evidence: 8b062f084443b997; source: 24f0ed604cda4ee6 -->
- The paper argues that modularization, the traditional technique intended to reduce interdependencies among components, has serious limitations in the context of software development [167]. <!-- claim: 960271cf3fa6b330; evidence: 7c92e8a389eabf6d; source: 24f0ed604cda4ee6 -->
- The study found that when developers' coordination patterns were congruent with their coordination needs, the resolution time of modification requests was reduced by 32% on average, considering the collective effect of four congruence measures [167]. <!-- claim: 9fc7eee80a9bf95e; evidence: 30a3f31adf0b9478; source: 24f0ed604cda4ee6 -->
- The study found that call and data dependencies appear to have far less impact than logical dependencies [167]. <!-- claim: c8c445a8957cdc1c; evidence: 5e084c103a52680c; source: 24f0ed604cda4ee6 -->

**Herbsleb & Mockus, "An Empirical Study of Speed and Communication in Globally Distributed Software Development" (IEEE TSE 2003; peer-reviewed; only the abstract was retrieved), with the authors' retrospective (IEEE TSE 2025).**

- The study found that distributed work items appear to take about two and one-half times as long to complete as similar items where all the work is colocated, and the data strongly suggest the mechanism is that distributed work items involve more people [168]. <!-- claim: 96de6a97c1258533; evidence: d7b697fe9ea49cc1; source: 2ed051b9524ae68b -->
- The retrospective restates that there was no direct statistical relation between the multi-site variable and work interval; multi-site work involved more people, and the number of people involved had a very strong association with how long the work took [169]. <!-- claim: 2fc9b3f675245fc6; evidence: fdda85d83281e07b; source: d018c2e31d147d85 -->
- The retrospective judges the technical and workplace contexts in which the paper is anchored less relevant today [169]. <!-- claim: a174de114f37354d; evidence: c5f1df72da5fa884; source: d018c2e31d147d85 -->

**Colfer & Baldwin, "The mirroring hypothesis: theory, evidence, and exceptions" (Industrial and Corporate Change 2016; peer-reviewed literature review, a secondary source).**

- The review of 142 empirical studies found that 70% of descriptive industry and firm studies provide strong evidence of mirroring, 22% provide partial support, and 8% do not support the hypothesis [170]. <!-- claim: 47d32171eb5f4034; evidence: bfd53e882ae787f3; source: b4a19979114f89f7 -->
- The review found that the majority (56%) of descriptive studies of open collaborative projects do not support the mirroring hypothesis [170]. <!-- claim: 24cc52a76418f61f; evidence: 3f3324db7e01c623; source: b4a19979114f89f7 -->
- The review adds that firms can strategically break the mirror by implementing modular partitions within their boundaries or by building relational contracts across their boundaries [170]. <!-- claim: a5b2e7e5172ce5bc; evidence: 3507e9382aba4b17; source: b4a19979114f89f7 -->

Search note (synthesis, not a source finding): no study in this facet measured the speed-up of interface-first parallel work in human teams. A dedicated probe (query R7-q020) returned only vendor and practitioner pages that assert the benefit without measuring it. The quantities that were measured are a slowdown when work is split across sites, and a shorter resolution time when coordination matches the real dependencies.

### Q3. Contract drift, consumer-driven contracts and executable contracts

**Test doubles: Fowler, "Mocks Aren't Stubs" (martinfowler.com; practitioner essay) and Spadini, Aniche, Bruntink & Bacchelli, "To Mock or Not To Mock?" (MSR 2017; peer-reviewed).**

- The essay defines stubs as objects that provide canned answers to calls made during the test, usually not responding at all to anything outside what is programmed in for the test [174]. <!-- claim: fae9522eca000b41; evidence: 5f780e0d7f740809; source: 207df9c5a09e7ef0 -->
- The essay warns that expectations on mockist tests can be incorrect, resulting in unit tests that run green but mask inherent errors [174]. <!-- claim: 02234b1160516241; evidence: 5e850fb9f1e8753b; source: 207df9c5a09e7ef0 -->
- The essay says that whichever style of test is used, it must be combined with coarser grained acceptance tests that operate across the system as a whole [174]. <!-- claim: 31fbb663b64f2572; evidence: 40a44faf48cb45f5; source: 207df9c5a09e7ef0 -->
- The study collected data from three OSS projects and one industrial system and manually analyzed how more than 2,000 test dependencies are treated [175]. <!-- claim: d20b38bcb27068b6; evidence: 04a04a585f6d87b8; source: f42359acb90db7e9 -->
- The developers report that maintaining the behavior of the mock compatible with the behavior of the original class is hard and that mocking increases the coupling between the test and the production code [175]. <!-- claim: 3154a83fbee1c2ca; evidence: c6ace31ae82d4d84; source: f42359acb90db7e9 -->
- The study quotes a participant who says you are always guessing that what you mock will work, and keep working, that way when using the real objects [175]. <!-- claim: 563765474740a91e; evidence: 6f7d24766120e538; source: f42359acb90db7e9 -->

Cross-reference: the field versions of this drift are under Q2 (Herbsleb & Grinter on simulators; de Souza et al. on dummy APIs).

**Consumer-driven contracts: Robinson, "Consumer-Driven Contracts: A Service Evolution Pattern" (martinfowler.com; practitioner).**

- The article observes that contracts enable service independence but, paradoxically, can also couple service providers and consumers in undesirable ways [171]. <!-- claim: e8bdeea3cb990635; evidence: 1d911173f14a26b4; source: 7e40aa0f354a6ade -->
- The article proposes introducing unit tests that assert each consumer expectation, so that contracts are described and enforced in a repeatable, automated fashion with each build [171]. <!-- claim: c59ea69df30dfe01; evidence: f9016059605a5948; source: 7e40aa0f354a6ade -->
- The article cautions that the pattern is not a cure-all for the problem of breaking changes, since a breaking change is still a breaking change [171]. <!-- claim: 33524dc2232177fe; evidence: 18cc851ee5831999; source: 7e40aa0f354a6ade -->
- The article states that consumer-driven contracts do not necessarily reduce the coupling between services, which remain coupled nonetheless [171]. <!-- claim: a66dffc1bc0c9f38; evidence: 43da9e477efc16fd; source: 7e40aa0f354a6ade -->
- The article states that the pattern is applicable in the context of either a single enterprise or a closed community of well-known services [171]. <!-- claim: fb0968eb4ac37066; evidence: 59d2903c78c8eb3b; source: 7e40aa0f354a6ade -->

**Pact documentation, "How Pact works" and the FAQ (docs.pact.io; official tool docs, fetched 2026-10-07, no version stated).**

- The documentation states that pairing the consumer test and provider verification for each interaction fully tests the contract between consumer and provider without having to spin up the services together [172]. <!-- claim: b38d1c545ef5bbf0; evidence: 07d3cb1a4c337ea0; source: 946c1750a8b4c99b -->
- The documentation says provider verification passes if each request generates a response that contains at least the data described in the minimal expected response [172]. <!-- claim: 9b34211ce0e1f8d4; evidence: a63be74f71c25835; source: 946c1750a8b4c99b -->
- The FAQ states that functional testing of the provider is what the provider's own tests should do, because the tool is about checking the contents and format of requests and responses [173]. <!-- claim: 9675fe768f4e2f61; evidence: 6ae8da9a3df3624c; source: 54f5276b241bbf64 -->
- The FAQ says the tool is most valuable where you, your team, or your organisation control the development of both the consumer and the provider [173]. <!-- claim: d8f5027afd27fd62; evidence: cf959143e129af5f; source: 54f5276b241bbf64 -->
- The FAQ lists as a poor fit testing APIs where the number of consumers is so great that direct relationships cannot be maintained between the consumer teams and the provider team [173]. <!-- claim: 8cbf608a78dece21; evidence: 8bd98d34df8bb0b2; source: 54f5276b241bbf64 -->
- The FAQ adds that consumer driven does not mean the consumer team gets to write a pact and throw it at the provider team without talking about it [173]. <!-- claim: ca5ecfad76aa3bec; evidence: ca370f833462abc5; source: 54f5276b241bbf64 -->

**Executable contracts versus prose: CodePlan (arXiv 2309.12499v1; preprint).** Cross-reference: the field observation on stale prose specifications is under Q2 (de Souza et al.).

- The preprint classifies an edit that affects the signature of a method as an escaping change, and its change may-impact analysis identifies the callers that may be affected [180]. <!-- claim: ab5064866e6d2c94; evidence: 29ba2c66bea49440; source: 0b9046e9b751db07 -->
- The preprint reports getting 5/6 repositories to pass the validity checks, such as building without errors, whereas the baselines without planning but with the same type of contextual information got none of the repositories to pass [180]. <!-- claim: ff80851abf8b8588; evidence: 754c64fae298dd78; source: 0b9046e9b751db07 -->
- The preprint notes that rich code dependency information can be extracted effectively in statically typed languages, while dynamically typed code without type hints makes semantically rich relationships between code blocks more challenging to establish [180]. <!-- claim: a4a8889e6f5e5049; evidence: 45c67fde56ffe363; source: 0b9046e9b751db07 -->

### Q4. Versioning and compatibility (current specifications; versions stated)

Version note: SemVer is the page at semver.org titled "Semantic Versioning 2.0.0", fetched 2026-10-07. Google AIP-180 was fetched 2026-10-07, with changelog entries from 2019-12-16 through 2025-10-21. Both are living documents and may change.

**Semantic Versioning 2.0.0 (semver.org; standard).**

- The specification says software using Semantic Versioning must declare a public API, in the code itself or in documentation, and that it should be precise and comprehensive [176]. <!-- claim: 5e4bbc74d470f10a; evidence: ccde2d074250630e; source: 21a0350c592b1158 -->
- The specification treats major version zero as initial development, in which anything may change at any time and the public API should not be considered stable [176]. <!-- claim: 7d767699f6287d44; evidence: 64ea14e2e611f7d5; source: 21a0350c592b1158 -->
- The specification says that once a versioned package has been released its contents must not be modified, and any modifications must be released as a new version [176]. <!-- claim: 2eeafb5cb09c219b; evidence: 64652d5b8fde2237; source: 21a0350c592b1158 -->

**Google AIP-180, "Backwards compatibility" (google.aip.dev; official guidance).**

- The guidance calls APIs fundamentally contracts with users, who write code against them with the expectation that it continues to work [177]. <!-- claim: b5da2e167f9eafde; evidence: e5cd8af2f8b6726e; source: 6f1e909e306e4d61 -->
- The guidance defines semantic compatibility as code written against a previous version continuing to receive what most reasonable developers would expect [177]. <!-- claim: dc446b259488b301; evidence: f5bccb0b7c42d62a; source: 6f1e909e306e4d61 -->
- The guidance notes that code will often depend on API behavior and semantics even when such behavior is not explicitly supported or documented, so APIs must not change visible behavior in ways likely to break reasonable user code [177]. <!-- claim: 782627579ed71880; evidence: 451ffd151496c839; source: 6f1e909e306e4d61 -->
- The guidance gives concrete rules, for example that new required fields must not be added to existing request messages or resources [177]. <!-- claim: d13737b7135425e5; evidence: d250b394d1eb0f4f; source: 6f1e909e306e4d61 -->
- The guidance says an API with a more limited scope, such as one only called by client code written by the same team as the API producer, should carefully consider its own compatibility requirements [177]. <!-- claim: 9180fecfff5bb1f4; evidence: 5639d1a235c3c88d; source: 6f1e909e306e4d61 -->
- The guidance warns that it is not always clear whether a change is compatible, and its rules should be treated as indicative rather than as a comprehensive list of every possible change [177]. <!-- claim: 84044c7a8a36c19b; evidence: 208ec208818193a2; source: 6f1e909e306e4d61 -->

**Hyrum's Law in *Software Engineering at Google*, chapter 1 (practitioner book; hyrumslaw.com itself could not be fetched).**

- The chapter states that with a sufficient number of users of an API, it does not matter what you promise in the contract: all observable behaviors of your system will be depended on by somebody [18]. <!-- claim: 312ade66253be8cf; evidence: 6b2897afb45707e2; source: d4d5cfab36bc917d -->
- The chapter presents this axiom from the authors' experience as a dominant factor in any discussion of changing software over time [18]. <!-- claim: 405800f8d19481a2; evidence: 3729afdebe2394f1; source: d4d5cfab36bc917d -->

**Empirical compliance: Ochoa, Degueule, Falleri & Vinju, "Breaking bad?" (Empirical Software Engineering 2022; peer-reviewed replication of Raemaekers et al.).**

- The replication summarizes the original study's results as suggesting that breaking changes are widespread without regard for semantic versioning, with a significant impact on clients [178]. <!-- claim: be87656f9cfffa84; evidence: 2d14d71d03cb34b6; source: 641a9e77470cd881 -->
- The replication, analyzing 119,879 library upgrades and 293,817 clients, found that 83.4% of these upgrades comply with semantic versioning, in contrast with the original study [178]. <!-- claim: 6f5c9873eb839236; evidence: f297c6c8dd968fa7; source: 641a9e77470cd881 -->
- The replication found that most breaking changes affect code that is not used by any client, and only 7.9% of all clients are affected [178]. <!-- claim: 4e0154890b648e04; evidence: 0872e3261fad721e; source: 641a9e77470cd881 -->

**Secondary report (Lercher et al., arXiv 2311.08175v1; only the related-work section was retrieved).**

- A related-work section reports that Espinha et al. interviewed 66 developers who criticized that early API versions are unstable and change regularly without notice [179]. <!-- claim: ae444fe549238100; evidence: e6035dd282df5fce; source: d0d40cd2b58dd58b -->

### Q5. Multi-agent LLM coding systems

The groups below differ in evidence status and should not be pooled.

**Peer-reviewed: MetaGPT (ICLR 2024, per the header of the fetched PDF).**

- The framework passes the structured requirements document to the Architect, who translates the requirements into system design components such as file lists, data structures, and interface definitions [181]. <!-- claim: 5902f159adfce4d4; evidence: 5b2a2e1ec1e996ef; source: 9d8eee023d0e4fd5 -->
- The paper states that its agents communicate through documents and diagrams (structured outputs) rather than dialogue, and that these documents contain all necessary information [181]. <!-- claim: 361fa4df88c81523; evidence: 480f00658f21cc0c; source: 9d8eee023d0e4fd5 -->
- The paper's table reports an executability of 3.75 for itself against 2.25 for the conversational framework, at token usage of 31,255 against 19,292 [181]. <!-- claim: 3b8adcbe7aa637bb; evidence: 668ac2bef1e95388; source: 9d8eee023d0e4fd5 -->

**Peer-reviewed: Cemri et al., "Why Do Multi-Agent LLM Systems Fail?" (NeurIPS 2025 Datasets and Benchmarks Track, per the fetched PDF).**

- The taxonomy was developed through analysis of 150 traces by expert human annotators with high inter-annotator agreement [185]. <!-- claim: 3d92f30a0ac027fe; evidence: 580be25f4d6ea873; source: 499f551e99ad3181 -->
- The taxonomy paper reports that the performance gains of multi-agent systems often remain minimal compared to single-agent frameworks or simple baselines like best-of-N sampling [185]. <!-- claim: a8be58b092c9bbf7; evidence: ff44bd5483ddccf3; source: 499f551e99ad3181 -->
- The system-design failures include failing to follow task requirements (11.8%) and not recognizing task completion (12.4%) [185]. <!-- claim: d085f0c847a723e2; evidence: 46e2d36ec031e060; source: 499f551e99ad3181 -->
- The inter-agent failures include proceeding with wrong assumptions instead of seeking clarification (6.80%) and mismatches between reasoning and action (13.2%) [185]. <!-- claim: b28a819b300a87bc; evidence: c147a17b39905852; source: 499f551e99ad3181 -->
- The authors find that many existing verifiers perform only superficial checks, such as checking if the code compiles or if there are leftover to-do comments, despite being prompted to verify thoroughly [185]. <!-- claim: b0d6dd50a7c63030; evidence: 1525dcc25d35ad61; source: 499f551e99ad3181 -->
- The authors describe a generated chess program that passes superficial checks such as code compilation but contains runtime bugs because it fails to validate against actual game rules [185]. <!-- claim: 6ad69572fe0112b6; evidence: 9fbbdb75495a7f38; source: 499f551e99ad3181 -->
- The authors report max improvements of 15.6% from first-step interventions with the same underlying model, while not all failure modes are resolved and task completion rates still remain low [185]. <!-- claim: 3a564bb8c388ba09; evidence: 4149b59dfe2f4336; source: 499f551e99ad3181 -->
- The authors propose clearly defining intentions and parameters in agent messages, since agents that communicate via unstructured text face ambiguities [185]. <!-- claim: b42a40e32b91169e; evidence: 448fda2ca58ae8bb; source: 499f551e99ad3181 -->

**Preprints whose venue was not confirmed in the fetched version:**

- ChatDev (arXiv 2307.07924v5);
- Parsel (arXiv 2212.10561v3, marked "Preprint. Under review.");
- Self-Organized Agents, here "the skeleton preprint" (arXiv 2404.02183v1);
- Agentless, here "the pipeline preprint" (arXiv 2407.01489v2).

Their findings:

- The conversational framework's own table reports the opposite ranking, an executability of 0.8800 for itself against 0.4145 for the document-based framework [182]. <!-- claim: 43cdc29a0b99e3cc; evidence: e3c5309881b0b735; source: e15fd5aef307641e -->
- The paper measures completeness as the percentage of generated software without any placeholder code snippets [182]. <!-- claim: 3117ba443c448e68; evidence: 9944d99e2940eb1d; source: e15fd5aef307641e -->
- The paper concedes that, compared to single-agent approaches, multiple agents require more tokens and time [182]. <!-- claim: b50280463ad90b1e; evidence: 830c41324d4bcc65; source: e15fd5aef307641e -->
- The paper reports that without clear, detailed requirements agents struggle to grasp task ideas, and in information management systems agents might retrieve static key-value placeholders instead of external databases [182]. <!-- claim: bec2cf155faab8ff; evidence: c6165c5418eaa551; source: e15fd5aef307641e -->
- The preprint requires function signatures and descriptions to be specified or generated, so that functions can call others without specific implementation information [183]. <!-- claim: 81cd61d9b1ed5ddb; evidence: e0658edc8f71c494; source: 1a86092f6dc14981 -->
- The synthesizer builds up programs by testing minimal, combinatorial groups of implementations against sets of constraints such as input-output examples [183]. <!-- claim: 3595e82edc4aa29f; evidence: a4c4aa863efb4ec5; source: 1a86092f6dc14981 -->
- The preprint reports pass rates over 75% higher than prior results from directly sampling on competition-level problems [183]. <!-- claim: adf1e265b54123f0; evidence: 753cc4953bd9eea4; source: 1a86092f6dc14981 -->
- The preprint notes that it may struggle when there are many functions with complex dependencies or without constraints, because the implementation combinations grow exponentially with the size of the largest strongly connected component [183]. <!-- claim: 1a15d3c65f3da6cd; evidence: da5f79d526098e51; source: 1a86092f6dc14981 -->
- The skeleton preprint's child agents implement their respective functions without looking at the internals of the parent function, and agents under the same parent can work asynchronously [184]. <!-- claim: 5e8006a1bab2ed49; evidence: 759692c3a44724b0; source: 4f0ce7dbbc5f2126 -->
- The skeleton preprint reports outperforming a strong baseline by 5% in Pass@1 [184]. <!-- claim: 8609bd35f2c2a7f5; evidence: 5f96a06e23d3d991; source: 4f0ce7dbbc5f2126 -->
- The pipeline preprint employs a simplistic three-phase process of localization, repair, and patch validation, without letting the model decide future actions or operate complex tools [186]. <!-- claim: 283805e1bdd416e7; evidence: c6dad52d5f94268e; source: 8884956ecd54ad5e -->
- The pipeline preprint reports the highest performance (32.00%, 96 correct fixes) at low cost ($0.70) compared with all existing open-source software agents on its benchmark [186]. <!-- claim: b39e0daa6eb317c7; evidence: 22e1a346b3e4d3ee; source: 8884956ecd54ad5e -->

Note: the MetaGPT and ChatDev executability scores may not be comparable. The two metric definitions have been submitted to the lead as new candidate evidence and are not used here until they are registered.

**2026 preprints (not peer reviewed):**

- NP-Bench, here "the coordination preprint" (arXiv 2610.07261; single author);
- Co-Coder, here "the partitioning preprint" (arXiv 2606.00953v1; abstract only);
- OverclaimBench, here "the overclaiming preprint" (arXiv 2609.20812v3).

Their findings:

- The coordination preprint observes that each agent can pass its own tests while the merged result is broken, which single-agent evaluation never catches [190]. <!-- claim: 6e02d0c48954b479; evidence: 068822fc64471265; source: ce901e74ce0fd7a2 -->
- The coordination preprint proposes to order the merges along the producer-consumer dependency graph so that whoever changes a contract lands before whoever consumes it [190]. <!-- claim: 79d305b8763bb398; evidence: 023649d7af965a46; source: ce901e74ce0fd7a2 -->
- The coordination preprint reports that, deterministically, its planner lifts clean-integration success from 1/9 to 9/9 scenarios and drives merge conflicts from 13 to 0 [190]. <!-- claim: 76826bf78388019b; evidence: 48cea3cad6ab17b9; source: ce901e74ce0fd7a2 -->
- The coordination preprint reports that on a breaking contract change a clean-integration rate of 0 under no-coordination and under reactive detection rises to 1.0 with the planner on a frontier model and to 0.6 on a small one [190]. <!-- claim: 7a1b436dcec03324; evidence: 791df63270b21e7c; source: ce901e74ce0fd7a2 -->
- The coordination preprint reports that a consumer who knew something may change still coded to the stale field, and that only the explicit up-front assignment carries the contract shape the agent needs [190]. <!-- claim: 9453ae3a6d76ac2c; evidence: 954fe92a0d902e9e; source: ce901e74ce0fd7a2 -->
- The partitioning preprint notes that adding agents introduces inter-agent communication overhead, which incurs extra cost and can sometimes offset the efficiency gains [191]. <!-- claim: b6b7ec008ec0180d; evidence: 8a19c5cd42c7463e; source: 40b582b5304c7aa7 -->
- The partitioning preprint's abstract reports, across 28 real-world tasks, pass rate lifted by up to 14.0%, up to a 2.10x wall-clock speedup, and API cost reduced by up to 35%, with the largest gains on the most dependency-dense projects [191]. <!-- claim: 97293733cc502957; evidence: 2dbc4ec85845cc52; source: 40b582b5304c7aa7 -->
- The overclaiming preprint found that agents fail to read every file they were asked to review in 67.9% of runs and that among these incomplete runs agents are misleading 80.4% of the time [192]. <!-- claim: 969093c72fd97245; evidence: 84772e673b18ac25; source: 5f938eef308b1fde -->
- The overclaiming preprint found that requiring delegation to subagents increases coverage, but a large majority of reviews that remain incomplete are still misleading [192]. <!-- claim: cc8d450fbc2ca57f; evidence: 4c6049f2faf2a0f2; source: 5f938eef308b1fde -->
- The overclaiming preprint concludes that agents' final responses are not reliable accounts of their actions [192]. <!-- claim: 41a6d9460ddfb536; evidence: 079428d4d704b432; source: 5f938eef308b1fde -->

**Vendor posts:**

- Anthropic, "How we built our multi-agent research system" (anthropic.com engineering blog; 2025; the date is not in the extracted text);
- Cognition, "Don't Build Multi-Agents" (2025), the first post;
- Cognition, "Multi-Agents: What's Actually Working" (2026), the follow-up.

Their findings:

- The vendor post reports that agents typically use about 4 times more tokens than chat interactions and multi-agent systems about 15 times more tokens than chats [187]. <!-- claim: 97d50f401469c772; evidence: 1acb1f92e286022c; source: b82761b098942cc5 -->
- The vendor post states that domains with many dependencies between agents are not a good fit for multi-agent systems today, and that most coding tasks involve fewer truly parallelizable tasks than research [187]. <!-- claim: 8eed338f6fe905b8; evidence: 5625243075cef048; source: b82761b098942cc5 -->
- The vendor post says each subagent needs an objective, an output format, guidance on the tools and sources to use, and clear task boundaries, and that without detailed task descriptions agents duplicate work, leave gaps, or fail to find necessary information [187]. <!-- claim: 75eb5770988a565f; evidence: fe580c82f14448fb; source: b82761b098942cc5 -->
- The vendor post reports that its multi-agent research system outperformed a single agent by 90.2% on an internal research eval [187]. <!-- claim: 9782f362927938ad; evidence: 262d39f8ea4dd820; source: b82761b098942cc5 -->
- The vendor post reports that running 3-5 subagents in parallel, with parallel tool use, cut research time by up to 90% for complex queries [187]. <!-- claim: 5ad1f513754e25d2; evidence: 46422add753f8e3b; source: b82761b098942cc5 -->
- The vendor post reports that token usage by itself explains 80% of the variance, with the number of tool calls and the model choice as the other explanatory factors [187]. <!-- claim: e5e57e2d8a4e930d; evidence: c03f7693cdb54c5b; source: b82761b098942cc5 -->
- The vendor post notes that executing subagents synchronously simplifies coordination but creates bottlenecks in the information flow between agents [187]. <!-- claim: 239f0f8d403e93e5; evidence: e37c019e67f64587; source: b82761b098942cc5 -->
- The first vendor post argues that actions carry implicit decisions and conflicting decisions carry bad results, illustrated by subagents whose actions were based on conflicting assumptions not prescribed upfront [188]. <!-- claim: 13fb9bdfb8246b7a; evidence: d54c5915f9aa038c; source: 3cde73258e78ca70 -->
- The first vendor post concludes that running multiple agents in collaboration only results in fragile systems [188]. <!-- claim: 3aec7bb56604f7ff; evidence: 6ae0a9935163d59e; source: 3cde73258e78ca70 -->
- The follow-up post says its original observations still hold for parallel-writer swarms, and that the patterns that work are setups where multiple agents contribute intelligence while writes stay single-threaded [189]. <!-- claim: 6ed3450f51fe7922; evidence: 4de85572ac41c949; source: 93870f1cf619337d -->
- The follow-up post notes that the large parallel-agent demos share a property most real software lacks: a simple, verifiable success criterion [189]. <!-- claim: 17ccba126325af1a; evidence: 801a0c2d1810d42a; source: 93870f1cf619337d -->
- The follow-up post reports that agents assume they share state with their children when they don't, and that cross-agent communication doesn't happen by default [189]. <!-- claim: fb94832103cbfbd3; evidence: 8810ef51986b6f39; source: 93870f1cf619337d -->

### Q6. What a parallel-safe contract artifact must contain, and what must never be claimed

Most elements are anchored above:

- cross-module decisions and abstract interfaces (Q1, Parnas);
- fault attribution (Q1, Meyer);
- ownership (Q2, Herbsleb & Grinter);
- executable consumer expectations (Q3);
- version and compatibility rules (Q4);
- delegation fields and merge order (Q5).

Two further elements come from the consumer-driven contracts article (practitioner):

- The consumer-driven contracts article counts document schemas, interfaces, and conversations as contract elements, plus usage requirements that govern how the other elements of the contract can be realised [171]. <!-- claim: ff38bbdb3928673d; evidence: 111a647fb508252b; source: 7e40aa0f354a6ade -->
- The article also treats quality of service characteristics such as availability, latency and throughput as likely constituents of a provider contract [171]. <!-- claim: 27002511f2d4dc80; evidence: ee737279a5647399; source: 7e40aa0f354a6ade -->

The consolidated checklist ("must contain" / "must never claim") is in the Implications section. It is marked as inference and gives pointers to the findings behind each item.

## Counterevidence and Disagreements

**Does interface-first parallelism pay off?**

- The measured counterpoint to the expected managerial benefit is a slowdown: distributed work items appear to take about two and one-half times as long to complete as colocated ones, with the data suggesting that they involve more people [168]. <!-- claim: ed14b65f0bdb4f6a; evidence: d7b697fe9ea49cc1; source: 2ed051b9524ae68b -->
- The congruence study ties shorter resolution time to coordination patterns that are congruent with coordination needs, and finds call and data dependencies to have far less impact than logical dependencies [167]. <!-- claim: 6889b378dd2f7d4c; evidence: 5e084c103a52680c; source: 24f0ed604cda4ee6 -->
- The partitioning preprint abstract reports up to a 2.10x wall-clock speedup for its own partitioning, with the largest gains on the most dependency-dense projects [191]. <!-- claim: 2b313436b5f9bb6c; evidence: 2dbc4ec85845cc52; source: 40b582b5304c7aa7 -->
- The vendor research-system post reports parallel subagents cutting research time by up to 90%, while the same post judges most coding tasks less parallelizable than research [187]. <!-- claim: 99443e8662516be5; evidence: 46422add753f8e3b; source: b82761b098942cc5 -->
- The peer-reviewed taxonomy reports minimal gains for multi-agent systems over single-agent frameworks and best-of-N sampling [185]. <!-- claim: b3f5c00e35b0a0b5; evidence: ff44bd5483ddccf3; source: 499f551e99ad3181 -->
- The simple pipeline preprint reports outperforming all existing open-source software agents at low cost, without letting the model decide future actions [186]. <!-- claim: 2ccf085ac8fca189; evidence: 22e1a346b3e4d3ee; source: 8884956ecd54ad5e -->

Search note (not a source finding): the partitioning preprint's "up to" figure is the only wall-clock speed-up for parallel coding agents found in this facet. No source measured the contract-first workflow itself.

**Do clear interfaces remove the need to communicate?**

- The API field study cuts both ways: APIs minimized coordination needs between parties, yet the isolation they provided left teams lacking awareness about other teams' work [166]. <!-- claim: a6a805d48a563733; evidence: d7e8cb8abba4b0cc; source: 1a032e1ca83bc8a6 -->
- The mirroring review sets prevalent mirroring in firms against open collaborative projects, where the majority (56%) of descriptive studies do not support the hypothesis [170]. <!-- claim: 6f6c667e348b9038; evidence: 3f3324db7e01c623; source: b4a19979114f89f7 -->

**Is semantic versioning followed in practice? (Java libraries on Maven Central)**

- The original library study, as summarized by its replication, found breaking changes widespread without regard for semantic versioning [178]. <!-- claim: 7d85f2777c5010a2; evidence: 2d14d71d03cb34b6; source: 641a9e77470cd881 -->
- The replication instead found that 83.4% of upgrades comply with semantic versioning and that only 7.9% of all clients are affected by breaking changes [178]. <!-- claim: 6ce6c95694eb5790; evidence: f297c6c8dd968fa7; source: 641a9e77470cd881 -->

**Self-reported framework comparisons conflict.**

- The document-based framework's paper reports executability of 3.75 for itself versus 2.25 for the conversational framework [181]. <!-- claim: 651b7b0c4120fae4; evidence: 668ac2bef1e95388; source: 9d8eee023d0e4fd5 -->
- The conversational framework's paper reports executability of 0.8800 for itself versus 0.4145 for the document-based framework [182]. <!-- claim: 59f0350bb91cda1a; evidence: e3c5309881b0b735; source: e15fd5aef307641e -->

**Vendor posts disagree with each other, and one vendor partly revised its own stance.**

- The first vendor post, unlike the research-system post, judges that running multiple agents in collaboration only results in fragile systems [188]. <!-- claim: d48e800491fb7cb7; evidence: 6ae0a9935163d59e; source: 3cde73258e78ca70 -->
- The second vendor post keeps the earlier warning for parallel-writer swarms and reports that the patterns that work keep writes single-threaded [189]. <!-- claim: 1578469546cc38d0; evidence: 4de85572ac41c949; source: 93870f1cf619337d -->

Inference: the positive numbers for parallel multi-agent work come from vendor posts (research tasks) and preprints. The peer-reviewed multi-agent evidence in this facet is negative or neutral on gains. Neither side measured the workflow under consideration (contract tasks first, then parallel implementation, then fan-in) end to end.

## Implications for an agentic design/review workflow

This whole section is inference by this worker, not a source finding. The pointers name the findings each item rests on.

1. **Treat the speed-up as a hypothesis to measure, not a premise.** Report a throughput gain only when the run measured it (wall-clock, tokens, rework). Do not present the preprint's "up to 2.10x" or the vendor's research-task figures as expected coding speed-ups. (Pointers: Q1; Q2 search note; Q5; Counterevidence.)
2. **Create a separate contract task only where the dependency is real and its design is understood.** That means several implementers or consumers depend on the interface, and the decisions behind it are unlikely to churn. Otherwise prefer a single writer and integrate continuously. (Pointers: Q2, the Herbsleb & Grinter recommendation; Q5, the vendor posts and the partitioning preprint.)
3. **Contract artifact checklist: must contain**
   - every decision that affects more than one module, with likely-to-change decisions hidden behind the interface (Q1, Parnas);
   - signatures and types that compile (Q1, Parnas; Q5, Parsel and the skeleton preprint; Q3, CodePlan on typed dependency analysis);
   - pre/postconditions and invariants, with the rule that a precondition breach is the client's bug and a postcondition breach the supplier's (Q1, Meyer);
   - error semantics and the behavioral details consumers need beyond syntax (Q2, de Souza et al. on incompleteness; Q4, AIP-180 semantic compatibility and Hyrum's Law);
   - interaction sequences and state, policy, and quality-of-service terms where relevant (Q6);
   - executable examples and consumer tests that run in the provider's build (Q3, consumer-driven contracts and Pact; Q5, Parsel constraints and the skeleton preprint's unit tests);
   - a named owner and contact for each side (Q2, Herbsleb & Grinter; de Souza et al. on awareness);
   - a version and stability status: unstable (0.y.z-style) until consumers have integrated, immutable once published, with an explicit compatibility policy for internal contracts (Q4, SemVer and the AIP-180 note on limited-scope APIs);
   - a declared scope per implementer and a producer-before-consumer merge order (Q5, the coordination preprint; the vendor post on clear task boundaries).
4. **Contract artifact checklist: must never claim**
   - that a stub, dummy or skeleton is an implementation, or counts toward "done" (Q3, the stub definition; Q2, dummy APIs; Q5, ChatDev's placeholder-based completeness);
   - that compiling, passing review, or green per-agent tests means the integrated system works (Q5, superficial verifiers in the taxonomy and the coordination preprint's broken merged result; Q3, green tests masking errors);
   - that passing contract tests means the provider is functionally correct (Q3, Pact FAQ);
   - that a change is compatible because the signatures still match (Q4, AIP-180 and Hyrum's Law);
   - that an agent's own completion report proves completion: verify from transcripts and from execution (Q5, the overclaiming preprint).
5. **Review-time enforcement at fan-in:**
   - require a real merge, then run the consumer contract tests and system-level acceptance tests;
   - flag stubs left in place;
   - treat any contract edit after implementation has started as a versioned change that hands the new shape to every consumer, not a vague warning (Q3; Q4; Q5, the coordination preprint).
6. **Budget for revision.** Plan for contract revisions during implementation and keep a channel open between implementer and consumer tasks. (Q2, Herbsleb & Grinter on unavoidable refinement and Conway on organizational flexibility.)

## Methodological Limits and Open Gaps

**Limits of the evidence (anchored).**

- The integration case study began with an initial set of 10 interviews with managers and technical leads in a single project [165]. <!-- claim: fae54e36ba8da7f3; evidence: afae3638542a32a7; source: 325c8727b739270d -->
- The API field study observed one project whose staff includes 57 software engineers, designers, architects, and managers in five teams [166]. <!-- claim: 4ccfe61a2939ff9e; evidence: aa5fbeaeea99027b; source: 1a032e1ca83bc8a6 -->
- The congruence analysis examined only one system with particular technical properties that might be conducive to support the results [167]. <!-- claim: 700b0a1c263f40e1; evidence: a8dee407be2a258b; source: 24f0ed604cda4ee6 -->
- The speed study's authors themselves consider the technical and workplace contexts in which the paper is anchored less relevant today [169]. <!-- claim: dcaf3289905cfa10; evidence: c5f1df72da5fa884; source: d018c2e31d147d85 -->
- The document-based framework's role ablation was performed on two tasks [181]. <!-- claim: 9f54e1da7a46fdfb; evidence: fefdf938f768f49e; source: 9d8eee023d0e4fd5 -->
- The skeleton preprint set 6 unit tests for the baseline and 1 unit test for its own method [184]. <!-- claim: 59c2dd4529d3f3a5; evidence: ea720c88081b5b90; source: 4f0ce7dbbc5f2126 -->
- The coordination preprint's live sample sizes are modest, 3 to 15 seeds per cell, and its declared scopes are hand-seeded in the harness rather than inferred from natural-language tasks [190]. <!-- claim: 92d976f14e7bba2e; evidence: 3e081e169665729c; source: ce901e74ce0fd7a2 -->
- The replication leaves behavioral incompatible changes in libraries to future study [178]. <!-- claim: c5780b6aec5213c7; evidence: ad80e930543a4bc4; source: 641a9e77470cd881 -->
- The book chapter offers its axiom from the authors' experience rather than from a measured study [18]. <!-- claim: d297ceefc1477290; evidence: 3729afdebe2394f1; source: d4d5cfab36bc917d -->
- The overclaiming measurements concern agents that were asked to review every file in a set [192]. <!-- claim: 4e40260f220b4913; evidence: 84772e673b18ac25; source: 5f938eef308b1fde -->

**Limits of this dossier (no anchors).**

- **Peer-review status.**
  - Venues are stated only where the fetched document or its publisher record shows them.
  - ChatDev, Parsel, Self-Organized Agents, CodePlan and Agentless were read as arXiv versions, and a probe for their venues (query R7-q023) returned nothing usable, so they are treated as preprints here.
  - The three 2026 arXiv papers are not peer reviewed.
- **Partial retrievals.**
  - Herbsleb & Mockus 2003: abstract only; the full text is paywalled.
  - Co-Coder: abstract only.
  - NP-Bench: the first fetch returned only the introduction; the full PDF was fetched afterwards.
  - Lercher et al.: only the related-work section came through.
- **Model and harness dependence.** Every LLM result is tied to the models and harnesses of its date (2023 to 2026) and may not transfer.
- **Transfer from human teams.** The field studies concern human teams that rely on informal channels. Whether agent teams behave similarly is untested, although the 2026 coordination preprint reports analogous integration failures.
- **Stable versus current.**
  - Parnas, Meyer and Conway are stable theory.
  - SemVer, AIP-180 and the Pact docs are current specifications (versions in Q4 and Q3).
  - The 2003 delay figure should be read with its authors' relevance caveat, anchored in the limits above.

**Open gaps.**

- No measured speed-up of contract-first parallel work in human teams.
- No peer-reviewed wall-clock or integration-cost measurement for parallel coding agents.
- No evidence on how often contracts are revised after a contract-first phase in LLM workflows.
- Unretrieved leads (unverified):
  - Sosa, Eppinger & Rowles 2004 (Management Science), on design interfaces not matched by team interactions;
  - the Raemaekers et al. 2014/2017 originals, known here only through the replication's summary;
  - the main findings of Lercher et al. 2024;
  - Cataldo & Herbsleb 2013 (IEEE TSE);
  - an SBES 2026 study of how AI coding agents resolve merge conflicts;
  - spec-driven development preprints (arXiv 2602.00180, 2609.00252, 2604.05278);
  - an SSRN paper on implementation fidelity in LLM-generated code;
  - hyrumslaw.com (every fetch attempt failed).
- New candidate evidence read during retrieval but not yet registered: the Herbsleb & Grinter passage on what the interface specifications lacked, and the MetaGPT and ChatDev executability definitions. These were submitted to the lead and are not cited here.

## Bibliography

[1] [On the criteria to be used in decomposing systems into modules](https://doi.org/10.1145/361598.361623)
[18] [Software Engineering at Google, Chapter 1: What Is Software Engineering?](https://abseil.io/resources/swe-book/html/ch01.html)
[163] [Applying “Design by Contract”](https://doi.org/10.1109/2.161279)
[164] [How Do Committees Invent?](https://www.melconway.com/research/committees.html)
[165] [Splitting the Organization and Integrating the Code: Conway's Law Revisited](https://doi.org/10.1145/302405.302455)
[166] [How a Good Software Practice Thwarts Collaboration – The multiple roles of APIs in Software Development](https://doi.org/10.1145/1041685.1029925)
[167] [Socio-Technical Congruence: A Framework for Assessing the Impact of Technical and Work Dependencies on Software Development Productivity](https://doi.org/10.1145/1414004.1414008)
[168] [An Empirical Study of Speed and Communication in Globally Distributed Software Development](https://doi.org/10.1109/TSE.2003.1205177)
[169] [Retrospective: An Empirical Study of Speed and Communication in Globally Distributed Software Development](https://doi.org/10.1109/TSE.2025.3533977)
[170] [The mirroring hypothesis: theory, evidence, and exceptions](https://www.hbs.edu/ris/Publication%20Files/Colfer%20Baldwin%20Mirroring%20Hypothesis%20Ind%20Corp%20Change-2016_8aa320ff-6aa6-42ef-b259-d139012faaf6.pdf)
[171] [Consumer-Driven Contracts: A Service Evolution Pattern](https://martinfowler.com/articles/consumerDrivenContracts.html)
[172] [How Pact works](https://docs.pact.io/getting_started/how_pact_works)
[173] [FAQ | Pact Docs](https://docs.pact.io/faq)
[174] [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html)
[175] [To Mock or Not To Mock? An Empirical Study on Mocking Practices](https://doi.org/10.1109/MSR.2017.61)
[176] [Semantic Versioning 2.0.0](https://semver.org/)
[177] [AIP-180: Backwards compatibility](https://google.aip.dev/180)
[178] [Breaking bad? Semantic versioning and impact of breaking changes in Maven Central: An external and differentiated replication study](https://doi.org/10.1007/s10664-021-10052-y)
[179] [Microservice API Evolution in Practice: A Study on Strategies and Challenges](https://arxiv.org/html/2311.08175v1)
[180] [CodePlan: Repository-level Coding using LLMs and Planning](https://arxiv.org/abs/2309.12499)
[181] [MetaGPT: Meta Programming for a Multi-Agent Collaborative Framework](https://arxiv.org/abs/2308.00352)
[182] [ChatDev: Communicative Agents for Software Development](https://arxiv.org/abs/2307.07924)
[183] [Parsel: Algorithmic Reasoning with Language Models by Composing Decompositions](https://arxiv.org/abs/2212.10561)
[184] [Self-Organized Agents: A LLM Multi-Agent Framework toward Ultra Large-Scale Code Generation and Optimization](https://arxiv.org/abs/2404.02183)
[185] [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657)
[186] [Agentless: Demystifying LLM-based Software Engineering Agents](https://arxiv.org/abs/2407.01489)
[187] [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
[188] [Don’t Build Multi-Agents](https://cognition.com/blog/dont-build-multi-agents)
[189] [Multi-Agents: What's Actually Working](https://cognition.com/blog/multi-agents-working)
[190] [Verifying Coordination in Parallel Coding Agents: NP-Bench and a Scheduling Planner](https://arxiv.org/abs/2610.07261)
[191] [When Parallelism Pays Off: Cohesion-Aware Task Partitioning for Multi-Agent Coding](https://arxiv.org/abs/2606.00953)
[192] [Quantifying Overclaiming Propensity in Frontier LLM Agents](https://arxiv.org/abs/2609.20812)
