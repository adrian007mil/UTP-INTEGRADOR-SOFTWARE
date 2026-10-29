import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { loginDemo, OTHER_USER } from '../helpers/fixtures.js';
import { AuthError, NotFoundError } from '../../src/core/errors.js';

test('send, list (recientes primero), unreadCount y markRead', async () => {
  const { services, clock } = await createTestContainer();
  const user = await loginDemo(services);
  await services.mailbox.send(user.id, { asunto: 'Uno', cuerpo: 'a', enlace: null });
  clock.advance(1000);
  const second = await services.mailbox.send(user.id, { asunto: 'Dos', cuerpo: 'b', enlace: '#/x' });
  assert.deepEqual((await services.mailbox.list()).map(m => m.asunto), ['Dos', 'Uno']);
  assert.equal(await services.mailbox.unreadCount(), 2);
  await services.mailbox.markRead(second.id);
  assert.equal(await services.mailbox.unreadCount(), 1);
});

test('cada usuario solo ve sus mensajes', async () => {
  const { services } = await createTestContainer();
  const demo = await loginDemo(services);
  const message = await services.mailbox.send(demo.id, { asunto: 'Privado', cuerpo: 'x', enlace: null });
  await services.auth.logout();
  await services.auth.register(OTHER_USER);
  assert.equal((await services.mailbox.list()).length, 0);
  await assert.rejects(services.mailbox.markRead(message.id), NotFoundError);
});

test('sin sesión: list lanza AuthError y unreadCount es 0', async () => {
  const { services } = await createTestContainer();
  await assert.rejects(services.mailbox.list(), AuthError);
  assert.equal(await services.mailbox.unreadCount(), 0);
});
