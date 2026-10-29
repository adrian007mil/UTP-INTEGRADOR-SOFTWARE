import { html } from '../../html.js';
import { $, $$ } from '../../dom.js';
import { handleSubmit } from '../../components/form-errors.js';
import { adminLayout } from './admin-layout.js';
import { NotFoundError } from '../../../core/errors.js';

const TYPES = [['FISICO', 'Instrumento (físico)'], ['DIGITAL', 'Documento digital (PDF)'], ['AUDIOVISUAL', 'Curso audiovisual']];

function input(label, name, value, { type = 'text', forType = '', attrs = '' } = {}) {
  return html`<label class="form-field" ${forType ? html`data-for="${forType}"` : ''}>${label}<input name="${name}" type="${type}" value="${value ?? ''}" ${attrs}></label>`;
}

function select(label, name, options, selected, disabled = false) {
  const items = options.map(([value, text]) => html`<option value="${value}" ${String(value) === String(selected) ? 'selected' : ''}>${text}</option>`);
  return html`<label class="form-field">${label}<select name="${name}" ${disabled ? 'disabled' : ''}><option value="">Selecciona…</option>${items}</select></label>`;
}

function categoryOptions(tree) {
  return tree.flatMap(padre => [[padre.id, padre.nombre], ...padre.hijas.map(h => [h.id, `— ${h.nombre}`])]);
}

function typeFields(p) {
  return html`<div class="form-grid">${input('Stock', 'stock', p.stock ?? 0, { type: 'number', forType: 'FISICO', attrs: 'min="0" step="1"' })}
      ${input('Stock mínimo (alerta)', 'stockMinimo', p.stockMinimo ?? 3, { type: 'number', forType: 'FISICO', attrs: 'min="0" step="1"' })}
      ${input('Ruta del archivo PDF', 'urlArchivo', p.urlArchivo, { forType: 'DIGITAL AUDIOVISUAL', attrs: 'placeholder="assets/files/archivo.pdf"' })}
      ${input('N.º de páginas', 'numeroPaginas', p.numeroPaginas, { type: 'number', forType: 'DIGITAL', attrs: 'min="0"' })}
      ${input('ID del video de YouTube', 'videoId', p.videoId, { forType: 'AUDIOVISUAL', attrs: 'maxlength="11"' })}
      ${input('Duración (min)', 'duracionMin', p.duracionMin, { type: 'number', forType: 'AUDIOVISUAL', attrs: 'min="0"' })}</div>
    <label class="form-field" data-for="AUDIOVISUAL">Capítulos (uno por línea)<textarea name="capitulos" rows="5">${(p.capitulos ?? []).join('\n')}</textarea></label>`;
}

function productForm(p, { tree, brands }) {
  const editing = Boolean(p.id);
  const typeSelect = select('Tipo de producto', 'tipoProducto', TYPES, p.tipoProducto ?? 'FISICO', editing);
  return html`<form class="form-card product-form" id="productForm" novalidate>
    <div class="form-grid">${input('Nombre', 'nombre', p.nombre)}${typeSelect}
      ${select('Categoría', 'idCategoria', categoryOptions(tree), p.idCategoria)}${select('Marca', 'idMarca', brands.map(b => [b.id, b.nombre]), p.idMarca)}
      ${input('Precio (S/, incluye IGV)', 'precio', p.precio, { attrs: 'inputmode="decimal"' })}${input('Etiqueta', 'etiqueta', p.etiqueta, { attrs: 'placeholder="NUEVO, OFERTA…"' })}</div>
    <label class="form-field">Descripción<textarea name="descripcion" rows="3">${p.descripcion ?? ''}</textarea></label>
    ${input('Imagen (URL https:// o ruta assets/)', 'imagen', p.imagenes?.[0]?.url)}${typeFields(p)}
    ${editing ? html`<input type="hidden" name="tipoProducto" value="${p.tipoProducto}">` : ''}
    <div class="form-actions"><button class="button button-dark" type="submit">${editing ? 'Guardar cambios' : 'Crear producto'}</button>
      <a class="text-link" href="#/admin/productos">Cancelar</a></div></form>`;
}

function syncTypeFields(form) {
  const tipo = form.querySelector('input[name="tipoProducto"]')?.value ?? form.querySelector('select[name="tipoProducto"]').value ?? 'FISICO';
  $$('[data-for]', form).forEach(field => { field.hidden = !field.dataset.for.split(' ').includes(tipo); });
}

export default {
  title: 'Producto',
  access: 'admin',
  async render(ctx) {
    const isNew = ctx.params.id === undefined;
    const [products, tree, brands] = await Promise.all([ctx.services.adminProducts.list(), ctx.services.adminCategories.list(), ctx.services.catalog.listBrands()]);
    const producto = isNew ? {} : products.find(p => p.id === Number(ctx.params.id));
    if (!producto) throw new NotFoundError('El producto no existe');
    ctx.pageTitle = isNew ? 'Nuevo producto' : producto.nombre;
    return adminLayout('/admin/productos', { eyebrow: 'CATÁLOGO', title: isNew ? 'Nuevo producto' : 'Editar producto' }, productForm(producto, { tree, brands }));
  },
  mount(root, ctx) {
    const form = $('#productForm', root);
    if (!form) return;
    syncTypeFields(form);
    form.addEventListener('change', event => { if (event.target.name === 'tipoProducto') syncTypeFields(form); });
    handleSubmit(form, ctx, async data => {
      if (ctx.params.id) await ctx.services.adminProducts.update(Number(ctx.params.id), data);
      else await ctx.services.adminProducts.create(data);
      ctx.toast('Producto guardado');
      ctx.navigate('#/admin/productos');
    });
  },
};
