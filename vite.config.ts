import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/zod/')) {
            return 'vendor-zod';
          }
          if (id.includes('node_modules/react-markdown/')) {
            return 'vendor-markdown';
          }
          if (id.includes('node_modules/react-grid-layout/')) {
            return 'vendor-grid';
          }
          if (id.includes('node_modules/zustand/') || id.includes('node_modules/zundo/')) {
            return 'vendor-zustand';
          }
        },
      },
    },
  },
})
