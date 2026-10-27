import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import test, { after, before } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))
const port = 4123
const base = `http://127.0.0.1:${port}/api`
let dbFile = path.join(os.tmpdir(), `biblio-test-${process.pid}.db`)
let server
let googleMock
let lastGoogleKey = null
const password = process.env.DEMO_PASSWORD || '123456'

const tokens = {}
const users = {}

async function request(pathname, { method = 'GET', token, body, raw = false } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (raw) return { status: response.status, headers: response.headers, text: await response.text() }
  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { status: response.status, body: data }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'no@tdea.edu.co', password: 'x' }),
      })
      if (response.status === 401) return
    } catch {
      /* aún no escucha */
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('El servidor de pruebas no arrancó')
}

async function login(correo) {
  const response = await request('/auth/login', {
    method: 'POST',
    body: { correo, password },
  })
  assert.equal(response.status, 200, `login ${correo}`)
  return response.body
}

before(async () => {
  // Archivo único por ejecución para evitar bloqueos de Windows entre corridas.
  dbFile = path.join(os.tmpdir(), `biblio-test-${process.pid}-${Date.now()}.db`)
  googleMock = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1')
    if (!url.pathname.endsWith('/volumes')) {
      res.writeHead(404).end()
      return
    }
    const isbn = String(url.searchParams.get('q') || '').replace('isbn:', '')
    lastGoogleKey = url.searchParams.get('key')
    if (isbn === '9780307474728') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ items: [] }))
      return
    }
    if (isbn === '9788417846184') {
      res.writeHead(429, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: { code: 429 } }))
      return
    }
    if (isbn !== '9788437604947') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ items: [] }))
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        items: [
          {
            volumeInfo: {
              title: 'Don Quijote de la Mancha',
              authors: ['Miguel de Cervantes Saavedra'],
              categories: ['Ficción clásica'],
              description: '<p>Novela clásica de la literatura española.</p>',
              imageLinks: { thumbnail: 'http://books.google.com/portada.jpg' },
              publishedDate: '2005-01-01',
            },
          },
        ],
      })
    )
  })
  await new Promise((resolve) => googleMock.listen(4125, '127.0.0.1', resolve))
  server = spawn(process.execPath, ['server/index.js'], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      BIBLIO_DB: dbFile,
      DEMO_PASSWORD: password,
      GOOGLE_BOOKS_URL: 'http://127.0.0.1:4125/books/v1/volumes',
      GOOGLE_BOOKS_API_KEY: 'test-key',
    },
    stdio: 'ignore',
  })
  await waitForServer()

  for (const [key, correo] of Object.entries({
    estudiante: 'estudiante@tdea.edu.co',
    mateo: 'mateo.gomez@tdea.edu.co',
    docente: 'profesor.jaramillo@tdea.edu.co',
    bibliotecario: 'bibliotecario.central@tdea.edu.co',
    admin: 'admin@tdea.edu.co',
  })) {
    const data = await login(correo)
    tokens[key] = data.token
    users[key] = data.user
  }
})

after(async () => {
  if (server) {
    server.kill()
    await new Promise((resolve) => {
      server.once('exit', resolve)
      setTimeout(resolve, 2000)
    })
  }
  for (const file of [dbFile, `${dbFile}-wal`, `${dbFile}-shm`]) {
    try {
      fs.rmSync(file, { force: true })
    } catch {
      /* Windows puede retener el archivo un instante; no afecta el resultado */
    }
  }
  await new Promise((resolve) => googleMock.close(resolve))
})

test('autenticación: credenciales inválidas y acceso anónimo', async () => {
  const invalid = await request('/auth/login', {
    method: 'POST',
    body: { correo: 'estudiante@tdea.edu.co', password: 'incorrecta' },
  })
  assert.equal(invalid.status, 401)

  const anonymous = await request('/books')
  assert.equal(anonymous.status, 401)

  const me = await request('/auth/me', { token: tokens.estudiante })
  assert.equal(me.status, 200)
  assert.equal(me.body.user.rol, 'Estudiante')
})

