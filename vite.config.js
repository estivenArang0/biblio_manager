import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // El backend propio escucha en 4000; el navegador solo habla con Vite.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: false,
      },
    },
  },
})
