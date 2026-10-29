import { validateAddress } from '../core/validators.js';
import { NotFoundError } from '../core/errors.js';

export function createAddressService({ collections, services }) {
  const own = async () => {
    const user = await services.auth.requireUser();
    return { user, list: await collections.direcciones.findBy(d => d.idUsuario === user.id) };
  };

  async function get(id) {
    const { list } = await own();
    const address = list.find(d => d.id === Number(id));
    if (!address) throw new NotFoundError('No encontramos esa dirección');
    return address;
  }

  async function list() {
    const { list: addresses } = await own();
    return addresses.sort((a, b) => Number(b.predeterminada) - Number(a.predeterminada));
  }

  async function add(data) {
    const valid = validateAddress(data);
    const { user, list: addresses } = await own();
    return collections.direcciones.insert({ ...valid, idUsuario: user.id, predeterminada: addresses.length === 0 });
  }

  async function update(id, data) {
    const valid = validateAddress(data);
    const address = await get(id);
    return collections.direcciones.update(address.id, valid);
  }

  async function setDefault(id) {
    const address = await get(id);
    const { list: addresses } = await own();
    for (const other of addresses) await collections.direcciones.update(other.id, { predeterminada: other.id === address.id });
    return { ...address, predeterminada: true };
  }

  async function remove(id) {
    const address = await get(id);
    await collections.direcciones.remove(address.id);
    const { list: rest } = await own();
    if (address.predeterminada && rest.length > 0) await setDefault(rest[0].id);
  }

  return { list, get, add, update, setDefault, remove };
}
