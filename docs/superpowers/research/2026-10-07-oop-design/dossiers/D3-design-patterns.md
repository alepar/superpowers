# Dossier D3: Do design patterns improve maintainability, and how should pattern use be judged?

## Summary

**Short answer (synthesis of the findings below; no new claims).** The retrieved evidence does not support a general claim that design patterns improve maintainability. Controlled experiments and their replications disagree pattern by pattern: the Observer and Visitor results flipped between the original experiment and a professional replication. A multi-site replication reconciled the results only through moderators, namely developer experience and pattern knowledge. Explicitly documenting pattern use is one of the more consistent positive results. In several mining studies, classes in patterns or anti-patterns are more change-prone, but class size (and, for effort, the number of changes) explains much of this. A controlled study that measured maintenance effort found no smell effect once file size and number of changes were controlled. The pattern authors' own text and the practitioner sources agree on two points: a pattern is justified by an actual need for the flexibility it buys, and several patterns shrink or vanish with first-class functions, sum types with pattern matching, or encoding states as types.

**Key uncertainty.** Effects depend on the pattern and on the maintainer. The experiments use small programs, short tasks, and partly student subjects. The mining studies are correlational. No retrieved study covers AI agents as maintainers. No retrieved study measures maintainability when a pattern is replaced by a language-native construct. Retrieval for this dossier is **partial** (see Methodological Limits).

## Facet Questions and Scope

<!-- facet: F4 -->
<!-- facet: F9 -->

- **F4 (GoF and common design patterns, anti-patterns, speculative generality).**
  - SQ1: Do patterns improve maintainability, and under which conditions (pattern type, documentation, developer knowledge, change type)?
  - SQ2: What is the evidence on overuse and misuse, and on anti-patterns or smells versus change- and fault-proneness, including the size and churn confounds?
  - SQ4: How can a reviewer tell pattern use driven by real design forces from pattern-name cargo cult?
  - SQ5: Which pattern-related review findings are material, and what evidence backs their cost?
- **F9, pattern slice only.**
  - Critiques of pattern overuse.
  - SQ3: language dependence, meaning which patterns disappear or simplify with first-class functions, closures, algebraic data types, pattern matching, or type-state encodings.
  - Other F9 material (duplication and wrong abstractions, inheritance and hierarchy critiques) belongs to other dossiers. Two such sources are cited here only where they bear directly on pattern use.
- **Source labels used below:**
  - primary-empirical: experiments, mining studies, surveys, reviews;
  - primary-theory: the pattern authors' own paper, Wadler's email, the EPFL technical report;
  - official docs: the Rust book;
  - practitioner: an interview, a book draft, a book excerpt, blog essays, a talk, a language architect's article;
  - secondary: one source reporting another.
- **Version-specific material is marked as such.** The Java article and the Rust book describe current APIs. The remaining language material is stable theory.

## Source Groups and Findings

### 1. Patterns versus simpler alternatives: controlled experiments (SQ1)

**Original maintenance experiment (Prechelt, Unger, Tichy, Brössler and Votta, IEEE TSE 2001; primary-empirical; author preprint).**

- The original maintenance experiment used 29 professional software engineers who had worked as software professionals for 4.1 years on average and had 2.4 years of average C++ experience [249]. <!-- claim: 3db0ac4f981df8d5; evidence: 6bec22ff57009570; source: 971acbc742b26220 -->
- The experiment found positive effects from using a design pattern in most of its nine maintenance tasks, either additional flexibility achieved without requiring more maintenance time or reduced maintenance time, and negative effects in a few cases where the alternative solution was less error-prone or required less maintenance time [249]. <!-- claim: dcc2b7b499292d80; evidence: 20eba34c064405d0; source: 971acbc742b26220 -->

*Observer (stock-ticker program, where the tasks did not need dynamic registration):*

- The simpler alternative version contained an instance variable for each display and updated the displays when the data changed, with no dynamic registration of observers implemented [249]. <!-- claim: 277ee92ef4490b83; evidence: a76dbde4fc9fe78f; source: 971acbc742b26220 -->
- The pretest subjects given the pattern version required more than twice as much time as those given the simpler version (151% more time, 46.6 minutes vs. 18.5 minutes, p < 0.001) [249]. <!-- claim: 14c15a4c734b0a1c; evidence: 2650d4cdac5c946e; source: 971acbc742b26220 -->
- The posttest subjects with the pattern version still required 23% more time than the alternative group (20 minutes vs. 16.2 minutes, p = 0.023), and the authors concluded that for this application and this type of maintenance task the Observer pattern may be harmful [249]. <!-- claim: aa8e477e36781cee; evidence: 417dcfb97a2f6018; source: 971acbc742b26220 -->

*Decorator (communication-channel program):*

- The pattern groups were significantly faster than the alternative groups on this change (38% faster, 28.8 minutes vs. 46.2 minutes, p < 0.001), and the authors judged the pattern solution clearly preferable [249]. <!-- claim: 569280840618514f; evidence: 8c23242b0c4065d9; source: 971acbc742b26220 -->
- The pattern solution was also superior in correctness: errors were made by 7 out of 8 pretest and 6 out of 7 posttest subjects using the alternative, while no errors occurred in the pattern group [249]. <!-- claim: 22ee5074efc21c17; evidence: 933b1aeffd7100ac; source: 971acbc742b26220 -->
- The alternative group was, however, significantly faster when creating the channel object (53% faster, 3 minutes vs. 6.4 minutes, p < 0.001), with 6 wrong solutions out of 14 for the pattern group and none for the alternative, a problem the authors say a suitable convenience method could overcome without changing the overall design [249]. <!-- claim: eeb578789e36df57; evidence: 9a8e34e6a642c9f2; source: 971acbc742b26220 -->

*Visitor and Abstract Factory:*

- The authors read the Visitor result as showing that an unrequired Visitor is not necessarily harmful, while noting that the data are not quite conclusive [249]. <!-- claim: 57238c178358e109; evidence: 34c292170c086030; source: 971acbc742b26220 -->
- The program combining Composite and Abstract Factory had two structurally similar versions, and only small differences were found, as expected [249]. <!-- claim: 92049e4d7f5b23f4; evidence: d25dadd4855528e2; source: 971acbc742b26220 -->

*Authors' lessons:*

- The authors' lessons were that using a design pattern where simpler alternatives exist is usually but not always useful, that software engineering common sense must find the exceptions, and that a thorough understanding of specific design patterns often helps maintainers [249]. <!-- claim: c25153c4caa47edb; evidence: 8034b7aafe9e7ab5; source: 971acbc742b26220 -->

**Professional replication in a real programming environment (Vokáč, Tichy, Sjøberg, Arisholm and Aldrin, Empirical Software Engineering 2004; primary-empirical).**

