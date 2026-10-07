# Dossier D6: Canonical error, exception, logging, and cleanup practice in JavaScript/TypeScript (Node.js), Java/Kotlin, .NET/C#, C++, and Swift, with OpenTelemetry and OWASP

## Summary

Synthesis of the anchored findings below; this section adds no new claims.

- **A small, stable core is shared across the language authorities.** Catch an error only where the code can recover. Let other failures propagate to a single boundary handler, which either fails fast or fails closed. Keep the original cause when translating an error at an abstraction boundary. Tie cleanup to a scope. Never let a failure during cleanup hide the primary failure.
- **The strongest empirical evidence concerns defective handlers, not error-handling style.**
  - In the production distributed systems that Yuan et al. studied, almost all catastrophic failures came from mishandled errors that the software had explicitly signaled.
  - About a third came from three trivial handler patterns, which a simple static checker could locate.
  - Evidence that the other named anti-patterns predict defects is weak and project-specific. That includes log-and-throw.
- **Much of the practical guidance is version-specific and still moving.**
  - JavaScript explicit resource management is a finished TC39 proposal, expected in ES2027, but release Safari does not ship it.
  - OpenTelemetry is moving exception records from span events to log records.
  - OWASP added a category for mishandled exceptional conditions in its 2025 Top 10.
- **Key uncertainties:**
  - Whether to catch "at the place where they occur" (OWASP) or "where you can recover" (the language authorities).
  - How much of the error contract to put into signatures: checked exceptions, typed throws, or rich errors.
  - How far empirical results drawn from Java and C# projects transfer to JavaScript, Swift, or C++.

## Facet Questions and Scope

<!-- facet: F6 -->

This dossier covers part of facet F6 (language-canonical error, exception, logging, and cleanup practice) for these languages:

- JavaScript and TypeScript, including Node.js
- Java, including Kotlin's position
- .NET and C#
- C++
- Swift

It also covers OpenTelemetry's exception conventions and OWASP's logging and error-handling guidance.

The questions are:

- (a) how errors are represented;
- (b) cause chaining that keeps the original stack;
- (c) rethrowing without losing the stack;
- (d) translation at abstraction boundaries;
- (e) secondary failures during cleanup;
- (f) who owns cleanup;
- (g) policy for unhandled errors at process level;
- (h) logging an exception with its stack;
- (i) defects a reviewer can check.

Each question also asks what is stable and what is version-specific.

Rust, Go, and Python, and the cross-language question of who logs and who rethrows, belong to dossier D5. This dossier refers to D5 for those and does not repeat them.

**Document versions consulted.** This is provenance taken from page titles or headers at fetch time (2026-10-07). It does not report what the documents claim.

| Area | Document version |
|---|---|
| ECMAScript | ECMA-262 multipage draft titled ECMAScript 2027 |
| Node.js | API documentation v26.10.0 |
| Java | Java SE 25 javadoc; Java Language Specification, SE 25 edition |
| Kotlin | Documentation page last modified 12 August 2026 |
| .NET | Microsoft Learn pages; the Framework Design Guidelines pages reprint the 2nd edition (2008) |
| C++ | C++ Core Guidelines dated Jun 14, 2026 |
| Swift | Current Swift book; Swift Evolution SE-0413 |
| OpenTelemetry | Semantic conventions site showing 1.44.0 |
| OWASP | Cheat Sheet Series; Top 10:2025 |

**Source classes:**

- **Official documentation and standards:** ECMA-262, the TC39 proposals repository, MDN, Node.js, Oracle, Kotlin, Microsoft Learn, the C++ Core Guidelines, Swift docs and Swift Evolution, OpenTelemetry, OWASP.
- **Peer-reviewed empirical studies:**
  - Yuan et al. (OSDI 2014)
  - de Pádua and Shang (ICPC 2017 early-research short paper; MSR 2018)
- **Practitioner sources, labeled as such where cited:**
  - an interview with Anders Hejlsberg
  - the Google C++ Style Guide
  - the SLF4J FAQ, which documents a third-party logging library
- **Community-maintained secondary reference:** cppreference.

## Source Groups and Findings

### 1. Empirical evidence on handler defects

**Peer-reviewed production-failure study (Yuan et al., OSDI 2014).**

Yuan et al. found that almost all (92%) of the catastrophic system failures they studied are the result of incorrect handling of non-fatal errors explicitly signaled in software [126]. <!-- claim: a3f3b4a4cea814ec; evidence: 1026b1460966cd1c; source: 344401f57c206ae3 -->

In 35% of the catastrophic failures, the faults in the error handling code fall into three trivial patterns: the error handler is simply empty or only contains a log printing statement, the error handler aborts the cluster on an overly-general exception, or the error handler contains expressions like fix-me or to-do in the comments [126]. <!-- claim: 0121d86d60bbc72f; evidence: 9bc455ff945c886f; source: 344401f57c206ae3 -->

The authors extracted three simple rules from the bugs, developed a static checker, Aspirator, capable of locating these bugs, and report that over 30% of the catastrophic failures would have been prevented had Aspirator been used and the identified bugs fixed [126]. <!-- claim: f1e6d701d01b24d3; evidence: 1efacd9066006795; source: 344401f57c206ae3 -->

These are field data on catastrophic failures. The limits section covers their scope.

**Normative statement (not data).**

The C++ guidelines likewise state that a strategy for error handling must be simple, or it becomes a source of even worse errors, and that untested and rarely executed error-handling code is itself the source of many bugs [144]. <!-- claim: 012338b8a098366b; evidence: 739ed53c575de03c; source: 8117f6cdcbd0c4fa -->

**Anti-pattern prevalence and defect association (de Pádua and Shang).** These are Java and C# open-source projects.

In de Pádua and Shang's prevalence study, only five anti-patterns (Unhandled Exceptions, Catch Generic, Unreachable Handler, Over-catch, and Destructive Wrapping) were detected in over 20% of the catch blocks or throws statements in median: 40.8%, 31.9%, 28.0%, 24.6%, and 22.3%, respectively [154]. <!-- claim: cac7f51f1024d758; evidence: 551f795db295f22a; source: aa30ad10dfb232a4 -->

Their follow-up study of post-release defects found that although the majority of the exception handling anti-patterns are not significant in the models, there exist anti-patterns that can provide significant explanatory power to the probability of post-release defects [155]. <!-- claim: 32230c4e39193b27; evidence: 291701f770a74f61; source: 153c8410f827d032 -->

The percentage of catch blocks affected by the Dummy Handler anti-pattern had a positive relationship with the probability of post-release defects in both Umbraco and Hibernate, and the total amount of the Generic Catch anti-pattern had one in Umbraco [155]. <!-- claim: 15218136f56f2abb; evidence: 050e91d6965eb1c3; source: 153c8410f827d032 -->

