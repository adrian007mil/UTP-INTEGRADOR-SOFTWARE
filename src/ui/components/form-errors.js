import { ValidationError } from '../../core/errors.js';
import { showError } from '../error-view.js';
import { $$ } from '../dom.js';

export function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function clearFormErrors(form) {
  $$('.field-error', form).forEach(node => node.remove());
  $$('[aria-invalid]', form).forEach(input => input.removeAttribute('aria-invalid'));
}

export function bindFormErrors(form, validationError) {
  clearFormErrors(form);
  Object.entries(validationError.fields ?? {}).forEach(([name, message]) => {
    const input = form.elements.namedItem(name);
    if (!input || !(input instanceof HTMLElement)) return;
    input.setAttribute('aria-invalid', 'true');
    const note = document.createElement('small');
    note.className = 'field-error';
    note.textContent = message;
    input.insertAdjacentElement('afterend', note);
  });
}

export function handleSubmit(form, ctx, action) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    if (submit?.disabled) return;
    if (submit) submit.disabled = true;
    clearFormErrors(form);
    try {
      await action(readForm(form));
    } catch (error) {
      if (error instanceof ValidationError) bindFormErrors(form, error);
      showError(error, ctx);
    } finally {
      if (submit?.isConnected) submit.disabled = false;
    }
  });
}
