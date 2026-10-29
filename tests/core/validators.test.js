import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistration, MIN_PASSWORD_LENGTH } from '../../src/core/validators.js';
import { fieldsOf } from '../helpers/assertions.js';

const VALID = {
  nombres: 'Ana', apellidos: 'Torres Ruiz', dni: '12345678', email: 'Ana@Correo.PE ',
  usuario: 'ana.torres', contrasena: 'Clave2026', confirmacion: 'Clave2026', telefono: '',
};

test('normaliza datos válidos: correo en minúsculas y sin espacios', () => {
  const data = validateRegistration(VALID);
  assert.equal(data.email, 'ana@correo.pe');
  assert.equal(data.nombres, 'Ana');
  assert.ok(!('confirmacion' in data));
});

test('dni con 7 dígitos falla en el campo dni', () => {
  assert.ok(fieldsOf(() => validateRegistration({ ...VALID, dni: '1234567' })).dni);
  assert.ok(fieldsOf(() => validateRegistration({ ...VALID, dni: '1234567a' })).dni);
});

test('confirmación distinta falla en confirmacion', () => {
  assert.ok(fieldsOf(() => validateRegistration({ ...VALID, confirmacion: 'Otra2026' })).confirmacion);
});

test('contraseña corta o sin número falla', () => {
  assert.equal(MIN_PASSWORD_LENGTH, 8);
  assert.ok(fieldsOf(() => validateRegistration({ ...VALID, contrasena: 'Ab1', confirmacion: 'Ab1' })).contrasena);
  assert.ok(fieldsOf(() => validateRegistration({ ...VALID, contrasena: 'soloLetras', confirmacion: 'soloLetras' })).contrasena);
});

test('correo y usuario inválidos', () => {
  assert.ok(fieldsOf(() => validateRegistration({ ...VALID, email: 'ana@correo' })).email);
  assert.ok(fieldsOf(() => validateRegistration({ ...VALID, usuario: 'an' })).usuario);
  assert.ok(fieldsOf(() => validateRegistration({ ...VALID, usuario: 'ana torres' })).usuario);
});

test('nombres vacíos o de un carácter fallan', () => {
  const fields = fieldsOf(() => validateRegistration({ ...VALID, nombres: ' ', apellidos: 'A' }));
  assert.ok(fields.nombres && fields.apellidos);
});

test('reporta todos los campos inválidos a la vez', () => {
  const fields = fieldsOf(() => validateRegistration({}));
  assert.deepEqual(Object.keys(fields).sort(), ['apellidos', 'contrasena', 'dni', 'email', 'nombres', 'usuario']);
});

test('teléfono opcional pero si viene debe ser celular peruano', () => {
  assert.ok(fieldsOf(() => validateRegistration({ ...VALID, telefono: '12345' })).telefono);
  assert.equal(validateRegistration({ ...VALID, telefono: '987654321' }).telefono, '987654321');
});
