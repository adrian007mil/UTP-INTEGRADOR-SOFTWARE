import { validateRegistration } from '../core/validators.js';
import { AuthError, ConflictError, ForbiddenError } from '../core/errors.js';
import { hashPassword, randomHex } from '../infra/crypto.js';

const SESSION_KEY = 'sesion';
const SALT_BYTES = 16;
const ACTIVE = 'A';
const INVALID_CREDENTIALS = 'Usuario o contraseña incorrectos';
const UNIQUE_FIELDS = [['email', 'correo'], ['usuario', 'nombre de usuario'], ['dni', 'DNI']];

export function publicUser(user) {
  const { contrasenaHash, sal, ...safe } = user;
  return safe;
}

export function createAuthService({ store, collections, deps }) {
  const listeners = new Set();
  async function notify(user) {
    for (const listener of listeners) await listener(user);
  }

  async function ensureUnique(data) {
    const usuarios = await collections.usuarios.findAll();
    for (const [field, label] of UNIQUE_FIELDS) {
      if (usuarios.some(u => u[field].toLowerCase() === data[field].toLowerCase())) {
        throw new ConflictError(`Ya existe una cuenta con ese ${label}`);
      }
    }
  }

  async function startSession(user) {
    await collections.usuarios.update(user.id, { ultimoAcceso: deps.now().toISOString() });
    store.write(SESSION_KEY, { idUsuario: user.id });
    const safe = publicUser(user);
    await notify(safe);
    return safe;
  }

  async function register(data) {
    const { contrasena, ...valid } = validateRegistration(data);
    await ensureUnique(valid);
    const sal = randomHex(SALT_BYTES, deps.random);
    const user = await collections.usuarios.insert({
      ...valid, rol: 'CLIENTE', sal, contrasenaHash: await hashPassword(contrasena, sal),
      estado: ACTIVE, fechaRegistro: deps.now().toISOString(), ultimoAcceso: null,
    });
    return startSession(user);
  }

  async function login(identificador, contrasena) {
    const id = String(identificador ?? '').trim().toLowerCase();
    const user = await collections.usuarios.findOneBy(u => u.usuario.toLowerCase() === id || u.email === id);
    if (!user || user.contrasenaHash !== await hashPassword(String(contrasena ?? ''), user.sal)) throw new AuthError(INVALID_CREDENTIALS);
    if (user.estado !== ACTIVE) throw new AuthError('Tu cuenta está desactivada');
    return startSession(user);
  }

  async function logout() {
    store.write(SESSION_KEY, null);
    await notify(null);
  }

  async function currentUser() {
    const session = store.read(SESSION_KEY, null);
    if (!session) return null;
    const user = await collections.usuarios.findOneBy(u => u.id === session.idUsuario && u.estado === ACTIVE);
    return user ? publicUser(user) : null;
  }

  async function requireUser() {
    const user = await currentUser();
    if (!user) throw new AuthError('Inicia sesión para continuar');
    return user;
  }

  async function requireAdmin() {
    const user = await requireUser();
    if (user.rol !== 'ADMIN') throw new ForbiddenError('Esta acción es solo para administradores');
    return user;
  }

  function onSessionChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { register, login, logout, currentUser, requireUser, requireAdmin, onSessionChange };
}
