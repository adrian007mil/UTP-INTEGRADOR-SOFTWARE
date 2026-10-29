import { StorageCorruptedError } from '../core/errors.js';

export const STORAGE_PREFIX = 'omnimelody:v1:';

function prefixedKeys(storage) {
  const keys = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  return keys;
}

function snapshot(storage) {
  return new Map(prefixedKeys(storage).map(key => [key, storage.getItem(key)]));
}

function restore(storage, saved) {
  prefixedKeys(storage).forEach(key => storage.removeItem(key));
  saved.forEach((value, key) => storage.setItem(key, value));
}

export function createStore(storage) {
  let inTransaction = false;

  function read(key, fallback) {
    const raw = storage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      throw new StorageCorruptedError(`Los datos guardados de "${key}" están dañados`);
    }
  }

  function write(key, value) {
    storage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  }

  function clearAll() {
    prefixedKeys(storage).forEach(key => storage.removeItem(key));
  }

  async function transact(fn) {
    if (inTransaction) return fn();
    const saved = snapshot(storage);
    inTransaction = true;
    try {
      return await fn();
    } catch (error) {
      restore(storage, saved);
      throw error;
    } finally {
      inTransaction = false;
    }
  }

  return { read, write, clearAll, transact };
}
