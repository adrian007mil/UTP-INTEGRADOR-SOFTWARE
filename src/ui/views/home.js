import { html } from '../html.js';

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

export default {
  title: 'Inicio',
  access: 'public',
  async render() {
    return hero();
  },
};
