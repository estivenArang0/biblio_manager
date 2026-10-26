import { createServer } from './app.js'
import { dbPath } from './db.js'

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
