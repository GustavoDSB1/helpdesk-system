import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Escutar em todas as interfaces de rede
    port: 5173,
    strictPort: true,
    cors: true
  }
})
