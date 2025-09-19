-- Script simplificado para criar a tabela tipos_contrato
-- Este script deve ser executado no painel do Supabase em SQL Editor

-- Criar tabela para tipos de contrato personalizados
CREATE TABLE IF NOT EXISTS public.tipos_contrato (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    value TEXT NOT NULL,
    label TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tipos_contrato_user_id ON public.tipos_contrato(user_id);
CREATE INDEX IF NOT EXISTS idx_tipos_contrato_value ON public.tipos_contrato(value);

-- Não inserimos tipos de contrato padrão aqui, pois eles serão criados 
-- automaticamente quando o usuário carregar os tipos pela primeira vez
