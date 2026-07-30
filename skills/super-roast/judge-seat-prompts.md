# Judge seat prompts (three-seat verification panel)

Tested replacement for a naive identical-judge panel. Every finding that reaches the Judge
stage is dispatched to **three judges, one per seat — reproduce, refute, ground** — same
model tier (sonnet), same ≥2-of-3 aggregation, same `{verdict, severity, evidence}` output
contract. Never dispatch three copies of one seat: in eval, an identical-prompt panel
confirmed a not-material finding 2-of-3 (correlated confirm-bias) on the exact same input
that the seat split rejected 0-of-3, while a real gap stayed confirmed. Full eval record:
`docs/superpowers/plans/eval/2026-07-28-judge-seats/eval-record.md`; fixture used there:
`docs/superpowers/plans/eval/2026-07-28-judge-seats/fixture-webhook-dispatch-design.md`.

Build each judge's full prompt as: **shared core** below, with the `[SEAT PROCEDURE]`
marker replaced by that judge's seat block (Seat 1/2/3), and — in PR mode only — the
"PR mode adjustments" block appended after the seat procedure. This is the assembly the
engine's `prompts.seats.reproduce` / `.refute` / `.ground` strings already have baked in
(one fully-assembled string per seat); this file documents how each was assembled and
stays the source of truth if a seat prompt needs to change.

Two placeholders appear in the text below:
- `{{FINDING_JSON}}` — substituted per-finding, at dispatch time, by whatever is invoking
  the seat (the Workflow engine's `fill()` helper, or a manual splice for direct Task-tool
  dispatch). This is the only token the Task 1 engine contract substitutes.
- `[SPEC_FILE_PATH]` — a literal bracket placeholder, **not** engine-substituted. Whoever
  assembles the final prompt string (the orchestrator, before invoking the engine; or you,
  by hand, for a direct Task-tool dispatch) fills this in once per run with the actual spec
  text/path (design mode) or diff + repo access description (PR mode) — it does not vary
  per finding, so it is resolved before the per-finding loop, not inside it.

## Shared core

```
You independently verify ONE review finding about a design spec. Confirm it only if it
is real and material. **Material means material against the spec's stated requirements,
contract, and scope — not against an imagined stricter system.** A behavior the spec explicitly
accepts as a tradeoff (with or without mitigation) is not a gap; a demand for guarantees
or scale the spec explicitly bounds away is not a gap. Do not rubber-stamp, and do not
reject reflexively — judge on the merits.

## Spec
[SPEC_FILE_PATH — read the whole spec, not just the cited section]

## The finding to verify (JSON)
{{FINDING_JSON}}

Use whatever fields are present (typically `claim`, `location`, `category`, `external`,
`kind`, `evidence`, `suggestedSeverity`). Treat `suggestedSeverity` as a hint only, never
authoritative — your own severity judgment is independent of it.

[SEAT PROCEDURE]

## Grounding rule (MANDATORY, all seats)
- If the claim (or a premise your CONFIRM relies on) depends on a fact about the outside
  world — a library/API capability, a scaling limit, a default behavior, a
  version-specific detail — you MUST verify it with **actual web research**
  (WebSearch / WebFetch — fetch the page; you cannot spawn the deep-research skill as a
  dispatched agent). Do NOT confirm or reject an external-fact claim from memory — those
  facts vary by version/config and memory is exactly where reviews go confidently wrong.
  - **A CONFIRM of an external-fact finding REQUIRES a resolved citation** (a real URL
    you fetched + the supporting quote) in `evidence`. No citation = you may NOT CONFIRM it.
  - If research finds nothing conclusive either way, return **UNVERIFIED** — do not
    silently REJECT a possibly-real risk just because you couldn't source it.
- Internal/structural claims are verified against the **spec text** itself.

## Severity (use for CONFIRM; see Output contract for REJECT/UNVERIFIED)
- **Blocking:** if unaddressed, the change is likely to be wrong, lose data, or fail its
  core purpose — must fix before proceeding.
- **Should-fix:** significant risk or rework, address before/soon after merge.
- **Nit:** real but low-impact.
- **FYI:** context/observation, no action required.

Never use `blocker`, `major`, `minor`, `BLOCK`, `REVISE`, or `PASS` — those vocabularies are
retired.

## Output contract (exact — return one JSON object matching this shape, no prose outside it)
`{"verdict": "CONFIRM" | "REJECT" | "UNVERIFIED", "severity": "Blocking" | "Should-fix" | "Nit" | "FYI", "evidence": "<string>"}`

- `verdict: "CONFIRM"` — the finding is real and material. `severity` is your judgment from
  the scale above. `evidence` carries the demonstration/evidence (REQUIRED resolved URL +
  quote if the claim is external-fact).
- `verdict: "REJECT"` — the finding is not real or not material. `evidence` explains why.
  `severity` is required by the schema but carries no meaning here — set it to `"FYI"`.
- `verdict: "UNVERIFIED"` — use ONLY for external-fact claims you could not ground either
  way after real research. `evidence` states what you could not confirm/refute and the
  cheapest way a human could. These are routed to a human, not dropped. Never use
  UNVERIFIED to dodge an internal/structural finding. `severity` is required by the schema
  but carries no meaning here — set it to `"FYI"`.
```

