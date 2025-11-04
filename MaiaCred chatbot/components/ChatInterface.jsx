import React, { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Role, ChatMessage, DatabaseQueryTool } from '../types.js';
// Removido: import { supabaseClient } from '../../src/integrations/supabase/client'; 

// Acessar o cliente Supabase globalmente
const getSupabaseClient = () => {
  if (typeof window !== 'undefined' && window.maiacredSupabaseClient) {
    return window.maiacredSupabaseClient;
  }
  // Fallback para um cliente mock se não estiver disponível (embora o iframe deva carregar depois do app principal)
  console.error("Cliente Supabase não encontrado no escopo global.");
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    }
  };
};

// --- Configuração da Edge Function ---
// Substitua pelo seu Project ID do Supabase
const SUPABASE_PROJECT_ID = 'emvnudlonqoyfptrdwtd'; 
const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/maiacred-data-agent`;

// --- Definição da Ferramenta Gemini (Tool Calling) ---
const databaseQueryTool = {
  name: 'queryDatabase',
  description: `Consulta o banco de dados MaiaCred para obter informações sobre clientes, contratos, bancos ou configurações. Use esta ferramenta sempre que o usuário perguntar sobre dados específicos do sistema (ex: 'quantos clientes eu tenho?', 'qual o valor total dos contratos ativos?').`,
  parameters: {
    type: 'OBJECT',
    properties: {
      tableName: {
        type: 'STRING',
        description: 'O nome da tabela a ser consultada (clientes, contratos, bancos, configuracoes, tipos_contrato).',
      },
      filters: {
        type: 'OBJECT',
        description: 'Filtros opcionais para a consulta (ex: { status: "ativo" }).',
      },
    },
    required: ['tableName'],
  },
};

// --- Helper Components (Defined outside the main component to prevent re-creation on re-renders) ---

const UserIcon = () => (
  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  </div>
);

const BotIcon = () => (
  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  </div>
);

const LoadingIndicator = () => (
  <div className="flex items-center space-x-1">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
  </div>
);

const MessageBubble = ({ message, isStreaming }) => {
  const isUser = message.role === Role.USER;
  const bubbleClasses = isUser
    ? 'bg-blue-600 self-end rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
    : 'bg-gray-700 self-start rounded-tr-2xl rounded-tl-2xl rounded-br-2xl';

  const showLoading = message.role === Role.MODEL && isStreaming && message.text.length === 0;

  return (
    <div className={`flex items-start gap-3 w-full max-w-2xl mx-auto ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {isUser ? <UserIcon /> : <BotIcon />}
      <div className={`px-4 py-3 text-white ${bubbleClasses}`}>
        {showLoading && <LoadingIndicator />}
        <p className="whitespace-pre-wrap">{message.text}</p>
        {isStreaming && message.role === Role.MODEL && <span className="inline-block w-2 h-4 bg-white ml-1 animate-pulse" />}
        
        {/* Exibir chamada de ferramenta */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 p-2 bg-gray-600 rounded-lg text-xs text-yellow-300">
            <p className="font-semibold">⚙️ Chamando Ferramenta:</p>
            {message.toolCalls.map((call, i) => (
              <pre key={i} className="mt-1 whitespace-pre-wrap break-words">
                {JSON.stringify(call.functionCall, null, 2)}
              </pre>
            ))}
          </div>
        )}
        
        {/* Exibir resposta da ferramenta */}
        {message.toolResponse && (
          <div className="mt-2 p-2 bg-gray-600 rounded-lg text-xs text-green-300">
            <p className="font-semibold">✅ Dados Recebidos:</p>
            <pre className="mt-1 whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
              {JSON.stringify(message.toolResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Chat Interface Component ---

export default function ChatInterface() {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([
    { role: Role.MODEL, text: "Olá! Eu sou o MaiaCred AI, seu assistente de dados. Posso consultar informações sobre seus clientes, contratos e bancos. Como posso ajudar hoje?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // 1. Ler a chave da API do Gemini do query parameter da URL
    const urlParams = new URLSearchParams(window.location.search);
    const apiKey = urlParams.get('apiKey');
    
    // Apenas verificar se a chave está ausente ou é o valor de fallback 'KEY_NOT_CONFIGURED'
    if (!apiKey || apiKey === 'null' || apiKey === 'undefined' || apiKey === 'KEY_NOT_CONFIGURED') {
        setError('Chave da API do Gemini não configurada. Por favor, defina VITE_GEMINI_API_KEY no seu arquivo .env.');
        setIsLoading(false);
        return;
    }
    
    try {
      const ai = new GoogleGenAI({ apiKey });
      const chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `Você é o MaiaCred AI, um assistente de dados amigável e útil para um agente de crédito.
          Sua principal função é responder perguntas sobre os dados do usuário (clientes, contratos, bancos) usando a ferramenta 'queryDatabase'.
          
          Regras:
          1. Use a ferramenta 'queryDatabase' sempre que o usuário fizer uma pergunta que exija dados do sistema (ex: 'quantos clientes eu tenho?', 'qual o valor total dos contratos ativos?').
          2. O resultado da consulta será um array de objetos JSON. Analise esses dados para fornecer uma resposta concisa e útil.
          3. Se a consulta retornar um array vazio, informe ao usuário que não há dados correspondentes.
          4. Formate valores monetários em Reais (R$).
          5. Mantenha o tom profissional e prestativo.`,
        },
        tools: [{ functionDeclarations: [databaseQueryTool] }],
      });
      setChat(chatSession);
    } catch (e) {
      console.error(e);
      setError('Falha ao inicializar o modelo de chat. Verifique sua chave API.');
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Função para chamar a Edge Function do Supabase
  const callSupabaseEdgeFunction = async (toolCall) => {
    const supabaseClient = getSupabaseClient();
    
    // Obter token de acesso
    const sessionResult = await supabaseClient.auth.getSession();
    const token = sessionResult.data.session?.access_token;

    if (!token) {
      throw new Error('Usuário não autenticado. Por favor, faça login no aplicativo principal.');
    }

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(toolCall),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na Edge Function: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chat) return;

    const userMessage = { role: Role.USER, text: input };
    
    // Adicionar a mensagem do usuário
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    // Adicionar um placeholder para a resposta do modelo
    let currentMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: Role.MODEL, text: '' }]);

    try {
      let response = await chat.sendMessage({ message: userMessage.text });
      
      // Loop para lidar com Tool Calling
      while (response.functionCalls && response.functionCalls.length > 0) {
        const toolCall = response.functionCalls[0];
        const toolName = toolCall.name;
        const toolArgs = toolCall.args;
        
        // 1. Atualizar a mensagem com a chamada da ferramenta
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[currentMessageIndex - 1].toolCalls = response.functionCalls;
            newMessages[currentMessageIndex - 1].text = ''; // Limpar texto para o streaming
            return newMessages;
        });

        let toolResult;
        
        if (toolName === 'queryDatabase') {
          toolResult = await callSupabaseEdgeFunction(toolArgs);
        } else {
          toolResult = { error: `Ferramenta desconhecida: ${toolName}` };
        }
        
        // 2. Atualizar a mensagem com o resultado da ferramenta
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[currentMessageIndex - 1].toolResponse = toolResult;
            newMessages[currentMessageIndex - 1].text = ''; // Limpar texto novamente antes do streaming
            return newMessages;
        });

        // 3. Enviar o resultado da ferramenta de volta para o Gemini e obter o stream
        const stream = await chat.sendMessageStream({
          contents: [{
            role: 'tool',
            parts: [{
              functionResponse: {
                name: toolCall.name,
                response: toolResult,
              },
            }],
          }],
        });
        
        let text = '';
        let finalResponse = { text: '', functionCalls: [] };
        
        for await (const chunk of stream) {
          // Acumular o texto
          if (chunk.text) {
            text += chunk.text;
            // Usar a função de atualização para garantir o estado mais recente
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[currentMessageIndex - 1].text = text;
                return newMessages;
            });
          }
          // Capturar a resposta final do stream para verificar se há mais tool calls
          finalResponse = chunk;
        }
        
        // Atualizar a variável de resposta para o próximo ciclo do loop
        response = finalResponse;
        
        // Se o loop terminar, o texto final já foi gerado pelo stream.
        if (!response.functionCalls || response.functionCalls.length === 0) {
            break;
        }
      }
      
      // Se o loop terminou, o texto final já foi gerado pelo stream.
      // Garantir que o texto final seja definido, caso o último chunk não tenha sido capturado corretamente
      if (response.text) {
          setMessages(prev => {
              const newMessages = [...prev];
              newMessages[currentMessageIndex - 1].text = response.text;
              return newMessages;
          });
      }

    } catch (e) {
      console.error(e);
      
      let errorMessage = 'Ocorreu um erro desconhecido.';
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      
      // Tentar extrair a mensagem de erro da API se for um objeto JSON
      try {
        const apiErrorMatch = errorMessage.match(/\{"error":\{"code":\d+,"message":"([^"]+)","status":"[^"]+"\}\}/);
        if (apiErrorMatch && apiErrorMatch[1]) {
          errorMessage = `Erro da API: ${apiErrorMatch[1]}`;
        }
      } catch (parseError) {
        // Ignorar erro de parse se a mensagem não for JSON
      }
      
      setError(`Erro: ${errorMessage}`);
      setMessages(prev => prev.slice(0, -1)); // Remove the placeholder
      setMessages(prev => [...prev, { role: Role.MODEL, text: `Desculpe, encontrei um erro. ${errorMessage}` }]);
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
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte ao MaiaCred AI..."
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