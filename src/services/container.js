import { createStore } from '../infra/store.js';
import { createCollections } from '../infra/collection.js';
import { COLLECTION_NAMES } from '../data/collection-names.js';
import { ensureSeeded } from '../data/seeder.js';
import { seedDemoHistory } from '../data/demo-history.js';
import { createCatalogService } from './catalog-service.js';
import { createAuthService } from './auth-service.js';
import { createCartService } from './cart-service.js';
import { createAddressService } from './address-service.js';
import { createMailboxService } from './mailbox-service.js';
import { createFulfillmentService } from './order-fulfillment.js';
import { createCheckoutService } from './checkout-service.js';
import { createOrderService } from './order-service.js';
import { createShipmentService } from './shipment-service.js';
import { createDownloadService } from './download-service.js';
import { createReviewService } from './review-service.js';

// Services receive the shared `services` object so they can call each other; this single
// composition point is what a future fetch-based implementation replaces.
const FACTORIES = {
  catalog: createCatalogService,
  auth: createAuthService,
  cart: createCartService,
  addresses: createAddressService,
  mailbox: createMailboxService,
  fulfillment: createFulfillmentService,
  checkout: createCheckoutService,
  orders: createOrderService,
  shipments: createShipmentService,
  downloads: createDownloadService,
  reviews: createReviewService,
};

export function createContainer({ storage, now, random, wait }) {
  const store = createStore(storage);
  const collections = createCollections(store, COLLECTION_NAMES);
  const deps = { now, random, wait };
  const services = {};
  const base = { store, collections, deps, services };
  Object.entries(FACTORIES).forEach(([name, factory]) => { services[name] = factory(base); });

  // The demo history goes through the real checkout, so the simulated gateway delay is
  // switched off while seeding; otherwise the first page load would wait several seconds.
  async function withoutPaymentDelay(task) {
    const originalWait = deps.wait;
    deps.wait = async () => {};
    try {
      return await task();
    } finally {
      deps.wait = originalWait;
    }
  }

  async function seed({ withDemoHistory = false } = {}) {
    const afterSeed = withDemoHistory ? () => withoutPaymentDelay(() => seedDemoHistory({ services, collections })) : undefined;
    await ensureSeeded(store, collections, deps, { afterSeed });
  }

  return { store, collections, deps, services, seed };
}
