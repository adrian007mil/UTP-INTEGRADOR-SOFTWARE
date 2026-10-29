import { ConflictError, ValidationError } from './errors.js';

export const COURIER_NAME = 'Olva Courier (simulado)';
export const SHIPMENT_STATES = ['PROCESANDO', 'ENVIADO', 'ENTREGADO'];
export const SHIPMENT_DESCRIPTIONS = {
  PROCESANDO: 'Pedido recibido y en preparación',
  ENVIADO: 'Pedido entregado al courier y en camino',
  ENTREGADO: 'Pedido entregado al cliente',
};

const TRACKING_DIGITS = 10;
const TRACKING_BYTES = TRACKING_DIGITS / 2;
const HEX = 16;
const DECIMAL = 10;

export function nextShipmentState(estado) {
  const index = SHIPMENT_STATES.indexOf(estado);
  if (index === -1) throw new ValidationError(`Estado de envío desconocido: ${estado}`);
  if (index === SHIPMENT_STATES.length - 1) throw new ConflictError('El pedido ya fue entregado');
  return SHIPMENT_STATES[index + 1];
}

export function trackingCode(randomHex) {
  const digits = [...randomHex(TRACKING_BYTES)].slice(0, TRACKING_DIGITS).map(char => parseInt(char, HEX) % DECIMAL).join('');
  return `OM${digits}`;
}
