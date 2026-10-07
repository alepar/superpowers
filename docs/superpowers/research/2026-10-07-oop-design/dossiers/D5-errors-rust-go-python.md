# Dossier D5: Language-canonical error, exception, logging, and cleanup practice in Rust, Go, and Python, and who owns logging

## Summary

**Short answer (synthesis of the cited findings below).**

Rust, Go and Python canon agree on five maintainability-relevant rules:
1. Separate bugs and unrecoverable conditions (Rust panics; Go panics) from anticipated failures (Rust `Result`; Go `error` values; Python `Exception` subclasses). Python keeps interpreter-exit signals outside `Exception`.
2. Keep the cause chain when adding context: Rust `source()`, Go `%w` with `errors.Is`/`As`, Python `raise ... from` and notes.
3. Treat what callers may match on as a deliberate, documented API decision. Hiding the cause at an abstraction boundary is legitimate.
4. Tie cleanup to scope or ownership (Rust `Drop`, Go `defer`, Python `with`/`ExitStack`), not to garbage collection or manual release on every path.
5. Libraries emit logs; applications configure sinks and formats.

**Several popular review rules are stricter than the canon.** The canon only partly supports these:
- "always `%w`";
- "never `unwrap` in a library";
- "`==` on errors is always wrong";
- "bare `except` is always wrong";
- "never log and rethrow".

Treating them as blockers would inflate severity.

**Key uncertainty.** Two things here are still unsettled:
- The empirical evidence linking error-handling practice to failures or defects comes from Java, C and C# systems. It shows strong effects for ignored or log-only handlers, but weak, project-specific effects for "log and throw".
- No retrieved study measures whether enforcing any of these rules improves maintainability in Rust, Go or Python, or in an agentic workflow.

## Facet Questions and Scope

<!-- facet: F6 -->

The question: what does language-authoritative documentation for Rust, Go and Python say about eight sub-questions, and where do authoritative sources disagree? The cross-language question of who owns logging is included.
- (a) error representation;
- (b) adding context while preserving the cause;
- (c) inspecting causes;
- (d) translating errors at abstraction boundaries;
- (e) stack traces in logs;
- (f) cleanup and resource ownership;
- (g) panic or abort versus recoverable errors;
- (h) defects a reviewer can check.

**In scope:**
- Official documentation, PEPs and release notes, plus the language teams' blogs and wikis.
- Ecosystem crates and tools (anyhow, thiserror, log, tracing, structlog, wrapcheck), labelled as ecosystem.
- Practitioner posts (Andrew Gallant, Dave Cheney, the sled project), labelled as practitioner.
- Google's Go style guide, labelled as an industry style guide.
- Two cross-language empirical studies of exception handling and failures, shared with D6.

**Out of scope (see D6):** JavaScript/TypeScript, the JVM, .NET, C++, Swift, OpenTelemetry exception conventions, and OWASP logging guidance.

## Source Groups and Findings

### 1. Panic/abort versus recoverable errors (sub-question g, with a)

**Rust (std, the Book).**
- The std error module describes two complementary systems: the panic runtime and interfaces, most commonly used to represent bugs that have been detected in your program, and a second system of Result, the error traits, and user defined types, used to represent anticipated runtime failure modes [87]. <!-- claim: 7923af6e4a9dd212; evidence: e22899508495b107; source: 2605596e9c25fc21 -->
- The book argues that calling panic! makes the decision that a situation is unrecoverable on behalf of the calling code, whereas returning a Result value gives the calling code options [89]. <!-- claim: 7545e1af916dfefe; evidence: c30274be4c66072f; source: f67c0241851b48ae -->
- The book says that when failure is expected, such as a parser being given malformed data or an HTTP request returning a status that indicates a rate limit, it is more appropriate to return a Result than to make a panic! call [89]. <!-- claim: 40d9d2a0482c9903; evidence: c34a16b7877607a6; source: f67c0241851b48ae -->
- The book treats a contract violation as a caller-side bug, so panicking when the contract is violated makes sense and is not a kind of error the calling code should have to explicitly handle [89]. <!-- claim: 7e0ec2f48ee4d5ee; evidence: d82b642ed086d3c7; source: f67c0241851b48ae -->
- The catch_unwind documentation says it is not recommended for a general try/catch mechanism, that the Result type is more appropriate for functions that can fail on a regular basis, and that it is not guaranteed to catch all panics [91]. <!-- claim: 40ee5743ff74d7d3; evidence: f403d0af8e1e885a; source: 69f6e8f67ab2860c -->
- The same page warns that a panic is not always implemented via unwinding but can be implemented by aborting the process, so the function might not catch all panics [91]. <!-- claim: 152433bb0a17edae; evidence: 88d0bb1af1e5a481; source: 69f6e8f67ab2860c -->

**Go (FAQ, Effective Go, code-review wiki).**
- The language FAQ says that coupling exceptions to a control structure, as in the try-catch-finally idiom, results in convoluted code and tends to encourage programmers to label too many ordinary errors as exceptional [43]. <!-- claim: 9a2036bd069a2710; evidence: d4a9c1b8bea23a25; source: a442fae7b095fc79 -->
- The code-review comments say not to use panic for normal error handling, and to use error and multiple return values instead [44]. <!-- claim: 5a3647ce313d5a8d; evidence: 474bbdfde1036ed2; source: 7d7209181e775e43 -->
- The language guide says real library functions should avoid panic, because if the problem can be masked or worked around, it's always better to let things continue to run rather than taking down the whole program [45]. <!-- claim: ca0f520165a041bd; evidence: 071af2cb013f0367; source: 5d82dc9a454dc245 -->
- The guide says its panic-and-recover parsing pattern should be used only within a package: the parser turns its internal panic calls into error values and does not expose panics to its client, which the guide calls a good rule to follow [45]. <!-- claim: c7bcc31dfa181fb9; evidence: 25c4a6d23296d215; source: 5d82dc9a454dc245 -->
- *Industry style guide (Google):* The industry guide likewise says such panics are never allowed to escape across package boundaries and do not form part of the package’s API [110]. <!-- claim: 4f5c0c6609d64ccc; evidence: fc46ccaef2d6fc51; source: 86d8597102301157 -->

**Python (built-in exceptions docs, glossary).**
- The documentation says all built-in, non-system-exiting exceptions are derived from the exception base class and that all user-defined exceptions should also be derived from this class [115]. <!-- claim: 553114ae82634058; evidence: f204ff9b5a103f0e; source: 874b19884f7c546b -->
- The keyboard-interrupt exception inherits from BaseException so as to not be accidentally caught by code that catches Exception and thus prevent the interpreter from exiting [115]. <!-- claim: 105ff2eb0bb4e50b; evidence: 48ab0fd7eb904ff2; source: 874b19884f7c546b -->
- The glossary defines EAFP, easier to ask for forgiveness than permission, as a common coding style that assumes the existence of valid keys or attributes and catches exceptions if the assumption proves false [124]. <!-- claim: cbfccf8f04a2a2cf; evidence: 29c97815f4c24843; source: b7d43d26c4ffff23 -->
- The glossary warns that in a multi-threaded environment the LBYL approach can risk introducing a race condition between the looking and the leaping [124]. <!-- claim: 6bd450098e5980d2; evidence: 2e95b6d71a0791e1; source: b7d43d26c4ffff23 -->

### 2. Adding context while preserving the cause chain (sub-questions a, b)

