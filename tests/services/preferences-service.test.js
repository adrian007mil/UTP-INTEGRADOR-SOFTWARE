import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { loginDemo } from '../helpers/fixtures.js';
import { ConflictError, ForbiddenError, ValidationError } from '../../src/core/errors.js';
import { MAX_COMPARE } from '../../src/services/preferences-service.js';

test('favoritos: alternar y listar (invitado y usuario por separado)', async () => {
  const { services } = await createTestContainer();
  assert.equal(await services.preferences.toggleFavorite(1), true);
  assert.equal(await services.preferences.toggleFavorite(6), true);
  assert.deepEqual((await services.preferences.listFavorites()).map(p => p.id), [1, 6]);
  assert.equal(await services.preferences.toggleFavorite(1), false);
  assert.deepEqual(await services.preferences.flags(), { favoritos: [6], comparar: [] });
  await loginDemo(services);
  assert.deepEqual((await services.preferences.listFavorites()).map(p => p.id), []);
});

test('favorito de producto inexistente lanza NotFoundError y uno deshabilitado no se lista', async () => {
  const { services, collections } = await createTestContainer();
  await assert.rejects(services.preferences.toggleFavorite(999), { name: 'NotFoundError' });
  await services.preferences.toggleFavorite(2);
  await collections.productos.update(2, { estado: 'I' });
  assert.equal((await services.preferences.listFavorites()).length, 0);
});

test('comparar: hasta 3 instrumentos, solo físicos', async () => {
  const { services } = await createTestContainer();
  assert.equal(MAX_COMPARE, 3);
  for (const id of [1, 2, 5]) await services.preferences.toggleCompare(id);
  await assert.rejects(services.preferences.toggleCompare(8), { name: 'ConflictError', message: 'Puedes comparar hasta 3 instrumentos' });
  await assert.rejects(services.preferences.toggleCompare(6), ValidationError);
  assert.deepEqual((await services.preferences.listCompare()).map(p => p.id), [1, 2, 5]);
  assert.equal(await services.preferences.toggleCompare(2), false);
  await services.preferences.clearCompare();
  assert.equal((await services.preferences.listCompare()).length, 0);
});

test('capítulos: sin compra ForbiddenError; con compra alterna y calcula porcentaje', async () => {
  const { services } = await createTestContainer({ withDemoHistory: true });
  await loginDemo(services);
  await assert.rejects(services.preferences.toggleChapter(17, 0), ForbiddenError);
  await services.preferences.toggleChapter(16, 0);
  const progress = await services.preferences.toggleChapter(16, 3);
  assert.deepEqual(progress, { completados: [0, 3], porcentaje: 40 });
  assert.deepEqual(await services.preferences.toggleChapter(16, 0), { completados: [3], porcentaje: 20 });
  await assert.rejects(services.preferences.toggleChapter(16, 9), ValidationError);
});

test('el porcentaje de 2 de 4 capítulos es 50', async () => {
  const { services } = await createTestContainer({ withDemoHistory: true });
  await loginDemo(services);
  await services.cart.add(18);
  await services.checkout.placeOrder({ metodoPago: 'BILLETERA', detallesPago: { proveedor: 'PLIN', celular: '987654321', codigoAprobacion: '123456' }, comprobante: { tipo: 'BOLETA' } });
  await services.preferences.toggleChapter(18, 0);
  await services.preferences.toggleChapter(18, 1);
  assert.equal((await services.preferences.progress(18)).porcentaje, 50);
});

test('alternar dos veces quita el instrumento de la comparación', async () => {
  const { services } = await createTestContainer();
  assert.equal(await services.preferences.toggleCompare(1), true);
  assert.equal(await services.preferences.toggleCompare(1), false);
});
