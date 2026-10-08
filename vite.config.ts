import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: '/' ensures assets resolve correctly on Vercel
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Increase chunk size warning limit for a larger SPA
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'icon-vendor': ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // Do not open browser automatically in CI
  },
  // Expose VITE_ env variables to the client
  envPrefix: 'VITE_',
})
