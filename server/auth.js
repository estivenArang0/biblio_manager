import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * Utilidades de autenticación sin dependencias externas.
 * Las contraseñas se guardan como `salt:hash` usando scrypt.
 */
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(String(password), salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  try {
    const candidate = scryptSync(String(password), salt, 64)
    const expected = Buffer.from(hash, 'hex')
    if (candidate.length !== expected.length) return false
    return timingSafeEqual(candidate, expected)
  } catch {
    return false
  }
}

export function createToken() {
  return randomBytes(32).toString('hex')
}
