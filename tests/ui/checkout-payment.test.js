import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPayment } from '../../src/ui/views/checkout-payment.js';

test('readPayment arma los detalles según el método', () => {
  const data = { metodoPago: 'BILLETERA', proveedor: 'YAPE', celular: '987654321', codigoAprobacion: '123456', numero: '4111', tipo: 'FACTURA', ruc: '20123456789', razonSocial: 'X' };
  assert.deepEqual(readPayment(data), {
    metodoPago: 'BILLETERA', detallesPago: { proveedor: 'YAPE', celular: '987654321', codigoAprobacion: '123456' },
    comprobante: { tipo: 'FACTURA', ruc: '20123456789', razonSocial: 'X' },
  });
  assert.deepEqual(readPayment({ metodoPago: 'TRANSFERENCIA', tipo: 'BOLETA' }).detallesPago, {});
});
