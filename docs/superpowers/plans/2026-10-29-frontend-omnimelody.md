# Frontend OmniMelody — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Frontend completo de la tienda OmniMelody (28 RF cubiertos con persistencia local y pasarela simulada), publicado en GitHub Pages.

**Architecture:** SPA en JavaScript puro con módulos ES nativos y router por hash. Capas `ui → services → repositories` más `core` puro; los servicios exponen interfaces asíncronas con forma de endpoint para cambiarlas luego por `fetch` a Servlets JSON. Persistencia en `localStorage` con transacciones por snapshot.

**Tech Stack:** HTML5, CSS, JavaScript ES2022 (módulos nativos), Web Crypto API, `node --test` (Node 24) sin dependencias, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-29-frontend-omnimelody-design.md`

**Fuente visual y de datos:** prototipo en `../2026-10-27/2026-10-27/h/outputs/` (`index.html`, `app.js`, `styles.css`). Se copian textos, datos, marcado y estilos; el código se reescribe.

## Global Constraints

- Sin dependencias npm, sin framework, sin paso de build. `package.json` solo con `"type": "module"` y `"scripts": {"test": "node --test"}`.
- Archivos de código ≤ 200 líneas; `src/core/*` y `src/services/*` ≤ 150; funciones < 20 líneas. Tests y archivos de datos semilla sin límite.
- Sin `console.log`, sin código comentado, sin números mágicos (constantes con nombre), sin `catch` vacío.
- Errores tipados de `src/core/errors.js`; ningún servicio devuelve `null` para señalar fallo.
- `src/core/*` no toca DOM, `localStorage`, `Date.now()` ni `Math.random()`: reloj y aleatoriedad se inyectan.
- Todo texto de datos se interpola en HTML mediante la plantilla `html` (escapa por defecto).
- Marca **OmniMelody**, idioma español (Perú), moneda `S/`, fuentes DM Sans + Manrope, estética del prototipo.
- IGV 18 % incluido en los precios mostrados; se desglosa en el resumen.
- Persistencia bajo el prefijo `omnimelody:v1:`.
- Prioridad: flujo del cliente (Tareas 1–20) antes que admin (21–24) y extras (25–26). Respetar las líneas de corte.
- Git: Conventional Commits, commit por tarea en la rama `feat/frontend`; **todo `git push` se confirma antes con el autor**.
- Diseño adaptable (≥ 360 px de ancho sin scroll horizontal) y compatible con Chrome, Edge, Firefox y Safari.

## Review Focus

1. **Datos del navegador corruptos o inaccesibles** (JSON inválido en `localStorage`, modo privado, cuota llena): la app no queda en blanco; muestra una pantalla de recuperación con "Restablecer datos de demo" o sigue en memoria avisando. → pruebas en Tarea 2 y verificación manual en Tarea 4.
2. **Texto del usuario con HTML** (`<img onerror=…>` en una reseña, nombre o dirección): se muestra literal, nunca se ejecuta. → pruebas de `html` en Tarea 4 y de reseñas en Tarea 19.
3. **Stock o precio que cambian entre agregar al carrito y pagar** (otra pestaña, el admin deshabilita el producto o baja el stock): `placeOrder` rechaza con un mensaje claro y no deja pedido, pago ni stock a medias; el carrito guarda solo `idProducto` + `cantidad` y siempre recalcula con precios vigentes. → pruebas en Tareas 10 y 14.
4. **Pago rechazado o doble clic en "Pagar"**: el rechazo no crea pedido ni toca stock ni carrito; un segundo envío mientras el primero procesa no crea un pedido duplicado. → pruebas en Tarea 14 y bloqueo del botón en Tarea 15.
5. **Cantidades raras en el carrito** (0, negativas, decimales, texto, más que el stock, más de 1 en un digital): se rechazan o ajustan con un mensaje, nunca producen totales `NaN` o negativos. → pruebas en Tarea 10.

---

## Modelo de entidades (contrato compartido)

Las entidades replican el modelo de datos del documento con nombres en camelCase español. Todas tienen `id` numérico autoincremental por colección. Fechas en ISO 8601 (`string`).

| Colección | Campos |
|---|---|
| `usuarios` | `id, rol ('CLIENTE'\|'ADMIN'), nombres, apellidos, dni, email, usuario, contrasenaHash, sal, telefono, estado ('A'\|'I'), fechaRegistro, ultimoAcceso` |
| `direcciones` | `id, idUsuario, alias, direccion, distrito, provincia, departamento, referencia, telefono, predeterminada (bool)` |
| `categorias` | `id, idCategoriaPadre (number\|null), nombre, descripcion, estado` |
| `marcas` | `id, nombre, estado` |
| `productos` | `id, idCategoria, idMarca, nombre, descripcion, tipoProducto ('FISICO'\|'DIGITAL'\|'AUDIOVISUAL'), precio, precioAnterior?, estado ('A'\|'I'), imagenes [{url, credito, enlace}], visual, tono, etiqueta, tipoInstrumento?, familia?, fechaCreacion`; DIGITAL añade `formato, numeroPaginas, urlArchivo`; AUDIOVISUAL añade `videoId, videoTitulo, capitulos [string], duracionMin, urlArchivo` |
| `inventario` | `id, idProducto, stock, stockMinimo, fechaActualizacion` (solo FISICO) |
| `alertasStock` | `id, idProducto, stockActual, stockMinimo, fechaAlerta, estado ('PENDIENTE'\|'ATENDIDA')` |
| `carritos` | `id, idUsuario (number\|'invitado'), items [{idProducto, cantidad}]` |
| `pedidos` | `id, idUsuario, idDireccion (number\|null), fechaPedido, subtotal, igv, costoEnvio, total, estado ('PENDIENTE_PAGO'\|'PAGADO'), tipoEnvio ('DOMICILIO'\|'DIGITAL'), metodoPago` |
| `detallesPedido` | `id, idPedido, idProducto, nombre, tipoProducto, cantidad, precioUnitario, subtotal` |
| `pagos` | `id, idPedido, metodoPago ('TARJETA'\|'TRANSFERENCIA'\|'BILLETERA'), monto, fechaPago, estado ('APROBADO'\|'PENDIENTE'), idTransaccion, respuesta` |
| `comprobantes` | `id, idPedido, tipo ('BOLETA'\|'FACTURA'), serie, numero, fechaEmision, monto, documentoCliente, razonSocial (string\|null)` |
| `envios` | `id, idPedido, empresa, codigoSeguimiento (string\|null), estado ('PROCESANDO'\|'ENVIADO'\|'ENTREGADO'), fechaEnvio, fechaEntrega` |
| `seguimientosEnvio` | `id, idEnvio, estado, descripcion, fechaRegistro` |
| `descargas` | `id, idDetalle, idUsuario, fechaDescarga, dispositivo` |
| `resenas` | `id, idUsuario, idProducto, idPedido, calificacion (1–5), comentario, fechaResena` |
| `tokensRecuperacion` | `id, idUsuario, token, fechaSolicitud, fechaExpiracion, usado (bool)` |
| `buzon` | `id, idUsuario, asunto, cuerpo, enlace (hash route\|null), fecha, leido (bool)` |
| `preferencias` | `id, idUsuario (number\|'invitado'), favoritos [idProducto], comparar [idProducto], progreso {idProducto: [índiceCapítulo]}` |

## Estructura de archivos

```
omnimelody/
  index.html                 shell: header, <main id="app">, footer, cart drawer, modal, toast
  .nojekyll
  package.json
  README.md                  qué es, cómo correr pruebas, guion de demo, cuentas, limitaciones
  assets/css/                base.css, layout.css, catalog.css, product.css, cart.css,
                             forms.css, account.css, learn.css, admin.css (portados del prototipo)
  assets/files/              PDFs de muestra de productos digitales/audiovisuales
  src/
    main.js                  arranque: storage → container → seed → router
    core/                    errors, money, totals, shipping, peru-departments, catalog-filter,
                             cart-rules, validators, payment-gateway, receipt-number,
                             shipment-state, kpis, sales-report, recommender, routes-match
    infra/                   crypto.js, storage.js (local/memory), store.js, collection.js
    data/                    seed-catalog.js, seed-courses.js, seed-users.js, seeder.js
    services/                container.js + un archivo por servicio (ver tareas)
    ui/                      html.js, dom.js, router.js, toast.js, modal.js, error-view.js,
                             layout/ (header, footer, cart-drawer), components/, views/, views/account/, views/admin/
  tests/
    helpers/test-container.js
    core/ infra/ services/ ui/   *.test.js
```

---

## Fase A — Base

### Task 1: Esqueleto del repo, errores y dinero

**Files:**
- Create: `package.json`, `.nojekyll`, `.gitignore` (`node_modules/`, `.DS_Store`)
- Create: `src/core/errors.js`, `src/core/money.js`
- Test: `tests/core/errors.test.js`, `tests/core/money.test.js`

**Interfaces:**
- Produces: clases `AppError` (base, `code`), `ValidationError(message, fields = {})`, `NotFoundError`, `AuthError`, `ForbiddenError`, `ConflictError`, `PaymentDeclinedError(message, reason)`, `StorageCorruptedError`; todas extienden `AppError` y tienen `name` igual al de la clase.
- Produces: `IGV_RATE = 0.18`, `toCents(amount: number): number`, `fromCents(cents: number): number`, `formatMoney(amount: number): string`.

- [ ] **Step 1: Crear la rama de trabajo** — `git checkout -b feat/frontend` desde `docs/diseno-frontend`.
- [ ] **Step 2: Escribir pruebas que fallan**

```js
test('ValidationError lleva campos y es AppError', () => {
  const e = new ValidationError('Datos inválidos', { dni: 'Debe tener 8 dígitos' });
  assert.ok(e instanceof AppError); assert.equal(e.name, 'ValidationError');
  assert.deepEqual(e.fields, { dni: 'Debe tener 8 dígitos' });
});
test('formatMoney usa S/ y separador de miles', () => {
  assert.equal(formatMoney(1299), 'S/ 1,299.00');
  assert.equal(formatMoney(0), 'S/ 0.00');
  assert.equal(formatMoney(24.5), 'S/ 24.50');
});
test('toCents redondea al céntimo', () => { assert.equal(toCents(447.455), 44746); assert.equal(fromCents(44746), 447.46); });
test('toCents rechaza valores no finitos', () => { assert.throws(() => toCents(NaN), ValidationError); });
```

- [ ] **Step 3: Ejecutar** `npm test` → FAIL (módulos inexistentes).
- [ ] **Step 4: Implementar** `errors.js` y `money.js`. `formatMoney` = `'S/ ' + Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})`.
- [ ] **Step 5: Ejecutar** `npm test` → PASS.
- [ ] **Step 6: Commit** `chore: inicializar proyecto con errores tipados y utilidades de dinero`

### Task 2: Almacenamiento, store transaccional y colecciones

**Files:**
- Create: `src/infra/storage.js`, `src/infra/store.js`, `src/infra/collection.js`
- Test: `tests/infra/store.test.js`, `tests/infra/collection.test.js`

**Interfaces:**
- Produces: `createMemoryStorage(): Storage` (getItem/setItem/removeItem/key/length/clear), `resolveBrowserStorage(win): {storage, persistent: boolean}` (devuelve memoria con `persistent: false` si `localStorage` lanza al probar escritura).
- Produces: `STORAGE_PREFIX = 'omnimelody:v1:'`; `createStore(storage)` → `{ read(key, fallback), write(key, value), clearAll(), transact(fn: () => Promise<T>): Promise<T> }`. `read` lanza `StorageCorruptedError` si el JSON es inválido. `transact` guarda un snapshot de todas las claves del prefijo y lo restaura si `fn` lanza; las transacciones no se anidan (una llamada anidada se ejecuta dentro de la externa).
- Produces: `createCollection(store, name)` → `{ findAll(): Promise<T[]>, findById(id): Promise<T>` (lanza `NotFoundError`), `findBy(predicate): Promise<T[]>, findOneBy(predicate): Promise<T|undefined>, insert(entity): Promise<T>` (asigna `id` con la secuencia `seq:<name>`), `update(id, patch): Promise<T>, remove(id): Promise<void> }`. Devuelve copias (`structuredClone`), nunca referencias internas.

- [ ] **Step 1: Pruebas que fallan**

```js
test('read lanza StorageCorruptedError con JSON inválido', () => {
  const s = createMemoryStorage(); s.setItem('omnimelody:v1:productos', '{roto');
  assert.throws(() => createStore(s).read('productos', []), StorageCorruptedError);
});
test('transact revierte todo si falla', async () => {
  const store = createStore(createMemoryStorage()); store.write('a', 1);
  await assert.rejects(store.transact(async () => { store.write('a', 2); store.write('b', 3); throw new ConflictError('x'); }));
  assert.equal(store.read('a'), 1); assert.equal(store.read('b', null), null);
});
test('clearAll solo borra claves del prefijo', () => { /* otra clave 'ajena' sobrevive */ });
test('resolveBrowserStorage cae a memoria si localStorage lanza', () => {
  const win = { get localStorage() { throw new Error('SecurityError'); } };
  assert.equal(resolveBrowserStorage(win).persistent, false);
});
test('insert asigna ids consecutivos por colección', async () => { /* 1, 2; otra colección empieza en 1 */ });
test('findById de id inexistente lanza NotFoundError', async () => { /* … */ });
test('los objetos devueltos no mutan el almacenamiento', async () => { /* modificar el resultado y releer */ });
```

- [ ] **Step 2: Ejecutar** `npm test` → FAIL.
- [ ] **Step 3: Implementar** los tres módulos.
- [ ] **Step 4: Ejecutar** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: agregar almacenamiento local transaccional y colecciones`

