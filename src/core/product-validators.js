import { ValidationError } from './errors.js';
import { text } from './validation.js';

export const PRODUCT_TYPES = ['FISICO', 'DIGITAL', 'AUDIOVISUAL'];
export const PRODUCT_LIMITS = { NOMBRE: [3, 150], DESCRIPCION: 500 };
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
const YOUTUBE_ID = /^[\w-]{11}$/;
const SAFE_IMAGE = /^(https:\/\/|assets\/)[^\s"'<>]+$/;

const toInt = value => (/^\d+$/.test(text(value)) ? Number(text(value)) : NaN);

function priceError(value) {
  if (!PRICE_PATTERN.test(value) || Number(value) <= 0) return 'El precio debe ser mayor que 0 y tener hasta 2 decimales';
  return null;
}

function commonErrors(data, refs, errors) {
  const [min, max] = PRODUCT_LIMITS.NOMBRE;
  if (data.nombre.length < min || data.nombre.length > max) errors.nombre = `El nombre debe tener entre ${min} y ${max} caracteres`;
  if (data.descripcion.length > PRODUCT_LIMITS.DESCRIPCION) errors.descripcion = `Máximo ${PRODUCT_LIMITS.DESCRIPCION} caracteres`;
  const price = priceError(data.precio);
  if (price) errors.precio = price;
  if (!PRODUCT_TYPES.includes(data.tipoProducto)) errors.tipoProducto = 'Elige un tipo de producto';
  if (!refs.categorias.some(c => c.id === Number(data.idCategoria))) errors.idCategoria = 'Elige una categoría';
  if (!refs.marcas.some(m => m.id === Number(data.idMarca))) errors.idMarca = 'Elige una marca';
  if (data.imagen && !SAFE_IMAGE.test(data.imagen)) errors.imagen = 'Usa una URL https:// o una ruta assets/';
}

function typeErrors(data, errors) {
  if (data.tipoProducto === 'FISICO') {
    if (Number.isNaN(toInt(data.stock))) errors.stock = 'El stock es un número entero desde 0';
    if (Number.isNaN(toInt(data.stockMinimo))) errors.stockMinimo = 'El stock mínimo es un número entero desde 0';
    return;
  }
  if (!data.urlArchivo) errors.urlArchivo = 'Indica la ruta del archivo descargable';
  if (data.tipoProducto === 'AUDIOVISUAL') {
    if (!YOUTUBE_ID.test(data.videoId)) errors.videoId = 'El ID de YouTube tiene 11 caracteres';
    if (data.capitulos.length === 0) errors.capitulos = 'Escribe al menos un capítulo (uno por línea)';
  }
}

function typeFields(data) {
  if (data.tipoProducto === 'DIGITAL') return { formato: 'PDF', urlArchivo: data.urlArchivo, numeroPaginas: toInt(data.numeroPaginas) || 0 };
  if (data.tipoProducto === 'AUDIOVISUAL') {
    return { formato: 'VIDEO + PDF', urlArchivo: data.urlArchivo, videoId: data.videoId, capitulos: data.capitulos, duracionMin: toInt(data.duracionMin) || 0 };
  }
  return {};
}

function normalize(raw) {
  const fields = ['nombre', 'descripcion', 'precio', 'tipoProducto', 'idCategoria', 'idMarca', 'stock', 'stockMinimo', 'imagen', 'urlArchivo', 'videoId', 'numeroPaginas', 'duracionMin', 'etiqueta'];
  const data = Object.fromEntries(fields.map(field => [field, text(raw?.[field])]));
  data.tipoProducto = data.tipoProducto.toUpperCase();
  data.capitulos = String(raw?.capitulos ?? '').split('\n').map(line => line.trim()).filter(Boolean);
  return data;
}

export function validateProduct(raw, refs) {
  const data = normalize(raw);
  const errors = {};
  commonErrors(data, refs, errors);
  typeErrors(data, errors);
  if (Object.keys(errors).length > 0) throw new ValidationError('Revisa los datos del producto', errors);
  const producto = {
    nombre: data.nombre, descripcion: data.descripcion, precio: Number(data.precio), tipoProducto: data.tipoProducto,
    idCategoria: Number(data.idCategoria), idMarca: Number(data.idMarca), etiqueta: data.etiqueta || data.tipoProducto,
    imagenes: data.imagen ? [{ url: data.imagen, credito: 'Imagen del catálogo', enlace: data.imagen }] : [], ...typeFields(data),
  };
  const inventario = data.tipoProducto === 'FISICO' ? { stock: toInt(data.stock), stockMinimo: toInt(data.stockMinimo) } : null;
  return { producto, inventario };
}
