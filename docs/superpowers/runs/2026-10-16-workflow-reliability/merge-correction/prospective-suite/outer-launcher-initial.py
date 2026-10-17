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
inputs = outer / 'inputs'; inputs.mkdir()
for name in ('home', 'tmp'):
    (outer / name).mkdir()
sha = lambda data: hashlib.sha256(data).hexdigest()
control_path = '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'
environment = {'PATH': control_path, 'CI': '1', 'LANG': 'C', 'LC_ALL': 'C', 'TZ': 'UTC',
               '__CF_USER_TEXT_ENCODING': '0x' + format(os.getuid(), 'X') + ':0x0:0x0',
               'HOME': str(outer / 'home'), 'TMPDIR': str(outer / 'tmp')}
frozen = []
def capture(label, path):
    data = path.read_bytes()
    (inputs / label).write_bytes(data)
    frozen.append((path, data))
    return {'path': str(path), 'bytes': len(data), 'sha256': sha(data),
            'archive': str(inputs / label)}
identities = {key: capture(key, path) for key, path in
              [('runner.py', runner), ('plan.json', plan), ('launcher.py', Path(__file__)),
               ('quiet-host-facts.json', quiet)]}
python = Path(sys.executable).resolve(strict=True)
for tool in ('python', 'bash', 'node', 'git'):
    path = python if tool == 'python' else Path(shutil.which(tool, path=control_path)).resolve(strict=True)
    identities[tool] = capture(tool + '.executable', path)
version = subprocess.run([str(python), '-I', '--version'], env=environment, capture_output=True)
if version.returncode:
    raise SystemExit('Python version probe failed; preserve attempt')
argv = [str(python), '-I', str(runner), str(plan)]
receipt = {'status': 'prepared', 'actualArgv': argv, 'environment': environment,
           'cwd': str(checkout), 'identities': identities, 'pythonVersion': version.stdout.decode(),
           'quietHostFactSemantics': 'Caller observation only; no global process-absence inference.',
           'resourceRetention': 'All outer/inner/source roots retained for separate scoped inspection.'}
def record():
    (outer / 'outer-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
record()
if any(path.read_bytes() != data for path, data in frozen):
    receipt['status'] = 'prelaunch-input-drift'; record()
    raise SystemExit('Input changed before launch; attempt retained')
receipt['startedUtc'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
receipt['status'] = 'running'; record()
code = None
try:
    with (outer / 'stdout.log').open('wb') as stdout, (outer / 'stderr.log').open('wb') as stderr:
        code = subprocess.run(argv, cwd=checkout, env=environment, stdout=stdout, stderr=stderr).returncode
except BaseException as error:
    receipt['error'] = type(error).__name__ + ': ' + str(error)
finally:
    receipt['endedUtc'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    receipt['exitCode'] = code
    receipt['changedInputs'] = [str(path) for path, data in frozen if not path.is_file() or path.read_bytes() != data]
    for stream in ('stdout', 'stderr'):
        path = outer / (stream + '.log')
        if path.exists():
            data = path.read_bytes()
            receipt[stream] = {'path': str(path), 'bytes': len(data), 'sha256': sha(data)}
    receipt['status'] = 'passed' if code == 0 and not receipt['changedInputs'] else 'failed-or-unavailable'
    record()
print(json.dumps({'status': receipt['status'], 'outerReceipt': str(outer / 'outer-receipt.json')}), flush=True)
raise SystemExit(0 if receipt['status'] == 'passed' else 1)
