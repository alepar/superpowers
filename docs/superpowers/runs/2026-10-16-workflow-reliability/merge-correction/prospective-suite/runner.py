"""Versioned serial evidence runner; only executes an explicit frozen command plan.

The caller prepares a clean standalone clone at the plan's exact source first.
No historical evidence is overwritten, and no process-absence claim is inferred.
"""
import hashlib
import json
import os
from pathlib import Path
import platform
import shlex
import shutil
import subprocess
import sys
import time

plan_path = Path(sys.argv[1]).resolve(strict=True)
plan = json.loads(plan_path.read_text())
root = Path(plan['checkout']).resolve(strict=True)
out = Path(plan['output']).resolve()
if out.exists():
    raise SystemExit('Refusing an existing output; preserve earlier attempts.')
out.mkdir(parents=True)

def git(*args):
    return subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()

source_head, source_tree = git('rev-parse', 'HEAD'), git('rev-parse', 'HEAD^{tree}')
assert source_head == plan['sourceHead'] and source_tree == plan['sourceTree']
assert not git('status', '--porcelain=v1'), 'Standalone source is not clean'
assert (root / '.git').is_dir(), 'Packaging requires a standalone checkout'
assert plan['commands'] and len(set(plan['commands'])) == len(plan['commands'])
cases = []
tool_versions = {}
for tool, args in [('node', ['node', '--version']), ('bash', ['bash', '--version'])]:
    process = subprocess.run(args, capture_output=True, text=True, timeout=10)
    tool_versions[tool] = (process.stdout or process.stderr).splitlines()[0]

for index, command in enumerate(plan['commands'], 1):
    case_id = f'{index:02d}'
    case_dir = out / ('case-' + case_id)
    case_dir.mkdir()
    parts = shlex.split(command)
    assert parts[0] in ('bash', 'node'), 'Only declared test entry points supported'
    executable = shutil.which(parts[0])
    assert executable, 'Runner executable unavailable'
    argv = [executable, *parts[1:]]
    environment = os.environ.copy()
    recorded_environment = {'CI': '1'}
    for key, folder in [('TMPDIR', 'tmp'), ('HOME', 'home'),
                        ('XDG_CONFIG_HOME', 'xdg-config'), ('XDG_CACHE_HOME', 'xdg-cache'),
                        ('XDG_DATA_HOME', 'xdg-data'), ('XDG_STATE_HOME', 'xdg-state'),
                        ('CODEX_HOME', 'codex-home')]:
        target = case_dir / folder
        target.mkdir()
        recorded_environment[key] = str(target)
    environment.update(recorded_environment)
    started = time.time()
    code, status, timed_out, cause = None, 'error', False, None
    with (case_dir / 'stdout.log').open('wb') as stdout, (case_dir / 'stderr.log').open('wb') as stderr:
        try:
            result = subprocess.run(argv, cwd=root, env=environment, stdout=stdout,
                                    stderr=stderr, timeout=plan['timeoutPerCommandSeconds'])
            code = result.returncode
            status = 'passed' if code == 0 else 'failed'
        except subprocess.TimeoutExpired:
            timed_out = True
            cause = 'Timed-out direct child killed by subprocess; descendants unverified, resources retained.'
        except OSError as error:
            cause = str(error)
    ended = time.time()
    receipt = {'id': case_id, 'planCommand': command, 'actualArgv': argv,
               'cwd': str(root), 'environment': recorded_environment,
               'startUtc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(started)),
               'endUtc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(ended)),
               'durationSeconds': round(ended - started, 3), 'exitCode': code,
               'status': status, 'timeout': timed_out, 'cause': cause,
               'sourceHead': source_head, 'sourceTree': source_tree,
               'runner': executable, 'runnerSha256': hashlib.sha256(Path(executable).read_bytes()).hexdigest(),
               'stdoutPath': str(case_dir / 'stdout.log'), 'stderrPath': str(case_dir / 'stderr.log')}
    for stream in ('stdout', 'stderr'):
        data = (case_dir / (stream + '.log')).read_bytes()
        receipt[stream + 'Bytes'] = len(data)
        receipt[stream + 'Sha256'] = hashlib.sha256(data).hexdigest()
    (case_dir / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    cases.append(receipt)
    (out / 'progress.json').write_text(json.dumps({'cases': cases}, indent=2) + '\n')
    print(f'{case_id}/{len(plan["commands"])} {status}: {command}', flush=True)
    if timed_out:
        break

final_status = git('status', '--porcelain=v1')
final_head, final_tree = git('rev-parse', 'HEAD'), git('rev-parse', 'HEAD^{tree}')
result = {'sourceHead': source_head, 'sourceTree': source_tree,
          'measurementValid': not final_status and final_head == source_head and final_tree == source_tree and len(cases) == len(plan['commands']),
          'platform': platform.platform(), 'toolVersions': tool_versions,
          'planPath': str(plan_path), 'planSha256': hashlib.sha256(plan_path.read_bytes()).hexdigest(),
          'runnerSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          'commandCount': len(plan['commands']), 'commandGroupsPassed': sum(c['status'] == 'passed' for c in cases),
          'commandGroupsFailed': sum(c['status'] == 'failed' for c in cases),
          'commandGroupsErrors': sum(c['status'] == 'error' for c in cases),
          'commandGroupsSkipped': len(plan['commands']) - len(cases),
          'cases': cases, 'clonePath': str(root), 'finalSourceStatus': final_status,
          'finalSourceHead': final_head, 'finalSourceTree': final_tree,
          'resourceRetention': 'Clone and per-case roots retained; separate scoped inspection pending.',
          'limitations': ['Actual test execution; canned external agents in fixtures remain simulations.',
                         'No hosted Workflow, provider-wide reliability or global process-absence claim.']}
(out / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ['measurementValid', 'commandGroupsPassed', 'commandGroupsFailed',
                                      'commandGroupsErrors', 'commandGroupsSkipped']}), flush=True)
sys.exit(0 if result['measurementValid'] and not result['commandGroupsFailed'] and not result['commandGroupsErrors'] else 1)
