import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Levanta el API (puerto 4000) y Vite (puerto 5173) en un solo comando,
 * sin dependencias extra. Al cerrar con Ctrl+C se detienen ambos.
 */
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const children = []

function start(args) {
  const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit' })
  children.push(child)
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[dev] proceso terminado con código ${code}`)
      shutdown()
    }
  })
  return child
}

let closing = false
function shutdown() {
  if (closing) return
  closing = true
  children.forEach((child) => {
    try {
      child.kill()
    } catch {
      /* ya terminó */
    }
  })
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

start(['server/index.js'])
start(['node_modules/vite/bin/vite.js'])
