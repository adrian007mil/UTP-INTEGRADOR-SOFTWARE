import { html } from '../html.js';

export const PRICE_RANGE = { MIN: 50, MAX: 2000, STEP: 50 };
const INSTRUMENT_TYPES = [
  ['guitarra-acustica', 'Guitarra acústica'], ['guitarra-electrica', 'Guitarra eléctrica'], ['bajo', 'Bajo'],
  ['teclado', 'Teclado'], ['ukelele', 'Ukelele'], ['cajon', 'Cajón peruano'], ['microfono', 'Micrófono'], ['flauta', 'Flauta dulce'],
];
const FAMILIES = [['cuerda', 'Cuerda'], ['aire', 'Aire']];
const AVAILABILITY = [['en-stock', 'En stock'], ['agotado', 'Agotados']];
const SORTS = [['destacados', 'Destacados'], ['precio-asc', 'Precio: menor a mayor'], ['precio-desc', 'Precio: mayor a menor'], ['nombre', 'Nombre']];
export const QUERY_KEYS = {
  texto: 'q', idCategoria: 'cat', idMarca: 'marca', precioMax: 'precio',
  disponibilidad: 'disp', tipoInstrumento: 'tipo', familia: 'familia', orden: 'orden',
};

function options(pairs, selected, allLabel) {
  const all = allLabel ? html`<option value="">${allLabel}</option>` : '';
  const items = pairs.map(([value, label]) => html`<option value="${value}" ${String(selected) === String(value) ? 'selected' : ''}>${label}</option>`);
  return html`${all}${items}`;
}

function categoryOptions(tree, selected) {
  return tree.map(padre => {
    const pairs = [[padre.id, `Todo ${padre.nombre}`], ...padre.hijas.map(h => [h.id, h.nombre])];
    return html`<optgroup label="${padre.nombre}">${options(pairs, selected)}</optgroup>`;
  });
}

export function criteriaFromQuery(query) {
  return Object.fromEntries(Object.entries(QUERY_KEYS).map(([key, param]) => [key, query.get(param) ?? '']));
}

export function queryFromCriteria(criteria) {
  const params = new URLSearchParams();
  Object.entries(QUERY_KEYS).forEach(([key, param]) => {
    if (criteria[key] !== '' && criteria[key] !== undefined) params.set(param, criteria[key]);
  });
  if (Number(params.get('precio')) === PRICE_RANGE.MAX) params.delete('precio');
  if (params.get('orden') === 'destacados') params.delete('orden');
  return params;
}

export function readCriteria(form) {
  const data = new FormData(form);
  return Object.fromEntries(Object.keys(QUERY_KEYS).map(key => [key, String(data.get(key) ?? '').trim()]));
}

function searchTools(criteria) {
  return html`<div class="catalog-tools"><label class="search-box"><span>⌕</span><input name="texto" type="search" value="${criteria.texto}"
      placeholder="Busca un instrumento, marca o recurso…" aria-label="Buscar en el catálogo"></label>
    <div class="tool-right"><label class="filter-select"><span>Ordenar:</span><select name="orden">${options(SORTS, criteria.orden || 'destacados')}</select></label>
      <button type="button" class="filter-button" id="filterToggle" aria-controls="filterPanel">☷ <span>Filtros</span></button></div></div>`;
}

export function filtersForm(criteria, { tree, brands }) {
  const price = criteria.precioMax || PRICE_RANGE.MAX;
  const hasFilters = ['idCategoria', 'idMarca', 'tipoInstrumento', 'familia', 'precioMax', 'disponibilidad'].some(key => criteria[key]);
  return html`<form class="catalog-filters" id="catalogFilters" role="search">${searchTools(criteria)}
    <div class="filter-panel ${hasFilters ? 'open' : ''}" id="filterPanel">
      <label>Categoría<select name="idCategoria"><option value="">Todas</option>${categoryOptions(tree, criteria.idCategoria)}</select></label>
      <label>Marca<select name="idMarca">${options(brands.map(b => [b.id, b.nombre]), criteria.idMarca, 'Todas')}</select></label>
      <label>Tipo de instrumento<select name="tipoInstrumento">${options(INSTRUMENT_TYPES, criteria.tipoInstrumento, 'Todos')}</select></label>
      <label>Familia sonora<select name="familia">${options(FAMILIES, criteria.familia, 'Todas')}</select></label>
      <label>Precio máximo <b id="priceLabel">S/ ${price}</b><input name="precioMax" type="range"
        min="${PRICE_RANGE.MIN}" max="${PRICE_RANGE.MAX}" step="${PRICE_RANGE.STEP}" value="${price}"></label>
      <label>Disponibilidad<select name="disponibilidad">${options(AVAILABILITY, criteria.disponibilidad, 'Todos')}</select></label>
      <a class="text-link" href="#/catalogo">Limpiar filtros</a></div></form>`;
}
