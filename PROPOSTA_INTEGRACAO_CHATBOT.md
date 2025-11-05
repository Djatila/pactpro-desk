# Proposta de Integração do Chatbot MaiaCred com Banco de Dados

## 🎯 Objetivo

Integrar o chatbot MaiaCred com o banco de dados Supabase para permitir que a IA responda perguntas sobre dados reais dos contratos, clientes e bancos do agente de crédito.

---

## 🏗️ Arquitetura Recomendada: Function Calling com Gemini

### Por que Function Calling?

1. **Inteligência na Decisão**: Gemini decide quando buscar dados
2. **Queries Estruturadas**: Funções bem definidas e validadas
3. **Segurança**: Controle total sobre o que a IA pode acessar
4. **Flexibilidade**: Fácil adicionar novas funções
5. **Contexto Rico**: IA usa dados reais para respostas precisas

---

## 📋 Funções/Tools Necessárias

### 1. Consultas de Contratos
```typescript
// Listar contratos com filtros
getContratos(filters?: {
  status?: 'ativo' | 'pendente' | 'finalizado',
  clienteId?: string,
  bancoId?: string,
  mesesRestantes?: number
}): Contrato[]

// Obter contrato específico
getContrato(id: string): Contrato

// Estatísticas de contratos
getContratosStats(): {
  total: number,
  ativos: number,
  pendentes: number,
  finalizados: number,
  receitaTotal: number
}
```

### 2. Consultas de Clientes
```typescript
// Listar clientes
getClientes(filters?: {
  status?: 'ativo' | 'inativo',
  temContratos?: boolean
}): Cliente[]

// Obter cliente específico
getCliente(id: string): Cliente

// Buscar cliente por nome/CPF
searchCliente(query: string): Cliente[]
```

### 3. Consultas de Bancos
```typescript
// Listar bancos
getBancos(filters?: {
  status?: 'ativo' | 'inativo'
}): Banco[]

// Obter banco específico
getBanco(id: string): Banco

// Estatísticas por banco
getBancoStats(bancoId: string): {
  totalContratos: number,
  volumeTotal: number,
  taxaMedia: number
}
```

### 4. Análises e Relatórios
```typescript
// Contratos próximos do vencimento
getContratosVencendo(meses: number): Contrato[]

// Top bancos por volume
getTopBancos(limit: number): Array<{
  banco: Banco,
  totalContratos: number,
  volumeTotal: number
}>

// Progresso da meta anual
getMetaProgress(): {
  metaAnual: number,
  receitaAtual: number,
  percentual: number,
  faltante: number
}
```

---

## 🔧 Implementação Técnica

### Passo 1: Mover Chatbot para o Projeto Principal

**Criar**: `src/components/chatbot/ChatbotWidget.tsx`

```typescript
import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/supabase';

// Importar funções de consulta
import { createChatbotTools } from './chatbot-tools';
```

### Passo 2: Criar Sistema de Tools

**Criar**: `src/lib/chatbot-tools.ts`

```typescript
import { supabase } from '@/lib/supabase';

export const createChatbotTools = (userId: string) => {
  return {
    getContratos: async (filters?: any) => {
      let query = supabase
        .from('contratos')
        .select('*, clientes(nome), bancos(nome)')
        .eq('user_id', userId);
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    
    // ... outras funções
  };
};
```

### Passo 3: Configurar Gemini com Function Calling

```typescript
const tools = createChatbotTools(user.id);

const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY 
});

const chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [
      {
        functionDeclarations: [
          {
            name: 'getContratos',
            description: 'Busca contratos do usuário com filtros opcionais',
            parameters: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['ativo', 'pendente', 'finalizado']
                }
              }
            }
          }
          // ... outras funções
        ]
      }
    ]
  }
});
```

### Passo 4: Handler de Function Calls

```typescript
const handleFunctionCall = async (functionCall: any) => {
  const { name, args } = functionCall;
  
  try {
    const result = await tools[name](args);
    return {
      name,
      response: result
    };
  } catch (error) {
    return {
      name,
      response: { error: error.message }
    };
  }
};
```

---

## 📝 System Instruction Melhorado

```
Você é MaiaCred, um assistente inteligente especializado em gestão de crédito.

CONTEXTO:
- Você auxilia agentes de crédito a gerenciar clientes, bancos e contratos
- Você tem acesso aos dados reais do usuário através de funções
- Sempre use as funções disponíveis para buscar dados atualizados

DADOS DISPONÍVEIS:
1. CLIENTES: nome, CPF, telefone, email, endereço, data de nascimento, status
2. BANCOS: nome, código, taxa média, contato, telefone, status
3. CONTRATOS: cliente, banco, tipo, data, valor total, parcelas, taxa, status, vencimento

TIPOS DE CONTRATO:
- Empréstimo Pessoal
- Consignado
- Cartão de Crédito
- Financiamento
- Refinanciamento
- Outros (personalizados pelo usuário)

STATUS:
- Contratos: ativo, pendente, finalizado
- Clientes/Bancos: ativo, inativo

SUAS CAPACIDADES:
1. Responder perguntas sobre dados (use as funções!)
2. Fornecer análises e insights
3. Orientar sobre o uso do sistema
4. Alertar sobre contratos próximos do vencimento

REGRAS:
- Sempre busque dados atualizados usando as funções
- Formate valores monetários em R$ (ex: R$ 10.000,00)
- Formate datas no padrão brasileiro (DD/MM/AAAA)
- Seja objetivo e profissional
- Se não tiver certeza, pergunte ao usuário
- Nunca invente dados - use apenas o que as funções retornam

EXEMPLOS DE PERGUNTAS:
- "Quantos contratos ativos eu tenho?"
- "Qual o valor total dos meus contratos?"
- "Mostre os contratos do Banco Bradesco"
- "Quais contratos vencem nos próximos 3 meses?"
- "Qual cliente tem mais contratos?"
- "Quanto falta para atingir minha meta anual?"
```

