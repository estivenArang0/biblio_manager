import { createServer as createHttpServer } from 'node:http'
import fs from 'node:fs'
import { createToken, hashPassword, verifyPassword } from './auth.js'
import { getDb } from './db.js'
import { buildGenericPages } from './seed.js'
import {
  READERS,
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
const GOOGLE_BOOKS_API_KEY = String(process.env.GOOGLE_BOOKS_API_KEY || '').trim()
const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 5)
const LOGIN_BLOCK_MS = Number(process.env.LOGIN_BLOCK_SECONDS || 60) * 1000
const loginAttempts = new Map()

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
      `SELECT u.id, u.nombre, u.correo, u.rol, u.tipo_lector, u.active,
              s.expires_at, s.last_seen_at, s.created_at
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
  if (Number(row.active) === 0) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
    throw httpError(401, 'Tu cuenta está desactivada.')
  }
  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token = ?').run(nowISO(), token)
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    rol: row.rol,
    tipoLector: row.tipo_lector || null,
    token,
  }
}

function publicUser(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    rol: row.rol,
    tipoLector: row.tipo_lector || null,
    active: Number(row.active ?? 1) === 1,
  }
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
  if (book.digital) return 'Digital disponible'
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
        .prepare('SELECT id, nombre, correo, rol, tipo_lector FROM users WHERE id = ?')
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
      ? {
          id: user.id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol,
          tipoLector: user.tipo_lector || user.tipoLector || null,
        }
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
    isFavorite:
      user && READERS.includes(user.rol)
        ? Boolean(
            db
              .prepare('SELECT 1 FROM favorites WHERE user_id = ? AND book_id = ?')
              .get(user.id, row.id)
          )
        : false,
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
    isFavorite: Number(row.is_favorite) === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function activityDto(row, book) {
  const page = parsePages(book)[row.page] || {}
  return {
    id: row.id,
    bookId: row.book_id,
    page: row.page,
    block: row.page + 1,
    chapter: page.chapter || '',
    activityType: row.activity_type,
    answer: row.answer,
    isCorrect: row.is_correct === null || row.is_correct === undefined ? null : Boolean(row.is_correct),
    at: row.updated_at,
    createdAt: row.created_at,
  }
}

function activityTotals(userId, bookId) {
  const book = db.prepare('SELECT pages_json FROM books WHERE id = ?').get(bookId)
  const pages = book ? parsePages(book) : []
  const totalTrivias = pages.filter(
    (page) => page.trivia && page.trivia.type !== 'reflection' && page.trivia.options?.length
  ).length
  const row = db
    .prepare(
      `SELECT COUNT(*) AS answered,
              COALESCE(SUM(CASE WHEN activity_type = 'trivia' AND is_correct = 1 THEN 1 ELSE 0 END), 0) AS correct
         FROM activity_results
        WHERE user_id = ? AND book_id = ?`
    )
    .get(userId, bookId)
  return {
    answered: Number(row.answered),
    correct: Number(row.correct),
    totalTrivias,
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

function staffIds() {
  return db
    .prepare("SELECT id FROM users WHERE rol = 'Bibliotecario'")
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
    clauses.push("u.rol = 'Lector' AND u.tipo_lector = 'estudiante'")
  } else if (scope === 'docentes') {
    clauses.push("u.rol = 'Lector' AND u.tipo_lector = 'docente'")
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
              u.tipo_lector AS user_tipo,
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
      tipoLector: row.user_tipo || null,
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

function buildActivityReport({ from = '', to = '' } = {}) {
  const clauses = []
  const params = []
  if (from) {
    clauses.push('substr(a.updated_at, 1, 10) >= ?')
    params.push(from)
  }
  if (to) {
    clauses.push('substr(a.updated_at, 1, 10) <= ?')
    params.push(to)
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `SELECT u.id AS user_id, u.nombre, u.correo, u.rol, u.tipo_lector,
              b.id AS book_id, b.title, b.pages_json,
              COUNT(*) AS answered,
              COALESCE(SUM(CASE WHEN a.activity_type = 'trivia' AND a.is_correct = 1 THEN 1 ELSE 0 END), 0) AS correct,
              MAX(a.updated_at) AS last_at
         FROM activity_results a
         JOIN users u ON u.id = a.user_id
         JOIN books b ON b.id = a.book_id
         ${where}
        GROUP BY u.id, b.id
        ORDER BY correct DESC, u.nombre COLLATE NOCASE, b.title COLLATE NOCASE`
    )
    .all(...params)
    .map((row) => {
      const pages = parsePages({ pages_json: row.pages_json })
      const totalTrivias = pages.filter(
        (page) => page.trivia && page.trivia.type !== 'reflection' && page.trivia.options?.length
      ).length
      const correct = Number(row.correct)
      return {
        user: {
          id: row.user_id,
          nombre: row.nombre,
          correo: row.correo,
          rol: row.rol,
          tipoLector: row.tipo_lector || null,
        },
        book: { id: row.book_id, title: row.title },
        answered: Number(row.answered),
        correct,
        totalTrivias,
        percentage: totalTrivias ? Math.round((correct / totalTrivias) * 100) : 0,
        lastAt: row.last_at,
      }
    })
  return {
    rows,
    totals: {
      answered: rows.reduce((total, row) => total + row.answered, 0),
      correct: rows.reduce((total, row) => total + row.correct, 0),
    },
  }
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
  ({ body, req }) => {
    const correo = String(body.correo || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (!correo || !password) throw httpError(400, 'Correo y contraseña son obligatorios.')
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local')
      .split(',')[0]
      .trim()
    const key = `${ip}|${correo}`
    let attempt = loginAttempts.get(key)
    if (attempt?.blockedUntil && attempt.blockedUntil > Date.now()) {
      throw httpError(429, 'Demasiados intentos. Espera 1 minuto antes de volver a intentar.')
    }
    if (attempt?.blockedUntil && attempt.blockedUntil <= Date.now()) {
      loginAttempts.delete(key)
      attempt = undefined
    }
    const user = db.prepare('SELECT * FROM users WHERE correo = ?').get(correo)
    if (!user || !verifyPassword(password, user.password_hash)) {
      const count = (attempt?.count || 0) + 1
      if (count >= LOGIN_MAX_ATTEMPTS) {
        loginAttempts.set(key, { count, blockedUntil: Date.now() + LOGIN_BLOCK_MS })
        throw httpError(429, 'Demasiados intentos. Espera 1 minuto antes de volver a intentar.')
      }
      loginAttempts.set(key, { count })
      throw httpError(401, 'Credenciales inválidas. Verifica tu correo y contraseña.')
    }
    if (Number(user.active) === 0) {
      throw httpError(401, 'Tu cuenta está desactivada. Contacta a la biblioteca.')
    }
    loginAttempts.delete(key)
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
const GOOGLE_BOOKS_FALLBACK = JSON.parse(
  fs.readFileSync(new URL('./google-books-fallback.json', import.meta.url), 'utf8')
)

function fallbackBook(isbn) {
  return GOOGLE_BOOKS_FALLBACK.find((book) => book.isbn === isbn) || null
}

route('GET', 'books/isbn/:isbn', STAFF, async ({ params }) => {
  const isbn = String(params.isbn || '').replace(/[-\s]/g, '').toUpperCase()
  if (!/^\d{9}[\dX]$/.test(isbn) && !/^\d{13}$/.test(isbn)) {
    throw httpError(400, 'El ISBN debe tener 10 o 13 caracteres.')
  }
  try {
    const url = new URL(GOOGLE_BOOKS_URL)
    url.searchParams.set('q', `isbn:${isbn}`)
    if (GOOGLE_BOOKS_API_KEY) url.searchParams.set('key', GOOGLE_BOOKS_API_KEY)
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: 'application/json' },
    })
    if (response.ok) {
      const payload = await response.json()
      const info = payload?.items?.[0]?.volumeInfo
      if (info?.title) {
        return {
          found: true,
          source: 'google',
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
      }
    }
  } catch {
    /* se usa el respaldo local */
  }
  const local = fallbackBook(isbn)
  if (local) return { found: true, source: 'local', data: { ...local, isbn } }
  return { found: false }
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

/* --- Favoritos y notas --------------------------------------------- */

route('GET', 'favorites', READERS, ({ user }) => {
  const rows = db
    .prepare(
      `SELECT b.* FROM favorites f JOIN books b ON b.id = f.book_id
        WHERE f.user_id = ? ORDER BY f.created_at DESC`
    )
    .all(user.id)
  return { books: rows.map((row) => bookDto(row, user)) }
})

route('POST', 'favorites/:bookId', READERS, ({ params, user }) => {
  const book = db.prepare('SELECT id FROM books WHERE id = ?').get(params.bookId)
  if (!book) throw httpError(404, 'El libro no existe.')
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, book_id, created_at) VALUES (?, ?, ?)').run(
    user.id,
    book.id,
    nowISO()
  )
  return { ok: true, favorite: true }
})

route('DELETE', 'favorites/:bookId', READERS, ({ params, user }) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND book_id = ?').run(user.id, params.bookId)
  return { ok: true, favorite: false }
})

route('GET', 'notes', READERS, ({ user }) => {
  const rows = db
    .prepare(
      `SELECT h.*, b.title, b.author, b.image
         FROM highlights h JOIN books b ON b.id = h.book_id
        WHERE h.user_id = ? AND h.note IS NOT NULL AND TRIM(h.note) <> ''
        ORDER BY h.updated_at DESC LIMIT 300`
    )
    .all(user.id)
  return {
    notes: rows.map((row) => ({
      ...highlightDto(row),
      title: row.title,
      author: row.author,
      image: row.image,
    })),
  }
})

route('GET', 'fragments', READERS, ({ user }) => {
  const rows = db
    .prepare(
      `SELECT h.*, b.title, b.author, b.image, b.pages_json
         FROM highlights h JOIN books b ON b.id = h.book_id
        WHERE h.user_id = ?
        ORDER BY b.title COLLATE NOCASE, h.page, h.start_offset`
    )
    .all(user.id)
  return {
    fragments: rows.map((row) => {
      const pages = parsePages({ pages_json: row.pages_json })
      const loan = db
        .prepare('SELECT * FROM loans WHERE user_id = ? AND book_id = ? ORDER BY id DESC LIMIT 1')
        .get(user.id, row.book_id)
      const status = loan ? loanStatus(loan) : null
      return {
        ...highlightDto(row),
        title: row.title,
        author: row.author,
        image: row.image,
        block: row.page + 1,
        chapter: pages[row.page]?.chapter || '',
        canRead: status === 'activo',
        loanStatus: status,
      }
    }),
  }
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
      `SELECT id, nombre, correo, rol, tipo_lector FROM users
        WHERE rol = 'Lector' AND active = 1
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
  const days = 8
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
  const days = loan.requested_days || 8
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
        WHERE l.user_id = ?
        ORDER BY l.id DESC`
    )
    .all(user.id)
  const loans = rows
    .map((row) => loanDto(row, { user }))
    .filter((loan) => loan.status === 'activo')
  return { loans }
})

route('GET', 'reading/comprehension', READERS, ({ user }) => {
  const books = db
    .prepare(
      `SELECT DISTINCT b.*
         FROM books b
         LEFT JOIN loans l ON l.book_id = b.id AND l.user_id = ?
         LEFT JOIN activity_results a ON a.book_id = b.id AND a.user_id = ?
        WHERE l.id IS NOT NULL OR a.id IS NOT NULL
        ORDER BY b.title COLLATE NOCASE`
    )
    .all(user.id, user.id)
  const rows = books.map((book) => {
    const pages = parsePages(book)
    const activities = db
      .prepare(
        'SELECT page, activity_type, is_correct FROM activity_results WHERE user_id = ? AND book_id = ?'
      )
      .all(user.id, book.id)
    const totalTrivias = pages.filter(
      (page) => page.trivia && page.trivia.type !== 'reflection' && page.trivia.options?.length
    ).length
    const correct = activities.filter(
      (activity) => activity.activity_type === 'trivia' && activity.is_correct === 1
    ).length
    const percentage = totalTrivias ? Math.round((correct / totalTrivias) * 100) : 0
    const failedBlocks = activities
      .filter((activity) => activity.activity_type === 'trivia' && activity.is_correct === 0)
      .map((activity) => ({
        page: activity.page,
        block: activity.page + 1,
        chapter: pages[activity.page]?.chapter || '',
      }))
    const message =
      percentage >= 80
        ? 'Muy buena comprensión'
        : percentage >= 50
          ? 'Buena, repasa estos bloques'
          : 'Conviene releer el libro'
    return {
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        image: book.image,
        format: book.format,
      },
      answered: activities.length,
      totalBlocks: pages.length,
      totalTrivias,
      correct,
      percentage,
      message,
      failedBlocks,
    }
  })
  return { books: rows }
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

route('POST', 'reading/:bookId/progress', READERS, ({ params, body, user }) => {
  const { book } = requireReadingAccess(user, params.bookId)
  const pages = parsePages(book)
  const page = Number(body.page)
  if (!Number.isInteger(page) || page < 0 || page >= pages.length) {
    throw httpError(400, 'La página indicada no existe.')
  }
  db.prepare(
    `INSERT INTO reading_progress (user_id, book_id, page, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, book_id) DO UPDATE SET page = excluded.page, updated_at = excluded.updated_at`
  ).run(user.id, book.id, page, nowISO())
  return { ok: true, page }
})

route('GET', 'reading/:bookId/progress', READERS, ({ params, user }) => {
  const loan = db
    .prepare('SELECT * FROM loans WHERE user_id = ? AND book_id = ? ORDER BY id DESC LIMIT 1')
    .get(user.id, params.bookId)
  if (!loan) throw httpError(404, 'No tienes un préstamo de este libro.')
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(params.bookId)
  if (!book) throw httpError(404, 'El libro no existe.')
  const pages = parsePages(book)
  const progress = db
    .prepare('SELECT * FROM reading_progress WHERE user_id = ? AND book_id = ?')
    .get(user.id, params.bookId)
  const lastPage = progress ? Number(progress.page) : 0
  const percent =
    progress && pages.length
      ? Math.min(100, Math.round(((lastPage + 1) / pages.length) * 100))
      : 0
  const highlights = db
    .prepare('SELECT * FROM highlights WHERE user_id = ? AND book_id = ? ORDER BY page, start_offset')
    .all(user.id, params.bookId)
  return {
    book: { id: book.id, title: book.title, author: book.author, image: book.image },
    page: progress && pages.length ? lastPage + 1 : 0,
    total: pages.length,
    percent: pages.length ? percent : 0,
    hasContent: pages.length > 0,
    highlights: highlights.map(highlightDto),
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

route('GET', 'reading/:bookId/activity', READERS, ({ params, user }) => {
  const { book } = requireReadingAccess(user, params.bookId)
  const rows = db
    .prepare('SELECT * FROM activity_results WHERE user_id = ? AND book_id = ? ORDER BY page')
    .all(user.id, params.bookId)
  return {
    activities: rows.map((row) => activityDto(row, book)),
    totals: activityTotals(user.id, params.bookId),
  }
})

route('POST', 'reading/:bookId/activity', READERS, ({ params, body, user }) => {
  const { book } = requireReadingAccess(user, params.bookId)
  const pages = parsePages(book)
  const blockIndex = Number(body.blockIndex)
  if (!Number.isInteger(blockIndex) || blockIndex < 0 || blockIndex >= pages.length) {
    throw httpError(400, 'El bloque indicado no existe.')
  }
  const trivia = pages[blockIndex]?.trivia
  if (!trivia) throw httpError(400, 'Este bloque no tiene actividad.')
  const expectedType =
    trivia.type === 'reflection' || !Array.isArray(trivia.options) || trivia.options.length === 0
      ? 'reflection'
      : 'trivia'
  if (body.type && body.type !== expectedType) {
    throw httpError(400, 'El tipo de actividad no corresponde al bloque.')
  }
  const existing = db
    .prepare('SELECT 1 FROM activity_results WHERE user_id = ? AND book_id = ? AND page = ?')
    .get(user.id, book.id, blockIndex)
  if (existing) throw httpError(409, 'Ya respondiste esta actividad.')

  let answer
  let isCorrect = null
  if (expectedType === 'trivia') {
    answer = String(body.answer || '').trim()
    const option = trivia.options.find((item) => item.id === answer)
    if (!option) throw httpError(400, 'Selecciona una opción válida.')
    isCorrect = answer === trivia.correctOption
  } else {
    answer = String(body.answer || '').trim()
    if (!answer) throw httpError(400, 'La reflexión no puede estar vacía.')
    if (answer.length > 2000) throw httpError(400, 'La reflexión no puede superar 2000 caracteres.')
  }

  const now = nowISO()
  db.prepare(
    `INSERT INTO activity_results
       (user_id, book_id, page, activity_type, answer, is_correct, score, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(
    user.id,
    book.id,
    blockIndex,
    expectedType,
    answer,
    isCorrect === null ? null : isCorrect ? 1 : 0,
    now,
    now
  )
  const row = db
    .prepare('SELECT * FROM activity_results WHERE user_id = ? AND book_id = ? AND page = ?')
    .get(user.id, book.id, blockIndex)
  return {
    result: activityDto(row, book),
    totals: activityTotals(user.id, book.id),
  }
}, { status: 201 })

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
      `INSERT INTO highlights (user_id, book_id, page, block_index, start_offset, end_offset, text, color, note, is_favorite, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      user.id,
      bookId,
      page,
      blockIndex,
      startOffset,
      endOffset,
      text,
      color,
      note,
      body.isFavorite ? 1 : 0,
      now,
      now
    )
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
  const isFavorite = body.isFavorite === undefined ? row.is_favorite : body.isFavorite ? 1 : 0
  db.prepare(
    'UPDATE highlights SET color = ?, note = ?, is_favorite = ?, updated_at = ? WHERE id = ?'
  ).run(
    color,
    note,
    isFavorite,
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

  const activityRows = staff
    ? db
        .prepare(
          `SELECT a.*, b.title, b.author, b.image, b.pages_json,
                  u.nombre AS user_nombre, u.correo AS user_correo, u.rol AS user_rol,
                  u.tipo_lector AS user_tipo
             FROM activity_results a
             JOIN books b ON b.id = a.book_id
             JOIN users u ON u.id = a.user_id
            ORDER BY a.updated_at DESC LIMIT 300`
        )
        .all()
    : db
        .prepare(
          `SELECT a.*, b.title, b.author, b.image, b.pages_json,
                  u.nombre AS user_nombre, u.correo AS user_correo, u.rol AS user_rol,
                  u.tipo_lector AS user_tipo
             FROM activity_results a
             JOIN books b ON b.id = a.book_id
             JOIN users u ON u.id = a.user_id
            WHERE a.user_id = ?
            ORDER BY a.updated_at DESC LIMIT 300`
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
    activities: activityRows.map((row) => ({
      ...activityDto(row, { pages_json: row.pages_json }),
      title: row.title,
      author: row.author,
      image: row.image,
      user: {
        id: row.user_id,
        nombre: row.user_nombre,
        correo: row.user_correo,
        rol: row.user_rol,
        tipoLector: row.user_tipo || null,
      },
    })),
  }
})

/* --- Reportes ------------------------------------------------------- */

route('GET', 'panel', STAFF, () => {
  const loans = db
    .prepare(
      `SELECT l.*, b.title FROM loans l JOIN books b ON b.id = l.book_id
        WHERE l.loan_date IS NOT NULL`
    )
    .all()
  const today = ymd()
  const month = today.slice(0, 7)
  let activos = 0
  let vencidos = 0
  let delMes = 0
  const top = new Map()
  for (const loan of loans) {
    const status = loanStatus(loan, today)
    if (status === 'activo') activos += 1
    if (status === 'vencido') vencidos += 1
    if (String(loan.loan_date).startsWith(month)) delMes += 1
    const key = loan.book_id
    const current = top.get(key) || { id: key, title: loan.title, count: 0 }
    current.count += 1
    top.set(key, current)
  }
  const staff = staffIds()
  let unread = 0
  if (staff.length) {
    const list = placeholders(staff.length)
    unread = db
      .prepare(
        `SELECT COUNT(*) AS total FROM messages
          WHERE to_user IN (${list}) AND from_user NOT IN (${list}) AND read_at IS NULL`
      )
      .get(...staff, ...staff).total
  }
  return {
    solicitudesPendientes: db
      .prepare("SELECT COUNT(*) AS total FROM loans WHERE status = 'pendiente'")
      .get().total,
    prestamosActivos: activos,
    vencidos,
    mensajesSinLeer: unread,
    librosMasPrestados: [...top.values()].sort((a, b) => b.count - a.count).slice(0, 5),
    prestamosDelMes: delMes,
  }
})

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

route('GET', 'reports/activities', STAFF, ({ query }) => {
  return buildActivityReport({ from: query.from || '', to: query.to || '' })
})

route('GET', 'reports/activities.csv', STAFF, ({ query }) => {
  const { rows } = buildActivityReport({ from: query.from || '', to: query.to || '' })
  const header = [
    'Usuario',
    'Correo',
    'Rol',
    'Libro',
    'Actividades respondidas',
    'Aciertos trivia',
    'Porcentaje',
  ]
  const lines = [header.map(csvEscape).join(',')]
  for (const row of rows) {
    lines.push(
      [
        row.user.nombre,
        row.user.correo,
        row.user.rol,
        row.book.title,
        row.answered,
        row.correct,
        row.percentage,
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
        'Content-Disposition': `attachment; filename="reporte-actividades-${ymd()}.csv"`,
      },
    },
  }
})

/* --- Usuarios (solo bibliotecario) --------------------------------- */

route('GET', 'users', STAFF, () => {
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

route('POST', 'users', STAFF, ({ body }) => {
  const nombre = cleanText(body.nombre, 120, 'nombre')
  const correo = String(body.correo || '').trim().toLowerCase()
  if (!isEmail(correo)) throw httpError(400, 'El correo no es válido.')
  const tipoLector = String(body.tipoLector || 'estudiante')
  if (!['estudiante', 'docente'].includes(tipoLector)) {
    throw httpError(400, 'Tipo de lector inválido.')
  }
  const password = String(body.password || '')
  if (password.length < 6) throw httpError(400, 'La contraseña debe tener al menos 6 caracteres.')
  if (db.prepare('SELECT 1 FROM users WHERE correo = ?').get(correo)) {
    throw httpError(409, 'Ya existe un usuario con ese correo.')
  }
  const info = db
    .prepare(
      `INSERT INTO users (nombre, correo, rol, tipo_lector, active, password_hash, created_at)
       VALUES (?, ?, 'Lector', ?, 1, ?, ?)`
    )
    .run(nombre, correo, tipoLector, hashPassword(password), nowISO())
  const created = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid)
  return { user: publicUser(created) }
}, { status: 201 })

route('PATCH', 'users/:id/active', STAFF, ({ params, body, user }) => {
  const id = Number(params.id)
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!target) throw httpError(404, 'El usuario no existe.')
  if (target.id === user.id) throw httpError(409, 'No puedes desactivar tu propia cuenta.')
  const active = body.active ? 1 : 0
  db.prepare('UPDATE users SET active = ? WHERE id = ?').run(active, id)
  if (!active) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id)
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  return { user: publicUser(updated) }
})

/* --- Chat interno --------------------------------------------------- */

route('GET', 'chat/messages', READERS, ({ user }) => {
  const admins = staffIds()
  if (admins.length === 0) throw httpError(409, 'No hay un bibliotecario disponible para atender el chat.')
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
  const admins = staffIds()
  if (admins.length === 0) throw httpError(409, 'No hay un bibliotecario disponible para atender el chat.')
  const text = cleanText(body.text, 500, 'mensaje')
  const info = db
    .prepare('INSERT INTO messages (from_user, to_user, body, created_at) VALUES (?, ?, ?, ?)')
    .run(user.id, admins[0], text, nowISO())
  const created = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid)
  return { message: messageDto(created, user.id) }
}, { status: 201 })

route('GET', 'chat/unread', null, ({ user }) => {
  const admins = staffIds()
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

route('GET', 'chat/threads', STAFF, ({ user }) => {
  const admins = staffIds()
  const list = placeholders(admins.length)
  const users = db
    .prepare("SELECT id, nombre, correo, rol FROM users WHERE rol <> 'Bibliotecario' ORDER BY nombre")
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

route('GET', 'chat/threads/:userId', STAFF, ({ params, user }) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(params.userId))
  if (!target) throw httpError(404, 'El usuario no existe.')
  if (target.rol === 'Bibliotecario') throw httpError(400, 'No se puede abrir un chat de bibliotecario.')
  const admins = staffIds()
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

route('POST', 'chat/threads/:userId/messages', STAFF, ({ params, body, user }) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(params.userId))
  if (!target) throw httpError(404, 'El usuario no existe.')
  if (target.rol === 'Bibliotecario') throw httpError(400, 'No se puede enviar mensajes a otro bibliotecario.')
  const text = cleanText(body.text, 500, 'mensaje')
  const info = db
    .prepare('INSERT INTO messages (from_user, to_user, body, created_at) VALUES (?, ?, ?, ?)')
    .run(user.id, target.id, text, nowISO())
  const created = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid)
  return { message: messageDto(created, user.id) }
}, { status: 201 })

route('POST', 'chat/threads/:userId/read', STAFF, ({ params }) => {
  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(Number(params.userId))
  if (!target) throw httpError(404, 'El usuario no existe.')
  const admins = staffIds()
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
