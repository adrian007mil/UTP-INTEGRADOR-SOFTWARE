import { resolveBrowserStorage } from './infra/storage.js';
import { browserRandom } from './infra/crypto.js';
import { StorageCorruptedError } from './core/errors.js';
import { createContainer } from './services/container.js';
import { createRouter } from './ui/router.js';
import { createToast } from './ui/toast.js';
import { createModal } from './ui/modal.js';
import { $, setHtml, delegate } from './ui/dom.js';
import { renderChrome, bindChromeActions } from './ui/layout/chrome.js';
import { footerView } from './ui/layout/footer.js';
import { recoveryView } from './ui/views/recovery.js';
import { ROUTES } from './ui/routes.js';
import { bindProductActions } from './ui/product-actions.js';
import { createCartDrawer } from './ui/layout/cart-drawer.js';

const NOT_PERSISTENT_MESSAGE = 'Tu navegador no permite guardar datos: los cambios se perderán al cerrar la pestaña.';

function createUi() {
  const root = $('#app');
  const modal = createModal({ modal: $('#modal'), overlay: $('#overlay'), content: $('#modalContent'), closeButton: $('#modalClose') });
  const ui = {
    root,
    modal,
    toast: createToast($('#toast')),
    refresh: async () => {},
    navigate: hash => {
      if (location.hash === hash) ui.refresh();
      else location.hash = hash;
    },
    renderPage: safeHtml => { setHtml(root, safeHtml); },
  };
  return ui;
}

function bindGlobalActions(container) {
  delegate(document.body, 'click', '[data-reset-storage]', () => {
    container.store.clearAll();
    location.reload();
  });
}

async function boot() {
  const { storage, persistent } = resolveBrowserStorage(window);
  const container = createContainer({ storage, now: () => new Date(), random: browserRandom, wait: ms => new Promise(r => setTimeout(r, ms)) });
  const ui = createUi();
  bindGlobalActions(container);
  bindProductActions(document.body, ui);
  bindChromeActions(ui, container.services);
  ui.cartDrawer = createCartDrawer(ui, container.services);
  setHtml($('#siteFooter'), footerView());
  if (!persistent) ui.toast(NOT_PERSISTENT_MESSAGE);
  try {
    await container.seed({ withDemoHistory: true });
  } catch (error) {
    if (!(error instanceof StorageCorruptedError)) throw error;
    return ui.renderPage(recoveryView());
  }
  const router = createRouter({ routes: ROUTES, ui, services: container.services, getUser: () => container.services.auth.currentUser(), onRendered: renderChrome });
  ui.refresh = router.render;
  return router.start();
}

boot();
