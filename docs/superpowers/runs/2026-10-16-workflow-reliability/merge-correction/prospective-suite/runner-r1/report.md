# Prospective suite runner R1 — bounded private correction

This is a prospective evidence artifact, not a project implementation change or a final suite result. All execution below used tiny disposable toy Git repositories under this directory. No product test suites, real checkout mutations, history repairs, Herdr/tracker commands, global cleanup, process inspection or explicit signals were performed. The original `/private/tmp/ufz-correction-final-suite-runner.py` remains unchanged. Independent review is still required before adoption.

## Inputs and preservation

I read the full six-finding review at `/private/tmp/ufz-correction-suite-reconciliation-review/report.md` and the complete original runner. `original-v0/runner.py` preserves the original bytes; `original-v0/review-report.md` preserves that review. `original-v0/manifest.json` records both hashes and the original source path. The initial runner SHA-256 is `3f29ce968213f484c8a43fed011b27a59d6c7ce34d4eeda8988b67ce7f763e16`. The review SHA-256 is `2aa8f658b2f345869ceb0e3d087925264b423c4fb8b32771804014dc1a309d62`.

The corrected runner is `runner.py`, separate from the original. The frozen original must remain history; replacing the old path is a caller decision after review. No proposed product suite plan has been executed by this task.

## The six findings

1. **Ambient environment and selectors:** the runner requires Python `-I` and an exact minimal launcher environment, rejects unknown keys/incorrect fixed values before Git probes/output creation, and does not print rejected values. Every Bash/Node/version/Git probe receives a new, deliberate environment rather than an ambient copy. Per-case environment is fully recorded and contains owned HOME/TMP/XDG/CODEX roots. Git system/global configuration and optional locks are explicitly controlled. TEST_FILTER/BASH_ENV/NODE_OPTIONS and caller GIT_* injections are rejected at the launcher boundary. They cannot silently narrow or redirect a successful measurement.

2. **Immutable executed identity:** plan bytes are captured once before parsing. The small loader captures the runner bytes and explicitly compiles those captured bytes, so the archive identifies the main code executed. Plan, compiled runner, each entrypoint and each tool executable's exact bytes are archived in `inputs/` before the first test. Tool executable bytes/hash are captured before version invocation. Every case carries the immutable plan/runner/configuration identities. Original files are compared with captured bytes before and after each case and at envelope end; mutation invalidates and stops the run. A final reread never substitutes for an executed-input digest. The caller must independently freeze the Python launcher and all launch inputs before invoking the runner, as described below.

3. **Per-case source attribution:** each case records before/after HEAD, tree, raw NUL-delimited porcelain status, the exact controlled probe argv/environment and probe exit codes. Probe raw bytes are retained as base64. A dirty or identity-drifted post-case state stops the next case and invalidates the envelope, including a change that a later command could otherwise restore. Source claims use actual observed boundaries. A failing source probe is a failed source check.

4. **Explicit complete preflight:** no Python assertions enforce controls. The complete plan, unique commands, matching reviewed entrypoint hashes/requirement IDs, real tracked regular nonsymlink paths, positive finite timeout, exact source and standalone repository are checked before creating output or starting any case. Commands must be exactly `bash tests/<safe-path>.sh` or `node tests/<safe-path>.js|mjs|cjs`, without flags or extra arguments. Worktree-style `.git` files, symlinked Git directories and shared object alternates are rejected. Exact Git top-level/absolute/common directory checks supplement `.git` inspection. Output must be a new canonical absolute path with an existing deliberate parent, outside checkout, runner/plan inputs, and every declared historical root. Existing output is refused without writing to it.

5. **Partial/error/timeout accounting and retention:** timeout retains roots/logs, records a direct-child-only limitation, stops later cases and makes `completed=false` and `measurementValid=false`, including a timeout in the last case. Ordinary nonzero exits remain measured failures; complete valid measurement is distinct from passing. Running progress is written before launching a child; `BaseException` handling records interruptions/errors and attempts post-case source diagnostics. Preflight rejection writes structured stderr rather than an empty unvalidated output directory: the caller must retain that outer stderr/stdout receipt. No new broad cleanup/signal logic was added. Python subprocess timeout can kill its direct child; descendants remain unverified.

6. **Receipt boundary:** configuration JSON is frozen/hashed before cases and includes immutable plan/runner/tool identity, timeout, reviewed authority reference, historical roots, full accepted Python launcher environment/argv/version/flags and full subprocess environment policy. Each actual case argv/environment is recorded; Python launcher executable bytes/version are retained. Every case log has byte count/hash and an exact path; progress/result files preserve prior cases. Quiet-host facts belong to the caller and are not invented by this script. Ordinary Git clean status excludes ignored artifacts: scoped owned-resource inspection remains a separate required caller task.

## Required caller launch contract

Use an absolute Python executable with `-I`, an absolute canonical runner path and an absolute canonical plan path. Launch without a shell and with exactly these environment keys; do not merge ambient environment:

```python
environment = {
    'PATH': '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
    'CI': '1', 'LANG': 'C', 'LC_ALL': 'C', 'TZ': 'UTC',
    '__CF_USER_TEXT_ENCODING': '0x' + format(os.getuid(), 'X') + ':0x0:0x0',
    'HOME': str(canonical_owned_launcher_home),
    'TMPDIR': str(canonical_owned_launcher_tmp),
}
argv = [absolute_python, '-I', absolute_runner, absolute_plan]
```

