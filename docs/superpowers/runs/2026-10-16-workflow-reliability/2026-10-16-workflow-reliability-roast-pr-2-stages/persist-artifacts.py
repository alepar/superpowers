import hashlib
import json
import os
from pathlib import Path
import shutil

S = Path('/tmp/ufz-pr2-controller')
W = Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers')
R = W / 'docs/superpowers/runs/2026-10-16-workflow-reliability'
D = R / '2026-10-16-workflow-reliability-roast-pr-2-stages'
REPORT = R / '2026-10-16-workflow-reliability-roast-pr-2.md'
P = W / '.superpowers/sdd/super-plan-ufz-plan'

def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

out = json.loads((S / 'complete-state.json').read_text())
assert out['coverage']['rawFindings'] == 8
assert out['coverage']['dedupedFindings'] == 6
assert out['coverage']['panelCount'] == 6
assert out['coverage']['judgeCompletionPct'] == 100
assert not out['coverage']['lowCoverage']
assert not out['reporterFailed']

raw_report = (S / 'report-final.md').read_text()
assert raw_report.startswith('super-roast verdict: ' + out['verdict'])
assert not REPORT.exists(), 'Refusing to overwrite a previously written report'

path_map = {
    'temporaryPrefix': str(S),
    'durablePrefix': str(D.relative_to(W)),
    'mapping': 'Literal prefix replacement in the human report only. All raw stage outputs remain byte-for-byte unchanged; symlink fixture targets are preserved verbatim and not followed.',
    'previousVersions': 'Differing pre-continuation durable bytes retained under controller-before-continuation/',
}
(S / 'durable-path-map.json').write_text(json.dumps(path_map, indent=2) + '\n')

manifest = []
for src in sorted(S.rglob('*')):
    if src.is_symlink():
        manifest.append({'relativePath': str(src.relative_to(S)), 'type': 'symlink', 'target': os.readlink(src)})
    elif src.is_file():
        manifest.append({'relativePath': str(src.relative_to(S)), 'type': 'file', 'bytes': src.stat().st_size, 'sha256': digest(src)})
(S / 'artifact-source-hash-map.json').write_text(json.dumps({'sourceRoot': str(S), 'durableRoot': str(D), 'entries': manifest, 'mapSelfExcluded': True}, indent=2) + '\n')

D.mkdir(parents=True, exist_ok=True)
backups = []
for src in sorted(S.rglob('*')):
    rel = src.relative_to(S)
    dst = D / rel
    if src.is_dir() and not src.is_symlink():
        dst.mkdir(parents=True, exist_ok=True)
        continue
    dst.parent.mkdir(parents=True, exist_ok=True)
    exists = dst.exists() or dst.is_symlink()
    equal = exists and ((src.is_symlink() and dst.is_symlink() and os.readlink(src) == os.readlink(dst)) or (not src.is_symlink() and not dst.is_symlink() and dst.is_file() and digest(src) == digest(dst)))
    if equal:
        continue
    if exists:
        old = D / 'controller-before-continuation' / rel
        assert not old.exists() and not old.is_symlink(), f'Backup already exists: {old}'
        old.parent.mkdir(parents=True, exist_ok=True)
        if dst.is_symlink():
            old.symlink_to(os.readlink(dst))
        else:
            shutil.copy2(dst, old)
        backups.append(str(rel))
        dst.unlink()
    if src.is_symlink():
        dst.symlink_to(os.readlink(src))
    else:
        shutil.copy2(src, dst)

verified = 0
for item in manifest:
    dst = D / item['relativePath']
    if item['type'] == 'symlink':
        assert dst.is_symlink() and os.readlink(dst) == item['target']
    else:
        assert dst.is_file() and digest(dst) == item['sha256'], str(dst)
    verified += 1
assert digest(D / 'artifact-source-hash-map.json') == digest(S / 'artifact-source-hash-map.json')

mapped = raw_report.replace(str(S), str(D.relative_to(W)))
provenance = '\n\nExecution provenance: This is the same PR round 2 resumed after the prior controller stopped on an automated provider content flag. All 13 completed scout results, dedupe and panel 0 were retained; the remaining 15 blind method-specific seats and the reporter were freshly dispatched. Static-review wording preserved each seat method and JSON contract. The pinned canonical engine computed packets, routes, coverage, agreement and report enforcement; no source code or repository history changed. Required pre-roast assembly was unavailable, so this review used the permitted full captured-Git fallback. Missing archive payloads remain evidence gaps, and fixture results do not establish hosted Workflow or actual root acceptance. Complete raw JSON, probes, full authored diff and frozen product snapshots are retained in ' + str(D.relative_to(W)) + '; artifact-source-hash-map.json records SHA-256 values and durable-path-map.json records the literal path mapping.\n'
REPORT.write_text(mapped.rstrip() + provenance)
coverage_path = R / '2026-10-16-workflow-reliability-roast-pr-2-coverage.json'
coverage_path.write_text(json.dumps(out['coverage'], indent=2) + '\n')

verification = {
    'verifiedSourceEntries': verified,
    'priorDifferingArtifactsPreserved': backups,
    'reportSHA256': digest(REPORT),
    'coverageSHA256': digest(coverage_path),
    'sourceHashMapSHA256': digest(D / 'artifact-source-hash-map.json'),
    'reporterOutputSHA256': digest(D / 'result-reporter.json'),
    'engineOutputSHA256': digest(D / 'complete-state.json'),
}
(D / 'persistence-verification.json').write_text(json.dumps(verification, indent=2) + '\n')
compact = {'verdict': out['verdict'], 'reportPath': str(REPORT), 'confirmedCount': out['confirmedCount'], 'escalations': out['escalations'], 'fixRegressions': out['fixRegressions'], 'coverage': out['coverage'], 'stagesPath': str(D), 'coveragePath': str(coverage_path), 'verificationPath': str(D / 'persistence-verification.json')}
(P / 'roast-pr-r2-result.json').write_text(json.dumps(compact, indent=2) + '\n')
friction = R / 'friction.md'
event = '- PR roast round2 reporter formatting: first verdict counted one Blocking while the report contained five confirmed entries. The same reporter corrected only the count; its first output was preserved and all other content was verified unchanged.'
if event not in friction.read_text():
    with friction.open('a') as f:
        f.write('\n' + event + '\n')
print(json.dumps({'verdict': out['verdict'], 'reportPath': str(REPORT), 'verifiedSourceEntries': verified, 'priorArtifactVersions': len(backups), 'compactResult': str(P / 'roast-pr-r2-result.json')}, indent=2))
