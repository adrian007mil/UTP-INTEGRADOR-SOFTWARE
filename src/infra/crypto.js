const HEX_RADIX = 16;
const HEX_PAD = 2;

function toHex(bytes) {
  return [...bytes].map(byte => byte.toString(HEX_RADIX).padStart(HEX_PAD, '0')).join('');
}

export async function hashPassword(password, sal) {
  const data = new TextEncoder().encode(`${sal}:${password}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
}

export function randomHex(bytes, random) {
  return toHex(random(bytes));
}

export function browserRandom(length) {
  return globalThis.crypto.getRandomValues(new Uint8Array(length));
}
