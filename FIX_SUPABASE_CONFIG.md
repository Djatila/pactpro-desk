# 🔧 CORREÇÃO URGENTE - Supabase "Feature is disabled"

## ⚠️ PROBLEMA IDENTIFICADO
Seu projeto Supabase está com a **autenticação por email DESABILITADA**. Por isso os cadastros não estão funcionando.

## 🚀 SOLUÇÃO IMEDIATA (2 minutos)

### PASSO 1: Habilitar Autenticação por Email
1. **Acesse:** https://supabase.com/dashboard
2. **Selecione seu projeto:** `emvnudlonqoyfptrdwtd`
3. **Navegue:** Authentication → Settings
4. **Procure por:** "Auth Providers" ou "Email"
5. **ATIVE:** ✅ "Enable email provider" ou "Email authentication"
6. **SALVE** as configurações

### PASSO 2: Configurações Adicionais Necessárias
Na mesma página de Settings:

1. **Email Confirmation:**
   - ❌ **DESABILITE** "Confirm email"
   - Ou configure: "Enable email confirmations: OFF"

2. **Site URL:**
   - Configure: `http://localhost:8080`

3. **Redirect URLs:**
   - Adicione: `http://localhost:8080/**`

### PASSO 3: Verificar se Funcionou
1. Recarregue sua aplicação
2. Tente fazer um novo cadastro
3. O console não deve mais mostrar "Feature is disabled"

## 🔍 VERIFICAÇÃO RÁPIDA

Execute este comando no console do navegador (F12):
```javascript
// Teste rápido da configuração
fetch('https://emvnudlonqoyfptrdwtd.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdm51ZGxvbnFveWZwdHJkd3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NzQ2NDYsImV4cCI6MjA3MjM1MDY0Nn0.E3uZFSDn10r_nxM6BS0WxMGXb73vrOEWoaW7n1BSnj0'
  }
})
.then(r => r.json())
.then(d => console.log('✓ Supabase conectado:', d))
.catch(e => console.error('❌ Erro:', e));
```

## 📋 CHECKLIST PÓS-CORREÇÃO
- [ ] Email authentication habilitado
- [ ] Email confirmation desabilitado (para desenvolvimento)
- [ ] Site URL configurado
- [ ] Aplicação recarregada
- [ ] Novo cadastro testado
- [ ] Console sem erros "Feature is disabled"

## 🚨 SE O PROBLEMA PERSISTIR

1. **Aguarde 1-2 minutos** após salvar no Supabase
2. **Limpe o cache do navegador** (Ctrl+F5)
3. **Verifique o console** para novos erros
4. **Teste em aba anônima/privada**

## 📞 SUPORTE ADICIONAL

Se mesmo assim não funcionar, verifique:
- Status do Supabase: https://status.supabase.com
- Logs no Supabase Dashboard → Authentication → Logs
- Erros específicos no console do navegador

---
**⏱️ Tempo estimado de correção: 2-3 minutos**