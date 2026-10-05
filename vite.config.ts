import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Two pages: the portal (index.html) and the sign-in page (login.html).
// Everything the sign-in page needs goes to /login-assets/, which middleware.ts serves to anyone.
// Only the portal's own entry (with the specification) goes to /assets/, which requires a session.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: { main: 'index.html', login: 'login.html' },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'main' ? 'assets/[name]-[hash].js' : 'login-assets/[name]-[hash].js'),
        chunkFileNames: 'login-assets/[name]-[hash].js',
        assetFileNames: 'login-assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
  },
})
