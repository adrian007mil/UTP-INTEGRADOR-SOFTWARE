import { validateProfile, validatePasswordChange } from '../core/validators.js';
import { AuthError, ConflictError } from '../core/errors.js';
import { createCredentials, verifyPassword } from './credentials.js';
import { publicUser } from './auth-service.js';

export function createProfileService({ collections, services, deps }) {
  async function updateProfile(data) {
    const user = await services.auth.requireUser();
    const valid = validateProfile(data);
    const taken = await collections.usuarios.findOneBy(u => u.id !== user.id && u.email.toLowerCase() === valid.email);
    if (taken) throw new ConflictError('Ese correo ya pertenece a otra cuenta');
    return publicUser(await collections.usuarios.update(user.id, valid));
  }

  async function changePassword(actual, nueva, confirmacion) {
    const user = await collections.usuarios.findById((await services.auth.requireUser()).id);
    if (!(await verifyPassword(actual, user))) throw new AuthError('La contraseña actual no es correcta');
    const contrasena = validatePasswordChange({ contrasena: nueva, confirmacion });
    await collections.usuarios.update(user.id, await createCredentials(contrasena, deps.random));
  }

  return { updateProfile, changePassword };
}
