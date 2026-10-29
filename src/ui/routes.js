import home from './views/home.js';
import catalog from './views/catalog.js';
import productDetail from './views/product-detail.js';

export const ROUTES = [
  { pattern: '/', view: home },
  { pattern: '/catalogo', view: catalog },
  { pattern: '/producto/:id', view: productDetail },
];
