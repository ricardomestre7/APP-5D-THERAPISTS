import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
    include: ['react', 'react-dom', 'react-router-dom', 'pdfmake/build/pdfmake']
  },
  build: {
    chunkSizeWarningLimit: 1000, // aumenta o limite para 1000 kB
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separar node_modules em chunk separado
          if (id.includes('node_modules')) {
            // Separar bibliotecas grandes em chunks específicos
            if (id.includes('jspdf')) {
              return 'vendor-pdf';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('chart') || id.includes('recharts')) {
              return 'vendor-charts';
            }
            return 'vendor';
          }
          // Separar utilitários grandes em chunks próprios
          if (id.includes('utils/gerarPDF')) {
            return 'pdf-generator';
          }
        }
      }
    }
  },
}) 