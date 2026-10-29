import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { fieldsOfAsync } from '../helpers/assertions.js';
import { loginDemo, OTHER_USER } from '../helpers/fixtures.js';
import { ForbiddenError, ConflictError, AuthError } from '../../src/core/errors.js';
import { REVIEW_LIMITS } from '../../src/services/review-service.js';

async function demo() {
  const container = await createTestContainer({ withDemoHistory: true });
  await loginDemo(container.services);
  return container;
}

test('límites de reseña', () => {
  assert.deepEqual(REVIEW_LIMITS, { MIN_RATING: 1, MAX_RATING: 5, MIN_COMMENT: 3, MAX_COMMENT: 500 });
});

test('reseñar la guitarra comprada funciona y actualiza el promedio del catálogo', async () => {
  const { services } = await demo();
  assert.deepEqual(await services.reviews.canReview(1), { puede: true, motivo: null });
  const resena = await services.reviews.addReview(1, { calificacion: '4', comentario: '  Suena muy bien  ' });
  assert.equal(resena.calificacion, 4);
  assert.equal(resena.comentario, 'Suena muy bien');
  assert.equal(resena.idPedido, 1);
  const producto = await services.catalog.getProduct(1);
  assert.deepEqual([producto.calificacionPromedio, producto.totalResenas], [4, 1]);
  const [item] = await services.reviews.listReviews(1);
  assert.equal(item.autor, 'Lucía F.');
});

test('reseñar sin compra lanza ForbiddenError y canReview lo explica', async () => {
  const { services } = await demo();
  assert.deepEqual(await services.reviews.canReview(2), { puede: false, motivo: 'Compra este producto para reseñarlo' });
  await assert.rejects(services.reviews.addReview(2, { calificacion: 5, comentario: 'Genial' }), ForbiddenError);
});

test('segunda reseña del mismo producto lanza ConflictError', async () => {
  const { services } = await demo();
  await services.reviews.addReview(1, { calificacion: 5, comentario: 'Excelente' });
  assert.deepEqual(await services.reviews.canReview(1), { puede: false, motivo: 'Ya reseñaste este producto' });
  await assert.rejects(services.reviews.addReview(1, { calificacion: 3, comentario: 'Otra vez' }), ConflictError);
});

test('calificación 6, 0 o 2.5 y comentario corto o largo lanzan ValidationError', async () => {
  const { services } = await demo();
  for (const calificacion of [6, 0, 2.5, 'x']) {
    assert.ok((await fieldsOfAsync(services.reviews.addReview(1, { calificacion, comentario: 'Bien' }))).calificacion);
  }
  assert.ok((await fieldsOfAsync(services.reviews.addReview(1, { calificacion: 5, comentario: 'ok' }))).comentario);
  assert.ok((await fieldsOfAsync(services.reviews.addReview(1, { calificacion: 5, comentario: 'x'.repeat(501) }))).comentario);
});

test('sin sesión: canReview pide iniciar sesión y addReview lanza AuthError', async () => {
  const { services } = await demo();
  await services.auth.logout();
  assert.deepEqual(await services.reviews.canReview(1), { puede: false, motivo: 'Inicia sesión para dejar una reseña' });
  await assert.rejects(services.reviews.addReview(1, { calificacion: 5, comentario: 'Bien' }), AuthError);
});

test('listReviews ordena de la más reciente a la más antigua', async () => {
  const { services, clock } = await demo();
  await services.reviews.addReview(6, { calificacion: 5, comentario: 'Muy útil' });
  clock.advance(1000);
  await services.reviews.addReview(16, { calificacion: 4, comentario: 'Buen curso' });
  await services.auth.logout();
  await services.auth.register(OTHER_USER);
  assert.equal((await services.reviews.listReviews(6)).length, 1);
  assert.equal((await services.reviews.listReviews(3)).length, 0);
});
