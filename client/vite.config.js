import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward API + Socket.io to the backend so the client stays same-origin.
      '/api': { target: 'http://localhost:5001', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5001', ws: true, changeOrigin: true },
    },
  },
})
