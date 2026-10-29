import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { NotFoundError } from '../../src/core/errors.js';

test('listProducts devuelve vistas con marca, categoría y stock', async () => {
  const { services } = await createTestContainer();
  const list = await services.catalog.listProducts({});
  assert.equal(list.length, 21);
  const guitar = list.find(p => p.id === 1);
  assert.equal(guitar.marca.nombre, 'Cordoba');
  assert.equal(guitar.categoria.nombre, 'Guitarras');
  assert.equal(guitar.stock, 7);
  assert.equal(list.find(p => p.id === 3).stock, null);
  assert.equal(guitar.totalResenas, 0);
  assert.equal(guitar.calificacionPromedio, 0);
});

test('listProducts aplica filtros y orden', async () => {
  const { services } = await createTestContainer();
  const list = await services.catalog.listProducts({ texto: 'yamaha', orden: 'precio-asc' });
  assert.deepEqual(list.map(p => p.nombre), ['Flauta dulce soprano', 'Bajo eléctrico de 4 cuerdas']);
});

test('listProducts excluye inactivos y getProduct de inactivo lanza NotFoundError', async () => {
  const { services, collections } = await createTestContainer();
  await collections.productos.update(1, { estado: 'I' });
  assert.ok(!(await services.catalog.listProducts({})).some(p => p.id === 1));
  await assert.rejects(services.catalog.getProduct(1), NotFoundError);
});

test('getProduct de id inexistente lanza NotFoundError', async () => {
  const { services } = await createTestContainer();
  await assert.rejects(services.catalog.getProduct(999), NotFoundError);
  await assert.rejects(services.catalog.getProduct('abc'), NotFoundError);
});

test('listCategories arma el árbol de padres e hijas', async () => {
  const { services } = await createTestContainer();
  const tree = await services.catalog.listCategories();
  const cuerdas = tree.find(c => c.nombre === 'Cuerdas');
  assert.deepEqual(cuerdas.hijas.map(c => c.nombre), ['Guitarras', 'Bajos', 'Ukeleles']);
  assert.ok(tree.every(c => c.idCategoriaPadre === null));
});

test('listBrands devuelve marcas activas ordenadas', async () => {
  const { services } = await createTestContainer();
  const brands = await services.catalog.listBrands();
  assert.equal(brands[0].nombre, 'Audio-Technica');
  assert.equal(brands.length, 9);
});
