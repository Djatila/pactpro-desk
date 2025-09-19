# Configuração do Storage do Supabase para Upload de PDFs

Este documento descreve como configurar o bucket de storage no Supabase para permitir o upload de PDFs nos contratos.

## Passos para Configuração

### 1. Acessar o Painel do Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login com suas credenciais
3. Selecione o projeto `emvnudlonqoyfptrdwtd` (MaiaCred)

### 2. Criar o Bucket

1. No menu lateral, clique em **Storage**
2. Clique no botão **New bucket**
3. Preencha os seguintes dados:
   - **Name**: `contratos-pdfs`
   - **Public URLs**: Marque esta opção (necessário para permitir download dos PDFs)
4. Clique em **Create bucket**

### 3. Configurar Permissões do Bucket

1. Com o bucket `contratos-pdfs` selecionado, clique na aba **Policies**
2. Edite ou crie as seguintes políticas:

#### Política para Upload de Arquivos (Insert)
```sql
CREATE POLICY "Usuários podem fazer upload de PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contratos-pdfs');
```

#### Política para Leitura de Arquivos (Select)
```sql
CREATE POLICY "Usuários podem ler PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contratos-pdfs');
```

#### Política para Atualização de Arquivos (Update)
```sql
CREATE POLICY "Usuários podem atualizar PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'contratos-pdfs');
```

#### Política para Exclusão de Arquivos (Delete)
```sql
CREATE POLICY "Usuários podem excluir PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contratos-pdfs');
```

### 4. Verificar Configuração

1. Após criar o bucket e as políticas, tente fazer upload de um PDF no sistema
2. Verifique no console do navegador se há erros relacionados ao storage
3. Confirme que o PDF foi armazenado corretamente acessando a aba **Explorer** no Storage

## Problemas Comuns e Soluções

### "Bucket not found"
- Certifique-se de que o bucket foi criado com o nome exato `contratos-pdfs`
- Verifique se você está no projeto correto

### "Permission denied"
- Verifique se as políticas foram criadas corretamente
- Confirme que o usuário está autenticado ao tentar fazer upload

### "Public URL not accessible"
- Certifique-se de que a opção "Public URLs" foi marcada ao criar o bucket
- Verifique se a política de SELECT está configurada corretamente

## Teste de Funcionalidade

Após a configuração:
1. Acesse a página de contratos
2. Clique no ícone de edição de um contrato
3. Tente fazer upload de um PDF
4. Verifique se o PDF aparece na lista de contratos com o botão de download
5. Tente fazer o download do PDF para confirmar que está funcionando corretamente

## Suporte

Se continuar enfrentando problemas:
1. Verifique o console do navegador (F12) para mensagens de erro detalhadas
2. Confirme que as variáveis de ambiente estão configuradas corretamente no arquivo `.env`
3. Verifique a conexão com a internet