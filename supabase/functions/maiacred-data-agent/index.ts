import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Headers CORS necessários para chamadas do frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Inicializa o cliente Supabase com a chave Service Role (acesso total)
// A chave SERVICE_ROLE_KEY é injetada automaticamente pelo ambiente Supabase
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
  
  // Usar o cliente admin para verificar o token
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    console.error("DEBUG: Erro ao verificar token:", error?.message);
    return null;
  }
  console.log(`DEBUG: User ID extraído com sucesso: ${data.user.id}`);
  return data.user.id;
}

// Função principal para consultar o banco de dados
async function queryDatabase(userId: string, tableName: string, filters: Record<string, any> = {}) {
  console.log(`Consultando tabela: ${tableName} para user: ${userId}`);
  
  // Simplificando a seleção para '*' para evitar erros de sintaxe na lista de colunas
  let selectColumns = '*';
  
  let query = supabaseAdmin.from(tableName).select(selectColumns);
  
  // Aplicar filtro obrigatório de RLS (segurança)
  query = query.eq('user_id', userId);
  
  // Aplicar filtros adicionais (se houver)
  for (const key in filters) {
    if (filters[key] !== undefined) {
      query = query.eq(key, filters[key]);
    }
  }
  
  // Aumentar o limite para 100 resultados
  query = query.limit(100); 

  const { data, error } = await query;

  if (error) {
    console.error(`Erro na consulta SQL para ${tableName}:`, error);
    return { error: error.message };
  }
  
  return { data };
}

serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS preflight)
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

    const { tableName, filters } = await req.json();

    if (!tableName) {
      return new Response(JSON.stringify({ error: 'Missing tableName parameter' }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    
    // Lista de tabelas permitidas para consulta pelo chatbot
    const allowedTables = ['clientes', 'bancos', 'contratos', 'configuracoes', 'tipos_contrato'];
    if (!allowedTables.includes(tableName)) {
        return new Response(JSON.stringify({ error: 'Access denied to this table' }), {
            status: 403,
            headers: corsHeaders,
        });
    }

    const result = await queryDatabase(userId, tableName, filters);

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