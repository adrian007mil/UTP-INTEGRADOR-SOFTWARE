import { html } from '../html.js';
import { PERU_DEPARTMENTS } from '../../core/peru-departments.js';

function input(label, name, value = '', attrs = '') {
  return html`<label class="form-field">${label}<input name="${name}" value="${value}" ${attrs}></label>`;
}

export function addressFields(address = {}) {
  const departments = PERU_DEPARTMENTS.map(d => html`<option ${address.departamento === d ? 'selected' : ''}>${d}</option>`);
  return html`<div class="form-grid">${input('Alias (Casa, Trabajo…) *', 'alias', address.alias)}
    ${input('Celular de contacto *', 'telefono', address.telefono, html`inputmode="numeric" maxlength="9"`)}</div>
    ${input('Dirección *', 'direccion', address.direccion, html`autocomplete="street-address"`)}
    <div class="form-grid">${input('Distrito *', 'distrito', address.distrito)}${input('Provincia *', 'provincia', address.provincia)}</div>
    <div class="form-grid"><label class="form-field">Departamento *<select name="departamento"><option value="">Selecciona…</option>${departments}</select></label>
      ${input('Referencia', 'referencia', address.referencia)}</div>`;
}

export function addressSummary(address) {
  return html`<b>${address.alias}</b><span>${address.direccion}, ${address.distrito}, ${address.provincia} — ${address.departamento}</span>
    ${address.referencia ? html`<small>Ref.: ${address.referencia}</small>` : ''}<small>Contacto: ${address.telefono}</small>`;
}
