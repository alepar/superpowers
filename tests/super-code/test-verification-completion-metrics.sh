#!/usr/bin/env bash
# Real ordinary-transcript producer and metric CLIs; verification adds no Git landing.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
python3 - "$ROOT" <<'TEST'
import json, pathlib, subprocess, sys, tempfile, unittest
ROOT=pathlib.Path(sys.argv.pop())

class Metrics(unittest.TestCase):
    def check_case(self, kind):
        with tempfile.TemporaryDirectory() as tmp:
            d=pathlib.Path(tmp)
            verification=kind!='implementation'
            history=kind in ('earlier-merge','earlier-complete','untimed-earlier-merge')
            timed_history=history and kind!='untimed-earlier-merge'
            ledger=['Launch: mechanism ordinary-subagents · epic verify']
            if history: ledger.append('Merge: verify.1 — merged' if kind!='earlier-complete' else 'Task 1 (verify.1): complete, review clean')
            ledger.append('Task 1 (verify.1): complete, '+('verification-only, ' if verification else '')+'review clean')
            agents=[dict(codex='impl_verify_1',label='impl:verify.1',start=10,end=20),
                    dict(codex='review_verify_1',label='review:verify.1',start=21,end=25)]
            if history:
                agents += [dict(codex='impl_verify_1_recheck',label='impl:verify.1',start=60,end=70),
                           dict(codex='review_verify_1_recheck',label='review:verify.1',start=71,end=80)]
            sc=dict(t0='2026-10-01T00:00:00Z',epic='verify',cwd=str(d),end=90,ledger=ledger,
                    beads=[dict(id='verify',issue_type='epic'),dict(id='verify.1',parent='verify',created_at=0)],
                    agents=agents,caller=[dict(cmd='git merge --no-ff task-verify.1',start=30,end=35)] if timed_history else [])
            scenario=d/'scenario.json'; scenario.write_text(json.dumps(sc))
            made=subprocess.run(['node',str(ROOT/'tests/super-code/run-profile-ordinary-fixture.mjs'),str(scenario),'codex',str(d)],capture_output=True,text=True,check=True)
            profile=subprocess.run(['node',str(ROOT/'skills/super-code/scripts/run-profile.mjs'),'--codex',made.stdout.strip(),
                 '--codex-home',str(d/'codex'),'--ledger',str(d/'progress.md'),'--beads',str(d/'beads.json'),'--out',str(d/'profile')],capture_output=True,text=True,check=True)
            data=json.loads((d/'profile.json').read_text())
            digest=subprocess.run(['bash',str(ROOT/'skills/super-code/scripts/run-digest'),'--part','state','--budget','9000'],
                 input=f'skill: super-code\nledger: {d}/progress.md\n',capture_output=True,text=True,check=True)
            landed=history or not verification
            self.assertIn('ledger: landed '+str(int(landed)),digest.stdout)
            if verification: self.assertIn('verification-only 1',digest.stdout)
            bead=data['beads'][0]
            self.assertEqual(bead['landed'],landed)
            self.assertEqual(bead['verificationOnlyCompleted'],verification)
            self.assertEqual(data['lane']['merges'],int(landed and kind!='untimed-earlier-merge'))
            if verification: self.assertIn('verification-only 1',profile.stdout)
            if timed_history: self.assertEqual(bead['landedAt'],'2026-10-01T00:00:35.000Z')
            if kind=='untimed-earlier-merge':
                self.assertIsNone(bead['landedAt'])
                self.assertIsNone(data['simulation'])
            if not landed:
                self.assertIsNone(bead['landedAt'])
                self.assertIsNone(data['simulation'])
                self.assertFalse(any('landed bead(s) with no merge' in line for line in data['unmeasured']))
                self.assertEqual(bead['attempts'],['VERIFIED'])
                self.assertFalse(any('rework' in line for line in data['summary']))
            print(kind+': landing='+str(bead['landed'])+', merges='+str(data['lane']['merges']))

    def test_verification_only(self): self.check_case('verification')
    def test_prior_landing_without_timing_is_not_synthesized_at_verification(self): self.check_case('untimed-earlier-merge')
    def test_normal_implementation(self): self.check_case('implementation')
    def test_earlier_real_merge_survives_verification(self): self.check_case('earlier-merge')
    def test_earlier_complete_survives_verification(self): self.check_case('earlier-complete')

class WorkflowMetrics(unittest.TestCase):
    def check_case(self, kind):
        with tempfile.TemporaryDirectory() as tmp:
            d=pathlib.Path(tmp)
            agents=[dict(label='ledger-append:launch',start=0,end=1),
                    dict(label='plan',start=1,end=2,result=dict(mapping=[dict(id='verify.1',n=1,deps=[])]))]
            prior=kind=='prior-merge'
            if prior:
                agents += [dict(label='impl:verify.1',start=3,end=8,result=dict(status='IMPLEMENTED')),
                           dict(label='merge:verify.1',start=8,end=10,result=dict(merged=True))]
            agents += [dict(label='impl:verify.1',start=20,end=30,result=dict(status='IMPLEMENTED',completionKind='verification-only')),
                       dict(label='review:verify.1',start=31,end=40,result=dict(status='CLEAN',completionKind='verification-only')),
                       dict(label='close-only:verify.1',start=41,end=42,result=dict(status='BLOCKED' if kind=='pending' else 'CLOSED'))]
            sc=dict(t0='2026-10-01T00:00:00Z',launch=dict(epicId='verify',config=dict(concurrency=1)),agents=agents)
            scenario=d/'scenario.json'; scenario.write_text(json.dumps(sc))
            subprocess.run(['node',str(ROOT/'tests/super-code/run-profile-fixture.mjs'),str(scenario),str(d/'workflow')],check=True,capture_output=True)
            p=subprocess.run(['node',str(ROOT/'skills/super-code/scripts/run-profile.mjs'),'--workflow',str(d/'workflow'),'--out',str(d/'profile')],check=True,capture_output=True,text=True)
            data=json.loads((d/'profile.json').read_text()); bead=data['beads'][0]
            self.assertEqual(bead['landed'],prior,'verification close-only is tracker completion, not a Git landing')
            self.assertEqual(bead['verificationOnlyCompleted'],kind!='pending')
            self.assertEqual(data['lane']['merges'],int(prior))
            self.assertEqual(bead['landedAt'],'2026-10-01T00:00:10.000Z' if prior else None)
            if kind!='pending': self.assertIn('verification-only 1',p.stdout)
            else: self.assertNotIn('verification-only 1',p.stdout)
            if not prior: self.assertIsNone(data['simulation'])
            print('Workflow '+kind+': landing='+str(bead['landed'])+', verified='+str(bead['verificationOnlyCompleted']))

    def test_workflow_verified_close(self): self.check_case('verified')
    def test_workflow_pending_close_is_not_completed(self): self.check_case('pending')
    def test_workflow_prior_merge_survives_verification(self): self.check_case('prior-merge')

unittest.main(verbosity=2)
TEST
