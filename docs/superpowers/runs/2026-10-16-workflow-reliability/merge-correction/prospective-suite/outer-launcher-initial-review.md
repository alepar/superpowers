# Supplemental scoped review — prospective outer suite launcher

Artifact: `/private/tmp/ufz-correction-suite-outer-launcher.py`, **4,790 bytes**, SHA-256 **533b597e572eb9c049b343857e5dc6e732c17aa25c4dccb89cc6665c94d79250**.

Verdict: **with one bounded Important fix** for complete failure receipts. No Critical issue confirmed. The successful-launch path supplies the prelaunch boundary left conditional in the R1 runner review; final plan/source/quiet-host facts remain unreviewed and conditional.

## Actual review scope

Read the complete 88-line launcher against the R1 runner's caller contract and prior review findings #2/#6. Independently verified the supplied byte count/hash and parsed its exact bytes with `ast.parse`. No launcher, microfixture or project suite was executed. No subprocess signals, Git operations, canonical changes, Herdr/tracker writes or subagents were used. Only this separate report was written; the original runner review remains unchanged.

## Confirmed controls

- Lines 15–30 require initial Python isolation, canonical existing input files, a new canonical outer output root, and disjointness from the source checkout and declared historical roots.
- Lines 35–54 create the exact minimal runner environment and archive runner, plan, launcher and caller quiet-host facts plus resolved Python/Bash/Node/Git executable bytes before the measured child starts. The Python version probe also receives the explicit environment. Identities retain original paths, archive paths, byte counts and SHA-256 hashes.
- Lines 57–69 record the absolute Python `-I` runner command, exact environment, checkout cwd and prelaunch identities, and compare all captured inputs before launching.
- Lines 71–88 retain the measured child's full stdout/stderr, exit code, start/end UTC timestamps and hashes/sizes, compare frozen inputs afterward and withhold success for nonzero/unavailable child outcome or detected byte drift. Resources are retained. The launcher does not introduce cleanup or a descendant-termination claim.

These controls are appropriate for the trusted one-shot script under parent control. They do not need a general hostile-concurrency framework. They also do not independently prove the selected hashes were reviewed, historicalRoots is complete, the checkout is the reviewed final source or quiet-host facts are current and sufficient; those are still the parent's explicit final plan/observation gates.

## Important finding

**1. A setup or final identity-read error can leave the outer attempt without the required completed diagnostic receipt.**

Location: launcher lines **31–67**, **76–86**.

The outer directory is created at line 31, but the first receipt is not written until line 64. Input capture, tool lookup/capture and the Python version probe happen outside the attempt try/finally. For example, `shutil.which` returning `None` causes `Path(None)` at line 52; a capture read failure also exits before any receipt. These paths leave a newly created outer attempt with partial archives but no recorded status/outcome/raw setup diagnostic. The explicit nonzero version-probe path likewise exits without recording its stdout/stderr or a failure receipt. The successful runner-preflight-failure path is already captured correctly; this finding concerns failures in the new outer layer itself.

After a child runs, the unguarded `path.read_bytes()` calls at line 79 can also raise during finalization. That skips log hashing and `record()`, leaving the durable receipt at `running` despite the child having returned. The retained raw files help diagnosis but do not substitute for the requested outcome/timestamps/input-drift receipt.

This is an evidence-completeness issue, not false success or a broad safety flaw. It matters because this outer wrapper is explicitly the owner of the durable attempt receipt, including error paths. It currently adds a setup/finalization gap around the R1 runner's otherwise explicit error handling.

Bounded fix: create an initial receipt as soon as the owned outer root exists; include setup/capture/version/prelaunch work in the attempt exception/finalization boundary; retain version probe argv/exit/stdout/stderr; and make each final input comparison catch/report its own read error while continuing to record child outcome and available log receipts. Preserve `failed-or-unavailable` for such errors. Disk failure/power loss/SIGKILL cannot guarantee writes and do not require a new framework.

Evidence: direct source control-flow inspection; no failure injection or execution was needed or performed. This finding does not claim any such failure has already occurred.

## Conditional disposition

After the bounded failure-accounting correction, this wrapper can supply R1 findings #2/#6's declared prelaunch archive and exact child command receipt boundary. Bind the reviewed wrapper and runner hashes to the final reviewed plan before use. Actual suite execution, launcher invocation evidence, quiet-host facts and scoped resource inspection remain future evidence; syntax parsing and this review supply none of those outcomes.
