import { ConflictError } from '../core/errors.js';
import { normalizeText } from '../core/catalog-filter.js';
import { publicUser } from './auth-service.js';

function matches(user, { texto, rol }) {
  if (rol && user.rol !== rol) return false;
  const query = normalizeText(texto);
  return !query || normalizeText(`${user.nombres} ${user.apellidos} ${user.email} ${user.usuario} ${user.dni}`).includes(query);
}

export function createAdminUserService({ collections, services }) {
  async function list(filters = {}) {
    await services.auth.requireAdmin();
    const usuarios = await collections.usuarios.findAll();
    return usuarios.filter(u => matches(u, filters)).map(publicUser);
  }

  async function setActive(id, activo) {
    const admin = await services.auth.requireAdmin();
    if (Number(id) === admin.id && !activo) throw new ConflictError('No puedes desactivar tu propia cuenta');
    return publicUser(await collections.usuarios.update(id, { estado: activo ? 'A' : 'I' }));
  }

  return { list, setActive };
}
