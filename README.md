# OmniMelody

Tienda web que reúne en un solo lugar la venta de **instrumentos musicales** y de **recursos para aprender música**: partituras, guías en PDF y cursos audiovisuales.

Proyecto Integrador — Grupo , Ingeniería de Sistemas e Informática, Universidad Tecnológica del Perú (2026).

> **Prototipo académico.** Esta versión es solo el frontend. No hay servidor: los datos se guardan en el navegador, los pagos y los correos son simulados y nada de esto es apto para una tienda real.

## Cómo abrirlo

**En línea:** abre la página publicada en GitHub Pages:
`https://adrian007mil.github.io/UTP-INTEGRADOR-SOFTWARE/`

**En tu computadora** (necesitas [Node.js](https://nodejs.org) 20 o superior):

```bash
npm start
```

Luego abre <http://localhost:8080>.

No funciona haciendo doble clic en `index.html`: el navegador bloquea los módulos de JavaScript cuando se abren como archivo local.

## Cuentas y datos de prueba

| Para | Usuario | Contraseña |
|---|---|---|
| Cliente (ya tiene 3 pedidos) | `cliente.demo` | `Demo2026!` |
| Administrador | `admin` | `Admin2026!` |

**Tarjetas de la pasarela simulada:** usa cualquier vencimiento futuro (por ejemplo `12/28`) y cualquier CVV de 3 dígitos.

| Número | Resultado |
|---|---|
| `4111 1111 1111 1111` | Aprobada |
| `4000 0000 0000 0002` | Rechazada por fondos insuficientes |
| `4000 0000 0000 0069` | Rechazada por tarjeta vencida |

**Yape o Plin:** cualquier celular que empiece con 9 y el código de aprobación `123456`.

**Transferencia:** el pedido queda *pendiente de pago* hasta que el administrador confirma el abono.

## Guion de la demo (cliente)

1. **Inicio.** Muestra la propuesta y los destacados.
2. **Catálogo.** Busca "yamaha", filtra por *Cuerdas* y por precio, y muestra que los filtros se mantienen al recargar.
3. **Ficha de producto.** Abre la *Guitarra acústica Sienna* para ver su galería, stock, precio con IGV y reseñas.
4. **Carrito.** Agrega la guitarra y la *Guía práctica de guitarra* (digital). Prueba subir la cantidad por encima del stock.
5. **Inicio de sesión.** Ingresa como `cliente.demo`; el carrito se conserva.
6. **Checkout.** Elige o agrega una dirección (el envío cuesta S/ 15 en Lima o Callao y S/ 25 en provincias) y elige boleta o factura.
7. **Pago rechazado.** Paga con `4000 0000 0000 0002` para ver el rechazo; no se crea ningún pedido.
8. **Pago aprobado.** Paga con `4111 1111 1111 1111` para llegar a la confirmación y al comprobante imprimible.
9. **Mis pedidos y Buzón.** Revisa el seguimiento (procesando, enviado, entregado) y el correo simulado de confirmación.
10. **Mis descargas y Aprende.** Descarga el PDF y abre un curso comprado; compáralo con uno no comprado, que muestra la vista previa.
11. **Reseña.** Califica la guitarra desde su ficha.

Si algo se desordena durante la presentación, usa **"Restablecer datos de demo"** al pie de la página.

## Qué incluye

Cubre los 28 requerimientos funcionales del documento del proyecto:
- registro, inicio de sesión y recuperación de contraseña;
- perfil y direcciones;
- catálogo con búsqueda y filtros;
- carrito, checkout con IGV y envío;
- pasarela simulada y comprobante electrónico;
- buzón de notificaciones;
- seguimiento de pedidos, descargas digitales y reseñas;
- panel de administración.

Además, del prototipo inicial se conservan los favoritos, el comparador de instrumentos, el recomendador y el progreso de los cursos.

## Cómo está hecho

- HTML, CSS y JavaScript con módulos nativos. No usa framework, dependencias ni compilación.
- El código está organizado en capas:
  - `src/core`: lógica pura;
  - `src/infra`: almacenamiento y criptografía;
  - `src/services`: casos de uso;
  - `src/ui`: pantallas.
- Cada servicio tiene la forma de un endpoint de la futura API. Así, el backend en Java (Servlets que devuelven JSON y MySQL) podrá reemplazar la implementación local sin tocar las pantallas.
- Pruebas automáticas con el ejecutor que trae Node:

```bash
npm test
```

## Limitaciones conocidas

- Los datos viven solo en el navegador donde se usa la tienda: no se comparten entre equipos ni entre navegadores.
- Las contraseñas se guardan con hash SHA-256 y sal. El documento pide bcrypt, que se aplicará en el servidor.
- Las validaciones de precio, stock y pago corren en el navegador, así que alguien con conocimientos técnicos podría saltárselas. En la versión con backend las hará el servidor.
- Los correos, el courier y la pasarela de pagos son simulaciones.
- Los videos de los cursos se cargan desde YouTube y necesitan internet.

## Créditos de las fotografías

Las fotografías de los instrumentos provienen de Wikimedia Commons y se usan según sus licencias. Son referencias visuales y no muestran necesariamente el producto exacto en venta.

- **Guitarra acústica:** Massimo Giuliani, dominio público.
- **Guitarra eléctrica:** Swerver15, dominio público.
- **Bajo:** Ziongarage, CC0.
- **Teclado:** Scott Detwiler, CC BY-SA 3.0.
- **Ukelele:** Naithik Shetty, CC0.
- **Cajón:** SLevinR, CC BY 3.0.
- **Flauta dulce:** Ikal-balam, CC BY-SA 4.0.
- **Micrófono:** Zzubnik, dominio público.

En la tienda, cada foto enlaza a su página de origen.
