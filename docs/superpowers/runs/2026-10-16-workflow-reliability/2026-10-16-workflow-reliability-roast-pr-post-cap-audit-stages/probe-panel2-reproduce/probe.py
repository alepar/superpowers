import subprocess, pathlib, json
root=pathlib.Path('/tmp/ufz-postcap-controller/probe-panel2-reproduce')
repo='/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers'
ends={'base':'5b772aac1624ccdad01335be8779cdc49c2b27e0','head':'f726f0e97f57b398832891d3f7d95759ed367eb4'}
tree='a'*40
snap={'version':1,'owner':'super-auto','sourceTree':tree,'requirements':[{'id':'review','kind':'review','owner':'super-auto'},{'id':'sweep','kind':'measurement','owner':'super-auto','command':'suite','configuration':'quiet','requiredLive':True},{'id':'finish','kind':'human','owner':'human'}],'evidence':[{'sourceTree':tree,'command':'suite','configuration':'quiet','outcome':'pass','kind':'live','location':'sweep.log'}],'reviews':[{'id':'review','sourceTree':tree,'outcome':'pass','location':'final.md'}],'decisions':[{'id':'finish','authority':'human','decision':'accept','evidence':['user-choice']}],'recovery':{'obligations':[],'gaps':[]},'checkEvidence':{'records':[],'requiredLiveChecks':[],'gaps':[]},'runFailures':[]}
source={'version':1,'source':'inv-a/final','artifact':'final.md','kind':'final-review','verdict':'ready','occurrences':[]}
roast={'version':1,'source':'roast-code/round-1','artifact':'roast.md','kind':'roast','verdict':'blocked','occurrences':[{'section':'Confirmed findings','position':1,'key':'[Blocking] src/seat.ts:41','text':'[Blocking] src/seat.ts:41 — required behavior fails'}]}
receipt=[]
for label,sha in ends.items():
 d=root/label; d.mkdir(exist_ok=True)
 for name in ['report-status','scope-dispositions']:
  (d/name).write_bytes(subprocess.check_output(['git','-C',repo,'show',sha+':skills/super-auto/scripts/'+name]))
 (d/'final.md').write_text('ready\n');(d/'roast.md').write_text('confirmed required defect\n')
 (d/'ledger.md').write_text('- [Blocking] src/seat.ts:41 · raised r1@3f9c2e1 · disputed@r2 (disagreement) · source roast · text roast.md\n')
 for pointer in ['', 'findingsLedger', 'findingsLedgerDesign']:
  for missing in ([False,True] if pointer else [False]):
   for retained in [False,True]:
    run=d/'run.md'
    text='flags: skipPlanRoast=false skipCodeRoast=false\nphase: report\n'
    if pointer:text+=pointer+': '+('absent.md' if missing else 'ledger.md')+'\n'
    text+='codeBuckets:\n  completed: leaf\n  escalated: none\n  pendingRetry: none\n  parked: none\n  stalled: false\n  review: ready\n  sweep: 1 — 1 passed, 0 failed, 0 errors, 0 skipped; failing: none; command: suite @ aaaaaaa\napprovals:\n- root-acceptance · '+json.dumps(snap)+'\n- finding-source · '+json.dumps(source)+'\n'
    if retained:text+='- finding-source · '+json.dumps(roast)+'\n'
    run.write_text(text)
    p=subprocess.run(['bash',str(d/'report-status'),'--acceptance',str(run),'--tree',tree],capture_output=True,text=True)
    ordinary=subprocess.run(['bash',str(d/'report-status'),str(run)],capture_output=True,text=True)
    receipt.append({'endpoint':label,'pointer':pointer,'missing':missing,'retainedRoast':retained,'exit':p.returncode,'gate':json.loads(p.stdout),'ordinary':ordinary.stdout})
(root/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
for r in receipt: print(r['endpoint'],r['pointer'] or 'none',r['missing'],r['retainedRoast'],r['exit'],r['gate']['eligible'],r['gate']['gaps'])
