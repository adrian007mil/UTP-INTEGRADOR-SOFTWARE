import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { ConflictError, ValidationError } from '../../src/core/errors.js';
import { DEMO_ACCOUNTS } from '../../src/data/seed-users.js';

const loginDemo = services => services.auth.login(DEMO_ACCOUNTS.cliente.usuario, DEMO_ACCOUNTS.cliente.contrasena);

test('add y getCart arman líneas con precio y subtotal', async () => {
  const { services } = await createTestContainer();
  await services.cart.add(1, 2);
  await services.cart.add(6);
  const cart = await services.cart.getCart();
  assert.equal(cart.cantidadTotal, 3);
  assert.equal(cart.tieneFisicos, true);
  assert.deepEqual(cart.lines.map(l => [l.producto.id, l.cantidad, l.precioUnitario, l.subtotalLinea, l.problema]), [[1, 2, 489, 978, null], [6, 1, 29, 29, null]]);
});

test('totals calcula IGV y envío según departamento', async () => {
  const { services } = await createTestContainer();
  await services.cart.add(1);
  await services.cart.add(3);
  assert.deepEqual(await services.cart.totals('Lima'), { totalProductos: 528, subtotal: 447.46, igv: 80.54, costoEnvio: 15, total: 543 });
  await assert.rejects(services.cart.totals(null), ValidationError);
});

test('setQuantity, remove y clear', async () => {
  const { services } = await createTestContainer();
  await services.cart.add(1);
  await services.cart.add(8);
  await services.cart.setQuantity(8, 4);
  await services.cart.remove(1);
  assert.deepEqual((await services.cart.getCart()).lines.map(l => [l.producto.id, l.cantidad]), [[8, 4]]);
  await services.cart.clear();
  assert.equal((await services.cart.getCart()).lines.length, 0);
});

test('add por encima del stock lanza ConflictError y no cambia el carrito', async () => {
  const { services } = await createTestContainer();
  await services.cart.add(10, 3);
  await assert.rejects(services.cart.add(10), { name: 'ConflictError', message: 'Solo quedan 3 unidades' });
  assert.equal((await services.cart.getCart()).lines[0].cantidad, 3);
});

test('add de producto agotado o inexistente falla', async () => {
  const { services } = await createTestContainer();
  await assert.rejects(services.cart.add(4), ConflictError);
  await assert.rejects(services.cart.add(999), { name: 'NotFoundError' });
});

test('getCart usa el precio vigente aunque cambie después de agregar', async () => {
  const { services, collections } = await createTestContainer();
  await services.cart.add(1);
  await collections.productos.update(1, { precio: 450 });
  const cart = await services.cart.getCart();
  assert.equal(cart.lines[0].precioUnitario, 450);
  assert.equal((await services.cart.totals('Lima')).totalProductos, 450);
});

test('getCart marca problema si el producto se deshabilitó o bajó el stock', async () => {
  const { services, collections } = await createTestContainer();
  await services.cart.add(1, 5);
  await services.cart.add(8);
  await collections.productos.update(8, { estado: 'I' });
  const inv = await collections.inventario.findOneBy(i => i.idProducto === 1);
  await collections.inventario.update(inv.id, { stock: 2 });
  const problems = (await services.cart.getCart()).lines.map(l => l.problema);
  assert.deepEqual(problems, ['Solo quedan 2 unidades', 'Ya no está disponible']);
});

test('getCart descarta productos eliminados del catálogo', async () => {
  const { services, collections } = await createTestContainer();
  await services.cart.add(3);
  await collections.productos.remove(3);
  assert.equal((await services.cart.getCart()).lines.length, 0);
});

test('al iniciar sesión se fusiona el carrito del invitado recortando al stock', async () => {
  const { services } = await createTestContainer();
  await loginDemo(services);
  await services.cart.add(10, 2);
  await services.cart.add(6);
  await services.auth.logout();
  assert.equal((await services.cart.getCart()).lines.length, 0);
  await services.cart.add(10, 2);
  await services.cart.add(6);
  await services.cart.add(3);
  await loginDemo(services);
  const lines = (await services.cart.getCart()).lines.map(l => [l.producto.id, l.cantidad]);
  assert.deepEqual(lines, [[10, 3], [6, 1], [3, 1]]);
  await services.auth.logout();
  assert.equal((await services.cart.getCart()).lines.length, 0);
});

test('previewTotals sin departamento deja el envío pendiente si hay físicos', async () => {
  const { services } = await createTestContainer();
  await services.cart.add(1);
  assert.deepEqual(await services.cart.previewTotals(null), { totalProductos: 489, subtotal: 414.41, igv: 74.59, costoEnvio: null, total: 489 });
  assert.equal((await services.cart.previewTotals('Cusco')).costoEnvio, 25);
  await services.cart.clear();
  await services.cart.add(6);
  assert.equal((await services.cart.previewTotals(null)).costoEnvio, 0);
});

test('no se puede volver a comprar un digital ya comprado ni uno con pago pendiente', async () => {
  const { services } = await createTestContainer({ withDemoHistory: true });
  await services.auth.login('cliente.demo', 'Demo2026!');
  await assert.rejects(services.cart.add(6), { name: 'ConflictError', message: 'Ya tienes este producto: está en Mis descargas' });
  await services.cart.add(3);
  await services.checkout.placeOrder({ metodoPago: 'TRANSFERENCIA', detallesPago: {}, comprobante: { tipo: 'BOLETA' } });
  await assert.rejects(services.cart.add(3), { name: 'ConflictError', message: 'Ya tienes un pedido pendiente de pago con este producto' });
  await services.cart.add(1);
});

test('al fusionar el carrito del invitado se descartan digitales ya comprados', async () => {
  const { services } = await createTestContainer({ withDemoHistory: true });
  await services.cart.add(6);
  await services.cart.add(3);
  await services.auth.login('cliente.demo', 'Demo2026!');
  assert.deepEqual((await services.cart.getCart()).lines.map(l => l.producto.id), [3]);
});
