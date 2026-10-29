import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStorage, resolveBrowserStorage } from '../../src/infra/storage.js';
import { createStore, STORAGE_PREFIX } from '../../src/infra/store.js';
import { StorageCorruptedError, ConflictError } from '../../src/core/errors.js';

test('el prefijo es omnimelody:v1:', () => { assert.equal(STORAGE_PREFIX, 'omnimelody:v1:'); });

test('write y read guardan JSON bajo el prefijo', () => {
  const s = createMemoryStorage();
  const store = createStore(s);
  store.write('productos', [{ id: 1 }]);
  assert.equal(s.getItem('omnimelody:v1:productos'), '[{"id":1}]');
  assert.deepEqual(store.read('productos', []), [{ id: 1 }]);
});

test('read devuelve el valor por defecto si la clave no existe', () => {
  assert.deepEqual(createStore(createMemoryStorage()).read('nada', []), []);
});

test('read lanza StorageCorruptedError con JSON inválido', () => {
  const s = createMemoryStorage();
  s.setItem('omnimelody:v1:productos', '{roto');
  assert.throws(() => createStore(s).read('productos', []), StorageCorruptedError);
});

test('transact revierte todo si falla', async () => {
  const store = createStore(createMemoryStorage());
  store.write('a', 1);
  await assert.rejects(store.transact(async () => {
    store.write('a', 2);
    store.write('b', 3);
    throw new ConflictError('x');
  }), ConflictError);
  assert.equal(store.read('a'), 1);
  assert.equal(store.read('b', null), null);
});

test('transact confirma los cambios si termina bien y devuelve su resultado', async () => {
  const store = createStore(createMemoryStorage());
  const result = await store.transact(async () => { store.write('a', 5); return 'ok'; });
  assert.equal(result, 'ok');
  assert.equal(store.read('a'), 5);
});

test('transact anidado se ejecuta dentro del externo y revierte junto', async () => {
  const store = createStore(createMemoryStorage());
  store.write('a', 1);
  await assert.rejects(store.transact(async () => {
    await store.transact(async () => store.write('a', 2));
    throw new ConflictError('falla externa');
  }));
  assert.equal(store.read('a'), 1);
});

test('clearAll solo borra claves del prefijo', () => {
  const s = createMemoryStorage();
  s.setItem('ajena', 'x');
  const store = createStore(s);
  store.write('a', 1);
  store.clearAll();
  assert.equal(s.getItem('ajena'), 'x');
  assert.equal(store.read('a', null), null);
});

test('resolveBrowserStorage cae a memoria si localStorage lanza', () => {
  const win = { get localStorage() { throw new Error('SecurityError'); } };
  const { storage, persistent } = resolveBrowserStorage(win);
  assert.equal(persistent, false);
  storage.setItem('k', 'v');
  assert.equal(storage.getItem('k'), 'v');
});

test('resolveBrowserStorage cae a memoria si la escritura falla por cuota', () => {
  const broken = createMemoryStorage();
  broken.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.equal(resolveBrowserStorage({ localStorage: broken }).persistent, false);
});

test('resolveBrowserStorage usa localStorage si funciona', () => {
  const ls = createMemoryStorage();
  const result = resolveBrowserStorage({ localStorage: ls });
  assert.equal(result.persistent, true);
  assert.equal(result.storage, ls);
});
