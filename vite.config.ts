import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carregar variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '');
  
  // Definir variáveis a serem injetadas
  const define: Record<string, any> = {};
  
  // Injetar todas as variáveis VITE_ no define
  for (const key in env) {
    if (key.startsWith('VITE_')) {
      define[`import.meta.env.${key}`] = JSON.stringify(env[key]);
    }
  }
  
  // A chave VITE_GEMINI_API_KEY deve ser definida no .env.local
  if (!define['import.meta.env.VITE_GEMINI_API_KEY']) {
    console.warn('⚠️ VITE_GEMINI_API_KEY não está definida. O chatbot pode não funcionar.');
    // Definir como string vazia para evitar erro de referência, mas o chatbot deve falhar com erro 401/503
    define['import.meta.env.VITE_GEMINI_API_KEY'] = JSON.stringify('');
  }
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [dyadComponentTagger(), 
      react(),
      mode === 'development' &&
      componentTagger(),
      mode === 'production' && VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        },
        includeAssets: ['favicon.ico'],
        manifest: {
          name: 'MaiaCred - Sistema de Gestão de Crédito',
          short_name: 'MaiaCred',
          description: 'Sistema completo para gestão de contratos de crédito',
          theme_color: '#1B6C4A',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/favicon.ico',
              sizes: '48x48',
              type: 'image/x-icon'
            }
          ]
        }
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: define, // Injetar todas as variáveis de ambiente aqui
  };
});