# Biblio Manager

Portal bibliotecario del **Tecnológico de Antioquia I.U.** para consultar el acervo, solicitar préstamos, leer en línea, subrayar textos, responder trivias y reflexiones, recibir recomendaciones y comunicarse con la biblioteca.

Proyecto integrador (PPI) de la asignatura **Lógica de Programación**.

- **Autores:** Luis Alejandro Herrera, Joselin Paola Lisboa, Juan Estiven Salas
- **Repositorio:** <https://github.com/estivenArang0/biblio_manager>

---

## Stack

- **Frontend:** React 19, Vite 8, React Router 7, Tailwind CSS 3 (tokens Material 3) y Oxlint.
- **Backend:** Node.js 24 con `node:http` y `node:sqlite` (SQLite nativo), sin dependencias adicionales.
- **Autenticación:** sesiones propias con token opaco y contraseñas `scrypt`.

> El prototipo anterior guardaba todo en `localStorage`. Ahora **la sesión, los permisos, el catálogo, los préstamos, el contenido de lectura, los subrayados, el chat y los reportes viven en la base de datos del servidor**. El cliente nunca recibe el texto de un libro si no tiene un préstamo activo y vigente.

## Puesta en marcha

```bash
npm install
npm run dev        # API en :4000 + Vite en :5173
```

Abrir <http://localhost:5173>. La base se crea sola en `server/data/biblio.db` y se siembra la primera vez.

### Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Levanta API y frontend juntos. |
| `npm run dev:web` | Solo Vite (requiere `npm run server` aparte). |
| `npm run server` | Solo el API en el puerto 4000. |
| `npm run build` | Build de producción en `dist/`. |
| `npm run lint` | Oxlint sobre todo el proyecto. |
| `npm test` | Pruebas del backend (permisos, lectura, subrayados, chat, reportes). |
| `npm run preview` | Sirve el build (sin proxy `/api`; usar `npm run dev` para probar). |

Variables opcionales en `.env`: `PORT`, `BIBLIO_DB`, `DEMO_PASSWORD` y `SESSION_IDLE_MINUTES` (ver `.env.example`).

## Usuarios de demostración

Contraseña por defecto del seed: **`123456`**. Se puede cambiar antes de crear la base con
`DEMO_PASSWORD=...`; después, cada usuario puede cambiarla desde **Mi perfil**.

| Rol | Correo | Nombre |
| --- | --- | --- |
| Lector | `estudiante@tdea.edu.co` | Ana María Restrepo |
| Lector | `mateo.gomez@tdea.edu.co` | Mateo Gómez Salazar |
| Lector | `profesor.jaramillo@tdea.edu.co` | Carlos Jaramillo |
| Lector | `patricia.restrepo@tdea.edu.co` | Patricia Restrepo Vélez |
| Bibliotecario | `bibliotecario.central@tdea.edu.co` | Luisa Fernanda Gómez |
| Bibliotecario | `coordinacion.biblioteca@tdea.edu.co` | Coordinación de Biblioteca |

> Solo existen dos roles: **Lector** y **Bibliotecario**. El *tipo de lector* (`estudiante` o `docente`) es informativo y sirve para filtrar reportes; no cambia permisos.

## Matriz de permisos

| Sección | Lector | Bibliotecario |
| --- | --- | --- |
| Catálogo | Ver y solicitar | Ver, registrar y editar |
| Mis préstamos | Sí | No |
| Lectura de libros | Sí, con préstamo vigente (físico o digital) | No |
| Favoritos / notas / comprensión | Sí | No |
| Recomendaciones | Sí | No |
| Historial | Solo el propio | Global |
| Préstamos y devoluciones | No | Aprobar, devolver y préstamo directo |
| Reportes + CSV | No | Sí |
| Chat | Con la biblioteca | Atiende la bandeja |
| Usuarios | No | Crear lectores, activar y desactivar |
| Mi perfil / cambiar contraseña | Sí | Sí |

Todas las rutas del API validan la sesión y el rol en el **servidor**. Si se escribe una URL prohibida en el navegador se muestra **Acceso denegado (403)**; el API responde igualmente `403`.

## Funcionalidades

### Roles y menú
- Menú lateral filtrado por rol (hamburguesa en móvil).
- Guards de ruta (`RequireAuth`, `RequireRole`) y comprobación de rol en cada endpoint.
- **Lector:** Catálogo, Mis préstamos, Favoritos y notas, Comprensión lectora, Recomendaciones y Mi perfil.
- **Bibliotecario:** Panel, Catálogo, Préstamos, Reportes y Usuarios. El perfil se abre desde el usuario del encabezado.

