import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorizePayment, TEST_CARDS, WALLET_APPROVAL_CODE, BANK_ACCOUNT, isLuhnValid } from '../../src/core/payment-gateway.js';
import { fieldsOf } from '../helpers/assertions.js';

const deps = { now: () => new Date('2026-11-02T10:00:00-05:00'), randomHex: bytes => 'ab'.repeat(bytes) };
const card = numero => ({ numero, titular: 'LUCIA FERNANDEZ', vencimiento: '12/28', cvv: '123' });
const pay = (metodo, detalles) => authorizePayment(metodo, detalles, 100, deps);

test('las tarjetas de prueba están publicadas para la UI', () => {
  assert.deepEqual(Object.keys(TEST_CARDS), ['4111111111111111', '4000000000000002', '4000000000000069']);
  assert.equal(WALLET_APPROVAL_CODE, '123456');
  assert.equal(BANK_ACCOUNT.titular, 'OmniMelody S.A.C.');
});

test('tarjeta aprobada devuelve código de transacción', () => {
  assert.deepEqual(pay('TARJETA', card('4111111111111111')), { estado: 'APROBADO', idTransaccion: 'TX-ABABABABABAB', respuesta: 'Pago aprobado' });
});

test('número con espacios aprueba igual', () => {
  assert.equal(pay('TARJETA', card('4111 1111 1111 1111')).estado, 'APROBADO');
});

test('tarjetas de rechazo con su motivo exacto', () => {
  assert.deepEqual(pay('TARJETA', card('4000000000000002')), { estado: 'RECHAZADO', idTransaccion: 'TX-ABABABABABAB', respuesta: 'Fondos insuficientes' });
  assert.equal(pay('TARJETA', card('4000000000000069')).respuesta, 'Tarjeta vencida');
  assert.equal(pay('TARJETA', card('5555555555554444')).respuesta, 'Tarjeta no reconocida por la pasarela de prueba');
});

test('Luhn inválido, CVV y titular inválidos lanzan ValidationError por campo', () => {
  assert.equal(isLuhnValid('4111111111111112'), false);
  assert.ok(fieldsOf(() => pay('TARJETA', card('4111111111111112'))).numero);
  assert.ok(fieldsOf(() => pay('TARJETA', { ...card('4111111111111111'), cvv: '12' })).cvv);
  assert.ok(fieldsOf(() => pay('TARJETA', { ...card('4111111111111111'), titular: '' })).titular);
});

test('vencimiento pasado o mal formado lanza ValidationError', () => {
  assert.ok(fieldsOf(() => pay('TARJETA', { ...card('4111111111111111'), vencimiento: '10/26' })).vencimiento);
  assert.ok(fieldsOf(() => pay('TARJETA', { ...card('4111111111111111'), vencimiento: '13/27' })).vencimiento);
  assert.ok(fieldsOf(() => pay('TARJETA', { ...card('4111111111111111'), vencimiento: '1227' })).vencimiento);
  assert.equal(pay('TARJETA', { ...card('4111111111111111'), vencimiento: '11/26' }).estado, 'APROBADO');
});

test('billetera: código correcto aprueba y otro rechaza', () => {
  const wallet = { proveedor: 'YAPE', celular: '987654321', codigoAprobacion: '123456' };
  assert.equal(pay('BILLETERA', wallet).estado, 'APROBADO');
  assert.deepEqual(pay('BILLETERA', { ...wallet, codigoAprobacion: '654321' }).respuesta, 'Código de aprobación inválido');
  assert.ok(fieldsOf(() => pay('BILLETERA', { ...wallet, celular: '12345' })).celular);
  assert.ok(fieldsOf(() => pay('BILLETERA', { ...wallet, proveedor: 'OTRO' })).proveedor);
});

test('transferencia queda pendiente', () => {
  assert.deepEqual(pay('TRANSFERENCIA', {}), { estado: 'PENDIENTE', idTransaccion: 'TX-ABABABABABAB', respuesta: 'Pendiente de verificación de la transferencia' });
});

test('método desconocido o monto inválido lanzan ValidationError', () => {
  assert.ok(fieldsOf(() => pay('CHEQUE', {})).metodoPago);
  assert.throws(() => authorizePayment('TRANSFERENCIA', {}, 0, deps), { name: 'ValidationError' });
});
