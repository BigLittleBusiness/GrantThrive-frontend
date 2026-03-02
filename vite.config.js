import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Unified GrantThrive frontend — all five apps in a single Vite project
// Routes:
//   /            → Marketing website (public, no auth)
//   /features    → Marketing features page
//   /pricing     → Marketing pricing page
//   /roi-calculator → Marketing ROI calculator page
//   /resources   → Marketing resources page
//   /contact     → Marketing contact page
//   /admin/*     → Admin dashboard (system_admin only, SSO-gated)
//   /app/*       → Council portal (council_admin, council_staff, community_member)
//   /map         → Interactive grant map (public, no auth)
//   /roi         → ROI calculator (public, no auth)
//
// Domain: grantthrive.com

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
})
