import { ConflictError, PaymentDeclinedError, ValidationError } from '../core/errors.js';
import { authorizePayment, BANK_ACCOUNT } from '../core/payment-gateway.js';
import { validateReceiptData } from '../core/validators.js';
import { lineTotal } from '../core/totals.js';
import { formatMoney } from '../core/money.js';
import { randomHex } from '../infra/crypto.js';

export const PAYMENT_DELAY_MS = 1500;

function assertCartReady(cart) {
  if (cart.lines.length === 0) throw new ConflictError('Tu carrito está vacío');
  const problem = cart.lines.find(line => line.problema);
  if (problem) throw new ConflictError(`Revisa tu carrito: ${problem.producto.nombre} — ${problem.problema}`);
}

export function createCheckoutService({ store, collections, services, deps }) {
  let processing = false;

  async function shippingAddress(cart, idDireccion) {
    if (!cart.tieneFisicos) return null;
    if (!idDireccion) throw new ValidationError('Elige una dirección de envío', { idDireccion: 'Elige una dirección de envío' });
    return services.addresses.get(idDireccion);
  }

  async function insertDetails(idPedido, lines) {
    for (const { producto, cantidad, precioUnitario } of lines) {
      await collections.detallesPedido.insert({
        idPedido, idProducto: producto.id, nombre: producto.nombre, tipoProducto: producto.tipoProducto,
        cantidad, precioUnitario, subtotal: lineTotal(precioUnitario, cantidad),
      });
    }
  }

  async function createOrder(user, cart, address, totals, payment, order) {
    const pedido = await collections.pedidos.insert({
      idUsuario: user.id, idDireccion: address?.id ?? null, fechaPedido: deps.now().toISOString(),
      subtotal: totals.subtotal, igv: totals.igv, costoEnvio: totals.costoEnvio, total: totals.total,
      estado: 'PENDIENTE_PAGO', tipoEnvio: cart.tieneFisicos ? 'DOMICILIO' : 'DIGITAL', metodoPago: order.metodoPago, datosComprobante: order.receipt,
    });
    await insertDetails(pedido.id, cart.lines);
    await collections.pagos.insert({
      idPedido: pedido.id, metodoPago: order.metodoPago, monto: totals.total, fechaPago: deps.now().toISOString(),
      estado: payment.estado, idTransaccion: payment.idTransaccion, respuesta: payment.respuesta,
    });
    return pedido;
  }

  async function notifyTransfer(pedido) {
    await services.mailbox.send(pedido.idUsuario, {
      asunto: `Pedido N.º ${pedido.id}: realiza tu transferencia`,
      cuerpo: `Transfiere ${formatMoney(pedido.total)} a ${BANK_ACCOUNT.banco}, cuenta ${BANK_ACCOUNT.cuenta} (CCI ${BANK_ACCOUNT.cci}) a nombre de ${BANK_ACCOUNT.titular}. Confirmaremos tu pedido al verificar el abono.`,
      enlace: `#/cuenta/pedidos/${pedido.id}`,
    });
  }

  async function persist(user, cart, address, totals, payment, order) {
    return store.transact(async () => {
      const pedido = await createOrder(user, cart, address, totals, payment, order);
      await services.cart.clear();
      if (payment.estado !== 'APROBADO') {
        await notifyTransfer(pedido);
        return { pedido, comprobante: null };
      }
      const comprobante = await services.fulfillment.fulfillPaidOrder(pedido.id);
      return { pedido: await collections.pedidos.findById(pedido.id), comprobante };
    });
  }

  async function charge({ idDireccion, metodoPago, detallesPago, comprobante }) {
    const user = await services.auth.requireUser();
    const receipt = validateReceiptData(comprobante);
    const cart = await services.cart.getCart();
    assertCartReady(cart);
    const address = await shippingAddress(cart, idDireccion);
    const totals = await services.cart.totals(address?.departamento ?? null);
    await deps.wait(PAYMENT_DELAY_MS);
    const payment = authorizePayment(metodoPago, detallesPago, totals.total, { now: deps.now, randomHex: bytes => randomHex(bytes, deps.random) });
    if (payment.estado === 'RECHAZADO') throw new PaymentDeclinedError('El pago fue rechazado', payment.respuesta);
    return persist(user, cart, address, totals, payment, { metodoPago, receipt });
  }

  async function placeOrder(order) {
    if (processing) throw new ConflictError('Tu pago ya se está procesando');
    processing = true;
    try {
      return await charge(order ?? {});
    } finally {
      processing = false;
    }
  }

  return { placeOrder };
}