test('permisos: cada rol solo accede a lo suyo', async () => {
  assert.equal((await request('/users', { token: tokens.estudiante })).status, 403)
  assert.equal((await request('/users', { token: tokens.bibliotecario })).status, 403)
  assert.equal((await request('/reports/loans', { token: tokens.estudiante })).status, 403)
  assert.equal((await request('/loans/pending', { token: tokens.estudiante })).status, 403)
  assert.equal((await request('/chat/threads', { token: tokens.estudiante })).status, 403)
  assert.equal((await request('/reports/loans', { token: tokens.bibliotecario })).status, 200)
  assert.equal((await request('/users', { token: tokens.admin })).status, 200)

  const studentCreateBook = await request('/books', {
    method: 'POST',
    token: tokens.estudiante,
    body: { title: 'Intento', author: 'Nadie' },
  })
  assert.equal(studentCreateBook.status, 403)

  const librarianLoan = await request('/loans', {
    method: 'POST',
    token: tokens.bibliotecario,
    body: { bookId: 'quijote' },
  })
  assert.equal(librarianLoan.status, 403)

  const studentHistory = await request('/history', { token: tokens.estudiante })
  assert.equal(studentHistory.status, 200)
  assert.equal(studentHistory.body.scope, 'personal')
  assert.ok(studentHistory.body.loans.every((loan) => loan.user?.id === users.estudiante.id))

  const staffHistory = await request('/history', { token: tokens.bibliotecario })
  assert.equal(staffHistory.body.scope, 'global')
})

test('catálogo: sin etiquetas de "prestado" y con préstamo propio resumido', async () => {
  const response = await request('/books', { token: tokens.estudiante })
  assert.equal(response.status, 200)
  const quijote = response.body.books.find((book) => book.id === 'quijote')
  assert.ok(quijote)
  assert.ok(!/prestado|en préstamo/i.test(quijote.availabilityLabel))
  assert.equal(quijote.myLoan.status, 'activo')
  assert.equal(quijote.digital, true)

  const cienAnos = response.body.books.find((book) => book.id === 'cien-anos')
  assert.equal(cienAnos.digital, false)
  assert.equal(cienAnos.myLoan.status, 'activo')
})

test('lectura: 403 sin préstamo activo, físico o vencido', async () => {
  const ok = await request('/reading/quijote/page/0', { token: tokens.estudiante })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.paragraphs.length, 4)

  const fisico = await request('/reading/cien-anos/page/0', { token: tokens.estudiante })
  assert.equal(fisico.status, 403)

  const devuelto = await request('/reading/semiotica/page/0', { token: tokens.estudiante })
  assert.equal(devuelto.status, 403)

  const vencido = await request('/reading/aleph/page/0', { token: tokens.estudiante })
  assert.equal(vencido.status, 403)

  const ajeno = await request('/reading/quijote/page/0', { token: tokens.mateo })
  assert.equal(ajeno.status, 403)

  const sinToken = await request('/reading/quijote/page/0')
  assert.equal(sinToken.status, 401)
})

test('flujo de préstamo: solicitud, aprobación, lectura y devolución', async () => {
  const solicitud = await request('/loans', {
    method: 'POST',
    token: tokens.mateo,
    body: { bookId: 'quijote' },
  })
  assert.equal(solicitud.status, 201)
  assert.equal(solicitud.body.loan.status, 'pendiente')

  const duplicada = await request('/loans', {
    method: 'POST',
    token: tokens.mateo,
    body: { bookId: 'quijote' },
  })
  assert.equal(duplicada.status, 409)

  const pendientes = await request('/loans/pending', { token: tokens.bibliotecario })
  const creada = pendientes.body.loans.find((loan) => loan.id === solicitud.body.loan.id)
  assert.ok(creada)

  const aprobada = await request(`/loans/${creada.id}/approve`, {
    method: 'PATCH',
    token: tokens.bibliotecario,
  })
  assert.equal(aprobada.status, 200)
  assert.equal(aprobada.body.loan.status, 'activo')
  assert.equal(aprobada.body.loan.daysLeft, 8)

  const lectura = await request('/reading/quijote/page/1', { token: tokens.mateo })
  assert.equal(lectura.status, 200)

  const devuelta = await request(`/loans/${creada.id}/return`, {
    method: 'PATCH',
    token: tokens.bibliotecario,
  })
  assert.equal(devuelta.status, 200)
  assert.equal(devuelta.body.loan.status, 'devuelto')

  const lecturaCerrada = await request('/reading/quijote/page/1', { token: tokens.mateo })
  assert.equal(lecturaCerrada.status, 403)
})

