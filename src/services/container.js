import { createStore } from '../infra/store.js';
import { createCollections } from '../infra/collection.js';
import { COLLECTION_NAMES } from '../data/collection-names.js';
import { ensureSeeded } from '../data/seeder.js';
import { createCatalogService } from './catalog-service.js';
import { createAuthService } from './auth-service.js';
import { createCartService } from './cart-service.js';

// Services receive the shared `services` object so they can call each other; this single
// composition point is what a future fetch-based implementation replaces.
const FACTORIES = {
  catalog: createCatalogService,
  auth: createAuthService,
  cart: createCartService,
};

export function createContainer({ storage, now, random, wait }) {
  const store = createStore(storage);
  const collections = createCollections(store, COLLECTION_NAMES);
  const deps = { now, random, wait };
  const services = {};
  const base = { store, collections, deps, services };
  Object.entries(FACTORIES).forEach(([name, factory]) => { services[name] = factory(base); });

  async function seed() {
    await ensureSeeded(store, collections, deps);
  }

  return { store, collections, deps, services, seed };
}
