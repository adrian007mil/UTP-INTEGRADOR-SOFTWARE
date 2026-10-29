import { html } from '../html.js';
import { formatMoney } from '../../core/money.js';
import { BANK_ACCOUNT } from '../../core/payment-gateway.js';

function nextSteps({ pedido, comprobante, detalles }) {
  const hasDigital = detalles.some(d => d.tipoProducto !== 'FISICO');
  const receipt = comprobante ? html`<a class="button button-dark" href="#/comprobante/${comprobante.id}">Ver comprobante</a>` : '';
  const downloads = hasDigital && pedido.estado === 'PAGADO' ? html`<a class="button button-outline" href="#/cuenta/descargas">Mis descargas</a>` : '';
  return html`<div class="confirmation-actions">${receipt}<a class="button button-outline" href="#/cuenta/pedidos/${pedido.id}">Ver mi pedido</a>${downloads}</div>`;
}

function statusMessage({ pedido, envio }) {
  if (pedido.estado === 'PENDIENTE_PAGO') {
    return html`<p>Tu pedido quedó <b>pendiente de pago</b>. Transfiere ${formatMoney(pedido.total)} a ${BANK_ACCOUNT.banco}, cuenta ${BANK_ACCOUNT.cuenta}
      (CCI ${BANK_ACCOUNT.cci}). Te avisaremos en tu buzón cuando confirmemos el abono.</p>`;
  }
  const shipping = envio ? ' Estamos preparando tu envío; podrás seguirlo desde "Mis pedidos".' : '';
  return html`<p>Recibimos tu pago. Te enviamos la confirmación a tu buzón.${shipping}</p>`;
}

export default {
  title: 'Pedido confirmado',
  access: 'auth',
  async render(ctx) {
    const detail = await ctx.services.orders.getMyOrder(ctx.params.id);
    const { pedido, detalles } = detail;
    const pending = pedido.estado === 'PENDIENTE_PAGO';
    return html`<section class="page-section confirmation-page"><div class="confirmation-icon ${pending ? 'pending' : ''}">${pending ? '⏳' : '✓'}</div>
      <span class="eyebrow">${pending ? 'PEDIDO REGISTRADO' : 'COMPRA CONFIRMADA'}</span><h1 class="page-title">¡Gracias por tu compra!</h1>
      <p class="order-number">Pedido N.º <b>${pedido.id}</b> · Total ${formatMoney(pedido.total)}</p>${statusMessage(detail)}
      <ul class="confirmation-items">${detalles.map(d => html`<li>${d.cantidad} × ${d.nombre}<b>${formatMoney(d.subtotal)}</b></li>`)}</ul>
      ${nextSteps(detail)}</section>`;
  },
};
