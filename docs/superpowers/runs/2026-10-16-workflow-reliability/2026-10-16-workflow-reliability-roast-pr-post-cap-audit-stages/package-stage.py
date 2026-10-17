from pathlib import Path
import os,json,hashlib,gzip,shutil,tarfile
S=Path('/tmp/ufz-postcap-controller')
D=Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-post-cap-audit-stages')
D.mkdir(parents=True,exist_ok=True)
records=[]
def digest(p):
 h=hashlib.sha256(); n=0
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''): h.update(b);n+=len(b)
 return {'sha256':h.hexdigest(),'bytes':n}
for root,dirs,files in os.walk(S,followlinks=False):
 root=Path(root)
 for name in list(dirs):
  p=root/name
  if p.is_symlink():
   dirs.remove(name);files.append(name)
  elif name=='.git':
   dirs.remove(name); rel=p.relative_to(S); out=D/(str(rel)+'.inert.pax.tar');out.parent.mkdir(parents=True,exist_ok=True)
   with tarfile.open(out,'w',format=tarfile.PAX_FORMAT,dereference=False) as t:t.add(p,arcname=str(rel),recursive=True)
   records.append({'source':str(p),'durable':str(out.relative_to(D)),'encoding':'pax-tar-no-dereference',**digest(out)})
 for name in files:
  p=root/name;rel=p.relative_to(S)
  if p.is_symlink():
   out=D/(str(rel)+'.symlink.json');out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps({'source':str(p),'linkTarget':os.readlink(p),'followed':False},indent=2)+'\n');records.append({'source':str(p),'durable':str(out.relative_to(D)),'encoding':'symlink-descriptor',**digest(out)});continue
  if not p.is_file(): raise RuntimeError('special file '+str(p))
  out=D/rel;out.parent.mkdir(parents=True,exist_ok=True);original=digest(p)
  if p.stat().st_size>8*1024*1024:
   out=Path(str(out)+'.gz')
   with p.open('rb') as fi,out.open('wb') as fo:
    with gzip.GzipFile(filename='',mode='wb',fileobj=fo,mtime=0) as gz:shutil.copyfileobj(fi,gz)
   h=hashlib.sha256();n=0
   with gzip.open(out,'rb') as f:
    for b in iter(lambda:f.read(1024*1024),b''):h.update(b);n+=len(b)
   assert {'sha256':h.hexdigest(),'bytes':n}==original
   encoding='gzip'
  else: shutil.copyfile(p,out);assert digest(out)==original;encoding='identity'
  records.append({'source':str(p),'durable':str(out.relative_to(D)),'encoding':encoding,'decoded':original,**digest(out)})
(D/'archive-packaging-manifest.json').write_text(json.dumps({'sourceRoot':str(S),'records':records,'unsafeFilesystemEntries':0},indent=2)+'\n')
# Last-write ordering: verification receipt excludes itself and final map; final map is last.
excluded=['artifact-source-hash-map.json','archive-packaging-verification.json']
allfiles=[p for p in D.rglob('*') if p.is_file() and p.name not in excluded]
for p in D.rglob('*'):
 assert not p.is_symlink(),str(p)
 assert '.git' not in p.relative_to(D).parts,str(p)
(D/'archive-packaging-verification.json').write_text(json.dumps({'verified':True,'regularFilesBeforeFinalMap':len(allfiles)+1,'symlinks':0,'liveGitEntries':0,'sourceRecords':len(records),'selfReferenceExclusions':['artifact-source-hash-map.json'],'hashMapWrittenLast':True},indent=2)+'\n')
entries=[{'path':str(p.relative_to(D)),**digest(p)} for p in sorted(D.rglob('*')) if p.is_file() and p.name!='artifact-source-hash-map.json']
(D/'artifact-source-hash-map.json').write_text(json.dumps({'root':str(D),'entries':entries,'selfReferenceExclusions':['artifact-source-hash-map.json']},indent=2)+'\n')
for e in entries: assert digest(D/e['path'])=={k:e[k] for k in ['sha256','bytes']},e['path']
print(json.dumps({'stageDirectory':str(D),'sourceRecords':len(records),'verifiedEntries':len(entries),'finalMap':digest(D/'artifact-source-hash-map.json')}))
