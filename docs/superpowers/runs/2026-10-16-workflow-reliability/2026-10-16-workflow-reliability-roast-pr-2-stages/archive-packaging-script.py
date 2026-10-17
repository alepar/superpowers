import base64
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import sys
import tarfile

S = Path('/tmp/ufz-pr2-controller')
T = Path('/tmp/ufz-pr2-archive-packaging-v2')
W = Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
D = W / 'docs/superpowers/runs/2026-10-16-workflow-reliability/2026-10-16-workflow-reliability-roast-pr-2-stages'
R = D.parent / '2026-10-16-workflow-reliability-roast-pr-2.md'
MAPS = ['artifact-source-hash-map.json', 'durable-path-map.json', 'persistence-verification.json']

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def save(p, value):
    p.write_text(json.dumps(value, indent=2) + '\n')

def scan(root):
    out = []
    for current, dirs, files in os.walk(root, followlinks=False):
        for name in sorted(dirs + files):
            p = Path(current) / name
            st = p.lstat()
            item = {'relativePath': str(p.relative_to(root)), 'mode': stat.S_IMODE(st.st_mode), 'mtimeNs': st.st_mtime_ns}
            if p.is_symlink():
                raw = os.fsencode(os.readlink(p))
                item.update(type='symlink', target=os.readlink(p), targetBytesBase64=base64.b64encode(raw).decode(), targetBytesSHA256=hashlib.sha256(raw).hexdigest())
            elif p.is_file():
                item.update(type='file', bytes=st.st_size, sha256=sha(p))
            else:
                item.update(type='directory')
            out.append(item)
    return sorted(out, key=lambda x: x['relativePath'])

def verify_tar(archive, inventory):
    with tarfile.open(archive, 'r:') as tf:
        members = {m.name: m for m in tf.getmembers()}
        expected = {'.git'} | {'.git/' + x['relativePath'] for x in inventory}
        assert set(members) == expected
        for x in inventory:
            member = members['.git/' + x['relativePath']]
            assert member.mode == x['mode']
            if x['type'] == 'file':
                assert member.isfile() and member.size == x['bytes']
                assert hashlib.sha256(tf.extractfile(member).read()).hexdigest() == x['sha256']
            elif x['type'] == 'directory':
                assert member.isdir()
            else:
                assert member.issym() and os.fsencode(member.linkname) == base64.b64decode(x['targetBytesBase64'])

def content_identity(inventory):
    return [{k:v for k,v in x.items() if k not in ['mode','mtimeNs']} for x in inventory]

