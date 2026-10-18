exec((__import__('pathlib').Path(__file__).parent/'phase1-driver.py').read_text().split("assert sha(Path('/private/tmp")[0].replace("D=R/'phase1-receipts'", "D=R/'phase2-receipts'"))
product=Path(M['product']); run=Path(M['run'])
assert run.read_bytes()==(R/'phase1-run.md').read_bytes()
for h in M['helpers']:assert sha((R/'frozen-helpers'/h['path']).read_bytes())==h['sha256']
q=command('pre-fix-head',['git','rev-parse','HEAD'],product); assert q['exitCode']==0
q=command('pre-fix-status',['git','status','--porcelain'],product); assert q['exitCode']==0 and Path(q['stdout']).read_bytes()==b''
# Re-run the exact original criterion before editing; retain its real negative assertion failure.
q=command('criterion-RED-confirmed',['node','check.mjs'],product); assert q['exitCode']!=0
p=product/'counter.mjs'; old=p.read_bytes()
assert old==Path(M['requiredOriginalBytes']).read_bytes()
new=old.replace(b'nonnegativeCount = value => value;',b'nonnegativeCount = value => Math.max(0, value);')
assert new!=old and new.splitlines()[1:]==old.splitlines()[1:]
p.write_bytes(new)
(D/'source-edit.json').write_text(json.dumps({'path':str(p),'beforeSha256':sha(old),'afterSha256':sha(new),'decodeSnapshotUnchanged':new.splitlines()[1:]==old.splitlines()[1:],'timeUtc':datetime.datetime.now(datetime.timezone.utc).isoformat()},indent=2)+'\n')
q=command('criterion-GREEN',['node','check.mjs'],product); assert q['exitCode']==0
q=command('positive-and-negative-control',['node','--input-type=module','-e',"import assert from 'node:assert/strict'; import {nonnegativeCount} from './counter.mjs'; const observed = {negative:nonnegativeCount(-1), positive:nonnegativeCount(3), zero:nonnegativeCount(0)}; assert.deepEqual(observed,{negative:0,positive:3,zero:0}); console.log(JSON.stringify(observed));"],product); assert q['exitCode']==0
q=command('exact-fix-diff',['git','diff','--','counter.mjs'],product); assert q['exitCode']==0
q=command('stage-fixture-fix',['git','add','--','counter.mjs'],product); assert q['exitCode']==0
q=command('commit-fixture-fix',['git','-c','user.name=Controlled Fixture Caller','-c','user.email=fixture@example.invalid','commit','-m','fix: clamp negative fixture counts to zero','--','counter.mjs'],product); assert q['exitCode']==0
q=command('fixed-head',['git','rev-parse','HEAD'],product); assert q['exitCode']==0
head=Path(q['stdout']).read_text().strip()
q=command('fixed-tree',['git','rev-parse','HEAD^{tree}'],product); assert q['exitCode']==0
tree=Path(q['stdout']).read_text().strip()
q=command('committed-exact-diff',['git','diff',M['productHead'],head,'--'],product); assert q['exitCode']==0
q=command('fixed-status',['git','status','--porcelain'],product); assert q['exitCode']==0 and Path(q['stdout']).read_bytes()==b''
q=command('criterion-GREEN-committed',['node','check.mjs'],product); assert q['exitCode']==0
q=command('fixed-source',['git','show',head+':counter.mjs'],product); assert q['exitCode']==0 and Path(q['stdout']).read_bytes()==new
(D/'fixed-identity.json').write_text(json.dumps({'head':head,'tree':tree,'baselineHead':M['productHead'],'baselineTree':M['productTree'],'criterionCommand':'node check.mjs','configuration':'controlled-fixture'},indent=2)+'\n')
