// ============================================
// EDGE FUNCTION COMPLETA - COPIE E COLE NO SUPABASE DASHBOARD
// ============================================
// URL: https://supabase.com/dashboard/project/emvnudlonqoyfptrdwtd/functions
// Clique em "maiacred-data-agent" e substitua TODO o código
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Headers CORS necessários para chamadas do frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Tipos de operação suportadas
type OperationType = 'query' | 'aggregate' | 'stats' | 'search' | 'topBancos' | 'contratosVencendo' | 'dashboardSummary';

// Inicializa o cliente Supabase com a chave Service Role (acesso total)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Função para extrair o user_id do token JWT
async function getUserIdFromAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("DEBUG: Authorization header missing or invalid format.");
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    console.error("DEBUG: Erro ao verificar token:", error?.message || 'Usuário não encontrado/token inválido');
    return null;
  }
  console.log(`DEBUG: User ID extraído com sucesso: ${data.user.id}`);
  return data.user.id;
}

// Função principal para consultar o banco de dados (query simples)
async function queryDatabase(userId: string, tableName: string, filters: Record<string, any> = {}) {
  console.log(`DEBUG: Consultando tabela: ${tableName} para user: ${userId}`);
  
  let selectColumns = '*';
  
  // Adicionar JOINs para contratos
  if (tableName === 'contratos') {
    selectColumns = '*, clientes(nome, cpf, telefone, email), bancos(nome, codigo, taxa_media)';
  }
  
  let query = supabaseAdmin.from(tableName).select(selectColumns);
  
  // Aplicar filtro obrigatório de RLS (segurança)
  if (tableName !== 'profiles') {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('id', userId);
  }
  
  // Aplicar filtros adicionais (se houver)
  for (const key in filters) {
    if (filters[key] !== undefined) {
      query = query.eq(key, filters[key]);
    }
  }
  
  query = query.limit(100); 

  const { data, error } = await query;

  if (error) {
    console.error(`DEBUG: Erro na consulta SQL para ${tableName}:`, error);
    return { error: error.message };
  }
  
  console.log(`DEBUG: Consulta bem-sucedida para ${tableName}. Resultados: ${data?.length}`);
  return { data };
}

// Função para obter estatísticas de contratos
async function getContratosStats(userId: string) {
  console.log(`DEBUG: Obtendo estatísticas de contratos para user: ${userId}`);
  
  const { data, error } = await supabaseAdmin
    .from('contratos')
    .select('status, valor_total, taxa, parcelas')
    .eq('user_id', userId);

  if (error) {
    console.error('DEBUG: Erro ao obter estatísticas:', error);
    return { error: error.message };
  }

  const stats = {
    total: data.length,
    ativos: data.filter(c => c.status === 'ativo').length,
    pendentes: data.filter(c => c.status === 'pendente').length,
    finalizados: data.filter(c => c.status === 'finalizado').length,
    valorTotal: data.reduce((sum, c) => sum + c.valor_total, 0),
    receitaTotal: data.reduce((sum, c) => sum + (c.valor_total * c.taxa / 100), 0),
    totalParcelas: data.reduce((sum, c) => sum + c.parcelas, 0),
  };

  console.log('DEBUG: Estatísticas calculadas:', stats);
  return { data: stats };
}

// Função para obter top bancos por volume
async function getTopBancos(userId: string, limit: number = 5) {
  console.log(`DEBUG: Obtendo top ${limit} bancos para user: ${userId}`);
  
  const { data: contratos, error } = await supabaseAdmin
    .from('contratos')
    .select('banco_id, valor_total, bancos(nome, codigo)')
    .eq('user_id', userId);

  if (error) {
    console.error('DEBUG: Erro ao obter top bancos:', error);
    return { error: error.message };
  }

  // Agrupar por banco
  const bancoStats: Record<string, any> = {};
  
  contratos.forEach(c => {
    if (!bancoStats[c.banco_id]) {
      bancoStats[c.banco_id] = {
        banco_id: c.banco_id,
        nome: (c.bancos as any)?.nome || 'Banco não encontrado',
        codigo: (c.bancos as any)?.codigo || '',
        totalContratos: 0,
        volumeTotal: 0,
      };
    }
    bancoStats[c.banco_id].totalContratos++;
    bancoStats[c.banco_id].volumeTotal += c.valor_total;
  });

  // Ordenar por volume e limitar
  const topBancos = Object.values(bancoStats)
    .sort((a: any, b: any) => b.volumeTotal - a.volumeTotal)
    .slice(0, limit);

  console.log(`DEBUG: Top bancos calculados: ${topBancos.length}`);
  return { data: topBancos };
}

