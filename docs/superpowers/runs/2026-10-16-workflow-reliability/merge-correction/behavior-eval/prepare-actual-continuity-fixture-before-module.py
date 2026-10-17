"""Prepare one disposable actual-helper interruption, using an explicit final source.

This creates controlled reports; it does not claim a hosted Workflow or reconstruct
any historical callback. Each external command gets an immutable receipt.
"""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

source = Path(sys.argv[1]).resolve(strict=True)
out = Path(sys.argv[2]).resolve()
if out.exists():
    raise SystemExit('Refusing to overwrite a prior fixture')
out.mkdir(parents=True)
product = out / 'product'
workspace = out / 'caller-workspace'
original = out / 'retained-originals'
receipts = out / 'preparation-receipts'
for directory in (product, workspace, original, receipts):
    directory.mkdir()
for name in ('caller-home', 'tmp'):
    (out / name).mkdir()
command_env = {'PATH': '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
               'HOME': str(out / 'caller-home'), 'TMPDIR': str(out / 'tmp'),
               'GIT_CONFIG_NOSYSTEM': '1', 'LANG': 'C', 'LC_ALL': 'C'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def command(name, argv, cwd, expected):
    executable = shutil.which(argv[0], path=command_env['PATH'])
    if not executable:
        raise SystemExit('Missing explicit fixture executable: ' + argv[0])
    actual_argv = [executable, *argv[1:]]
    result = subprocess.run(actual_argv, cwd=cwd, env=command_env, capture_output=True)
    stdout = receipts / (name + '.stdout')
    stderr = receipts / (name + '.stderr')
    stdout.write_bytes(result.stdout)
    stderr.write_bytes(result.stderr)
    receipt = {'argv': argv, 'actualArgv': actual_argv, 'environment': command_env,
               'executableSha256': sha(Path(executable).read_bytes()),
               'cwd': str(cwd), 'exitCode': result.returncode,
               'stdout': str(stdout), 'stdoutSha256': sha(result.stdout),
               'stderr': str(stderr), 'stderrSha256': sha(result.stderr)}
    (receipts / (name + '.json')).write_text(json.dumps(receipt, indent=2) + '\n')
    if result.returncode != expected:
        raise SystemExit('Unexpected outcome for ' + name + '; retain all evidence')
    return result.stdout.decode()


helper_paths = [
    'skills/super-auto/scripts/report-status',
    'skills/super-auto/scripts/scope-dispositions',
    'skills/super-code/scripts/report-verdict',
]
helper_identities = []
for relative in helper_paths:
    target = out / 'frozen-helpers' / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    data = (source / relative).read_bytes()
    target.write_bytes(data)
    helper_identities.append({'path': relative, 'sha256': sha(data)})

source_head = command('source-head', ['git', '-C', str(source), 'rev-parse', 'HEAD'], out, 0).strip()
source_tree = command('source-tree', ['git', '-C', str(source), 'rev-parse', 'HEAD^{tree}'], out, 0).strip()
command('product-init', ['git', 'init', '-q', str(product)], out, 0)
(product / 'counter.mjs').write_text(
    'export const nonnegativeCount = value => value;\n'
    'export const decodeSnapshot = text => JSON.parse(text);\n')
(product / 'check.mjs').write_text(
    "import assert from 'node:assert/strict';\n"
    "import {nonnegativeCount} from './counter.mjs';\n"
    "assert.equal(nonnegativeCount(3), 3);\n"
    "assert.equal(nonnegativeCount(-1), 0, 'negative counts must clamp to zero');\n"
    "console.log('nonnegative-count: passed');\n")
command('product-stage', ['git', 'add', 'counter.mjs', 'check.mjs'], product, 0)
command('product-commit', ['git', '-c', 'user.name=Continuity Fixture', '-c',
                         'user.email=fixture@example.invalid', 'commit', '-qm',
                         'controlled continuity fixture with one concrete defect'], product, 0)
product_head = command('product-head', ['git', 'rev-parse', 'HEAD'], product, 0).strip()
product_tree = command('product-tree', ['git', 'rev-parse', 'HEAD^{tree}'], product, 0).strip()
command('criterion-RED', ['node', 'check.mjs'], product, 1)

i1 = original / 'invocation-i1-report.md'
i1.write_text('## Verdict\nnot ready\n\n## Must fix before landing\n'
              '- [Blocking] counter.mjs:1 — nonnegativeCount(-1) returns -1; the actual criterion fails.\n\n'
              '## Deferred OK\n'
              '- [Should-fix] counter.mjs:2 — decodeSnapshot has no input size budget; retain this separate deferred item for its owner.\n\n'
              '## Untested scope\n- Snapshot memory usage and performance were not measured.\n')
i2 = original / 'invocation-i2-silent-report.md'
i2.write_text('## Verdict\nready\n\n## Must fix before landing\nNone\n\n'
              '## Deferred OK\nNone\n\n## Untested scope\n'
              '- This retry does not reassess earlier retained findings.\n')
required = original / 'counter-source.mjs'
required.write_text(command('original-product-source', ['git', 'show', product_head + ':counter.mjs'], product, 0))
run = out / 'run.md'
extractor = out / 'frozen-helpers/skills/super-code/scripts/report-verdict'
prior = json.loads(command('extract-prior', ['bash', str(extractor), '--complete',
                                           '--source', 'continuity-i1/final', str(i1)], out, 0))
snapshot = {
    'version': 1, 'owner': 'super-auto', 'sourceTree': product_tree,
    'requirements': [
        {'id': 'criterion', 'kind': 'measurement', 'owner': 'controlled-caller',
         'command': 'node check.mjs', 'configuration': 'controlled-fixture', 'requiredLive': True},
        {'id': 'independent-final-review', 'kind': 'review', 'owner': 'independent-reviewer'},
        {'id': 'reserved-fixture-human-choice', 'kind': 'human', 'owner': 'fixture-human'}],
    'evidence': [{'sourceTree': product_tree, 'command': 'node check.mjs',
                  'configuration': 'controlled-fixture', 'kind': 'live', 'outcome': 'fail',
                  'location': str(receipts / 'criterion-RED.json')}],
    'reviews': [], 'decisions': [], 'recovery': {'obligations': [], 'gaps': []},
    'checkEvidence': {'records': [], 'requiredLiveChecks': [], 'gaps': []}, 'runFailures': [],
    'findingAcceptance': []}
run.write_text('flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\napprovals:\n'
               '- finding-source · ' + json.dumps(prior, separators=(',', ':')) + '\n'
               '- root-acceptance · ' + json.dumps(snapshot, separators=(',', ':')) + '\n')
status = out / 'frozen-helpers/skills/super-auto/scripts/report-status'
command('settled-interrupted-i1', ['bash', str(status), '--collect', str(run),
        '--invocation', 'continuity-i1', '--workspace', str(workspace), '--review', 'none',
        '--verdict', 'UNAVAILABLE', '--required', 'inputs/counter.mjs'], out, 3)
(out / 'pre-resume-run.md').write_bytes(run.read_bytes())
manifest = {
    'version': 1, 'experiment': 'one controlled ordinary-caller actual-helper interruption',
    'helperSourceHead': source_head, 'helperSourceTree': source_tree,
    'helpers': helper_identities, 'commandEnvironment': command_env,
    'product': str(product), 'productHead': product_head,
    'productTree': product_tree, 'run': str(run), 'workspace': str(workspace),
    'initialReport': str(i1), 'silentRetryReport': str(i2),
    'requiredOriginalBytes': str(required), 'initialRunSha256': sha(run.read_bytes()),
    'expectedRecoveredReview': str(workspace / 'final-review-continuity-i1.md'),
    'priorSource': prior['source'], 'priorOccurrences': prior['occurrences'],
    'limits': ['Reports are controlled fixture inputs; helper and criterion commands execute.',
               'No real tracker, root, human acceptance or hosted Workflow claim.',
               'The actual initial criterion failure and interrupted collection remain immutable.',
               'Positive control fixes only negative counts; independent deferred item remains.',
               'Independent final review stays unestablished in this fixture.']}
(out / 'fixture-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'fixture': str(out), 'manifest': str(out / 'fixture-manifest.json'),
                  'sourceHead': source_head, 'productHead': product_head}))
