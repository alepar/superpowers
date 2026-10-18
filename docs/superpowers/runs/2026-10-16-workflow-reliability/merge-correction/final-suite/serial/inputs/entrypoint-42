#!/usr/bin/env bash
# Exercise the generated setup cleanup command and its real removal helper. Process
# inspection is isolated to a deterministic stop outcome; Git mutates only this fixture.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
python3 - "$ROOT" <<'TEST'
import json, os, pathlib, re, shutil, subprocess, sys, tempfile, unittest
ROOT=pathlib.Path(sys.argv.pop())
GIT=shutil.which('git')

class Cleanup(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.d=pathlib.Path(self.tmp.name)
        self.repo=self.d/'repo'; self.repo.mkdir()
        self.git('init','-q')
        self.git('config','gc.auto','0')
        self.git('config','maintenance.auto','false')
        self.git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--allow-empty','-qm','fixture')
        self.git('branch','-M','integration')
        self.wt=self.repo/'.worktrees/integration--task-ep.1'
        self.git('worktree','add','-qb','task-ep.1',str(self.wt))
        self.scripts=self.d/'scripts'; self.scripts.mkdir()
        shutil.copy(ROOT/'skills/super-code/scripts/remove-task-worktree',self.scripts)
        (self.scripts/'stop-run-processes').write_text('echo "stop outcome: ${STOP_CODE:-0}"; exit "${STOP_CODE:-0}"\n')
        self.bin=self.d/'bin'; self.bin.mkdir()
        mock=self.bin/'git'
        mock.write_text('''#!/bin/bash
case "$*" in
 'worktree remove --force '*) if [[ "${DENY_GIT:-}" = remove || "${DENY_GIT:-}" = force ]]; then echo 'fixture worktree remove denied' >&2; exit 1; fi;;
 'branch -D '*) if [[ "${DENY_GIT:-}" = branch || "${DENY_GIT:-}" = force ]]; then echo 'fixture branch delete denied' >&2; exit 1; fi;;
 'show-ref '*|'branch --list '*) if [ "${DENY_GIT:-}" = discovery ]; then echo 'fixture branch inspection denied' >&2; exit 128; fi;;
esac
exec "$REAL_GIT" "$@"
''')
        mock.chmod(0o755)
        self.env=dict(os.environ,PATH=str(self.bin)+os.pathsep+os.environ['PATH'],REAL_GIT=GIT)
        # Generated task temp paths are stable /tmp/sp-<hash>/<id>; the helpers also
        # accept an absent temp root. Tests never create/remove another run's temp.
        self.ledger=self.d/'progress.md'
        self.ledger.write_text(f'Launch: mechanism ordinary-subagents · epic ep · invocationId fixture · branch integration · integrationWorktree {self.repo} · concurrency 1 · earlyUnblock on · sweep deferred\n')

    def git(self,*args):
        return subprocess.run([GIT,'-C',str(self.repo),*args],check=True,capture_output=True,text=True)

    def branch_exists(self):
        return bool(self.git('branch','--list','task-ep.1').stdout.strip())

    def helper(self,expected,deny='',stop=0,command=None):
        p=subprocess.run(command or ['bash',str(self.scripts/'remove-task-worktree'),'--discard',str(self.wt),'task-ep.1'],
                         cwd=self.repo,env=dict(self.env,DENY_GIT=deny,STOP_CODE=str(stop)),capture_output=True,text=True)
        self.assertEqual(p.returncode,expected,p.stdout+p.stderr)
        return p

    def test_worktree_remove_failure_retains_branch(self):
        p=self.helper(3,deny='remove')
        self.assertTrue(self.wt.exists()); self.assertTrue(self.branch_exists())
        self.assertIn('kept:',p.stdout)

    def test_branch_delete_failure_is_not_success(self):
        p=self.helper(3,deny='branch')
        self.assertFalse(self.wt.exists()); self.assertTrue(self.branch_exists())
        self.assertIn('kept:',p.stdout)

    def test_absent_worktree_branch_delete_failure(self):
        self.git('worktree','remove',str(self.wt))
        self.helper(3,deny='branch')
        self.assertTrue(self.branch_exists())

    def test_absent_branch_discovery_failure_is_unknown(self):
        self.git('worktree','remove',str(self.wt))
        p=self.helper(4,deny='discovery')
        self.assertTrue(self.branch_exists()); self.assertIn('kept:',p.stdout)

    def test_already_absent_resources_succeed(self):
        self.git('worktree','remove',str(self.wt)); self.git('branch','-D','task-ep.1')
        self.helper(0)

    def test_normal_discard(self):
        self.helper(0)
        self.assertFalse(self.wt.exists()); self.assertFalse(self.branch_exists())

    def default_command(self):
        return ['bash',str(self.scripts/'remove-task-worktree'),str(self.wt),'task-ep.1','integration']

    def test_default_cleanup_uses_no_force_commands(self):
        self.helper(0,deny='force',command=self.default_command())
        self.assertFalse(self.wt.exists()); self.assertFalse(self.branch_exists())

    def test_default_cleanup_retains_dirty_worktree(self):
        (self.wt/'retained').write_text('uncommitted work')
        self.helper(3,command=self.default_command())
        self.assertEqual((self.wt/'retained').read_text(),'uncommitted work')
        self.assertTrue(self.branch_exists())

    def test_default_cleanup_retains_unmerged_branch(self):
        subprocess.run([GIT,'-C',str(self.wt),'-c','user.name=Fixture','-c','user.email=fixture@example.invalid',
                        'commit','--allow-empty','-qm','unmerged work'],check=True,capture_output=True)
        self.helper(3,command=self.default_command())
        self.assertTrue(self.wt.exists()); self.assertTrue(self.branch_exists())

    def test_stop_unknown_or_survivor_retains_resources(self):
        for status in (3,4):
            with self.subTest(status=status):
                self.helper(status,stop=status)
                self.assertTrue(self.wt.exists()); self.assertTrue(self.branch_exists())

    def test_generated_setup_uses_guarded_cleanup(self):
        for mode in (['--recut'],['--parents','ep.0']):
            with self.subTest(mode=mode):
                p=subprocess.run(['bash',str(ROOT/'skills/super-code/scripts/dispatch-text'),'--ledger',str(self.ledger),
                                  '--stdout','implement','--id','ep.1','--n','1',*mode],capture_output=True,text=True,check=True)
                setup=re.search(r'<workspace-setup>(.*?)</workspace-setup>',p.stdout,re.S).group(1)
                commands=re.findall(r'`(bash [^`]*remove-task-worktree --discard[^`]*)`',setup)
                self.assertEqual(len(commands),1,setup)
                self.assertNotIn('git worktree remove --force',setup)
                self.assertNotIn('git branch -D',setup)
                self.assertIn('nonzero',setup)
                self.assertIn('SETUP_FAILED',setup)
                # Execute the actual emitted command with only the helper location and
                # absent task temp root changed to this fixture's private namespace.
                import shlex
                command=shlex.split(commands[0]); command[1]=str(self.scripts/'remove-task-worktree')
                ti=command.index('--tmp'); command[ti+1]='/tmp/sp-'+self.d.name.encode().hex()+'/absent-fixture'
                self.assertEqual(command[-2:],[str(self.wt),'task-ep.1'])
                for status in (3,4):
                    self.helper(status,stop=status,command=command)
                    self.assertTrue(self.wt.exists()); self.assertTrue(self.branch_exists())

unittest.main(verbosity=2)
TEST
