const PROBE_KEY = 'omnimelody:probe';

export function createMemoryStorage() {
  const data = new Map();
  return {
    get length() { return data.size; },
    key: index => [...data.keys()][index] ?? null,
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { data.set(key, String(value)); },
    removeItem: key => { data.delete(key); },
    clear: () => { data.clear(); },
  };
}

function canWrite(storage) {
  try {
    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

function tryGetLocalStorage(win) {
  try {
    return win.localStorage ?? null;
  } catch {
    return null;
  }
}

export function resolveBrowserStorage(win) {
  const local = tryGetLocalStorage(win);
  if (local && canWrite(local)) return { storage: local, persistent: true };
  return { storage: createMemoryStorage(), persistent: false };
}