if sys.argv[1] == 'prepare':
    assert not T.exists(), 'Packaging scratch already exists'
    T.mkdir()
    (T / 'original-manifests').mkdir()
    baseline = scan(D)
    links = [x for x in baseline if x['type'] == 'symlink']
    git = [x for x in baseline if Path(x['relativePath']).name == '.git']
    assert len(links) == 4 and len(git) == 4
    transforms = []
    for i, x in enumerate(links):
        original = D / x['relativePath']
        scratch_original = S / x['relativePath']
        assert scratch_original.is_symlink() and os.fsencode(os.readlink(scratch_original)) == base64.b64decode(x['targetBytesBase64'])
        st = original.lstat()
        descriptor = dict(x, representation='inert symbolic-link descriptor; original link was not followed', originalDurablePath=str(original), originalScratchPath=str(scratch_original), originalIdentity={'device':st.st_dev,'inode':st.st_ino,'uid':st.st_uid,'gid':st.st_gid,'size':st.st_size}, originalScratchPreserved=True)
        name = f'symlink-{i}.json'
        save(T / name, descriptor)
        transforms.append({'kind':'symlink','originalRelativePath':x['relativePath'],'safeRelativePath':x['relativePath']+'.symlink-evidence.json','preparedFile':name,'preparedSHA256':sha(T/name),'originalTargetBytesBase64':x['targetBytesBase64'],'originalTargetBytesSHA256':x['targetBytesSHA256']})
    for i, x in enumerate(git):
        original = D / x['relativePath']
        inventory = scan(original)
        scratch_inventory = scan(S / x['relativePath'])
        assert content_identity(inventory) == content_identity(scratch_inventory), 'Original scratch Git metadata bytes differ'
        name = f'git-metadata-{i}.tar'
        with tarfile.open(T / name, 'w', format=tarfile.PAX_FORMAT, dereference=False) as tf:
            tf.add(original, arcname='.git', recursive=True)
        verify_tar(T / name, inventory)
        rel = str(Path(x['relativePath']).parent / 'git-metadata.evidence.tar')
        descriptor_name = f'git-metadata-{i}.json'
        descriptor_rel = str(Path(x['relativePath']).parent / 'git-metadata.evidence.json')
        descriptor = {'originalRelativePath':x['relativePath'],'originalScratchPath':str(S/x['relativePath']),'representation':'standard uncompressed PAX tar; inert regular file, not extracted','archiveRelativePath':rel,'archiveSHA256':sha(T/name),'archiveRoot':'.git','rootMetadata':x,'inventory':inventory,'originalScratchInventory':scratch_inventory,'verification':'Every original member identity/type/mode and regular-file byte hash verified against the archive; no extraction or link traversal performed. Original scratch directory timestamps and modes can differ from the earlier durable copy; their exact inventory is separately retained.','originalScratchPreserved':True}
        save(T / descriptor_name, descriptor)
        transforms.append({'kind':'git-directory','originalRelativePath':x['relativePath'],'safeRelativePath':rel,'descriptorRelativePath':descriptor_rel,'preparedFile':name,'preparedSHA256':sha(T/name),'preparedDescriptor':descriptor_name,'descriptorSHA256':sha(T/descriptor_name),'inventory':inventory,'scratchInventory':scratch_inventory})
    for name in MAPS:
        shutil.copy2(D/name, T/'original-manifests'/name)
    plan = {'baseline':baseline,'reportSHA256':sha(R),'transforms':transforms,'originalManifestSHA256':{name:sha(D/name) for name in MAPS},'originalScratchUntouched':str(S)}
    save(T/'plan.json', plan)
    print(json.dumps({'prepared':str(T/'plan.json'),'symlinks':len(links),'gitDirectories':len(git),'gitRegularFilesPreserved':sum(sum(x['type']=='file' for x in t.get('inventory',[])) for t in transforms),'reportSHA256':plan['reportSHA256']},indent=2))
    sys.exit(0)

assert sys.argv[1] == 'apply'
plan = json.loads((T/'plan.json').read_text())
assert scan(D) == plan['baseline'], 'Owned archive changed since preparation'
assert sha(R) == plan['reportSHA256']
prior = D/'archive-packaging-prior'
assert not prior.exists()
prior.mkdir()
for name in MAPS:
    assert sha(D/name) == plan['originalManifestSHA256'][name]
    shutil.copy2(T/'original-manifests'/name, prior/name)
shutil.copy2(T/'plan.json', prior/'original-tree-and-transform-plan.json')

representations = []
for t in plan['transforms']:
    original = D/t['originalRelativePath']
    safe = D/t['safeRelativePath']
    assert not safe.exists() and not safe.is_symlink()
    assert sha(T/t['preparedFile']) == t['preparedSHA256']
    if t['kind'] == 'symlink':
        assert original.is_symlink()
        assert os.fsencode(os.readlink(original)) == base64.b64decode(t['originalTargetBytesBase64'])
        shutil.copy2(T/t['preparedFile'],safe)
        original.unlink()
        representations.append({k:v for k,v in t.items() if not k.startswith('prepared')})
    else:
        verify_tar(T/t['preparedFile'], t['inventory'])
        assert scan(original) == t['inventory']
        assert sha(T/t['preparedDescriptor']) == t['descriptorSHA256']
        shutil.copy2(T/t['preparedFile'],safe)
        shutil.copy2(T/t['preparedDescriptor'],D/t['descriptorRelativePath'])
        shutil.rmtree(original)
        verify_tar(safe,t['inventory'])
        members = [{'originalRelativePath':str(Path(t['originalRelativePath'])/x['relativePath']),'archiveRelativePath':t['safeRelativePath'],'tarMember':'.git/'+x['relativePath'],**{k:v for k,v in x.items() if k!='relativePath'}} for x in t['inventory']]
        representations.append({k:v for k,v in t.items() if not k.startswith('prepared') and k not in ['inventory','scratchInventory']} | {'memberRepresentations':members})

