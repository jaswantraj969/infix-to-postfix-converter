import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Calls to /api/... are forwarded to the Express server, so the frontend
    // code can use plain relative URLs and there are no CORS surprises.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  test: {
    // The compiler is plain JavaScript, so its tests need no browser environment.
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
