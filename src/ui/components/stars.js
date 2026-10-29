import { html } from '../html.js';

const MAX_STARS = 5;

export function stars(valor) {
  const filled = Math.round(Number(valor) || 0);
  const text = '★'.repeat(filled) + '☆'.repeat(MAX_STARS - filled);
  return html`<span class="stars" aria-label="${valor} de ${MAX_STARS} estrellas">${text}</span>`;
}

export function ratingBadge(producto) {
  if (!producto.totalResenas) return html`<span class="rating rating-new">Nuevo</span>`;
  return html`<span class="rating">★ <b>${producto.calificacionPromedio.toFixed(1)} (${producto.totalResenas})</b></span>`;
}
