# 🐛 Problema: Function Calling Não Está Funcionando

## ❌ Situação Atual

O chatbot MaiaCred está configurado corretamente:
- ✅ Token do Supabase sendo passado
- ✅ API Key do Gemini configurada
- ✅ Edge Function criada e deployada
- ✅ Tools definidas corretamente

**MAS** o Gemini está apenas **descrevendo** que vai chamar as funções em vez de **realmente executá-las**.

### Exemplo do Problema:

**Usuário:** "quantos contratos tenho?"

**Gemini responde:**
```
Para buscar essa informação, preciso usar uma ferramenta específica. 
Chamei a ferramenta `getContratosStats`. Assim que tiver a resposta, eu te informo.
```

**Esperado:**
- Gemini deveria retornar `response.functionCalls` com os detalhes da função
- O chatbot deveria chamar a Edge Function
- Gemini deveria processar o resultado e responder com dados reais

---

## 🔍 Causa Raiz

A biblioteca `@google/genai` versão 1.28.0 pode não suportar function calling da forma esperada, ou a sintaxe para Gemini 2.5 Flash é diferente.

---

## ✅ SOLUÇÃO 1: Usar @google/generative-ai (Recomendado)

### Passo 1: Instalar biblioteca oficial

```bash
cd "MaiaCred chatbot"
npm uninstall @google/genai
npm install @google/generative-ai
```

### Passo 2: Atualizar imports

```javascript
// Trocar
import { GoogleGenAI, Chat } from '@google/genai';

// Por
import { GoogleGenerativeAI } from '@google/generative-ai';
```

### Passo 3: Atualizar inicialização

```javascript
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  tools: [{
    functionDeclarations: databaseTools
  }],
  systemInstruction: "Você é o MaiaCred AI..."
});

const chat = model.startChat({
  history: [],
});
```

### Passo 4: Atualizar envio de mensagens

```javascript
const result = await chat.sendMessage(userMessage.text);
const response = result.response;

// Verificar function calls
if (response.functionCalls()) {
  const functionCalls = response.functionCalls();
  // Processar...
}
```

---

## ✅ SOLUÇÃO 2: Usar Gemini 1.5 Pro

Se a biblioteca atual não suporta function calling no 2.5 Flash, tente:

```javascript
model: 'gemini-1.5-pro'
```

---

## ✅ SOLUÇÃO 3: Implementar Fallback Manual

Se function calling não funcionar, implementar parsing manual:

```javascript
// Detectar quando Gemini menciona ferramentas
if (response.text.includes('getContratosStats')) {
  // Chamar manualmente
  const result = await callSupabaseEdgeFunction({
    operation: 'stats'
  });
  
  // Enviar resultado de volta
  const followUp = await chat.sendMessage(
    `Aqui estão os dados: ${JSON.stringify(result)}`
  );
}
```

---

## 📋 Checklist de Implementação

- [ ] Testar com `@google/generative-ai`
- [ ] Se não funcionar, testar com `gemini-1.5-pro`
- [ ] Se ainda não funcionar, implementar fallback manual
- [ ] Atualizar documentação
- [ ] Testar todas as 6 ferramentas

---

## 🎯 Próximos Passos Imediatos

1. **Instalar @google/generative-ai**
2. **Atualizar código do chatbot**
3. **Testar function calling**
4. **Se funcionar, restaurar todas as 6 tools**

---

## 📚 Referências

- [Google AI SDK Documentation](https://ai.google.dev/tutorials/node_quickstart)
- [Function Calling Guide](https://ai.google.dev/docs/function_calling)
- [Gemini API Reference](https://ai.google.dev/api/rest)

---

**Status**: 🔴 Bloqueado - Function calling não funciona com biblioteca atual
**Prioridade**: 🔥 Alta - Chatbot não pode buscar dados reais sem isso
**Tempo estimado de correção**: 1-2 horas
