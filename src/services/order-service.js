import { ForbiddenError } from '../core/errors.js';
import { publicUser } from './auth-service.js';

export function createOrderService({ collections, services }) {
  async function authorizedOrder(idPedido) {
    const user = await services.auth.requireUser();
    const pedido = await collections.pedidos.findById(idPedido);
    if (pedido.idUsuario !== user.id && user.rol !== 'ADMIN') throw new ForbiddenError('Este pedido pertenece a otra cuenta');
    return pedido;
  }

  async function orderDetail(pedido) {
    const [detalles, pago, comprobante, envio] = await Promise.all([
      collections.detallesPedido.findBy(d => d.idPedido === pedido.id),
      collections.pagos.findOneBy(p => p.idPedido === pedido.id),
      collections.comprobantes.findOneBy(c => c.idPedido === pedido.id),
      collections.envios.findOneBy(e => e.idPedido === pedido.id),
    ]);
    const seguimientos = envio ? await collections.seguimientosEnvio.findBy(s => s.idEnvio === envio.id) : [];
    const direccion = pedido.idDireccion ? await collections.direcciones.findOneBy(d => d.id === pedido.idDireccion) : null;
    return { pedido, detalles, pago, comprobante: comprobante ?? null, envio: envio ?? null, seguimientos, direccion: direccion ?? null };
  }

  async function getMyOrder(idPedido) {
    return orderDetail(await authorizedOrder(idPedido));
  }

  async function getReceipt(idComprobante) {
    const comprobante = await collections.comprobantes.findById(idComprobante);
    const detail = await getMyOrder(comprobante.idPedido);
    const cliente = publicUser(await collections.usuarios.findById(detail.pedido.idUsuario));
    return { ...detail, comprobante, cliente };
  }

  return { getMyOrder, getReceipt, orderDetail, authorizedOrder };
}
