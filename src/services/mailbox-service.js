import { NotFoundError } from '../core/errors.js';

const newestFirst = (a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id;

export function createMailboxService({ collections, services, deps }) {
  async function send(idUsuario, { asunto, cuerpo, enlace = null }) {
    return collections.buzon.insert({ idUsuario, asunto, cuerpo, enlace, fecha: deps.now().toISOString(), leido: false });
  }

  async function list() {
    const user = await services.auth.requireUser();
    return (await collections.buzon.findBy(m => m.idUsuario === user.id)).sort(newestFirst);
  }

  async function unreadCount() {
    const user = await services.auth.currentUser();
    if (!user) return 0;
    return (await collections.buzon.findBy(m => m.idUsuario === user.id && !m.leido)).length;
  }

  async function markRead(id) {
    const user = await services.auth.requireUser();
    const message = await collections.buzon.findOneBy(m => m.id === Number(id) && m.idUsuario === user.id);
    if (!message) throw new NotFoundError('No encontramos ese mensaje');
    return collections.buzon.update(message.id, { leido: true });
  }

  return { send, list, unreadCount, markRead };
}
