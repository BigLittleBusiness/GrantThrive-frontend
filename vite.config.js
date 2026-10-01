import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Unified GrantThrive frontend — all apps in one Vite project.
// The backend is called directly at VITE_API_URL (see .env.example).
// Pre-rendering: handled by scripts/prerender.mjs (runs after vite build).

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },

  server: {
    port: 5173,
  },
})
