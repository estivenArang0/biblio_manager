import { createServer as createHttpServer } from 'node:http'
import { createToken, hashPassword, verifyPassword } from './auth.js'
import { getDb } from './db.js'
import { buildGenericPages } from './seed.js'
import {
  READERS,
  ROLES,
  STAFF,
  addDays,
  csvEscape,
  diffDays,
  nowISO,
  slugify,
  ymd,
} from './util.js'

const db = getDb()
const SESSION_HOURS = 12
const MAX_BODY_BYTES = 512 * 1024
const HIGHLIGHT_COLORS = ['amarillo', 'verde', 'azul']
const idleSeconds = Number(process.env.SESSION_IDLE_SECONDS || 0)
const idleMinutes = Number(process.env.SESSION_IDLE_MINUTES || 30)
const SESSION_IDLE_MS = idleSeconds > 0 ? idleSeconds * 1000 : idleMinutes * 60 * 1000

/* ------------------------------------------------------------------ *
 * Utilidades HTTP
 * ------------------------------------------------------------------ */

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...extraHeaders,
  })
  res.end(body)
}

function sendText(res, status, body, contentType, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  })
  res.end(body)
}

function httpError(status, message, extra = {}) {
  const error = new Error(message)
  error.status = status
  error.extra = extra
  return error
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(httpError(413, 'El cuerpo de la solicitud es demasiado grande.'))
        req.destroy()
        return
      }
      raw += chunk
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return reject(httpError(400, 'Se esperaba un objeto JSON.'))
        }
        resolve(parsed)
      } catch {
        reject(httpError(400, 'JSON inválido.'))
      }
    })
    req.on('error', reject)
  })
}

function bearerToken(req) {
  const header = req.headers.authorization || ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match ? match[1].trim() : null
}

function sessionUser(req) {
  const token = bearerToken(req)
  if (!token) return null
  const row = db
    .prepare(
      `SELECT u.id, u.nombre, u.correo, u.rol, s.expires_at, s.last_seen_at, s.created_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token = ?`
    )
    .get(token)
  if (!row) return null
  const now = Date.now()
  const lastSeen = new Date(row.last_seen_at || row.created_at).getTime()
  if (
    row.expires_at <= nowISO() ||
    !Number.isFinite(lastSeen) ||
    now - lastSeen > SESSION_IDLE_MS
  ) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
    throw httpError(401, 'Tu sesión venció por inactividad.', { code: 'SESSION_IDLE' })
  }
  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token = ?').run(nowISO(), token)
  return { id: row.id, nombre: row.nombre, correo: row.correo, rol: row.rol, token }
}

function publicUser(row) {
  return { id: row.id, nombre: row.nombre, correo: row.correo, rol: row.rol }
}

function createSession(userId) {
  const token = createToken()
  const created = nowISO()
  const expires = new Date(Date.now() + SESSION_HOURS * 3600 * 1000).toISOString()
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(created)
  db.prepare(
    'INSERT INTO sessions (token, user_id, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(token, userId, created, created, expires)
  return token
}

/* ------------------------------------------------------------------ *
 * Mapeos de dominio
 * ------------------------------------------------------------------ */

function parsePages(row) {
  try {
    const pages = JSON.parse(row.pages_json)
    return Array.isArray(pages) ? pages : []
  } catch {
    return []
  }
}

function availabilityLabel(book) {
  if (Number(book.copies_available) <= 0) return 'Sin ejemplares disponibles'
  if (book.digital && book.physical) return 'Digital y físico'
  if (book.digital) return 'Préstamo digital'
  return 'Físico · retiro en biblioteca'
}

function loanStatus(row, today = ymd()) {
  if (row.status === 'pendiente') return 'pendiente'
  if (row.returned_at || row.status === 'devuelto') return 'devuelto'
  if (!row.due_date) return row.status || 'activo'
  if (row.due_date < today) return 'vencido'
  return 'activo'
}

function loanDto(row, options = {}) {
  const status = loanStatus(row)
  const book = options.book || db.prepare('SELECT * FROM books WHERE id = ?').get(row.book_id)
  const user = options.user
    ? options.user
    : db
        .prepare('SELECT id, nombre, correo, rol FROM users WHERE id = ?')
        .get(row.user_id)
  const today = ymd()
  return {
    id: row.id,
    bookId: row.book_id,
    title: book?.title || '',
    author: book?.author || '',
    image: book?.image || '',
    signature: book?.signature || '',
    format: book?.format || '',
    digital: Boolean(book?.digital),
    physical: Boolean(book?.physical),
    pageCount: book ? parsePages(book).length : 0,
    status,
    loanDate: row.loan_date || null,
    dueDate: row.due_date || null,
    returnedAt: row.returned_at || null,
    requestedDays: row.requested_days || null,
    daysLeft: row.due_date ? diffDays(today, row.due_date) : null,
    user: user
      ? { id: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol }
      : null,
  }
}

function myLoanFor(userId, bookId) {
  const row = db
    .prepare(
      `SELECT * FROM loans WHERE user_id = ? AND book_id = ?
        ORDER BY id DESC LIMIT 1`
    )
    .get(userId, bookId)
  if (!row) return null
  const status = loanStatus(row)
  if (status === 'devuelto') return null
  return { id: row.id, status, dueDate: row.due_date, daysLeft: row.due_date ? diffDays(ymd(), row.due_date) : null }
}

function bookDto(row, user) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    tag: row.tag,
    genre: row.genre,
    isbn: row.isbn,
    signature: row.signature,
    year: row.year,
    format: row.format,
    digital: Boolean(row.digital),
    physical: Boolean(row.physical),
    image: row.image,
    description: row.description,
    copiesTotal: Number(row.copies_total ?? 0),
    copiesAvailable: Number(row.copies_available ?? 0),
    pageCount: parsePages(row).length,
    availabilityLabel: availabilityLabel(row),
    myLoan: user && READERS.includes(user.rol) ? myLoanFor(user.id, row.id) : null,
  }
}

