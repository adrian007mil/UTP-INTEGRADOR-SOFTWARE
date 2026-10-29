import { html } from '../../html.js';
import { formatMoney } from '../../../core/money.js';
import { statusPill, formatDate } from '../../components/order-timeline.js';
import { accountLayout } from './account-nav.js';

function orderRow({ pedido, cantidadItems, estadoEnvio }) {
  const shipping = estadoEnvio ? statusPill(estadoEnvio) : html`<span class="muted">${pedido.tipoEnvio === 'DIGITAL' ? 'Digital' : '—'}</span>`;
  return html`<tr><td><a href="#/cuenta/pedidos/${pedido.id}">N.º ${pedido.id}</a></td><td>${formatDate(pedido.fechaPedido)}</td>
    <td>${cantidadItems}</td><td>${formatMoney(pedido.total)}</td><td>${statusPill(pedido.estado)}</td><td>${shipping}</td>
    <td><a class="text-link" href="#/cuenta/pedidos/${pedido.id}">Ver detalle ↗</a></td></tr>`;
}

export default {
  title: 'Mis pedidos',
  access: 'auth',
  async render(ctx) {
    const orders = await ctx.services.orders.listMyOrders();
    const content = orders.length
      ? html`<div class="admin-table-wrap"><table><thead><tr><th>PEDIDO</th><th>FECHA</th><th>ÍTEMS</th><th>TOTAL</th><th>PAGO</th><th>ENVÍO</th><th></th></tr></thead>
          <tbody>${orders.map(orderRow)}</tbody></table></div>`
      : html`<div class="empty-state"><span>▱</span><h3>Aún no tienes pedidos</h3><p>Cuando compres, verás aquí su estado.</p><a class="button button-dark" href="#/catalogo">Ir al catálogo</a></div>`;
    return accountLayout(ctx.path, 'Mis pedidos', content);
  },
};
