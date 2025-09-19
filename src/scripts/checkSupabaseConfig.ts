#!/usr/bin/env node

/**
 * Script para verificar a configuração do Supabase
 * 
 * Este script verifica se as variáveis de ambiente estão configuradas corretamente
 * e testa a conexão com o Supabase.
 */

import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Verificando configuração do Supabase...\n');

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas:');
  if (!supabaseUrl) console.error('   - VITE_SUPABASE_URL não definida');
  if (!supabaseKey) console.error('   - VITE_SUPABASE_ANON_KEY não definida');
  console.error('\n📝 Solução:');
  console.error('   1. Crie um arquivo .env na raiz do projeto');
  console.error('   2. Adicione as variáveis:');
  console.error('      VITE_SUPABASE_URL=sua_url_do_supabase');
  console.error('      VITE_SUPABASE_ANON_KEY=sua_chave_anonima');
  process.exit(1);
}

console.log('✅ Variáveis de ambiente configuradas');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 10)}...${supabaseKey.substring(supabaseKey.length - 10)}`);

// Criar cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Testar conexão
async function testConnection() {
  try {
    console.log('\n📡 Testando conexão com Supabase...');
    
    // Testar autenticação
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro na autenticação:', sessionError.message);
      return false;
    }
    
    console.log('✅ Autenticação funcionando');
    
    // Testar acesso ao banco de dados
    const { data: tablesData, error: tablesError } = await supabase
      .from('contratos')
      .select('id')
      .limit(1);
    
    if (tablesError && !tablesError.message.includes('_relation "contratos" does not exist_')) {
      console.error('❌ Erro ao acessar banco de dados:', tablesError.message);
      return false;
    }
    
    console.log('✅ Acesso ao banco de dados funcionando');
    
    // Testar storage (se configurado)
    try {
      const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.warn('⚠️  Erro ao acessar storage:', bucketsError.message);
      } else {
        console.log('✅ Serviço de storage acessível');
        if (bucketsData && bucketsData.length > 0) {
          console.log(`   Buckets encontrados: ${bucketsData.map(b => b.name).join(', ')}`);
        }
      }
    } catch (storageError) {
      console.warn('⚠️  Não foi possível testar o storage:', storageError);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return false;
  }
}

// Executar verificação
async function main() {
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('\n🎉 Configuração do Supabase está correta!');
    console.log('   O sistema deve funcionar normalmente.');
  } else {
    console.error('\n💥 Problemas encontrados na configuração.');
    console.error('   Verifique os erros acima e consulte a documentação.');
  }
}

main().catch(console.error);