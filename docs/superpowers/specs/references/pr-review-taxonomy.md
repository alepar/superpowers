> Vendored: research report, 2026-07-28, source for PR scout lanes (`skills/super-roast/scout-prompts-pr.md`).

# A Staff-Level Taxonomy of Code Review Categories — Built for Scout/Reviewer Subagent Decomposition

## TL;DR
- Your five existing categories cover **design, simplicity, testability, allocation, and concurrency** — strong on the "code health" and low-level performance axes, but they leave the largest empirically-validated review surface uncovered: **correctness/edge cases, security, data integrity & migrations, API/contract stability, observability/operability, reliability patterns, non-GC performance (N+1/caching), deployment/rollout safety, and supply-chain**. This report adds **16 complementary categories (A–P)**, each with scope, 5–15 scout heuristics, a pragmatism/severity filter, and sources.
- Empirically, **~75% of what reviewers actually flag is "evolvability" (maintainability/readability) and only ~25% is functional** (Mäntylä & Lassenius 2009), yet the defect/security/data/rollout minority carries the disproportionate production blast radius. The right architecture therefore runs cheap high-recall scouts broadly and reserves the expensive "confirm-and-fix" reviewer stage for the high-severity, context-hungry categories.
- Prior art converges on your model: Claude Code's `/review`, community 9-subagent setups, and CodeRabbit/Greptile/Bugbot all decompose review into **correctness, security, performance, tests, maintainability, dependency/deploy safety** lanes and triage by severity. Adopt a 4-level severity scheme (Blocking / Should-fix / Nit / FYI), keep scouts high-recall + low-authority, and make the reviewer subagent the precision gate that kills false positives.

## Key Findings

**1. Maintainability dominates volume; defects dominate risk.** Mäntylä & Lassenius (IEEE TSE, vol. 35 no. 3, 2009), classifying the defects of nine industrial (C/C++) and 23 student (Java) code reviews and detecting 388 and 371 defects respectively, found that "75 percent of defects found during the review do not affect the visible functionality of the software" — they are evolvability defects (documentation, structure, visual representation). Beller et al. (2014) corroborated this on open-source projects (~75% maintainability, ~20% functionality). A scout swarm optimized only for "bugs" will miss the majority of what human reviewers value — but the minority functional/security/data findings carry the severe risk. Your taxonomy must serve **both** axes.

**2. Google's own practice is lightweight and design-first.** The canonical Google checklist ("What to look for in a code review") orders concerns as **Design, Functionality, Complexity, Tests, Naming, Comments, Style, Consistency, Documentation, Every Line, Context, Good Things.** Its senior principle: "reviewers should favor approving a CL once it is in a state where it definitely improves the overall code health of the system being worked on, even if the CL isn't perfect… there is no such thing as 'perfect' code—there is only better code." At scale, Sadowski et al. (ICSE-SEIP 2018) analyzed ~9 million reviewed changes by more than 25,000 authors/reviewers (Jan 2014–Jul 2016) and found, verbatim: "over 35% of the changes under consideration modify only a single file and about 90% modify fewer than 10 files. Over 10% of changes modify only a single line of code, and the median number of lines modified is 24." Reviewer load is light — "fewer than 25% of changes have more than one reviewer, and over 99% have at most five reviewers with a median reviewer count of 1" — and "over 80% of all changes involve at most one iteration of resolving comments." Implication: most PRs are small, so scouts must be cheap and fast, and severity thresholds tuned so as not to drown a 24-line change in noise.

**3. Comment usefulness is measurable and category-dependent.** Bosu, Greiler & Bird (Microsoft, MSR 2015), analyzing 1,496,340 comments from 190,050 review requests across five projects (Azure, Bing, Visual Studio, Exchange, Office), found (Table II) 65.5% overall "usefulness density," noting "all projects have a similar comment usefulness density between 64% and 68%." Most-useful categories: functional defects, validation/corner cases, and API/design/convention guidance. Least-useful: false positives, reviewer questions-to-understand, praise, and out-of-scope/future-work. They also found "the more files that are in a change, the lower the proportion of comments in the code review that will be of value to the author of the change." Directly actionable: **suppress questions, praise, and speculative "future work" scout findings; prioritize validation/corner-case and defect scouts; and treat large PRs as a hygiene problem before deep review.**

