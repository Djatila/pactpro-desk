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
      }
    });
    console.log('✓ Supabase configurado com sucesso');
  } catch (error) {
    console.error('Erro ao configurar Supabase:', error);
    supabase = createMockClient();
  }
}

export { supabase };
export default supabase;