HOME and TMPDIR must already exist, be canonical absolute directories and be deliberately owned. On this macOS host CoreFoundation resets `__CF_USER_TEXT_ENCODING` at Python startup to the UID-derived value; it is explicitly required/recorded rather than mistaken for an ambient secret. The effective measured Python environment must match the documented set exactly. Initial `-I` prevents Python environment/startup injection before runner code executes; the runner cannot undo code that ran before it started.

**Before launch**, the caller must archive the exact plan/runner/Python/Bash/Node/Git bytes and SHA-256 hashes, resolved executable paths, Python version, exact argv/environment and reviewed source/plan identity in a new outer attempt root. Retain full outer stdout/stderr with exit code, timestamps and sizes/hashes, including preflight failure or interruption. The caller's outer receipt supplies the actual amended final-suite command/configuration evidence. The runner's internal archive supplements that receipt. Observe/record the host quiet-state separately; do not infer it from `CI`, Git status or this runner.

The caller must use an actual clean standalone clone at the exact reviewed combined source. The microfixtures use real standalone toy Git repositories; no claim is made that they are project clones or final source acceptance.

## Plan additions

Retain the existing `checkout`, `output`, `sourceHead`, `sourceTree`, `commands`, and `timeoutPerCommandSeconds`. Add explicit `historicalRoots` (canonical absolute protected historical paths; fixtures use `[]`), a nonempty `reviewReference`, and `entrypoints` in exactly the same order and length as commands:

```json
{
  "command": "bash tests/example.sh",
  "sha256": "<independently reviewed actual entrypoint SHA-256>",
  "requirementIds": ["<actual current requirement ID>"]
}
```

This is an explicit allowlist of reviewed bytes, not evidence that a review happened. The parent must provide the actual review and full frozen command-to-requirement map after the corrected source is reviewed. The runner does not discover suites or guess a final command count. Canonical paths mean `/private/tmp/...` here; `/tmp` symlink spellings are rejected.

## Meaningful RED/GREEN verification

The same final test file exercises real Git/Bash/Node entrypoints, retains all disposable roots and writes outer launch receipts, raw logs, plan bytes, case receipts and a summary. It does not import product code. The final commands were:

```text
python3 /private/tmp/ufz-correction-suite-runner-r1/microfixtures.py /private/tmp/ufz-correction-suite-runner-r1/original-v0/runner.py red-receipted
python3 /private/tmp/ufz-correction-suite-runner-r1/microfixtures.py /private/tmp/ufz-correction-suite-runner-r1/runner.py green-receipted
```

RED exited 1: **3 passed, 19 failed**, root `red-receipted-gcn3934x/`, summary `red-receipted-gcn3934x/summary.json`. The original's ordinary success, existing-output refusal and partial-timeout stop are retained positive controls. The other failures identify the missing validation/identity/environment/result-schema controls; the ordinary-failure fixture additionally requires the new explicit completed status rather than claiming the old nonzero-exit handling was broken.

GREEN exited 0: **22 passed, 0 failed**, root `green-receipted-viffjcka/`, summary `green-receipted-viffjcka/summary.json`. Coverage includes ordinary Bash+Node success, ambient selectors/startup/Git contamination, transient dirty-source restoration, plan mutation, runner mutation, `-O` source validation, invalid late command, reviewed digest mismatch, output inside source, final timeout, immutable launcher/configuration/per-case receipts, secret withholding, existing-output refusal, partial timeout, absent `-I`, historical overlap, duplicate commands, tracked symlinks, and complete measured nonzero failure.

Earlier fixture attempts remain intact. In particular, `green-final-972z8iua/` and `green-launcher-fixed-85e6ymlc/` record preflight failures while accounting for macOS's startup-added CoreFoundation variable. They are not acceptance runs. The earlier 15/15 permissive-environment R1 attempt is superseded by the explicit external launcher contract; no earlier result is removed or relabeled. Each final fixture root archives its exact test source and hashes it in `summary.json`. Final source syntax was also parsed with Python `ast.parse`, without writing bytecode.

## Limits and remaining gates

No actual project suite ran. The production command count, exact final plan, correction-source review, requirement reconciliation, quiet-host evidence and outer final-suite receipt remain the parent's work. This task provides no merge/release authority or historical aggregate success. It does not certify hosted Workflow behavior, global process absence, ignored-artifact cleanliness or descendant termination. It is not a hostile-code sandbox: reviewed trusted entrypoints can access the host, and the caller must control the checkout/plan/tools throughout measurement. Dynamic libraries/interpreters loaded behind captured executable files are not independently frozen.

Catchable interruption diagnostic paths are implemented but were not tested by sending signals; no signal experiment was performed. SIGKILL, power loss, disk failure and arbitrary corruption cannot guarantee a final receipt; retain outer diagnostics and the latest on-disk progress. Resource directories are intentionally retained. The parent must independently review and freeze this runner before adopting it.

Exact final artifact hashes and RED/GREEN summary hashes are in `manifest.json`; that manifest is generated after verification and does not claim to hash itself.
