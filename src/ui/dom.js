export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function $$(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function setHtml(element, safeHtml) {
  element.innerHTML = String(safeHtml);
}

export function delegate(root, eventName, selector, handler) {
  root.addEventListener(eventName, event => {
    const target = event.target.closest(selector);
    if (target && root.contains(target)) handler(event, target);
  });
}
