# Análise Completa do Projeto MaiaCred

## 📋 Visão Geral do Projeto

**MaiaCred** é um sistema de gestão de crédito para agentes de crédito, permitindo o cadastro e gerenciamento de:
- **Clientes** - Pessoas físicas que solicitam crédito
- **Bancos** - Instituições financeiras parceiras
- **Contratos** - Contratos de crédito entre clientes e bancos
- **Relatórios** - Dashboards e análises financeiras

---

## 🏗️ Arquitetura do Projeto Principal

### Stack Tecnológica
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Roteamento**: React Router v6
- **Estado**: React Context API + TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Validação**: Zod + React Hook Form
- **Notificações**: Sonner
- **Ícones**: Lucide React
- **Gráficos**: Recharts
- **Datas**: date-fns

### Estrutura de Pastas
```
pactpro-desk-main/
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── ui/           # Componentes shadcn/ui
│   │   ├── forms/        # Formulários
│   │   └── modals/       # Modais
│   ├── contexts/         # Contextos React
│   │   ├── AuthContext.tsx
│   │   ├── DataContext.tsx
│   │   └── NotificacoesFinanceirasContext.tsx
│   ├── pages/            # Páginas da aplicação
│   │   ├── Dashboard.tsx
│   │   ├── Clientes.tsx
│   │   ├── Bancos.tsx
│   │   ├── Contratos.tsx
│   │   ├── Relatorios.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── integrations/     # Integrações externas
│   │   └── supabase/
│   │       └── client.ts
│   ├── lib/              # Utilitários e tipos
│   │   ├── database.types.ts
│   │   ├── supabase.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   └── hooks/            # Custom hooks
└── MaiaCred chatbot/     # Chatbot separado (Google Gemini)
```

---

## 🗄️ Estrutura do Banco de Dados (Supabase/PostgreSQL)

### Tabelas Principais

#### 1. **profiles**
- Perfis de usuários (estende auth.users)
- Campos: id, email, nome, cargo, avatar_url, created_at, updated_at

#### 2. **clientes**
- Cadastro de clientes
- Campos: id, nome, cpf, telefone, email, endereco, data_nascimento, observacoes, status, user_id, created_at, updated_at
- Status: 'ativo' | 'inativo'

#### 3. **bancos**
- Cadastro de bancos parceiros
- Campos: id, nome, codigo, taxa_media, contato, telefone_contato, observacoes, status, user_id, created_at, updated_at
- Status: 'ativo' | 'inativo'

#### 4. **contratos**
- Contratos de crédito
- Campos principais:
  - id, cliente_id, banco_id, tipo_contrato
  - data_emprestimo, primeiro_vencimento
  - valor_total, valor_operacao, valor_solicitado, valor_prestacao
  - parcelas, taxa
  - status ('ativo' | 'pendente' | 'finalizado')
  - observacoes
  - pdf_url, pdf_name (para documentos anexados)
  - user_id, created_at, updated_at

#### 5. **configuracoes**
- Configurações do usuário
- Campos: id, meta_anual, user_id, created_at, updated_at

#### 6. **tipos_contrato**
- Tipos de contrato personalizáveis
- Campos: id, user_id, value, label, is_default, created_at, updated_at

### Relacionamentos
- **contratos** → **clientes** (cliente_id)
- **contratos** → **bancos** (banco_id)
- Todas as tabelas têm **user_id** para isolamento de dados por usuário (RLS)

### Segurança (Row Level Security - RLS)
- Todas as tabelas têm RLS habilitado
- Políticas garantem que usuários só acessem seus próprios dados
- Filtros automáticos por `user_id` em todas as operações

### Storage
- Bucket: `contratos-pdfs`
- Armazena PDFs de contratos
- Estrutura: `{user_id}/{contrato_id}.{ext}`

---

## 🤖 Chatbot MaiaCred (Atual)

### Localização
`MaiaCred chatbot/` (pasta separada do projeto principal)

### Tecnologia Atual
- **IA**: Google Gemini 2.5 Flash
- **Framework**: React 19 + TypeScript + Vite
- **API**: @google/genai v1.28.0
- **Interface**: Chat simples com streaming de respostas

