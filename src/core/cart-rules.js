import { ValidationError, ConflictError } from './errors.js';

export const MAX_DIGITAL_QTY = 1;

export function parseQuantity(cantidad) {
  const value = typeof cantidad === 'string' && cantidad.trim() !== '' ? Number(cantidad) : cantidad;
  if (!Number.isInteger(value) || value < 1) {
    throw new ValidationError('La cantidad debe ser un número entero mayor que cero', { cantidad: 'Cantidad inválida' });
  }
  return value;
}

export function assertPurchasable(product, stock) {
  if (product.estado !== 'A') throw new ConflictError('Este producto ya no está disponible');
  if (product.tipoProducto === 'FISICO' && stock === 0) throw new ConflictError('Este producto está agotado');
}

function assertQuantityAllowed(product, stock, cantidad) {
  if (product.tipoProducto !== 'FISICO' && cantidad > MAX_DIGITAL_QTY) {
    throw new ConflictError('Los productos digitales se compran una sola vez');
  }
  if (product.tipoProducto === 'FISICO' && cantidad > stock) throw new ConflictError(`Solo quedan ${stock} unidades`);
}

function withQuantity(items, idProducto, cantidad) {
  const exists = items.some(item => item.idProducto === idProducto);
  if (!exists) return [...items, { idProducto, cantidad }];
  return items.map(item => (item.idProducto === idProducto ? { ...item, cantidad } : item));
}

export function setQuantity(items, product, stock, cantidad) {
  const value = parseQuantity(cantidad);
  assertPurchasable(product, stock);
  assertQuantityAllowed(product, stock, value);
  return withQuantity(items, product.id, value);
}

export function addItem(items, product, stock, cantidad = 1) {
  const current = items.find(item => item.idProducto === product.id)?.cantidad ?? 0;
  return setQuantity(items, product, stock, current + parseQuantity(cantidad));
}

export function removeItem(items, idProducto) {
  return items.filter(item => item.idProducto !== Number(idProducto));
}

export function clampQuantity(product, stock, cantidad) {
  if (product.tipoProducto !== 'FISICO') return Math.min(cantidad, MAX_DIGITAL_QTY);
  return Math.min(cantidad, stock);
}
