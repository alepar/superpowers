import assert from 'node:assert/strict';
import {nonnegativeCount} from './counter.mjs';
assert.equal(nonnegativeCount(3), 3);
assert.equal(nonnegativeCount(-1), 0, 'negative counts must clamp to zero');
console.log('nonnegative-count: passed');
