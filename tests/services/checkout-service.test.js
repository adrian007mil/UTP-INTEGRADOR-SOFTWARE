import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { fieldsOfAsync } from '../helpers/assertions.js';
import { ADDRESS, APPROVED_CARD, DECLINED_CARD, loginDemo } from '../helpers/fixtures.js';
import { PaymentDeclinedError, ConflictError, AuthError } from '../../src/core/errors.js';
import { PAYMENT_DELAY_MS } from '../../src/services/checkout-service.js';

const BOLETA = { tipo: 'BOLETA' };

async function readyToBuy(options) {
  const container = await createTestContainer(options);
  await loginDemo(container.services);
  const address = await container.services.addresses.add(ADDRESS);
  return { ...container, address };
}

async function counts(collections) {
  const names = ['pedidos', 'detallesPedido', 'pagos', 'comprobantes', 'envios', 'buzon'];
  const entries = await Promise.all(names.map(async n => [n, (await collections[n].findAll()).length]));
  return Object.fromEntries(entries);
}

const stockOf = async (collections, idProducto) => (await collections.inventario.findOneBy(i => i.idProducto === idProducto)).stock;

test('compra aprobada: pedido PAGADO, stock descontado, comprobante, envío y mensaje', async () => {
  const { services, collections, address } = await readyToBuy();
  await services.cart.add(1, 2);
  await services.cart.add(6);
  const { pedido, comprobante } = await services.checkout.placeOrder({ idDireccion: address.id, metodoPago: 'TARJETA', detallesPago: APPROVED_CARD, comprobante: BOLETA });
  assert.equal(pedido.estado, 'PAGADO');
  assert.equal(pedido.total, 489 * 2 + 29 + 15);
  assert.equal(pedido.costoEnvio, 15);
  assert.equal(pedido.tipoEnvio, 'DOMICILIO');
  assert.equal(await stockOf(collections, 1), 5);
  assert.equal(`${comprobante.serie}-${comprobante.numero}`, 'B001-00000001');
  assert.equal(comprobante.documentoCliente, '70000001');
  const envio = await collections.envios.findOneBy(e => e.idPedido === pedido.id);
  assert.equal(envio.estado, 'PROCESANDO');
  assert.equal((await collections.seguimientosEnvio.findBy(s => s.idEnvio === envio.id)).length, 1);
  const detalles = await collections.detallesPedido.findBy(d => d.idPedido === pedido.id);
  assert.deepEqual(detalles.map(d => [d.idProducto, d.cantidad, d.precioUnitario, d.subtotal, d.nombre]),
    [[1, 2, 489, 978, 'Guitarra acústica Sienna'], [6, 1, 29, 29, 'Guía práctica de guitarra']]);
  assert.equal((await services.cart.getCart()).lines.length, 0);
  const mensajes = await services.mailbox.list();
  assert.equal(mensajes.length, 1);
  assert.match(mensajes[0].asunto, /Confirmación de compra — Pedido N\.º \d+/);
  assert.equal(mensajes[0].enlace, `#/comprobante/${comprobante.id}`);
});

test('tarjeta rechazada no deja pedido, pago, stock ni carrito modificados', async () => {
  const { services, collections, address } = await readyToBuy();
  await services.cart.add(1);
  const before = await counts(collections);
  await assert.rejects(services.checkout.placeOrder({ idDireccion: address.id, metodoPago: 'TARJETA', detallesPago: DECLINED_CARD, comprobante: BOLETA }),
    error => error instanceof PaymentDeclinedError && error.reason === 'Fondos insuficientes');
  assert.deepEqual(await counts(collections), before);
  assert.equal(await stockOf(collections, 1), 7);
  assert.equal((await services.cart.getCart()).lines.length, 1);
});

test('stock reducido por el admin antes de pagar → ConflictError sin escrituras', async () => {
  const { services, collections, address } = await readyToBuy();
  await services.cart.add(1, 3);
  const inv = await collections.inventario.findOneBy(i => i.idProducto === 1);
  await collections.inventario.update(inv.id, { stock: 2 });
  const before = await counts(collections);
  await assert.rejects(services.checkout.placeOrder({ idDireccion: address.id, metodoPago: 'TARJETA', detallesPago: APPROVED_CARD, comprobante: BOLETA }),
    error => error instanceof ConflictError && error.message.includes('Solo quedan 2 unidades'));
  assert.deepEqual(await counts(collections), before);
});

test('stock agotado durante la autorización del pago revierte todo', async () => {
  let collectionsRef;
  const wait = async () => {
    const inv = await collectionsRef.inventario.findOneBy(i => i.idProducto === 1);
    await collectionsRef.inventario.update(inv.id, { stock: 0 });
  };
  const { services, collections, address } = await readyToBuy({ wait });
  collectionsRef = collections;
  await services.cart.add(1);
  const before = await counts(collections);
  await assert.rejects(services.checkout.placeOrder({ idDireccion: address.id, metodoPago: 'TARJETA', detallesPago: APPROVED_CARD, comprobante: BOLETA }), ConflictError);
  assert.deepEqual(await counts(collections), before);
  assert.equal((await services.cart.getCart()).lines.length, 1);
});

test('solo digitales: costoEnvio 0, sin envío y sin dirección', async () => {
  const { services, collections } = await readyToBuy();
  await services.cart.add(6);
  await services.cart.add(14);
  const { pedido } = await services.checkout.placeOrder({ metodoPago: 'BILLETERA', detallesPago: { proveedor: 'YAPE', celular: '987654321', codigoAprobacion: '123456' }, comprobante: BOLETA });
  assert.equal(pedido.costoEnvio, 0);
  assert.equal(pedido.tipoEnvio, 'DIGITAL');
  assert.equal(pedido.idDireccion, null);
  assert.equal(pedido.total, 29 + 69);
  assert.equal((await collections.envios.findAll()).length, 0);
});

