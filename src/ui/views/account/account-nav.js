import { html } from '../../html.js';

const LINKS = [
  ['/cuenta', 'Mi perfil'], ['/cuenta/direcciones', 'Direcciones'], ['/cuenta/pedidos', 'Mis pedidos'],
  ['/cuenta/descargas', 'Mis descargas'], ['/buzon', 'Buzón'],
];

export function accountLayout(path, title, content) {
  const nav = LINKS.map(([href, label]) => html`<a href="#${href}" class="${path === href || (href !== '/cuenta' && path.startsWith(href)) ? 'active' : ''}">${label}</a>`);
  return html`<section class="page-section account-page"><span class="eyebrow">MI CUENTA</span><h1 class="page-title">${title}<span class="brand-dot">.</span></h1>
    <div class="account-layout"><nav class="account-nav" aria-label="Mi cuenta">${nav}</nav><div class="account-content">${content}</div></div></section>`;
}
