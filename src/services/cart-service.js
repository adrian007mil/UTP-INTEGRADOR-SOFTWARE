import { addItem, setQuantity as setItemQuantity, removeItem, clampQuantity } from '../core/cart-rules.js';
import { computeTotals, lineTotal } from '../core/totals.js';
import { ConflictError } from '../core/errors.js';
import { shippingCost, hasPhysical } from '../core/shipping.js';

const GUEST = 'invitado';
const OWNERSHIP_MESSAGES = {
  PAGADO: 'Ya tienes este producto: está en Mis descargas',
  PENDIENTE: 'Ya tienes un pedido pendiente de pago con este producto',
};

function lineProblem(producto, cantidad) {
  if (producto.estado !== 'A') return 'Ya no está disponible';
  if (producto.tipoProducto !== 'FISICO') return null;
  if (producto.stock === 0) return 'Agotado';
  return cantidad > producto.stock ? `Solo quedan ${producto.stock} unidades` : null;
}

export function createCartService({ collections, services }) {
  async function ownerId() {
    return (await services.auth.currentUser())?.id ?? GUEST;
  }

  async function loadRecord(idUsuario) {
    return (await collections.carritos.findOneBy(c => c.idUsuario === idUsuario))
      ?? collections.carritos.insert({ idUsuario, items: [] });
  }

  async function saveItems(idUsuario, items) {
    const record = await loadRecord(idUsuario);
    await collections.carritos.update(record.id, { items });
  }

  async function productView(idProducto, context) {
    return services.catalog.toView(await collections.productos.findById(idProducto), context);
  }

  async function buildLines(items) {
    const context = await services.catalog.loadContext();
    const productos = await collections.productos.findAll();
    return items.filter(item => productos.some(p => p.id === item.idProducto)).map(item => {
      const producto = services.catalog.toView(productos.find(p => p.id === item.idProducto), context);
      const { cantidad } = item;
      return { producto, cantidad, precioUnitario: producto.precio, subtotalLinea: lineTotal(producto.precio, cantidad), problema: lineProblem(producto, cantidad) };
    });
  }

  async function getCart() {
    const lines = await buildLines((await loadRecord(await ownerId())).items);
    return { lines, tieneFisicos: lines.some(l => l.producto.tipoProducto === 'FISICO'), cantidadTotal: lines.reduce((n, l) => n + l.cantidad, 0) };
  }

  async function mutate(change) {
    const idUsuario = await ownerId();
    const record = await loadRecord(idUsuario);
    await saveItems(idUsuario, await change(record.items, await services.catalog.loadContext()));
    return getCart();
  }

  async function assertNotOwned(producto) {
    if (producto.tipoProducto === 'FISICO') return;
    const status = await services.downloads.purchaseStatus(producto.id);
    if (status) throw new ConflictError(OWNERSHIP_MESSAGES[status]);
  }

  const add = (idProducto, cantidad = 1) => mutate(async (items, context) => {
    const producto = await productView(idProducto, context);
    await assertNotOwned(producto);
    return addItem(items, producto, producto.stock, cantidad);
  });

  const setQuantity = (idProducto, cantidad) => mutate(async (items, context) => {
    const producto = await productView(idProducto, context);
    await assertNotOwned(producto);
    return setItemQuantity(items, producto, producto.stock, cantidad);
  });

  const remove = idProducto => mutate(async items => removeItem(items, idProducto));
  const clear = () => mutate(async () => []);

  async function pricedLines() {
    const { lines } = await getCart();
    return lines.map(l => ({ precioUnitario: l.precioUnitario, cantidad: l.cantidad, tipoProducto: l.producto.tipoProducto }));
  }

  async function totals(departamento) {
    const priced = await pricedLines();
    return computeTotals(priced, shippingCost(priced, departamento));
  }

  async function previewTotals(departamento) {
    const priced = await pricedLines();
    if (departamento || !hasPhysical(priced)) return computeTotals(priced, shippingCost(priced, departamento));
    return { ...computeTotals(priced, 0), costoEnvio: null };
  }

  async function mergeGuestCart(idUsuario) {
    const guest = await loadRecord(GUEST);
    if (guest.items.length === 0) return;
    const merged = (await buildLines([...(await loadRecord(idUsuario)).items, ...guest.items]))
      .filter(line => !line.problema || line.producto.estado === 'A')
      .reduce((acc, line) => {
        const total = (acc.get(line.producto.id)?.cantidad ?? 0) + line.cantidad;
        return acc.set(line.producto.id, { producto: line.producto, cantidad: total });
      }, new Map());
    const purchasable = [];
    for (const entry of merged.values()) {
      if (entry.producto.tipoProducto === 'FISICO' || !(await services.downloads.purchaseStatus(entry.producto.id))) purchasable.push(entry);
    }
    const items = purchasable
      .map(({ producto, cantidad }) => ({ idProducto: producto.id, cantidad: clampQuantity(producto, producto.stock, cantidad) }))
      .filter(item => item.cantidad > 0);
    await saveItems(idUsuario, items);
    await saveItems(GUEST, []);
  }

  services.auth.onSessionChange(async user => { if (user) await mergeGuestCart(user.id); });

  return { getCart, add, setQuantity, remove, clear, totals, previewTotals, mergeGuestCart };
}
