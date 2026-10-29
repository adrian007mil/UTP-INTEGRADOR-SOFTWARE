import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { loginDemo, loginAdmin, ADDRESS } from '../helpers/fixtures.js';
import { ForbiddenError, ConflictError } from '../../src/core/errors.js';

async function pendingTransfer(items = [[1, 1], [6, 1]]) {
  const container = await createTestContainer({ withDemoHistory: true });
  const { services } = container;
  await loginDemo(services);
  const address = await services.addresses.add(ADDRESS);
  for (const [id, qty] of items) await services.cart.add(id, qty);
  const { pedido } = await services.checkout.placeOrder({ idDireccion: address.id, metodoPago: 'TRANSFERENCIA', detallesPago: {}, comprobante: { tipo: 'BOLETA' } });
  await services.auth.logout();
  await loginAdmin(services);
  return { ...container, pedido };
}

const stockOf = async (collections, id) => (await collections.inventario.findOneBy(i => i.idProducto === id)).stock;

test('listAllOrders devuelve todos los pedidos con cliente, filtra por estado y texto', async () => {
  const { services } = await pendingTransfer();
  const all = await services.orders.listAllOrders({});
  assert.equal(all.length, 4);
  assert.equal(all[0].cliente.usuario, 'cliente.demo');
  assert.ok(!('contrasenaHash' in all[0].cliente));
  assert.deepEqual((await services.orders.listAllOrders({ estado: 'PENDIENTE_PAGO' })).map(o => o.pedido.estado), ['PENDIENTE_PAGO']);
  assert.equal((await services.orders.listAllOrders({ estado: 'ENVIADO' })).length, 1);
  assert.equal((await services.orders.listAllOrders({ texto: 'lucía' })).length, 4);
  assert.equal((await services.orders.listAllOrders({ texto: '2' })).map(o => o.pedido.id).includes(2), true);
  assert.equal((await services.orders.listAllOrders({ texto: 'nadie' })).length, 0);
});

test('confirmTransfer descuenta stock, emite comprobante, crea envío y habilita descargas', async () => {
  const { services, collections, pedido } = await pendingTransfer();
  const before = await stockOf(collections, 1);
  const comprobante = await services.orders.confirmTransfer(pedido.id);
  assert.equal(comprobante.serie, 'B001');
  assert.equal(await stockOf(collections, 1), before - 1);
  assert.equal((await collections.pedidos.findById(pedido.id)).estado, 'PAGADO');
  assert.equal((await collections.pagos.findOneBy(p => p.idPedido === pedido.id)).estado, 'APROBADO');
  assert.equal((await collections.envios.findOneBy(e => e.idPedido === pedido.id)).estado, 'PROCESANDO');
  await services.auth.logout();
  await loginDemo(services);
  assert.ok((await services.downloads.listMyDownloads()).some(d => d.pedido.id === pedido.id));
});

test('confirmar dos veces lanza ConflictError', async () => {
  const { services, pedido } = await pendingTransfer();
  await services.orders.confirmTransfer(pedido.id);
  await assert.rejects(services.orders.confirmTransfer(pedido.id), { name: 'ConflictError', message: 'Este pedido no está pendiente de pago' });
});

test('sin stock suficiente al confirmar, el pedido sigue pendiente y nada cambia', async () => {
  const { services, collections, pedido } = await pendingTransfer([[10, 3]]);
  const inv = await collections.inventario.findOneBy(i => i.idProducto === 10);
  await collections.inventario.update(inv.id, { stock: 1 });
  await assert.rejects(services.orders.confirmTransfer(pedido.id), ConflictError);
  assert.equal((await collections.pedidos.findById(pedido.id)).estado, 'PENDIENTE_PAGO');
  assert.equal((await collections.pagos.findOneBy(p => p.idPedido === pedido.id)).estado, 'PENDIENTE');
  assert.equal(await stockOf(collections, 10), 1);
  assert.equal((await collections.comprobantes.findBy(c => c.idPedido === pedido.id)).length, 0);
});

test('un cliente no puede usar las operaciones de admin', async () => {
  const { services, pedido } = await pendingTransfer();
  await services.auth.logout();
  await loginDemo(services);
  await assert.rejects(services.orders.listAllOrders({}), ForbiddenError);
  await assert.rejects(services.orders.confirmTransfer(pedido.id), ForbiddenError);
});
