import { $, setHtml, delegate } from '../dom.js';
import { headerView } from './header.js';
import { accountMenu } from './account-menu.js';
import { showError } from '../error-view.js';

export async function renderChrome(ctx) {
  const [user, cart] = await Promise.all([ctx.services.auth.currentUser(), ctx.services.cart.getCart()]);
  const header = { user, path: ctx.path ?? '/', cartCount: cart.cantidadTotal, accountMenu: accountMenu(user) };
  setHtml($('#siteHeader'), headerView(header));
}

export function bindChromeActions(ui, services) {
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
