"""Prospective serial evidence runner R1. No historical evidence is overwritten.

Invoke with Python and one reviewed plan.json; retain outer stdout/stderr even for
preflight rejection. Quiet-host observation and scoped resource inspection belong
to the caller. Only direct children are bounded; descendants remain unverified.
"""
from pathlib import Path
import sys
import os
import json

# Compile the captured bytes, rather than claiming a later file read identifies
# Python's previously loaded code. The tiny loader is not a hostile-code sandbox.
if '_captured_runner_bytes' not in globals():
    _loaded_path = Path(__file__).resolve(strict=True)
    _loaded_bytes = _loaded_path.read_bytes()
    exec(compile(_loaded_bytes, str(_loaded_path), 'exec'), {
        '__name__': '__main__', '__file__': str(_loaded_path),
        '_captured_runner_bytes': _loaded_bytes})
    raise SystemExit(0)

import base64
import hashlib
import json
import math
import os
import platform
import re
import shutil
import subprocess
import time

CONTROL_PATH = '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'
BASE_ENV = {'PATH': CONTROL_PATH, 'CI': '1', 'LANG': 'C', 'LC_ALL': 'C', 'TZ': 'UTC',
            'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': '/dev/null',
            'GIT_CONFIG_SYSTEM': '/dev/null', 'GIT_OPTIONAL_LOCKS': '0'}
ROOT_FOLDERS = {'TMPDIR': 'tmp', 'HOME': 'home', 'XDG_CONFIG_HOME': 'xdg-config',
                'XDG_CACHE_HOME': 'xdg-cache', 'XDG_DATA_HOME': 'xdg-data',
                'XDG_STATE_HOME': 'xdg-state', 'CODEX_HOME': 'codex-home'}

def digest(data):
    return hashlib.sha256(data).hexdigest()

def check(condition, diagnostic):
    if not condition:
        raise ValueError(diagnostic)

