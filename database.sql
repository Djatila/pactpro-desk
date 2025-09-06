-- Script SQL para criar a estrutura do banco de dados MaiaCred no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

-- Habilitar Row Level Security (RLS) por padrão
-- Garantir que os dados são isolados por usuário

-- 1. Criar tabela de perfis de usuários (estende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL,
    endereco TEXT NOT NULL,
    data_nascimento TEXT NOT NULL,
    observacoes TEXT,
    status TEXT DEFAULT 'inativo' CHECK (status IN ('ativo', 'inativo')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de bancos
CREATE TABLE IF NOT EXISTS public.bancos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    codigo TEXT NOT NULL,
    taxa_media DECIMAL(5,2) NOT NULL,
    contato TEXT NOT NULL,
    telefone_contato TEXT NOT NULL,
    observacoes TEXT NOT NULL,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de contratos
CREATE TABLE IF NOT EXISTS public.contratos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
    banco_id UUID REFERENCES public.bancos(id) ON DELETE CASCADE NOT NULL,
    tipo_contrato TEXT NOT NULL,
    data_emprestimo TEXT NOT NULL,
    valor_total DECIMAL(15,2) NOT NULL,
    parcelas INTEGER NOT NULL,
    taxa DECIMAL(5,2) NOT NULL,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'finalizado')),
    observacoes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Novos campos adicionados
    primeiro_vencimento TEXT NOT NULL,
    valor_operacao DECIMAL(15,2) NOT NULL DEFAULT 0,
    valor_solicitado DECIMAL(15,2) NOT NULL DEFAULT 0,
    valor_prestacao DECIMAL(15,2) NOT NULL DEFAULT 0,
    -- Campo para armazenar informações do PDF
    pdf_url TEXT,
    pdf_name TEXT
);

-- 5. Criar tabela de configurações
CREATE TABLE IF NOT EXISTS public.configuracoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meta_anual DECIMAL(15,2) NOT NULL DEFAULT 180000,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas de segurança para clientes
CREATE POLICY "Users can view own clientes" ON public.clientes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clientes" ON public.clientes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clientes" ON public.clientes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clientes" ON public.clientes
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas de segurança para bancos
CREATE POLICY "Users can view own bancos" ON public.bancos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bancos" ON public.bancos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bancos" ON public.bancos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bancos" ON public.bancos
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas de segurança para contratos
CREATE POLICY "Users can view own contratos" ON public.contratos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contratos" ON public.contratos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contratos" ON public.contratos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contratos" ON public.contratos
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas de segurança para configurações
CREATE POLICY "Users can view own configuracoes" ON public.configuracoes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configuracoes" ON public.configuracoes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configuracoes" ON public.configuracoes
    FOR UPDATE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_bancos_updated_at
    BEFORE UPDATE ON public.bancos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_contratos_updated_at
    BEFORE UPDATE ON public.contratos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_configuracoes_updated_at
    BEFORE UPDATE ON public.configuracoes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Função para criar perfil automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, nome, cargo)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
        COALESCE(NEW.raw_user_meta_data->>'cargo', 'Usuário')
    );
    
    -- Criar configurações padrão
    INSERT INTO public.configuracoes (user_id, meta_anual)
    VALUES (NEW.id, 180000);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER trigger_new_user_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_bancos_user_id ON public.bancos(user_id);
CREATE INDEX IF NOT EXISTS idx_contratos_user_id ON public.contratos(user_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente_id ON public.contratos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_banco_id ON public.contratos(banco_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_user_id ON public.configuracoes(user_id);

-- Configuração do Storage para PDFs dos contratos
-- Execute estas instruções no SQL Editor do Supabase após criar as tabelas

/*
-- Criar bucket para armazenamento de PDFs
insert into storage.buckets (id, name, public)
values ('contratos-pdfs', 'contratos-pdfs', true);

-- Política para permitir upload de PDFs
create policy "Usuários podem fazer upload de PDFs"
on storage.objects for insert
to authenticated
with check (bucket_id = 'contratos-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Política para permitir leitura de PDFs
create policy "PDFs são publicamente acessíveis"
on storage.objects for select
to authenticated
with check (bucket_id = 'contratos-pdfs');

-- Política para permitir atualização de PDFs
create policy "Usuários podem atualizar seus PDFs"
on storage.objects for update
to authenticated
using (bucket_id = 'contratos-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Política para permitir exclusão de PDFs
create policy "Usuários podem excluir seus PDFs"
on storage.objects for delete
to authenticated
using (bucket_id = 'contratos-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
*/
