import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { loginDemo } from '../helpers/fixtures.js';

test('con historial, cliente.demo tiene 3 pedidos y la sesión queda cerrada', async () => {
  const { services, collections } = await createTestContainer({ withDemoHistory: true });
  assert.equal(await services.auth.currentUser(), null);
  await loginDemo(services);
  const orders = await services.orders.listMyOrders();
  assert.equal(orders.length, 3);
  assert.deepEqual(orders.map(o => o.estadoEnvio).sort(), [null, 'ENTREGADO', 'ENVIADO'].sort());
  assert.ok(orders.every(o => o.pedido.estado === 'PAGADO'));
  const fechas = orders.map(o => o.pedido.fechaPedido);
  assert.deepEqual([...fechas].sort().reverse(), fechas);
  assert.equal(new Set(fechas).size, 3);
  assert.equal(await services.mailbox.unreadCount(), 0);
  assert.equal((await collections.inventario.findOneBy(i => i.idProducto === 1)).stock, 6);
});

test('el historial no corre si no se pide', async () => {
  const { collections } = await createTestContainer();
  assert.equal((await collections.pedidos.findAll()).length, 0);
});
