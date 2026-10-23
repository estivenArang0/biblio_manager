# Auditoría de pantallas — Tarea 0

**Fecha:** 2026-10-22 · **Rama:** `feat/tarea-0-base` · **Alcance:** estado real del repositorio antes de empezar la migración a Firebase.

Leyenda: **✅ Funciona** · **🎨 Decorativo** (se ve, no hace nada) · **❌ Falta** · **⚠️ Parcial** (funciona con limitaciones).

> Estado general: la aplicación es un **prototipo con datos en `localStorage`**. No hay autenticación real ni Firestore; por eso dos usuarios en navegadores distintos no comparten información.

## Login (`/`)

| Elemento | Estado | Nota |
| --- | --- | --- |
| Formulario correo + contraseña | ⚠️ | Solo valida campos vacíos: **cualquier contraseña entra**. |
| Selector rápido de rol (Estudiante/Docente/Bibliotecario) | ⚠️ | Escribe el rol en `localStorage`; es un atajo de demo, no seguridad. |
| Mostrar/ocultar contraseña | ✅ | |
| "¿Olvidaste tu contraseña?" | ❌ | No existe. |
| "Recordar sesión" | ❌ | No existe. |
| Enlace "Explorar catálogo como invitado" | ⚠️ | Navega a `/catalogo`, pero no hay rutas protegidas: todo el portal es público. |
| Panel editorial (cita de Borges, "Colecciones Especiales") | 🎨 | Ilustrativo. |
| Textos fijos | ⚠️ | Candidatos a contenido editable (Tarea 7). |

## Header

| Elemento | Estado | Nota |
| --- | --- | --- |
| Logo → `/catalogo` | ✅ | |
| Buscador (Enter) → `/catalogo?q=…` | ✅ | |
| Atajo `Ctrl/Cmd + K` para enfocar el buscador | ✅ | |
| Nombre, iniciales y rol del usuario | ⚠️ | Lee `localStorage`; las iniciales son las 2 primeras letras del correo. |
| Cerrar sesión | ✅ | Borra la sesión y vuelve a `/`. |
| Icono de notificaciones | ❌ | **No existe** en el código actual (el diagnóstico previo lo daba por decorativo). |
| Menú de usuario | ❌ | Solo hay botón de logout. |

## Sidebar

| Elemento | Estado | Nota |
| --- | --- | --- |
| Navegación filtrada por rol | ✅ | Lee el rol de `localStorage`. |
| Tarjeta "Credencial activa" con rol | ✅ | |
| "Conexión institucional segura" | 🎨 | |
| Comportamiento responsive | ❌ | 256 px fijos sin colapsar: a 390 px la página mide 507 px (117 px de overflow). Se corrige en Tarea 7. |

## Catálogo (`/catalogo`)

| Elemento | Estado | Nota |
| --- | --- | --- |
| Origen de datos | ⚠️ | `localStorage` (libros agregados) o los **8 libros** de `catalogBooks.js`. |
| Buscador (título, autor, ISBN, signatura, sin tildes) | ✅ | Ahora el término vive en la URL (`?q=`): sobrevive recargas y enlaces compartidos. |
| Filtros género / autor / disponibilidad / idioma / período | ✅ | Se combinan de verdad. Varias opciones devuelven 0 resultados porque los datos no las cubren (p. ej. `ciencias`, `novela`). |
| Select "Ordenar:" | 🎨 | Sin estado ni efecto. |
| Botones vista cuadrícula / lista | 🎨 | Sin acción. |
| Contador "Mostrando X de Y" + paginación + "Mostrar N" | ✅ | |
| Agregar libro / Editar libro (bibliotecario) | ✅ | Modal con validación mínima; persiste en `localStorage`. |
| Eliminar libro | ❌ | No implementado. |
| Reservar / Solicitar (BookCard) | ✅ | Crea una solicitud en `localStorage`; Docente elige plazo en un modal. |
| Leer (acceso digital) | ✅ | Navega a `/lectura` con los datos del libro. |
| Bandeja de aprobación del bibliotecario | ⚠️ | Aprueba/rechaza y crea el préstamo, pero solo se sincroniza entre pestañas del mismo navegador. |
| Estados cargando / vacío / error | ⚠️ | Hay estado vacío; no hay "cargando" ni "error" porque no hay red. |
| Portadas | ⚠️ | **22 URLs** de `lh3.googleusercontent.com/aida-public/...` que se romperán con el tiempo (Tarea 2). |

