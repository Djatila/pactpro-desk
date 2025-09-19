import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '@/lib/database.types';

interface User {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  avatar?: string;
}

interface RegisterData {
  nome: string;
  email: string;
  password: string;
  cargo: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função auxiliar para adicionar timeout a uma Promise
  const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
    let timeoutId: NodeJS.Timeout;
    const timeout = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
  };

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Carregando perfil do usuário:', supabaseUser.id);
      
      // Tentar carregar perfil da tabela profiles
      const { data: profile, error: profileError } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', supabaseUser.id).single(),
        5000, // 5 segundos para carregar perfil da tabela
        'Timeout ao carregar perfil do usuário.'
      );

      if (!profileError && profile) {
        const completeUserData: User = {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          cargo: profile.cargo,
          avatar: profile.avatar_url || undefined
        };
        console.log('✅ Perfil completo carregado:', completeUserData);
        setUser(completeUserData);
        localStorage.setItem('maiacred_user', JSON.stringify(completeUserData));
      } else {
        console.warn('⚠️ Perfil da tabela não disponível, usando dados básicos:', profileError);
        // Fallback para usuário básico se o perfil não for encontrado
        const basicUser: User = {
          id: supabaseUser.id,
          nome: supabaseUser.user_metadata?.nome || supabaseUser.email?.split('@')[0] || 'Usuário',
          email: supabaseUser.email || '',
          cargo: supabaseUser.user_metadata?.cargo || 'Usuário',
          avatar: supabaseUser.user_metadata?.avatar_url || undefined
        };
        setUser(basicUser);
        localStorage.setItem('maiacred_user', JSON.stringify(basicUser));
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar perfil:', error.message);
      setError(error.message);
      // Em caso de erro, ainda tentar definir um usuário básico
      const basicUser: User = {
        id: supabaseUser.id,
        nome: supabaseUser.user_metadata?.nome || supabaseUser.email?.split('@')[0] || 'Usuário',
        email: supabaseUser.email || '',
        cargo: supabaseUser.user_metadata?.cargo || 'Usuário',
        avatar: supabaseUser.user_metadata?.avatar_url || undefined
      };
      setUser(basicUser);
      localStorage.setItem('maiacred_user', JSON.stringify(basicUser));
    }
  };

  useEffect(() => {
    let isMounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('🔄 Evento de autenticação Supabase:', event);
      setError(null); // Limpar erros de autenticação anteriores

      if (session) {
        console.log('✅ Sessão ativa detectada. Carregando perfil...');
        await loadUserProfile(session.user);
      } else {
        console.log('ℹ️ Nenhuma sessão ativa. Limpando usuário...');
        setUser(null);
        localStorage.removeItem('maiacred_user');
      }
      setIsLoading(false);
    });

    // Tentar carregar do localStorage na montagem inicial para evitar flash
    const storedUser = localStorage.getItem('maiacred_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsLoading(false);
        console.log('✅ Usuário restaurado do localStorage.');
      } catch (e) {
        console.warn('⚠️ Erro ao parsear usuário do localStorage, limpando:', e);
        localStorage.removeItem('maiacred_user');
      }
    } else {
      // Se não há usuário no localStorage, ainda precisamos verificar o Supabase
      // O onAuthStateChange já fará isso, mas podemos forçar uma verificação inicial
      // para garantir que o estado isLoading seja resolvido rapidamente.
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (isMounted && !session) {
          setIsLoading(false); // Se não há sessão, parar de carregar
        }
      }).catch(e => {
        console.error('Erro na verificação inicial de sessão:', e);
        if (isMounted) setIsLoading(false);
      });
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Tentando registrar usuário:', data.email);
      
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              nome: data.nome,
              cargo: data.cargo
            },
            emailRedirectTo: undefined // Desabilita redirecionamento por email
          }
        }),
        15000, // 15 segundos para registro
        'Timeout ao registrar usuário.'
      );

      console.log('Resposta do registro:', { authData, authError });

      if (authError) {
        console.error('Erro de autenticação:', authError);
        
        if (authError.message?.includes('disabled') || authError.message?.includes('Email logins')) {
          console.error('🚨 ERRO CRÍTICO: Autenticação por email está DESABILITADA no Supabase!');
          setError('CONFIGURAÇÃO NECESSÁRIA: A autenticação por email está desabilitada no Supabase. Verifique o console (F12) para instruções detalhadas.');
        } else if (authError.message?.includes('User already registered')) {
          console.warn('⚠️ Usuário já existe no sistema');
          setError('Este email já está cadastrado. Tente fazer login ou use um email diferente.');
        } else {
          setError(authError.message);
        }
        setIsLoading(false);
        return false;
      }

      if (authData.user) {
        console.log('Usuário criado:', authData.user);
        // O onAuthStateChange cuidará de carregar o perfil
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('Erro no registro:', error.message);
      setError(error.message || 'Erro inesperado durante o registro');
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Tentando fazer login com:', email);
      
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        }),
        15000, // 15 segundos para login
        'Timeout ao fazer login.'
      );

      console.log('Resposta do login:', { authData, authError });

      if (authError) {
        console.error('Erro de autenticação:', authError);
        
        let errorMessage = authError.message;
        
        switch (authError.message) {
          case 'Invalid login credentials':
            errorMessage = 'Email ou senha incorretos';
            break;
          case 'Email not confirmed':
            errorMessage = 'Email não confirmado. Você precisa confirmar o usuário no painel do Supabase: Authentication > Users > Confirmar usuário.';
            break;
          case 'Too many requests':
            errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
            break;
          case 'User not found':
            errorMessage = 'Usuário não encontrado';
            break;
          default:
            if (authError.message?.includes('disabled') || authError.message?.includes('Email logins')) {
              console.error('🚨 ERRO CRÍTICO: Autenticação por email está DESABILITADA no Supabase!');
              errorMessage = 'CONFIGURAÇÃO NECESSÁRIA: A autenticação por email está desabilitada no Supabase. Verifique o console (F12) para instruções detalhadas.';
            } else {
              errorMessage = `Erro de login: ${authError.message}`;
            }
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return false;
      }

      if (authData.user) {
        console.log('Login bem-sucedido. O onAuthStateChange cuidará de carregar o perfil.');
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('Erro no login:', error.message);
      setError(error.message || 'Erro inesperado durante o login');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Iniciando logout...');
      // Limpar estado e localStorage imediatamente para feedback rápido
      setUser(null);
      localStorage.removeItem('maiacred_user');
      
      // Tentar fazer logout no Supabase com timeout menor
      try {
        const { error } = await withTimeout(
          supabase.auth.signOut(),
          3000, // Timeout de apenas 3 segundos
          'Timeout no logout do Supabase.'
        );
        
        if (error) {
          console.warn('Aviso no logout do Supabase:', error.message);
        } else {
          console.log('✓ Logout do Supabase realizado com sucesso');
        }
      } catch (timeoutError: any) {
        console.warn('⚠️ Timeout no logout do Supabase, mas dados locais foram limpos:', timeoutError.message);
      }
      
    } catch (error: any) {
      console.error('Erro no logout:', error.message);
      setError('Logout realizado localmente. Pode haver problemas de conectividade.');
    } finally {
      setIsLoading(false);
      console.log('🔓 Logout finalizado - usuário desconectado');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}