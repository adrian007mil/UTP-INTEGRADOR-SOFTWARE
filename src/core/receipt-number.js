export const RECEIPT_SERIES = { BOLETA: 'B001', FACTURA: 'F001' };
const NUMBER_DIGITS = 8;

export function nextReceiptNumber(tipo, comprobantes) {
  const last = comprobantes.filter(c => c.tipo === tipo).reduce((max, c) => Math.max(max, Number(c.numero)), 0);
  return { serie: RECEIPT_SERIES[tipo], numero: String(last + 1).padStart(NUMBER_DIGITS, '0') };
}
