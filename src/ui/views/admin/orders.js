import { html } from '../../html.js';
import { $, delegate } from '../../dom.js';
import { formatMoney } from '../../../core/money.js';
import { statusPill, formatDate } from '../../components/order-timeline.js';
import { showError } from '../../error-view.js';
import { adminLayout } from './admin-layout.js';

const STATUS_FILTERS = [
  ['', 'Todos'], ['PENDIENTE_PAGO', 'Pendientes de pago'], ['PAGADO', 'Pagados'],
  ['PROCESANDO', 'Envío procesando'], ['ENVIADO', 'Envío en camino'], ['ENTREGADO', 'Entregados'],
];
const NEXT_STEP_LABEL = { PROCESANDO: 'Marcar enviado', ENVIADO: 'Marcar entregado' };

function actions({ pedido, estadoEnvio }) {
  const confirm = pedido.estado === 'PENDIENTE_PAGO' ? html`<button class="text-link" data-confirm="${pedido.id}">Confirmar transferencia</button>` : '';
  const advance = NEXT_STEP_LABEL[estadoEnvio] ? html`<button class="text-link" data-advance="${pedido.id}">${NEXT_STEP_LABEL[estadoEnvio]}</button>` : '';
  return html`${confirm}${advance}<a class="text-link" href="#/cuenta/pedidos/${pedido.id}">Detalle ↗</a>`;
}

function orderRow(summary) {
  const { pedido, cliente, estadoEnvio } = summary;
  return html`<tr><td>N.º ${pedido.id}</td><td>${formatDate(pedido.fechaPedido)}</td><td>${cliente.nombres} ${cliente.apellidos}<br><small>${cliente.email}</small></td>
    <td>${formatMoney(pedido.total)}</td><td>${pedido.metodoPago}</td><td>${statusPill(pedido.estado)}</td>
    <td>${estadoEnvio ? statusPill(estadoEnvio) : html`<span class="muted">Digital</span>`}</td><td class="row-actions">${actions(summary)}</td></tr>`;
}

function filtersForm(query) {
  const estado = query.get('estado') ?? '';
  return html`<form class="admin-filters" id="orderFilters"><label class="search-box"><span>⌕</span><input name="q" type="search" value="${query.get('q') ?? ''}" placeholder="Buscar por N.º, cliente o correo"></label>
    <label class="filter-select"><span>Estado:</span><select name="estado">${STATUS_FILTERS.map(([value, label]) => html`<option value="${value}" ${value === estado ? 'selected' : ''}>${label}</option>`)}</select></label></form>`;
}

export default {
  title: 'Pedidos',
  access: 'admin',
  async render(ctx) {
    const orders = await ctx.services.orders.listAllOrders({ estado: ctx.query.get('estado') ?? '', texto: ctx.query.get('q') ?? '' });
    const table = orders.length
      ? html`<div class="admin-table-wrap"><table><thead><tr><th>PEDIDO</th><th>FECHA</th><th>CLIENTE</th><th>TOTAL</th><th>MÉTODO</th><th>PAGO</th><th>ENVÍO</th><th></th></tr></thead>
          <tbody>${orders.map(orderRow)}</tbody></table></div>`
      : html`<div class="empty-state"><span>▱</span><h3>No hay pedidos con estos filtros</h3></div>`;
    return adminLayout(ctx.path, { title: 'Pedidos' }, html`${filtersForm(ctx.query)}${table}`);
  },
  mount(root, ctx) {
    const form = $('#orderFilters', root);
    const apply = () => ctx.navigate(`#/admin/pedidos?${new URLSearchParams(new FormData(form)).toString()}`);
    form.addEventListener('change', apply);
    form.addEventListener('submit', event => { event.preventDefault(); apply(); });
    const run = (action, message) => async (event, button) => {
      try {
        await action(Number(button.dataset.confirm ?? button.dataset.advance));
        ctx.toast(message);
        await ctx.refresh();
      } catch (error) {
        showError(error, ctx);
      }
    };
    delegate(root, 'click', '[data-confirm]', run(id => ctx.services.orders.confirmTransfer(id), 'Transferencia confirmada: pedido pagado'));
    delegate(root, 'click', '[data-advance]', run(id => ctx.services.orders.advanceShipment(id), 'Estado del envío actualizado'));
  },
};
