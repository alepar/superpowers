"""Real disposable Git/bash/Node fixtures; never imports or tests the product."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

BASE = Path(__file__).resolve().parent
RUNNER = Path(sys.argv[1]).resolve()
LABEL = sys.argv[2]
RUN = Path(tempfile.mkdtemp(prefix=LABEL + '-', dir=BASE))
TEST_BYTES = Path(__file__).read_bytes()
(RUN/'microfixtures.py').write_bytes(TEST_BYTES)
ENV = {'PATH': '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
       'HOME': str(RUN), 'TMPDIR': str(RUN), 'LC_ALL': 'C', 'LANG': 'C', 'TZ': 'UTC', 'CI': '1',
       '__CF_USER_TEXT_ENCODING': '0x' + format(os.getuid(), 'X') + ':0x0:0x0'}

def command(argv, cwd=None, env=None):
    return subprocess.run(argv, cwd=cwd, env=env or ENV, capture_output=True, timeout=20)

def git(root, *args):
    p = command(['git', '-C', str(root), *args])
    if p.returncode:
        raise RuntimeError(p.stderr.decode())
    return p.stdout.decode().strip()

def fixture(name, scripts, commands=None):
    folder = RUN / name
    folder.mkdir()
    root = folder / 'clone'
    root.mkdir()
    git(root, 'init', '-q')
    for rel, text in scripts.items():
        p = root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text)
    git(root, 'add', '.')
    git(root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'toy fixture')
    cmds = commands or [('node ' if p.endswith('.mjs') else 'bash ') + p for p in scripts if p.startswith('tests/')]
    plan = {'checkout': str(root), 'output': str(folder / 'evidence'),
            'sourceHead': git(root, 'rev-parse', 'HEAD'), 'sourceTree': git(root, 'rev-parse', 'HEAD^{tree}'),
            'commands': cmds, 'timeoutPerCommandSeconds': 3,
            'reviewReference': 'private hand-checked microfixture entrypoints', 'historicalRoots': [],
            'entrypoints': [{'command': c, 'sha256': hashlib.sha256((root / c.split()[-1]).read_bytes()).hexdigest(),
                             'requirementIds': ['fixture-' + str(i)]} for i, c in enumerate(cmds)]}
    planpath = folder / 'plan.json'
    def save():
        planpath.write_text(json.dumps(plan, indent=2) + '\n')
    save()
    def execute(env=None, optimize=False, runner=None, isolated=True):
        save()
        launcher = [sys.executable] + (['-I'] if isolated else []) + (['-O'] if optimize else []) + [str(runner or RUNNER), str(planpath)]
        actual_environment = {**ENV, **(env or {})}
        frozen_launch = {'actualArgv': launcher, 'controlledBaseEnvironment': ENV,
            'injectedKeys': sorted(env or {}), 'injectedValuesWithheld': True,
            'environmentSha256': hashlib.sha256(json.dumps(actual_environment, sort_keys=True).encode()).hexdigest(),
            'launcherExecutableSha256': hashlib.sha256(Path(sys.executable).read_bytes()).hexdigest(),
            'pythonVersion': sys.version, 'runnerSha256AtLaunch': hashlib.sha256(Path(runner or RUNNER).read_bytes()).hexdigest(),
            'planSha256AtLaunch': hashlib.sha256(planpath.read_bytes()).hexdigest()}
        p = command(launcher, env=actual_environment)
        (folder / 'outer.stdout.log').write_bytes(p.stdout)
        (folder / 'outer.stderr.log').write_bytes(p.stderr)
        (folder / 'outer-receipt.json').write_text(json.dumps({**frozen_launch, 'exitCode': p.returncode,
            'stdoutSha256': hashlib.sha256(p.stdout).hexdigest(), 'stderrSha256': hashlib.sha256(p.stderr).hexdigest()}, indent=2) + '\n')
        resultpath = Path(plan['output']) / 'result.json'
        return p, json.loads(resultpath.read_text()) if resultpath.exists() else None
    return folder, root, plan, planpath, execute

results = []
def test(name, body):
    try:
        body()
        results.append({'name': name, 'status': 'passed'})
        print('PASS ' + name, flush=True)
    except Exception as exc:
        results.append({'name': name, 'status': 'failed', 'diagnostic': str(exc)})
        print('FAIL ' + name + ': ' + str(exc), flush=True)

def require(value, message):
    if not value:
        raise AssertionError(message)

def rejected_without_execution(p, folder):
    try:
        diagnostic = json.loads(p.stderr)
    except (ValueError, UnicodeError):
        return False
    return p.returncode == 2 and diagnostic.get('status') == 'preflight-rejected' and not (folder/'evidence').exists()

def ordinary():
    folder, root, plan, path, run = fixture('ordinary', {'tests/one.sh': 'echo SHELL-CHECK\n', 'tests/two.mjs': 'console.log("NODE-CHECK")\n'})
    p, r = run()
    require(p.returncode == 0 and r['measurementValid'] and len(r['cases']) == 2, 'ordinary two-entrypoint success was rejected')
    require((folder/'evidence/case-01/stdout.log').read_text() == 'SHELL-CHECK\n', 'bash check did not run')
    require((folder/'evidence/case-02/stdout.log').read_text() == 'NODE-CHECK\n', 'node check did not run')

def filtering():
    folder, root, plan, path, run = fixture('filtering', {'tests/check.sh': 'if [ -z "${TEST_FILTER:-}" ]; then echo CHECK-RAN; fi\n'})
    p, r = run({'TEST_FILTER': 'exclude-every-check'})
    require(rejected_without_execution(p, folder), 'contaminated TEST_FILTER launcher was not rejected before execution')

def shell_injection():
    folder, root, plan, path, run = fixture('shell-injection', {'tests/check.sh': 'echo CHECK-RAN\n'})
    injected = folder/'injection.sh'; injected.write_text('echo INJECTION-RAN\n')
    p, r = run({'BASH_ENV': str(injected)})
    require(rejected_without_execution(p, folder), 'contaminated BASH_ENV launcher was not rejected before execution')

def node_injection():
    folder, root, plan, path, run = fixture('node-injection', {'tests/check.mjs': 'console.log("CHECK-RAN")\n'})
    injected = folder/'injection.cjs'; injected.write_text('console.log("INJECTION-RAN")\n')
    p, r = run({'NODE_OPTIONS': '--require=' + str(injected)})
    require(rejected_without_execution(p, folder), 'contaminated NODE_OPTIONS launcher was not rejected before execution')

def git_injection():
    folder, root, plan, path, run = fixture('git-injection', {'tests/check.sh': 'echo CHECK-RAN\n'})
    p, r = run({'GIT_DIR': str(folder/'does-not-exist'), 'GIT_WORK_TREE': str(folder)})
    require(rejected_without_execution(p, folder), 'contaminated GIT_* launcher was not rejected before identity probes')

def source_drift():
    folder, root, plan, path, run = fixture('source-drift', {'tests/one.sh': 'echo changed > tracked\n', 'tests/two.sh': 'git checkout -- tracked\necho SHOULD-NOT-RUN\n', 'tracked': 'original\n'})
    p, r = run()
    require(p.returncode != 0 and r and not r['measurementValid'] and len(r['cases']) == 1, 'transient source drift was hidden by a restoring next case')
    require(r['cases'][0].get('afterSource', {}).get('clean') is False, 'missing actual dirty post-case source receipt')

def plan_drift():
    folder, root, plan, path, run = fixture('plan-drift', {'tests/check.sh': 'printf " " >> ../plan.json\n'})
    before = hashlib.sha256(path.read_bytes()).hexdigest()
    p, r = run()
    require(p.returncode != 0 and r and not r['measurementValid'], 'changed plan accepted')
    require(r['planSha256'] == before, 'receipt uses late reread as executed plan hash')
    require(hashlib.sha256((folder/'evidence/inputs/plan.json').read_bytes()).hexdigest() == before, 'executed plan bytes not archived')

def runner_drift():
    folder, root, plan, path, run = fixture('runner-drift', {'tests/check.sh': 'printf "\\n# mutated\\n" >> ../mutable-runner.py\n'})
    mutable = folder/'mutable-runner.py'; shutil.copyfile(RUNNER, mutable)
    before = hashlib.sha256(mutable.read_bytes()).hexdigest()
    p, r = run(runner=mutable)
    require(p.returncode != 0 and r and not r['measurementValid'], 'runner changes accepted')
    require(r['runnerSha256'] == before, 'receipt uses changed runner bytes as executed hash')
    require(hashlib.sha256((folder/'evidence/inputs/runner.py').read_bytes()).hexdigest() == before, 'compiled runner bytes not archived')

def optimized_validation():
    folder, root, plan, path, run = fixture('optimized-validation', {'tests/check.sh': 'echo SHOULD-NOT-RUN\n'})
    plan['sourceHead'] = '0' * 40
    p, r = run(optimize=True)
    require(p.returncode != 0 and not (folder/'evidence/case-01').exists(), 'python -O bypassed source validation')
    require(bool(p.stderr.strip()) or bool(r), 'preflight has no retained diagnostic')

def complete_plan_validation():
    folder, root, plan, path, run = fixture('complete-validation', {'tests/check.sh': 'echo SHOULD-NOT-RUN\n'})
    plan['commands'].append('bash -c true')
    p, r = run()
    require(p.returncode != 0 and not (folder/'evidence/case-01').exists(), 'earlier case ran before invalid later command was validated')

def digest_validation():
    folder, root, plan, path, run = fixture('digest-validation', {'tests/check.sh': 'echo SHOULD-NOT-RUN\n'})
    plan['entrypoints'][0]['sha256'] = '0' * 64
    p, r = run()
    require(p.returncode != 0 and not (folder/'evidence/case-01').exists(), 'unreviewed entrypoint bytes ran')

def unsafe_output():
    folder, root, plan, path, run = fixture('unsafe-output', {'tests/check.sh': 'echo SHOULD-NOT-RUN\n'})
    plan['output'] = str(root/'generated')
    p, r = run()
    require(p.returncode != 0 and not (root/'generated').exists(), 'output inside source checkout was created')

def timeout_last():
    folder, root, plan, path, run = fixture('timeout-last', {'tests/check.sh': 'exec sleep 2\n'})
    plan['timeoutPerCommandSeconds'] = 0.1
    p, r = run()
    require(p.returncode != 0 and r and not r['measurementValid'], 'last-case timeout incorrectly measurementValid')
    require(r['cases'][0]['timeout'] and (folder/'evidence/case-01/tmp').is_dir(), 'timeout receipts/owned roots missing')

def immutable_receipt():
    folder, root, plan, path, run = fixture('immutable-receipt', {'tests/check.sh': 'echo CHECK-RAN\n'})
    p, r = run()
    require(p.returncode == 0 and r, 'ordinary success failed')
    require(r.get('launcher', {}).get('actualArgv') and r.get('configurationSha256'), 'launcher/configuration receipt missing')
    c = r['cases'][0]
    require(c.get('planSha256') == hashlib.sha256(path.read_bytes()).hexdigest() and c.get('beforeSource', {}).get('clean') and c.get('afterSource', {}).get('clean'), 'per-case identity boundary missing')
    require(c.get('environment', {}).get('PATH') and 'PRIVATE_TEST_SECRET' not in c['environment'], 'effective environment not controlled/recorded')
    require('do-not-retain-this-value' not in (folder/'evidence/result.json').read_text(), 'ambient secret retained')

def secret_rejection():
    folder, root, plan, path, run = fixture('secret-rejection', {'tests/check.sh': 'echo SHOULD-NOT-RUN\n'})
    p, r = run({'PRIVATE_TEST_SECRET': 'do-not-retain-this-value'})
    require(rejected_without_execution(p, folder), 'unknown launcher environment accepted')
    require(b'do-not-retain-this-value' not in p.stdout + p.stderr, 'unknown ambient secret printed')

def existing_output():
    folder, root, plan, path, run = fixture('existing-output', {'tests/check.sh': 'echo SHOULD-NOT-RUN\n'})
    out = folder/'evidence'; out.mkdir(); (out/'sentinel').write_text('preserve')
    p, r = run()
    require(p.returncode != 0 and (out/'sentinel').read_text() == 'preserve' and list(out.iterdir()) == [out/'sentinel'], 'existing output modified')

def partial_timeout():
    folder, root, plan, path, run = fixture('partial-timeout', {'tests/one.sh': 'exec sleep 2\n', 'tests/two.sh': 'echo SHOULD-NOT-RUN\n'})
    plan['timeoutPerCommandSeconds'] = 0.1
    p, r = run()
    require(p.returncode != 0 and r and not r['measurementValid'] and len(r['cases']) == 1 and r['commandGroupsSkipped'] == 1, 'timeout did not stop and invalidate partial envelope')
    require((folder/'evidence/case-01/receipt.json').is_file() and (folder/'evidence/case-01/tmp').is_dir(), 'partial timeout lost raw receipt or owned roots')

def launcher_isolation():
    folder, root, plan, path, run = fixture('launcher-isolation', {'tests/check.sh': 'echo SHOULD-NOT-RUN\n'})
    p, r = run(isolated=False)
    require(rejected_without_execution(p, folder), 'unisolated Python launcher accepted')

def historical_overlap():
    folder, root, plan, path, run = fixture('historical-overlap', {'tests/check.sh': 'echo SHOULD-NOT-RUN\n'})
    plan['historicalRoots'] = [str(folder/'historical')]
    plan['output'] = str(folder/'historical/new')
    (folder/'historical').mkdir()
    p, r = run()
    require(p.returncode != 0 and not (folder/'historical/new').exists(), 'new output nested inside protected historical evidence')

def duplicate_validation():
    folder, root, plan, path, run = fixture('duplicates', {'tests/check.sh': 'echo SHOULD-NOT-RUN\n'})
    plan['commands'] *= 2
    plan['entrypoints'] *= 2
    p, r = run()
    require(rejected_without_execution(p, folder), 'duplicate commands not rejected before output creation')

def symlink_validation():
    folder, root, plan, path, run = fixture('symlink', {'tests/check.sh': 'echo SHOULD-NOT-RUN\n'})
    original = root/'tests/check.sh'; original.unlink(); original.symlink_to('/dev/null')
    git(root,'add','tests/check.sh'); git(root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','tracked symlink')
    plan['sourceHead'] = git(root,'rev-parse','HEAD'); plan['sourceTree'] = git(root,'rev-parse','HEAD^{tree}')
    plan['entrypoints'][0]['sha256'] = hashlib.sha256(b'').hexdigest()
    p, r = run()
    require(rejected_without_execution(p, folder), 'tracked symlink entrypoint executed')

def ordinary_failure():
    folder, root, plan, path, run = fixture('ordinary-failure', {'tests/one.sh': 'echo EXPECTED-FAILURE\nexit 7\n', 'tests/two.sh': 'echo SECOND-CHECK\n'})
    p, r = run()
    require(p.returncode == 1 and r and r['measurementValid'] and r.get('completed') and r['commandGroupsFailed'] == 1 and r['commandGroupsPassed'] == 1, 'complete measured failure misreported')
    require(r['cases'][0]['exitCode'] == 7 and (folder/'evidence/case-02/stdout.log').read_text() == 'SECOND-CHECK\n', 'failure exit/raw output or later ordinary case missing')

for name, body in [('ordinary-success',ordinary), ('ambient-test-filter', filtering), ('shell-injection',shell_injection), ('node-injection',node_injection), ('git-injection',git_injection), ('per-case-source-drift',source_drift), ('plan-input-drift',plan_drift), ('runner-input-drift',runner_drift), ('optimized-preflight',optimized_validation), ('complete-preflight',complete_plan_validation), ('reviewed-digest',digest_validation), ('unsafe-output',unsafe_output), ('last-case-timeout',timeout_last), ('immutable-receipt',immutable_receipt), ('unknown-environment-secret',secret_rejection), ('existing-output',existing_output), ('partial-timeout',partial_timeout), ('launcher-isolation',launcher_isolation), ('historical-overlap',historical_overlap), ('duplicates',duplicate_validation), ('symlink-entrypoint',symlink_validation), ('ordinary-failure',ordinary_failure)]:
    test(name, body)
summary = {'runner': str(RUNNER), 'runnerSha256': hashlib.sha256(RUNNER.read_bytes()).hexdigest(), 'testSha256': hashlib.sha256(TEST_BYTES).hexdigest(), 'fixtureRoot': str(RUN), 'results': results,
           'passed': sum(r['status']=='passed' for r in results), 'failed': sum(r['status']=='failed' for r in results)}
(RUN/'summary.json').write_text(json.dumps(summary, indent=2)+'\n')
print(json.dumps({'fixtureRoot': str(RUN), 'passed': summary['passed'], 'failed': summary['failed']}))
sys.exit(bool(summary['failed']))
