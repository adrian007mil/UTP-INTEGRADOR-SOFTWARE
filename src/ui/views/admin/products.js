import { html } from '../../html.js';
import { $, delegate } from '../../dom.js';
import { formatMoney } from '../../../core/money.js';
import { normalizeText } from '../../../core/catalog-filter.js';
import { showError } from '../../error-view.js';
import { adminLayout } from './admin-layout.js';

const TYPE_LABELS = { FISICO: 'Instrumento', DIGITAL: 'Documento', AUDIOVISUAL: 'Curso' };

function stockCell(p) {
  if (p.tipoProducto !== 'FISICO') return html`<span class="muted">∞</span>`;
  const low = p.stock <= p.stockMinimo;
  return html`<span class="${low ? 'warning-text' : ''}">${p.stock}</span> <small>mín. ${p.stockMinimo}</small>`;
}

function productRow(p) {
  const active = p.estado === 'A';
  return html`<tr class="${active ? '' : 'row-disabled'}"><td><a href="#/admin/productos/${p.id}">${p.nombre}</a><br><small>${p.marca?.nombre}</small></td>
    <td>${TYPE_LABELS[p.tipoProducto]}</td><td>${p.categoria?.nombre}</td><td>${formatMoney(p.precio)}</td><td>${stockCell(p)}</td>
    <td><span class="status-pill ${active ? 'ok' : 'warning'}">${active ? 'Activo' : 'Deshabilitado'}</span></td>
    <td class="row-actions"><a class="text-link" href="#/admin/productos/${p.id}">Editar</a>
      <button class="text-link" data-toggle="${p.id}" data-active="${active}">${active ? 'Deshabilitar' : 'Habilitar'}</button>
      <button class="text-link danger" data-remove="${p.id}">Eliminar</button></td></tr>`;
}

export default {
  title: 'Productos',
  access: 'admin',
  async render(ctx) {
    const query = normalizeText(ctx.query.get('q'));
    const products = (await ctx.services.adminProducts.list()).filter(p => !query || normalizeText(`${p.nombre} ${p.marca?.nombre}`).includes(query));
    const actions = html`<a class="button button-dark" href="#/admin/productos/nuevo">＋ Nuevo producto</a>`;
    return adminLayout(ctx.path, { title: 'Productos', actions }, html`<form class="admin-filters" id="productSearch"><label class="search-box"><span>⌕</span>
        <input name="q" type="search" value="${ctx.query.get('q') ?? ''}" placeholder="Buscar por nombre o marca"></label></form>
      <div class="admin-table-wrap"><table><thead><tr><th>PRODUCTO</th><th>TIPO</th><th>CATEGORÍA</th><th>PRECIO</th><th>STOCK</th><th>ESTADO</th><th></th></tr></thead>
        <tbody>${products.map(productRow)}</tbody></table></div>`);
  },
  mount(root, ctx) {
    $('#productSearch', root).addEventListener('submit', event => {
      event.preventDefault();
      ctx.navigate(`#/admin/productos?q=${encodeURIComponent(new FormData(event.target).get('q'))}`);
    });
    const run = action => async (event, button) => {
      try {
        await action(button);
        await ctx.refresh();
      } catch (error) {
        showError(error, ctx);
      }
    };
    delegate(root, 'click', '[data-toggle]', run(button => ctx.services.adminProducts.setActive(Number(button.dataset.toggle), button.dataset.active !== 'true')));
    delegate(root, 'click', '[data-remove]', run(async button => {
      if (!window.confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
      await ctx.services.adminProducts.remove(Number(button.dataset.remove));
      ctx.toast('Producto eliminado');
    }));
  },
};