// Função para buscar clientes por nome ou CPF
async function searchCliente(userId: string, query: string) {
  console.log(`DEBUG: Buscando cliente com query: "${query}" para user: ${userId}`);
  
  const { data, error } = await supabaseAdmin
    .from('clientes')
    .select('*')
    .eq('user_id', userId)
    .or(`nome.ilike.%${query}%,cpf.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error('DEBUG: Erro na busca de cliente:', error);
    return { error: error.message };
  }

  console.log(`DEBUG: Clientes encontrados: ${data.length}`);
  return { data };
}

// Função para obter contratos próximos do vencimento
async function getContratosVencendo(userId: string, meses: number = 3) {
  console.log(`DEBUG: Obtendo contratos vencendo em ${meses} meses para user: ${userId}`);
  
  const { data: contratos, error } = await supabaseAdmin
    .from('contratos')
    .select('*, clientes(nome), bancos(nome)')
    .eq('user_id', userId)
    .eq('status', 'ativo');

  if (error) {
    console.error('DEBUG: Erro ao obter contratos:', error);
    return { error: error.message };
  }

  // Calcular contratos próximos do vencimento
  const hoje = new Date();
  const contratosVencendo = contratos.filter(c => {
    try {
      const [day, month, year] = c.data_emprestimo.split('/');
      const dataInicio = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const diffYears = hoje.getFullYear() - dataInicio.getFullYear();
      const diffMonths = hoje.getMonth() - dataInicio.getMonth();
      const totalMonthsPassed = diffYears * 12 + diffMonths;
      
      const mesesRestantes = c.parcelas - totalMonthsPassed;
      
      return mesesRestantes > 0 && mesesRestantes <= meses;
    } catch (e) {
      return false;
    }
  });

  console.log(`DEBUG: Contratos vencendo: ${contratosVencendo.length}`);
  return { data: contratosVencendo };
}

// Função para obter meta anual e progresso
async function getMetaProgress(userId: string) {
  console.log(`DEBUG: Obtendo progresso da meta para user: ${userId}`);
  
  const { data: config, error: configError } = await supabaseAdmin
    .from('configuracoes')
    .select('meta_anual')
    .eq('user_id', userId)
    .single();

  if (configError) {
    console.error('DEBUG: Erro ao obter configuração:', configError);
    return { error: configError.message };
  }

  const { data: contratos, error: contratosError } = await supabaseAdmin
    .from('contratos')
    .select('valor_total, taxa, status')
    .eq('user_id', userId)
    .in('status', ['ativo', 'finalizado']);

  if (contratosError) {
    console.error('DEBUG: Erro ao obter contratos:', contratosError);
    return { error: contratosError.message };
  }

  const receitaAtual = contratos.reduce((sum, c) => sum + (c.valor_total * c.taxa / 100), 0);
  const metaAnual = config.meta_anual;
  const percentual = (receitaAtual / metaAnual) * 100;
  const faltante = metaAnual - receitaAtual;

  const resultado = {
    metaAnual,
    receitaAtual,
    percentual: Math.round(percentual * 100) / 100,
    faltante: Math.max(0, faltante),
    atingida: receitaAtual >= metaAnual,
  };

  console.log('DEBUG: Progresso da meta:', resultado);
  return { data: resultado };
}

// Função para obter resumo completo do dashboard
async function getDashboardSummary(userId: string) {
  console.log(`DEBUG: Obtendo resumo do dashboard para user: ${userId}`);
  
  try {
    // Buscar total de clientes
    const { data: clientes, error: clientesError } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('user_id', userId);
    
    if (clientesError) throw clientesError;
    
    // Buscar estatísticas de contratos
    const statsResult = await getContratosStats(userId);
    if (statsResult.error) throw new Error(statsResult.error);
    
    // Buscar top 3 bancos
    const topBancosResult = await getTopBancos(userId, 3);
    if (topBancosResult.error) throw new Error(topBancosResult.error);
    
    // Buscar progresso da meta
    const metaResult = await getMetaProgress(userId);
    if (metaResult.error) throw new Error(metaResult.error);
    
    const resumo = {
      totalClientes: clientes.length,
      contratos: statsResult.data,
      topBancos: topBancosResult.data,
      meta: metaResult.data,
    };
    
    console.log('DEBUG: Resumo do dashboard:', resumo);
    return { data: resumo };
  } catch (error) {
    console.error('DEBUG: Erro ao obter resumo do dashboard:', error);
    return { error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await getUserIdFromAuth(req);
    
    if (!userId) {
      console.error("DEBUG: Requisição não autorizada - userId nulo.");
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or missing token' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const body = await req.json();
    const { operation = 'query', tableName, filters, query, limit, meses } = body;

    console.log(`DEBUG: Operação solicitada: ${operation}`);

    let result;

    switch (operation as OperationType) {
      case 'query':
        if (!tableName) {
          return new Response(JSON.stringify({ error: 'Missing tableName parameter for query operation' }), {
            status: 400,
            headers: corsHeaders,
          });
        }
        
        const allowedTables = ['clientes', 'bancos', 'contratos', 'configuracoes', 'tipos_contrato', 'profiles'];
        if (!allowedTables.includes(tableName)) {
          return new Response(JSON.stringify({ error: 'Access denied to this table' }), {
            status: 403,
            headers: corsHeaders,
          });
        }
        
        result = await queryDatabase(userId, tableName, filters);
        break;

      case 'stats':
        result = await getContratosStats(userId);
        break;

      case 'topBancos':
        result = await getTopBancos(userId, limit || 5);
        break;

      case 'search':
        if (!query) {
          return new Response(JSON.stringify({ error: 'Missing query parameter for search operation' }), {
            status: 400,
            headers: corsHeaders,
          });
        }
        result = await searchCliente(userId, query);
        break;

      case 'contratosVencendo':
        result = await getContratosVencendo(userId, meses || 3);
        break;

      case 'aggregate':
        result = await getMetaProgress(userId);
        break;

      case 'dashboardSummary':
        result = await getDashboardSummary(userId);
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown operation: ${operation}` }), {
          status: 400,
          headers: corsHeaders,
        });
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error("Erro geral na Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
