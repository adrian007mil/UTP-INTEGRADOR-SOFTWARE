import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IGV_RATE, toCents, fromCents, formatMoney } from '../../src/core/money.js';
import { ValidationError } from '../../src/core/errors.js';

test('IGV es 18 %', () => { assert.equal(IGV_RATE, 0.18); });

test('formatMoney usa S/ y separador de miles', () => {
  assert.equal(formatMoney(1299), 'S/ 1,299.00');
  assert.equal(formatMoney(0), 'S/ 0.00');
  assert.equal(formatMoney(24.5), 'S/ 24.50');
});

test('toCents redondea al céntimo', () => {
  assert.equal(toCents(447.455), 44746);
  assert.equal(fromCents(44746), 447.46);
});

test('toCents rechaza valores no finitos', () => {
  assert.throws(() => toCents(NaN), ValidationError);
  assert.throws(() => toCents(Infinity), ValidationError);
  assert.throws(() => toCents('12'), ValidationError);
});
