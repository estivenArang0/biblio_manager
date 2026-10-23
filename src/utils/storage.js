/**
 * Utilidades de persistencia local.
 *
 * La versión actual del portal guarda sesión, catálogo y movimientos en
 * localStorage. Estas funciones centralizan el acceso para que la migración a
 * Firestore (Tareas 1–3) se haga cambiando un solo módulo.
 */

/**
 * Lee y parsea un valor JSON de localStorage sin romper la aplicación.
 *
 * @template T
 * @param {string} clave
 * @param {T} defecto Valor devuelto si no existe o si el JSON es inválido.
 * @returns {T}
 */
export function leerJSON(clave, defecto) {
  try {
    const guardado = localStorage.getItem(clave)
    if (!guardado) return defecto
    return JSON.parse(guardado)
  } catch (error) {
    console.warn(`[storage] No se pudo leer "${clave}":`, error)
    return defecto
  }
}

/**
 * Serializa y guarda un valor en localStorage.
 *
 * @param {string} clave
 * @param {unknown} valor
 * @returns {boolean} `true` si se guardó correctamente.
 */
export function escribirJSON(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
    return true
  } catch (error) {
    console.warn(`[storage] No se pudo guardar "${clave}":`, error)
    return false
  }
}

/**
 * Lee la sesión del portal (`usuario_biblio`).
 *
 * @returns {{ nombre?: string, correo?: string, email?: string, rol?: string } | null}
 */
export function leerSesion() {
  const sesion = leerJSON('usuario_biblio', null)
  return sesion && typeof sesion === 'object' ? sesion : null
}

/**
 * Notifica a los componentes de la misma ventana que localStorage cambió
 * (el evento nativo `storage` solo se dispara en otras pestañas).
 */
export function notificarCambioStorage() {
  window.dispatchEvent(new Event('storage'))
}
