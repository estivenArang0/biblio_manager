// Importamos las funciones necesarias del SDK de Firebase
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Configuración leída desde variables de entorno (.env)
// Vite expone estas variables a través de import.meta.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Inicializamos la app de Firebase (una sola vez para todo el proyecto)
const app = initializeApp(firebaseConfig)

// Exportamos Authentication y Firestore para usarlos en cualquier componente
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app