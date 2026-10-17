import json, pathlib, subprocess, hashlib
base=pathlib.Path(__file__).parent
scripts=base/'source/skills/super-auto/scripts'
fixture=base/'helper-fixtures';fixture.mkdir(exist_ok=True)
result={}
def call(args, file=None):
 if file:
  with open(file,'wb') as out:p=subprocess.run(['bash',str(scripts/args[0]),*map(str,args[1:])],stdout=out,stderr=subprocess.PIPE)
  return {'exit':p.returncode,'bytes':pathlib.Path(file).stat().st_size,'stderr':p.stderr.decode()}
 p=subprocess.run(['bash',str(scripts/args[0]),*map(str,args[1:])],capture_output=True)
 return {'exit':p.returncode,'stdout':p.stdout.decode(),'stderr':p.stderr.decode(),'bytes':len(p.stdout)}
# Projection transport: same valid source extraction, stdout directed to a file or a pipe.
art=fixture/'source.md';art.write_text('retained source')
source={'version':1,'source':'inv-large/final','artifact':'source.md','kind':'final-review','verdict':'not ready','occurrences':[{'section':'Must fix before landing','position':i+1,'key':'finding-'+str(i),'text':'x'*1500} for i in range(80)]}
large=fixture/'large-run.md';large.write_text('flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\napprovals:\n- finding-source · '+json.dumps(source)+'\n')
a=call(['scope-dispositions','--project',large]);b=call(['scope-dispositions','--project',large],fixture/'complete-projection.json')
try:json.loads(a['stdout']);valid=True
except json.JSONDecodeError:valid=False
result['projection']={'pipe':{'exit':a['exit'],'bytes':a['bytes'],'jsonValid':valid,'stderr':a['stderr'],'tail':a['stdout'][-100:]},'file':b,'fileFindings':len(json.loads((fixture/'complete-projection.json').read_text())['findings']),'status':call(['report-status',large])}
# Valid complete archive, accepted root, then damage only the archived direct package.
w=fixture/'workspace';w.mkdir(exist_ok=True)
review=w/'final-review-inv-small.md';review.write_text('## Verdict\nready\n## Must fix before landing\n- none\n## Untested scope\n- none\n## Deferred OK\n- none\n')
package=w/'final-review-inv-small.md.diff';package.write_text('original direct inputs')
root={'version':1,'owner':'super-auto','sourceTree':'a'*40,'requirements':[{'id':'review','kind':'review','owner':'caller'},{'id':'measure','kind':'measurement','owner':'caller','command':'test','configuration':'quiet','requiredLive':True},{'id':'human','kind':'human','owner':'human'}],'evidence':[{'sourceTree':'a'*40,'command':'test','configuration':'quiet','location':'test.log','kind':'live','outcome':'pass'}],'reviews':[{'id':'review','sourceTree':'a'*40,'outcome':'pass','location':'review.md'}],'decisions':[{'id':'human','authority':'human','decision':'accept','evidence':['human response']}],'recovery':{'obligations':[],'gaps':[]},'checkEvidence':{'records':[],'gaps':[],'requiredLiveChecks':[]},'runFailures':[]}
small=fixture/'small-run.md';small.write_text('flags: skipPlanRoast=false skipCodeRoast=false\nphase: code\napprovals:\n- root-acceptance · '+json.dumps(root)+'\n')
result['archiveIntegrity']={'collect':call(['report-status','--collect',small,'--invocation','inv-small','--workspace',w,'--review',review,'--verdict','ready']),'before':call(['report-status','--acceptance',small])}
archive=fixture/'reviews/inv-small/final-review-inv-small.md.diff';archive.write_text('corrupted archived direct inputs')
result['archiveIntegrity']['afterCorruption']=call(['report-status','--acceptance',small])
result['archiveIntegrity']['recollectDetects']=call(['report-status','--collect',small])
(base/'helper-probe-result.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
