import React, { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Role, ChatMessage, DatabaseQueryTool } from '../types.js';
// Removido: import { supabaseClient } from '../../src/integrations/supabase/client'; 

// Acessar o cliente Supabase globalmente (MOCKADO - NÃO USADO)
const getSupabaseClient = () => {
  // Esta função não é mais usada para obter o token, mas mantida como mock para evitar erros de referência
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

// --- Definição das Ferramentas Gemini (Tool Calling) ---
const databaseTools = [
  {
    name: 'queryDatabase',
    description: `Consulta simples no banco de dados MaiaCred. Use para listar dados de tabelas específicas com filtros opcionais. Retorna array de objetos. Exemplos: listar todos os clientes, buscar contratos ativos, obter dados de um banco específico.`,
    parameters: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'Nome da tabela: clientes, contratos, bancos, configuracoes, tipos_contrato, profiles',
        },
        filters: {
          type: 'object',
          description: 'Filtros opcionais (ex: { status: "ativo" })',
        },
      },
      required: ['tableName'],
    },
  },
  {
    name: 'getContratosStats',
    description: `Obtém estatísticas agregadas dos contratos: total de contratos, quantidade por status (ativos, pendentes, finalizados), valor total, receita total e total de parcelas. Use quando o usuário perguntar sobre números gerais, totais ou estatísticas dos contratos.`,
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getTopBancos',
    description: `Retorna ranking dos bancos por volume de contratos. Mostra nome do banco, código, total de contratos e volume total. Use quando o usuário perguntar sobre quais bancos têm mais contratos ou maior volume.`,
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Número de bancos a retornar (padrão: 5)',
        },
      },
    },
  },
  {
    name: 'searchCliente',
    description: `Busca clientes por nome ou CPF (busca parcial, case-insensitive). Retorna até 10 resultados. Use quando o usuário quiser encontrar um cliente específico pelo nome ou CPF.`,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Texto de busca (nome ou CPF do cliente)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'getContratosVencendo',
    description: `Retorna contratos ativos que estão próximos do vencimento (baseado no número de parcelas restantes). Use quando o usuário perguntar sobre contratos que vão terminar em breve ou que precisam de atenção.`,
    parameters: {
      type: 'object',
      properties: {
        meses: {
          type: 'number',
          description: 'Número de meses para considerar (padrão: 3)',
        },
      },
    },
  },
  {
    name: 'getMetaProgress',
    description: `Retorna informações sobre a meta anual do agente: meta anual, receita atual, percentual atingido, valor faltante e se a meta foi atingida. Use quando o usuário perguntar sobre a meta, progresso ou quanto falta para atingir o objetivo.`,
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getDashboardSummary',
    description: `Retorna um resumo completo das principais estatísticas do dashboard: total de clientes, contratos (ativos/pendentes/finalizados), receita total, meta anual, progresso da meta, top 3 bancos. Use quando o usuário pedir um resumo geral, visão geral, estatísticas principais ou overview do sistema.`,
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];

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
        
        {/* Tool calls e respostas ocultos - apenas para debug no console */}
      </div>
    </div>
  );
};

// --- Main Chat Interface Component ---

