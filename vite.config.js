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
      // Alias para pdfmake - ajudar o Rollup a encontrar os arquivos corretos
      'pdfmake/build/pdfmake': path.resolve(__dirname, 'node_modules/pdfmake/build/pdfmake.js'),
      'pdfmake/build/vfs_fonts': path.resolve(__dirname, 'node_modules/pdfmake/build/vfs_fonts.js'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
    dedupe: ['react', 'react-dom'],
    // Garantir que pdfmake seja resolvido corretamente
    preserveSymlinks: false
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
            if (id.includes('pdfmake')) {
              return 'vendor-pdfmake';
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
    },
    // Configurações adicionais para lidar com importações dinâmicas
    commonjsOptions: {
      include: [/pdfmake/, /node_modules/],
      transformMixedEsModules: true
    }
  },
}) 