function activeLoanFor(userId, bookId) {
  const rows = db
    .prepare('SELECT * FROM loans WHERE user_id = ? AND book_id = ? ORDER BY id DESC')
    .all(userId, bookId)
  return rows.find((row) => loanStatus(row) === 'activo') || null
}

function requireReadingAccess(user, bookId) {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId)
  if (!book) throw httpError(404, 'El libro no existe.')
  if (!book.digital) {
    throw httpError(403, 'Este ejemplar solo está disponible en físico, no para lectura digital.')
  }
  const loan = activeLoanFor(user.id, bookId)
  if (!loan) {
    throw httpError(403, 'No tienes un préstamo activo y vigente de este libro.')
  }
  return { book, loan }
}

function withTransaction(callback) {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = callback()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function takeCopy(bookId) {
  const info = db
    .prepare('UPDATE books SET copies_available = copies_available - 1 WHERE id = ? AND copies_available > 0')
    .run(bookId)
  if (info.changes === 0) {
    throw httpError(409, 'No hay ejemplares disponibles de este libro.')
  }
}

function releaseCopy(bookId) {
  db.prepare(
    'UPDATE books SET copies_available = MIN(copies_total, copies_available + 1) WHERE id = ?'
  ).run(bookId)
}

function overdueLoansFor(userId) {
  return db
    .prepare(
      `SELECT id FROM loans
        WHERE user_id = ? AND status <> 'pendiente' AND returned_at IS NULL AND due_date < ?`
    )
    .all(userId, ymd()).length
}

function hasOpenLoan(userId, bookId) {
  const rows = db
    .prepare('SELECT * FROM loans WHERE user_id = ? AND book_id = ? ORDER BY id DESC')
    .all(userId, bookId)
  return rows.find((row) => ['activo', 'vencido', 'pendiente'].includes(loanStatus(row))) || null
}

function pageToBlock(page) {
  const trivia = page?.trivia || {}
  return {
    chapter: page?.chapter || '',
    text: Array.isArray(page?.paragraphs) ? page.paragraphs.join('\n\n') : '',
    question: trivia.question || '',
    options: Array.isArray(trivia.options) ? trivia.options.map((option) => option.text) : [],
    correctOption: trivia.correctOption || 'A',
    explanation: trivia.explanation || '',
  }
}

function blocksToPages(blocks, previousPages = []) {
  return blocks.map((block, index) => {
    const paragraphs = String(block.text || '')
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
    const options = (block.options || [])
      .map((text, optionIndex) => ({
        id: String.fromCharCode(65 + optionIndex),
        text: String(text || '').trim(),
        hint: '',
      }))
      .filter((option) => option.text)
    const question = String(block.question || '').trim()
    const trivia =
      question && options.length >= 2
        ? {
            question,
            correctOption: String(block.correctOption || 'A').toUpperCase(),
            options,
            explanation: String(block.explanation || '').trim(),
          }
        : question
          ? { type: 'reflection', question, explanation: String(block.explanation || '').trim() }
          : null
    return {
      folio: index + 1,
      chapter: String(block.chapter || `BLOQUE ${index + 1}`).trim(),
      paragraphs,
      trivia,
      glossary: previousPages[index]?.glossary || [],
    }
  })
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function highlightDto(row) {
  return {
    id: row.id,
    bookId: row.book_id,
    page: row.page,
    blockIndex: row.block_index,
    startOffset: row.start_offset,
    endOffset: row.end_offset,
    text: row.text,
    color: row.color,
    note: row.note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function messageDto(row, currentUserId) {
  return {
    id: row.id,
    from: row.from_user,
    to: row.to_user,
    text: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
    mine: row.from_user === currentUserId,
  }
}

function adminIds() {
  return db
    .prepare("SELECT id FROM users WHERE rol = 'Administrador'")
    .all()
    .map((row) => row.id)
}

function placeholders(count) {
  return Array.from({ length: count }, () => '?').join(',')
}

function cleanText(value, maxLength, field = 'texto') {
  const text = String(value ?? '').trim()
  if (!text) throw httpError(400, `El ${field} es obligatorio.`)
  if (text.length > maxLength) {
    throw httpError(400, `El ${field} no puede superar ${maxLength} caracteres.`)
  }
  return text
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''))
}

function deriveFlags(format) {
  const f = String(format || '').toLowerCase()
  if (f.includes('digital') && (f.includes('físico') || f.includes('fisico'))) {
    return { digital: 1, physical: 1 }
  }
  if (f.includes('digital') || f.includes('audiolibro')) return { digital: 1, physical: 0 }
  return { digital: 0, physical: 1 }
}

/* ------------------------------------------------------------------ *
 * Reportes
 * ------------------------------------------------------------------ */

function buildReportRows({ scope = 'todos', from = '', to = '', status = '' } = {}) {
  const clauses = ['l.loan_date IS NOT NULL']
  const params = []
  if (scope === 'estudiantes') {
    clauses.push("u.rol = 'Estudiante'")
  } else if (scope === 'docentes') {
    clauses.push("u.rol = 'Docente'")
  }
  if (from) {
    clauses.push('l.loan_date >= ?')
    params.push(from)
  }
  if (to) {
    clauses.push('l.loan_date <= ?')
    params.push(to)
  }
  const rows = db
    .prepare(
      `SELECT l.*, u.nombre AS user_nombre, u.correo AS user_correo, u.rol AS user_rol,
              b.title, b.author, b.image
         FROM loans l
         JOIN users u ON u.id = l.user_id
         JOIN books b ON b.id = l.book_id
        WHERE ${clauses.join(' AND ')}
        ORDER BY l.loan_date DESC, l.id DESC`
    )
    .all(...params)

  const mapped = rows.map((row) => ({
    id: row.id,
    user: {
      id: row.user_id,
      nombre: row.user_nombre,
      correo: row.user_correo,
      rol: row.user_rol,
    },
    book: { id: row.book_id, title: row.title, author: row.author, image: row.image },
    loanDate: row.loan_date,
    dueDate: row.due_date,
    returnedAt: row.returned_at,
    status: loanStatus(row),
  }))

  const filtered = status ? mapped.filter((row) => row.status === status) : mapped
  const totals = {
    total: filtered.length,
    activos: filtered.filter((row) => row.status === 'activo').length,
    vencidos: filtered.filter((row) => row.status === 'vencido').length,
    devueltos: filtered.filter((row) => row.status === 'devuelto').length,
  }
  return { rows: filtered, totals }
}

/* ------------------------------------------------------------------ *
 * Rutas
 * ------------------------------------------------------------------ */

const routes = []
function route(method, path, roles, handler, options = {}) {
  routes.push({
    method,
    parts: path.split('/').filter(Boolean),
    roles,
    handler,
    public: Boolean(options.public),
    status: options.status || 200,
  })
}

function matchRoute(method, pathname) {
  const parts = pathname.split('/').filter(Boolean)
  for (const candidate of routes) {
    if (candidate.method !== method || candidate.parts.length !== parts.length) continue
    const params = {}
    let matches = true
    for (let i = 0; i < parts.length; i += 1) {
      const expected = candidate.parts[i]
      if (expected.startsWith(':')) params[expected.slice(1)] = decodeURIComponent(parts[i])
      else if (expected !== parts[i]) {
        matches = false
        break
      }
    }
    if (matches) return { route: candidate, params }
  }
  return null
}

/* --- Autenticación ------------------------------------------------- */

route(
  'POST',
  'auth/login',
  null,
  ({ body }) => {
    const correo = String(body.correo || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (!correo || !password) throw httpError(400, 'Correo y contraseña son obligatorios.')
    const user = db.prepare('SELECT * FROM users WHERE correo = ?').get(correo)
    if (!user || !verifyPassword(password, user.password_hash)) {
      throw httpError(401, 'Credenciales inválidas. Verifica tu correo y contraseña.')
    }
    const token = createSession(user.id)
    return { token, user: publicUser(user) }
  },
  { public: true }
)

route('POST', 'auth/logout', null, ({ user }) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(user.token)
  return { ok: true }
})

route('GET', 'auth/me', null, ({ user }) => ({ user: publicUser(user) }))

route('PATCH', 'auth/password', null, ({ body, user }) => {
  const currentPassword = String(body.currentPassword || '')
  const newPassword = String(body.newPassword || '')
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)
  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    throw httpError(400, 'La contraseña actual no es correcta.')
  }
  if (newPassword.length < 8) {
    throw httpError(400, 'La nueva contraseña debe tener al menos 8 caracteres.')
  }
  if (newPassword === currentPassword) {
    throw httpError(400, 'La nueva contraseña debe ser diferente a la actual.')
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(newPassword), user.id)
  // Se invalidan las demás sesiones; la actual se conserva.
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND token <> ?').run(user.id, user.token)
  return { ok: true }
})

