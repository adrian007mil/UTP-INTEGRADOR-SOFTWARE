import { html } from '../html.js';
import { $, setHtml, delegate } from '../dom.js';
import { formatMoney } from '../../core/money.js';
import { showError } from '../error-view.js';
import { productVisual } from '../components/product-card.js';

const TYPE_LABELS = { FISICO: 'Instrumento', DIGITAL: 'Digital', AUDIOVISUAL: 'Curso' };

function canIncrease({ producto, cantidad }) {
  return producto.tipoProducto === 'FISICO' && producto.estado === 'A' && cantidad < producto.stock;
}

function cartRow(line) {
  const { producto, cantidad } = line;
  const problem = line.problema ? html`<small class="line-problem">${line.problema}</small>` : '';
  return html`<div class="cart-row"><div class="cart-thumb ${producto.tono}">${productVisual(producto, 'cart-photo')}</div>
    <div><h4><a href="#/producto/${producto.id}">${producto.nombre}</a></h4><small>${TYPE_LABELS[producto.tipoProducto]} · ${formatMoney(line.precioUnitario)}</small>${problem}
      <div class="qty-control"><button data-qty="${producto.id}" data-delta="-1" aria-label="Quitar una unidad" ${cantidad <= 1 ? 'disabled' : ''}>−</button>
        <span>${cantidad}</span><button data-qty="${producto.id}" data-delta="1" aria-label="Agregar una unidad" ${canIncrease(line) ? '' : 'disabled'}>＋</button>
        <button class="remove-item" data-remove="${producto.id}">Quitar</button></div></div>
    <strong>${formatMoney(line.subtotalLinea)}</strong></div>`;
}

function emptyCart() {
  return html`<div class="cart-empty"><span>▱</span><b>Tu carrito está esperando</b><p>Agrega algo que te inspire a tocar.</p>
    <a class="button button-dark" href="#/catalogo" data-close-cart>Explorar tienda</a></div>`;
}

function summary(cart) {
  const total = cart.lines.reduce((sum, line) => sum + line.subtotalLinea, 0);
  const blocked = cart.lines.some(line => line.problema);
  return html`<div class="cart-summary"><div><span>Total de productos</span><b>${formatMoney(total)}</b></div>
    <small>Incluye IGV. El envío se calcula al continuar.</small>${blocked ? html`<small class="line-problem">Revisa los productos marcados antes de continuar.</small>` : ''}
    <a class="button button-dark checkout-button ${blocked ? 'is-disabled' : ''}" href="#/checkout" data-close-cart aria-disabled="${blocked}">Continuar con la compra <span>→</span></a>
    <button class="text-link clear-cart" data-clear-cart>Vaciar carrito</button><p class="secure-note">♧ Compra segura · Datos protegidos</p></div>`;
}

export function drawerView(cart) {
  return html`<div class="drawer-header"><div><span class="eyebrow">TU SELECCIÓN</span><h2>Mi carrito <span>(${cart.cantidadTotal})</span></h2></div>
    <button class="icon-button" data-close-cart aria-label="Cerrar carrito">×</button></div>
    ${cart.lines.length ? html`<div class="cart-items">${cart.lines.map(cartRow)}</div>${summary(cart)}` : emptyCart()}`;
}

export function createCartDrawer(ui, services) {
  const drawer = $('#cartDrawer');
  const overlay = $('#overlay');

  async function refresh() {
    const cart = await services.cart.getCart();
    setHtml(drawer, drawerView(cart));
    const count = $('#cartCount');
    if (count) count.textContent = String(cart.cantidadTotal);
    return cart;
  }

  async function open() {
    await refresh();
    drawer.classList.add('open');
    overlay.classList.add('visible');
  }

  function close() {
    drawer.classList.remove('open');
    if (!$('#modal').classList.contains('open')) overlay.classList.remove('visible');
  }

  const guarded = action => async (event, target) => {
    try {
      await action(event, target);
    } catch (error) {
      showError(error, ui);
    }
  };

  delegate(document.body, 'click', '#cartToggle', guarded(open));
  delegate(document.body, 'click', '[data-add]', guarded(async (event, button) => {
    event.preventDefault();
    const cart = await services.cart.add(Number(button.dataset.add));
    const line = cart.lines.find(l => l.producto.id === Number(button.dataset.add));
    ui.toast(`${line.producto.nombre} se agregó al carrito`);
    await refresh();
  }));
  delegate(drawer, 'click', '[data-qty]', guarded(async (event, button) => {
    const cart = await services.cart.getCart();
    const line = cart.lines.find(l => l.producto.id === Number(button.dataset.qty));
    await services.cart.setQuantity(line.producto.id, line.cantidad + Number(button.dataset.delta));
    await refresh();
  }));
  delegate(drawer, 'click', '[data-remove]', guarded(async (event, button) => { await services.cart.remove(Number(button.dataset.remove)); await refresh(); }));
  delegate(drawer, 'click', '[data-clear-cart]', guarded(async () => {
    if (!window.confirm('¿Vaciar el carrito? Se quitarán todos los productos.')) return;
    await services.cart.clear();
    await refresh();
  }));
  delegate(drawer, 'click', '[data-close-cart]', (event, target) => {
    if (target.getAttribute('aria-disabled') === 'true') event.preventDefault();
    else close();
  });
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  return { open, close, refresh };
}
