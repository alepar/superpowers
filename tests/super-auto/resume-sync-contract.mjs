// Mechanical instruction-contract checks only. Agent-behavior evaluations are separate.
// Catches the redesign resume paths drifting apart: a landed amend-checked replay must reach the
// same specs-committed boundary, which files missing work items and runs no Key abstractions
// sync (that stage and its sync were removed), and the postcommit retry policy must stay.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const sources = {
  auto: readFileSync(new URL('skills/super-auto/resume.md', root), 'utf8'),
  design: readFileSync(new URL('skills/super-design/SKILL.md', root), 'utf8'),
};
const bullet = (text, state) => text.match(new RegExp('^- `' + state + '`:[^\\n]*', 'm'))?.[0] ?? '';
const step3 = text => text.match(/^3\. \*\*Commit\*\*[\s\S]*?(?=^4\. \*\*File)/m)?.[0] ?? '';

function problems(texts) {
  const errors = [];
  for (const name of ['auto', 'design']) {
    const committed = bullet(texts[name], 'specs-committed');
    if (!/^- `specs-committed`: file\b/.test(committed)) {
      errors.push(`${name}: specs-committed must go straight to filing missing work items`);
    }
    if (/sync/i.test(committed)) errors.push(`${name}: specs-committed must not replay a sync`);
    const checked = bullet(texts[name], 'amend-checked');
    if (!checked.includes('continue at that bullet') || checked.includes('finish step 3 from after its commit')) {
      errors.push(`${name}: landed amend-checked must use the same specs-committed boundary`);
    }
    if (/sync/i.test(checked)) errors.push(`${name}: landed amend-checked must not run a sync`);
  }
  const commit = step3(texts.design);
  if (!commit) errors.push('producer: Amend Mode step 3 not found');
  if (/sync/i.test(commit)) errors.push('producer: Amend Mode step 3 must not run a sync');
  if (!texts.design.includes('A step from step 4 through step 6 that fails')) {
    errors.push('producer: postcommit degraded/applied policy must cover steps 4 through 6');
  }
  return errors;
}

let failures = 0;
let total = 0;
function test(name, fn) {
  total++;
  try { fn(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}: ${error.message}`); }
}

test('both actual replay paths share a sync-free boundary before filing', () => {
  assert.deepEqual(problems(sources), []);
});

// Independent literal positive control: confirms the checker accepts a complete contract
// even when unrelated prose differs. This does not execute an agent or a tracker.
const positive = {
  auto: '- `amend-checked`: landed: rewrite state and continue at that bullet.\n' +
    '- `specs-committed`: file only the missing items.\n',
  design: '- `amend-checked`: landed: rewrite state and continue at that bullet.\n' +
    '- `specs-committed`: file the missing items.\n' +
    '3. **Commit** specs; state `specs-committed`.\n' +
    '4. **File** missing items.\nA step from step 4 through step 6 that fails is retried.\n',
};
test('literal complete contract is accepted', () => assert.deepEqual(problems(positive), []));
for (const name of ['auto', 'design']) {
  test(`${name}: a resurrected sync in specs-committed is detected`, () => {
    const changed = { ...positive, [name]: positive[name].replace(
      '`specs-committed`: file', '`specs-committed`: first replay the Key Abstractions sync, then file') };
    assert.ok(problems(changed).some(e => e.startsWith(`${name}: specs-committed`)));
  });
  test(`${name}: sync repeated in amend-checked before the common boundary is detected`, () => {
    const changed = { ...positive, [name]: positive[name].replace('landed: rewrite state',
      'landed: finish step 3 from after its commit, rewrite state') };
    assert.ok(problems(changed).some(e => e.startsWith(`${name}: landed amend-checked`)));
  });
}
for (const [name, before, after, error] of [
  ['sync restored in the commit step', 'state `specs-committed`.',
    'state `specs-committed`. Then run the Key Abstractions sync.', 'step 3 must not run a sync'],
  ['postcommit policy lost', 'A step from step 4 through step 6 that fails',
    'A failing later step', 'postcommit'],
]) {
  test(name, () => {
    assert.ok(problems({ ...positive, design: positive.design.replace(before, after) })
      .some(e => e.includes(error)));
  });
}
console.log(`${total - failures} passed / ${failures} failed`);
if (failures) process.exitCode = 1;
