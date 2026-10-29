import { html } from '../html.js';
import { formatMoney } from '../../core/money.js';

const LEARNING_TYPES = new Set(['AUDIOVISUAL', 'DIGITAL']);

function tile(producto, owned) {
  const meta = producto.tipoProducto === 'AUDIOVISUAL'
    ? `${producto.capitulos.length} capítulos · ${producto.duracionMin} min`
    : `PDF · ${producto.numeroPaginas} páginas`;
  const badge = owned ? html`<b class="owned-badge">✓ Comprado</b>` : html`<b class="tile-price">${formatMoney(producto.precio)}</b>`;
  const href = producto.tipoProducto === 'AUDIOVISUAL' ? `#/aprende/${producto.id}` : `#/producto/${producto.id}`;
  return html`<a class="resource-tile ${producto.tono}" href="${href}"><span>${producto.etiqueta}</span>
    <div><h3>${producto.nombre}</h3><p>${producto.descripcion}</p></div><small>${meta}</small>
    <div class="tile-footer">${badge}<span>${owned ? 'Continuar' : 'Ver vista previa'} ↗</span></div></a>`;
}

export default {
  title: 'Aprende',
  access: 'public',
  async render(ctx) {
    const products = (await ctx.services.catalog.listProducts({})).filter(p => LEARNING_TYPES.has(p.tipoProducto));
    const access = await Promise.all(products.map(p => ctx.services.downloads.hasAccess(p.id)));
    const courses = products.filter(p => p.tipoProducto === 'AUDIOVISUAL');
    const documents = products.filter(p => p.tipoProducto === 'DIGITAL');
    const owned = id => access[products.findIndex(p => p.id === id)];
    return html`<section class="resource-view page-section"><div class="section-heading"><div><div class="eyebrow">BIBLIOTECA MUSICAL</div>
        <h2>Recursos para aprender<span class="brand-dot">.</span></h2><p>Cursos en video y material descargable según instrumento y nivel. Mira la vista previa gratis.</p></div></div>
      <div class="group-heading"><span>01 / CURSOS</span><div><h3>Cursos audiovisuales</h3></div></div>
      <div class="resource-grid">${courses.map(p => tile(p, owned(p.id)))}</div>
      <div class="group-heading learn-docs"><span>02 / DOCUMENTOS</span><div><h3>Partituras y guías</h3></div></div>
      <div class="resource-grid">${documents.map(p => tile(p, owned(p.id)))}</div></section>`;
  },
};
