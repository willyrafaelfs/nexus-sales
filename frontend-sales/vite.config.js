import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // HMR WebSocket harus mengarah ke localhost (host),
    // bukan ke IP internal container Docker.
    hmr: {
      host: 'localhost',
      port: 5173,
    },
    watch: {
      // Docker bind-mount di Windows tidak meneruskan filesystem events;
      // polling memastikan perubahan file tetap terdeteksi.
      usePolling: true,
    },
  },
})
