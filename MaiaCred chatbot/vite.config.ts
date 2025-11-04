import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Não precisamos carregar o .env aqui, pois o projeto principal já faz isso.
    // A variável VITE_GEMINI_API_KEY deve ser injetada no processo.env pelo ambiente.
    
    // Usar a variável VITE_GEMINI_API_KEY do ambiente principal
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Injetar a chave da API do Gemini no código do chatbot
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});