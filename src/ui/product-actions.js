import { delegate } from './dom.js';
import { html } from './html.js';
import { showError } from './error-view.js';
import { MAX_COMPARE } from '../services/preferences-service.js';

const INTERACTIVE = 'button, a, input, select, label';

function replaceBrokenImage(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.dataset.fallback) return;
  const fallback = document.createElement('span');
  fallback.className = 'visual';
  fallback.textContent = image.dataset.fallback;
  image.parentElement?.classList.remove('has-photo');
  image.replaceWith(fallback);
}

function paintFavorite(button, active) {
  button.classList.toggle('is-favorite', active);
  button.textContent = active ? '♥' : '♡';
  button.setAttribute('aria-label', active ? 'Quitar de favoritos' : 'Guardar en favoritos');
}

function paintCompare(button, active) {
  button.classList.toggle('selected', active);
  button.textContent = active ? '⇄✓' : '⇄';
}

export function compareBar(count) {
  if (count === 0) return '';
  return html`<div class="compare-tray"><span>${count} de ${MAX_COMPARE} instrumentos para comparar</span>
    <div><a class="button button-dark" href="#/comparar">Comparar ahora</a></div></div>`;
}

const COMPARE_PATH = '/comparar';

async function refreshCompareBar(services) {
  const bar = document.getElementById('compareBar');
  if (!bar) return;
  const onComparePage = location.hash.replace(/^#/, '').startsWith(COMPARE_PATH);
  const { comparar } = await services.preferences.flags();
  bar.innerHTML = String(compareBar(onComparePage ? 0 : comparar.length));
}

export function bindProductActions(root, ui, services) {
  const guarded = action => async (event, target) => {
    event.preventDefault();
    try {
      await action(target);
    } catch (error) {
      showError(error, ui);
    }
  };
  delegate(root, 'click', '[data-product-id]', (event, card) => {
    if (event.target.closest(INTERACTIVE)) return;
    ui.navigate(`#/producto/${card.dataset.productId}`);
  });
  delegate(root, 'click', '[data-wish]', guarded(async button => {
    const active = await services.preferences.toggleFavorite(Number(button.dataset.wish));
    document.querySelectorAll(`[data-wish="${button.dataset.wish}"]`).forEach(b => paintFavorite(b, active));
    ui.toast(active ? 'Guardado en favoritos' : 'Quitado de favoritos');
  }));
  delegate(root, 'click', '[data-compare]', guarded(async button => {
    const active = await services.preferences.toggleCompare(Number(button.dataset.compare));
    document.querySelectorAll(`[data-compare="${button.dataset.compare}"]`).forEach(b => paintCompare(b, active));
    await refreshCompareBar(services);
  }));
  document.addEventListener('error', replaceBrokenImage, true);
  return { refreshCompareBar: () => refreshCompareBar(services) };
}