test('subrayados: se guardan por usuario y libro, y solo los ve su dueño', async () => {
  const creado = await request('/highlights', {
    method: 'POST',
    token: tokens.estudiante,
    body: {
      bookId: 'quijote',
      page: 0,
      blockIndex: 0,
      startOffset: 0,
      endOffset: 20,
      text: 'En esto, descubrieron',
      color: 'amarillo',
      note: 'Primera nota',
    },
  })
  assert.equal(creado.status, 201)
  const id = creado.body.highlight.id

  const propios = await request('/highlights?bookId=quijote', { token: tokens.estudiante })
  assert.equal(propios.status, 200)
  assert.ok(propios.body.highlights.some((item) => item.id === id && item.note === 'Primera nota'))

  const ajenos = await request('/highlights?bookId=quijote', { token: tokens.mateo })
  assert.equal(ajenos.status, 200)
  assert.ok(!ajenos.body.highlights.some((item) => item.id === id))

  const edicionAjena = await request(`/highlights/${id}`, {
    method: 'PUT',
    token: tokens.mateo,
    body: { note: 'intruso' },
  })
  assert.equal(edicionAjena.status, 404)

  const editado = await request(`/highlights/${id}`, {
    method: 'PUT',
    token: tokens.estudiante,
    body: { color: 'verde', note: 'Nota editada' },
  })
  assert.equal(editado.status, 200)
  assert.equal(editado.body.highlight.color, 'verde')
  assert.equal(editado.body.highlight.note, 'Nota editada')

  const colorInvalido = await request('/highlights', {
    method: 'POST',
    token: tokens.estudiante,
    body: {
      bookId: 'quijote',
      page: 0,
      blockIndex: 0,
      startOffset: 0,
      endOffset: 2,
      text: 'En',
      color: 'rojo',
    },
  })
  assert.equal(colorInvalido.status, 400)

  const eliminar = await request(`/highlights/${id}`, {
    method: 'DELETE',
    token: tokens.estudiante,
  })
  assert.equal(eliminar.status, 200)

  const despues = await request('/highlights?bookId=quijote', { token: tokens.estudiante })
  assert.ok(!despues.body.highlights.some((item) => item.id === id))
})

test('historial: registra apertura y cierre de lectura', async () => {
  await request('/reading/quijote/session', {
    method: 'POST',
    token: tokens.estudiante,
    body: { event: 'open' },
  })
  await request('/reading/quijote/session', {
    method: 'POST',
    token: tokens.estudiante,
    body: { event: 'close' },
  })
  const history = await request('/history', { token: tokens.estudiante })
  assert.equal(history.status, 200)
  const propios = history.body.events.filter((event) => event.bookId === 'quijote')
  assert.ok(propios.some((event) => event.event === 'open'))
  assert.ok(propios.some((event) => event.event === 'close'))
})

