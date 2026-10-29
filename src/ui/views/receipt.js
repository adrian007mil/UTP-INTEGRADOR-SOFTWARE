import { html } from '../html.js';
import { $ } from '../dom.js';
import { formatMoney } from '../../core/money.js';

export const ISSUER = { razonSocial: 'OmniMelody S.A.C.', ruc: '20000000001', direccion: 'Av. Ejemplo 123, Lima — Perú (ficticia)' };
const TITLES = { BOLETA: 'BOLETA DE VENTA ELECTRÓNICA', FACTURA: 'FACTURA ELECTRÓNICA' };
const DATE_FORMAT = new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeStyle: 'short' });

function receiptHeader(comprobante) {
  return html`<header class="receipt-header"><div><div class="brand"><span class="brand-mark">♫</span><span>OmniMelody<span class="brand-dot">.</span></span></div>
      <p>${ISSUER.razonSocial}<br>${ISSUER.direccion}</p></div>
    <div class="receipt-id"><b>RUC ${ISSUER.ruc}</b><span>${TITLES[comprobante.tipo]}</span><b>${comprobante.serie}-${comprobante.numero}</b></div></header>`;
}

function customerBlock({ comprobante, cliente, pedido }) {
  const docLabel = comprobante.tipo === 'FACTURA' ? 'RUC' : 'DNI';
  return html`<dl class="receipt-customer"><dt>Cliente</dt><dd>${comprobante.razonSocial ?? `${cliente.nombres} ${cliente.apellidos}`}</dd>
    <dt>${docLabel}</dt><dd>${comprobante.documentoCliente}</dd><dt>Fecha de emisión</dt><dd>${DATE_FORMAT.format(new Date(comprobante.fechaEmision))}</dd>
    <dt>Pedido</dt><dd>N.º ${pedido.id} · ${pedido.metodoPago}</dd></dl>`;
}

function itemsTable(detalles) {
  const rows = detalles.map(d => html`<tr><td>${d.cantidad}</td><td>${d.nombre}</td><td>${formatMoney(d.precioUnitario)}</td><td>${formatMoney(d.subtotal)}</td></tr>`);
  return html`<table class="receipt-items"><thead><tr><th>CANT.</th><th>DESCRIPCIÓN</th><th>P. UNIT.</th><th>IMPORTE</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function totalsBlock(pedido) {
  return html`<dl class="receipt-totals"><dt>Op. gravada</dt><dd>${formatMoney(pedido.subtotal)}</dd><dt>IGV (18 %)</dt><dd>${formatMoney(pedido.igv)}</dd>
    <dt>Envío</dt><dd>${formatMoney(pedido.costoEnvio)}</dd><dt class="total">Importe total</dt><dd class="total">${formatMoney(pedido.total)}</dd></dl>`;
}

export default {
  title: 'Comprobante',
  access: 'auth',
  async render(ctx) {
    const receipt = await ctx.services.orders.getReceipt(ctx.params.id);
    ctx.pageTitle = `${receipt.comprobante.serie}-${receipt.comprobante.numero}`;
    return html`<section class="page-section receipt-page"><div class="receipt-actions no-print">
        <a class="text-link" href="#/cuenta/pedidos/${receipt.pedido.id}">← Volver al pedido</a>
        <button class="button button-dark" id="printReceipt">Imprimir / Guardar PDF</button></div>
      <article class="receipt">${receiptHeader(receipt.comprobante)}${customerBlock(receipt)}${itemsTable(receipt.detalles)}${totalsBlock(receipt.pedido)}
        <footer class="receipt-footer">Representación impresa de un comprobante electrónico <b>simulado</b> · Proyecto académico sin validez tributaria.</footer></article></section>`;
  },
  mount(root) {
    $('#printReceipt', root).addEventListener('click', () => window.print());
  },
};
