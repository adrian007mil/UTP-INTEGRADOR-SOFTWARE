const COMMONS = 'https://commons.wikimedia.org/wiki/File:';
const LOCAL_IMAGES = 'assets/img/';

export const SEED_CATEGORIES = [
  { clave: 'cuerdas', nombre: 'Cuerdas', padre: null, descripcion: 'Guitarras, bajos y ukeleles' },
  { clave: 'guitarras', nombre: 'Guitarras', padre: 'cuerdas', descripcion: 'Acústicas y eléctricas' },
  { clave: 'bajos', nombre: 'Bajos', padre: 'cuerdas', descripcion: 'Bajos eléctricos' },
  { clave: 'ukeleles', nombre: 'Ukeleles', padre: 'cuerdas', descripcion: 'Ukeleles soprano y concierto' },
  { clave: 'teclados', nombre: 'Teclados', padre: null, descripcion: 'Teclados y pianos digitales' },
  { clave: 'percusion', nombre: 'Percusión', padre: null, descripcion: 'Cajones y percusión menor' },
  { clave: 'vientos', nombre: 'Vientos', padre: null, descripcion: 'Flautas y otros vientos' },
  { clave: 'audio', nombre: 'Audio', padre: null, descripcion: 'Micrófonos y grabación' },
  { clave: 'documentos', nombre: 'Partituras y documentos', padre: null, descripcion: 'Material digital descargable' },
  { clave: 'partituras', nombre: 'Partituras', padre: 'documentos', descripcion: 'Partituras en PDF' },
  { clave: 'guias', nombre: 'Guías y métodos', padre: 'documentos', descripcion: 'Guías, métodos y teoría' },
  { clave: 'audiovisual', nombre: 'Material audiovisual', padre: null, descripcion: 'Cursos y tutoriales en video' },
  { clave: 'cursos', nombre: 'Cursos', padre: 'audiovisual', descripcion: 'Cursos audiovisuales por capítulos' },
];

export const SEED_BRANDS = [
  'Cordoba', 'Gibson', 'Yamaha', 'Casio', 'Kala', 'Meinl', 'Audio-Technica',
  'OmniMelody Ediciones', 'OmniMelody Aula',
];

function photo(path, file, credito) {
  return [{ url: LOCAL_IMAGES + path, credito, enlace: COMMONS + file }];
}