## Lectura interactiva (`/lectura`)

| Elemento | Estado | Nota |
| --- | --- | --- |
| Contenido | ⚠️ | Textos hardcodeados (Don Quijote y un segundo texto); el libro elegido solo cambia el título. |
| Tamaño de fuente (4) y modo claro/sepia/noche | ⚠️ | Funcionan en memoria; **no persisten**. |
| Navegación de folios y barra de progreso | ✅ | |
| Glosario lateral | ✅ | Datos fijos. |
| Trivia por folio | ✅ | Valida la opción, suma 100 pts y registra el evento en `localStorage`. |
| Guardado del avance | ❌ | Se pierde al recargar o salir. |
| Bloqueo por "seguridad académica" | ⚠️ | Se activa al perder el foco o por inactividad; es agresivo (cambiar de ventana pausa la lectura). |
| Fin de lectura | 🎨 | `alert` y navegación al historial; no se guarda como "completado". |

## Recomendaciones (`/recomendaciones`)

| Elemento | Estado | Nota |
| --- | --- | --- |
| Tarjetas de recomendación | ⚠️ | Salen del catálogo completo, sin personalización. |
| "% de afinidad" | 🎨 | Valores fijos por posición (`98/96/94/91/89 %`). |
| Chips de intención | ✅ | Filtran por coincidencia simple de etiqueta/género. |
| "Solicitar / Reservar" | ✅ | Crea solicitud local + `alert`. |
| "Continuar leyendo" | ✅ | Usa el último préstamo activo. |
| Líneas de investigación sugeridas | 🎨 | Datos estáticos. |
| Motor TF-IDF / KNN | ❌ | Tarea 5. |

## Historial (`/historial`)

| Elemento | Estado | Nota |
| --- | --- | --- |
| Vista estudiante (pestañas todos/préstamos/devoluciones/terminados) | ✅ | Sobre `localStorage`; "Devolver" actualiza el estado. |
| Estadísticas (obras, tiempo estimado, préstamos activos) | ✅ | Calculadas desde los movimientos. |
| "Estado académico: Al día" | 🎨 | Valor fijo. |
| Filtro por período | 🎨 | Tiene estado pero no filtra. |
| Exportar CSV / PDF | 🎨 | Solo `alert`; no genera archivo. |
| Vista bibliotecario (bitácora) | ✅ | Solicitudes aprobadas/rechazadas + libros incorporados, con pestañas. |
| "Certificado de lectura" | 🎨 | Solo `alert`. |
| Fechas y vencimientos | ⚠️ | Se generan al crear el registro; no hay vencimientos ni renovaciones reales. |

## Transversal

| Tema | Estado | Nota |
| --- | --- | --- |
| Protección de rutas | ❌ | Todo el portal se abre sin sesión. Tarea 1. |
| Datos compartidos entre usuarios | ❌ | Todo vive en el navegador; no hay Firestore. Tareas 1–3. |
| Página 404 propia | ✅ | Nueva en esta tarea. |
| ErrorBoundary global | ✅ | Nuevo en esta tarea. |
| Página 404 / errores de red | ⚠️ | 404 y ErrorBoundary listos; no hay manejo de errores de red porque no hay red todavía. |
| Responsive | ❌ | Overflow horizontal en móvil (sidebar fijo). Tarea 7. |
| Accesibilidad | ⚠️ | Hay `aria-label` en secciones y botones de vista, pero varios `select` no tienen etiqueta asociada y el foco visible es parcial. Tarea 8. |
| Rendimiento | ⚠️ | Sin carga diferida de rutas; bundle único de ~383 kB. Tarea 8. |
| Pruebas | ❌ | Sin framework de tests. Tarea 5 en adelante. |
| Datos sin usar | ⚠️ | `src/data/history.js` no lo importa ninguna pantalla (candidato a semilla de Firestore en Tarea 2). |
