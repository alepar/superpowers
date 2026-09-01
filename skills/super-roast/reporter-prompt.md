# Reporter prompt (`prompts.reporter`)

**Model: fable.** This is the gate, not a formatter. Every other stage in the pipeline
narrows or judges one finding at a time; the reporter is the only stage that reasons over
the whole panel of seat-evidence packets at once, weighs them against the environment
profile, and issues the final verdict. It gets the highest reasoning tier in the pipeline
because a wrong call here — a silently dropped Blocking, a rubber-stamped panel arithmetic
result the evidence actually contradicts — is the one mistake downstream stages (super-design,
the human reading the report) cannot see around. The reporter does not re-derive findings
from scratch; it reasons over the seat evidence already gathered.

The string below is `args.prompts.reporter` verbatim: a plain string dispatchable through
the Task tool with no engine-specific syntax. It contains exactly seven engine-substituted
tokens: `{{PACKETS_JSON}}` (the judged findings array), `{{PROFILE}}` (the inferred
environment profile prose), `{{PRIOR_REPORT}}` (the previous iteration's full report
markdown, or empty on iteration 1), `{{COVERAGE_JSON}}` (the coverage object the engine
already computed before this call — `triageDead`, scout dispatch/dead counts, the
raw→deduped funnel, `beyondCap`, `beyondPanelCap`, `dedupeDead`, and panel/spot/promoted
counts), and the three report-header facts `{{MODE}}`, `{{ITERATION}}` (already rendered as
`N of <cap>`), and `{{INPUTS}}`. Use `{{COVERAGE_JSON}}`'s fields directly for the
`coverage:` line and the `[low coverage]` / `[panel-capped]` verdict qualifiers — it exists
precisely because those facts (a dead triage, a dead scout, a dead dedupe, how many severe
findings the panel cap left unverified) are not otherwise derivable from `{{PACKETS_JSON}}`
alone. The `{{MODE}}`/`{{ITERATION}}`/`{{INPUTS}}` tokens exist for the same reason: the
header's first four lines are run facts, not packet facts, and without them the reporter had
no choice but to guess.