The total number of catch blocks affected by Log and Throw had a positive relationship with the probability of post-release defects in Hadoop, although the authors note that this anti-pattern is not prevalent in practice and was found to have a small effect [155]. <!-- claim: 4f88d015405f9217; evidence: cae4ac2d67b3e0f9; source: 153c8410f827d032 -->

**Standards-body framing.**

OWASP lists Mishandling of Exceptional Conditions as a new category for 2025, containing 24 CWEs and focusing on improper error handling, logical errors, failing open, and other related scenarios stemming from abnormal conditions [152]. <!-- claim: d9e02c28cbd0d4e5; evidence: b4fc46d512c6127c; source: 7dd9e330e86fa945 -->

The individual CWE identifiers mapped by the page are not in the registered quote, so this dossier does not cite them.

*Inference:* only a few defects have outage or defect evidence behind them:

- swallowing an error (an empty or log-only handler);
- catching too broadly (catch-all then abort, or a generic catch);
- placeholder handlers that contain only to-do or fix-me.

Log-and-throw has the weakest support of the named anti-patterns.

### 2. How errors are represented, and who has to declare them

**JavaScript and TypeScript.**

The TypeScript 4.4 release notes explain that in JavaScript any type of value can be thrown with throw and caught in a catch clause, which is why TypeScript historically typed catch clause variables as any, and that the new useUnknownInCatchVariables flag changes the default type of catch clause variables from any to unknown [146]. <!-- claim: dfbd92fac5a65820; evidence: 60d564adedd93853; source: 10d839a3dc2f22ec -->

MDN cautions that you should not make assumptions that the error you caught has an Error as its cause, in the same way that you cannot be sure the variable bound in the catch statement is an Error [128]. <!-- claim: 8ff445bf8719c94e; evidence: a6828f9955b58e01; source: a4b428eba8c7501f -->

**Java.**

The Java tutorial treats any exception that can be thrown by a method as part of the method's public programming interface and gives a bottom line guideline: if a client can reasonably be expected to recover from an exception, make it a checked exception, and if a client cannot do anything to recover, make it an unchecked exception [156]. <!-- claim: 377468a714bbe485; evidence: 4e71bbbbf280d9fc; source: fd4bf05c5d61d1d0 -->

**Kotlin.**

Kotlin's documentation says Kotlin treats all exceptions as unchecked by default, so you can catch exceptions but you don't need to explicitly handle or declare them [141]. <!-- claim: 1212d2f3113a2b40; evidence: b3d589992f73ed92; source: 7e975aec477536eb -->

The Kotlin rich-errors design proposal lists two non-goals: to introduce full-blown union types and to introduce checked exceptions for Kotlin [160]. <!-- claim: 615a209f30a453a3; evidence: 263950bb1e314805; source: 994d8d4d6d48ab44 -->

The same proposal says Kotlin encourages using unchecked exceptions for unrecoverable situations such as bugs, failed preconditions, or invariant violations, and that such exceptions are usually not caught in regular code but bubble up to a global handler or crash reporter [160]. <!-- claim: f67090e336fae045; evidence: b573f1886d484834; source: 994d8d4d6d48ab44 -->

At fetch time the proposal's status header read "Design review". That is provenance, not a feature that has shipped.

**.NET.** These guidelines are a reprint of the 2nd edition (2008).

The .NET design guidelines say not to return error codes, because exceptions are the primary means of reporting errors in frameworks, and to report execution failures by throwing exceptions [159]. <!-- claim: fd2dfdfdc8d0f856; evidence: ec94f3ac5cc81d8c; source: 25bc078520d4b870 -->

**C++.**

The C++ guidelines give the reason for throwing an exception when a function cannot do its assigned task as making error handling systematic, robust, and non-repetitive, and they say: don't use a throw as simply an alternative way of returning a value from a function [144]. <!-- claim: 48e90155653a19c8; evidence: dbf98e77773c677e; source: 8117f6cdcbd0c4fa -->

They also advise that before deciding that you cannot afford or don't like exception-based error handling, you should have a look at the alternatives, which have their own complexities and problems [144]. <!-- claim: 3604ca381568b4e6; evidence: dbf98e77773c677e; source: 8117f6cdcbd0c4fa -->

The guidelines prefer purpose-designed user-defined types as exceptions because a user-defined type can better transmit information about an error to a handler, and they mark throw 7, throwing a string literal, and a bare std::exception{} with no info as bad [144]. <!-- claim: 471b7c01b29577c7; evidence: d811f7838bea30f1; source: 8117f6cdcbd0c4fa -->

Google's opposing house rule is in Counterevidence §3.

**Swift.**

In Swift, errors are represented by values of types that conform to the Error protocol, and the language guide asks you to write the try keyword before calls that can throw so that you can quickly identify places in your code that can throw errors [158]. <!-- claim: d406f8e45f7b3130; evidence: 5f0e2bdc4549ccf7; source: 82043d3414647acc -->

Swift's try? handles an error by converting it to an optional value, so the expression is nil if an error is thrown, while try! disables error propagation and wraps the call in a runtime assertion that no error will be thrown [158]. <!-- claim: 3cb718fac55e7361; evidence: 581e7a313a18c974; source: 82043d3414647acc -->

*Inference:* the main split is between two approaches.

- Declared, compiler-checked error contracts: Java checked exceptions and Swift typed throws.
- Undeclared propagation with documentation and tools: Kotlin, C#, untyped Swift `throws`, and JavaScript.

Counterevidence §2 sets the positions side by side.

### 3. Cause chaining and preserving the original stack

**JavaScript.** MDN is Mozilla's reference documentation.

The specification's InstallErrorCause operation is used to create a cause property on the new error object when a cause property is present on the options argument [127]. <!-- claim: e515a6ae0e9e4737; evidence: d98798578ec55fc5; source: deb4397d50dcbe2a -->

MDN advises that when you catch an error and re-throw it with a new message, you should pass the original error into the constructor for the new Error [128]. <!-- claim: 10f9d2ad9d557064; evidence: 34e54619453b1b64; source: a4b428eba8c7501f -->

MDN notes that different engines set the stack value at different times, and that most modern engines set it when the Error object is created [129]. <!-- claim: dcbdffc40902daa3; evidence: 627e7e5498ab5e61; source: e64f59f50596320f -->

MDN describes the stack property as de facto implemented by all major JavaScript engines while the standards committee is still looking to standardize it, and warns that you cannot rely on the precise content of the stack string due to implementation inconsistencies [129]. <!-- claim: 8f39a546d3b3a13f; evidence: 8aa1e597cba72b4f; source: e64f59f50596320f -->

**Java.**

The javadoc states that the backtrace for a throwable with an initialized, non-null cause should generally include the backtrace for the cause [131]. <!-- claim: c29964f9fb2bd4bd; evidence: 6b87e457a75ae384; source: 544cc463e08c246e -->