### Task 3: Criptografía, datos semilla y sembrado

**Files:**
- Create: `src/infra/crypto.js`, `src/data/seed-catalog.js`, `src/data/seed-courses.js`, `src/data/seed-users.js`, `src/data/seeder.js`
- Create: `assets/files/*.pdf` (un PDF de 1 página por producto DIGITAL/AUDIOVISUAL; PDF 1.4 mínimo escrito a mano en ASCII con el título del producto)
- Test: `tests/infra/crypto.test.js`, `tests/data/seeder.test.js`

**Interfaces:**
- Produces: `hashPassword(password: string, sal: string): Promise<string>` (SHA-256 hex de `sal + ':' + password` vía `globalThis.crypto.subtle`), `randomHex(bytes: number, random): string` donde `random` es `(n) => Uint8Array`.
- Produces: `SEED_VERSION = 1`; `seedCatalog = {categorias, marcas, productos, inventario}`; `seedCourses` (productos AUDIOVISUAL); `DEMO_ACCOUNTS = { cliente: {usuario: 'cliente.demo', contrasena: 'Demo2026!'}, admin: {usuario: 'admin', contrasena: 'Admin2026!'} }`.
- Produces: `ensureSeeded(store, collections, deps, { withDemoHistory = true } = {}): Promise<void>` — si `meta.seedVersion !== SEED_VERSION`, borra y carga catálogo + usuarios (con contraseñas hasheadas) y crea `alertasStock` PENDIENTE para cada inventario semilla con `stock ≤ stockMinimo` (bajo, micrófono, ukelele). El historial del cliente demo se agrega en la Tarea 17 (`seedDemoHistory`) y solo corre con `withDemoHistory`.

Datos semilla:
- Categorías (padre → hijas): Cuerdas → Guitarras, Bajos, Ukeleles; Teclados; Percusión; Vientos; Audio; Partituras y documentos → Partituras, Guías y métodos; Material audiovisual → Cursos.
- Productos: los 15 de `app.js` del prototipo (mismos nombres, precios, marcas, imágenes, créditos, `tipoInstrumento`, `familia`, `visual`, `tono`, `etiqueta`, descripciones). `Físico` → `FISICO`; `Digital` → `DIGITAL`, salvo el id 14 (curso de teclado) → `AUDIOVISUAL`. Stock = el del prototipo; `stockMinimo = 3` para todos los físicos.
- Cursos: los 6 `resources` del prototipo pasan a productos `AUDIOVISUAL` (categoría Cursos, marca "OmniMelody Aula") con su `videoId`, `videoTitulo`, `capitulos`, precio entre S/ 19 y S/ 49 a elección del constructor.
- Usuarios: el administrador y el cliente demo de `DEMO_ACCOUNTS`, con DNI, correo y nombre ficticios.

- [ ] **Step 1: Pruebas que fallan**

```js
test('hashPassword es determinista y depende de la sal', async () => {
  assert.equal(await hashPassword('Demo2026!', 'ab'), await hashPassword('Demo2026!', 'ab'));
  assert.notEqual(await hashPassword('Demo2026!', 'ab'), await hashPassword('Demo2026!', 'cd'));
});
test('ensureSeeded carga 21 productos y no guarda contraseñas en claro', async () => {
  /* productos.length === 21; ningún usuario tiene propiedad 'contrasena'; admin.rol === 'ADMIN' */
});
test('ensureSeeded no vuelve a sembrar si la versión coincide', async () => { /* modificar un producto, sembrar otra vez, el cambio persiste */ });
test('todo producto FISICO tiene inventario y todo DIGITAL/AUDIOVISUAL tiene urlArchivo existente', async () => {
  /* para urlArchivo comprobar fs.existsSync(path.join(root, url)) */
});
```

