-- Script para adicionar tabela de tipos de contrato personalizados
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

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.tipos_contrato ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para tipos_contrato
CREATE POLICY "Users can view own tipos_contrato" ON public.tipos_contrato
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tipos_contrato" ON public.tipos_contrato
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tipos_contrato" ON public.tipos_contrato
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tipos_contrato" ON public.tipos_contrato
    FOR DELETE USING (auth.uid() = user_id);

-- Inserir tipos de contrato padrão para usuários existentes
-- (Esta parte seria executada uma única vez para popular dados iniciais)
/*
INSERT INTO public.tipos_contrato (user_id, value, label, is_default)
SELECT DISTINCT p.id, 'consignado-previdencia', 'Consignado Previdência', true
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.tipos_contrato tc 
    WHERE tc.user_id = p.id AND tc.value = 'consignado-previdencia'
);

INSERT INTO public.tipos_contrato (user_id, value, label, is_default)
SELECT DISTINCT p.id, 'consignado-clt', 'Consignado CLT', true
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.tipos_contrato tc 
    WHERE tc.user_id = p.id AND tc.value = 'consignado-clt'
);

INSERT INTO public.tipos_contrato (user_id, value, label, is_default)
SELECT DISTINCT p.id, 'emprestimo-pessoal', 'Empréstimo Pessoal', true
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.tipos_contrato tc 
    WHERE tc.user_id = p.id AND tc.value = 'emprestimo-pessoal'
);

INSERT INTO public.tipos_contrato (user_id, value, label, is_default)
SELECT DISTINCT p.id, 'fgts', 'FGTS', true
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.tipos_contrato tc 
    WHERE tc.user_id = p.id AND tc.value = 'fgts'
);

INSERT INTO public.tipos_contrato (user_id, value, label, is_default)
SELECT DISTINCT p.id, 'emp-bolsa-familia', 'Emp. Bolsa Família', true
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.tipos_contrato tc 
    WHERE tc.user_id = p.id AND tc.value = 'emp-bolsa-familia'
);

INSERT INTO public.tipos_contrato (user_id, value, label, is_default)
SELECT DISTINCT p.id, 'emp-conta-energia', 'Emp. Conta de Energia', true
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.tipos_contrato tc 
    WHERE tc.user_id = p.id AND tc.value = 'emp-conta-energia'
);

INSERT INTO public.tipos_contrato (user_id, value, label, is_default)
SELECT DISTINCT p.id, 'emp-bpc-loas', 'Emp. BPC LOAS', true
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.tipos_contrato tc 
    WHERE tc.user_id = p.id AND tc.value = 'emp-bpc-loas'
);
*/

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_tipos_contrato_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER trigger_tipos_contrato_updated_at
    BEFORE UPDATE ON public.tipos_contrato
    FOR EACH ROW EXECUTE FUNCTION public.handle_tipos_contrato_updated_at();