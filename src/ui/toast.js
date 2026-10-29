const TOAST_DURATION_MS = 2800;

export function createToast(element) {
  let timer;
  return function toast(message) {
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => element.classList.remove('show'), TOAST_DURATION_MS);
  };
}