### Mis préstamos
- Portada, título, autor, fecha de préstamo, fecha límite y días restantes.
- Estados: **Solicitado**, **Para leer** y **Vencido**.
- **Leer** aparece siempre que el préstamo esté vigente, sea físico o digital.
- Si está vencido no se puede leer, pero **Ver mi avance** muestra la página, el porcentaje y los resaltados, sin abrir el texto ni permitir avanzar.
- Las tarjetas muestran solo portada, título, autor, fecha/días, estado y botón.

### Préstamo directo en mostrador
- Botón **Nuevo préstamo** en el panel del bibliotecario.
- Búsqueda de usuario por nombre o correo y de libro por título o ISBN.
- Fecha límite editable (15 días por defecto).
- El backend valida que queden ejemplares y que el usuario no tenga préstamos vencidos; descuenta el ejemplar y registra el préstamo en el historial.

### Google Books por ISBN
- En “Registrar/editar libro”, el botón **Buscar datos** consulta `https://www.googleapis.com/books/v1/volumes?q=isbn:...`.
- Rellena título, autor, género, descripción y portada; el bibliotecario puede corregir todo antes de guardar.
- Timeout de 5 segundos. Si no hay datos, cuota agotada o error de red, usa el respaldo local de 5 ISBN; si tampoco está, muestra **“No se encontraron datos, escríbelos manualmente.”** y el formulario sigue funcionando.

#### API key gratuita de Google Books (opcional)
1. Entra a <https://console.cloud.google.com/> y crea o selecciona un proyecto.
2. Ve a **APIs y servicios → Biblioteca**, busca **Books API** y pulsa **Habilitar**.
3. En **APIs y servicios → Credenciales**, crea una **clave de API**.
4. Pega la clave en `.env`:

```env
GOOGLE_BOOKS_API_KEY=tu_clave_aqui
```

5. Reinicia `npm run dev`. Si la variable está vacía, se consulta sin llave como antes.

**Respaldo local:** `server/google-books-fallback.json` contiene 5 ISBN reales (Quijote, Cien años de soledad, El infinito en un junco, El Aleph y Sapiens). Se usa automáticamente si Google responde 429 o falla, para poder demostrar la función sin depender de la cuota.

### Contenido de lectura editable
- En el catálogo, el botón con ícono de libro (staff) abre **Contenido de lectura**.
- Cada bloque es una página: título/capítulo, texto (párrafos separados por línea en blanco) y trivia o pregunta de reflexión.
- Si se completan las 3 opciones hay trivia con respuesta correcta; si se dejan vacías, el visor muestra un campo de reflexión.
- Hay dos libros de ejemplo con 3 bloques y trivia: **Don Quijote** y **Tratado de las Formas Tipográficas**.

### Lectura interactiva protegida
- Listado previo de libros con préstamo vigente.
- El catálogo no muestra etiquetas de "prestado" ni enlaces de lectura.
- Cada página se pide a `GET /api/reading/:bookId/page/:index`, que exige préstamo activo y vigente. Si se devuelve o vence, el visor se cierra con aviso.
- El texto no tiene URL pública: solo se entrega por el API autenticado.
- Bloqueo de copiar, cortar, arrastrar, clic derecho y atajos `Ctrl+C`, `Ctrl+X`, `Ctrl+P`, `Ctrl+S`, `Ctrl+U`.
- Contenido oculto al imprimir (`@media print`).
- Marca de agua tenue con nombre y correo.
- Cierre de sesión automático tras **30 minutos sin actividad** (servidor + respaldo en el navegador).
- Apertura y cierre se registran en el historial.

### Subrayar y anotar
- Al seleccionar texto aparece una barra con amarillo, verde, azul, **Añadir nota** y **Guardar en favoritos**.
- Se guarda por usuario, libro, página, bloque y offsets de inicio/fin.
- Clic en un resaltado abre el editor: cambiar color, editar/borrar nota, marcar/desmarcar favorito o quitar el resaltado.
- Cada usuario solo ve y modifica sus propios resaltados.

### Resultados de actividades
- Cada respuesta de trivia o reflexión se guarda en `activity_results` con usuario, libro, bloque, tipo, respuesta, acierto (solo trivia) y fecha.
- Cada bloque se responde **una sola vez**; queda bloqueado y no se puede repetir.
- Al reabrir el libro, los bloques respondidos muestran la insignia **Completado** y recuperan la respuesta.
- **Historial** (ruta `/historial`) muestra libro, bloque, tipo, resultado y fecha. Cada usuario ve lo suyo; staff ve el historial global.
- **Reportes → Comprensión lectora** agrupa por usuario/libro con actividades respondidas, aciertos y porcentaje, filtro por fecha y CSV.
- El visor muestra **“Aciertos X de Y”** (sin puntos ni trofeo). Al final de cada libro aparece **Ver resumen de comprensión**.

