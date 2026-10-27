import { loadEnvFile } from 'node:process'

// Carga .env para `npm run dev`/`npm run server`. En pruebas BIBLIO_DB ya viene
// definido y no se toca el entorno.
if (!process.env.BIBLIO_DB) {
  try {
    loadEnvFile(new URL('../.env', import.meta.url))
  } catch {
    /* .env es opcional */
  }
}

const { createServer } = await import('./app.js')
const { dbPath } = await import('./db.js')

const port = Number(process.env.PORT || 4000)
const server = createServer()

server.listen(port, () => {
  console.log(`[biblio-api] escuchando en http://localhost:${port}`)
  console.log(`[biblio-api] base de datos: ${dbPath}`)
})

function shutdown(signal) {
  console.log(`\n[biblio-api] ${signal}: cerrando…`)
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 3000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
