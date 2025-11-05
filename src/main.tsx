import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🚀 Iniciando aplicação MaiaCred...');

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Elemento root não encontrado');
  }
  
  console.log('✓ Elemento root encontrado, renderizando App...');
  createRoot(rootElement).render(<App />);
  console.log('✓ App renderizado com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar aplicação:', error);
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; color: white; font-family: system-ui;">
      <div style="text-align: center; padding: 2rem;">
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">❌ Erro ao Carregar</h1>
        <p style="margin-bottom: 1rem;">Ocorreu um erro ao inicializar a aplicação.</p>
        <p style="font-size: 0.875rem; color: #94a3b8;">Abra o Console (F12) para mais detalhes.</p>
        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
          Recarregar Página
        </button>
      </div>
    </div>
  `;
}
