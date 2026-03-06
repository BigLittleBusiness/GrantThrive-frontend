import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Unified GrantThrive frontend — all apps in one Vite project
// Dev frontend: http://localhost:5173
// Backend API:  http://127.0.0.1:5000

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:5000',
      '/auth': 'http://127.0.0.1:5000',
      '/public': 'http://127.0.0.1:5000',
      '/mapping': 'http://127.0.0.1:5000',
      '/reports': 'http://127.0.0.1:5000',
      '/voting': 'http://127.0.0.1:5000',
      '/workflows': 'http://127.0.0.1:5000',
      '/dashboard': 'http://127.0.0.1:5000',
      '/search': 'http://127.0.0.1:5000',
      '/grant': 'http://127.0.0.1:5000'
    }
  }
})