**Rust.**
- The API guidelines say error types should always implement the std::error::Error trait, which allows the error to be used as the source() of another error [88]. <!-- claim: f3c142b52eae913d; evidence: ab3f467bd907b198; source: da61cf64a2e10a8b -->
- The trait documentation says Error::source() is generally used when errors cross abstraction boundaries, so a high-level module can provide its own errors while also revealing some of the implementation for debugging [86]. <!-- claim: 8de2d70d65d3b6c7; evidence: 62711a5ff963c90d; source: 406996ddd3038b82 -->
- The trait documentation also says that in error types that wrap an underlying error, the underlying error should be either returned by the outer error’s Error::source() or rendered by the outer error’s Display implementation, but not both [86]. <!-- claim: 42bcb0fddd704b28; evidence: e878a39f704d0839; source: 406996ddd3038b82 -->
- The book explains that error values that have the ? operator called on them go through the from function of the From trait, which converts the received error type into the error type defined in the return type of the current function [92]. <!-- claim: 98ce657748c39d78; evidence: fb8919c6922603f9; source: 94bdbe9e3bb8d51f -->
- The older cause() method is marked deprecated since 1.33.0, replaced by Error::source, which can support downcasting [86]. <!-- claim: 8c117959c839bc48; evidence: d5ccd6d0a22d75b4; source: 406996ddd3038b82 -->

**Go.**
- The error-handling blog post says it is the error implementation’s responsibility to summarize the context, so the error returned by os.Open formats as “open /etc/passwd: permission denied,” not just “permission denied” [106]. <!-- claim: a452653d43d680dc; evidence: 2b8d0b0c945839a1; source: ed948d384a331d6a -->
- The language guide recommends that, when feasible, error strings identify their origin, such as by having a prefix naming the operation or package that generated the error [45]. <!-- claim: 57c3f3f736ba7d4f; evidence: e5182816f44f7039; source: 5d82dc9a454dc245 -->
- The wrapping blog post explains that in Go 1.13 the fmt.Errorf function supports a new %w verb, whose result has an Unwrap method returning the argument of %w, and that in all other ways %w is identical to %v [104]. <!-- claim: e32fc917582d7272; evidence: 34f2e5f85d3b6fc0; source: 8de9f533db3604ee -->
- The errors package says a non-nil error returned by Join implements the Unwrap() []error method and that the errors may be inspected with Is and As [102]. <!-- claim: 819d6c0db0a1746f; evidence: 63c515936678953d; source: f63de84edb6d2d0e -->
- The release notes add that the fmt.Errorf function now supports multiple occurrences of the %w format verb, returning an error that wraps all of those error operands [103]. <!-- claim: 63cd3cbaf642eb5e; evidence: dd1c5b16a446046c; source: 914ae8779c0cc168 -->
- *Industry style guide (Google):* The guide also says that when adding information to errors you should avoid redundant information that the underlying error already provides [110]. <!-- claim: 392625249c770fa7; evidence: a56dc640a039f058; source: 86d8597102301157 -->

**Python.**
- The chaining PEP proposed three standard attributes on exception instances: __context__ for implicitly chained exceptions, __cause__ for explicitly chained exceptions, and __traceback__ for the traceback, with a new raise ... from statement that sets the __cause__ attribute [114]. <!-- claim: 288d9b4660f5c324; evidence: 45633e2166494b98; source: 59f73ab994536773 -->
- The motivation given is that an exception handler may intentionally re-raise an exception to provide extra information or to translate an exception to another type, and the __cause__ attribute provides an explicit way to record the direct cause [114]. <!-- claim: 2305502ab76ff68f; evidence: 2a86ef0088d08ff4; source: 59f73ab994536773 -->
- The tutorial says that to indicate that an exception is a direct consequence of another, the raise statement allows an optional from clause [116]. <!-- claim: 70354af1bc638177; evidence: 4d65dce5102e6474; source: 8687f74540356d37 -->
- The style guide says to use exception chaining appropriately: raise X from Y should be used to indicate explicit replacement without losing the original traceback [117]. <!-- claim: 2a902513f6f0d9e8; evidence: c3a87a165cfa42c1; source: 6b1e2118b392d9ff -->
- The add_note method adds the string note to the exception’s notes, which appear in the standard traceback after the exception string [115]. <!-- claim: 3e772429aff9ad33; evidence: 3d6b98252a1a1dd9; source: 874b19884f7c546b -->
- The notes PEP motivates this by observing that further information may be available when the exception is caught and re-raised, or included in an ExceptionGroup [120]. <!-- claim: 8e2ed9b3de8a695a; evidence: c1ac3b563183becd; source: 027d180d8c9b144a -->
- The exception-groups PEP observes that the interpreter is able to propagate at most one exception at a time, and that while chaining links exceptions related as cause or context, there are situations where multiple unrelated exceptions need to be propagated together as the stack unwinds [119]. <!-- claim: 53e46ddfa831b7e3; evidence: a6ccee92ec775686; source: cee6ec8b4923e289 -->

### 3. Inspecting and matching causes (sub-question c)

**Rust.**
- The std error module lists match and downcast as the interfaces for reacting to errors [87]. <!-- claim: cd548d1edb7a23c0; evidence: 024e7976d5353a45; source: 2605596e9c25fc21 -->
- The guideline notes that adding 'static allows the error trait object to be used with Error::downcast_ref [88]. <!-- claim: d2656f4fe07935f2; evidence: 5cd622900ebe1228; source: da61cf64a2e10a8b -->

**Go.**
- The package documentation says Is examines the tree of its first argument looking for an error that matches the second and should be used in preference to simple equality checks [101]. <!-- claim: 8d4212d5c95a024e; evidence: 41ab7993c36edb23; source: 1a28cd88ae922db0 -->
- The documentation of As says it finds the first error in the error tree that matches the target and sets the target to that error value, and recommends AsType for most uses [102]. <!-- claim: 03c153d94db77769; evidence: f50a66dcb1a0f2cf; source: f63de84edb6d2d0e -->
- The package also notes that Unwrap only calls a method of the form Unwrap() error and in particular does not unwrap errors returned by Join [102]. <!-- claim: fc22d3dd9a6769d7; evidence: 2f0fe9d486e89faf; source: f63de84edb6d2d0e -->
- The error-values FAQ says comparisons to io.EOF need not be changed, because io.EOF should never be wrapped [105]. <!-- claim: 7b308ee98fc72b55; evidence: 29702ff5fb39a16a; source: 56f5a9f3635207d0 -->
- The language guide says callers that care about the precise error details can use a type switch or a type assertion to look for specific errors and extract details [45]. <!-- claim: cefb72489f067656; evidence: 818e11700447ccaa; source: 5d82dc9a454dc245 -->
- The net package's error interface marks its Temporary method as deprecated, saying temporary errors are not well-defined, most temporary errors are timeouts, and the few exceptions are surprising [112]. <!-- claim: b14e8c9057bb1404; evidence: 3a1c5c9505bab47e; source: d105e9cbc5b1e66a -->

Inference: the type-assertion advice is the pre-Go-1.13 idiom. The current errors package prefers `As`/`AsType` because they see through wrapping. Agents trained on older text may reproduce the stale idiom (see "Counterevidence").