- [ ] **Step 2: Ejecutar** `npm test` → FAIL.
- [ ] **Step 3: Implementar** crypto, archivos de semilla, PDFs y `ensureSeeded`.
- [ ] **Step 4: Ejecutar** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: agregar datos semilla del catálogo y cuentas demo`

### Task 4: Shell de la UI, router, plantillas y contenedor

**Files:**
- Create: `index.html`, `assets/css/base.css`, `assets/css/layout.css` (portados del prototipo: tokens, header, footer, botones, modal, toast, overlay)
- Create: `src/core/routes-match.js`, `src/ui/html.js`, `src/ui/dom.js`, `src/ui/router.js`, `src/ui/toast.js`, `src/ui/modal.js`, `src/ui/error-view.js`, `src/ui/layout/header.js`, `src/ui/layout/footer.js`, `src/ui/views/not-found.js`, `src/ui/views/recovery.js`
- Create: `src/services/container.js`, `src/main.js`, `tests/helpers/test-container.js`
- Test: `tests/core/routes-match.test.js`, `tests/ui/html.test.js`

**Interfaces:**
- Produces: `matchRoute(routes: {pattern, access}[], hash: string) → {route, params, query} | {route: NOT_FOUND}`; patrones tipo `'/producto/:id'`; `query` de `#/catalogo?q=guitarra&cat=2`.
- Produces: `resolveAccess(access: 'public'|'auth'|'admin', user) → 'allow'|'login'|'forbidden'`.
- Produces: `html` (tagged template; escapa `& < > " '`; aplana arrays; respeta valores `raw(str)`), `raw(str)`.
- Produces: contrato de vista: `export default { title: string, access: 'public'|'auth'|'admin', render(ctx): Promise<SafeHtml>, mount?(root, ctx): void }`, con `ctx = { services, params, query, user, navigate(hash), refresh(), toast(msg) }`.
- Produces: `createContainer({ storage, now: () => Date, random: (n) => Uint8Array, wait: (ms) => Promise }) → { store, collections, services }`. Cada tarea siguiente registra su servicio en `container.js`.
- Produces: `createTestContainer({ withDemoHistory = false, ...overrides } = {})` → contenedor con memoria, reloj fijo `2026-11-02T10:00:00-05:00` (avanzable con `advance(ms)`), aleatoriedad determinista y `wait` instantáneo, ya sembrado. Sin historial por defecto, para que los stocks semilla del prototipo sean los que esperan las pruebas.
- Produces: `showError(error, ctx)`: `ValidationError` → mensajes por campo + toast; `AuthError` → toast; `ForbiddenError` → vista "Acceso restringido"; `NotFoundError` → `not-found`; `PaymentDeclinedError` → toast con motivo; otros → mensaje genérico "Ocurrió un problema. Intenta otra vez." sin detalles técnicos.

Arranque en `main.js`: `resolveBrowserStorage(window)` → si `persistent === false`, toast "Tus datos no se guardarán al cerrar el navegador". `ensureSeeded`, y si lanza `StorageCorruptedError` se renderiza `recovery` con el botón "Restablecer datos de demo" (`store.clearAll()` + recarga).

- [ ] **Step 1: Pruebas que fallan**

```js
test('matchRoute extrae params y query', () => {
  const r = matchRoute(ROUTES, '#/producto/7?ref=home');
  assert.equal(r.route.pattern, '/producto/:id'); assert.deepEqual(r.params, { id: '7' }); assert.equal(r.query.get('ref'), 'home');
});
test('hash vacío o "#" va a inicio; ruta desconocida a NOT_FOUND', () => { /* … */ });
test('resolveAccess', () => {
  assert.equal(resolveAccess('auth', null), 'login');
  assert.equal(resolveAccess('admin', { rol: 'CLIENTE' }), 'forbidden');
  assert.equal(resolveAccess('admin', { rol: 'ADMIN' }), 'allow');
});
test('html escapa interpolaciones', () => {
  assert.equal(String(html`<p>${'<img src=x onerror=alert(1)>'}</p>`), '<p>&lt;img src=x onerror=alert(1)&gt;</p>');
});
test('html no re-escapa plantillas anidadas ni raw', () => {
  assert.equal(String(html`<ul>${['a', 'b'].map(x => html`<li>${x}</li>`)}</ul>`), '<ul><li>a</li><li>b</li></ul>');
});
```

- [ ] **Step 2: Ejecutar** `npm test` → FAIL.
- [ ] **Step 3: Implementar** los módulos. La tabla de rutas vive en `src/ui/routes.js` y crece con cada tarea; en esta tarea solo `'/'` (vista temporal con el hero del prototipo) y `NOT_FOUND`.
- [ ] **Step 4: Ejecutar** `npm test` → PASS.
- [ ] **Step 5: Verificación manual** — `npx --yes http-server -p 8080 -c-1` (o `python -m http.server 8080`) y abrir `http://localhost:8080`: hero visible, sin errores en consola; en DevTools escribir `{roto` en `omnimelody:v1:meta` y recargar → aparece la pantalla de recuperación y el botón la resuelve.
- [ ] **Step 6: Commit** `feat: agregar shell de la app, router por hash y contenedor`

---

## Fase B — Flujo del cliente (imprescindible)

### Task 5: Catálogo — lógica y servicio

**Files:**
- Create: `src/core/catalog-filter.js`, `src/services/catalog-service.js`
- Test: `tests/core/catalog-filter.test.js`, `tests/services/catalog-service.test.js`

**Interfaces:**
- Produces: `filterProducts(products, criteria) → Product[]` con `criteria = { texto?, idCategoria?, idMarca?, precioMax?, disponibilidad?: 'todos'|'en-stock'|'agotado', tipoInstrumento?, familia?, tipoProducto? }`; `idCategoria` incluye subcategorías (recibe `categorias` como 3.er argumento). Búsqueda de texto sin distinguir mayúsculas ni tildes, sobre nombre, nombre de categoría y nombre de marca.
- Produces: `sortProducts(products, orden: 'destacados'|'precio-asc'|'precio-desc'|'nombre') → Product[]`.
- Produces: `catalogService.listProducts(criteria & {orden}) → Promise<ProductView[]>` (solo `estado === 'A'`; `ProductView` = producto + `stock` (∞ como `null` para digitales), `marca`, `categoria`, `calificacionPromedio`, `totalResenas`), `getProduct(id) → Promise<ProductView>` (lanza `NotFoundError` si no existe o está inactivo), `listCategories() → Promise<CategoryTree[]>`, `listBrands()`.

- [ ] **Step 1: Pruebas que fallan**

```js
test('busca sin tildes ni mayúsculas', () => { assert.deepEqual(names(filterProducts(P, { texto: 'cajon' }, C)), ['Cajón peruano Raíces']); });
test('busca por marca', () => { /* 'yamaha' → bajo y flauta */ });
test('filtrar por categoría padre incluye hijas', () => { /* Cuerdas → guitarras, bajo, ukelele */ });
test('disponibilidad agotado', () => { /* solo el ukelele (stock 0) */ });
test('digitales nunca cuentan como agotados', () => { /* … */ });
test('precio-asc ordena de menor a mayor', () => { /* … */ });
test('listProducts excluye inactivos y getProduct de inactivo lanza NotFoundError', async () => { /* … */ });
```

- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Commit** `feat: agregar filtros, búsqueda y servicio de catálogo`

### Task 6: Vistas de inicio y catálogo (RF-06, RF-07, RF-08, RF-09, RF-10)

**Files:**
- Create: `assets/css/catalog.css`, `src/ui/components/product-card.js`, `src/ui/components/stars.js`, `src/ui/views/home.js`, `src/ui/views/catalog.js`, `src/ui/views/catalog-filters.js`
- Modify: `src/ui/routes.js` (rutas `'/'`, `'/catalogo'`)

**Interfaces:**
- Consumes: `catalogService` (Task 5).
- Produces: `productCard(productView, { esFavorito, enComparacion }) → SafeHtml` con botones `data-add`, `data-wish`, `data-compare`; `stars(valor: number) → SafeHtml`.

Comportamiento: inicio = hero, tira de categorías y destacados del prototipo. Catálogo en tres bloques con sus encabezados: **Instrumentos** (FISICO), **Partituras y documentos** (DIGITAL), **Material audiovisual** (AUDIOVISUAL). Filtros del prototipo más **marca**. Los filtros se reflejan en la query del hash (`#/catalogo?q=…&marca=…`) para que atrás/adelante funcione. Créditos de fotos del prototipo al pie. Si una imagen falla (`onerror`), se reemplaza por el `visual` del producto. Estado vacío del prototipo.

- [ ] **Step 1: Implementar** las vistas portando marcado y estilos del prototipo.
- [ ] **Step 2: Verificación manual** — buscar "yamaha" (2 resultados), filtrar Cuerdas, precio máx. S/ 300, "Agotados" (solo el ukelele); recargar con la URL filtrada conserva filtros; ancho 360 px sin scroll horizontal.
- [ ] **Step 3: Commit** `feat: agregar vistas de inicio y catálogo con filtros`

### Task 7: Ficha de producto (RF-11)

**Files:**
- Create: `assets/css/product.css`, `src/ui/views/product-detail.js`
- Modify: `src/ui/routes.js` (`'/producto/:id'`)