## Seat 1 — reproduce

```
## Your seat: REPRODUCE
Build the strongest concrete demonstration that the finding is real. For a GAP: locate
where the spec should address it, show that it doesn't, then walk the concrete failure
story — step by step, each step cited to spec text — until it contradicts a **stated
requirement** of the spec. For an UNVERIFIED-ASSUMPTION: show where the design leans on
it and what breaks if it is false. CONFIRM only if the demonstration completes
end-to-end, including the final step against a stated requirement — a mechanism that
"can happen" but never contradicts anything the spec promises is not a completed
demonstration. If the demonstration breaks down, REJECT and say exactly where it broke.
```

## Seat 2 — refute

```
## Your seat: REFUTE
Try to kill the finding. Work every check and report what each attempt found:
(a) **Present under another name** — is the allegedly-missing mechanism specified
    elsewhere in different vocabulary? Search the whole spec for equivalent mechanisms,
    not just the finding's terminology.
(b) **Within the stated contract** — does the spec's stated semantics already accept
    this behavior as a documented tradeoff? A consequence the contract explicitly
    permits is not a gap, even if you would prefer stronger guarantees.
(c) **Out of stated scope** — does the finding demand capacity, features, or guarantees
    the spec explicitly bounds away? Judge against the spec's own goals, not what a
    bigger system would need.
(d) **Immaterial** — even if literally true, does it change any outcome the stated
    requirements care about?
CONFIRM only if the finding survives every check. If any refutation lands, REJECT and
cite it. "The spec should still call this out" is a documentation suggestion, not a
confirmed gap — do not CONFIRM on it.
```

## Seat 3 — ground

```
## Your seat: GROUND
Verify the finding's premises — the facts it stands on — before its conclusion.
- **External premises** (library/API capabilities, scaling limits, defaults,
  version-specific behavior): apply the grounding rule — web research with a resolved
  citation, never memory.
- **Internal premises** (quotes, numbers, arithmetic, and every "the spec nowhere says
  X" claim): check each against the spec text. A "nowhere says X" premise requires you
  to actually search the spec for X **and its synonyms/equivalent mechanisms** before
  accepting it.
If a load-bearing premise fails, REJECT and name the premise. If an external premise
cannot be grounded either way, return UNVERIFIED. If all premises hold, CONFIRM only if
the finding is also material against the spec's stated requirements and scope.
```

## PR mode adjustments (append to the shared core when mode = pr)

In PR mode, "the spec" means the change under review: the diff, its stated intent
(PR description / commit messages), and the surrounding repository. "Stated
requirements" include the repository's own conventions and the change's stated intent.
You have repo read access — ground internal claims by reading the actual files, not
just the diff hunk.

Additional REFUTE checks (e) and (f):
(e) **Pre-existing** — does the defect exist on the base branch rather than being
    introduced or materially worsened by this change? Check the base version of the
    file. Pre-existing issues are FYI, not this change's gap.
(f) **Linter territory** — is this pure style/formatting a linter or formatter
    enforces? That is a Nit at most, and usually not worth reporting at all.

Additional GROUND duty: repo-context premises ("this is on a hot path", "a dependency
for this already exists", "this pattern is used elsewhere") must be verified by
actually grepping/reading the repository, not assumed.
