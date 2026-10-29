import { NotFoundError } from '../core/errors.js';

export function createCollection(store, name) {
  const load = () => store.read(name, []);
  const save = items => store.write(name, items);
  const notFound = id => new NotFoundError(`No existe el registro ${id} en ${name}`);

  function nextId() {
    const seqKey = `seq:${name}`;
    const id = store.read(seqKey, 0) + 1;
    store.write(seqKey, id);
    return id;
  }

  function indexOf(items, id) {
    const index = items.findIndex(item => item.id === Number(id));
    if (index === -1) throw notFound(id);
    return index;
  }

  return {
    async findAll() { return structuredClone(load()); },
    async findById(id) { const items = load(); return structuredClone(items[indexOf(items, id)]); },
    async findBy(predicate) { return structuredClone(load().filter(predicate)); },
    async findOneBy(predicate) { return structuredClone(load().find(predicate)); },
    async insert(entity) {
      const created = { ...structuredClone(entity), id: nextId() };
      save([...load(), created]);
      return structuredClone(created);
    },
    async update(id, patch) {
      const items = load();
      const index = indexOf(items, id);
      items[index] = { ...items[index], ...structuredClone(patch), id: items[index].id };
      save(items);
      return structuredClone(items[index]);
    },
    async remove(id) {
      const items = load();
      items.splice(indexOf(items, id), 1);
      save(items);
    },
  };
}

export function createCollections(store, names) {
  return Object.fromEntries(names.map(name => [name, createCollection(store, name)]));
}