### Favoritos, notas y comprensión
- **Favoritos y notas:** lista los **fragmentos** guardados agrupados por libro, con texto, color, nota, bloque y fecha. Filtros por libro y “Solo favoritos”.
- El enlace de ubicación abre el libro en esa página si el préstamo está vigente; si está vencido solo muestra el fragmento.
- Se puede quitar el favorito, editar o borrar la nota. El corazón de libros favoritos sigue disponible en el catálogo.
- **Comprensión lectora:** por libro muestra bloques respondidos, aciertos en trivias, porcentaje y mensaje: ≥80 % “Muy buena comprensión”; 50–79 % “Buena, repasa estos bloques” con la lista de fallados; <50 % “Conviene releer el libro”.

### Panel del bibliotecario
- Tarjetas de solicitudes pendientes (con botón aprobar), préstamos activos, vencidos, mensajes sin leer, libros más prestados y préstamos del mes.
- Cada tarjeta enlaza a su lista o abre el chat.

### Reportes
- Tres pestañas: **Préstamos** (filtro por tipo de lector), **Vencidos** y **Comprensión lectora**.
- Filtros por fecha; totales arriba y exportación CSV.
- Exportación CSV desde el API (solo Bibliotecario).

### Sesión y perfil
- Cada petición autenticada actualiza `last_seen_at`; si pasan más de 30 minutos, el API borra la sesión y responde `401` con `code: SESSION_IDLE`.
- El frontend cierra sesión y muestra **“Tu sesión venció por inactividad”**.
- **Mi perfil** permite cambiar la contraseña (actual + nueva de mínimo 8 caracteres, guardada con `scrypt`).

### Chat interno
- Botón flotante abajo a la derecha en todas las pantallas autenticadas, con contador de no leídos; polling cada 5 segundos.
- El lector chatea con la biblioteca; el bibliotecario ve la lista de conversaciones.
- Máximo 500 caracteres; el texto se guarda plano y React lo escapa al renderizar (sin HTML).
- Un usuario no puede leer conversaciones ajenas.

### Sesión y seguridad
- Login con límite de **5 fallos** y bloqueo de **1 minuto** por IP/correo (`LOGIN_MAX_ATTEMPTS`, `LOGIN_BLOCK_SECONDS`).
- Sesión con vencimiento por inactividad en el servidor; contraseñas con `scrypt`; consultas SQL parametrizadas; contenido con `Cache-Control: no-store`.

### Responsive
- **360 px:** una columna, menú hamburguesa, tablas con scroll interno, botones táctiles de 44 px y sin scroll horizontal de página.
- **768 px:** catálogo y recomendaciones a 2 columnas; panel de lectura debajo del texto.
- **1024 px:** menú lateral visible y lectura en 2 paneles.

## Estructura

```
server/
  app.js        Rutas del API, permisos y reglas de negocio
  auth.js       scrypt + tokens
  db.js         Esquema SQLite y siembra inicial
  seed.js       Usuarios, libros, contenido y préstamos de ejemplo
  index.js      Arranque del servidor
  test/         Pruebas con node:test
src/
  components/   Header, Sidebar, BookCard, ChatThread, guards, etc.
  context/      AuthContext (sesión + cierre por inactividad)
  layouts/      AppLayout
  pages/        Login, catálogo, préstamos, lectura, reportes, chat, usuarios…
  services/     Cliente HTTP del API
  utils/        Texto y normalización
scripts/dev.mjs Levanta API + Vite en un comando
```

## Pruebas

```bash
npm test        # 22 pruebas de integración del backend
npm run lint
npm run build
```

La verificación de interfaz se hizo con Chrome headless sobre el flujo completo (2 roles, préstamo real, lectura, fragmentos favoritos, reportes, chat flotante y 360/768/1024 px). Evidencias locales en `../tmp/biblio-evidence/` (fuera del repositorio).

## Decisiones y simplificaciones

- No se usa Firebase: la seguridad y la persistencia están en el API propio para poder validar permisos y contenido en el servidor.
- El contenido de lectura es texto de dominio público / de ejemplo almacenado en la base; no hay PDF ni archivos servidos como estáticos.
- El cierre por inactividad se controla en el servidor (30 min por defecto, configurable con `SESSION_IDLE_MINUTES`); el navegador mantiene un temporizador de respaldo. La sesión absoluta expira a las 12 h.
- El chat es de texto plano, sin adjuntos ni websockets.
- El bibliotecario no entra a "Mis préstamos" ni a lectura porque esas vistas exigen un préstamo personal; sí puede revisar y gestionar todo lo demás.
- No se implementó recuperación de contraseña por correo ni edición de datos del perfil; sí el cambio de contraseña autenticado. Los lectores los crea el bibliotecario.
