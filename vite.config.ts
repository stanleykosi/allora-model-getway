import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist-frontend',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src-frontend"),
    },
  },
  define: {
    // Provide fallback for environment variables
    'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(
      process.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2VudHJhbC1iaXNvbi05Ny5jbGVyay5hY2NvdW50cy5kZXYk'
    ),
  },
}) 