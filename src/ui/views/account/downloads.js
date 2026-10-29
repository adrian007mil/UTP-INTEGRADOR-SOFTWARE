import { html } from '../../html.js';
import { downloadButton, bindDownloadButtons } from '../../components/download-button.js';
import { formatDate } from '../../components/order-timeline.js';
import { accountLayout } from './account-nav.js';

function downloadCard({ detalle, producto, pedido, descargas }) {
  const course = producto.tipoProducto === 'AUDIOVISUAL'
    ? html`<a class="button button-outline" href="#/aprende/${producto.id}">Ver curso ▶</a>`
    : '';
  return html`<article class="download-card"><div class="download-visual ${producto.tono}">${producto.visual}</div>
    <div><span class="eyebrow">${producto.etiqueta}</span><h3>${producto.nombre}</h3>
      <small>Pedido N.º ${pedido.id} · ${formatDate(pedido.fechaPedido)} · ${descargas} ${descargas === 1 ? 'descarga' : 'descargas'}</small></div>
    <div class="download-actions">${course}${downloadButton(detalle.id, producto.tipoProducto === 'AUDIOVISUAL' ? 'Material PDF' : 'Descargar PDF')}</div></article>`;
}

export default {
  title: 'Mis descargas',
  access: 'auth',
  async render(ctx) {
    const items = await ctx.services.downloads.listMyDownloads();
    const content = items.length
      ? html`<div class="download-list">${items.map(downloadCard)}</div>`
      : html`<div class="empty-state"><span>↓</span><h3>Aún no tienes descargas</h3><p>Las partituras, guías y cursos que compres aparecerán aquí.</p>
          <a class="button button-dark" href="#/aprende">Explorar recursos</a></div>`;
    return accountLayout(ctx.path, 'Mis descargas', content);
  },
  mount(root, ctx) {
    bindDownloadButtons(root, ctx);
  },
};
