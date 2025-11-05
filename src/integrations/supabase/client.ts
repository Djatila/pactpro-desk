import { createClient } from '@supabase/supabase-js';

// Usar variáveis de ambiente ou valores de fallback do contexto
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://emvnudlonqoyfptrdwtd.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdm51ZGxvbnFveWZwdHJkd3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NzQ2NDYsImV4cCI6MjA3MjM1MDY0Nn0.E3uZFSDn10r_nxM6BS0WxMGXb73vrOEWoaW7n1BSnj0';

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

// Se estiver usando os fallbacks, o cliente será inicializado
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
    
    console.log('✓ Supabase cliente configurado e pronto');
  } catch (error) {
    console.error('Erro ao configurar/conectar Supabase:', error);
    console.warn('⚠️ Usando modo offline devido a problemas de conectividade');
    supabaseClient = createMockClient();
  }
}

// Expor o cliente Supabase globalmente
if (typeof window !== 'undefined') {
  (window as any).maiacredSupabaseClient = supabaseClient;
}

export { supabaseClient };
export default supabaseClient;