test('chat: usuario ↔ administrador, sin leer, límite y aislamiento', async () => {
  const enviado = await request('/chat/messages', {
    method: 'POST',
    token: tokens.estudiante,
    body: { text: '¿Puedo renovar mi préstamo?' },
  })
  assert.equal(enviado.status, 201)

  const hilos = await request('/chat/threads', { token: tokens.admin })
  assert.equal(hilos.status, 200)
  const hilo = hilos.body.threads.find((item) => item.user.id === users.estudiante.id)
  assert.ok(hilo)
  assert.ok(hilo.unread >= 1)

  const conversacion = await request(`/chat/threads/${users.estudiante.id}`, { token: tokens.admin })
  assert.equal(conversacion.status, 200)
  assert.ok(conversacion.body.messages.some((message) => message.text.includes('renovar')))

  const respuesta = await request(`/chat/threads/${users.estudiante.id}/messages`, {
    method: 'POST',
    token: tokens.admin,
    body: { text: 'Claro, pásate por la biblioteca.' },
  })
  assert.equal(respuesta.status, 201)

  const vistaUsuario = await request('/chat/messages', { token: tokens.estudiante })
  assert.equal(vistaUsuario.status, 200)
  assert.ok(vistaUsuario.body.messages.some((message) => message.text.includes('biblioteca')))

  const noLeidos = await request('/chat/unread', { token: tokens.estudiante })
  assert.equal(noLeidos.body.unread, 0)

  const ajeno = await request(`/chat/threads/${users.mateo.id}`, { token: tokens.estudiante })
  assert.equal(ajeno.status, 403)

  const largo = await request('/chat/messages', {
    method: 'POST',
    token: tokens.estudiante,
    body: { text: 'x'.repeat(501) },
  })
  assert.equal(largo.status, 400)

  const vacio = await request('/chat/messages', {
    method: 'POST',
    token: tokens.estudiante,
    body: { text: '   ' },
  })
  assert.equal(vacio.status, 400)
})

test('reportes: filtros, totales y exportación CSV', async () => {
  const estudiantes = await request('/reports/loans?scope=estudiantes', { token: tokens.bibliotecario })
  assert.equal(estudiantes.status, 200)
  assert.ok(estudiantes.body.rows.length > 0)
  assert.ok(estudiantes.body.rows.every((row) => row.user.rol === 'Estudiante'))
  assert.equal(
    estudiantes.body.totals.total,
    estudiantes.body.totals.activos + estudiantes.body.totals.vencidos + estudiantes.body.totals.devueltos
  )

  const docentes = await request('/reports/loans?scope=docentes', { token: tokens.bibliotecario })
  assert.ok(docentes.body.rows.length > 0)
  assert.ok(docentes.body.rows.every((row) => row.user.rol === 'Docente'))

  const activos = await request('/reports/loans?scope=todos&status=activo', { token: tokens.bibliotecario })
  assert.ok(activos.body.rows.every((row) => row.status === 'activo'))

  const csv = await request('/reports/loans.csv?scope=todos', {
    token: tokens.bibliotecario,
    raw: true,
  })
  assert.equal(csv.status, 200)
  assert.match(csv.headers.get('content-type'), /text\/csv/)
  assert.match(csv.headers.get('content-disposition') || '', /attachment/)
  assert.ok(csv.text.includes('Usuario'))

  const csvEstudiante = await request('/reports/loans.csv', {
    token: tokens.estudiante,
    raw: true,
  })
  assert.equal(csvEstudiante.status, 403)
})

test('libros: solo bibliotecario/administrador registran y editan', async () => {
  const creado = await request('/books', {
    method: 'POST',
    token: tokens.bibliotecario,
    body: {
      title: 'Libro de prueba automatizada',
      author: 'Equipo de pruebas',
      genre: 'Pruebas',
      format: 'Digital',
      signature: 'TST-001',
    },
  })
  assert.equal(creado.status, 201)
  assert.equal(creado.body.book.digital, true)

  const editado = await request(`/books/${creado.body.book.id}`, {
    method: 'PUT',
    token: tokens.bibliotecario,
    body: { title: 'Libro de prueba editado', author: 'Equipo de pruebas' },
  })
  assert.equal(editado.status, 200)
  assert.equal(editado.body.book.title, 'Libro de prueba editado')
})

test('usuarios: el administrador crea cuentas y cambia roles', async () => {
  const correo = `nuevo.${Date.now()}@tdea.edu.co`
  const creado = await request('/users', {
    method: 'POST',
    token: tokens.admin,
    body: { nombre: 'Nuevo Usuario', correo, rol: 'Docente', password: 'abc123' },
  })
  assert.equal(creado.status, 201)

  const loginNuevo = await request('/auth/login', {
    method: 'POST',
    body: { correo, password: 'abc123' },
  })
  assert.equal(loginNuevo.status, 200)
  assert.equal(loginNuevo.body.user.rol, 'Docente')

  const cambio = await request(`/users/${creado.body.user.id}/role`, {
    method: 'PATCH',
    token: tokens.admin,
    body: { rol: 'Bibliotecario' },
  })
  assert.equal(cambio.status, 200)
  assert.equal(cambio.body.user.rol, 'Bibliotecario')

  const autoCambio = await request(`/users/${users.admin.id}/role`, {
    method: 'PATCH',
    token: tokens.admin,
    body: { rol: 'Estudiante' },
  })
  assert.equal(autoCambio.status, 409)

  const duplicado = await request('/users', {
    method: 'POST',
    token: tokens.admin,
    body: { nombre: 'Duplicado', correo, rol: 'Estudiante', password: 'abc123' },
  })
  assert.equal(duplicado.status, 409)
})

