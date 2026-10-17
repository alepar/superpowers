# Scoped re-review — outer launcher failure-accounting fix

Artifact: `/private/tmp/ufz-correction-suite-outer-launcher.py`, **6,180 bytes**, SHA-256 **89b2316cdd4773d49fa5db379dabdac55ed7d34c3fbb85d3046ac15faa49c87e**.

**Verdict: PASS for the scoped failure-accounting correction.** The prior Important finding is addressed. No new Critical or Important issue confirmed from this fix. The final plan/source/quiet-host evidence remains conditional.

## Original finding disposition

The original review at `/private/tmp/ufz-correction-suite-outer-launcher-review.md` identified missing durable receipts for setup/capture/version errors and final input-read exceptions. The correction closes both parts:

- Lines 34–41 define a preparing receipt and atomic replacement. Line 61 writes it as the first operation inside the setup exception boundary. Input/root creation, incremental identity capture, tool discovery, version probe, prelaunch checks and child invocation now share the try/except/finally at lines 60–114. Setup errors receive a diagnostic, ended timestamp, unavailable child exit and final failed-or-unavailable receipt.
- Lines 71–79 save each captured identity incrementally. Missing tools have an explicit diagnostic. Lines 80–86 retain the Python version probe's exact argv, stdout/stderr and exit code, including nonzero results.
- Lines 43–51 treat each frozen-input read failure as a changed-input diagnostic rather than aborting finalization. Lines 98–107 continue recording the child outcome and individually hash available logs or mark each unavailable.
- Lines 108–109 permit success only with child exit zero, no input drift, no caught error and both log receipts available. Lines 110–114 provide best-effort structured stderr if final receipt persistence itself fails. Unavailable logs and setup errors cannot produce success.

The prospective successful-launch controls remain intact: before-child plan/runner/launcher/quiet-fact/tool archives, explicit absolute Python `-I` child invocation with minimal environment, checkout cwd, input byte comparisons and retained raw child logs/resources. This is sufficient within the caller-controlled one-shot boundary already reviewed; no broader framework is required.

## Verification and limits

Read the entire updated 116-line source, with emphasis on the original finding and new exception/finalization control flow. Independently matched the supplied byte count/hash and parsed those exact bytes with `ast.parse`. No launcher, microfixture or project suite ran; there was no failure injection, signal test, Git operation, canonical mutation, Herdr/tracker write or subagent. Only this separate report was written; both prior reports remain unchanged.

This is source-level clearance of the bounded fix, not an observed runtime failure-path test. Pre-root validation may still reject via the outer process's stderr without creating an unvalidated evidence directory; the caller should retain that invocation's own output as documented. Disk failure, SIGKILL and power loss cannot guarantee a final write. Bind this exact launcher and the reviewed R1 runner to the independently reviewed frozen final plan, then retain actual invocation, quiet-host observation and scoped resource-inspection evidence. This review supplies none of those future facts or final-suite outcomes.
