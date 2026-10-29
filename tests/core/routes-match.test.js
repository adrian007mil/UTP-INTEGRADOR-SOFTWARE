import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchRoute, resolveAccess, safeReturnPath, NOT_FOUND } from '../../src/core/routes-match.js';

const ROUTES = [
  { pattern: '/', access: 'public' },
  { pattern: '/catalogo', access: 'public' },
  { pattern: '/producto/:id', access: 'public' },
  { pattern: '/cuenta/pedidos/:id', access: 'auth' },
];

test('matchRoute extrae params y query', () => {
  const r = matchRoute(ROUTES, '#/producto/7?ref=home');
  assert.equal(r.route.pattern, '/producto/:id');
  assert.deepEqual(r.params, { id: '7' });
  assert.equal(r.query.get('ref'), 'home');
});

test('hash vacío o "#" va a inicio', () => {
  assert.equal(matchRoute(ROUTES, '').route.pattern, '/');
  assert.equal(matchRoute(ROUTES, '#').route.pattern, '/');
  assert.equal(matchRoute(ROUTES, '#/').route.pattern, '/');
});

test('ruta desconocida va a NOT_FOUND', () => {
  assert.equal(matchRoute(ROUTES, '#/nada').route, NOT_FOUND);
  assert.equal(matchRoute(ROUTES, '#/producto/7/extra').route, NOT_FOUND);
});

test('params decodifican caracteres codificados', () => {
  assert.deepEqual(matchRoute(ROUTES, '#/cuenta/pedidos/a%20b').params, { id: 'a b' });
});

test('query vacía es un URLSearchParams vacío', () => {
  assert.equal([...matchRoute(ROUTES, '#/catalogo').query].length, 0);
});

test('barra final se ignora', () => {
  assert.equal(matchRoute(ROUTES, '#/catalogo/').route.pattern, '/catalogo');
});

test('resolveAccess', () => {
  assert.equal(resolveAccess('public', null), 'allow');
  assert.equal(resolveAccess('auth', null), 'login');
  assert.equal(resolveAccess('auth', { rol: 'CLIENTE' }), 'allow');
  assert.equal(resolveAccess('admin', null), 'login');
  assert.equal(resolveAccess('admin', { rol: 'CLIENTE' }), 'forbidden');
  assert.equal(resolveAccess('admin', { rol: 'ADMIN' }), 'allow');
});

test('safeReturnPath solo acepta rutas internas', () => {
  assert.equal(safeReturnPath('/checkout'), '/checkout');
  assert.equal(safeReturnPath('/catalogo?q=a'), '/catalogo?q=a');
  assert.equal(safeReturnPath('//evil.com'), '/');
  assert.equal(safeReturnPath('https://evil.com'), '/');
  assert.equal(safeReturnPath(null), '/');
});