**Python.**
- The style guide says to design exception hierarchies based on the distinctions that code catching the exceptions is likely to need, rather than the locations where the exceptions are raised [117]. <!-- claim: e16824cfc46c747a; evidence: e375e3e525586280; source: 6b1e2118b392d9ff -->
- The tutorial says it is good practice to be as specific as possible with the types of exceptions that we intend to handle, and to allow any unexpected exceptions to propagate on [116]. <!-- claim: ea39ef52eeb9f7eb; evidence: 1e63c274520d8c92; source: 8687f74540356d37 -->
- The style guide says to limit the try clause to the absolute minimum amount of code necessary for all try/except clauses, which avoids masking bugs [117]. <!-- claim: 6a0f062b21cc3730; evidence: 1154abcc46f2dfbb; source: 6b1e2118b392d9ff -->

### 4. Translation at abstraction boundaries and implementation leakage (sub-question d)

**Go: wrapping is an API commitment.**
- The wrapping blog post advises wrapping an error to expose it to callers, and not wrapping an error when doing so would expose implementation details [104]. <!-- claim: 1eae93937ffcd6c6; evidence: eb8392f2bd8b284e; source: 8de9f533db3604ee -->
- The post states that wrapping an error makes that error part of your API, so if you don’t want to commit to supporting that error as part of your API in the future, you shouldn’t wrap the error [104]. <!-- claim: becc6196176b388c; evidence: 0cdf9e9e080db1cd; source: 8de9f533db3604ee -->
- The post also says a person trying to understand the error has the same information either way, and that the choice to wrap is about whether to give programs additional information or to withhold that information to preserve an abstraction layer [104]. <!-- claim: 2baeeddab5e5562b; evidence: 8ff23b173c866f70; source: 8de9f533db3604ee -->
- The post's example repackages the *os.PathError returned by os.Open as a new error with the same text, using the %v formatting verb because %w would permit the caller to unwrap the original *os.PathError [104]. <!-- claim: 3d1a109eea86535a; evidence: 9449cdb899af0b3f; source: 8de9f533db3604ee -->
- The post says a package which returns errors should describe what properties of those errors programmers may rely on, and a well-designed package will also avoid returning errors with properties that should not be relied upon [104]. <!-- claim: 8d659169de5f9d68; evidence: f7e22b8778d058fe; source: 8de9f533db3604ee -->
- The error-values FAQ adds that using %w may expose implementation detail that can constrain the evolution of your code, because callers can depend on the type and value of the error you’re wrapping [105]. <!-- claim: 9d402f2fb95536ee; evidence: 2f7bfa7122e678bd; source: 56f5a9f3635207d0 -->
- *Industry style guide (Google):* The guide says it is sometimes necessary to transform an error into a new error message, hiding the specifics of the original error, which is particularly beneficial at system boundaries such as RPC, IPC, and storage, where domain-specific errors are translated into a canonical error space [110]. <!-- claim: 7d87379f1d4b4473; evidence: 61f29ffac0685aa2; source: 86d8597102301157 -->

**Rust.** The std `source()` framing is in §2.
- *Ecosystem (thiserror):* The thiserror README says the crate deliberately does not appear in your public API, so switching from handwritten impls to thiserror or vice versa is not a breaking change [96]. <!-- claim: 97364119aa41d647; evidence: 4922dfd0448b4cb1; source: 97eb4dd8c8069535 -->
- *Ecosystem (thiserror):* The same README describes hiding implementation details of an error representation behind an opaque error type, so that the representation is able to evolve without breaking the crate's public API [96]. <!-- claim: 61ab2c59a6358e07; evidence: fb9bdc3f6e4ff55d; source: 97eb4dd8c8069535 -->
- *Ecosystem (anyhow):* The anyhow README says to use anyhow if you don't care what error type your functions return, which is common in application code, and to use thiserror if you are a library that wants to design your own dedicated error types so that on failures the caller gets exactly the information that you choose [95]. <!-- claim: cf14d224600cc9ed; evidence: c7d4b42013071c2b; source: 59df24d130e41fd9 -->
- *Practitioner (sled project blog, Tyler Neely, 2020):* The sled post argues that throwing all errors into a single global error enum makes the try ? operator bug-prone and increases the chances that a local error will slip through and propagate to a caller that is not capable of handling it [98]. <!-- claim: 00bba26129cf8e38; evidence: d6311e295a948252; source: 1581269d83459316 -->

**Python.**
- The style guide asks that, when an inner exception is deliberately replaced, relevant details be transferred to the new exception, such as preserving the attribute name when converting KeyError to AttributeError or embedding the text of the original exception in the new exception message [117]. <!-- claim: 5a8567a3f05be82c; evidence: 197824b25b771440; source: 6b1e2118b392d9ff -->
- The built-in exceptions documentation says that when raising a new exception while another exception is already being handled, the new exception’s __context__ attribute is automatically set to the handled exception [115]. <!-- claim: 71b9cd10b7136867; evidence: f5433144c5135ee8; source: 874b19884f7c546b -->
- Setting __cause__ also implicitly sets __suppress_context__ to True, so raise new_exc from None replaces the old exception with the new one for display purposes while leaving the old exception available in __context__ for introspection when debugging [115]. <!-- claim: dd6c35adefd7d4d6; evidence: 99ba32e776258159; source: 874b19884f7c546b -->
- The documentation says an explicitly chained exception in __cause__ is always shown when present, while an implicitly chained exception in __context__ is shown only if __cause__ is None and __suppress_context__ is false [115]. <!-- claim: bc6599eddea016bb; evidence: 6ec2283527bb22b7; source: 874b19884f7c546b -->

Inference, relevant to a common review rule: `raise NewError(str(e))` inside an `except` block does not lose the original exception. It is kept as `__context__` (see the built-in exceptions finding above) and shown as "During handling of the above exception…". The real defects are:
- the translation is labelled implicitly instead of with `from`;
- the message is duplicated.

The cause is actually hidden only with `from None` (see the `__suppress_context__` finding above) or when the new exception is raised outside the handler.

### 5. Getting stack traces and backtraces into logs (sub-question e)

**Rust.**
- The capture function of the std backtrace type will be a noop if the RUST_BACKTRACE or RUST_LIB_BACKTRACE backtrace variables are both not set, and will actually capture a backtrace if either environment variable is set and enabled [90]. <!-- claim: aa8d3a29788a4cdf; evidence: 860cf564afd77586; source: d0932002833dcd1c -->
- The trait also offers a provide() method that provides type-based access to context intended for error reports [86]. <!-- claim: b7d52afb0683c66d; evidence: 593056312f13dd8c; source: 406996ddd3038b82 -->

Inference: R5's fetch shows `provide()` marked nightly-only. That status is pending registration (see §11), so stable Rust is treated here as having no standard way to pull a backtrace out of a `dyn Error`.

- *Ecosystem (anyhow):* If using Rust ≥ 1.65, anyhow captures and prints a backtrace with the error when the underlying error type does not already provide its own, and the backtraces must be enabled through the environment variables described in std::backtrace [95]. <!-- claim: 04243dbb24431cdf; evidence: f468a766c10a8db0; source: 59df24d130e41fd9 -->

**Go.**
- The error-syntax post notes that a recurring comment in user surveys is about the lack of stack traces associated with an error, which could be addressed with support functions that produce and return an augmented error [107]. <!-- claim: fd96b2444d4392c2; evidence: 1e860fc06fff8f59; source: 9b7334cab4a777be -->

Inference: standard-library Go errors carry no stack trace. Traces come from helper libraries or from logging at the point of handling.

