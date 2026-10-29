import { html } from '../html.js';
import { $ } from '../dom.js';
import { handleSubmit } from '../components/form-errors.js';

function invalidLink() {
  return html`<section class="page-section empty-state"><span>⌛</span><h3>El enlace no es válido o ya venció</h3>
    <p>Solicita uno nuevo para restablecer tu contraseña.</p><a class="button button-dark" href="#/recuperar">Pedir un nuevo enlace</a></section>`;
}

export default {
  title: 'Nueva contraseña',
  access: 'public',
  async render(ctx) {
    if (!(await ctx.services.passwordReset.isValid(ctx.params.token))) return invalidLink();
    return html`<section class="page-section auth-page"><div class="auth-intro"><span class="eyebrow">RECUPERA TU ACCESO</span>
        <h1>Crea una<br><em>nueva contraseña.</em></h1><p>Usa al menos 8 caracteres, combinando letras y números.</p></div>
      <form class="form-card" id="resetForm" novalidate><h2>Nueva contraseña</h2>
        <label class="form-field">Nueva contraseña<input name="contrasena" type="password" autocomplete="new-password"></label>
        <label class="form-field">Confirmar contraseña<input name="confirmacion" type="password" autocomplete="new-password"></label>
        <button class="button button-dark" type="submit">Guardar contraseña</button></form></section>`;
  },
  mount(root, ctx) {
    const form = $('#resetForm', root);
    if (!form) return;
    handleSubmit(form, ctx, async ({ contrasena, confirmacion }) => {
      await ctx.services.passwordReset.reset(ctx.params.token, contrasena, confirmacion);
      ctx.toast('Contraseña actualizada. Ya puedes iniciar sesión.');
      ctx.navigate('#/login');
    });
  },
};
