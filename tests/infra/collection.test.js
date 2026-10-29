import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStorage } from '../../src/infra/storage.js';
import { createStore } from '../../src/infra/store.js';
import { createCollection } from '../../src/infra/collection.js';
import { NotFoundError } from '../../src/core/errors.js';

function setup() {
  const store = createStore(createMemoryStorage());
  return { store, productos: createCollection(store, 'productos'), marcas: createCollection(store, 'marcas') };
}

test('insert asigna ids consecutivos por colección', async () => {
  const { productos, marcas } = setup();
  assert.equal((await productos.insert({ nombre: 'a' })).id, 1);
  assert.equal((await productos.insert({ nombre: 'b' })).id, 2);
  assert.equal((await marcas.insert({ nombre: 'x' })).id, 1);
});

test('los ids no se reutilizan tras borrar', async () => {
  const { productos } = setup();
  await productos.insert({});
  const b = await productos.insert({});
  await productos.remove(b.id);
  assert.equal((await productos.insert({})).id, 3);
});

test('findById de id inexistente lanza NotFoundError', async () => {
  await assert.rejects(setup().productos.findById(99), NotFoundError);
});

test('findById acepta id como texto', async () => {
  const { productos } = setup();
  await productos.insert({ nombre: 'a' });
  assert.equal((await productos.findById('1')).nombre, 'a');
});

test('findBy y findOneBy filtran', async () => {
  const { productos } = setup();
  await productos.insert({ precio: 10 });
  await productos.insert({ precio: 20 });
  assert.equal((await productos.findBy(p => p.precio > 15)).length, 1);
  assert.equal((await productos.findOneBy(p => p.precio === 10)).id, 1);
  assert.equal(await productos.findOneBy(p => p.precio === 99), undefined);
});

test('update mezcla campos y conserva el id', async () => {
  const { productos } = setup();
  await productos.insert({ nombre: 'a', precio: 10 });
  const updated = await productos.update(1, { precio: 12, id: 50 });
  assert.deepEqual(updated, { id: 1, nombre: 'a', precio: 12 });
});

test('update y remove de id inexistente lanzan NotFoundError', async () => {
  const { productos } = setup();
  await assert.rejects(productos.update(9, {}), NotFoundError);
  await assert.rejects(productos.remove(9), NotFoundError);
});

test('los objetos devueltos no mutan el almacenamiento', async () => {
  const { productos } = setup();
  const created = await productos.insert({ tags: ['a'] });
  created.tags.push('b');
  const all = await productos.findAll();
  all[0].tags.push('c');
  assert.deepEqual((await productos.findById(1)).tags, ['a']);
});
