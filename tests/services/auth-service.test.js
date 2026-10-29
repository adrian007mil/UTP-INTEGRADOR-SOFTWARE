import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { AuthError, ConflictError, ValidationError } from '../../src/core/errors.js';
import { DEMO_ACCOUNTS } from '../../src/data/seed-users.js';

const NEW_USER = {
  nombres: 'Ana', apellidos: 'Torres Ruiz', dni: '12345678', email: 'ana@correo.pe',
  usuario: 'ana.torres', contrasena: 'Clave2026', confirmacion: 'Clave2026',
};

const conflictAbout = word => error => error instanceof ConflictError && error.message.includes(word);

test('register crea un cliente, inicia sesión y no expone hash ni sal', async () => {
  const { services } = await createTestContainer();
  const user = await services.auth.register(NEW_USER);
  assert.equal(user.rol, 'CLIENTE');
  assert.ok(!('contrasenaHash' in user) && !('sal' in user));
  assert.equal((await services.auth.currentUser()).id, user.id);
});

test('register + login con usuario y con correo', async () => {
  const { services } = await createTestContainer();
  const created = await services.auth.register(NEW_USER);
  await services.auth.logout();
  assert.equal((await services.auth.login('ana.torres', 'Clave2026')).id, created.id);
  await services.auth.logout();
  assert.equal((await services.auth.login('  ANA@correo.pe ', 'Clave2026')).id, created.id);
});

test('register con correo, usuario o DNI repetido lanza ConflictError indicando cuál', async () => {
  const { services } = await createTestContainer();
  await services.auth.register(NEW_USER);
  await assert.rejects(services.auth.register({ ...NEW_USER, usuario: 'otro.user', dni: '87654321' }), conflictAbout('correo'));
  await assert.rejects(services.auth.register({ ...NEW_USER, email: 'x@y.pe', dni: '87654321' }), conflictAbout('usuario'));
  await assert.rejects(services.auth.register({ ...NEW_USER, email: 'x@y.pe', usuario: 'otro.user' }), conflictAbout('DNI'));
});

test('register con datos inválidos lanza ValidationError sin crear nada', async () => {
  const { services, collections } = await createTestContainer();
  const before = (await collections.usuarios.findAll()).length;
  await assert.rejects(services.auth.register({ ...NEW_USER, dni: '1' }), ValidationError);
  assert.equal((await collections.usuarios.findAll()).length, before);
});

test('login con contraseña errada o usuario inexistente lanza AuthError genérico', async () => {
  const { services } = await createTestContainer();
  const generic = { name: 'AuthError', message: 'Usuario o contraseña incorrectos' };
  await assert.rejects(services.auth.login(DEMO_ACCOUNTS.cliente.usuario, 'mala'), generic);
  await assert.rejects(services.auth.login('nadie', 'x'), generic);
  await assert.rejects(services.auth.login('', ''), generic);
});

test('login de cuenta desactivada lanza AuthError específico', async () => {
  const { services, collections } = await createTestContainer();
  const demo = await collections.usuarios.findOneBy(u => u.usuario === DEMO_ACCOUNTS.cliente.usuario);
  await collections.usuarios.update(demo.id, { estado: 'I' });
  await assert.rejects(services.auth.login(DEMO_ACCOUNTS.cliente.usuario, DEMO_ACCOUNTS.cliente.contrasena), { message: 'Tu cuenta está desactivada' });
});

test('login actualiza ultimoAcceso y currentUser no expone hash', async () => {
  const { services, collections, clock } = await createTestContainer();
  const user = await services.auth.login(DEMO_ACCOUNTS.admin.usuario, DEMO_ACCOUNTS.admin.contrasena);
  assert.equal((await collections.usuarios.findById(user.id)).ultimoAcceso, clock.now().toISOString());
  const current = await services.auth.currentUser();
  assert.equal(current.rol, 'ADMIN');
  assert.ok(!('contrasenaHash' in current));
});

test('logout deja currentUser en null y avisa a los suscriptores', async () => {
  const { services } = await createTestContainer();
  const events = [];
  services.auth.onSessionChange(user => events.push(user?.usuario ?? null));
  await services.auth.login(DEMO_ACCOUNTS.cliente.usuario, DEMO_ACCOUNTS.cliente.contrasena);
  await services.auth.logout();
  assert.equal(await services.auth.currentUser(), null);
  assert.deepEqual(events, ['cliente.demo', null]);
});

test('currentUser devuelve null si la sesión apunta a un usuario desactivado', async () => {
  const { services, collections } = await createTestContainer();
  const user = await services.auth.login(DEMO_ACCOUNTS.cliente.usuario, DEMO_ACCOUNTS.cliente.contrasena);
  await collections.usuarios.update(user.id, { estado: 'I' });
  assert.equal(await services.auth.currentUser(), null);
});

test('requireUser lanza AuthError sin sesión y devuelve el usuario con sesión', async () => {
  const { services } = await createTestContainer();
  await assert.rejects(services.auth.requireUser(), AuthError);
  await services.auth.login(DEMO_ACCOUNTS.cliente.usuario, DEMO_ACCOUNTS.cliente.contrasena);
  assert.equal((await services.auth.requireUser()).usuario, 'cliente.demo');
});

test('requireAdmin lanza ForbiddenError para clientes', async () => {
  const { services } = await createTestContainer();
  await services.auth.login(DEMO_ACCOUNTS.cliente.usuario, DEMO_ACCOUNTS.cliente.contrasena);
  await assert.rejects(services.auth.requireAdmin(), { name: 'ForbiddenError' });
});
