import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommend, MAX_RECOMMENDATIONS } from '../../src/core/recommender.js';

const fisico = (id, precio, stock, extra) => ({ id, precio, stock, tipoProducto: 'FISICO', estado: 'A', familia: '', tipoInstrumento: '', ...extra });
const P = [
  fisico(1, 489, 7, { familia: 'cuerda', tipoInstrumento: 'guitarra-acustica' }),
  fisico(4, 219, 0, { familia: 'cuerda', tipoInstrumento: 'ukelele' }),
  fisico(9, 1299, 6, { familia: 'cuerda', tipoInstrumento: 'guitarra-electrica' }),
  fisico(10, 1399, 3, { familia: 'cuerda', tipoInstrumento: 'bajo' }),
  fisico(2, 899, 4, { tipoInstrumento: 'teclado' }),
  fisico(5, 349, 5, { tipoInstrumento: 'cajon' }),
  fisico(8, 79, 14, { familia: 'aire', tipoInstrumento: 'flauta' }),
  { id: 16, precio: 29, stock: null, tipoProducto: 'AUDIOVISUAL', estado: 'A' },
  { id: 17, precio: 24, stock: null, tipoProducto: 'AUDIOVISUAL', estado: 'A' },
];

test('cuerdas con presupuesto 300 excluye caros y el ukelele agotado', () => {
  const result = recommend(P, { sonido: 'cuerda', presupuesto: 300, nivel: 'principiante' });
  assert.deepEqual(result.instrumentos, []);
  assert.equal(result.masEconomico.id, 1);
});

test('cuerdas con presupuesto 2000 devuelve hasta 3 por precio ascendente', () => {
  assert.equal(MAX_RECOMMENDATIONS, 3);
  const result = recommend(P, { sonido: 'cuerda', presupuesto: 2000 });
  assert.deepEqual(result.instrumentos.map(p => p.id), [1, 9, 10]);
  assert.ok(result.instrumentos.every(p => p.stock > 0 && p.precio <= 2000));
  assert.equal(result.recurso.id, 16);
});

test('teclas, ritmo y aire eligen su familia y su recurso', () => {
  assert.deepEqual(recommend(P, { sonido: 'teclas', presupuesto: 1200 }).instrumentos.map(p => p.id), [2]);
  assert.deepEqual(recommend(P, { sonido: 'ritmo', presupuesto: 600 }).instrumentos.map(p => p.id), [5]);
  assert.deepEqual(recommend(P, { sonido: 'aire', presupuesto: 250 }).instrumentos.map(p => p.id), [8]);
  assert.equal(recommend(P, { sonido: 'teclas', presupuesto: 1200 }).recurso.id, 17);
});

test('presupuesto como texto y sonido desconocido', () => {
  assert.deepEqual(recommend(P, { sonido: 'aire', presupuesto: '600' }).instrumentos.map(p => p.id), [8]);
  assert.deepEqual(recommend(P, { sonido: 'otro', presupuesto: 600 }).instrumentos, []);
});
