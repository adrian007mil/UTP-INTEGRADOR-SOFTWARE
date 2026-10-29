import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextReceiptNumber, RECEIPT_SERIES } from '../../src/core/receipt-number.js';
import { validateReceiptData } from '../../src/core/validators.js';
import { fieldsOf } from '../helpers/assertions.js';

test('series fijas', () => { assert.deepEqual(RECEIPT_SERIES, { BOLETA: 'B001', FACTURA: 'F001' }); });

test('boletas y facturas son correlativas por tipo', () => {
  assert.deepEqual(nextReceiptNumber('BOLETA', []), { serie: 'B001', numero: '00000001' });
  const existing = [{ tipo: 'BOLETA', numero: '00000001' }, { tipo: 'BOLETA', numero: '00000002' }];
  assert.deepEqual(nextReceiptNumber('BOLETA', existing), { serie: 'B001', numero: '00000003' });
  assert.deepEqual(nextReceiptNumber('FACTURA', existing), { serie: 'F001', numero: '00000001' });
});

test('el correlativo sigue al mayor aunque falte alguno', () => {
  assert.equal(nextReceiptNumber('BOLETA', [{ tipo: 'BOLETA', numero: '00000007' }]).numero, '00000008');
});

test('validateReceiptData: boleta no pide RUC; factura sí', () => {
  assert.deepEqual(validateReceiptData({ tipo: 'BOLETA', ruc: '999' }), { tipo: 'BOLETA', ruc: null, razonSocial: null });
  assert.deepEqual(validateReceiptData({ tipo: 'FACTURA', ruc: '20123456789', razonSocial: ' Música S.A.C. ' }),
    { tipo: 'FACTURA', ruc: '20123456789', razonSocial: 'Música S.A.C.' });
  assert.ok(fieldsOf(() => validateReceiptData({ tipo: 'FACTURA', ruc: '30123456789', razonSocial: 'X S.A.' })).ruc);
  assert.ok(fieldsOf(() => validateReceiptData({ tipo: 'FACTURA', ruc: '20123456789', razonSocial: '' })).razonSocial);
  assert.ok(fieldsOf(() => validateReceiptData({ tipo: 'TICKET' })).tipo);
});
