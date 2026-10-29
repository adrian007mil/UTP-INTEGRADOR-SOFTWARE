import { resolveBrowserStorage } from './infra/storage.js';
import { browserRandom } from './infra/crypto.js';
import { StorageCorruptedError } from './core/errors.js';
import { startContainer } from './services/bootstrap.js';
import { createStore } from './infra/store.js';
import { createRouter } from './ui/router.js';
import { createToast } from './ui/toast.js';
import { createModal } from './ui/modal.js';
import { $, setHtml, delegate } from './ui/dom.js';
import { renderChrome, bindChromeActions } from './ui/layout/chrome.js';
import { footerView } from './ui/layout/footer.js';
import { recoveryView, startupErrorView } from './ui/views/recovery.js';
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
    renderPage: safeHtml => {
      const viewRoot = document.createElement('div');
      viewRoot.className = 'view-root';
      setHtml(viewRoot, safeHtml);
      root.replaceChildren(viewRoot);
      return viewRoot;
    },
  };
  return ui;
}

function bindRecoveryAction(storage) {
  delegate(document.body, 'click', '[data-reset-storage]', () => {
    createStore(storage).clearAll();
    location.reload();
  });
}

function startApp(container, ui) {
  const { services } = container;
  const productActions = bindProductActions(document.body, ui, services);
  bindChromeActions(ui, services);
  ui.cartDrawer = createCartDrawer(ui, services);
  const onRendered = async ctx => {
    await renderChrome(ctx);
    await productActions.refreshCompareBar();
  };
  const router = createRouter({ routes: ROUTES, ui, services, getUser: () => services.auth.currentUser(), onRendered });
  ui.refresh = router.render;
  return router.start();
}

async function boot(ui) {
  const browser = resolveBrowserStorage(window);
  bindRecoveryAction(browser.storage);
  setHtml($('#siteFooter'), footerView());
  try {
    const deps = { now: () => new Date(), random: browserRandom, wait: ms => new Promise(resolve => setTimeout(resolve, ms)) };
    const { container, persistent } = await startContainer({ ...browser, ...deps });
    if (!persistent) ui.toast(NOT_PERSISTENT_MESSAGE);
    return startApp(container, ui);
  } catch (error) {
    if (error instanceof StorageCorruptedError) return ui.renderPage(recoveryView());
    globalThis.reportError?.(error);
    return ui.renderPage(startupErrorView());
  }
}

const appUi = createUi();
boot(appUi);
