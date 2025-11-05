# 🚀 Guia de Deploy e Teste do Chatbot MaiaCred

## ✅ O QUE FOI IMPLEMENTADO

### 1. Edge Function Expandida ✅
- ✅ 6 operações diferentes (query, stats, topBancos, search, contratosVencendo, aggregate)
- ✅ JOINs automáticos para contratos (inclui dados de clientes e bancos)
- ✅ Agregações e cálculos no servidor
- ✅ Busca por texto (ILIKE)
- ✅ Cálculo de contratos próximos do vencimento
- ✅ Progresso da meta anual

### 2. Chatbot com 6 Tools ✅
- ✅ `queryDatabase` - Consultas simples em tabelas
- ✅ `getContratosStats` - Estatísticas agregadas
- ✅ `getTopBancos` - Ranking de bancos
- ✅ `searchCliente` - Busca por nome/CPF
- ✅ `getContratosVencendo` - Contratos vencendo
- ✅ `getMetaProgress` - Progresso da meta

### 3. Melhorias de UX ✅
- ✅ System instruction detalhada e específica
- ✅ Gestão automática de token (refresh a cada 5 minutos)
- ✅ Mapeamento automático de tools para operações

---

## 📋 PASSO 1: Deploy da Edge Function

### Opção A: Via Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Fazer login
supabase login

# 3. Linkar projeto
supabase link --project-ref emvnudlonqoyfptrdwtd

# 4. Deploy da função
supabase functions deploy maiacred-data-agent

# 5. Verificar deploy
supabase functions list
```

### Opção B: Via Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard/project/emvnudlonqoyfptrdwtd/functions
2. Clique em "New Function"
3. Nome: `maiacred-data-agent`
4. Copie todo o conteúdo de `supabase/functions/maiacred-data-agent/index.ts`
5. Cole no editor
6. Clique em "Deploy"

### Verificar Deploy

Teste a Edge Function diretamente:

```bash
curl -X POST https://emvnudlonqoyfptrdwtd.supabase.co/functions/v1/maiacred-data-agent \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"operation": "stats"}'
```

**Como obter o token:**
1. Abra o DevTools (F12) no navegador
2. Vá para Console
3. Execute: `(await supabase.auth.getSession()).data.session.access_token`
4. Copie o token

---

## 🧪 PASSO 2: Testar o Chatbot

### 2.1 Verificar Configuração

1. **Verificar variáveis de ambiente:**
   - Abra `.env` ou `.env.local`
   - Confirme que `VITE_GEMINI_API_KEY` está configurada
   - Valor atual: `AIzaSyB2UNiDPJYfi2YTKdrVHUOc8Zm7sU5lNks`

2. **Iniciar o projeto:**
   ```bash
   npm run dev
   ```

3. **Fazer login no sistema**

### 2.2 Abrir o Chatbot

1. Procure o botão flutuante no canto inferior direito (ícone de mensagem)
2. Clique para abrir o chatbot
3. Aguarde carregar (deve aparecer "MAiaCred Chatbot" no topo)

### 2.3 Testes Básicos

Execute estas perguntas no chatbot:

#### Teste 1: Estatísticas Gerais
```
Pergunta: "Quantos contratos ativos eu tenho?"
Ferramenta esperada: getContratosStats
Deve retornar: Total de contratos, ativos, pendentes, finalizados, receita total
```

#### Teste 2: Ranking de Bancos
```
Pergunta: "Quais são os 3 bancos com mais contratos?"
Ferramenta esperada: getTopBancos
Deve retornar: Lista dos 3 bancos com nome, total de contratos e volume
```

#### Teste 3: Busca de Cliente
```
Pergunta: "Busque o cliente João" (substitua por um nome real do seu banco)
Ferramenta esperada: searchCliente
Deve retornar: Lista de clientes com nome parecido
```

#### Teste 4: Contratos Vencendo
```
Pergunta: "Quais contratos vencem nos próximos 3 meses?"
Ferramenta esperada: getContratosVencendo
Deve retornar: Lista de contratos próximos do vencimento
```

#### Teste 5: Meta Anual
```
Pergunta: "Quanto falta para atingir minha meta anual?"
Ferramenta esperada: getMetaProgress
Deve retornar: Meta anual, receita atual, percentual, valor faltante
```

#### Teste 6: Query Simples
```
Pergunta: "Liste todos os meus clientes"
Ferramenta esperada: queryDatabase
Deve retornar: Lista de todos os clientes
```

### 2.4 Verificar Logs

Abra o DevTools (F12) e vá para a aba Console. Você deve ver:

```
DEBUG CHATBOT: API Key (primeiros 10 chars): AIzaSyB2UN
DEBUG CHATBOT: Supabase Token (primeiros 10 chars): eyJhbGciOi...
DEBUG EDGE CALL: Token de autenticação obtido (primeiros 10 caracteres): eyJhbGciOi...
DEBUG EDGE CALL: Chamando Edge Function com: {...}
DEBUG EDGE CALL: Resposta JSON recebida: {...}
```

---

## 🐛 TROUBLESHOOTING

### Problema 1: "Chave da API do Gemini não configurada"

**Solução:**
1. Verifique se existe arquivo `.env` ou `.env.local` na raiz do projeto
2. Adicione: `VITE_GEMINI_API_KEY=AIzaSyB2UNiDPJYfi2YTKdrVHUOc8Zm7sU5lNks`
3. Reinicie o servidor (`npm run dev`)

### Problema 2: "Unauthorized: Invalid or missing token"

**Solução:**
1. Faça logout e login novamente
2. Verifique se o token está sendo passado (veja logs no console)
3. Verifique se a sessão do Supabase está ativa

### Problema 3: Edge Function retorna erro 404

**Solução:**
1. Verifique se a Edge Function foi deployada
2. Acesse: https://supabase.com/dashboard/project/emvnudlonqoyfptrdwtd/functions
3. Confirme que `maiacred-data-agent` está na lista
4. Se não estiver, faça o deploy novamente

### Problema 4: Chatbot não responde ou fica carregando

**Solução:**
1. Abra o console (F12) e veja se há erros
2. Verifique se a Edge Function está respondendo (teste com curl)
3. Verifique se há dados no banco de dados
4. Tente fazer uma pergunta mais simples: "Olá"

### Problema 5: "Access denied to this table"

**Solução:**
1. Verifique se a tabela está na lista de `allowedTables` na Edge Function
2. Tabelas permitidas: clientes, bancos, contratos, configuracoes, tipos_contrato, profiles

### Problema 6: Dados vazios ou incorretos

**Solução:**
1. Verifique se há dados cadastrados no sistema
2. Faça login com o usuário correto
3. Verifique se o RLS está funcionando (dados filtrados por user_id)

---

## 📊 TESTES AVANÇADOS

### Teste de Performance

```
Pergunta: "Me dê um resumo completo: quantos clientes, contratos e qual banco tem mais volume"
```

O chatbot deve:
1. Chamar `getContratosStats` para estatísticas
2. Chamar `getTopBancos` para ranking
3. Possivelmente chamar `queryDatabase` para contar clientes
4. Combinar todas as informações em uma resposta coesa

### Teste de Busca Complexa

```
Pergunta: "Busque contratos ativos do Banco Bradesco que vencem em 2 meses"
```

O chatbot deve:
1. Usar `queryDatabase` com filtros ou
2. Combinar `getContratosVencendo` com filtro manual

### Teste de Conversação

```
Conversa:
Usuário: "Quantos contratos eu tenho?"
Bot: [responde com número]
Usuário: "E quantos estão ativos?"
Bot: [deve lembrar do contexto e responder]
```

---

## 📈 MÉTRICAS DE SUCESSO

### Chatbot está funcionando bem se:

- ✅ Responde em menos de 5 segundos
- ✅ Escolhe a ferramenta correta para cada pergunta
- ✅ Formata valores monetários corretamente (R$)
- ✅ Formata datas corretamente (DD/MM/AAAA)
- ✅ Não inventa dados (sempre usa ferramentas)
- ✅ Lida bem com perguntas sem dados ("Não há contratos...")
- ✅ Oferece insights relevantes
- ✅ Mantém contexto da conversa

---

## 🔧 COMANDOS ÚTEIS

### Verificar logs da Edge Function

```bash
supabase functions logs maiacred-data-agent
```

### Testar Edge Function localmente

```bash
# Iniciar Supabase localmente
supabase start

