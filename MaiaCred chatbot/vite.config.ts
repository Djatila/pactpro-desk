import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Carregar variáveis de ambiente do projeto principal (se existirem)
    const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
    const geminiApiKey = env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Injetar a chave da API do Gemini no código do chatbot
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      },
      resolve: {
        alias: {
          // Corrigido para apontar para o diretório 'src' do projeto pai
          '@': path.resolve(__dirname, '../src'),
        }
      }
    };
});