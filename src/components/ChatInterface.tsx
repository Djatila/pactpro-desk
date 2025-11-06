import { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Tipos
enum Role {
  USER = 'user',
  MODEL = 'model',
}

interface ChatMessage {
  role: Role;
  text: string;
  toolCalls?: any[];
  toolResponse?: any;
}

// Configuração
const SUPABASE_PROJECT_ID = 'emvnudlonqoyfptrdwtd';
const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/maiacred-data-agent`;

// Ferramentas do Gemini
const databaseTools = [
  {
    name: 'queryDatabase',
    description: 'Consulta simples no banco de dados MaiaCred. Use para listar dados de tabelas específicas com filtros opcionais. IMPORTANTE: Para clientes, use "clientes" para listar TODOS os clientes cadastrados (ativos e inativos).',
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
    name: 'getClientesAtivos',
    description: 'Retorna APENAS os clientes ATIVOS, ou seja, clientes que possuem pelo menos um contrato ativo vinculado. Use esta ferramenta quando o usuário perguntar especificamente sobre "clientes ativos" ou "quantos clientes ativos".',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getContratosPorCliente',
    description: 'Busca todos os contratos de um cliente específico pelo nome. Retorna detalhes completos incluindo informações do cliente e banco. Use quando o usuário pedir contratos ou detalhes de um cliente específico.',
    parameters: {
      type: 'object',
      properties: {
        clienteNome: {
          type: 'string',
          description: 'Nome do cliente para buscar seus contratos',
        },
      },
      required: ['clienteNome'],
    },
  },
  {
    name: 'getContratosStats',
    description: 'Obtém estatísticas agregadas dos contratos.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getTopBancos',
    description: 'Retorna ranking dos bancos por volume de contratos.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Número de bancos a retornar (padrão: 5)' },
      },
    },
  },
  {
    name: 'searchCliente',
    description: 'Busca clientes por nome ou CPF.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Texto de busca (nome ou CPF do cliente)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'getContratosVencendo',
    description: 'Retorna contratos ativos próximos do vencimento.',
    parameters: {
      type: 'object',
      properties: {
        meses: { type: 'number', description: 'Número de meses para considerar (padrão: 3)' },
      },
    },
  },
  {
    name: 'getMetaProgress',
    description: 'Retorna informações sobre a meta anual do agente.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getDashboardSummary',
    description: 'Retorna um resumo completo das principais estatísticas do dashboard.',
    parameters: { type: 'object', properties: {} },
  },
];

// Componentes auxiliares
const UserIcon = () => (
  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  </div>
);

const BotIcon = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0 shadow-lg">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
      <circle cx="9" cy="14" r="1"/>
      <circle cx="15" cy="14" r="1"/>
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

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming: boolean;
}

const MessageBubble = ({ message, isStreaming }: MessageBubbleProps) => {
  const isUser = message.role === Role.USER;
  const bubbleClasses = isUser
    ? 'bg-emerald-600 self-end rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
    : 'bg-gray-700 self-start rounded-tr-2xl rounded-tl-2xl rounded-br-2xl';

  const showLoading = message.role === Role.MODEL && isStreaming && message.text.length === 0;

  return (
    <div className={`flex items-start gap-3 w-full max-w-2xl mx-auto ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Renderiza o ícone correto e inverte a ordem para o usuário */}
      {isUser ? <UserIcon /> : <BotIcon />}
      
      <div className={`px-4 py-3 text-white ${bubbleClasses} max-w-[80%]`}>
        {showLoading && <LoadingIndicator />}
        <p className="whitespace-pre-wrap text-sm">{message.text}</p>
        {isStreaming && message.role === Role.MODEL && message.text.length > 0 && (
          <span className="inline-block w-2 h-4 bg-white ml-1 animate-pulse" />
        )}
      </div>
    </div>
  );
};

interface ChatInterfaceProps {
  apiKey: string;
}

