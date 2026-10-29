import { StorageCorruptedError } from '../core/errors.js';
import { createMemoryStorage } from '../infra/storage.js';
import { createContainer } from './container.js';

async function seeded(storage, deps) {
  const container = createContainer({ storage, ...deps });
  await container.seed({ withDemoHistory: true });
  return container;
}

// A storage that passes the write probe can still fail while seeding (quota shared by every
// project page of a github.io user); the demo then keeps running in memory instead of hanging.
export async function startContainer({ storage, persistent, now, random, wait }) {
  const deps = { now, random, wait };
  try {
    return { container: await seeded(storage, deps), persistent };
  } catch (error) {
    if (error instanceof StorageCorruptedError) throw error;
    return { container: await seeded(createMemoryStorage(), deps), persistent: false };
  }
}
