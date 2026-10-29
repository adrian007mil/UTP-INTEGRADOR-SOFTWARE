import { ConflictError, ForbiddenError, ValidationError } from '../core/errors.js';

export const MAX_COMPARE = 3;
const GUEST = 'invitado';
const PERCENT = 100;

export function createPreferencesService({ collections, services }) {
  async function record() {
    const idUsuario = (await services.auth.currentUser())?.id ?? GUEST;
    return (await collections.preferencias.findOneBy(p => p.idUsuario === idUsuario))
      ?? collections.preferencias.insert({ idUsuario, favoritos: [], comparar: [], progreso: {} });
  }

  const save = async (prefs, patch) => collections.preferencias.update(prefs.id, patch);
  const toggled = (list, id) => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

  async function activeViews(ids) {
    const all = await services.catalog.listProducts({});
    return ids.map(id => all.find(p => p.id === id)).filter(Boolean);
  }

  async function toggleFavorite(idProducto) {
    const producto = await collections.productos.findById(idProducto);
    const prefs = await record();
    const favoritos = toggled(prefs.favoritos, producto.id);
    await save(prefs, { favoritos });
    return favoritos.includes(producto.id);
  }

  async function toggleCompare(idProducto) {
    const producto = await collections.productos.findById(idProducto);
    if (producto.tipoProducto !== 'FISICO') throw new ValidationError('Solo puedes comparar instrumentos');
    const prefs = await record();
    if (!prefs.comparar.includes(producto.id) && prefs.comparar.length >= MAX_COMPARE) throw new ConflictError(`Puedes comparar hasta ${MAX_COMPARE} instrumentos`);
    const comparar = toggled(prefs.comparar, producto.id);
    await save(prefs, { comparar });
    return comparar.includes(producto.id);
  }

  function progressOf(prefs, producto) {
    const completados = [...(prefs.progreso[producto.id] ?? [])].sort((a, b) => a - b);
    return { completados, porcentaje: Math.round((completados.length / producto.capitulos.length) * PERCENT) };
  }

  async function toggleChapter(idProducto, indice) {
    const producto = await collections.productos.findById(idProducto);
    if (!(await services.downloads.hasAccess(producto.id))) throw new ForbiddenError('Compra el curso para registrar tu avance');
    const index = Number(indice);
    if (!Number.isInteger(index) || index < 0 || index >= (producto.capitulos?.length ?? 0)) throw new ValidationError('Capítulo inválido');
    const prefs = await record();
    const progreso = { ...prefs.progreso, [producto.id]: toggled(prefs.progreso[producto.id] ?? [], index) };
    return progressOf(await save(prefs, { progreso }), producto);
  }

  async function progress(idProducto) {
    return progressOf(await record(), await collections.productos.findById(idProducto));
  }

  return {
    toggleFavorite, toggleCompare, toggleChapter, progress,
    flags: async () => { const { favoritos, comparar } = await record(); return { favoritos, comparar }; },
    listFavorites: async () => activeViews((await record()).favoritos),
    listCompare: async () => activeViews((await record()).comparar),
    clearCompare: async () => save(await record(), { comparar: [] }),
  };
}