**Python.**
- The logging documentation says that if exc_info does not evaluate as false, exception information is added to the logging message, using an exception tuple or exception instance if provided and otherwise calling sys.exc_info() to get the exception information [121]. <!-- claim: c119b61508b1a567; evidence: ff0814119354d2a7; source: 025d6e6b85b36b73 -->
- The documentation says exception() logs a message with level ERROR on the logger with exception info added to the logging message, and that this method should only be called from an exception handler [121]. <!-- claim: 3abd0cb388dd61f8; evidence: aac079569d8293e6; source: 025d6e6b85b36b73 -->
- The documentation distinguishes stack_info, which gives stack frames from the bottom of the stack up to the logging call in the current thread, from exc_info, which gives information about stack frames which have been unwound, following an exception, while searching for exception handlers [121]. <!-- claim: 304360ac25b7b78e; evidence: 8676ec61cda09752; source: 025d6e6b85b36b73 -->

Inference: `logger.error(e)` inside an `except` block records only `str(e)`. `logger.exception(...)` or `exc_info=True` is the canonical way to keep the traceback.

### 6. Cleanup and resource ownership (sub-question f)

**Rust.**
- The book explains that you can specify code to be run whenever a value goes out of scope and the compiler will insert this code automatically, so you still won’t leak resources without placing cleanup code everywhere [93]. <!-- claim: 4a047e058b0187e4; evidence: fd3a7451eb0cb07b; source: 33470aff05cef257 -->

**Go.**
- The language guide says deferring the close guarantees that you will never forget to close the file, a mistake that is easy to make if you later edit the function to add a new return path, and that the close then sits near the open [45]. <!-- claim: bf541ef8d0e8478c; evidence: 381d9aa974843967; source: 5d82dc9a454dc245 -->

**Python.**
- The style guide says that when a resource is local to a particular section of code, a with statement should be used to ensure it is cleaned up promptly and reliably after use, and that a try/finally statement is also acceptable [117]. <!-- claim: 75015a082d13240d; evidence: fddb77f0ce58714b; source: 6b1e2118b392d9ff -->
- The tutorial says the with statement allows objects like files to be used in a way that ensures they are always cleaned up promptly and correctly [116]. <!-- claim: 22bcd0a81786a73d; evidence: 013f281153e889a0; source: 8687f74540356d37 -->
- The contextlib documentation describes ExitStack as a context manager designed to make it easy to programmatically combine other context managers and cleanup functions, especially those that are optional or otherwise driven by input data [123]. <!-- claim: 09e2f562bd1ca526; evidence: 9fba0e7955053046; source: b6305e439d4a4ff8 -->
- The documentation also notes that ExitStack callbacks are not invoked implicitly when the context stack instance is garbage collected [123]. <!-- claim: d4071027ccb4b4da; evidence: 0eef02e88ffda3e0; source: b6305e439d4a4ff8 -->
- The style guide discourages return, break and continue within the finally suite of a try...finally where they would jump outside the finally suite, because such statements will implicitly cancel any active exception that is propagating through the finally suite [117]. <!-- claim: 00c45b6009cacb5e; evidence: 9d4aa327ce646bf8; source: 6b1e2118b392d9ff -->
- The analysis behind the finally-block PEP found 203 instances of control flow instructions in a finally block across 120,964,221 lines of Python code [118]. <!-- claim: de347e05abc70858; evidence: 8d4a95e4eb66a6fe; source: 1ff0db3b11a7f479 -->
- The analysis classified 149 of them as clearly incorrect, able to lead to unintended swallowing of exceptions [118]. <!-- claim: a2694c8eb140b8f7; evidence: 1a8c35f242e2de4b; source: 1ff0db3b11a7f479 -->
- The analysis called the pattern followed by many of the error cases obviously incorrect because it deliberately logs and swallows Exception subclasses, while silently swallowing BaseExceptions [118]. <!-- claim: e5d0418d0d33009c; evidence: 47f26b2f12075bfe; source: 1ff0db3b11a7f479 -->
- CPython will emit a SyntaxWarning in version 3.14, leaving open whether, and when, this will become a SyntaxError [118]. <!-- claim: 8dd75e8d59862387; evidence: 5a009517a3298363; source: 1ff0db3b11a7f479 -->

### 7. Reviewer-checkable defects and the tools that flag them (sub-question h)

**Rust: `unwrap`/`expect`.** The canon allows them.
- The std error module says expect is generally preferred because its message conveys your intent and assumptions, while unwrap can still be a good fit where you can trivially show that a piece of code will never panic [87]. <!-- claim: 3ab3810f7bf3056a; evidence: aeab8280f1b1f383; source: 2605596e9c25fc21 -->
- The book adds that if you can ensure by manually inspecting the code that you will never have an Err variant, it is perfectly acceptable to call expect and document the reason in the argument text [89]. <!-- claim: ebc36f455b35ab14; evidence: b5ada8e20cb5cacd; source: f67c0241851b48ae -->
- The std docs also warn that the expect-as-error-message style often ends up repeating information that is already communicated by the source error being unwrapped [87]. <!-- claim: b1211ae66baf14cc; evidence: 40273cfdb1d1f3be; source: 2605596e9c25fc21 -->

**Rust: lints.** Their lint-group placements (`restriction`, `pedantic`) are pending registration (§11).
- The clippy map_err_ignore lint explains that a map_err that ignores its argument throws away the original error rather than allowing the enum to contain and report the cause of the error [94]. <!-- claim: 2590b2ddc2c59e41; evidence: 565e3e473bb62c66; source: ce3c5c99fbc3180a -->
- The clippy unwrap_used lint says it is better to handle the None or Err case, or at least call .expect(_) with a more helpful message, but that for a lot of quick-and-dirty code unwrap is a good choice, which is why the lint is Allow by default [94]. <!-- claim: 24b3233e43a2e4e2; evidence: 04ee2e481f55da49; source: ce3c5c99fbc3180a -->
- The missing_panics_doc lint checks the doc comments of publicly visible functions that may panic and warns if there is no # Panics section [94]. <!-- claim: ae1317f82dfa4774; evidence: d24f8213cbfe8263; source: ce3c5c99fbc3180a -->

**Rust: API-guideline rules.**
- The same guideline says never to use () as an error type, even where there is no useful additional information for the error to carry [88]. <!-- claim: 2aa8d636538c1129; evidence: e9703d73cb08b845; source: da61cf64a2e10a8b -->
- The guideline also says error types should implement the Send and Sync traits, because an error that is not Send cannot be returned by a thread run with thread::spawn [88]. <!-- claim: 5a033db10fbc8124; evidence: 444a5b0418cbffa0; source: da61cf64a2e10a8b -->

**Rust: practitioner view.**
- *Practitioner (Andrew Gallant, "Using unwrap() in Rust is Okay"):* The post argues that, broadly speaking, using unwrap() is okay if it’s in test/example code or when panicking indicates a bug [97]. <!-- claim: 74e664ca5dd34554; evidence: 135fb6827361b436; source: e87b673266fa7386 -->
- *Practitioner (Andrew Gallant):* The same post argues against a lint on unwrap(), while granting that such a lint is not entirely unreasonable in certain contexts [97]. <!-- claim: 50d1d625d18d5367; evidence: e208523f75fe045e; source: e87b673266fa7386 -->
- *Practitioner (Andrew Gallant):* The post also suggests anyhow for application oriented code, but concrete error types with an appropriate std::fmt::Display impl for a library intended for others to use [97]. <!-- claim: ceb2a8827e4a86b6; evidence: 494977e2671271dc; source: e87b673266fa7386 -->