It also asks that subclasses likely to have a cause associated with them provide two more constructors, one that takes a Throwable as the cause and one that takes a String detail message and a Throwable cause [131]. <!-- claim: 0276575fc54fe3bf; evidence: 83e87ac567a7760f; source: 544cc463e08c246e -->

A Java throwable contains a snapshot of the execution stack of its thread at the time it was created [131]. <!-- claim: 11c4a442f64fe337; evidence: 2f3e7ee9196555f1; source: 544cc463e08c246e -->

**.NET.**

The .NET best-practices page states that if you rethrow an exception by specifying the exception in the throw statement, for example throw e, the stack trace is restarted at the current method and the list of method calls between the original method that threw the exception and the current method is lost [132]. <!-- claim: 25cc84f77baececd; evidence: 885ee1777749e204; source: c0750c248927eeb8 -->

When rethrowing from somewhere other than the handler (catch block), the page recommends ExceptionDispatchInfo.Capture(Exception) to capture the exception in the handler and ExceptionDispatchInfo.Throw() when you want to rethrow it [132]. <!-- claim: 4c9bd22df303e45c; evidence: 5d2e34d2ebdd1255; source: c0750c248927eeb8 -->

The CA2200 rule page says to fix a violation by rethrowing the exception without specifying the exception explicitly, and that you should not suppress a warning from this rule [133]. <!-- claim: c35a36d5d8c8c1c5; evidence: 340931b3247d07bc; source: 71eaaff945a756b8 -->

The .NET guidance presents a bare throw as rethrowing the original exception so that callers can see the real cause of the problem, with the alternative of throwing a new exception and including the original exception as the inner exception [132]. <!-- claim: a4a9521f16074e07; evidence: d9e84173e3ec00c3; source: c0750c248927eeb8 -->

**C++.**

The C++ guidelines say to rethrow a caught exception with throw; not throw e;, because throw e; would throw a new copy of e, sliced to the static type std::exception when it was caught by a const std::exception reference, instead of rethrowing the original exception [144]. <!-- claim: 585d8c880fc68d0d; evidence: 246ca996a60fc098; source: 8117f6cdcbd0c4fa -->

The cppreference page for std::throw_with_nested, a community-maintained reference, says that for a non-final class type it throws an exception of an unspecified type publicly derived from both std::nested_exception and the thrown type, whose nested_exception base class calls std::current_exception, capturing the currently handled exception object in a std::exception_ptr [145]. <!-- claim: 40353e344027b933; evidence: 05917ba7b36d5098; source: e468bf6d1830d3be -->

*Inference:*

- In Java and JavaScript the trace is captured when the error object is created. Rethrowing the same object therefore keeps the original trace.
- What loses the trace is building a new error without a cause, or reducing the error to a string.
- The C# `throw ex;` defect has no direct Java or JavaScript counterpart. In C++ the risk is slicing the exception, not losing the trace, and the standard nesting mechanism does not record a trace at all.

### 4. Translation at abstraction boundaries

**Java (official rationale).**

The Throwable javadoc calls it bad design to let the throwable thrown by a lower layer propagate outward, because it is generally unrelated to the abstraction provided by the upper layer and doing so would tie the API of the upper layer to the details of its implementation [131]. <!-- claim: 8c10003ee62577c2; evidence: b4dfb88d3b7e7c3f; source: 544cc463e08c246e -->

Throwing a wrapped exception, meaning an exception containing a cause, lets the upper layer communicate the details of the failure to its caller and preserves the flexibility to change the implementation of the upper layer without changing its API, according to the same javadoc [131]. <!-- claim: 2ffa0ff02b527c5c; evidence: 6abb72327d4a5098; source: 544cc463e08c246e -->

**Swift (evolution argument applied to typed error signatures).**

Swift's typed-throws proposal tells authors to resist the temptation to use typed throws because there is only a single kind of error that the implementation can throw, since an API that later gains other error sources either needs to translate those errors into its declared error type or needs to break its API contract [142]. <!-- claim: 612952ccc331e528; evidence: da1ebb1afb3fba77; source: dff42f30fb838662 -->

The same proposal says that strictly specifying the thrown error type constrains the evolution of a function's implementation, and that because errors are usually propagated or rendered but not exhaustively handled, untyped throws is better for most scenarios [142]. <!-- claim: b9aeda463c3da150; evidence: e4a745144087b946; source: dff42f30fb838662 -->

The Swift book says most Swift code doesn't specify the type for the errors it throws, which matches the reality that you don't know ahead of time every error that could happen and the fact that errors can change over time [158]. <!-- claim: adddf8b89e0d5285; evidence: 8c36fbe64498e9b6; source: 82043d3414647acc -->

**.NET (contract exceptions as versioned API).**

The .NET design guidelines ask authors to document all exceptions thrown by publicly callable members because of a violation of the member contract and to treat them as part of the contract, which should not change from one version to the next [159]. <!-- claim: e0c5ac1815d1bf20; evidence: 44655691a404c40f; source: 25bc078520d4b870 -->

*Inference:* these sources differ in mechanism but agree on the goal. Do not let a lower layer's error type leak through a public signature. Keep the cause when wrapping. Treat the exceptions that are documented as part of the contract as part of the versioned API. Counterevidence §5 covers how one empirical catalog counts wrapping.

### 5. Cleanup ownership and failures during cleanup

**Java and Kotlin.**

The Throwable javadoc explains that in the try-with-resources statement, when there are two such exceptions, the exception originating from the try block is propagated and the exception from the finally block is added to the list of exceptions suppressed by the exception from the try block [131]. <!-- claim: 0611d032475900d1; evidence: 0aa31ed39a8e2d29; source: 544cc463e08c246e -->

The JLS translation of a basic try-with-resources statement wraps the close() call, when a primary exception is already propagating, in a catch of Throwable that passes the close failure to addSuppressed on the primary exception [148]. <!-- claim: 5d0a2908d899ae5a; evidence: e74c566a4ed01534; source: 3ba7a3ea1162af85 -->

For a plain finally block, the JLS specifies that if the finally block completes abruptly for reason S, the try statement completes abruptly for reason S and the throw of the original value V is discarded and forgotten [148]. <!-- claim: 7eaba40b2cdd5c99; evidence: f9212407ba475aab; source: 3ba7a3ea1162af85 -->

Kotlin's documentation names the use() function as the idiomatic way to manage resources that implement the AutoClosable interface, because it automatically closes the resource when the block of code completes, regardless of whether an exception is thrown [141]. <!-- claim: 1698df6aad85f879; evidence: 68d8037cb76bae83; source: 7e975aec477536eb -->

**.NET.**

The .NET guidance says to clean up resources with either using statements or finally blocks, to prefer using statements to automatically clean up resources when exceptions are thrown, and to use finally blocks for resources that don't implement IDisposable [132]. <!-- claim: 2b554ced79ce2085; evidence: f260fd9c5ef977df; source: c0750c248927eeb8 -->

