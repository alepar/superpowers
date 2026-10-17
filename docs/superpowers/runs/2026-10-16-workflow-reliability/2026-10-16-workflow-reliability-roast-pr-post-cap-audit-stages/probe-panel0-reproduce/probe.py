from pathlib import Path
import subprocess,json,shutil
p=Path('/tmp/ufz-postcap-controller/probe-panel0-reproduce')
f=Path('/tmp/ufz-postcap-controller/source/head/tests/super-design/fixtures/findings-ledger/disputed-reconfirmed')
for name in ['r1.md','r2.md','overrides.md']: shutil.copyfile(f/name,p/name)
def call(args):
 r=subprocess.run(args,text=True,capture_output=True);return dict(exit=r.returncode,stdout=r.stdout,stderr=r.stderr)
h=p/'head/skills';b=p/'base/skills'
producer=call(['bash',str(h/'super-design/scripts/findings-ledger'),'--loop','code','--out',str(p/'ledger.md'),'--report','1='+str(p/'r1.md'),'--report','2='+str(p/'r2.md'),'--overrides',str(p/'overrides.md')]);assert producer['exit']==0,producer
(p/'final.md').write_text('## Verdict\nready\n\n## Must fix\n- none\n\n## Untested scope\n- none\n')
extract=call(['bash',str(h/'super-code/scripts/report-verdict'),'--complete','--source','inv-a/final',str(p/'final.md')]);assert extract['exit']==0,extract
source=json.loads(extract['stdout']);source['artifact']='final.md';assert source['occurrences']==[]
roast=call(['bash',str(h/'super-code/scripts/report-verdict'),'--complete','--source','roast-code/round-1',str(p/'r1.md')]);assert roast['exit']==0,roast
roastsource=json.loads(roast['stdout']);roastsource['artifact']='r1.md'
tree='a'*40
snapshot={'version':1,'owner':'super-auto','sourceTree':tree,'requirements':[{'id':'review','kind':'review','owner':'super-auto'},{'id':'sweep','kind':'measurement','owner':'super-auto','command':'suite','configuration':'quiet','requiredLive':True},{'id':'finish','kind':'human','owner':'human'}],'evidence':[{'sourceTree':tree,'command':'suite','configuration':'quiet','kind':'live','outcome':'pass','location':'sweep.log'}],'reviews':[{'id':'review','sourceTree':tree,'outcome':'pass','location':'final.md'}],'decisions':[{'id':'finish','authority':'human','decision':'accept','evidence':['user-choice']}],'recovery':{'obligations':[],'gaps':[]},'checkEvidence':{'records':[],'requiredLiveChecks':[],'gaps':[]},'runFailures':[]}
header='flags: skipPlanRoast=false skipCodeRoast=false\nphase: report\ncodeBuckets:\n  completed: leaf-A\n  escalated: none\n  pendingRetry: none\n  parked: none\n  stalled: false\n  review: ready\n  sweep: 1 passed, 0 failed, 0 errors @ aaaaaaa\n'
results={}
for case,pointer,sources in [('no-ledger','',[source]),('code-ledger','findingsLedger: ledger.md\n',[source]),('design-ledger','findingsLedgerDesign: ledger.md\n',[source]),('retained-roast','findingsLedger: ledger.md\n',[source,roastsource]),('no-sources','findingsLedger: ledger.md\n',[])]:
 run=p/(case+'.md');run.write_text(header+pointer+'approvals:\n- root-acceptance · '+json.dumps(snapshot)+'\n'+''.join('- finding-source · '+json.dumps(s)+'\n' for s in sources))
 results[case]={}
 for ver,root in [('head',h),('base',b)]:
  results[case][ver]={'status':call(['bash',str(root/'super-auto/scripts/report-status'),str(run)]),'acceptance':call(['bash',str(root/'super-auto/scripts/report-status'),'--acceptance',str(run),'--tree',tree]),'projection':call(['bash',str(root/'super-auto/scripts/scope-dispositions'),'--project',str(run)])}
receipt={'producer':producer,'ledger':(p/'ledger.md').read_text(),'emptyExtraction':extract,'roastExtraction':roast,'results':results}
(p/'receipt.json').write_text(json.dumps(receipt,indent=2))
for case,versions in results.items():
 print(case)
 for ver,d in versions.items(): print(ver,d['status']['stdout'].strip(),d['acceptance']['exit'],d['acceptance']['stdout'].strip())
