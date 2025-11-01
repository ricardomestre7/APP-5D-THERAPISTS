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
    dedupe: ['react', 'react-dom'],
    preserveSymlinks: false
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
    include: ['react', 'react-dom', 'react-router-dom']
    // pdfmake não incluído aqui - será carregado dinamicamente em runtime
  },
  build: {
    chunkSizeWarningLimit: 1000, // aumenta o limite para 1000 kB
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separar node_modules em chunk separado
          // Usar verificações mais precisas para evitar falsos positivos
          if (id.includes('node_modules')) {
            // Verificar caminhos completos para melhor precisão
            const normalizedId = id.replace(/\\/g, '/');
            
            // Separar bibliotecas grandes em chunks específicos
            if (normalizedId.includes('/jspdf/') || normalizedId.endsWith('/jspdf')) {
              return 'vendor-pdf';
            }
            if (normalizedId.includes('/pdfmake/') || normalizedId.endsWith('/pdfmake')) {
              return 'vendor-pdfmake';
            }
            if (normalizedId.includes('/firebase/') || normalizedId.includes('/@firebase/')) {
              return 'vendor-firebase';
            }
            if (normalizedId.includes('/chart') || normalizedId.includes('/recharts')) {
              return 'vendor-charts';
            }
            // Pacote padrão para outros node_modules
            return 'vendor';
          }
          // Separar utilitários grandes em chunks próprios
          if (id.includes('/utils/gerarPDF') || id.includes('\\utils\\gerarPDF')) {
            return 'pdf-generator';
          }
          // Retornar undefined para manter chunk padrão
          return undefined;
        }
      }
    },
    // Configurações adicionais para lidar com importações dinâmicas
    commonjsOptions: {
      include: [/node_modules/, /pdfmake/],
      transformMixedEsModules: true
    }
  },
}) 