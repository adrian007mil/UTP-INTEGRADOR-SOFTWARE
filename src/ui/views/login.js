import { html } from '../html.js';
import { $ } from '../dom.js';
import { handleSubmit } from '../components/form-errors.js';
import { DEMO_ACCOUNTS } from '../../data/seed-users.js';
import { safeReturnPath } from '../../core/routes-match.js';

function demoAccounts() {
  const { cliente, admin } = DEMO_ACCOUNTS;
  return html`<aside class="demo-box"><b>Cuentas de demostración</b>
    <p>Cliente: <code>${cliente.usuario}</code> / <code>${cliente.contrasena}</code>
      <button type="button" class="text-link" data-fill="cliente">Usar</button></p>
    <p>Administrador: <code>${admin.usuario}</code> / <code>${admin.contrasena}</code>
      <button type="button" class="text-link" data-fill="admin">Usar</button></p></aside>`;
}

export default {
  title: 'Iniciar sesión',
  access: 'public',
  async render(ctx) {
    const volver = encodeURIComponent(safeReturnPath(ctx.query.get('volver')));
    return html`<section class="page-section auth-page"><div class="auth-intro"><span class="eyebrow">BIENVENIDO DE VUELTA</span>
        <h1>Todo para tu música,<br><em>en un solo lugar.</em></h1>
        <p>Guarda tus productos, consulta tus pedidos y encuentra tus descargas.</p>${demoAccounts()}</div>
      <form class="form-card" id="loginForm" novalidate><h2>Ingresa a tu cuenta</h2>
        <label class="form-field">Usuario o correo<input name="identificador" required autocomplete="username"></label>
        <label class="form-field">Contraseña<input name="contrasena" type="password" required autocomplete="current-password"></label>
        <a class="text-link" href="#/recuperar">¿Olvidaste tu contraseña?</a>
        <button class="button button-dark" type="submit">Iniciar sesión</button>
        <p class="form-note">¿No tienes una cuenta? <a class="text-link" href="#/registro?volver=${volver}">Crear cuenta</a></p></form></section>`;
  },
  mount(root, ctx) {
    const form = $('#loginForm', root);
    root.querySelectorAll('[data-fill]').forEach(button => button.addEventListener('click', () => {
      const account = DEMO_ACCOUNTS[button.dataset.fill];
      form.elements.identificador.value = account.usuario;
      form.elements.contrasena.value = account.contrasena;
    }));
    handleSubmit(form, ctx, async ({ identificador, contrasena }) => {
      const user = await ctx.services.auth.login(identificador, contrasena);
      ctx.toast(`Hola, ${user.nombres}`);
      ctx.navigate(`#${safeReturnPath(ctx.query.get('volver'))}`);
    });
  },
};
