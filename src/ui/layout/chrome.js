import { $, setHtml, delegate } from '../dom.js';
import { headerView } from './header.js';
import { accountMenu } from './account-menu.js';
import { showError } from '../error-view.js';

export async function renderChrome(ctx) {
  const { auth, cart, mailbox } = ctx.services;
  const [user, currentCart, unread] = await Promise.all([auth.currentUser(), cart.getCart(), mailbox.unreadCount()]);
  const header = { user, path: ctx.path ?? '/', cartCount: currentCart.cantidadTotal, accountMenu: accountMenu(user, { unread }) };
  setHtml($('#siteHeader'), headerView(header));
}

const RESET_CONFIRMATION = 'Se borrarán tus cambios y volverás a los datos de ejemplo. ¿Continuar?';

export function bindChromeActions(ui, services) {
  delegate(document.body, 'click', '[data-reset-demo]', async () => {
    if (!window.confirm(RESET_CONFIRMATION)) return;
    try {
      await services.demo.reset();
      location.hash = '#/';
      location.reload();
    } catch (error) {
      showError(error, ui);
    }
  });
  delegate(document.body, 'click', '[data-logout]', async () => {
    try {
      await services.auth.logout();
      ui.toast('Cerraste sesión');
      ui.navigate('#/');
    } catch (error) {
      showError(error, ui);
    }
  });
  delegate(document.body, 'click', '#menuToggle', () => $('#mainNav')?.classList.toggle('mobile-open'));
  delegate(document.body, 'click', '.account-dropdown a', (event, link) => link.closest('details')?.removeAttribute('open'));
}
