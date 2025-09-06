// Script para verificar se a tabela tipos_contrato existe e criá-la se necessário
import { createClient } from '@supabase/supabase-js';

// Substitua pelas suas credenciais do Supabase
const supabaseUrl = 'https://emvnudlonqoyfptrdwtd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdm51ZGxvbnFveWZwdHJkd3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU3MDg4MjksImV4cCI6MjAzMTI4NDgyOX0.0fZ8NqZB2JF8J3w5w5J5J5J5J5J5J5J5J5J5J5J5J5J';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarETabelaTiposContrato() {
  try {
    // Verificar se a tabela existe
    const { data, error } = await supabase
      .from('tipos_contrato')
      .select('count')
      .limit(1);

    if (error) {
      console.log('Tabela tipos_contrato não encontrada. Criando tabela...');
      console.log('Por favor, execute o script TIPOS_CONTRATO_MIGRATION.sql no Supabase SQL Editor');
      return false;
    }

    console.log('Tabela tipos_contrato encontrada com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao verificar tabela:', error.message);
    return false;
  }
}

verificarETabelaTiposContrato().then(existe => {
  if (!existe) {
    console.log('Por favor, crie a tabela tipos_contrato executando o script TIPOS_CONTRATO_MIGRATION.sql');
  }
});