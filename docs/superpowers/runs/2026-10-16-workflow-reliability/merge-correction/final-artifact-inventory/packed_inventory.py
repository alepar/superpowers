#!/usr/bin/env python3
import gzip,hashlib,io,json,pathlib,subprocess,tarfile
ROOT=pathlib.Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers');OUT=pathlib.Path('/private/tmp/ufz-correction-final-artifact-inventory');HEAD='7b18b0c26b9f19d531c558e112d490743901a13b'
def blob(p):return subprocess.check_output(['git','show',HEAD+':'+p],cwd=ROOT)
def sha(b):return hashlib.sha256(b).hexdigest()
inv=json.loads((OUT/'tracked-path-inventory.json').read_text());rows=[]
for r in inv['records']:
    if r.get('contentFormat')!='binary-or-nul-bearing':continue
    p=r['path'];b=blob(p);row={'path':p,'committedSha256':sha(b),'committedBytes':len(b),'head':HEAD,'semanticAssessment':'not performed; packed payload is retained, not omitted'}
    if p.endswith('.diff.gz'):
        h=hashlib.sha256();n=0
        with gzip.GzipFile(fileobj=io.BytesIO(b)) as f:
            while c:=f.read(1024*1024):h.update(c);n+=len(c)
        mp=str(pathlib.PurePosixPath(p).parent/'archive-packaging-manifest.json');m=json.loads(blob(mp))
        if 'largeDiffPackaging'in m:claim=m['largeDiffPackaging'];expected=claim['rawSHA256'];en=claim['rawBytes']
        else:
            claim=next(x for x in m['records'] if x.get('durable')==pathlib.PurePosixPath(p).name);expected=claim['decoded']['sha256'];en=claim['decoded']['bytes']
        row.update(role='gzip encoded historical diff, verified against producer packaging record',decodedSha256=h.hexdigest(),decodedBytes=n,claimant=mp,claimantSha256=sha(blob(mp)),expectedDecodedSha256=expected,expectedDecodedBytes=en,decodedHashMatches=h.hexdigest()==expected,decodedBytesMatch=n==en)
    elif p.endswith(('.tar','.tar.gz')):
        members=[]
        with tarfile.open(fileobj=io.BytesIO(b),mode='r:*')as tf:
            for mem in tf:
                x={'name':mem.name,'type':mem.type.decode('ascii','replace'),'bytes':mem.size,'linkname':mem.linkname}
                if mem.isfile():x['sha256']=sha(tf.extractfile(mem).read())
                members.append(x)
        row.update(role='inert captured archive, member inventory only; never extracted or executed',members=members)
        dp=p.removesuffix('.tar')+'.json'
        try:
            if dp not in {x['path'] for x in inv['records']}:raise KeyError(dp)
            db=blob(dp);d=json.loads(db);expected={'.git/'+x['relativePath']:x for x in d['inventory']if x['type']=='file'}
            actual={x['name']:x for x in members if 'sha256'in x};checks=[]
            for name,e in expected.items():
                a=actual.get(name);checks.append({'member':name,'expectedSha256':e['sha256'],'expectedBytes':e['bytes'],'actualSha256':a.get('sha256')if a else None,'actualBytes':a.get('bytes')if a else None,'matches':bool(a and a['sha256']==e['sha256']and a['bytes']==e['bytes'])})
            row.update(descriptor=dp,descriptorSha256=sha(db),descriptorArchiveHashMatches=d['archiveSHA256']==sha(b),memberChecks=checks,regularMemberSetEqualsDescriptor=set(expected)==set(actual),allMemberChecksMatch=all(x['matches']for x in checks))
        except (subprocess.CalledProcessError,KeyError):row['descriptorBinding']='No matching Git metadata descriptor assumed; raw member identity only'
    rows.append(row)
(OUT/'packed-evidence-inventory.json').write_text(json.dumps({'scope':'Format/byte provenance only. No extraction to filesystem, execution, content semantic review or omission authority.','records':rows},indent=2)+'\n')
print(json.dumps({'packedArtifacts':len(rows),'gzipArtifacts':[{'path':x['path'],'decodedHashMatches':x['decodedHashMatches'],'decodedBytesMatch':x['decodedBytesMatch']}for x in rows if 'decodedHashMatches'in x],'gitMetadataArchives':[{'path':x['path'],'allMemberChecksMatch':x['allMemberChecksMatch'],'regularMemberSetEqualsDescriptor':x['regularMemberSetEqualsDescriptor']}for x in rows if 'allMemberChecksMatch'in x]},indent=2))
