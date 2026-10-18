"""Retain actual final measurements and propose their exact source-bound records."""
from pathlib import Path
import hashlib,json,shutil

tag='fd52ffc7';head='fd52ffc7a8de0c4412c517adec2d4979d06906ff';tree='e9fb5e1b76697264ef7ade29dc5fc79ea57898c2'
tmp=Path('/private/tmp');stage=tmp/'ufz-correction-ready-to-apply-fd52ffc7'
relative=Path('merge-correction/projection-transport-repair/final-suite')
dest=stage/relative;assert not dest.exists();dest.mkdir(parents=True)
canonical=Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/docs/superpowers/runs/2026-10-16-workflow-reliability')
inner=tmp/f'ufz-correction-final-suite-{tag}';outer=tmp/f'ufz-correction-final-suite-outer-{tag}'
variants=tmp/f'ufz-correction-final-tmpdir-variants-{tag}';inspection=tmp/f'ufz-correction-final-owned-inspection-{tag}'
planpath=tmp/f'ufz-correction-final-suite-plan-{tag}.json';plan=json.loads(planpath.read_bytes());plansha=hashlib.sha256(planpath.read_bytes()).hexdigest()
result=json.loads((inner/'result.json').read_bytes());assert result['status']=='passed' and result['completed'] and result['measurementValid']
assert (result['commandGroupsPassed'],result['commandGroupsFailed'],result['commandGroupsErrors'],result['commandGroupsSkipped'])==(47,0,0,0)
assert result['sourceHead']==head and result['sourceTree']==tree and result['planSha256']==plansha
assert not result['changedInputsAtEnd'] and not result['invalidations']
outer_result=json.loads((outer/'outer-receipt.json').read_bytes());assert outer_result['status']=='passed' and outer_result['exitCode']==0 and not outer_result['changedInputs']
vresult=json.loads((variants/'result.json').read_bytes());assert vresult['completed'] and vresult['allPassed'] and len(vresult['cases'])==2
ires=json.loads((inspection/'receipt.json').read_bytes());assert ires['exitCode']==0
manifest=[];verified=[];omitted=[]
sha=lambda data:hashlib.sha256(data).hexdigest()
def retain(src,rel):
 data=src.read_bytes();target=dest/rel;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 manifest.append({'original':str(src),'retained':str(relative/rel),'bytes':len(data),'sha256':sha(data)})
def stream(path,expected,length):
 data=path.read_bytes();assert sha(data)==expected and len(data)==length
 verified.append({'path':str(path),'bytes':len(data),'sha256':expected})
for i in range(1,48):
 case=f'case-{i:02}';r=json.loads((inner/case/'receipt.json').read_bytes())
 assert r['status']=='passed' and r['exitCode']==0 and r['sourceHead']==head and r['sourceTree']==tree
 assert r['planCommand']==plan['commands'][i-1] and r['entrypointSha256']==plan['entrypoints'][i-1]['sha256'] and r['planSha256']==plansha
 for snap in ('beforeSource','afterSource'):
  assert r[snap]['clean'] and r[snap]['probesSucceeded'] and r[snap]['head']==head and r[snap]['tree']==tree
 for s in ('stdout','stderr'):
  p=Path(r[s+'Path']);stream(p,r[s+'Sha256'],r[s+'Bytes']);retain(p,Path('serial')/case/(s+'.log'))
 retain(inner/case/'receipt.json',Path('serial')/case/'receipt.json')
for name in ('result.json','progress.json'):retain(inner/name,Path('serial')/name)
for folder,label in ((inner/'inputs','serial/inputs'),(outer/'inputs','outer/inputs')):
 for p in sorted(folder.iterdir()):
  if p.name.endswith('.executable'):omitted.append({'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes()),'reason':'tool binary retained privately; hash metadata archived'})
  elif p.is_file():retain(p,Path(label)/p.name)
for name in ('outer-receipt.json','stdout.log','stderr.log'):retain(outer/name,Path('outer')/name)
for s in ('stdout','stderr'):stream(Path(outer_result[s]['path']),outer_result[s]['sha256'],outer_result[s]['bytes'])
for v in vresult['cases']:
 assert v['exitCode']==0 and v['sourceHead']==head and v['sourceTree']==tree
 for s in ('stdout','stderr'):
  stream(Path(v[s]['path']),v[s]['sha256'],v[s]['bytes']);retain(Path(v[s]['path']),Path('tmpdir-variants')/v['variant']/(s+'.log'))
 retain(variants/v['variant']/'receipt.json',Path('tmpdir-variants')/v['variant']/'receipt.json')
retain(variants/'result.json',Path('tmpdir-variants/result.json'))
for name in ('receipt.json','stdout.log','stderr.log'):retain(inspection/name,Path('owned-inspection')/name)
for s in ('stdout','stderr'):stream(Path(ires[s]['path']),ires[s]['sha256'],ires[s]['bytes'])
for name in (f'ufz-correction-final-suite-plan-{tag}.json',f'ufz-correction-final-suite-owner-amendment-{tag}.json',f'ufz-correction-final-suite-root-prerun-{tag}.json',f'ufz-correction-final-suite-quiet-facts-{tag}.json','ufz-run-projection-tmpdir-variants.py','ufz-package-projection-final.py'):retain(tmp/name,Path('inputs')/name)
requirements=json.loads((tmp/f'ufz-correction-final-suite-root-prerun-{tag}.json').read_bytes())['requirements'];qmap={q['id']:q for q in requirements}
records=[]
for i in range(1,48):
 ident=f'combined-suite-case-{i:02}';q=qmap[ident]
 records.append({'id':ident,'sourceTree':tree,'command':q['command'],'configuration':q['configuration'],'outcome':'pass','kind':'live','location':str(canonical/relative/'serial'/f'case-{i:02}'/'receipt.json')})
for ident,rel in [('final-suite','serial/result.json'),('current-live-tmpdir-inherited','tmpdir-variants/inherited/receipt.json'),('current-live-tmpdir-trailing','tmpdir-variants/trailing/receipt.json')]:
 q=qmap[ident];records.append({'id':ident,'sourceTree':tree,'command':q['command'],'configuration':q['configuration'],'outcome':'pass','kind':'live','location':str(canonical/relative/rel)})
assert len(records)==50
(tmp/'ufz-correction-final-measurement-records-fd52ffc7.json').write_text(json.dumps(records,indent=2)+'\n')
(dest/'retention-and-parent-verification.json').write_text(json.dumps({'sourceHead':head,'sourceTree':tree,'all47Passed':True,'bothTMPDIRPassed':True,'ownedInspectionExit':0,'rawStreamsIndependentlyVerified':verified,'retainedFiles':manifest,'toolBinaryPayloadsPrivateOnly':omitted,'recordProposal':'/private/tmp/ufz-correction-final-measurement-records-fd52ffc7.json','state':'private staging only; canonical adoption and external application still pending'},indent=2)+'\n')
print('Retained',len(manifest),'files; verified',len(verified),'raw streams; proposed',len(records),'matching actual source-bound records.')
