import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { loginDemo, ADDRESS, APPROVED_CARD } from '../helpers/fixtures.js';

const stockOf = async (collections, id) => (await collections.inventario.findOneBy(i => i.idProducto === id)).stock;

test('reset vuelve a los datos de ejemplo: 3 pedidos del demo, stock semilla y sesión cerrada', async () => {
  const { services, collections } = await createTestContainer({ withDemoHistory: true });
  const seededStock = await stockOf(collections, 1);
  await loginDemo(services);
  const address = await services.addresses.add(ADDRESS);
  await services.cart.add(1, 2);
  await services.checkout.placeOrder({ idDireccion: address.id, metodoPago: 'TARJETA', detallesPago: APPROVED_CARD, comprobante: { tipo: 'BOLETA' } });
  await collections.productos.update(2, { precio: 1 });
  assert.equal((await services.orders.listMyOrders()).length, 4);

  await services.demo.reset();

  assert.equal(await services.auth.currentUser(), null);
  assert.equal(await stockOf(collections, 1), seededStock);
  assert.equal((await services.catalog.getProduct(2)).precio, 899);
  await loginDemo(services);
  assert.equal((await services.orders.listMyOrders()).length, 3);
});
