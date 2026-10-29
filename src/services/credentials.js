import { hashPassword, randomHex } from '../infra/crypto.js';

const SALT_BYTES = 16;

export async function createCredentials(password, random) {
  const sal = randomHex(SALT_BYTES, random);
  return { sal, contrasenaHash: await hashPassword(password, sal) };
}

export async function verifyPassword(password, user) {
  return user.contrasenaHash === await hashPassword(String(password ?? ''), user.sal);
}
