import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase'; // Importar o cliente Supabase

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null); // Novo estado para o token
  
  // 1. Obter a chave da API do Gemini do ambiente injetado pelo Vite
  const geminiApiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || 'KEY_NOT_CONFIGURED';

  // 2. Construir a URL do chatbot com a chave como query parameter
  // Incluir o token do Supabase na URL
  const chatbotUrl = `/MaiaCred chatbot/index.html?apiKey=${geminiApiKey}&supabaseToken=${supabaseToken || ''}`;

  // Efeito para obter o token de sessão do Supabase
  const fetchSupabaseToken = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSupabaseToken(session?.access_token || null);
    } catch (e) {
      console.error("Erro ao obter token Supabase para chatbot:", e);
      setSupabaseToken(null);
    }
  };

  useEffect(() => {
    // Tentar buscar o token na montagem inicial
    fetchSupabaseToken();
  }, []);

  const toggleChat = async () => {
    if (!isOpen) {
      // Ao abrir, forçar a busca do token mais recente
      await fetchSupabaseToken();
      // Resetar o estado de erro e loading para a próxima abertura
      setIsLoading(true); 
      setLoadError(false);
    }
    setIsOpen(!isOpen);
  };
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isOpen) {
      // Se a chave não estiver configurada, mostrar erro imediatamente
      if (geminiApiKey === 'KEY_NOT_CONFIGURED') {
        setIsLoading(false);
        setLoadError(true);
        return;
      }
      
      // Se o iframe não carregar em 15 segundos, assumimos um erro de carregamento
      timeoutId = setTimeout(() => {
        if (isLoading) {
          console.error('Timeout ao carregar o chatbot. Verifique a chave da API do Gemini.');
          setIsLoading(false);
          setLoadError(true);
        }
      }, 15000); // Aumentado para 15 segundos

      // Adicionar listener para garantir que o iframe seja recarregado se o erro for resolvido
      const iframe = document.querySelector('iframe[title="MaiaCred Chatbot"]') as HTMLIFrameElement;
      if (iframe && iframe.src !== chatbotUrl) {
        iframe.src = chatbotUrl;
      }
    }

    return () => clearTimeout(timeoutId);
  }, [isOpen, isLoading, geminiApiKey, chatbotUrl]);

  const handleIframeLoad = () => {
    // Atrasar um pouco para garantir que o JS dentro do iframe tenha tempo de inicializar
    setTimeout(() => {
      setIsLoading(false);
      setLoadError(false);
    }, 500); 
  };

  // Se a chave não estiver configurada, o botão flutuante deve mostrar o erro
  if (geminiApiKey === 'KEY_NOT_CONFIGURED' && isOpen) {
    // Renderizar o erro de configuração diretamente no widget
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div
          className={cn(
            "fixed bottom-20 right-6 w-full max-w-sm h-[80vh] max-h-[600px] bg-gray-900 rounded-xl shadow-2xl transition-all duration-300 ease-in-out border border-gray-700 scale-100 opacity-100 translate-y-0"
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 rounded-xl p-4">
            <div className="text-center space-y-3">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
              <p className="text-lg font-semibold text-white">Erro de Configuração</p>
              <p className="text-sm text-gray-400">
                O chatbot não conseguiu carregar. Verifique se a variável 
                <code className="bg-gray-700 p-1 rounded text-yellow-300 mx-1">VITE_GEMINI_API_KEY</code> 
                está definida corretamente no seu arquivo <code className="bg-gray-700 p-1 rounded text-yellow-300 mx-1">.env.local</code>.
              </p>
              <Button 
                onClick={() => setIsOpen(false)}
                className="bg-blue-600 hover:bg-blue-500 mt-4"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
        <Button
          onClick={toggleChat}
          className="h-14 w-14 rounded-full bg-gradient-primary hover:opacity-90 shadow-lg transition-transform duration-300 hover:scale-105"
          size="icon"
          aria-label={isOpen ? "Fechar Chatbot" : "Abrir Chatbot"}
        >
          <X className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-20 right-6 w-full max-w-sm h-[80vh] max-h-[600px] bg-gray-900 rounded-xl shadow-2xl transition-all duration-300 ease-in-out border border-gray-700",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {/* Loading / Error Overlay */}
        {(isLoading || loadError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 rounded-xl p-4">
            {isLoading && (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="ml-3 text-gray-400 mt-3">Carregando IA...</p>
              </>
            )}
            
            {loadError && (
              <div className="text-center space-y-3">
                <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
                <p className="text-lg font-semibold text-white">Erro de Configuração</p>
                <p className="text-sm text-gray-400">
                  O chatbot não conseguiu carregar. Verifique se a variável 
                  <code className="bg-gray-700 p-1 rounded text-yellow-300 mx-1">VITE_GEMINI_API_KEY</code> 
                  está definida corretamente no seu arquivo <code className="bg-gray-700 p-1 rounded text-yellow-300 mx-1">.env.local</code>.
                </p>
                <Button 
                  onClick={() => {
                    setLoadError(false);
                    setIsLoading(true);
                    // Forçar recarregamento do iframe
                    const iframe = document.querySelector('iframe[title="MaiaCred Chatbot"]') as HTMLIFrameElement;
                    if (iframe) {
                      iframe.src = chatbotUrl;
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 mt-4"
                >
                  Tentar Novamente
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Iframe do Chatbot */}
        <iframe
          src={chatbotUrl}
          title="MaiaCred Chatbot"
          className="w-full h-full rounded-xl"
          style={{ border: 'none', visibility: (isLoading || loadError) ? 'hidden' : 'visible' }}
          onLoad={handleIframeLoad}
        />
      </div>

      {/* Floating Button */}
      <Button
        onClick={toggleChat}
        className="h-14 w-14 rounded-full bg-gradient-primary hover:opacity-90 shadow-lg transition-transform duration-300 hover:scale-105"
        size="icon"
        aria-label={isOpen ? "Fechar Chatbot" : "Abrir Chatbot"}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageSquare className="h-6 w-6 text-white" />
        )}
      </Button>
    </div>
  );
}