import { ConflictError } from '../core/errors.js';
import { normalizeText } from '../core/catalog-filter.js';
import { publicUser } from './auth-service.js';

function matchesFilters({ pedido, estadoEnvio, cliente }, { estado, texto }) {
  if (estado && pedido.estado !== estado && estadoEnvio !== estado) return false;
  const query = normalizeText(texto);
  if (!query) return true;
  const haystack = normalizeText(`${pedido.id} ${cliente.nombres} ${cliente.apellidos} ${cliente.email} ${cliente.usuario}`);
  return haystack.includes(query);
}

export function createAdminOrderService({ store, collections, services, deps }) {
  async function listAllOrders(filters = {}) {
    await services.auth.requireAdmin();
    const [summaries, usuarios] = await Promise.all([services.orders.summarize(() => true), collections.usuarios.findAll()]);
    return summaries
      .map(summary => ({ ...summary, cliente: publicUser(usuarios.find(u => u.id === summary.pedido.idUsuario)) }))
      .filter(summary => matchesFilters(summary, filters));
  }

  async function confirmTransfer(idPedido) {
    await services.auth.requireAdmin();
    const pedido = await collections.pedidos.findById(idPedido);
    if (pedido.estado !== 'PENDIENTE_PAGO') throw new ConflictError('Este pedido no está pendiente de pago');
    return store.transact(async () => {
      const pago = await collections.pagos.findOneBy(p => p.idPedido === pedido.id);
      await collections.pagos.update(pago.id, { estado: 'APROBADO', fechaPago: deps.now().toISOString(), respuesta: 'Transferencia verificada por administración' });
      return services.fulfillment.fulfillPaidOrder(pedido.id);
    });
  }

  return { listAllOrders, confirmTransfer };
}
