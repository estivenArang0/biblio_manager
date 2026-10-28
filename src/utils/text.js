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
