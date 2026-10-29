import { html } from '../../html.js';
import { $, delegate } from '../../dom.js';
import { handleSubmit } from '../../components/form-errors.js';
import { addressFields, addressSummary } from '../../components/address-form.js';
import { showError } from '../../error-view.js';
import { accountLayout } from './account-nav.js';

function addressCard(address) {
  const makeDefault = address.predeterminada
    ? html`<span class="status-pill ok">Predeterminada</span>`
    : html`<button class="text-link" data-default="${address.id}">Usar como predeterminada</button>`;
  return html`<article class="address-card-item"><p class="address-card">${addressSummary(address)}</p>
    <div class="address-actions">${makeDefault}<a class="text-link" href="#/cuenta/direcciones?editar=${address.id}">Editar</a>
      <button class="text-link danger" data-delete="${address.id}">Eliminar</button></div></article>`;
}

function addressForm(editing) {
  const title = editing ? `Editar «${editing.alias}»` : 'Nueva dirección';
  const cancel = editing ? html`<a class="text-link" href="#/cuenta/direcciones">Cancelar</a>` : '';
  return html`<form class="form-card" id="addressForm" data-id="${editing?.id ?? ''}" novalidate><h2>${title}</h2>${addressFields(editing ?? {})}
    <button class="button button-dark" type="submit">${editing ? 'Guardar cambios' : 'Agregar dirección'}</button>${cancel}</form>`;
}

export default {
  title: 'Direcciones',
  access: 'auth',
  async render(ctx) {
    const addresses = await ctx.services.addresses.list();
    const editing = ctx.query.get('editar') ? await ctx.services.addresses.get(ctx.query.get('editar')) : null;
    const list = addresses.length ? html`<div class="address-grid">${addresses.map(addressCard)}</div>` : html`<p class="muted">Todavía no registraste direcciones.</p>`;
    return accountLayout(ctx.path, 'Direcciones de envío', html`<div class="stack">${list}${addressForm(editing)}</div>`);
  },
  mount(root, ctx) {
    const run = action => async (event, button) => {
      try {
        await action(button);
        await ctx.refresh();
      } catch (error) {
        showError(error, ctx);
      }
    };
    delegate(root, 'click', '[data-default]', run(button => ctx.services.addresses.setDefault(Number(button.dataset.default))));
    delegate(root, 'click', '[data-delete]', run(async button => {
      if (window.confirm('¿Eliminar esta dirección?')) await ctx.services.addresses.remove(Number(button.dataset.delete));
    }));
    const form = $('#addressForm', root);
    handleSubmit(form, ctx, async data => {
      if (form.dataset.id) await ctx.services.addresses.update(Number(form.dataset.id), data);
      else await ctx.services.addresses.add(data);
      ctx.toast('Dirección guardada');
      ctx.navigate('#/cuenta/direcciones');
    });
  },
};
