import { useState } from 'react';
import { MessageSquare, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // O chatbot está na pasta 'MaiaCred chatbot', então o caminho é /MaiaCred chatbot/index.html
  const chatbotUrl = '/MaiaCred chatbot/index.html';

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsLoading(true); // Recarregar o loading ao abrir
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-20 right-6 w-full max-w-sm h-[80vh] max-h-[600px] bg-gray-900 rounded-xl shadow-2xl transition-all duration-300 ease-in-out border border-gray-700",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 rounded-xl">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="ml-3 text-gray-400">Carregando IA...</p>
          </div>
        )}

        {/* Iframe do Chatbot */}
        <iframe
          src={chatbotUrl}
          title="MaiaCred Chatbot"
          className="w-full h-full rounded-xl"
          style={{ border: 'none' }}
          onLoad={() => setIsLoading(false)}
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