/* --- Catálogo ------------------------------------------------------ */

route('GET', 'books', null, ({ user }) => {
  const rows = db.prepare('SELECT * FROM books ORDER BY title COLLATE NOCASE').all()
  return { books: rows.map((row) => bookDto(row, user)) }
})

route('POST', 'books', STAFF, ({ body, user }) => {
  const title = cleanText(body.title, 200, 'título')
  const author = cleanText(body.author, 160, 'autor')
  const format = String(body.format || 'Digital').trim()
  const flags = deriveFlags(format)
  const copiesTotal = Math.max(1, Math.min(999, Number(body.copiesTotal) || 3))
  const baseId = slugify(title) || 'libro'
  let id = baseId
  let suffix = 1
  while (db.prepare('SELECT 1 FROM books WHERE id = ?').get(id)) {
    suffix += 1
    id = `${baseId}-${suffix}`
  }
  const book = {
    id,
    title,
    author,
    tag: String(body.genre || body.tag || 'General').trim().slice(0, 80),
    genre: String(body.genre || body.tag || 'General').trim().slice(0, 80),
    isbn: String(body.isbn || '').trim().slice(0, 40),
    signature: String(body.signature || '').trim().slice(0, 60),
    year: String(body.year || new Date().getFullYear()).trim().slice(0, 20),
    format,
    digital: flags.digital,
    physical: flags.physical,
    image:
      String(body.image || '').trim() ||
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    description: String(body.description || '').trim().slice(0, 600),
    copiesTotal,
  }
  const pages = buildGenericPages(book)
  db.prepare(
    `INSERT INTO books (id, title, author, tag, genre, isbn, signature, year, format, digital, physical, image, description, copies_total, copies_available, pages_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    book.id,
    book.title,
    book.author,
    book.tag,
    book.genre,
    book.isbn,
    book.signature,
    book.year,
    book.format,
    book.digital,
    book.physical,
    book.image,
    book.description,
    book.copiesTotal,
    book.copiesTotal,
    JSON.stringify(pages),
    nowISO()
  )
  const inserted = db.prepare('SELECT * FROM books WHERE id = ?').get(book.id)
  return { book: bookDto(inserted, user) }
}, { status: 201 })

route('PUT', 'books/:id', STAFF, ({ params, body, user }) => {
  const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(params.id)
  if (!existing) throw httpError(404, 'El libro no existe.')
  const title = cleanText(body.title ?? existing.title, 200, 'título')
  const author = cleanText(body.author ?? existing.author, 160, 'autor')
  const format = String(body.format ?? existing.format).trim()
  const flags = deriveFlags(format)
  const activeLoans = db
    .prepare(
      `SELECT COUNT(*) AS total FROM loans
        WHERE book_id = ? AND returned_at IS NULL AND status <> 'pendiente'`
    )
    .get(existing.id).total
  const copiesTotal =
    body.copiesTotal === undefined
      ? existing.copies_total
      : Math.max(activeLoans, Math.min(999, Number(body.copiesTotal) || existing.copies_total))
  const copiesAvailable =
    body.copiesTotal === undefined ? existing.copies_available : copiesTotal - activeLoans
  db.prepare(
    `UPDATE books SET title = ?, author = ?, tag = ?, genre = ?, isbn = ?, signature = ?,
            year = ?, format = ?, digital = ?, physical = ?, image = ?, description = ?,
            copies_total = ?, copies_available = ?
      WHERE id = ?`
  ).run(
    title,
    author,
    String(body.genre ?? existing.tag ?? 'General').slice(0, 80),
    String(body.genre ?? existing.genre ?? 'General').slice(0, 80),
    String(body.isbn ?? existing.isbn ?? '').slice(0, 40),
    String(body.signature ?? existing.signature ?? '').slice(0, 60),
    String(body.year ?? existing.year ?? '').slice(0, 20),
    format,
    flags.digital,
    flags.physical,
    String(body.image ?? existing.image ?? '').slice(0, 500),
    String(body.description ?? existing.description ?? '').slice(0, 600),
    copiesTotal,
    Math.max(0, copiesAvailable),
    existing.id
  )
  const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(existing.id)
  return { book: bookDto(updated, user) }
})

/* --- Metadatos de Google Books y contenido de lectura -------------- */

const GOOGLE_BOOKS_URL =
  process.env.GOOGLE_BOOKS_URL || 'https://www.googleapis.com/books/v1/volumes'

route('GET', 'books/isbn/:isbn', STAFF, async ({ params }) => {
  const isbn = String(params.isbn || '').replace(/[-\s]/g, '').toUpperCase()
  if (!/^\d{9}[\dX]$/.test(isbn) && !/^\d{13}$/.test(isbn)) {
    throw httpError(400, 'El ISBN debe tener 10 o 13 caracteres.')
  }
  try {
    const response = await fetch(`${GOOGLE_BOOKS_URL}?q=isbn:${encodeURIComponent(isbn)}`, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return { found: false }
    const payload = await response.json()
    const info = payload?.items?.[0]?.volumeInfo
    if (!info) return { found: false }
    return {
      found: true,
      data: {
        isbn,
        title: String(info.title || '').slice(0, 200),
        author: Array.isArray(info.authors) ? info.authors.join(', ').slice(0, 160) : '',
        genre: Array.isArray(info.categories) ? info.categories.join(' / ').slice(0, 80) : '',
        description: stripHtml(info.description || '').slice(0, 1200),
        image: String(info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '').replace(
          /^http:/,
          'https:'
        ),
        year: String(info.publishedDate || '').slice(0, 4),
      },
    }
  } catch {
    return { found: false }
  }
})

route('GET', 'books/:id/content', STAFF, ({ params }) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(params.id)
  if (!book) throw httpError(404, 'El libro no existe.')
  const pages = parsePages(book)
  return {
    book: { id: book.id, title: book.title, author: book.author },
    blocks: pages.map(pageToBlock),
    total: pages.length,
  }
})

route('PUT', 'books/:id/content', STAFF, ({ params, body }) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(params.id)
  if (!book) throw httpError(404, 'El libro no existe.')
  const blocks = Array.isArray(body.blocks) ? body.blocks : []
  if (blocks.length < 1 || blocks.length > 60) {
    throw httpError(400, 'Agrega entre 1 y 60 bloques de lectura.')
  }
  for (const block of blocks) {
    if (!String(block.text || '').trim()) throw httpError(400, 'Cada bloque necesita texto.')
    if (String(block.text).length > 20000) {
      throw httpError(400, 'Cada bloque puede tener como máximo 20.000 caracteres.')
    }
    if (String(block.question || '').length > 500) {
      throw httpError(400, 'La pregunta de cada bloque no puede superar 500 caracteres.')
    }
    const filledOptions = (block.options || []).filter((option) => String(option || '').trim())
    if (block.question && filledOptions.length > 0 && filledOptions.length < 3) {
      throw httpError(400, 'Completa las 3 opciones o deja la pregunta sin opciones (reflexión).')
    }
  }
  const previousPages = parsePages(book)
  const pages = blocksToPages(blocks, previousPages)
  db.prepare('UPDATE books SET pages_json = ? WHERE id = ?').run(JSON.stringify(pages), book.id)
  return { ok: true, blocks: pages.map(pageToBlock), total: pages.length }
})

/* --- Préstamos ----------------------------------------------------- */

route('GET', 'loans/mine', READERS, ({ user }) => {
  const rows = db
    .prepare(
      `SELECT l.*, b.title, b.author, b.image, b.signature, b.format, b.digital, b.physical
         FROM loans l JOIN books b ON b.id = l.book_id
        WHERE l.user_id = ?
        ORDER BY l.id DESC`
    )
    .all(user.id)
  const loans = rows.map((row) => loanDto(row, { user }))
  return {
    loans,
    active: loans.filter((loan) => loan.status === 'activo' || loan.status === 'vencido'),
    pending: loans.filter((loan) => loan.status === 'pendiente'),
  }
})

route('GET', 'loans/pending', STAFF, () => {
  const rows = db
    .prepare(
      `SELECT l.*, b.title, b.author, b.image, b.signature, b.format, b.digital, b.physical
         FROM loans l JOIN books b ON b.id = l.book_id
        WHERE l.status = 'pendiente'
        ORDER BY l.id ASC`
    )
    .all()
  return { loans: rows.map((row) => loanDto(row)) }
})

route('GET', 'loans', STAFF, ({ query }) => {
  const { rows } = buildReportRows({
    scope: 'todos',
    from: query.from || '',
    to: query.to || '',
    status: query.status || '',
  })
  return { loans: rows }
})

route('GET', 'loans/direct/options', STAFF, ({ query }) => {
  const fold = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  const userQuery = fold(query.userQuery || '')
  const bookQuery = fold(query.bookQuery || '')

  const users = db
    .prepare(
      `SELECT id, nombre, correo, rol FROM users
        WHERE rol IN ('Estudiante','Docente')
        ORDER BY nombre COLLATE NOCASE`
    )
    .all()
    .filter(
      (user) =>
        !userQuery ||
        fold(user.nombre).includes(userQuery) ||
        fold(user.correo).includes(userQuery)
    )
    .slice(0, 12)
    .map((user) => ({ ...publicUser(user), overdue: overdueLoansFor(user.id) }))

  const books = db
    .prepare('SELECT * FROM books ORDER BY title COLLATE NOCASE')
    .all()
    .filter(
      (book) =>
        !bookQuery ||
        fold(book.title).includes(bookQuery) ||
        fold(book.isbn).includes(bookQuery) ||
        fold(book.author).includes(bookQuery)
    )
    .slice(0, 12)
    .map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      signature: book.signature,
      digital: Boolean(book.digital),
      copiesTotal: Number(book.copies_total),
      copiesAvailable: Number(book.copies_available),
    }))

  return { users, books }
})

route('POST', 'loans/direct', STAFF, ({ body, user }) => {
  const borrower = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(body.userId))
  if (!borrower) throw httpError(404, 'El usuario no existe.')
  if (!READERS.includes(borrower.rol)) {
    throw httpError(400, 'Solo se pueden prestar libros a estudiantes o docentes.')
  }
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(String(body.bookId || ''))
  if (!book) throw httpError(404, 'El libro no existe.')
  if (Number(book.copies_available) <= 0) {
    throw httpError(409, 'No hay ejemplares disponibles de este libro.')
  }
  const overdue = overdueLoansFor(borrower.id)
  if (overdue > 0) {
    throw httpError(
      409,
      `${borrower.nombre} tiene ${overdue} préstamo${overdue === 1 ? '' : 's'} vencido${overdue === 1 ? '' : 's'}. Regulariza la situación antes de un nuevo préstamo.`
    )
  }
  if (hasOpenLoan(borrower.id, book.id)) {
    throw httpError(409, 'El usuario ya tiene un préstamo o solicitud de este libro.')
  }
  const today = ymd()
  const requested = String(body.dueDate || '').trim()
  const dueDate = requested || addDays(today, 15)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(`${dueDate}T12:00:00`))) {
    throw httpError(400, 'La fecha límite no es válida.')
  }
  if (dueDate < today) throw httpError(400, 'La fecha límite no puede ser anterior a hoy.')
  const days = diffDays(today, dueDate)

  const loan = withTransaction(() => {
    takeCopy(book.id)
    const info = db
      .prepare(
        `INSERT INTO loans (book_id, user_id, status, loan_date, due_date, requested_days, approved_by, created_at)
         VALUES (?, ?, 'activo', ?, ?, ?, ?, ?)`
      )
      .run(book.id, borrower.id, today, dueDate, days, user.id, nowISO())
    return db.prepare('SELECT * FROM loans WHERE id = ?').get(info.lastInsertRowid)
  })

  return { loan: loanDto(loan, { user: borrower, book }) }
}, { status: 201 })

route('POST', 'loans', READERS, ({ body, user }) => {
  const bookId = String(body.bookId || '')
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId)
  if (!book) throw httpError(404, 'El libro no existe.')
  const existing = db
    .prepare(
      `SELECT * FROM loans WHERE user_id = ? AND book_id = ?
        ORDER BY id DESC LIMIT 1`
    )
    .get(user.id, bookId)
  if (existing) {
    const status = loanStatus(existing)
    if (status === 'pendiente') throw httpError(409, 'Ya tienes una solicitud pendiente de este libro.')
    if (status === 'activo' || status === 'vencido') {
      throw httpError(409, 'Ya tienes un préstamo de este libro.')
    }
  }
  const days = user.rol === 'Docente' ? 30 : 8
  const info = db
    .prepare(
      `INSERT INTO loans (book_id, user_id, status, requested_days, created_at)
       VALUES (?, ?, 'pendiente', ?, ?)`
    )
    .run(bookId, user.id, days, nowISO())
  const created = db.prepare('SELECT * FROM loans WHERE id = ?').get(info.lastInsertRowid)
  return { loan: loanDto(created, { user, book }) }
}, { status: 201 })

route('PATCH', 'loans/:id/approve', STAFF, ({ params, user }) => {
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(Number(params.id))
  if (!loan) throw httpError(404, 'El préstamo no existe.')
  if (loan.status !== 'pendiente') throw httpError(409, 'Solo se pueden aprobar solicitudes pendientes.')
  const borrower = db.prepare('SELECT * FROM users WHERE id = ?').get(loan.user_id)
  const days = loan.requested_days || (borrower?.rol === 'Docente' ? 30 : 8)
  const today = ymd()
  withTransaction(() => {
    takeCopy(loan.book_id)
    db.prepare(
      `UPDATE loans SET status = 'activo', loan_date = ?, due_date = ?, approved_by = ?, returned_at = NULL
        WHERE id = ?`
    ).run(today, addDays(today, days), user.id, loan.id)
  })
  const updated = db.prepare('SELECT * FROM loans WHERE id = ?').get(loan.id)
  return { loan: loanDto(updated) }
})

route('PATCH', 'loans/:id/return', STAFF, ({ params }) => {
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(Number(params.id))
  if (!loan) throw httpError(404, 'El préstamo no existe.')
  if (loan.status === 'pendiente') throw httpError(409, 'La solicitud aún no ha sido aprobada.')
  if (loan.returned_at) throw httpError(409, 'El préstamo ya fue devuelto.')
  withTransaction(() => {
    db.prepare(
      `UPDATE loans SET status = 'devuelto', returned_at = ? WHERE id = ?`
    ).run(nowISO(), loan.id)
    releaseCopy(loan.book_id)
  })
  const updated = db.prepare('SELECT * FROM loans WHERE id = ?').get(loan.id)
  return { loan: loanDto(updated) }
})

/* --- Lectura protegida --------------------------------------------- */

route('GET', 'reading/loans', READERS, ({ user }) => {
  const rows = db
    .prepare(
      `SELECT l.*, b.title, b.author, b.image, b.signature, b.format, b.digital, b.physical
         FROM loans l JOIN books b ON b.id = l.book_id
        WHERE l.user_id = ? AND b.digital = 1
        ORDER BY l.id DESC`
    )
    .all(user.id)
  const loans = rows
    .map((row) => loanDto(row, { user }))
    .filter((loan) => loan.status === 'activo')
  return { loans }
})

route('GET', 'reading/:bookId', READERS, ({ params, user }) => {
  const { book } = requireReadingAccess(user, params.bookId)
  const pages = parsePages(book).map((page) => ({ folio: page.folio, chapter: page.chapter }))
  return {
    book: {
      id: book.id,
      title: book.title,
      author: book.author,
      signature: book.signature,
      image: book.image,
      format: book.format,
    },
    pages,
    total: pages.length,
    user: { nombre: user.nombre, correo: user.correo },
  }
})

route('GET', 'reading/:bookId/page/:index', READERS, ({ params, user }) => {
  const { book, loan } = requireReadingAccess(user, params.bookId)
  const pages = parsePages(book)
  const index = Number(params.index)
  if (!Number.isInteger(index) || index < 0 || index >= pages.length) {
    throw httpError(404, 'La página solicitada no existe.')
  }
  const page = pages[index]
  return {
    index,
    total: pages.length,
    folio: page.folio,
    chapter: page.chapter,
    paragraphs: page.paragraphs,
    trivia: page.trivia,
    glossary: page.glossary || [],
    dueDate: loan.due_date,
  }
})

route('POST', 'reading/:bookId/session', READERS, ({ params, body, user }) => {
  const event = String(body.event || '')
  if (!['open', 'close'].includes(event)) throw httpError(400, 'Evento de lectura inválido.')
  if (event === 'open') requireReadingAccess(user, params.bookId)
  else {
    const book = db.prepare('SELECT 1 FROM books WHERE id = ?').get(params.bookId)
    if (!book) throw httpError(404, 'El libro no existe.')
  }
  db.prepare(
    'INSERT INTO reading_events (user_id, book_id, event, at) VALUES (?, ?, ?, ?)'
  ).run(user.id, params.bookId, event, nowISO())
  return { ok: true }
})

/* --- Subrayados y notas -------------------------------------------- */

route('GET', 'highlights', READERS, ({ query, user }) => {
  const bookId = String(query.bookId || '')
  if (!bookId) throw httpError(400, 'Falta el libro.')
  const rows = db
    .prepare('SELECT * FROM highlights WHERE user_id = ? AND book_id = ? ORDER BY page, start_offset')
    .all(user.id, bookId)
  return { highlights: rows.map(highlightDto) }
})

route('POST', 'highlights', READERS, ({ body, user }) => {
  const bookId = String(body.bookId || '')
  requireReadingAccess(user, bookId)
  const color = String(body.color || '')
  if (!HIGHLIGHT_COLORS.includes(color)) throw httpError(400, 'Color de resaltado inválido.')
  const page = Number(body.page)
  const blockIndex = Number(body.blockIndex)
  const startOffset = Number(body.startOffset)
  const endOffset = Number(body.endOffset)
  if (![page, blockIndex, startOffset, endOffset].every(Number.isInteger)) {
    throw httpError(400, 'Posiciones de resaltado inválidas.')
  }
  if (page < 0 || blockIndex < 0 || startOffset < 0 || endOffset <= startOffset) {
    throw httpError(400, 'Rango de resaltado inválido.')
  }
  const text = String(body.text || '').slice(0, 2000)
  const note = String(body.note || '').slice(0, 500)
  const existingCount = db
    .prepare('SELECT COUNT(*) AS total FROM highlights WHERE user_id = ? AND book_id = ?')
    .get(user.id, bookId).total
  if (existingCount >= 300) throw httpError(409, 'Alcanzaste el máximo de resaltados para este libro.')
  const now = nowISO()
  const info = db
    .prepare(
      `INSERT INTO highlights (user_id, book_id, page, block_index, start_offset, end_offset, text, color, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(user.id, bookId, page, blockIndex, startOffset, endOffset, text, color, note, now, now)
  const created = db.prepare('SELECT * FROM highlights WHERE id = ?').get(info.lastInsertRowid)
  return { highlight: highlightDto(created) }
}, { status: 201 })

route('PUT', 'highlights/:id', READERS, ({ params, body, user }) => {
  const row = db
    .prepare('SELECT * FROM highlights WHERE id = ? AND user_id = ?')
    .get(Number(params.id), user.id)
  if (!row) throw httpError(404, 'El resaltado no existe.')
  const color = body.color === undefined ? row.color : String(body.color)
  if (!HIGHLIGHT_COLORS.includes(color)) throw httpError(400, 'Color de resaltado inválido.')
  const note = body.note === undefined ? row.note || '' : String(body.note).slice(0, 500)
  db.prepare('UPDATE highlights SET color = ?, note = ?, updated_at = ? WHERE id = ?').run(
    color,
    note,
    nowISO(),
    row.id
  )
  const updated = db.prepare('SELECT * FROM highlights WHERE id = ?').get(row.id)
  return { highlight: highlightDto(updated) }
})

route('DELETE', 'highlights/:id', READERS, ({ params, user }) => {
  const row = db
    .prepare('SELECT id FROM highlights WHERE id = ? AND user_id = ?')
    .get(Number(params.id), user.id)
  if (!row) throw httpError(404, 'El resaltado no existe.')
  db.prepare('DELETE FROM highlights WHERE id = ?').run(row.id)
  return { ok: true }
})

/* --- Historial ------------------------------------------------------ */

route('GET', 'history', null, ({ user }) => {
  const staff = STAFF.includes(user.rol)
  const loanRows = staff
    ? db
        .prepare(
          `SELECT l.*, b.title, b.author, b.image, b.signature, b.format, b.digital, b.physical
             FROM loans l JOIN books b ON b.id = l.book_id
            ORDER BY COALESCE(l.loan_date, l.created_at) DESC, l.id DESC LIMIT 300`
        )
        .all()
    : db
        .prepare(
          `SELECT l.*, b.title, b.author, b.image, b.signature, b.format, b.digital, b.physical
             FROM loans l JOIN books b ON b.id = l.book_id
            WHERE l.user_id = ?
            ORDER BY COALESCE(l.loan_date, l.created_at) DESC, l.id DESC LIMIT 300`
        )
        .all(user.id)

  const eventRows = staff
    ? db
        .prepare(
          `SELECT e.*, b.title, b.author, b.image, u.nombre AS user_nombre, u.correo AS user_correo
             FROM reading_events e JOIN books b ON b.id = e.book_id JOIN users u ON u.id = e.user_id
            ORDER BY e.at DESC LIMIT 300`
        )
        .all()
    : db
        .prepare(
          `SELECT e.*, b.title, b.author, b.image, u.nombre AS user_nombre, u.correo AS user_correo
             FROM reading_events e JOIN books b ON b.id = e.book_id JOIN users u ON u.id = e.user_id
            WHERE e.user_id = ?
            ORDER BY e.at DESC LIMIT 300`
        )
        .all(user.id)

  return {
    scope: staff ? 'global' : 'personal',
    loans: loanRows.map((row) => loanDto(row)),
    events: eventRows.map((row) => ({
      id: row.id,
      bookId: row.book_id,
      title: row.title,
      author: row.author,
      image: row.image,
      event: row.event,
      at: row.at,
      user: { nombre: row.user_nombre, correo: row.user_correo },
    })),
  }
})

/* --- Reportes ------------------------------------------------------- */

route('GET', 'reports/loans', STAFF, ({ query }) => {
  return buildReportRows({
    scope: query.scope || 'todos',
    from: query.from || '',
    to: query.to || '',
    status: query.status || '',
  })
})

route('GET', 'reports/loans.csv', STAFF, ({ query }) => {
  const { rows } = buildReportRows({
    scope: query.scope || 'todos',
    from: query.from || '',
    to: query.to || '',
    status: query.status || '',
  })
  const header = [
    'Usuario',
    'Correo',
    'Rol',
    'Libro',
    'Fecha prestamo',
    'Fecha limite',
    'Fecha devolucion',
    'Estado',
  ]
  const lines = [header.map(csvEscape).join(',')]
  for (const row of rows) {
    lines.push(
      [
        row.user.nombre,
        row.user.correo,
        row.user.rol,
        row.book.title,
        row.loanDate || '',
        row.dueDate || '',
        row.returnedAt ? row.returnedAt.slice(0, 10) : '',
        row.status,
      ]
        .map(csvEscape)
        .join(',')
    )
  }
  const csv = `\uFEFF${lines.join('\r\n')}`
  return {
    raw: {
      body: csv,
      contentType: 'text/csv; charset=utf-8',
      headers: {
        'Content-Disposition': `attachment; filename="reporte-prestamos-${ymd()}.csv"`,
      },
    },
  }
})

/* --- Usuarios (solo administrador) --------------------------------- */

route('GET', 'users', ['Administrador'], () => {
  const users = db.prepare('SELECT * FROM users ORDER BY id').all()
  const loans = db.prepare('SELECT * FROM loans').all()
  const counts = new Map()
  for (const loan of loans) {
    if (loanStatus(loan) !== 'activo') continue
    counts.set(loan.user_id, (counts.get(loan.user_id) || 0) + 1)
  }
  return {
    users: users.map((row) => ({
      ...publicUser(row),
      createdAt: row.created_at,
      activeLoans: counts.get(row.id) || 0,
    })),
  }
})

route('POST', 'users', ['Administrador'], ({ body }) => {
  const nombre = cleanText(body.nombre, 120, 'nombre')
  const correo = String(body.correo || '').trim().toLowerCase()
  if (!isEmail(correo)) throw httpError(400, 'El correo no es válido.')
  const rol = String(body.rol || 'Estudiante')
  if (!ROLES.includes(rol)) throw httpError(400, 'Rol inválido.')
  const password = String(body.password || '')
  if (password.length < 6) throw httpError(400, 'La contraseña debe tener al menos 6 caracteres.')
  if (db.prepare('SELECT 1 FROM users WHERE correo = ?').get(correo)) {
    throw httpError(409, 'Ya existe un usuario con ese correo.')
  }
  const info = db
    .prepare(
      'INSERT INTO users (nombre, correo, rol, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .run(nombre, correo, rol, hashPassword(password), nowISO())
  const created = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid)
  return { user: publicUser(created) }
}, { status: 201 })

route('PATCH', 'users/:id/role', ['Administrador'], ({ params, body, user }) => {
  const id = Number(params.id)
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!target) throw httpError(404, 'El usuario no existe.')
  const rol = String(body.rol || '')
  if (!ROLES.includes(rol)) throw httpError(400, 'Rol inválido.')
  if (target.id === user.id) throw httpError(409, 'No puedes cambiar tu propio rol.')
  if (target.rol === 'Administrador' && rol !== 'Administrador') {
    const { total } = db
      .prepare("SELECT COUNT(*) AS total FROM users WHERE rol = 'Administrador'")
      .get()
    if (total <= 1) throw httpError(409, 'Debe existir al menos un administrador.')
  }
  db.prepare('UPDATE users SET rol = ? WHERE id = ?').run(rol, id)
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  return { user: publicUser(updated) }
})

/* --- Chat interno --------------------------------------------------- */

route('GET', 'chat/messages', READERS, ({ user }) => {
  const admins = adminIds()
  if (admins.length === 0) throw httpError(409, 'No hay un administrador disponible para atender el chat.')
  const list = placeholders(admins.length)
  const rows = db
    .prepare(
      `SELECT * FROM messages
        WHERE (from_user = ? AND to_user IN (${list}))
           OR (from_user IN (${list}) AND to_user = ?)
        ORDER BY id ASC`
    )
    .all(user.id, ...admins, ...admins, user.id)
  db.prepare(
    `UPDATE messages SET read_at = ?
      WHERE to_user = ? AND from_user IN (${list}) AND read_at IS NULL`
  ).run(nowISO(), user.id, ...admins)
  return {
    messages: rows.map((row) => messageDto(row, user.id)),
    admin: (() => {
      const admin = db.prepare('SELECT nombre, correo FROM users WHERE id = ?').get(admins[0])
      return admin ? { nombre: admin.nombre, correo: admin.correo } : null
    })(),
  }
})

route('POST', 'chat/messages', READERS, ({ body, user }) => {
  const admins = adminIds()
  if (admins.length === 0) throw httpError(409, 'No hay un administrador disponible para atender el chat.')
  const text = cleanText(body.text, 500, 'mensaje')
  const info = db
    .prepare('INSERT INTO messages (from_user, to_user, body, created_at) VALUES (?, ?, ?, ?)')
    .run(user.id, admins[0], text, nowISO())
  const created = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid)
  return { message: messageDto(created, user.id) }
}, { status: 201 })

