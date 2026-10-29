import { ConflictError } from '../core/errors.js';
import { nextShipmentState, trackingCode, SHIPMENT_DESCRIPTIONS } from '../core/shipment-state.js';
import { randomHex } from '../infra/crypto.js';

function customerMessage(pedido, envio) {
  if (envio.estado === 'ENVIADO') {
    return {
      asunto: `Pedido N.º ${pedido.id} en camino`,
      cuerpo: `Tu pedido salió con ${envio.empresa}. Código de seguimiento: ${envio.codigoSeguimiento}.`,
    };
  }
  return {
    asunto: `Pedido N.º ${pedido.id} entregado`,
    cuerpo: '¡Tu pedido fue entregado! Cuéntanos qué te pareció dejando una reseña del producto.',
  };
}

export function createShipmentService({ collections, services, deps }) {
  function transitionFields(estado, envio, fecha) {
    if (estado === 'ENVIADO') return { estado, fechaEnvio: fecha, codigoSeguimiento: envio.codigoSeguimiento ?? trackingCode(bytes => randomHex(bytes, deps.random)) };
    return { estado, fechaEntrega: fecha };
  }

  async function advance(idPedido) {
    await services.auth.requireAdmin();
    const pedido = await collections.pedidos.findById(idPedido);
    const envio = await collections.envios.findOneBy(e => e.idPedido === pedido.id);
    if (!envio) throw new ConflictError('Este pedido no tiene un envío físico en curso');
    const estado = nextShipmentState(envio.estado);
    const fecha = deps.now().toISOString();
    const updated = await collections.envios.update(envio.id, transitionFields(estado, envio, fecha));
    await collections.seguimientosEnvio.insert({ idEnvio: envio.id, estado, descripcion: SHIPMENT_DESCRIPTIONS[estado], fechaRegistro: fecha });
    await services.mailbox.send(pedido.idUsuario, { ...customerMessage(pedido, updated), enlace: `#/cuenta/pedidos/${pedido.id}` });
    return updated;
  }

  return { advance };
}
