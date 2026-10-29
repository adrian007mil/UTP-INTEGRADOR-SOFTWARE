import { ForbiddenError, ConflictError, ValidationError } from '../core/errors.js';

export const REVIEW_LIMITS = { MIN_RATING: 1, MAX_RATING: 5, MIN_COMMENT: 3, MAX_COMMENT: 500 };
const REASONS = {
  login: 'Inicia sesión para dejar una reseña',
  purchase: 'Compra este producto para reseñarlo',
  done: 'Ya reseñaste este producto',
};

function validateReview({ calificacion, comentario }) {
  const rating = typeof calificacion === 'string' && calificacion.trim() !== '' ? Number(calificacion) : calificacion;
  const text = String(comentario ?? '').trim();
  const fields = {};
  if (!Number.isInteger(rating) || rating < REVIEW_LIMITS.MIN_RATING || rating > REVIEW_LIMITS.MAX_RATING) fields.calificacion = 'Elige de 1 a 5 estrellas';
  if (text.length < REVIEW_LIMITS.MIN_COMMENT || text.length > REVIEW_LIMITS.MAX_COMMENT) {
    fields.comentario = `El comentario debe tener entre ${REVIEW_LIMITS.MIN_COMMENT} y ${REVIEW_LIMITS.MAX_COMMENT} caracteres`;
  }
  if (Object.keys(fields).length) throw new ValidationError('Revisa tu reseña', fields);
  return { calificacion: rating, comentario: text };
}

export function createReviewService({ collections, services, deps }) {
  async function purchaseOf(idUsuario, idProducto) {
    const pagados = await collections.pedidos.findBy(p => p.idUsuario === idUsuario && p.estado === 'PAGADO');
    const ids = new Set(pagados.map(p => p.id));
    return collections.detallesPedido.findOneBy(d => ids.has(d.idPedido) && d.idProducto === Number(idProducto));
  }

  const existingReview = (idUsuario, idProducto) => collections.resenas.findOneBy(r => r.idUsuario === idUsuario && r.idProducto === Number(idProducto));

  async function listReviews(idProducto) {
    const [resenas, usuarios] = await Promise.all([collections.resenas.findBy(r => r.idProducto === Number(idProducto)), collections.usuarios.findAll()]);
    return resenas.sort((a, b) => b.fechaResena.localeCompare(a.fechaResena) || b.id - a.id).map(resena => {
      const usuario = usuarios.find(u => u.id === resena.idUsuario);
      return { resena, autor: usuario ? `${usuario.nombres} ${usuario.apellidos.charAt(0)}.` : 'Cliente' };
    });
  }

  async function canReview(idProducto) {
    const user = await services.auth.currentUser();
    if (!user) return { puede: false, motivo: REASONS.login };
    if (!(await purchaseOf(user.id, idProducto))) return { puede: false, motivo: REASONS.purchase };
    if (await existingReview(user.id, idProducto)) return { puede: false, motivo: REASONS.done };
    return { puede: true, motivo: null };
  }

  async function addReview(idProducto, data) {
    const user = await services.auth.requireUser();
    const valid = validateReview(data ?? {});
    const purchase = await purchaseOf(user.id, idProducto);
    if (!purchase) throw new ForbiddenError(REASONS.purchase);
    if (await existingReview(user.id, idProducto)) throw new ConflictError(REASONS.done);
    return collections.resenas.insert({
      idUsuario: user.id, idProducto: Number(idProducto), idPedido: purchase.idPedido, ...valid, fechaResena: deps.now().toISOString(),
    });
  }

  return { listReviews, canReview, addReview };
}
