import { validateProduct } from '../core/product-validators.js';
import { ConflictError } from '../core/errors.js';
import { syncStockAlert } from './stock-alerts.js';

const DEFAULT_VISUALS = { FISICO: '🎸', DIGITAL: '📄', AUDIOVISUAL: '▶' };
const DEFAULT_TONE = 'sand';

export function createAdminProductService({ collections, services, deps }) {
  const timestamp = () => deps.now().toISOString();

  async function validated(data) {
    const [categorias, marcas] = await Promise.all([collections.categorias.findAll(), collections.marcas.findAll()]);
    return validateProduct(data, { categorias, marcas });
  }

  async function saveStock(idProducto, inventario) {
    const existing = await collections.inventario.findOneBy(i => i.idProducto === idProducto);
    const row = existing
      ? await collections.inventario.update(existing.id, { ...inventario, fechaActualizacion: timestamp() })
      : await collections.inventario.insert({ idProducto, ...inventario, fechaActualizacion: timestamp() });
    await syncStockAlert(collections, row, timestamp());
  }

  async function list() {
    await services.auth.requireAdmin();
    const context = await services.catalog.loadContext();
    const productos = await collections.productos.findAll();
    return productos.map(p => services.catalog.toView(p, context));
  }

  async function create(data) {
    await services.auth.requireAdmin();
    const { producto, inventario } = await validated(data);
    const created = await collections.productos.insert({
      visual: DEFAULT_VISUALS[producto.tipoProducto], tono: DEFAULT_TONE, precioAnterior: null, tipoInstrumento: '', familia: '',
      ...producto, estado: 'A', fechaCreacion: timestamp(),
    });
    if (inventario) await saveStock(created.id, inventario);
    return created;
  }

  async function update(id, data) {
    await services.auth.requireAdmin();
    const current = await collections.productos.findById(id);
    const { producto, inventario } = await validated(data);
    if (producto.tipoProducto !== current.tipoProducto) throw new ConflictError('No se puede cambiar el tipo de un producto existente');
    const updated = await collections.productos.update(current.id, producto);
    if (inventario) await saveStock(current.id, inventario);
    return updated;
  }

  async function setActive(id, activo) {
    await services.auth.requireAdmin();
    return collections.productos.update(id, { estado: activo ? 'A' : 'I' });
  }

  async function remove(id) {
    await services.auth.requireAdmin();
    const producto = await collections.productos.findById(id);
    if (await collections.detallesPedido.findOneBy(d => d.idProducto === producto.id)) {
      throw new ConflictError('Este producto tiene ventas; deshabilítalo en su lugar');
    }
    const inventario = await collections.inventario.findOneBy(i => i.idProducto === producto.id);
    if (inventario) await collections.inventario.remove(inventario.id);
    for (const alerta of await collections.alertasStock.findBy(a => a.idProducto === producto.id)) await collections.alertasStock.remove(alerta.id);
    await collections.productos.remove(producto.id);
  }

  return { list, create, update, setActive, remove };
}
