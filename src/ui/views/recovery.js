import { html } from '../html.js';

export function recoveryView() {
  return html`<section class="page-section empty-state"><span>⚠</span><h3>Los datos guardados están dañados</h3>
    <p>Restablece los datos de demostración para seguir usando la tienda. Se perderán los cambios hechos en este navegador.</p>
    <button class="button button-dark" data-reset-storage>Restablecer datos de demo</button></section>`;
}

export function startupErrorView() {
  return html`<section class="page-section empty-state"><span>⚠</span><h3>No pudimos iniciar la tienda</h3>
    <p>Recarga la página. Si el problema continúa, restablece los datos de demostración.</p>
    <button class="button button-dark" data-reset-storage>Restablecer datos de demo</button></section>`;
}
