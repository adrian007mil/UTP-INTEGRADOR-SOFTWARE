import { test } from 'node:test';
import assert from 'node:assert/strict';
import { salesReportRows, toCsv, SALES_CSV_HEADERS } from '../../src/core/sales-report.js';

test('cabeceras fijas', () => {
  assert.deepEqual(SALES_CSV_HEADERS, ['fecha', 'pedido', 'cliente', 'comprobante', 'metodo_pago', 'subtotal', 'igv', 'envio', 'total']);
});

test('toCsv escapa comas y comillas, agrega BOM y CRLF', () => {
  assert.equal(toCsv([['a,b', 'c"d']]), '﻿"a,b","c""d"\r\n');
  assert.equal(toCsv([['x', 'línea\nnueva'], ['1', '2']]), '﻿x,"línea\nnueva"\r\n1,2\r\n');
});

test('salesReportRows lista pedidos pagados del rango con cabecera', () => {
  const datos = {
    pedidos: [
      { id: 7, idUsuario: 1, fechaPedido: new Date(2026, 10, 3, 10).toISOString(), estado: 'PAGADO', metodoPago: 'TARJETA', subtotal: 414.41, igv: 74.59, costoEnvio: 15, total: 504 },
      { id: 8, idUsuario: 1, fechaPedido: new Date(2026, 10, 3, 11).toISOString(), estado: 'PENDIENTE_PAGO', metodoPago: 'TRANSFERENCIA', subtotal: 1, igv: 0, costoEnvio: 0, total: 1 },
    ],
    usuarios: [{ id: 1, nombres: 'Lucía', apellidos: 'Fernández, Quispe' }],
    comprobantes: [{ idPedido: 7, serie: 'B001', numero: '00000001' }],
  };
  const rows = salesReportRows(datos, { desde: '2026-11-01', hasta: '2026-11-30' });
  assert.deepEqual(rows, [SALES_CSV_HEADERS, ['2026-11-03', '7', 'Lucía Fernández, Quispe', 'B001-00000001', 'TARJETA', '414.41', '74.59', '15.00', '504.00']]);
  assert.ok(toCsv(rows).includes('"Lucía Fernández, Quispe"'));
});
