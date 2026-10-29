import { computeKpis, defaultRange, validateRange } from '../core/kpis.js';
import { salesReportRows, toCsv } from '../core/sales-report.js';

const RECENT_ORDERS = 5;

export function createDashboardService({ collections, services, deps }) {
  async function loadData() {
    const names = ['pedidos', 'envios', 'productos', 'inventario', 'usuarios', 'comprobantes', 'alertasStock'];
    const values = await Promise.all(names.map(name => collections[name].findAll()));
    return Object.fromEntries(names.map((name, i) => [name, values[i]]));
  }

  const resolveRange = rango => (rango ? validateRange(rango) : defaultRange(deps.now()));

  async function getDashboard(rango) {
    await services.auth.requireAdmin();
    const range = resolveRange(rango);
    const data = await loadData();
    const alertas = data.alertasStock.filter(a => a.estado === 'PENDIENTE')
      .map(alerta => ({ alerta, producto: data.productos.find(p => p.id === alerta.idProducto) }))
      .filter(item => item.producto);
    const recientes = (await services.orders.listAllOrders({})).slice(0, RECENT_ORDERS);
    return { rango: range, kpis: computeKpis(data, range), alertas, recientes };
  }

  async function markAlertAttended(id) {
    await services.auth.requireAdmin();
    return collections.alertasStock.update(id, { estado: 'ATENDIDA' });
  }

  async function exportSalesCsv(rango) {
    await services.auth.requireAdmin();
    const range = resolveRange(rango);
    const contenido = toCsv(salesReportRows(await loadData(), range));
    return { nombreArchivo: `ventas_${range.desde}_${range.hasta}.csv`, contenido };
  }

  return { getDashboard, markAlertAttended, exportSalesCsv };
}
