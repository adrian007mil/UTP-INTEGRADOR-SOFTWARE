import { html } from '../html.js';
import { $, setHtml } from '../dom.js';
import { handleSubmit } from '../components/form-errors.js';

const GENERIC_ANSWER = 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';

function demoShortcut(enlaceDemo) {
  if (!enlaceDemo) return '';
  return html`<aside class="demo-box"><b>Demo: abrir el enlace enviado al correo</b>
    <p>En la versión final el enlace llegará por correo. Aquí puedes abrirlo directamente.</p>
    <a class="button button-dark" href="${enlaceDemo}">Abrir enlace de restablecimiento</a></aside>`;
}

export default {
  title: 'Recuperar contraseña',
  access: 'public',
  async render() {
    return html`<section class="page-section auth-page"><div class="auth-intro"><span class="eyebrow">RECUPERA TU ACCESO</span>
        <h1>¿Olvidaste tu<br><em>contraseña?</em></h1><p>Escribe el correo de tu cuenta y te enviaremos un enlace temporal (válido 30 minutos).</p>
        <div id="resetResult"></div></div>
      <form class="form-card" id="forgotForm" novalidate><h2>Restablecer contraseña</h2>
        <label class="form-field">Correo electrónico<input name="email" type="email" autocomplete="email"></label>
        <button class="button button-dark" type="submit">Enviar enlace</button>
        <p class="form-note"><a class="text-link" href="#/login">Volver a iniciar sesión</a></p></form></section>`;
  },
  mount(root, ctx) {
    handleSubmit($('#forgotForm', root), ctx, async ({ email }) => {
      const { enlaceDemo } = await ctx.services.passwordReset.request(email);
      ctx.toast(GENERIC_ANSWER);
      setHtml($('#resetResult', root), html`<p class="demo-notice">${GENERIC_ANSWER}</p>${demoShortcut(enlaceDemo)}`);
    });
  },
};
