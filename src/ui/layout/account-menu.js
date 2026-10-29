import { html } from '../html.js';

const CLIENT_LINKS = [
  ['#/cuenta', 'Mi cuenta'], ['#/cuenta/pedidos', 'Mis pedidos'], ['#/cuenta/descargas', 'Mis descargas'], ['#/buzon', 'Buzón'],
];

function unreadBadge(count) {
  return count > 0 ? html`<b class="badge-count" aria-label="${count} mensajes sin leer">${count}</b>` : '';
}

export function accountMenu(user, { unread = 0 } = {}) {
  if (!user) return html`<a class="account-link" href="#/login" aria-label="Ingresar"><span aria-hidden="true">♙</span> <span class="account-name">Ingresar</span></a>`;
  const adminLink = user.rol === 'ADMIN' ? html`<a href="#/admin">Panel de administración</a>` : '';
  return html`<details class="account-menu"><summary aria-label="Mi cuenta"><span aria-hidden="true">♙</span> <span class="account-name">${user.nombres}</span>${unreadBadge(unread)}</summary>
    <div class="account-dropdown">${CLIENT_LINKS.map(([href, label]) => html`<a href="${href}">${label}${href === '#/buzon' ? unreadBadge(unread) : ''}</a>`)}
      ${adminLink}<button type="button" data-logout>Cerrar sesión</button></div></details>`;
}
