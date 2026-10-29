import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { loginDemo, OTHER_USER } from '../helpers/fixtures.js';
import { ForbiddenError, AuthError } from '../../src/core/errors.js';

async function demo() {
  const container = await createTestContainer({ withDemoHistory: true });
  await loginDemo(container.services);
  return container;
}

test('el cliente demo ve sus 2 productos digitales pagados', async () => {
  const { services } = await demo();
  const downloads = await services.downloads.listMyDownloads();
  assert.deepEqual(downloads.map(d => [d.producto.id, d.descargas]).sort(), [[16, 0], [6, 0]].sort());
  assert.ok(downloads.every(d => d.pedido.estado === 'PAGADO'));
});

test('registerDownload registra la descarga y devuelve la URL del archivo', async () => {
  const { services, collections } = await demo();
  const [first] = await services.downloads.listMyDownloads();
  const { url } = await services.downloads.registerDownload(first.detalle.id, 'Chrome en Windows');
  assert.equal(url, first.producto.urlArchivo);
  const [row] = await collections.descargas.findAll();
  assert.equal(row.dispositivo, 'Chrome en Windows');
  assert.equal((await services.downloads.listMyDownloads()).find(d => d.detalle.id === first.detalle.id).descargas, 1);
});

test('detalle ajeno o físico lanza ForbiddenError', async () => {
  const { services } = await demo();
  const [first] = await services.downloads.listMyDownloads();
  const detail = await services.orders.getMyOrder(1);
  await assert.rejects(services.downloads.registerDownload(detail.detalles[0].id, 'x'), ForbiddenError);
  await services.auth.logout();
  await services.auth.register(OTHER_USER);
  await assert.rejects(services.downloads.registerDownload(first.detalle.id, 'x'), ForbiddenError);
  assert.equal((await services.downloads.listMyDownloads()).length, 0);
});

test('pedido por transferencia pendiente no habilita descargas', async () => {
  const { services } = await demo();
  await services.cart.add(3);
  const { pedido } = await services.checkout.placeOrder({ metodoPago: 'TRANSFERENCIA', detallesPago: {}, comprobante: { tipo: 'BOLETA' } });
  const pendingDetail = (await services.orders.getMyOrder(pedido.id)).detalles[0];
  assert.ok(!(await services.downloads.listMyDownloads()).some(d => d.producto.id === 3));
  await assert.rejects(services.downloads.registerDownload(pendingDetail.id, 'x'), ForbiddenError);
  assert.equal(await services.downloads.hasAccess(3), false);
});

test('hasAccess: comprado true, no comprado false, sin sesión false', async () => {
  const { services } = await demo();
  assert.equal(await services.downloads.hasAccess(16), true);
  assert.equal(await services.downloads.hasAccess(17), false);
  await services.auth.logout();
  assert.equal(await services.downloads.hasAccess(16), false);
  await assert.rejects(services.downloads.listMyDownloads(), AuthError);
});