**Go.**
- The code-review comments say not to discard errors using _ variables: if a function returns an error, check it, and handle the error, return it, or, in truly exceptional situations, panic [44]. <!-- claim: a7dbd15315e1f5bc; evidence: e8662cf2b2aae64b; source: 7d7209181e775e43 -->
- The comments also say error strings should not be capitalized or end with punctuation, since they are usually printed following other context [44]. <!-- claim: 14efafbef7d9a17d; evidence: 58f2d13e45561284; source: 7d7209181e775e43 -->
- The language FAQ advises functions that return errors to always use the error type in their signature rather than a concrete type such as *MyError, to help guarantee the error is created correctly [43]. <!-- claim: 3e6185f0ec3e2099; evidence: 0eb4ee0b31c5e77c; source: a442fae7b095fc79 -->
- The slog announcement says a vet check was added to catch common mistakes, but the design was not changed [109]. <!-- claim: cbe053c3453cf322; evidence: 173655dbcfc01314; source: 2c35882d5c389d51 -->
- *Ecosystem linter:* The wrapcheck linter checks that errors from external packages are wrapped during return to help identify the error source during debugging [113]. <!-- claim: e3fed67fe71da30f; evidence: 38d976f0a6ff071c; source: 9b727789dda4ca37 -->

**Python.**
- The style guide warns that a bare except: clause will catch SystemExit and KeyboardInterrupt exceptions, making it harder to interrupt a program with Control-C, and can disguise other problems [117]. <!-- claim: c266c68869c54199; evidence: 2a9d66ae30641813; source: 6b1e2118b392d9ff -->
- The same guide limits bare except clauses to two cases: when the exception handler will be printing out or logging the traceback, or when the code needs to do some cleanup work but then lets the exception propagate upwards with raise [117]. <!-- claim: af2dc13467d81b5a; evidence: 36a6a91adc0d5028; source: 6b1e2118b392d9ff -->
- The return/break/continue-in-`finally` evidence is in §6.

### 8. Logging ownership: libraries emit, applications configure (cross-language)

**Python.**
- The logging module's idiomatic usage is for the majority of code to create a module level logger with getLogger(__name__) and use that logger to do any needed logging [121]. <!-- claim: 58d6764313a43343; evidence: e039d343af25375f; source: 025d6e6b85b36b73 -->
- The logging tutorial strongly advises not adding any handlers other than NullHandler to your library’s loggers, because the configuration of handlers is the prerogative of the application developer who uses your library [122]. <!-- claim: 4937a89091f32653; evidence: a91ab1ae702823cf; source: 9af3616aa3d10c5e -->
- The tutorial also strongly advises not logging to the root logger in your library, and using a logger with a unique and easily identifiable name, such as the __name__ for your library’s top-level package or module, instead [122]. <!-- claim: a2b3a30881c63785; evidence: 386d89cd444c8ad4; source: 9af3616aa3d10c5e -->
- The tutorial says that if the using application does not use logging and library code makes logging calls, events of severity WARNING and greater will be printed to sys.stderr, and it regards this as the best default behaviour [122]. <!-- claim: 9b55f81f6abaa874; evidence: f2b6bef9a1cddd45; source: 9af3616aa3d10c5e -->

**Go.**
- The slog announcement explains that large programs often end up including more than one structured logging package through their dependencies, so the main program might have to configure each of them so that the log output goes to the same place, in the same format [109]. <!-- claim: 08317e7fc9996853; evidence: 47b3dae2c08cc482; source: 2c35882d5c389d51 -->
- The announcement says the API was divided into a frontend, Logger, that calls a backend interface, Handler, so that existing logging packages can talk to a common backend and interoperate without having to be rewritten [109]. <!-- claim: d8b229997d8e4023; evidence: 0dd21c1e4adf081d; source: 2c35882d5c389d51 -->

**Rust.**
- *Ecosystem (log crate):* The log crate documentation says libraries should link only to the log crate and use the provided macros to log whatever information will be useful to downstream consumers [99]. <!-- claim: 7f6df29d23fe6c62; evidence: c4bdf96d4e168bdd; source: 884f8f67139e4776 -->
- *Ecosystem (log crate):* The same documentation says executables should choose a logging implementation and initialize it early in the runtime of the program [99]. <!-- claim: 261e187e8c21b9af; evidence: 10dfae2701f95e04; source: 884f8f67139e4776 -->
- *Ecosystem (tracing):* The tracing documentation warns that libraries should not call set_global_default(), because doing so will cause conflicts when executables that depend on the library try to set the default later [100]. <!-- claim: 594381e7160de423; evidence: e9c3070260b08806; source: ec7c21574202e951 -->

Inference: no retrieved Rust, Go or Python source contradicts this division. It is the most consistent cross-language finding in this dossier.

### 9. Handle once versus log-and-rethrow

**Go team blog.**
- The error-handling blog post suggests giving the user a simple error message with an appropriate HTTP status code while logging the full error to the developer console for debugging purposes [106]. <!-- claim: 317f74919b1ded45; evidence: 1cb06490247593ad; source: ed948d384a331d6a -->

**Industry style guide (Google).**
- The guide's advice on logging errors is to avoid duplication: if you return an error, it’s usually better not to log it yourself but rather let the caller handle it, for example by choosing to log the error or to rate-limit logging [110]. <!-- claim: eca0c99494ec2a80; evidence: b11acf51038cf61d; source: 86d8597102301157 -->
- The guide notes the downside that any logging is then written using the caller’s line coordinates [110]. <!-- claim: 220a972f17024c11; evidence: 73898e7c5393b5cd; source: 86d8597102301157 -->

**Practitioner (Dave Cheney, 2016, GoCon talk extract).**
- The post defines handling an error as inspecting the error value and making a decision [111]. <!-- claim: d91584fc634f35fe; evidence: ba142ee293ec8d0f; source: a028f3cbda269354 -->
- The post says that when a function both logs and returns an error you get a stack of duplicate lines in your log file, while at the top of the program you get the original error without any context [111]. <!-- claim: afe3557c8ec5b2ec; evidence: 62c530de53f67ca8; source: a028f3cbda269354 -->

**Python.**
- The tutorial's task table maps reporting an error regarding a particular runtime event to raising an exception, and lists reporting suppression of an error without raising an exception, as in an error handler in a long-running server process, as a separate task [122]. <!-- claim: cc1711b36be9bb58; evidence: ba2ca984a6afe7a2; source: 9af3616aa3d10c5e -->
- The tutorial describes the most common pattern for handling Exception as printing or logging the exception and then re-raising it, allowing a caller to handle the exception as well [116]. <!-- claim: 703358c0a8893bab; evidence: 472c9b49d045e9da; source: 8687f74540356d37 -->

