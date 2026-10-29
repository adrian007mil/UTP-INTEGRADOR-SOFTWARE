import { html } from '../html.js';
import { $$ } from '../dom.js';
import { showError } from '../error-view.js';

const DATE_FORMAT = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

function messageItem(message) {
  const link = message.enlace ? html`<a class="button button-outline" href="${message.enlace}">Abrir enlace</a>` : '';
  return html`<details class="mail-item ${message.leido ? '' : 'unread'}" data-message="${message.id}" data-unread="${!message.leido}">
    <summary><span class="mail-dot" aria-hidden="true"></span><b>${message.asunto}</b><time>${DATE_FORMAT.format(new Date(message.fecha))}</time></summary>
    <div class="mail-body"><p>De: OmniMelody &lt;notificaciones@omnimelody.pe&gt;</p><p>${message.cuerpo}</p>${link}</div></details>`;
}

function updateBadges(delta) {
  $$('.badge-count').forEach(badge => {
    const next = Number(badge.textContent) + delta;
    if (next <= 0) badge.remove();
    else badge.textContent = String(next);
  });
}

export default {
  title: 'Buzón',
  access: 'auth',
  async render(ctx) {
    const messages = await ctx.services.mailbox.list();
    const list = messages.length
      ? html`<div class="mail-list">${messages.map(messageItem)}</div>`
      : html`<div class="empty-state"><span>✉</span><h3>Tu buzón está vacío</h3><p>Aquí verás las confirmaciones de tus compras y avisos de envío.</p></div>`;
    return html`<section class="page-section mailbox-page"><span class="eyebrow">NOTIFICACIONES</span><h1 class="page-title">Buzón<span class="brand-dot">.</span></h1>
      <p class="demo-notice">Simulación: en la versión final estos mensajes llegarán a tu correo electrónico.</p>${list}</section>`;
  },
  mount(root, ctx) {
    $$('.mail-item', root).forEach(item => item.addEventListener('toggle', async () => {
      if (!item.open || item.dataset.unread !== 'true') return;
      try {
        await ctx.services.mailbox.markRead(Number(item.dataset.message));
        item.dataset.unread = 'false';
        item.classList.remove('unread');
        updateBadges(-1);
      } catch (error) {
        showError(error, ctx);
      }
    }));
  },
};
