exec((__import__('pathlib').Path(__file__).parent/'phase1-driver.py').read_text().split("assert sha(Path('/private/tmp")[0])
for name,args in [('projection-phase1-final',['bash',str(P),'--project',M['run']]),('keys-phase1-final',['bash',str(P),'--project',M['run'],'--keys']),('acceptance-phase1-final',['bash',str(S),'--acceptance',M['run'],'--tree',M['productTree']]),('status-phase1-final',['bash',str(S),M['run'],'--tip',M['productHead']]),('product-head-final',['git','rev-parse','HEAD']),('product-tree-final',['git','rev-parse','HEAD^{tree}']),('product-status-final',['git','status','--porcelain'])]:
 q=command(name,args,Path(M['product']) if name.startswith('product-') else R)
 assert q['exitCode']==(3 if name.startswith('acceptance') else 0)
assert (D/'product-head-final.stdout').read_text().strip()==M['productHead']
assert (D/'product-tree-final.stdout').read_text().strip()==M['productTree']
assert (D/'product-status-final.stdout').read_bytes()==b''
for rel,h in json.loads((D/'preserved-predecessors.json').read_text()).items():assert sha((R/rel).read_bytes())==h
identities={}
for name in ['bash','node','git','awk','dirname','cp','mkdir','python3']:
 p=shutil.which(name,path=E['PATH'])
 identities[name]=None if not p else {'path':p,'realpath':str(Path(p).resolve()),'sha256':sha(Path(p).read_bytes())}
(D/'environment-executable-identities.json').write_text(json.dumps(identities,indent=2)+'\n')
