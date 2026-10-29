import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { loginAdmin, loginDemo } from '../helpers/fixtures.js';
import { ForbiddenError } from '../../src/core/errors.js';

const RANGE = { desde: '2026-10-01', hasta: '2026-11-30' };

async function admin() {
  const container = await createTestContainer({ withDemoHistory: true });
  await loginAdmin(container.services);
  return container;
}

test('getDashboard trae KPIs, alertas pendientes con producto y 5 pedidos recientes', async () => {
  const { services } = await admin();
  const dashboard = await services.dashboard.getDashboard(RANGE);
  assert.equal(dashboard.kpis.pedidosPagados, 3);
  assert.equal(dashboard.kpis.ventasPeriodo, 504 + 58 + 94);
  assert.ok(dashboard.alertas.length >= 1);
  assert.ok(dashboard.alertas.some(a => a.producto.nombre === 'Bajo eléctrico de 4 cuerdas'));
  assert.equal(dashboard.recientes.length, 3);
  assert.equal(dashboard.rango.desde, RANGE.desde);
});

test('getDashboard sin rango usa el mes en curso', async () => {
  const { services } = await admin();
  const { rango } = await services.dashboard.getDashboard();
  assert.deepEqual(rango, { desde: '2026-11-01', hasta: '2026-11-02' });
});

test('markAlertAttended saca la alerta de pendientes', async () => {
  const { services } = await admin();
  const [first] = (await services.dashboard.getDashboard(RANGE)).alertas;
  await services.dashboard.markAlertAttended(first.alerta.id);
  assert.ok(!(await services.dashboard.getDashboard(RANGE)).alertas.some(a => a.alerta.id === first.alerta.id));
});

test('exportSalesCsv devuelve nombre de archivo y contenido CSV', async () => {
  const { services } = await admin();
  const { nombreArchivo, contenido } = await services.dashboard.exportSalesCsv(RANGE);
  assert.equal(nombreArchivo, 'ventas_2026-10-01_2026-11-30.csv');
  assert.ok(contenido.startsWith('﻿fecha,pedido,cliente'));
  assert.equal(contenido.trim().split('\r\n').length, 4);
});

test('un cliente no puede ver el dashboard', async () => {
  const { services } = await createTestContainer();
  await loginDemo(services);
  await assert.rejects(services.dashboard.getDashboard(RANGE), ForbiddenError);
  await assert.rejects(services.dashboard.exportSalesCsv(RANGE), ForbiddenError);
});
