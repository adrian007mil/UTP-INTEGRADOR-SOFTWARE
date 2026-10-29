import { html } from '../../html.js';
import { formatMoney } from '../../../core/money.js';
import { BANK_ACCOUNT } from '../../../core/payment-gateway.js';
import { orderTimeline, statusPill, formatDate } from '../../components/order-timeline.js';
import { addressSummary } from '../../components/address-form.js';
import { accountLayout } from './account-nav.js';

function itemsBlock(detalles) {
  const rows = detalles.map(d => html`<tr><td><a href="#/producto/${d.idProducto}">${d.nombre}</a></td><td>${d.cantidad}</td>
    <td>${formatMoney(d.precioUnitario)}</td><td>${formatMoney(d.subtotal)}</td></tr>`);
  return html`<section class="order-block"><h2>Productos</h2><div class="admin-table-wrap"><table><thead><tr><th>PRODUCTO</th><th>CANT.</th><th>P. UNIT.</th><th>SUBTOTAL</th></tr></thead>
    <tbody>${rows}</tbody></table></div></section>`;
}

function totalsBlock(pedido) {
  return html`<dl class="summary-totals"><dt>Subtotal (sin IGV)</dt><dd>${formatMoney(pedido.subtotal)}</dd><dt>IGV (18 %)</dt><dd>${formatMoney(pedido.igv)}</dd>
    <dt>Envío</dt><dd>${formatMoney(pedido.costoEnvio)}</dd><dt class="total">Total</dt><dd class="total">${formatMoney(pedido.total)}</dd></dl>`;
}

function paymentBlock({ pedido, pago, comprobante }) {
  const pending = pedido.estado === 'PENDIENTE_PAGO'
    ? html`<p class="demo-notice">Transfiere ${formatMoney(pedido.total)} a ${BANK_ACCOUNT.banco}, cuenta ${BANK_ACCOUNT.cuenta}. Confirmaremos tu pedido al verificar el abono.</p>`
    : '';
  const receipt = comprobante ? html`<a class="button button-outline" href="#/comprobante/${comprobante.id}">Ver comprobante ${comprobante.serie}-${comprobante.numero}</a>` : '';
  return html`<section class="order-block"><h2>Pago</h2><p>${pago.metodoPago} · ${statusPill(pedido.estado)} · Transacción ${pago.idTransaccion}</p>${pending}${totalsBlock(pedido)}${receipt}</section>`;
}

function deliveryBlock(direccion, hasDigital) {
  if (!direccion) return html`<section class="order-block"><h2>Entrega</h2><p>Productos digitales: disponibles en <a class="text-link" href="#/cuenta/descargas">Mis descargas</a> una vez confirmado el pago.</p></section>`;
  return html`<section class="order-block"><h2>Entrega</h2><p class="address-card">${addressSummary(direccion)}</p>
    ${hasDigital ? html`<p>Los productos digitales están en <a class="text-link" href="#/cuenta/descargas">Mis descargas</a>.</p>` : ''}</section>`;
}

export default {
  title: 'Detalle del pedido',
  access: 'auth',
  async render(ctx) {
    const detail = await ctx.services.orders.getMyOrder(ctx.params.id);
    const { pedido, detalles, envio, seguimientos, direccion } = detail;
    ctx.pageTitle = `Pedido N.º ${pedido.id}`;
    const content = html`<p class="order-meta"><a class="text-link" href="#/cuenta/pedidos">← Mis pedidos</a> · Realizado el ${formatDate(pedido.fechaPedido)}</p>
      ${orderTimeline(envio, seguimientos)}${itemsBlock(detalles)}
      <div class="order-columns">${paymentBlock(detail)}${deliveryBlock(direccion, detalles.some(d => d.tipoProducto !== 'FISICO'))}</div>`;
    return accountLayout('/cuenta/pedidos', `Pedido N.º ${pedido.id}`, content);
  },
};