**4. The pragmatism filter is the staff-level differentiator.** Across StaffEng/GitHub-staff writing, senior reviewers do a **high-level pass first** (does it solve the right problem? what's the blast radius?) and refuse to block on personal style; juniors over-index on nitpicks. Google codifies this with the "Nit:" prefix; Conventional Comments formalize labels (praise, nitpick, suggestion, issue, question, thought, todo); Graphite's analysis of 25,000 "nit"-prefixed comments argues most nits are low-value and should be automated away. Every scout prompt should carry an explicit "when to let go" instruction.

---

## Details: The Complete Taxonomy

Ordered roughly by production-risk severity (highest first), then breadth. For each: **Scope**, **Scout heuristics/smells**, **Pragmatism filter**, complement/overlap with your five, and **Sources**. Language-specific notes are inline.

### A. Correctness & Edge Cases *(highest-value functional category; complements your Premortem #1)*
**Scope:** Does the code do what it intends across the full input domain, including boundaries and error paths? Google's "Functionality" pillar; the highest-rated *useful* comment class in Bosu et al.

**Scout heuristics/smells:**
1. Boundary/off-by-one: `<=` vs `<`, loop bounds, slice/substring indices, empty-collection and single-element cases.
2. Null/None/undefined: unchecked dereferences; `Optional`/`nil`/`null` returned but not handled; Go `err` dropped with `_`; TS non-null assertions `!`.
3. Error paths: swallowed exceptions (`catch {}`), errors logged-but-continued, partial failures leaving inconsistent state.
4. Input validation: unvalidated external input, missing range/format checks, trusting client-supplied IDs.
5. Numeric: integer overflow (counters, ms timestamps, 32-bit), float equality, money in floats instead of decimal/minor-units, division-by-zero, rounding.
6. Time/zone/locale: naive `datetime` without tz, DST transitions, local-vs-UTC comparison, `toLowerCase` in Turkish locale, week/day math.
7. Encoding: byte-vs-rune length, UTF-8 truncation splitting a codepoint, unescaped Unicode.
8. Idempotency: retries causing double-writes; missing idempotency keys on POST/payment/order paths.
9. TOCTOU / non-atomic read-modify-write.
10. Collection mutation during iteration; Python mutable default args (`def f(x=[])`).

**Pragmatism filter:** Flag anything on a **user-facing or data-writing path** — a missing null check in a hot handler is Blocking. Boundary quibbles on internal, well-tested helpers are Nit. Don't invent adversarial inputs the type system already excludes.

**Sources:** Google eng-practices "Functionality"; Bosu/Greiler/Bird 2015; Claude `/ultra review` "logic and correctness" lens.

### B. Security *(highest-value non-functional; net-new)*
**Scope:** OWASP-style code-review concerns organized around input validation, authN/session, access control, crypto, error handling, and logging (per the OWASP Secure Code Review Cheat Sheet).

**Scout heuristics/smells:**
1. Injection: string-concatenated SQL/NoSQL/OS/LDAP; missing parameterized queries/`PreparedStatement`/ORM binding; template injection; `eval`/`exec` on user data.
2. XSS/output encoding: unescaped input into HTML/DOM; `dangerouslySetInnerHTML`; missing CSP.
3. AuthZ: missing ownership/role check on object access (IDOR/broken access control — OWASP's #1 risk); auth in UI but not server; mass-assignment escalation.
4. Secrets: hardcoded keys/passwords/tokens, secrets committed to repo, secrets in logs.
5. Deserialization: `pickle`/Java `ObjectInputStream`/`unserialize`/unsafe YAML on untrusted data.
6. SSRF: server-side fetch of user-supplied URL without allow-listing; cloud metadata endpoint exposure.
7. Crypto: `Math.random` for tokens, MD5/SHA1 for passwords, missing salt, ECB mode, JWT `alg:none` accepted (explicitly declare expected algorithms and reject "none"), hardcoded IV.
8. XXE: XML parser with DTDs/external entities enabled.
9. Path traversal: user input in file paths without canonicalization.
10. Sensitive-data-in-error: stack traces / internal detail returned to clients.

**Pragmatism filter:** Any injection, missing authZ on a sensitive resource, or committed secret is **Blocking, no exceptions.** Crypto/deserialization on untrusted input is Blocking; on fully-internal trusted data, Should-fix. The reviewer stage should escalate to a human/security owner — Google names security as an "every line" specialist concern.

**Sources:** OWASP Secure Code Review Cheat Sheet & Top 10; language SCA checklists; HAMY/Claude security-reviewer subagent.

### C. Data Integrity, Persistence & Migrations *(net-new; extremely high blast radius)*
**Scope:** Schema changes, transactionality, consistency guarantees, data-loss risk, PII/compliance in storage.

**Scout heuristics/smells:**
1. Non-backward-compatible migration shipped with code in one step (rename/drop column, NOT NULL without default) — should follow **expand → migrate → contract (Parallel Change)**.
2. Long-running/locking DDL on large tables (rewriting `ALTER TABLE`; index without Postgres `CONCURRENTLY`).
3. Missing transaction boundary around multi-write invariants; partial commit on error.
4. Read-modify-write without optimistic locking/versioning → lost updates.
5. Irreversible migration with no down/rollback; backfill not idempotent/restartable.
6. Cross-service consistency assumed but not guaranteed (dual writes without outbox/saga).
7. Data loss: destructive backfill before verification; `TRUNCATE`/`DELETE` without WHERE guard.
8. PII stored unencrypted / without retention policy; new PII column with no compliance tag.
9. Migration-vs-deploy ordering: new code reads a column the migration hasn't added yet.

**Pragmatism filter:** Anything that can **lose data or lock a production table** is Blocking. Any schema change not backward-compatible for at least one deploy is Blocking (must expand/contract). A migration on a tiny lookup table is low-risk — right-size the scrutiny.

**Sources:** Expand/Contract (Hodgson; PlanetScale; Prisma; Tim Wellhausen; reported in use at LinkedIn/Netflix); Google eng-practices "Every Line" (privacy specialist).

### D. Reliability & Resilience Patterns *(net-new; extends Premortem #1 into runtime failure)*
**Scope:** Behavior when dependencies are slow/failing: timeouts, retries, circuit breakers, backpressure, resource cleanup, graceful degradation.

**Scout heuristics/smells:**
1. Network/DB/RPC call with **no timeout** (or default-infinite).
2. Retries **without backoff + jitter** → thundering-herd/retry amplification; retries on non-idempotent ops; retries stacked at multiple layers.
3. No circuit breaker/fallback for a critical downstream; cascading failure.
4. Unbounded queues/channels/buffers; no backpressure → OOM under load.
5. Resource leaks: unclosed files/connections/sockets; missing `defer close`/try-with-resources/`using`/context manager; pool not released on error path.
6. No graceful degradation: one non-critical dependency down takes the whole request down.
7. Fire-and-forget work with no supervision/observability.
8. Timeout below downstream p99 (guaranteed failures) or absurdly high.

**Pragmatism filter:** Missing timeout on an external call in a request path = Blocking (classic incident cause). Retry-without-jitter on a high-fanout path = Should-fix/Blocking. For a one-off internal batch script, resilience polish is Nit. A systematic microservices study reported exponential-backoff-*without*-jitter at P99=2600ms/17% errors vs. *with* jitter at P99=1400ms/6% — cite the mechanism, not just the smell.

**Sources:** Resilience patterns literature (Nygard-style timeout/retry/circuit-breaker/bulkhead; Resilience4j/Hystrix); arXiv systematic review of recovery patterns; AWS backoff-with-jitter guidance.

### E. Performance & Scalability Beyond GC *(net-new; complements GC #4 and Concurrency #5)*
**Scope:** Algorithmic complexity, database access patterns, chatty I/O, caching correctness, payload/pagination — the I/O and complexity issues that dominate real latency, distinct from your allocation-churn category.

**Scout heuristics/smells:**
1. **N+1 queries**: query inside a loop over rows; ORM lazy-loading in a render loop; missing `JOIN`/`IN`/batch fetch.
2. Accidental O(n²): nested loops over the same collection; `list.contains` in a loop (use a set/map); repeated linear scans.
3. Chatty I/O / RPC-in-loop; missing batching; per-item round-trips.
4. Missing pagination on a list endpoint; unbounded `SELECT *`; loading a whole table into memory.
5. **Cache correctness**: no invalidation on write (stale reads); missing single-flight/request-coalescing → **cache stampede/thundering herd**; unbounded cache → memory growth; per-user data under a shared key.
6. Large payloads: over-fetching fields, deep object graphs serialized, no compression.
7. Sync/blocking call on a latency-critical path that should stream or be async.
8. Redundant recomputation (React re-renders; recomputing invariants in a loop).

**Pragmatism filter:** N+1 on a page that scales with user data = Should-fix→Blocking; on an admin page called 10×/day = Nit. Only flag algorithmic complexity when *n can realistically grow*; O(n²) on a fixed 5-element enum is fine. Cache-invalidation bugs are Should-fix because they produce *wrong* answers, not just slow ones. (Facebook's Memcache leases cut peak stampede DB load from ~17,000 → ~1,300 QPS, per Nishtala et al., NSDI 2013 — the failure mode is real and severe.)

**Sources:** HAMY/Claude performance-reviewer subagent (N+1, blocking ops, memory leaks, hot paths); Scaling Memcache at Facebook (NSDI 2013); cache-stampede literature.

### F. Deployment / Rollout Safety *(net-new; operationalizes Premortem #1)*
**Scope:** Can this ship and roll back safely in a live, partially-deployed fleet? Feature-flag gating, forward/backward compatibility under version skew, config-vs-code, migration ordering.

**Scout heuristics/smells:**
1. Behavior change not behind a **feature flag / kill switch** for risky paths.
2. Breaking wire/API/serialization change deployed simultaneously to producer and consumer (no version-skew tolerance during rolling deploy).
3. New code depends on new config/secret/infra not guaranteed present at rollout time.
4. Migration + code coupled so that rolling back code breaks against migrated schema (violates fix-forward/rollback-safe).
5. Cross-service deploy ordering dependencies not documented.
6. No stated way to disable the change if it misbehaves.

**Pragmatism filter:** Any change that can't be **rolled back safely** or that breaks under version skew during a rolling deploy is Blocking. A purely additive, flag-gated change is low-risk. An internal single-instance tool doesn't need skew tolerance.

**Sources:** Expand/Contract; HAMY/Claude "Dependency & Deployment Safety" subagent.

### G. Observability & Operability *(net-new; "if this breaks in prod, will we know?")*
**Scope:** Logging, metrics, tracing, alerting hooks, debuggability — and anti-patterns (PII in logs, cardinality blowups).

**Scout heuristics/smells:**
1. New failure path with **no log/metric** — silent failure.
2. PII/secrets in logs (emails, tokens, card numbers, full request bodies).
3. High-cardinality metric labels (user_id, request_id, timestamp) → Prometheus/TSDB blowup.
4. Log-level misuse: errors at `info`, spam at `error`, `debug` left on in a hot path.
5. Missing trace-context propagation across a new service hop (no `trace_id`).
6. Unstructured free-text logging where the codebase uses structured logs.
7. New critical path with no alert/SLO hook.

**Pragmatism filter:** Silent failure on a critical path = Should-fix. PII-in-logs = Blocking (compliance blast radius). High-cardinality label = Should-fix (can take down monitoring). Don't demand a dashboard for a trivial internal change.

**Sources:** SRE three-pillars practice; OpenTelemetry PII-scrubbing & cardinality-control guidance; HAMY/Claude observability lens.

### H. API / Interface Design & Contract Stability *(complements OOP #3, but outward-facing)*
**Scope:** Consumer-facing interface quality: naming, ergonomics, backward compatibility, versioning, error contracts. Governed by **Hyrum's Law** ("with a sufficient number of users of an API, all observable behaviors of your system will be depended on by somebody"), the **Principle of Least Astonishment**, and Postel's Law.

**Scout heuristics/smells:**
1. Breaking change to a public signature/type/exported symbol without a version bump or deprecation path.
2. Removing/renaming a field, changing an error code, or changing response shape/ordering clients may depend on (Hyrum's Law).
3. Leaky abstraction: implementation detail exposed (e.g., returns an ORM entity instead of a domain type).
4. Ergonomics: boolean/positional-arg soup, required params that should be optional, misuse-prone call ordering, surprising defaults.
5. Verbs in REST resource names (`/createOrder`); non-idempotent PUT/DELETE; missing idempotency key on POST.
6. Inconsistent error contract (some thrown, some returned, some swallowed); no error schema/codes.
7. Over-broad public surface — exposing more than you'll commit to maintain.

**Pragmatism filter:** Breaking a **published** contract without a migration path is Blocking. Ergonomics/naming on a brand-new *internal* API is Should-fix/Nit — cheaper now than after adoption. Staff move: "expose a minimal surface and expand, rather than expose everything and try to remove later."

**Sources:** Hyrum's Law (Hyrum Wright / SWE at Google); Principle of Least Astonishment; API design writeups (idempotency, versioning, error contracts); Ousterhout on deep modules / information leakage.

### I. Testing Strategy Beyond Naming *(complements BDD-naming in #3)*
**Scope:** Test *placement, risk-coverage, determinism, isolation, mocking boundaries* — not just names.

**Scout heuristics/smells:**
1. Coverage of **risky paths** (auth, payments, data integrity, error branches) vs. line-coverage theater on trivial getters.
2. Tests assert **behavior/outcomes**, not implementation details/private methods/internal state.
3. Flakiness risk: `sleep`-based waits, real `now()` not injected, unseeded randomness, order-dependent tests, real network in unit tests, shared mutable test DB.
4. Over-mocking → tests that pass but verify nothing; mock at the edge, prefer fakes.
5. Wrong pyramid level: E2E for logic that belongs in a unit test; no integration test for a new DB interaction.
6. New risky production code with **no test**.
7. Mutation-worthiness: would the test fail if the logic were wrong? (mutation score > line coverage as a signal; reserve mutation testing for critical business logic — it's expensive).
8. Copy-pasted setup that should be a fixture; parameterize similar cases.

**Pragmatism filter:** Missing tests on a risky path = Should-fix→Blocking. Coverage on low-risk code has diminishing returns — don't demand it. Flakiness risk = Should-fix because it erodes the whole suite's signal. Google: tests are code that must be maintained — don't accept complexity in tests.

**Sources:** Google eng-practices "Tests"; test-pyramid + flakiness literature (Fowler "Eradicating Non-Determinism"; Google flaky-tests blog); mutation-testing guidance; HAMY/Claude test-quality subagent.

### J. Readability & Maintainability *(overlaps Simplicity #2; largest volume category empirically)*
**Scope:** Naming, comment quality (why-not-what), cognitive load, convention consistency, dead code, TODO hygiene. ~75% of review findings live here (Mäntylä & Lassenius).

**Scout heuristics/smells:**
1. Names that don't communicate intent; cryptic abbreviations; misleading names.
2. Comments explaining *what* (redundant) instead of *why* (rationale, invariants); stale comments; commented-out code.
3. Dead code: unused imports/vars/params, unreachable branches, obsolete flags.
4. Deep nesting / long functions / high cyclomatic complexity → extract.
5. Duplication that should be abstracted (but beware premature abstraction — see #2).
6. Inconsistency with surrounding code/style guide.
7. TODO/FIXME without owner or ticket; leftover debug prints.
8. Ousterhout red flags: **shallow modules** (interface as complex as the functionality it provides), **information leakage** (same design decision in multiple modules), **pass-through variables/methods**, similar interfaces repeated across adjacent layers.

**Pragmatism filter:** Most prone to **nit-flooding.** Push everything a formatter/linter can catch out of human/scout review entirely. Only surface readability issues that materially raise cognitive load or that a linter can't catch. Label Nit and never block on personal style (Google's explicit rule).

**Sources:** Google eng-practices (Naming, Comments, Complexity); Ousterhout *A Philosophy of Software Design* (deep vs. shallow modules; red flags); Mäntylä & Lassenius 2009; Conventional Comments; Graphite nit analysis.

### K. Scope & Change Hygiene *(net-new; cheap and high-leverage)*
**Scope:** Is the PR one logical, reviewable, revertable unit? Size, single-purpose, commit quality, unrelated refactors.

**Scout heuristics/smells:**
1. Unrelated refactor/reformat bundled with a functional change (Google: send reformatting as a *separate* CL).
2. PR too large to review well — Bosu et al. found "the more files that are in a change, the lower the proportion of comments in the code review that will be of value to the author."
3. Multiple logical changes in one commit; feature + unrelated bugfix mixed.
4. Poor commit messages (no "why"); no PR description/context.
5. Cleanup that could be a preceding, separately-revertable commit.

**Pragmatism filter:** A giant mixed PR is Should-fix (ask to split) *before* deep review — cheaper than reviewing badly. Don't dogmatically split a genuinely atomic change. Small PRs are the norm (Google median 24 lines) — calibrate to that.

**Sources:** Google eng-practices (Style/Consistency); Sadowski et al. 2018; HAMY/Claude atomicity lens; GitHub staff-engineer philosophy (self-review first; split if large).

### L. Dependency & Supply-Chain Review *(net-new)*
**Scope:** Justification, license, maintenance health, transitive weight, pinning of any new third-party dependency.

**Scout heuristics/smells:**
1. New dependency for functionality already available in-house/stdlib ("a utility function that saves 10 lines of code is not worth the supply-chain risk of a new dependency").
2. Poorly maintained: stale last release, single maintainer, unresponsive issues.
3. Known CVEs / poor security track record (run SCA).
4. Restrictive/incompatible license (copyleft into proprietary).
5. Heavy transitive tree (one direct dep pulling dozens transitive — the JS median is famously enormous) / frontend bundle-size impact.
6. Unpinned/floating version; missing lockfile update; typosquat-looking name.

**Pragmatism filter:** New dependency with a CVE or incompatible license = Blocking. Unjustified dependency duplicating existing capability = Should-fix. A well-maintained, widely-used, permissively-licensed lib is fine — don't reflexively reject. Needs repo context (existing deps) to judge "already have this."

**Sources:** GitHub dependency-review; Microsoft/Google supply-chain guidance; SLSA; left-pad lesson; HAMY/Claude dependency subagent.

### M. Resource Management & Quotas *(net-new; overlaps D and E)*
**Scope:** File handles, connections, memory leaks, unbounded growth (caches/maps/queues), quota/limit exhaustion. Kept as its own scout because the *signal* — "grows without bound" — is distinct.

**Scout heuristics/smells:**
1. Collections/maps/caches that only grow, never evict (memory leak).
2. Handles/connections opened without guaranteed close on all paths.
3. Goroutine/thread/timer leaks; listeners/subscriptions never removed (JS/React `useEffect` cleanup).
4. Thread-pool/connection-pool exhaustion under load.
5. Rate-limit/quota/disk/FD exhaustion not considered.
6. Recursive/accumulating structures without bounds.

**Pragmatism filter:** Unbounded growth on a long-running service = Blocking (guaranteed eventual OOM). On a short-lived CLI/batch job, low-risk. Judge by process lifetime and invocation rate — your GC "hot path" reasoning generalized.

**Sources:** Reliability literature; async/thread-pool-starvation writeups; HAMY/Claude memory-leak lens.

### N. Concurrency Extensions: Async / Cancellation / Ordering *(directly extends Concurrency #5)*
**Scope:** Async-runtime failure modes your #5 doesn't yet name: async/await pitfalls, cancellation/deadline propagation, thread-pool starvation, ordering guarantees.

**Scout heuristics/smells:**
1. **Sync-over-async**: `.Result`/`.Wait()`/`.GetAwaiter().GetResult()` (C#), `block_on` in async context (Rust), blocking call inside an event loop (Node/Python asyncio) → thread-pool/event-loop starvation.
2. `CancellationToken`/`context.Context`/`AbortSignal` not propagated to the deepest I/O call → orphaned work (practitioner reports cite 15–30% infra savings from proper propagation).
3. `async void` (C#) / unawaited promises / fire-and-forget without error capture → swallowed exceptions.
4. Unbounded parallelism (`Promise.all` over thousands, unbounded `Parallel.ForEach`) → resource storm.
5. Missing deadline/timeout propagation across service hops.
6. Assumed ordering on concurrent operations/channels that isn't guaranteed.
7. `ConfigureAwait(false)` missing in library code; goroutine leaks on cancelled context (Go).

**Pragmatism filter:** Sync-over-async in a server request path = Blocking — thread-pool starvation has a distinct signature (high CPU / low throughput / latency spikes at moderate load). Dropped cancellation token = Should-fix. Ordering assumptions on concurrent work = Should-fix. In single-threaded/non-async code, N/A — route by language/runtime.

**Sources:** .NET async best-practices corpus ("async all the way," don't block, propagate tokens); Go context-cancellation practice; ASP.NET Core thread-pool-starvation writeups.

### O. Cost Awareness & Privacy/Compliance *(net-new; two lenses, often combinable into one scout)*
**Scope (Cost):** Cloud-resource cost of the change: per-request fanout, storage growth, egress, observability volume. **Scope (Privacy):** Data retention, GDPR/CCPA-style handling, audit logging, PII lifecycle.

**Scout heuristics/smells:**
1. Per-request fanout / cross-region calls scaling with traffic (AWS egress ≈ $0.09/GB out; inter-region charged on both ends).
2. Chatty API responses (large JSON × many users) driving egress; missing CDN/caching for cacheable GETs.
3. Unbounded storage/log/metric growth with no lifecycle/retention policy (observability bills can exceed compute).
4. New per-item compute in a high-QPS path (cost scales with invocations/sec — your hot-path judgment applied to $).
5. New PII collected/stored/logged without retention limit or legal basis; missing audit log on sensitive access; data crossing a compliance boundary/region.

**Pragmatism filter:** Cost is usually Should-fix/FYI unless the change plausibly 10×'s a bill line (fanout, egress, unbounded storage) — then Blocking. Staff move: "what does this cost at 10× volume?" at review time, not after the invoice. Privacy findings (new unretained PII, missing audit log on regulated data) are Blocking. Don't turn every log line into a cost debate.

**Sources:** FinOps/egress analyses (AWS egress pricing, cross-region, observability cost); GDPR/PII-in-telemetry guidance; OWASP logging.

### P. Documentation & Accessibility/i18n *(net-new; conditional scouts)*
**Scope (Docs):** README/API-doc updates, ADRs for significant decisions, inline docs for non-obvious invariants. **Scope (a11y/i18n):** user-facing frontend changes only.

**Scout heuristics/smells:**
1. Change to build/test/interaction/release process without doc update (Google's explicit rule).
2. Significant architectural decision with no ADR/rationale recorded.
3. Non-obvious invariant/algorithm with no explanatory comment.
4. Deprecated/deleted code whose docs weren't removed.
5. (a11y) Missing `alt`/aria/labels, non-semantic HTML, keyboard traps, poor color contrast; (i18n) hardcoded user-facing strings, concatenated translations, non-localized dates/numbers/currency, LTR assumptions.

**Pragmatism filter:** Docs findings are usually Should-fix/Nit unless the change is a public API or a load-bearing architectural decision (then Should-fix). a11y/i18n are Should-fix→Blocking *only on user-facing frontend* where the product commits to those standards — route by file type (`.tsx`/`.vue`/templates). Google names accessibility and i18n as specialist "every line" concerns.

**Sources:** Google eng-practices (Documentation; a11y/i18n specialists); ADR practice.

---

## Recommendations: Scout/Reviewer Architecture

**1. Map categories to scouts, but merge the thin ones.** Prior art (Claude's 9-subagent setup; CodeRabbit/Greptile/Bugbot) validates ~8–10 parallel lanes as the sweet spot. Suggested set that *complements* your five without overlap:
- **Keep your 5 as-is** (Premortem, Simplicity, Clean-OOP, GC-churn, Concurrency-locks).
- **Add:** Correctness (A), Security (B), Data/Migrations (C), Reliability+Resources (D+M merged), Performance-I/O (E), Deploy-Safety (F), Observability (G), API-Contract (H), Testing (I), Dependency/Supply-chain (L), Async-extensions (N — or fold into your #5), and one combined **Hygiene+Docs+Cost+Privacy** scout (K+O+P) for the cheap, broad lenses.
- **Readability (J)** is largely linter/formatter territory — automate it, don't spend scout budget on it.

**2. Split scouts by context cost — the key design axis:**
- **Cheap / diff-local (mechanical, high-recall):** correctness smells, secrets-in-code, N+1-in-loop, missing-timeout, PII-in-logs, resource-not-closed, TODO hygiene, unrelated-refactor detection, hardcoded strings. Scan diff + immediate file. Run on every PR.
- **Needs whole-PR context:** API-contract breakage, scope/atomicity, test-risk-coverage, migration-vs-code ordering.
- **Needs repo/history context:** "does a dependency already exist for this," convention consistency, cross-file regressions, Hyrum's-law consumer impact, "is this called from a hot path" (invocation rate). Greptile's edge (full-codebase indexing) shows these catch bugs diff-only tools structurally can't — reserve deeper, costlier context retrieval for these.

**3. Severity taxonomy for scout findings (4 levels + type label).** Adopt Conventional-Comments-style labels so the reviewer stage and humans triage consistently:
- **Blocking** — correctness on a user/data path; security (injection/authZ/secrets); data-loss/locking migration; unsafe rollback; PII leak. Must fix before merge.
- **Should-fix (Major)** — reliability gaps, N+1 that scales, missing risky-path tests, contract ergonomics, observability of failures.
- **Nit** — style/readability/naming a linter could catch; non-blocking by definition.
- **FYI/Question** — context, thoughts, out-of-scope. **Suppress praise and "future work"** — Bosu et al. found these are the *least* useful comment types.
Each finding carries `(category, severity, file:line, what, why, how)` — mirror HAMY's format and Claude's "lead with the highest-severity finding" synthesis, ending with a verdict: Ready to Merge / Needs Attention / Needs Work.

**4. Make the reviewer stage the precision gate.** Scouts should be **high-recall / low-authority** (surface candidates, never auto-block). Buy precision in the "confirm-and-fix" reviewer subagent:
- Require the reviewer to **reproduce/verify** each finding against surrounding code before it survives (Claude's `/ultra review` surfaces only independently-verified findings; Greptile reports near-zero false positives via a second-pass triage).
- Give the reviewer authority to **downgrade or drop** findings that are out-of-scope, already-handled, or explained by an author comment ("acknowledge the author's reasoning before suggesting an alternative").
- De-duplicate across scouts (a resource leak may fire in both Reliability and Resource scouts) and collapse clean scouts to a one-line summary.
- Track a per-category **usefulness / false-positive rate** and tune or retire noisy scouts — independent evaluations show the real tools trade off differently (Greptile high-recall but with substantial triage burden; CodeRabbit lower-recall/higher-precision). Your reviewer stage is exactly what lets you run high-recall scouts without drowning the author.

**5. Calibrate thresholds to change size and blast radius.** Because the median change is ~24 lines and 80%+ of changes get ≤1 comment iteration (Sadowski et al.), a scout that emits 8 findings on a 24-line PR is *itself* a failure mode. Rules of thumb: cap Nits, batch them into a single summary comment, and gate each scout on "is n realistic / is this a hot path / is this user-facing." This is your existing GC "judge invocations/sec" pragmatism generalized across every category.

**Benchmarks that would change these recommendations:**
- If a category's false-positive rate exceeds ~30%, narrow its scope or move it behind repo-context retrieval.
- If authors ignore >50% of a category's findings, downgrade it to FYI or automate it into a linter.
- If a category never fires Blocking/Should-fix across many PRs, fold it into a combined scout to save context budget.
- If review latency per PR climbs unacceptably, drop the repo-context scouts to on-demand (only when diff-local scouts flag something cross-file).

## Caveats
- **The "~75% evolvability / ~25% defects" split** is from Mäntylä & Lassenius (2009, industrial C/C++ and student Java) and corroborated by Beller et al. (2014, two OSS projects). The often-cited "15% of comments are about defects" phrasing specifically comes from co-author Greiler's *presentation material*, not a verbatim statistic in the peer-reviewed MSR 2015 paper — treat the exact percentage as directional.
- **The Google case study (Sadowski et al. 2018)** provides hard change-level numbers (median 24 lines, median 1 reviewer, 80%+ single-iteration) but only *qualitative* comment themes (education, maintaining norms, gatekeeping, accident prevention) — it does **not** publish a quantitative design/readability/defect comment breakdown. Don't cite it for a category distribution; use Bosu et al. for that.
- **AI-reviewer benchmark numbers** (catch rates, false-positive rates, "9 sub-agents," pricing) come from vendor blogs and small independent evaluations (e.g., one 146-PR / 679-finding 3-week test), not peer-reviewed studies. Directionally consistent, but treat specific percentages as marketing-adjacent.
- **Cloud-cost and cache-stampede figures** are point-in-time vendor pricing and a single 2013 Facebook paper; the mechanisms are stable, the exact numbers drift.
- This taxonomy is deliberately **language-general.** The highest-variance language-specific items are concurrency/async (C# sync-over-async, Go context/goroutine leaks, JS event-loop blocking, Rust `block_on`), memory model (JVM/Go GC vs. Rust ownership vs. Python refcounting), and encoding (byte-vs-rune). Route those scouts by file extension so the heuristics match the runtime.