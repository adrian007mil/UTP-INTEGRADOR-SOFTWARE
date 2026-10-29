import { DEMO_ACCOUNTS } from './seed-users.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEMO_ADDRESS = {
  alias: 'Casa', direccion: 'Jr. Las Begonias 245', distrito: 'San Isidro', provincia: 'Lima',
  departamento: 'Lima', referencia: 'Cerca al parque El Olivar', telefono: '987654321',
};
const DEMO_CARD = { numero: '4111111111111111', titular: 'LUCIA FERNANDEZ', vencimiento: '12/30', cvv: '123' };
const DEMO_WALLET = { proveedor: 'YAPE', celular: '987654321', codigoAprobacion: '123456' };
const BOLETA = { tipo: 'BOLETA' };
const DEMO_ORDERS = [
  { items: [[1, 1]], daysAgo: 20, advances: 2, pago: 'TARJETA' },
  { items: [[6, 1], [16, 1]], daysAgo: 9, advances: 0, pago: 'BILLETERA' },
  { items: [[8, 1]], daysAgo: 3, advances: 1, pago: 'TARJETA' },
];

const shift = (iso, days) => (iso ? new Date(new Date(iso).getTime() - days * MS_PER_DAY).toISOString() : iso);

async function buy(services, { items, pago }, idDireccion) {
  for (const [idProducto, cantidad] of items) await services.cart.add(idProducto, cantidad);
  const detallesPago = pago === 'TARJETA' ? DEMO_CARD : DEMO_WALLET;
  const { pedido } = await services.checkout.placeOrder({ idDireccion, metodoPago: pago, detallesPago, comprobante: BOLETA });
  return pedido;
}

async function backdate(collections, pedido, daysAgo) {
  await collections.pedidos.update(pedido.id, { fechaPedido: shift(pedido.fechaPedido, daysAgo) });
  for (const pago of await collections.pagos.findBy(p => p.idPedido === pedido.id)) await collections.pagos.update(pago.id, { fechaPago: shift(pago.fechaPago, daysAgo) });
  for (const c of await collections.comprobantes.findBy(x => x.idPedido === pedido.id)) await collections.comprobantes.update(c.id, { fechaEmision: shift(c.fechaEmision, daysAgo) });
  const envio = await collections.envios.findOneBy(e => e.idPedido === pedido.id);
  if (!envio) return;
  await collections.envios.update(envio.id, { fechaEnvio: shift(envio.fechaEnvio, daysAgo - 1), fechaEntrega: shift(envio.fechaEntrega, daysAgo - 3) });
  const steps = await collections.seguimientosEnvio.findBy(s => s.idEnvio === envio.id);
  for (const [index, step] of steps.entries()) await collections.seguimientosEnvio.update(step.id, { fechaRegistro: shift(step.fechaRegistro, daysAgo - index) });
}

async function login(services, account) {
  await services.auth.login(account.usuario, account.contrasena);
}

export async function seedDemoHistory({ services, collections }) {
  await login(services, DEMO_ACCOUNTS.cliente);
  const address = await services.addresses.add(DEMO_ADDRESS);
  const pedidos = [];
  for (const order of DEMO_ORDERS) pedidos.push(await buy(services, order, address.id));
  await services.auth.logout();
  await login(services, DEMO_ACCOUNTS.admin);
  for (const [index, order] of DEMO_ORDERS.entries()) {
    for (let step = 0; step < order.advances; step += 1) await services.orders.advanceShipment(pedidos[index].id);
  }
  await services.auth.logout();
  for (const [index, order] of DEMO_ORDERS.entries()) await backdate(collections, pedidos[index], order.daysAgo);
  for (const message of await collections.buzon.findAll()) await collections.buzon.update(message.id, { leido: true });
}
