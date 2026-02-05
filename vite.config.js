import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-berita': {
        target: 'https://berita-indo-api-next.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-berita/, '/api'),
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    target: 'es2020',
    minify: true,
    cssMinify: true,
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/jsx')) return 'react'
            if (id.includes('react-router')) return 'router'
            if (id.includes('react-bootstrap') || id.includes('bootstrap')) return 'ui'
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})