import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cliente mock para quando o Supabase não estiver configurado
const createMockClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase não configurado' } }),
    signUp: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase não configurado' } }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    select: () => ({
      order: () => Promise.resolve({ data: [], error: null }),
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } })
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } })
    }),
    upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } })
  })
});

// Verificar se as variáveis de ambiente estão configuradas
let supabase: any;

if (!supabaseUrl || !supabaseKey || supabaseUrl === '' || supabaseKey === '') {
  console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas.');
  console.warn('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
  console.warn('Funcionando em modo offline...');
  
  supabase = createMockClient();
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'x-application-name': 'maiacred-app'
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    
    // Teste básico de conectividade com timeout (sem await no top-level)
    const testConnectivity = () => {
      const connectivityTest = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout na conexão com Supabase'));
        }, 3000);
        
        supabase.auth.getSession().then(() => {
          clearTimeout(timeout);
          resolve(true);
        }).catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      connectivityTest
        .then(() => {
          console.log('✓ Supabase configurado e conectado com sucesso');
        })
        .catch((error) => {
          console.error('❌ ERRO CRÍTICO - Supabase:', error.message);
          
          // Detectar erros específicos e dar orientações
          if (error.message?.includes('disabled')) {
            console.error('🚨 SOLUÇÃO URGENTE: Autenticação por email está DESABILITADA no Supabase');
            console.error('📋 PASSOS:');
            console.error('   1. Acesse: https://supabase.com/dashboard');
            console.error('   2. Projeto: emvnudlonqoyfptrdwtd');
            console.error('   3. Authentication → Settings');
            console.error('   4. HABILITE: "Enable email provider"');
            console.error('   5. DESABILITE: "Confirm email" (para desenvolvimento)');
            console.error('   6. Site URL: http://localhost:8080');
          } else if (error.message?.includes('Timeout')) {
            console.warn('⚠️ Problema de conectividade com Supabase:', error.message);
          }
        });
    };
    
    // Executar teste de conectividade de forma assíncrona
    setTimeout(testConnectivity, 100);
    
    console.log('✓ Supabase cliente configurado');
  } catch (error) {
    console.error('Erro ao configurar/conectar Supabase:', error);
    console.warn('⚠️ Usando modo offline devido a problemas de conectividade');
    supabase = createMockClient();
  }
}

export { supabase };
export default supabase;