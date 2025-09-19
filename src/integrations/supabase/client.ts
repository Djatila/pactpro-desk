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
    onAuthStateChange: (callback: any) => {
      // Simula um evento inicial para evitar bloqueio
      setTimeout(() => callback('SIGNED_OUT', null), 100);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    getUser: () => Promise.resolve({ data: { user: null }, error: null })
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
  }),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ error: { message: 'Storage não configurado' } }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      list: () => Promise.resolve({ data: [], error: null })
    })
  }
});

// Verificar se as variáveis de ambiente estão configuradas
let supabaseClient: any;

if (!supabaseUrl || !supabaseKey || supabaseUrl === '' || supabaseKey === '') {
  console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas.');
  console.warn('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
  console.warn('Funcionando em modo offline...');
  
  supabaseClient = createMockClient();
} else {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
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
          eventsPerSecond: 5 // Reduzir para conexões mais lentas
        }
      }
    });
    
    // Teste básico de conectividade com timeout melhorado
    const testConnectivity = async () => {
      try {
        const timeout = setTimeout(() => {
          throw new Error('Timeout na conexão com Supabase');
        }, 10000); // Aumentado de 8s para 10s
        
        let attempt = 0;
        const maxAttempts = 3;
        let success = false;
        
        while (attempt < maxAttempts && !success) {
          try {
            await supabaseClient.auth.getSession();
            clearTimeout(timeout);
            success = true;
            console.log('✓ Supabase configurado e conectado com sucesso');
          } catch (error) {
            attempt++;
            console.warn(`Tentativa de conexão ${attempt} falhou:`, error);
            if (attempt < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            } else {
              clearTimeout(timeout);
              throw error;
            }
          }
        }
      } catch (error: any) {
        console.error('❌ ERRO CRÍTICO - Supabase:', error.message);
        
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
          console.warn('⚠️ Problema de conectividade com Supabase - PC pode ter conexão mais lenta');
          console.warn('💡 Sugestões:');
          console.warn('   1. Verifique sua conexão com a internet');
          console.warn('   2. Tente recarregar a página (Ctrl+F5)');
          console.warn('   3. Use uma rede com melhor conectividade');
          console.warn('   4. Aplicação funcionará em modo offline se necessário');
        }
      }
    };
    
    setTimeout(() => {
      testConnectivity().catch(console.error);
    }, 100);
    
    console.log('✓ Supabase cliente configurado');
  } catch (error) {
    console.error('Erro ao configurar/conectar Supabase:', error);
    console.warn('⚠️ Usando modo offline devido a problemas de conectividade');
    supabaseClient = createMockClient();
  }
}

export { supabaseClient };
export default supabaseClient;