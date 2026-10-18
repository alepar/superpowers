"""Prospective metadata only; never executes tests or claims outcomes."""
from pathlib import Path
import copy, hashlib, json, subprocess, sys

root=Path(sys.argv[2]) if len(sys.argv)>2 else Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
canonical=Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/docs/superpowers/runs/2026-10-16-workflow-reliability/run.md')
head=sys.argv[1]
assert len(head)==40
git=lambda *a: subprocess.check_output(['git','-C',str(root),*a]).decode().strip()
assert git('rev-parse','HEAD')==head
tree=git('rev-parse',head+'^{tree}')
tag=head[:8]
old=json.loads(Path('/private/tmp/ufz-correction-final-suite-plan-c2168120.json').read_text())
plan=copy.deepcopy(old)
plan.update(checkout=f'/private/tmp/ufz-correction-final-source-{tag}',output=f'/private/tmp/ufz-correction-final-suite-{tag}',sourceHead=head,sourceTree=tree,
 reviewReference='/private/tmp/ufz-correction-projection-repair-review.md; prior c216 global review retained, bounded Task6 actual-root projection repair; same approved runner/outer; userauthoritymQ0VuyiMVWeP')
assert len(plan['commands'])==47 and len(set(plan['commands']))==47
for row in plan['entrypoints']:
 row['sha256']=hashlib.sha256(subprocess.check_output(['git','-C',str(root),'show',head+':'+row['command'].split()[1]])).hexdigest()
planpath=Path(f'/private/tmp/ufz-correction-final-suite-plan-{tag}.json')
assert not planpath.exists()
planpath.write_text(json.dumps(plan,indent=2)+'\n')
plansha=hashlib.sha256(planpath.read_bytes()).hexdigest()
run=canonical
text=run.read_text()
prefix='- root-acceptance · '
snapshots=[json.loads(l[len(prefix):]) for l in text.splitlines() if l.startswith(prefix)]
prior=snapshots[-1]
current=copy.deepcopy(prior)
current['sourceTree']=tree
requirements={q['id']:q for q in current['requirements']}
changes=[]
for i,row in enumerate(plan['entrypoints'],1):
 q=requirements[f'combined-suite-case-{i:02}']; before=copy.deepcopy(q)
 cfg=json.loads(q['configuration'])
 cfg.update(cwd=plan['checkout'],ownedEnvironmentRoot=f"{plan['output']}/case-{i:02}",planSha256=plansha,entrypointSha256=row['sha256'])
 q['configuration']=json.dumps(cfg,sort_keys=True,separators=(',',':'))
 changes.append({'id':q['id'],'previous':before,'next':copy.deepcopy(q)})
outer=f'/private/tmp/ufz-correction-final-suite-outer-{tag}'
quiet=f'/private/tmp/ufz-correction-final-suite-quiet-facts-{tag}.json'
q=requirements['final-suite']; before=copy.deepcopy(q)
q['command']=q['command'].replace('c2168120',tag)
cfg=json.loads(q['configuration']);cfg.update(planSha256=plansha,quietFacts=quiet,sourceHead=head)
q['configuration']=json.dumps(cfg,sort_keys=True,separators=(',',':'))
changes.append({'id':q['id'],'previous':before,'next':copy.deepcopy(q)})
for variant in ('inherited','trailing'):
 q=requirements['current-live-tmpdir-'+variant];before=copy.deepcopy(q)
 q['configuration']=f'final-{tag} controlled TMPDIR {variant} variant; exact actual environment/source/tool receipt retained separately'
 changes.append({'id':q['id'],'previous':before,'next':copy.deepcopy(q)})
assert len(changes)==50
amend={'version':2,'owner':'super-auto','predecessor':'/private/tmp/ufz-correction-final-suite-owner-amendment.json','authority':{'receivedMessage':'mQ0VuyiMVWeP','thread':'d4xcusxkUh1'},'basis':'Actual-root aggregate projection transport repair; exact-final-source contract requires unchanged47command list plus2distinctTMPDIRvariants; oldc216passed results retained at oldsource','sourceHead':head,'sourceTree':tree,'planSha256':plansha,'state':'prospective only; no new outcomes','changes':changes}
Path(f'/private/tmp/ufz-correction-final-suite-owner-amendment-{tag}.json').write_text(json.dumps(amend,indent=2)+'\n')
Path(f'/private/tmp/ufz-correction-final-suite-root-prerun-{tag}.json').write_text(json.dumps(current,indent=2)+'\n')
# Keep previous snapshots as literal history. New-source reviews remain pending.
marker=f'- correction-source-rebind · {head}'
assert marker not in text
Path(f'/private/tmp/ufz-correction-prospective-run-{tag}.md').write_text(text+'\n'+marker+' · actual projection transport repair; prospective source/configuration requirements, no new pass or human decision\n'+prefix+json.dumps(current,separators=(',',':'))+'\n')
print(json.dumps({'head':head,'tree':tree,'plan':str(planpath),'planSha256':plansha,'checkout':plan['checkout'],'output':plan['output'],'outer':outer,'quiet':quiet,'requirements':len(current['requirements']),'changes':len(changes)}))
