import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addItem, setQuantity, removeItem, MAX_DIGITAL_QTY } from '../../src/core/cart-rules.js';
import { ValidationError, ConflictError } from '../../src/core/errors.js';

const guitar = { id: 1, nombre: 'Guitarra', tipoProducto: 'FISICO', estado: 'A' };
const guide = { id: 6, nombre: 'Guía', tipoProducto: 'DIGITAL', estado: 'A' };
const course = { id: 14, nombre: 'Curso', tipoProducto: 'AUDIOVISUAL', estado: 'A' };

test('addItem agrega y suma cantidades sin mutar el arreglo', () => {
  const empty = [];
  const one = addItem(empty, guitar, 7);
  assert.deepEqual(empty, []);
  assert.deepEqual(one, [{ idProducto: 1, cantidad: 1 }]);
  assert.deepEqual(addItem(one, guitar, 7, 2), [{ idProducto: 1, cantidad: 3 }]);
});

test('setQuantity rechaza 0, -1, 1.5, "dos" y vacío', () => {
  const items = addItem([], guitar, 7);
  for (const bad of [0, -1, 1.5, 'dos', '', null]) {
    assert.throws(() => setQuantity(items, guitar, 7, bad), ValidationError, `aceptó ${bad}`);
  }
});

test('setQuantity acepta texto numérico entero', () => {
  assert.deepEqual(setQuantity(addItem([], guitar, 7), guitar, 7, '3'), [{ idProducto: 1, cantidad: 3 }]);
});

test('setQuantity por encima del stock lanza ConflictError con el stock en el mensaje', () => {
  assert.throws(() => setQuantity(addItem([], guitar, 3), guitar, 3, 4), { name: 'ConflictError', message: 'Solo quedan 3 unidades' });
  assert.throws(() => addItem(addItem([], guitar, 3, 3), guitar, 3), { message: 'Solo quedan 3 unidades' });
});

test('digital no supera 1', () => {
  assert.equal(MAX_DIGITAL_QTY, 1);
  const items = addItem([], guide, null);
  assert.throws(() => addItem(items, guide, null), { name: 'ConflictError', message: 'Los productos digitales se compran una sola vez' });
  assert.throws(() => setQuantity(items, course, null, 2), ConflictError);
});

test('agotado o inactivo lanza ConflictError', () => {
  assert.throws(() => addItem([], guitar, 0), { message: 'Este producto está agotado' });
  assert.throws(() => addItem([], { ...guitar, estado: 'I' }, 5), { message: 'Este producto ya no está disponible' });
});

test('removeItem quita solo ese producto', () => {
  const items = addItem(addItem([], guitar, 7), guide, null);
  assert.deepEqual(removeItem(items, 1), [{ idProducto: 6, cantidad: 1 }]);
  assert.deepEqual(removeItem(items, 99), items);
});
