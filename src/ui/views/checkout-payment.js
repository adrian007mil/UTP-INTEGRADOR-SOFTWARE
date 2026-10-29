import { html } from '../html.js';
import { formatMoney } from '../../core/money.js';
import { TEST_CARDS, WALLET_APPROVAL_CODE, BANK_ACCOUNT } from '../../core/payment-gateway.js';

const METHODS = [['TARJETA', 'Tarjeta crédito / débito'], ['BILLETERA', 'Yape / Plin'], ['TRANSFERENCIA', 'Transferencia bancaria']];

function field(label, name, attrs = '') {
  return html`<label class="form-field">${label}<input name="${name}" ${attrs}></label>`;
}

function cardFields() {
  return html`<div class="pay-panel" data-panel="TARJETA">${field('Número de tarjeta', 'numero', html`inputmode="numeric" autocomplete="cc-number" placeholder="4111 1111 1111 1111"`)}
    ${field('Titular', 'titular', html`autocomplete="cc-name"`)}
    <div class="form-grid">${field('Vencimiento (MM/AA)', 'vencimiento', html`placeholder="12/28" autocomplete="cc-exp"`)}${field('CVV', 'cvv', html`inputmode="numeric" maxlength="3" autocomplete="cc-csc"`)}</div></div>`;
}

function walletFields() {
  return html`<div class="pay-panel" data-panel="BILLETERA" hidden><label class="form-field">Billetera<select name="proveedor"><option value="YAPE">Yape</option><option value="PLIN">Plin</option></select></label>
    <div class="form-grid">${field('Celular', 'celular', html`inputmode="numeric" maxlength="9"`)}${field('Código de aprobación', 'codigoAprobacion', html`inputmode="numeric" maxlength="6"`)}</div></div>`;
}

function transferFields() {
  return html`<div class="pay-panel" data-panel="TRANSFERENCIA" hidden><p class="transfer-box">Transfiere a <b>${BANK_ACCOUNT.banco}</b> · Cuenta ${BANK_ACCOUNT.cuenta} · CCI ${BANK_ACCOUNT.cci} · ${BANK_ACCOUNT.titular}.
    Tu pedido quedará pendiente hasta que confirmemos el abono.</p></div>`;
}

export function testDataBox() {
  const cards = Object.entries(TEST_CARDS).map(([numero, card]) => html`<li><code>${numero.replace(/(\d{4})(?=\d)/g, '$1 ')}</code> ${card.descripcion}</li>`);
  return html`<aside class="demo-box test-data"><b>Datos de prueba (pasarela simulada)</b><ul>${cards}</ul>
    <p>Vencimiento futuro (p. ej. 12/28) y cualquier CVV de 3 dígitos. Yape/Plin: código <code>${WALLET_APPROVAL_CODE}</code>.</p></aside>`;
}

function receiptFields() {
  return html`<fieldset class="receipt-type"><legend>Comprobante</legend>
    <label><input type="radio" name="tipo" value="BOLETA" checked> Boleta</label><label><input type="radio" name="tipo" value="FACTURA"> Factura</label>
    <div class="form-grid invoice-fields" hidden>${field('RUC', 'ruc', html`inputmode="numeric" maxlength="11"`)}${field('Razón social', 'razonSocial')}</div></fieldset>`;
}

export function paymentSection() {
  const tabs = METHODS.map(([value, label], i) => html`<label class="pay-tab"><input type="radio" name="metodoPago" value="${value}" ${i === 0 ? 'checked' : ''}> ${label}</label>`);
  return html`<section class="checkout-block"><h2><span>2</span> Pago</h2><div class="pay-tabs">${tabs}</div>
    ${cardFields()}${walletFields()}${transferFields()}${receiptFields()}<p class="payment-error" id="paymentError" role="alert"></p></section>`;
}

export function summaryView(cart, totals) {
  const lines = cart.lines.map(l => html`<li><span>${l.cantidad} × ${l.producto.nombre}</span><b>${formatMoney(l.subtotalLinea)}</b></li>`);
  const shipping = cart.tieneFisicos && totals.costoEnvio === null ? 'Elige una dirección' : formatMoney(totals.costoEnvio ?? 0);
  return html`<h2>Resumen</h2><ul class="summary-lines">${lines}</ul>
    <dl class="summary-totals"><dt>Subtotal (sin IGV)</dt><dd>${formatMoney(totals.subtotal)}</dd><dt>IGV (18 %)</dt><dd>${formatMoney(totals.igv)}</dd>
      <dt>Envío</dt><dd>${shipping}</dd><dt class="total">Total</dt><dd class="total">${formatMoney(totals.total)}</dd></dl>`;
}

export function readPayment(data) {
  const detallesPago = {
    TARJETA: { numero: data.numero, titular: data.titular, vencimiento: data.vencimiento, cvv: data.cvv },
    BILLETERA: { proveedor: data.proveedor, celular: data.celular, codigoAprobacion: data.codigoAprobacion },
    TRANSFERENCIA: {},
  }[data.metodoPago] ?? {};
  return { metodoPago: data.metodoPago, detallesPago, comprobante: { tipo: data.tipo, ruc: data.ruc, razonSocial: data.razonSocial } };
}