# Servir função localmente
supabase functions serve maiacred-data-agent

# Testar
curl -X POST http://localhost:54321/functions/v1/maiacred-data-agent \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"operation": "stats"}'
```

### Limpar cache do navegador

Se o chatbot não atualizar:
1. Pressione `Ctrl + Shift + Delete`
2. Limpe cache e cookies
3. Recarregue a página (`Ctrl + F5`)

---

## 📝 CHECKLIST FINAL

Antes de considerar o chatbot pronto:

- [ ] Edge Function deployada e respondendo
- [ ] Chatbot abre sem erros
- [ ] Token do Supabase está sendo passado
- [ ] Todas as 6 ferramentas funcionam
- [ ] Respostas são precisas e bem formatadas
- [ ] Não há erros no console
- [ ] Performance é aceitável (< 5s por resposta)
- [ ] Funciona com dados reais do usuário
- [ ] RLS está funcionando (só vê próprios dados)
- [ ] System instruction está sendo seguida

---

## 🎉 PRÓXIMOS PASSOS (OPCIONAL)

### Melhorias Futuras

1. **Cache de Queries**
   - Implementar cache no frontend
   - Reduzir chamadas repetidas à Edge Function

2. **Histórico de Conversas**
   - Salvar conversas no Supabase
   - Permitir retomar conversas anteriores

3. **Sugestões Inteligentes**
   - Botões de ação rápida
   - Perguntas sugeridas baseadas em dados

4. **Exportação de Relatórios**
   - Gerar PDF das análises
   - Exportar dados para Excel

5. **Notificações Proativas**
   - Alertar sobre contratos vencendo
   - Sugerir ações baseadas em dados

6. **Comandos de Voz**
   - Speech-to-text
   - Text-to-speech

---

**Data**: 04/11/2025
**Versão**: 1.0
**Status**: Pronto para deploy e teste
