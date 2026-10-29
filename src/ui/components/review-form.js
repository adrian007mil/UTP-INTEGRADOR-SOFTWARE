import { html } from '../html.js';
import { $, setHtml } from '../dom.js';
import { handleSubmit } from './form-errors.js';
import { reviewList } from './review-list.js';
import { REVIEW_LIMITS } from '../../services/review-service.js';

function ratingInputs() {
  const options = [5, 4, 3, 2, 1].map(value => html`<input type="radio" id="star${value}" name="calificacion" value="${value}">
    <label for="star${value}" title="${value} estrellas">★</label>`);
  return html`<fieldset class="star-input"><legend>Tu calificación</legend><div class="star-row">${options}</div></fieldset>`;
}

function reviewForm({ puede, motivo }) {
  if (!puede) return html`<p class="review-locked">${motivo}${motivo.startsWith('Inicia') ? html` · <a class="text-link" href="#/login">Ingresar</a>` : ''}</p>`;
  return html`<form class="review-form" id="reviewForm" novalidate>${ratingInputs()}
    <label class="form-field">Tu comentario<textarea name="comentario" rows="3" maxlength="${REVIEW_LIMITS.MAX_COMMENT}"></textarea></label>
    <button class="button button-dark" type="submit">Publicar reseña</button></form>`;
}

export async function renderReviews(container, ctx) {
  const idProducto = Number(container.dataset.product);
  const [items, permission] = await Promise.all([ctx.services.reviews.listReviews(idProducto), ctx.services.reviews.canReview(idProducto)]);
  setHtml(container, html`<section class="reviews"><h3>Reseñas de clientes</h3>${reviewForm(permission)}${reviewList(items)}</section>`);
  const form = $('#reviewForm', container);
  if (!form) return;
  handleSubmit(form, ctx, async data => {
    await ctx.services.reviews.addReview(idProducto, data);
    ctx.toast('¡Gracias por tu reseña!');
    await ctx.refresh();
  });
}
