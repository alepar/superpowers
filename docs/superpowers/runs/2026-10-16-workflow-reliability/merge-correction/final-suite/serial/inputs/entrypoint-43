#!/usr/bin/env bash
# Git inventory failure must precede process matching/signalling. The process view is
# deterministic; Git owns real disposable repositories and nested-worktree inventory.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
python3 - "$ROOT" <<'TEST'
import os, pathlib, shutil, subprocess, sys, tempfile, unittest
ROOT = pathlib.Path(sys.argv.pop())
GIT = shutil.which('git')

class Inventory(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = pathlib.Path(self.tmp.name)
        self.repo = self.path / 'repo'
        self.repo.mkdir()
        self.bin = self.path / 'bin'
        self.bin.mkdir()
        self.signal = self.path / 'signals'
        self.env = dict(os.environ, PATH=str(self.bin)+os.pathsep+os.environ['PATH'],
                        REAL_GIT=GIT, PROBE_ROOT=str(self.repo), SIGNAL_LOG=str(self.signal))
        self.write('git', '#!/bin/bash\nif [[ "$*" == *"worktree list"* && "${DENY_INVENTORY:-}" == 1 ]]; then echo denied >&2; exit 128; fi\nexec "$REAL_GIT" "$@"\n')
        self.write('ps', '#!/bin/bash\ncase "$*" in\n "-A -o pid=,ppid="|"-A -o pid=,ppid=,tty=") echo "$PPID 1 ??";;\n "-o ppid= -p "*) echo 1;;\n "-Eww -U "*) :;;\n *) exit 9;;\nesac\n')
        self.write('lsof', '#!/bin/bash\ncase "$*" in *"-u "*) :;; *) echo n/fixture-outside;; esac\n')
        bash_env = self.path / 'bash-env'
        bash_env.write_text('function [ { if [[ "$*" == "-d /proc/self" ]]; then return 1; fi; builtin [ "$@"; }\nkill() { echo "$*" >> "$SIGNAL_LOG"; return 99; }\n')
        self.env['BASH_ENV'] = str(bash_env)

    def write(self, name, value):
        f=self.bin/name; f.write_text(value); f.chmod(0o755)

    def git(self, *args):
        return subprocess.run([GIT, '-C', str(self.repo), *args], check=True, capture_output=True)

    def init(self):
        self.git('init', '-q')
        self.git('config', 'gc.auto', '0')
        self.git('config', 'maintenance.auto', 'false')
        self.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
                 'commit', '--allow-empty', '-qm', 'fixture')

    def run_helper(self, expected, deny=False, check=False):
        env=dict(self.env, DENY_INVENTORY='1' if deny else '0')
        p=subprocess.run(['bash', str(ROOT/'skills/super-code/scripts/stop-run-processes'),
                          *(['--check'] if check else []), str(self.repo)], env=env, capture_output=True, text=True)
        self.assertEqual(p.returncode, expected, p.stdout+p.stderr)
        self.assertFalse(self.signal.exists(), 'invalid/empty inventory must not signal processes')
        if expected == 4: self.assertIn('unknown:', p.stdout)
        return p

    def test_denied_repository_inventory(self):
        self.init()
        self.run_helper(4, deny=True)
        self.run_helper(4, deny=True, check=True)

    def test_verified_nonrepository_temp(self):
        self.run_helper(0)

    def test_valid_leaf_repository(self):
        self.init()
        self.run_helper(0)

    def test_nested_worktree_refused(self):
        self.init()
        self.git('worktree', 'add', '-qb', 'child', str(self.repo/'.worktrees/child'))
        self.run_helper(2)

    def test_corrupt_git_metadata_is_unknown(self):
        self.init()
        (self.repo/'.git/HEAD').unlink()
        self.run_helper(4)

    def test_nonrepository_at_filesystem_boundary(self):
        # Git uses this diagnostic for an ordinary temp root on a separate mount.
        self.write('git', '#!/bin/bash\nif [[ "$*" == *"rev-parse --git-dir" ]]; then printf "%s\\n" "fatal: not a git repository (or any parent up to mount point /tmp)" "Stopping at filesystem boundary (GIT_DISCOVERY_ACROSS_FILESYSTEM not set)." >&2; fi\nexit 128\n')
        self.run_helper(0)

    def test_corrupt_bare_repository_is_unknown(self):
        self.git('init', '--bare', '-q')
        (self.repo/'HEAD').unlink()
        self.run_helper(4)

    def test_git_unavailable_is_unknown(self):
        self.write('git', '#!/bin/bash\nexit 127\n')
        self.run_helper(4)

unittest.main(verbosity=2)
TEST
