# Biblio Manager

Portal bibliotecario del **Tecnológico de Antioquia I.U.** para consultar el acervo, solicitar préstamos, leer en línea, subrayar textos, recibir recomendaciones y comunicarse con la administración.

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

Variables opcionales en `.env`: `PORT` y `BIBLIO_DB` (ver `.env.example`).

## Usuarios de demostración

Contraseña para todos: **`123456`**

| Rol | Correo | Nombre |
| --- | --- | --- |
| Estudiante | `estudiante@tdea.edu.co` | Ana María Restrepo |
| Estudiante | `mateo.gomez@tdea.edu.co` | Mateo Gómez Salazar |
| Docente | `profesor.jaramillo@tdea.edu.co` | Carlos Jaramillo |
| Docente | `patricia.restrepo@tdea.edu.co` | Patricia Restrepo Vélez |
| Bibliotecario | `bibliotecario.central@tdea.edu.co` | Luisa Fernanda Gómez |
| Administrador | `admin@tdea.edu.co` | Administrador TdeA |

> **Docente** conserva permisos de lectura iguales a **Estudiante** (el sistema lo mantiene porque los reportes piden préstamos por docentes). Los tres niveles de permisos distintos son: Estudiante/Docente, Bibliotecario y Administrador.

## Matriz de permisos

| Sección | Estudiante / Docente | Bibliotecario | Administrador |
| --- | --- | --- | --- |
| Catálogo | Ver y solicitar | Ver, registrar y editar | Ver, registrar y editar |
| Mis préstamos | Sí | No | No |
| Préstamos y devoluciones | No | Aprobar y devolver | Aprobar y devolver |
| Lectura interactiva | Solo con préstamo activo | No | No |
| Recomendaciones | Sí | No | No |
| Historial | Solo el propio | Global | Global |
| Reportes + CSV | No | Sí | Sí |
| Chat con administración | Sí | No | Atiende la bandeja |
| Usuarios y roles | No | No | Sí |

Todas las rutas del API validan la sesión y el rol en el **servidor**. Si se escribe una URL prohibida en el navegador se muestra **Acceso denegado (403)**; el API responde igualmente `403`.

## Funcionalidades

### Roles y menú
- Menú lateral filtrado por rol (hamburguesa en móvil).
- Guards de ruta (`RequireAuth`, `RequireRole`) y comprobación de rol en cada endpoint.

### Mis préstamos
- Portada, título, autor, fecha de préstamo, fecha límite y días restantes.
- **Leer** solo para préstamos digitales activos.
- **Retirar en biblioteca** para ejemplares físicos.
- Préstamos vencidos en rojo y sin acceso a lectura.
- Solicitudes pendientes separadas.

### Lectura interactiva protegida
- Listado previo de libros prestados digitales activos.
- El catálogo no muestra etiquetas de "prestado" ni enlaces de lectura.
- Cada página se pide a `GET /api/reading/:bookId/page/:index`, que exige préstamo activo y vigente. Si se devuelve o vence, el visor se cierra con aviso.
- El texto no tiene URL pública: solo se entrega por el API autenticado.
- Bloqueo de copiar, cortar, arrastrar, clic derecho y atajos `Ctrl+C`, `Ctrl+X`, `Ctrl+P`, `Ctrl+S`, `Ctrl+U`.
- Contenido oculto al imprimir (`@media print`).
- Marca de agua tenue con nombre y correo.
- Cierre de sesión automático tras **30 minutos sin actividad**.
- Apertura y cierre se registran en el historial.

### Subrayar y anotar
- Al seleccionar texto aparece una barra con amarillo, verde, azul y **Añadir nota**.
- Se guarda por usuario, libro, página, bloque y offsets de inicio/fin.
- Clic en un resaltado abre el editor: cambiar color, editar/borrar nota o quitar el resaltado.
- Cada usuario solo ve y modifica sus propios resaltados.

### Reportes
- Pestañas: estudiantes, docentes y todos los usuarios.
- Filtros por fecha y estado; totales de total, activos, vencidos y devueltos.
- Exportación CSV desde el API (solo Bibliotecario/Administrador).

### Chat interno
- Ventana usuario ↔ administrador con polling cada 5 segundos.
- Bandeja de conversaciones con contador de no leídos para el administrador.
- Máximo 500 caracteres; el texto se guarda plano y React lo escapa al renderizar (sin HTML).
- Un usuario no puede leer conversaciones ajenas.

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
npm test        # 11 pruebas de integración del backend
npm run lint
npm run build
```

La verificación de interfaz se hizo con Chrome headless sobre el flujo completo (3 roles, préstamo real, lectura, subrayado persistente, reporte, CSV, chat y 360/768/1024 px). Evidencias locales en `../tmp/biblio-evidence/` (fuera del repositorio).

## Decisiones y simplificaciones

- No se usa Firebase: la seguridad y la persistencia están en el API propio para poder validar permisos y contenido en el servidor.
- El contenido de lectura es texto de dominio público / de ejemplo almacenado en la base; no hay PDF ni archivos servidos como estáticos.
- El cierre por inactividad se controla en el cliente (30 min) y la sesión del API expira a las 12 h. La lectura valida el préstamo en cada página.
- El chat es de texto plano, sin adjuntos ni websockets.
- El administrador no entra a "Mis préstamos" ni a lectura porque esas vistas exigen un préstamo personal; sí puede revisar y gestionar todo lo demás.
- No se implementó edición de perfil ni recuperación de contraseña; los usuarios los crea el administrador.
