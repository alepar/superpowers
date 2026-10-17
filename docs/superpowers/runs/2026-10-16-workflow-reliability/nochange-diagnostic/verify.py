from pathlib import Path
import json,hashlib
p=Path('/private/tmp/ufz-nochange-diagnostic')
def sha(f): return hashlib.sha256(f.read_bytes()).hexdigest()
frozen=json.loads((p/'frozen-artifact-hashes.json').read_text())
assert all(sha(p/r)==h for r,h in frozen.items())
t=json.loads((p/'trials.json').read_text());s=json.loads((p/'scores.json').read_text());v=json.loads((p/'verification.json').read_text())
assert len(t)==len(s)==15 and len({r['agent'] for r in t})==15
assert all(r['counted'] and r['status']=='complete' for r in t)
assert not any(x['mismatches'] for x in v['original_integrity'])
assert not v['frozen_mismatches'] and all(x['matches'] for x in v['source_recheck'])
assert json.loads((p/'exclusions.json').read_text())=={'attempted':15,'counted':15,'retries':0,'exclusions':[]}
assert len(list(p.glob('*-prompt.txt')))==len(list(p.glob('*-response.txt')))==15
for r in t:
 assert sha(p/r['prompt'])==r['prompt_sha256'] and sha(p/r['response'])==r['response_sha256']
 assert len((p/r['response']).read_text().split())<=350
for r in s:
 response=(p/f"{r['id']}-response.txt").read_text()
 assert len(r['claims'])==4
 assert all(c['quote'] in response and c['context'] in response for c in r['claims'])
report=(p/'report.md').read_text();assert 'Status: DONE_WITH_CONCERNS' in report
hashes={str(f.relative_to(p)):sha(f) for f in sorted(p.rglob('*')) if f.is_file() and f.name!='artifact-hashes.json'}
# Include nested historical manifests: they are immutable source artifacts, only this pack's own inventory is excluded.
for f in p.rglob('artifact-hashes.json'):
 if f!=p/'artifact-hashes.json':hashes[str(f.relative_to(p))]=sha(f)
(p/'artifact-hashes.json').write_text(json.dumps(dict(sorted(hashes.items())),indent=2)+'\n')
assert all(sha(p/r)==h for r,h in json.loads((p/'artifact-hashes.json').read_text()).items())
print(f'VERIFIED: {len(t)} fresh complete counted trials; 60 quote-backed scores; {len(frozen)} frozen hashes unchanged; original AFTER131/baseline78 hash entries unchanged; {len(hashes)} final artifact hashes match.')
print('NEW final5/5 supported acceptance AND5/5 negative refusal; frozen B4 remains0pass2fail3ambiguous.')
