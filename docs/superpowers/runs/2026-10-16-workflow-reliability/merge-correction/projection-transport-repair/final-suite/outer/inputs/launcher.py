"""Controlled one-shot launcher for the reviewed private final-suite runner.

Only invoke after the parent reviews/freezes the final plan and records quiet-host
facts. Everything is retained; this script never cleans resources or signals them.
"""
from pathlib import Path
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time

if sys.flags.isolated != 1 or len(sys.argv) != 5:
    raise SystemExit('usage: absolute-python -I launcher.py RUNNER PLAN NEW_OUTER_ROOT QUIET_FACTS')
runner, plan, outer, quiet = [Path(p) for p in sys.argv[1:]]
for p in (runner, plan, quiet):
    if not p.is_absolute() or p.resolve(strict=True) != p or not p.is_file():
        raise SystemExit('Launch input must be a canonical absolute file')
if not outer.is_absolute() or outer.resolve() != outer or outer.exists() or not outer.parent.is_dir():
    raise SystemExit('Outer root must be deliberately new, canonical and owned')
source_plan = json.loads(plan.read_bytes())
checkout = Path(source_plan['checkout']).resolve(strict=True)
if outer == checkout or checkout in outer.parents or outer in checkout.parents:
    raise SystemExit('Outer evidence root must not overlap source checkout')
for name in source_plan['historicalRoots']:
    protected = Path(name).resolve()
    if outer == protected or outer in protected.parents or protected in outer.parents:
        raise SystemExit('Outer root overlaps protected historical evidence')
outer.mkdir()
sha = lambda data: hashlib.sha256(data).hexdigest()
frozen = []
receipt = {'status': 'preparing', 'preparedUtc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
           'callerArgv': list(sys.orig_argv), 'cwd': str(checkout),
           'quietHostFactSemantics': 'Caller observation only; no global process-absence inference.',
           'resourceRetention': 'All outer/inner/source roots retained for separate scoped inspection.'}
def record():
    temporary = outer / 'outer-receipt.json.writing'
    temporary.write_text(json.dumps(receipt, indent=2) + '\n')
    temporary.replace(outer / 'outer-receipt.json')

def changed_inputs():
    changes = []
    for path, data in frozen:
        try:
            if path.read_bytes() != data:
                changes.append({'path': str(path), 'reason': 'bytes changed'})
        except OSError as error:
            changes.append({'path': str(path), 'reason': type(error).__name__ + ': ' + str(error)})
    return changes

def capture(label, path):
    data = path.read_bytes()
    (inputs / label).write_bytes(data)
    frozen.append((path, data))
    return {'path': str(path), 'bytes': len(data), 'sha256': sha(data),
            'archive': str(inputs / label)}
code = None
try:
    record()
    inputs = outer / 'inputs'; inputs.mkdir()
    for name in ('home', 'tmp'):
        (outer / name).mkdir()
    control_path = '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'
    environment = {'PATH': control_path, 'CI': '1', 'LANG': 'C', 'LC_ALL': 'C', 'TZ': 'UTC',
                   '__CF_USER_TEXT_ENCODING': '0x' + format(os.getuid(), 'X') + ':0x0:0x0',
                   'HOME': str(outer / 'home'), 'TMPDIR': str(outer / 'tmp')}
    receipt['environment'] = environment
    identities = {}; receipt['identities'] = identities
    for key, path in [('runner.py', runner), ('plan.json', plan), ('launcher.py', Path(__file__)),
                      ('quiet-host-facts.json', quiet)]:
        identities[key] = capture(key, path); record()
    python = Path(sys.executable).resolve(strict=True)
    for tool in ('python', 'bash', 'node', 'git'):
        found = str(python) if tool == 'python' else shutil.which(tool, path=control_path)
        if not found:
            raise RuntimeError('Required launcher tool unavailable: ' + tool)
        identities[tool] = capture(tool + '.executable', Path(found).resolve(strict=True)); record()
    version = subprocess.run([str(python), '-I', '--version'], env=environment, capture_output=True)
    receipt['pythonVersionProbe'] = {'argv': [str(python), '-I', '--version'],
                                    'exitCode': version.returncode,
                                    'stdout': version.stdout.decode(errors='replace'),
                                    'stderr': version.stderr.decode(errors='replace')}
    if version.returncode:
        raise RuntimeError('Python version probe failed')
    argv = [str(python), '-I', str(runner), str(plan)]
    receipt['actualArgv'] = argv
    if changed_inputs():
        raise RuntimeError('Input changed before launch')
    receipt['startedUtc'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    receipt['status'] = 'running'; record()
    with (outer / 'stdout.log').open('wb') as stdout, (outer / 'stderr.log').open('wb') as stderr:
        code = subprocess.run(argv, cwd=checkout, env=environment, stdout=stdout, stderr=stderr).returncode
except BaseException as error:
    receipt['error'] = type(error).__name__ + ': ' + str(error)
finally:
    receipt['endedUtc'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    receipt['exitCode'] = code
    receipt['changedInputs'] = changed_inputs()
    for stream in ('stdout', 'stderr'):
        path = outer / (stream + '.log')
        try:
            data = path.read_bytes()
            receipt[stream] = {'path': str(path), 'bytes': len(data), 'sha256': sha(data)}
        except OSError as error:
            receipt[stream] = {'path': str(path), 'unavailable': type(error).__name__ + ': ' + str(error)}
    complete_logs = all('unavailable' not in receipt[stream] for stream in ('stdout', 'stderr'))
    receipt['status'] = 'passed' if code == 0 and not receipt['changedInputs'] and not receipt.get('error') and complete_logs else 'failed-or-unavailable'
    try:
        record()
    except OSError as error:
        receipt['status'] = 'failed-or-unavailable'
        print(json.dumps({'status': receipt['status'], 'receiptWriteError': str(error), 'retainedReceipt': receipt}), file=sys.stderr)
print(json.dumps({'status': receipt['status'], 'outerReceipt': str(outer / 'outer-receipt.json')}), flush=True)
raise SystemExit(0 if receipt['status'] == 'passed' else 1)
