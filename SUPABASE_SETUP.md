# Guia de Configuração do Supabase - MaiaCred

Este guia explica como configurar o projeto MaiaCred para usar o Supabase como backend.

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Node.js instalado
- Projeto MaiaCred clonado

## 🚀 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em "New project"
3. Escolha sua organização
4. Defina o nome do projeto: `maiacred`
5. Crie uma senha forte para o banco de dados
6. Escolha a região mais próxima (ex: São Paulo)
7. Clique em "Create new project"

### 2. Configurar Banco de Dados

1. No dashboard do projeto, vá para `SQL Editor`
2. Copie todo o conteúdo do arquivo `database.sql` (na raiz do projeto)
3. Cole no SQL Editor e clique em "Run"
4. Aguarde a execução do script (pode levar alguns segundos)

### 3. Configurar Variáveis de Ambiente

1. No dashboard do Supabase, vá para `Settings > API`
2. Copie a `Project URL` e a `anon public` key
3. No projeto MaiaCred, abra o arquivo `.env`
4. Configure as variáveis:

```bash
VITE_SUPABASE_URL=sua_project_url_aqui
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 4. Testar a Configuração

Execute o projeto:

```bash
npm run dev
```

Agora você pode:
- Criar uma conta de usuário
- Fazer login
- Cadastrar clientes, bancos e contratos
- Todos os dados serão salvos no Supabase

## 🔒 Segurança

O projeto está configurado com:
- **Row Level Security (RLS)**: Cada usuário vê apenas seus próprios dados
- **Autenticação JWT**: Tokens seguros para autenticação
- **Políticas de acesso**: Controle granular de permissões

## 📊 Estrutura do Banco

O banco contém as seguintes tabelas:

- `profiles`: Perfis dos usuários
- `clientes`: Dados dos clientes
- `bancos`: Informações dos bancos
- `contratos`: Contratos de crédito
- `configuracoes`: Configurações do usuário (meta anual)

## 🛠️ Funcionalidades Implementadas

✅ **Autenticação**
- Registro de usuários
- Login/logout
- Gerenciamento de sessão

✅ **Dados Isolados por Usuário**
- Cada usuário vê apenas seus dados
- Não há vazamento de informações entre usuários

✅ **CRUD Completo**
- Criar, ler, atualizar e deletar clientes
- Criar, ler, atualizar e deletar bancos
- Criar, ler, atualizar e deletar contratos
- Configurar meta anual

✅ **Sincronização Automática**
- Dados atualizados em tempo real
- Cache local otimizado

## 🔧 Solução de Problemas

### Erro de Conexão
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o projeto Supabase está ativo

### Erro de Permissão
- Verifique se o script SQL foi executado corretamente
- Confirme se as políticas RLS estão ativas

### Dados não Aparecem
- Verifique se o usuário está logado
- Confirme se os dados pertencem ao usuário atual

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador para erros
2. Confirme a configuração das variáveis de ambiente
3. Teste a conexão com o Supabase no dashboard

## 🔄 Migração de Dados Locais

Se você tinha dados salvos localmente:
1. Os dados locais serão preservados até fazer login
2. Após login, apenas dados do Supabase serão exibidos
3. Para migrar dados locais, será necessário recadastrá-los

---

**Pronto!** Seu projeto MaiaCred agora está conectado ao Supabase e pronto para produção. 🎉