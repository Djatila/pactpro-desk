# Sincronização de Tipos de Contrato entre Dispositivos

## Problema Identificado
Os tipos de contrato personalizados estavam sendo armazenados apenas no localStorage local de cada dispositivo, o que impedia a sincronização entre diferentes dispositivos.

## Solução Implementada
Criamos uma nova tabela no banco de dados Supabase para armazenar os tipos de contrato personalizados de cada usuário, permitindo que sejam sincronizados entre dispositivos.

## Estrutura da Nova Tabela

```sql
CREATE TABLE IF NOT EXISTS public.tipos_contrato (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    value TEXT NOT NULL,
    label TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Componentes Atualizados

1. **DataContext** - Adicionadas funções para gerenciar os tipos de contrato no banco de dados
2. **TipoContratoManagerModal** - Atualizado para usar o banco de dados em vez do localStorage
3. **ContratoFormModal** - Atualizado para carregar tipos de contrato do banco de dados
4. **database.types.ts** - Adicionados tipos TypeScript para a nova tabela

## Scripts de Migração

- `TIPOS_CONTRATO_MIGRATION.sql` - Script SQL para criar a tabela no Supabase

## Como Usar

1. Execute o script `TIPOS_CONTRATO_MIGRATION.sql` no SQL Editor do Supabase
2. Os tipos de contrato padrão serão automaticamente criados para usuários existentes
3. Novos tipos de contrato personalizados serão sincronizados entre dispositivos

## Benefícios

- Sincronização automática de tipos de contrato entre dispositivos
- Persistência segura no banco de dados
- Manutenção dos tipos padrão do sistema
- Interface de gerenciamento aprimorada