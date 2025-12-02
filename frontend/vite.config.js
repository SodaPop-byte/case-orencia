import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Add this WATCH section to fix auto-reload on Windows
    watch: {
      usePolling: true,
    },
    // Ensure HMR (Hot Module Replacement) client port is strict
    hmr: {
      port: 5173,
    },
  }
})