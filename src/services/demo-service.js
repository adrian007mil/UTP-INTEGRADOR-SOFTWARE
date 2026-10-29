export function createDemoService({ store, reseed }) {
  async function reset() {
    store.clearAll();
    await reseed();
  }

  return { reset };
}
