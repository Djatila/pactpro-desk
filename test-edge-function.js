/**
 * Script de Teste da Edge Function MaiaCred Data Agent
 * 
 * Como usar:
 * 1. Obtenha seu token do Supabase:
 *    - Abra o DevTools (F12) no navegador
 *    - Execute: (await supabase.auth.getSession()).data.session.access_token
 *    - Copie o token
 * 
 * 2. Execute este script:
 *    node test-edge-function.js SEU_TOKEN_AQUI
 */

const EDGE_FUNCTION_URL = 'https://emvnudlonqoyfptrdwtd.supabase.co/functions/v1/maiacred-data-agent';

// Obter token da linha de comando
const token = process.argv[2];

if (!token) {
  console.error('❌ ERRO: Token não fornecido!');
  console.log('\n📋 Como obter o token:');
  console.log('1. Abra o DevTools (F12) no navegador');
  console.log('2. Vá para a aba Console');
  console.log('3. Execute: (await supabase.auth.getSession()).data.session.access_token');
  console.log('4. Copie o token');
  console.log('\n💡 Uso: node test-edge-function.js SEU_TOKEN_AQUI\n');
  process.exit(1);
}

// Função auxiliar para fazer requisições
async function testEdgeFunction(operation, params = {}) {
  console.log(`\n🧪 Testando operação: ${operation}`);
  console.log('📤 Parâmetros:', JSON.stringify(params, null, 2));
  
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ operation, ...params }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Erro ${response.status}:`, data);
      return null;
    }

    console.log('✅ Sucesso!');
    console.log('📥 Resposta:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return null;
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes da Edge Function MaiaCred Data Agent\n');
  console.log('=' .repeat(60));

  // Teste 1: Estatísticas de Contratos
  await testEdgeFunction('stats');

  // Teste 2: Top Bancos
  await testEdgeFunction('topBancos', { limit: 3 });

  // Teste 3: Query Simples - Listar Clientes
  await testEdgeFunction('query', { 
    tableName: 'clientes',
    filters: {}
  });

  // Teste 4: Query com Filtro - Contratos Ativos
  await testEdgeFunction('query', { 
    tableName: 'contratos',
    filters: { status: 'ativo' }
  });

  // Teste 5: Busca de Cliente (substitua "João" por um nome real)
  await testEdgeFunction('search', { 
    query: 'João'
  });

  // Teste 6: Contratos Vencendo
  await testEdgeFunction('contratosVencendo', { 
    meses: 3
  });

  // Teste 7: Progresso da Meta
  await testEdgeFunction('aggregate');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Testes concluídos!\n');
}

// Executar
runTests().catch(console.error);
