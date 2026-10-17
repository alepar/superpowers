import pathlib, subprocess, json, shutil
p=pathlib.Path('/tmp/ufz-postcap-controller/probe-api-contract')
snap=pathlib.Path('/tmp/ufz-postcap-controller/source/head')
w='/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers'
scripts=p/'scripts';scripts.mkdir(exist_ok=True)
shutil.copyfile(snap/'skills/super-auto/scripts/report-status',scripts/'report-status')
(scripts/'scope-dispositions').write_bytes(subprocess.check_output(['git','-C',w,'show','f726f0e97f57b398832891d3f7d95759ed367eb4:skills/super-auto/scripts/scope-dispositions']))
(p/'final.md').write_text('ready\n')
source={'version':1,'source':'inv-a/final','artifact':'final.md','kind':'final-review','verdict':'ready','occurrences':[]}
tree='a'*40
r={'version':1,'owner':'super-auto','sourceTree':tree,'requirements':[{'id':'final-review','kind':'review','owner':'super-auto'},{'id':'sweep','kind':'measurement','owner':'super-auto','command':'suite','configuration':'quiet','requiredLive':True},{'id':'finish','kind':'human','owner':'human'}],'evidence':[{'sourceTree':tree,'command':'suite','configuration':'quiet','kind':'live','outcome':'pass','location':'sweep.log'}],'reviews':[{'id':'final-review','sourceTree':tree,'outcome':'pass','location':'final.md'}],'decisions':[{'id':'finish','authority':'human','decision':'accept','evidence':['user-choice']}],'recovery':{'obligations':[],'gaps':[]},'checkEvidence':{'records':[],'requiredLiveChecks':[],'gaps':[]},'runFailures':[]}
prefix='flags: skipPlanRoast=false skipCodeRoast=false\nphase: report\ncodeBuckets:\n  completed: leaf-A\n  escalated: none\n  pendingRetry: none\n  parked: none\n  stalled: false\n  review: ready\n  sweep: 1 — 1 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: suite @ aaaaaaa\n'
approvals='approvals:\n- root-acceptance · '+json.dumps(r)+'\n- finding-source · '+json.dumps(source)+'\n'
ledger=snap/'tests/super-auto/fixtures/report-status/disputed-uncapped-ledger.md'
shutil.copyfile(ledger,p/'ledger.md')
receipt={}
for label,ptr in [('clean',''),('disputed','findingsLedger: ledger.md\n'),('missing','findingsLedger: absent-ledger.md\n')]:
 f=p/(label+'.md');f.write_text(prefix+ptr+approvals)
 outputs={}
 for mode,args in [('status',[]),('acceptance',['--acceptance'])]:
  cmd=['bash',str(scripts/'report-status'),*args,str(f)]
  if mode=='acceptance':cmd+=['--tree',tree]
  x=subprocess.run(cmd,text=True,capture_output=True)
  outputs[mode]={'code':x.returncode,'stdout':x.stdout,'stderr':x.stderr}
 receipt[label]=outputs
(p/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt,indent=2))
