import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Usar a chave fornecida pelo usuário como fallback se GEMINI_API_KEY não estiver no .env do chatbot
    const geminiApiKey = env.GEMINI_API_KEY || "AIzaSyB2UNiDPJYfi2YTKdrVHUOc8Zm7sU5lNks";
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});