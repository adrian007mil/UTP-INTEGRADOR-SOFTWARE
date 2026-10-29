# Diseño — Frontend completo de OmniMelody

Fecha: 2026-10-29 · Proyecto Integrador, Grupo 4 (UTP)

## 1. Intención y por qué

OmniMelody es una tienda web que reúne en un solo lugar la venta de instrumentos musicales (productos físicos) y de recursos para aprender música (partituras, guías y cursos audiovisuales, productos digitales). La fuente de verdad funcional es el documento `Grupo 4 - Avance de Proyecto Final 2.docx` (28 requerimientos funcionales RF-01…RF-28, modelo de datos de ~25 tablas).

**Prioridad actual: terminar el frontend.** El profesor quiere ver el frontend en GitHub, y la demo final (04/12/2026) se hará en la computadora de un compañero que no tiene XAMPP ni Tomcat. La demo recorre los flujos principales del **cliente**.

El backend (Java Servlets + JSP sobre Tomcat, MVC + DAO + JDBC + MySQL, al estilo del repo clonado `Proyecto_Integrador_1_UTP_SistemaMatricula`) es una **fase posterior** y no forma parte de este diseño, salvo por la obligación de dejar el frontend listo para conectarse a él.

## 2. Punto de partida

Prototipo existente en `2026-10-27/2026-10-27/h/outputs/` (`index.html`, `app.js`, `styles.css`, `README.md`):

- Marca, estética y tipografías (DM Sans, Manrope) de OmniMelody — **se conservan**.
- Catálogo de 15 productos (8 físicos con fotos de Wikimedia Commons y créditos, 7 digitales), 6 recursos de aprendizaje con video de YouTube y capítulos, favoritos, comparador de hasta 3 instrumentos, cuestionario "Ayúdame a elegir", carrito en `localStorage`, checkout de 2 pasos de muestra, vista de administración estática.
- Problemas: `app.js` es un solo archivo de 128 líneas muy densas con todo mezclado (datos, lógica, HTML, eventos); login/registro/checkout son formularios sin comportamiento; el admin muestra números fijos.

Se reutilizan los datos, textos, estilos y funcionalidades del prototipo; el código se reorganiza.

## 3. Objetivos

1. Los flujos del cliente funcionan de punta a punta en el navegador, con datos persistidos localmente:
   registro → inicio de sesión → catálogo (búsqueda y filtros) → detalle → carrito → checkout → pago simulado → comprobante → "Mis pedidos" (seguimiento) → descargas → reseña.
2. Cubrir en el frontend los 28 RF del documento, con las simulaciones de la sección 6.
3. Publicado en **GitHub Pages** desde un repositorio propio del grupo.
4. Código organizado para cambiar la persistencia local por llamadas a la futura API Java sin tocar vistas ni lógica.
5. Cumplir las reglas de ingeniería del autor (sección 8).

## 4. No-objetivos

- Backend Java, MySQL, Tomcat (fase siguiente).
- Envío real de correos (SMTP): "todavía no".
- Pasarela de pagos real.
- Seguridad real: en un frontend sin servidor las validaciones de precio, stock y pago se pueden saltar desde el navegador. Se acepta por ser prototipo académico y se deja escrito en el README.
- App móvil, streaming propio, clases en vivo (fuera de alcance según el documento).

**Anti-objetivos** (sería un fracaso aunque "funcione"):

- Que la demo falle en vivo en la computadora del compañero (pantalla en blanco, error de carga, datos corruptos sin forma de recuperarlos).
- Perder la identidad visual del prototipo OmniMelody.
- Un archivo gigante imposible de conectar al backend después.

## 5. Decisiones de cómo se hace (tomadas por el usuario)

