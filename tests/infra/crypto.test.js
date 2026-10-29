import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { hashPassword, randomHex } from '../../src/infra/crypto.js';

test('hashPassword es determinista y depende de la sal', async () => {
  assert.equal(await hashPassword('Demo2026!', 'ab'), await hashPassword('Demo2026!', 'ab'));
  assert.notEqual(await hashPassword('Demo2026!', 'ab'), await hashPassword('Demo2026!', 'cd'));
});

test('hashPassword produce SHA-256 en hex de sal:contraseña', async () => {
  assert.equal(await hashPassword('b', 'a'), createHash('sha256').update('a:b').digest('hex'));
});

test('randomHex usa la fuente aleatoria inyectada', () => {
  const random = n => Uint8Array.from({ length: n }, (_, i) => i * 17);
  assert.equal(randomHex(4, random), '00112233');
});
