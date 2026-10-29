import { matchRoute, resolveAccess, NOT_FOUND } from '../core/routes-match.js';
import { showError, forbiddenView } from './error-view.js';
import notFoundView from './views/not-found.js';

const SITE_NAME = 'OmniMelody';

export function createRouter({ routes, ui, services, getUser, onRendered }) {
  const table = routes.map(route => ({ ...route, access: route.view.access }));

  function currentHashPath() {
    return location.hash.replace(/^#/, '') || '/';
  }

  function buildContext(match, user) {
    return { services, user, params: match.params, query: match.query, path: match.path, ...ui, refresh: render };
  }

  async function renderMatch(match) {
    const view = match.route === NOT_FOUND ? notFoundView : match.route.view;
    const user = await getUser();
    const access = resolveAccess(view.access, user);
    if (access === 'login') return ui.navigate(`#/login?volver=${encodeURIComponent(currentHashPath())}`);
    const ctx = buildContext(match, user);
    if (access === 'forbidden') ui.renderPage(forbiddenView());
    else {
      ui.renderPage(await view.render(ctx));
      view.mount?.(ui.root, ctx);
      document.title = `${ctx.pageTitle ?? view.title} · ${SITE_NAME}`;
    }
    return onRendered?.(ctx);
  }

  async function render() {
    const match = matchRoute(table, location.hash);
    try {
      await renderMatch(match);
    } catch (error) {
      showError(error, ui);
    }
  }

  function start() {
    window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
    return render();
  }

  return { start, render };
}