export function ChatInterface({ apiKey }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Sugestões rápidas
  const quickSuggestions = [
    "👥 Quantos clientes ativos tenho?",
    "📊 Mostre as estatísticas de contratos",
    "🏦 Quais são os top 5 bancos?",
    "📈 Me dê um resumo do dashboard"
  ];

  // Chave para localStorage baseada no usuário
  const getStorageKey = () => `maiacred_chat_history_${user?.id || 'guest'}`;

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(getStorageKey());
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        // Verificar se o histórico não está muito antigo (7 dias)
        const savedDate = new Date(parsed.timestamp);
        const now = new Date();
        const daysDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff < 7 && parsed.messages && parsed.messages.length > 0) {
          setMessages(parsed.messages);
          setShowSuggestions(false);
          console.log('✅ Histórico de conversas restaurado');
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar histórico:', error);
    }
  }, [user]);

  // Salvar histórico no localStorage sempre que mensagens mudarem
  useEffect(() => {
    if (messages.length > 0) {
      try {
        const historyData = {
          messages: messages,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(getStorageKey(), JSON.stringify(historyData));
      } catch (error) {
        console.warn('⚠️ Erro ao salvar histórico:', error);
      }
    }
  }, [messages, user]);

  // Inicializar chat com contexto personalizado
  useEffect(() => {
    const initChat = async () => {
      try {
        const userName = user?.nome || 'usuário';
        
        // Instruções de sistema personalizadas
        const systemInstruction = `Você é a MaiaCred, uma assistente virtual inteligente e prestativa do sistema de gestão de crédito MaiaCred.

🚨🚨🚨 REGRA OBRIGATÓRIA - VOCÊ DEVE USAR AS FERRAMENTAS! 🚨🚨🚨

VOCÊ É OBRIGADO A:
1. USAR as ferramentas disponíveis para TODA pergunta sobre dados
2. NUNCA responder com "X", "Y", "Z" ou variáveis genéricas
3. NUNCA dizer "preciso saber" ou "para saber" - VOCÊ JÁ PODE SABER USANDO AS FERRAMENTAS!
4. NUNCA pedir permissão - CONSULTE IMEDIATAMENTE!
5. Se o usuário perguntar sobre dados, você DEVE chamar a ferramenta correspondente ANTES de responder

PRIORIDADE DE CONSULTA DE CLIENTES/CONTRATOS:
- Se o usuário pedir "todos os contratos" ou "contratos de todos os clientes", use a ferramenta 'queryDatabase' com tableName="contratos" e filters: { status: "ativo" } para listar os contratos ativos.
- Se o usuário pedir "clientes com contratos", use a ferramenta 'getClientesAtivos' para listar os clientes.
- Se o usuário pedir "contratos de [Nome do Cliente]", use 'getContratosPorCliente'.
- Se o usuário pedir "todos os clientes" (cadastrados), use 'queryDatabase' com tableName="clientes".

PROIBIDO:
❌ "preciso primeiro saber"
❌ "para saber, preciso consultar"
❌ "temos X clientes" (sem número real)
❌ "deseja que eu consulte?"

OBRIGATÓRIO:
✅ Chamar a ferramenta IMEDIATAMENTE
✅ Responder com números REAIS do banco de dados
✅ Ser proativa e autônoma

INFORMAÇÕES IMPORTANTES:
- Seu nome é MaiaCred (sempre se apresente assim)
- Você está conversando com ${userName}
- Você tem acesso DIRETO ao banco de dados através de ferramentas especializadas
- Sempre seja cordial, profissional e use o nome do usuário quando apropriado
- Você tem memória das conversas anteriores com este usuário
- Você é PROATIVA e AUTÔNOMA - não precisa pedir permissão para consultar dados

DIFERENÇA CRÍTICA - CLIENTES:
⚠️ ATENÇÃO: Existem TRÊS categorias de clientes:

1. **CLIENTES CADASTRADOS** (ou "total de clientes"):
   - São TODOS os clientes registrados no sistema
   - Incluem clientes com e sem contratos ativos
   - Use a ferramenta "queryDatabase" com tableName="clientes"
   - Quando o usuário perguntar: "quantos clientes", "total de clientes", "clientes cadastrados"

2. **CLIENTES ATIVOS**:
   - São clientes que possuem pelo menos UM contrato com status="ativo" vinculado
   - Subconjunto dos clientes cadastrados
   - Use a ferramenta "getClientesAtivos"
   - Quando o usuário perguntar: "clientes ativos", "quantos clientes ativos"

3. **CLIENTES INATIVOS**:
   - São clientes cadastrados que NÃO possuem nenhum contrato ativo vinculado
   - Podem ter contratos pendentes, finalizados ou cancelados, mas nenhum ativo
   - Para identificar: 
     a) Chamar queryDatabase com tableName="clientes" → Obter lista completa com IDs e nomes
     b) Chamar getClientesAtivos → Obter lista de clientes ativos com IDs
     c) Comparar os IDs e listar os que NÃO estão nos ativos
   - SEMPRE mostre os NOMES dos clientes inativos, não apenas a quantidade
   - NUNCA diga "não posso informar os nomes" - você TEM os nomes!

REGRAS DE CONSULTA DE BANCOS:
- Para listar bancos ativos, use queryDatabase com tableName="bancos" e filters: { status: "ativo" }
- Para listar bancos inativos, use queryDatabase com tableName="bancos" e filters: { status: "inativo" }

**REGRAS DE FORMATAÇÃO CRÍTICAS:**
- **Listas:** Sempre use listas formatadas com Markdown (`- ` ou `* ` ou `1. `) e **quebras de linha** (`\n`) entre os itens para garantir a legibilidade.
- **Dados Agregados:** Use negrito (`**`) para valores importantes (ex: "Sua receita total é de **R$ 10.000,00**").
- **Quebras de Linha:** Use quebras de linha duplas (`\n\n`) para separar parágrafos e tópicos.
- **Emojis:** Use emojis relevantes (ex: 👥, 🏦, 📄) para categorizar a informação.

EXEMPLOS OBRIGATÓRIOS DE COMO RESPONDER:

Pergunta: "Quais clientes estão inativos?"
✅ CORRETO: [Chamar queryDatabase] [Chamar getClientesAtivos] [Comparar IDs] "Você tem **3 clientes cadastrados**. Destes, **1 é ativo** e **2 são inativos**. Os clientes inativos são:\n\n- Maria Silva\n- João Santos"

Pergunta: "Quantos contratos tenho?"
✅ CORRETO: [Chamar getContratosStats] "Você tem **120 contratos** no total:\n\n- **80** ativos\n- **25** pendentes\n- **15** finalizados"

Pergunta: "Mostre os contratos do João"
✅ CORRETO: [Chamar getContratosPorCliente] "Encontrei **3 contratos** do João:\n\n1. Contrato 12345 - Banco Santander - Valor: R$ 5.000,00\n2. Contrato 67890 - Banco do Brasil - Valor: R$ 10.000,00"

PERSONALIDADE:
- Amigável e prestativa
- Objetiva e clara nas respostas
- Proativa em oferecer informações relevantes
- Use emojis ocasionalmente para tornar a conversa mais agradável
- Quando retomar uma conversa anterior, mencione isso de forma natural

CAPACIDADES:
- Consultar dados de clientes, contratos e bancos
- Diferenciar entre clientes cadastrados e clientes ativos
- Buscar detalhes completos de contratos específicos
- Fornecer estatísticas e relatórios
- Buscar informações específicas
- Ajudar com análises e insights
- Lembrar de conversas anteriores

Sempre que o usuário perguntar algo, use as ferramentas disponíveis para buscar informações reais do banco de dados.`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash-lite', // Modelo lite: 30 RPM, 1M TPM, 200 RPD - Econômico!
          systemInstruction: systemInstruction,
          tools: [{ functionDeclarations: databaseTools as any }],
        });

        // Converter mensagens salvas para formato de histórico do Gemini
        // Filtrar apenas mensagens do usuário e do modelo (excluir a primeira mensagem de boas-vindas se for do modelo)
        let history = [];
        if (messages.length > 1) {
          const historyMessages = messages.slice(0, -1);
          // Se a primeira mensagem é do modelo (boas-vindas), remover
          const startIndex = historyMessages[0]?.role === Role.MODEL ? 1 : 0;
          history = historyMessages.slice(startIndex).map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }],
          }));
        }

        const chatSession = model.startChat({
          history: history,
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
          },
        });

        setChat(chatSession);
        
        // Mensagem de boas-vindas apenas se não houver histórico
        if (messages.length === 0) {
          setMessages([{
            role: Role.MODEL,
            text: `Olá, ${userName}! 👋\n\nSou a MaiaCred, sua assistente virtual. Estou aqui para ajudar você com informações sobre clientes, contratos, bancos e estatísticas do sistema.\n\n💡 Algumas coisas que posso fazer:\n• Diferenciar entre clientes cadastrados e clientes ativos\n• Mostrar estatísticas de contratos\n• Buscar informações de clientes\n• Listar os principais bancos\n• Verificar contratos próximos do vencimento\n• Acompanhar o progresso da meta\n\n📌 Dica importante:\n• "Clientes cadastrados" = todos os clientes no sistema\n• "Clientes ativos" = apenas clientes com contratos ativos\n\nComo posso ajudar você hoje?`
          }]);
        } else {
          console.log('✅ Chat restaurado com', messages.length, 'mensagens anteriores');
        }
        
        console.log('✅ Chat inicializado com sucesso para', userName);
      } catch (error) {
        console.error('❌ Erro ao inicializar chat:', error);
      }
    };

    if (user) {
      initChat();
    }
  }, [apiKey, user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Chamar Edge Function
  const callSupabaseEdgeFunction = async (args: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.warn('⚠️ Token não disponível');
        return { error: 'Usuário não autenticado' };
      }

      console.log('📤 Enviando para Edge Function:', args);
      
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(args),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ Erro HTTP:', response.status, responseData);
        return { error: responseData.error || `HTTP ${response.status}` };
      }

      console.log('✅ Resposta da Edge Function:', responseData);
      return responseData;
    } catch (error: any) {
      console.error('❌ Erro na Edge Function:', error);
      return { error: error.message };
    }
  };

  // Enviar mensagem
  const handleSend = async (e?: FormEvent, customMessage?: string) => {
    e?.preventDefault();
    const messageText = customMessage || inputValue.trim();
    if (!messageText || !chat || isLoading) return;

    setShowSuggestions(false); // Esconder sugestões após primeira mensagem
    const userMessage: ChatMessage = { role: Role.USER, text: messageText };
    
    // Adicionar a mensagem do usuário e o placeholder do modelo em uma única atualização
    setMessages(prev => [...prev, userMessage, { role: Role.MODEL, text: '' }]);
    
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // O índice da mensagem do modelo é o último elemento do array
    const modelMessageIndex = messages.length + 1;

    try {
      
      console.log('🤖 Chamando Gemini...');
      const result = await chat.sendMessage(userMessage.text);
      const response = result.response;
      
      console.log('✅ Resposta do Gemini recebida:', response);
      
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
            newMessages[modelMessageIndex].toolCalls = response.functionCalls;
            newMessages[modelMessageIndex].text = ''; // Limpar texto para o streaming
            return newMessages;
        });

        let toolResult;
        
        // Mapear nome da ferramenta para operação da Edge Function
        const toolOperationMap: Record<string, string> = {
          'queryDatabase': 'query',
          'getClientesAtivos': 'clientesAtivos',
          'getContratosPorCliente': 'contratosPorCliente',
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
            newMessages[modelMessageIndex].toolResponse = toolResult;
            newMessages[modelMessageIndex].text = ''; // Limpar texto novamente antes do streaming
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
          newMessages[modelMessageIndex].text = newText;
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
            newMessages[modelMessageIndex].text = text;
            return newMessages;
          });
        } else {
          console.warn('⚠️ Resposta vazia do Gemini!');
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[modelMessageIndex].text = 'Desculpe, não consegui gerar uma resposta. Tente novamente.';
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

  const userName = user?.nome || 'Usuário';

  // Limpar histórico
  const clearHistory = () => {
    if (confirm('Deseja limpar todo o histórico de conversas? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem(getStorageKey());
      setMessages([{
        role: Role.MODEL,
        text: `Olá, ${userName}! 👋\n\nHistórico limpo! Sou a MaiaCred, sua assistente virtual.\n\nComo posso ajudar você hoje?`
      }]);
      setShowSuggestions(true);
      console.log('🗑️ Histórico de conversas limpo');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                <circle cx="9" cy="14" r="1"/>
                <circle cx="15" cy="14" r="1"/>
              </svg>
            </div>
            <div>
              <h2 className="text-white text-lg font-semibold">MaiaCred AI</h2>
              <p className="text-blue-100 text-xs">Conversando com {userName}</p>
            </div>
          </div>
          <button
            onClick={clearHistory}
            className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            title="Limpar histórico"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Indicador de histórico restaurado */}
        {messages.length > 1 && !showSuggestions && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-emerald-900/30 text-emerald-300 px-3 py-1 rounded-full text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Conversa anterior restaurada • {messages.length} mensagens
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} isStreaming={isLoading && idx === messages.length - 1} />
        ))}
        
        {/* Sugestões rápidas */}
        {showSuggestions && messages.length === 1 && !isLoading && (
          <div className="space-y-2 mt-4">
            <p className="text-gray-400 text-xs text-center mb-2">Sugestões rápidas:</p>
            <div className="grid grid-cols-1 gap-2">
              {quickSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(undefined, suggestion)}
                  className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading || !chat}
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !chat || !inputValue.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isLoading ? '...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}