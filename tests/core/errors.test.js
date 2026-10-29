import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AppError, ValidationError, NotFoundError, AuthError, ForbiddenError,
  ConflictError, PaymentDeclinedError, StorageCorruptedError,
} from '../../src/core/errors.js';

test('ValidationError lleva campos y es AppError', () => {
  const e = new ValidationError('Datos inválidos', { dni: 'Debe tener 8 dígitos' });
  assert.ok(e instanceof AppError);
  assert.equal(e.name, 'ValidationError');
  assert.deepEqual(e.fields, { dni: 'Debe tener 8 dígitos' });
});

test('ValidationError sin campos usa objeto vacío', () => {
  assert.deepEqual(new ValidationError('x').fields, {});
});

test('cada error tipado tiene su nombre y hereda de AppError', () => {
  for (const ErrorClass of [NotFoundError, AuthError, ForbiddenError, ConflictError, StorageCorruptedError]) {
    const e = new ErrorClass('mensaje');
    assert.ok(e instanceof AppError);
    assert.ok(e instanceof Error);
    assert.equal(e.name, ErrorClass.name);
    assert.equal(e.message, 'mensaje');
  }
});

test('PaymentDeclinedError guarda el motivo', () => {
  const e = new PaymentDeclinedError('Pago rechazado', 'Fondos insuficientes');
  assert.equal(e.reason, 'Fondos insuficientes');
  assert.equal(e.name, 'PaymentDeclinedError');
});
