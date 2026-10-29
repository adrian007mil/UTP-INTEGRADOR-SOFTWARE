import { html } from '../html.js';

export default {
  title: 'Página no encontrada',
  access: 'public',
  async render() {
    return html`<section class="page-section empty-state"><span>♪</span><h3>No encontramos esta página</h3>
      <p>Puede que el enlace haya cambiado o que el producto ya no esté disponible.</p>
      <a class="button button-dark" href="#/catalogo">Ir al catálogo</a></section>`;
  },
};
