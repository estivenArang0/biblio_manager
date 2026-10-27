/** Utilidades de fechas, texto y respuestas HTTP compartidas por el backend. */

export const ROLES = ['Lector', 'Bibliotecario']
export const STAFF = ['Bibliotecario']
export const READERS = ['Lector']

/** Fecha local en formato YYYY-MM-DD. */
export function ymd(date = new Date()) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + Number(days))
  return ymd(d)
}

/** Diferencia en días completos entre dos fechas YYYY-MM-DD (b - a). */
export function diffDays(a, b) {
  const da = new Date(`${a}T12:00:00`).getTime()
  const db = new Date(`${b}T12:00:00`).getTime()
  return Math.round((db - da) / 86400000)
}

export function nowISO() {
  return new Date().toISOString()
}

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function csvEscape(value) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}
