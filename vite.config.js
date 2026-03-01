import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Unified GrantThrive frontend — marketing website + admin dashboard
// Both apps are served from this single Vite project.
// Routes:
//   /          → Marketing website (public)
//   /admin/*   → Admin dashboard (system_admin only, SSO-gated)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
