import { ValidationError } from './errors.js';
import { toCents, fromCents } from './money.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const pad = value => String(value).padStart(2, '0');

export function toLocalDate(iso) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function defaultRange(now) {
  const today = toLocalDate(now.toISOString());
  return { desde: `${today.slice(0, 8)}01`, hasta: today };
}

export function validateRange({ desde, hasta } = {}) {
  const fields = {};
  if (!ISO_DATE.test(String(desde ?? ''))) fields.desde = 'Usa una fecha válida';
  if (!ISO_DATE.test(String(hasta ?? ''))) fields.hasta = 'Usa una fecha válida';
  else if (!fields.desde && desde > hasta) fields.hasta = 'La fecha final debe ser posterior a la inicial';
  if (Object.keys(fields).length) throw new ValidationError('Revisa el rango de fechas', fields);
  return { desde, hasta };
}

export function paidInRange(pedidos, { desde, hasta }) {
  return pedidos.filter(p => p.estado === 'PAGADO' && toLocalDate(p.fechaPedido) >= desde && toLocalDate(p.fechaPedido) <= hasta);
}

export function computeKpis({ pedidos, envios, productos, inventario }, rango) {
  const pagados = paidInRange(pedidos, rango);
  const salesCents = pagados.reduce((sum, p) => sum + toCents(p.total), 0);
  return {
    ventasPeriodo: fromCents(salesCents),
    pedidosPagados: pagados.length,
    ticketPromedio: pagados.length ? fromCents(Math.round(salesCents / pagados.length)) : 0,
    pedidosPendientes: pedidos.filter(p => p.estado === 'PENDIENTE_PAGO').length + envios.filter(e => e.estado !== 'ENTREGADO').length,
    productosActivos: productos.filter(p => p.estado === 'A').length,
    stockBajo: inventario.filter(i => i.stock <= i.stockMinimo).length,
  };
}
