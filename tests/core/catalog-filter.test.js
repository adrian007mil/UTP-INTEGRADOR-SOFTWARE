import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterProducts, sortProducts } from '../../src/core/catalog-filter.js';

const C = [
  { id: 1, nombre: 'Cuerdas', idCategoriaPadre: null },
  { id: 2, nombre: 'Guitarras', idCategoriaPadre: 1 },
  { id: 3, nombre: 'Ukeleles', idCategoriaPadre: 1 },
  { id: 4, nombre: 'Percusión', idCategoriaPadre: null },
  { id: 5, nombre: 'Partituras', idCategoriaPadre: null },
];
const view = (id, nombre, idCategoria, marca, precio, stock, extra = {}) => ({
  id, nombre, idCategoria, idMarca: marca.length, precio, stock, tipoProducto: stock === null ? 'DIGITAL' : 'FISICO',
  marca: { nombre: marca }, categoria: C.find(c => c.id === idCategoria), tipoInstrumento: '', familia: '', ...extra,
});
const P = [
  view(1, 'Guitarra acústica Sienna', 2, 'Cordoba', 489, 7, { tipoInstrumento: 'guitarra-acustica', familia: 'cuerda' }),
  view(2, 'Ukelele soprano Marea', 3, 'Kala', 219, 0, { familia: 'cuerda' }),
  view(3, 'Cajón peruano Raíces', 4, 'Meinl', 349, 5),
  view(4, 'Bajo Yamaha', 2, 'Yamaha', 1399, 3),
  view(5, 'Flauta dulce', 4, 'Yamaha', 79, 14, { familia: 'aire' }),
  view(6, 'Partituras: clásicos', 5, 'OmniMelody Ediciones', 39, null),
];
const names = list => list.map(p => p.nombre);

test('sin criterios devuelve todo', () => { assert.equal(filterProducts(P, {}, C).length, 6); });

test('busca sin tildes ni mayúsculas', () => {
  assert.deepEqual(names(filterProducts(P, { texto: 'cajon' }, C)), ['Cajón peruano Raíces']);
  assert.deepEqual(names(filterProducts(P, { texto: '  RAÍCES ' }, C)), ['Cajón peruano Raíces']);
});

test('busca por marca y por categoría', () => {
  assert.deepEqual(names(filterProducts(P, { texto: 'yamaha' }, C)), ['Bajo Yamaha', 'Flauta dulce']);
  assert.deepEqual(names(filterProducts(P, { texto: 'percusion' }, C)), ['Cajón peruano Raíces', 'Flauta dulce']);
});

test('filtrar por categoría padre incluye hijas', () => {
  assert.deepEqual(names(filterProducts(P, { idCategoria: 1 }, C)), ['Guitarra acústica Sienna', 'Ukelele soprano Marea', 'Bajo Yamaha']);
  assert.deepEqual(names(filterProducts(P, { idCategoria: '3' }, C)), ['Ukelele soprano Marea']);
});

test('filtra por marca, precio máximo, tipo y familia', () => {
  assert.equal(filterProducts(P, { idMarca: 6 }, C).length, 2);
  assert.deepEqual(names(filterProducts(P, { precioMax: 300 }, C)), ['Ukelele soprano Marea', 'Flauta dulce', 'Partituras: clásicos']);
  assert.deepEqual(names(filterProducts(P, { tipoInstrumento: 'guitarra-acustica' }, C)), ['Guitarra acústica Sienna']);
  assert.deepEqual(names(filterProducts(P, { familia: 'aire' }, C)), ['Flauta dulce']);
  assert.deepEqual(names(filterProducts(P, { tipoProducto: 'DIGITAL' }, C)), ['Partituras: clásicos']);
});

test('disponibilidad agotado y en stock', () => {
  assert.deepEqual(names(filterProducts(P, { disponibilidad: 'agotado' }, C)), ['Ukelele soprano Marea']);
  assert.equal(filterProducts(P, { disponibilidad: 'en-stock' }, C).length, 5);
});

test('digitales nunca cuentan como agotados', () => {
  assert.ok(filterProducts(P, { disponibilidad: 'en-stock' }, C).some(p => p.stock === null));
});

test('valores "todos" o vacíos no filtran', () => {
  assert.equal(filterProducts(P, { idCategoria: '', idMarca: 'todos', tipoInstrumento: 'todos', familia: '', disponibilidad: 'todos', texto: '' }, C).length, 6);
});

test('precioMax inválido se ignora', () => {
  assert.equal(filterProducts(P, { precioMax: 'abc' }, C).length, 6);
});

test('sortProducts', () => {
  assert.deepEqual(sortProducts(P, 'precio-asc').map(p => p.precio), [39, 79, 219, 349, 489, 1399]);
  assert.deepEqual(sortProducts(P, 'precio-desc').map(p => p.precio), [1399, 489, 349, 219, 79, 39]);
  assert.equal(sortProducts(P, 'nombre')[0].nombre, 'Bajo Yamaha');
  assert.deepEqual(sortProducts(P, 'destacados').map(p => p.id), [1, 2, 3, 4, 5, 6]);
});

test('sortProducts no muta el arreglo original', () => {
  const copy = [...P];
  sortProducts(P, 'precio-desc');
  assert.deepEqual(P, copy);
});
