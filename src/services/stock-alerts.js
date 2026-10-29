export async function syncStockAlert(collections, inventario, fecha) {
  const pending = await collections.alertasStock.findBy(a => a.idProducto === inventario.idProducto && a.estado === 'PENDIENTE');
  if (inventario.stock > inventario.stockMinimo) {
    for (const alerta of pending) await collections.alertasStock.update(alerta.id, { estado: 'ATENDIDA' });
    return;
  }
  if (pending.length > 0) return;
  await collections.alertasStock.insert({
    idProducto: inventario.idProducto, stockActual: inventario.stock, stockMinimo: inventario.stockMinimo, fechaAlerta: fecha, estado: 'PENDIENTE',
  });
}
