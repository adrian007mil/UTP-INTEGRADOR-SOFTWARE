import { html } from '../html.js';
import { $ } from '../dom.js';
import { handleSubmit } from '../components/form-errors.js';
import { safeReturnPath } from '../../core/routes-match.js';

function field(label, name, attrs = {}) {
  const { type = 'text', autocomplete = 'off', inputmode = '', maxlength = '' } = attrs;
  return html`<label class="form-field">${label}<input name="${name}" type="${type}" autocomplete="${autocomplete}"
    ${inputmode ? html`inputmode="${inputmode}"` : ''} ${maxlength ? html`maxlength="${maxlength}"` : ''}></label>`;
}

export default {
  title: 'Crear cuenta',
  access: 'public',
  async render() {
    return html`<section class="page-section auth-page"><div class="auth-intro"><span class="eyebrow">ÚNETE A OMNIMELODY</span>
        <h1>Crea tu<br><em>cuenta.</em></h1><p>Regístrate para comprar instrumentos, partituras y material audiovisual.</p></div>
      <form class="form-card" id="registerForm" novalidate><h2>Datos personales</h2>
        <div class="form-grid">${field('Nombres *', 'nombres', { autocomplete: 'given-name' })}${field('Apellidos *', 'apellidos', { autocomplete: 'family-name' })}
          ${field('DNI *', 'dni', { inputmode: 'numeric', maxlength: 8 })}${field('Correo electrónico *', 'email', { type: 'email', autocomplete: 'email' })}
          ${field('Celular (opcional)', 'telefono', { inputmode: 'numeric', maxlength: 9, autocomplete: 'tel' })}</div>
        <h2>Datos de acceso</h2>
        <div class="form-grid">${field('Nombre de usuario *', 'usuario', { autocomplete: 'username' })}
          ${field('Contraseña *', 'contrasena', { type: 'password', autocomplete: 'new-password' })}
          ${field('Confirmar contraseña *', 'confirmacion', { type: 'password', autocomplete: 'new-password' })}</div>
        <small class="form-hint">Mínimo 8 caracteres, con letras y números.</small>
        <button class="button button-dark" type="submit">Crear cuenta</button>
        <p class="form-note">¿Ya tienes cuenta? <a class="text-link" href="#/login">Inicia sesión</a></p></form></section>`;
  },
  mount(root, ctx) {
    handleSubmit($('#registerForm', root), ctx, async data => {
      const user = await ctx.services.auth.register(data);
      ctx.toast(`¡Te damos la bienvenida, ${user.nombres}! Tu cuenta está lista.`);
      ctx.navigate(`#${safeReturnPath(ctx.query.get('volver'))}`);
    });
  },
};