- The replication used 44 paid, professional subjects working on the same programs in a real programming environment instead of pen and paper [251]. <!-- claim: f237a93daa0fd6bd; evidence: 65f3f9894b1559e9; source: 43f31e3f79053477 -->
- The replication found that some patterns are much easier to understand and use than others: the Visitor pattern caused much confusion, while Observer and, to a certain extent, Decorator were grasped and used intuitively even by subjects with little or no knowledge of patterns [251]. <!-- claim: b87d0307ea854794; evidence: 61f12e3b8534c013; source: 43f31e3f79053477 -->
- The Visitor pattern, with its fairly complicated structure, extracted a high cost in development time and poor correctness in the replication, and many subjects ignored it even when presented with documented template solutions that used it [251]. <!-- claim: e65581d5b40f0668; evidence: d95d67f426d39197; source: 43f31e3f79053477 -->
- The replication authors concluded that design patterns are not universally good or bad but must be used in a way that matches the problem and the people, and that with documented patterns even basic training can improve the speed and quality of maintenance [251]. <!-- claim: 45369a72b0b1be03; evidence: c5e69153b63ec3a6; source: 43f31e3f79053477 -->

**Multi-site joint replication with moderator analysis (Krein, Prechelt, Juristo et al., IEEE TSE accepted manuscript; primary-empirical).**

- A later multi-site joint replication starts from the observation that the collective results of empirical design pattern studies are highly inconsistent and that resolving the inconsistencies requires investigating moderators [252]. <!-- claim: 924f4964680ee64a; evidence: 066f104a45f872db; source: d08b092a935b7730 -->
- The joint replication found that the main effect differed across earlier instances of the experiment and across its sites, and that moderators, including developer experience and pattern knowledge, resolved the differences enough for conclusions that represent 126 participants from five universities and twelve software companies [252]. <!-- claim: 42caf030b8d5e072; evidence: 5352b816d913ee76; source: d08b092a935b7730 -->
- The joint replication concluded that the Decorator pattern is preferable to a simpler solution during maintenance as long as the developer has at least some prior knowledge of the pattern, and that for Abstract Factory the simpler solution is mostly equivalent to the pattern solution [252]. <!-- claim: e41906898dfb4ab5; evidence: 73b19bb7e2d18cc8; source: d08b092a935b7730 -->
- Abstract Factory was shown to require a higher level of knowledge and/or experience than Decorator for the pattern to be beneficial [252]. <!-- claim: 5471ac459c7b4e9c; evidence: c5111fbb49a255c9; source: d08b092a935b7730 -->
- The moderator analysis found that developer experience and pattern knowledge both moderate the effect of design patterns, with a higher level of either tending to enhance the benefits of patterns or reduce their harm during maintenance [252]. <!-- claim: bb95a02480619156; evidence: da87593d776f2d9a; source: d08b092a935b7730 -->

### 2. Documenting pattern use (SQ1)

