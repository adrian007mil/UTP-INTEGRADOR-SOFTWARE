import { html } from '../html.js';
import { cardFlags } from '../components/product-card.js';

export default {
  title: 'Favoritos',
  access: 'public',
  async render(ctx) {
    const [products, flags] = await Promise.all([ctx.services.preferences.listFavorites(), ctx.services.preferences.flags()]);
    const body = products.length
      ? html`<div class="product-grid">${products.map(cardFlags(flags))}</div>`
      : html`<div class="empty-state"><span>♡</span><h3>Aún no tienes favoritos</h3><p>Guarda productos con el corazón para encontrarlos aquí.</p>
          <a class="button button-dark" href="#/catalogo">Explorar catálogo</a></div>`;
    return html`<section class="favorites-view"><div class="section-heading"><div><div class="eyebrow">TU LISTA PERSONAL</div>
      <h2>Favoritos<span class="brand-dot">.</span></h2><p>Instrumentos y materiales que guardaste para volver a ver.</p></div></div>${body}</section>`;
  },
};