It also says not to raise exceptions in finally clauses, pointing to code analysis rule CA2219 [132]. <!-- claim: 54f0ab9fa00de5c5; evidence: 11cd2100cb79a0a0; source: c0750c248927eeb8 -->

**C++.**

The C++ guidelines call leaks typically unacceptable and manual resource release error-prone, and call RAII the simplest, most systematic way of preventing leaks [144]. <!-- claim: 7ab68ee7871053e5; evidence: 7867af4f1914c2e3; source: 8117f6cdcbd0c4fa -->

They also say we don't know how to write reliable programs if a destructor, a swap, a memory deallocation, or attempting to copy or move-construct an exception object fails [144]. <!-- claim: b0822def2b018644; evidence: febc2709617cb371; source: 8117f6cdcbd0c4fa -->

**Swift.**

Swift's defer statement executes a set of statements just before code execution leaves the current block of code, and the deferred statements may not contain any code that would transfer control out of the statements, such as a break or a return statement, or by throwing an error [158]. <!-- claim: f70cf3a05d9dff09; evidence: 21b8554ad6f8b2d2; source: 82043d3414647acc -->

**JavaScript and TypeScript: semantics.**

MDN distinguishes three relations: SuppressedError represents an error that occurred while handling another error, AggregateError represents a collection of multiple, unrelated errors that occurred during the same operation, and the cause property represents a single failing site, with the wrapper error only adding context [128]. <!-- claim: afa7601d343b2ba5; evidence: a6f837eec7f251b7; source: a4b428eba8c7501f -->

MDN's reference for using says that all errors thrown during disposal, including the initial error that caused the scope exit, are aggregated inside one SuppressedError, with each earlier exception as the suppressed property and the later exception as the error property [157]. <!-- claim: 32f24d45969adc41; evidence: e4fe041c1a966585; source: 1d2c4a603f2d62f7 -->

The TypeScript release notes for using declarations warn that adding more clean-up logic to a finally block invites foot-guns such as exceptions preventing other resources from being disposed, which the explicit resource management proposal aims to solve [147]. <!-- claim: c5af8a8fa55e7534; evidence: e52688bedcd0accc; source: 13f699a32a1d2fc6 -->

The same release notes say that for the case where both the logic before and during disposal throws an error, SuppressedError has been introduced as a new subtype of Error [147]. <!-- claim: dfb002cae12ed3d6; evidence: e9ceebf0918bca6d; source: 13f699a32a1d2fc6 -->

**JavaScript explicit resource management: standardization and shipping status.**

The TC39 finished-proposals table lists explicit resource management with meeting entries for stage 4 (2025-05), a conditional stage 4 status update (2026-03), and a stage 4 progress update (2026-05), and an expected publication year of 2027 [143]. <!-- claim: 4d07abf6842b27f3; evidence: 75be6794af00f6e2; source: f4cf2e084522e321 -->

The browser-compat-data entry for the using declaration records version_added 134 for chrome (release date 2025-03-04), 141 for firefox (2025-07-22), and 24.0.0 for nodejs (2025-05-06), but only preview for safari and false for safari_ios [162]. <!-- claim: 394b4a2defd395db; evidence: a35af69757cd8df3; source: 319c625d05179e76 -->

Counterevidence §7 lists the conflicting status signals: a proposal README that still says Stage 3, and a V8 support list that disagrees with the compatibility data.

*Inference:* the languages use two strategies.

- **Record the secondary failure next to the primary one.** Java attaches it as a suppressed exception. JavaScript wraps both in `SuppressedError`.
- **Forbid failing cleanup.** C++ says destructors must not fail. Swift does not let `defer` throw. .NET says not to raise exceptions in `finally`.

In Java, the specification itself defines a throwing plain `finally` as discarding the original exception.

### 6. Unhandled errors, process policy, and where to catch

**Node.js.**

The Node.js documentation calls 'uncaughtException' a crude mechanism for exception handling intended to be used only as a last resort, says the event should not be used as an equivalent to On Error Resume Next, and states that unhandled exceptions inherently mean that an application is in an undefined state [130]. <!-- claim: e8243fdf7a6fdf62; evidence: 7c51334e414aafac; source: d2342125ff31ad6f -->

According to the same page, the correct use of 'uncaughtException' is to perform synchronous cleanup of allocated resources before shutting down the process, and it is not safe to resume normal operation after 'uncaughtException' [130]. <!-- claim: 32879ed1f73caf5d; evidence: 48f920db1267fabc; source: d2342125ff31ad6f -->

To restart a crashed application in a more reliable way, the page says an external monitor should be employed in a separate process to detect application failures and recover or restart as needed [130]. <!-- claim: 1963f4132a63a610; evidence: 411c3e35cae39501; source: d2342125ff31ad6f -->

By default, Node.js handles uncaught exceptions by printing the stack trace to stderr and exiting with code 1, and an unhandled rejection in a Promise based async context is reported through the same event when the --unhandled-rejections flag is set to strict or throw, which is the default [130]. <!-- claim: 125fba6231ae4f50; evidence: e253a3bf7e585ca4; source: d2342125ff31ad6f -->

**.NET.**

Microsoft's .NET guidance says you can intentionally handle expected exceptions to prevent your app from crashing, but that a crashed app is more reliable and diagnosable than an app with undefined behavior [132]. <!-- claim: 139b52fa80094931; evidence: a3a457eedd026a07; source: c0750c248927eeb8 -->

It adds that when your code can't recover from an exception, you should not catch that exception, and should enable methods further up the call stack to recover if possible [132]. <!-- claim: 4d00807a78cf8f40; evidence: d698122edecbcfdd; source: c0750c248927eeb8 -->

The .NET design guidelines suggest considering terminating the process by calling System.Environment.FailFast instead of throwing an exception if your code encounters a situation where it is unsafe for further execution, and say to avoid explicitly throwing exceptions from finally blocks [159]. <!-- claim: e4c90a353a71c340; evidence: 2f15774075a04055; source: 25bc078520d4b870 -->

The .NET guidance adds that callers should be able to assume that there are no side effects when an exception is thrown from a method [132]. <!-- claim: 4063d86a857aa02d; evidence: bcd578b180552fb5; source: c0750c248927eeb8 -->

**C++.**

The C++ guidelines say that catching an exception in a function that cannot take a meaningful recovery action leads to complexity and waste, that an exception should propagate until it reaches a function that can handle it, and that cleanup actions on the unwinding path should be handled by RAII [144]. <!-- claim: b8d05015a5a5e65e; evidence: 682cf211cd1b136a; source: 8117f6cdcbd0c4fa -->

