import pathlib, subprocess, json
root=pathlib.Path('/tmp/ufz-postcap-controller/probe-panel0-ground')
repo='/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers'
refs={'base':'5b772aac1624ccdad01335be8779cdc49c2b27e0','head':'f726f0e97f57b398832891d3f7d95759ed367eb4'}
def call(args):
 p=subprocess.run(args,capture_output=True,text=True);return {'exit':p.returncode,'out':p.stdout,'err':p.stderr}
for version,ref in refs.items():
 for name in ['skills/super-auto/scripts/report-status','skills/super-auto/scripts/scope-dispositions','skills/super-code/scripts/report-verdict']+(['skills/super-design/scripts/findings-ledger'] if version=='head' else []):
  f=root/version/name;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(subprocess.check_output(['git','-C',repo,'show',ref+':'+name]))
for name in ['r1.md','r2.md','overrides.md']:
 (root/name).write_bytes(subprocess.check_output(['git','-C',repo,'show',refs['head']+':tests/super-design/fixtures/findings-ledger/disputed-reconfirmed/'+name]))
producer=call(['bash',str(root/'head/skills/super-design/scripts/findings-ledger'),'--loop','code','--out',str(root/'ledger.md'),'--report','1='+str(root/'r1.md'),'--report','2='+str(root/'r2.md'),'--overrides',str(root/'overrides.md')])
(root/'clean.md').write_text('## Verdict\nready\n\n## Must fix\nNone\n')
extraction=call(['bash',str(root/'head/skills/super-code/scripts/report-verdict'),'--complete','--source','clean/final',str(root/'clean.md')])
src=json.loads(extraction['out']);src['artifact']='clean.md'
tree='1'*40
r={'version':1,'owner':'super-auto','sourceTree':tree,'requirements':[{'id':'r','kind':'review','owner':'caller'},{'id':'m','kind':'measurement','owner':'caller','command':'check','configuration':'cfg','requiredLive':True},{'id':'h','kind':'human','owner':'human'}],'reviews':[{'id':'r','sourceTree':tree,'outcome':'pass','location':'review.log'}],'evidence':[{'sourceTree':tree,'command':'check','configuration':'cfg','kind':'live','outcome':'pass','location':'check.log'}],'decisions':[{'id':'h','authority':'human','decision':'accept','evidence':['human.log']}],'recovery':{'obligations':[],'gaps':[]},'checkEvidence':{'records':[],'gaps':[],'requiredLiveChecks':[]},'runFailures':[]}
prefix='phase: report\nflags: skipPlanRoast=false skipCodeRoast=false\ncodeBuckets:\n  escalated: none\n  pendingRetry: none\n  parked: none\n  stalled: false\n  review: CLEAN\n  sweep: 1 passed, 0 failed, 0 errors @ 1111111\n'
results={'producer':producer,'extraction':extraction,'ledger':(root/'ledger.md').read_text(),'cases':{}}
for pointer in ['', 'findingsLedger', 'findingsLedgerDesign']:
 run=root/((pointer or 'control')+'.md');run.write_text(prefix+(pointer+': ledger.md\n' if pointer else '')+'approvals:\n- finding-source · '+json.dumps(src)+'\n- root-acceptance · '+json.dumps(r)+'\n')
 for version in refs:
  script=str(root/version/'skills/super-auto/scripts/report-status')
  results['cases'][version+'-'+(pointer or 'control')]={'status':call(['bash',script,str(run)]),'acceptance':call(['bash',script,'--acceptance',str(run)]),'projection':call(['bash',str(root/version/'skills/super-auto/scripts/scope-dispositions'),'--project',str(run)])}
(root/'receipt.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
