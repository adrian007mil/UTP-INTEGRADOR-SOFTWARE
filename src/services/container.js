import { createStore } from '../infra/store.js';
import { createCollections } from '../infra/collection.js';
import { COLLECTION_NAMES } from '../data/collection-names.js';
import { ensureSeeded } from '../data/seeder.js';
import { createCatalogService } from './catalog-service.js';

export function createContainer({ storage, now, random, wait }) {
  const store = createStore(storage);
  const collections = createCollections(store, COLLECTION_NAMES);
  const deps = { now, random, wait };
  const services = {};
  services.catalog = createCatalogService({ collections });

  async function seed() {
    await ensureSeeded(store, collections, deps);
  }

  return { store, collections, deps, services, seed };
}
