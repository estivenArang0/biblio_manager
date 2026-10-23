# Biblio Manager

Portal bibliotecario del **Tecnológico de Antioquia I.U.** para consultar el acervo, reservar y prestar libros, leer de forma interactiva y recibir recomendaciones personalizadas.

Proyecto integrador (PPI) de la asignatura **Lógica de Programación**.

- **Autores:** Luis Alejandro Herrera, Joselin Paola Lisboa, Juan Estiven Salas
- **Repositorio:** <https://github.com/estivenArang0/biblio_manager>

---

## Roles del sistema

| Rol | Descripción | Permisos previstos |
| --- | --- | --- |
| **Estudiante** | Usuario final del portal. | Consultar catálogo, reservar/préstamos, lectura interactiva, recomendaciones e historial propio. |
| **Docente** | Usuario final con beneficios extendidos. | Igual que estudiante, con plazos de préstamo más amplios. |
| **Bibliotecario** | Administra el acervo y los préstamos. | Todo lo anterior + gestión del catálogo, aprobación de solicitudes, historial de todos los usuarios y administración de contenido. |

## Stack

- **React 19** + **Vite 8**
- **React Router 7**
- **Tailwind CSS 3** con tokens Material 3 definidos en `tailwind.config.js`
- **Firebase 12** (Auth + Firestore). Configuración vía variables de entorno.
- **Oxlint** como linter

## Requisitos

- Node.js **20.19+** o **22.12+** (requisito de Vite 8)
- npm 10+
- Un proyecto de Firebase (opcional para el modo demostración)

## Puesta en marcha

```bash
# 1. Clonar e instalar
git clone https://github.com/estivenArang0/biblio_manager.git
cd biblio_manager
npm install

# 2. Configurar Firebase
cp .env.example .env      # en Windows: copy .env.example .env
# Edita .env con los valores de tu proyecto Firebase

# 3. Arrancar en desarrollo
npm run dev               # http://localhost:5173
```

## Variables de entorno

Todas se obtienen en la consola de Firebase → **Configuración del proyecto → Tus apps → Configuración del SDK**.

| Variable | Ejemplo / descripción |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `mi-proyecto.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `mi-proyecto` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `mi-proyecto.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `930802451691` |
| `VITE_FIREBASE_APP_ID` | `1:930802451691:web:...` |

> La configuración web de Firebase **no es un secreto**; la seguridad real vive en las reglas de Firestore.
> Aun así, `.env` está en `.gitignore` para poder usar proyectos distintos en local y en producción.
> Sin `.env` la interfaz arranca en **modo demostración** (datos en `localStorage`) y la consola avisa de las variables faltantes.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR. |
| `npm run build` | Build de producción en `dist/`. |
| `npm run preview` | Sirve el build de producción localmente. |
| `npm run lint` | Ejecuta Oxlint sobre todo el proyecto. |

## Estructura de carpetas

```
src/
  components/          Componentes reutilizables (Header, Sidebar, BookCard, ErrorBoundary, ...)
  context/             Contextos de React (AuthContext en Tarea 1)
  data/                Datos semilla actuales (catálogo, recomendaciones, historial)
  hooks/               Hooks personalizados (useBooks, useAuth, ...)
  layouts/             Layouts de la aplicación (Header + Sidebar + Outlet)
  pages/               Pantallas: Login, Catálogo, Lectura, Recomendaciones, Historial, 404
  services/            Acceso a servicios externos (firebase.js, futuros servicios de datos)
  utils/               Utilidades puras (texto, almacenamiento local)
  App.jsx              Definición de rutas
  main.jsx             Punto de entrada + ErrorBoundary
public/                Estáticos servidos tal cual
```

## Estado actual

El repositorio está en proceso de migración desde un **prototipo con datos locales** hacia una aplicación con **Firebase Auth + Firestore**.

- ✅ Navegación, layout, catálogo con filtros y paginación, panel de solicitudes del bibliotecario, historial y lectura interactiva funcionan sobre `localStorage`.
- 🔜 Autenticación real, modelo de datos en Firestore, reservas transaccionales y asistente conversacional están planificados por tareas (ramas `feat/tarea-*`).

### Usuarios de demostración

Mientras la autenticación real no esté conectada, el login permite elegir un rol y usa la contraseña `123456` con cualquiera de estos correos:

| Rol | Correo |
| --- | --- |
| Estudiante | `estudiante@tdea.edu.co` |
| Docente | `profesor.jaramillo@tdea.edu.co` |
| Bibliotecario | `bibliotecario.central@tdea.edu.co` |

> ⚠️ Estas credenciales son solo para el prototipo local y desaparecen al implementar Firebase Auth (Tarea 1).

## Convenciones de desarrollo

- Ramas por tarea: `feat/tarea-N-nombre-corto` creadas desde `main`.
- Antes de cerrar un cambio: `npm run lint` y `npm run build` en limpio.
- Textos visibles al usuario en **español**; código en inglés cuando el nombre técnico lo amerite.
- No se versionan secretos ni archivos `.env`.
