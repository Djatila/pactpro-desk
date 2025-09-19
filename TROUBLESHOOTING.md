# Guia de Solução de Problemas - MaiaCred

Este documento contém soluções para problemas comuns que podem ocorrer no sistema MaiaCred.

## Problemas com Upload de PDF

### Erro: "Erro ao anexar PDF. Tente novamente."

**Causas possíveis:**
1. Bucket "contratos-pdfs" não configurado no Supabase
2. Permissões de acesso ao bucket não configuradas
3. Problemas de conectividade com o serviço de storage
4. Arquivo PDF muito grande (limite de 10MB)
5. Formato de arquivo inválido

**Soluções:**
1. Verifique se o bucket "contratos-pdfs" existe no painel do Supabase
2. Siga as instruções em [SUPABASE_STORAGE_SETUP.md](./SUPABASE_STORAGE_SETUP.md) para configurar o storage
3. Verifique as políticas de acesso ao bucket
4. Tente com um arquivo PDF menor
5. Confirme que o arquivo é um PDF válido

### Erro: "Bucket not found"

**Solução:**
1. Acesse o painel do Supabase
2. Vá para Storage > Buckets
3. Crie um novo bucket com o nome "contratos-pdfs"
4. Habilite "Public URLs" para permitir download
5. Configure as políticas de acesso conforme instruções

## Problemas de Conectividade

### Erro: "Timeout na verificação de sessão"

**Causas possíveis:**
1. Conexão lenta com os servidores do Supabase
2. Problemas de rede local
3. Configuração incorreta do Supabase

**Soluções:**
1. Verifique sua conexão com a internet
2. Tente recarregar a página (Ctrl+F5)
3. Feche outras abas que possam estar consumindo banda
4. Verifique as variáveis de ambiente no arquivo .env
5. Confirme que o projeto Supabase está ativo

### Erro: "Supabase não configurado"

**Solução:**
1. Verifique se o arquivo .env existe na raiz do projeto
2. Confirme que as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas
3. Verifique se os valores estão corretos no painel do Supabase
4. Reinicie o servidor de desenvolvimento

## Problemas com Autenticação

### Erro: "Email ou senha incorretos"

**Soluções:**
1. Verifique se o email e senha estão corretos
2. Confirme que o usuário está cadastrado
3. Verifique se o provedor de email está habilitado no Supabase

### Erro: "Email não confirmado"

**Solução:**
1. Acesse o painel do Supabase
2. Vá para Authentication > Users
3. Encontre o usuário e marque como confirmado
4. Ou desabilite "Confirm email" nas configurações de autenticação

## Problemas com Contratos

### Contrato não aparece na lista

**Causas possíveis:**
1. Problemas de sincronização com o banco de dados
2. Filtros aplicados na lista
3. Problemas de permissão

**Soluções:**
1. Tente atualizar a página
2. Verifique os filtros aplicados
3. Confirme que o usuário tem permissão para acessar o contrato

### Erro ao salvar contrato

**Causas possíveis:**
1. Campos obrigatórios não preenchidos
2. Problemas de conectividade
3. Erros de validação

**Soluções:**
1. Verifique se todos os campos obrigatórios estão preenchidos
2. Confirme sua conexão com a internet
3. Verifique mensagens de erro específicas no console (F12)

## Problemas com Clientes

### Cliente não aparece na lista de contratos

**Solução:**
1. Verifique o status do cliente (deve estar "ativo")
2. Confirme que o cliente foi cadastrado corretamente
3. Tente atualizar a página

## Problemas com Bancos

### Status do banco oscilando

**Solução:**
1. Verifique se há contratos associados ao banco
2. Bancos sem contratos devem ficar inativos automaticamente
3. Bancos com contratos ativos devem ficar ativos

## Suporte Adicional

Se os problemas persistirem:

1. Verifique o console do navegador (F12) para mensagens de erro detalhadas
2. Confirme que todas as dependências estão instaladas corretamente
3. Verifique o status dos serviços do Supabase
4. Consulte a documentação oficial do Supabase para problemas específicos