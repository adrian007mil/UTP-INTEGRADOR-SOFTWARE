import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContainer } from '../helpers/test-container.js';
import { fieldsOfAsync } from '../helpers/assertions.js';
import { loginAdmin, loginDemo } from '../helpers/fixtures.js';
import { ConflictError, ForbiddenError } from '../../src/core/errors.js';

const NEW_PRODUCT = { nombre: 'Guitarra clásica Luna', descripcion: 'Cuerdas de nylon', precio: '359.90', tipoProducto: 'FISICO', idCategoria: '2', idMarca: '3', stock: '10', stockMinimo: '2' };

async function admin(options) {
  const container = await createTestContainer(options);
  await loginAdmin(container.services);
  return container;
}

test('crear un físico con stock 10 lo hace aparecer en el catálogo con ese stock', async () => {
  const { services } = await admin();
  const created = await services.adminProducts.create(NEW_PRODUCT);
  const view = await services.catalog.getProduct(created.id);
  assert.deepEqual([view.nombre, view.stock, view.estado, view.categoria.nombre], ['Guitarra clásica Luna', 10, 'A', 'Guitarras']);
});

test('deshabilitarlo lo saca del catálogo y habilitarlo lo devuelve', async () => {
  const { services } = await admin();
  await services.adminProducts.setActive(1, false);
  assert.ok(!(await services.catalog.listProducts({})).some(p => p.id === 1));
  assert.ok((await services.adminProducts.list()).some(p => p.id === 1 && p.estado === 'I'));
  await services.adminProducts.setActive(1, true);
  assert.ok((await services.catalog.listProducts({})).some(p => p.id === 1));
});

test('eliminar un producto vendido lanza ConflictError; uno sin ventas se elimina con su inventario', async () => {
  const { services, collections } = await admin({ withDemoHistory: true });
  await assert.rejects(services.adminProducts.remove(1), { name: 'ConflictError', message: 'Este producto tiene ventas; deshabilítalo en su lugar' });
  await services.adminProducts.remove(9);
  await assert.rejects(services.catalog.getProduct(9), { name: 'NotFoundError' });
  assert.equal(await collections.inventario.findOneBy(i => i.idProducto === 9), undefined);
});

test('update cambia datos y stock; stock bajo crea alerta y reponer la atiende', async () => {
  const { services, collections } = await admin();
  await services.adminProducts.update(1, { ...NEW_PRODUCT, idCategoria: '2', idMarca: '1', nombre: 'Guitarra Sienna II', stock: '2', stockMinimo: '3' });
  assert.equal((await services.catalog.getProduct(1)).nombre, 'Guitarra Sienna II');
  const pending = () => collections.alertasStock.findBy(a => a.idProducto === 1 && a.estado === 'PENDIENTE');
  assert.equal((await pending()).length, 1);
  await services.adminProducts.update(1, { ...NEW_PRODUCT, idMarca: '1', stock: '20', stockMinimo: '3' });
  assert.equal((await pending()).length, 0);
  assert.equal((await collections.inventario.findOneBy(i => i.idProducto === 1)).stock, 20);
});

test('no se puede cambiar el tipo de un producto existente', async () => {
  const { services } = await admin();
  await assert.rejects(services.adminProducts.update(1, { ...NEW_PRODUCT, tipoProducto: 'DIGITAL', urlArchivo: 'assets/files/x.pdf' }), ConflictError);
});

test('precio inválido lanza ValidationError', async () => {
  const { services } = await admin();
  assert.ok((await fieldsOfAsync(services.adminProducts.create({ ...NEW_PRODUCT, precio: '-5' }))).precio);
  assert.ok((await fieldsOfAsync(services.adminProducts.create({ ...NEW_PRODUCT, precio: '12.345' }))).precio);
});

test('un cliente no puede administrar productos', async () => {
  const { services } = await createTestContainer();
  await loginDemo(services);
  await assert.rejects(services.adminProducts.create(NEW_PRODUCT), ForbiddenError);
  await assert.rejects(services.adminProducts.list(), ForbiddenError);
});