---

## 🎨 Interface do Usuário

### Opção 1: Widget Flutuante (Recomendado)
- Botão fixo no canto inferior direito
- Abre modal de chat ao clicar
- Sempre acessível em todas as páginas
- Indicador de mensagens não lidas

### Opção 2: Página Dedicada
- Rota `/chatbot` ou `/assistente`
- Tela cheia para conversas longas
- Histórico de conversas salvo

### Opção 3: Sidebar
- Painel lateral retrátil
- Integrado ao layout principal
- Acesso rápido sem sair da página

---

## 🔒 Segurança

### 1. Autenticação
```typescript
// Sempre verificar se usuário está autenticado
if (!user) {
  return <div>Faça login para usar o chatbot</div>;
}
```

### 2. Row Level Security (RLS)
```typescript
// Todas as queries DEVEM incluir user_id
.eq('user_id', user.id)
```

### 3. Validação de Inputs
```typescript
// Validar parâmetros das funções
if (filters?.status && !['ativo', 'pendente', 'finalizado'].includes(filters.status)) {
  throw new Error('Status inválido');
}
```

### 4. Rate Limiting
```typescript
// Limitar número de mensagens por minuto
const MAX_MESSAGES_PER_MINUTE = 10;
```

---

## 📊 Métricas e Monitoramento

### Logs Importantes
- Funções chamadas pela IA
- Tempo de resposta das queries
- Erros e exceções
- Uso da API do Gemini

### Analytics
- Perguntas mais frequentes
- Funções mais usadas
- Taxa de sucesso das respostas
- Satisfação do usuário

---

## 🚀 Plano de Implementação

### Fase 1: Setup Básico (1-2 dias)
1. ✅ Criar estrutura de pastas
2. ✅ Mover componentes do chatbot
3. ✅ Configurar acesso ao Supabase
4. ✅ Implementar autenticação

### Fase 2: Function Calling (2-3 dias)
1. ✅ Criar arquivo de tools
2. ✅ Implementar funções de consulta
3. ✅ Configurar Gemini com tools
4. ✅ Testar function calling

### Fase 3: UI e UX (1-2 dias)
1. ✅ Criar widget flutuante
2. ✅ Estilizar com Tailwind
3. ✅ Adicionar loading states
4. ✅ Tratamento de erros

### Fase 4: Testes e Refinamento (1-2 dias)
1. ✅ Testar queries complexas
2. ✅ Validar segurança (RLS)
3. ✅ Otimizar performance
4. ✅ Melhorar system instruction

### Fase 5: Deploy (1 dia)
1. ✅ Configurar variáveis de ambiente
2. ✅ Build de produção
3. ✅ Deploy no Vercel/Netlify
4. ✅ Monitoramento

**Total Estimado**: 6-10 dias

---

## 💡 Melhorias Futuras

1. **Histórico de Conversas**
   - Salvar conversas no Supabase
   - Retomar conversas anteriores

2. **Sugestões Inteligentes**
   - IA sugere ações baseadas em dados
   - Alertas proativos

3. **Comandos de Voz**
   - Speech-to-text
   - Text-to-speech

4. **Exportação de Relatórios**
   - Gerar PDFs das análises
   - Exportar para Excel

5. **Integração com WhatsApp**
   - Notificações via WhatsApp
   - Chatbot no WhatsApp

---

## 📚 Recursos Necessários

### Dependências Adicionais
```json
{
  "@google/genai": "^1.28.0"
}
```

### Variáveis de Ambiente
```env
VITE_GEMINI_API_KEY=AIzaSyB2UNiDPJYfi2YTKdrVHUOc8Zm7sU5lNks
```

### Permissões Supabase
- Leitura em todas as tabelas (já configurado via RLS)
- Acesso ao storage (para PDFs)

---

## ✅ Checklist de Implementação

- [ ] Criar pasta `src/components/chatbot/`
- [ ] Criar `ChatbotWidget.tsx`
- [ ] Criar `src/lib/chatbot-tools.ts`
- [ ] Implementar funções de consulta
- [ ] Configurar Gemini com function calling
- [ ] Criar system instruction
- [ ] Implementar handler de function calls
- [ ] Adicionar widget ao Layout
- [ ] Estilizar interface
- [ ] Testar com dados reais
- [ ] Validar segurança (RLS)
- [ ] Otimizar performance
- [ ] Documentar código
- [ ] Deploy

---

**Próximo Passo**: Começar implementação da Fase 1