They add that try/catch is verbose, that non-trivial uses are error-prone, and that try/catch can be a sign of unsystematic and/or low-level resource management or error handling [144]. <!-- claim: a8a465fa2eac5dbd; evidence: 4487bf25f2d48e1f; source: 8117f6cdcbd0c4fa -->

**Practitioner opinion.**

In a practitioner interview, C# designer Anders Hejlsberg put the ratio in a well-written application at ten to one, in his opinion, of try finally to try catch, counting C# using statements as like try finally [140]. <!-- claim: e9d7fe82305c69df; evidence: f35209390c26bf16; source: cfe6f5c674ab85a6 -->

**Security standard.**

The OWASP entry on mishandling of exceptional conditions says that if you are part way through a transaction of any kind, it is extremely important that you roll back every part of the transaction and start again, also known as failing closed [152]. <!-- claim: 5170ee0c8bd7dd19; evidence: e14b2d28d818623a; source: 7dd9e330e86fa945 -->

The same OWASP page also says to catch at the point of occurrence. That conflicts with the guidance above; Counterevidence §1 covers it.

### 7. Logging and telemetry of exceptions

For who should log and who should rethrow, see D5. This section covers what the authorities say about how to log and record an exception.

**.NET.**

The .NET logging documentation says that in most cases you should use log message template formatting when logging because string interpolation can cause performance issues, points to code analysis rule CA2254, and notes that the logger methods have overloads that take an exception parameter [149]. <!-- claim: 0b1756c96f54b0b1; evidence: 22c38823272d3102; source: 038aec8c2b894445 -->

**JVM.** SLF4J is a third-party library, not part of the JDK, so this is practitioner documentation.

The SLF4J FAQ says that if the last parameter to a logger printing method is an exception, it is interpreted as an exception instead of an additional unused object parameter, and that if the exception is not the last argument, its stack trace will not be printed [150]. <!-- claim: b68a83fe93ba1ed6; evidence: 4d34d4b85ffce19a; source: 292bf06987a43f06 -->

**OpenTelemetry: logs-based exception records.**

The OpenTelemetry semantic conventions for exceptions in logs say exceptions SHOULD be recorded as attributes on the LogRecord passed to the Logger emit operations, and that instrumentations SHOULD provide the exception instance rather than manually setting individual exception attributes when language implementations support passing exception instances [136]. <!-- claim: 1d2569d2700b28ab; evidence: 77a8d41b0d0db525; source: 5734e0647b671686 -->

The conventions define exception.type as the type of the exception (its fully-qualified class name, if applicable) and exception.stacktrace as a stacktrace as a string in the natural representation for the language runtime [136]. <!-- claim: 27e95b5e2bb8f090; evidence: 95d292317c542cca; source: 5734e0647b671686 -->

The same conventions state that the severity reflects the expected impact of the exception, not just its presence [136]. <!-- claim: c98fbf5844bafde7; evidence: f1ab5fce289e9b35; source: 5734e0647b671686 -->

They say exceptions that are expected to be handled by application code SHOULD be reported with severity WARN, and that when a client library call fails after exhausting retries, the client library instrumentation records a single WARN log while logging of individual retry attempts is left to the lower-level instrumentation [136]. <!-- claim: 1e4fb02abdc755d7; evidence: daca26e9043b7916; source: 5734e0647b671686 -->

**OpenTelemetry: moving away from span events.**

The semantic conventions page for exceptions on spans carries the status Deprecated and says to use the semantic conventions for exceptions in logs instead [135]. <!-- claim: 7663da3f979c8b4e; evidence: 0655c35981238247; source: 524de37ac82038e5 -->

Existing instrumentations that record exceptions as span events SHOULD introduce an environment variable OTEL_SEMCONV_EXCEPTION_SIGNAL_OPT_IN, where logs emits exceptions as logs only and logs/dup emits both span events and logs for a phased rollout, while the default behavior is to continue emitting exceptions as span events [135]. <!-- claim: 0ab9295305ac120e; evidence: 2d3fa60c37bb29a7; source: 524de37ac82038e5 -->

The span conventions also note that it's no longer recommended to record exceptions that are handled and do not escape the scope of a span [135]. <!-- claim: 281bfda1b49dc61c; evidence: e8b210d3e616910e; source: 524de37ac82038e5 -->

OpenTelemetry has announced that the tracing specification will deprecate APIs such as Span.AddEvent and Span.RecordException in favor of emitting log-based events, deprecating the API for recording span events but not the ability to see events attached to spans [153]. <!-- claim: f2b44eec94bcd5bd; evidence: 7612cc635eb8894f; source: e68620a6e02740b6 -->

For custom instrumentation, the announcement says to prefer the Logs API for new events and exceptions and to avoid adding new dependencies on span event methods, especially where they are already marked as deprecated [153]. <!-- claim: 611fc5e57c60216b; evidence: b0d368196990245a; source: e68620a6e02740b6 -->

**OWASP.**

The OWASP logging cheat sheet says application source code, session identification values, access tokens, sensitive personal data, authentication passwords, database connection strings, and encryption keys should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted [138]. <!-- claim: f94ced97e37b8dba; evidence: c0811f3b3f7d6bfe; source: d8891c6ccda37dcd -->

It also says to perform sanitization on all event data to prevent log injection attacks, such as carriage return, line feed, and delimiter characters, and to encode data correctly for the output (logged) format [138]. <!-- claim: bbdaab720d4e4aa9; evidence: 981733d0238de896; source: d8891c6ccda37dcd -->

The cheat sheet suggests considering separate files or tables for extended event information such as error stack traces [138]. <!-- claim: d09142b41fb07ba1; evidence: 761ec831f9a87bce; source: d8891c6ccda37dcd -->

The OWASP error handling cheat sheet aims for an outcome where, when an unexpected error occurs, a generic response is returned by the application but the error details are logged server side for investigation, and not returned to the user [139]. <!-- claim: 864939cec878585f; evidence: 24eb55f7b4f31246; source: 3e997e2809fc5ea6 -->

The same cheat sheet warns that unhandled errors can assist an attacker in the initial phase of an attack [139]. <!-- claim: 978bc20bc13177f9; evidence: e49787f80e9f8d63; source: 3e997e2809fc5ea6 -->

### 8. Stable theory versus version-specific facts

This table restates the anchored findings above. It adds no claims. Rows marked *pending* depend on passages that were seen during retrieval but are not yet registered evidence. They are unverified in this dossier; the limits section lists them.

