import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { loginAdmin, loginDemo, OTHER_USER } from '../helpers/fixtures.js';
import { ForbiddenError } from '../../src/core/errors.js';
import { DEMO_ACCOUNTS } from '../../src/data/seed-users.js';

async function admin() {
  const container = await createTestContainer();
  await container.services.auth.register(OTHER_USER);
  await container.services.auth.logout();
  await loginAdmin(container.services);
  return container;
}

test('list devuelve usuarios sin hash ni sal y filtra por texto y rol', async () => {
  const { services } = await admin();
  const all = await services.adminUsers.list({});
  assert.equal(all.length, 3);
  assert.ok(all.every(u => !('contrasenaHash' in u) && !('sal' in u)));
  assert.deepEqual((await services.adminUsers.list({ rol: 'ADMIN' })).map(u => u.usuario), ['admin']);
  assert.deepEqual((await services.adminUsers.list({ texto: 'fernandez' })).map(u => u.usuario), ['cliente.demo']);
});

test('un usuario desactivado no puede iniciar sesión y reactivarlo lo permite', async () => {
  const { services } = await admin();
  const demo = (await services.adminUsers.list({ texto: 'cliente.demo' }))[0];
  await services.adminUsers.setActive(demo.id, false);
  await services.auth.logout();
  await assert.rejects(services.auth.login(DEMO_ACCOUNTS.cliente.usuario, DEMO_ACCOUNTS.cliente.contrasena), { message: 'Tu cuenta está desactivada' });
  await loginAdmin(services);
  await services.adminUsers.setActive(demo.id, true);
  await services.auth.logout();
  assert.equal((await loginDemo(services)).usuario, 'cliente.demo');
});

test('desactivar a alguien con sesión abierta lo saca en su próximo currentUser', async () => {
  const { services, collections } = await admin();
  await services.auth.logout();
  const demo = await loginDemo(services);
  await collections.usuarios.update(demo.id, { estado: 'I' });
  assert.equal(await services.auth.currentUser(), null);
});

test('el admin no puede desactivarse a sí mismo', async () => {
  const { services } = await admin();
  const me = await services.auth.currentUser();
  await assert.rejects(services.adminUsers.setActive(me.id, false), { name: 'ConflictError', message: 'No puedes desactivar tu propia cuenta' });
});

test('un cliente no puede gestionar usuarios', async () => {
  const { services } = await createTestContainer();
  await loginDemo(services);
  await assert.rejects(services.adminUsers.list({}), ForbiddenError);
});

