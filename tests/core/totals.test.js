import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTotals } from '../../src/core/totals.js';
import { shippingCost, SHIPPING_RATES } from '../../src/core/shipping.js';
import { PERU_DEPARTMENTS } from '../../src/core/peru-departments.js';
import { ValidationError } from '../../src/core/errors.js';

test('IGV incluido: 489 + 39', () => {
  assert.deepEqual(computeTotals([{ precioUnitario: 489, cantidad: 1 }, { precioUnitario: 39, cantidad: 1 }], 15),
    { totalProductos: 528, subtotal: 447.46, igv: 80.54, costoEnvio: 15, total: 543 });
});

test('cantidades multiplican y los céntimos cuadran', () => {
  const totals = computeTotals([{ precioUnitario: 24.9, cantidad: 3 }], 0);
  assert.equal(totals.totalProductos, 74.7);
  assert.equal(Math.round((totals.subtotal + totals.igv) * 100), 7470);
});

test('carrito vacío da ceros', () => {
  assert.deepEqual(computeTotals([], 0), { totalProductos: 0, subtotal: 0, igv: 0, costoEnvio: 0, total: 0 });
});

test('envío: Lima 15, Callao 15, Cusco 25, solo digitales 0', () => {
  const physical = [{ tipoProducto: 'FISICO' }, { tipoProducto: 'DIGITAL' }];
  assert.deepEqual(SHIPPING_RATES, { LIMA_CALLAO: 15, PROVINCIA: 25 });
  assert.equal(shippingCost(physical, 'Lima'), 15);
  assert.equal(shippingCost(physical, 'Callao'), 15);
  assert.equal(shippingCost(physical, 'Cusco'), 25);
  assert.equal(shippingCost([{ tipoProducto: 'DIGITAL' }, { tipoProducto: 'AUDIOVISUAL' }], null), 0);
});

test('envío con físicos sin departamento o con uno inexistente lanza ValidationError', () => {
  assert.throws(() => shippingCost([{ tipoProducto: 'FISICO' }], null), ValidationError);
  assert.throws(() => shippingCost([{ tipoProducto: 'FISICO' }], 'Narnia'), ValidationError);
});

test('hay 25 departamentos incluyendo Callao', () => {
  assert.equal(PERU_DEPARTMENTS.length, 25);
  assert.ok(PERU_DEPARTMENTS.includes('Callao') && PERU_DEPARTMENTS.includes('Madre de Dios'));
});
