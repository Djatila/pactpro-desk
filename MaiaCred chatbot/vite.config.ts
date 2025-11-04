import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        // Corrigido para apontar para o diretório 'src' do projeto pai
        '@': path.resolve(__dirname, '../src'),
      }
    }
});