export default function ChatInterface({ apiKey: apiKeyProp }) {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([
    { role: Role.MODEL, text: "Olá! Eu sou o MaiaCred AI, seu assistente de dados. Posso consultar informações sobre seus clientes, contratos e bancos. Como posso ajudar hoje?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Variável para armazenar o token lido da URL
  const [supabaseToken, setSupabaseToken] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const apiKeyFromUrl = urlParams.get('apiKey');
    const token = urlParams.get('supabaseToken'); // Lendo o token da URL
    
    setSupabaseToken(token);

    const resolvedApiKey = apiKeyProp || apiKeyFromUrl;

    console.log('DEBUG CHATBOT: API Key (primeiros 10 chars):', resolvedApiKey ? resolvedApiKey.substring(0, 10) : 'NULO');
    console.log('DEBUG CHATBOT: Supabase Token (primeiros 10 chars):', token ? token.substring(0, 10) : 'NULO');

    if (!resolvedApiKey || resolvedApiKey === 'null' || resolvedApiKey === 'undefined' || resolvedApiKey === 'KEY_NOT_CONFIGURED' || resolvedApiKey.startsWith('AIzaSyDip_')) {
        setError('Chave da API do Gemini não configurada ou inválida. Por favor, defina VITE_GEMINI_API_KEY no seu arquivo .env.');
        setIsLoading(false);
        return;
    }
    
    try {
      const genAI = new GoogleGenerativeAI(resolvedApiKey);
      
      // Todas as 6 ferramentas disponíveis
      const allTools = [{
        functionDeclarations: databaseTools
      }];
      
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash-latest',
        tools: allTools,
        systemInstruction: `Você é o MaiaCred AI, um assistente de dados inteligente para agentes de crédito.

**SUAS CAPACIDADES:**
Você tem acesso a 7 ferramentas para consultar dados:

1. **getDashboardSummary**: Resumo completo do dashboard (use quando pedir visão geral/resumo)
2. **queryDatabase**: Consultas simples em tabelas (clientes, contratos, bancos, etc.)
3. **getContratosStats**: Estatísticas agregadas dos contratos
4. **getTopBancos**: Ranking de bancos por volume
5. **searchCliente**: Busca clientes por nome ou CPF
6. **getContratosVencendo**: Contratos próximos do vencimento
7. **getMetaProgress**: Progresso da meta anual

**REGRAS IMPORTANTES:**
- SEMPRE use as ferramentas para buscar dados reais. NUNCA invente informações.
- Escolha a ferramenta mais adequada para cada pergunta.
- Para listar clientes: use queryDatabase com tableName="clientes"
- Para listar bancos: use queryDatabase com tableName="bancos"
- Para listar bancos com status específico (ex.: ativos ou inativos): use queryDatabase com tableName="bancos" e filters={ status: "<status>" }
- Se não houver resultados, informe ao usuário que nenhum banco foi encontrado com aquele status em vez de dizer que a funcionalidade não existe.
- Para estatísticas de contratos: use getContratosStats

**FORMATAÇÃO DE RESPOSTAS:**
- NUNCA mostre JSON bruto. Sempre formate os dados de forma legível.
- Use listas numeradas ou com marcadores para múltiplos itens.
- Formate valores monetários como R$ 10.000,00 (com ponto para milhares e vírgula para decimais).
- Formate datas no padrão brasileiro DD/MM/AAAA.
- Para listas de bancos, mostre: "🏦 [Nome do Banco] (Código [código]) - [X] contratos - R$ [valor total]"
- Para listas de clientes, mostre: "👤 [Nome] - CPF: [cpf] - Tel: [telefone]"
- Para contratos, mostre: "📄 Contrato #[id] - Cliente: [nome] - Banco: [banco] - Valor: R$ [valor]"
- Seja objetivo, profissional e use emojis para melhorar a legibilidade.

**EXEMPLOS DE FORMATAÇÃO:**
Pergunta: "Quais bancos têm mais contratos?"
Resposta: "Aqui estão os bancos com mais contratos:

🏦 **Banco Cooperativo do Brasil** (Código 756)
   • 1 contrato
   • Volume total: R$ 6.717,17

🏦 **Santander** (Código 033)
   • 1 contrato
   • Volume total: R$ 6.517,77

Pergunta: "Quais bancos inativos?"
Resposta: "Vou consultar os bancos inativos para você."
→ Chame queryDatabase com { tableName: "bancos", filters: { status: "inativo" } }"`,
      });
      
      const chatSession = model.startChat({
        history: [],
      });
      
      setChat(chatSession);
    } catch (e) {
      console.error(e);
      setError('Falha ao inicializar o modelo de chat. Verifique sua chave API.');
    }
  }, [apiKeyProp]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Função para chamar a Edge Function do Supabase
  const callSupabaseEdgeFunction = async (toolCall) => {
    const token = supabaseToken; // Usar o token do estado

    if (!token) {
      console.error('ERRO DE AUTENTICAÇÃO: Token não encontrado na URL.');
      throw new Error('Usuário não autenticado. Por favor, faça login no aplicativo principal.');
    }
    
    console.log('DEBUG EDGE CALL: Token de autenticação obtido (primeiros 10 caracteres):', token.substring(0, 10));
    console.log('DEBUG EDGE CALL: Chamando Edge Function com:', toolCall);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout de 15 segundos

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(toolCall),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resposta de erro da Edge Function:', response.status, errorText);
        
        // Tentar parsear o erro como JSON se o status for 4xx ou 5xx
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            // Lançar o erro exato retornado pela Edge Function
            throw new Error(`Erro do Servidor (${response.status}): ${errorJson.error}`);
          }
        } catch (e) {
          // Se não for JSON, retornar o status e o texto
          throw new Error(`Erro na Edge Function (${response.status}): ${errorText}`);
        }
      }
      
      const result = await response.json();
      console.log('DEBUG EDGE CALL: Resposta JSON recebida:', result); // NOVO LOG
      return result;
    } catch (networkError) {
      clearTimeout(timeoutId);
      if (networkError.name === 'AbortError') {
        throw new Error(`Timeout: A Edge Function demorou mais de 15 segundos para responder.`);
      }
      console.error("Erro de rede/timeout na Edge Function:", networkError);
      throw new Error(`Falha na comunicação com o servidor de dados. Verifique sua conexão ou tente novamente.`);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    console.log('🚀 handleSend chamado');
    
    if (!input.trim()) {
      console.warn('⚠️ Input vazio');
      return;
    }
    if (isLoading) {
      console.warn('⚠️ Já está carregando');
      return;
    }

    const userMessage = { role: Role.USER, text: input };
    console.log('📤 Enviando mensagem:', userMessage.text);
    
    // Adicionar a mensagem do usuário
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    // Verificar intenções específicas antes de chamar o Gemini
    const inputLower = input.toLowerCase();
    const isInativosQuery = inputLower.includes('banco') && (inputLower.includes('inativo') || inputLower.includes('desativado') || inputLower.includes('inativos') || inputLower.includes('desativados'));
    
    if (isInativosQuery) {
      console.log('🔍 Detectado pedido de bancos inativos:', input);
      const toolCall = {
        name: 'queryDatabase',
        args: {
          tableName: "bancos",
          filters: { status: "inativo" }
        }
      };
      
      try {
        console.log('📡 Chamando edge function para bancos inativos');
        const toolResult = await callSupabaseEdgeFunction({ ...toolCall.args, operation: 'query' });
        
        console.log('📊 Resultado da consulta:', toolResult);
        
        if (toolResult.error) {
          setMessages(prev => [...prev, {
            role: Role.MODEL,
            text: `Erro ao buscar bancos inativos: ${toolResult.error}`
          }]);
        } else if (!toolResult.data || toolResult.data.length === 0) {
          setMessages(prev => [...prev, {
            role: Role.MODEL,
            text: "Nenhum banco inativo encontrado no sistema."
          }]);
        } else {
          const responseText = toolResult.data.map(banco => 
            `🏦 ${banco.nome || 'Nome não informado'} (Código ${banco.codigo || 'N/A'}) - Status: ${banco.status}`
          ).join('\n');
          
          setMessages(prev => [...prev, {
            role: Role.MODEL,
            text: `Bancos inativos encontrados:\n${responseText}`
          }]);
        }
      } catch (e) {
        console.error('❌ Erro no fallback:', e);
        setMessages(prev => [...prev, {
          role: Role.MODEL,
          text: `Erro ao processar consulta: ${e.message}`
        }]);
      }
      
      setIsLoading(false);
      return;
    }
    
    if (!chat) {
      console.error('❌ Chat não inicializado');
      return;
    }
    
    // Adicionar um placeholder para a resposta do modelo
    let currentMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: Role.MODEL, text: '' }]);

    try {
      console.log('🤖 Chamando Gemini...');
      const result = await chat.sendMessage(userMessage.text);
      const response = result.response;
      
      console.log('✅ Resposta do Gemini recebida:', response);
      console.log('📊 Tipo da resposta:', typeof response);
      console.log('📊 Candidatos:', response.candidates);
      console.log('📊 Prompt Feedback:', response.promptFeedback);
      
      // Tentar obter texto e function calls com tratamento de erro
      let text = '';
      let functionCalls = null;
      
      try {
        text = response.text();
      } catch (textError) {
        console.warn('⚠️ Erro ao obter texto da resposta:', textError);
        text = '';
      }
      
      try {
        functionCalls = response.functionCalls();
      } catch (fcError) {
        console.warn('⚠️ Erro ao obter function calls:', fcError);
        functionCalls = null;
      }
      
      console.log('📝 Text:', text);
      console.log('🔧 FunctionCalls:', functionCalls);
      
      // Loop para lidar com Tool Calling
      while (functionCalls && functionCalls.length > 0) {
        console.log('🔧 Function calls detectados:', functionCalls);
        const toolCall = functionCalls[0];
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
        
        // Mapear nome da ferramenta para operação da Edge Function
        const toolOperationMap = {
          'queryDatabase': 'query',
          'getContratosStats': 'stats',
          'getTopBancos': 'topBancos',
          'searchCliente': 'search',
          'getContratosVencendo': 'contratosVencendo',
          'getMetaProgress': 'aggregate',
          'getDashboardSummary': 'dashboardSummary',
        };
        
        const operation = toolOperationMap[toolName];
        
        if (operation) {
          // Adicionar operation aos argumentos se não existir
          const edgeFunctionArgs = { ...toolArgs, operation };
          toolResult = await callSupabaseEdgeFunction(edgeFunctionArgs);
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

        // 3. Enviar o resultado da ferramenta de volta para o Gemini
        const result = await chat.sendMessage([{
          functionResponse: {
            name: toolName,
            response: {
              content: toolResult,
            },
          },
        }]);
        
        const newResponse = result.response;
        
        // Tentar obter texto e function calls com tratamento de erro
        let newText = '';
        let newFunctionCalls = null;
        
        try {
          newText = newResponse.text();
        } catch (textError) {
          console.warn('⚠️ Erro ao obter texto da nova resposta:', textError);
          newText = '';
        }
        
        try {
          newFunctionCalls = newResponse.functionCalls();
        } catch (fcError) {
          console.warn('⚠️ Erro ao obter novos function calls:', fcError);
          newFunctionCalls = null;
        }
        
        console.log('📝 Nova resposta após tool:', newText);
        console.log('🔧 Novos function calls:', newFunctionCalls);
        
        // Atualizar mensagem com o texto final
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[currentMessageIndex - 1].text = newText;
          return newMessages;
        });
        
        // Se não há mais function calls, terminar o loop
        if (!newFunctionCalls || newFunctionCalls.length === 0) {
          console.log('✅ Loop de function calls finalizado');
          break;
        }
        
        // Atualizar para próxima iteração
        functionCalls = newFunctionCalls;
      }
      
      // Se não houve function calls e não há texto, exibir o texto ou mensagem de erro
      if (!functionCalls || functionCalls.length === 0) {
        if (text) {
          // Exibir o texto da resposta
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[currentMessageIndex - 1].text = text;
            return newMessages;
          });
        } else {
          console.warn('⚠️ Resposta vazia do Gemini!');
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[currentMessageIndex - 1].text = 'Desculpe, não consegui gerar uma resposta. Tente novamente.';
            return newMessages;
          });
        }
      }
      
    } catch (e) {
      console.error("ERRO CRÍTICO NO CHATBOT:", e);
      
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