def json_bytes(value):
    return (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()

def write_json(path, value):
    # Atomic replacement preserves the previous progress receipt if interrupted.
    temporary = path.with_name(path.name + '.writing')
    temporary.write_bytes(json_bytes(value))
    temporary.replace(path)

def overlap(a, b):
    return a == b or a in b.parents or b in a.parents

def absolute_path(value, label, exists=False):
    check(isinstance(value, str) and Path(value).is_absolute(), label + ' must be absolute')
    p = Path(value)
    resolved = p.resolve(strict=exists)
    check(p == resolved, label + ' must be canonical (no symlink or dot components)')
    return resolved

def controlled_environment(folder, create=False):
    result = dict(BASE_ENV)
    for key, name in ROOT_FOLDERS.items():
        target = folder / name
        if create:
            target.mkdir()
        result[key] = str(target)
    return result

def tool_capture(name, path, environment):
    data = path.read_bytes()
    version_argv = [str(path), '--version']
    p = subprocess.run(version_argv, env=environment, capture_output=True, timeout=10)
    check(p.returncode == 0, name + ' version probe failed')
    return {'name': name, 'path': str(path), 'sha256': digest(data), 'bytes': len(data),
            'versionArgv': version_argv, 'versionExitCode': p.returncode,
            'versionStdout': p.stdout.decode(errors='replace'), 'versionStderr': p.stderr.decode(errors='replace')}, data

def source_state(root, git_path, environment):
    probes = {}
    for name, args in [('head', ['rev-parse', 'HEAD']), ('tree', ['rev-parse', 'HEAD^{tree}']),
                       ('status', ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignore-submodules=none'])]:
        argv = [str(git_path), '-C', str(root), '-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', *args]
        p = subprocess.run(argv, env=environment, capture_output=True, timeout=15)
        probes[name] = {'actualArgv': argv, 'exitCode': p.returncode,
                        'stdoutBase64': base64.b64encode(p.stdout).decode(),
                        'stderrBase64': base64.b64encode(p.stderr).decode()}
    head = base64.b64decode(probes['head']['stdoutBase64']).decode(errors='replace').strip()
    tree = base64.b64decode(probes['tree']['stdoutBase64']).decode(errors='replace').strip()
    raw_status = base64.b64decode(probes['status']['stdoutBase64'])
    okay = all(p['exitCode'] == 0 for p in probes.values())
    return {'head': head, 'tree': tree, 'clean': okay and not raw_status, 'probesSucceeded': okay,
            'rawStatusBase64': base64.b64encode(raw_status).decode(), 'environment': environment, 'probes': probes}

def source_matches(state, plan):
    return state['probesSucceeded'] and state['clean'] and state['head'] == plan['sourceHead'] and state['tree'] == plan['sourceTree']

def prepare():
    check(len(sys.argv) == 2, 'usage: python3 runner.py /absolute/reviewed-plan.json')
    check(sys.flags.isolated == 1, 'external launcher must use Python -I')
    expected = {'PATH': CONTROL_PATH, 'CI': '1', 'LANG': 'C', 'LC_ALL': 'C', 'TZ': 'UTC',
                '__CF_USER_TEXT_ENCODING': '0x' + format(os.getuid(), 'X') + ':0x0:0x0'}
    check(set(os.environ) == set(expected) | {'HOME', 'TMPDIR'}, 'launcher environment must contain exactly documented minimal keys')
    check(all(os.environ.get(k) == v for k, v in expected.items()), 'launcher environment fixed values mismatch')
    for key in ('HOME', 'TMPDIR'):
        check(absolute_path(os.environ[key], 'launcher ' + key, True).is_dir(), 'launcher root must be a directory')
    plan_path = absolute_path(sys.argv[1], 'plan', True)
    plan_data = plan_path.read_bytes()
    plan = json.loads(plan_data)
    check(isinstance(plan, dict), 'plan must be an object')
    root = absolute_path(plan.get('checkout'), 'checkout', True)
    out = absolute_path(plan.get('output'), 'output')
    check(not out.exists(), 'Refusing an existing output; preserve earlier attempts.')
    check(out.parent.is_dir(), 'output parent must already exist deliberately')
    runner_path = Path(__file__)
    check(not overlap(out, root), 'output must be outside checkout')
    check(not overlap(out, plan_path) and not overlap(out, runner_path), 'output overlaps an input')
    check(isinstance(plan.get('historicalRoots'), list), 'explicit historicalRoots array required')
    for item in plan['historicalRoots']:
        historical = absolute_path(item, 'historical root')
        check(not overlap(out, historical) and not overlap(root, historical), 'output/checkout overlaps historical evidence')
    check(isinstance(plan.get('reviewReference'), str) and bool(plan['reviewReference'].strip()), 'reviewReference required')
    check((root / '.git').is_dir() and not (root / '.git').is_symlink(), 'standalone .git directory required')
    check(not (root / '.git/objects/info/alternates').exists(), 'shared object alternates are not standalone')
    for field, size in [('sourceHead', 40), ('sourceTree', 40)]:
        check(isinstance(plan.get(field), str) and re.fullmatch('[0-9a-f]{' + str(size) + '}', plan[field]), 'invalid ' + field)
    timeout = plan.get('timeoutPerCommandSeconds')
    check(type(timeout) in (int, float) and math.isfinite(timeout) and timeout > 0, 'positive finite command timeout required')
    commands = plan.get('commands')
    check(isinstance(commands, list) and commands and all(isinstance(c, str) for c in commands), 'nonempty commands array required')
    check(len(set(commands)) == len(commands), 'duplicate commands rejected')
    entries = plan.get('entrypoints')
    check(isinstance(entries, list) and len(entries) == len(commands), 'complete reviewed entrypoints required')
    frozen_entries = []
    for command, entry in zip(commands, entries):
        match = re.fullmatch(r'(bash|node) (tests/[A-Za-z0-9_./-]+)', command)
        check(match is not None, 'only exact bash/node tests/ entrypoints supported; no flags/arguments')
        tool, rel = match.groups()
        check('..' not in Path(rel).parts and str(Path(rel)) == rel, 'entrypoint traversal/noncanonical path')
        check((tool == 'bash' and rel.endswith('.sh')) or (tool == 'node' and rel.endswith(('.js', '.mjs', '.cjs'))), 'entrypoint extension mismatch')
        path = root / rel
        check(path.is_file() and path.resolve(strict=True) == path and not path.is_symlink(), 'entrypoint must be a regular nonsymlink path')
        data = path.read_bytes()
        check(isinstance(entry, dict) and entry.get('command') == command and entry.get('sha256') == digest(data), 'reviewed entrypoint command/hash mismatch')
        ids = entry.get('requirementIds')
        check(isinstance(ids, list) and ids and all(isinstance(x, str) and x.strip() for x in ids), 'entrypoint requirementIds required')
        frozen_entries.append((path, data))
    # No ambient variables, even for Git identity and version probes. The preflight
    # HOME is deliberately nonexistent; global/system Git config is disabled.
    probe_env = controlled_environment(out / 'control')
    tools, tool_data = {}, {}
    for name in ('bash', 'node', 'git', 'python'):
        found = sys.executable if name == 'python' else shutil.which(name, path=CONTROL_PATH)
        check(bool(found), 'required executable unavailable: ' + name)
        path = Path(found).resolve(strict=True)
        check(path.is_file() and os.access(path, os.X_OK), 'nonregular/nonexecutable tool: ' + name)
        tools[name], tool_data[name] = tool_capture(name, path, probe_env)
    for args, expected in [(['rev-parse', '--show-toplevel'], str(root)),
                           (['rev-parse', '--absolute-git-dir'], str(root / '.git')),
                           (['rev-parse', '--git-common-dir'], '.git'),
                           (['rev-parse', '--is-bare-repository'], 'false')]:
        p = subprocess.run([tools['git']['path'], '-C', str(root), *args], env=probe_env, capture_output=True, timeout=15)
        check(p.returncode == 0 and p.stdout.decode().strip() == expected, 'checkout is not a standalone repository: ' + ' '.join(args))
    for path, _ in frozen_entries:
        p = subprocess.run([tools['git']['path'], '-C', str(root), 'ls-files', '--error-unmatch', '--', str(path.relative_to(root))], env=probe_env, capture_output=True, timeout=15)
        check(p.returncode == 0, 'entrypoint is not tracked')
    initial = source_state(root, tools['git']['path'], probe_env)
    check(source_matches(initial, plan), 'initial source HEAD/tree/clean mismatch')
    return plan_path, plan_data, plan, root, out, tools, tool_data, frozen_entries, initial, probe_env

def run(prepared):
    plan_path, plan_data, plan, root, out, tools, tool_data, frozen_entries, initial, probe_env = prepared
    # Exclusive mkdir is the final existing-output check. No output is created
    # until every command and source validation above has succeeded.
    out.mkdir()
    cases, invalidations = [], []
    result = {'measurementValid': False, 'completed': False, 'status': 'running',
              'sourceHead': plan['sourceHead'], 'sourceTree': plan['sourceTree'],
              'planPath': str(plan_path), 'planSha256': digest(plan_data),
              'runnerSha256': digest(_captured_runner_bytes), 'clonePath': str(root),
              'commandCount': len(plan['commands']), 'cases': cases, 'invalidations': invalidations,
              'initialSource': initial, 'platform': platform.platform(), 'tools': tools,
              'resourceRetention': 'All clone, logs and owned roots retained; scoped inspection required.',
              'limitations': ['Direct child timeout only; descendants unverified. No global cleanup or signals.',
                             'Caller must retain quiet-host observation and outer command receipt.',
                             'Git raw clean status excludes ignored artifacts; inspect owned resources separately.',
                             'No hosted Workflow/provider reliability/global process-absence claim.']}
    launcher = {'actualArgv': list(sys.orig_argv),
                'python': tools['python'], 'runtimeVersion': sys.version, 'runtimeFlags': repr(sys.flags),
                'entryArgv': list(sys.argv), 'environment': dict(os.environ),
                'initialStartupLimitation': 'Invoke initially with -I; pre-bootstrap code is outside this runner boundary.'}
    configuration = {'schema': 'prospective-suite-r1', 'planSha256': digest(plan_data),
                     'runnerSha256': digest(_captured_runner_bytes), 'tools': tools,
                     'baseEnvironment': BASE_ENV, 'rootFolders': ROOT_FOLDERS,
                     'preflightEnvironment': probe_env, 'timeoutPerCommandSeconds': plan['timeoutPerCommandSeconds'],
                     'reviewReference': plan['reviewReference'], 'historicalRoots': plan['historicalRoots'], 'launcher': launcher,
                     'sourceChecks': 'before/after each case; raw porcelain-v1 -z all untracked; stop on drift'}
    result['configurationSha256'] = digest(json_bytes(configuration))
    result['launcher'] = launcher
    identity = {k: result[k] for k in ('planSha256', 'runnerSha256', 'configurationSha256')}
    frozen = [(plan_path, plan_data), (Path(__file__), _captured_runner_bytes), *frozen_entries,
              *[(Path(tools[name]['path']), data) for name, data in tool_data.items()]]
    def verify_inputs():
        changed = []
        for path, original in frozen:
            try:
                if path.read_bytes() != original:
                    changed.append(str(path))
            except OSError:
                changed.append(str(path))
        return changed
    try:
        write_json(out / 'result.json', result)
        inputs = out / 'inputs'; inputs.mkdir()
        (inputs / 'plan.json').write_bytes(plan_data)
        (inputs / 'runner.py').write_bytes(_captured_runner_bytes)
        write_json(inputs / 'configuration.json', configuration)
        write_json(inputs / 'launcher.json', result['launcher'])
        for name, data in tool_data.items():
            (inputs / (name + '.executable')).write_bytes(data)
        for i, (_, data) in enumerate(frozen_entries, 1):
            (inputs / ('entrypoint-' + str(i).zfill(2))).write_bytes(data)
        control = out / 'control'; control.mkdir()
        git_env = controlled_environment(control, create=True)
        for index, command in enumerate(plan['commands'], 1):
            case_dir = out / ('case-' + str(index).zfill(2)); case_dir.mkdir()
            env = controlled_environment(case_dir, create=True)
            tool, rel = command.split(' ')
            argv = [tools[tool]['path'], rel]
            receipt = {'id': str(index).zfill(2), **identity, 'planCommand': command, 'actualArgv': argv,
                       'cwd': str(root), 'environment': env, 'status': 'running', 'exitCode': None,
                       'timeout': False, 'cause': None, 'sourceHead': plan['sourceHead'], 'sourceTree': plan['sourceTree'],
                       'executable': tools[tool], 'entrypointSha256': plan['entrypoints'][index-1]['sha256'],
                       'requirementIds': plan['entrypoints'][index-1]['requirementIds']}
            cases.append(receipt)
            started = time.time(); receipt['startUtc'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(started))
            try:
                receipt['beforeSource'] = source_state(root, tools['git']['path'], git_env)
                changes = verify_inputs()
                check(not changes, 'frozen input drift before case: ' + ', '.join(changes))
                check(source_matches(receipt['beforeSource'], plan), 'source drift before case')
                write_json(case_dir / 'receipt.json', receipt)
                write_json(out / 'progress.json', {**identity, 'cases': cases})
                with (case_dir / 'stdout.log').open('xb') as stdout, (case_dir / 'stderr.log').open('xb') as stderr:
                    try:
                        p = subprocess.run(argv, cwd=root, env=env, stdout=stdout, stderr=stderr,
                                           timeout=plan['timeoutPerCommandSeconds'])
                        receipt['exitCode'] = p.returncode
                        receipt['status'] = 'passed' if p.returncode == 0 else 'failed'
                    except subprocess.TimeoutExpired:
                        receipt.update(status='error', timeout=True, cause='Direct child timed out; subprocess killed only that child. Descendants unverified; resources retained.')
                receipt['afterSource'] = source_state(root, tools['git']['path'], git_env)
                changes = verify_inputs()
                if changes or not source_matches(receipt['afterSource'], plan):
                    invalidations.append({'case': receipt['id'], 'kind': 'post-case drift', 'changedInputs': changes,
                                          'sourceMatches': source_matches(receipt['afterSource'], plan)})
            except BaseException as exc:
                receipt.update(status='error', cause=type(exc).__name__ + ': ' + str(exc))
                invalidations.append({'case': receipt['id'], 'kind': 'case exception', 'cause': receipt['cause']})
                try:
                    receipt['afterSource'] = source_state(root, tools['git']['path'], git_env)
                except BaseException as after_error:
                    receipt['afterSourceError'] = type(after_error).__name__ + ': ' + str(after_error)
            finally:
                ended = time.time(); receipt['endUtc'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(ended))
                receipt['durationSeconds'] = round(ended - started, 3)
                for stream in ('stdout', 'stderr'):
                    path = case_dir / (stream + '.log')
                    if path.exists():
                        data = path.read_bytes()
                        receipt.update({stream + 'Path': str(path), stream + 'Bytes': len(data), stream + 'Sha256': digest(data)})
                write_json(case_dir / 'receipt.json', receipt)
                write_json(out / 'progress.json', {**identity, 'cases': cases})
            print(receipt['id'] + '/' + str(len(plan['commands'])) + ' ' + receipt['status'] + ': ' + command, flush=True)
            if invalidations or receipt['status'] == 'error':
                break
        result['finalSource'] = source_state(root, tools['git']['path'], git_env)
        result['changedInputsAtEnd'] = verify_inputs()
        result['completed'] = len(cases) == len(plan['commands']) and all(c['status'] in ('passed', 'failed') for c in cases)
        result['measurementValid'] = bool(result['completed'] and not invalidations and not result['changedInputsAtEnd'] and source_matches(result['finalSource'], plan))
    except BaseException as exc:
        invalidations.append({'kind': 'attempt exception', 'cause': type(exc).__name__ + ': ' + str(exc)})
        result['measurementValid'] = False
    finally:
        result.update(commandGroupsPassed=sum(c['status'] == 'passed' for c in cases),
                      commandGroupsFailed=sum(c['status'] == 'failed' for c in cases),
                      commandGroupsErrors=sum(c['status'] not in ('passed', 'failed') for c in cases),
                      commandGroupsSkipped=len(plan['commands']) - len(cases))
        success = result['measurementValid'] and result['commandGroupsFailed'] == 0 and result['commandGroupsErrors'] == 0
        result['status'] = 'passed' if success else ('invalid' if not result['measurementValid'] else 'failed')
        write_json(out / 'result.json', result)
    print(json.dumps({k: result[k] for k in ('status', 'measurementValid', 'completed', 'commandGroupsPassed', 'commandGroupsFailed', 'commandGroupsErrors', 'commandGroupsSkipped')}), flush=True)
    return 0 if success else 1

try:
    prepared = prepare()
except BaseException as exc:
    # Caller retains this raw diagnostic in its outer attempt receipt. Never
    # create an unvalidated output root just to write a preflight error.
    print(json.dumps({'status': 'preflight-rejected', 'measurementValid': False,
                      'cause': type(exc).__name__ + ': ' + str(exc)}), file=sys.stderr, flush=True)
    raise SystemExit(2)
raise SystemExit(run(prepared))
