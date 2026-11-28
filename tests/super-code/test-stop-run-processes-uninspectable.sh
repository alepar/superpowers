#!/usr/bin/env bash
# A zombie is ignored. A same-uid process this user may not inspect (permission denied) is ignored
# when its parent chain is outside the task, and unknown when it descends from a match or shares
# this process's terminal session. Any other failed
# inspection stays unknown. Linux /proc discovery only; real processes, a fake readlink denies.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
[ -d /proc/self ] || { echo "SKIP: no /proc"; exit 0; }
python3 - "$ROOT" <<'TEST'
import os, pathlib, subprocess, sys, tempfile, time, unittest
ROOT = pathlib.Path(sys.argv.pop())
HELPER = str(ROOT/'skills/super-code/scripts/stop-run-processes')

class Uninspectable(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = pathlib.Path(self.tmp.name)
        self.root = self.path/'task'
        self.root.mkdir()
        # readlink fails like the kernel does for the PIDs listed in DENY (pid:message pairs).
        bash_env = self.path/'bash-env'
        bash_env.write_text('readlink() { local a p e; for a in "$@"; do case "$a" in /proc/*/cwd|/proc/*/exe) p=${a#/proc/}; p=${p%%/*}\n'
            '  for e in $DENY; do [ "${e%%:*}" = "$p" ] && { e=${e#*:}; echo "readlink: $a: ${e//_/ }" >&2; return 1; }; done ;; esac; done\n'
            '  command readlink "$@"; }\n')
        self.env = dict(os.environ, BASH_ENV=str(bash_env))
        self.procs = []

    def tearDown(self):
        for p in self.procs:
            p.kill(); p.wait()

    def spawn(self, *args, cwd=None):
        p = subprocess.Popen(list(args), cwd=cwd, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.procs.append(p)
        return p

    def check(self, deny):
        env = dict(self.env, DENY=' '.join(f'{pid}:{msg.replace(" ", "_")}' for pid, msg in deny))
        return subprocess.run(['bash', HELPER, '--check', str(self.root)], env=env, capture_output=True, text=True)

    def orphan(self):
        # In its own session, reparented away (to PID 1 or a subreaper) once its shell exits.
        pid = int(subprocess.run(['sh', '-c', 'setsid sleep 300 >/dev/null 2>&1 & echo $!'], capture_output=True, text=True).stdout)
        self.addCleanup(os.kill, pid, 9)
        return pid

    def test_denied_process_outside_the_task_is_ignored(self):
        pid = self.orphan()
        r = self.check([(pid, 'Permission denied')])
        self.assertNotIn(f'process {pid} ', r.stdout)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_denied_child_of_this_session_is_unknown(self):
        # An agent can start a non-dumpable task process directly (cd WT && ssh-agent -D).
        s = self.spawn('sleep', '300')
        r = self.check([(s.pid, 'Permission denied')])
        self.assertIn(f'process {s.pid} cwd inspection failed (in this session)', r.stdout)
        self.assertEqual(r.returncode, 4, r.stdout + r.stderr)

    def test_zombie_outside_the_task_is_ignored(self):
        z = subprocess.Popen(['true'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            if pathlib.Path(f'/proc/{z.pid}/status').read_text().find('State:\tZ') >= 0: break
            time.sleep(0.05)
        try:
            r = self.check([])
            self.assertNotIn(f'process {z.pid} ', r.stdout)
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        finally:
            z.wait()

    def test_denied_process_under_a_match_is_unknown(self):
        parent = self.spawn('setsid', 'bash', '-c', 'sleep 300 & echo $! > child; wait', cwd=self.root)
        child_file = self.root/'child'
        for _ in range(100):
            if child_file.exists() and child_file.read_text().strip(): break
            time.sleep(0.05)
        child = int(child_file.read_text())
        self.addCleanup(os.kill, child, 9)
        r = self.check([(child, 'Permission denied')])
        self.assertIn(f'match: {parent.pid} ', r.stdout)
        self.assertIn(f'process {child} cwd inspection failed (descends from match {parent.pid})', r.stdout)
        self.assertEqual(r.returncode, 4, r.stdout + r.stderr)

    def test_other_inspection_failure_is_unknown(self):
        pid = self.orphan()
        r = self.check([(pid, 'Input/output error')])
        self.assertIn(f'unknown: {self.root} — process {pid} cwd inspection failed', r.stdout)
        self.assertEqual(r.returncode, 4, r.stdout + r.stderr)

unittest.main(verbosity=2)
TEST
