import { ForbiddenError } from '../core/errors.js';

const DIGITAL_TYPES = new Set(['DIGITAL', 'AUDIOVISUAL']);
const NO_ACCESS = 'Este contenido se habilita cuando tu compra está pagada';

export function createDownloadService({ collections, services, deps }) {
  async function paidDigitalDetails(idUsuario) {
    const pedidos = await collections.pedidos.findBy(p => p.idUsuario === idUsuario && p.estado === 'PAGADO');
    const ids = new Set(pedidos.map(p => p.id));
    const detalles = await collections.detallesPedido.findBy(d => ids.has(d.idPedido) && DIGITAL_TYPES.has(d.tipoProducto));
    return detalles.map(detalle => ({ detalle, pedido: pedidos.find(p => p.id === detalle.idPedido) }));
  }

  async function listMyDownloads() {
    const user = await services.auth.requireUser();
    const [owned, descargas, productos] = await Promise.all([
      paidDigitalDetails(user.id), collections.descargas.findBy(d => d.idUsuario === user.id), collections.productos.findAll(),
    ]);
    return owned.map(({ detalle, pedido }) => ({
      detalle, pedido,
      producto: productos.find(p => p.id === detalle.idProducto) ?? { id: detalle.idProducto, nombre: detalle.nombre, tipoProducto: detalle.tipoProducto },
      descargas: descargas.filter(d => d.idDetalle === detalle.id).length,
    }));
  }

  async function registerDownload(idDetalle, dispositivo) {
    const user = await services.auth.requireUser();
    const owned = (await paidDigitalDetails(user.id)).find(({ detalle }) => detalle.id === Number(idDetalle));
    if (!owned) throw new ForbiddenError(NO_ACCESS);
    const producto = await collections.productos.findById(owned.detalle.idProducto);
    await collections.descargas.insert({ idDetalle: owned.detalle.id, idUsuario: user.id, fechaDescarga: deps.now().toISOString(), dispositivo: String(dispositivo ?? '') });
    return { url: producto.urlArchivo };
  }

  async function hasAccess(idProducto) {
    const user = await services.auth.currentUser();
    if (!user) return false;
    return (await paidDigitalDetails(user.id)).some(({ detalle }) => detalle.idProducto === Number(idProducto));
  }

  async function purchaseStatus(idProducto) {
    const user = await services.auth.currentUser();
    if (!user) return null;
    if (await hasAccess(idProducto)) return 'PAGADO';
    const pendientes = new Set((await collections.pedidos.findBy(p => p.idUsuario === user.id && p.estado === 'PENDIENTE_PAGO')).map(p => p.id));
    const pending = await collections.detallesPedido.findOneBy(det => pendientes.has(det.idPedido) && det.idProducto === Number(idProducto));
    return pending ? 'PENDIENTE' : null;
  }

  return { listMyDownloads, registerDownload, hasAccess, purchaseStatus };
}