**Documentation experiments (Prechelt and Unger, Softwaretechnik '98 summary paper; primary-empirical; student subjects).**

- The documentation experiments compared the speed and correctness of maintenance on pairs of programs with identical code, one documenting its use of design patterns and the other with the pattern documentation removed [250]. <!-- claim: 60ef8b5b7defa361; evidence: 94cd4fe6b62fe3f8; source: 61bfc83061be4a1a -->
- The subjects were the best 58 of about 100 participants in a graduate Java lab course and, in the repetition, 22 participants of an undergraduate course on C++ and design patterns [250]. <!-- claim: 962b3380864bfca7; evidence: ff16a4864ed01b31; source: 61bfc83061be4a1a -->
- For the program involving an Observer pattern, the group with pattern documentation was much faster than the other group in experiment 1a [250]. <!-- claim: 93d195b5a54273f4; evidence: bc04ecb04c136f63; source: 61bfc83061be4a1a -->
- For the program involving a Composite and a Visitor pattern, the group with pattern documentation either had far fewer errors or required less time, and these differences are statistically significant [250]. <!-- claim: 821c3072f03d170a; evidence: bc04ecb04c136f63; source: 61bfc83061be4a1a -->
- The authors concluded that carefully documenting pattern usage is highly recommendable because it pays off well during maintenance [250]. <!-- claim: ef77d000c34a5ea9; evidence: 370ba40828c96ffa; source: 61bfc83061be4a1a -->

### 3. Systematic reviews, surveys, and observational studies (SQ1)

**Mapping study (Zhang and Budgen, IEEE TSE 2012; read from the abstract only).**

- The mapping study identified 611 candidate papers, of which 10 papers describing 11 formal experimental studies of object-oriented design patterns met its criteria, and it added seven experience reports using less rigorous observational forms [253]. <!-- claim: bd3ed00b84110577; evidence: 68e8b705f3800be5; source: 63e3bdac7fabdf5c -->
- The mapping study could not identify firm support for any of the claims made for patterns in general, although there was some support for the usefulness of patterns in providing a framework for maintenance and some qualitative indication that they do not help novices learn about design [253]. <!-- claim: c7eb049990df2ad5; evidence: a362566f0be80a4c; source: 63e3bdac7fabdf5c -->
- The same authors later wrote that generic claims about the value of design patterns were inappropriate and that each pattern should be assessed separately to determine its usefulness to different groups and in different phases of software development [254]. <!-- claim: dce2b23c3fa40d77; evidence: 7883b87798fe5cc7; source: d5f22bc1f2db40aa -->

**Survey of experienced pattern users (Zhang and Budgen, IST 2013; perception data).**

- The follow-up survey of experienced pattern users received 206 usable responses, a response rate of 19%, mostly from people involved with software development rather than maintenance [254]. <!-- claim: ec0bc2f8e5562382; evidence: cdfc37479c0a09e2; source: d5f22bc1f2db40aa -->
- The survey found that only three patterns were widely regarded as valuable and that around one quarter of the patterns gained very low approval or worse [254]. <!-- claim: 09d8827d80497dc6; evidence: b685a109c26e95c2; source: d5f22bc1f2db40aa -->
- The three patterns highly regarded with few caveats about their use were Observer, Composite and Abstract Factory [254]. <!-- claim: 8fae899bad383362; evidence: 46c4946e4ff1328d; source: d5f22bc1f2db40aa -->

**Systematic review (Wedyan and Abufakher, IET Software 2020; read from the abstract only).**

- The later systematic review identified 804 candidate papers, retained 50 primary studies, and reports that documentation of patterns, size of pattern classes, and the scattering degree of patterns have clear impact on quality [255]. <!-- claim: 92c683f6d1b2897b; evidence: 19dc3c80eea5fdd6; source: d4f13e8b253b67d0 -->
- That review describes the evaluations of pattern impact on quality attributes as using different perspectives, objectives, metrics, and quality attributes, leading to contradictive and hard to compare results [255]. <!-- claim: bfecdbffa34a36bf; evidence: 82f4c2dd1dedd689; source: d4f13e8b253b67d0 -->

**Questionnaire study (Khomh and Guéhéneuc, CSMR 2008; perception data).**

- The questionnaire study selected the answers of 20 software engineers with verifiable experience in the use of design patterns, who assessed each pattern's impact on a system in which the pattern would be used appropriately [256]. <!-- claim: 78196d13a9446362; evidence: bf8bb6dc3b80d5c6; source: 305c034b546d9d68 -->
- The respondents considered that patterns, although useful to solve design problems, do not always improve the quality of the systems in which they are applied, and many considered that they decrease simplicity, learnability, and understandability [256]. <!-- claim: 6be2cfe99b4b5301; evidence: fbbce96fdcc8e2d4; source: 305c034b546d9d68 -->

**Single-system metric study (Hegedűs, Bán, Ferenc and Gyimóthy, 2012).**

- A study of one system's revision history found that every introduced pattern instance caused an improvement in the different quality attributes and that the average design pattern line density had a 0.89 Pearson correlation with the estimated maintainability values [257]. <!-- claim: 86b5f9cb0facb191; evidence: 851432fe4ddb4f70; source: 6de69ab3e7531c1c -->

**Wendorff 2001, the industrial report on pattern overuse (secondary reports only; full text not retrieved).**

- A later replication paper reports that Wendorff found the uncontrolled use of patterns caused severe maintenance problems in their case [252]. <!-- claim: f66df7009db5dadf; evidence: a36672819121e49e; source: d08b092a935b7730 -->
- The questionnaire paper summarizes Wendorff as concluding that patterns do not necessarily improve the design of large commercial systems, that a design can be over-engineered and the cost of removing patterns is high, and notes that he provided only qualitative arguments [256]. <!-- claim: 6194ee1a7f882464; evidence: c3d4d4dcdfe9937a; source: 305c034b546d9d68 -->

### 4. Change- and fault-proneness of pattern and anti-pattern classes, and the size and churn confound (SQ2)

**Classes playing pattern roles (Bieman et al., 2003; Posnett, Bird and Devanbu, EMSE 2011; primary-empirical).**

- A study of five evolving systems found pattern classes more rather than less change prone in four of them and less change prone in one, results that held up after normalizing for the effect of class size [258]. <!-- claim: a795ef07faed670c; evidence: cb7082302f2f58ce; source: d641f866e8ae3573 -->
- The authors note that the data do not show that design patterns support adaptability and suggest that pattern participant classes provide key functionality, which may explain why these classes are modified relatively often [258]. <!-- claim: c1cdc3296ade4a29; evidence: 53cdc20e2f2c240b; source: d641f866e8ae3573 -->
- A later study found that class size explains more of the variance in change-proneness than design pattern or metapattern roles, that those roles were strong determinants of size, and that observed differences in change-proneness between roles might be due to the sizes of the classes playing them [259]. <!-- claim: 8021010181cb22d7; evidence: 83429bc5a96b2b2b; source: 11fd3d539e538180 -->

**Anti-patterns (Khomh, Di Penta, Guéhéneuc and Antoniol, EMSE 2012; primary-empirical; author preprint).**

- The anti-pattern study detected 13 antipatterns in 54 releases of ArgoUML, Eclipse, Mylyn, and Rhino and analysed whether participating classes had higher odds to change or to be subject to fault-fixing and whether class size explained those odds [260]. <!-- claim: 2ec216bb695d9b61; evidence: 9645ff2a72771174; source: 7e19cb78d0afe232 -->
- The study showed that, in almost all releases of the four systems, classes participating in antipatterns are more change- and fault-prone than others and that size alone cannot explain their higher odds of a (fault-fixing) change [260]. <!-- claim: 6b1faf2d72348b63; evidence: 4821ac4d381b5633; source: 7e19cb78d0afe232 -->
- The relation held for some kinds of antipatterns but not for all and not consistently across systems and releases, and only MessageChain had a significant impact on change-proneness in all systems [260]. <!-- claim: 04e9539afce84ffc; evidence: ea999e926b225403; source: 7e19cb78d0afe232 -->
- MessageChain describes a class whose functionality requires a long chain of method invocations between objects of different classes, conjectured to impact change- and fault-proneness because of the high number of indirections [260]. <!-- claim: 7c77e33b6e044118; evidence: e8c263d4ddb4e1d5; source: 7e19cb78d0afe232 -->
- The study operationalized speculative generality as a class that is defined as abstract but has very few children, which do not make use of its methods [260]. <!-- claim: 573e4a0754a5b383; evidence: e332fb9b912ada4e; source: 7e19cb78d0afe232 -->
- The per-kind analysis found speculative generality significantly related to change-proneness in only 3 (23%), 6 (33%) and 1 (8%) of the releases of three systems, with a dash for the fourth [260]. <!-- claim: b00d4fa0e22b50ed; evidence: 189d26afcf0c07a5; source: 7e19cb78d0afe232 -->
- The same study describes a lazy class, with few methods and fields of little complexity, as often stemming from speculative generality during system design or implementation [260]. <!-- claim: 4ec7be46f58f4b53; evidence: d00a81287f343415; source: 7e19cb78d0afe232 -->

**Smells versus measured maintenance effort, with size and churn controlled (Sjøberg, Yamashita, Anda, Mockus and Dybå, IEEE TSE 2013; primary-empirical).**

- The controlled smell study hired six developers to perform three maintenance tasks each on four functionally equivalent Java systems, modifying 298 Java files while an IDE plug-in measured the time spent maintaining each file [67]. <!-- claim: 9c78ff73f61cd9ac; evidence: e150869dc522217c; source: 167f187364b4db61 -->
- None of the 12 investigated smells was significantly associated with increased effort after adjusting for file size and the number of changes, Refused Bequest was significantly associated with decreased effort, and file size and the number of changes explained almost all of the modeled variation in effort [67]. <!-- claim: f8677ee763f4f7b1; evidence: 65543dea9c2bf467; source: 167f187364b4db61 -->
- The significant effect for God Classes disappeared when the analysis adjusted for file size [67]. <!-- claim: 936ff4d1406a308d; evidence: ea075b397e05a79f; source: 167f187364b4db61 -->
- The authors observe that many code smell studies did not account for the size of the software unit and recommend using a measure of size as a covariate to determine the incremental effect of a code smell or any other code metric [67]. <!-- claim: cacadb332782002f; evidence: 4aa6b19516f72458; source: 167f187364b4db61 -->

**Large-scale smell mining with size modelled (Palomba et al., EMSE 2018; primary-empirical; author preprint).**

- A larger study of 395 releases of 30 open source projects with 17,350 manually validated smell instances found that smelly classes have a higher change- and fault-proneness than smell-free classes [69]. <!-- claim: 8b1abc9eaee98b4b; evidence: 6fad1971b092edfd; source: 1dac8b1eb8d19622 -->
- The regression with size and a smell-by-size interaction found that the presence of code smells is significantly related to increased change-proneness, while size also affects change-proneness to a lower extent and the interaction of smell presence and size has a strong impact on it [69]. <!-- claim: e94f503c0d848e45; evidence: 33668e5788fa134b; source: 1dac8b1eb8d19622 -->
- The fault-proneness model found only the interaction between the independent variables statistically significant, which the authors read as showing that code smells are not necessarily the direct cause of class fault-proneness [69]. <!-- claim: 0e9a601e7222ed5f; evidence: 355911a874a0fd9e; source: 1dac8b1eb8d19622 -->
- That study detected speculative generality as an abstract class with fewer than three children classes using its methods, found that it affected 80% of the releases, and rated its removal effect as high on change-proneness and limited on fault-proneness [69]. <!-- claim: 1908a5ca2f380dfb; evidence: 9c3fd60e5d0093c6; source: 1dac8b1eb8d19622 -->

### 5. Pattern use driven by forces versus pattern-name cargo cult (SQ4)

**The pattern authors' own definition and caveats (Gamma, Helm, Johnson and Vlissides, ECOOP '93; primary-theory).** This paper stands in for the 1994 book, which was not readable in this run.

