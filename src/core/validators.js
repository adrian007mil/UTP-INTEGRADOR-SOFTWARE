import { PATTERNS, text, lengthRule, patternRule, optional, validate } from './validation.js';
import { PERU_DEPARTMENTS } from './peru-departments.js';

export const MIN_PASSWORD_LENGTH = 8;
const NAME_LIMITS = { MIN: 2, MAX: 100 };
const lowerText = value => text(value).toLowerCase();
const rawText = value => String(value ?? '');

function passwordRule(value) {
  if (value.length < MIN_PASSWORD_LENGTH) return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) return 'La contraseña debe combinar letras y números';
  return null;
}

export const PERSON_SCHEMA = {
  nombres: { rules: [lengthRule(NAME_LIMITS.MIN, NAME_LIMITS.MAX, 'El nombre')] },
  apellidos: { rules: [lengthRule(NAME_LIMITS.MIN, NAME_LIMITS.MAX, 'Los apellidos')] },
  email: { normalize: lowerText, rules: [patternRule(PATTERNS.email, 'Ingresa un correo válido')] },
  telefono: { rules: [optional(patternRule(PATTERNS.celular, 'El celular debe tener 9 dígitos y empezar con 9'))] },
};

export const PASSWORD_SCHEMA = {
  contrasena: { normalize: rawText, rules: [passwordRule] },
  confirmacion: { normalize: rawText, rules: [(value, data) => (value === rawText(data.contrasena) ? null : 'Las contraseñas no coinciden')] },
};

const REGISTRATION_SCHEMA = {
  ...PERSON_SCHEMA,
  dni: { rules: [patternRule(PATTERNS.dni, 'El DNI debe tener 8 dígitos')] },
  usuario: { rules: [patternRule(PATTERNS.usuario, 'Usa de 4 a 20 letras, números, punto o guion bajo')] },
  ...PASSWORD_SCHEMA,
};

export function validateRegistration(data) {
  const { confirmacion, ...valid } = validate(data, REGISTRATION_SCHEMA);
  return valid;
}

export function validatePasswordChange(data) {
  return validate(data, PASSWORD_SCHEMA).contrasena;
}

export const ADDRESS_LIMITS = { ALIAS: [2, 30], DIRECCION: [5, 150], LUGAR: [2, 60], REFERENCIA: [0, 100] };

const ADDRESS_SCHEMA = {
  alias: { rules: [lengthRule(...ADDRESS_LIMITS.ALIAS, 'El alias')] },
  direccion: { rules: [lengthRule(...ADDRESS_LIMITS.DIRECCION, 'La dirección')] },
  distrito: { rules: [lengthRule(...ADDRESS_LIMITS.LUGAR, 'El distrito')] },
  provincia: { rules: [lengthRule(...ADDRESS_LIMITS.LUGAR, 'La provincia')] },
  departamento: { rules: [value => (PERU_DEPARTMENTS.includes(value) ? null : 'Selecciona un departamento')] },
  referencia: { rules: [optional(lengthRule(...ADDRESS_LIMITS.REFERENCIA, 'La referencia'))] },
  telefono: { rules: [patternRule(PATTERNS.celular, 'El celular debe tener 9 dígitos y empezar con 9')] },
};

export function validateAddress(data) {
  return validate(data, ADDRESS_SCHEMA, 'Revisa los datos de la dirección');
}

export const RECEIPT_TYPES = ['BOLETA', 'FACTURA'];
const BUSINESS_NAME_LIMITS = [3, 150];

const INVOICE_SCHEMA = {
  ruc: { rules: [patternRule(PATTERNS.ruc, 'El RUC tiene 11 dígitos y empieza con 10 o 20')] },
  razonSocial: { rules: [lengthRule(...BUSINESS_NAME_LIMITS, 'La razón social')] },
};

export function validateReceiptData(data) {
  const { tipo } = validate(data, { tipo: { normalize: value => text(value).toUpperCase(), rules: [value => (RECEIPT_TYPES.includes(value) ? null : 'Elige boleta o factura')] } });
  if (tipo === 'BOLETA') return { tipo, ruc: null, razonSocial: null };
  return { tipo, ...validate(data, INVOICE_SCHEMA, 'Revisa los datos de facturación') };
}
