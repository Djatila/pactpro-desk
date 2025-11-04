
import React, { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Role, ChatMessage } from '../types';

// --- Helper Components (Defined outside the main component to prevent re-creation on re-renders) ---

const UserIcon: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  </div>
);

const BotIcon: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  </div>
);

const LoadingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
  </div>
);

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming }) => {
  const isUser = message.role === Role.USER;
  const bubbleClasses = isUser
    ? 'bg-blue-600 self-end rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
    : 'bg-gray-700 self-start rounded-tr-2xl rounded-tl-2xl rounded-br-2xl';

  return (
    <div className={`flex items-start gap-3 w-full max-w-2xl mx-auto ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {isUser ? <UserIcon /> : <BotIcon />}
      <div className={`px-4 py-3 text-white ${bubbleClasses}`}>
        {message.text.length === 0 && isStreaming && <LoadingIndicator />}
        <p className="whitespace-pre-wrap">{message.text}</p>
        {isStreaming && message.role === Role.MODEL && <span className="inline-block w-2 h-4 bg-white ml-1 animate-pulse" />}
      </div>
    </div>
  );
};

// --- Main Chat Interface Component ---

export default function ChatInterface() {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: Role.MODEL, text: "Hello! I'm your Gemini assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are a helpful and friendly chatbot. Provide clear and concise answers.',
        },
      });
      setChat(chatSession);
    } catch (e) {
      console.error(e);
      setError('Failed to initialize the chat model. Please check your API key.');
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chat) return;

    const userMessage: ChatMessage = { role: Role.USER, text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    // Add a placeholder for the model's response
    setMessages(prev => [...prev, { role: Role.MODEL, text: '' }]);

    try {
      const stream = await chat.sendMessageStream({ message: input });
      let text = '';
      for await (const chunk of stream) {
        text += chunk.text;
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text = text;
            return newMessages;
        });
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
      setMessages(prev => prev.slice(0, -1)); // Remove the placeholder
      setMessages(prev => [...prev, { role: Role.MODEL, text: `Sorry, I encountered an error. ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-800">
      <header className="bg-gray-900/50 backdrop-blur-sm p-4 border-b border-gray-700 text-center text-lg font-semibold shadow-lg">
        MAiaCred Chatbot
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6">
          {messages.map((msg, index) => (
            <MessageBubble 
              key={index} 
              message={msg} 
              isStreaming={isLoading && index === messages.length - 1} 
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
         {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-lg max-w-2xl mx-auto text-center">
            {error}
          </div>
        )}
      </main>

      <footer className="bg-gray-900/50 backdrop-blur-sm p-4 border-t border-gray-700">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="Ask Gemini anything..."
            disabled={isLoading}
            className="flex-1 w-full bg-gray-700 text-white placeholder-gray-400 px-4 py-2 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 transition-shadow"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