- Tecnología final del sistema: Java web Servlets + JSP (fase backend).
- Diseño y marca: **OmniMelody** (no "My Music Store" de las capturas del Word).
- Alcance: los 28 RF; **pasarela de pagos simulada con datos precargados**; **sin SMTP por ahora**.
- Ubicación: **subcarpeta nueva** `omnimelody/` en la raíz del workspace; el repo clonado queda intacto y no se hace push a él.
- Publicación: frontend visible en GitHub, en el repositorio del grupo **`https://github.com/adrian007mil/UTP-INTEGRADOR-SOFTWARE.git`** (hoy vacío), con GitHub Pages activado. `omnimelody/` es la copia local de ese repo.
- **Prioridad si falta tiempo: el flujo del cliente primero.** Registro, catálogo, carrito, pago, pedidos, descargas y reseñas deben quedar impecables; el panel de administración y los extras del prototipo (comparador, cuestionario, progreso de capítulos) pueden quedar más simples. El plan se ordena por esta prioridad con líneas de corte explícitas.
- **Backend futuro: Servlets que devuelven JSON.** Este frontend se conserva y consumirá esa API; el servidor será quien decida pagos, stock, precios, numeración de comprobantes y acceso a descargas.
- **Una sola persona construye** (el autor con el asistente): plan secuencial.

## 6. Cómo se cubre cada requerimiento sin servidor

Toda la persistencia vive en `localStorage` bajo un prefijo de versión (`omnimelody:v1:`). Al primer arranque se cargan **datos semilla** (catálogo, categorías, marcas, un administrador y un cliente de ejemplo con pedidos previos para que la demo muestre historial).

| RF | Cómo se cumple en el frontend |
|---|---|
| RF-01 Registro | Formulario con nombres, apellidos, DNI (8 dígitos), correo, usuario, contraseña + confirmación. Valida unicidad de correo/usuario/DNI. |
| RF-02 Login | Usuario + contraseña contra los usuarios guardados. Contraseña guardada como hash SHA-256 (Web Crypto) con sal; nunca en texto plano. Sesión en `sessionStorage`. |
| RF-03 Restablecer contraseña | Genera token temporal (expira en 30 min). En lugar de correo, se muestra en un **"buzón simulado"** dentro de la app con el enlace que abre la pantalla de nueva contraseña. |
| RF-04 Perfil | Editar datos personales, cambiar contraseña, gestionar direcciones. |
| RF-05 Historial | "Mis pedidos" con lista y detalle de cada pedido. |
| RF-06/07/08 Catálogos | Tres bloques/vistas: instrumentos (por categoría), partituras y documentos digitales, material audiovisual (cursos con video y capítulos). |
| RF-09 Búsqueda | Texto libre por nombre, categoría o marca. |
| RF-10 Filtros | Precio máximo, **marca**, disponibilidad, tipo de instrumento, familia sonora. |
| RF-11 Ficha | Página de detalle con descripción, precio, galería, stock, reseñas. |
| RF-12/13/14 Carrito | Físicos y digitales juntos; cambiar cantidad (tope = stock; digitales máx. 1); quitar ítem; vaciar. |
| RF-15 Totales | Subtotal, IGV 18 % (precios mostrados ya lo incluyen; se desglosa), envío y total en tiempo real. |
| RF-16 Direcciones | Varias direcciones por cliente, una predeterminada. |
| RF-17 Envío | Tarifa por departamento (Lima vs. provincias, tabla fija); S/ 0 si el carrito solo tiene digitales. |
| RF-18 Método de pago | Tarjeta, transferencia bancaria, billetera digital (Yape/Plin). |
| RF-19 Pasarela | **Simulada**: tarjetas de prueba precargadas (una aprobada, una rechazada por fondos, una rechazada por datos), demora artificial de ~1.5 s, código de transacción. Rechazo → vuelve a elegir método (como en el BPMN). Transferencia queda "pendiente de verificación" hasta que el admin la confirma. |
| RF-20 Comprobante | Boleta (DNI) o factura (RUC) con serie y número correlativos; vista imprimible / "Guardar como PDF" del navegador. |
| RF-21 Correo de confirmación | Mensaje en el buzón simulado con el resumen y enlace al comprobante. |
| RF-22 Descargas | En "Mis descargas", solo para pedidos pagados. Archivos de muestra (PDF pequeños incluidos en el repo) y cursos con video; cada descarga queda registrada (fecha). |
| RF-23 Seguimiento | Estados procesando → enviado → entregado con código de tracking simulado; el admin los avanza. |
| RF-24 Reseñas | Estrellas + comentario, solo en productos comprados, una por producto y cliente. |
| RF-25 Productos (admin) | Crear, editar, deshabilitar, eliminar (eliminar solo si nunca se vendió; si no, deshabilitar). |
| RF-26 Categorías | Categorías y subcategorías para físicos y digitales. |
| RF-27 Stock | Se descuenta al confirmarse el pago; alerta cuando stock ≤ stock mínimo, visible en el panel. |
| RF-28 Dashboard | KPIs calculados de los datos reales guardados (ventas del periodo, pedidos pendientes, productos activos, stock bajo) y reporte de ventas por rango de fechas descargable en CSV. |

