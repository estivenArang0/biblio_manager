import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { hashPassword } from './auth.js'
import {
  DEMO_PASSWORD,
  buildSeedLoans,
  buildSeedReadingEvents,
  seedBooks,
  seedUsers,
} from './seed.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const defaultPath = path.join(here, 'data', 'biblio.db')
export const dbPath = process.env.BIBLIO_DB || defaultPath

let database = null

function migrate(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL UNIQUE COLLATE NOCASE,
      rol TEXT NOT NULL CHECK (rol IN ('Estudiante','Docente','Bibliotecario','Administrador')),
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      tag TEXT DEFAULT '',
      genre TEXT DEFAULT '',
      isbn TEXT DEFAULT '',
      signature TEXT DEFAULT '',
      year TEXT DEFAULT '',
      format TEXT DEFAULT 'Digital',
      digital INTEGER NOT NULL DEFAULT 0,
      physical INTEGER NOT NULL DEFAULT 0,
      image TEXT DEFAULT '',
      description TEXT DEFAULT '',
      copies_total INTEGER NOT NULL DEFAULT 3,
      copies_available INTEGER NOT NULL DEFAULT 3,
      pages_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id TEXT NOT NULL REFERENCES books(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pendiente',
      loan_date TEXT,
      due_date TEXT,
      returned_at TEXT,
      requested_days INTEGER,
      approved_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reading_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      book_id TEXT NOT NULL REFERENCES books(id),
      event TEXT NOT NULL CHECK (event IN ('open','close')),
      at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      book_id TEXT NOT NULL REFERENCES books(id),
      page INTEGER NOT NULL,
      block_index INTEGER NOT NULL,
      start_offset INTEGER NOT NULL,
      end_offset INTEGER NOT NULL,
      text TEXT NOT NULL,
      color TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user INTEGER NOT NULL REFERENCES users(id),
      to_user INTEGER NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);
    CREATE INDEX IF NOT EXISTS idx_loans_book ON loans(book_id);
    CREATE INDEX IF NOT EXISTS idx_events_user ON reading_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_highlights_user_book ON highlights(user_id, book_id);
    CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_user);
    CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_user);
  `)

  // Migración suave para bases creadas con la versión anterior.
  const sessionColumns = db.prepare('PRAGMA table_info(sessions)').all()
  if (!sessionColumns.some((column) => column.name === 'last_seen_at')) {
    db.exec('ALTER TABLE sessions ADD COLUMN last_seen_at TEXT')
    db.exec('UPDATE sessions SET last_seen_at = created_at WHERE last_seen_at IS NULL')
  }
  const bookColumns = db.prepare('PRAGMA table_info(books)').all()
  if (!bookColumns.some((column) => column.name === 'copies_total')) {
    db.exec('ALTER TABLE books ADD COLUMN copies_total INTEGER NOT NULL DEFAULT 3')
  }
  if (!bookColumns.some((column) => column.name === 'copies_available')) {
    db.exec('ALTER TABLE books ADD COLUMN copies_available INTEGER NOT NULL DEFAULT 3')
  }
}

function seed(db) {
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM users').get()
  if (total > 0) return

  const now = new Date().toISOString()
  const insertUser = db.prepare(
    'INSERT INTO users (nombre, correo, rol, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
  )
  const passwordHash = hashPassword(DEMO_PASSWORD)
  for (const user of seedUsers) {
    insertUser.run(user.nombre, user.correo, user.rol, passwordHash, now)
  }

  const seedLoans = buildSeedLoans()
  const activeByBook = new Map()
  for (const loan of seedLoans) {
    if (loan.status === 'devuelto' || loan.status === 'pendiente') continue
    activeByBook.set(loan.book, (activeByBook.get(loan.book) || 0) + 1)
  }

  const insertBook = db.prepare(`
    INSERT INTO books (id, title, author, tag, genre, isbn, signature, year, format, digital, physical, image, description, copies_total, copies_available, pages_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const book of seedBooks) {
    const copiesTotal = 5
    const copiesAvailable = Math.max(0, copiesTotal - (activeByBook.get(book.id) || 0))
    insertBook.run(
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
      copiesTotal,
      copiesAvailable,
      JSON.stringify(book.pages),
      now
    )
  }

  const userId = new Map(
    db.prepare('SELECT id, correo FROM users').all().map((row) => [row.correo, row.id])
  )
  const librarianId = userId.get('bibliotecario.central@tdea.edu.co')
  const insertLoan = db.prepare(`
    INSERT INTO loans (book_id, user_id, status, loan_date, due_date, returned_at, requested_days, approved_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const loan of seedLoans) {
    insertLoan.run(
      loan.book,
      userId.get(loan.user),
      loan.status,
      loan.loanDate,
      loan.dueDate,
      loan.returnedAt || null,
      loan.requestedDays,
      librarianId,
      now
    )
  }

  const insertEvent = db.prepare(
    'INSERT INTO reading_events (user_id, book_id, event, at) VALUES (?, ?, ?, ?)'
  )
  for (const event of buildSeedReadingEvents()) {
    insertEvent.run(userId.get(event.user), event.book, event.event, event.at)
  }

  const adminId = userId.get('admin@tdea.edu.co')
  const studentId = userId.get('estudiante@tdea.edu.co')
  if (adminId && studentId) {
    db.prepare(
      'INSERT INTO messages (from_user, to_user, body, created_at) VALUES (?, ?, ?, ?)'
    ).run(
      studentId,
      adminId,
      'Buenas tardes, ¿es posible renovar el préstamo de Cien Años de Soledad unos días más?',
      now
    )
  }
}

export function getDb() {
  if (database) return database
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }
  database = new DatabaseSync(dbPath)
  database.exec('PRAGMA journal_mode = WAL;')
  migrate(database)
  seed(database)
  return database
}