- The original pattern catalogue authors list among a pattern's essential parts the design issue that determines the circumstances in which the design pattern is applicable and the consequences that determine if the pattern should be applied in view of other design constraints [261]. <!-- claim: 40a334a1f8e1e376; evidence: ff8f83fa0a2e47b3; source: bf1ef2949b3ca4da -->
- The same authors warn that design patterns should not be applied indiscriminately because they typically achieve flexibility and variability by introducing additional levels of indirection that can complicate a design, and that a design pattern should only be applied when the flexibility it affords is actually needed [261]. <!-- claim: f106f9b385a24a43; evidence: 2a6b80da183c0188; source: bf1ef2949b3ca4da -->
- The template's Applicability section asks in which situations the design pattern can be applied, which poor designs it can address, and how one can recognize these situations [261]. <!-- claim: d1f4bff909c5cbbb; evidence: 50cd5dc5365a2f29; source: bf1ef2949b3ca4da -->
- The template's Consequences section asks what the trade-offs and results of using the pattern are and what aspect of system structure it allows to be varied independently [261]. <!-- claim: b3b02df205611161; evidence: 15be1aad67c05176; source: bf1ef2949b3ca4da -->
- The authors also caution that one is tempted to brand any new programming trick a new design pattern and state that a true design pattern will be non-trivial and will have had more than one application [261]. <!-- claim: 4d66549cb38dbed7; evidence: d63590eac4242afa; source: bf1ef2949b3ca4da -->
- The authors frame design around the question of what aspect of a design should be variable, whose answers lead to certain applicable design patterns [261]. <!-- claim: 299b8b69032a2761; evidence: 839a345ef4bfa8df; source: bf1ef2949b3ca4da -->

**Interview with the catalogue's first author (Erich Gamma with Bill Venners, Artima 2005; practitioner).**

- The catalogue's first author, interviewed in a practitioner venue, advises against immediately throwing patterns into a design and prefers to use patterns after the fact, refactoring to patterns [262]. <!-- claim: ae2613df90ad1631; evidence: 7dfe992868b3a0a5; source: ec3a40d9899b9776 -->
- The interview calls trying to use all the patterns a bad thing because it produces synthetic, speculative designs that have flexibility no one needs [262]. <!-- claim: 9cbc2d18bf4636c5; evidence: 3f16bce725fa5f2b; source: ec3a40d9899b9776 -->
- The interview ties patterns to a real need for extensibility and advises keeping the design simple, without unnecessary levels of indirection, when extensibility is not needed [262]. <!-- claim: 804841750c9c8163; evidence: d49e1b554663f99f; source: ec3a40d9899b9776 -->
- The interviewee also said he would not use pattern density around a central abstraction as a quality criterion [262]. <!-- claim: d920e27fb1439ee8; evidence: 6312fe97ea0eaeb1; source: ec3a40d9899b9776 -->
- The interviewee credits patterns with explaining why there is a link between two classes, as when one observes the other, and calls patterns a language to talk about design [262]. <!-- claim: b02cefeb30adec83; evidence: 60d7aec585958820; source: ec3a40d9899b9776 -->

**Refactoring to patterns (Kerievsky, introduction of the 2002 pre-publication draft; practitioner).**

- A practitioner draft of the refactoring-to-patterns book recounts racing toward implementing the Strategy pattern when a simple conditional expression would have been simpler and faster to program and a perfectly sufficient solution [263]. <!-- claim: a3c7eca7a6000de2; evidence: 0a79a069dfa40511; source: 302c2a510a33668c -->
- The draft argues that over-engineered code affects productivity because someone who inherits an over-engineered design must spend time learning its nuances before they can comfortably extend or maintain it [263]. <!-- claim: ceb56fd2b732e011; evidence: e6a5114300796a54; source: 302c2a510a33668c -->
- The draft also observes that the motivation for refactoring to Decorator in a testing framework was reducing code duplication, which had very little connection with Decorator's Intent or Applicability [263]. <!-- claim: 9a3f824aece036b7; evidence: 6c34c8e370e23b62; source: 302c2a510a33668c -->

**Speculative Generality (Fowler and Beck, Refactoring 2nd edition, 2018, publisher excerpt; practitioner).**

- The refactoring book describes a smell that arises when people think they will need the ability to do something someday and add hooks and special cases to handle things that aren't required, a result that is often harder to understand and maintain [264]. <!-- claim: 7de459856ea6aa43; evidence: 168aaf8c5231e944; source: 4d2a104508a3d2d6 -->
- The listed remedies include collapsing abstract classes that aren't doing much, inlining unnecessary delegation, and, when the only users of a function or class are test cases, deleting the test case and removing the dead code [264]. <!-- claim: b4ea2f0f11e37b7e; evidence: d5cbf74f9f8017cd; source: 4d2a104508a3d2d6 -->

**YAGNI (Fowler, bliki "Yagni"; practitioner).**

- The YAGNI article does not ask to forego all abstractions but holds that any abstraction that makes it harder to understand the code for current requirements is presumed guilty [265]. <!-- claim: 0ca387327a65ca99; evidence: c838e73499e2a70a; source: a2e9fbf9eabff708 -->
- The article argues that the code for a presumptive feature adds complexity that makes the software harder to modify and debug, increasing the cost of other features [265]. <!-- claim: 67c9c3b3ef7d5e49; evidence: e2b221cf5bc0ef87; source: a2e9fbf9eabff708 -->
- The same article limits YAGNI to capabilities built to support a presumptive feature, not to effort that makes the software easier to modify, and says there is no reason to invoke it for future-oriented work that does not increase the complexity of the software [265]. <!-- claim: 1dcd5329c67ec32f; evidence: 7162c682358cf07b; source: a2e9fbf9eabff708 -->
- The article concedes that applying YAGNI sometimes causes a problem, an expensive change where an earlier change would have been much cheaper, and that such cases are hard to spot in advance [265]. <!-- claim: c01e9bb85b522ba8; evidence: 03767a4acb1c094f; source: a2e9fbf9eabff708 -->
- The article suggests asking developers to imagine the refactoring they would have to do later to introduce the capability when it is needed [265]. <!-- claim: 986c9fe0b0cd90d6; evidence: 53b730f7c8883d9f; source: a2e9fbf9eabff708 -->

**When an abstraction has turned out wrong (Metz, "The Wrong Abstraction"; practitioner).** This source sits in the duplication slice of F9.

