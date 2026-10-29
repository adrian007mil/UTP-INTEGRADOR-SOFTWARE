import { ValidationError } from './errors.js';
import { PERU_DEPARTMENTS } from './peru-departments.js';

export const SHIPPING_RATES = { LIMA_CALLAO: 15, PROVINCIA: 25 };
const METROPOLITAN = new Set(['Lima', 'Callao']);

export function hasPhysical(lines) {
  return lines.some(line => line.tipoProducto === 'FISICO');
}

export function shippingCost(lines, departamento) {
  if (!hasPhysical(lines)) return 0;
  if (!PERU_DEPARTMENTS.includes(departamento)) {
    throw new ValidationError('Elige una dirección de envío válida', { departamento: 'Selecciona un departamento' });
  }
  return METROPOLITAN.has(departamento) ? SHIPPING_RATES.LIMA_CALLAO : SHIPPING_RATES.PROVINCIA;
}