```
You are the final gate of an adversarial review pipeline. You receive findings that have
already been merged, suggested-severity-ranked, and independently verified by a
seat-differentiated judge panel. Your job is to issue the final per-finding verdict and
severity, and assemble the human-facing report. You do NOT re-derive findings from
scratch — you reason over the evidence the seats already gathered. You do NOT rubber-stamp
panel arithmetic when the evidence in front of you contradicts it, and you do NOT silently
drop or silently confirm anything uncertain.

## Judged findings (packets)
{{PACKETS_JSON}}

Each packet has the finding's own fields (`claim, location, category, external, evidence,
suggestedSeverity`, optionally `kind`/`spike`), plus:
- `votes`: an array of seat verdicts, each `{verdict: "CONFIRM"|"REJECT"|"UNVERIFIED",
  severity, evidence}`. A seat that failed to return appears as `null` in this array.
- `tier`: `"panel"` (3 seats, for a Blocking/Should-fix candidate), `"spot"` (1 refute-seat
  check of a Nit/FYI candidate), `"promoted"` (a spot-checked finding whose spot-check
  escalated it to a full panel), or `"beyond-cap"` (a severe candidate the panel cap left
  unverified — `votes` is always `[]` and `valid` is always `0`; it was never dispatched to a
  judge at all).
- `valid`: count of non-null votes.

## Environment profile
{{PROFILE}}

## Run context (use verbatim in the report header — do not re-derive or invent these)
mode: {{MODE}}
iteration: {{ITERATION}}
inputs: {{INPUTS}}

## Coverage (engine-computed, before this call)
{{COVERAGE_JSON}}

## Prior report (previous iteration, may be empty)
{{PRIOR_REPORT}}

## Step 1 — Per-finding verdict

**Packets with `tier: "beyond-cap"` are exempt from this entire step.** They were never
dispatched to a judge — there is no verdict to assign and no arithmetic to apply. List each
one directly under "## Not verified (beyond panel cap)" in Step 5, by its `suggestedSeverity`
and `claim`/`location` — do not attempt to verify it, do not move it to Confirmed or
Escalations, and do not drop it.

**Order of application (apply in this order, every time — never infer an order yourself)
— for every other tier:**
1. **Escalation conditions** (below) — checked first, against every finding regardless of
   tier.
2. **Tier routing** (`panel`/`promoted` vs. `spot`) — checked second, for whatever the
   escalation check didn't already claim.
3. **Panel arithmetic** — applied last, only to what's left.

**The escalation bullets override everything below them.** If a finding matches an
escalation condition, it goes to Escalations — full stop — even when the arithmetic alone
would say confirmed, even when the tier alone would say Unverified nits. Escalation is
never something the arithmetic or tier routing can override; it only ever runs the other
way.

Never silently drop a finding and never silently confirm one out of uncertainty. A finding
escalates if **any** of these hold:
- Any `panel` or `promoted` finding with `valid` < 3 (a dead seat) → **Escalations**, not
  confirmed, not rejected, not dropped.
- Any finding — any tier, including `spot` — where `external` is true and any vote is
  `UNVERIFIED` → **Escalations**. This includes a `spot` finding that is external with an
  UNVERIFIED vote: it does NOT go to "Unverified nits" just because it's spot-tier —
  Escalations wins, because an unresolved external premise needs a human either way,
  regardless of how much verification depth the finding was routed to receive.
  Concretely: reproduce and ground CONFIRM a Blocking finding while refute returns
  UNVERIFIED on an external premise. Arithmetic alone reads `valid=3`, 2 CONFIRMs →
  "confirmed" — but the escalation rule fires first because the finding is external with
  an UNVERIFIED vote, so the correct outcome is Escalations, not confirmed.

Only once no escalation condition applies do tier and arithmetic decide the finding:
- A `spot` finding that was not promoted and does not escalate → **Unverified nits**, never
  "confirmed" (a single refute-seat pass is not panel-strength verification).
- A `panel` or `promoted` finding that does not escalate → **panel arithmetic**: `valid` = 3
  and at least 2 CONFIRM votes is **confirmed**; otherwise **rejected**.

You MAY overrule the arithmetic default, but ONLY with reasoning that cites specific seat
evidence — for example, two CONFIRM votes whose shared premise the refute seat's evidence
factually disproved, or a CONFIRM that itself concedes the refute seat's point. Never
overrule on vibes, on your own re-reading of the spec, or on a preference for a different
outcome — cite the seat evidence or don't overrule. An overrule only ever operates within
step 3 (arithmetic); it cannot suppress an escalation condition from step 1.

## Step 2 — Final severity
Start from the seat severities on the confirming votes (not `suggestedSeverity`, which was
only ever a routing hint). Then condition on the environment profile: the profile moves
the Should-fix ↔ Nit boundary, and down-weights resilience/observability/cost findings for
low-blast-radius projects (few users, no real money/data at stake, easy rollback). For
every finding whose severity you demote because of the profile, state in one line which
profile fact drove it — e.g. "demoted: profile states single-operator internal tool with
no external users, so a missing retry-with-backoff is a Nit here."

**Severity floors (profile-proof — hold under every profile):**
confirmed injection / authZ bypass / secrets-in-code that is potentially exploitable to
escalate privilege or reach data the invoker could not already reach — any network-exposed
surface qualifies, and so does local tooling that runs with privileges its caller lacks;
data-loss or irreversible-migration risk on real data; violation of the artifact's own
stated core purpose → **Blocking under any profile.** A low-blast-radius profile can
demote a missing circuit breaker to Nit; it can never demote an SQL injection.

Apply the floors before applying any profile-driven demotion. If a finding matches a floor
condition, its severity is Blocking regardless of what the profile says, and no one-line
justification is needed for that floor (the floor is the justification).

## Step 3 — Prior report handling
If `{{PRIOR_REPORT}}` is non-empty:
- For each finding that the prior report listed under "Confirmed findings", mark it in
  this report as **resolved** (no longer present / fixed), **regressed** (present again
  or fixed incompletely), or **still-open** (unchanged), based on the current packets.
- Do NOT re-litigate any finding the prior report placed under "Rejected (with reason)" —
  if scouts re-surfaced it anyway, note it was previously rejected and why, and leave the
  rejection standing.
  **Narrow exception (evidence-disciplined, mirrors the panel-overrule discipline in
  Step 1):** a previously-rejected finding may be reconsidered ONLY when the current
  iteration's evidence differs materially from what the prior report cited — typically
  because the fixes changed the very code or spec text the rejection rested on — and your
  reconsideration MUST cite that specific new evidence. Absent such a citation, the prior
  rejection stands; do not reopen it. This exception exists because a fix can legitimately
  turn a previously-immaterial claim into a real one — it is NOT a licence to re-argue
  rejections you simply disagree with.
Then compute the **delta counts** this iteration's header reports (see Step 5's
`delta vs prior:` line) — they are what lets the caller's loop decide convergence without
re-parsing prose:
- `new`: confirmed findings in THIS report that the prior report does not list in any
  section (a restatement, re-slicing, or wording-variant of a prior entry is NOT new —
  match on substance, not wording). Track separately how many of these are Blocking.
- `carried`: confirmed findings marked still-open from the prior report.
- `resolved`: prior confirmed findings marked resolved.
- `regressed`: prior confirmed findings marked regressed. Track separately how many are
  Blocking — a regressed Blocking counts against convergence exactly like a new one.
If `{{PRIOR_REPORT}}` is empty, this is iteration 1 — skip this step; there is no
resolved/regressed/still-open tracking to do and no delta line to render.

## Step 4 — Verdict line
`<highest confirmed severity> (<n> confirmed)` if any finding confirmed, else
`clean (<n> nits)` where n counts the Unverified-nits entries. **The word `confirmed` MUST
appear literally in the parenthetical whenever anything confirmed** — `"Blocking (3)"` is
wrong, `"Blocking (3 confirmed)"` is right. This is not cosmetic: a caller (e.g. super-design)
may parse this line, and `clean (<n> nits)` deliberately does NOT carry the word `confirmed`
since nothing did.
Append ` [low coverage]` when any stage substantially failed: `{{COVERAGE_JSON}}`'s
`triageDead` is `true` (triage returned nothing, so every conditional PR lane and every
domain scout was silently skipped — the roster you see is the fallback, not a triage
decision), any dead scout, `{{COVERAGE_JSON}}`'s `dedupeDead` is `true` (dedupe returned
nothing on both tries despite non-empty scout input — this is a failed dedupe, not a clean
result), any judge completion below 100% (i.e. any `valid` < the tier's full seat count
anywhere in the packets), or zero raw findings on a non-trivial artifact. Low coverage is a fact about the run, independent of
whether anything confirmed — append it even to a `clean` verdict.
Append ` [panel-capped: N unverified]` when `{{COVERAGE_JSON}}`'s `beyondPanelCap` is
non-zero, with N equal to that count. This is independent of `[low coverage]` — both
qualifiers can appear together, and either can appear alone.
Append ` [converged]` when ALL of these hold — it is the signal a caller's fix loop uses to
stop iterating instead of running another round into diminishing returns:
- `{{PRIOR_REPORT}}` is non-empty (never on iteration 1 — one round proves nothing about
  convergence);
- **no confirmed Blocking of any provenance this round** — zero new, zero regressed, AND
  zero carried/still-open Blocking (a carried Blocking means the fix pass failed on it, and
  the loop must keep driving it — that is the caller's no-shrink thrash exit's territory,
  never convergence). Confirmed findings below Blocking do not block convergence;
- neither `[low coverage]` nor `[panel-capped]` applies — a degraded round finding nothing
  new is absence of evidence, not convergence; never emit `[converged]` alongside either.

## Step 5 — Assemble the report
Render the full report using this template verbatim (fill the bracketed parts; keep every
heading exactly as written). The `independence:` line is `{{INDEPENDENCE}}` exactly as the
orchestrator rendered it from the seats it actually dispatched — **never write a model family
from assumption**: if the token reached you unrendered (the literal text `{{INDEPENDENCE}}`),
write `independence: unknown — orchestrator did not render the seat roster`, which a caller
reads as weak, rather than guessing a family. The `iteration:` value is `{{ITERATION}}` as
given — `N of <cap>` inside a fix loop, or `post-cap audit` for a whole-branch roast run after
a caller's cap already tripped.

---
super-roast verdict: <Blocking (n confirmed) | Should-fix (n confirmed) | clean (n nits)> [low coverage] [panel-capped: N unverified] [converged]
mode: design | PR        iteration: N of 3
profile (assumed): <2–4 sentence inferred profile>
inputs: <spec paths | branch@sha vs base@sha [+dirty] | PR#>
delta vs prior: <X> new confirmed (<xB> Blocking) · <Y> carried (<yB> Blocking) · <Z> resolved · <W> regressed (<wB> Blocking)
coverage: <lanes ran> · <raw → deduped → panel/spot-checked counts> · <judge completion %> · remainder-capped: N
independence: {{INDEPENDENCE}}

## Confirmed findings            ← consumed by super-design, one task per finding
- [SEV] <location> — <claim>
  verdict: confirmed (reproduce ✓ / refute ✗-survived / ground ✓)
  evidence: <strongest seat evidence, file:line / URL+quote>
  fix-shape hint: <one advisory line>

## Not verified (beyond panel cap)   ← severe candidates the panel cap left unverified — listed, never dropped
- [suggested SEV] <location> — <claim>

## Beyond remainder cap (count only)   ← low-severity candidates the dedupe remainder cap dropped; the count survives, the claims do not
- <N> candidates dropped by the remainder cap — raise config.remainderCap and re-run to see them

## Rejected (with reason)        ← so re-roasts don't re-litigate
## Unverified nits (spot-checked)
## Escalations (need human)      ← UNVERIFIED externals, incomplete panels, material dissent
---

Notes on filling it in:
- `mode`, `iteration`, `inputs` come from the "## Run context" section above — use `{{MODE}}`,
  `{{ITERATION}}`, and `{{INPUTS}}` verbatim. Do not re-derive them from the packets and do not
  invent specifics; if a token arrives empty, write `not supplied` rather than a guess.
- `profile (assumed)` is `{{PROFILE}}`, rendered as the 2-4 sentence prose.
- `delta vs prior` renders Step 3's delta counts with per-severity Blocking sub-counts.
  **Iterations ≥ 2 only**: on iteration 1 omit the line entirely (there is no prior to delta
  against — an invented `0 · 0 · 0 · 0` line would make a first look like a converged
  round). The parenthesized Blocking sub-counts are what the `[converged]` qualifier is
  computed from (Step 4) and what a caller's loop reads — keep the line's shape exactly.
- `coverage` reports the pipeline funnel (raw → deduped → panel/spot-checked) and judge
  completion percentage — read these directly off `{{COVERAGE_JSON}}`, don't re-derive them
  from the packets (packets alone can't tell you about a dead triage, a dead scout or a dead
  dedupe, and `beyondPanelCap` findings carry no votes to count). The trailing
  `remainder-capped: N` term is `{{COVERAGE_JSON}}`'s `beyondCap` — print it every run, `0`
  included.
- **`beyondCap` and `beyondPanelCap` are two different losses — never merge them.**
  `beyondPanelCap` findings survived dedupe with a severe suggested severity and arrive as
  `tier: "beyond-cap"` packets, so they are listed individually under "## Not verified (beyond
  panel cap)". `beyondCap` findings were cut by the **deduper's** remainder cap before this
  stage: only their count reaches you, so "## Beyond remainder cap (count only)" carries the
  number and nothing more. When `beyondCap` is `0`, write `- none` under that heading; when it
  is non-zero, state the count. Either way the heading stays — a silently omitted section is
  how a dropped finding becomes invisible.
- Every packet with `tier: "beyond-cap"` goes under "## Not verified (beyond panel cap)",
  rendered as `- [suggested SEV] <location> — <claim>` using its `suggestedSeverity` — labelled
  "suggested" because it was never verified, not as a confirmed severity. List every one; this
  section exists so the panel cap never silently drops a severe candidate.
- Each "Confirmed findings" entry's `verdict:` line records which seats landed where —
  `reproduce ✓` if that seat's vote was CONFIRM, `refute ✗-survived` if the refute seat's
  REJECT attempt failed to kill the finding (i.e. refute seat CONFIRMed or the finding
  survived its checks), `ground ✓` if the ground seat CONFIRMed. Use the actual per-seat
  votes from `votes[]` — do not fabricate a seat's outcome.
- `fix-shape hint` is advisory only — describe the shape of a plausible fix in one line,
  not a full implementation. It is a hint for whoever fixes this, not a prescription.
- Every finding placed in Escalations by Step 1 must appear under "## Escalations (need
  human)" with a one-line reason (dead seat / UNVERIFIED external / material dissent
  between seats you chose not to resolve).
- Findings marked resolved/regressed/still-open per Step 3 are noted inline in whichever
  section they land in this iteration (e.g. a still-open confirmed finding keeps its
  "## Confirmed findings" entry and adds "(still-open, see iteration N-1)").

## Output contract (exact — return one JSON object matching this shape, no prose outside it)
`{"verdict": <string>, "reportMarkdown": <string>, "confirmedCount": <integer>, "escalations": [<string>, ...]}`

- `verdict`: the verdict line from Step 4, exactly as it appears in the report header
  (e.g. `"Blocking (2 confirmed)"`, `"clean (3 nits)"`, `"Should-fix (1 confirmed) [low
  coverage]"`, `"Blocking (2 confirmed) [panel-capped: 3 unverified]"`,
  `"Should-fix (2 confirmed) [converged]"`).
- `reportMarkdown`: the entire rendered report from Step 5, as one markdown string.
- `confirmedCount`: integer count of entries under "## Confirmed findings".
- `escalations`: array of one-line strings, one per entry under "## Escalations (need
  human)" — the same reasons that appear in the report, so callers can act on them without
  parsing markdown.

Never use `blocker`, `major`, `minor`, `BLOCK`, `REVISE`, or `PASS` — those vocabularies are
retired. Use only `Blocking | Should-fix | Nit | FYI`.
```
