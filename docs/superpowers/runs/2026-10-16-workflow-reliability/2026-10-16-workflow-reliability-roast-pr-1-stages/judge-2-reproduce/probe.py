from pathlib import Path
import subprocess,json,hashlib
W='/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers'
H='ff2f79f62cc34084c8df20edc5c2e4f201a5d630'
P=Path('/tmp/ufz-pr1/judge-2-reproduce')
receipts={}
for rel in ['skills/super-auto/scripts/report-status','skills/super-auto/scripts/scope-dispositions','skills/super-code/scripts/report-verdict']:
 b=subprocess.check_output(['git','-C',W,'show',H+':'+rel]);dst=P/'frozen'/rel;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(b)
 receipts[rel]=hashlib.sha256(b).hexdigest()
S=P/'frozen/skills/super-auto/scripts/report-status'
work=P/'workspace';work.mkdir(exist_ok=True)
run=P/'run/run.md';run.parent.mkdir(exist_ok=True)
report=work/'final-review-inv-proof.md'
report.write_text('## Verdict\nready\n## Must-fix\nnone\n## Deferred OK\nnone\n## Untested scope\nnone\n')
(work/'final-review-inv-proof.md.diff').write_text('original reviewed input\n')
tree='a'*40
snapshot={'version':1,'owner':'super-auto','sourceTree':tree,'requirements':[{'id':'review','kind':'review','owner':'super-auto'},{'id':'sweep','kind':'measurement','owner':'super-auto','command':'suite','configuration':'quiet','requiredLive':True},{'id':'finish','kind':'human','owner':'human'}],'evidence':[{'sourceTree':tree,'command':'suite','configuration':'quiet','kind':'live','outcome':'pass','location':'sweep.log'}],'reviews':[{'id':'review','sourceTree':tree,'outcome':'pass','location':str(report)}],'decisions':[{'id':'finish','authority':'human','decision':'accept','evidence':['fixture human choice']}],'recovery':{'obligations':[],'gaps':[]},'checkEvidence':{'records':[],'requiredLiveChecks':[],'gaps':[]},'runFailures':[]}
run.write_text('flags: skipPlanRoast=false skipCodeRoast=false\nphase: report\napprovals:\n- root-acceptance · '+json.dumps(snapshot)+'\n')
def call(label,args):
 r=subprocess.run(['bash',str(S),*map(str,args)],text=True,capture_output=True)
 receipts[label]={'argv':args,'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr}
 return r
assert call('collect-initial',['--collect',str(run),'--invocation','inv-proof','--workspace',str(work),'--review',str(report),'--verdict','ready']).returncode==0
before=call('acceptance-before',['--acceptance',str(run),'--tree',tree]);assert before.returncode==0
archive=run.parent/'reviews/inv-proof/final-review-inv-proof.md.diff'
receipts['archived-before-sha256']=hashlib.sha256(archive.read_bytes()).hexdigest()
archive.write_text('CORRUPTED ARCHIVED REVIEW INPUT\n')
receipts['archived-after-sha256']=hashlib.sha256(archive.read_bytes()).hexdigest()
after=call('acceptance-after',['--acceptance',str(run),'--tree',tree]);assert after.returncode==0 and json.loads(after.stdout)['eligible']
(run.parent/'run-before-recollect.md').write_bytes(run.read_bytes())
recollect=call('collect-after',['--collect',str(run)]);assert recollect.returncode==3 and 'archive conflict' in recollect.stderr
(P/'receipts.json').write_text(json.dumps(receipts,indent=2)+'\n')
print(json.dumps(receipts,indent=2))
