import pathlib, subprocess, json
root=pathlib.Path('/tmp/ufz-postcap-controller/probe-panel0-refute')
w='/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers'
head='f726f0e97f57b398832891d3f7d95759ed367eb4'
scripts=root/'scripts';scripts.mkdir(exist_ok=True)
for name in ['report-status','scope-dispositions']:
 data=subprocess.check_output(['git','-C',w,'show',head+':skills/super-auto/scripts/'+name])
 (scripts/name).write_bytes(data)
fixture=pathlib.Path('/tmp/ufz-postcap-controller/source/head/tests/super-auto/fixtures/report-status')
for rel in ['skills/super-design/scripts/findings-ledger','skills/super-code/scripts/report-verdict']:
 dest=root/rel;dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_bytes(subprocess.check_output(['git','-C',w,'show',head+':'+rel]))
ledger_fixture=pathlib.Path('/tmp/ufz-postcap-controller/source/head/tests/super-design/fixtures/findings-ledger/disputed-reconfirmed')
for name in ['r1.md','r2.md','overrides.md']:
 (root/name).write_bytes((ledger_fixture/name).read_bytes())
producer=subprocess.run(['bash',str(root/'skills/super-design/scripts/findings-ledger'),'--loop','code','--out',str(root/'ledger.md'),'--report','1='+str(root/'r1.md'),'--report','2='+str(root/'r2.md'),'--overrides',str(root/'overrides.md')],capture_output=True,text=True)
assert producer.returncode==0,producer.stderr
(root/'producer.json').write_text(json.dumps({'exit':producer.returncode,'stdout':producer.stdout,'stderr':producer.stderr})+'\n')
(root/'final.md').write_text('ready\n')
tree='a'*40
record={'version':1,'owner':'super-auto','sourceTree':tree,'requirements':[{'id':'review','kind':'review','owner':'super-auto'},{'id':'suite','kind':'measurement','owner':'super-auto','command':'suite','configuration':'host','requiredLive':True},{'id':'finish','kind':'human','owner':'human'}],'evidence':[{'sourceTree':tree,'command':'suite','configuration':'host','kind':'live','outcome':'pass','location':'suite.log'}],'reviews':[{'id':'review','sourceTree':tree,'outcome':'pass','location':'final.md'}],'decisions':[{'id':'finish','authority':'human','decision':'accept','evidence':['operator-choice']}],'recovery':{'obligations':[],'gaps':[]},'checkEvidence':{'records':[],'requiredLiveChecks':[],'gaps':[]},'runFailures':[]}
source={'version':1,'source':'inv-final/final','artifact':'final.md','kind':'final-review','verdict':'ready','occurrences':[]}
base='flags: skipPlanRoast=false skipCodeRoast=false\nphase: report\ncodeBuckets:\n  completed: bd-1\n  escalated: none\n  pendingRetry: none\n  parked: none\n  stalled: false\n  review: ready\n  sweep: 1 — 1 passed, 0 failed, 0 errors; command: suite @ aaaaaaa\n'
run=root/'run.md'
receipts=[]
for name,pointer in [('no-ledger-control',''),('code-ledger-dispute','findingsLedger: ledger.md\n'),('design-ledger-dispute','findingsLedgerDesign: ledger.md\n')]:
 run.write_text(base+pointer+'approvals:\n- root-acceptance · '+json.dumps(record)+'\n- finding-source · '+json.dumps(source)+'\n')
 row={'case':name}
 for kind,args in [('ordinary',[str(run)]),('acceptance',['--acceptance',str(run),'--tree',tree])]:
  p=subprocess.run(['bash',str(scripts/'report-status'),*args],text=True,capture_output=True)
  row[kind]={'exit':p.returncode,'stdout':p.stdout,'stderr':p.stderr}
 receipts.append(row)
(root/'receipt.json').write_text(json.dumps(receipts,indent=2)+'\n')
print(json.dumps(receipts,indent=2))