**Interfaces:**
- Consumes: `catalogService.getProduct` (Task 5); `stars` (Task 6). El bloque de reseñas se agrega en la Tarea 19.

Comportamiento: galería (imagen principal + miniaturas cuando hay varias), crédito de foto, marca, categoría, precio y precio anterior, stock ("Quedan 3", "Agotado", "Descarga digital"), descripción, botón "Agregar al carrito" deshabilitado si está agotado. Los AUDIOVISUAL muestran el temario. Un id inexistente muestra `not-found`.

- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Verificación manual** — `#/producto/1`, `#/producto/4` (agotado, botón deshabilitado), `#/producto/999` (no encontrado).
- [ ] **Step 3: Commit** `feat: agregar ficha de producto`

### Task 8: Autenticación — validaciones y servicio (RF-01, RF-02)

**Files:**
- Create: `src/core/validators.js`, `src/services/auth-service.js`
- Test: `tests/core/validators.test.js`, `tests/services/auth-service.test.js`

**Interfaces:**
- Produces: `validateRegistration(data) → data normalizado` (lanza `ValidationError` con `fields`): `nombres`, `apellidos` 2–100 caracteres; `dni` `/^\d{8}$/`; `email` `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`, en minúsculas; `usuario` `/^[a-zA-Z0-9._]{4,20}$/`; `contrasena` ≥ 8 caracteres con al menos una letra y un número; `confirmacion === contrasena`. Constantes `MIN_PASSWORD_LENGTH = 8`, etc.
- Produces: `authService.register(data) → Promise<User>` (lanza `ConflictError` si el DNI, el correo o el usuario ya existen, indicando cuál); `login(identificador, contrasena) → Promise<User>` (acepta usuario o correo; credenciales incorrectas → `AuthError('Usuario o contraseña incorrectos')`; estado `'I'` → `AuthError('Tu cuenta está desactivada')`; actualiza `ultimoAcceso`); `logout()`; `currentUser() → Promise<User|null>`. La sesión se guarda en la clave `sesion` del store. `User` nunca expone `contrasenaHash` ni `sal`.
- Produces: evento `onSessionChange(callback)` para que el header y el carrito reaccionen.

- [ ] **Step 1: Pruebas que fallan**

```js
test('dni con 7 dígitos falla en el campo dni', () => {
  const e = assert.throws(() => validateRegistration({ ...VALID, dni: '1234567' }), ValidationError);
});
test('confirmación distinta falla en confirmacion', () => { /* fields.confirmacion */ });
test('register + login con usuario y con correo', async () => { /* ambos devuelven el mismo id */ });
test('register con correo repetido lanza ConflictError', async () => { /* … */ });
test('login con contraseña errada lanza AuthError genérico', async () => { /* mensaje exacto */ });
test('usuario devuelto no expone hash ni sal', async () => { /* … */ });
test('logout deja currentUser en null', async () => { /* … */ });
```

- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Commit** `feat: agregar registro e inicio de sesión`

### Task 9: Vistas de login, registro y menú de cuenta

**Files:**
- Create: `assets/css/forms.css`, `src/ui/views/login.js`, `src/ui/views/register.js`, `src/ui/components/form-errors.js`
- Modify: `src/ui/layout/header.js` (menú: "Ingresar" o nombre + Mi cuenta / Mis pedidos / Mis descargas / Buzón / Administración (solo admin) / Salir), `src/ui/routes.js` (`'/login'`, `'/registro'`)

**Interfaces:**
- Consumes: `authService` (Task 8), `showError` (Task 4).
- Produces: `bindFormErrors(form, validationError)` pinta el mensaje bajo cada campo; `readForm(form) → object`.

Comportamiento: la pantalla de login muestra un recuadro "Cuentas de demostración" con las dos cuentas de `DEMO_ACCOUNTS`. Tras iniciar sesión se vuelve a la ruta pedida (`#/login?volver=/checkout`). El registro inicia sesión automáticamente. Las rutas `auth` sin sesión redirigen a login con `volver`.

- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Verificación manual** — registro con DNI inválido (error bajo el campo), registro válido, salir, entrar con correo, entrar con contraseña errada; entrar a `#/cuenta/pedidos` sin sesión redirige a login y vuelve después.
- [ ] **Step 3: Commit** `feat: agregar vistas de login, registro y menú de cuenta`

### Task 10: Carrito — reglas, totales, envío y servicio (RF-12 a RF-15, RF-17)

**Files:**
- Create: `src/core/cart-rules.js`, `src/core/totals.js`, `src/core/shipping.js`, `src/core/peru-departments.js`, `src/services/cart-service.js`
- Test: `tests/core/cart-rules.test.js`, `tests/core/totals.test.js`, `tests/core/shipping.test.js`, `tests/services/cart-service.test.js`

**Interfaces:**
- Produces: `MAX_DIGITAL_QTY = 1`; `addItem(items, product, stock, cantidad = 1)`, `setQuantity(items, product, stock, cantidad)`, `removeItem(items, idProducto)` → nuevo arreglo `[{idProducto, cantidad}]`. Cantidad no entera o < 1 → `ValidationError`; más que el stock → `ConflictError('Solo quedan N unidades')`; digital > 1 → se mantiene en 1 con `ConflictError('Los productos digitales se compran una sola vez')`; agotado o inactivo → `ConflictError`.
- Produces: `computeTotals(lines: {precioUnitario, cantidad}[], costoEnvio) → {subtotal, igv, costoEnvio, total, totalProductos}` en soles, calculado en céntimos: `totalProductos` = suma de precios con IGV; `subtotal` = `round(totalProductos / 1.18)`; `igv = totalProductos - subtotal`; `total = totalProductos + costoEnvio`.
- Produces: `SHIPPING_RATES = { LIMA_CALLAO: 15, PROVINCIA: 25 }`; `shippingCost(lines con tipoProducto, departamento|null) → number` (0 si no hay FISICO; si hay FISICO sin departamento → `ValidationError`); `PERU_DEPARTMENTS` (los 24 departamentos + Callao).
- Produces: `cartService.getCart() → Promise<CartView>` con `CartView = { lines: [{producto: ProductView, cantidad, precioUnitario, subtotalLinea, problema: string|null}], tieneFisicos, cantidadTotal }` recalculado con precios y stock vigentes (`problema` = "Ya no está disponible" / "Solo quedan N"); `add(idProducto, cantidad?)`, `setQuantity(idProducto, cantidad)`, `remove(idProducto)`, `clear()`, `totals(departamento|null) → Promise<Totals>`. Carrito del invitado bajo `idUsuario: 'invitado'`; al iniciar sesión se fusiona con el del usuario (cantidades sumadas y recortadas al stock) y se vacía el del invitado.

- [ ] **Step 1: Pruebas que fallan**

```js
test('IGV incluido: 489 + 39', () => {
  assert.deepEqual(computeTotals([{ precioUnitario: 489, cantidad: 1 }, { precioUnitario: 39, cantidad: 1 }], 15),
    { totalProductos: 528, subtotal: 447.46, igv: 80.54, costoEnvio: 15, total: 543 });
});
test('carrito vacío da ceros', () => { /* todos 0 */ });
test('envío: Lima 15, Cusco 25, solo digitales 0', () => { /* … */ });
test('envío con físicos sin departamento lanza ValidationError', () => { /* … */ });
test('setQuantity rechaza 0, -1, 1.5 y "dos"', () => { /* ValidationError cada uno */ });
test('setQuantity por encima del stock lanza ConflictError con el stock en el mensaje', () => { /* "Solo quedan 3 unidades" */ });
test('digital no supera 1', () => { /* … */ });
test('getCart usa el precio vigente aunque cambie después de agregar', async () => { /* cambiar precio en productos, getCart refleja el nuevo */ });
test('getCart marca problema si el producto se deshabilitó', async () => { /* problema === 'Ya no está disponible' */ });
test('al iniciar sesión se fusiona el carrito del invitado', async () => { /* … */ });
```

- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Commit** `feat: agregar reglas de carrito, totales con IGV y costo de envío`

### Task 11: Cajón del carrito

**Files:**
- Create: `assets/css/cart.css`, `src/ui/layout/cart-drawer.js`
- Modify: `src/ui/layout/header.js` (contador), `src/ui/components/product-card.js` y `src/ui/views/product-detail.js` (los botones `data-add` llaman a `cartService.add`)

**Interfaces:**
- Consumes: `cartService` (Task 10).

Comportamiento: el cajón lateral del prototipo con +/−, quitar, "Vaciar carrito" (con confirmación), avisos de `problema` por línea, total de productos y la nota "Envío e impuestos se calculan al continuar". "Continuar con la compra" lleva a `#/checkout` (pide login si no hay sesión). Los botones ± se deshabilitan en el límite.

- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Verificación manual** — agregar guitarra ×3, intentar una 8.ª unidad (mensaje "Solo quedan 7"), digital ×2 (mensaje), vaciar; recargar conserva el carrito.
- [ ] **Step 3: Commit** `feat: agregar cajón del carrito`

