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

  // Verificar sessão do usuário e carregar perfil
  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      try {
        // Verificar se o Supabase está configurado
        if (!supabase || typeof supabase.auth?.getSession !== 'function') {
          console.warn('⚠️ Supabase não configurado. Funcionando em modo offline.');
          setIsLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setError(error.message);
          return;
        }

        if (session?.user && isMounted) {
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        console.warn('Continuando em modo offline...');
        setError(null); // Não mostrar erro se for problema de configuração
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getSession();

    // Escutar mudanças na autenticação apenas se Supabase estiver configurado
    let subscription: any = null;
    
    try {
      if (supabase && typeof supabase.auth?.onAuthStateChange === 'function') {
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;

            if (event === 'SIGNED_IN' && session?.user) {
              await loadUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
            }
            
            setIsLoading(false);
          }
        );
        subscription = data.subscription;
      }
    } catch (error) {
      console.error('Erro ao configurar listener de autenticação:', error);
    }

    return () => {
      isMounted = false;
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Carregando perfil do usuário:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('Perfil carregado:', { profile, error });

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        
        // Se o perfil não existir, pode ser que o trigger não tenha funcionado
        if (error.code === 'PGRST116') { // No rows returned
          console.warn('Perfil não encontrado. Pode ser necessário criar manualmente.');
          setError('Perfil de usuário não encontrado. Entre em contato com o suporte.');
          return;
        }
        
        setError('Erro ao carregar perfil do usuário');
        return;
      }

      if (profile) {
        console.log('Definindo usuário no estado:', profile);
        setUser({
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          cargo: profile.cargo,
          avatar: profile.avatar_url || undefined
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setError('Erro ao carregar perfil do usuário');
    }
  };



  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Tentando registrar usuário:', data.email);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nome: data.nome,
            cargo: data.cargo
          },
          emailRedirectTo: undefined // Desabilita redirecionamento por email
        }
      });

      console.log('Resposta do registro:', { authData, authError });

      if (authError) {
        console.error('Erro de autenticação:', authError);
        setError(authError.message);
        setIsLoading(false);
        return false;
      }

      if (authData.user) {
        console.log('Usuário criado:', authData.user);
        
        // Verificar se o usuário foi confirmado automaticamente
        if (authData.user.email_confirmed_at) {
          console.log('Usuário confirmado automaticamente');
          await loadUserProfile(authData.user.id);
        } else {
          console.log('Usuário criado mas não confirmado. Fazendo login direto...');
          // Se não foi confirmado, mas existe, tentar fazer login direto
          // Isso é útil se a confirmação de email estiver desabilitada
          const loginResult = await login(data.email, data.password);
          if (loginResult) {
            setIsLoading(false);
            return true;
          }
        }
        
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Erro no registro:', error);
      setError('Erro inesperado durante o registro');
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Tentando fazer login com:', email);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      console.log('Resposta do login:', { authData, authError });

      if (authError) {
        console.error('Erro de autenticação:', authError);
        
        // Mensagens de erro mais específicas
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
            errorMessage = `Erro de login: ${authError.message}`;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return false;
      }

      if (authData.user) {
        console.log('Login bem-sucedido. Carregando perfil...');
        await loadUserProfile(authData.user.id);
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro inesperado durante o login');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro no logout:', error);
        setError(error.message);
      }
      
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
      setError('Erro inesperado durante o logout');
    } finally {
      setIsLoading(false);
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