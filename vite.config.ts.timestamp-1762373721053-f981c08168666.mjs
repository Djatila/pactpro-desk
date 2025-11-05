// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/vanes/OneDrive/%C3%81rea%20de%20Trabalho/ANUNCIOS/pactpro-desk-main/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/vanes/OneDrive/%C3%81rea%20de%20Trabalho/ANUNCIOS/pactpro-desk-main/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/vanes/OneDrive/%C3%81rea%20de%20Trabalho/ANUNCIOS/pactpro-desk-main/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///C:/Users/vanes/OneDrive/%C3%81rea%20de%20Trabalho/ANUNCIOS/pactpro-desk-main/node_modules/vite-plugin-pwa/dist/index.js";
import dyadComponentTagger from "file:///C:/Users/vanes/OneDrive/%C3%81rea%20de%20Trabalho/ANUNCIOS/pactpro-desk-main/node_modules/@dyad-sh/react-vite-component-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\vanes\\OneDrive\\\xC1rea de Trabalho\\ANUNCIOS\\pactpro-desk-main";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const define = {};
  for (const key in env) {
    if (key.startsWith("VITE_")) {
      define[`import.meta.env.${key}`] = JSON.stringify(env[key]);
    }
  }
  const geminiApiKey = env.VITE_GEMINI_API_KEY || "AIzaSyB2UNiDPJYfi2YTKdrVHUOc8Zm7sU5lNks";
  define["import.meta.env.VITE_GEMINI_API_KEY"] = JSON.stringify(geminiApiKey);
  if (geminiApiKey === "AIzaSyB2UNiDPJYfi2YTKdrVHUOc8Zm7sU5lNks") {
    console.warn("\u26A0\uFE0F Usando chave Gemini hardcoded. Recomenda-se definir VITE_GEMINI_API_KEY no .env.local.");
  }
  return {
    server: {
      host: "::",
      port: 8080
    },
    plugins: [
      dyadComponentTagger(),
      react(),
      mode === "development" && componentTagger(),
      mode === "production" && VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"]
        },
        includeAssets: ["favicon.ico"],
        manifest: {
          name: "MaiaCred - Sistema de Gest\xE3o de Cr\xE9dito",
          short_name: "MaiaCred",
          description: "Sistema completo para gest\xE3o de contratos de cr\xE9dito",
          theme_color: "#1B6C4A",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/favicon.ico",
              sizes: "48x48",
              type: "image/x-icon"
            }
          ]
        }
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    define
    // Injetar todas as variáveis de ambiente aqui
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx2YW5lc1xcXFxPbmVEcml2ZVxcXFxcdTAwQzFyZWEgZGUgVHJhYmFsaG9cXFxcQU5VTkNJT1NcXFxccGFjdHByby1kZXNrLW1haW5cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHZhbmVzXFxcXE9uZURyaXZlXFxcXFx1MDBDMXJlYSBkZSBUcmFiYWxob1xcXFxBTlVOQ0lPU1xcXFxwYWN0cHJvLWRlc2stbWFpblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvdmFuZXMvT25lRHJpdmUvJUMzJTgxcmVhJTIwZGUlMjBUcmFiYWxoby9BTlVOQ0lPUy9wYWN0cHJvLWRlc2stbWFpbi92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gXCJsb3ZhYmxlLXRhZ2dlclwiO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5pbXBvcnQgZHlhZENvbXBvbmVudFRhZ2dlciBmcm9tICdAZHlhZC1zaC9yZWFjdC12aXRlLWNvbXBvbmVudC10YWdnZXInO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBDYXJyZWdhciB2YXJpXHUwMEUxdmVpcyBkZSBhbWJpZW50ZVxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKTtcbiAgXG4gIC8vIERlZmluaXIgdmFyaVx1MDBFMXZlaXMgYSBzZXJlbSBpbmpldGFkYXNcbiAgY29uc3QgZGVmaW5lOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG4gIFxuICAvLyBJbmpldGFyIHRvZGFzIGFzIHZhcmlcdTAwRTF2ZWlzIFZJVEVfIG5vIGRlZmluZVxuICBmb3IgKGNvbnN0IGtleSBpbiBlbnYpIHtcbiAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoJ1ZJVEVfJykpIHtcbiAgICAgIGRlZmluZVtgaW1wb3J0Lm1ldGEuZW52LiR7a2V5fWBdID0gSlNPTi5zdHJpbmdpZnkoZW52W2tleV0pO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gSW5qZXRhciBhIGNoYXZlIEdlbWluaSBmb3JuZWNpZGEgcGVsbyB1c3VcdTAwRTFyaW9cbiAgY29uc3QgZ2VtaW5pQXBpS2V5ID0gZW52LlZJVEVfR0VNSU5JX0FQSV9LRVkgfHwgXCJBSXphU3lCMlVOaURQSllmaTJZVEtkclZIVU9jOFptN3NVNWxOa3NcIjtcbiAgZGVmaW5lWydpbXBvcnQubWV0YS5lbnYuVklURV9HRU1JTklfQVBJX0tFWSddID0gSlNPTi5zdHJpbmdpZnkoZ2VtaW5pQXBpS2V5KTtcbiAgXG4gIGlmIChnZW1pbmlBcGlLZXkgPT09IFwiQUl6YVN5QjJVTmlEUEpZZmkyWVRLZHJWSFVPYzhabTdzVTVsTmtzXCIpIHtcbiAgICBjb25zb2xlLndhcm4oJ1x1MjZBMFx1RkUwRiBVc2FuZG8gY2hhdmUgR2VtaW5pIGhhcmRjb2RlZC4gUmVjb21lbmRhLXNlIGRlZmluaXIgVklURV9HRU1JTklfQVBJX0tFWSBubyAuZW52LmxvY2FsLicpO1xuICB9XG4gIFxuICByZXR1cm4ge1xuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogXCI6OlwiLFxuICAgICAgcG9ydDogODA4MCxcbiAgICB9LFxuICAgIHBsdWdpbnM6IFtkeWFkQ29tcG9uZW50VGFnZ2VyKCksIFxuICAgICAgcmVhY3QoKSxcbiAgICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiZcbiAgICAgIGNvbXBvbmVudFRhZ2dlcigpLFxuICAgICAgbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nICYmIFZpdGVQV0Eoe1xuICAgICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcbiAgICAgICAgd29ya2JveDoge1xuICAgICAgICAgIGdsb2JQYXR0ZXJuczogWycqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Zyx3b2ZmMn0nXSxcbiAgICAgICAgfSxcbiAgICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLmljbyddLFxuICAgICAgICBtYW5pZmVzdDoge1xuICAgICAgICAgIG5hbWU6ICdNYWlhQ3JlZCAtIFNpc3RlbWEgZGUgR2VzdFx1MDBFM28gZGUgQ3JcdTAwRTlkaXRvJyxcbiAgICAgICAgICBzaG9ydF9uYW1lOiAnTWFpYUNyZWQnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2lzdGVtYSBjb21wbGV0byBwYXJhIGdlc3RcdTAwRTNvIGRlIGNvbnRyYXRvcyBkZSBjclx1MDBFOWRpdG8nLFxuICAgICAgICAgIHRoZW1lX2NvbG9yOiAnIzFCNkM0QScsXG4gICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyNmZmZmZmYnLFxuICAgICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgICAgICBvcmllbnRhdGlvbjogJ3BvcnRyYWl0JyxcbiAgICAgICAgICBzY29wZTogJy8nLFxuICAgICAgICAgIHN0YXJ0X3VybDogJy8nLFxuICAgICAgICAgIGljb25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNyYzogJy9mYXZpY29uLmljbycsXG4gICAgICAgICAgICAgIHNpemVzOiAnNDh4NDgnLFxuICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UveC1pY29uJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICBdLmZpbHRlcihCb29sZWFuKSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBkZWZpbmU6IGRlZmluZSwgLy8gSW5qZXRhciB0b2RhcyBhcyB2YXJpXHUwMEUxdmVpcyBkZSBhbWJpZW50ZSBhcXVpXG4gIH07XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQWtaLFNBQVMsY0FBYyxlQUFlO0FBQ3hiLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxlQUFlO0FBQ3hCLE9BQU8seUJBQXlCO0FBTGhDLElBQU0sbUNBQW1DO0FBUXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBRXhDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUczQyxRQUFNLFNBQThCLENBQUM7QUFHckMsYUFBVyxPQUFPLEtBQUs7QUFDckIsUUFBSSxJQUFJLFdBQVcsT0FBTyxHQUFHO0FBQzNCLGFBQU8sbUJBQW1CLEdBQUcsRUFBRSxJQUFJLEtBQUssVUFBVSxJQUFJLEdBQUcsQ0FBQztBQUFBLElBQzVEO0FBQUEsRUFDRjtBQUdBLFFBQU0sZUFBZSxJQUFJLHVCQUF1QjtBQUNoRCxTQUFPLHFDQUFxQyxJQUFJLEtBQUssVUFBVSxZQUFZO0FBRTNFLE1BQUksaUJBQWlCLDJDQUEyQztBQUM5RCxZQUFRLEtBQUsscUdBQTJGO0FBQUEsRUFDMUc7QUFFQSxTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQUMsb0JBQW9CO0FBQUEsTUFDNUIsTUFBTTtBQUFBLE1BQ04sU0FBUyxpQkFDVCxnQkFBZ0I7QUFBQSxNQUNoQixTQUFTLGdCQUFnQixRQUFRO0FBQUEsUUFDL0IsY0FBYztBQUFBLFFBQ2QsU0FBUztBQUFBLFVBQ1AsY0FBYyxDQUFDLHNDQUFzQztBQUFBLFFBQ3ZEO0FBQUEsUUFDQSxlQUFlLENBQUMsYUFBYTtBQUFBLFFBQzdCLFVBQVU7QUFBQSxVQUNSLE1BQU07QUFBQSxVQUNOLFlBQVk7QUFBQSxVQUNaLGFBQWE7QUFBQSxVQUNiLGFBQWE7QUFBQSxVQUNiLGtCQUFrQjtBQUFBLFVBQ2xCLFNBQVM7QUFBQSxVQUNULGFBQWE7QUFBQSxVQUNiLE9BQU87QUFBQSxVQUNQLFdBQVc7QUFBQSxVQUNYLE9BQU87QUFBQSxZQUNMO0FBQUEsY0FDRSxLQUFLO0FBQUEsY0FDTCxPQUFPO0FBQUEsY0FDUCxNQUFNO0FBQUEsWUFDUjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSCxFQUFFLE9BQU8sT0FBTztBQUFBLElBQ2hCLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxJQUNBO0FBQUE7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
