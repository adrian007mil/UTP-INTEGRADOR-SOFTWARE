import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { fieldsOfAsync } from '../helpers/assertions.js';
import { AuthError } from '../../src/core/errors.js';
import { RESET_TOKEN_TTL_MS } from '../../src/services/password-reset-service.js';
import { DEMO_ACCOUNTS } from '../../src/data/seed-users.js';

const DEMO_EMAIL = 'cliente@omnimelody.pe';
const tokenOf = enlace => enlace.split('/').pop();

test('el token dura 30 minutos', () => { assert.equal(RESET_TOKEN_TTL_MS, 30 * 60 * 1000); });

test('request crea token, envía al buzón y devuelve el enlace de demo', async () => {
  const { services, collections } = await createTestContainer();
  const { enlaceDemo } = await services.passwordReset.request(' Cliente@OmniMelody.pe ');
  assert.match(enlaceDemo, /^#\/restablecer\/[0-9a-f]{32}$/);
  const [token] = await collections.tokensRecuperacion.findAll();
  assert.equal(token.usado, false);
  const [message] = await collections.buzon.findAll();
  assert.equal(message.asunto, 'Restablece tu contraseña');
  assert.equal(message.enlace, enlaceDemo);
});

test('un token válido cambia la contraseña y el login funciona con la nueva', async () => {
  const { services } = await createTestContainer();
  const { enlaceDemo } = await services.passwordReset.request(DEMO_EMAIL);
  await services.passwordReset.reset(tokenOf(enlaceDemo), 'Recupero2026', 'Recupero2026');
  await assert.rejects(services.auth.login(DEMO_ACCOUNTS.cliente.usuario, DEMO_ACCOUNTS.cliente.contrasena), AuthError);
  assert.equal((await services.auth.login(DEMO_ACCOUNTS.cliente.usuario, 'Recupero2026')).usuario, 'cliente.demo');
});

test('un token usado dos veces lanza AuthError', async () => {
  const { services } = await createTestContainer();
  const { enlaceDemo } = await services.passwordReset.request(DEMO_EMAIL);
  await services.passwordReset.reset(tokenOf(enlaceDemo), 'Recupero2026', 'Recupero2026');
  await assert.rejects(services.passwordReset.reset(tokenOf(enlaceDemo), 'Otra20266', 'Otra20266'), { name: 'AuthError', message: 'El enlace no es válido o ya venció' });
});

test('un token pasados 31 minutos lanza AuthError', async () => {
  const { services, clock } = await createTestContainer();
  const { enlaceDemo } = await services.passwordReset.request(DEMO_EMAIL);
  clock.advance(31 * 60 * 1000);
  await assert.rejects(services.passwordReset.reset(tokenOf(enlaceDemo), 'Recupero2026', 'Recupero2026'), AuthError);
});

test('token inexistente lanza AuthError y contraseña inválida ValidationError sin consumir el token', async () => {
  const { services } = await createTestContainer();
  await assert.rejects(services.passwordReset.reset('f'.repeat(32), 'Recupero2026', 'Recupero2026'), AuthError);
  const { enlaceDemo } = await services.passwordReset.request(DEMO_EMAIL);
  assert.ok((await fieldsOfAsync(services.passwordReset.reset(tokenOf(enlaceDemo), 'Recupero2026', 'Distinta2026'))).confirmacion);
  await services.passwordReset.reset(tokenOf(enlaceDemo), 'Recupero2026', 'Recupero2026');
});

test('request con un correo inexistente resuelve { enlaceDemo: null } sin crear tokens', async () => {
  const { services, collections } = await createTestContainer();
  assert.deepEqual(await services.passwordReset.request('nadie@x.pe'), { enlaceDemo: null });
  assert.equal((await collections.tokensRecuperacion.findAll()).length, 0);
  assert.equal((await collections.buzon.findAll()).length, 0);
});

test('isValid informa si el enlace sigue vigente', async () => {
  const { services } = await createTestContainer();
  const { enlaceDemo } = await services.passwordReset.request(DEMO_EMAIL);
  assert.equal(await services.passwordReset.isValid(tokenOf(enlaceDemo)), true);
  assert.equal(await services.passwordReset.isValid('nope'), false);
});