### Task 12: Direcciones de envío (RF-16)

**Files:**
- Create: `src/services/address-service.js`
- Modify: `src/core/validators.js` (`validateAddress`)
- Test: `tests/services/address-service.test.js`, `tests/core/validators.test.js`

**Interfaces:**
- Produces: `validateAddress(data)`: `alias` 2–30, `direccion` 5–150, `distrito`, `provincia` obligatorios, `departamento` ∈ `PERU_DEPARTMENTS`, `telefono` `/^9\d{8}$/`, `referencia` opcional ≤ 100.
- Produces: `addressService.list() → Promise<Address[]>` (la predeterminada primero), `add(data)` (la primera queda como predeterminada), `update(id, data)`, `remove(id)` (si era predeterminada, pasa a la siguiente), `setDefault(id)`. Todas operan solo sobre direcciones del usuario en sesión; una ajena → `NotFoundError`; sin sesión → `AuthError`.

- [ ] **Step 1: Pruebas que fallan** — primera dirección predeterminada; `setDefault` deja exactamente una; borrar la predeterminada promueve otra; dirección de otro usuario → `NotFoundError`; teléfono `'12345'` → `ValidationError`.
- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Commit** `feat: agregar gestión de direcciones de envío`

### Task 13: Pasarela simulada y numeración de comprobantes (RF-18, RF-19, RF-20)

**Files:**
- Create: `src/core/payment-gateway.js`, `src/core/receipt-number.js`
- Modify: `src/core/validators.js` (`validateReceiptData`)
- Test: `tests/core/payment-gateway.test.js`, `tests/core/receipt-number.test.js`

**Interfaces:**
- Produces: `TEST_CARDS` (exportado para mostrarlo en la UI):
  - `'4111111111111111'` → APROBADO
  - `'4000000000000002'` → RECHAZADO "Fondos insuficientes"
  - `'4000000000000069'` → RECHAZADO "Tarjeta vencida"
  - Cualquier otro número válido por Luhn → RECHAZADO "Tarjeta no reconocida por la pasarela de prueba"
- Produces: `WALLET_APPROVAL_CODE = '123456'`; `BANK_ACCOUNT = { banco: 'BCP (simulado)', cuenta: '193-0000000-0-00', cci: '00219300000000000000', titular: 'OmniMelody S.A.C.' }`.
- Produces: `authorizePayment(metodo, detalles, monto, randomHex) → {estado: 'APROBADO'|'RECHAZADO'|'PENDIENTE', idTransaccion, respuesta}`. Valida formato antes de autorizar y lanza `ValidationError` por campo:
  - **TARJETA:** `{numero, titular, vencimiento 'MM/AA' no vencido respecto de now, cvv /^\d{3}$/}`; el número admite espacios.
  - **BILLETERA:** `{proveedor 'YAPE'|'PLIN', celular /^9\d{8}$/, codigoAprobacion /^\d{6}$/}`; código distinto de `123456` → RECHAZADO "Código de aprobación inválido".
  - **TRANSFERENCIA:** `{}` → PENDIENTE.
  - `idTransaccion` = `'TX-' + 12 hex en mayúsculas`.
- Produces: `RECEIPT_SERIES = { BOLETA: 'B001', FACTURA: 'F001' }`; `nextReceiptNumber(tipo, comprobantesExistentes) → {serie, numero}` con `numero` de 8 dígitos con ceros (`'00000001'`), correlativo por tipo.
- Produces: `validateReceiptData({tipo, ruc?, razonSocial?})`: BOLETA usa el DNI del usuario; FACTURA exige `ruc` `/^(10|20)\d{9}$/` y `razonSocial` 3–150.

- [ ] **Step 1: Pruebas que fallan** — cada tarjeta de prueba con su estado y respuesta exactos; `'4111 1111 1111 1111'` con espacios aprueba; número con Luhn inválido → `ValidationError`; vencimiento `'10/26'` con `now` = 2026-11-02 → `ValidationError`; Yape con código `'654321'` → RECHAZADO; transferencia → PENDIENTE; boletas `B001-00000001` y luego `-00000002`, mientras facturas empiezan en `F001-00000001`; RUC `'30123456789'` → `ValidationError`.
- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Commit** `feat: agregar pasarela de pagos simulada y numeración de comprobantes`

### Task 14: Servicio de checkout y cumplimiento del pedido (RF-15 a RF-20, RF-27)

**Files:**
- Create: `src/services/checkout-service.js`, `src/services/order-fulfillment.js`, `src/services/mailbox-service.js`
- Test: `tests/services/checkout-service.test.js`, `tests/services/mailbox-service.test.js`

**Interfaces:**
- Consumes: `cartService`, `addressService`, `authorizePayment`, `computeTotals`, `shippingCost`, `nextReceiptNumber`, `validateReceiptData`, `store.transact`.
- Produces: `PAYMENT_DELAY_MS = 1500` (se aplica con el `wait` inyectado).
- Produces: `checkoutService.placeOrder({ idDireccion?, metodoPago, detallesPago, comprobante: {tipo, ruc?, razonSocial?} }) → Promise<{ pedido, comprobante: Comprobante|null }>`. Pasos:
  1. Exige sesión y valida el carrito. Si está vacío o alguna línea tiene `problema`, lanza `ConflictError` con el detalle.
  2. Si hay físicos, exige una dirección propia y calcula los totales.
  3. Aplica el retardo `wait(PAYMENT_DELAY_MS)` y llama a `authorizePayment`.
  4. Si el pago es RECHAZADO, lanza `PaymentDeclinedError(respuesta)` sin escribir nada.
  5. Dentro de `transact` crea el pedido, sus detalles (con nombre y precio congelados) y el pago, y vacía el carrito.
  6. Si el pago es APROBADO, llama a `fulfillPaidOrder`. Si es PENDIENTE, deja el pedido en `PENDIENTE_PAGO` y envía al buzón el mensaje "Pedido N.º X: realiza tu transferencia" con los datos de `BANK_ACCOUNT`.
  7. Mientras una llamada está en curso, una segunda lanza `ConflictError('Tu pago ya se está procesando')`.
- Produces: `fulfillPaidOrder(pedidoId, deps) → Promise<Comprobante>`. Vuelve a verificar el stock y lo descuenta. Crea una `alertaStock` PENDIENTE cuando el stock queda ≤ `stockMinimo`, salvo que ya exista una pendiente para ese producto. Marca el pedido como `PAGADO` y emite el comprobante. Si hay físicos, crea el envío en PROCESANDO con su primer seguimiento ("Pedido recibido y en preparación"). Envía al buzón "Confirmación de compra — Pedido N.º X" con enlace `#/comprobante/<id>` (RF-21). Lo reutiliza la Tarea 21.
- Produces: `mailboxService.send(idUsuario, {asunto, cuerpo, enlace})`, `list() → Promise<Message[]>` (las más recientes primero, del usuario en sesión), `unreadCount()`, `markRead(id)`.

- [ ] **Step 1: Pruebas que fallan**

```js
test('compra aprobada: pedido PAGADO, stock descontado, comprobante y mensaje en buzón', async () => {
  /* guitarra id 1 (stock 7) ×2 + guía digital, tarjeta 4111…, Lima → pedido.total === 489*2 + 29 + 15;
     inventario stock 5; comprobante B001-00000001; envío PROCESANDO; carrito vacío; 1 mensaje */
});
test('tarjeta rechazada no deja pedido, pago, stock ni carrito modificados', async () => {
  /* await assert.rejects(..., PaymentDeclinedError); conteos iguales a antes */
});
test('stock reducido por el admin entre carrito y pago → ConflictError sin escrituras', async () => { /* … */ });
test('solo digitales: costoEnvio 0, sin envío, no exige dirección', async () => { /* … */ });
test('transferencia: PENDIENTE_PAGO, stock intacto, mensaje con datos bancarios', async () => { /* … */ });
test('dos placeOrder simultáneos crean un solo pedido', async () => {
  /* Promise.allSettled([placeOrder(x), placeOrder(x)]) → 1 fulfilled, 1 rejected ConflictError */
});
test('stock que llega al mínimo crea una sola alerta', async () => { /* bajo de 4 a 3 dos veces → 1 alerta */ });
test('factura sin RUC lanza ValidationError antes de cobrar', async () => { /* … */ });
```

- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Commit** `feat: agregar checkout con pago simulado, stock y comprobante`

### Task 15: Vistas de checkout, confirmación y comprobante

**Files:**
- Create: `src/ui/views/checkout.js`, `src/ui/views/checkout-payment.js`, `src/ui/views/order-confirmation.js`, `src/ui/views/receipt.js`, `assets/css/receipt-print.css` (`@media print` oculta header, footer y botones)
- Modify: `src/ui/routes.js` (`'/checkout'` auth, `'/pedido/:id/confirmacion'` auth, `'/comprobante/:id'` auth)
- Create: `src/services/order-service.js` (con `getMyOrder(id) → Promise<OrderDetail>` y `getReceipt(idComprobante)`, ambos limitados a pedidos del usuario en sesión, o `ForbiddenError` salvo para admin). La Tarea 17 lo amplía.

