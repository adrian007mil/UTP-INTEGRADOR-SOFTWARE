import { html } from '../html.js';
import { $, setHtml } from '../dom.js';
import { cardFlags } from '../components/product-card.js';
import { showError } from '../error-view.js';
import { filtersForm, criteriaFromQuery, queryFromCriteria, readCriteria } from './catalog-filters.js';

const SEARCH_DEBOUNCE_MS = 300;
const GROUPS = [
  { tipo: 'FISICO', numero: '01 / INSTRUMENTOS', titulo: 'Instrumentos musicales', texto: 'Encuentra el sonido que quieres explorar.' },
  { tipo: 'DIGITAL', numero: '02 / DOCUMENTOS', titulo: 'Partituras y documentos', texto: 'Partituras, guías y métodos para descargar.' },
  { tipo: 'AUDIOVISUAL', numero: '03 / AUDIOVISUAL', titulo: 'Material audiovisual', texto: 'Cursos en video organizados por capítulos.' },
];

function group(definition, products, flags) {
  if (products.length === 0) return '';
  return html`<section class="catalog-group"><div class="group-heading"><span>${definition.numero}</span>
    <div><h3>${definition.titulo}</h3><p>${definition.texto}</p></div></div>
    <div class="product-grid">${products.map(cardFlags(flags))}</div></section>`;
}

function emptyState() {
  return html`<div class="empty-state"><span>⌕</span><h3>No encontramos resultados</h3>
    <p>Prueba con otro término o cambia los filtros.</p><a class="button button-outline" href="#/catalogo">Limpiar filtros</a></div>`;
}

function photoCredits(products) {
  const withPhoto = products.filter(p => p.imagenes?.length);
  const items = withPhoto.map(p => html`${p.nombre}: ${p.imagenes[0].credito} · <a target="_blank" rel="noreferrer" href="${p.imagenes[0].enlace}">Wikimedia Commons</a>. `);
  return html`<details class="photo-credits"><summary>Créditos y licencias de fotografías</summary>
    <p>${items}Fotografías de referencia; no representan necesariamente el producto exacto en venta.</p></details>`;
}

export function catalogResults(products, total, flags) {
  const groups = GROUPS.map(definition => group(definition, products.filter(p => p.tipoProducto === definition.tipo), flags));
  return html`${products.length ? groups : emptyState()}
    <div class="catalog-footer"><span>Mostrando ${products.length} de ${total} productos</span></div>`;
}

async function refreshResults(form, ctx, total) {
  const criteria = readCriteria(form);
  const [products, flags] = await Promise.all([ctx.services.catalog.listProducts(criteria), ctx.services.preferences.flags()]);
  setHtml($('#catalogResults'), catalogResults(products, total, flags));
  const query = queryFromCriteria(criteria).toString();
  history.replaceState(null, '', `#/catalogo${query ? `?${query}` : ''}`);
}

export default {
  title: 'Catálogo',
  access: 'public',
  async render(ctx) {
    const criteria = criteriaFromQuery(ctx.query);
    const [products, all, tree, brands, flags] = await Promise.all([
      ctx.services.catalog.listProducts(criteria), ctx.services.catalog.listProducts({}),
      ctx.services.catalog.listCategories(), ctx.services.catalog.listBrands(), ctx.services.preferences.flags(),
    ]);
    return html`<section class="catalog-section page-section" id="catalogo">
      <div class="section-heading"><div><div class="eyebrow">SELECCIÓN PARA TI</div><h2>Explora el catálogo<span class="brand-dot">.</span></h2>
        <p>Todo lo que necesitas para hacer música, en un mismo lugar.</p></div></div>
      ${filtersForm(criteria, { tree, brands })}<div id="catalogResults" data-total="${all.length}">${catalogResults(products, all.length, flags)}</div>
      ${photoCredits(all)}</section>`;
  },
  mount(root, ctx) {
    const form = $('#catalogFilters', root);
    const total = Number($('#catalogResults', root).dataset.total);
    let timer;
    const update = () => refreshResults(form, ctx, total).catch(error => showError(error, ctx));
    form.addEventListener('submit', event => { event.preventDefault(); update(); });
    form.addEventListener('change', update);
    form.addEventListener('input', event => {
      if (event.target.name === 'precioMax') $('#priceLabel', root).textContent = `S/ ${event.target.value}`;
      if (event.target.name !== 'texto') return;
      clearTimeout(timer);
      timer = setTimeout(update, SEARCH_DEBOUNCE_MS);
    });
    $('#filterToggle', root).addEventListener('click', () => $('#filterPanel', root).classList.toggle('open'));
  },
};
