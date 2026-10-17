"""Freeze final guidance packets without touching any before inputs/outcomes."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys

root = Path(sys.argv[1]).resolve(strict=True)
head = sys.argv[2]
actual = subprocess.check_output(['git', '-C', str(root), 'rev-parse', head], text=True).strip()
if actual != head or len(head) != 40:
    raise SystemExit('An exact full commit is required')
tree = subprocess.check_output(['git', '-C', str(root), 'rev-parse', head + '^{tree}'], text=True).strip()
sha = lambda data: hashlib.sha256(data).hexdigest()

def blob(commit, path):
    return subprocess.check_output(['git', '-C', str(root), 'show', commit + ':' + path])

def context(files, commit, style):
    result = b''
    identities = []
    for entry in files:
        name = entry['path']
        data = blob(commit, name)
        identities.append({'path': name, 'sha256': sha(data), 'bytes': len(data)})
        if style == 'primary':
            result += ('\n<instruction_file path="' + name + '">\n').encode() + data + b'\n</instruction_file>\n'
        else:
            result += ('\nFILE ' + name + '\n').encode() + data + b'\n'
    # The original feedback packet separates files with the added blank line,
    # while its final file ends with that file's own original newline only.
    if style == 'feedback':
        result = result[:-1]
    return result, identities

for directory, style, source_key, case_file, case_hash_key in [
    ('/private/tmp/ufz-correction-behavior-eval', 'primary', 'baseline', 'cases.txt', 'casesSha256'),
    ('/private/tmp/ufz-correction-feedback-eval', 'feedback', 'source', 'case.txt', 'caseSha256')]:
    out = Path(directory)
    protocol = json.loads((out / 'protocol.json').read_text())
    # Confirm exact historical formatting/bytes; never silently change the packet
    # representation between variants or revise a before result.
    original, _ = context(protocol['files'], protocol[source_key], style)
    if original != (out / 'baseline-context.md').read_bytes() or sha(original) != protocol['contextSha256']:
        raise SystemExit('Baseline formatting/source mismatch: ' + directory)
    if sha((out / case_file).read_bytes()) != protocol[case_hash_key]:
        raise SystemExit('Cases changed: ' + directory)
    packet, identities = context(protocol['files'], head, style)
    target = out / 'after-context.md'
    metadata = out / 'after-context-identity.json'
    if target.exists() or metadata.exists():
        raise SystemExit('Refusing to replace an after variant')
    target.write_bytes(packet)
    metadata.write_text(json.dumps({'variant': 'after', 'sourceHead': head, 'sourceTree': tree,
        'files': identities, 'contextSha256': sha(packet), 'bytes': len(packet),
        'caseFile': case_file, 'casesSha256': sha((out / case_file).read_bytes()),
        'baselineProtocolSha256': sha((out / 'protocol.json').read_bytes()),
        'samples': 'Five fresh subjects required; no responses established by this freeze.',
        'limits': 'Same file membership/cases/format, common inherited harness; provider prefix/revision not controlled. No causal generalized improvement.'}, indent=2) + '\n')
    print(json.dumps({'packet': str(target), 'bytes': len(packet), 'sha256': sha(packet)}))

out = Path('/private/tmp/ufz-correction-behavior-eval')
guide = 'skills/super-design/SKILL.md'
data = blob(head, guide)
target = out / 'after-only-super-design-context.md'
if target.exists():
    raise SystemExit('Refusing supplemental context replacement')
target.write_bytes(('\n<instruction_file path="' + guide + '">\n').encode() + data + b'\n</instruction_file>\n')
(out / 'after-only-super-design-identity.json').write_text(json.dumps({
    'sourceHead': head, 'sourceTree': tree, 'path': guide, 'sha256': sha(data), 'bytes': len(data),
    'scope': 'Full additional current guide for same five after respondents supplementary G-M, including L/M; no before comparison or extra independent samples.'}, indent=2) + '\n')
