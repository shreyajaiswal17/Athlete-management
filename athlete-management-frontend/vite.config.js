import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: 'localhost', // Explicitly bind to localhost
    port: 5173,        // Default Vite port, adjust if needed
    hmr: {
      host: 'localhost', // WebSocket host for HMR
      port: 5173,        // WebSocket port (match server port)
      protocol: 'ws',    // Use standard WebSocket protocol
      clientPort: 5173,  // Ensure client connects to the same port
    },
  },
});