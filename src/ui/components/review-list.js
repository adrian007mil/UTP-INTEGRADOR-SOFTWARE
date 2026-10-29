import { html } from '../html.js';
import { stars } from './stars.js';

const DATE_FORMAT = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' });

export function reviewList(items) {
  if (items.length === 0) return html`<p class="muted">Aún no hay reseñas. ¡Sé la primera persona en opinar!</p>`;
  return html`<ul class="review-list">${items.map(({ resena, autor }) => html`<li><div class="review-head">${stars(resena.calificacion)}
    <b>${autor}</b><time>${DATE_FORMAT.format(new Date(resena.fechaResena))}</time></div><p>${resena.comentario}</p></li>`)}</ul>`;
}
