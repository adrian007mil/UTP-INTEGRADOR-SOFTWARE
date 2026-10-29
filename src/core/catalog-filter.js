const ANY = new Set(['', 'todos', undefined, null]);

export function normalizeText(text) {
  return String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function descendantIds(categorias, rootId) {
  const ids = new Set([rootId]);
  categorias.filter(c => c.idCategoriaPadre === rootId).forEach(c => ids.add(c.id));
  return ids;
}

function matchesText(product, texto) {
  const haystack = normalizeText(`${product.nombre} ${product.categoria?.nombre ?? ''} ${product.marca?.nombre ?? ''}`);
  return haystack.includes(normalizeText(texto));
}

function matchesAvailability(product, disponibilidad) {
  const soldOut = product.stock === 0;
  if (disponibilidad === 'agotado') return soldOut;
  if (disponibilidad === 'en-stock') return !soldOut;
  return true;
}

function buildPredicates(criteria, categorias) {
  const predicates = [];
  const { texto, idCategoria, idMarca, precioMax, disponibilidad, tipoInstrumento, familia, tipoProducto } = criteria;
  if (normalizeText(texto)) predicates.push(p => matchesText(p, texto));
  if (!ANY.has(idCategoria)) {
    const ids = descendantIds(categorias, Number(idCategoria));
    predicates.push(p => ids.has(p.idCategoria));
  }
  if (!ANY.has(idMarca)) predicates.push(p => p.idMarca === Number(idMarca));
  if (Number.isFinite(Number(precioMax)) && !ANY.has(precioMax)) predicates.push(p => p.precio <= Number(precioMax));
  if (!ANY.has(disponibilidad)) predicates.push(p => matchesAvailability(p, disponibilidad));
  if (!ANY.has(tipoInstrumento)) predicates.push(p => p.tipoInstrumento === tipoInstrumento);
  if (!ANY.has(familia)) predicates.push(p => p.familia === familia);
  if (!ANY.has(tipoProducto)) predicates.push(p => p.tipoProducto === tipoProducto);
  return predicates;
}

export function filterProducts(products, criteria = {}, categorias = []) {
  const predicates = buildPredicates(criteria, categorias);
  return products.filter(product => predicates.every(matches => matches(product)));
}

const COMPARATORS = {
  'precio-asc': (a, b) => a.precio - b.precio,
  'precio-desc': (a, b) => b.precio - a.precio,
  nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
};

export function sortProducts(products, orden = 'destacados') {
  const comparator = COMPARATORS[orden];
  return comparator ? [...products].sort(comparator) : [...products];
}