export const SEED_PHYSICAL = [
  {
    idPrototipo: 1, categoria: 'guitarras', marca: 'Cordoba', nombre: 'Guitarra acústica Sienna',
    descripcion: 'Tapa de abeto · sonido cálido · ideal para comenzar', precio: 489, precioAnterior: 559, stock: 7,
    tipoInstrumento: 'guitarra-acustica', familia: 'cuerda', tono: 'peach', etiqueta: 'MÁS VENDIDO', visual: '🎸',
    imagenes: photo('guitarra-acustica.jpg', 'Acoustic_guitar.jpg', 'Massimo Giuliani · dominio público'),
  },
  {
    idPrototipo: 2, categoria: 'teclados', marca: 'Casio', nombre: 'Teclado digital LK-120',
    descripcion: '61 teclas sensibles · 100 tonos · incluye atril', precio: 899, stock: 4,
    tipoInstrumento: 'teclado', familia: '', tono: 'blue', etiqueta: 'POPULAR', visual: '🎹',
    imagenes: photo('teclado.jpg', 'Piano_Keyboard.jpg', 'Scott Detwiler · CC BY-SA 3.0'),
  },
  {
    idPrototipo: 4, categoria: 'ukeleles', marca: 'Kala', nombre: 'Ukelele soprano Marea',
    descripcion: 'Madera de caoba · ligero · afinación estable', precio: 219, stock: 0,
    tipoInstrumento: 'ukelele', familia: 'cuerda', tono: 'sage', etiqueta: 'AGOTADO', visual: '🪕',
    imagenes: photo('ukelele.jpg', 'Concert_sized_ukulele.jpg', 'Naithik Shetty · CC0'),
  },
  {
    idPrototipo: 5, categoria: 'percusion', marca: 'Meinl', nombre: 'Cajón peruano Raíces',
    descripcion: 'Cuerpo de abedul · sonido grave y brillante', precio: 349, stock: 5,
    tipoInstrumento: 'cajon', familia: '', tono: 'sand', etiqueta: 'HECHO PARA EL RITMO', visual: '🥁',
    imagenes: photo('cajon.jpg', 'Cajon3.JPG', 'SLevinR · CC BY 3.0'),
  },
  {
    idPrototipo: 7, categoria: 'audio', marca: 'Audio-Technica', nombre: 'Micrófono de condensador Aura',
    descripcion: 'Captura clara para voces, instrumentos y grabación', precio: 629, stock: 3,
    tipoInstrumento: 'microfono', familia: '', tono: 'rose', etiqueta: 'SELECCIÓN PRO', visual: '🎙',
    imagenes: photo('microfono.jpg', 'Microphone_studio.jpg', 'Zzubnik · dominio público'),
  },
  {
    idPrototipo: 8, categoria: 'vientos', marca: 'Yamaha', nombre: 'Flauta dulce soprano',
    descripcion: 'Resina ABS · digitación barroca · funda incluida', precio: 79, stock: 14,
    tipoInstrumento: 'flauta', familia: 'aire', tono: 'yellow', etiqueta: 'IDEAL PARA EMPEZAR', visual: '🎶',
    imagenes: photo('flauta.jpg', 'Flute_on_wood.jpg', 'Ikal-balam · CC BY-SA 4.0'),
  },
  {
    idPrototipo: 9, categoria: 'guitarras', marca: 'Gibson', nombre: 'Guitarra eléctrica vintage',
    descripcion: 'Cuerpo sólido · sonido versátil · ideal para rock y pop', precio: 1299, stock: 6,
    tipoInstrumento: 'guitarra-electrica', familia: 'cuerda', tono: 'rose', etiqueta: 'NUEVO', visual: '🎸',
    imagenes: photo('guitarra-electrica.jpg', 'Elecguitar.jpg', 'Swerver15 · dominio público'),
  },
  {
    idPrototipo: 10, categoria: 'bajos', marca: 'Yamaha', nombre: 'Bajo eléctrico de 4 cuerdas',
    descripcion: 'Cuatro cuerdas · sonido definido para ritmo y armonía', precio: 1399, stock: 3,
    tipoInstrumento: 'bajo', familia: 'cuerda', tono: 'sage', etiqueta: 'NUEVO', visual: '🎸', ajusteImagen: 'contain',
    imagenes: photo('bajo.jpg', 'Bass_guitar_(instrument).jpg', 'Ziongarage · CC0'),
  },
];

export const SEED_DIGITAL = [
  {
    idPrototipo: 3, categoria: 'partituras', nombre: 'Partituras: clásicos del piano',
    descripcion: '12 piezas seleccionadas · nivel inicial e intermedio', precio: 39,
    visual: '📖', tono: 'lav', etiqueta: 'DESCARGA DIGITAL', numeroPaginas: 28, archivo: 'partituras-clasicos-piano',
  },
  {
    idPrototipo: 6, categoria: 'guias', nombre: 'Guía práctica de guitarra',
    descripcion: 'Acordes, ejercicios y canciones para principiantes', precio: 29,
    visual: '📄', tono: 'mint', etiqueta: 'PDF · 34 PÁGINAS', numeroPaginas: 34, archivo: 'guia-practica-guitarra',
  },
  {
    idPrototipo: 11, categoria: 'guias', nombre: 'Acordes esenciales para guitarra',
    descripcion: 'Diagramas de acordes y ejercicios para nivel inicial', precio: 24,
    visual: '📘', tono: 'mint', etiqueta: 'GUÍA DIGITAL · PDF', numeroPaginas: 20, archivo: 'acordes-esenciales-guitarra',
  },
  {
    idPrototipo: 12, categoria: 'partituras', nombre: 'Partituras: música peruana para guitarra',
    descripcion: 'Selección de temas peruanos con cifrado y melodía', precio: 49,
    visual: '🎼', tono: 'lav', etiqueta: 'PARTITURAS · PDF', numeroPaginas: 32, archivo: 'partituras-musica-peruana',
  },
  {
    idPrototipo: 13, categoria: 'guias', nombre: 'Método de bajo: líneas y ritmo',
    descripcion: 'Patrones rítmicos y líneas de bajo para comenzar', precio: 34,
    visual: '🎸', tono: 'blue', etiqueta: 'MÉTODO DIGITAL', numeroPaginas: 26, archivo: 'metodo-bajo',
  },
  {
    idPrototipo: 15, categoria: 'guias', nombre: 'Teoría musical práctica',
    descripcion: 'Notas, compases y lectura musical con ejercicios', precio: 29,
    visual: '📚', tono: 'sand', etiqueta: 'CUADERNO DIGITAL', numeroPaginas: 40, archivo: 'teoria-musical-practica',
  },
];
