import { ConflictError } from '../core/errors.js';
import { nextReceiptNumber } from '../core/receipt-number.js';
import { COURIER_NAME, SHIPMENT_DESCRIPTIONS } from '../core/shipment-state.js';
import { formatMoney } from '../core/money.js';

export function createFulfillmentService({ collections, services, deps }) {
  const timestamp = () => deps.now().toISOString();

  async function raiseAlertIfLow(inventario) {
    if (inventario.stock > inventario.stockMinimo) return;
    const pending = await collections.alertasStock.findOneBy(a => a.idProducto === inventario.idProducto && a.estado === 'PENDIENTE');
    if (pending) return;
    await collections.alertasStock.insert({
      idProducto: inventario.idProducto, stockActual: inventario.stock, stockMinimo: inventario.stockMinimo, fechaAlerta: timestamp(), estado: 'PENDIENTE',
    });
  }

  async function discountStock(detalles) {
    for (const detalle of detalles.filter(d => d.tipoProducto === 'FISICO')) {
      const inventario = await collections.inventario.findOneBy(i => i.idProducto === detalle.idProducto);
      if (!inventario || inventario.stock < detalle.cantidad) throw new ConflictError(`Ya no hay stock suficiente de ${detalle.nombre}`);
      const updated = await collections.inventario.update(inventario.id, { stock: inventario.stock - detalle.cantidad, fechaActualizacion: timestamp() });
      await raiseAlertIfLow(updated);
    }
  }

  async function issueReceipt(pedido) {
    const { tipo, ruc, razonSocial } = pedido.datosComprobante;
    const usuario = await collections.usuarios.findById(pedido.idUsuario);
    const numbering = nextReceiptNumber(tipo, await collections.comprobantes.findAll());
    return collections.comprobantes.insert({
      idPedido: pedido.id, tipo, ...numbering, fechaEmision: timestamp(), monto: pedido.total,
      documentoCliente: ruc ?? usuario.dni, razonSocial: razonSocial ?? `${usuario.nombres} ${usuario.apellidos}`,
    });
  }

  async function createShipment(pedido) {
    const envio = await collections.envios.insert({
      idPedido: pedido.id, empresa: COURIER_NAME, codigoSeguimiento: null, estado: 'PROCESANDO', fechaEnvio: null, fechaEntrega: null,
    });
    await collections.seguimientosEnvio.insert({ idEnvio: envio.id, estado: 'PROCESANDO', descripcion: SHIPMENT_DESCRIPTIONS.PROCESANDO, fechaRegistro: timestamp() });
  }

  async function notifyPaid(pedido, comprobante, hasDigital) {
    const downloads = hasDigital ? ' Tus descargas ya están habilitadas en "Mis descargas".' : '';
    await services.mailbox.send(pedido.idUsuario, {
      asunto: `Confirmación de compra — Pedido N.º ${pedido.id}`,
      cuerpo: `Recibimos tu pago de ${formatMoney(pedido.total)}. Tu comprobante ${comprobante.serie}-${comprobante.numero} ya está disponible.${downloads}`,
      enlace: `#/comprobante/${comprobante.id}`,
    });
  }

  async function fulfillPaidOrder(idPedido) {
    const detalles = await collections.detallesPedido.findBy(d => d.idPedido === Number(idPedido));
    await discountStock(detalles);
    const pedido = await collections.pedidos.update(idPedido, { estado: 'PAGADO' });
    const comprobante = await issueReceipt(pedido);
    if (detalles.some(d => d.tipoProducto === 'FISICO')) await createShipment(pedido);
    await notifyPaid(pedido, comprobante, detalles.some(d => d.tipoProducto !== 'FISICO'));
    return comprobante;
  }

  return { fulfillPaidOrder };
}
