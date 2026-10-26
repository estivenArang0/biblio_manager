import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test, { after, before } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))
const port = 4124
const base = `http://127.0.0.1:${port}/api`
const dbFile = path.join(os.tmpdir(), `biblio-session-${process.pid}-${Date.now()}.db`)
const password = process.env.DEMO_PASSWORD || '123456'
let server
let token

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function request(pathname, options = {}) {
  const headers = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`
  const response = await fetch(`${base}${pathname}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { status: response.status, body }
}

before(async () => {
  server = spawn(process.execPath, ['server/index.js'], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      BIBLIO_DB: dbFile,
      DEMO_PASSWORD: password,
      SESSION_IDLE_SECONDS: '1',
    },
    stdio: 'ignore',
  })
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const probe = await request('/auth/login', {
        method: 'POST',
        body: { correo: 'no@tdea.edu.co', password: 'x' },
      })
      if (probe.status === 401) break
    } catch {
      /* aún no escucha */
    }
    await sleep(250)
  }
  const login = await request('/auth/login', {
    method: 'POST',
    body: { correo: 'estudiante@tdea.edu.co', password },
  })
  assert.equal(login.status, 200)
  token = login.body.token
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
      /* Windows puede retener el archivo un instante */
    }
  }
})

test('la actividad renueva la sesión y 1 s de inactividad la invalida', async () => {
  const inicial = await request('/auth/me', { token })
  assert.equal(inicial.status, 200)

  await sleep(500)
  const actividad1 = await request('/auth/me', { token })
  assert.equal(actividad1.status, 200)

  await sleep(500)
  const actividad2 = await request('/auth/me', { token })
  assert.equal(actividad2.status, 200)

  await sleep(1400)
  const vencida = await request('/auth/me', { token })
  assert.equal(vencida.status, 401)
  assert.equal(vencida.body.error, 'Tu sesión venció por inactividad.')
  assert.equal(vencida.body.code, 'SESSION_IDLE')

  // La sesión se eliminó: no se puede reutilizar el token.
  const reutilizada = await request('/auth/me', { token })
  assert.equal(reutilizada.status, 401)
})
