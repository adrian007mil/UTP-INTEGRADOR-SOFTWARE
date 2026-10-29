import { ValidationError, ConflictError } from '../core/errors.js';
import { validate, text, lengthRule, optional } from '../core/validation.js';
import { normalizeText } from '../core/catalog-filter.js';

export const CATEGORY_LIMITS = { NOMBRE: [2, 60], DESCRIPCION: [0, 200] };

const CATEGORY_SCHEMA = {
  nombre: { rules: [lengthRule(...CATEGORY_LIMITS.NOMBRE, 'El nombre')] },
  descripcion: { rules: [optional(lengthRule(...CATEGORY_LIMITS.DESCRIPCION, 'La descripción'))] },
};

export function createAdminCategoryService({ collections, services }) {
  async function parentId(raw) {
    const value = text(raw);
    if (!value) return null;
    const padre = await collections.categorias.findById(value);
    if (padre.idCategoriaPadre !== null) throw new ValidationError('Solo se permiten dos niveles de categorías', { idCategoriaPadre: 'Elige una categoría principal' });
    return padre.id;
  }

  async function assertUniqueName(nombre, idCategoriaPadre, exceptId) {
    const siblings = await collections.categorias.findBy(c => c.idCategoriaPadre === idCategoriaPadre && c.id !== exceptId);
    if (siblings.some(c => normalizeText(c.nombre) === normalizeText(nombre))) throw new ConflictError(`Ya existe la categoría «${nombre}» en ese nivel`);
  }

  async function list() {
    await services.auth.requireAdmin();
    const [categorias, productos] = await Promise.all([collections.categorias.findAll(), collections.productos.findAll()]);
    const withCount = c => ({ ...c, totalProductos: productos.filter(p => p.idCategoria === c.id).length });
    return categorias.filter(c => c.idCategoriaPadre === null)
      .map(padre => ({ ...withCount(padre), hijas: categorias.filter(c => c.idCategoriaPadre === padre.id).map(withCount) }));
  }

  async function create(data) {
    await services.auth.requireAdmin();
    const valid = validate(data, CATEGORY_SCHEMA, 'Revisa los datos de la categoría');
    const idCategoriaPadre = await parentId(data?.idCategoriaPadre);
    await assertUniqueName(valid.nombre, idCategoriaPadre, null);
    return collections.categorias.insert({ ...valid, idCategoriaPadre, estado: 'A' });
  }

  async function update(id, data) {
    await services.auth.requireAdmin();
    const current = await collections.categorias.findById(id);
    const valid = validate(data, CATEGORY_SCHEMA, 'Revisa los datos de la categoría');
    await assertUniqueName(valid.nombre, current.idCategoriaPadre, current.id);
    return collections.categorias.update(current.id, valid);
  }

  async function remove(id) {
    await services.auth.requireAdmin();
    const categoria = await collections.categorias.findById(id);
    const inUse = await collections.productos.findOneBy(p => p.idCategoria === categoria.id)
      ?? await collections.categorias.findOneBy(c => c.idCategoriaPadre === categoria.id);
    if (inUse) throw new ConflictError('La categoría tiene productos o subcategorías');
    await collections.categorias.remove(categoria.id);
  }

  return { list, create, update, remove };
}
