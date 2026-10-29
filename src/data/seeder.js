import { SEED_CATEGORIES, SEED_BRANDS, SEED_PHYSICAL, SEED_DIGITAL } from './seed-catalog.js';
import { SEED_COURSES } from './seed-courses.js';
import { SEED_USERS } from './seed-users.js';
import { hashPassword, randomHex } from '../infra/crypto.js';

export const SEED_VERSION = 1;
export const DEFAULT_MIN_STOCK = 3;
const SALT_BYTES = 16;
const FILES_DIR = 'assets/files/';
const DIGITAL_BRAND = 'OmniMelody Ediciones';
const COURSE_BRAND = 'OmniMelody Aula';
const COURSE_CATEGORY = 'cursos';

async function insertCategories(categorias) {
  const ids = {};
  for (const { clave, nombre, padre, descripcion } of SEED_CATEGORIES) {
    const created = await categorias.insert({ nombre, descripcion, idCategoriaPadre: padre ? ids[padre] : null, estado: 'A' });
    ids[clave] = created.id;
  }
  return ids;
}

async function insertBrands(marcas) {
  const ids = {};
  for (const nombre of SEED_BRANDS) ids[nombre] = (await marcas.insert({ nombre, estado: 'A' })).id;
  return ids;
}

function baseProduct(seed, refs, tipoProducto, fecha) {
  const { idPrototipo, categoria, marca, archivo, stock, ...fields } = seed;
  return {
    imagenes: [], precioAnterior: null, tipoInstrumento: '', familia: '', ...fields,
    idCategoria: refs.categorias[categoria], idMarca: refs.marcas[marca], tipoProducto, estado: 'A', fechaCreacion: fecha,
  };
}

function productDrafts(refs, fecha) {
  const physical = SEED_PHYSICAL.map(s => ({ orden: s.idPrototipo, stock: s.stock, data: baseProduct(s, refs, 'FISICO', fecha) }));
  const digital = SEED_DIGITAL.map(s => ({
    orden: s.idPrototipo,
    data: { ...baseProduct({ ...s, marca: DIGITAL_BRAND }, refs, 'DIGITAL', fecha), formato: 'PDF', urlArchivo: `${FILES_DIR}${s.archivo}.pdf` },
  }));
  const courses = SEED_COURSES.map(s => ({
    orden: s.idPrototipo,
    data: {
      ...baseProduct({ ...s, marca: COURSE_BRAND, categoria: COURSE_CATEGORY }, refs, 'AUDIOVISUAL', fecha),
      formato: 'VIDEO + PDF', urlArchivo: `${FILES_DIR}${s.archivo}.pdf`,
    },
  }));
  return [...physical, ...digital, ...courses].sort((a, b) => a.orden - b.orden);
}

async function insertStock(collections, producto, stock, fecha) {
  await collections.inventario.insert({ idProducto: producto.id, stock, stockMinimo: DEFAULT_MIN_STOCK, fechaActualizacion: fecha });
  if (stock > DEFAULT_MIN_STOCK) return;
  await collections.alertasStock.insert({
    idProducto: producto.id, stockActual: stock, stockMinimo: DEFAULT_MIN_STOCK, fechaAlerta: fecha, estado: 'PENDIENTE',
  });
}

async function insertProducts(collections, refs, fecha) {
  for (const draft of productDrafts(refs, fecha)) {
    const producto = await collections.productos.insert(draft.data);
    if (producto.id !== draft.orden) throw new Error(`Semilla desalineada: ${producto.nombre} recibió id ${producto.id}`);
    if (draft.data.tipoProducto === 'FISICO') await insertStock(collections, producto, draft.stock, fecha);
  }
}

async function insertUsers(usuarios, deps, fecha) {
  for (const { contrasena, ...user } of SEED_USERS) {
    const sal = randomHex(SALT_BYTES, deps.random);
    const contrasenaHash = await hashPassword(contrasena, sal);
    await usuarios.insert({ ...user, sal, contrasenaHash, estado: 'A', fechaRegistro: fecha, ultimoAcceso: null });
  }
}

export async function ensureSeeded(store, collections, deps, { afterSeed } = {}) {
  if (store.read('meta', {}).seedVersion === SEED_VERSION) return;
  store.clearAll();
  const fecha = deps.now().toISOString();
  const refs = { categorias: await insertCategories(collections.categorias), marcas: await insertBrands(collections.marcas) };
  await insertProducts(collections, refs, fecha);
  await insertUsers(collections.usuarios, deps, fecha);
  if (afterSeed) await afterSeed();
  store.write('meta', { seedVersion: SEED_VERSION });
}
