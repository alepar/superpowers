exec((__import__('pathlib').Path(__file__).parent/'phase1-driver.py').read_text().split("assert sha(Path('/private/tmp")[0].replace("D=R/'phase1-receipts'", "D=R/'phase2-receipts'"))
identity=json.loads((D/'fixed-identity.json').read_text()); head=identity['head']; tree=identity['tree']; run=Path(M['run'])
s=run.read_text(); assert s==(R/'phase1-run.md').read_text()
ref={'source':'continuity-i1/final','section':'Must fix before landing','position':1}
disposition={'ref':ref,'disposition':'resolved','judgment':'supported','basis':'The exact counter.mjs:1 identity-return defect returned -1 for input -1 in the retained baseline and re-confirmed RED run. The sole committed source change clamps through Math.max(0, value); the same original criterion now passes at the fixed tree, and direct controls observe -1 -> 0, 3 -> 3 and 0 -> 0. decodeSnapshot is byte-unchanged. This evidence addresses only this original counter occurrence.','evidence':[str(D/'criterion-RED-confirmed.json')+' @ '+M['productTree'],str(D/'committed-exact-diff.json')+' @ '+head,str(D/'criterion-GREEN-committed.json')+' @ '+tree,str(D/'positive-and-negative-control.json')],'verification':'node check.mjs, configuration controlled-fixture: actual live/pass at fixed tree '+tree+'; direct negative/positive/zero control observed {negative:0,positive:3,zero:0}. The baseline assertion had actual -1, expected 0.'}
previous=[json.loads(l.split(' · ',1)[1]) for l in s.splitlines() if l.startswith('- root-acceptance · ')][-1]
# Prospective final criterion checks the new code tree with unchanged command/configuration.
# Preserve the old failed measurement and every review/human requirement independently.
snapshot=json.loads(json.dumps(previous)); snapshot['sourceTree']=tree
snapshot['evidence'].append({'sourceTree':tree,'command':'node check.mjs','configuration':'controlled-fixture','kind':'live','outcome':'pass','location':str(D/'criterion-GREEN-committed.json')})
assert snapshot['reviews']==[] and snapshot['decisions']==[]
addition='- finding-disposition · '+json.dumps(disposition,separators=(',',':'))+'\n- root-acceptance · '+json.dumps(snapshot,separators=(',',':'))+'\n'
assert s.count('codeBuckets:\n')==1
run.write_text(s.replace('codeBuckets:\n',addition+'codeBuckets:\n'))
(D/'recorded-disposition.json').write_text(json.dumps(disposition,indent=2)+'\n')
(D/'root-evidence-update.json').write_text(json.dumps({'reason':'prospective same criterion against committed fixed product tree; old failure retained; no review or human acceptance established','previous':previous,'current':snapshot},indent=2)+'\n')
for name,argv in [('projection-phase2',['bash',str(P),'--project',M['run']]),('keys-phase2',['bash',str(P),'--project',M['run'],'--keys']),('acceptance-phase2',['bash',str(S),'--acceptance',M['run'],'--tree',tree]),('status-phase2',['bash',str(S),M['run'],'--tip',head]),('collection-integrity-phase2',['bash',str(S),'--collect',M['run']])]:
 q=command(name,argv); assert q['exitCode']==(3 if name.startswith('acceptance') else 0)
 if name.startswith('collection'):assert q['stateBefore']==q['stateAfter']
projection=json.loads((D/'projection-phase2.stdout').read_text())
assert projection['gaps']==[]
assert len(projection['findings'])==4
for f in projection['findings']:
 assert f['outstanding']==(f['ref']!=ref)
 assert f['deferred']==False
assert projection['metrics']['repaired']==1 and projection['metrics']['outstanding']==3
acceptance=json.loads((D/'acceptance-phase2.stdout').read_text())
assert acceptance['eligible']==False and len(acceptance['pending'])==2
assert any('independent-final-review' in x for x in acceptance['pending'])
assert any('reserved-fixture-human-choice' in x for x in acceptance['pending'])
(R/'phase2-run.md').write_bytes(run.read_bytes())
for rel,h in json.loads((R/'phase1-receipts/preserved-predecessors.json').read_text()).items():assert sha((R/rel).read_bytes())==h
phase1=json.loads((R/'phase1-receipt-manifest.json').read_text())
for rel,h in phase1['files'].items():
 if rel=='run.md' or rel.startswith('product/'):continue
 assert sha((R/rel).read_bytes())==h,rel
(D/'preservation-check.json').write_text(json.dumps({'predecessorInventoryUnchanged':True,'phase1ArtifactsUnchangedExceptMutableRunAndIntendedProductSource':True,'phase1RunSha256':sha((R/'phase1-run.md').read_bytes()),'phase2RunSha256':sha((R/'phase2-run.md').read_bytes()),'runEqualsPhase2Snapshot':run.read_bytes()==(R/'phase2-run.md').read_bytes()},indent=2)+'\n')
