import { html } from '../../html.js';

const LINKS = [
  ['/admin', 'Panel'], ['/admin/pedidos', 'Pedidos'], ['/admin/productos', 'Productos'],
  ['/admin/categorias', 'Categorías'], ['/admin/usuarios', 'Usuarios'],
];

export function adminLayout(path, { eyebrow = 'CENTRO DE CONTROL', title, actions = '' }, content) {
  const nav = LINKS.map(([href, label]) => {
    const active = href === '/admin' ? path === '/admin' : path.startsWith(href);
    return html`<a href="#${href}" class="${active ? 'active' : ''}">${label}</a>`;
  });
  return html`<section class="admin-view page-section"><nav class="admin-nav" aria-label="Administración">${nav}</nav>
    <div class="section-heading"><div><div class="eyebrow">${eyebrow}</div><h2>${title}<span class="brand-dot">.</span></h2></div>${actions}</div>${content}</section>`;
}
