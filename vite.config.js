import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Unified GrantThrive frontend — all apps in one Vite project
// Dev frontend: http://localhost:5173
// Backend API:  api.uat.grantthrive.com

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
    allowedHosts: 'all',
    proxy: {
      '/api': 'api.uat.grantthrive.com',
      '/auth': 'api.uat.grantthrive.com',
      '/public': 'api.uat.grantthrive.com',
      '/mapping': 'api.uat.grantthrive.com',
      '/reports': 'api.uat.grantthrive.com',
      '/voting': 'api.uat.grantthrive.com',
      '/workflows': 'api.uat.grantthrive.com',
      '/dashboard': 'api.uat.grantthrive.com',
      '/search': 'api.uat.grantthrive.com',
      '/grant': 'api.uat.grantthrive.com',
    },
  },
})