test('con físicos exige dirección propia', async () => {
  const { services } = await readyToBuy();
  await services.cart.add(1);
  const fields = await fieldsOfAsync(services.checkout.placeOrder({ metodoPago: 'TARJETA', detallesPago: APPROVED_CARD, comprobante: BOLETA }));
  assert.ok(fields.idDireccion);
  await assert.rejects(services.checkout.placeOrder({ idDireccion: 999, metodoPago: 'TARJETA', detallesPago: APPROVED_CARD, comprobante: BOLETA }), { name: 'NotFoundError' });
});

test('transferencia: PENDIENTE_PAGO, stock intacto, sin comprobante y mensaje con datos bancarios', async () => {
  const { services, collections, address } = await readyToBuy();
  await services.cart.add(1);
  const { pedido, comprobante } = await services.checkout.placeOrder({ idDireccion: address.id, metodoPago: 'TRANSFERENCIA', detallesPago: {}, comprobante: BOLETA });
  assert.equal(pedido.estado, 'PENDIENTE_PAGO');
  assert.equal(comprobante, null);
  assert.equal(await stockOf(collections, 1), 7);
  assert.equal((await collections.pagos.findOneBy(p => p.idPedido === pedido.id)).estado, 'PENDIENTE');
  const [mensaje] = await services.mailbox.list();
  assert.match(mensaje.asunto, /realiza tu transferencia/);
  assert.match(mensaje.cuerpo, /193-0000000-0-00/);
  assert.equal((await services.cart.getCart()).lines.length, 0);
});

test('dos placeOrder simultáneos crean un solo pedido', async () => {
  const { services, collections, address } = await readyToBuy();
  await services.cart.add(1);
  const order = { idDireccion: address.id, metodoPago: 'TARJETA', detallesPago: APPROVED_CARD, comprobante: BOLETA };
  const results = await Promise.allSettled([services.checkout.placeOrder(order), services.checkout.placeOrder(order)]);
  assert.deepEqual(results.map(r => r.status).sort(), ['fulfilled', 'rejected']);
  assert.equal(results.find(r => r.status === 'rejected').reason.message, 'Tu pago ya se está procesando');
  assert.equal((await collections.pedidos.findAll()).length, 1);
});

test('tras un rechazo se puede volver a pagar', async () => {
  const { services, address } = await readyToBuy();
  await services.cart.add(1);
  const order = { idDireccion: address.id, metodoPago: 'TARJETA', comprobante: BOLETA };
  await assert.rejects(services.checkout.placeOrder({ ...order, detallesPago: DECLINED_CARD }), PaymentDeclinedError);
  assert.equal((await services.checkout.placeOrder({ ...order, detallesPago: APPROVED_CARD })).pedido.estado, 'PAGADO');
});

test('stock que llega al mínimo crea una sola alerta pendiente', async () => {
  const { services, collections, address } = await readyToBuy();
  const order = { idDireccion: address.id, metodoPago: 'TARJETA', detallesPago: APPROVED_CARD, comprobante: BOLETA };
  const alertsBefore = (await collections.alertasStock.findBy(a => a.idProducto === 5)).length;
  await services.cart.add(5, 2);
  await services.checkout.placeOrder(order);
  await services.cart.add(5, 1);
  await services.checkout.placeOrder(order);
  assert.equal(await stockOf(collections, 5), 2);
  const alerts = await collections.alertasStock.findBy(a => a.idProducto === 5);
  assert.equal(alertsBefore, 0);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].estado, 'PENDIENTE');
});

test('factura sin RUC lanza ValidationError antes de cobrar', async () => {
  let charged = false;
  const { services, collections, address } = await readyToBuy({ wait: async () => { charged = true; } });
  await services.cart.add(1);
  const fields = await fieldsOfAsync(services.checkout.placeOrder({ idDireccion: address.id, metodoPago: 'TARJETA', detallesPago: APPROVED_CARD, comprobante: { tipo: 'FACTURA' } }));
  assert.ok(fields.ruc);
  assert.equal(charged, false);
  assert.equal((await collections.pedidos.findAll()).length, 0);
});

test('factura válida usa el RUC como documento', async () => {
  const { services, address } = await readyToBuy();
  await services.cart.add(8);
  const { comprobante } = await services.checkout.placeOrder({ idDireccion: address.id, metodoPago: 'TARJETA', detallesPago: APPROVED_CARD, comprobante: { tipo: 'FACTURA', ruc: '20123456789', razonSocial: 'Música S.A.C.' } });
  assert.deepEqual([comprobante.serie, comprobante.numero, comprobante.documentoCliente, comprobante.razonSocial], ['F001', '00000001', '20123456789', 'Música S.A.C.']);
});

test('carrito vacío o sin sesión fallan', async () => {
  const { services } = await readyToBuy();
  await assert.rejects(services.checkout.placeOrder({ metodoPago: 'TARJETA', detallesPago: APPROVED_CARD, comprobante: BOLETA }), { message: 'Tu carrito está vacío' });
  await services.auth.logout();
  await assert.rejects(services.checkout.placeOrder({ metodoPago: 'TARJETA', detallesPago: APPROVED_CARD, comprobante: BOLETA }), AuthError);
});

test('el retardo de la pasarela es de 1.5 s', () => { assert.equal(PAYMENT_DELAY_MS, 1500); });