Además, el administrador gestiona usuarios (listar, activar/desactivar) y pedidos (cambiar estado, confirmar transferencias), según los alcances del documento.

Funciones extra del prototipo que se conservan: favoritos, comparador, cuestionario de recomendación, progreso de capítulos.

**Cuentas de demo** (mostradas en la pantalla de login para la presentación): un cliente con pedidos previos y un administrador.

**Botón "Restablecer datos de demo"** (en el panel admin y en el pie de página): borra todo y recarga la semilla. Protege contra el anti-objetivo de datos corruptos en vivo.

## 7. Arquitectura del frontend

HTML + CSS + JavaScript puro con **módulos ES nativos**, sin framework ni paso de compilación (GitHub Pages sirve los archivos tal cual).

Capas, con flujo unidireccional:

```
ui/views (pantallas)  →  services (casos de uso)  →  repositories (persistencia)
                              ↓
                         core (lógica pura)
```

- **core/**: funciones puras sin DOM ni `localStorage`: cálculo de totales, IGV, envío, filtros y orden del catálogo, reglas del carrito, validaciones de formularios, reglas de la pasarela simulada, transiciones de estado del pedido, numeración de comprobantes, KPIs, generación de CSV.
- **repositories/**: una interfaz por entidad (productos, usuarios, pedidos, …) con métodos **asíncronos** (devuelven Promesas), implementados hoy sobre `localStorage`.
- **services/**: orquestan los casos de uso (por ejemplo, `checkout`: valida carrito → calcula totales → procesa pago simulado → crea pedido → descuenta stock → genera comprobante → notifica al buzón). Cada servicio expone una **interfaz asíncrona que coincide con un endpoint de la futura API JSON** (`checkoutService.placeOrder(datos)` ↔ `POST /api/pedidos`).
- **Punto de intercambio con el backend: los servicios, no solo los repositorios.** Como el servidor decidirá pagos, stock y precios, la implementación local de cada servicio (que usa core + repositories) se reemplazará por una implementación `fetch` con la misma interfaz. Las vistas solo dependen de las interfaces de servicio, inyectadas en un único punto de composición (`app` / `container`).
- **ui/**: router por hash (`#/catalogo`, `#/producto/3`, `#/carrito`, `#/cuenta/pedidos`, `#/admin/…`) para que funcione en GitHub Pages sin configuración; una vista por archivo; componentes reutilizables (tarjeta de producto, modal, toast).
- Errores tipados (`ValidationError`, `NotFoundError`, `PaymentDeclinedError`, …) lanzados por core/services y mostrados al usuario por un manejador central en la UI.
- Rutas de administración protegidas por rol; un cliente que entra a `#/admin` es redirigido.

Los nombres de entidades y campos siguen el modelo de datos del documento (`usuario`, `producto`, `tipo_producto` FISICO/DIGITAL/AUDIOVISUAL, `pedido`, `detalle_pedido`, `pago`, `comprobante`, `envio`, `seguimiento_envio`, `descarga`, `resena`, …) para que el backend futuro mapee uno a uno.

## 8. Restricciones

- Reglas de ingeniería del autor (CLAUDE.md global): archivos ≤ 200 líneas (services ≤ 150, core ≤ 150), funciones < 20 líneas, nombres descriptivos, sin números mágicos, sin código comentado, sin `console.log`, fail-fast con errores tipados, TDD.
- **Pruebas**: TDD sobre `core/` y `services/` con el ejecutor de pruebas integrado de Node (`node --test`), sin dependencias; los repositorios se sustituyen por implementaciones en memoria en las pruebas. La UI se verifica manualmente con un guion de la demo.
- Diseño adaptable (móvil, tablet, escritorio) y compatibilidad con Chrome, Edge, Firefox, Safari (RNF-04).
- Git: Conventional Commits, trabajo en ramas, commits pequeños.
- Entrega: construcción hasta 13/11/2026; entrega final 04/12/2026.
- Fotos y videos dependen de internet (Wikimedia, YouTube): se mantienen los créditos y un respaldo visual (ícono) si una imagen no carga.

## 9. Demo

La demo se ejecuta abriendo la URL de GitHub Pages en el navegador del compañero (no requiere instalar nada; sí requiere internet, que ya hace falta para fotos y videos). Los módulos ES no cargan abriendo `index.html` con doble clic (`file://`), por eso la vía oficial es la URL publicada.

Se incluye un **guion de demo** en el README con el recorrido del cliente y las cuentas a usar.

## 10. Lo que queda a criterio del constructor

- Estructura exacta de carpetas y nombres de archivos dentro de las capas.
- Tarifas de envío concretas, números de tarjetas de prueba, contenido de los datos semilla adicionales (puede ampliar el catálogo).
- Diseño visual de las pantallas nuevas (perfil, pedidos, comprobante, admin CRUD), siguiendo el lenguaje visual del prototipo.
- Cómo dividir `styles.css` (hoy 27 KB minificado) en archivos por sección.
- Orden de implementación, siguiendo la recomendación de `descripcion_proyecto_tienda_musical.txt`: catálogo y detalle → registro, carrito y compra → pedidos y descargas → administración.

## 11. Decisiones tomadas por el asistente (revisar)

- GitHub Pages como forma de "ver el frontend en GitHub".
- JavaScript puro con módulos ES, sin framework ni build.
- `node --test` para pruebas, sin dependencias.
- Hash SHA-256 con sal en lugar de bcrypt (bcrypt corresponde al backend).
- Buzón simulado dentro de la app para RF-03 y RF-21.
- IGV 18 % incluido en el precio mostrado.
- Botón de restablecer datos de demo.
- **Recursos de "Aprende"**: los 6 recursos del prototipo pasan a ser productos `AUDIOVISUAL`/`DIGITAL` del catálogo. La vista "Aprende" sigue abierta sin sesión con una **vista previa gratuita** (descripción, temario y el video introductorio de YouTube); el contenido completo (todos los capítulos, progreso y archivos descargables) se desbloquea solo tras comprarlo. El cliente de demo ya posee uno o dos para mostrar ambos estados.
- **Repositorio git**: `omnimelody/` se inicializa como repositorio propio enlazado al remoto del grupo. El repo clonado de la raíz solo lo verá como carpeta no rastreada; no se modifica ni se le hace push.
- **Publicación**: GitHub Pages desde la rama `main`, carpeta raíz. El trabajo se hace en ramas de funcionalidad y se integra a `main`; hacer push al remoto del grupo es una acción que se confirma con el autor cada vez.
