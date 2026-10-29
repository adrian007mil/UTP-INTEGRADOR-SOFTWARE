import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { fieldsOf, fieldsOfAsync } from '../helpers/assertions.js';
import { validateAddress } from '../../src/core/validators.js';
import { AuthError, NotFoundError } from '../../src/core/errors.js';
import { ADDRESS, OTHER_USER, loginDemo } from '../helpers/fixtures.js';

test('validateAddress normaliza y valida', () => {
  assert.equal(validateAddress({ ...ADDRESS, alias: '  Casa ' }).alias, 'Casa');
  assert.ok(fieldsOf(() => validateAddress({ ...ADDRESS, telefono: '12345' })).telefono);
  assert.ok(fieldsOf(() => validateAddress({ ...ADDRESS, departamento: 'Narnia' })).departamento);
  assert.ok(fieldsOf(() => validateAddress({ ...ADDRESS, direccion: 'Av' })).direccion);
  assert.ok(fieldsOf(() => validateAddress({ ...ADDRESS, distrito: '' })).distrito);
  assert.ok(fieldsOf(() => validateAddress({ ...ADDRESS, referencia: 'x'.repeat(101) })).referencia);
  assert.equal(validateAddress({ ...ADDRESS, referencia: '' }).referencia, '');
});

test('sin sesión lanza AuthError', async () => {
  const { services } = await createTestContainer();
  await assert.rejects(services.addresses.list(), AuthError);
  await assert.rejects(services.addresses.add(ADDRESS), AuthError);
});

test('la primera dirección queda predeterminada y la lista la pone primero', async () => {
  const { services } = await createTestContainer();
  await loginDemo(services);
  const first = await services.addresses.add(ADDRESS);
  assert.equal(first.predeterminada, true);
  const second = await services.addresses.add({ ...ADDRESS, alias: 'Trabajo', departamento: 'Cusco' });
  assert.equal(second.predeterminada, false);
  await services.addresses.setDefault(second.id);
  const list = await services.addresses.list();
  assert.deepEqual(list.map(a => [a.alias, a.predeterminada]), [['Trabajo', true], ['Casa', false]]);
});

test('borrar la predeterminada promueve otra', async () => {
  const { services } = await createTestContainer();
  await loginDemo(services);
  const first = await services.addresses.add(ADDRESS);
  await services.addresses.add({ ...ADDRESS, alias: 'Trabajo' });
  await services.addresses.remove(first.id);
  const list = await services.addresses.list();
  assert.deepEqual(list.map(a => [a.alias, a.predeterminada]), [['Trabajo', true]]);
});

test('update valida y conserva la propiedad predeterminada', async () => {
  const { services } = await createTestContainer();
  await loginDemo(services);
  const first = await services.addresses.add(ADDRESS);
  const updated = await services.addresses.update(first.id, { ...ADDRESS, alias: 'Depa' });
  assert.equal(updated.alias, 'Depa');
  assert.equal(updated.predeterminada, true);
  assert.ok((await fieldsOfAsync(services.addresses.update(first.id, { ...ADDRESS, telefono: '1' }))).telefono);
});

test('dirección de otro usuario lanza NotFoundError', async () => {
  const { services } = await createTestContainer();
  await loginDemo(services);
  const mine = await services.addresses.add(ADDRESS);
  await services.auth.logout();
  await services.auth.register(OTHER_USER);
  await assert.rejects(services.addresses.get(mine.id), NotFoundError);
  await assert.rejects(services.addresses.remove(mine.id), NotFoundError);
  await assert.rejects(services.addresses.setDefault(mine.id), NotFoundError);
  assert.equal((await services.addresses.list()).length, 0);
});