**Interfaces:**
- Consumes: `checkoutService`, `addressService`, `cartService`, `TEST_CARDS`, `WALLET_APPROVAL_CODE`, `BANK_ACCOUNT`.
- Produces: `OrderDetail = { pedido, detalles, pago, comprobante|null, envio|null, seguimientos[], direccion|null }`.

Comportamiento:
1. **Paso 1 · Entrega:** solo si hay físicos. Lista de direcciones, alta rápida de una nueva y costo de envío actualizado al elegir.
2. **Paso 2 · Pago:** pestañas Tarjeta / Billetera / Transferencia, elección Boleta o Factura y resumen con subtotal, IGV, envío y total. Un recuadro "Datos de prueba" muestra las tarjetas y el código de billetera.
3. **Pagar:** el botón se deshabilita y muestra "Procesando pago…" hasta que hay respuesta. Si se rechaza, el usuario sigue en el paso 2 con el motivo y puede elegir otro método.
4. **Confirmación:** número de pedido, resumen y enlaces a "Ver comprobante", "Mis pedidos" y "Mis descargas" (si compró digitales).
5. **Comprobante:** diseño de boleta o factura electrónica (emisor ficticio OmniMelody S.A.C., RUC 20000000001, serie y número, cliente, ítems, subtotal, IGV, total) con botón "Imprimir / Guardar PDF" (`window.print()`).

- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Verificación manual:**
  - Compra mixta con 4111… → confirmación → comprobante imprimible.
  - Tarjeta 4000…0002 → mensaje "Fondos insuficientes" sin pedido creado.
  - Doble clic rápido en Pagar → un solo pedido.
  - Compra solo digital → no pide dirección.
- [ ] **Step 3: Commit** `feat: agregar flujo de checkout, confirmación y comprobante imprimible`

### Task 16: Buzón simulado (RF-21)

**Files:**
- Create: `src/ui/views/mailbox.js`
- Modify: `src/ui/layout/header.js` (insignia con no leídos), `src/ui/routes.js` (`'/buzon'` auth)

**Interfaces:**
- Consumes: `mailboxService` (Task 14).

Comportamiento: bandeja estilo correo con el aviso "Simulación: en la versión final estos mensajes llegarán a tu correo". Al abrir un mensaje se marca como leído; el enlace navega dentro de la app.

- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Verificación manual** — tras una compra la insignia muestra 1; abrir el mensaje y su enlace al comprobante.
- [ ] **Step 3: Commit** `feat: agregar buzón simulado de notificaciones`

### Task 17: Mis pedidos, seguimiento e historial de demo (RF-05, RF-23)

**Files:**
- Create: `src/core/shipment-state.js`, `src/ui/views/account/orders.js`, `src/ui/views/account/order-detail.js`, `src/ui/components/order-timeline.js`, `src/data/demo-history.js`, `assets/css/account.css`
- Modify: `src/services/order-service.js`, `src/data/seeder.js` (llamar a `seedDemoHistory` al sembrar), `src/ui/routes.js` (`'/cuenta/pedidos'`, `'/cuenta/pedidos/:id'`)
- Test: `tests/core/shipment-state.test.js`, `tests/services/order-service.test.js`, `tests/data/demo-history.test.js`

**Interfaces:**
- Produces: `SHIPMENT_STATES = ['PROCESANDO', 'ENVIADO', 'ENTREGADO']`, `nextShipmentState(estado) → estado` (ENTREGADO → `ConflictError`), `SHIPMENT_DESCRIPTIONS` (texto por estado), `COURIER_NAME = 'Olva Courier (simulado)'`, `trackingCode(randomHex) → 'OM' + 10 dígitos`.
- Produces: `orderService.listMyOrders() → Promise<OrderSummary[]>` (más recientes primero; `OrderSummary = {pedido, cantidadItems, estadoEnvio|null}`), `getMyOrder(id)`, `getReceipt(id)`, y para admin (usado en la Tarea 21) `advanceShipment(idPedido)`: genera el código de seguimiento y la `fechaEnvio` al pasar a ENVIADO, la `fechaEntrega` al pasar a ENTREGADO, añade un seguimiento y avisa al buzón del cliente.
- Produces: `seedDemoHistory(container)` → usa `authService`, `cartService`, `checkoutService` y `advanceShipment` para que `cliente.demo` tenga:
  1. Un pedido entregado de la Guitarra acústica Sienna, que habilita la reseña.
  2. Un pedido pagado con la Guía práctica de guitarra y un curso audiovisual, con descargas disponibles.
  3. Un pedido con la Flauta dulce en estado ENVIADO.

  Al terminar cierra la sesión.

- [ ] **Step 1: Pruebas que fallan** — `nextShipmentState('PROCESANDO') === 'ENVIADO'`; `nextShipmentState('ENTREGADO')` lanza; un cliente no ve pedidos de otro (`ForbiddenError`); `advanceShipment` asigna un código `/^OM\d{10}$/` al pasar a ENVIADO; con `createTestContainer({ withDemoHistory: true })`, `cliente.demo` tiene 3 pedidos y los estados de envío son ENTREGADO y ENVIADO; `advanceShipment` de un cliente → `ForbiddenError`.
- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar** servicio, core y semilla.
- [ ] **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Implementar las vistas:** lista con estado del pago y del envío; detalle con ítems, totales, dirección, comprobante y la línea de tiempo procesando → enviado → entregado con fechas y código de seguimiento.
- [ ] **Step 6: Verificación manual** — entrar como `cliente.demo` y ver los 3 pedidos con sus estados.
- [ ] **Step 7: Commit** `feat: agregar historial de pedidos con seguimiento de envío`

### Task 18: Descargas y acceso a "Aprende" (RF-08, RF-22)

**Files:**
- Create: `src/services/download-service.js`, `src/ui/views/account/downloads.js`, `src/ui/views/learn.js`, `src/ui/views/learn-course.js`, `assets/css/learn.css`
- Modify: `src/ui/routes.js` (`'/cuenta/descargas'` auth, `'/aprende'`, `'/aprende/:id'` públicas)
- Test: `tests/services/download-service.test.js`

**Interfaces:**
- Produces: `downloadService.listMyDownloads() → Promise<{detalle, producto, pedido, descargas: number}[]>` (solo detalles DIGITAL/AUDIOVISUAL de pedidos PAGADO); `registerDownload(idDetalle, dispositivo) → Promise<{url}>` (un detalle ajeno o de un pedido PENDIENTE_PAGO lanza `ForbiddenError`); `hasAccess(idProducto) → Promise<boolean>` (`false` sin sesión).

Comportamiento:
- **"Mis descargas":** botón "Descargar" que registra la descarga y abre `urlArchivo`. Para los cursos, el botón lleva a "Ver curso".
- **"Aprende":** tarjetas de los productos AUDIOVISUAL y DIGITAL con insignia "Comprado" o precio.
- **Vista de curso sin acceso:** descripción, temario y video introductorio de YouTube (con el enlace "Abrir en YouTube" del prototipo) más "Comprar para desbloquear".
- **Vista de curso con acceso:** capítulos marcables (el progreso se guarda en la Tarea 25; hasta entonces son solo lectura) y descarga del material.

- [ ] **Step 1: Pruebas que fallan** — el cliente demo ve 2 descargas; tras `registerDownload` el contador sube a 1; detalle ajeno → `ForbiddenError`; pedido por transferencia pendiente → no aparece y `registerDownload` lanza `ForbiddenError`; `hasAccess` sin sesión → `false`.
- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar el servicio.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Implementar las vistas.**
- [ ] **Step 6: Verificación manual** — el PDF se descarga; un curso no comprado muestra la vista previa y el desbloqueo.
- [ ] **Step 7: Commit** `feat: agregar descargas digitales y biblioteca Aprende con acceso por compra`

### Task 19: Reseñas (RF-24)

**Files:**
- Create: `src/services/review-service.js`, `src/ui/components/review-list.js`, `src/ui/components/review-form.js`
- Modify: `src/ui/views/product-detail.js`, `src/services/catalog-service.js` (`calificacionPromedio`/`totalResenas` reales)
- Test: `tests/services/review-service.test.js`, `tests/ui/review-list.test.js`

**Interfaces:**
- Produces: `REVIEW_LIMITS = { MIN_RATING: 1, MAX_RATING: 5, MIN_COMMENT: 3, MAX_COMMENT: 500 }`; `reviewService.listReviews(idProducto) → Promise<{resena, autor: 'Nombre A.'}[]>`; `canReview(idProducto) → Promise<{puede: boolean, motivo}>`; `addReview(idProducto, {calificacion, comentario}) → Promise<Resena>`.
- Reglas de `addReview`: exige un pedido PAGADO que contenga el producto (si no, `ForbiddenError`); una reseña por usuario y producto (si no, `ConflictError`); calificación entera 1–5 y comentario recortado de 3–500 caracteres (si no, `ValidationError`).
- Produces: `reviewList(items) → SafeHtml`.