test('préstamo directo: busca, valida vencidos y descuenta ejemplares', async () => {
  const options = await request(
    '/loans/direct/options?userQuery=mateo&bookQuery=formas',
    { token: tokens.bibliotecario }
  )
  assert.equal(options.status, 200)
  const mateo = options.body.users.find((user) => user.id === users.mateo.id)
  const book = options.body.books.find((item) => item.id === 'formas-tipograficas')
  assert.ok(mateo)
  assert.ok(book)
  const copiesBefore = book.copiesAvailable
  assert.ok(copiesBefore > 0)

  const bloqueado = await request('/loans/direct', {
    method: 'POST',
    token: tokens.bibliotecario,
    body: { userId: users.estudiante.id, bookId: 'formas-tipograficas', dueDate: '2099-01-01' },
  })
  assert.equal(bloqueado.status, 409)
  assert.match(bloqueado.body.error, /vencido/i)

  const hoy = new Date()
  hoy.setDate(hoy.getDate() + 10)
  const dueDate = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

  const directo = await request('/loans/direct', {
    method: 'POST',
    token: tokens.bibliotecario,
    body: { userId: users.mateo.id, bookId: 'formas-tipograficas', dueDate },
  })
  assert.equal(directo.status, 201)
  assert.equal(directo.body.loan.status, 'activo')
  assert.equal(directo.body.loan.dueDate, dueDate)
  assert.equal(directo.body.loan.user.id, users.mateo.id)

  const mis = await request('/loans/mine', { token: tokens.mateo })
  assert.ok(mis.body.loans.some((loan) => loan.id === directo.body.loan.id))

  const lectura = await request('/reading/formas-tipograficas/page/0', { token: tokens.mateo })
  assert.equal(lectura.status, 200)

  const optionsAfter = await request(
    '/loans/direct/options?userQuery=mateo&bookQuery=formas',
    { token: tokens.bibliotecario }
  )
  const bookAfter = optionsAfter.body.books.find((item) => item.id === 'formas-tipograficas')
  assert.equal(bookAfter.copiesAvailable, copiesBefore - 1)

  const devuelto = await request(`/loans/${directo.body.loan.id}/return`, {
    method: 'PATCH',
    token: tokens.bibliotecario,
  })
  assert.equal(devuelto.status, 200)
})

test('préstamo directo: rechaza cuando no quedan ejemplares', async () => {
  const libro = await request('/books', {
    method: 'POST',
    token: tokens.bibliotecario,
    body: {
      title: `Libro sin copias ${Date.now()}`,
      author: 'Pruebas',
      format: 'Digital',
      copiesTotal: 1,
    },
  })
  assert.equal(libro.status, 201)

  const primero = await request('/loans/direct', {
    method: 'POST',
    token: tokens.bibliotecario,
    body: { userId: users.mateo.id, bookId: libro.body.book.id, dueDate: '2099-01-01' },
  })
  assert.equal(primero.status, 201)

  const segundo = await request('/loans/direct', {
    method: 'POST',
    token: tokens.bibliotecario,
    body: { userId: users.docente.id, bookId: libro.body.book.id, dueDate: '2099-01-01' },
  })
  assert.equal(segundo.status, 409)
  assert.match(segundo.body.error, /ejemplares/i)
})

