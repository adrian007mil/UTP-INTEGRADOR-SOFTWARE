import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startContainer } from '../../src/services/bootstrap.js';
import { createMemoryStorage } from '../../src/infra/storage.js';
import { StorageCorruptedError } from '../../src/core/errors.js';
import { createClock, createDeterministicRandom } from '../helpers/test-container.js';

const deps = () => ({ now: createClock().now, random: createDeterministicRandom(), wait: async () => {} });

function quotaStorage(limit) {
  const storage = createMemoryStorage();
  const setItem = storage.setItem;
  let writes = 0;
  storage.setItem = (key, value) => {
    writes += 1;
    if (writes > limit) throw new Error('QuotaExceededError');
    setItem(key, value);
  };
  return storage;
}

test('si el almacenamiento se llena al sembrar, sigue en memoria y avisa', async () => {
  const { container, persistent } = await startContainer({ storage: quotaStorage(5), persistent: true, ...deps() });
  assert.equal(persistent, false);
  assert.equal((await container.services.catalog.listProducts({})).length, 21);
});

test('con almacenamiento sano conserva la persistencia', async () => {
  const { persistent } = await startContainer({ storage: createMemoryStorage(), persistent: true, ...deps() });
  assert.equal(persistent, true);
});

test('los datos dañados se propagan para mostrar la pantalla de recuperación', async () => {
  const storage = createMemoryStorage();
  storage.setItem('omnimelody:v1:meta', '{roto');
  await assert.rejects(startContainer({ storage, persistent: true, ...deps() }), StorageCorruptedError);
});
