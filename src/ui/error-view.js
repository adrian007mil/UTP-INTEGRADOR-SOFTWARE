import {
  ValidationError, AuthError, ForbiddenError, NotFoundError, PaymentDeclinedError, ConflictError, AppError, StorageCorruptedError,
} from '../core/errors.js';
import { html } from './html.js';
import { recoveryView } from './views/recovery.js';

export const GENERIC_ERROR_MESSAGE = 'Ocurrió un problema. Intenta otra vez.';

export function forbiddenView() {
  return html`<section class="page-section empty-state"><span>⊘</span><h3>Acceso restringido</h3>
    <p>Esta sección es solo para administradores.</p><a class="button button-dark" href="#/">Volver al inicio</a></section>`;
}

export function showError(error, ui) {
  if (error instanceof PaymentDeclinedError) return ui.toast(`Pago rechazado: ${error.reason}`);
  if (error instanceof ForbiddenError) return ui.renderPage(forbiddenView());
  if (error instanceof NotFoundError) return ui.navigate('#/no-encontrado');
  if (error instanceof ValidationError || error instanceof AuthError || error instanceof ConflictError) {
    return ui.toast(error.message);
  }
  if (error instanceof StorageCorruptedError) return ui.renderPage(recoveryView());
  if (error instanceof AppError) return ui.toast(error.message);
  globalThis.reportError?.(error);
  return ui.toast(GENERIC_ERROR_MESSAGE);
}
