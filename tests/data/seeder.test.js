import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMemoryStorage } from '../../src/infra/storage.js';
import { createStore } from '../../src/infra/store.js';
import { createCollections } from '../../src/infra/collection.js';
import { COLLECTION_NAMES } from '../../src/data/collection-names.js';
import { ensureSeeded, SEED_VERSION } from '../../src/data/seeder.js';
import { DEMO_ACCOUNTS } from '../../src/data/seed-users.js';
import { hashPassword } from '../../src/infra/crypto.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const deps = { now: () => new Date('2026-11-02T15:00:00Z'), random: n => new Uint8Array(n).fill(7) };

async function seeded(options) {
  const store = createStore(createMemoryStorage());
  const collections = createCollections(store, COLLECTION_NAMES);
  await ensureSeeded(store, collections, deps, options);
  return { store, collections };
}

test('ensureSeeded carga 21 productos y conserva los ids del prototipo', async () => {
  const { collections } = await seeded();
  const productos = await collections.productos.findAll();
  assert.equal(productos.length, 21);
  assert.equal((await collections.productos.findById(1)).nombre, 'Guitarra acústica Sienna');
  assert.equal((await collections.productos.findById(4)).nombre, 'Ukelele soprano Marea');
  assert.equal((await collections.productos.findById(14)).tipoProducto, 'AUDIOVISUAL');
});

test('no guarda contraseñas en claro y las cuentas demo validan', async () => {
  const { collections } = await seeded();
  const usuarios = await collections.usuarios.findAll();
  assert.ok(usuarios.every(u => !('contrasena' in u)));
  const admin = usuarios.find(u => u.usuario === DEMO_ACCOUNTS.admin.usuario);
  assert.equal(admin.rol, 'ADMIN');
  assert.equal(admin.contrasenaHash, await hashPassword(DEMO_ACCOUNTS.admin.contrasena, admin.sal));
  assert.equal(usuarios.find(u => u.usuario === DEMO_ACCOUNTS.cliente.usuario).rol, 'CLIENTE');
});

test('ensureSeeded no vuelve a sembrar si la versión coincide', async () => {
  const { store, collections } = await seeded();
  await collections.productos.update(1, { precio: 1 });
  await ensureSeeded(store, collections, deps);
  assert.equal((await collections.productos.findById(1)).precio, 1);
  assert.equal(store.read('meta').seedVersion, SEED_VERSION);
});

test('ensureSeeded vuelve a sembrar si la versión cambió', async () => {
  const { store, collections } = await seeded();
  await collections.productos.update(1, { precio: 1 });
  store.write('meta', { seedVersion: 0 });
  await ensureSeeded(store, collections, deps);
  assert.equal((await collections.productos.findById(1)).precio, 489);
});

test('todo producto FISICO tiene inventario con stock mínimo 3', async () => {
  const { collections } = await seeded();
  const fisicos = await collections.productos.findBy(p => p.tipoProducto === 'FISICO');
  const inventario = await collections.inventario.findAll();
  assert.equal(fisicos.length, 8);
  for (const p of fisicos) {
    const inv = inventario.find(i => i.idProducto === p.id);
    assert.ok(inv, `sin inventario: ${p.nombre}`);
    assert.equal(inv.stockMinimo, 3);
  }
  assert.equal(inventario.find(i => i.idProducto === 1).stock, 7);
});

test('todo DIGITAL/AUDIOVISUAL tiene urlArchivo existente', async () => {
  const { collections } = await seeded();
  const digitales = await collections.productos.findBy(p => p.tipoProducto !== 'FISICO');
  assert.equal(digitales.length, 13);
  for (const p of digitales) {
    assert.ok(fs.existsSync(path.join(root, p.urlArchivo)), `falta ${p.urlArchivo}`);
  }
});

test('los AUDIOVISUAL tienen video y capítulos', async () => {
  const { collections } = await seeded();
  const cursos = await collections.productos.findBy(p => p.tipoProducto === 'AUDIOVISUAL');
  assert.equal(cursos.length, 7);
  assert.ok(cursos.every(c => /^[\w-]{11}$/.test(c.videoId) && c.capitulos.length >= 4));
});

test('las categorías y marcas de cada producto existen', async () => {
  const { collections } = await seeded();
  const categorias = await collections.categorias.findAll();
  const marcas = await collections.marcas.findAll();
  for (const p of await collections.productos.findAll()) {
    assert.ok(categorias.some(c => c.id === p.idCategoria), p.nombre);
    assert.ok(marcas.some(m => m.id === p.idMarca), p.nombre);
  }
  const cuerdas = categorias.find(c => c.nombre === 'Cuerdas');
  assert.deepEqual(categorias.filter(c => c.idCategoriaPadre === cuerdas.id).map(c => c.nombre), ['Guitarras', 'Bajos', 'Ukeleles']);
});

test('crea alertas para inventario semilla en o bajo el mínimo', async () => {
  const { collections } = await seeded();
  const alertas = await collections.alertasStock.findAll();
  assert.deepEqual(alertas.map(a => a.idProducto).sort((a, b) => a - b), [4, 7, 10]);
  assert.ok(alertas.every(a => a.estado === 'PENDIENTE'));
});

test('afterSeed se ejecuta solo al sembrar', async () => {
  let calls = 0;
  const { store, collections } = await seeded({ afterSeed: async () => { calls += 1; } });
  await ensureSeeded(store, collections, deps, { afterSeed: async () => { calls += 1; } });
  assert.equal(calls, 1);
});
