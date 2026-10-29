import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateProduct } from '../../src/core/product-validators.js';
import { fieldsOf } from '../helpers/assertions.js';

const refs = { categorias: [{ id: 2, nombre: 'Guitarras' }], marcas: [{ id: 3, nombre: 'Yamaha' }] };
const PHYSICAL = { nombre: 'Guitarra clásica Luna', descripcion: 'Cuerdas de nylon', precio: '359.90', tipoProducto: 'FISICO', idCategoria: '2', idMarca: '3', stock: '10', stockMinimo: '2', imagen: '' };

test('normaliza un físico válido', () => {
  const { producto, inventario } = validateProduct(PHYSICAL, refs);
  assert.deepEqual([producto.nombre, producto.precio, producto.idCategoria, producto.idMarca, producto.imagenes], ['Guitarra clásica Luna', 359.9, 2, 3, []]);
  assert.deepEqual(inventario, { stock: 10, stockMinimo: 2 });
});

test('precio negativo, cero o con más de 2 decimales falla', () => {
  for (const precio of ['-5', '0', '12.345', 'abc', '']) assert.ok(fieldsOf(() => validateProduct({ ...PHYSICAL, precio }, refs)).precio, precio);
});

test('categoría o marca inexistente y tipo inválido fallan', () => {
  const fields = fieldsOf(() => validateProduct({ ...PHYSICAL, idCategoria: '99', idMarca: '99', tipoProducto: 'OTRO' }, refs));
  assert.ok(fields.idCategoria && fields.idMarca && fields.tipoProducto);
});

test('stock negativo o decimal falla para físicos', () => {
  assert.ok(fieldsOf(() => validateProduct({ ...PHYSICAL, stock: '-1' }, refs)).stock);
  assert.ok(fieldsOf(() => validateProduct({ ...PHYSICAL, stockMinimo: '1.5' }, refs)).stockMinimo);
});

test('digital exige archivo; audiovisual exige video de YouTube y capítulos', () => {
  const digital = { ...PHYSICAL, tipoProducto: 'DIGITAL', urlArchivo: '' };
  assert.ok(fieldsOf(() => validateProduct(digital, refs)).urlArchivo);
  const ok = validateProduct({ ...digital, urlArchivo: 'assets/files/x.pdf', numeroPaginas: '12' }, refs);
  assert.equal(ok.inventario, null);
  assert.equal(ok.producto.numeroPaginas, 12);
  const course = { ...PHYSICAL, tipoProducto: 'AUDIOVISUAL', urlArchivo: 'assets/files/x.pdf', videoId: 'corto', capitulos: '' };
  const fields = fieldsOf(() => validateProduct(course, refs));
  assert.ok(fields.videoId && fields.capitulos);
  const valid = validateProduct({ ...course, videoId: 'eJGs9_kgRyg', capitulos: 'Uno\n\n Dos \n' }, refs);
  assert.deepEqual(valid.producto.capitulos, ['Uno', 'Dos']);
});

test('imagen debe ser https o una ruta local de assets', () => {
  assert.ok(fieldsOf(() => validateProduct({ ...PHYSICAL, imagen: 'http://inseguro.com/a.jpg' }, refs)).imagen);
  assert.ok(fieldsOf(() => validateProduct({ ...PHYSICAL, imagen: 'javascript:alert(1)' }, refs)).imagen);
  assert.equal(validateProduct({ ...PHYSICAL, imagen: 'https://example.com/a.jpg' }, refs).producto.imagenes[0].url, 'https://example.com/a.jpg');
  assert.equal(validateProduct({ ...PHYSICAL, imagen: 'assets/img/bajo.jpg' }, refs).producto.imagenes.length, 1);
});
