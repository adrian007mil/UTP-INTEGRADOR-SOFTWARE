import { html } from '../html.js';
import { delegate } from '../dom.js';
import { showError } from '../error-view.js';

const DEVICE_LABEL_LENGTH = 80;

export function downloadButton(idDetalle, label = 'Descargar PDF') {
  return html`<button class="button button-dark" data-download="${idDetalle}">${label} <span>↓</span></button>`;
}

function triggerFileDownload(url) {
  const link = document.createElement('a');
  link.href = url;
  link.download = url.split('/').pop();
  document.body.append(link);
  link.click();
  link.remove();
}

export function bindDownloadButtons(root, ctx) {
  delegate(root, 'click', '[data-download]', async (event, button) => {
    try {
      const { url } = await ctx.services.downloads.registerDownload(Number(button.dataset.download), navigator.userAgent.slice(0, DEVICE_LABEL_LENGTH));
      triggerFileDownload(url);
      ctx.toast('Descarga iniciada');
    } catch (error) {
      showError(error, ctx);
    }
  });
}
