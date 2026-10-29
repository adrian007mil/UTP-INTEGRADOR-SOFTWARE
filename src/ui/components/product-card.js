import { html } from '../html.js';
import { formatMoney } from '../../core/money.js';
import { ratingBadge } from './stars.js';

export function productVisual(producto, className = 'product-photo') {
  const imagen = producto.imagenes?.[0];
  if (!imagen) return html`<span class="visual">${producto.visual}</span>`;
  const fit = producto.ajusteImagen === 'contain' ? 'contain-photo' : '';
  return html`<img class="${className} ${fit}" src="${imagen.url}" alt="Fotografía de referencia: ${producto.nombre}"
    loading="lazy" referrerpolicy="no-referrer" data-fallback="${producto.visual}">`;
}

function actionButtons(producto, { esFavorito, enComparacion }) {
  const compare = producto.tipoProducto === 'FISICO'
    ? html`<button class="compare-toggle ${enComparacion ? 'selected' : ''}" data-compare="${producto.id}"
        aria-label="${enComparacion ? 'Quitar de' : 'Agregar a'} comparación">${enComparacion ? '⇄✓' : '⇄'}</button>`
    : '';
  return html`${compare}<button class="wish-button ${esFavorito ? 'is-favorite' : ''}" data-wish="${producto.id}"
    aria-label="${esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}">${esFavorito ? '♥' : '♡'}</button>`;
}

export function priceTag(producto) {
  const previous = producto.precioAnterior ? html`<del>${formatMoney(producto.precioAnterior)}</del>` : '';
  return html`<span class="price">${formatMoney(producto.precio)} ${previous}</span>`;
}

function buyControl(producto) {
  if (producto.stock === 0) return html`<span class="stock-out">Agotado</span>`;
  return html`<button class="add-button" data-add="${producto.id}" aria-label="Agregar ${producto.nombre} al carrito">＋</button>`;
}

export function productCard(producto, flags = {}) {
  const digital = producto.tipoProducto !== 'FISICO';
  const hasPhoto = Boolean(producto.imagenes?.length);
  return html`<article class="product-card" data-product-id="${producto.id}">
    <div class="product-image ${producto.tono} ${hasPhoto ? 'has-photo' : ''}">
      <span class="badge ${digital ? 'digital' : ''}">${producto.etiqueta}</span>${actionButtons(producto, flags)}${productVisual(producto)}</div>
    <div class="product-info"><div class="product-meta"><span>${producto.marca?.nombre}</span>${ratingBadge(producto)}</div>
      <h3><a href="#/producto/${producto.id}">${producto.nombre}</a></h3><div class="product-desc">${producto.descripcion}</div>
      <div class="product-bottom">${priceTag(producto)}${buyControl(producto)}</div></div></article>`;
}