- [ ] **Step 1: Pruebas que fallan** — reseñar la guitarra comprada funciona y el promedio se actualiza; reseñar sin compra → `ForbiddenError`; segunda reseña → `ConflictError`; calificación 6 o 2.5 → `ValidationError`; `reviewList` con el comentario `'<script>x</script>'` produce `&lt;script&gt;`.
- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Verificación manual** — reseña desde la ficha de la guitarra con `cliente.demo`; con otro usuario aparece el motivo "Compra este producto para reseñarlo".
- [ ] **Step 6: Commit** `feat: agregar calificaciones y reseñas de productos comprados`

### Task 20: Perfil, contraseña y recuperación (RF-03, RF-04)

**Files:**
- Create: `src/services/profile-service.js`, `src/services/password-reset-service.js`, `src/ui/views/account/profile.js`, `src/ui/views/account/addresses.js`, `src/ui/views/forgot-password.js`, `src/ui/views/reset-password.js`
- Modify: `src/ui/routes.js` (`'/cuenta'`, `'/cuenta/direcciones'` auth; `'/recuperar'`, `'/restablecer/:token'` públicas)
- Test: `tests/services/profile-service.test.js`, `tests/services/password-reset-service.test.js`

**Interfaces:**
- Produces: `profileService.updateProfile({nombres, apellidos, email, telefono})` (con las mismas validaciones del registro y `ConflictError` si el correo es de otro usuario) y `changePassword(actual, nueva, confirmacion)` (una contraseña actual errónea lanza `AuthError`).
- Produces: `RESET_TOKEN_TTL_MS = 30 * 60 * 1000`; `passwordResetService.request(email) → Promise<{ enlaceDemo: string|null }>`. Si el correo existe, crea un token de 32 hex, envía al buzón "Restablece tu contraseña" con enlace `#/restablecer/<token>` y devuelve ese enlace en `enlaceDemo`. Si no existe, no crea nada y devuelve `{ enlaceDemo: null }`. La UI siempre muestra "Si el correo está registrado, recibirás un enlace". `enlaceDemo` es una ayuda solo de la demo, que la API real no devolverá, y se documenta así en el README.
- Produces: `passwordResetService.reset(token, nueva, confirmacion)`. Un token inexistente, usado o vencido lanza `AuthError('El enlace no es válido o ya venció')`. Si es válido, marca el token como usado.

Comportamiento: como el buzón exige sesión, si `enlaceDemo` no es nulo "Recuperar" muestra además el recuadro "Demo: abrir el enlace enviado al correo", que navega a ese enlace.

- [ ] **Step 1: Pruebas que fallan:**
  - Un token válido cambia la contraseña y el login funciona con la nueva.
  - Un token usado dos veces lanza `AuthError`.
  - Un token pasados 31 minutos (`advance`) lanza `AuthError`.
  - `request` con un correo inexistente resuelve `{ enlaceDemo: null }` sin crear tokens.
  - `changePassword` con la contraseña actual errónea lanza `AuthError`.
  - `updateProfile` con el correo de otro usuario lanza `ConflictError`.
- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Implementar vistas** — perfil (datos y cambio de contraseña), direcciones (CRUD con `addressService`) y las pantallas de recuperación.
- [ ] **Step 6: Verificación manual** — recuperar la contraseña de `cliente.demo`, entrar con la nueva y usar "Restablecer datos" para volver a la original.
- [ ] **Step 7: Commit** `feat: agregar perfil, cambio y recuperación de contraseña`

### ✂ Línea de corte 1 — flujo del cliente completo

### Task 20b: README, guion de demo y primera publicación

**Files:**
- Create: `README.md`

Contenido del README:
- Qué es OmniMelody.
- Cómo abrirlo: la URL de GitHub Pages, o en local con `npx --yes http-server`; avisar que hacer doble clic en `index.html` no funciona.
- `npm test`.
- Cuentas demo, tarjetas de prueba y código de billetera.
- Guion de demo del cliente en 10 pasos: inicio → buscar → ficha → carrito → login → checkout → pago rechazado → pago aprobado → comprobante → mis pedidos/descargas → reseña.
- Limitaciones: sin servidor, datos solo en este navegador, correos simulados, seguridad no apta para producción.
- Créditos de las fotos.

Pasos:
- [ ] **Step 1: Escribir el README.**
- [ ] **Step 2: Ejecutar** `npm test` → todo PASS.
- [ ] **Step 3: Commit** `docs: agregar README con guion de demo`
- [ ] **Step 4: Integrar a `main`** — `git checkout main && git merge --no-ff feat/frontend` (en el primer merge, `main` se crea desde `docs/diseno-frontend` si no existe).
- [ ] **Step 5: Pedir confirmación al autor** y luego `git push -u origin main feat/frontend`.
- [ ] **Step 6: Activar Pages** — si `gh` está disponible: `gh api -X POST repos/adrian007mil/UTP-INTEGRADOR-SOFTWARE/pages -f "source[branch]=main" -f "source[path]=/"`. Si no, indicar al autor: Settings → Pages → Deploy from branch → `main` / root.
- [ ] **Step 7: Verificar** que `https://adrian007mil.github.io/UTP-INTEGRADOR-SOFTWARE/` carga, sin errores 404 de módulos (todas las rutas de import son relativas), y recorrer el guion completo.

---

## Fase C — Administración

### Task 21: Acceso admin y gestión de pedidos

**Files:**
- Create: `src/ui/views/admin/admin-layout.js` (submenú), `src/ui/views/admin/orders.js`, `assets/css/admin.css`
- Modify: `src/services/order-service.js` (`listAllOrders(filtro)`, `confirmTransfer(idPedido)`), `src/ui/routes.js` (`'/admin/pedidos'` con acceso admin)
- Test: `tests/services/order-service.test.js`

**Interfaces:**
- Produces: `orderService.listAllOrders({estado?, texto?}) → Promise<(OrderSummary & {cliente})[]>`; `confirmTransfer(idPedido)` → solo pedidos `PENDIENTE_PAGO`: marca el pago APROBADO y llama a `fulfillPaidOrder` (Task 14). Un pedido en otro estado lanza `ConflictError`; sin stock suficiente, `ConflictError` y el pedido queda pendiente. Todas las operaciones admin lanzan `ForbiddenError` si el usuario no es ADMIN.

- [ ] **Step 1: Pruebas que fallan:**
  - `confirmTransfer` descuenta el stock, emite el comprobante y habilita descargas.
  - Confirmar dos veces lanza `ConflictError`.
  - Un cliente que llama `listAllOrders` recibe `ForbiddenError`.
- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Vista** — tabla de pedidos con filtros, botones "Confirmar transferencia" y "Avanzar envío" (`advanceShipment`) y detalle del pedido.
- [ ] **Step 6: Commit** `feat: agregar gestión de pedidos para el administrador`

### Task 22: Productos y categorías (RF-25, RF-26)

**Files:**
- Create: `src/services/admin-product-service.js`, `src/services/admin-category-service.js`, `src/core/product-validators.js`, `src/ui/views/admin/products.js`, `src/ui/views/admin/product-form.js`, `src/ui/views/admin/categories.js`
- Modify: `src/ui/routes.js` (`'/admin/productos'`, `'/admin/productos/nuevo'`, `'/admin/productos/:id'`, `'/admin/categorias'`)
- Test: `tests/core/product-validators.test.js`, `tests/services/admin-product-service.test.js`, `tests/services/admin-category-service.test.js`

**Interfaces:**
- Produces: `validateProduct(data)`:
  - `nombre` 3–150 caracteres; `precio` > 0 con máximo 2 decimales; `tipoProducto` válido; la categoría y la marca deben existir.
  - FISICO: `stock` entero ≥ 0 y `stockMinimo` entero ≥ 0.
  - DIGITAL: `urlArchivo` obligatorio.
  - AUDIOVISUAL: `videoId` `/^[\w-]{11}$/`.
  - Las imágenes son URLs `https://`.
- Produces: `adminProductService.list({incluirInactivos: true})`, `create(data)` (los físicos crean también su inventario), `update(id, data)` (cambiar el stock actualiza el inventario y la alerta), `setActive(id, activo)`, `remove(id)` (si el producto aparece en algún `detallesPedido` lanza `ConflictError('Este producto tiene ventas; deshabilítalo en su lugar')`).
- Produces: `adminCategoryService.list() → CategoryTree[]`, `create({nombre, descripcion, idCategoriaPadre})` (máximo 2 niveles), `update`, `remove(id)` (si tiene productos o subcategorías lanza `ConflictError`).