- A practitioner essay holds that passing parameters and adding conditional paths through shared code shows the abstraction is incorrect, and that once an abstraction is proved wrong the best strategy is to re-introduce duplication [81]. <!-- claim: 4b02e9dbbf78b0cb; evidence: 33c63b79edd6021a; source: d2ed8622dde5741c -->

The "rule of three" from Fowler's Refactoring is unverified here: only third-party copies of the passage were found, and none was fetched.

### 6. Language dependence: which patterns disappear or simplify (SQ3)

*Stable theory:*

**Norvig, "Design Patterns in Dynamic Programming" (Object World talk slides, 1996; practitioner).**

- A practitioner talk on dynamic languages reports that 16 of 23 catalogued patterns have qualitatively simpler implementations in Lisp or Dylan than in C++ for at least some uses of each pattern [266]. <!-- claim: 6258bceb504c4b5c; evidence: 08a47b05a4b5cb7b; source: b8289846e424d683 -->
- The talk attributes this to first-class types, first-class functions, macros, method combination, multimethods and modules, with Command, Strategy, Template-Method and Visitor listed under first-class functions [266]. <!-- claim: d33aa793777e7c23; evidence: 332e705e574087cb; source: b8289846e424d683 -->
- The talk's general principle is that there is no need for separate classes that differ in one or a few well-understood ways, while strategy objects may still be wanted [266]. <!-- claim: 60d30ca2e802cffd; evidence: 1e486f33fbf0de50; source: b8289846e424d683 -->
- The talk notes that runtime type objects can serve as factories, removing the need for a dual factory/product hierarchy, while factory-like objects may still be wanted to bundle classes [266]. <!-- claim: a8cc6424c07185d7; evidence: 40daf807c63acc19; source: b8289846e424d683 -->
- The talk characterizes the Visitor pattern as serving only to get around a restriction of C++, which encourages bookkeeping classes [266]. <!-- claim: 7203690cbfe059e5; evidence: feabbe4c2077ef6e; source: b8289846e424d683 -->
- The talk lists among the purposes of design patterns both to discuss, weigh and record design tradeoffs and to avoid limitations of the implementation language [266]. <!-- claim: 61597fd4e71c61a6; evidence: d1a3ff9979f61ff8; source: b8289846e424d683 -->

**The pattern authors' template.**

- The original pattern template itself asks, under Implementation, what pitfalls, hints, or techniques one should be aware of and whether there are language-specific issues [261]. <!-- claim: c14088179751842c; evidence: 8afc9c13260c6ef3; source: bf1ef2949b3ca4da -->

**The expression problem (Wadler, 1998 email; primary-theory).**

- The expression problem email states that in a functional language it is easy to add new functions over fixed datatype cases, while in an object-oriented language it is easy to add new subclasses over fixed methods [42]. <!-- claim: 00912882f93f2232; evidence: 4f96db0841555d8b; source: 38885c763a2849ea -->

*Version-specific:*

