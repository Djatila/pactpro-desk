# Troubleshooting - Problemas de Autenticação

## Problema: "Verificando autenticação" demora muito para carregar

### Solução Rápida 🚀
**Se `maiacred.vercel.app` demora mas `maiacred.vercel.app/login` abre rápido:**

Isso foi corrigido! O problema estava no roteamento. Agora:
- ✅ **Rota `/`**: Redirecionamento inteligente e rápido
- ✅ **Cache Local**: Primeira verificação instantânea usando localStorage
- ✅ **Timeout Otimizado**: Verificação em background sem travar a interface

### Como Funciona Agora
1. **Acesso a `/`**: Verificação instantânea no localStorage
2. **Usuário Logado**: Redirecionamento imediato para `/dashboard`
3. **Usuário Não Logado**: Redirecionamento imediato para `/login`
4. **Verificação Supabase**: Acontece em background sem bloquear

### Possíveis Causas e Soluções

#### 1. **Variáveis de Ambiente não configuradas**
**Sintoma**: A aplicação fica carregando indefinidamente ou exibe avisos no console sobre Supabase não configurado.

**Solução**:
1. Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
```bash
cp .env.example .env
```

2. Configure as variáveis com os valores corretos do seu projeto Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

3. Reinicie o servidor de desenvolvimento:
```bash
npm run dev
```

#### 2. **Problemas de Conectividade com Supabase**
**Sintoma**: Timeout na verificação de autenticação, especialmente em conexões lentas.

**Melhorias Implementadas**:
- ✅ Timeout de 5 segundos para verificação de sessão
- ✅ Timeout de 3 segundos para carregamento de perfil
- ✅ Botão de recarregar página após 10 segundos de carregamento
- ✅ Indicadores visuais de status de conexão

**Ações Manuais**:
1. Verifique sua conexão com internet
2. Teste o acesso direto ao Supabase em: `https://seu-projeto.supabase.co`
3. Se necessário, clique em "Recarregar Página" que aparece após 10 segundos

#### 3. **Problemas com Tabela de Perfis**
**Sintoma**: Login funciona mas não carrega o perfil do usuário.

**Verificações**:
1. Confirme que a tabela `profiles` existe no Supabase
2. Verifique se o trigger para criação automática de perfil está funcionando
3. Verifique as permissões RLS (Row Level Security) da tabela

**SQL para verificar/criar a tabela**:
```sql
-- Verificar se a tabela existe
SELECT * FROM profiles LIMIT 1;

-- Se não existir, criar a tabela
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cargo TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);
```

#### 4. **Cache do Navegador**
**Sintoma**: Problemas persistem mesmo após correções.

**Solução**:
1. Limpe o cache do navegador (Ctrl+F5 ou Cmd+Shift+R)
2. Abra o Devtools → Application → Storage → Clear storage
3. Ou use navegação privada/incógnita para testar

### Monitoramento em Tempo Real

#### Console do Navegador (F12)
Observe estas mensagens:
- ✅ `"✓ Supabase configurado e conectado com sucesso"`
- ⚠️ `"⚠️ Supabase não configurado. Funcionando em modo offline"`
- ❌ `"Erro ao obter sessão"` ou `"Timeout na verificação de sessão"`

#### Indicadores Visuais
- 🔄 **Carregando**: Spinner com "Verificando autenticação..."
- ⚠️ **Problemas**: Banner amarelo com detalhes do erro
- 🔄 **Timeout**: Botão "Recarregar Página" após 10 segundos
- 📡 **Offline**: Ícone de WiFi desconectado

### Modo de Desenvolvimento vs Produção

#### Desenvolvimento Local
- Timeouts mais longos para debugging
- Logs detalhados no console
- Modo offline funcional para desenvolvimento sem Supabase

#### Produção (Vercel)
- Verifique se as variáveis de ambiente estão configuradas no Vercel
- Vá em: Vercel Dashboard → Seu Projeto → Settings → Environment Variables
- Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Faça um novo deploy após adicionar as variáveis

### Contato e Suporte

Se o problema persistir após seguir todos os passos:
1. Anote os erros específicos do console do navegador
2. Verifique o status do Supabase em: https://status.supabase.com
3. Entre em contato com a equipe de desenvolvimento com os logs detalhados