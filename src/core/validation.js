import { ValidationError } from './errors.js';

export const PATTERNS = {
  dni: /^\d{8}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  usuario: /^[a-zA-Z0-9._]{4,20}$/,
  celular: /^9\d{8}$/,
  ruc: /^(10|20)\d{9}$/,
};

export const text = value => String(value ?? '').trim();

export function lengthRule(min, max, label) {
  return value => (value.length < min || value.length > max ? `${label} debe tener entre ${min} y ${max} caracteres` : null);
}

export function patternRule(pattern, message) {
  return value => (pattern.test(value) ? null : message);
}

export function optional(rule) {
  return (value, data) => (value === '' ? null : rule(value, data));
}

export function validate(data, schema, message = 'Revisa los datos del formulario') {
  const result = {};
  const fields = {};
  for (const [field, { normalize = text, rules }] of Object.entries(schema)) {
    const value = normalize(data?.[field]);
    const failure = rules.map(rule => rule(value, data ?? {})).find(Boolean);
    if (failure) fields[field] = failure;
    result[field] = value;
  }
  if (Object.keys(fields).length > 0) throw new ValidationError(message, fields);
  return result;
}
