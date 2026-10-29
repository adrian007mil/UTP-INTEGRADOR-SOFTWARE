import { html } from '../html.js';
import { formatMoney } from '../../core/money.js';
import { NotFoundError } from '../../core/errors.js';
import { downloadButton, bindDownloadButtons } from '../components/download-button.js';
import { delegate } from '../dom.js';
import { showError } from '../error-view.js';

const YOUTUBE_EMBED = 'https://www.youtube-nocookie.com/embed/';
const YOUTUBE_WATCH = 'https://www.youtube.com/watch?v=';

function videoPreview(producto) {
  return html`<div class="video-preview"><iframe src="${YOUTUBE_EMBED}${producto.videoId}" title="${producto.videoTitulo}" loading="lazy"
      allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
    <div class="video-caption"><span>VIDEO DE MUESTRA · ${producto.videoTitulo}</span>
      <a href="${YOUTUBE_WATCH}${producto.videoId}" target="_blank" rel="noreferrer">Abrir en YouTube ↗</a></div>`;
}

export function chapterList(producto, { owned, completados = [], porcentaje = 0 }) {
  const items = producto.capitulos.map((capitulo, index) => {
    const done = completados.includes(index);
    const control = owned
      ? html`<button class="chapter-check ${done ? 'done' : ''}" data-chapter="${index}" aria-pressed="${done}" aria-label="Marcar capítulo ${index + 1}">${done ? '✓' : ''}</button>`
      : html`<span class="chapter-lock" aria-hidden="true">🔒</span>`;
    return html`<li>${control}<span>${String(index + 1).padStart(2, '0')}</span><b>${capitulo}</b></li>`;
  });
  return html`<div class="lesson-chapters"><div class="chapters-heading"><span class="eyebrow">TEMARIO</span>
    <span>${owned ? `${completados.length} de ${producto.capitulos.length} completados` : 'Compra el curso para desbloquear todos los capítulos'}</span></div>
    ${owned ? html`<span class="progress-track" aria-hidden="true"><b style="width:${porcentaje}%"></b></span>` : ''}<ol>${items}</ol></div>`;
}

function accessPanel(producto, detalle) {
  if (detalle) {
    return html`<aside class="course-access owned"><b>✓ Tienes acceso completo</b><p>Marca los capítulos a medida que avances y descarga el material de apoyo.</p>
      ${downloadButton(detalle.id, 'Material del curso (PDF)')}</aside>`;
  }
  return html`<aside class="course-access"><b>${formatMoney(producto.precio)}</b><p>Vista previa gratuita. Compra el curso para desbloquear los capítulos y el material descargable.</p>
    <button class="button button-dark" data-add="${producto.id}">Comprar para desbloquear</button></aside>`;
}

async function ownedDetail(ctx, idProducto) {
  if (!(await ctx.services.downloads.hasAccess(idProducto))) return null;
  const items = await ctx.services.downloads.listMyDownloads();
  return items.find(item => item.producto.id === idProducto)?.detalle ?? null;
}

export default {
  title: 'Curso',
  access: 'public',
  async render(ctx) {
    const producto = await ctx.services.catalog.getProduct(ctx.params.id);
    if (producto.tipoProducto !== 'AUDIOVISUAL') throw new NotFoundError('Este recurso no es un curso');
    ctx.pageTitle = producto.nombre;
    const detalle = await ownedDetail(ctx, producto.id);
    const progress = detalle ? await ctx.services.preferences.progress(producto.id) : {};
    return html`<section class="page-section course-page"><a class="text-link" href="#/aprende">← Aprende</a>
      <div class="course-modal"><span class="eyebrow">${producto.etiqueta}</span><h2>${producto.nombre}</h2><p class="course-description">${producto.descripcion}</p>
        <div class="course-layout"><div>${videoPreview(producto)}${chapterList(producto, { owned: Boolean(detalle), ...progress })}</div>${accessPanel(producto, detalle)}</div>
        <p class="course-disclaimer">El video es una muestra externa de YouTube; los capítulos son la estructura propuesta por OmniMelody.</p></div></section>`;
  },
  mount(root, ctx) {
    bindDownloadButtons(root, ctx);
    delegate(root, 'click', '[data-chapter]', async (event, button) => {
      try {
        await ctx.services.preferences.toggleChapter(Number(ctx.params.id), Number(button.dataset.chapter));
        await ctx.refresh();
      } catch (error) {
        showError(error, ctx);
      }
    });
  },
};
