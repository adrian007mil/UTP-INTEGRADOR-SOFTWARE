export const MAX_RECOMMENDATIONS = 3;
export const SOUNDS = {
  cuerda: { etiqueta: 'instrumentos de cuerda', matches: p => p.familia === 'cuerda', recurso: 16 },
  teclas: { etiqueta: 'teclados', matches: p => p.tipoInstrumento === 'teclado', recurso: 17 },
  ritmo: { etiqueta: 'percusión', matches: p => p.tipoInstrumento === 'cajon', recurso: 21 },
  aire: { etiqueta: 'instrumentos de aire', matches: p => p.familia === 'aire', recurso: 15 },
};

export function recommend(productos, { sonido, presupuesto }) {
  const sound = SOUNDS[sonido];
  if (!sound) return { instrumentos: [], masEconomico: null, recurso: null, etiqueta: '' };
  const budget = Number(presupuesto);
  const candidates = productos
    .filter(p => p.tipoProducto === 'FISICO' && p.estado === 'A' && p.stock > 0 && sound.matches(p))
    .sort((a, b) => a.precio - b.precio);
  return {
    instrumentos: candidates.filter(p => p.precio <= budget).slice(0, MAX_RECOMMENDATIONS),
    masEconomico: candidates[0] ?? null,
    recurso: productos.find(p => p.id === sound.recurso) ?? null,
    etiqueta: sound.etiqueta,
  };
}
