import { ValidationError } from './errors.js';

export const TEST_CARDS = {
  '4111111111111111': { estado: 'APROBADO', respuesta: 'Pago aprobado', descripcion: 'Aprobada' },
  '4000000000000002': { estado: 'RECHAZADO', respuesta: 'Fondos insuficientes', descripcion: 'Rechazada por fondos' },
  '4000000000000069': { estado: 'RECHAZADO', respuesta: 'Tarjeta vencida', descripcion: 'Rechazada por vencimiento' },
};
export const WALLET_APPROVAL_CODE = '123456';
export const WALLET_PROVIDERS = ['YAPE', 'PLIN'];
export const BANK_ACCOUNT = { banco: 'BCP (simulado)', cuenta: '193-0000000-0-00', cci: '00219300000000000000', titular: 'OmniMelody S.A.C.' };
export const PAYMENT_METHODS = ['TARJETA', 'BILLETERA', 'TRANSFERENCIA'];

const TRANSACTION_BYTES = 6;
const CENTURY = 2000;
const CARD_LENGTH = { MIN: 13, MAX: 19 };
const HOLDER_LENGTH = { MIN: 3, MAX: 60 };
const UNKNOWN_CARD = 'Tarjeta no reconocida por la pasarela de prueba';

export function isLuhnValid(digits) {
  const sum = [...digits].reverse().reduce((acc, char, index) => {
    const value = Number(char) * (index % 2 === 1 ? 2 : 1);
    return acc + (value > 9 ? value - 9 : value);
  }, 0);
  return sum % 10 === 0;
}

function isExpired(vencimiento, now) {
  const [month, year] = vencimiento.split('/').map(Number);
  const firstDayAfterExpiry = new Date(CENTURY + year, month, 1);
  return firstDayAfterExpiry <= now;
}

function cardErrors({ numero, titular, vencimiento, cvv }, now) {
  const errors = {};
  if (numero.length < CARD_LENGTH.MIN || numero.length > CARD_LENGTH.MAX || !/^\d+$/.test(numero) || !isLuhnValid(numero)) errors.numero = 'Número de tarjeta inválido';
  if (titular.length < HOLDER_LENGTH.MIN || titular.length > HOLDER_LENGTH.MAX) errors.titular = 'Escribe el nombre como aparece en la tarjeta';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(vencimiento)) errors.vencimiento = 'Usa el formato MM/AA';
  else if (isExpired(vencimiento, now)) errors.vencimiento = 'La tarjeta está vencida';
  if (!/^\d{3}$/.test(cvv)) errors.cvv = 'El CVV tiene 3 dígitos';
  return errors;
}

function walletErrors({ proveedor, celular, codigoAprobacion }) {
  const errors = {};
  if (!WALLET_PROVIDERS.includes(proveedor)) errors.proveedor = 'Elige Yape o Plin';
  if (!/^9\d{8}$/.test(celular)) errors.celular = 'El celular debe tener 9 dígitos y empezar con 9';
  if (!/^\d{6}$/.test(codigoAprobacion)) errors.codigoAprobacion = 'El código tiene 6 dígitos';
  return errors;
}

function assertNoErrors(errors) {
  if (Object.keys(errors).length > 0) throw new ValidationError('Revisa los datos de pago', errors);
}

const clean = value => String(value ?? '').trim();

function decideCard(detalles, now) {
  const data = { numero: clean(detalles.numero).replace(/\s+/g, ''), titular: clean(detalles.titular), vencimiento: clean(detalles.vencimiento), cvv: clean(detalles.cvv) };
  assertNoErrors(cardErrors(data, now));
  const known = TEST_CARDS[data.numero];
  return known ? { estado: known.estado, respuesta: known.respuesta } : { estado: 'RECHAZADO', respuesta: UNKNOWN_CARD };
}

function decideWallet(detalles) {
  const data = { proveedor: clean(detalles.proveedor).toUpperCase(), celular: clean(detalles.celular), codigoAprobacion: clean(detalles.codigoAprobacion) };
  assertNoErrors(walletErrors(data));
  return data.codigoAprobacion === WALLET_APPROVAL_CODE
    ? { estado: 'APROBADO', respuesta: 'Pago aprobado' }
    : { estado: 'RECHAZADO', respuesta: 'Código de aprobación inválido' };
}

export function authorizePayment(metodo, detalles, monto, { now, randomHex }) {
  if (!PAYMENT_METHODS.includes(metodo)) throw new ValidationError('Elige un método de pago', { metodoPago: 'Método no disponible' });
  if (!(monto > 0)) throw new ValidationError('El monto a cobrar no es válido');
  const decisions = {
    TARJETA: () => decideCard(detalles ?? {}, now()),
    BILLETERA: () => decideWallet(detalles ?? {}),
    TRANSFERENCIA: () => ({ estado: 'PENDIENTE', respuesta: 'Pendiente de verificación de la transferencia' }),
  };
  const { estado, respuesta } = decisions[metodo]();
  return { estado, idTransaccion: `TX-${randomHex(TRANSACTION_BYTES).toUpperCase()}`, respuesta };
}