- [ ] **Step 1: Pruebas que fallan:**
  - Crear un físico con stock 10 lo hace aparecer en el catálogo con ese stock.
  - Deshabilitarlo lo saca de `catalogService.listProducts`.
  - Eliminar la guitarra vendida lanza `ConflictError`.
  - Una subcategoría de una subcategoría lanza `ValidationError`.
  - Borrar una categoría con productos lanza `ConflictError`.
  - Un precio de `-5` o `12.345` lanza `ValidationError`.
- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Vistas** — tabla con búsqueda, estado y stock; formulario con campos según el tipo; árbol de categorías editable.
- [ ] **Step 6: Commit** `feat: agregar administración de productos y categorías`

### Task 23: Dashboard, alertas de stock y reporte CSV (RF-27, RF-28)

**Files:**
- Create: `src/core/kpis.js`, `src/core/sales-report.js`, `src/services/dashboard-service.js`, `src/ui/views/admin/dashboard.js`
- Modify: `src/ui/routes.js` (`'/admin'`)
- Test: `tests/core/kpis.test.js`, `tests/core/sales-report.test.js`, `tests/services/dashboard-service.test.js`

**Interfaces:**
- Produces: `computeKpis({pedidos, envios, productos, inventario}, {desde, hasta}) → { ventasPeriodo, pedidosPagados, ticketPromedio, pedidosPendientes, productosActivos, stockBajo }`:
  - `ventasPeriodo`: suma de `total` de los pedidos PAGADO del rango, con ambos extremos incluidos y en fechas locales.
  - `pedidosPendientes`: pedidos en `PENDIENTE_PAGO` más envíos que no están ENTREGADO.
  - `stockBajo`: inventarios con `stock ≤ stockMinimo`.
- Produces: `SALES_CSV_HEADERS = ['fecha','pedido','cliente','comprobante','metodo_pago','subtotal','igv','envio','total']`; `salesReportRows(datos, rango) → string[][]`; `toCsv(rows) → string`: separador `,`, comillas dobles cuando el valor contiene `,`, `"` o salto de línea (las comillas internas se duplican), BOM `﻿` al inicio y líneas con `\r\n`.
- Produces: `dashboardService.getDashboard(rango)`, que devuelve los KPIs, las alertas pendientes con su producto y los 5 pedidos más recientes. Además `markAlertAttended(id)` y `exportSalesCsv(rango) → Promise<{nombreArchivo: 'ventas_<desde>_<hasta>.csv', contenido}>`. Todo exige rol ADMIN.

- [ ] **Step 1: Pruebas que fallan:**
  - Un rango sin pedidos devuelve ceros y `ticketPromedio` 0, no `NaN`.
  - Un pedido PENDIENTE_PAGO no suma ventas.
  - `toCsv([['a,b', 'c"d']])` devuelve `'﻿"a,b","c""d"\r\n'`.
  - Tras la semilla hay al menos una alerta (el bajo tiene stock 3 y mínimo 3).
  - Un cliente que llama al dashboard recibe `ForbiddenError`.
- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Vista** — tarjetas de KPIs del prototipo con valores reales, selector de rango (por defecto el mes en curso), lista de alertas con "Marcar atendida", pedidos recientes y "Descargar reporte CSV" (con `Blob` y un enlace temporal).
- [ ] **Step 6: Commit** `feat: agregar dashboard con KPIs, alertas de stock y reporte CSV`

### Task 24: Usuarios (admin)

**Files:**
- Create: `src/services/admin-user-service.js`, `src/ui/views/admin/users.js`
- Modify: `src/ui/routes.js` (`'/admin/usuarios'`)
- Test: `tests/services/admin-user-service.test.js`

**Interfaces:**
- Produces: `adminUserService.list({texto?, rol?})` (sin hash ni sal) y `setActive(id, activo)` (el admin no puede desactivarse a sí mismo: `ConflictError`). Desactivar a un usuario con sesión abierta hace que su próximo `currentUser()` devuelva `null`.

- [ ] **Step 1: Pruebas que fallan:**
  - Un usuario desactivado no puede iniciar sesión (`AuthError` "Tu cuenta está desactivada").
  - El admin no puede desactivarse a sí mismo.
- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Vista** con tabla, búsqueda e interruptor de estado.
- [ ] **Step 6: Commit** `feat: agregar gestión de usuarios para el administrador`

### ✂ Línea de corte 2 — administración completa

---

## Fase D — Extras del prototipo y cierre

### Task 25: Favoritos, comparador, cuestionario y progreso de cursos

**Files:**
- Create: `src/services/preferences-service.js`, `src/core/recommender.js`, `src/ui/views/favorites.js`, `src/ui/views/compare.js`, `src/ui/views/quiz.js`
- Modify: `src/ui/components/product-card.js`, `src/ui/views/learn-course.js`, `src/ui/views/home.js` (botón "Ayúdame a elegir"), `src/ui/routes.js` (`'/favoritos'`, `'/comparar'`)
- Test: `tests/core/recommender.test.js`, `tests/services/preferences-service.test.js`

**Interfaces:**
- Produces: `MAX_COMPARE = 3`; `preferencesService.toggleFavorite(id) → Promise<boolean>`, `listFavorites() → ProductView[]`, `toggleCompare(id)` (un cuarto producto lanza `ConflictError('Puedes comparar hasta 3 instrumentos')`; los no FISICO lanzan `ValidationError`), `listCompare()`, `clearCompare()`, `toggleChapter(idProducto, indice)` (exige `downloadService.hasAccess`; si no, `ForbiddenError`) y `progress(idProducto) → {completados: number[], porcentaje}`. Las preferencias se guardan por usuario, o como `'invitado'` sin sesión.
- Produces: `recommend(productos, {sonido, presupuesto, nivel}) → ProductView[]`: replica las preguntas y la puntuación de `showRecommendations` del prototipo y devuelve como máximo 3 productos, todos con stock y ninguno por encima del presupuesto.

- [ ] **Step 1: Pruebas que fallan** — cuarto en comparar → `ConflictError`; `recommend` con presupuesto 300 no devuelve productos de precio mayor y excluye el ukelele agotado; `toggleChapter` sin compra → `ForbiddenError`; el porcentaje de 2 de 4 capítulos es 50.
- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Vistas** — portar favoritos, comparador (tabla lado a lado) y cuestionario del prototipo; capítulos marcables con barra de progreso en `learn-course`.
- [ ] **Step 6: Commit** `feat: agregar favoritos, comparador, recomendador y progreso de cursos`

### Task 26: Restablecer demo, pulido adaptable y publicación final

**Files:**
- Create: `src/services/demo-service.js`
- Modify: `src/ui/layout/footer.js` (enlace "Restablecer datos de demo"), `src/ui/views/admin/dashboard.js` (botón), `assets/css/*` (ajustes adaptables), `README.md`
- Test: `tests/services/demo-service.test.js`

**Interfaces:**
- Produces: `demoService.reset() → Promise<void>` → `store.clearAll()` y `ensureSeeded` (incluye el historial demo). La UI confirma antes con "Se borrarán tus cambios y volverás a los datos de ejemplo".

- [ ] **Step 1: Prueba que falla** — tras crear un pedido y ejecutar `reset()`, `cliente.demo` vuelve a tener exactamente 3 pedidos y el stock de la guitarra vuelve a su valor semilla.
- [ ] **Step 2: Ejecutar** → FAIL. **Step 3: Implementar.** **Step 4: Ejecutar** → PASS.
- [ ] **Step 5: Revisión adaptable** — recorrer todas las vistas a 360 px, 768 px y 1280 px; corregir desbordes; probar en Chrome y Edge (y en Firefox si está disponible); comprobar que ningún archivo de `src/` supera su límite de líneas:

```bash
find src -name '*.js' | xargs wc -l | sort -n | tail -15
```

- [ ] **Step 6: Ejecutar** `npm test` → todo PASS. Recorrer el guion del README en GitHub Pages tras publicar.
- [ ] **Step 7: Commit** `feat: agregar restablecimiento de datos de demo y ajustes adaptables`
- [ ] **Step 8: Integrar a `main`, pedir confirmación y hacer push** (igual que la Tarea 20b, pasos 4–5) y volver a verificar la URL publicada.

---

## Cobertura de requerimientos

| RF | Tarea | RF | Tarea | RF | Tarea | RF | Tarea |
|---|---|---|---|---|---|---|---|
| 01 | 8–9 | 08 | 6, 18 | 15 | 10, 14 | 22 | 18 |
| 02 | 8–9 | 09 | 5–6 | 16 | 12, 20 | 23 | 17, 21 |
| 03 | 20 | 10 | 5–6 | 17 | 10 | 24 | 19 |
| 04 | 20 | 11 | 7 | 18 | 13, 15 | 25 | 22 |
| 05 | 17 | 12 | 10–11 | 19 | 13–15 | 26 | 22 |
| 06 | 5–6 | 13 | 10–11 | 20 | 13–15 | 27 | 14, 23 |
| 07 | 5–6 | 14 | 10–11 | 21 | 14, 16 | 28 | 23 |
