#!/usr/bin/env bash
# Execute the emitted drift-check script of a reused task workspace against real git
# fixtures: no drift, parent advanced, dirty worktree, rebase conflict, and the
# branch-only landed state. Git mutates only the temp fixture repo.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
python3 - "$ROOT" <<'TEST'
import os, pathlib, re, shutil, subprocess, sys, tempfile, unittest
ROOT=pathlib.Path(sys.argv.pop())
GIT=shutil.which('git')
ID=['-c','user.name=Fixture','-c','user.email=fixture@example.invalid']

class Reuse(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.d=pathlib.Path(self.tmp.name)
        self.repo=self.d/'repo'; self.repo.mkdir()
        self.git('init','-q'); self.git('config','gc.auto','0')
        (self.repo/'f.txt').write_text('base\n'); (self.repo/'g.txt').write_text('g\n')
        self.git('add','.'); self.commit(self.repo,'base')
        self.git('branch','-M','integration')
        self.git('branch','task-ep.1')
        self.commit_on_branch('task-ep.1','f.txt','p1\n','P1')
        self.wt=self.repo/'.worktrees/integration--task-ep.2'
        self.git('worktree','add','-q',str(self.wt),'-b','task-ep.2','integration')
        self.git('merge','--no-ff','-q','-m','stack: ep.1','task-ep.1',cwd=self.wt)
        (self.wt/'g.txt').write_text('t1\n'); self.git('add','g.txt',cwd=self.wt); self.commit(self.wt,'T1')
        self.old=self.rev('task-ep.2')
        self.ledger=self.d/'progress.md'
        self.ledger.write_text(f'Launch: mechanism ordinary-subagents · epic ep · invocationId fixture · branch integration · integrationWorktree {self.repo} · concurrency 1 · earlyUnblock on · sweep deferred\n')

    def git(self,*a,cwd=None,check=True):
        return subprocess.run([GIT,'-C',str(cwd or self.repo),*a],check=check,capture_output=True,text=True)
    def commit(self,cwd,msg):
        self.git(*ID,'commit','-qm',msg,cwd=cwd)
    def rev(self,ref): return self.git('rev-parse',ref).stdout.strip()
    def commit_on_branch(self,br,path,content,msg):
        # advance a branch that no worktree holds, via a throwaway worktree
        w=self.d/('adv-'+msg); self.git('worktree','add','-q',str(w),br)
        (w/path).write_text(content); self.git('add',path,cwd=w); self.commit(w,msg)
        self.git('worktree','remove',str(w))

    def text(self,*mode):
        p=subprocess.run(['bash',str(ROOT/'skills/super-code/scripts/dispatch-text'),'--ledger',str(self.ledger),
                          '--stdout','implement','--id','ep.2','--n','2',*mode],capture_output=True,text=True,check=True)
        return re.search(r'<workspace-setup>(.*?)</workspace-setup>',p.stdout,re.S).group(1)
    def drift(self,*mode,env=None):
        script=re.search(r'<drift-check>\n(.*?)\n</drift-check>',self.text(*mode),re.S).group(1)
        e=dict(os.environ); e.update(env or {})
        p=subprocess.run(['bash','-c',script],cwd=self.wt,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,env=e)
        return p.returncode,p.stdout.strip().splitlines()
    def shim(self,**flags):
        # a git first on PATH that execs the real git unless a flag fails one invocation:
        # FAIL_DETACH fails any checkout --detach; FAIL_RESTORE fails the checkout of the task branch
        sd=self.d/'shim'; sd.mkdir(exist_ok=True)
        g=sd/'git'
        g.write_text('#!/bin/bash\n'
          'if [ "$1" = checkout ]; then\n'
          '  case " $* " in\n'
          '    *" --detach "*) [ -n "$SHIM_FAIL_DETACH" ] && exit 1;;\n'
          '    *" task-ep.2 "*) [ -n "$SHIM_FAIL_RESTORE" ] && exit 1;;\n'
          '  esac\n'
          'fi\n'
          f'exec {GIT} "$@"\n')
        g.chmod(0o755)
        env={'PATH':f'{sd}:{os.environ["PATH"]}'}
        env.update({'SHIM_'+k.upper():'1' for k,v in flags.items() if v})
        return env
    def stack_conflict_fixture(self):
        # integration and the parent both change f.txt past the shared base, so merging the parent
        # into the detached integration tip conflicts
        (self.repo/'f.txt').write_text('i\n'); self.git('add','f.txt'); self.commit(self.repo,'I1')
        self.commit_on_branch('task-ep.1','f.txt','p2\n','P2')
    def git_dir(self):
        gd=pathlib.Path(self.git('rev-parse','--git-dir',cwd=self.wt).stdout.strip())
        return gd if gd.is_absolute() else self.wt/gd

    def test_no_drift_reuses(self):
        rc,out=self.drift('--parents','ep.1')
        self.assertEqual(rc,0); self.assertTrue(out[-1].startswith('REUSE:'),out)
        self.assertEqual(self.rev('task-ep.2'),self.old)

    def test_parent_advanced_rebuilds_on_new_base(self):
        self.commit_on_branch('task-ep.1','f.txt','p2\n','P2')
        p2=self.rev('task-ep.1')
        rc,out=self.drift('--parents','ep.1')
        self.assertEqual(rc,0,out); self.assertTrue(out[-1].startswith('REBUILT: base='),out)
        new=self.rev('task-ep.2')
        self.assertEqual(self.git('show','-s','--format=%s','task-ep.2').stdout.strip(),'T1')
        self.assertEqual(self.git('show',new+':g.txt').stdout,'t1\n')
        self.assertEqual(self.git('show',new+':f.txt').stdout,'p2\n')
        base=self.git('rev-parse',new+'^').stdout.strip()
        self.assertIn(f'base={base}',out[-1])
        self.assertEqual(self.git('show','-s','--format=%s',base).stdout.strip(),'stack: ep.1')
        self.assertEqual(self.git('rev-parse',base+'^2').stdout.strip(),p2)
        self.git('cat-file','-e',self.old); self.assertIn(self.old,out[-1])
        self.git('merge-base','--is-ancestor','task-ep.1','task-ep.2')
        self.assertEqual(self.git('status','--porcelain',cwd=self.wt).stdout,'')

    def test_dropped_parent_rebuilds_on_integration(self):
        rc,out=self.drift()   # no current parents: stack: ep.1 is stale
        self.assertEqual(rc,0,out); self.assertTrue(out[-1].startswith('REBUILT:'),out)
        base=self.git('rev-parse','task-ep.2^').stdout.strip()
        self.assertEqual(base,self.rev('integration'))

    def test_dirty_worktree_is_preserved(self):
        self.commit_on_branch('task-ep.1','f.txt','p2\n','P2')
        (self.wt/'g.txt').write_text('uncommitted\n')
        (self.wt/'.tmp').mkdir(); (self.wt/'.tmp/x').write_text('ignored')
        rc,out=self.drift('--parents','ep.1')
        self.assertEqual(rc,1)
        self.assertEqual(out[-1],'SETUP_FAILED: prerequisite drift; uncommitted work preserved; nothing reset')
        self.assertEqual((self.wt/'g.txt').read_text(),'uncommitted\n')
        self.assertEqual(self.rev('task-ep.2'),self.old)

    def test_tmp_only_is_not_dirty(self):
        self.commit_on_branch('task-ep.1','f.txt','p2\n','P2')
        (self.wt/'.tmp').mkdir(); (self.wt/'.tmp/x').write_text('ignored')
        rc,out=self.drift('--parents','ep.1')
        self.assertEqual(rc,0,out); self.assertTrue(out[-1].startswith('REBUILT:'),out)

    def test_conflict_restores_old_head(self):
        # T1 edits f.txt too, so the parent's new commit conflicts with it
        (self.wt/'f.txt').write_text('t2\n'); self.git('add','f.txt',cwd=self.wt); self.commit(self.wt,'T2')
        self.old=self.rev('task-ep.2')
        self.commit_on_branch('task-ep.1','f.txt','p2\n','P2')
        rc,out=self.drift('--parents','ep.1')
        self.assertEqual(rc,1,out); self.assertTrue(out[-1].startswith('SETUP_FAILED:'),out)
        self.assertIn(self.old,out[-1]); self.assertIn('f.txt',out[-1])
        self.assertEqual(self.rev('task-ep.2'),self.old)
        self.assertEqual(self.git('branch','--show-current',cwd=self.wt).stdout.strip(),'task-ep.2')
        gd=pathlib.Path(self.git('rev-parse','--git-dir',cwd=self.wt).stdout.strip())
        gd=gd if gd.is_absolute() else self.wt/gd
        self.assertFalse((gd/'rebase-merge').exists() or (gd/'rebase-apply').exists())
        self.assertEqual(self.git('status','--porcelain',cwd=self.wt).stdout,'')

    def test_detach_failure_fails_typed(self):
        self.commit_on_branch('task-ep.1','f.txt','p2\n','P2')
        rc,out=self.drift('--parents','ep.1',env=self.shim(fail_detach=True))
        self.assertEqual(rc,1,out); self.assertTrue(out[-1].startswith('SETUP_FAILED:'),out)
        self.assertIn('checkout',out[-1])
        self.assertEqual(self.rev('task-ep.2'),self.old)
        self.assertEqual(self.git('log','--first-parent','--grep=^stack: ','--format=%s','integration..task-ep.2').stdout.split('\n')[:-1],['stack: ep.1'])
        self.assertEqual(self.git('branch','--show-current',cwd=self.wt).stdout.strip(),'task-ep.2')

    def landed_parent_reuses_dirty(self,delete):
        # ep.1 landed on integration (default merge subject); ep.2 keeps its stale `stack: ep.1`
        self.git(*ID,'merge','--no-ff','--no-edit','-q','task-ep.1')
        if delete: self.git('branch','-d','task-ep.1')
        (self.wt/'g.txt').write_text('uncommitted\n')
        rc,out=self.drift()   # ep.1 left the current parents when it landed
        self.assertEqual(rc,0,out); self.assertTrue(out[-1].startswith('REUSE:'),out)
        self.assertEqual((self.wt/'g.txt').read_text(),'uncommitted\n')
        self.assertEqual(self.rev('task-ep.2'),self.old)

    def test_landed_parent_kept_branch_reuses_dirty(self):
        self.landed_parent_reuses_dirty(False)

    def test_landed_parent_deleted_branch_reuses_dirty(self):
        self.landed_parent_reuses_dirty(True)

    def test_removed_dependency_dirty_still_drifts(self):
        (self.wt/'g.txt').write_text('uncommitted\n')
        rc,out=self.drift()   # ep.1 neither a current parent nor landed
        self.assertEqual(rc,1,out)
        self.assertEqual(out[-1],'SETUP_FAILED: prerequisite drift; uncommitted work preserved; nothing reset')
        self.assertEqual((self.wt/'g.txt').read_text(),'uncommitted\n')
        self.assertEqual(self.rev('task-ep.2'),self.old)

    def test_missing_parent_counts_as_landed(self):
        # the merge lane landed ep.1 and deleted its branch
        self.git(*ID,'merge','--no-ff','-q','-m','land','task-ep.1'); self.git('branch','-d','task-ep.1')
        rc,out=self.drift('--parents','ep.1')
        self.assertEqual(rc,0,out); self.assertTrue(out[-1].startswith(('REUSE:','REBUILT:')),out)
        self.assertEqual(self.git('show','-s','--format=%s','task-ep.2').stdout.strip(),'T1')
        # a still-unlanded second parent is rebuilt in, the landed one is skipped
        self.git('branch','task-ep.3','integration'); self.commit_on_branch('task-ep.3','h.txt','h\n','H')
        rc,out=self.drift('--parents','ep.1,ep.3')
        self.assertEqual(rc,0,out); self.assertTrue(out[-1].startswith('REBUILT:'),out)
        self.assertEqual(self.git('log','--first-parent','--format=%s','integration..task-ep.2').stdout.split('\n')[:-1],['T1','stack: ep.3'])

    def test_stack_merge_conflict_restores_old_head(self):
        self.stack_conflict_fixture()
        rc,out=self.drift('--parents','ep.1')
        self.assertEqual(rc,1,out); self.assertTrue(out[-1].startswith('SETUP_FAILED:'),out)
        self.assertIn('ep.1',out[-1]); self.assertIn('f.txt',out[-1])
        self.assertEqual(self.rev('task-ep.2'),self.old)
        self.assertEqual(self.git('branch','--show-current',cwd=self.wt).stdout.strip(),'task-ep.2')
        self.assertFalse((self.git_dir()/'MERGE_HEAD').exists())
        self.assertEqual(self.git('status','--porcelain',cwd=self.wt).stdout,'')

    def test_two_parents_rebuild_in_order(self):
        self.git('branch','task-ep.3','integration'); self.commit_on_branch('task-ep.3','h.txt','h\n','H')
        rc,out=self.drift('--parents','ep.1,ep.3')
        self.assertEqual(rc,0,out); self.assertTrue(out[-1].startswith('REBUILT:'),out)
        self.assertEqual(self.git('log','--first-parent','--format=%s','integration..task-ep.2').stdout.split('\n')[:-1],['T1','stack: ep.3','stack: ep.1'])
        self.assertEqual(self.git('show','task-ep.2:h.txt').stdout,'h\n')
        self.assertEqual(self.git('show','task-ep.2:g.txt').stdout,'t1\n')

    def test_second_parent_conflict_names_it_and_restores(self):
        self.git('branch','task-ep.3','integration'); self.commit_on_branch('task-ep.3','f.txt','other\n','H')
        rc,out=self.drift('--parents','ep.1,ep.3')
        self.assertEqual(rc,1,out); self.assertTrue(out[-1].startswith('SETUP_FAILED:'),out)
        self.assertIn('ep.3',out[-1]); self.assertIn('f.txt',out[-1])
        self.assertEqual(self.rev('task-ep.2'),self.old)
        self.assertEqual(self.git('branch','--show-current',cwd=self.wt).stdout.strip(),'task-ep.2')

    def test_unverified_restore_is_not_claimed(self):
        self.stack_conflict_fixture()
        rc,out=self.drift('--parents','ep.1',env=self.shim(fail_restore=True))
        self.assertEqual(rc,1,out); self.assertTrue(out[-1].startswith('SETUP_FAILED:'),out)
        self.assertNotIn('restored to old head',out[-1]); self.assertIn(self.old,out[-1])

    def test_merged_branch_only_is_already_merged(self):
        self.git('merge','--no-ff','-q','-m','land','task-ep.2')
        self.git('worktree','remove','--force',str(self.wt))
        for mode in ([],['--reentry']):
            text=self.text(*mode)
            self.assertIn('If ONLY the branch exists: run the ALREADY-MERGED CHECK',text)
            self.assertIn('If ONLY the worktree exists',text)
            cmd=re.search(r'`(bash \S*/already-merged integration task-ep\.2)`',text).group(1)
            p=subprocess.run(cmd,shell=True,cwd=self.repo,capture_output=True,text=True)
            self.assertEqual(p.stdout.strip(),'true',p.stdout+p.stderr)

unittest.main(verbosity=2)
TEST