### Estrutura do Chatbot
```
MaiaCred chatbot/
├── components/
│   ├── ChatInterface.tsx    # Interface principal do chat
│   └── ChatInterface.jsx    # Versão JavaScript (backup)
├── App.jsx                  # Componente raiz
├── types.js                 # Tipos TypeScript
├── .env.local              # API Key do Gemini (gitignored)
└── package.json            # Dependências
```

### Funcionalidades Atuais
- ✅ Chat interativo com IA
- ✅ Streaming de respostas em tempo real
- ✅ Interface moderna e responsiva
- ✅ Histórico de conversação
- ✅ **FAZ buscas no banco de dados via Edge Function**
- ✅ **ESTÁ integrado ao projeto principal (widget flutuante)**
- ✅ **TEM acesso aos dados do Supabase via Edge Function**
- ✅ Function Calling do Gemini implementado
- ✅ Autenticação via token JWT
- ⚠️ Edge Function precisa de queries mais avançadas (JOINs, agregações)

### System Instruction Atual
```
"You are a helpful and friendly chatbot. Provide clear and concise answers."
```

---

## 📊 Contextos e Estado Global

### 1. AuthContext
- Gerencia autenticação de usuários
- Login/Logout/Registro
- Sessão do Supabase
- Dados do usuário autenticado

### 2. DataContext
- **Gerencia todos os dados da aplicação**
- Funções CRUD para:
  - Clientes (addCliente, updateCliente, deleteCliente)
  - Bancos (addBanco, updateBanco, deleteBanco)
  - Contratos (addContrato, updateContrato, deleteContrato)
  - Tipos de Contrato (loadTiposContrato, addTipoContrato, etc.)
- Upload/Download de PDFs
- Métricas calculadas (contratos por cliente/banco, receitas, etc.)
- **Carrega dados automaticamente quando usuário está autenticado**

### 3. NotificacoesFinanceirasContext
- Notificações sobre contratos próximos do vencimento
- Alertas financeiros

---

## 🎯 Objetivo: Integração do Chatbot com Banco de Dados

### Propósito do Chatbot
O chatbot **MaiaCred** deve ser um assistente inteligente para **agentes de crédito**, capaz de:

1. **Responder dúvidas sobre dados**
   - "Quantos contratos ativos eu tenho?"
   - "Qual o valor total dos contratos do Banco X?"
   - "Quais clientes têm contratos vencendo este mês?"

2. **Fornecer informações específicas**
   - "Mostre os dados do cliente João Silva"
   - "Qual a taxa média do Banco Bradesco?"
   - "Liste os contratos pendentes"

3. **Análises e insights**
   - "Qual banco tem mais contratos?"
   - "Quanto falta para atingir minha meta anual?"
   - "Quais contratos estão próximos do vencimento?"

4. **Orientação sobre o sistema**
   - "Como cadastrar um novo cliente?"
   - "Como fazer upload de PDF de contrato?"
   - "O que significa status 'pendente'?"

---

## 🔧 Desafios Técnicos para Integração

### 1. Arquitetura Separada
- Chatbot está em pasta separada com seu próprio `package.json`
- Não compartilha código com o projeto principal
- Não tem acesso aos contextos React (AuthContext, DataContext)

### 2. Acesso ao Banco de Dados
- Chatbot precisa acessar Supabase
- Precisa respeitar RLS (user_id do usuário autenticado)
- Precisa fazer queries complexas (joins, agregações)

### 3. Autenticação
- Chatbot precisa saber qual usuário está logado
- Precisa usar a mesma sessão do Supabase

### 4. Segurança
- Não expor dados de outros usuários
- Validar todas as queries
- Prevenir SQL injection

### 5. Performance
- Queries podem ser lentas
- Streaming de respostas da IA
- Cache de dados

---

## 💡 Possíveis Abordagens de Integração

### Opção 1: Integrar Chatbot no Projeto Principal (Recomendado)
**Vantagens:**
- Acesso direto aos contextos (AuthContext, DataContext)
- Compartilha cliente Supabase
- Usa mesma sessão de autenticação
- Código unificado

**Implementação:**
1. Mover componentes do chatbot para `src/components/`
2. Criar `ChatbotWidget.tsx` no projeto principal
3. Usar `useAuth()` e `useData()` hooks
4. Adicionar rota `/chatbot` ou widget flutuante

