import { html } from '../../html.js';
import { $, delegate } from '../../dom.js';
import { formatMoney } from '../../../core/money.js';
import { statusPill, formatDate } from '../../components/order-timeline.js';
import { showError } from '../../error-view.js';
import { adminLayout } from './admin-layout.js';

function metric(label, value, note, tone = '') {
  return html`<article><span>${label}</span><b class="${tone}">${value}</b><small>${note}</small></article>`;
}

function metrics(kpis) {
  return html`<div class="metrics">${metric('VENTAS DEL PERIODO', formatMoney(kpis.ventasPeriodo), `${kpis.pedidosPagados} pedidos pagados`)}
    ${metric('TICKET PROMEDIO', formatMoney(kpis.ticketPromedio), 'Por pedido pagado')}
    ${metric('PEDIDOS PENDIENTES', String(kpis.pedidosPendientes), 'Pagos o envíos por atender')}
    ${metric('STOCK BAJO', String(kpis.stockBajo), `${kpis.productosActivos} productos activos`, kpis.stockBajo ? 'warning-text' : '')}</div>`;
}

function rangeForm({ desde, hasta }) {
  return html`<form class="admin-filters range-form" id="rangeForm"><label class="filter-select"><span>Desde</span><input type="date" name="desde" value="${desde}"></label>
    <label class="filter-select"><span>Hasta</span><input type="date" name="hasta" value="${hasta}"></label>
    <button class="button button-outline" type="submit">Aplicar</button><button class="button button-dark" type="button" id="exportCsv">Descargar reporte CSV ↓</button></form>`;
}

function alertsBlock(alertas) {
  const items = alertas.map(({ alerta, producto }) => html`<li><span><b>${producto.nombre}</b><small>Stock ${alerta.stockActual} · mínimo ${alerta.stockMinimo} · ${formatDate(alerta.fechaAlerta)}</small></span>
    <span class="row-actions"><a class="text-link" href="#/admin/productos/${producto.id}">Reponer</a><button class="text-link" data-attend="${alerta.id}">Marcar atendida</button></span></li>`);
  const body = alertas.length ? html`<ul class="alert-list">${items}</ul>` : html`<p class="muted">Sin alertas pendientes.</p>`;
  return html`<section class="admin-table-wrap admin-card"><div class="table-title"><h3>Alertas de inventario</h3></div>${body}</section>`;
}

function recentBlock(recientes) {
  const rows = recientes.map(({ pedido, cliente, estadoEnvio }) => html`<tr><td>N.º ${pedido.id}</td><td>${cliente.nombres} ${cliente.apellidos}</td>
    <td>${formatMoney(pedido.total)}</td><td>${statusPill(pedido.estado)}</td><td>${estadoEnvio ? statusPill(estadoEnvio) : '—'}</td></tr>`);
  return html`<section class="admin-table-wrap admin-card"><div class="table-title"><h3>Pedidos recientes</h3><a class="text-link" href="#/admin/pedidos">Ver todos ↗</a></div>
    <table><thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>TOTAL</th><th>PAGO</th><th>ENVÍO</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

function downloadText(nombreArchivo, contenido) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: nombreArchivo });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const rangeFromQuery = query => (query.get('desde') ? { desde: query.get('desde'), hasta: query.get('hasta') } : undefined);

export default {
  title: 'Panel de administración',
  access: 'admin',
  async render(ctx) {
    const { rango, kpis, alertas, recientes } = await ctx.services.dashboard.getDashboard(rangeFromQuery(ctx.query));
    const actions = html`<a class="button button-dark" href="#/admin/productos/nuevo">＋ Nuevo producto</a>`;
    return adminLayout(ctx.path, { title: 'Panel de administración', actions },
      html`${rangeForm(rango)}${metrics(kpis)}<div class="admin-columns">${alertsBlock(alertas)}${recentBlock(recientes)}</div>
        <p class="admin-reset"><button class="text-link" data-reset-demo>Restablecer datos de demo</button></p>`);
  },
  mount(root, ctx) {
    const form = $('#rangeForm', root);
    const currentRange = () => Object.fromEntries(new FormData(form));
    form.addEventListener('submit', event => {
      event.preventDefault();
      ctx.navigate(`#/admin?${new URLSearchParams(currentRange()).toString()}`);
    });
    $('#exportCsv', root).addEventListener('click', async () => {
      try {
        const { nombreArchivo, contenido } = await ctx.services.dashboard.exportSalesCsv(currentRange());
        downloadText(nombreArchivo, contenido);
      } catch (error) {
        showError(error, ctx);
      }
    });
    delegate(root, 'click', '[data-attend]', async (event, button) => {
      try {
        await ctx.services.dashboard.markAlertAttended(Number(button.dataset.attend));
        await ctx.refresh();
      } catch (error) {
        showError(error, ctx);
      }
    });
  },
};
