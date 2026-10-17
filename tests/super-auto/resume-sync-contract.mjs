// Mechanical instruction-contract checks only. Agent-behavior evaluations are separate.
// Catches replay bypassing sync, repeating it in two states, or advancing after sync failure.
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
    if (!/Key Abstractions sync[\s\S]*then file/.test(committed)) {
      errors.push(`${name}: specs-committed must replay sync before filing`);
    }
    const checked = bullet(texts[name], 'amend-checked');
    if (!checked.includes('continue at that bullet') || checked.includes('finish step 3 from after its commit')) {
      errors.push(`${name}: landed amend-checked must use the same specs-committed boundary`);
    }
  }
  const sync = step3(texts.design);
  for (const required of ['committed sections', 'already completed', 'adopt existing owners',
    'retain `specs-committed`', 'before filing or advancing']) {
    if (!sync.includes(required)) errors.push(`producer sync missing: ${required}`);
  }
  if (!texts.design.includes('A step from step 4 through step 6 that fails')) {
    errors.push('producer: postcommit degraded/applied policy must exclude sync');
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

test('both actual replay paths share an idempotent sync boundary before filing', () => {
  assert.deepEqual(problems(sources), []);
});

// Independent literal positive control: confirms the checker accepts a complete contract
// even when unrelated prose differs. This does not execute an agent or a tracker sync.
const positive = {
  auto: '- `amend-checked`: landed: rewrite state and continue at that bullet.\n' +
    '- `specs-committed`: replay Key Abstractions sync, then file missing items.\n',
  design: '- `amend-checked`: landed: rewrite state and continue at that bullet.\n' +
    '- `specs-committed`: replay Key Abstractions sync, then file missing items.\n' +
    '3. **Commit** specs. Sync committed sections even if already completed; adopt existing owners. ' +
    'On failure retain `specs-committed`; retry before filing or advancing.\n' +
    '4. **File** missing items.\nA step from step 4 through step 6 that fails is retried.\n',
};
test('literal complete contract is accepted', () => assert.deepEqual(problems(positive), []));
for (const name of ['auto', 'design']) {
  test(`${name}: missing-sync replay is detected`, () => {
    const changed = { ...positive, [name]: positive[name].replace(
      'replay Key Abstractions sync, then file', 'file') };
    assert.ok(problems(changed).includes(`${name}: specs-committed must replay sync before filing`));
  });
  test(`${name}: sync repeated in amend-checked before the common boundary is detected`, () => {
    const changed = { ...positive, [name]: positive[name].replace('landed: rewrite state',
      'landed: finish step 3 from after its commit, rewrite state') };
    assert.ok(problems(changed).some(e => e.startsWith(`${name}: landed amend-checked`)));
  });
}
for (const [name, before, after, error] of [
  ['already-completed replay lost', 'already completed', 'first attempt', 'already completed'],
  ['owner adoption lost', 'adopt existing owners', 'create owners again', 'adopt existing owners'],
  ['failed sync advances state', 'retain `specs-committed`', 'write `applied`', 'retain `specs-committed`'],
  ['sync covered by degraded/applied policy', 'A step from step 4 through step 6 that fails',
    "A step from step 3’s sync through step 6 that fails", 'exclude sync'],
]) {
  test(name, () => {
    assert.ok(problems({ ...positive, design: positive.design.replace(before, after) })
      .some(e => e.includes(error)));
  });
}
console.log(`${total - failures} passed / ${failures} failed`);
if (failures) process.exitCode = 1;
