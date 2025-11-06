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
  
  // Configurar chaves primária e secundária do Gemini
  const primaryKey = env.VITE_GEMINI_API_KEY_PRIMARY || env.VITE_GEMINI_API_KEY || "AIzaSyBi2fE_QZQ0CoQkulL4-xHL1htnVOvk3Ho";
  // Usando a chave fornecida como fallback secundário
  const secondaryKey = env.VITE_GEMINI_API_KEY_SECONDARY || "AIzaSyDip_VjC1J3BZE3qgiOIanHEW6DNV1FdI4"; 
  
  define['import.meta.env.VITE_GEMINI_API_KEY_PRIMARY'] = JSON.stringify(primaryKey);
  define['import.meta.env.VITE_GEMINI_API_KEY_SECONDARY'] = JSON.stringify(secondaryKey);
  
  if (primaryKey === "AIzaSyBi2fE_QZQ0CoQkulL4-xHL1htnVOvk3Ho") {
    console.warn('⚠️ Usando chave Gemini PRIMÁRIA hardcoded. Defina VITE_GEMINI_API_KEY_PRIMARY no .env.local.');
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