test('Google Books: metadatos por ISBN con timeout y permisos', async () => {
  const encontrado = await request('/books/isbn/9788437604947', {
    token: tokens.bibliotecario,
  })
  assert.equal(encontrado.status, 200)
  assert.equal(encontrado.body.found, true)
  assert.equal(encontrado.body.source, 'google')
  assert.match(encontrado.body.data.title, /Quijote/i)
  assert.match(encontrado.body.data.image, /^https:/)
  assert.ok(!encontrado.body.data.description.includes('<p>'))
  assert.equal(lastGoogleKey, 'test-key')

  const respaldoSinResultados = await request('/books/isbn/9780307474728', {
    token: tokens.bibliotecario,
  })
  assert.equal(respaldoSinResultados.status, 200)
  assert.equal(respaldoSinResultados.body.found, true)
  assert.equal(respaldoSinResultados.body.source, 'local')
  assert.match(respaldoSinResultados.body.data.title, /Cien a/i)

  const respaldoPorCuota = await request('/books/isbn/9788417846184', {
    token: tokens.bibliotecario,
  })
  assert.equal(respaldoPorCuota.status, 200)
  assert.equal(respaldoPorCuota.body.found, true)
  assert.equal(respaldoPorCuota.body.source, 'local')
  assert.match(respaldoPorCuota.body.data.title, /infinito/i)

  const inexistente = await request('/books/isbn/9780000000002', {
    token: tokens.bibliotecario,
  })
  assert.equal(inexistente.status, 200)
  assert.equal(inexistente.body.found, false)

  const invalido = await request('/books/isbn/abc', { token: tokens.bibliotecario })
  assert.equal(invalido.status, 400)

  const estudiante = await request('/books/isbn/9788437604947', {
    token: tokens.estudiante,
  })
  assert.equal(estudiante.status, 403)
})

test('perfil: cambio de contraseña con verificación y mínimo 8', async () => {
  const correo = `clave.${Date.now()}@tdea.edu.co`
  const creado = await request('/users', {
    method: 'POST',
    token: tokens.admin,
    body: { nombre: 'Cambio Clave', correo, rol: 'Estudiante', password: 'Inicial123' },
  })
  assert.equal(creado.status, 201)

  const sesion = await request('/auth/login', {
    method: 'POST',
    body: { correo, password: 'Inicial123' },
  })
  assert.equal(sesion.status, 200)

  const incorrecta = await request('/auth/password', {
    method: 'PATCH',
    token: sesion.body.token,
    body: { currentPassword: 'otra', newPassword: 'NuevaClave2026' },
  })
  assert.equal(incorrecta.status, 400)

  const corta = await request('/auth/password', {
    method: 'PATCH',
    token: sesion.body.token,
    body: { currentPassword: 'Inicial123', newPassword: 'corta' },
  })
  assert.equal(corta.status, 400)

  const ok = await request('/auth/password', {
    method: 'PATCH',
    token: sesion.body.token,
    body: { currentPassword: 'Inicial123', newPassword: 'NuevaClave2026' },
  })
  assert.equal(ok.status, 200)

  const anterior = await request('/auth/login', {
    method: 'POST',
    body: { correo, password: 'Inicial123' },
  })
  assert.equal(anterior.status, 401)

  const nueva = await request('/auth/login', {
    method: 'POST',
    body: { correo, password: 'NuevaClave2026' },
  })
  assert.equal(nueva.status, 200)
})

test('contenido: el bibliotecario edita bloques y trivias; el lector los recibe', async () => {
  const contenido = await request('/books/quijote/content', {
    token: tokens.bibliotecario,
  })
  assert.equal(contenido.status, 200)
  assert.ok(contenido.body.blocks.length >= 3)

  const guardado = await request('/books/quijote/content', {
    method: 'PUT',
    token: tokens.bibliotecario,
    body: {
      blocks: [
        {
          chapter: 'BLOQUE UNO',
          text: 'Primer párrafo del bloque uno.\n\nSegundo párrafo del bloque uno.',
          question: '¿Qué se narra en el bloque uno?',
          options: ['Una aventura', 'Una receta', 'Un tratado'],
          correctOption: 'A',
          explanation: 'Se narra una aventura.',
        },
        {
          chapter: 'BLOQUE DOS',
          text: 'Texto del segundo bloque.',
          question: '',
          options: [],
        },
        {
          chapter: 'BLOQUE TRES',
          text: 'Texto del tercer bloque.',
          question: 'Reflexiona sobre el final del texto.',
          options: [],
        },
      ],
    },
  })
  assert.equal(guardado.status, 200)
  assert.equal(guardado.body.total, 3)

  const estudiante = await request('/books/quijote/content', {
    token: tokens.estudiante,
  })
  assert.equal(estudiante.status, 403)

  const pagina = await request('/reading/quijote/page/2', { token: tokens.estudiante })
  assert.equal(pagina.status, 200)
  assert.equal(pagina.body.chapter, 'BLOQUE TRES')
  assert.equal(pagina.body.trivia.type, 'reflection')

  const primera = await request('/reading/quijote/page/0', { token: tokens.estudiante })
  assert.equal(primera.body.paragraphs.length, 2)
  assert.equal(primera.body.trivia.correctOption, 'A')
})

