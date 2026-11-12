import test from 'node:test';
import assert from 'node:assert/strict';
import { asLegacyCollection } from '../src/lib/legacyCollection.js';

test('legacy collection supports direct arrays and page.items', () => {
  const rows = asLegacyCollection([{ id: 'a' }, { id: 'b' }]);
  assert.equal(Array.isArray(rows), true);
  assert.equal(rows.length, 2);
  assert.equal(rows.items, rows);
  assert.deepEqual(rows.map(x => x.id), ['a', 'b']);
  assert.equal(rows.find(x => x.id === 'b').id, 'b');
  assert.equal(JSON.stringify(rows), '[{"id":"a"},{"id":"b"}]');
});

test('legacy collection handles shaped responses, empty, and reused rows', () => {
  const wrapped = asLegacyCollection({ items: [{ id: 'c' }] });
  assert.equal(wrapped.items.length, 1);
  assert.equal(asLegacyCollection(wrapped), wrapped);
  assert.deepEqual(asLegacyCollection(null), []);
  assert.deepEqual(asLegacyCollection({ unexpected: 1 }), []);
});
