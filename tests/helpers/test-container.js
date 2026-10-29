import { createMemoryStorage } from '../../src/infra/storage.js';
import { createContainer } from '../../src/services/container.js';

const DEFAULT_START = '2026-11-02T10:00:00-05:00';

export function createClock(start = DEFAULT_START) {
  let current = new Date(start).getTime();
  return {
    now: () => new Date(current),
    advance: ms => { current += ms; },
  };
}

export function createDeterministicRandom() {
  let counter = 0;
  return length => Uint8Array.from({ length }, () => { counter = (counter + 37) % 256; return counter; });
}

export async function createTestContainer({ withDemoHistory = false, start, wait = async () => {} } = {}) {
  const clock = createClock(start);
  const container = createContainer({
    storage: createMemoryStorage(), now: clock.now, random: createDeterministicRandom(), wait,
  });
  await container.seed({ withDemoHistory });
  return { ...container, clock };
}