| Area | Stable principle (synthesis) | Version-specific fact | Status here |
|---|---|---|---|
| JS cause chaining | Keep the cause when wrapping | `new Error(msg, { cause })` through InstallErrorCause; the proposal was finished for ES2022 | Mechanism anchored in §3; ES2022 *pending* (N3) |
| JS non-Error throws | Narrow a caught value before use | TypeScript 4.4 flag `useUnknownInCatchVariables`, which makes caught values `unknown` | Anchored in §2; "enabled under `--strict`" *pending* (N8) |
| JS `Error.isError` | Check that a value really is an error | Finished for ES2026 per the TC39 table | *Pending* (N3); the spec-algorithm candidate was rejected |
| JS explicit resource management | Scope-bound cleanup that keeps both errors | Finished and expected for ES2027. Ships in Chrome 134, Firefox 141, and Node 24.0.0. Safari has preview support only. | Anchored in §5 |
| Node process policy | Last-resort handler, then clean up and exit | Default `--unhandled-rejections` mode is throw (Node.js v26.10.0 docs) | Anchored in §6 |
| Java and Kotlin | Wrap with a cause; suppress close failures | `Throwable` and the JLS as documented for Java SE 25; Kotlin rich errors in design review | Anchored in §3–§5; versions are provenance |
| .NET | Bare `throw;` or ExceptionDispatchInfo; `using`; pass the exception object to ILogger | CA2200 enabled by default as a warning in .NET 10 | Rule text anchored in §3; .NET 10 *pending* (N1) |
| C++ | RAII; rethrow with `throw;`; cleanup never fails | `throw_with_nested` since C++11, constexpr since C++26; `std::expected` in C++23 | Behavior anchored in §3; versions *pending* (N9); `std::expected` unverified (candidate rejected) |
| Swift | Untyped `throws` by default; `defer` cannot throw | Typed throws implemented in Swift 6.0 | Behavior anchored in §2, §4, §5; Swift 6.0 *pending* (N2) |
| OpenTelemetry | Record the exception object; set severity by impact | Span-event conventions deprecated; Span Event API deprecation announced on the project blog (URL path /blog/2026/) | Anchored in §7; semconv 1.44.0 *pending* (N5) |
| OWASP | Generic responses to users, details server side; no secrets in logs | Top 10:2025 adds the Mishandling of Exceptional Conditions category | Anchored in §1 and §7 |

## Counterevidence and Disagreements

### 1. Where to catch: OWASP versus the language authorities

OWASP's A10 guidance says we must catch every possible system error directly at the place where they occur and then handle it, which means do something meaningful to solve the problem and ensure we recover from the issue [152]. <!-- claim: 52066ed8cafd502a; evidence: cc17f04508b3a325; source: 7dd9e330e86fa945 -->

The same page also calls for centralized error handling, logging, monitoring, and alerting, and a global exception handler, saying the handling of exceptional conditions should be performed in one place, the same way each time [152]. <!-- claim: d463d18548e83a43; evidence: 1448cc821bd75a1d; source: 7dd9e330e86fa945 -->

In contrast, the C++ guidelines say to let an exception propagate until it reaches a function that can handle it [144]. <!-- claim: 63da0645a40ad29e; evidence: 682cf211cd1b136a; source: 8117f6cdcbd0c4fa -->

Microsoft's guidance likewise says not to catch an exception your code can't recover from, so that methods further up the call stack can recover if possible [132]. <!-- claim: 3eff805bb96e8547; evidence: d698122edecbcfdd; source: c0750c248927eeb8 -->

*Synthesis:* OWASP's page contradicts itself. It asks for catching at the point of occurrence and also for centralized handling in one place. The language authorities support only the second. On failing closed and rolling back partial work, all of these sources agree (§6).

### 2. Checked exceptions and typed errors

**For declared error contracts.**

The Java tutorial holds that any exception that can be thrown by a method is part of the method's public programming interface [156]. <!-- claim: d8f75163230b9922; evidence: 4e71bbbbf280d9fc; source: fd4bf05c5d61d1d0 -->

The .NET design guidelines likewise say exceptions thrown because of a violation of the member contract are part of the contract and should not change from one version to the next [159]. <!-- claim: 3d052da264489c0f; evidence: 44655691a404c40f; source: 25bc078520d4b870 -->

**Against.** The Hejlsberg points are a language designer's opinions and anecdotes from a practitioner interview, not measurements.

Hejlsberg argued that adding a new exception to a throws clause in a new version breaks client code, like adding a method to an interface [140]. <!-- claim: 7207dc04c6a23896; evidence: 56d42d0bcf6ad305; source: cfe6f5c674ab85a6 -->

He also said that in the large, checked exceptions become such an irritation that people completely circumvent the feature, either declaring throws Exception everywhere or writing empty catch clauses [140]. <!-- claim: 5cbd9f7eb0fc8355; evidence: 2074d0fc6a556cd4; source: cfe6f5c674ab85a6 -->

The Kotlin rich-errors proposal wants compile-time awareness of errors so they are not ignored, but does not want to reintroduce Java's problems where every call site is forced into verbose try-catch or throws declarations [160]. <!-- claim: 320748f209895cb6; evidence: a2df89526841f409; source: 994d8d4d6d48ab44 -->

Swift's typed-throws design states that even with the addition of typed throws to Swift, untyped throws is better for most scenarios [142]. <!-- claim: 3b34aa7011e081ec; evidence: e4a745144087b946; source: dff42f30fb838662 -->

**Qualifier from the same critic.**

Hejlsberg nonetheless saw tremendous value in knowing what exceptions can get thrown, and in analysis tools that detect suspicious code, including uncaught exceptions [140]. <!-- claim: 787bd55b192018de; evidence: 17ab88586375e82f; source: cfe6f5c674ab85a6 -->

*Synthesis:* the disagreement is about whether the compiler should force error contracts on callers. No one disputes that callers benefit from knowing which errors to expect. Kotlin and Swift are moving toward visible typed errors that are cheap to propagate, and away from forced declarations.

### 3. Whether to use exceptions at all in C++

Practitioner style guide:

We do not use C++ exceptions, says Google's style guide, while conceding that on their face the benefits of using exceptions outweigh the costs, especially in new projects, and noting that for existing code the introduction of exceptions has implications on all dependent code [151]. <!-- claim: ed8d59d4d6aba00d; evidence: 2345630c25f38a5b; source: d9aa0560315f3072 -->

The guide's cons include that when you add a throw statement to an existing function, you must examine all of its transitive callers, which must either make at least the basic exception safety guarantee or never catch the exception and be happy with the program terminating [151]. <!-- claim: 33d041c12946c863; evidence: 8d42a10bf23aa11f; source: d9aa0560315f3072 -->

This contrasts with the C++ Core Guidelines' default of throwing when a function cannot do its task (§2). Google bases its rule on the cost of introducing exceptions into existing code, not on a claim that exceptions are wrong in principle.

### 4. Telemetry: span events or log records

The OpenTelemetry trace specification page still says an exception SHOULD be recorded as an Event on the span during which it occurred if and only if it remains unhandled when the span ends and causes the span status to be set to ERROR [137]. <!-- claim: 7bedb576e3d5bcd8; evidence: 837dc488591ee507; source: b7182902cf797fee -->

