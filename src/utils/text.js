/**
 * Normaliza texto para búsquedas y comparaciones:
 * minúsculas, sin tildes/diacríticos y sin espacios sobrantes.
 *
 * @param {unknown} value Texto de entrada (null/undefined se tratan como '').
 * @returns {string}
 */
export function normalizarTexto(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Comprueba si `texto` contiene `termino` ignorando mayúsculas y tildes.
 *
 * @param {unknown} texto
 * @param {unknown} termino
 * @returns {boolean}
 */
export function contieneTexto(texto, termino) {
  const buscado = normalizarTexto(termino)
  if (!buscado) return true
  return normalizarTexto(texto).includes(buscado)
}

/**
 * Genera un identificador único legible para movimientos locales
 * (evita depender de Date.now() dentro del render).
 *
 * @param {string} prefijo
 * @returns {string}
 */
export function generarId(prefijo = 'id') {
  const marca = Date.now().toString(36)
  const azar = Math.random().toString(36).slice(2, 8)
  return `${prefijo}-${marca}-${azar}`
}
