import { html } from '../../html.js';
import { $ } from '../../dom.js';
import { handleSubmit } from '../../components/form-errors.js';
import { accountLayout } from './account-nav.js';

function field(label, name, value = '', type = 'text', autocomplete = 'off') {
  return html`<label class="form-field">${label}<input name="${name}" type="${type}" value="${value}" autocomplete="${autocomplete}"></label>`;
}

function profileForm(user) {
  return html`<form class="form-card" id="profileForm" novalidate><h2>Datos personales</h2>
    <div class="form-grid">${field('Nombres', 'nombres', user.nombres, 'text', 'given-name')}${field('Apellidos', 'apellidos', user.apellidos, 'text', 'family-name')}
      ${field('Correo electrónico', 'email', user.email, 'email', 'email')}${field('Celular', 'telefono', user.telefono, 'tel', 'tel')}</div>
    <p class="muted">Usuario: <b>${user.usuario}</b> · DNI: <b>${user.dni}</b></p><button class="button button-dark" type="submit">Guardar cambios</button></form>`;
}

function passwordForm() {
  return html`<form class="form-card" id="passwordForm" novalidate><h2>Cambiar contraseña</h2>
    ${field('Contraseña actual', 'actual', '', 'password', 'current-password')}
    <div class="form-grid">${field('Nueva contraseña', 'contrasena', '', 'password', 'new-password')}${field('Confirmar nueva contraseña', 'confirmacion', '', 'password', 'new-password')}</div>
    <small class="form-hint">Mínimo 8 caracteres, con letras y números.</small><button class="button button-outline" type="submit">Actualizar contraseña</button></form>`;
}

export default {
  title: 'Mi perfil',
  access: 'auth',
  async render(ctx) {
    const user = await ctx.services.auth.requireUser();
    return accountLayout(ctx.path, 'Mi perfil', html`<div class="stack">${profileForm(user)}${passwordForm()}</div>`);
  },
  mount(root, ctx) {
    handleSubmit($('#profileForm', root), ctx, async data => {
      await ctx.services.profile.updateProfile(data);
      ctx.toast('Tus datos se actualizaron');
      await ctx.refresh();
    });
    handleSubmit($('#passwordForm', root), ctx, async ({ actual, contrasena, confirmacion }) => {
      await ctx.services.profile.changePassword(actual, contrasena, confirmacion);
      $('#passwordForm', root).reset();
      ctx.toast('Contraseña actualizada');
    });
  },
};
