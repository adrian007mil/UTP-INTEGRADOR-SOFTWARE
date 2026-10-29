import { setHtml } from './dom.js';

export function createModal({ modal, overlay, content, closeButton }) {
  function close() {
    modal.classList.remove('open');
    overlay.classList.remove('visible');
    content.innerHTML = '';
  }

  function open(safeHtml) {
    setHtml(content, safeHtml);
    modal.classList.add('open');
    overlay.classList.add('visible');
    return content;
  }

  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  return { open, close };
}
