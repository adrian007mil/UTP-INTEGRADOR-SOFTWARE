import { AuthError } from '../core/errors.js';
import { validatePasswordChange } from '../core/validators.js';
import { randomHex } from '../infra/crypto.js';
import { createCredentials } from './credentials.js';

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const TOKEN_BYTES = 16;
const INVALID_LINK = 'El enlace no es válido o ya venció';

export function createPasswordResetService({ collections, services, deps }) {
  async function request(email) {
    const normalized = String(email ?? '').trim().toLowerCase();
    const user = await collections.usuarios.findOneBy(u => u.email === normalized && u.estado === 'A');
    if (!user) return { enlaceDemo: null };
    const now = deps.now();
    const token = randomHex(TOKEN_BYTES, deps.random);
    await collections.tokensRecuperacion.insert({
      idUsuario: user.id, token, fechaSolicitud: now.toISOString(), fechaExpiracion: new Date(now.getTime() + RESET_TOKEN_TTL_MS).toISOString(), usado: false,
    });
    const enlace = `#/restablecer/${token}`;
    await services.mailbox.send(user.id, {
      asunto: 'Restablece tu contraseña',
      cuerpo: 'Recibimos una solicitud para restablecer tu contraseña. El enlace vence en 30 minutos. Si no fuiste tú, ignora este mensaje.',
      enlace,
    });
    return { enlaceDemo: enlace };
  }

  async function findValidToken(token) {
    const now = deps.now().toISOString();
    return collections.tokensRecuperacion.findOneBy(t => t.token === String(token) && !t.usado && t.fechaExpiracion > now);
  }

  async function isValid(token) {
    return Boolean(await findValidToken(token));
  }

  async function reset(token, nueva, confirmacion) {
    const record = await findValidToken(token);
    if (!record) throw new AuthError(INVALID_LINK);
    const contrasena = validatePasswordChange({ contrasena: nueva, confirmacion });
    await collections.usuarios.update(record.idUsuario, await createCredentials(contrasena, deps.random));
    await collections.tokensRecuperacion.update(record.id, { usado: true });
  }

  return { request, reset, isValid };
}