By contrast, the semantic conventions page for exceptions on spans now has the status Deprecated and says to use the semantic conventions for exceptions in logs instead [135]. <!-- claim: 418d92c9ff9f2698; evidence: 0655c35981238247; source: 524de37ac82038e5 -->

*Synthesis:* the move from span events to log records is incomplete. Instrumentation still defaults to span events unless the opt-in variable is set (§7).

### 5. Wrapping: endorsed practice or anti-pattern?

The prevalence study's catalog defines Destructive Wrapping as a handler that propagates the exception as a new exception, and Log and Throw as a handler that logs some information and propagates the exception [154]. <!-- claim: b2815ac6923a9519; evidence: e71414a46b924ee8; source: aa30ad10dfb232a4 -->

The .NET guidance notes that a bare throw makes it easier for callers to see the real cause of the problem without having to examine the InnerException property [132]. <!-- claim: 8ec08e7ed27e6eee; evidence: d9e84173e3ec00c3; source: c0750c248927eeb8 -->

*Synthesis:* the Java javadoc treats wrapping with a cause as good design (§4). The empirical catalog's definition of "Destructive Wrapping" would also count cause-preserving translation. Its prevalence figures therefore do not show that translation at a boundary is harmful.

### 6. How severe is log-and-throw?

For Log and Throw specifically, the measured relationship was confined to Hadoop, and the authors note the anti-pattern is not prevalent in practice and was found to have a small effect [155]. <!-- claim: 360447f739cc38af; evidence: cae4ac2d67b3e0f9; source: 153c8410f827d032 -->

The practitioner catalog that the prevalence study cites for this anti-pattern, and a third-party Checkstyle rule that enforces it, were not retrieved, so they are unverified here.

### 7. Conflicting status signals for JavaScript explicit resource management

The proposal repository's README still shows Stage: 3 and a last presentation in March 2023 [134]. <!-- claim: 234f4921bc1ca509; evidence: e1ea1de2e4ce0eec; source: 5b29cd6263ff412e -->

The V8 feature page reports that explicit resource management is shipped in Chromium 134 and V8 v13.8 [161]. <!-- claim: 5317792f683f7cbf; evidence: 401a5b2c58528a3d; source: 3cdba85a464d1059 -->

The TypeScript release notes that introduced using declarations warned that because the feature was so recent, most runtimes would not support it natively and runtime polyfills were needed for Symbol.dispose, Symbol.asyncDispose, DisposableStack, AsyncDisposableStack, and SuppressedError [147]. <!-- claim: 046b6187b580ad19; evidence: 4ac69cf5d322aa0f; source: 13f699a32a1d2fc6 -->

*Synthesis:*

- **Standardization:** the TC39 finished-proposals table (§5) is authoritative. The README's status header is stale.
- **Shipping:** MDN's compatibility data served on the fetch date (§5) supersedes the V8 support list on Firefox and Node.
- **The TypeScript 5.2 release-notes statement** that most runtimes lack native support is out of date for Chromium and Node, but still holds for release Safari.

## Implications for an agentic design/review workflow

Everything in this section is my inference from the findings above. It is not a source's finding.

1. **Design time: choose the error strategy per layer before writing code.** Decide which layers recover, translate, or only clean up. Decide where the single boundary handler sits and what it does, whether that is fail fast, fail closed, or a generic response to the user with the details logged on the server. Contract-first interface work should name the errors that are part of each interface's contract, the versioned part, and leave everything else to propagate.
2. **Hand deterministic checks to tools instead of reviewer judgment:**
   - `throw ex;` in C# (CA2200);
   - catch-clause variables typed `any` in TypeScript under strict settings;
   - empty, log-only, or to-do/fix-me handlers;
   - a Throwable that is not the last SLF4J argument;
   - interpolated log templates in .NET (CA2254);
   - a Node `uncaughtException` handler that does not end the process;
   - new `Span.RecordException` or `Span.AddEvent` calls in new OpenTelemetry instrumentation.
3. **Keep these for reviewer judgment:**
   - whether a catch sits at a layer that can actually recover, given that the C++ guidelines' own enforcement heuristics are admittedly fuzzy (pending N7);
   - whether a lower layer's error types leak through a public signature;
   - whether cleanup code can throw and mask the primary failure;
   - whether error details or stack traces can reach users;
   - whether logs contain secrets or personal data.
4. **Calibrate severity to the evidence, not to the name of the anti-pattern:**
   - Swallowed and log-only handlers, catch-all-then-abort, and placeholder handlers can be high severity in services, because of the outage evidence.
   - Generic catch can be medium severity.
   - Log-and-throw duplication should usually be low severity, a hygiene note.
   - OpenTelemetry's rule that severity reflects impact is a usable model for the review findings themselves.
5. **Do not encode literal "catch every error where it occurs" rules.** They would create the anti-pattern the C++ guidelines warn against. Encode "handle where you can recover or must roll back, otherwise propagate to one boundary handler" instead.
6. **Gate advice by version.**
   - Recommend JavaScript `using` only where the target runtimes ship it; release Safari does not. Otherwise use transpilation.
   - Prefer logs-based exception records in new OpenTelemetry instrumentation.
   - Do not recommend Swift typed throws or checked exceptions as a default for public APIs that will evolve.
7. **Do not claim gains in throughput or defect rates from these checks.** The supporting evidence is about outages and defect association in Java- and C#-heavy projects. It does not measure the effect of review policies.

## Methodological Limits and Open Gaps

**Scope of the empirical base.**

The Aspirator figure is stated conditionally: over 30% of the catastrophic failures would have been prevented had Aspirator been used and the identified bugs fixed [126]. <!-- claim: cfc98bbcc109cccc; evidence: 1efacd9066006795; source: 344401f57c206ae3 -->

The defect study itself reports that the majority of the exception handling anti-patterns are not significant in its models [155]. <!-- claim: ed2f54b95b05fbfa; evidence: 291701f770a74f61; source: 153c8410f827d032 -->

Its positive relationships were project-specific, for example Dummy Handler in Umbraco and Hibernate and Generic Catch in Umbraco [155]. <!-- claim: 796d33fec892743f; evidence: 050e91d6965eb1c3; source: 153c8410f827d032 -->

- Both empirical lines come from Java and C# open-source projects, or from production distributed data-intensive systems.
- The Yuan et al. sample is not yet registered evidence (pending N6). Per the paper's abstract and Section 4, it is 198 user-reported failures from Cassandra, HBase, HDFS, Hadoop MapReduce, and Redis, of which 48 were catastrophic.
- No empirical evidence was found for JavaScript or TypeScript, Swift, or C++ specifically.

**Normative, not empirical.** Most of the sources here prescribe practice: language documentation, standards bodies, and style guides. Their agreement is evidence of consensus, not of measured effect.

**Non-standard stack format.**

