import home from './views/home.js';
import catalog from './views/catalog.js';

export const ROUTES = [
  { pattern: '/', view: home },
  { pattern: '/catalogo', view: catalog },
];
