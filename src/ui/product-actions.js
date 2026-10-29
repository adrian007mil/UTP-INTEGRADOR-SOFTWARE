import { delegate } from './dom.js';

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

export function bindProductActions(root, { navigate }) {
  delegate(root, 'click', '[data-product-id]', (event, card) => {
    if (event.target.closest(INTERACTIVE)) return;
    navigate(`#/producto/${card.dataset.productId}`);
  });
  document.addEventListener('error', replaceBrokenImage, true);
}
