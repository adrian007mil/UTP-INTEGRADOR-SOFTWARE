import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewList } from '../../src/ui/components/review-list.js';

const item = comentario => ({ resena: { id: 1, calificacion: 4, comentario, fechaResena: '2026-11-02T15:00:00.000Z' }, autor: 'Lucía F.' });

test('reviewList escapa el comentario y el autor', () => {
  const out = String(reviewList([{ ...item('<script>x</script>'), autor: '<b>Eve</b>' }]));
  assert.ok(out.includes('&lt;script&gt;x&lt;/script&gt;'));
  assert.ok(out.includes('&lt;b&gt;Eve&lt;/b&gt;'));
  assert.ok(!out.includes('<script>'));
});

test('reviewList muestra estrellas y vacío amable', () => {
  assert.ok(String(reviewList([item('Bien')])).includes('★★★★☆'));
  assert.ok(String(reviewList([])).includes('Aún no hay reseñas'));
});