MDN warns that you cannot rely on the precise content of the stack string due to implementation inconsistencies, even though the property is de facto implemented by all major JavaScript engines [129]. <!-- claim: ee8114656c42bb07; evidence: 8aa1e597cba72b4f; source: e64f59f50596320f -->

*Inference:* this limits any tooling that parses stack text.

**Rejected or unverifiable candidates.** The lead rejected three passages. This dossier makes no claims that depend on them.

- **R6-e002:** the ECMA-262 SuppressedError constructor text. SuppressedError semantics are anchored here through MDN and the TypeScript release notes instead.
- **R6-e003:** the `Error.isError` algorithm.
- **R6-e096:** `std::expected`, which was available only through WebFetch's model-processed extraction.

**Pending evidence.** These passages were observed in fetched pages and are offered to the lead for registration. They are unverified in this dossier until registered.

| ID | Passage | Source |
|---|---|---|
| N1 | "Enabled by default in .NET 10" | CA2200 rule page |
| N2 | "Status: Implemented (Swift 6.0)" | SE-0413 |
| N3 | Error Cause row ending "2022"; `Error.isError` row ending "2026" | TC39 finished-proposals table |
| N4 | Headings "20.5.8 SuppressedError Objects" and "20.5.8.1.1 SuppressedError ( error, suppressed, message )" | ECMA-262 draft |
| N5 | "Semantic conventions 1.44.0" | OpenTelemetry site |
| N6 | Sample sentence from the abstract, and Section 4's count of 48 catastrophic failures | Yuan et al. |
| N7 | E.17's enforcement note "(??? Problem: define "too high")" and E.18's "??? hard, needs a heuristic" | C++ Core Guidelines |
| N8 | "This flag is enabled under the strict family of options" | TypeScript 4.4 release notes |
| N9 | "(since C++11)" and "(constexpr since C++26)" | cppreference `std::throw_with_nested` |

**Open gaps:**

- Whether Swift errors carry a cause or a stack trace. No official source was fetched on this.
- Process policy for unhandled errors in Java (`Thread.UncaughtExceptionHandler`) and C++ (`std::terminate`). Not retrieved.
- .NET `AggregateException` and unobserved task exceptions. Not retrieved.
- No empirical study was found on how well code review catches exception-handling defects.
- Not retrieved:
  - *Effective Java* Item 73 (a book);
  - the wrapping guidance in the 3rd edition of the Framework Design Guidelines;
  - Joyent's practitioner guide to Node.js error handling;
  - Node's `errors.html` page;
  - McCune's anti-pattern catalog;
  - Cabral and Marques' ECOOP 2007 field study.

## Bibliography

[126] [Simple Testing Can Prevent Most Critical Failures: An Analysis of Production Failures in Distributed Data-intensive Systems](http://www.eecg.toronto.edu/~yuan/papers/failure_analysis_osdi14.pdf)
[127] [ECMAScript® 2027 Language Specification (draft), 20.5.9.1 InstallErrorCause](https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-installerrorcause)
[128] [Error: cause - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
[129] [Error.prototype.stack - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack)
[130] [Process | Node.js v26.10.0 Documentation](https://nodejs.org/api/process.html#warning-using-uncaughtexception-correctly)
[131] [Throwable (Java SE 25 & JDK 25)](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Throwable.html)
[132] [Best practices for exceptions - .NET](https://learn.microsoft.com/en-us/dotnet/standard/exceptions/best-practices-for-exceptions)
[133] [CA2200: Rethrow to preserve stack details (code analysis) - .NET](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca2200)
[134] [ECMAScript Explicit Resource Management (proposal README)](https://github.com/tc39/proposal-explicit-resource-management)
[135] [Semantic conventions for exceptions on spans](https://opentelemetry.io/docs/specs/semconv/exceptions/exceptions-spans/)
[136] [Semantic conventions for exceptions in logs](https://opentelemetry.io/docs/specs/semconv/exceptions/exceptions-logs/)
[137] [Exceptions (OpenTelemetry Specification, trace)](https://opentelemetry.io/docs/specs/otel/trace/exceptions/)
[138] [Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
[139] [Error Handling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)
[140] [The Trouble with Checked Exceptions: A Conversation with Anders Hejlsberg, Part II](https://www.artima.com/articles/the-trouble-with-checked-exceptions)
[141] [Exception and error handling | Kotlin Documentation](https://kotlinlang.org/docs/exceptions.html)
[142] [SE-0413: Typed throws](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0413-typed-throws.md)
[143] [Finished Proposals (tc39/proposals)](https://github.com/tc39/proposals/blob/main/finished-proposals.md)
[144] [C++ Core Guidelines, E.2: Throw an exception to signal that a function can't perform its assigned task](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#re-throw)
[145] [std::throw_with_nested - cppreference.com](https://en.cppreference.com/w/cpp/error/throw_with_nested)
[146] [TypeScript 4.4 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html#defaulting-to-the-unknown-type-in-catch-variables---useunknownincatchvariables)
[147] [TypeScript 5.2 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html)
[148] [The Java Language Specification, Java SE 25 Edition, 14.20.3.1 Basic try-with-resources](https://docs.oracle.com/javase/specs/jls/se25/html/jls-14.html#jls-14.20.3.1)
[149] [Logging in C# - .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/logging/overview)
[150] [SLF4J FAQ: In the presence of an exception/throwable, is it possible to parameterize a logging statement?](https://www.slf4j.org/faq.html#paramException)
[151] [Google C++ Style Guide: Exceptions](https://google.github.io/styleguide/cppguide.html#Exceptions)
[152] [A10:2025 Mishandling of Exceptional Conditions](https://owasp.org/Top10/2025/A10_2025-Mishandling_of_Exceptional_Conditions/)
[153] [Deprecating Span Events API](https://opentelemetry.io/blog/2026/deprecating-span-events/)
[154] [Studying the Prevalence of Exception Handling Anti-Patterns](https://arxiv.org/abs/1704.00778)
[155] [Studying the Relationship between Exception Handling Practices and Post-release Defects](https://doi.org/10.1145/3196398.3196435)
[156] [Unchecked Exceptions — The Controversy (The Java Tutorials)](https://docs.oracle.com/javase/tutorial/essential/exceptions/runtime.html)
[157] [using - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/using)
[158] [Error Handling (The Swift Programming Language)](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/errorhandling/)
[159] [Exception Throwing - Framework Design Guidelines](https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/exception-throwing)
[160] [KEEP-0441: Rich Errors, aka Error Union Types: Motivation and Rationale](https://github.com/Kotlin/KEEP/blob/main/proposals/KEEP-0441-rich-errors-motivation.md)
[161] [JavaScript's New Superpower: Explicit Resource Management](https://v8.dev/features/explicit-resource-management)
[162] [MDN browser-compat-data: javascript.statements.using](https://bcd.developer.mozilla.org/bcd/api/v0/current/javascript.statements.using.json)
