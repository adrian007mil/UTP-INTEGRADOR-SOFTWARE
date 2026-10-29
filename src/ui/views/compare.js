import { html } from '../html.js';
import { $, delegate } from '../dom.js';
import { formatMoney } from '../../core/money.js';
import { productVisual } from '../components/product-card.js';
import { showError } from '../error-view.js';

const ROWS = [
  ['Precio', p => formatMoney(p.precio)], ['Marca', p => p.marca?.nombre], ['Categoría', p => p.categoria?.nombre],
  ['Familia sonora', p => p.familia || '—'], ['Disponibilidad', p => (p.stock > 0 ? `${p.stock} en stock` : 'Agotado')],
  ['Descripción', p => p.descripcion],
];

function table(products) {
  const head = products.map(p => html`<th><div class="compare-photo ${p.tono}">${productVisual(p)}</div><a href="#/producto/${p.id}">${p.nombre}</a>
    <button class="text-link" data-uncompare="${p.id}">Quitar</button></th>`);
  const body = ROWS.map(([label, value]) => html`<tr><th>${label}</th>${products.map(p => html`<td>${value(p)}</td>`)}</tr>`);
  const buy = html`<tr><th></th>${products.map(p => html`<td>${p.stock > 0 ? html`<button class="button button-dark" data-add="${p.id}">Agregar ＋</button>` : ''}</td>`)}</tr>`;
  return html`<div class="compare-table-wrap"><table class="compare-table"><thead><tr><th></th>${head}</tr></thead><tbody>${body}${buy}</tbody></table></div>`;
}

export default {
  title: 'Comparar instrumentos',
  access: 'public',
  async render(ctx) {
    const products = await ctx.services.preferences.listCompare();
    const body = products.length >= 2
      ? html`${table(products)}<button class="text-link" id="clearCompare">Limpiar comparación</button>`
      : html`<div class="empty-state"><span>⇄</span><h3>Elige al menos 2 instrumentos</h3><p>Usa el botón ⇄ de las tarjetas del catálogo (hasta 3).</p>
          ${products.length ? html`<p>Tienes 1 seleccionado: ${products[0].nombre}.</p>` : ''}<a class="button button-dark" href="#/catalogo">Ir al catálogo</a></div>`;
    return html`<section class="favorites-view"><div class="section-heading"><div><div class="eyebrow">COMPARADOR</div>
      <h2>Compara instrumentos<span class="brand-dot">.</span></h2><p>Revisa precio, marca y disponibilidad lado a lado.</p></div></div>${body}</section>`;
  },
  mount(root, ctx) {
    $('#clearCompare', root)?.addEventListener('click', async () => {
      await ctx.services.preferences.clearCompare();
      await ctx.refresh();
    });
    delegate(root, 'click', '[data-uncompare]', async (event, button) => {
      try {
        await ctx.services.preferences.toggleCompare(Number(button.dataset.uncompare));
        await ctx.refresh();
      } catch (error) {
        showError(error, ctx);
      }
    });
  },
};
