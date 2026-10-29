import { filterProducts, sortProducts } from '../core/catalog-filter.js';
import { NotFoundError } from '../core/errors.js';

const ACTIVE = 'A';
const RATING_DECIMALS = 10;

function ratingSummary(resenas, idProducto) {
  const own = resenas.filter(r => r.idProducto === idProducto);
  if (own.length === 0) return { calificacionPromedio: 0, totalResenas: 0 };
  const average = own.reduce((sum, r) => sum + r.calificacion, 0) / own.length;
  return { calificacionPromedio: Math.round(average * RATING_DECIMALS) / RATING_DECIMALS, totalResenas: own.length };
}

export function createCatalogService({ collections }) {
  async function loadContext() {
    const [categorias, marcas, inventario, resenas] = await Promise.all([
      collections.categorias.findAll(), collections.marcas.findAll(), collections.inventario.findAll(), collections.resenas.findAll(),
    ]);
    return { categorias, marcas, inventario, resenas };
  }

  function toView(producto, context) {
    const stockRow = context.inventario.find(i => i.idProducto === producto.id);
    return {
      ...producto,
      stock: producto.tipoProducto === 'FISICO' ? (stockRow?.stock ?? 0) : null,
      stockMinimo: stockRow?.stockMinimo ?? null,
      marca: context.marcas.find(m => m.id === producto.idMarca),
      categoria: context.categorias.find(c => c.id === producto.idCategoria),
      ...ratingSummary(context.resenas, producto.id),
    };
  }

  async function listProducts({ orden, ...criteria } = {}) {
    const context = await loadContext();
    const activos = await collections.productos.findBy(p => p.estado === ACTIVE);
    const views = activos.map(p => toView(p, context));
    return sortProducts(filterProducts(views, criteria, context.categorias), orden);
  }

  async function getProduct(id) {
    const producto = await collections.productos.findById(id);
    if (producto.estado !== ACTIVE) throw new NotFoundError('El producto no está disponible');
    return toView(producto, await loadContext());
  }

  async function listCategories() {
    const categorias = (await collections.categorias.findAll()).filter(c => c.estado === ACTIVE);
    return categorias.filter(c => c.idCategoriaPadre === null)
      .map(padre => ({ ...padre, hijas: categorias.filter(c => c.idCategoriaPadre === padre.id) }));
  }

  async function listBrands() {
    const marcas = await collections.marcas.findBy(m => m.estado === ACTIVE);
    return marcas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  return { listProducts, getProduct, listCategories, listBrands, toView, loadContext };
}
