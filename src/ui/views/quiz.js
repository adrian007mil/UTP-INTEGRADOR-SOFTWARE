import { html } from '../html.js';
import { $ } from '../dom.js';
import { formatMoney } from '../../core/money.js';
import { recommend } from '../../core/recommender.js';
import { cardFlags } from '../components/product-card.js';

const QUESTIONS = {
  sonido: [['cuerda', 'Cuerdas: guitarra, ukelele o bajo'], ['teclas', 'Teclas: piano o teclado'], ['ritmo', 'Percusión: cajón y ritmo'], ['aire', 'Aire: flauta y viento']],
  nivel: [['principiante', 'Estoy empezando'], ['intermedio', 'Ya tengo algo de práctica'], ['avanzado', 'Tengo experiencia']],
  presupuesto: [['250', 'Hasta S/ 250'], ['600', 'Hasta S/ 600'], ['1200', 'Hasta S/ 1,200'], ['2000', 'Hasta S/ 2,000']],
};
const DEFAULTS = { sonido: 'cuerda', nivel: 'principiante', presupuesto: '600' };

function select(label, name, selected) {
  return html`<label class="form-field">${label}<select name="${name}">${QUESTIONS[name].map(([value, text]) => html`<option value="${value}" ${value === selected ? 'selected' : ''}>${text}</option>`)}</select></label>`;
}

function results(result, answers, flags) {
  if (!answers.has('sonido')) return '';
  const budget = formatMoney(Number(answers.get('presupuesto')));
  const message = result.instrumentos.length
    ? `Estas opciones caben en tu presupuesto de hasta ${budget}:`
    : `Aún no tenemos ${result.etiqueta} dentro de ${budget}.${result.masEconomico ? ` La opción más económica cuesta ${formatMoney(result.masEconomico.precio)}.` : ''}`;
  const resource = result.recurso
    ? html`<div class="quiz-resource"><span>PARA SEGUIR APRENDIENDO</span><b>${result.recurso.nombre}</b><a class="button button-outline" href="#/${result.recurso.tipoProducto === 'AUDIOVISUAL' ? 'aprende' : 'producto'}/${result.recurso.id}">Ver recurso ↗</a></div>`
    : '';
  return html`<div class="quiz-results"><span class="eyebrow">RECOMENDACIÓN PERSONALIZADA</span><h2>Empieza con ${result.etiqueta}.</h2><p>${message}</p>
    <div class="product-grid quiz-products">${result.instrumentos.map(cardFlags(flags))}</div>${resource}</div>`;
}

export default {
  title: 'Ayúdame a elegir',
  access: 'public',
  async render(ctx) {
    const answers = ctx.query;
    const value = key => answers.get(key) ?? DEFAULTS[key];
    const [products, flags] = await Promise.all([ctx.services.catalog.listProducts({}), ctx.services.preferences.flags()]);
    const result = recommend(products, { sonido: value('sonido'), presupuesto: value('presupuesto'), nivel: value('nivel') });
    return html`<section class="page-section quiz-page"><form class="form-card quiz-form" id="quizForm"><span class="eyebrow">RECOMENDADOR OMNIMELODY</span>
        <h2>Encuentra tu próximo instrumento.</h2><p class="muted">Responde tres preguntas y te sugeriremos instrumentos y un material para empezar.</p>
        ${select('¿Qué sonido te interesa?', 'sonido', value('sonido'))}${select('¿Cuál es tu nivel?', 'nivel', value('nivel'))}${select('Presupuesto máximo', 'presupuesto', value('presupuesto'))}
        <button class="button button-dark" type="submit">Ver mis recomendaciones <span>→</span></button></form>${results(result, answers, flags)}</section>`;
  },
  mount(root, ctx) {
    $('#quizForm', root).addEventListener('submit', event => {
      event.preventDefault();
      ctx.navigate(`#/recomendador?${new URLSearchParams(new FormData(event.target)).toString()}`);
    });
  },
};