unchanged = 0
for x in plan['baseline']:
    rel=x['relativePath']
    if x['type'] != 'file' or rel in MAPS or any(rel.startswith(t['originalRelativePath']+'/') for t in plan['transforms'] if t['kind']=='git-directory'):
        continue
    assert sha(D/rel)==x['sha256'], rel
    unchanged += 1
assert sha(R) == plan['reportSHA256']
for t in plan['transforms']:
    original = S/t['originalRelativePath']
    if t['kind']=='symlink':
        assert original.is_symlink() and os.fsencode(os.readlink(original))==base64.b64decode(t['originalTargetBytesBase64'])
    else:
        assert scan(original)==t['scratchInventory']

manifest = {'purpose':'Packaging correction only; no review judgments, proof receipts, report, or captured source snapshot changed','originalScratchUntouched':str(S),'originalManifestsRetainedAt':str(prior.relative_to(D)),'originalManifestSHA256':plan['originalManifestSHA256'],'representations':representations,'unchangedPreexistingRegularFiles':unchanged,'reportSHA256Unchanged':plan['reportSHA256'],'tarByteVerification':'all original Git metadata regular-file contents matched individual SHA-256 values in the tar member inventories'}
shutil.copy2(Path(__file__), D/'archive-packaging-script.py')
manifest['packagingScriptSHA256']=sha(D/'archive-packaging-script.py')
save(D/'archive-packaging-manifest.json',manifest)
pathmap=json.loads((prior/'durable-path-map.json').read_text())
pathmap['mapping']='Literal /tmp source prefix maps to this durable archive, except original live symlinks and .git directories now resolve through the exact inert representations in archive-packaging-manifest.json. Raw source and old manifests remain preserved; no original target was followed.'
pathmap['representationManifest']='archive-packaging-manifest.json'
pathmap['previousManifest']='archive-packaging-prior/durable-path-map.json'
save(D/'durable-path-map.json',pathmap)

excluded={'artifact-source-hash-map.json','persistence-verification.json','archive-packaging-verification.json'}
current=scan(D)
assert not any(x['type']=='symlink' for x in current)
assert not any(Path(x['relativePath']).name=='.git' for x in current)
entries=[{k:v for k,v in x.items() if k in ['relativePath','type','bytes','sha256']} for x in current if x['type']=='file' and x['relativePath'] not in excluded]
source_map={'sourceRoot':str(S),'durableRoot':str(D),'entries':entries,'excludedSelfReferentialMetadata':sorted(excluded),'originalSourceMap':'archive-packaging-prior/artifact-source-hash-map.json','originalSourceMapSHA256':plan['originalManifestSHA256']['artifact-source-hash-map.json'],'representationManifest':'archive-packaging-manifest.json','sourceIdentity':'Original source identities map to unchanged regular files or explicitly serialized symlink/Git metadata representations; prior raw map retained byte-for-byte.'}
save(D/'artifact-source-hash-map.json',source_map)
persistence=json.loads((prior/'persistence-verification.json').read_text())
persistence.update(sourceHashMapSHA256=sha(D/'artifact-source-hash-map.json'),archivePackagingManifestSHA256=sha(D/'archive-packaging-manifest.json'),priorPersistenceVerification='archive-packaging-prior/persistence-verification.json',packagingCorrectionOnly=True)
save(D/'persistence-verification.json',persistence)
for x in entries:
    assert sha(D/x['relativePath'])==x['sha256']
summary={'status':'verified safe inert archive','manifestPath':str(D/'archive-packaging-manifest.json'),'manifestSHA256':sha(D/'archive-packaging-manifest.json'),'sourceHashMapPath':str(D/'artifact-source-hash-map.json'),'sourceHashMapSHA256':sha(D/'artifact-source-hash-map.json'),'persistenceVerificationSHA256':sha(D/'persistence-verification.json'),'liveSymlinks':0,'gitNamedEntries':0,'serializedSymlinks':4,'inertGitArchives':4,'gitRegularFilesPreserved':sum(sum(x['type']=='file' for x in t.get('inventory',[])) for t in plan['transforms']),'unchangedPreexistingRegularFiles':unchanged,'safeFileEntriesHashed':len(entries),'reportSHA256Unchanged':sha(R),'proofReceiptAndSourceBytesChanged':0,'originalScratchPreserved':True,'previousManifestVersionsPreserved':3}
save(D/'archive-packaging-verification.json',summary)
print(json.dumps(summary,indent=2))
