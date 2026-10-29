import { html } from '../html.js';

const CLIENT_LINKS = [
  ['#/cuenta', 'Mi cuenta'], ['#/cuenta/pedidos', 'Mis pedidos'], ['#/cuenta/descargas', 'Mis descargas'], ['#/buzon', 'Buzón'],
];

function unreadBadge(count) {
  return count > 0 ? html`<b class="badge-count" aria-label="${count} mensajes sin leer">${count}</b>` : '';
}

export function accountMenu(user, { unread = 0 } = {}) {
  if (!user) return html`<a class="account-link" href="#/login"><span aria-hidden="true">♙</span> Ingresar</a>`;
  const adminLink = user.rol === 'ADMIN' ? html`<a href="#/admin">Panel de administración</a>` : '';
  return html`<details class="account-menu"><summary><span aria-hidden="true">♙</span> ${user.nombres}${unreadBadge(unread)}</summary>
    <div class="account-dropdown">${CLIENT_LINKS.map(([href, label]) => html`<a href="${href}">${label}${href === '#/buzon' ? unreadBadge(unread) : ''}</a>`)}
      ${adminLink}<button type="button" data-logout>Cerrar sesión</button></div></details>`;
}