**Empirical, cross-language (Java/C/C# systems; shared with D6).**
- A study of production failures found that almost all (92%) of the catastrophic system failures are the result of incorrect handling of non-fatal errors explicitly signaled in software [126]. <!-- claim: 5c0ea1641c25cb80; evidence: 0d208da5723e86b7; source: 344401f57c206ae3 -->
- The study found that in 35% of the catastrophic failures the faults in the error handling code fall into three trivial patterns: an error handler that is simply empty or only contains a log printing statement, a handler that aborts the cluster on an overly-general exception, and a handler that contains expressions like fix-me or to-do in the comments [126]. <!-- claim: d55c6bff6fc604a0; evidence: 029f817dc64d04e9; source: 344401f57c206ae3 -->
- The study attributes 25% of the catastrophic failures to ignoring explicit errors, and counts an error handler that only logs the error as ignoring the error [126]. <!-- claim: 08554c90c1140d37; evidence: 4b5226b3be27cce6; source: 344401f57c206ae3 -->
- The authors' static checker, Aspirator, would have prevented over 30% of the catastrophic failures had it been used and the identified bugs fixed [126]. <!-- claim: 3d9acb8100e04d80; evidence: 1efacd9066006795; source: 344401f57c206ae3 -->
- A post-release defect study found that although the majority of the exception handling anti-patterns are not significant in its models, there exist anti-patterns that can provide significant explanatory power to the probability of post-release defects [155]. <!-- claim: 0a210129d172bf0c; evidence: 291701f770a74f61; source: 153c8410f827d032 -->
- The same study found that the total number of catch blocks affected by Log and Throw has a positive relationship with the probability of post-release defects in Hadoop, while noting that this anti-pattern is not prevalent in practice and was found to have a small effect [155]. <!-- claim: c61e7ccd637c0265; evidence: cae4ac2d67b3e0f9; source: 153c8410f827d032 -->
- The percentage of catch blocks affected by the Dummy Handler anti-pattern has a positive relationship with the probability of post-release defects in both Umbraco and Hibernate [155]. <!-- claim: 66312879bfdc7774; evidence: 050e91d6965eb1c3; source: 153c8410f827d032 -->
- A prevalence study found that only five anti-patterns, Unhandled Exceptions, Catch Generic, Unreachable Handler, Over-catch and Destructive Wrapping, are detected in over 20% of the catch blocks or throws statements in median [154]. <!-- claim: 17300272bb6343db; evidence: 551f795db295f22a; source: aa30ad10dfb232a4 -->

Inference:
- The failure study supports treating log-only handlers as high-severity: logging is not handling.
- The defect study gives only weak, single-project support for treating "log and throw" as a defect.

### 10. Structured logging and secrets

**Go (stdlib).**
- The slog package provides structured logging, in which log records include a message, a severity level, and various other attributes expressed as key-value pairs [108]. <!-- claim: 215c15018fdca8bf; evidence: 97114f934fb5c455; source: 8213d696f087ccf2 -->
- The slog documentation says that if a type implements the LogValuer interface, its LogValue method controls how values of the type appear in logs, for example to redact secret information like passwords [108]. <!-- claim: 23fb233da89d4f94; evidence: 8889486234ed3d5f; source: 8213d696f087ccf2 -->

**Industry style guide (Google).**
- The guide also warns to be careful with PII, because many log sinks are not appropriate destinations for sensitive end-user information [110]. <!-- claim: 3e788d4141dfd212; evidence: 12eb6a1ae6c37446; source: 86d8597102301157 -->

**Ecosystem (structlog).**
- The structlog documentation says that in production you should emit structured output, like JSON, which is a lot easier to parse by log aggregators [125]. <!-- claim: f1ebe714b27c7270; evidence: 5904a6558ca0b573; source: 455bdf36fcbe1253 -->
- The same documentation recommends having as few log entries per request as possible, because the less noise, the more insights [125]. <!-- claim: ca1de16223b49ed9; evidence: b9335009d246ba69; source: 455bdf36fcbe1253 -->

Not retrieved: no Python standard-library guidance on redacting secrets surfaced (R5 query q029). OWASP logging guidance and OpenTelemetry exception attributes are covered in D6.

### 11. Stable theory versus version-specific API

**Stable across versions (synthesis):**
- the panic/error split (§1);
- cause chains (§2);
- boundary translation as an API decision (§4);
- scoped cleanup (§6);
- library/application logging ownership (§8).

**Version-specific facts with anchors in this dossier:**
- `cause()` deprecated since Rust 1.33.0 (§2);
- `%w` in Go 1.13 (§2);
- anyhow's backtrace capture on Rust ≥ 1.65 (§5);
- the SyntaxWarning for control flow in `finally` in CPython 3.14 (§6).

**Version facts read in R5's fetched pages but not yet registered as evidence.** Treat these as unverified until the lead registers them (return block, items N1–N21); they are not cited here.

| Item | Rust | Go | Python |
|---|---|---|---|
| Error type / chaining | `Error::source` badge 1.30.0; `description()` deprecated 1.42.0 | `errors.Is` added go1.13; `errors.Join` added go1.20; Go 1.20 multi-error wrapping; `errors.AsType` added go1.26.0 | chaining PEP 3134 Python-Version 3.0 |
| Groups / notes | `Error::provide` nightly-only (error_generic_member_access #99301) | — | PEP 654 and PEP 678 Python-Version 3.11; `add_note` "Added in version 3.11" |
| Backtraces / logging | `Backtrace` badge 1.65.0 | `log/slog` in Go 1.21 | logging `stack_info` 3.2, `exc_info` instances 3.5, `stacklevel` 3.8; `NullHandler` since 3.1 |
| Panics / cleanup | `catch_unwind` badge 1.9.0 | — | `ExitStack` added 3.3 |
| Lints | Clippy `map_err_ignore` is "restriction, allow"; `missing_panics_doc` is "pedantic, allow" | — | — |

## Counterevidence and Disagreements

**1. Wrap or keep errors opaque (Go).**
- The wrapping blog post treats wrapping as an API decision: wrap an error to expose it to callers, and do not wrap it when doing so would expose implementation details [104]. <!-- claim: 120f692aee63bf5f; evidence: eb8392f2bd8b284e; source: 8de9f533db3604ee -->
- *Practitioner (Dave Cheney, 2016):* A practitioner post, by contrast, recommends that you try to treat all errors as opaque for maximum flexibility [111]. <!-- claim: 83a3b5a229828a24; evidence: 41ad77d03fcd4596; source: a028f3cbda269354 -->
- *Practitioner (Dave Cheney):* The same practitioner post advises avoiding sentinel error values in the code you write, even though there are a few cases where they are used in the standard library [111]. <!-- claim: 0429afb094a6d265; evidence: ef9ec5d5b04966e6; source: a028f3cbda269354 -->
- The standard library itself deprecated the temporary-error method of the net error interface, saying temporary errors are not well-defined and telling callers not to use this method [112]. <!-- claim: 1e36d23d91b60986; evidence: 3a1c5c9505bab47e; source: d105e9cbc5b1e66a -->
- *Ecosystem linter:* A linter, wrapcheck, pushes the other way by checking that errors from external packages are wrapped during return [113]. <!-- claim: e7a5dd5aa29fbcb1; evidence: 38d976f0a6ff071c; source: 9b727789dda4ca37 -->

Inference:
- Cheney's practitioner position (opaque errors, no sentinels, assert behaviour) predates Go 1.13. The current `Is`/`As` machinery (§3) is built around matching documented sentinels and types.
- The behaviour-assertion example in Cheney's post is a temporary-error check (seen in R5's fetch, not registered). The standard library has since deprecated `net.Error.Temporary` as ill-defined.
- wrapcheck's README example configuration lists `.Errorf(` among ignored signatures, which would let a `%v` annotation satisfy the linter. In that case its "wrapping" means "annotating", not necessarily `%w`. This is unverified: the README says the actual default set lives in its source file, which was not fetched, and the detail is not registered (pending item N20).

**2. Recovering panics in servers (Go).**
- The language guide presents recover as a way to shut down a failing goroutine inside a server without killing the other executing goroutines [45]. <!-- claim: 7faaae5597c2447d; evidence: fdcbf5b8c3dc0001; source: 5d82dc9a454dc245 -->
- The error-handling blog post likewise suggests recovering from panics inside the handler, logging the error to the console as critical while telling the user that a serious error has occurred [106]. <!-- claim: bf5f47ad91f090df; evidence: d26b8a4784cd384d; source: ed948d384a331d6a -->
- *Industry style guide (Google):* The industry guide instead says to resist the temptation to recover panics to avoid crashes, as doing so can result in propagating a corrupted state [110]. <!-- claim: 1ac8e341d312d36b; evidence: 5ba6d675ae27219a; source: 86d8597102301157 -->
- *Industry style guide (Google):* The guide adds that the standard net/http server violates this advice and recovers panics from request handlers, and says the consensus among experienced engineers is that this was a historical mistake [110]. <!-- claim: c64ad343693db171; evidence: d51ee1f50f543c0e; source: 86d8597102301157 -->

**3. Go error-handling syntax.**
- The team behind the language announced that, for the foreseeable future, the Go team will stop pursuing syntactic language changes for error handling and will close all open and incoming proposals that concern themselves primarily with the syntax of error handling [107]. <!-- claim: b829083f9f64a73f; evidence: 1cb360156e29d9f7; source: 9b7334cab4a777be -->
- The same post admits that there is neither a shared understanding of the problem nor agreement that there is a problem in the first place [107]. <!-- claim: a29b9a97dc8ec702; evidence: 914af1e2552251f9; source: 9b7334cab4a777be -->
- The post argues that, going back to actual error handling code, verbosity fades into the background if errors are actually handled [107]. <!-- claim: 1b5951ae280c7e9e; evidence: 75d29df2c7d64a61; source: 9b7334cab4a777be -->

**4. `unwrap` in Rust library code.**
- The official linter keeps its unwrap_used check allowed by default because, for a lot of quick-and-dirty code, unwrap is a good choice [94]. <!-- claim: 04b58624bc7c3857; evidence: 04ee2e481f55da49; source: ce3c5c99fbc3180a -->
- *Practitioner (Andrew Gallant):* A practitioner post holds that using unwrap() is okay in test/example code or when panicking indicates a bug [97]. <!-- claim: 42b8e711f5a11e07; evidence: 135fb6827361b436; source: e87b673266fa7386 -->

Inference: a blanket "no `unwrap` in libraries" rule is practitioner lore. The std and Book guidance (§7) and Clippy's default (above) permit `unwrap`/`expect` where a panic signals a bug or an invariant is documented.

**5. Granularity of Rust error types.**
- *Practitioner (sled project blog, Tyler Neely):* A practitioner post from a correctness-critical database project argues that a single global error enum makes the try ? operator bug-prone, letting a local error propagate to a caller that is not capable of handling it [98]. <!-- claim: b352d34a0ebfff1e; evidence: d6311e295a948252; source: 1581269d83459316 -->

Inference:
- This cuts against one large crate-wide error enum with blanket `From` conversions.
- The API guidelines still ask for meaningful, crate- or function-specific error types (the API-guideline rules in §7; the crate-or-function wording is pending registration as item N21).
- anyhow's README leaves applications free to use one opaque error type (§4).

**6. Handle once versus log-and-re-raise.**
- The official tutorial calls printing or logging the exception and then re-raising it the most common pattern for handling Exception [116]. <!-- claim: 6e3d28132023d2c3; evidence: 472c9b49d045e9da; source: 8687f74540356d37 -->
- *Industry style guide (Google):* The industry guide instead says that if you return an error, it’s usually better not to log it yourself but rather let the caller handle it [110]. <!-- claim: 48a16a7d702435f8; evidence: b11acf51038cf61d; source: 86d8597102301157 -->
- The defect study found Log and Throw associated with post-release defects in Hadoop only, and described the anti-pattern as not prevalent in practice with a small effect [155]. <!-- claim: 03d79baf7aaa32a9; evidence: cae4ac2d67b3e0f9; source: 153c8410f827d032 -->
- The failure study, by contrast, counts an error handler that only logs the error as ignoring the error [126]. <!-- claim: f610903b9f8be456; evidence: 4b5226b3be27cce6; source: 344401f57c206ae3 -->

**7. Go's own documents disagree on inspection.**
- The language guide's error section still teaches type switches and type assertions as the way callers look for specific errors and extract details [45]. <!-- claim: 2b21880a187bc005; evidence: 818e11700447ccaa; source: 5d82dc9a454dc245 -->
- The current errors package documentation instead recommends AsType for most uses when finding the first error in the tree that matches a target [102]. <!-- claim: 9ea353087ea6fc44; evidence: f50a66dcb1a0f2cf; source: f63de84edb6d2d0e -->

**8. The "libraries must add a NullHandler" folk rule.**
- The logging tutorial regards printing library events of severity WARNING and greater to sys.stderr, when the application does not use logging, as the best default behaviour [122]. <!-- claim: 57457cd2748cd541; evidence: f2b6bef9a1cddd45; source: 9af3616aa3d10c5e -->

**9. EAFP versus LBYL.**
- The glossary's argument against LBYL is that in a multi-threaded environment it can risk introducing a race condition between the looking and the leaping [124]. <!-- claim: d03b267f4bee6c5d; evidence: 2e95b6d71a0791e1; source: b7d43d26c4ffff23 -->

Practitioner critiques of EAFP surfaced in search (R5 q027), but none were fetched; treat them as unverified.

## Implications for an agentic design/review workflow

*(This section is my inference; it reports no source findings.)*

**Design time (super-design / super-code).**
- Each package, crate or module boundary should state its error contract in the design or interface bead:
  - which sentinels, types or enum variants callers may match;
  - which causes stay opaque;
  - whether internal panics are allowed and where they are recovered.
- Wrapping is an API commitment (§4), so leaving the contract unstated makes later evolution expensive.
- The design should name the minimum toolchain version when the error API depends on it, e.g. Go's `errors.AsType` or Python's `add_note`/`except*`.

**Review time (super-roast): blockers.** These are mechanical, have low false-positive risk, and are backed by the canon:
- discarded errors (Go `_ =`, per the code-review comments);
- `return`/`break`/`continue` exiting a Python `finally`;
- bare `except:` that neither logs the traceback nor re-raises;
- `logger.error(e)` inside `except` where a traceback is needed (use `logger.exception` or `exc_info`);
- `==` or a type assertion against a sentinel or type that the callee documents as wrapped (exempt `io.EOF`);
- a Rust error that renders its source in `Display` and also returns it from `source()`;
- `map_err(|_| …)` when the target error type has room for a source;
- library code configuring global logging (Python `basicConfig`, non-Null handlers or the root logger; Rust `set_global_default`);
- Go functions returning a concrete error pointer type (typed nil);
- slog key/value mismatches (`go vet`);
- empty or log-only handlers in failure paths (the strongest empirical signal, §9).

**Review time: questions, not blockers.** These depend on a contract or are contested:
- `%v` versus `%w`, which is right whenever the cause is an implementation detail;
- `unwrap`/`expect` in library code, judged by whether the invariant is documented;
- log-and-return duplication. The Python tutorial endorses log-and-re-raise, and the defect study found Log and Throw significant in one project only, with a small effect (§9);
- recovering panics in servers;
- one global Rust error enum;
- LBYL versus EAFP.

**Calibration.**
- Reviewers should cite the language's own guidance and the target toolchain version, not cross-language folklore.
- The empirical base is Java/C/C# distributed and enterprise systems, so severity claims for Rust, Go or Python should say they are extrapolated.
- No source shows that enforcing these rules improves outcomes. Any throughput or quality claim for such a lane would be unmeasured.

## Methodological Limits and Open Gaps

**Sample limits of the empirical studies.**
- The failure study sample was 198 randomly selected, user-reported failures that occurred on Cassandra, HBase, Hadoop Distributed File System (HDFS), Hadoop MapReduce, and Redis [126]. <!-- claim: 98e3e3c907eab1a5; evidence: e1fe135d770dd2f2; source: 344401f57c206ae3 -->
- The defect study itself reports that the majority of the exception handling anti-patterns are not significant in its models [155]. <!-- claim: 60debcb9c3fd477b; evidence: 291701f770a74f61; source: 153c8410f827d032 -->
- The finally-block analysis covers only the 8,000 most popular PyPI packages, in terms of number of downloads in the last 30 days [118]. <!-- claim: baf8ad75d2d65d5c; evidence: 92556fef88f7fa1a; source: 1ff0db3b11a7f479 -->
- The error-syntax post's evidence about stack traces is a recurring comment in user surveys about the lack of stack traces associated with an error [107]. <!-- claim: 6ed5ce736e70fd33; evidence: 1e860fc06fff8f59; source: 9b7334cab4a777be -->

**Gaps.**
- No retrieved study measures the maintainability effect of `%w`/`%v` policies, of library/application error-type styles, or of `unwrap` policies.
- Both empirical studies cover Java, C or C# systems; transfer to Rust, Go or Python is unverified.
- No canonical Rust or Python statement of "log or return, not both" was found. The Go-side statement is an industry style guide, not the Go team.
- Go canon on stack traces is thin (§5).
- The MSR 2018 quotes R5 read from PDF page images (R5-e129–e132) were rejected as not machine-verifiable. That study is cited here only through R6's verified evidence; R5's reading of its effect-size table is not citable.
- Version badges for many APIs are pending registration (§11).

**Unretrieved leads, unverified:**
- PEP 409/415;
- Effective Rust "Item 18: Don't panic";
- nrc.github.io/error-docs;
- Go blog "Defer, Panic, and Recover" and "Errors are values";
- Uber Go style guide "Handle Errors Once";
- de Sousa et al. 2020 (JBCS) on how exception-handling anti-patterns evolve;
- golangci-lint errorlint;
- the Go release that deprecated `net.Error.Temporary`;
- the stabilisation version of Rust's `core::error::Error`;
- the Python Logging Cookbook (redaction via Filters);
- practitioner critiques of EAFP.

## Bibliography

[43] [Frequently Asked Questions (FAQ) - The Go Programming Language](https://go.dev/doc/faq)
[44] [Go Wiki: Go Code Review Comments](https://go.dev/wiki/CodeReviewComments)
[45] [Effective Go](https://go.dev/doc/effective_go)
[86] [Trait Error (std::error)](https://doc.rust-lang.org/std/error/trait.Error.html)
[87] [Module std::error](https://doc.rust-lang.org/std/error/index.html)
[88] [Interoperability - Rust API Guidelines](https://rust-lang.github.io/api-guidelines/interoperability.html)
[89] [To panic! or Not to panic!](https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html)
[90] [Struct Backtrace (std::backtrace)](https://doc.rust-lang.org/std/backtrace/struct.Backtrace.html)
[91] [Function std::panic::catch_unwind](https://doc.rust-lang.org/std/panic/fn.catch_unwind.html)
[92] [Recoverable Errors with Result](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html)
[93] [Running Code on Cleanup with the Drop Trait](https://doc.rust-lang.org/book/ch15-03-drop.html)
[94] [Clippy Lints (stable)](https://rust-lang.github.io/rust-clippy/stable/index.html)
[95] [anyhow README](https://github.com/dtolnay/anyhow)
[96] [thiserror README](https://github.com/dtolnay/thiserror)
[97] [Using unwrap() in Rust is Okay](https://burntsushi.net/unwrap/)
[98] [Error Handling in a Correctness-Critical Rust Project](http://sled.rs/errors.html)
[99] [Crate log](https://docs.rs/log)
[100] [Crate tracing](https://docs.rs/tracing)
[101] [errors.go (package errors doc comment)](https://go.dev/src/errors/errors.go)
[102] [errors package - errors - Go Packages](https://pkg.go.dev/errors)
[103] [Go 1.20 Release Notes](https://go.dev/doc/go1.20)
[104] [Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)
[105] [Go Wiki: Error Values: Frequently Asked Questions](https://go.dev/wiki/ErrorValueFAQ)
[106] [Error handling and Go](https://go.dev/blog/error-handling-and-go)
[107] [ On | No ] syntactic support for error handling https://go.dev/blog/error-syntax
[108] [slog package - log/slog - Go Packages](https://pkg.go.dev/log/slog)
[109] [Structured Logging with slog](https://go.dev/blog/slog)
[110] [Go Style Best Practices](https://google.github.io/styleguide/go/best-practices.html)
[111] [Don't just check errors, handle them gracefully](https://dave.cheney.net/2016/04/27/dont-just-check-errors-handle-them-gracefully)
[112] [net.go (net.Error interface)](https://go.dev/src/net/net.go)
[113] [wrapcheck README](https://github.com/tomarrell/wrapcheck)
[114] [PEP 3134 - Exception Chaining and Embedded Tracebacks](https://peps.python.org/pep-3134/)
[115] [Built-in Exceptions](https://docs.python.org/3/library/exceptions.html)
[116] [8. Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html)
[117] [PEP 8 - Style Guide for Python Code](https://peps.python.org/pep-0008/)
[118] [PEP 765 - Disallow return/break/continue that exit a finally block](https://peps.python.org/pep-0765/)
[119] [PEP 654 - Exception Groups and except*](https://peps.python.org/pep-0654/)
[120] [PEP 678 - Enriching Exceptions with Notes](https://peps.python.org/pep-0678/)
[121] [logging - Logging facility for Python](https://docs.python.org/3/library/logging.html)
[122] [Logging HOWTO](https://docs.python.org/3/howto/logging.html)
[123] [contextlib - Utilities for with-statement contexts](https://docs.python.org/3/library/contextlib.html)
[124] [Glossary](https://docs.python.org/3/glossary.html)
[125] [Logging Best Practices (structlog)](https://www.structlog.org/en/stable/logging-best-practices.html)
[126] [Simple Testing Can Prevent Most Critical Failures: An Analysis of Production Failures in Distributed Data-intensive Systems](http://www.eecg.toronto.edu/~yuan/papers/failure_analysis_osdi14.pdf)
[154] [Studying the Prevalence of Exception Handling Anti-Patterns](https://arxiv.org/abs/1704.00778)
[155] [Studying the Relationship between Exception Handling Practices and Post-release Defects](https://doi.org/10.1145/3196398.3196435)