**Java (Goetz, "Data Oriented Programming in Java", InfoQ; practitioner, written by Java's language architect).** The article uses records, sealed classes, and pattern matching. Which Java release made each feature final (as opposed to preview) was not verified in this run, so check the target JDK before relying on it.

- The data-oriented programming article states that before records and pattern matching the standard approach to such code was the visitor pattern, and that pattern matching is more concise and also more flexible and powerful, while visitors require the domain to be built for visitation [54]. <!-- claim: ecd4e57ee2e7db42; evidence: 2dff16c2d3395cb3; source: fca3270a0a9125ef -->
- The same article says OOP is at its best when defining and defending boundaries and that the techniques of OOP and data-oriented programming are not at odds but are different tools for different granularities and situations [54]. <!-- claim: 9c5e6b4431fddb34; evidence: 79bc234b101809f5; source: fca3270a0a9125ef -->

**Rust (official book, chapter 18.3 "Implementing an Object-Oriented Design Pattern"; official docs, live version read on 2026-10-07; chapter numbering differs between book editions).**

- The official Rust book says that implementing the state pattern exactly as defined for object-oriented languages is not taking full advantage of Rust's strengths and reworks the example so that invalid states and transitions become compile-time errors [267]. <!-- claim: 4eda8ef371aa3ec7; evidence: 1d8914115e24e169; source: 88fd0eb5927d1f08 -->
- The book also notes that because the states implement the transitions between states, some states are coupled to each other, so adding another state between two existing ones requires changing an existing state's code [267]. <!-- claim: f1fb9233806ae5f7; evidence: e43535fe950ee7be; source: 88fd0eb5927d1f08 -->
- The book concludes that object-oriented patterns won't always be the best solution in Rust due to features, like ownership, that object-oriented languages don't have [267]. <!-- claim: 841ad2debfc2e94f; evidence: 2b4dc950644a46df; source: 88fd0eb5927d1f08 -->
- The book's summary adds that dynamic dispatch gives code some flexibility in exchange for a bit of runtime performance, flexibility usable to implement object-oriented patterns that can help maintainability [267]. <!-- claim: ebc4dcc0ca591690; evidence: 92eb78071b84f2ab; source: 88fd0eb5927d1f08 -->

**Function parameters instead of class hierarchies (Kapser and Godfrey clone study; primary-empirical).** This source sits in the duplication slice of F9 and is cited here for the remedy it names.

- In a clone study, parameterized code clones were considered harmful 76% of the time in the small-clone sample and 71% in the large-clone sample, and in nearly all of these cases passing a function pointer as an argument to a single function would remove many of the clones [79]. <!-- claim: a99272ac60f7d076; evidence: 3f3e85bd383063a2; source: b496c304aaab8013 -->

### 7. Pattern costs that matter for review (SQ5)

**Singleton and mutable global state.**

- The survey's participants considered the pattern to be massively misused and overused to provide global variables in a system, although it is valued for some benefits [254]. <!-- claim: b26069b8662a2007; evidence: c7fecd4f6ab590ba; source: d5f22bc1f2db40aa -->
- The survey also quotes a single developer who found it extremely painful to retrofit unit tests in a project because of the singletons [254]. <!-- claim: 0cd6581d8580084f; evidence: e142f0a4e6d99a72; source: d5f22bc1f2db40aa -->
- The anti-pattern study's AntiSingleton, a class providing mutable class variables that could be used as global variables, was significantly more change-prone in 8 (80%), 5 (38%) and 7 (39%) of the releases of three systems, with a dash for the fourth [260]. <!-- claim: 0f3b180a160cece3; evidence: 0807581b0d629ac7; source: 7e19cb78d0afe232 -->
- The null hypothesis of no fault-proneness relation was rejected for MessageChain in Eclipse and Rhino and for AntiSingleton only in Eclipse [260]. <!-- claim: c971cee56374ea7d; evidence: 0a86813f959053ca; source: 7e19cb78d0afe232 -->
- A flaky-test study found that 19 out of 161 (12%) categorized fix commits belonged to test order dependency, which arises when tests depend on a shared state that is not properly set up or cleaned [270]. <!-- claim: efad291c25f0e09f; evidence: 9af1a977981e9992; source: 9fd5598aaa0b1b41 -->
- Of the 19 order-dependent flaky tests, 6 involved a shared static field declared in the code under test, while more than half were caused by an external dependency [270]. <!-- claim: c2420a949882e134; evidence: afce00f3886a3f66; source: 9fd5598aaa0b1b41 -->
- Most order-dependent flaky tests (74%) were fixed by cleaning the shared state between test runs [270]. <!-- claim: 361387853928d012; evidence: 62a83a29039684a2; source: 9fd5598aaa0b1b41 -->
- A secondary report of an industrial defect study states that Singleton and Observer tend to indicate more complex parts of the code than other patterns such as Factory [257]. <!-- claim: 3964467ce5471f3b; evidence: 5af3a37701c7fd60; source: 6de69ab3e7531c1c -->

**Observer chains and inverted control flow.**

- A technical report on deprecating the observer pattern argues that the pattern in general violates an impressive line-up of important software engineering principles [268]. <!-- claim: e9195015a5a9b793; evidence: 39e9843f59a5705d; source: dc7e6612035b98f5 -->
- The report argues that observer-based code is hard to understand because the control flow is inverted, which results in boilerplate code that increases the semantic distance between the programmer's intention and the actual code [268]. <!-- claim: dab8ffc2f2f91b51; evidence: b666a7c4310d9854; source: dc7e6612035b98f5 -->
- The report also argues that there is no guarantee for data consistency in the observer pattern, so that a user could observe a glitch such as a frame on the screen with the wrong size [268]. <!-- claim: 3c13120efbe99967; evidence: 2376cc2d0f0e6085; source: dc7e6612035b98f5 -->
- The report quotes an industry presentation stating that one third of the code in Adobe's desktop applications is devoted to event handling logic and that half of the bugs reported during a product cycle exist in this code [268]. <!-- claim: 214c10bfb06ce734; evidence: 8c2a15bef3f2aaa0; source: dc7e6612035b98f5 --> (This is a secondary, second-hand industry figure that was not verified in this run.)
- The comprehension experiment's authors note that observers are decoupled from observables but that program readability does not get easier because of dynamic registration, side effects in callbacks, and inversion of control [269]. <!-- claim: a9feab3971f0d896; evidence: 663dd46aea36a8ea; source: 10a03625eb754637 -->
- The comprehension experiment involved 38 subjects divided into a reactive programming group and an object-oriented group [269]. <!-- claim: 3d5074fe20ae2fa0; evidence: dd1845c0536bf2e7; source: 10a03625eb754637 -->
- The reactive programming group provided more correct results than the object-oriented group while not requiring more time, and understanding the reactive programs required less programming skill [269]. <!-- claim: 69ce31a2672b8443; evidence: f124c074dc6c9145; source: 10a03625eb754637 -->

**Long chains of indirection, and Visitor where pattern matching exists.**

- MessageChain evidence is in group 4. The Visitor cost evidence is in group 1 (professional replication) and group 6 (Java article).

## Counterevidence and Disagreements

**Observer.** The results disagree. The original experiment, the professional replication, the experienced-user survey, and a comprehension experiment point in different directions:

- The original experiment had concluded that for its application and type of maintenance task the Observer pattern may be harmful [249]. <!-- claim: 5d8d9d8a26158875; evidence: 417dcfb97a2f6018; source: 971acbc742b26220 -->
- The professional replication reports that its results differ from the original experiment especially for Visitor and Observer and that it observed no significant harm from using the Observer pattern [251]. <!-- claim: f9e8b26aeb24ace0; evidence: 6fd6a05bb6c90a5c; source: 43f31e3f79053477 -->
- The experienced-user survey nevertheless places Observer among the three patterns that are highly regarded with few caveats [254]. <!-- claim: e93f8f71d895e793; evidence: 46c4946e4ff1328d; source: d5f22bc1f2db40aa -->
- The comprehension experiment, by contrast, found that a reactive programming group provided more correct results than an object-oriented group without requiring more time [269]. <!-- claim: ac9f528aa79a0359; evidence: f124c074dc6c9145; source: 10a03625eb754637 -->

**Visitor.**

- The original experiment found an unrequired Visitor not necessarily harmful while calling the data not quite conclusive [249]. <!-- claim: 33bf5352dbe1d956; evidence: 34c292170c086030; source: 971acbc742b26220 -->
- The replication found that, unlike in the original, few of its subjects achieved a good solution with the Visitor even after the course [251]. <!-- claim: 17ffbe17b2f755f5; evidence: 6fd6a05bb6c90a5c; source: 43f31e3f79053477 -->

**"When in doubt, use the pattern" versus "only when needed".**

- The original experiment's authors recommend choosing the flexibility of the design pattern unless there is a clear reason to prefer the simpler solution, because unexpected new requirements often occur, while noting that this aspect was deliberately ignored in their experiment [249]. <!-- claim: c1d061b99cc5bc8b; evidence: 2d5d8a51c2e6c399; source: 971acbc742b26220 -->
- The pattern catalogue's authors, by contrast, say a design pattern should only be applied when the flexibility it affords is actually needed [261]. <!-- claim: fa26c11eeb85718b; evidence: 2a6b80da183c0188; source: bf1ef2949b3ca4da -->
- The first author's interview likewise advises keeping a design simple when extensibility is not needed [262]. <!-- claim: 8a9709ffe17222dd; evidence: d49e1b554663f99f; source: ec3a40d9899b9776 -->
- The joint replication found that using a pattern where a simpler solution would be possible can be advantageous during maintenance, but only if the developer performing the maintenance has a sufficient understanding of the pattern [252]. <!-- claim: 7124a2c96347d51d; evidence: ecae91f9c97b0a06; source: d08b092a935b7730 -->

**Do smells and anti-patterns cause maintenance cost?**

- The two mining studies report that classes participating in antipatterns or smells are more change- and fault-prone than other classes [260, 69]. <!-- claim: bbc8f96c0563f1d7; evidence: 4821ac4d381b5633; source: 7e19cb78d0afe232 -->
- The controlled effort study, in contrast, found none of the 12 investigated smells significantly associated with increased effort once file size and the number of changes were adjusted for [67]. <!-- claim: 1ad53999166f0cc7; evidence: 65543dea9c2bf467; source: 167f187364b4db61 -->
- The effort study's authors conclude that refactoring classes with the 12 investigated code smells is unlikely to reduce effort [67]. <!-- claim: dae5db187cc8e964; evidence: b50f31fcc79fae94; source: 167f187364b4db61 -->
- The large mining study itself found the fault-proneness relation only through the interaction of smell presence and size and states that code smells are not necessarily the direct cause of class fault-proneness [69]. <!-- claim: 454baaeec560d534; evidence: 355911a874a0fd9e; source: 1dac8b1eb8d19622 -->

**Speculative generality.**

- The anti-pattern study found speculative generality significant for change-proneness in at most 6 (33%) of any system's releases [260]. <!-- claim: 1273ea34520e41b4; evidence: 189d26afcf0c07a5; source: 7e19cb78d0afe232 -->
- The large mining study instead rated the removal effect of speculative generality as high for change-proneness [69]. <!-- claim: f362ebafacffb4a3; evidence: ba17ad429e1dc914; source: 1dac8b1eb8d19622 -->
- The two studies detected speculative generality from abstract classes with very few children using their methods [260, 69]. <!-- claim: 95506a637028251f; evidence: e332fb9b912ada4e; source: 7e19cb78d0afe232 -->

**Are pattern classes change-prone, or just large?**

- The five-system study found pattern classes more change prone in four systems even after normalizing for the effect of class size [258]. <!-- claim: 18b09c9d47b7d7f1; evidence: cb7082302f2f58ce; source: d641f866e8ae3573 -->
- The pattern-role study found instead that size explains more of the variance in change-proneness than design pattern roles [259]. <!-- claim: f20412b1bd73cd52; evidence: 83429bc5a96b2b2b; source: 11fd3d539e538180 -->

**Over-engineering versus under-engineering (practitioner claims only; neither side is measured).**

- The refactoring-to-patterns draft claims that under-engineering is far more common than over-engineering [263]. <!-- claim: 4d40819cb68614bf; evidence: f6b7795f6771aa04; source: 302c2a510a33668c -->
- The pattern catalogue's first author warns that trying to use all the patterns ends in speculative designs with flexibility that no one needs [262]. <!-- claim: 63c2d3907df6dc8a; evidence: 3f16bce725fa5f2b; source: ec3a40d9899b9776 -->

**A positive single-system result versus the reviews.**

- A single-system study reports that every introduced pattern instance caused an improvement in the different quality attributes [257]. <!-- claim: 625ad070fa026332; evidence: 851432fe4ddb4f70; source: 6de69ab3e7531c1c -->
- The mapping study found no firm support for any of the claims made for patterns in general [253]. <!-- claim: 24e32cfec43038e1; evidence: a362566f0be80a4c; source: 63e3bdac7fabdf5c -->

## Implications for an agentic design/review workflow

Everything in this section is my inference from the findings above. None of it is a finding of any source.

- **Inference, design time.** Before introducing indirection shaped like a pattern, require a stated force. Name the axis of variation and point to evidence that it varies: a second implementation that exists now, a variant committed to in the spec, or duplication already present. Flexibility added "for later" is a hypothesis with a carrying cost. Its benefit depends on the pattern and on who maintains the code.
- **Inference, design time.** Prefer constructs the language already provides:
  - a function parameter or closure instead of a Strategy or Command class hierarchy;
  - sum types with pattern matching instead of Visitor over a closed hierarchy;
  - states encoded as types in Rust instead of runtime State objects.

  The Java and Rust items are version-specific, so check the target language version.
- **Inference, design time.** When a pattern is used, name it and document its role and the variation it absorbs. Documentation is one of the more consistent positives, although it was measured on students and small programs.
- **Inference, design and review.** Do not treat pattern count, pattern density, or pattern names as a quality signal. The pattern authors' own caveats and the interview argue against it.
- **Inference, review time.** Report indirection that absorbs no evidenced variation as a low-to-medium maintainability finding with a concrete simplification (inline it, collapse the hierarchy, or pass a function). Examples are a Strategy or Factory with one implementation, an abstract class with one child, or hooks used only by tests. It is not a correctness finding and should not block. Escalate only with a concrete comprehension cost, such as Visitor over a closed hierarchy in a language with pattern matching.
- **Inference, review time.** Mutable global state reachable from tested code is a medium finding about test isolation. Examples are a Singleton holding mutable state, or mutable static fields. The evidence for its cost is modest and indirect, so phrase it as a risk.
- **Inference, review time.** Do not flag Observer as such, because the evidence is contested. Flag it when the observers are fixed and could be direct calls, or when update ordering and consistency matter and are undocumented.
- **Inference, review time.** Before calling a smell or pattern harmful, account for class or file size and for churn. Do not inflate severity from correlational mining results. Do not claim maintainability or throughput gains from refactoring toward or away from patterns without measuring them on maintenance tasks.
- **Open question.** The moderator results say a pattern pays off only when the maintainer understands it. Whether that holds when the maintainer is an LLM agent is untested. Treat it as something to evaluate, not something to assume.

## Methodological Limits and Open Gaps

**Limits stated by the sources themselves.**

- The original experiment's authors note that real programs are often less well documented and larger than their experiment programs and that change tasks rarely revolve closely around a design pattern [249]. <!-- claim: b68d56ab629e854d; evidence: 558ec16e1093ed8a; source: 971acbc742b26220 -->
- The questionnaire study asked respondents to assess each pattern's impact on a system in which the pattern would be used appropriately [256]. <!-- claim: 4244e5e3bf75c8c8; evidence: fb4f287240b0d08b; source: 305c034b546d9d68 -->
- The single-system study cautions that the small number of design pattern changes and fewer than 300 revisions of one system threaten generality and that the relationship might be a byproduct of other factors [257]. <!-- claim: 84f16089e6d72b58; evidence: f1b9c18a3af70b77; source: 6de69ab3e7531c1c -->
- The second-hand report of the industrial defect study notes that its pattern mining could have introduced false positives or true negatives and that its defects were based on subjective reports [257]. <!-- claim: 98a1ba9683dc9e61; evidence: c01fc758911f5fb7; source: 6de69ab3e7531c1c -->
- The five-system study states that its statistical results only provide empirical evidence and do not account for causality [258]. <!-- claim: cf02361b3ea7b044; evidence: ef723c6d3c5c875a; source: d641f866e8ae3573 -->
- The anti-pattern study states that it does not claim that antipatterns cause changes and faults [260]. <!-- claim: 960195eace45bb26; evidence: 903b6110ac676af5; source: 7e19cb78d0afe232 -->
- The controlled effort study cannot exclude the possibility that the effect of smells manifests itself only after multiple rounds of maintenance [67]. <!-- claim: 48172a4956b2a798; evidence: e6c0abb980169976; source: 167f187364b4db61 -->
- The reactive programming comprehension experiment used students from a fourth-year Software Engineering course in Computer Science [269]. <!-- claim: 49c5fe74d9bedaba; evidence: 8e787011f91c9113; source: 10a03625eb754637 -->
- The systematic review notes that case studies used different metrics applied to different modules and that controlled experiments have major design differences [255]. <!-- claim: 514cfd90ba8b143b; evidence: c3eb1ab8153e2c95; source: d4f13e8b253b67d0 -->
- The mapping study's evidence base consisted of only 10 papers describing 11 formal experimental studies, augmented by seven experience reports [253]. <!-- claim: 25fb554f66808209; evidence: 68e8b705f3800be5; source: 63e3bdac7fabdf5c -->
- The large mining study used very simple detection rules that overestimate the presence of code smells to ensure high recall and then analysed manually validated instances [69]. <!-- claim: 92f60c24f17e6093; evidence: 2322775e9bf745ed; source: 1dac8b1eb8d19622 -->
- The clone-harm judgments came from a single expert observer who is one of the paper's authors, so there was no way to measure bias [79]. <!-- claim: fd75de5ca58aa594; evidence: 49c7db75ade4b3ba; source: b496c304aaab8013 -->

**Limits of this dossier's evidence base (notes on the evidence, not source claims).**

- **Retrieval status is partial.** The retrieval worker overspent its fetch budget (48 fetch attempts against a budget of 15 to 35) and still could not retrieve several leads. Its residual probes kept surfacing new sources (Posnett et al., the joint replication, and a 2026 cohort study that remains unretrieved), so saturation was not reached.
- **Read from abstracts only.**
  - Zhang and Budgen 2012 (abstract from the Semantic Scholar record).
  - Wedyan and Abufakher 2020 (abstract from the Semantic Scholar record).
  - Their conclusions are therefore read without the full results sections.
- **Available only through other papers' reports:**
  - Wendorff 2001: fetches were bot-blocked or rate-limited.
  - Vokáč 2004 (IEEE TSE): the host returned 503 errors and IEEE blocked automated access. A library-catalogue abstract was fetched but deliberately not used, because the record carries a notice barring use with AI tools.
- **Rejected candidates are not used.**
  - The documentation experiment's Observer-task table row was rejected as unverifiable, so the accepted evidence does not establish whether the Observer documentation result is statistically significant.
  - A version aside in the Java article (which release added record deconstruction patterns) was rejected as not located.
- **Venue corrections (bibliographic metadata, not source claims).**
  - Wedyan and Abufakher 2020 appeared in IET Software, not Information and Software Technology.
  - Ampatzoglou, Charalampidou and Stamelos 2013, the GoF mapping study, appeared in the Journal of Systems and Software, volume 86, issue 7, pages 1945 to 1964, not Information and Software Technology. This comes from the University of Groningen repository record. Its full text is embargoed, and no evidence from it is registered.
- **Mixed outcome measures.** The perception studies (the questionnaire and the survey) measure opinions, not maintenance outcomes. The single-system study uses a model-based maintainability estimate. The mining studies measure change and fault counts, not effort.
- **Weak operationalization of speculative generality.** Both mining studies detect it from an abstract class with few children. That is a narrow proxy for "unneeded flexibility".
- **Not retrieved and unverified:**
  - the GoF 1994 book;
  - Kerievsky's published 2004 book;
  - Fowler's rule-of-three passage;
  - Prechelt et al. 2002 (IEEE TSE, metadata only);
  - Olbrich, Cruzes and Sjøberg 2010 (ICSM; abstract elided by the publisher);
  - Salvaneschi et al. 2017 (IEEE TSE follow-up);
  - Aversano et al. 2007;
  - Jaafar et al. 2016;
  - Gravino et al. 2012;
  - Alfadel et al. 2020;
  - Khomh 2018 (SANER);
  - a 2023 IST mapping study of language features that improve object-oriented design patterns;
  - Nocera et al. 2026, a cohort study on whether smell effects are causal or correlational.
- **Open gaps:**
  - no maintainability study of a language-native construct replacing a pattern (for example, pattern matching instead of Visitor, or closures instead of Strategy);
  - little evidence from long time horizons or large programs;
  - the evidence that Singleton specifically harms testing is indirect;
  - no evidence on AI agents as maintainers.

## Bibliography

[42] [The Expression Problem](https://homepages.inf.ed.ac.uk/wadler/papers/expression/expression.txt)
[54] [Data Oriented Programming in Java](https://www.infoq.com/articles/data-oriented-programming-java/)
[67] [Quantifying the Effect of Code Smells on Maintenance Effort](https://doi.org/10.1109/TSE.2012.89)
[69] [On the Diffuseness and the Impact on Maintainability of Code Smells: A Large Scale Empirical Investigation](https://doi.org/10.1007/s10664-017-9535-z)
[79] [“Cloning Considered Harmful” Considered Harmful: Patterns of Cloning in Software](https://doi.org/10.1007/s10664-008-9076-6)
[81] [The Wrong Abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)
[249] [A Controlled Experiment in Maintenance Comparing Design Patterns to Simpler Solutions](https://doi.org/10.1109/32.988711)
[250] [A Series of Controlled Experiments on Design Patterns: Methodology and Results](https://page.mi.fu-berlin.de/prechelt/Biblio/patseries_st98.pdf)
[251] [A controlled experiment comparing the maintainability of programs designed with and without Design Patterns—a replication in a real programming environment](https://doi.org/10.1023/B:EMSE.0000027778.69251.1f)
[252] [A Multi-Site Joint Replication of a Design Patterns Experiment using Moderator Variables to Generalize across Contexts](https://page.mi.fu-berlin.de/prechelt/Biblio/KrePreJur16-jointrep.pdf)
[253] [What Do We Know about the Effectiveness of Software Design Patterns?](https://doi.org/10.1109/TSE.2011.79)
[254] [A survey of experienced user perceptions about software design patterns](https://doi.org/10.1016/j.infsof.2012.11.003)
[255] [Impact of design patterns on software quality: a systematic literature review](https://doi.org/10.1049/iet-sen.2018.5446)
[256] [Do Design Patterns Impact Software Quality Positively?](https://www.ptidej.net/publications/documents/CSMR08.doc.pdf)
[257] [Myth or Reality? Analyzing the Effect of Design Patterns on Software Maintainability](https://doi.org/10.1007/978-3-642-35267-6_18)
[258] [Design Patterns and Change Proneness: An Examination of Five Evolving Systems](https://www.cs.colostate.edu/~bieman/Pubs/DPCmetrics03.pdf)
[259] [An empirical study on the influence of pattern roles on change-proneness](https://doi.org/10.1007/s10664-010-9148-2)
[260] [An Exploratory Study of the Impact of Antipatterns on Class Change- and Fault-Proneness](https://doi.org/10.1007/s10664-011-9171-y)
[261] [Design Patterns: Abstraction and Reuse of Object-Oriented Design](https://doi.org/10.1007/3-540-47910-4_21)
[262] [How to Use Design Patterns: A Conversation with Erich Gamma, Part I](https://www.artima.com/articles/how-to-use-design-patterns)
[263] [Refactoring To Patterns, draft version 0.17: Introduction](https://courses.cs.duke.edu/compsci308/current/readings/kerievsky_preface.pdf)
[264] [Speculative Generality (excerpt, Refactoring: Improving the Design of Existing Code, 2nd ed., ch. 3 Bad Smells in Code)](https://www.informit.com/articles/article.aspx?p=2952392&seqNum=15)
[265] [Yagni](https://martinfowler.com/bliki/Yagni.html)
[266] [Design Patterns in Dynamic Programming](https://norvig.com/design-patterns/design-patterns.pdf)
[267] [Implementing an Object-Oriented Design Pattern (The Rust Programming Language, ch. 18.3)](https://doc.rust-lang.org/book/ch18-03-oo-design-patterns.html)
[268] [Deprecating the Observer Pattern](https://infoscience.epfl.ch/record/148043/files/DeprecatingObserversTR2010.pdf)
[269] [An Empirical Study on Program Comprehension with Reactive Programming](https://doi.org/10.1145/2635868.2635895)
[270] [An Empirical Analysis of Flaky Tests](https://doi.org/10.1145/2635868.2635920)
