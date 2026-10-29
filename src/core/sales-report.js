import { paidInRange, toLocalDate } from './kpis.js';

export const SALES_CSV_HEADERS = ['fecha', 'pedido', 'cliente', 'comprobante', 'metodo_pago', 'subtotal', 'igv', 'envio', 'total'];
const BOM = '﻿';
const LINE_END = '\r\n';
const NEEDS_QUOTES = /[",\r\n]/;
const DECIMALS = 2;

const amount = value => Number(value).toFixed(DECIMALS);

function csvCell(value) {
  const textValue = String(value ?? '');
  return NEEDS_QUOTES.test(textValue) ? `"${textValue.replace(/"/g, '""')}"` : textValue;
}

export function toCsv(rows) {
  return BOM + rows.map(row => row.map(csvCell).join(',') + LINE_END).join('');
}

export function salesReportRows({ pedidos, usuarios, comprobantes }, rango) {
  const rows = paidInRange(pedidos, rango)
    .sort((a, b) => a.fechaPedido.localeCompare(b.fechaPedido))
    .map(pedido => {
      const usuario = usuarios.find(u => u.id === pedido.idUsuario);
      const comprobante = comprobantes.find(c => c.idPedido === pedido.id);
      return [
        toLocalDate(pedido.fechaPedido), String(pedido.id), usuario ? `${usuario.nombres} ${usuario.apellidos}` : '',
        comprobante ? `${comprobante.serie}-${comprobante.numero}` : '', pedido.metodoPago,
        amount(pedido.subtotal), amount(pedido.igv), amount(pedido.costoEnvio), amount(pedido.total),
      ];
    });
  return [SALES_CSV_HEADERS, ...rows];
}
