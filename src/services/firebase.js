import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

/**
 * Configuración de Firebase tomada de variables de entorno.
 * La configuración web de Firebase no es un secreto, pero se mantiene fuera
 * del repositorio para poder usar proyectos distintos en local y producción.
 *
 * Plantilla: .env.example  ·  Documentación: README.md
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseEnvKeys = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
}

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => firebaseEnvKeys[key])

/** `true` cuando todas las variables VITE_FIREBASE_* están definidas. */
export const isFirebaseConfigured = missingKeys.length === 0

if (!isFirebaseConfigured) {
  console.warn(
    '[firebase] Configuración incompleta. Copia .env.example a .env y completa: ' +
      missingKeys.join(', ')
  )
}

const app = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

/**
 * `getAuth()` lanza `auth/invalid-api-key` si la configuración está vacía,
 * por eso los servicios solo se instancian cuando hay variables de entorno.
 * Así la interfaz sigue funcionando (modo demostración) aunque falte el .env.
 */
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null

/**
 * Devuelve el servicio o lanza un error legible si falta la configuración.
 * Úsalo en los servicios/hooks que dependan de Firebase.
 */
export function requireFirebase(service, name) {
  if (!service) {
    throw new Error(
      `Firebase (${name}) no está configurado. Copia .env.example a .env y completa las variables VITE_FIREBASE_*.`
    )
  }
  return service
}

export default app
