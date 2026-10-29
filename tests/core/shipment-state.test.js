import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextShipmentState, trackingCode, SHIPMENT_STATES, SHIPMENT_DESCRIPTIONS } from '../../src/core/shipment-state.js';
import { ConflictError, ValidationError } from '../../src/core/errors.js';

test('los estados avanzan en orden', () => {
  assert.deepEqual(SHIPMENT_STATES, ['PROCESANDO', 'ENVIADO', 'ENTREGADO']);
  assert.equal(nextShipmentState('PROCESANDO'), 'ENVIADO');
  assert.equal(nextShipmentState('ENVIADO'), 'ENTREGADO');
  assert.ok(SHIPMENT_STATES.every(s => SHIPMENT_DESCRIPTIONS[s]));
});

test('ENTREGADO no avanza y un estado desconocido es inválido', () => {
  assert.throws(() => nextShipmentState('ENTREGADO'), ConflictError);
  assert.throws(() => nextShipmentState('PERDIDO'), ValidationError);
});

test('trackingCode es OM + 10 dígitos derivados del azar inyectado', () => {
  assert.equal(trackingCode(() => 'a1b2c3d4e5'), 'OM0112233445');
  assert.match(trackingCode(bytes => 'ff'.repeat(bytes)), /^OM\d{10}$/);
});
