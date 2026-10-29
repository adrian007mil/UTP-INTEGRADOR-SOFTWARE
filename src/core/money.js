import { ValidationError } from './errors.js';

export const IGV_RATE = 0.18;
const CENTS_PER_UNIT = 100;
// toFixed absorbs binary float noise (447.455 * 100 = 44745.4999…) before rounding.
const FLOAT_NOISE_DIGITS = 6;

const moneyFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function toCents(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new ValidationError('El monto debe ser un número válido');
  }
  return Math.round(Number((amount * CENTS_PER_UNIT).toFixed(FLOAT_NOISE_DIGITS)));
}

export function fromCents(cents) {
  return cents / CENTS_PER_UNIT;
}

export function formatMoney(amount) {
  return `S/ ${moneyFormatter.format(fromCents(toCents(amount)))}`;
}
