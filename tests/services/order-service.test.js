import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { ADDRESS, APPROVED_CARD, OTHER_USER, loginDemo, loginAdmin } from '../helpers/fixtures.js';
import { ForbiddenError, NotFoundError, AuthError } from '../../src/core/errors.js';

async function demoOrder(items = [[1, 1], [6, 1]]) {
  const container = await createTestContainer();
  const { services } = container;
  await loginDemo(services);
  const address = await services.addresses.add(ADDRESS);
  for (const [id, qty] of items) await services.cart.add(id, qty);
  const result = await services.checkout.placeOrder({ idDireccion: address.id, metodoPago: 'TARJETA', detallesPago: APPROVED_CARD, comprobante: { tipo: 'BOLETA' } });
  return { ...container, ...result, address };
}

test('getMyOrder devuelve pedido completo con detalles, pago, comprobante, envío, seguimientos y dirección', async () => {
  const { services, pedido, comprobante, address } = await demoOrder();
  const detail = await services.orders.getMyOrder(pedido.id);
  assert.equal(detail.pedido.id, pedido.id);
  assert.equal(detail.detalles.length, 2);
  assert.equal(detail.pago.estado, 'APROBADO');
  assert.equal(detail.comprobante.id, comprobante.id);
  assert.equal(detail.envio.estado, 'PROCESANDO');
  assert.equal(detail.seguimientos.length, 1);
  assert.equal(detail.direccion.id, address.id);
});

test('getMyOrder de pedido digital no tiene envío ni dirección', async () => {
  const { services, pedido } = await demoOrder([[6, 1]]);
  const detail = await services.orders.getMyOrder(pedido.id);
  assert.equal(detail.envio, null);
  assert.equal(detail.direccion, null);
  assert.deepEqual(detail.seguimientos, []);
});

test('otro cliente no puede ver el pedido; el admin sí', async () => {
  const { services, pedido, comprobante } = await demoOrder();
  await services.auth.logout();
  await services.auth.register(OTHER_USER);
  await assert.rejects(services.orders.getMyOrder(pedido.id), ForbiddenError);
  await assert.rejects(services.orders.getReceipt(comprobante.id), ForbiddenError);
  await services.auth.logout();
  await loginAdmin(services);
  assert.equal((await services.orders.getMyOrder(pedido.id)).pedido.id, pedido.id);
});

test('getReceipt arma el comprobante con cliente sin datos sensibles', async () => {
  const { services, comprobante } = await demoOrder();
  const receipt = await services.orders.getReceipt(comprobante.id);
  assert.equal(receipt.comprobante.serie, 'B001');
  assert.equal(receipt.detalles.length, 2);
  assert.equal(receipt.cliente.dni, '70000001');
  assert.ok(!('contrasenaHash' in receipt.cliente));
});

test('ids inexistentes lanzan NotFoundError y sin sesión AuthError', async () => {
  const { services } = await demoOrder();
  await assert.rejects(services.orders.getMyOrder(999), NotFoundError);
  await assert.rejects(services.orders.getReceipt(999), NotFoundError);
  await services.auth.logout();
  await assert.rejects(services.orders.getMyOrder(1), AuthError);
});
