import { html } from '../html.js';

const NAV_ITEMS = [
  { href: '#/', label: 'Tienda', match: path => path === '/' || path.startsWith('/catalogo') || path.startsWith('/producto') },
  { href: '#/aprende', label: 'Aprende', match: path => path.startsWith('/aprende') },
  { href: '#/favoritos', label: 'Favoritos', match: path => path.startsWith('/favoritos') },
];
const ADMIN_ITEM = { href: '#/admin', label: 'Administración', match: path => path.startsWith('/admin') };

function navItems(user) {
  return user?.rol === 'ADMIN' ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;
}

function navLink(item, path) {
  return html`<a class="nav-link ${item.match(path) ? 'active' : ''}" href="${item.href}">${item.label}</a>`;
}

export function headerView({ user = null, path = '/', cartCount = 0, accountMenu = '' } = {}) {
  return html`<a class="brand" href="#/" aria-label="OmniMelody, inicio"><span class="brand-mark">♫</span><span>OmniMelody<span class="brand-dot">.</span></span></a>
    <nav class="main-nav" id="mainNav" aria-label="Navegación principal">${navItems(user).map(item => navLink(item, path))}</nav>
    <div class="top-actions">${accountMenu}
      <button class="cart-button" id="cartToggle" aria-label="Abrir carrito"><span class="cart-icon">▱</span><span>Mi carrito</span><b id="cartCount">${cartCount}</b></button>
      <button class="menu-button" id="menuToggle" aria-label="Abrir menú" aria-controls="mainNav">☰</button></div>`;
}
