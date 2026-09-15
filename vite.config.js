import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Split heavy vendors into long-lived cacheable chunks so route
        // chunks stay small on low-bandwidth connections.
        manualChunks: {
          'firebase-vendor': [
            'firebase/app',
            'firebase/auth',
            'firebase/database',
          ],
          // Firestore loads on demand (history/flush/fallbacks) — its own
          // cacheable chunk keeps it out of first paint entirely.
          'firestore': ['firebase/firestore'],
          'motion': ['framer-motion'],
        },
      },
    },
  },
})
