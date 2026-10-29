import { IGV_RATE, toCents, fromCents } from './money.js';

export function lineTotal(precioUnitario, cantidad) {
  return fromCents(toCents(precioUnitario) * cantidad);
}

export function computeTotals(lines, costoEnvio) {
  const productsCents = lines.reduce((sum, line) => sum + toCents(line.precioUnitario) * line.cantidad, 0);
  // Prices already include IGV, so the taxable base is extracted from the total rather than added on top.
  const baseCents = Math.round(productsCents / (1 + IGV_RATE));
  const shippingCents = toCents(costoEnvio);
  return {
    totalProductos: fromCents(productsCents),
    subtotal: fromCents(baseCents),
    igv: fromCents(productsCents - baseCents),
    costoEnvio: fromCents(shippingCents),
    total: fromCents(productsCents + shippingCents),
  };
}
