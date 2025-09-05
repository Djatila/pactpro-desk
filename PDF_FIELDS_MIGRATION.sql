-- Script para adicionar campos de PDF à tabela de contratos
-- Este script deve ser executado no painel do Supabase em SQL Editor

-- Adicionar colunas para armazenar informações do PDF
ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS pdf_name TEXT;

-- Verificar se as colunas foram adicionadas corretamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contratos' 
AND column_name IN ('pdf_url', 'pdf_name');

-- Atualizar permissões para as novas colunas
-- Certifique-se de que as políticas RLS existentes cobrem essas novas colunas
-- Se necessário, atualize as políticas existentes ou crie novas

-- Exemplo de política que permite acesso a todas as colunas da tabela contratos
-- Substitua "authenticated" pelo papel apropriado se necessário
CREATE POLICY "Usuários podem acessar todos os dados dos contratos"
ON contratos FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Garantir que a política está habilitada
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;