test('actividades: guarda último intento, suma una sola vez y alimenta historial/reportes', async () => {
  const incorrecta = await request('/reading/quijote/activity', {
    method: 'POST',
    token: tokens.estudiante,
    body: { blockIndex: 0, type: 'trivia', answer: 'B' },
  })
  assert.equal(incorrecta.status, 201)
  assert.equal(incorrecta.body.result.isCorrect, false)
  assert.equal(incorrecta.body.totals.score, 0)

  const correcta = await request('/reading/quijote/activity', {
    method: 'POST',
    token: tokens.estudiante,
    body: { blockIndex: 0, type: 'trivia', answer: 'A' },
  })
  assert.equal(correcta.status, 201)
  assert.equal(correcta.body.result.isCorrect, true)
  assert.equal(correcta.body.totals.score, 100)
  assert.equal(correcta.body.totals.answered, 1)

  const repetida = await request('/reading/quijote/activity', {
    method: 'POST',
    token: tokens.estudiante,
    body: { blockIndex: 0, type: 'trivia', answer: 'A' },
  })
  assert.equal(repetida.status, 201)
  assert.equal(repetida.body.totals.score, 100)
  assert.equal(repetida.body.totals.answered, 1)

  const reflexion = await request('/reading/quijote/activity', {
    method: 'POST',
    token: tokens.estudiante,
    body: {
      blockIndex: 2,
      type: 'reflection',
      answer: 'Relaciono los molinos con las expectativas que no coinciden con los hechos.',
    },
  })
  assert.equal(reflexion.status, 201)
  assert.equal(reflexion.body.result.activityType, 'reflection')
  assert.equal(reflexion.body.result.isCorrect, null)
  assert.equal(reflexion.body.totals.answered, 2)
  assert.equal(reflexion.body.totals.score, 150)

  const guardadas = await request('/reading/quijote/activity', { token: tokens.estudiante })
  assert.equal(guardadas.status, 200)
  assert.equal(guardadas.body.activities.length, 2)
  assert.equal(guardadas.body.totals.correct, 1)

  const historial = await request('/history', { token: tokens.estudiante })
  assert.equal(historial.status, 200)
  assert.ok(historial.body.activities.some((item) => item.activityType === 'trivia'))
  assert.ok(historial.body.activities.some((item) => item.activityType === 'reflection'))

  const historialGlobal = await request('/history', { token: tokens.bibliotecario })
  assert.ok(historialGlobal.body.activities.some((item) => item.user.id === users.estudiante.id))

  const reporte = await request('/reports/activities', { token: tokens.bibliotecario })
  assert.equal(reporte.status, 200)
  const fila = reporte.body.rows.find(
    (item) => item.user.id === users.estudiante.id && item.book.id === 'quijote'
  )
  assert.ok(fila)
  assert.equal(fila.answered, 2)
  assert.equal(fila.correct, 1)
  assert.equal(fila.score, 150)
  assert.ok(reporte.body.totals.answered >= 2)

  const csv = await request('/reports/activities.csv', {
    token: tokens.bibliotecario,
    raw: true,
  })
  assert.equal(csv.status, 200)
  assert.match(csv.text, /Actividades respondidas/)
  assert.ok(csv.text.includes('Ana María Restrepo'))

  const denegado = await request('/reports/activities', { token: tokens.estudiante })
  assert.equal(denegado.status, 403)
})
