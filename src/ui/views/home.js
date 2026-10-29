import { html } from '../html.js';
import { productCard } from '../components/product-card.js';

const FEATURED_COUNT = 4;
const CATEGORY_ICONS = {
  Cuerdas: '♬', Teclados: '▥', Percusión: '◉', Vientos: '⌁', Audio: '◎', 'Partituras y documentos': '♫', 'Material audiovisual': '▶',
};

function heroArt() {
  return html`<div class="hero-art" aria-hidden="true">
    <div class="sun-disc"></div><div class="hero-note note-one">♪</div><div class="hero-note note-two">♫</div>
    <div class="hero-spark spark-one">✳</div><div class="hero-spark spark-two">✳</div>
    <div class="guitar"><div class="guitar-neck"></div><div class="guitar-head"><i></i><i></i><i></i></div>
      <div class="guitar-body"><div class="guitar-hole"></div><div class="guitar-bridge"></div><div class="guitar-strings"></div></div></div>
    <div class="art-label"><span>01</span><span>Encuentra tu ritmo</span><span>✳</span></div></div>`;
}

export function hero() {
  return html`<section class="hero" id="inicio"><div class="hero-copy">
      <div class="eyebrow"><span></span> TU MUNDO MUSICAL, EN UN SOLO LUGAR</div>
      <h1>Encuentra tu<br><em>próximo sonido.</em></h1>
      <p>Instrumentos, partituras y recursos para acompañarte en cada etapa de tu camino musical.</p>
      <div class="hero-actions"><a class="button button-dark" href="#/catalogo">Explorar catálogo <span>↗</span></a>
        <div class="hero-social"><div class="avatar-stack"><i>♪</i><i>♫</i><i>♬</i></div><span><b>Todo para crear</b><br>y aprender a tu ritmo</span></div></div>
    </div>${heroArt()}
    <div class="hero-bottom"><span>DESCUBRE · APRENDE · TOCA</span><span>HECHO PARA AMANTES DE LA MÚSICA <b>↗</b></span></div></section>`;
}

function categoryStrip(tree) {
  const chips = tree.map(c => html`<a class="category-chip" href="#/catalogo?cat=${c.id}"><span>${CATEGORY_ICONS[c.nombre] ?? '♪'}</span> ${c.nombre}</a>`);
  return html`<nav class="category-strip" aria-label="Categorías"><a class="category-chip selected" href="#/catalogo"><span>✳</span> Todo</a>${chips}</nav>`;
}

function featured(products) {
  const instruments = products.filter(p => p.tipoProducto === 'FISICO' && p.stock > 0).slice(0, FEATURED_COUNT);
  const learning = products.filter(p => p.tipoProducto !== 'FISICO').slice(0, FEATURED_COUNT);
  return html`<section class="catalog-section" id="destacados">
    <div class="section-heading"><div><div class="eyebrow">SELECCIÓN PARA TI</div><h2>Destacados<span class="brand-dot">.</span></h2>
      <p>Instrumentos y recursos que más eligen quienes empiezan.</p></div><a href="#/catalogo" class="text-link">Ver todo <span>↗</span></a></div>
    <div class="product-grid">${instruments.map(p => productCard(p))}</div>
    <div class="product-grid featured-learning">${learning.map(p => productCard(p))}</div></section>`;
}

function learningBanner() {
  return html`<section class="learning-banner" id="aprende"><div class="learning-icon">♫</div><div><span class="eyebrow">TU PRÓXIMO PASO EMPIEZA AQUÍ</span>
    <h2>Aprender también<br>es parte del viaje.</h2><p>Encuentra partituras, guías y tutoriales seleccionados para tu instrumento y nivel.</p>
    <a class="button button-light" href="#/aprende">Explorar recursos <span>↗</span></a></div>
    <div class="learning-visual"><div class="record record-a"></div><div class="record record-b"></div>
      <div class="resource-card"><span>PARTITURA · NIVEL INICIAL</span><b>Una canción<br>para empezar</b><i>♪ ♫ ♪ ♫ ♪</i></div></div></section>`;
}

export default {
  title: 'Inicio',
  access: 'public',
  async render(ctx) {
    const [products, tree] = await Promise.all([ctx.services.catalog.listProducts({}), ctx.services.catalog.listCategories()]);
    return html`${hero()}${categoryStrip(tree)}${featured(products)}${learningBanner()}`;
  },
};
