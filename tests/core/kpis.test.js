import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeKpis, defaultRange, validateRange, toLocalDate } from '../../src/core/kpis.js';
import { fieldsOf } from '../helpers/assertions.js';

const at = (day, hour = 12) => new Date(2026, 10, day, hour).toISOString();
const pedidos = [
  { id: 1, fechaPedido: at(2), estado: 'PAGADO', total: 100 },
  { id: 2, fechaPedido: at(5), estado: 'PAGADO', total: 50.5 },
  { id: 3, fechaPedido: at(5), estado: 'PENDIENTE_PAGO', total: 80 },
  { id: 4, fechaPedido: new Date(2026, 9, 30, 12).toISOString(), estado: 'PAGADO', total: 999 },
];
const datos = {
  pedidos,
  envios: [{ idPedido: 1, estado: 'ENTREGADO' }, { idPedido: 2, estado: 'ENVIADO' }],
  productos: [{ id: 1, estado: 'A' }, { id: 2, estado: 'A' }, { id: 3, estado: 'I' }],
  inventario: [{ idProducto: 1, stock: 2, stockMinimo: 3 }, { idProducto: 2, stock: 3, stockMinimo: 3 }, { idProducto: 3, stock: 9, stockMinimo: 3 }],
};

test('KPIs del rango con ambos extremos incluidos', () => {
  assert.deepEqual(computeKpis(datos, { desde: '2026-11-02', hasta: '2026-11-05' }), {
    ventasPeriodo: 150.5, pedidosPagados: 2, ticketPromedio: 75.25, pedidosPendientes: 2, productosActivos: 2, stockBajo: 2,
  });
});

test('un rango sin pedidos devuelve ceros y ticketPromedio 0, no NaN', () => {
  const kpis = computeKpis(datos, { desde: '2026-12-01', hasta: '2026-12-31' });
  assert.equal(kpis.ventasPeriodo, 0);
  assert.equal(kpis.ticketPromedio, 0);
});

test('un pedido PENDIENTE_PAGO no suma ventas', () => {
  assert.equal(computeKpis(datos, { desde: '2026-11-05', hasta: '2026-11-05' }).ventasPeriodo, 50.5);
});

test('defaultRange es del primer día del mes a hoy', () => {
  assert.deepEqual(defaultRange(new Date(2026, 10, 17, 9)), { desde: '2026-11-01', hasta: '2026-11-17' });
  assert.equal(toLocalDate(new Date(2026, 0, 5, 23, 30).toISOString()), '2026-01-05');
});

test('validateRange rechaza formatos inválidos y desde > hasta', () => {
  assert.ok(fieldsOf(() => validateRange({ desde: '2026-11-10', hasta: '2026-11-01' })).hasta);
  assert.ok(fieldsOf(() => validateRange({ desde: '10/11/2026', hasta: '2026-11-01' })).desde);
  assert.deepEqual(validateRange({ desde: '2026-11-01', hasta: '2026-11-30' }), { desde: '2026-11-01', hasta: '2026-11-30' });
});
