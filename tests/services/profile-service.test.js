import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { fieldsOfAsync } from '../helpers/assertions.js';
import { loginDemo, OTHER_USER } from '../helpers/fixtures.js';
import { AuthError, ConflictError } from '../../src/core/errors.js';
import { DEMO_ACCOUNTS } from '../../src/data/seed-users.js';

const PROFILE = { nombres: 'Lucía', apellidos: 'Fernández Quispe', email: 'lucia@nuevo.pe', telefono: '912345678' };

test('updateProfile guarda datos normalizados y no expone hash', async () => {
  const { services } = await createTestContainer();
  await loginDemo(services);
  const updated = await services.profile.updateProfile({ ...PROFILE, email: ' LUCIA@Nuevo.pe ' });
  assert.equal(updated.email, 'lucia@nuevo.pe');
  assert.ok(!('contrasenaHash' in updated));
  assert.equal((await services.auth.currentUser()).telefono, '912345678');
});

test('updateProfile con correo de otro usuario lanza ConflictError; con el propio no', async () => {
  const { services } = await createTestContainer();
  await services.auth.register(OTHER_USER);
  await services.auth.logout();
  await loginDemo(services);
  await assert.rejects(services.profile.updateProfile({ ...PROFILE, email: OTHER_USER.email }), ConflictError);
  assert.equal((await services.profile.updateProfile({ ...PROFILE, email: 'cliente@omnimelody.pe' })).email, 'cliente@omnimelody.pe');
});

test('updateProfile inválido lanza ValidationError por campo', async () => {
  const { services } = await createTestContainer();
  await loginDemo(services);
  assert.ok((await fieldsOfAsync(services.profile.updateProfile({ ...PROFILE, email: 'malo' }))).email);
});

test('changePassword: actual errónea → AuthError; correcta → login con la nueva', async () => {
  const { services } = await createTestContainer();
  await loginDemo(services);
  await assert.rejects(services.profile.changePassword('mala', 'Nueva2027', 'Nueva2027'), { name: 'AuthError', message: 'La contraseña actual no es correcta' });
  assert.ok((await fieldsOfAsync(services.profile.changePassword(DEMO_ACCOUNTS.cliente.contrasena, 'corta', 'corta'))).contrasena);
  await services.profile.changePassword(DEMO_ACCOUNTS.cliente.contrasena, 'Nueva2027', 'Nueva2027');
  await services.auth.logout();
  await assert.rejects(services.auth.login(DEMO_ACCOUNTS.cliente.usuario, DEMO_ACCOUNTS.cliente.contrasena), AuthError);
  assert.equal((await services.auth.login(DEMO_ACCOUNTS.cliente.usuario, 'Nueva2027')).usuario, 'cliente.demo');
});

test('sin sesión lanza AuthError', async () => {
  const { services } = await createTestContainer();
  await assert.rejects(services.profile.updateProfile(PROFILE), AuthError);
});
