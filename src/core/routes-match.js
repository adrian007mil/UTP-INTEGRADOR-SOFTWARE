export const NOT_FOUND = Object.freeze({ pattern: '*', access: 'public' });

function splitHash(hash) {
  const withoutMark = hash.replace(/^#/, '');
  const [pathPart, queryPart = ''] = withoutMark.split('?');
  const path = `/${pathPart.replace(/^\/+|\/+$/g, '')}`;
  return { path, query: new URLSearchParams(queryPart) };
}

function matchPattern(pattern, path) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const expected = patternParts[i];
    if (expected.startsWith(':')) params[expected.slice(1)] = decodeURIComponent(pathParts[i]);
    else if (expected !== pathParts[i]) return null;
  }
  return params;
}

export function matchRoute(routes, hash) {
  const { path, query } = splitHash(hash);
  for (const route of routes) {
    const params = matchPattern(route.pattern, path);
    if (params) return { route, params, query, path };
  }
  return { route: NOT_FOUND, params: {}, query, path };
}

export function resolveAccess(access, user) {
  if (access === 'public') return 'allow';
  if (!user) return 'login';
  if (access === 'admin' && user.rol !== 'ADMIN') return 'forbidden';
  return 'allow';
}

export function safeReturnPath(value) {
  const path = String(value ?? '');
  return path.startsWith('/') && !path.startsWith('//') ? path : '/';
}
