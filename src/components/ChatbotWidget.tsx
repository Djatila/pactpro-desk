import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChatInterface } from './ChatInterface';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Obter a chave da API do Gemini
  const geminiApiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || 'AIzaSyBi2fE_QZQ0CoQkulL4-xHL1htnVOvk3Ho';

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-20 right-6 w-full max-w-sm h-[80vh] max-h-[600px] bg-gray-900 rounded-xl shadow-2xl transition-all duration-300 ease-in-out border border-gray-700 overflow-hidden",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {isOpen && <ChatInterface apiKey={geminiApiKey} />}
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