import { html } from '../html.js';
import { $, $$, setHtml } from '../dom.js';
import { handleSubmit } from '../components/form-errors.js';
import { addressFields, addressSummary } from '../components/address-form.js';
import { paymentSection, summaryView, testDataBox, readPayment } from './checkout-payment.js';
import { PaymentDeclinedError, ConflictError } from '../../core/errors.js';
import { showError } from '../error-view.js';

const PROCESSING_LABEL = 'Procesando pago…';

function addressOption(address, selectedId) {
  return html`<label class="address-option"><input type="radio" name="idDireccion" value="${address.id}" data-departamento="${address.departamento}"
    ${address.id === selectedId ? 'checked' : ''}><span>${addressSummary(address)}</span></label>`;
}

function deliverySection(addresses, selectedId) {
  const list = addresses.length
    ? addresses.map(a => addressOption(a, selectedId))
    : html`<p class="muted">Aún no tienes direcciones. Agrega una para calcular el envío.</p>`;
  return html`<section class="checkout-block"><h2><span>1</span> Entrega</h2><div class="address-options">${list}</div>
    <details class="new-address" ${addresses.length ? '' : 'open'}><summary>＋ Agregar una dirección</summary>
      <form id="newAddressForm" novalidate>${addressFields()}<button class="button button-outline" type="submit">Guardar dirección</button></form></details></section>`;
}

function emptyCheckout() {
  return html`<section class="page-section empty-state"><span>▱</span><h3>Tu carrito está vacío</h3>
    <p>Agrega productos antes de continuar con la compra.</p><a class="button button-dark" href="#/catalogo">Ir al catálogo</a></section>`;
}

async function refreshSummary(root, ctx) {
  const selected = $('input[name="idDireccion"]:checked', root);
  const totals = await ctx.services.cart.previewTotals(selected?.dataset.departamento ?? null);
  const summary = $('#checkoutSummary', root);
  setHtml(summary, summaryView(await ctx.services.cart.getCart(), totals));
  summary.dataset.total = totals.costoEnvio === null ? '' : String(totals.total);
}

function bindPaymentToggles(root) {
  const form = $('#checkoutForm', root);
  form.addEventListener('change', event => {
    if (event.target.name === 'metodoPago') $$('.pay-panel', root).forEach(panel => { panel.hidden = panel.dataset.panel !== event.target.value; });
    if (event.target.name === 'tipo') $('.invoice-fields', root).hidden = event.target.value !== 'FACTURA';
  });
}

async function submitOrder(form, root, ctx, data) {
  const submit = $('[type="submit"]', form);
  const label = submit.innerHTML;
  submit.textContent = PROCESSING_LABEL;
  $('#paymentError', root).textContent = '';
  try {
    const selected = $('input[name="idDireccion"]:checked', root);
    const totalEsperado = $('#checkoutSummary', root).dataset.total;
    const { pedido } = await ctx.services.checkout.placeOrder({ ...readPayment(data), idDireccion: selected ? Number(selected.value) : null, totalEsperado });
    ctx.navigate(`#/pedido/${pedido.id}/confirmacion`);
  } catch (error) {
    if (error instanceof PaymentDeclinedError) $('#paymentError', root).textContent = `Pago rechazado: ${error.reason}. Prueba con otro método.`;
    if (error instanceof ConflictError) await refreshSummary(root, ctx);
    throw error;
  } finally {
    if (submit.isConnected) submit.innerHTML = label;
  }
}

export default {
  title: 'Finalizar compra',
  access: 'auth',
  async render(ctx) {
    const cart = await ctx.services.cart.getCart();
    if (cart.lines.length === 0) return emptyCheckout();
    const addresses = cart.tieneFisicos ? await ctx.services.addresses.list() : [];
    const selectedId = addresses.find(a => a.predeterminada)?.id;
    return html`<section class="page-section checkout-page"><span class="eyebrow">FINALIZAR COMPRA</span><h1 class="page-title">Completa tu pedido<span class="brand-dot">.</span></h1>
      <div class="checkout-layout"><div class="checkout-main">${cart.tieneFisicos ? deliverySection(addresses, selectedId) : ''}
        <form id="checkoutForm" novalidate>${paymentSection()}<button class="button button-dark pay-button" type="submit">Pagar ahora <span>→</span></button></form></div>
        <aside class="checkout-aside"><div class="checkout-summary" id="checkoutSummary"></div>${testDataBox()}</aside></div></section>`;
  },
  mount(root, ctx) {
    const form = $('#checkoutForm', root);
    if (!form) return;
    refreshSummary(root, ctx).catch(error => showError(error, ctx));
    root.addEventListener('change', event => {
      if (event.target.name === 'idDireccion') refreshSummary(root, ctx).catch(error => showError(error, ctx));
    });
    bindPaymentToggles(root);
    const addressForm = $('#newAddressForm', root);
    if (addressForm) {
      handleSubmit(addressForm, ctx, async data => {
        const address = await ctx.services.addresses.add(data);
        await ctx.services.addresses.setDefault(address.id);
        ctx.toast('Dirección guardada');
        await ctx.refresh();
      });
    }
    handleSubmit(form, ctx, data => submitOrder(form, root, ctx, data));
  },
};
