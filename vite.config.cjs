const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')
const tailwindcssModule = require('@tailwindcss/vite')
const tailwindcss = tailwindcssModule.default || tailwindcssModule
const path = require('path')

// Unified GrantThrive frontend — all apps in one Vite project
// Dev frontend: http://localhost:5173
// Backend API:  api.uat.grantthrive.com
// Pre-rendering: handled by scripts/prerender.mjs (runs after vite build)

module.exports = defineConfig({
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
