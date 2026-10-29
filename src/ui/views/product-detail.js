import { html } from '../html.js';
import { $, $$ } from '../dom.js';
import { productVisual, priceTag } from '../components/product-card.js';
import { ratingBadge } from '../components/stars.js';

const LOW_STOCK_THRESHOLD = 5;
const TYPE_LABELS = { FISICO: 'Instrumento', DIGITAL: 'Documento digital', AUDIOVISUAL: 'Curso audiovisual' };

function stockText(producto) {
  if (producto.tipoProducto !== 'FISICO') return 'Descarga digital inmediata tras confirmar el pago';
  if (producto.stock === 0) return 'Agotado por el momento';
  if (producto.stock <= LOW_STOCK_THRESHOLD) return `Quedan ${producto.stock} unidades`;
  return `En stock · ${producto.stock} unidades disponibles`;
}

function gallery(producto) {
  const imagenes = producto.imagenes ?? [];
  const thumbs = imagenes.length > 1
    ? html`<div class="detail-thumbs">${imagenes.map((img, i) => html`<button class="detail-thumb" data-image="${img.url}" aria-label="Ver imagen ${i + 1}"><img src="${img.url}" alt=""></button>`)}</div>`
    : '';
  const credit = imagenes[0]
    ? html`<small class="image-credit">Foto: ${imagenes[0].credito} · <a href="${imagenes[0].enlace}" target="_blank" rel="noreferrer">Wikimedia Commons</a></small>`
    : '';
  return html`<div class="detail-media"><div class="detail-visual ${producto.tono}" id="detailVisual">${productVisual(producto, 'detail-photo')}</div>${thumbs}${credit}</div>`;
}

function digitalFacts(producto) {
  if (producto.tipoProducto === 'DIGITAL') return html`<li>Formato ${producto.formato} · ${producto.numeroPaginas} páginas</li>`;
  if (producto.tipoProducto === 'AUDIOVISUAL') return html`<li>${producto.capitulos.length} capítulos · ${producto.duracionMin} min de video</li><li>Incluye material descargable en PDF</li>`;
  return '';
}

function syllabus(producto) {
  if (producto.tipoProducto !== 'AUDIOVISUAL') return '';
  return html`<section class="detail-syllabus"><h3>Temario</h3><ol>${producto.capitulos.map(c => html`<li>${c}</li>`)}</ol>
    <a class="text-link" href="#/aprende/${producto.id}">Ver vista previa del curso ↗</a></section>`;
}

function buyButton(producto) {
  if (producto.stock === 0) return html`<button class="button button-dark" disabled>Agotado</button>`;
  return html`<button class="button button-dark" data-add="${producto.id}">Agregar al carrito <span>＋</span></button>`;
}

function detailCopy(producto) {
  return html`<div class="detail-copy"><span class="eyebrow">${TYPE_LABELS[producto.tipoProducto]} · ${producto.categoria?.nombre}</span>
    <h1>${producto.nombre}</h1><div class="product-meta"><span>${producto.marca?.nombre}</span>${ratingBadge(producto)}</div>
    <p>${producto.descripcion}</p><ul class="detail-facts">${digitalFacts(producto)}<li>Precio incluye IGV</li></ul>
    ${priceTag(producto)}<p class="detail-stock ${producto.stock === 0 ? 'out' : ''}">${stockText(producto)}</p>${buyButton(producto)}</div>`;
}

export default {
  title: 'Producto',
  access: 'public',
  async render(ctx) {
    const producto = await ctx.services.catalog.getProduct(ctx.params.id);
    ctx.pageTitle = producto.nombre;
    return html`<article class="page-section product-page">
      <nav class="breadcrumb" aria-label="Ruta"><a href="#/">Inicio</a> / <a href="#/catalogo">Catálogo</a> /
        <a href="#/catalogo?cat=${producto.idCategoria}">${producto.categoria?.nombre}</a></nav>
      <div class="detail-layout">${gallery(producto)}${detailCopy(producto)}</div>${syllabus(producto)}
      <div id="productReviews" data-product="${producto.id}"></div></article>`;
  },
  mount(root) {
    $$('[data-image]', root).forEach(button => button.addEventListener('click', () => {
      const image = $('#detailVisual img', root);
      if (image) image.src = button.dataset.image;
    }));
  },
};