route('GET', 'chat/unread', null, ({ user }) => {
  const admins = adminIds()
  if (admins.length === 0) return { unread: 0 }
  const list = placeholders(admins.length)
  if (admins.includes(user.id)) {
    const row = db
      .prepare(
        `SELECT COUNT(*) AS total FROM messages
          WHERE to_user IN (${list}) AND from_user NOT IN (${list}) AND read_at IS NULL`
      )
      .get(...admins, ...admins)
    return { unread: row.total }
  }
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total FROM messages
        WHERE to_user = ? AND from_user IN (${list}) AND read_at IS NULL`
    )
    .get(user.id, ...admins)
  return { unread: row.total }
})

route('GET', 'chat/threads', ['Administrador'], ({ user }) => {
  const admins = adminIds()
  const list = placeholders(admins.length)
  const users = db
    .prepare("SELECT id, nombre, correo, rol FROM users WHERE rol <> 'Administrador' ORDER BY nombre")
    .all()
  const threads = []
  for (const candidate of users) {
    const last = db
      .prepare(
        `SELECT m.* FROM messages m
          WHERE (m.from_user = ? AND m.to_user IN (${list}))
             OR (m.from_user IN (${list}) AND m.to_user = ?)
          ORDER BY m.id DESC LIMIT 1`
      )
      .get(candidate.id, ...admins, ...admins, candidate.id)
    if (!last) continue
    const unread = db
      .prepare(
        `SELECT COUNT(*) AS total FROM messages
          WHERE from_user = ? AND to_user IN (${list}) AND read_at IS NULL`
      )
      .get(candidate.id, ...admins).total
    threads.push({
      user: candidate,
      lastMessage: last.body,
      lastAt: last.created_at,
      unread,
      mine: last.from_user === user.id,
    })
  }
  threads.sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1))
  return { threads }
})

route('GET', 'chat/threads/:userId', ['Administrador'], ({ params, user }) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(params.userId))
  if (!target) throw httpError(404, 'El usuario no existe.')
  if (target.rol === 'Administrador') throw httpError(400, 'No se puede abrir un chat de administrador.')
  const admins = adminIds()
  const list = placeholders(admins.length)
  const rows = db
    .prepare(
      `SELECT * FROM messages
        WHERE (from_user = ? AND to_user IN (${list}))
           OR (from_user IN (${list}) AND to_user = ?)
        ORDER BY id ASC`
    )
    .all(target.id, ...admins, ...admins, target.id)
  db.prepare(
    `UPDATE messages SET read_at = ?
      WHERE from_user = ? AND to_user IN (${list}) AND read_at IS NULL`
  ).run(nowISO(), target.id, ...admins)
  return {
    user: { id: target.id, nombre: target.nombre, correo: target.correo, rol: target.rol },
    messages: rows.map((row) => messageDto(row, user.id)),
  }
})

route('POST', 'chat/threads/:userId/messages', ['Administrador'], ({ params, body, user }) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(params.userId))
  if (!target) throw httpError(404, 'El usuario no existe.')
  if (target.rol === 'Administrador') throw httpError(400, 'No se puede enviar mensajes a otro administrador.')
  const text = cleanText(body.text, 500, 'mensaje')
  const info = db
    .prepare('INSERT INTO messages (from_user, to_user, body, created_at) VALUES (?, ?, ?, ?)')
    .run(user.id, target.id, text, nowISO())
  const created = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid)
  return { message: messageDto(created, user.id) }
}, { status: 201 })

route('POST', 'chat/threads/:userId/read', ['Administrador'], ({ params }) => {
  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(Number(params.userId))
  if (!target) throw httpError(404, 'El usuario no existe.')
  const admins = adminIds()
  const list = placeholders(admins.length)
  db.prepare(
    `UPDATE messages SET read_at = ?
      WHERE from_user = ? AND to_user IN (${list}) AND read_at IS NULL`
  ).run(nowISO(), target.id, ...admins)
  return { ok: true }
})

/* ------------------------------------------------------------------ *
 * Servidor
 * ------------------------------------------------------------------ */

async function dispatch(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  if (!url.pathname.startsWith('/api/')) {
    sendJson(res, 404, { error: 'Ruta no encontrada.' })
    return
  }
  const pathname = url.pathname.slice(5)
  const match = matchRoute(req.method, pathname)
  if (!match) {
    sendJson(res, 404, { error: 'Ruta no encontrada.' })
    return
  }
  const { route: definition, params } = match
  let user = null
  if (!definition.public) {
    user = sessionUser(req)
    if (!user) throw httpError(401, 'Debes iniciar sesión.')
    if (definition.roles && !definition.roles.includes(user.rol)) {
      throw httpError(403, 'No tienes permisos para realizar esta acción.')
    }
  }
  const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readBody(req) : {}
  const query = Object.fromEntries(url.searchParams.entries())
  const result = await definition.handler({ req, res, params, query, body, user })
  if (result && result.raw) {
    sendText(res, 200, result.raw.body, result.raw.contentType, result.raw.headers || {})
    return
  }
  sendJson(res, definition.status, result ?? { ok: true })
}

export function createServer() {
  return createHttpServer(async (req, res) => {
    try {
      await dispatch(req, res)
    } catch (error) {
      const status = error.status || 500
      if (status === 500) console.error('[api]', error)
      if (res.headersSent) {
        res.end()
        return
      }
      sendJson(res, status, {
        error: status === 500 ? 'Error interno del servidor.' : error.message,
        ...(error.extra || {}),
      })
    }
  })
}