### Opção 2: API Backend Intermediária
**Vantagens:**
- Chatbot permanece separado
- Backend valida e processa queries
- Maior controle de segurança

**Implementação:**
1. Criar API (Supabase Edge Functions ou Node.js)
2. Endpoints para queries específicas
3. Chatbot chama API com token de autenticação
4. API retorna dados filtrados por user_id

### Opção 3: Function Calling do Gemini
**Vantagens:**
- Gemini decide quando buscar dados
- Queries estruturadas e validadas
- Respostas contextualizadas

**Implementação:**
1. Definir funções/tools para Gemini
2. Funções fazem queries no Supabase
3. Gemini usa resultados para responder
4. Exemplo: `getContratos()`, `getCliente(id)`, `getBancoStats()`

---

## 📝 Dados Disponíveis para o Chatbot

### Do DataContext
```typescript
{
  clientes: Cliente[],           // Lista de clientes
  bancos: Banco[],               // Lista de bancos
  contratos: Contrato[],         // Lista de contratos
  metaAnual: number,             // Meta anual do agente
  isLoading: boolean,            // Estado de carregamento
  error: string | null           // Erros
}
```

### Métricas Calculadas
- Total de contratos (ativos, pendentes, finalizados)
- Receita total do agente
- Contratos por cliente
- Contratos por banco
- Volume total por banco
- Parcelas pagas/restantes
- Contratos próximos do vencimento (1-6 meses)

### Queries Úteis para o Chatbot
```sql
-- Contratos ativos
SELECT * FROM contratos WHERE status = 'ativo' AND user_id = ?

-- Contratos vencendo em 1-3 meses
SELECT * FROM contratos WHERE meses_restantes BETWEEN 1 AND 3

-- Top bancos por volume
SELECT banco_id, SUM(valor_total) FROM contratos GROUP BY banco_id

-- Receita total
SELECT SUM(valor_total * taxa / 100) FROM contratos WHERE status IN ('ativo', 'finalizado')
```

---

## 🚀 Próximos Passos Recomendados

1. **Definir Arquitetura de Integração**
   - Decidir entre Opção 1, 2 ou 3
   - Criar diagrama de arquitetura

2. **Implementar Acesso ao Banco**
   - Configurar cliente Supabase no chatbot
   - Implementar queries necessárias
   - Testar RLS e segurança

3. **Configurar Function Calling**
   - Definir tools/functions para Gemini
   - Implementar handlers de funções
   - Testar com queries reais

4. **Melhorar System Instruction**
   - Contexto sobre o sistema MaiaCred
   - Instruções sobre tipos de dados
   - Exemplos de respostas

5. **Integrar UI**
   - Widget flutuante ou página dedicada
   - Indicadores de carregamento
   - Tratamento de erros

6. **Testes e Validação**
   - Testar queries complexas
   - Validar segurança (RLS)
   - Testar performance

---

## 📌 Observações Importantes

- **API Key do Gemini**: Está em `.env.example` mas deve estar em `.env.local`
- **Supabase**: Configurado com fallbacks hardcoded no código
- **RLS**: Todas as queries DEVEM filtrar por `user_id`
- **Tipos**: Bem definidos em `database.types.ts`
- **Validações**: Zod schemas em `validations.ts`

---

## 🔐 Variáveis de Ambiente Necessárias

### Projeto Principal (.env)
```
VITE_SUPABASE_URL=https://emvnudlonqoyfptrdwtd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=AIzaSyB2UNiDPJYfi2YTKdrVHUOc8Zm7sU5lNks
```

### Chatbot (.env.local)
```
API_KEY=AIzaSyB2UNiDPJYfi2YTKdrVHUOc8Zm7sU5lNks
```

---

## 📚 Documentação Adicional no Projeto

- `AI_RULES.md` - Regras de desenvolvimento
- `SUPABASE_SETUP.md` - Configuração do Supabase
- `SUPABASE_STORAGE_SETUP.md` - Configuração do storage
- `TROUBLESHOOTING.md` - Solução de problemas
- `NOTIFICACOES_FINANCEIRAS.md` - Sistema de notificações
- `database.sql` - Schema completo do banco

---

**Data da Análise**: 04/11/2025
**Versão do Projeto**: 0.0.0
**Status**: Chatbot implementado mas sem integração com banco de dados
