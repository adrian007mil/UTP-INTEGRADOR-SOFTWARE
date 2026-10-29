import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { fieldsOfAsync } from '../helpers/assertions.js';
import { loginAdmin, loginDemo } from '../helpers/fixtures.js';
import { ConflictError, ForbiddenError, ValidationError } from '../../src/core/errors.js';

async function admin() {
  const container = await createTestContainer();
  await loginAdmin(container.services);
  return container;
}

test('list arma el árbol con conteo de productos', async () => {
  const { services } = await admin();
  const tree = await services.adminCategories.list();
  const cuerdas = tree.find(c => c.nombre === 'Cuerdas');
  assert.deepEqual(cuerdas.hijas.map(h => [h.nombre, h.totalProductos]), [['Guitarras', 2], ['Bajos', 1], ['Ukeleles', 1]]);
});

test('crear categoría y subcategoría; una sub-subcategoría lanza ValidationError', async () => {
  const { services } = await admin();
  const padre = await services.adminCategories.create({ nombre: 'Cuerdas frotadas', descripcion: 'Violines', idCategoriaPadre: '' });
  assert.equal(padre.idCategoriaPadre, null);
  const hija = await services.adminCategories.create({ nombre: 'Violines', descripcion: '', idCategoriaPadre: String(padre.id) });
  assert.equal(hija.idCategoriaPadre, padre.id);
  await assert.rejects(services.adminCategories.create({ nombre: 'Violines 4/4', idCategoriaPadre: String(hija.id) }), ValidationError);
});

test('nombre repetido entre hermanas lanza ConflictError y nombre corto ValidationError', async () => {
  const { services } = await admin();
  await assert.rejects(services.adminCategories.create({ nombre: 'guitarras', idCategoriaPadre: '1' }), ConflictError);
  assert.ok((await fieldsOfAsync(services.adminCategories.create({ nombre: 'x', idCategoriaPadre: '' }))).nombre);
});

test('update renombra y remove respeta productos e hijas', async () => {
  const { services } = await admin();
  const updated = await services.adminCategories.update(5, { nombre: 'Teclados y pianos', descripcion: 'Digitales' });
  assert.equal(updated.nombre, 'Teclados y pianos');
  await assert.rejects(services.adminCategories.remove(5), { name: 'ConflictError', message: 'La categoría tiene productos o subcategorías' });
  await assert.rejects(services.adminCategories.remove(1), ConflictError);
  const vacia = await services.adminCategories.create({ nombre: 'Accesorios', idCategoriaPadre: '' });
  await services.adminCategories.remove(vacia.id);
  assert.ok(!(await services.adminCategories.list()).some(c => c.id === vacia.id));
});

test('un cliente no puede administrar categorías', async () => {
  const { services } = await createTestContainer();
  await loginDemo(services);
  await assert.rejects(services.adminCategories.create({ nombre: 'Nueva', idCategoriaPadre: '' }), ForbiddenError);
});
